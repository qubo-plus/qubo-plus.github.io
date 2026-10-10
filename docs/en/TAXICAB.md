---
last_modified: 2026-10-08
layout: default
nav_exclude: true
title: "Taxicab Number 1729"
nav_order: 58
lang: en
hreflang_alt: "ja/TAXICAB"
hreflang_lang: "ja"
---

# Taxicab Number 1729

The mathematician Hardy once remarked that the number of the taxi he had ridden in, 1729, seemed rather dull. Ramanujan replied that it is the smallest number expressible as the sum of two cubes in two different ways:

$$
1729 = 1^3 + 12^3 = 9^3 + 10^3
$$

On this page, we decompose 1729 into a sum of two cubes by exhaustive search with the Exhaustive Solver.
We write the same problem in two ways and compare them:
- integer variables `var_int` with penalty expressions
- native integer variables `int_var` with `qbpp::cons()`

Finally, we let QUBO++ find 1729 itself.

## The problem

We find all positive integers $a \le b$ such that

$$
a^3 + b^3 = 1729.
$$

Since $12^3 = 1728$, it is enough to search $1 \le a \le b \le 12$.
The condition $a \le b$ excludes solutions that only swap $a$ and $b$.

## Solving with `var_int` and penalty expressions

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto a = 1 <= qbpp::var_int("a") <= 12;
  auto b = 1 <= qbpp::var_int("b") <= 12;
  auto n = a * a * a + b * b * b;
  auto f = (n == 1729) + (b - a >= 0);
  f.simplify_as_binary();
  std::cout << "a = " << a << std::endl;
  std::cout << "f: degree = " << f.max_degree() << ", terms = " << f.term_count()
            << std::endl;

  auto solver = qbpp::ExhaustiveSolver(f);
  auto sols = solver.search({{"best_energy_sols", 0}});
  for (const auto& sol : sols) {
    std::cout << sol(a) << "^3 + " << sol(b) << "^3 = " << n(sol)
              << ", energy = " << sol.energy() << std::endl;
  }
}
```
{% endraw %}

We define $a$ and $b$ as [integer variables](INTEGER) `var_int` taking values from 1 to 12, and build `f` by adding the equality `n == 1729` and the inequality `b - a >= 0`.
A comparison that is not wrapped in `qbpp::cons()` becomes a **penalty expression**: it is 0 when the condition holds and positive otherwise.
Passing `"best_energy_sols"` with `0` to `search()` returns all solutions with the minimum energy.

The output of this program is as follows:
```
a = 1 +a[0] +2*a[1] +4*a[2] +4*a[3]
f: degree = 6, terms = 256
9^3 + 10^3 = 1729, energy = 0
1^3 + 12^3 = 1729, energy = 0
```

- As the first line shows, an integer variable created by `var_int` is a linear expression of four binary variables `a[0]` to `a[3]`.
- The equality `n == 1729` becomes the penalty expression $(a^3+b^3-1729)^2$. Since $a^3$ is a cubic expression of binary variables, expanding the square gives a polynomial of degree 6.
- The penalty expression for the inequality `b - a >= 0` adds an auxiliary variable, which is also represented by binary variables (see [Constraints](CONSTRAINTS)).
- As a result, `f` is a polynomial of degree 6 with 256 terms over 11 binary variables (4 each for $a$ and $b$, and 3 for the auxiliary variable). Printing it with `std::cout << f` lists all 256 terms.
- The Exhaustive Solver examines all $2^{11} = 2048$ assignments of the binary variables and finds two solutions with energy 0.

## Solving with `int_var` and `cons()`

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto a = 1 <= qbpp::int_var("a") <= 12;
  auto b = 1 <= qbpp::int_var("b") <= 12;
  auto n = a * a * a + b * b * b;
  auto f = qbpp::cons(n == 1729) + qbpp::cons(b - a >= 0);
  f.simplify_as_binary();
  std::cout << "a = " << a << std::endl;
  std::cout << "f = " << f << std::endl;

  auto solver = qbpp::ExhaustiveSolver(f);
  auto sols = solver.search({{"best_energy_sols", 0}});
  for (const auto& sol : sols) {
    std::cout << sol(a) << "^3 + " << sol(b) << "^3 = " << n(sol)
              << ", energy = " << sol.energy() << ", violations = " << f.cons(sol)
              << std::endl;
  }
}
```
{% endraw %}

The only differences from the previous program are that `var_int` is replaced by `int_var` and that the two comparisons are wrapped in `qbpp::cons()`.

The output of this program is as follows:
```
a = a
f = cons(a*a*a +b*b*b == 1729)
+cons(-a +b >= 0)
1^3 + 12^3 = 1729, energy = 0, violations = 0
9^3 + 10^3 = 1729, energy = 0, violations = 0
```

- A [native integer variable](NATIVE_INTEGER) created by `int_var` is not expanded into binary variables; it holds an integer value directly (line 1). `a * a * a` is also treated as the cube of an integer.
- A comparison wrapped in `qbpp::cons()` is not expanded into a penalty expression; it is kept in `f` as a **constraint** (lines 2 and 3). There is no expansion of a square and no auxiliary variable.
- The energy of an assignment that violates a constraint is the square of the violation. `f.cons(sol)` returns the number of violated constraints.
- The Exhaustive Solver examines all $12 \times 12 = 144$ combinations of the values of $a$ and $b$.

## Comparing the two formulations

| | `var_int` with penalty expressions | `int_var` with `cons()` |
|---|---|---|
| Representation of an integer | Linear expression of binary variables (4 each for $a$ and $b$) | The integer value itself |
| $a^3+b^3=1729$ | Polynomial of degree 6 from expanding $(a^3+b^3-1729)^2$ | Kept as a constraint |
| $a \le b$ | Penalty expression with an auxiliary variable | Kept as a constraint |
| Size of `f` | 11 binary variables, 256 terms | 2 constraints |
| Cases examined by the Exhaustive Solver | $2^{11} = 2048$ | $12 \times 12 = 144$ |
| Solvers | A polynomial of binary variables, so it can also be passed to QUBO/HUBO solvers other than QUBO++ | Solvers bundled with QUBO++ (EasySolver, ABS3, and Exhaustive Solver) |

If the range of the integers is widened, `var_int` needs more binary variables, and the number of terms in the penalty expressions grows rapidly.
With `int_var` and `cons()`, `f` stays two constraints however wide the range is.

The type of variable and the way of writing constraints can be chosen independently.
[Pythagorean Triples](PYTHAGOREAN) shows `var_int` combined with `cons()`, and [Native Integer Variables](NATIVE_INTEGER) shows `int_var` used in penalty expressions.

## Finding 1729

Finally, we let QUBO++ find the smallest number expressible as the sum of two cubes in two different ways.
We search for positive integers with $a^3 + b^3 = c^3 + d^3$ that minimize $n = a^3 + b^3$:

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto a = 1 <= qbpp::int_var("a") <= 20;
  auto b = 1 <= qbpp::int_var("b") <= 20;
  auto c = 1 <= qbpp::int_var("c") <= 20;
  auto d = 1 <= qbpp::int_var("d") <= 20;
  auto n = a * a * a + b * b * b;
  auto m = c * c * c + d * d * d;
  auto f = n  // minimize n
         + 20000 * qbpp::cons(n - m == 0)
         + 20000 * qbpp::cons(c - a >= 1)   // a < c
         + 20000 * qbpp::cons(d - c >= 0)   // c <= d
         + 20000 * qbpp::cons(b - d >= 1);  // d < b
  f.simplify_as_binary();

  auto solver = qbpp::ExhaustiveSolver(f);
  auto sols = solver.search({{"best_energy_sols", 0}});
  for (const auto& sol : sols) {
    std::cout << n(sol) << " = " << sol(a) << "^3 + " << sol(b) << "^3 = " << sol(c)
              << "^3 + " << sol(d) << "^3, violations = " << f.cons(sol) << std::endl;
  }
}
```
{% endraw %}

The output of this program is as follows:
```
1729 = 1^3 + 12^3 = 9^3 + 10^3, violations = 0
```

- The objective is $n = a^3 + b^3$, and the constraints are $n = c^3 + d^3$ and $a < c \le d < b$. The condition $a < c \le d < b$ excludes identical representations and combinations that only differ in order.
- The weight of the constraints is 20000. In this range $n \le 2 \cdot 20^3 = 16000$, so an assignment that violates any constraint has a higher energy than any assignment that satisfies all of them.
- If a number smaller than 1729 had two such representations, all of $a$, $b$, $c$, and $d$ would be at most 12 and thus within the range 1 to 20. Since the Exhaustive Solver examines all $20^4 = 160000$ cases, this result shows that 1729 is the smallest such number.
