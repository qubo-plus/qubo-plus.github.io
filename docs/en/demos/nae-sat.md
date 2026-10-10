---
last_modified: 2026-10-08
layout: demo
title: "NAE-SAT Solver Online: Not-All-Equal SAT as HUBO"
description: "Solve not-all-equal SAT (NAE-SAT) in your browser with QUBO++. Every clause must contain both True and False variables; an optional objective balances or minimizes the number of True variables. The model is solved directly as a HUBO."
lang: en
hreflang_alt: "ja/demos/nae-sat/"
hreflang_lang: "ja"
permalink: /en/demos/nae-sat/
nav_exclude: true
math: true
image: /assets/demos/og/nae-sat.png
demo_id: naesat
heading: "NAE-SAT Solver (HUBO)"
lead: "Check the variables of each clause, choose an objective, and press Solve. A clause is satisfied when its variables are not all equal; QUBO++ solves the resulting HUBO model directly."
app_name: "NAE-SAT Solver (QUBO++ demo)"
docs_links:
  - label: "C++ (QUBO++)"
    url: /en/NAESAT
  - label: "Python (PyQBPP)"
    url: /en/python/NAESAT
---

## How to use

- The table has one row per clause and one column per variable ($x_0, x_1, \ldots$).
  Check the variables of each clause (at least two per clause).
  **×** removes the clause.
- **+ Variable** / **− Variable** change the number of variables (3 to 24), and **+ Clause** adds an empty clause.
  **+ Random** / **− Random** check or uncheck the given number of random cells.
- **Objective** adds a goal on top of the clauses:
  **Balance T≈F** (the default) makes the numbers of True and False variables as equal as possible,
  **Minimize T** / **Minimize F** make the number of True / False variables as small as possible,
  and **None** asks only for the clauses.
- **Solver**: **ABS3 (CPU)** searches heuristically for the given **Time** (at most 10 seconds on the public demo);
  **Exhaustive** checks all $2^n$ assignments.
- After solving, the table shows the assignment (T/F) and, for each clause,
  the numbers of True and False variables in it (green when the clause is satisfied).
  Below it is the HUBO expression that was solved.

The demo runs on AWS Lambda with limited resources;
QUBO++ on a desktop PC is several times faster.

## How the problem becomes a HUBO model

In NAE-SAT (not-all-equal satisfiability), every clause must contain at least one True variable
and at least one False variable.
The demo uses $x_i=1$ for True and $x_i=0$ for False, and $\overline{x_i}=1-x_i$.
A clause $C$ is violated exactly when its variables are all True or all False, which is detected by

$$
\prod_{i\in C} x_i \;+\; \prod_{i\in C} \overline{x_i} .
$$

This is 1 for a violated clause and 0 otherwise.
The demo minimizes

$$
\text{objective} \;+\; (n^2+1)\sum_{C}\Big(\prod_{i\in C} x_i + \prod_{i\in C} \overline{x_i}\Big),
$$

where the objective is $\left(2\sum_i x_i - n\right)^2$ for Balance,
$\sum_i x_i$ for Minimize T, $n-\sum_i x_i$ for Minimize F, and 0 for None.
The weight $n^2+1$ is larger than any value of the objective,
so violating a clause never pays off.
A clause with $k$ variables gives terms of degree $k$,
so the model is a HUBO (Higher-order Unconstrained Binary Optimization);
QUBO++ solves it directly, without reducing it to a QUBO.
With Balance or None, the search stops as soon as it reaches the best possible value
(0, or 1 for Balance with an odd $n$).

## The program

In PyQBPP, the Python version of QUBO++, the model with the Balance objective takes a few lines:

```python
import pyqbpp as qbpp

n = 5

# Clauses: each clause is a set of variable indices
clauses = [
    [0, 1, 2],
    [1, 2, 3],
    [2, 3, 4],
    [0, 3, 4],
]

# Create binary variables
x = qbpp.var("x", shape=n)

# NAE constraint: penalty if all-true or all-false
constraint = 0
for clause in clauses:
    all_true = 1
    all_false = 1
    for idx in clause:
        all_true *= x[idx]
        all_false *= ~x[idx]
    constraint += all_true + all_false

# Objective: balance True/False count
s = qbpp.sum(x)
objective = (2 * s - n) * (2 * s - n)

# HUBO expression with penalty weight
penalty_weight = n * n + 1
f = (objective + penalty_weight * constraint).simplify_as_binary()

# Solve
solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=1)  # n=5 is odd, so best balance gives (2*s-n)^2 = 1

# Print results
print(f"Energy = {sol.energy}")
print("Assignment:", " ".join(f"x[{i}]={sol(x[i])}" for i in range(n)))

print(f"constraint = {sol(constraint)}")
print(f"objective  = {sol(objective)}")

# Verify: check each clause
all_satisfied = True
for k, clause in enumerate(clauses):
    sum_val = 0
    for idx in clause:
        sum_val += sol(x[idx])
    satisfied = 0 < sum_val < len(clause)
    print(f"Clause {k}: {'satisfied' if satisfied else 'VIOLATED'}")
    if not satisfied:
        all_satisfied = False
print(f"All clauses NAE-satisfied: {'Yes' if all_satisfied else 'No'}")
```

The [NAE-SAT page](/en/python/NAESAT) explains the program and shows its output;
the [C++ version](/en/NAESAT) is also available.

## Run it on your computer

PyQBPP runs on Linux (x86-64 and ARM64) and on Windows through WSL:

```bash
pip install pyqbpp
```

See [Installation](/en/python/INSTALL) for details,
and the [other demos](/en/DEMOS) for more problems solved with QUBO++.
