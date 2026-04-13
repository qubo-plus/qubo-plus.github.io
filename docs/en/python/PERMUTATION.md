---
layout: default
nav_exclude: true
title: "Permutation Matrix"
nav_order: 6
lang: en
hreflang_alt: "ja/python/PERMUTATION"
hreflang_lang: "ja"
---

# Permutation matrix generation

Many combinatorial optimization problems are permutation-based in the sense that the objective is to find an optimal permutation.
As a fundamental technique for formulating such optimization problems, a matrix of binary variables is used in their QUBO formulation.

## Permutation matrix
Let $X=(x_{i,j})$ ($0\leq i,j\leq n-1$) is a matrix of $n\times n$ binary values.
The matrix $X$ is called a **permutation matrix** if and only if every row and every column has exactly one entry equal to 1.

A **permutation matrix** represents a permutation of $n$ numbers $(0,1,\ldots,n-1)$, where $x_{i,j} = 1$ if and only if the $i$-th element is $j$.

## QUBO formulation for permutation matrices
A binary variable matrix $X=(x_{i,j})$ ($0\leq i,j\leq n-1$)
stores a permutation matrix if and only if the sum of each row and each column is 1.
Thus, the following QUBO function takes the minimum value 0 if and only if $X$ stores a permutation matrix:

$$
\begin{aligned}
f(X) &= \sum_{i=0}^{n-1}\left(1-\sum_{j=0}^{n-1}x_{i,j}\right)^2+\sum_{j=0}^{n-1}\left(1-\sum_{i=0}^{n-1}x_{i,j}\right)^2
\end{aligned}
$$

## PyQBPP program for generating permutation matrices
We can design a PyQBPP program based on the formula $f(X)$ above as follows:
```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(4, 4))
f = qbpp.expr()

for i in range(4):
    s = qbpp.expr()
    for j in range(4):
        s += x[i][j]
    f += qbpp.sqr(1 - s)

for j in range(4):
    s = qbpp.expr()
    for i in range(4):
        s += x[i][j]
    f += qbpp.sqr(1 - s)

f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)
for k, sol in enumerate(result.sols):
    row = [sol.get_vector(x[i]) for i in range(4)]
    print(f"Solution {k} : {row}")
```

In this program, **`var("x", shape=(4, 4))`** returns a nested `Array` of size $4\times 4$ named **`x`**.
For an `Expr` object **`f`**, two double for-loops build the formula for $f(X)$.
Using the Exhaustive Solver, all optimal solutions are computed and stored in **`sols`**.
All solutions in `sols` are displayed one-by-one using `sol.get_vector()`.
This program outputs all 24 permutations.

## QUBO formulation using array functions and operations
Using **`vector_sum()`**, we can compute the row-wise and column-wise sums of a matrix `x` of binary variables:
- **`vector_sum(x, 1)`**: Computes the sum of each row of `x` and returns an array of size `n` containing these sums.
- **`vector_sum(x, 0)`**: Computes the sum of each column of `x` and returns an array of size `n` containing these sums.

For these two arrays of size `n`, `sqr()` squares each element, and `sum()` computes the sum of all elements.

The following program implements a QUBO formulation using these array functions and operations:
```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(4, 4))
f = qbpp.sum(qbpp.sqr(qbpp.vector_sum(x, 1) - 1)) + qbpp.sum(qbpp.sqr(qbpp.vector_sum(x, 0) - 1))
f.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)
for k, sol in enumerate(result.sols):
    perm = []
    for i in range(4):
        for j in range(4):
            if sol(x[i][j]) == 1:
                perm.append(j)
    print(f"Solution {k}: {perm}")
```

## Assignment problem and its QUBO formulation
Let $C = (c_{i,j})$ be a cost matrix of size $n \times n$.
The **assignment problem** for $C$ is to find a permutation
$p:\lbrace 0,1,\ldots, n-1\rbrace \rightarrow \lbrace 0,1,\ldots, n-1\rbrace$
that minimizes the total cost:

$$
\begin{aligned}
 g(p) &= \sum_{i=0}^{n-1}c_{i,p(i)}
\end{aligned}
$$

We can use a permutation matrix $X = (x_{i,j})$ of size $n \times n$ for a QUBO formulation of this problem by defining:

$$
\begin{aligned}
 g(X) &= \sum_{i=0}^{n-1}\sum_{j=0}^{n-1}c_{i,j}x_{i,j}
\end{aligned}
$$

We combine the permutation constraint $f(X)$ and the total cost $g(X)$:

$$
\begin{aligned}
 h(X) &= P\cdot f(X)+g(X)
\end{aligned}
$$

Here, $P$ is a sufficiently large positive constant that prioritizes the permutation constraints.

## PyQBPP program for the assignment problem
In this program, the cost matrix `c` is defined as a 2D `Array` using `qbpp.Array()` with a nested Python list.
`qbpp.Array()` automatically converts nested lists into nested `Array` objects, so multi-dimensional arrays can be created concisely.
The element-wise product `c * x` then computes $c_{i,j} \cdot x_{i,j}$ for all entries.

```python
import pyqbpp as qbpp

c = qbpp.Array([[58, 73, 91, 44],
                 [62, 15, 87, 39],
                 [78, 56, 23, 94],
                 [11, 85, 68, 72]])
x = qbpp.var("x", shape=(4, 4))
f = qbpp.sum(qbpp.constrain(qbpp.vector_sum(x, 1), equal=1)) + qbpp.sum(qbpp.constrain(qbpp.vector_sum(x, 0), equal=1))
g = qbpp.sum(c * x)
h = 1000 * f + g
h.simplify_as_binary()

solver = qbpp.EasySolver(h)
sol = solver.search(time_limit=1.0)
print("sol =", sol)

result = []
for i in range(4):
    for j in range(4):
        if sol(x[i][j]) == 1:
            result.append(j)
print("Result :", result)
for i in range(len(result)):
    print(f"c[{i}][{result[i]}] = {c[i][result[i]]}")
```

We use the Easy Solver to find a solution of `h`.
The time limit for searching is set to 1.0 seconds by passing `time_limit=1.0` to `search()`.
The output of this program is as follows:
```
Result : [3, 1, 2, 0]
c[0][3] = 44
c[1][1] = 15
c[2][2] = 23
c[3][0] = 11
```
> **NOTE**
> For an expression `f` and an integer `m`, `qbpp.constrain(f, equal=m)` returns an expression `sqr(f - m)`,
> which takes the minimum value 0 if and only if the equality `f == m` is satisfied.
