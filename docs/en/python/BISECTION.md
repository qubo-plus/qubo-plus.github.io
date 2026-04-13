---
layout: default
nav_exclude: true
title: "Graph Bisection"
nav_order: 11
lang: en
hreflang_alt: "ja/python/BISECTION"
hreflang_lang: "ja"
---

# Minimum Graph Bisection Problem

Given an undirected graph $G=(V,E)$ with $n$ nodes (where $n$ is even), the **Minimum Graph Bisection** problem aims to partition the node set $V$ into two disjoint subsets $S$ and $\overline{S}$ of **equal size** ($\lvert S\rvert=\lvert\overline{S}\rvert=n/2$) so that the number of edges crossing the partition is **minimized**.

This problem differs from [Max-Cut](MAXCUT) in two ways:
1. The partition must be **balanced** (equal-sized halves).
2. We **minimize** (rather than maximize) the number of crossing edges.

Minimum Graph Bisection is NP-hard and arises in circuit partitioning, parallel computing, and graph-based data clustering.

## QUBO Formulation

Assume that the nodes are labeled $0,1,\ldots,n-1$.
We introduce $n$ binary variables $x_0, x_1, \ldots, x_{n-1}$, where $x_i=1$ if and only if node $i$ belongs to $S$.

### Objective

The number of edges crossing the partition is:

$$
\text{objective} = \sum_{(i,j)\in E}\Bigl(x_i\overline{x_j} + \overline{x_i}x_j\Bigr)
$$

We want to **minimize** this value.

### Constraint

The partition must be balanced:

$$
\text{constraint} = \Bigl(\sum_{i=0}^{n-1} x_i = \frac{n}{2}\Bigr)
$$

This constraint expression equals 0 when satisfied.

### QUBO expression

The final QUBO expression combines the objective and constraint with a penalty weight $P$:

$$
f = \text{objective} + P \times \text{constraint}
$$

where $P$ must be large enough (e.g., $P = \lvert E\rvert + 1$) to ensure that the balance constraint is always satisfied in an optimal solution.

## PyQBPP program

The following PyQBPP program solves the Minimum Graph Bisection problem for a 16-node graph:

```python
import pyqbpp as qbpp

N = 16
edges = [
    (0, 1),   (0, 2),   (1, 3),   (1, 4),   (2, 5),   (2, 6),   (3, 7),
    (3, 13),  (4, 6),   (4, 7),   (4, 14),  (5, 8),   (6, 8),   (6, 12),
    (6, 14),  (7, 14),  (8, 9),   (9, 10),  (9, 12),  (10, 11), (10, 12),
    (11, 13), (11, 15), (12, 14), (12, 15), (13, 15), (14, 15),
]
M = len(edges)

x = qbpp.var("x", N)

# Objective: number of edges crossing the cut
objective = 0
for i, j in edges:
    objective += x[i] * ~x[j] + ~x[i] * x[j]

# Constraint: exactly N/2 nodes in each partition
constraint = qbpp.sum(x) == N // 2

# Penalty weight: M + 1 ensures constraint is prioritized
f = objective + (M + 1) * constraint
f.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()

print(f"Cut edges = {sol(objective)}")
print(f"constraint = {sol(constraint)}")
```

In this program, the objective counts the number of edges crossing the cut, and the constraint enforces that exactly $N/2$ nodes are in each partition.
The penalty weight $P = M + 1$ ensures that the balance constraint is always satisfied.
Unlike the Max-Cut problem where we negate the objective for maximization, here we minimize the objective directly.

### Output
```
Cut edges = 6
constraint = 0
```

The solver finds a balanced partition with only 6 edges crossing the cut.
