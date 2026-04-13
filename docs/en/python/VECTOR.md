---
layout: default
nav_exclude: true
title: "Arrays"
nav_order: 4
lang: en
hreflang_alt: "ja/python/VECTOR"
hreflang_lang: "ja"
---

# Array of variables and array functions

PyQBPP supports arrays of variables and array operations.

## Defining array of variables
An array of binary variables can be created using the **`var()`** function.
- **`var("name", shape=size)`** returns an `Array` of `size` variables with the given `name`.

The following program defines an array of 5 variables with the name **`x`**.
By printing `x`, we can confirm that it contains the 5 variables **`x[0]`**, **`x[1]`**, **`x[2]`**, **`x[3]`**, and **`x[4]`**.
Next, using the **`expr()`** function, we create an **`Expr`** object **`f`** whose initial value is `0`.
In the for-loop from `i = 0` to `4`, each variable `x[i]` is added to `f` using the compound operator **`+=`**.
Finally, `f` is simplified and printed.
```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=5)
print(x)
f = qbpp.expr()
for i in range(5):
    f += x[i]
print("f =", f.simplify_as_binary())
```
The output of this program is as follows:
```
[x[0], x[1], x[2], x[3], x[4]]
f = x[0] +x[1] +x[2] +x[3] +x[4]
```

> **NOTE**
> **`var(name, shape=size)`** returns an **`Array`** object that contains `size` elements of type `Var`.
> The **`Array`** class provides overloaded operators that support element-wise operations.

## Sum function
Using the utility function **`sum()`**, you can obtain the sum of an array of binary variables.
The following program uses `sum()` to compute the sum of all variables in the array `x`:
```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=5)
print(x)
f = qbpp.sum(x)
print("f =", f.simplify_as_binary())
```
The output of this program is exactly the same as that of the previous program.

## QUBO for one-hot constraint
An array of binary variables is **one-hot** if it has **exactly one entry equal to 1**, that is, the sum of its elements is equal to 1.
Let $X = (x_0, x_1, \ldots, x_{n-1})$ denote an array of $n$ binary variables.
The following expression $f(X)$ takes the minimum value of 0 if and only if $X$ is one-hot:

$$
\begin{align}
f(X) &= \left(1 - \sum_{i=0}^{n-1}x_i\right)^2
\end{align}
$$

The following program creates the expression $f$ and finds all optimal solutions:
```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=5)
f = qbpp.sqr(qbpp.sum(x) - 1)
print("f =", f.simplify_as_binary())

solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)
for i, sol in enumerate(result.sols):
    print(f"({i}) {sol}")
```
The function **`sum()`** computes the sum of all variables in the array.
The function **`sqr()`** computes the square of its argument.
The Exhaustive Solver finds all optimal solutions with energy value 0 as follows:
```
f = 1 -x[0] -x[1] -x[2] -x[3] -x[4] +2*x[0]*x[1] +2*x[0]*x[2] +2*x[0]*x[3] +2*x[0]*x[4] +2*x[1]*x[2] +2*x[1]*x[3] +2*x[1]*x[4] +2*x[2]*x[3] +2*x[2]*x[4] +2*x[3]*x[4]
(0) Sol(energy=0, {x[0]: 0, x[1]: 0, x[2]: 0, x[3]: 0, x[4]: 1})
(1) Sol(energy=0, {x[0]: 0, x[1]: 0, x[2]: 0, x[3]: 1, x[4]: 0})
(2) Sol(energy=0, {x[0]: 0, x[1]: 0, x[2]: 1, x[3]: 0, x[4]: 0})
(3) Sol(energy=0, {x[0]: 0, x[1]: 1, x[2]: 0, x[3]: 0, x[4]: 0})
(4) Sol(energy=0, {x[0]: 1, x[1]: 0, x[2]: 0, x[3]: 0, x[4]: 0})
```
All 5 optimal solutions are displayed.
