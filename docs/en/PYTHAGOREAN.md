---
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
#include <qbpp/easy_solver.hpp>

int main() {
  auto x = 1 <= qbpp::var_int("x") <= 16;
  auto y = 1 <= qbpp::var_int("y") <= 16;
  auto z = 1 <= qbpp::var_int("z") <= 16;
  auto f = x * x + y * y - z * z == 0;
  auto c = y - x >= 1;
  auto g = f + c;
  g.simplify_as_binary();
  auto solver = qbpp::EasySolver(g);
  auto sols = solver.search({{"time_limit", 10.0}, {"best_energy_sols", 0}});
  for (const auto& sol : sols) {
    std::cout << "x=" << sol(x) << ", y=" << sol(y) << ", z=" << sol(z)
              << ", f.body()=" << f.body(sol) << ", c.body()=" << c.body(sol) << std::endl;
  }
}
```
{% endraw %}
In this program, we define integer variables `x`, `y`, and `z` with ranges from 1 to 16.
We then create two constraint expressions:
- `f` for $x^2+y^2-z^2=0$, and
- `c` for $x+1\leq y$.

They are combined into `g`.
The expression `g` attains its minimum value 0 when all constraints are satisfied.

An Easy Solver object `solver` is created for `g` and configured with the following options passed as an initializer list to `search()`:
- `"time_limit"` is set to `10.0`: Terminates the search after 10 seconds.
- `"best_energy_sols"` is set to `0`: Keeps all solutions that share the best (lowest) energy (`0` = unlimited).

The call to `search()` returns a `qbpp::easy_solver::Sols` object named `sols`, which stores the best solutions.
Since `qbpp::easy_solver::Sols` provides iterator access to the stored best-energy solutions (`begin()`, `end()`, `cbegin()`, and `cend()`), they can be printed using a range-based for loop.

This program produces output like the following:
```
x=3, y=4, z=5, f.body()=0, c.body()=1
x=6, y=8, z=10, f.body()=0, c.body()=2
x=9, y=12, z=15, f.body()=0, c.body()=3
x=5, y=12, z=13, f.body()=0, c.body()=7
```

## Using `qbpp::cons()` to search larger ranges

The equality $x^2+y^2-z^2=0$ and the inequality $x+1\leq y$ can also be written
as **constraints** by wrapping them in `qbpp::cons()`. The bundled solvers then
search for an assignment that satisfies the constraints while optimizing the
objective, which makes it practical to search much larger ranges. The program
below extends the range to `1..1000` and adds the objective `-z`, so the solver
returns a triple with the largest possible hypotenuse:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  auto x = 1 <= qbpp::var_int("x") <= 1000;
  auto y = 1 <= qbpp::var_int("y") <= 1000;
  auto z = 1 <= qbpp::var_int("z") <= 1000;
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
  auto x = 1 <= qbpp::var_int("x") <= 10000;
  auto y = 1 <= qbpp::var_int("y") <= 10000;
  auto z = 1 <= qbpp::var_int("z") <= 10000;
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
