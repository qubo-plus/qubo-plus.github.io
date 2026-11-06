---
last_modified: 2026-10-10
layout: default
nav_exclude: true
title: "Shortest Path"
nav_order: 102
lang: en
hreflang_alt: "ja/python/SHORTEST_PATH"
hreflang_lang: "ja"
---

# Shortest Path Problem
Given an undirected graph $G=(V,E)$ with edge weights and two nodes $s$ and $t$, the **shortest path problem** asks for a path from $s$ to $t$ whose total edge weight (the length of the path) is minimum.
All edge weights are assumed to be positive.

The figure below shows a graph with 12 nodes and 24 edges, and the shortest path (red) from node 0 to node 11.
The numbers on the edges are their weights.

<p align="center">
  <img src="../../images/shortest_path.svg" alt="A graph and the shortest path from node 0 to node 11" width="80%">
</p>

Shortest paths can be found efficiently by Dijkstra's algorithm.
This page presents a formulation that represents the shortest path with binary variables selecting edges and constraints on node degrees.
With this formulation, conditions that Dijkstra's algorithm cannot handle as is can be added simply as constraints (see [Limiting the number of edges](#limiting-the-number-of-edges)).

## Formulation
Number the edges $0,1,\ldots,m-1$, and let $w_i$ be the weight of edge $i$.
We introduce $m$ binary variables $x_0, x_1, \ldots, x_{m-1}$, where $x_i=1$ means that edge $i$ is selected for the path.

The number of selected edges incident to node $v$ is called the degree of $v$ and denoted by $\deg(v)$:

$$
\deg(v) = \sum_{i\,:\,v \text{ is an endpoint of edge } i} x_i
$$

To make the selected edges form a path from $s$ to $t$, we impose the following constraints:

$$
\begin{aligned}
\deg(s) &= 1, \quad \deg(t) = 1, \\
\deg(v) &\in \lbrace 0, 2\rbrace && (v \neq s, t)
\end{aligned}
$$

Since $s$ and $t$ are the ends of the path, exactly one selected edge is incident to each of them.
Every other node has two selected edges if the path passes through it, and none otherwise.

The objective is the total weight of the selected edges:

$$
\text{objective} = \sum_{i=0}^{m-1} w_i x_i
$$

### Why no cycles appear
A selection of edges satisfying the constraints above is not necessarily just a path from $s$ to $t$.
Since every degree is at most 2, the selected edges split into paths and cycles.
Since $s$ and $t$ are the only nodes of degree 1, there is exactly one path, and its ends are $s$ and $t$.
In other words, a selection satisfying the constraints is one path from $s$ to $t$ plus some cycles that share no node with the path.

Since the total weight of a cycle is positive, removing a cycle keeps the constraints satisfied and decreases the objective.
Therefore, a selection minimizing the objective contains no cycle and is a shortest path from $s$ to $t$.

### The expression
We declare the constraints with [`qbpp.cons()`](CONSTRAINTS), multiply them by a weight $P$, and add them to the objective:

$$
\begin{aligned}
f &= \text{objective} + P\times\Bigl(\text{cons}\bigl(\deg(s)=1\bigr) + \text{cons}\bigl(\deg(t)=1\bigr) + \sum_{v\neq s,t}\text{cons}\bigl(\deg(v)\in\lbrace 0,2\rbrace\bigr)\Bigr)
\end{aligned}
$$

When a constraint is violated, the square of the violation times the weight is added to the energy.
Since a violation is at least 1, any assignment violating at least one constraint has energy at least $P$.
On the other hand, the energy of an assignment satisfying the constraints is the total weight of the selected edges, which is at most the total weight of all edges.
Therefore, if $P$ is set to "the total weight of all edges + 1", an assignment minimizing $f$ always satisfies the constraints.

## PyQBPP program
The following PyQBPP program finds the shortest path from node 0 to node 11 in the graph shown above:
```python
import pyqbpp as qbpp

N = 12
s, t = 0, 11
edges = [
    (0, 1, 2),  (0, 2, 8),  (0, 3, 5),  (1, 2, 1),  (1, 4, 3),  (1, 5, 6),
    (2, 3, 1),  (2, 5, 8),  (3, 5, 1),  (3, 6, 6),  (4, 5, 5),  (4, 7, 4),
    (5, 6, 8),  (5, 7, 2),  (5, 8, 7),  (6, 8, 9),  (6, 9, 9),  (7, 8, 4),
    (7, 10, 5), (8, 9, 9),  (8, 10, 2), (8, 11, 7), (9, 11, 6), (10, 11, 2)]
M = len(edges)

x = qbpp.var("x", shape=M)

objective = 0
total = 0
for i in range(M):
    a, b, w = edges[i]
    objective += w * x[i]
    total += w

constraint = 0
for v in range(N):
    deg = 0
    for i in range(M):
        a, b, w = edges[i]
        if a == v or b == v:
            deg += x[i]
    if v == s or v == t:
        constraint += qbpp.cons(deg == 1)
    else:
        constraint += qbpp.cons(deg, equal=[0, 2])

f = objective + (total + 1) * constraint
f.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()

print(f"length = {sol(objective)}")
print(f"violated constraints = {f.cons(sol)}")
print("selected edges:", end="")
for i in range(M):
    a, b, w = edges[i]
    if sol(x[i]) == 1:
        print(f" ({a},{b})", end="")
print()
```
In this program, each edge is stored in `edges` as a tuple (endpoint, endpoint, weight).
The first loop builds the objective `objective` and the total weight `total`.
The second loop builds the degree `deg` of each node `v` and adds `qbpp.cons(deg == 1)` to `constraint` if `v` is `s` or `t`, and `qbpp.cons(deg, equal=[0, 2])` otherwise.
`equal=[0, 2]` is a [set of allowed values](CONSTRAINTS#discrete-allowed-value-sets) that is satisfied only when the value is 0 or 2.

Since the Exhaustive Solver checks all assignments, the solution obtained is optimal.
The program prints the length of the path `sol(objective)`, the number of violated constraints `f.cons(sol)`, and the selected edges.

This program produces the following output:
```
length = 14
violated constraints = 0
selected edges: (0,1) (1,2) (2,3) (3,5) (5,7) (7,10) (10,11)
```
The selected edges form the path 0 → 1 → 2 → 3 → 5 → 7 → 10 → 11 of length 2+1+1+1+2+5+2 = 14.
From node 0 to node 3, going around nodes 1 and 2 (weight 4) is shorter than the direct edge (weight 5), so the path zigzags up and down.

Constraints declared with `qbpp.cons()` do not add terms to the expression, so `f` has only the 24 terms of the objective.
With the classic penalty form, $\deg(v)\in\lbrace 0,2\rbrace$ cannot be written directly; a binary variable $y_v$ must be added for each node to write it as $(\deg(v)-2y_v)^2$.

For graphs with many edges, exhaustive search does not finish, so use `qbpp.EasySolver` instead of `qbpp.ExhaustiveSolver` and give `search()` a time limit.
For this graph, the Easy Solver with a time limit of 1 second also finds the same shortest path.

## Limiting the number of edges
The shortest path above uses 7 edges.
Let us find the shortest path that uses at most 5 edges.
Since the number of selected edges is $\sum_i x_i$, we only need to add the following line before building `f`:
```python
constraint += qbpp.cons(qbpp.sum(x) <= 5)
```
This program produces the following output:
```
length = 15
violated constraints = 0
selected edges: (0,3) (3,5) (5,7) (7,10) (10,11)
```
Instead of the three edges around nodes 1 and 2, the path now takes the direct edge 0 → 3, and its length is 15:

<p align="center">
  <img src="../../images/shortest_path_hop.svg" alt="The shortest path using at most 5 edges" width="80%">
</p>

Dijkstra's algorithm cannot handle such a condition as is, but in this formulation it is just one more constraint.
The limit on the number of edges stays satisfied when a cycle is removed, so the argument in [Why no cycles appear](#why-no-cycles-appear) still holds.
The weight $P$ does not need to be changed either.

However, if you add a constraint that may become violated when a cycle is removed, the solution may contain cycles.
For example, if "the path must pass through node $v$" is written as $\deg(v)=2$, it is also satisfied by selecting a cycle through $v$ separately from the path from $s$ to $t$.

## Visualization with matplotlib
The following code visualizes the shortest path:
```python
import matplotlib.pyplot as plt
import networkx as nx

pos = {0: (0, 150),   1: (100, 250), 2: (100, 150),  3: (100, 50),
       4: (200, 250), 5: (200, 150), 6: (200, 50),   7: (300, 250),
       8: (300, 150), 9: (300, 50),  10: (400, 200), 11: (500, 150)}

G = nx.Graph()
for a, b, w in edges:
    G.add_edge(a, b)
weights = {(a, b): w for a, b, w in edges}
path_edges = [(a, b) for i, (a, b, w) in enumerate(edges) if sol(x[i]) == 1]

node_colors = ["#f1c40f" if v in (s, t) else "#d5dbdb" for v in G.nodes]
nx.draw(G, pos, with_labels=True, node_color=node_colors, node_size=400,
        font_size=9, edge_color="#cccccc")
nx.draw_networkx_edges(G, pos, edgelist=path_edges, edge_color="#e74c3c",
                       width=2.5)
nx.draw_networkx_edge_labels(G, pos, edge_labels=weights, font_size=8)
plt.title("Shortest Path")
plt.savefig("shortest_path.png", dpi=150, bbox_inches="tight")
plt.show()
```
`pos` holds the coordinates of the nodes.
The start and end nodes are shown in yellow, the edges of the shortest path in red, and each edge is labeled with its weight.
