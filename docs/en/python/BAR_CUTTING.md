---
last_modified: 2026-10-23
layout: default
nav_exclude: true
title: "Cutting Stock"
nav_order: 73
lang: en
hreflang_alt: "ja/python/BAR_CUTTING"
hreflang_lang: "ja"
---

# Cutting Stock Problem
Suppose that we are given $M$ identical bars of fixed length $L$, and a set of $N$ orders specified by pairs $(l_j,c_j)$
($0\leq j\leq N-1$), where $l_j$ is the required length and $c_j$ is the required quantity of order $j$.
The **cutting stock problem** aims to determine how the $M$ bars can be cut to satisfy all orders.

In general, the cutting stock problem is formulated as a minimization problem that seeks to minimize the number of used bars.
For simplicity, in this example we consider the feasibility problem of determining whether the $M$ bars can fulfill all $N$ orders.


Let $x_{i,j}$ ($0\leq i\leq M-1, 0\leq j\leq N-1$) denote the number of pieces of order $j$ cut from bar $i$.
The following constraints must be satisfied.

### Order Constraint:
For each order $j$, the total number of pieces assigned across all bars must equal $c_j$:

$$
\begin{aligned}
 \sum_{i=0}^{M-1}x_{i,j} &= c_j & &(0\leq j\leq N-1)
\end{aligned}
$$

### Bar Constraint
For each bar $i$, the total length of the assigned pieces must not exceed $L$:

$$
\begin{aligned}
 \sum_{j=0}^{N-1}l_jx_{i,j} &\leq  L & &(0\leq i\leq M-1)
\end{aligned}
$$

## PyQBPP program
The following PyQBPP program finds a feasible cutting plan using
$M=6$ bars of length $L=60$ and the following $N=4$ orders:

| Order $j$ | 0 | 1 | 2 | 3 |
|:---:|:---:|:---:|:---:|:---:|
| Length $l_j$ | 13 | 23 | 8 | 11 |
| Quantity $c_j$ | 10 | 4 | 8 | 6 |

The PyQBPP program for this cutting stock problem is as follows:

```python
import pyqbpp as qbpp

L = 60
l = qbpp.array([13, 23, 8, 11])
c = qbpp.array([10, 4, 8, 6])
N = len(l)
M = 6

# Create integer variables x[i][j] for pieces of order j cut from bar i
upper = [[c[j] for j in range(N)] for i in range(M)]
x = qbpp.var("x", shape=(M, N), between=(0, upper))

# Order constraint: total pieces for each order must equal c[j]
order_fulfilled_count = qbpp.vector_sum(x, axis=0)
order_constraint = order_fulfilled_count == c

# Bar constraint: total length used in each bar must not exceed L
bar_length_used = qbpp.expr(shape=M)
for i in range(M):
    bar_length_used[i] = qbpp.sum(x[i] * l)
bar_constraint = (0 <= bar_length_used) & (qbpp.same <= L)

f = qbpp.sum(order_constraint) + qbpp.sum(bar_constraint)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=10.0, target_energy=0)

for i in range(M):
    pieces = "  ".join(str(sol(x[i][j])) for j in range(N))
    used = sol(bar_length_used[i])
    print(f"Bar {i}:  {pieces}   used = {used}, waste = {L - used}")

for j in range(N):
    fulfilled = sol(order_fulfilled_count[j])
    print(f"Order {j} fulfilled = {fulfilled}, required = {c[j]}")
```
The program creates an `M`$\times$`N` matrix `x` of bounded integer variables.
`upper` is an `M`$\times$`N` nested list whose entry `upper[i][j]` is `c[j]`; passing it as the upper bound in `qbpp.var("x", shape=(M, N), between=(0, upper))` makes each entry `x[i][j]` take a non-negative integer value no greater than `c[j]`.

The constraints are defined as follows:
- `order_fulfilled_count`: an array of $N$ expressions obtained by summing each column of `x` with `qbpp.vector_sum(x, axis=0)`, where `order_fulfilled_count[j]` represents the total number of pieces produced for order $j$.
- `order_constraint`: an array of $N$ constraint expressions enforcing `order_fulfilled_count[j] == c[j]` for all $j$.
- `bar_length_used`: an array of $M$ expressions where `bar_length_used[i]` represents the total length `qbpp.sum(x[i] * l)` used in bar $i$.
- `bar_constraint`: an array of $M$ constraint expressions enforcing `0 <= bar_length_used[i] <= L` for all $i$.
- `f`: the sum of all constraint expressions, taken with `qbpp.sum()`. After calling `f.simplify_as_binary()`, the Easy Solver searches for a solution with target energy 0 (i.e., all constraints satisfied).

The following output is an example feasible solution:
```
Bar 0:  2  0  0  3   used = 59, waste = 1
Bar 1:  4  0  1  0   used = 60, waste = 0
Bar 2:  1  1  3  0   used = 60, waste = 0
Bar 3:  0  0  4  2   used = 54, waste = 6
Bar 4:  2  1  0  1   used = 60, waste = 0
Bar 5:  1  2  0  0   used = 59, waste = 1
Order 0 fulfilled = 10, required = 10
Order 1 fulfilled = 4, required = 4
Order 2 fulfilled = 8, required = 8
Order 3 fulfilled = 6, required = 6
```
We observe that all $N=4$ orders are fulfilled using $M=6$ bars.

If we set $M=5$, the solver returns the following infeasible solution, in which not all orders are satisfied:
```
Bar 0:  4  0  1  0   used = 60, waste = 0
Bar 1:  0  0  6  1   used = 59, waste = 1
Bar 2:  2  1  0  1   used = 60, waste = 0
Bar 3:  2  0  0  3   used = 59, waste = 1
Bar 4:  1  2  0  0   used = 59, waste = 1
Order 0 fulfilled = 9, required = 10
Order 1 fulfilled = 3, required = 4
Order 2 fulfilled = 7, required = 8
Order 3 fulfilled = 5, required = 6
```

## Using `qbpp.cons()` for the constraints

The order and bar constraints can also be marked as constraints with
`qbpp.cons()`. The changes are to wrap the arrays of constraints in `qbpp.cons()`
and to declare the integer variables with `integer=` as [native integer variables](INTEGER),
which are not expanded into binary variables and are searched as integers by the solver.
Because `qbpp.cons()` already sums an array of constraints, the `qbpp.sum(...)` wrappers
are dropped; the rest of the program, including the `sol(bar_length_used[i])`
and `sol(order_fulfilled_count[j])` reporting, stays the same:
```python
import pyqbpp as qbpp

L = 60
l = qbpp.array([13, 23, 8, 11])
c = qbpp.array([10, 4, 8, 6])
N = len(l)
M = 6

# Create integer variables x[i][j] for pieces of order j cut from bar i
upper = [[c[j] for j in range(N)] for i in range(M)]
x = qbpp.var("x", shape=(M, N), integer=(0, upper))

# Order constraint: total pieces for each order must equal c[j]
order_fulfilled_count = qbpp.vector_sum(x, axis=0)
order_constraint = qbpp.cons(order_fulfilled_count == c)

# Bar constraint: total length used in each bar must not exceed L
bar_length_used = qbpp.expr(shape=M)
for i in range(M):
    bar_length_used[i] = qbpp.sum(x[i] * l)
bar_constraint = qbpp.cons((0 <= bar_length_used) & (qbpp.same <= L))

f = order_constraint + bar_constraint
f.simplify()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=10.0, target_energy=0)

for i in range(M):
    pieces = "  ".join(str(sol(x[i][j])) for j in range(N))
    used = sol(bar_length_used[i])
    print(f"Bar {i}:  {pieces}   used = {used}, waste = {L - used}")

for j in range(N):
    fulfilled = sol(order_fulfilled_count[j])
    print(f"Order {j} fulfilled = {fulfilled}, required = {c[j]}")
```
The program finds a feasible cutting plan, for example:
```
Bar 0:  3  0  1  1   used = 58, waste = 2
Bar 1:  2  1  0  1   used = 60, waste = 0
Bar 2:  3  0  1  1   used = 58, waste = 2
Bar 3:  1  2  0  0   used = 59, waste = 1
Bar 4:  1  1  3  0   used = 60, waste = 0
Bar 5:  0  0  3  3   used = 57, waste = 3
Order 0 fulfilled = 10, required = 10
Order 1 fulfilled = 4, required = 4
Order 2 fulfilled = 8, required = 8
Order 3 fulfilled = 6, required = 6
```
The two formulations are equivalent; wrapping the constraints in `qbpp.cons()`
lets the bundled solvers handle them as constraints. `f.cons(sol)` reports the
number of violated constraints (`0` for a feasible plan).
