---
last_modified: 2026-11-01
layout: default
nav_exclude: true
title: "Job Shop Scheduling"
nav_order: 108
lang: en
hreflang_alt: "ja/python/JOB_SHOP_SCHEDULING"
hreflang_lang: "ja"
---

# Job Shop Scheduling

In the **job shop scheduling problem**, several jobs are processed on several machines.
Each job visits every machine exactly once in a given order and spends a given processing time on each machine.
A machine can process only one operation at a time, and an operation, once started, is not interrupted.
The goal is to minimize the **makespan**, the time at which all jobs are finished.

This page solves ft06, a problem with 6 jobs and 6 machines given by Fisher and Thompson in 1963.
It is small, but it is widely used as a benchmark for comparing scheduling methods, and its minimum makespan is known to be 55.

The order in which each job visits the machines and the processing times are as follows. "M3: 1" means an operation of length 1 on machine 3.

| Job | 1st | 2nd | 3rd | 4th | 5th | 6th |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| J1 | M3: 1 | M1: 3 | M2: 6 | M4: 7 | M6: 3 | M5: 6 |
| J2 | M2: 8 | M3: 5 | M5: 10 | M6: 10 | M1: 10 | M4: 4 |
| J3 | M3: 5 | M4: 4 | M6: 8 | M1: 9 | M2: 1 | M5: 7 |
| J4 | M2: 5 | M1: 5 | M3: 5 | M4: 3 | M5: 8 | M6: 9 |
| J5 | M3: 9 | M2: 3 | M5: 5 | M6: 4 | M1: 3 | M4: 1 |
| J6 | M2: 3 | M4: 3 | M6: 9 | M1: 10 | M5: 4 | M3: 1 |

## Formulation

The time at which job $j$ starts its operation on machine $m$ is an [integer variable](INTEGER) $s_{j,m}$.
With processing time $p_{j,m}$, the operation ends at $s_{j,m} + p_{j,m}$.

As the time limit $T$ we use the sum of all processing times (197 for this problem).
Even if all operations are done one after another, they finish by $T$, so an optimal schedule always lies within this range.
We therefore let $s_{j,m}$ range over $0 \le s_{j,m} \le T - p_{j,m}$.

**Job order.** When job $j$ visits machine $b$ right after machine $a$, its operation on $b$ starts after its operation on $a$ ends:

$$
s_{j,a} + p_{j,a} \le s_{j,b}
$$

**No overlap on a machine.** For two jobs $i$ and $j$ on the same machine $m$, one of them finishes before the other starts.
With a binary variable $x_{m,i,j}$ that tells which one goes first (1 if $i$ goes first, 0 if $j$ goes first), this is written as two inequalities:

$$
\begin{aligned}
s_{i,m} + p_{i,m} - s_{j,m} &\le T\,(1 - x_{m,i,j}) \\
s_{j,m} + p_{j,m} - s_{i,m} &\le T\,x_{m,i,j}
\end{aligned}
$$

When $x_{m,i,j} = 1$, the first one becomes the constraint "$j$ starts after $i$ ends".
The right-hand side of the second one becomes $T$, and by the ranges of $s$ its left-hand side is at most $T$, so it always holds.
When $x_{m,i,j} = 0$, the roles are swapped.
Disabling the unneeded constraint by multiplying a large constant in this way is called the **big-M method**.

**Makespan.** If $C_j$ is the time at which the last operation of job $j$ ends, the makespan is $\max_j C_j$.
To minimize the maximum of three or more expressions, we use an integer variable $z$ and ReLU, as in [Minimizing and Maximizing Maxima and Minima](MAX_MIN).

The model is as follows:

$$
\begin{aligned}
\text{minimize}\quad & 10000\,z + \sum_{j,m} s_{j,m} + 20000 \sum_j \mathrm{relu}(C_j - z) \\
\text{subject to}\quad & \text{the job-order and no-overlap inequalities}
\end{aligned}
$$

The weights are chosen as follows:

- The weight 20000 of $\mathrm{relu}(C_j - z)$ is twice the weight 10000 of $z$. When $z$ is smaller than some $C_j$, increasing $z$ by 1 lowers the energy, so in an optimal solution $z$ equals the maximum $\max_j C_j$.
- The sum of the start times $\sum s_{j,m}$ makes every operation start as early as possible. This sum is at most 6895 (the sum of $T - p_{j,m}$ over the 36 operations), so shortening the makespan by 1 (a gain of 10000) always outweighs it. The makespan is therefore minimized first, and the sum of the start times is minimized among those schedules. In our trials, the solver reached the optimum faster with this term.
- The constraints are written with `qbpp.cons()` and given the weight 10000000. A schedule that satisfies the constraints has an objective of at most $10000 \times 197 + 6895$, and breaking any constraint adds at least 10000000 to the energy, so an optimal solution always satisfies all constraints. QUBO++ handles the inequalities in `cons()` directly, so no slack variables are needed ([Nonlinear Functions and Native Constraints](CONSTRAINTS)).

There are 36 integer variables for the start times, 90 binary variables for the orders (15 pairs on each of the 6 machines), and $z$.

## Program

```python
import pyqbpp as qbpp

# ft06: the order in which each job visits the machines, and the processing time on each machine (machines numbered from 0)
route = [[2, 0, 1, 3, 5, 4], [1, 2, 4, 5, 0, 3], [2, 3, 5, 0, 1, 4],
         [1, 0, 2, 3, 4, 5], [2, 1, 4, 5, 0, 3], [1, 3, 5, 0, 4, 2]]
time = [[3, 6, 1, 7, 6, 3], [10, 8, 5, 4, 10, 10], [9, 1, 5, 4, 7, 8],
        [5, 5, 5, 3, 8, 9], [3, 3, 9, 1, 5, 4], [10, 3, 1, 3, 4, 9]]
n = len(route)
machines = 6

# T: the sum of all processing times (processing one at a time still finishes by T)
T = sum(sum(row) for row in time)

# s[j][m]: the time job j starts on machine m (from 0 to T - processing time)
s = qbpp.var("s", shape=(n, machines),
             integer=(0, [[T - p for p in row] for row in time]))

# each job visits the machines in its given order
f = 0
for j in range(n):
    for a, b in zip(route[j], route[j][1:]):
        f += 10000000 * qbpp.cons(s[j][a] + time[j][a] - s[j][b] <= 0)

# two operations on one machine do not overlap (x[m][i][j] = 1 if i goes first)
x = qbpp.var("x", shape=(machines, n, n))
for m in range(machines):
    for i in range(n):
        for j in range(i + 1, n):
            f += 10000000 * qbpp.cons(s[i][m] + time[i][m] - s[j][m] - T * (1 - x[m][i][j]) <= 0)
            f += 10000000 * qbpp.cons(s[j][m] + time[j][m] - s[i][m] - T * x[m][i][j] <= 0)

# minimize the makespan z (the latest end time of the jobs), then the sum of the start times
z = qbpp.var("z", integer=(0, T))
f += 10000 * z + qbpp.sum(s)
for j in range(n):
    last = route[j][-1]
    f += 20000 * qbpp.relu(s[j][last] + time[j][last] - z)
f.simplify_as_binary()

solver = qbpp.ABS3Solver(f)
sol = solver.search(time_limit=10.0)

for m in range(machines):
    print(f"Machine {m + 1}:", end="")
    for start, j in sorted((sol(s[j][m]), j) for j in range(n)):
        print(f" J{j + 1}({start}-{start + time[j][m]})", end="")
    print()
print("Makespan:", sol(z))
```

- `route[j]` is the order in which job `j` visits the machines, and `time[j][m]` is the processing time of job `j` on machine `m`. Python indices start at 0, so J1 and M1 in the table are job 0 and machine 0 in the program.
- `s` is an array of integer variables. Passing a list of the same shape as `s` as the upper bound of `integer=` sets the upper bound $T - p_{j,m}$ for each element ("Arrays with per-element ranges" in [Integer Variables](INTEGER)).
- `zip(route[j], route[j][1:])` yields each pair of machines `a`, `b` that job `j` visits one after the other.
- `x` is a 6 × 6 × 6 array of binary variables, but only the elements with `i < j` are used. Variables that do not appear in `f` are not passed to the solver.
- `ABS3Solver` searches for 10 seconds, and the program prints the operations on each machine in order of their start times.

The output of this program is as follows:

```
Machine 1: J1(1-4) J4(13-18) J3(18-27) J6(28-38) J2(38-48) J5(48-51)
Machine 2: J2(0-8) J4(8-13) J6(13-16) J1(16-22) J5(22-25) J3(27-28)
Machine 3: J1(0-1) J3(1-6) J2(8-13) J5(13-22) J4(22-27) J6(42-43)
Machine 4: J3(6-10) J6(16-19) J4(27-30) J1(30-37) J2(48-52) J5(52-53)
Machine 5: J2(13-23) J5(25-30) J4(30-38) J6(38-42) J1(42-48) J3(48-55)
Machine 6: J3(10-18) J6(19-28) J2(28-38) J1(38-41) J5(41-45) J4(45-54)
Makespan: 55
```

The makespan is 55, equal to the known minimum.
Among the schedules with makespan 55, this is the only one with the smallest sum of start times (874).
For example, J1 starts on machine 1 at time 1 because J1 first works on machine 3 from time 0 to 1.

## Larger problems

ft06 is a small problem. As the numbers of jobs and machines grow, the order variables are needed for every pair of jobs on every machine, and the search also becomes harder.
For a problem with 10 jobs and 10 machines and random processing times (minimum makespan 794), a 30-second search with the same formulation sometimes did not find a schedule that satisfies the constraints, and even a 2-minute search gave schedules about 10% longer than the minimum.
As this page shows, job shop scheduling can be written in QUBO++, but methods specialized for job shop scheduling are better suited to finding near-optimal schedules for large problems.
