---
last_modified: 2026-10-10
layout: demo
title: "Graph Problems Solver Online: 22 Problems as QUBO"
description: "Draw a graph in your browser and solve 22 graph problems with QUBO++: maximum independent set, max-cut, graph coloring, dominating set, Steiner tree, shortest path, Hamiltonian cycle, TSP and more."
lang: en
hreflang_alt: "ja/demos/graph-problems/"
hreflang_lang: "ja"
permalink: /en/demos/graph-problems/
nav_exclude: true
math: true
image: /assets/demos/og/graph-problems.png
demo_id: graph
heading: "Graph Problems Solver (QUBO)"
lead: "Draw or generate a graph, choose one of 22 problems, and press Solve. QUBO++ builds the QUBO model of the chosen problem and shows the solution on the graph as the solver improves it."
app_name: "Graph Problems Solver (QUBO++ demo)"
docs_links:
  - label: "C++ (QUBO++)"
    url: /en/CASE_STUDIES#graph-problems
  - label: "Python (PyQBPP)"
    url: /en/python/CASE_STUDIES#graph-problems
---

## How to use

- **Draw a graph** on the board: click empty space to add a node,
  click two nodes in turn to add or remove the edge between them,
  drag a node to move it, and right-click a node to delete it (up to 32 nodes).
- **Or generate one**: **+NODE** adds random nodes; choose a template
  (Delaunay, unit disk graph, regular, complete) and press **Generate** to connect the existing nodes.
  Cycle, Grid, Hypercube and BinTree replace the whole graph, and **Spread** pushes the nodes apart.
- **Choose the problem.** Some problems take a parameter (number of colors, k, p, number of paths).
  For the s–t problems, Shift-click a node to make it s and Ctrl-click to make it t;
  for the Steiner tree, Shift-click toggles terminals;
  for the shortest path tree, Shift-click sets the root.
- Press **Solve**. The public demo stops the search after at most 10 seconds,
  and earlier for the problems marked in the table below.
  The solution is redrawn whenever the solver improves it.
- Below the board you can see the 0/1 variables and the QUBO (or HUBO) expression that was solved.

The demo runs on AWS Lambda with limited resources;
QUBO++ on a desktop PC is several times faster.

## The 22 problems

| Problem | Goal | Stops early | Docs |
|---|---|---|---|
| Maximum Independent Set | Largest set of vertices with no edge between them | | [MIS](/en/GRAPH) |
| Minimum Vertex Cover | Smallest set of vertices touching every edge | | [Vertex cover](/en/VERTEX_COVER) |
| Maximum Clique | Largest set of pairwise adjacent vertices | | [Clique](/en/MAX_CLIQUE) |
| Minimum Dominating Set | Smallest set such that every vertex is in it or adjacent to it | | [Dominating set](/en/DOMINATING) |
| Densest k-Subgraph | $k$ vertices with the most edges among them | | |
| Maximum Diversity | $k$ points with the largest sum of pairwise distances (no edges needed) | optimum&nbsp;\* | |
| Maximum Matching | Most edges with no shared vertex | perfect matching | [Matching](/en/MAX_MATCHING) |
| Minimum Maximal Matching | Smallest matching that cannot be extended | | [Maximal matching](/en/MINMAX_MATCHING) |
| Steiner Tree | Shortest set of edges connecting the terminals | optimum | |
| Maximum Cut | Two groups with the most edges between them | | [Max-cut](/en/MAXCUT) |
| Minimum Bisection | Two equal halves with the fewest edges between them | | [Bisection](/en/BISECTION) |
| Minimum s–t Cut | Fewest edges whose removal separates s and t | optimum | |
| Clique Partitioning | Groups that are cliques, with the most edges inside the groups | | |
| p-Median | $p$ facilities with the smallest total distance from every vertex to its nearest facility | optimum | |
| Hamiltonian Path | A path that visits every vertex once | when found | |
| Hamiltonian Cycle | A cycle that visits every vertex once | when found | |
| Shortest Path (s→t) | Shortest path from s to t | optimum | [Shortest Path](/en/SHORTEST_PATH) |
| k Disjoint Paths (s→t) | $k$ paths from s to t with no common edge and the smallest total length | optimum | |
| Shortest Path Tree | Shortest paths from the root to all vertices | optimum | |
| Traveling Salesman | Shortest tour visiting every vertex | | [TSP](/en/TSP) |
| Vertex Coloring | Colors with no two adjacent vertices alike | when found | [Coloring](/en/GRAPH_COLOR) |
| Edge Coloring | Colors with no two edges at a vertex alike | when found | [Edge coloring](/en/EDGE_COLOR) |

"optimum": the server computes the optimal value with an exact algorithm
(Dijkstra's algorithm, a maximum flow, a minimum-cost flow, dynamic programming, or enumeration)
and the search stops when it reaches that value
(\* Maximum Diversity only when the number of $k$-subsets is at most $2\times 10^6$).
"when found": the search stops when a valid answer is found.
"perfect matching": the search stops if a matching covering every vertex is found.
The other problems run until the time limit.

## How a graph problem becomes a QUBO model

QUBO (Quadratic Unconstrained Binary Optimization) asks for 0/1 values of variables
that minimize a polynomial of degree at most 2.
It is the problem format of quantum annealers and Ising machines;
QUBO++ solves it on ordinary CPUs and GPUs.

Each problem uses binary variables for the choices it makes:
one per vertex (is it selected?), one per edge, or one per vertex and color.
For example, the maximum independent set uses $x_v=1$ when vertex $v$ is selected and minimizes

$$
-\sum_{v} x_v \;+\; 2\sum_{(u,v)\in E} x_u x_v ,
$$

where the second sum is a penalty for selecting both ends of an edge.
Constraints such as "every vertex is dominated" in the minimum dominating set,
$x_v + \sum_{u \in N(v)} x_u \ge 1$, are written with QUBO++'s `cons()`,
which the solvers handle directly without auxiliary (slack) variables.
All problems are solved by the ABS3 solver of QUBO++ running on the CPU.

The pages listed in the table explain the formulations and the QUBO++ programs in detail.

## Run it on your computer

PyQBPP, the Python version of QUBO++, runs on Linux (x86-64 and ARM64) and on Windows through WSL:

```bash
pip install pyqbpp
```

See [Installation](/en/python/INSTALL) for details,
and the [other demos](/en/DEMOS) for more problems solved with QUBO++.
