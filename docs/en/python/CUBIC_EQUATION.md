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

x = qbpp.var("x", between=(-100, 100))
f = qbpp.constrain(x * x * x - 147 * x + 286, equal=0)
f.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=1)

for sol in result.sols:
    print(f"x = {sol(x)} sol = {sol}")
```
Here, `qbpp.var("x", between=(-100, 100))` declares an integer variable `x` with the range $[-100, 100]$.

The expression `f` corresponds to the following objective function:

$$
\begin{aligned}
f & = (x^3 -147x +286)^2
\end{aligned}
$$

Since the integer variable `x` is implemented as a linear expression of binary variables, `f` becomes a polynomial of degree 6.

Since Python integers have unlimited precision, there is usually no need to specify special integer types.
However, when coefficients become very large, you can import the `pyqbpp.cppint` submodule for arbitrary-precision integer arithmetic as follows:
```python
import pyqbpp.cppint as qbpp
```

This program produces the following output:
{% raw %}
```
x = 11 sol = 0:{{x[0],0},{x[1],1},{x[2],1},{x[3],0},{x[4],0},{x[5],1},{x[6],0},{x[7],1}}
x = 2 sol = 0:{{x[0],0},{x[1],1},{x[2],1},{x[3],0},{x[4],0},{x[5],1},{x[6],1},{x[7],0}}
x = -13 sol = 0:{{x[0],0},{x[1],1},{x[2],1},{x[3],1},{x[4],0},{x[5],0},{x[6],0},{x[7],1}}
x = 2 sol = 0:{{x[0],1},{x[1],0},{x[2],1},{x[3],1},{x[4],1},{x[5],0},{x[6],0},{x[7],1}}
x = -13 sol = 0:{{x[0],1},{x[1],1},{x[2],1},{x[3],0},{x[4],1},{x[5],0},{x[6],1},{x[7],0}}
x = 11 sol = 0:{{x[0],1},{x[1],1},{x[2],1},{x[3],1},{x[4],0},{x[5],1},{x[6],1},{x[7],0}}
```
{% endraw %}
The first line indicates that the integer variable `x` is encoded using 8 binary variables.
Also, the program outputs 6 optimal solutions even though the original cubic equation has only 3 integer solutions.
This happens because the coefficient `73` of `x[7]` is not a power of two, so the same integer value can be represented by multiple different assignments of the binary variables encoding `x`.

To eliminate duplicate values of `x`, you can modify the program to use a `set` as follows:
```python
seen = set()
for sol in result.sols:
    xv = sol(x)
    if xv in seen:
        continue
    seen.add(xv)
    print(f"x = {xv} sol = {sol}")
```
This modified program outputs the following unique solutions:
{% raw %}
```
x = 11 sol = 0:{{x[0],0},{x[1],1},{x[2],1},{x[3],0},{x[4],0},{x[5],1},{x[6],0},{x[7],1}}
x = 2 sol = 0:{{x[0],0},{x[1],1},{x[2],1},{x[3],0},{x[4],0},{x[5],1},{x[6],1},{x[7],0}}
x = -13 sol = 0:{{x[0],0},{x[1],1},{x[2],1},{x[3],1},{x[4],0},{x[5],0},{x[6],0},{x[7],1}}
```
{% endraw %}
