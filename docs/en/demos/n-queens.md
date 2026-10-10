---
last_modified: 2026-10-08
layout: demo
title: "N-Queens Solver Online: QUBO Demo"
description: "Solve the N-Queens puzzle (N = 4 to 32) in your browser. The puzzle is written as a QUBO model with QUBO++ and solved by its EasySolver. Fix some queens yourself and let the solver complete the board."
lang: en
hreflang_alt: "ja/demos/n-queens/"
hreflang_lang: "ja"
permalink: /en/demos/n-queens/
nav_exclude: true
math: true
image: /assets/demos/og/n-queens.png
demo_id: nqueen
heading: "N-Queens Puzzle Solver (QUBO)"
lead: "Place N queens on an N×N board so that no two attack each other. QUBO++ turns the puzzle into a QUBO model and its EasySolver searches for a placement in a few seconds."
app_name: "N-Queens Solver (QUBO++ demo)"
docs_links:
  - label: "C++ (QUBO++)"
    url: /en/QUEENS
  - label: "Python (PyQBPP)"
    url: /en/python/QUEENS
---

## How to use

- **N** sets the board size (4 to 32), and **Time** sets the time limit of the search.
- Click a square to place a queen yourself; click it again to remove it.
  A square attacked by a queen you placed cannot be chosen.
- Press **Solve**. The solver stops as soon as it finds a placement with no attacks,
  or when the time limit is reached.
- Hover over a queen to see the lines it attacks.
  If no valid placement is found, the conflicting queens are shown in red.
  Some sets of fixed queens cannot be completed at all.
- Below the board you can see the 0/1 variable matrix of the solution and,
  for N ≤ 12, the QUBO expression that was solved.

The demo runs on AWS Lambda with limited resources;
QUBO++ on a desktop PC is several times faster.

## How the puzzle becomes a QUBO model

QUBO (Quadratic Unconstrained Binary Optimization) asks for 0/1 values of variables
that minimize a polynomial of degree at most 2.
It is the problem format of quantum annealers and Ising machines;
QUBO++ solves it on ordinary CPUs and GPUs.
The demo uses one binary variable $x_{i,j}$ per square:
$x_{i,j}=1$ if a queen is placed at row $i$ and column $j$.
The polynomial to minimize is the sum of the following penalties.

- Exactly one queen in each row $i$: $\left(\sum_{j} x_{i,j}-1\right)^2$
- Exactly one queen in each column $j$: $\left(\sum_{i} x_{i,j}-1\right)^2$
- At most one queen on each diagonal and anti-diagonal $D$: $S_D(S_D-1)$, where $S_D$ is the number of queens on $D$

Each penalty is 0 when its condition holds and positive otherwise,
so the placements with value 0 are exactly the solutions of the puzzle.
The queens you fix are substituted into the model before solving:
their variables become 1 and the squares they attack become 0, which makes the model smaller.

## The program

With PyQBPP, the Python version of QUBO++, the model above takes a few lines.
This program prints a solution for $N=8$:

```python
import pyqbpp as qbpp

n = 8
x = qbpp.var("x", shape=(n, n))

f = qbpp.sum(qbpp.vector_sum(x, axis=0) == 1) + \
    qbpp.sum(qbpp.vector_sum(x, axis=1) == 1)

m = 2 * n - 3
a = qbpp.expr(shape=m)
b = qbpp.expr(shape=m)

for i in range(m):
    k = i + 1
    for r in range(n):
        c = k - r
        if 0 <= c < n:
            a[i] += x[r][c]

    d = i - (n - 2)
    for r in range(n):
        c = r + d
        if 0 <= c < n:
            b[i] += x[r][c]

f += qbpp.sum((0 <= a) & (qbpp.same <= 1))
f += qbpp.sum((0 <= b) & (qbpp.same <= 1))

f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=0)
for i in range(n):
    for j in range(n):
        print("Q" if sol(x[i][j]) == 1 else ".", end="")
    print()
```

The [N-Queens page](/en/python/QUEENS) explains the program line by line;
the [C++ version](/en/QUEENS) is also available.

## Run it on your computer

PyQBPP runs on Linux (x86-64 and ARM64) and on Windows through WSL:

```bash
pip install pyqbpp
```

See [Installation](/en/python/INSTALL) for details,
and the [other demos](/en/DEMOS) for more problems solved with QUBO++.
