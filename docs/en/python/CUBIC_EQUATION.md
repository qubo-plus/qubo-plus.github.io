---
layout: default
nav_exclude: true
title: "Cubic Equation"
nav_order: 46
lang: en
hreflang_alt: "ja/python/CUBIC_EQUATION"
hreflang_lang: "ja"
---

# Cubic Equation
Cubic equations over the integers can be solved using PyQBPP. For example, consider

$$
\begin{aligned}
x^3 -147x +286 &=0.
\end{aligned}
$$

This equation has three integer solutions: $x = -13, 2, 11$.

## PyQBPP program for solving the cubic equation
In the following PyQBPP program, we define an integer variable x that takes values in $[-100, 100]$, and we enumerate all optimal solutions using the Exhaustive Solver:
```python
import pyqbpp as qbpp

x = qbpp.between(qbpp.var_int("x"), -100, 100)
f = x * x * x - 147 * x + 286 == 0
f.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(f)
result = solver.search({"best_energy_sols": 0})

seen = set()
for sol in result.sols():
    xv = sol(x)
    if xv not in seen:
        seen.add(xv)
        print(f"x = {xv}")
```
The expression `f` corresponds to the following objective function:

$$
\begin{aligned}
f & = (x^3 -147x +286)^2
\end{aligned}
$$

Since the integer variable `x` is implemented as a linear expression of binary variables, `f` becomes a polynomial of degree 6.

Since Python integers have unlimited precision, there is no need to specify special integer types (unlike the C++ version which requires `INTEGER_TYPE_CPP_INT`).

Because the coefficient of the highest-order binary variable is not a power of two,
the same integer value can be represented by multiple different assignments of the binary variables.
Therefore, we use a `set` to remove duplicate values of `x`.

This program produces the following output:
```
x = 11
x = 2
x = -13
```
