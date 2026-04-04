---
layout: default
nav_exclude: true
title: "Partitioning Problem"
nav_order: 5
lang: en
hreflang_alt: "ja/python/PARTITION"
hreflang_lang: "ja"
---

# Solving Partitioning Problem Using Array of variables

## Partitioning problem
Let $w=(w_0, w_1, \ldots, w_{n-1})$ be $n$ positive numbers.
The **partitioning problem** is to partition these numbers into two sets $P$ and $Q$ ($=\overline{P}$) such that the sums of the elements in the two sets are as close as possible.
More specifically, the problem is to find a subset $L \subseteq \lbrace 0,1,\ldots, n-1\rbrace$ that minimizes:

$$
\begin{aligned}
P(L) &= \sum_{i\in L}w_i \\
Q(L) &= \sum_{i\not\in L}w_i \\
f(L) &= \left| P(L)-Q(L) \right|
\end{aligned}
$$

This problem can be formulated as a QUBO problem.
Let $x=(x_0, x_1, \ldots, x_{n-1})$ be binary variables representing the set $L$,
that is, $i\in L$ if and only if $x_i=1$.
We can rewrite $P(L)$, $Q(L)$ and $f(L)$ using $x$ as follows:

$$
\begin{aligned}
P(x) &= \sum_{i=0}^{n-1} w_ix_i \\
Q(x) &= \sum_{i=0}^{n-1} w_i \overline{x_i} \\
f(x)    &= \left( P(x)-Q(x) \right)^2
\end{aligned}
$$

where $\overline{x_i}$ denotes the **negated literal** of $x_i$, which takes the value $1$ when $x_i=0$ and $0$ when $x_i=1$.
Mathematically, $\overline{x_i} = 1 - x_i$, but PyQBPP handles negated literals natively using the `~` operator (e.g., `~x[i]`), which avoids expanding $1 - x_i$ and is more efficient.
For more details, see **[Negated Literals](NEGATIVE)**.

Clearly, $f(x)=f(L)^2$ holds.
The function $f(x)$ is a quadratic expression of $x$, and an optimal solution that minimizes $f(x)$ also gives an optimal solution to the original partitioning problem.

## PyQBPP program for the partitioning problem
The following program creates the QUBO formulation of the partitioning problem for a fixed set of 8 numbers and finds a solution using the Exhaustive Solver.

```python
import pyqbpp as qbpp

w = [64, 27, 47, 74, 12, 83, 63, 40]

x = qbpp.var("x", len(w))
p = qbpp.expr()
q = qbpp.expr()
for i in range(len(w)):
    p += w[i] * x[i]
    q += w[i] * ~x[i]
f = qbpp.sqr(p - q)
print("f =", f.simplify_as_binary())

solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()

print("Solution:", sol)
print("f(sol) =", sol(f))
print("p(sol) =", sol(p))
print("q(sol) =", sol(q))

print("P :", end="")
for i in range(len(w)):
    if sol(x[i]) == 1:
        print(f" {w[i]}", end="")
print()

print("Q :", end="")
for i in range(len(w)):
    if sol(x[i]) == 0:
        print(f" {w[i]}", end="")
print()
```

In this program, **`w`** is a Python list with 8 numbers.
An array **`x`** of `len(w)=8` binary variables is defined.
Two `Expr` objects **`p`** and **`q`** are defined, and the expressions for $P(x)$ and $Q(x)$
are constructed in the for-loop.
Here, **`~x[i]`** denotes the negated literal $\overline{x_i}$ of `x[i]`.
An `Expr` object **`f`** stores the expression for $f(x)$.

An Exhaustive Solver object **`solver`** for `f` is created
and the solution **`sol`** (a `Sol` object) is obtained by calling its `search()` method.

The values of $f(x)$, $P(x)$, and $Q(x)$ are evaluated by calling **`sol(f)`**, **`sol(p)`** and **`sol(q)`**, respectively.
The numbers in the sets $L$ and $\overline{L}$ are displayed using the for loops.
In these loops, **`sol(x[i])`** returns the value of `x[i]` in `sol`.

This program outputs:
```
f = 168100 -88576*x[0] ...
Solution: Sol(energy=0, x[0]=0, x[1]=0, x[2]=1, x[3]=0, x[4]=1, x[5]=1, x[6]=1, x[7]=0)
f(sol) = 0
p(sol) = 205
q(sol) = 205
P : 47 12 83 63
Q : 64 27 74 40
```

> **NOTE**
> For an `Expr` object `f` and a `Sol` object `sol`, both **`f(sol)`** and **`sol(f)`** return the resulting value of `f` evaluated on `sol`.
> Likewise, for a `Var` object `a`, both **`a(sol)`** and **`sol(a)`** return the value of `a` in the solution `sol`.
> The form **`f(sol)`** is natural from a **mathematical perspective**, as it corresponds to evaluating a function at a point.
> In contrast, **`sol(f)`** is natural from an **object-oriented programming perspective**, where the solution object evaluates an expression.
> You may use either form according to your preference.

## PyQBPP program using array operations
PyQBPP has rich array operations that can simplify the code.

In the following code, `w` is a plain Python list of integers.
When a Python list is multiplied by an `Array` (e.g., `w * x`), PyQBPP's `__rmul__` automatically performs element-wise multiplication.
Since the overloaded operator `*` performs element-wise multiplication,
**`qbpp.sum(w * x)`** returns the `Expr` object representing $P(L)$.
The `~` operator applied to an `Array` of variables returns an array of their negated literals.
Thus, **`qbpp.sum(w * ~x)`** returns an `Expr` object storing $Q(L)$.

```python
import pyqbpp as qbpp

w = [64, 27, 47, 74, 12, 83, 63, 40]
x = qbpp.var("x", len(w))
p = qbpp.sum(w * x)
q = qbpp.sum(w * ~x)
f = qbpp.sqr(p - q)
```

PyQBPP programs can be simplified by using these array operations.

> **NOTE**
> The operators `+`, `-`, and `*` are overloaded both for two `Array` objects and for a scalar and an `Array` object.
> For two `Array` objects, the overloaded operators perform element-wise operations.
> For a scalar and an `Array` object, the overloaded operators apply the scalar operation to each element of the array.
