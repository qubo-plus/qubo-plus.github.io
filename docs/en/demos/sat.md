---
last_modified: 2026-10-08
layout: demo
title: "SAT Solver Online: Boolean Satisfiability as HUBO"
description: "Build a CNF formula in your browser or generate a random k-SAT instance, and solve it with QUBO++. Each clause becomes one product term, so the formula is solved directly as a HUBO model; compare with the exhaustive solver."
lang: en
hreflang_alt: "ja/demos/sat/"
hreflang_lang: "ja"
permalink: /en/demos/sat/
nav_exclude: true
math: true
image: /assets/demos/og/sat.png
demo_id: sat
heading: "SAT Solver (HUBO)"
lead: "Enter clauses or generate a random k-SAT formula, then press Solve. Each clause becomes one product term of a HUBO model, and QUBO++ looks for an assignment that satisfies every clause."
app_name: "SAT Solver (QUBO++ demo)"
docs_links:
  - label: "C++ (QUBO++)"
    url: /en/SAT
  - label: "Python (PyQBPP)"
    url: /en/python/SAT
---

## How to use

- The table has one row per clause and one column per variable ($x_0, x_1, \ldots$).
  Click a cell to cycle it through empty, **+** (the literal $x_i$) and **−** (the literal $\lnot x_i$).
  **×** removes the clause.
- **+ Variable** / **− Variable** change the number of variables (2 to 24), and **+ Clause** adds an empty clause.
  **+ Random** / **− Random** add or remove the given number of random literals.
  **Random k-SAT** refills the current clauses with $k$ different variables each, with random signs;
  the result may be unsatisfiable.
- **Solver**: **ABS3 (CPU)** searches heuristically for the given **Time**
  (at most 10 seconds on the public demo, and it stops as soon as every clause is satisfied);
  **Exhaustive** checks all $2^n$ assignments.
- After solving, the table shows the assignment (T/F) and marks each clause SAT or UNSAT.
  Below it are the HUBO expression that was solved and the same expression
  with the negated literals expanded.

The demo runs on AWS Lambda with limited resources;
QUBO++ on a desktop PC is several times faster.

## How a formula becomes a HUBO model

The demo encodes **True as 0 and False as 1**.
Then a positive literal $x$ is False exactly when $x=1$,
and a negative literal $\lnot x$ is False exactly when $\overline{x}=1$, where $\overline{x}=1-x$.
A clause such as $(x_0 \lor \lnot x_1 \lor x_2)$ is violated only when all of its literals are False,
that is, exactly when the product

$$
x_0\,\overline{x_1}\,x_2
$$

is 1. The sum of these products over all clauses is the number of violated clauses,
so an assignment with value 0 satisfies the formula.

A clause with $k$ literals gives a term of degree $k$,
so the model is a HUBO (Higher-order Unconstrained Binary Optimization) rather than a QUBO.
QUBO++ solves it directly, without reducing it to a QUBO with auxiliary variables,
and keeps the negated literals $\overline{x}$ as they are.
The second expression below the demo shows what happens if every $\overline{x}$ is expanded to $1-x$:
each clause with negated literals turns into several terms.

## The program

In PyQBPP, the Python version of QUBO++, a clause is written as the product of its literals,
with `~x` for a negated literal.
These two lines are from the program on the [SAT page](/en/python/SAT):

```python
c0 = x[0] * x[1] * x[2]
c1 = ~x[0] * x[3] * x[4]
```

The first line is the clause $(x_0 \lor x_1 \lor x_2)$ and the second is $(\lnot x_0 \lor x_3 \lor x_4)$.
The [SAT page](/en/python/SAT) shows the whole program and its output;
the [C++ version](/en/SAT) is also available.

## Run it on your computer

PyQBPP runs on Linux (x86-64 and ARM64) and on Windows through WSL:

```bash
pip install pyqbpp
```

See [Installation](/en/python/INSTALL) for details,
and the [other demos](/en/DEMOS) for more problems solved with QUBO++.
