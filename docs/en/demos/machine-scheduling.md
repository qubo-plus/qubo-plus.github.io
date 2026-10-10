---
last_modified: 2026-10-08
layout: demo
title: "Machine Scheduling Optimizer Online: Due Dates as QUBO"
description: "Assign orders to three machines so that every order meets its due date with the least total processing time or the shortest makespan. The model uses QUBO++'s relu() for lateness, cons() for the assignment, and an integer variable for the makespan, with no slack variables."
lang: en
hreflang_alt: "ja/demos/machine-scheduling/"
hreflang_lang: "ja"
permalink: /en/demos/machine-scheduling/
nav_exclude: true
math: true
image: /assets/demos/og/machine-scheduling.png
demo_id: sched
heading: "Machine Scheduling with Due Dates (QUBO)"
lead: "Load sample or random orders, edit them on the chart or in the table, and press Solve. QUBO++ assigns every order to a machine so that all due dates are met with the least total processing time or the shortest makespan."
app_name: "Machine Scheduling Optimizer (QUBO++ demo)"
docs_links:
  - label: "Case study: C++ (QUBO++)"
    url: /en/MACHINE_SCHEDULING
  - label: "Python (PyQBPP)"
    url: /en/python/MACHINE_SCHEDULING
  - label: "relu() and cons(): C++"
    url: /en/CONSTRAINTS
  - label: "Python"
    url: /en/python/CONSTRAINTS
  - label: "Integer variables: C++"
    url: /en/NATIVE_INTEGER
  - label: "Python"
    url: /en/python/NATIVE_INTEGER
---

## How to use

- **Sample data** loads 12 orders, and **Random** generates the given number of orders (3 to 50)
  for which an assignment meeting every due date exists.
  In the table you can edit the due date of each order and its processing time on each machine
  (minutes, multiples of 5; leave a machine blank if it cannot process the order),
  and **+ Add order** adds one.
- Drag an order on the chart to another machine or position, or choose its machine in the table.
  **Fastest machines** puts every order on its fastest machine, and **Unassign all** clears the assignment.
- Under **Minimize**, choose what to minimize once the due dates are met:
  the **Total processing time** (the sum of the processing times on the chosen machines)
  or the **Makespan** (the time at which the last order finishes).
- Choose the **Time** (1 to 10 seconds) and press **Solve**.
  The chart shows the best schedule found so far while the solver runs.
- Late orders are drawn in red with their due dates.
  The summary shows the total processing time, the number of late orders and their total lateness,
  the makespan, and a lower bound of the selected objective.
  **QUBO++ model** at the bottom shows the model that was solved.

The demo runs on AWS Lambda with limited resources;
QUBO++ on a desktop PC is several times faster.

## How the schedule becomes a QUBO model

Each order $j$ has a due date $d_j$ and a processing time $p_{j,m}$ on each machine $m$ that can process it.
The demo uses one binary variable per possible pair:
$y_{j,m}=1$ if order $j$ is processed on machine $m$.

On each machine the orders are processed in due-date order.
If some order of the jobs on a machine meets all their due dates, the due-date order does too,
so this loses no schedule that meets every due date, and only the assignment has to be decided.
With the orders numbered by due date, order $j$ finishes on machine $m$ at

$$
C_{j,m} = \sum_{i \le j} p_{i,m}\, y_{i,m} .
$$

With the total processing time as the objective, the model is

$$
\text{minimize}\quad \sum_{j,m} p_{j,m}\, y_{j,m} \;+\; W \sum_{j,m} \mathrm{relu}\big(C_{j,m} - d_j - H_{j,m}(1-y_{j,m})\big)
$$

subject to $\sum_{m} y_{j,m} = 1$ for every order $j$,
where $\mathrm{relu}(z)=\max(z,0)$.
The relu term is the lateness of order $j$ when it is on machine $m$;
$H_{j,m}$ is the largest possible lateness, so the term is 0 when the order is not on machine $m$.
The weight $W$ makes 5 minutes of lateness cost more than any change in the total processing time,
so meeting the due dates comes first and the total processing time second.

With the makespan as the objective, the demo adds an integer variable $z$.
Machine $m$ is busy for $L_m = \sum_j p_{j,m}\, y_{j,m}$, and the terms

$$
V z \;+\; (V+1) \sum_{m} \mathrm{relu}(L_m - z)
$$

are added to the model.
Each minute of $z$ below the longest machine costs $V+1$ and saves only $V$,
so in an optimal solution $z$ is the makespan.
The weight $V$ makes 5 minutes of makespan cost more than any change in the total processing time,
and $W$ is raised so that 5 minutes of lateness still cost more than any change in the rest:
the due dates come first, then the makespan, and the total processing time decides among schedules
with the same makespan.

QUBO++ writes the lateness and the makespan with `relu()`, the assignment with `cons()`,
and $z$ as a native integer variable (`int_var()`), and its solvers handle all of them directly:
the model has only the assignment variables (and $z$) and no slack variables.
The model is solved by the ABS3 solver of QUBO++ running on the CPU.
The search stops early if it reaches the lower bound, which proves that the schedule is optimal.
Because the coefficients can be large, the demo uses 64-bit coefficients (`c64e64`).

## Run it on your computer

PyQBPP, the Python version of QUBO++, runs on Linux (x86-64 and ARM64) and on Windows through WSL:

```bash
pip install pyqbpp
```

The [machine scheduling page](/en/python/MACHINE_SCHEDULING) solves the same kind of problem with a short program,
minimizing first the total processing time and then the makespan
(the [C++ version](/en/MACHINE_SCHEDULING) is also available).
The [constraints page](/en/python/CONSTRAINTS) explains `relu()` and `cons()`,
and the [integer variables page](/en/python/NATIVE_INTEGER) explains integer variables.
See [Installation](/en/python/INSTALL) for details,
and the [other demos](/en/DEMOS) for more problems solved with QUBO++.
