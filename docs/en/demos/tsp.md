---
last_modified: 2026-10-08
layout: demo
title: "TSP Solver Online: Traveling Salesman as QUBO"
description: "Place up to 32 cities in your browser and find a short tour. The traveling salesman problem is written as a QUBO model with QUBO++ and solved by its ABS3 solver; the tour is redrawn each time a shorter one is found."
lang: en
hreflang_alt: "ja/demos/tsp/"
hreflang_lang: "ja"
permalink: /en/demos/tsp/
nav_exclude: true
math: true
image: /assets/demos/og/tsp.png
demo_id: tsp
heading: "Traveling Salesman Problem Solver (QUBO)"
lead: "Click to place cities and press Solve. QUBO++ turns the traveling salesman problem into a QUBO model, and the tour is redrawn each time the solver finds a shorter one."
app_name: "TSP Solver (QUBO++ demo)"
docs_links:
  - label: "C++ (QUBO++)"
    url: /en/TSP
  - label: "Python (PyQBPP)"
    url: /en/python/TSP
---

## How to use

- Click the board to place a city (up to 32), and drag a city to move it.
  **Clear** removes all cities.
- **Time** sets the search time; the public demo stops the search after at most 10 seconds.
- Press **Solve** (at least 3 cities are needed).
  The tour is redrawn whenever the solver finds a shorter one.
  The result is the shortest tour found within the time limit; it is not guaranteed to be optimal.
- City 0 (green) is the start of the tour.
  Below the board you can see the 0/1 variable matrix (row = position in the tour, column = city)
  and the QUBO expression that was solved.

The demo runs on AWS Lambda with limited resources;
QUBO++ on a desktop PC is several times faster.

## How the problem becomes a QUBO model

QUBO (Quadratic Unconstrained Binary Optimization) asks for 0/1 values of variables
that minimize a polynomial of degree at most 2.
It is the problem format of quantum annealers and Ising machines;
QUBO++ solves it on ordinary CPUs and GPUs.

A tour of $n$ cities is a permutation, which the demo encodes with $n^2$ binary variables:
$x_{i,j}=1$ if the $i$-th city of the tour is city $j$.
With the distance $d_{j,k}$ between cities $j$ and $k$
(the Euclidean distance rounded to an integer), the polynomial to minimize is

$$
\sum_{i=0}^{n-1}\sum_{j\neq k} d_{j,k}\,x_{i,j}\,x_{(i+1)\bmod n,\,k}
\;+\;P\sum_{i}\Big(\sum_{j} x_{i,j}-1\Big)^2
\;+\;P\sum_{j}\Big(\sum_{i} x_{i,j}-1\Big)^2 .
$$

The first sum is the length of the tour: $d_{j,k}$ is added exactly when city $j$ is visited
at position $i$ and city $k$ next.
The other two sums are penalties that are 0 exactly when every position holds one city
and every city appears at one position, so that the 0/1 matrix is a permutation.
The weight $P$ is the largest coordinate of the cities (at least 100).
City 0 is fixed at position 0, which removes the rotations of the same tour
and leaves $(n-1)^2$ variables.
The model is solved by the ABS3 solver of QUBO++ running on the CPU.

## The program

With PyQBPP, the Python version of QUBO++, the model takes a few lines.
This program finds a tour of nine cities:

```python
import math
import pyqbpp as qbpp

nodes = [(10, 12),  (33, 125),  (12, 226),
         (121, 11), (108, 142), (111, 243),
         (220, 4),  (210, 113), (211, 233)]

def dist(i, j):
    dx = nodes[i][0] - nodes[j][0]
    dy = nodes[i][1] - nodes[j][1]
    return round(math.sqrt(dx * dx + dy * dy))

n = len(nodes)
x = qbpp.var("x", shape=(n, n))

constraint = qbpp.sum(qbpp.vector_sum(x, axis=1) == 1) + \
             qbpp.sum(qbpp.vector_sum(x, axis=0) == 1)

objective = 0
for i in range(n):
    next_i = (i + 1) % n
    for j in range(n):
        for k in range(n):
            if k != j:
                objective += dist(j, k) * x[i][j] * x[next_i][k]

f = objective + constraint * 1000
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)

# Convert the permutation matrix into a tour (list of node indices)
tour = []
for i in range(n):
    for j in range(n):
        if sol(x[i][j]) == 1:
            tour.append(j)
            break
print(f"Tour: {tour}")
```

The [TSP page](/en/python/TSP) explains the program;
the [C++ version](/en/TSP) is also available.

## Run it on your computer

PyQBPP runs on Linux (x86-64 and ARM64) and on Windows through WSL:

```bash
pip install pyqbpp
```

See [Installation](/en/python/INSTALL) for details,
and the [other demos](/en/DEMOS) for more problems solved with QUBO++.
