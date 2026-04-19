---
layout: default
nav_exclude: true
title: "Edge Coloring"
nav_order: 60
lang: en
hreflang_alt: "ja/python/EDGE_COLOR"
hreflang_lang: "ja"
---

# Graph Edge Coloring Problem
Given an undirected graph $G=(V,E)$, the **graph edge coloring problem** aims to assign a color to each edge so that no two edges of the same color share a common endpoint.

More specifically, for a set $C$ of colors, the goal is to find an assignment
$\sigma:E\rightarrow C$ such that for any two distinct edges $e$ and $e'$ incident to the same node, we have $\sigma(e)\neq \sigma(e')$.
Equivalently, for every node $u\in V$ and any two distinct neighbors $v\neq v'$
with $(u,v)\in E$ and $(u,v')\in E$ the following must hold:

$$
\sigma((u,v))\neq \sigma((u,v')).
$$


The graph edge coloring problem can be formulated easily as a QUBO expression.
Let $V=\lbrace 0,1,\ldots,n−1\rbrace$ and $C=\lbrace 0,1,\ldots,m−1\rbrace$.
We assign unique IDs $0,1,\ldots,s−1$ to the $s=|E|$ edges, and let $(u_i,v_i)$ denote the $i$-th edge.

We introduce an $s\times m$ matrix $X=(x_{i,j})$ of binary variables, where
$x_{i,j}=1$ if and only if edge $(u_i,v_i)$ is assigned color $j$.

### One-hot constraint
Since exactly one color must be assigned to each edge, each row of
$X$ must be one-hot:

$$
\begin{aligned}
  \text{onehot}&= \sum_{i=0}^{s-1}\bigr(\sum_{j=0}^{m-1}x_{i,j}==1\bigl)\\
   &=\sum_{i=0}^{s-1}\bigr(1-\sum_{j=0}^{m-1}x_{i,j}\bigl)^2
\end{aligned}
$$

### Incident edges must differ
For each node, any pair of distinct incident edges must not be assigned the same color. This can be penalized as follows:

$$
\begin{aligned}
  \text{different}&= \sum_{u\in V}\sum_{\substack{i<k\\ i,k\in I(u)}}x_i\cdot x_k\\
   &=\sum_{u\in V}\sum_{\substack{i<k\\ i,k\in I(u)}}\sum_{j=0}^{m-1}x_{i,j}x_{k,j}
\end{aligned}
$$

where $I(u)\subseteq \lbrace 0,1,\ldots,s−1\rbrace$ denotes the set of edge IDs incident to node $u$.

## QUBO objective
By combining these expressions, we obtain the QUBO objective function:

$$
\begin{aligned}
  f &= \text{onehot}+\text{different}
\end{aligned}
$$

This objective attains the minimum value 0 if and only if a valid
edge coloring of the graph exists.

## PyQBPP formulation
It is known that the edge chromatic number of a simple graph is either $\Delta$ or $\Delta+1$, where $\Delta$ is the maximum degree of the graph. The following PyQBPP program attempts to find an edge coloring of a graph with $n$ nodes and $s$ edges using $m=\Delta$ colors:
{% raw %}
```python
import pyqbpp as qbpp

n = 16
edges = [
    (0, 1),  (0, 2),  (0, 4),  (1, 3),  (1, 4),  (1, 7),  (2, 5),
    (2, 6),  (3, 7),  (3, 13), (3, 15), (4, 6),  (4, 7),  (4, 14),
    (5, 8),  (6, 8),  (6, 14), (7, 14), (7, 15), (8, 9),  (8, 12),
    (9, 10), (9, 11), (9, 12), (10, 11),(10, 12),(10, 13),(10, 14),
    (10, 15),(11, 13),(12, 14),(13, 15),(14, 15)]

adj = [[] for _ in range(n)]
for i, (u, v) in enumerate(edges):
    adj[u].append(i)
    adj[v].append(i)

max_degree = max(len(neighbors) for neighbors in adj)
m = max_degree

s = len(edges)
x = qbpp.var("x", shape=(s, m))

onehot = qbpp.sum(qbpp.constrain(qbpp.vector_sum(x), equal=1))
different = 0
for i in range(n):
    for u in adj[i]:
        for v in adj[i]:
            if u < v:
                different += qbpp.sum(x[u] * x[v])

f = onehot + different

f.simplify_as_binary()
solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=0)

print(f"colors = {m}")
print(f"onehot = {sol(onehot)}")
print(f"different = {sol(different)}")

# Extract the color assigned to each edge (returns -1 if the row is not one-hot)
edge_color = [next((j for j in range(m) if sol(x[i][j]) == 1), -1)
              for i in range(s)]
for i in range(s):
    print(f"Edge {edges[i]}: color {edge_color[i]}")
```
{% endraw %}
In this program, we first build the incidence list `adj`, where `adj[i]` stores the indices of edges incident to node `i`.
We then compute the maximum degree $\Delta$ and set `m=`$\Delta$.
Next, we define an `s`$\times$`m` matrix `x` of binary variables, where `x[i][j]=1` means that edge `i` is assigned color `j`.
We construct the expressions `onehot`, `different`, and `f` as follows:
- `onehot` enforces that each edge is assigned exactly one color, using `qbpp.constrain(..., equal=1)` on each row via `qbpp.vector_sum(x)`.
- `different` penalizes pairs of edges that share an endpoint and are assigned the same color, using `x[u] * x[v]` to form the elementwise product of the two rows and `qbpp.sum()` to sum across the `m` color columns.
- `f = onehot + different` is the QUBO objective, which attains the minimum value 0 if and only if a valid `m`-edge-coloring is found.

We solve the resulting QUBO using the Easy Solver with `target_energy=0`, and store the solution in `sol`. We then print the values of `onehot` and `different` evaluated at `sol`.

We also compute `edge_color`, which stores the color assigned to each edge, by scanning each row of `sol(x)` and recording the position of the 1. If a row is not a valid one-hot vector, `-1` is recorded instead.

This program produces the following output:
```
colors = 6
onehot = 0
different = 0
```
Therefore, a valid edge coloring using `m = 6` colors is found.

## Visualization using matplotlib
The following code visualizes the Edge Coloring solution. Each edge is drawn in the color assigned by the solver, cycling through a fixed palette:
```python
import matplotlib.pyplot as plt
import networkx as nx

G = nx.Graph()
G.add_nodes_from(range(n))
G.add_edges_from(edges)
pos = nx.spring_layout(G, seed=42)

palette = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c",
           "#e67e22", "#2c3e50"]
edge_color_idx = [next((k for k in range(m) if sol(x[i][k]) == 1), 0)
                  for i in range(len(edges))]
edge_colors = [palette[c % len(palette)] for c in edge_color_idx]
nx.draw(G, pos, with_labels=True, node_color="#d5dbdb", node_size=400,
        font_size=9, edge_color=edge_colors, width=2.5)
plt.title(f"Edge Coloring ({m} colors)")
plt.savefig("edge_color.png", dpi=150, bbox_inches="tight")
plt.show()
```

Each edge is colored according to its assigned color, so that no two edges sharing an endpoint have the same color.
