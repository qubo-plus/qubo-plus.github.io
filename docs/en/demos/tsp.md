---
last_modified: 2026-11-17
layout: demo
title: "TSP Solver Online: Traveling Salesman with QUBO++"
description: "Place up to 32 cities in your browser and find the shortest tour. The traveling salesman problem is written with the structural constraint cycle() of QUBO++ and solved by its EasySolver; the tour is redrawn each time a shorter one is found."
lang: en
hreflang_alt: "ja/demos/tsp/"
hreflang_lang: "ja"
permalink: /en/demos/tsp/
nav_exclude: true
math: true
image: /assets/demos/og/tsp.png
demo_id: tsp
heading: "Traveling Salesman Problem Solver (QUBO++)"
lead: "Click to place cities and press Solve. The tour is redrawn each time the QUBO++ solver finds a shorter one."
app_name: "TSP Solver (QUBO++ demo)"
docs_links:
  - label: "C++ (QUBO++)"
    url: "/en/TSP#formulation-with-the-structural-constraint-cycle"
  - label: "Python (PyQBPP)"
    url: "/en/python/TSP#formulation-with-the-structural-constraint-cycle"
---

## How to use

- Click the board to place a city (up to 32), and drag a city to move it.
  **Clear** removes all cities.
- **Time** sets the search time; the public demo stops the search after at most 10 seconds.
- Press **Solve** (at least 3 cities are needed).
  The tour is redrawn whenever the solver finds a shorter one.
  The result is the shortest tour found within the time limit; it is not guaranteed to be optimal.
- City 0 (green) is the start of the tour.
  Below the board you can see the 0/1 variable matrix ($x_{i,j}=1$ means the tour goes from city $i$ to city $j$)
  and the expression that was solved.

The demo runs on AWS Lambda with limited resources;
QUBO++ on a desktop PC is several times faster.

## The model

The model uses a binary variable $x_{i,j}$ ($i \neq j$) that is 1 when the tour goes from city $i$ to city $j$.
With the distance $d_{i,j}$ between cities $i$ and $j$ (the Euclidean distance rounded to an integer),
the expression to minimize is just

$$
\sum_{i\neq j} d_{i,j}\,x_{i,j} .
$$

The condition that the arrows $i\to j$ of the variables equal to 1 form one tour visiting every city exactly once
is added with the structural constraint `qbpp.cycle(x)` of QUBO++.
The solver searches only over tours, so every solution is a tour, and no penalty weight has to be chosen.
The model is solved by the EasySolver of QUBO++.

## The program

With PyQBPP, the Python version of QUBO++, the model takes a few lines.
This program finds a tour of nine cities:

```python
import math
import pyqbpp as qbpp

nodes = [(10, 12),  (33, 125),  (12, 226),
         (121, 11), (108, 142), (111, 243),
         (220, 4),  (210, 113), (211, 233)]
n = len(nodes)

def dist(i, j):
    dx = nodes[i][0] - nodes[j][0]
    dy = nodes[i][1] - nodes[j][1]
    return round(math.sqrt(dx * dx + dy * dy))

x = qbpp.var("x", shape=(n, n))
f = 0
for i in range(n):
    for j in range(n):
        if i != j:
            f += dist(i, j) * x[i][j]
f += qbpp.cycle(x)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)

# Follow the arrows from city 0 to get the tour
tour, v = [0], 0
while True:
    v = next(j for j in range(n) if j != v and sol(x[v][j]) == 1)
    if v == 0:
        break
    tour.append(v)
print("length =", sol.energy)
print("tour =", tour)
```

The [TSP page](/en/python/TSP#formulation-with-the-structural-constraint-cycle) ([C++ version](/en/TSP#formulation-with-the-structural-constraint-cycle)) explains this program.
The same page also shows the model with a 0/1 matrix of positions and cities and penalty terms.
The [structural constraints page](/en/python/STRUCTURAL) explains `qbpp.cycle()` in detail.

## Run it on your computer

PyQBPP runs on Linux (x86-64 and ARM64) and on Windows through WSL:

```bash
pip install pyqbpp
```

See [Installation](/en/python/INSTALL) for details,
and the [other demos](/en/DEMOS) for more problems solved with QUBO++.
