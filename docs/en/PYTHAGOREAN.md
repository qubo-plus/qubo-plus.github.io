---
last_modified: 2026-10-10
layout: default
nav_exclude: true
title: "Pythagorean Triples"
nav_order: 1
lang: en
hreflang_alt: "ja/PYTHAGOREAN"
hreflang_lang: "ja"
---

# Pythagorean Triples

Three integers $x$, $y$, and $z$ are **Pythagorean triples** if they satisfy

$$
\begin{aligned}
x^2+y^2&=z^2
\end{aligned}
$$

To avoid duplicates, we assume $x<y$.

## QUBO++ program for listing Pythagorean Triples
The following program lists Pythagorean triples with $x\leq 16$, $y\leq 16$, and $z\leq 16$:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto x = 1 <= qbpp::int_var("x") <= 16;
  auto y = 1 <= qbpp::int_var("y") <= 16;
  auto z = 1 <= qbpp::int_var("z") <= 16;
  auto f = x * x + y * y - z * z;
  auto c = y - x;
  auto g = qbpp::cons(f == 0) + qbpp::cons(c >= 1);
  g.simplify_as_binary();
  auto solver = qbpp::ExhaustiveSolver(g);
  auto sols = solver.search({{"best_energy_sols", 0}});
  for (const auto& sol : sols) {
    std::cout << "x=" << sol(x) << ", y=" << sol(y) << ", z=" << sol(z)
              << ", f=" << sol(f) << ", c=" << sol(c) << std::endl;
  }
}
```
{% endraw %}
In this program, we define [native integer variables](NATIVE_INTEGER) `x`, `y`, and `z` with ranges from 1 to 16.
We then create two expressions:
- `f` for $x^2+y^2-z^2$, and
- `c` for $y-x$.

The equality $f=0$ and the inequality $c\geq 1$ (that is, $x+1\leq y$) are declared as constraints with [`qbpp::cons()`](CONSTRAINTS) and combined into `g`.
The expression `g` attains its minimum value 0 when all constraints are satisfied.

An Exhaustive Solver object `solver` is created for `g`, and passing `"best_energy_sols"` set to `0` to `search()` returns all solutions that share the best (lowest) energy (`0` = unlimited).
Because `x`, `y`, and `z` are handled as integers, the same triple is never returned more than once.
The returned `sols` can be printed using a range-based for loop.

This program produces the following output:
```
x=3, y=4, z=5, f=0, c=1
x=5, y=12, z=13, f=0, c=7
x=6, y=8, z=10, f=0, c=2
x=9, y=12, z=15, f=0, c=3
```

## Searching larger ranges

Because the equality $x^2+y^2-z^2=0$ and the inequality $x+1\leq y$ are declared
as **constraints** with `qbpp::cons()`, the bundled solvers search for an assignment that
satisfies the constraints while optimizing the objective. This makes it practical
to search much larger ranges. The program
below extends the range to `1..1000` and adds the objective `-z`, so the solver
returns a triple with the largest possible hypotenuse:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  auto x = 1 <= qbpp::int_var("x") <= 1000;
  auto y = 1 <= qbpp::int_var("y") <= 1000;
  auto z = 1 <= qbpp::int_var("z") <= 1000;
  auto f = -qbpp::toExpr(z)  // maximize the hypotenuse z
         + 2000 * qbpp::cons(x * x + y * y - z * z == 0)
         + 2000 * qbpp::cons(y - x >= 1);
  f.simplify_as_binary();
  auto sol = qbpp::EasySolver(f).search({{"time_limit", 15.0}});
  std::cout << "x=" << sol(x) << ", y=" << sol(y) << ", z=" << sol(z)
            << ", violations=" << f.cons(sol) << std::endl;
}
```
{% endraw %}
Here `f.cons(sol)` reports the number of violated constraints; `0` means the
returned triple is a valid Pythagorean triple with `y > x`. A typical result is:
```
x=352, y=936, z=1000, violations=0
```

## Handling large integers with `c64e128`

For large integer ranges, the intermediate values handled by the solver can
exceed the range of 64-bit integers. In that case, select the `c64e128` integer
type (64-bit coefficients and 128-bit energy) by placing
`#define INTEGER_TYPE_C64E128` at the top of the program. The version below
searches the range `1..10000`:
{% raw %}
```cpp
#define INTEGER_TYPE_C64E128

#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  auto x = 1 <= qbpp::int_var("x") <= 10000;
  auto y = 1 <= qbpp::int_var("y") <= 10000;
  auto z = 1 <= qbpp::int_var("z") <= 10000;
  auto f = -qbpp::toExpr(z)  // maximize the hypotenuse z
         + 20000 * qbpp::cons(x * x + y * y - z * z == 0)
         + 20000 * qbpp::cons(y - x >= 1);
  f.simplify_as_binary();
  auto sol = qbpp::EasySolver(f).search({{"time_limit", 20.0}});
  std::cout << "x=" << sol(x) << ", y=" << sol(y) << ", z=" << sol(z)
            << ", violations=" << f.cons(sol) << std::endl;
}
```
{% endraw %}
A typical result is:
```
x=3520, y=9360, z=10000, violations=0
```
The available integer types are listed in
[Variable and Expression Classes](VAREXPR).
