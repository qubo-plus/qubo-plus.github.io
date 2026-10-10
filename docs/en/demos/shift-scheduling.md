---
last_modified: 2026-10-10
layout: demo
title: "Shift Scheduling Optimizer Online: Day and Night Shift Roster as QUBO"
description: "Enter the staff's requested days off and build a four-week roster of day and night shifts. The rules on staffing, shift leaders, consecutive working days and shift changes are written with QUBO++'s cons(), and the roster spreads the working days, night shifts and weekend work as evenly as possible, with no slack variables."
lang: en
hreflang_alt: "ja/demos/shift-scheduling/"
hreflang_lang: "ja"
permalink: /en/demos/shift-scheduling/
nav_exclude: true
math: true
image: /assets/demos/og/shift-scheduling.png
demo_id: shift
heading: "Day and Night Shift Scheduling (QUBO)"
lead: "Click cells of the roster to request days off and press Solve. QUBO++ builds a four-week roster in which every shift has exactly the required staff and the working days, night shifts and weekend work are spread as evenly as possible."
app_name: "Shift Scheduling Optimizer (QUBO++ demo)"
docs_links:
  - label: "Case study: C++ (QUBO++)"
    url: /en/SHIFT_ROSTER
  - label: "Python (PyQBPP)"
    url: /en/python/SHIFT_ROSTER
  - label: "cons(): C++"
    url: /en/CONSTRAINTS
  - label: "Python"
    url: /en/python/CONSTRAINTS
---

## How to use

- **Sample data** loads 11 staff members (3 managers, 3 skilled workers and 5 regular staff) and 9 requested days off.
  **Random requests** replaces the requests with random ones.
  **+ Add staff** adds a staff member (up to 40); in each row you can change the name and the kind
  (**Manager**, **Skilled** or **Staff**), or remove the person with ×.
- Click a cell of the roster to request that day off: paid leave on a weekday, no holiday work on a weekend day.
  Click it again to remove the request.
- Under **Required staff**, set the number of staff on each shift (exactly that many; 0 closes the shift),
  and under **Max working days in a row**, the limit on consecutive working days.
- Choose the **Time** (1 to 10 seconds) and press **Solve**.
  The roster shows the best one found so far while the solver runs.
  **Clear schedule** removes the roster and keeps the requests.
- Cells that break a rule are drawn in red.
  The summary shows the number of rule violations, the fairness (the sum of squares) and its lower bound,
  and the range of the working days, night shifts and holiday work per person.
  **QUBO++ model** at the bottom shows the model that was solved.

The demo runs on AWS Lambda with limited resources;
QUBO++ on a desktop PC is several times faster.

## How the roster becomes a QUBO model

The binary variables $d_{i,t}$ and $n_{i,t}$ are 1 if person $i$ works the day or night shift on day $t$.
No variables are made for requested days off, which are therefore off.
Let $r^{\mathrm{D}}_t$ and $r^{\mathrm{N}}_t$ be the required staff of the day and night shifts on day $t$,
and $K$ the limit on consecutive working days.
The people who can lead the day shift on day $t$, $L_t$, are the managers on a weekday and the managers and skilled
workers on a weekend day; the people who can lead a night shift, $L'$, are the managers and skilled workers.
For every person $i$ and day $t$, the rules are

$$
\begin{aligned}
& d_{i,t} + n_{i,t} \le 1 && \text{at most one shift a day}\\
& \textstyle\sum_i d_{i,t} = r^{\mathrm{D}}_t, \qquad \sum_i n_{i,t} = r^{\mathrm{N}}_t && \text{required staff}\\
& \textstyle\sum_{i \in L_t} d_{i,t} \ge 1, \qquad \sum_{i \in L'} n_{i,t} \ge 1 && \text{shift leaders}\\
& \textstyle\sum_{u=t}^{t+K} (d_{i,u} + n_{i,u}) \le K && \text{consecutive days}\\
& n_{i,t} + d_{i,t+1} \le 1, \qquad d_{i,t} + n_{i,t+1} \le 1 && \text{day/night changes}
\end{aligned}
$$

A shift leader is not required on a shift whose required staff is 0.
The objective is the sum of the squares of each person's working days, night shifts and holiday work
(shifts on weekend days):

$$
\text{minimize}\quad \sum_i \Big(\sum_t (d_{i,t} + n_{i,t})\Big)^2 + \sum_i \Big(\sum_t n_{i,t}\Big)^2 + \sum_i \Big(\sum_{t\ \text{weekend}} (d_{i,t} + n_{i,t})\Big)^2 .
$$

Because the required staff are exact, the three totals are the same for every roster,
and with fixed totals the sum of squares is smaller when the counts are more even.

QUBO++ writes every rule with `cons()`.
Their weight is larger than any value of the objective, so a roster that breaks a rule always has a higher energy
than one that follows all of them.
The solvers handle these constraints directly, so more than 1,000 inequalities need no slack variables:
the model has only the variables $d_{i,t}$ and $n_{i,t}$ (598 for the sample).
The model is solved by the ABS3 solver of QUBO++ running on the CPU.
Spreading the three totals as evenly as possible over the staff gives a lower bound,
and the search stops early if it reaches the bound, which proves that the roster is optimal.

## Run it on your computer

PyQBPP, the Python version of QUBO++, runs on Linux (x86-64 and ARM64) and on Windows through WSL:

```bash
pip install pyqbpp
```

The [day and night shift roster page](/en/python/SHIFT_ROSTER) solves the same problem as the sample of this demo
with a short program (the [C++ version](/en/SHIFT_ROSTER) is also available).
The [constraints page](/en/python/CONSTRAINTS) explains `cons()`.
See [Installation](/en/python/INSTALL) for details,
and the [other demos](/en/DEMOS) for more problems solved with QUBO++.
