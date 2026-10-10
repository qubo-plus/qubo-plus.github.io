---
last_modified: 2026-10-10
layout: default
nav_exclude: true
title: "3-Digit Math"
nav_order: 6
lang: en
hreflang_alt: "ja/3DIGIT_MATH"
hreflang_lang: "ja"
---

# 3-Digit Math Problem

Let us solve the following math problem using QUBO++.

> **Math Problem**:
> Find all three-digit odd integers whose **product of digits** is **252**.

Let $x$, $y$, and $z$ be the hundreds, tens, and ones digits of the integer, respectively.
More specifically:
- $x$ is an integer in $[1, 9]$,
- $y$ is an integer in $[0, 9]$,
- $t$ is an integer in $[0, 4]$,
- $z = 2t + 1$ (so $z$ is odd).

Then the value $v$ of the three-digit integer $xyz$ is

$$
\begin{aligned}
v&=100x+10y+z
\end{aligned}
$$


We find all solutions satisfying:

$$
\begin{aligned}
xyz &= 252
\end{aligned}
$$

## QUBO++ program
The following QUBO++ program finds all solutions:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto x = 1 <= qbpp::int_var("x") <= 9;
  auto y = 0 <= qbpp::int_var("y") <= 9;
  auto t = 0 <= qbpp::int_var("t") <= 4;
  auto z = 2 * t + 1;
  auto v = x * 100 + y * 10 + z;

  auto f = qbpp::cons(x * y * z == 252);

  f.simplify_as_binary();
  auto solver = qbpp::ExhaustiveSolver(f);
  auto sols = solver.search({{"best_energy_sols", 0}});
  for (const auto& sol : sols) {
    std::cout << sol(v) << " ";
  }
  std::cout << std::endl;
}
```
{% endraw %}
In this program, **`x`**, **`y`**, and **`t`** are defined as [native integer variables](NATIVE_INTEGER) with the ranges above.
Then **`z`**, **`v`**, and **`f`** are defined as expressions.
`f` declares the condition $xyz = 252$ as a constraint with [`qbpp::cons()`](CONSTRAINTS), so its energy takes the minimum value 0 only when the condition holds.
We create an Exhaustive Solver instance for `f` and store all optimal solutions in `sols`.

Because `x`, `y`, and `t` are handled as integers, each solution corresponds to exactly one digit triple (`x`,`y`,`z`), and no triple appears more than once.
Printing the value of `v` for each solution gives:
```
479 497 667 749 947
```
