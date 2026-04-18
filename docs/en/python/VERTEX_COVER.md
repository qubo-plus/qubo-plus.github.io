---
layout: default
nav_exclude: true
title: "Vertex Cover"
nav_order: 54
lang: en
hreflang_alt: "ja/python/VERTEX_COVER"
hreflang_lang: "ja"
---

# Minimum Vertex Cover Problem
A **vertex cover** of an undirected graph $G=(V,E)$ is a subset
$S\subseteq V$ such that, for every edge $(u,v)\in E$, at least one of its endpoints belongs to $S$.
The **minimum vertex cover problem** is to find a vertex cover with minimum cardinality.

We can formulate this problem as a QUBO expression.
For an $n$-node graph $G=(V,E)$ whose nodes are labeled $0,1,\ldots,n−1$,
we introduce $n$ binary variables $x_0,x_1,\ldots, x_{n-1}$, where $x_i=1$ if and only if node
$i$ is selected (i.e., $i\in S$).

Using negated literals $\overline{x}_i$ (where $\overline{x}_i=1$ iff $x_i=0$),
we define the following penalty term, which becomes 0 if and only if every edge is covered:

$$
\begin{aligned}
\text{constraint} &= \sum_{(i,j)\in E} \overline{x}_i\,\overline{x}_j
\end{aligned}
$$

For an edge $(i,j)$, the product $\overline{x}_i\,\overline{x}_j$ equals 1 only when neither endpoint is selected, meaning the edge is uncovered. Therefore, the sum counts the number of uncovered edges.

Equivalently, since the condition $1\leq x_i+x_j\leq 2$ means that one or both endpoints are selected, we can write a QUBO++-style formulation as:

$$
\begin{aligned}
\text{constraint'} &= \sum_{(i,j)\in E} (1\leq x_i+x_j\leq 2)
\end{aligned}
$$

The objective is to minimize the number of selected vertices:

$$
\begin{aligned}
\text{objective} &= \sum_{i=0}^{n-1}x_i
\end{aligned}
$$

Finally, the QUBO expression $f$ is given by:

$$
\begin{aligned}
f &= \text{objective} + 2\times \text{constraint}, \text{or}\\
  &= \text{objective} + \text{constraint'}
\end{aligned}
$$

The penalty coefficient 2 is used to prioritize satisfying the constraint over minimizing the objective.

## PyQBPP program for the minimum vertex cover problem
The following PyQBPP program solves the minimum vertex cover problem for a graph with $N=16$ nodes:

```python
import pyqbpp as qbpp

N = 16
edges = [
    (0, 1),  (0, 2),  (1, 3),  (1, 4),  (2, 5),  (2, 6),
    (3, 7),  (3, 13), (4, 6),  (4, 7),  (5, 8),  (6, 8),
    (6, 14), (7, 14), (8, 9),  (9, 10), (9, 12), (10, 11),
    (10, 12),(11, 13),(12, 14),(13, 15),(14, 15)]

x = qbpp.var("x", shape=N)

objective = qbpp.sum(x)
constraint = qbpp.sum([~x[u] * ~x[v] for u, v in edges])
f = objective + constraint * 2
f.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()

print(f"objective = {sol(objective)}")
print(f"constraint = {sol(constraint)}")
print("Selected nodes:", end="")
for i in range(N):
    if sol(x[i]) == 1:
        print(f" {i}", end="")
print()
```
In this program, `objective`, `constraint`, and `f` are constructed according to the formulation above.
The Exhaustive Solver is applied to `f` to search for an optimal solution.

This program prints the following output:
```
objective = 9
constraint = 0
```
An optimal solution with objective value 9 and constraint value 0 is obtained.

## Visualization using matplotlib
The following code visualizes the Vertex Cover solution and saves it as `vertex_cover.png`:
```python
import matplotlib.pyplot as plt
import networkx as nx

G = nx.Graph()
G.add_nodes_from(range(N))
G.add_edges_from(edges)
pos = nx.spring_layout(G, seed=42)

colors = ["#e74c3c" if sol(x[i]) == 1 else "#d5dbdb" for i in range(N)]
nx.draw(G, pos, with_labels=True, node_color=colors, node_size=400,
        font_size=9, edge_color="#888888", width=1.2)
plt.title("Minimum Vertex Cover")
plt.savefig("vertex_cover.png", dpi=150, bbox_inches="tight")
plt.show()
```

Cover vertices are shown in red. Every edge has at least one red endpoint, confirming that the selected subset is a valid vertex cover.
