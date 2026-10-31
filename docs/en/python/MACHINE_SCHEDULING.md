---
last_modified: 2026-10-31
layout: default
nav_exclude: true
title: "Machine Scheduling with Due Dates"
nav_order: 97
lang: en
hreflang_alt: "ja/python/MACHINE_SCHEDULING"
hreflang_lang: "ja"
---

# Machine Scheduling with Due Dates

A factory has three machines and twelve orders.
Each order has a due date, and its processing time depends on the machine;
some machines cannot process some orders.
Every order is processed on one machine, every order must finish by its due date,
and each machine processes one order at a time without breaks.
This page finds such a schedule that minimizes the **total processing time**,
and then one that minimizes the **makespan**, the time at which the last order finishes.
The same problem can be tried in the browser in the [Machine Scheduling demo](../demos/machine-scheduling/).

{% include video_embed.html slug="machine-scheduling" %}

The video solves the same 12 orders for the total processing time and the makespan. The programs in the video, chapter by chapter, are on the page [Video: Machine Scheduling with Due Dates](VIDEO_MACHINE_SCHEDULING).

The orders are as follows, numbered in order of due date (times in minutes; – means that the machine cannot process the order):

| Order | Due date | Machine 1 | Machine 2 | Machine 3 |
|---:|---:|---:|---:|---:|
| 1 | 100 | 100 | 100 | – |
| 2 | 170 | 95 | – | 160 |
| 3 | 190 | 95 | 155 | 155 |
| 4 | 225 | 85 | 120 | 135 |
| 5 | 250 | – | 75 | – |
| 6 | 300 | 110 | 135 | 175 |
| 7 | 320 | 90 | – | 140 |
| 8 | 355 | 85 | 95 | – |
| 9 | 360 | 40 | 60 | 80 |
| 10 | 405 | 65 | – | – |
| 11 | 480 | 80 | 130 | 145 |
| 12 | 500 | 90 | 150 | – |

A faster machine saves time, but putting every order on its fastest machine overloads machine 1.
If order 1, which is equally fast on machines 1 and 2, also goes to machine 1
and each machine processes its orders in order of number (that is, of due date),
10 of the 12 orders miss their due dates.

## Formulation

We use a binary variable $y_{j,m}$ that is 1 if order $j$ is processed on machine $m$;
$y_{j,m} = 0$ when machine $m$ cannot process order $j$.

The order in which a machine processes its orders does not change the total processing time.
If some order of the jobs on a machine meets all their due dates,
processing them in due-date order does too.
So every machine processes its orders in due-date order, that is, in order of number,
and only the assignment has to be decided.
Then order $j$ finishes on machine $m$ at

$$
C_{j,m} = \sum_{i \le j} p_{i,m}\, y_{i,m},
$$

where $p_{i,m}$ is the processing time of order $i$ on machine $m$.
The model is

$$
\begin{aligned}
\text{minimize}\quad & \sum_{j,m} p_{j,m}\, y_{j,m} \\
\text{subject to}\quad & \sum_{m} y_{j,m} = 1 && \text{for every order } j,\\
& C_{j,m} \le d_j && \text{for every machine } m \text{ and order } j,
\end{aligned}
$$

where $d_j$ is the due date of order $j$.
The second constraint is also correct when order $j$ is not on machine $m$:
$C_{j,m}$ is then the finish time of the last earlier order on machine $m$,
whose due date is no later than $d_j$.

Each constraint is written with `qbpp.cons()` and given the weight 100000,
much larger than any total processing time.
QUBO++ handles these constraints directly, so the inequalities need no slack variables.

## Program

```python
import pyqbpp as qbpp

# due date and processing times (minutes) on machines 1, 2, 3 (0: cannot process)
# the orders are listed in order of due date
due = [100, 170, 190, 225, 250, 300, 320, 355, 360, 405, 480, 500]
time = [[100, 100, 0], [95, 0, 160], [95, 155, 155], [85, 120, 135],
        [0, 75, 0], [110, 135, 175], [90, 0, 140], [85, 95, 0],
        [40, 60, 80], [65, 0, 0], [80, 130, 145], [90, 150, 0]]
n = len(due)
machines = 3

y = qbpp.var("y", shape=(n, machines))
work = qbpp.array(time) * y
f = qbpp.sum(work)

# each order is processed on exactly one machine
f += 100000 * qbpp.cons(qbpp.vector_sum(y, axis=1) == 1)

# each order finishes by its due date
for m in range(machines):
    finish = 0
    for j in range(n):
        finish += work[j][m]
        f += 100000 * qbpp.cons(finish <= due[j])

# fix y: 0 where the machine cannot process the order, 1 for the only usable machine
ml = {}
for j in range(n):
    for m in range(machines):
        if time[j][m] == 0:
            ml[y[j][m]] = 0
        elif time[j].count(0) == machines - 1:
            ml[y[j][m]] = 1
g = qbpp.replace(f, ml)
g.simplify_as_binary()

solver = qbpp.EasySolver(g)
sol = solver.search(time_limit=1.0)
full_sol = qbpp.Sol(f).set(sol, ml)

total = 0
for m in range(machines):
    print(f"Machine {m + 1}:", end="")
    t = 0
    for j in range(n):
        if full_sol(y[j][m]) == 1:
            print(f" #{j + 1}({t}-{t + time[j][m]})", end="")
            t += time[j][m]
            total += time[j][m]
    print()
print("Total processing time:", total)
```

This program prints the orders on each machine with their start and finish times:

```
Machine 1: #2(0-95) #3(95-190) #6(190-300) #9(300-340) #10(340-405) #12(405-495)
Machine 2: #1(0-100) #5(100-175) #8(175-270) #11(270-400)
Machine 3: #4(0-135) #7(135-275)
Total processing time: 1170
```

- `y` is the array of variables. Indices start at 0 in Python, so $y_{j,m}$ is `y[j-1][m-1]` in the program
  ($y_{1,1}$ is `y[0][0]`); the output adds 1 to the indices to print the order and machine numbers.
- `work` is the elementwise product of the processing times and the variables ([Array Operations](OPVECTOR)):
  `work[j][m]` is the time machine `m` spends on order `j` (0 if it does not process it), and `qbpp.sum(work)` is the total processing time.
- `qbpp.vector_sum(y, axis=1)` is the array of the row sums, that is, the sum of the variables of each order ([Sum Functions](SUM)),
  so `== 1` gives one constraint per order.
- `finish` is the finish time of the order (the $C_{j,m}$ of the formulas) when machine `m` processes its orders
  in order of number, so `finish <= due[j]` is its due date.
- `ml` lists the variables to fix and their values: 0 for the pairs that cannot be processed,
  and 1 for an order with a single usable machine (orders 5 and 10), which has to go there.
  `qbpp.replace()` makes the fixed expression `g` ([Replace Functions](REPLACE)), so the solver searches 25 variables instead of 36.
- `EasySolver` searches `g` for 1 second. The fixed variables are not in `g`, so they cannot be read from `sol`:
  `qbpp.Sol(f).set(sol, ml)` makes `full_sol`, a solution with all the variables of the original expression `f`
  ([Fixing Variables and Sentinels](FIX_VARIABLES)).

Every order meets its due date, and the total processing time is 1170 minutes.
Enumerating all assignments confirms that this is the smallest possible for these orders.

## Minimizing the makespan

In the schedule above, machine 1 works until 495 minutes while machine 3 stops at 275.
To minimize the makespan, we add a [native integer variable](INTEGER) $z$ for the makespan,
require every machine to finish by $z$, and add $100z$ to the objective:

$$
\begin{aligned}
\text{minimize}\quad & 100z + \sum_{j,m} p_{j,m}\, y_{j,m} \\
\text{subject to}\quad & \text{the constraints above, and}\\
& L_m \le z && \text{for every machine } m,
\end{aligned}
$$

where $L_m = \sum_j p_{j,m}\, y_{j,m}$ is the time machine $m$ is busy.
All times are multiples of 5 minutes, so the makespan changes in steps of 5 minutes, which cost 500.
The total processing time of these orders can change by at most 465 minutes
(the sum over the orders of the slowest minus the fastest processing time).
So the makespan is minimized first,
and the total processing time decides among the schedules with the same makespan.

The program declares $z$ with `qbpp.var("z", integer=(0, 600))` and adds the new terms after the due dates;
`qbpp.vector_sum(work, axis=0)` sums the columns, giving the busy times $L_m$ of the machines:

```python
import pyqbpp as qbpp

# due date and processing times (minutes) on machines 1, 2, 3 (0: cannot process)
# the orders are listed in order of due date
due = [100, 170, 190, 225, 250, 300, 320, 355, 360, 405, 480, 500]
time = [[100, 100, 0], [95, 0, 160], [95, 155, 155], [85, 120, 135],
        [0, 75, 0], [110, 135, 175], [90, 0, 140], [85, 95, 0],
        [40, 60, 80], [65, 0, 0], [80, 130, 145], [90, 150, 0]]
n = len(due)
machines = 3

y = qbpp.var("y", shape=(n, machines))
work = qbpp.array(time) * y
f = qbpp.sum(work)

# each order is processed on exactly one machine
f += 100000 * qbpp.cons(qbpp.vector_sum(y, axis=1) == 1)

# each order finishes by its due date
for m in range(machines):
    finish = 0
    for j in range(n):
        finish += work[j][m]
        f += 100000 * qbpp.cons(finish <= due[j])

# makespan z: every machine finishes by z
z = qbpp.var("z", integer=(0, 600))
f += 100 * z
f += 100000 * qbpp.cons(qbpp.vector_sum(work, axis=0) - z <= 0)

# fix y: 0 where the machine cannot process the order, 1 for the only usable machine
ml = {}
for j in range(n):
    for m in range(machines):
        if time[j][m] == 0:
            ml[y[j][m]] = 0
        elif time[j].count(0) == machines - 1:
            ml[y[j][m]] = 1
g = qbpp.replace(f, ml)
g.simplify_as_binary()

solver = qbpp.EasySolver(g)
sol = solver.search(time_limit=1.0)
full_sol = qbpp.Sol(f).set(sol, ml)

total = 0
for m in range(machines):
    print(f"Machine {m + 1}:", end="")
    t = 0
    for j in range(n):
        if full_sol(y[j][m]) == 1:
            print(f" #{j + 1}({t}-{t + time[j][m]})", end="")
            t += time[j][m]
            total += time[j][m]
    print()
print("Makespan:", full_sol(z))
print("Total processing time:", total)
```

This program prints

```
Machine 1: #2(0-95) #3(95-190) #6(190-300) #9(300-340) #10(340-405)
Machine 2: #1(0-100) #5(100-175) #8(175-270) #12(270-420)
Machine 3: #4(0-135) #7(135-275) #11(275-420)
Makespan: 420
Total processing time: 1245
```

The makespan drops from 495 to 420 minutes,
and the total processing time grows from 1170 to 1245 minutes in exchange.

## Try it in the browser

In the [Machine Scheduling demo](../demos/machine-scheduling/) you can edit the orders, move them on a chart,
choose the objective, and solve the model on a server.
The demo also accepts orders whose due dates cannot all be met:
it then minimizes the total lateness first, written with `relu()`.
