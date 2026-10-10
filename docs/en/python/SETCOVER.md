---
last_modified: 2026-10-10
layout: default
nav_exclude: true
title: "Set Cover"
nav_order: 57
lang: en
hreflang_alt: "ja/python/SETCOVER"
hreflang_lang: "ja"
---

# Minimum Set Cover Problem
Let $U$ be a universe set, and let ${\cal 𝐹}=\lbrace S_0, S_1, \ldots S_{m-1}\rbrace$ be a family of subsets of $U$.
A subfamily $\cal S\subseteq \cal F$ is called a **set cover** if it covers all elements of $U$, i.e.,

$$
\begin{aligned}
\bigcup_{S_j\in \cal S}S_j &= U.
\end{aligned}
$$

The **minimum set cover problem** is to find a set cover
$\cal S$ with the minimum cardinality.
Here, we consider the weighted version, where each subset
$S_j$ has a weight $w_j$, and the goal is to find a **set cover with the minimum total weight**.

## Formulation of the minimum set cover problem
Assume that $U=\lbrace 0,1,\ldots, n-1\rbrace$, and $m$ subsets $S_0, S_1, \ldots, S_{m-1}$ are given.
We introduce $m$ binary variables $x_0, x_1, \ldots, x_{m-1}$,
where $x_j=1$ if and only if $S_j\in\cal S$.

For each element $i\in U$, we define:

$$
\begin{aligned}
c_i &=\sum_{j: i\in S_j} x_j && (0\leq i\leq n-1)
\end{aligned}
$$

If $c_i\geq 1$, at least one selected subset $S_j$ covers $i$.
If $c_i=0$, none of the selected subsets covers $i$.
In PyQBPP, the inequality $c_i\geq 1$ for each element is enclosed in [`qbpp.cons()`](CONSTRAINTS) to declare it as a constraint.
When a constraint is violated, the square of the violation multiplied by the weight is added to the energy.

The **objective** is to minimize the total weight of the selected subsets:

$$
\begin{aligned}
\text{objective} &=\sum_{j=0}^{m-1}w_jx_j
\end{aligned}
$$

The expression for the weighted minimum set cover problem is:

$$
\begin{aligned}
f &= \text{objective}+P\times\sum_{i=0}^{n-1}\text{cons}(c_i\geq 1),
\end{aligned}
$$

where $P$ is a sufficiently large positive constant that prioritizes feasibility over the objective.

## PyQBPP program for the minimum set cover problem
The following PyQBPP program solves a weighted minimum set cover instance with $n=10$ elements and $m=8$ subsets:
{% raw %}
```python
import pyqbpp as qbpp

n = 10
cover = [
    [0, 1, 2], [2, 3, 4],       [4, 5, 6],    [6, 7, 8],
    [9, 0, 1], [1, 3, 5, 7, 9], [0, 3, 6, 9], [1, 4, 7, 8]]
cost = qbpp.array([3, 4, 3, 2, 3, 4, 3, 3])
m = len(cover)

x = qbpp.var("x", shape=m)

c = [0 for _ in range(n)]
for i in range(m):
    for j in cover[i]:
        c[j] += x[i]

objective = qbpp.sum(cost * x)

constraint = 0
for j in range(n):
    constraint += qbpp.cons(c[j] >= 1)

f = objective + 1000 * constraint

f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)

sol = solver.search()

print(f"objective = {sol(objective)}")
print(f"violated constraints = {f.cons(sol)}")

for i in range(m):
    if sol(x[i]) == 1:
        sep = ",".join(str(k) for k in cover[i])
        print(f"Set {i}: {{{sep}}} cost = {cost[i]}")
```
{% endraw %}
This program defines an array **`x`** of $m=8$ **binary variables** and a list **`c`** of $n=10$ **expressions**.
Each expression `c[j]` corresponds to an element $j\in U$ and is initialized to 0.
For each subset $S_i$ and each element $j\in S_i$, `x[i]` is added to `c[j]`.
As a result, `c[j]` is the number of selected subsets that cover element `j`.

**`constraint`** is the sum of the constraints `qbpp.cons(c[j] >= 1)` for all `j`.
The weighted **`objective`** is defined as the sum of `cost[i] * x[i]`.
In `f`, the weight of the constraints is 1000 to prioritize feasibility.

Next, the Exhaustive Solver is used to find an optimal solution `sol`.
The program prints the value of `objective` and the number of violated constraints `f.cons(sol)`, and finally lists all selected subsets. For example, the output is as follows:
```
objective = 11
violated constraints = 0
Set 0: {0,1,2} cost = 3
Set 2: {4,5,6} cost = 3
Set 3: {6,7,8} cost = 2
Set 6: {0,3,6,9} cost = 3
```
This output shows that a feasible set cover with total cost 11 is obtained.

If `c[j] >= 1` is written without `qbpp.cons()`, it becomes an ordinary penalty expression and introduces auxiliary variables.
A constraint declared with `qbpp.cons()` introduces no auxiliary variables.

## HUBO formulation with products of negated literals
With [negated literals](NEGATIVE), the covering constraints can also be written as products.
For each element $i\in U$, we define the following expression:

$$
\begin{aligned}
c_i &=\prod_{j: i\in S_j}\bar{x}_j && (0\leq i\leq n-1)
\end{aligned}
$$

If none of the selected subsets contains $i$, then $x_j=0$ for all $j$ such that $i\in S_j$, and thus $c_i=1$.
On the other hand, if at least one selected subset contains $i$, one of the factors $\bar{x}_j$ becomes 0, and thus $c_i=0$.
Therefore, $\sum_{i=0}^{n-1}c_i$ is 0 if and only if all elements are covered, and it can be added to the objective as a penalty as it is.
The part of the program for `c` and `constraint` becomes:
```python
c = [1 for _ in range(n)]  # initialize all elements to 1
for i in range(m):
    for j in cover[i]:
        c[j] *= ~x[i]

constraint = qbpp.sum(c)
```
The degree of `c[j]` is the number of subsets that contain element `j`, so the expression contains terms of degree 3 or higher.
With this modification, the program produces the same optimal solution.
