---
last_modified: 2026-10-10
layout: default
nav_exclude: true
title: "Cubic Equation"
nav_order: 7
lang: en
hreflang_alt: "ja/CUBIC_EQUATION"
hreflang_lang: "ja"
---

# Cubic Equation
Cubic equations over the integers can be solved using QUBO++. For example, consider

$$
\begin{aligned}
x^3 -147x +286 &=0.
\end{aligned}
$$

This equation has three integer solutions: $x = -13, 2, 11$.

## QUBO++ program for solving the cubic equations
In the following QUBO++ program, we define a [native integer variable](NATIVE_INTEGER) x that takes values in $[-100, 100]$, and we enumerate all optimal solutions using the Exhaustive Solver:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto x = -100 <= qbpp::int_var("x") <= 100;
  auto f = qbpp::cons(x * x * x - 147 * x + 286 == 0);
  f.simplify_as_binary();

  auto solver = qbpp::ExhaustiveSolver(f);
  auto sols = solver.search({{"best_energy_sols", 0}});

  for (const auto& sol : sols) {
    std::cout << "x = " << x(sol) << " sol = " << sol << std::endl;
  }
}
```
{% endraw %}
The variable `x` declared with `qbpp::int_var()` is not expanded into binary variables; it is handled as an integer.
Enclosing the equation in [`qbpp::cons()`](CONSTRAINTS) makes the energy of `f` the square of the violation, that is,

$$
\begin{aligned}
f & = (x^3 -147x +286)^2,
\end{aligned}
$$

which takes its minimum value 0 only when the equation holds.
The Exhaustive Solver examines all 201 values of `x`, and setting `best_energy_sols` to 0 returns all solutions with the minimum energy.
This program produces the following output:
{% raw %}
```
x = -13 sol = 0:{{x,-13}}
x = 2 sol = 0:{{x,2}}
x = 11 sol = 0:{{x,11}}
```
{% endraw %}
Because each solution is represented by the value of `x` itself, each of the three integer solutions is printed exactly once.

## Difference from integer variables represented by binary variables
The same equation can also be written with an [integer variable](INTEGER) `qbpp::var_int()` and a penalty expression:
```cpp
  auto x = -100 <= qbpp::var_int("x") <= 100;
  auto f = x * x * x - 147 * x + 286 == 0;
```
In this case, `x` is represented as a linear expression of 8 binary variables, so `f` becomes a polynomial of degree 6.
Also, the coefficient of the most significant bit is not a power of two (it is `73`, so that the variable covers $-100$ to $100$), so the same integer value can be represented by multiple assignments of the binary variables, and the same solution is printed more than once.
Furthermore, the coefficients of the expanded polynomial do not fit in 32-bit integers, so a wider integer type such as [`INTEGER_TYPE_CPP_INT`](VAREXPR) is required.
With a native integer variable and `qbpp::cons()`, the expression stays cubic, there are no duplicates, and the default integer types suffice.
