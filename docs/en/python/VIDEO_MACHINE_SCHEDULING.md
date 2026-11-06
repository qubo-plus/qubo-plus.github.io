---
last_modified: 2026-10-31
layout: default
nav_exclude: true
title: "Video: Machine Scheduling with Due Dates"
description: "Chapter-by-chapter notes on the video \"QUBO++ Case Study: Machine Scheduling with Due Dates (Python)\", with the programs and outputs shown in it."
lang: en
hreflang_alt: "ja/python/VIDEO_MACHINE_SCHEDULING"
hreflang_lang: "ja"
video: machine-scheduling
---

# Video: Machine Scheduling with Due Dates (Python)

A guide to the video "QUBO++ Case Study: Machine Scheduling with Due Dates (Python)".
For each chapter, it summarizes the key points, the programs and outputs shown in the video, and links to the pages with the details.
Click "▶ Play the video from …" to play from that scene.

{% include video_embed.html slug="machine-scheduling" %}

What this video covers:

- Three machines and 12 orders: among the schedules that meet every due date, the one with the smallest total processing time
- Why each machine may process its orders in due-date order (shown by swapping neighbors), so that only the assignment has to be decided
- The binary assignment variables $y_{j,m}$, and the assignment and due-date constraints written with `qbpp.cons()` (no auxiliary variables, even for inequalities)
- Array operations (the elementwise product, `qbpp.sum()`, `qbpp.vector_sum()`) and fixing the variables whose values are known with `qbpp.replace()`
- Minimizing the makespan (the time at which the last order finishes) with an integer variable `z`

The written explanation is on the [Machine Scheduling with Due Dates](MACHINE_SCHEDULING) page, and you can also try the [machine scheduling demo](../demos/machine-scheduling/) in the browser. Back to the [Videos (case studies)](../VIDEO_CASE_STUDIES) list

## The problem

{% include video_seek.html t="0:34" %}

- A factory has 3 machines and 12 orders. The orders are numbered in order of due date beforehand (times in minutes; – means that the machine cannot process the order).

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

- Each order is processed on one machine. The machines start at time 0 and process one order at a time, without breaks. Every order must finish by its due date.
- Putting every order on its fastest machine (order 1, equally fast on machines 1 and 2, goes to machine 1) gathers 11 of the 12 orders on machine 1, and processing them by number makes 10 of the 12 orders late.

## What to decide

{% include video_seek.html t="1:32" %}

- Two things are decided: the **assignment** of each order to a machine and the processing **order** on each machine.
- The total processing time is the sum over the orders of the time on the assigned machine, so it does not depend on the order.
- Why due-date order is enough: machine 1 processes orders 10, 9, 8 in this order (due 405, 360, 355), and all three are on time. Swap a neighboring pair whose earlier order has the later due date: the order moved back finishes when the order that was behind it did, which is no later than that order's due date, which in turn is earlier than the due date of the order moved back, so it is on time. The order moved forward finishes earlier than before, so it is on time too. Three swaps give 8, 9, 10, the order by number.
- So if some order meets the due dates, due-date order does too. Each machine processes by number, and only the assignment is decided.
- There are 7776 assignments (the product of the numbers of usable machines), and only 29 of them meet every due date.

## Variables and the assignment constraints

{% include video_seek.html t="2:48" %}

- The binary variable $y_{j,m}$ ($j$ from 1 to 12, $m$ from 1 to 3) is 1 if order $j$ is processed on machine $m$ and 0 otherwise. For the 9 pairs that cannot be processed, $y_{j,m} = 0$.
- The objective is to minimize the total processing time $\sum_{j,m} p_{j,m}\, y_{j,m}$, where $p_{j,m}$ is the processing time of order $j$ on machine $m$.
- The first constraint is that each order goes to exactly one machine: the variables in each row sum to 1, $\sum_m y_{j,m} = 1$, for all 12 orders.

## Finish times and due dates

{% include video_seek.html t="3:35" %}

- Each machine processes by number, so order $j$ finishes on machine $m$ at $C_{j,m} = \sum_{i \le j} p_{i,m}\, y_{i,m}$, the sum of time times variable by number.
- The constraint $C_{j,m} \le d_j$ (the due date of order $j$) is added for all 36 machine-order pairs.
- It works correctly even when order $j$ is not on machine $m$: $C_{j,m}$ is then the finish time of the previous order on machine $m$, whose due date is no later than $d_j$. So constraints never have to be added or removed to match the assignment.

$$
\begin{aligned}
\text{minimize}\quad & \sum_{j,m} p_{j,m}\, y_{j,m} \\
\text{subject to}\quad & \sum_{m} y_{j,m} = 1 && \text{for every order } j,\\
& C_{j,m} = \sum_{i \le j} p_{i,m}\, y_{i,m} \le d_j && \text{for every machine } m \text{ and order } j
\end{aligned}
$$

## Writing it in QUBO++

{% include video_seek.html t="4:38" %}

- `qbpp.var("y", shape=(n, machines))` makes `y`, an array of variables with 12 rows and 3 columns. Indices start at 0, so `y[j][m]` stands for $y_{j+1,m+1}$ in the formulas (`y[0][0]` is $y_{1,1}$, and `y[11][1]` is $y_{12,2}$).
- A constraint is wrapped in `qbpp.cons()`. For the assignment, `qbpp.vector_sum(y, axis=1)` makes the array of the row sums, and wrapping "this array equals 1" adds all 12 constraints at once.
- For the due dates, the finish time `finish` at most `due[j]` is wrapped.
- A broken constraint adds weight times violation squared to the energy. The weight is 100000, much larger than any total processing time. Even for inequalities, `qbpp.cons()` needs no auxiliary variables.

See the [Constraints](CONSTRAINTS) and [Sum Functions](SUM) pages for the details.

## The program

{% include video_seek.html t="5:50" %}

- `due` lists the due dates, and `time` is a 2D list of processing times, where a time of 0 means that the machine cannot process the order.
- `work`, the product of `qbpp.array(time)` and `y`, is elementwise: `work[j][m]` is the processing time if order `j` is processed on machine `m`, and 0 otherwise. `qbpp.sum(work)` is the total processing time.
- For the due dates, each machine adds the elements of `work` to `finish` by number and adds `finish <= due[j]` after each addition.
- The variables whose values are known are fixed: 0 for the pairs that cannot be processed, and 1 for the only usable machine of orders 5 and 10. `ml` collects these values, and `qbpp.replace()` makes the fixed expression `g`: the 11 fixed variables are gone, and the solver searches 25 variables.
- `g` is tidied with `simplify_as_binary()`, and `EasySolver` searches for 1 second. The fixed variables are not in `sol`, the solution of `g`, so `qbpp.Sol(f).set(sol, ml)` makes `full_sol` with the fixed values put back, and the program reads it.
- The last loop prints the orders whose variables are 1 for each machine. It adds 1 to the indices to print the order and machine numbers, and a start time is the sum of the times printed before it on that machine.

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

See the [Array Operations](OPVECTOR), [Replace Functions](REPLACE) and [Fixing Variables and Sentinels](FIX_VARIABLES) pages for the details.

## Results

{% include video_seek.html t="7:42" %}

Output:

```
Machine 1: #2(0-95) #3(95-190) #6(190-300) #9(300-340) #10(340-405) #12(405-495)
Machine 2: #1(0-100) #5(100-175) #8(175-270) #11(270-400)
Machine 3: #4(0-135) #7(135-275)
Total processing time: 1170
```

- Machine 1 processes orders 2, 3, 6, 9, 10 and 12 until 495 minutes, machine 2 orders 1, 5, 8 and 11, and machine 3 orders 4 and 7; every order finishes before its due date.
- The total processing time is 1170 minutes: longer than 1010 on the fastest machines, but on time.
- Checking all 7776 assignments, the smallest total is 1170 minutes, given by only one assignment, the one in the output.
- But machine 1 runs until 495 minutes, and machine 3 stops at 275.

## Makespan

{% include video_seek.html t="8:37" %}

- The time at which the last order finishes is called the **makespan**. The time a machine is busy (the total processing time of the orders on it) is called its **load**, and the makespan is the largest load.
- `qbpp.var("z", integer=(0, 600))` makes `z`, an integer variable from 0 to 600. Each of the 3 loads is required to be at most `z`, and `100 * z` is added to the objective. `z` comes down to the largest load, and to lower it further, the assignment changes to even out the loads.
- Why the weight is 100: all times are multiples of 5 minutes, so a makespan 5 minutes shorter lowers the energy by 500. The total processing time, however, changes by at most 465 minutes (the sum over the orders of the slowest minus the fastest time). Since 500 is larger, the makespan is minimized first, and among the assignments with the same makespan, the total processing time is minimized.
- The program adds the following lines after the due dates. The column sums of `work` are the loads of the machines, so `qbpp.vector_sum(work, axis=0)` makes the array of the loads, and the constraint "each load minus `z` is at most 0" is added all at once. At the end, `print("Makespan:", full_sol(z))` prints `z`.

```python
# makespan z: every machine finishes by z
z = qbpp.var("z", integer=(0, 600))
f += 100 * z
f += 100000 * qbpp.cons(qbpp.vector_sum(work, axis=0) - z <= 0)
```

Output:

```
Machine 1: #2(0-95) #3(95-190) #6(190-300) #9(300-340) #10(340-405)
Machine 2: #1(0-100) #5(100-175) #8(175-270) #12(270-420)
Machine 3: #4(0-135) #7(135-275) #11(275-420)
Makespan: 420
Total processing time: 1245
```

- The makespan is 420 minutes, and the loads of the 3 machines are even. In exchange, the total processing time grows from 1170 to 1245 minutes.
- Over all assignments, 420 is the smallest, given by one of them. Without the due dates, 410 is possible, so the due dates cost 10 minutes.

See the [Integer Variables](INTEGER) page for the details.

## Summary

{% include video_seek.html t="10:48" %}

- Each machine processes in due-date order, so only the assignment is variable. A finish time is a sum of time times variable in due-date order.
- Both kinds of constraints are written directly with `qbpp.cons()`. Array operations wrote the total and the row sums in short, and the variables with known values were fixed with `qbpp.replace()`.
- The makespan is minimized with an integer variable `z` and loads at most `z`. The weights set the priority between the two objectives.
