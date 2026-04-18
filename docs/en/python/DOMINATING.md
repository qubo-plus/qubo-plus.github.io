---
layout: default
nav_exclude: true
title: "Dominating Set"
nav_order: 55
lang: en
hreflang_alt: "ja/python/DOMINATING"
hreflang_lang: "ja"
---

# Minimum Dominating Set Problem
A dominating set of an undirected graph $G=(V,E)$ is a subset $S\subseteq V$ such that every node
$u\in V$ is either in $S$ or adjacent to a vertex in $S$.

Let $N(u)=\lbrace v\in V\mid (u,v)\in E\rbrace$ be the set of neighbors of $u\in V$, and let
$N[u]=\lbrace u\rbrace\cup N(u)$ be the closed neighborhood of $u$.
Then $S$ is a dominating set if and only if

$$
\begin{aligned}
V = \bigcup_{u\in V} N[u].
\end{aligned}
$$

The minimum dominating set problem aims to find the dominating set with the minimum cardinality.
On an $n$-node graph $G=(V,E)$ with nodes labeled $0,1,\ldots,n-1$, we introduce $n$ binary variables $x_0, x_1, \ldots, x_{n-1}$ where $x_i=1$ if and only if node $i$ is included in the dominating set $S$.
Using negated literals $\overline{x}_i$ (where $\overline{x}_i=1$ iff $x_i=0$) simplifies the HUBO constraint formulation, as shown below.

We will show two formulations:
- **HUBO formulation**: the expression may include higher-degree terms.
- **QUBO formulation**: the expression is quadratic, but auxiliary variables are used.

## HUBO formulation of the minimum dominating set problem
For each node $i\in V$, the following condition must be satisfied:
- $x_j=1$ for some $j\in N[i]$ (i.e., node $i$ is dominated).

Node $i$ is NOT dominated only when $x_j=0$ for all $j\in N[i]$, i.e., $\prod_{j\in N[i]}\overline{x}_j=1$.
Thus, we define the constraint as:

$$
\begin{aligned}
\text{constraint} = \sum_{i=0}^{n-1} \prod_{j\in N[i]}\overline{x}_j
\end{aligned}
$$

The degree of the term for node $i$ is $\lvert N[i] \rvert$, so the constraint may not be quadratic.

The objective is to minimize the number of selected nodes:

$$
\begin{aligned}
\text{objective} = \sum_{i=0}^{n-1} x_i
\end{aligned}
$$

Finally, the expression $f$:

$$
\begin{aligned}
f &= \text{objective} + (n+1)\times \text{constraint}
\end{aligned}
$$

The penalty coefficient $n+1$ is a safe choice to prioritize satisfying the dominating-set constraints over minimizing the objective.

## PyQBPP program for the HUBO formulation
The following PyQBPP program finds a solution for a graph with $N=16$ nodes:
```python
import pyqbpp as qbpp

N = 16
edges = [
    (0, 1),  (0, 2),  (1, 3),  (1, 4),  (2, 5),  (2, 6),
    (3, 7),  (3, 13), (4, 6),  (4, 7),  (5, 8),  (6, 8),
    (6, 14), (7, 14), (8, 9),  (9, 10), (9, 12), (10, 11),
    (10, 12),(11, 13),(12, 14),(13, 15),(14, 15)]

adj = [[] for _ in range(N)]
for u, v in edges:
    adj[u].append(v)
    adj[v].append(u)

x = qbpp.var("x", shape=N)

objective = qbpp.sum(x)

constraint = 0
for i in range(N):
    t = ~x[i]
    for j in adj[i]:
        t *= ~x[j]
    constraint += t

f = objective + (N + 1) * constraint
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)

print(f"objective = {sol(objective)}")
print(f"constraint = {sol(constraint)}")
print("Dominating set:", end="")
for i in range(N):
    if sol(x[i]) == 1:
        print(f" {i}", end="")
print()
```
This program first builds the adjacency list `adj` from the edge list `edges`, where each `adj[i]` stores the neighbors of vertex `i`.
It then constructs `constraint`, `objective`, and `f` according to the HUBO formulation.
The Easy Solver is applied to `f` to obtain a solution `sol`.
The values of `objective` and `constraint` for `sol` are printed, followed by the list of selected vertices that form the dominating set.

This program produces the following output:
```
objective = 5
constraint = 0
```

## QUBO formulation and the PyQBPP program
A node $i$ is dominated if $N[i]\cap S$ is not empty.
Using binary variables $x_i$ (where $x_j=1$ means node $j$ is in $S$), this condition is equivalent to the following inequality:

$$
\begin{aligned}
\sum_{j\in N[i]}x_j &\geq 1
\end{aligned}
$$

In PyQBPP notation, we can express the dominating-set constraints by summing the penalty expressions:

$$
\begin{aligned}
\text{constraint} &= \sum_{i=0}^{n-1} \bigl(\sum_{j\in N[i]}x_j \geq 1\bigr)
\end{aligned}
$$

The objective and `f` can be defined in the same way as the HUBO formulation.

The constraint above can be described as a PyQBPP program as follows:
```python
constraint = 0
for i in range(N):
    t = x[i]
    for j in adj[i]:
        t += x[j]
    constraint += qbpp.constrain(t, between=(1, len(adj[i]) + 1))
```
In this code, `t` stores the expression

$$
\sum_{j\in N[i]}x_j
$$

and `qbpp.constrain()` creates a penalty expression for

$$
1\leq \sum_{j\in N[i]}x_j \leq |N[i]|+1,
$$

which takes the minimum value 0 if and only if the inequality is satisfied.
By minimizing `f`, the program finds a minimum dominating set.

Note that PyQBPP requires an explicit finite upper bound for `between`, whereas the C++ version allows `+qbpp::inf`. Using $|N[i]|+1$ is sufficient because $\sum_{j\in N[i]}x_j$ cannot exceed $|N[i]|$.

## Visualization using matplotlib
The following code visualizes the Dominating Set solution:
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
plt.title("Minimum Dominating Set")
plt.savefig("dominating_set.png", dpi=150, bbox_inches="tight")
plt.show()
```

Dominating set vertices are shown in red. Every gray node is adjacent to at least one red node.
