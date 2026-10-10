---
last_modified: 2026-10-10
layout: default
nav_exclude: true
title: "Cubic Equation"
nav_order: 46
lang: en
hreflang_alt: "ja/python/CUBIC_EQUATION"
hreflang_lang: "ja"
---

# Cubic Equation
Cubic equations over the integers can be solved with PyQBPP. For example, consider:

$$
\begin{aligned}
x^3 -147x +286 &=0.
\end{aligned}
$$

This equation has three integer solutions: $x = -13, 2, 11$.

## PyQBPP program for solving the cubic equation
In the following PyQBPP program, we define a [native integer variable](NATIVE_INTEGER) x that takes values in $[-100, 100]$, and enumerate all optimal solutions using the exhaustive solver:
```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(-100, 100))
f = qbpp.cons(x * x * x - 147 * x + 286 == 0)
f.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)

for sol in result.sols:
    print(f"x = {sol(x)} sol = {sol}")
```
The variable `x` declared with `qbpp.var("x", integer=(-100, 100))` is not expanded into binary variables; it is handled as an integer.
Enclosing the equation in [`qbpp.cons()`](CONSTRAINTS) makes the energy of `f` the square of the violation, that is,

$$
\begin{aligned}
f & = (x^3 -147x +286)^2,
\end{aligned}
$$

which takes its minimum value 0 only when the equation holds.
The exhaustive solver examines all 201 values of `x`, and setting `best_energy_sols` to 0 returns all solutions with the minimum energy.
This program produces the following output:
{% raw %}
```
x = -13 sol = Sol(energy=0, {x: -13})
x = 2 sol = Sol(energy=0, {x: 2})
x = 11 sol = Sol(energy=0, {x: 11})
```
{% endraw %}
Because each solution is represented by the value of `x` itself, each of the three integer solutions is printed exactly once.

## Difference from integer variables represented by binary variables
The same equation can also be written with an [integer variable](INTEGER) declared with `between=` and a penalty expression:
```python
x = qbpp.var("x", between=(-100, 100))
f = (x * x * x - 147 * x + 286 == 0)
```
In this case, `x` is represented as a linear expression of 8 binary variables, so `f` becomes a polynomial of degree 6.
Also, the coefficient of the most significant bit is not a power of two (it is `73`, so that the variable covers $-100$ to $100$), so the same integer value can be represented by multiple assignments of the binary variables, and the same solution is printed more than once.
Furthermore, the coefficients of the expanded polynomial do not fit in 32-bit integers, so a wider integer type such as [`pyqbpp.cppint`](VAREXPR) is required.
With a native integer variable and `qbpp.cons()`, the expression stays cubic, there are no duplicates, and the default `pyqbpp` suffices.
