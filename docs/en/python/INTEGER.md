---
layout: default
nav_exclude: true
title: "Integer Variables"
nav_order: 7
lang: en
hreflang_alt: "ja/python/INTEGER"
hreflang_lang: "ja"
---

# Integer Variables and Solving Simultaneous Equations

## Integer variables
PyQBPP supports **integer variables**, which are internally implemented using multiple binary variables.
A conventional binary encoding is used to represent integer values.

The following program demonstrates how integer variables are defined:
```python
import pyqbpp as qbpp

x = qbpp.between(qbpp.var_int("x"), 1, 8)
y = qbpp.between(qbpp.var_int("y"), -10, 10)
print(f"x = {x} uses {x.var_count()} variables.")
print(f"y = {y} uses {y.var_count()} variables.")
```

An integer variable is defined using the **`between()`** function, which specifies the integer range that the variable can take.
The function **`var_int("name")`** creates a **`VarIntCore`** object with the given `name`, and **`between(var_int("name"), min, max)`** creates a **`VarInt`** object representing the linear expression encoded by binary variables.
The program outputs the following expressions:
```
x = 1 +x[0] +2*x[1] +4*x[2] uses 3 variables.
y = -10 +y[0] +2*y[1] +4*y[2] +8*y[3] +5*y[4] uses 5 variables.
```

> **WARNING**
> The number of binary variables required for an integer variable grows logarithmically with its range.
> When `max - min` is large, the QUBO size increases, so wide integer ranges should be avoided whenever possible.

## QUBO formulation for solving simultaneous equations
PyQBPP can solve systems of simultaneous equations by representing the variables as integer variables.
As an example, we construct a QUBO formulation for the following equations, whose solution is $x=4$ and $y=6$:

$$
\begin{aligned}
x + y = 10\\
2x+4y = 28
\end{aligned}
$$

## PyQBPP program
The following program constructs the QUBO expression, solves it, and decodes the resulting values of $x$ and $y$:
```python
import pyqbpp as qbpp

x = qbpp.between(qbpp.var_int("x"), 0, 10)
y = qbpp.between(qbpp.var_int("y"), 0, 10)

f = (x + y) == 10
g = (2 * x + 4 * y) == 28
h = f + g
h.simplify_as_binary()

solver = qbpp.EasySolver(h)
sol = solver.search({"target_energy": 0})

print("sol =", sol)
print("x =", x, "=", sol(x))
print("y =", y, "=", sol(y))
print("f =", sol(f))
print("g =", sol(g))
print("x + y =", sol(f.body))
print("2x + 4y =", sol(g.body))
```
First, `VarInt` objects **`x`** and **`y`** are defined with the range $[0,10]$.
An `Expr` object **`f`** is created to represent the constraint **`(x + y) == 10`**.
Internally, this is equivalent to the QUBO expression `sqr(x + y - 10)`.
Similarly, **`g`** represents the constraint **`(2 * x + 4 * y) == 28`**.
The combined expression **`h = f + g`** encodes both equations.
An Easy Solver instance is created with `h`, and `{"target_energy": 0}` is passed to `search()`, since the optimal solution satisfies all constraints.
Calling `search()` returns a `Sol` object `sol` that stores the optimal assignment of all binary variables.

Here,
- **`f`**: The penalty expression enforcing `x + y = 10`. Thus `sol(f) = 0` if and only if the equation is satisfied.
- **`f.body`**: The linear expression `x + y`. Thus `sol(f.body)` returns the actual evaluated value of `x + y`.

The same applies to **`g`** and **`g.body`**.

The program outputs the following result:
```
sol = Sol(energy=0, x[0]=0, x[1]=1, x[2]=1, x[3]=0, y[0]=0, y[1]=0, y[2]=1, y[3]=0)
x = x[0] +2*x[1] +4*x[2] +3*x[3] = 6
y = y[0] +2*y[1] +4*y[2] +3*y[3] = 4
f = 0
g = 0
x + y = 10
2x + 4y = 28
```

Thus, we can confirm that the values of `x`, `y`, and the constraint expressions are consistent with the solution.

> **WARNING**
> PyQBPP supports the `==` operator only when the left-hand side is an expression and the right-hand side is an integer.
> Comparisons of the form `integer == expression` or `expression == expression` are not supported.
