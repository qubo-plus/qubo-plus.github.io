---
layout: default
nav_exclude: true
title: "Shift Scheduling"
nav_order: 71
lang: en
hreflang_alt: "ja/python/SHIFT_SCHEDULING"
hreflang_lang: "ja"
---

# Shift Scheduling Problem
Consider the following **shift scheduling problem**, which aims to find a schedule that minimizes the total worker cost.

- There are 6 workers and a planning horizon of 31 days, from day 1 to day 31.
For simplicity, we assume that all workers are off on day 0 and day 32.
- Exactly 4 workers must be scheduled on each day from day 1 to day 31.
- The following constraints must be satisfied for each worker:
  - works for either 20 or 21 days,
  - works no more than 6 consecutive days,
  - works no fewer than 3 consecutive days,
  - has no isolated day off; days off must be consecutive.


## QUBO formulation for the shift scheduling problem
The QUBO formulation uses a $6\times 33$ matrix of binary variables $X=(x_{i,j})$ ($0\leq i\leq 5, 0\leq j\leq 32$) where worker $i$ works on day $j$ if and only if $x_{i,j}=1$.

Since all workers are off on day 0 and day 32, we fix

$$
\begin{aligned}
x_{i,0}=x_{i,32}=0 & &(0\leq i\leq 5).
\end{aligned}
$$

The constraints are formulated as follows.

### Daily staffing constraint
Exactly 4 workers must be scheduled on each day:

$$
\begin{aligned}
\sum_{i=0}^{5} x_{i,j} = 4& &(1\leq j\leq 31)
\end{aligned}
$$

### Total working days constraint
Each worker must work for either 20 or 21 days:

$$
\begin{aligned}
20\leq \sum_{j=0}^{32} x_{i,j} \leq 21& &(0\leq i\leq 5)
\end{aligned}
$$

### Maximum consecutive working days constraint
No worker may work for more than 6 consecutive days:

$$
\begin{aligned}
 x_{i,j}x_{i,j+1}x_{i,j+2}x_{i,j+3}x_{i,j+4}x_{i,j+5}x_{i,j+6} = 0 & &(0\leq i\leq 5, 0\leq j\leq 26)\\
\end{aligned}
$$

### Minimum consecutive working days constraint
Each working period must consist of at least 3 consecutive working days:

$$
\begin{aligned}
 \bar{x}_{i,j}x_{i,j+1}x_{i,j+2}\bar{x}_{i,j+3} = 0 & &(0\leq i\leq 5, 0\leq j\leq 29)\\
\bar{x}_{i,j}x_{i,j+1}\bar{x}_{i,j+2} = 0 & & (0\leq i\leq 5, 0\leq j \leq 30)
\end{aligned}
$$

### No isolated day off constraint
No worker may have a single day off between two working days:

$$
\begin{aligned}
 x_{i,j}\bar{x}_{i,j+1}x_{i,j+2} = 0 & &(0\leq i\leq 5, 0\leq j\leq 30)\\
\end{aligned}
$$

### Total worker cost
Let $C=(c_i)$ be a cost vector, where $c_i$ denotes the daily cost of assigning worker $i$.
The total worker cost is formulated as:

$$
\begin{aligned}
\sum_{i=0}^5\sum_{j=0}^{32} c_i x_{i,j}
\end{aligned}
$$

This objective function is minimized subject to the constraints described above.

## PyQBPP program for the shift scheduling
The shift scheduling problem defined above can be formulated and solved using PyQBPP as follows:
```python
import pyqbpp as qbpp

days = 31
worker_cost = [13, 13, 12, 12, 11, 10]
workers = len(worker_cost)

x = qbpp.var("x", shape=(workers, days + 2))

workers_each_day = qbpp.vector_sum(x, 0)
each_day_4_workers = 0
for j in range(1, days + 1):
    each_day_4_workers += qbpp.constrain(workers_each_day[j], equal=4)

workers_working_days = qbpp.vector_sum(x)
work_20_21_days = 0
for i in range(workers):
    work_20_21_days += qbpp.constrain(workers_working_days[i], between=(20, 21))

no_more_than_6_consecutive_working_days = 0
for w in range(workers):
    for j in range(days - 5):
        no_more_than_6_consecutive_working_days += (
            x[w][j] * x[w][j+1] * x[w][j+2] * x[w][j+3] *
            x[w][j+4] * x[w][j+5] * x[w][j+6])

no_less_than_3_consecutive_working_days = 0
for w in range(workers):
    for j in range(days - 1):
        no_less_than_3_consecutive_working_days += (
            ~x[w][j] * x[w][j+1] * x[w][j+2] * ~x[w][j+3])
    for j in range(days):
        no_less_than_3_consecutive_working_days += (
            ~x[w][j] * x[w][j+1] * ~x[w][j+2])

no_single_day_off = 0
for w in range(workers):
    for j in range(days):
        no_single_day_off += x[w][j] * ~x[w][j+1] * x[w][j+2]

total_worker_cost = 0
for i in range(workers):
    total_worker_cost += worker_cost[i] * workers_working_days[i]

constraints = (work_20_21_days + no_less_than_3_consecutive_working_days +
               no_more_than_6_consecutive_working_days +
               no_single_day_off + each_day_4_workers)
f = total_worker_cost + 10000 * constraints

ml = {x[i][0]: 0 for i in range(workers)}
ml.update({x[i][days + 1]: 0 for i in range(workers)})
f.simplify_as_binary()

g = qbpp.replace(f, ml)
g.simplify_as_binary()

solver = qbpp.EasySolver(g)
sol = solver.search(time_limit=5.0, target_energy=0)

full_sol = qbpp.Sol(f).set(sol, ml)

for i in range(workers):
    wd = full_sol(workers_working_days[i])
    bits = "".join(str(full_sol(x[i][j])) for j in range(1, days + 1))
    print(f"Worker {i}: {wd} days worked: {bits}")

day_counts = "".join(str(full_sol(workers_each_day[d])) for d in range(1, days + 1))
print(f"Workers each day        : {day_counts}")
print(f"Total worker cost: {full_sol(total_worker_cost)}")
print(f"Constraints violations: {full_sol(constraints)}")
```
In this program, the variables and expressions are defined as follows:
- `x`: A $6\times 33$ matrix of binary variables,
- `workers_each_day`: An array containing the column-wise sums of `x`, representing the number of workers assigned to each day.
- `each_day_4_workers`: A constraint expression that attains a minimum value of 0 if and only if exactly four workers are assigned to each day.
- `workers_working_days`: An array of row-wise sums of `x`, representing the total number of working days for each worker.
- `work_20_21_days`: A constraint expression that attains a minimum value of 0 if and only if each worker works for either 20 or 21 days.
- `no_more_than_6_consecutive_working_days`: A constraint expression that attains a minimum value of 0 if and only if no worker works for 7 or more consecutive days.
- `no_less_than_3_consecutive_working_days`: A constraint expression that attains a minimum value of 0 if and only if every working period consists of at least 3 consecutive working days.
- `no_single_day_off`: A constraint expression that attains a minimum value of 0 if and only if no worker has a single day off between two working days.
- `constraints`: The sum of all constraint expressions.
- `total_worker_cost`: An expression representing the total worker cost.

### QUBO construction and solution
By summing `total_worker_cost` and `constraints` with a penalty factor of 10000,
we obtain an expression `f`, which represents a QUBO formulation of the shift scheduling problem.

A Python `dict` `ml` is used to fix the values of the variables corresponding to day 0 and day 32.
Applying `qbpp.replace()` to `f` with `ml` yields a new expression `g`.

The Easy Solver is then applied to `g`, and the resulting solution is stored in `sol`.
To evaluate the original expressions (which still refer to the fixed variables), we build
`full_sol = qbpp.Sol(f).set(sol, ml)`, which combines the fixed values in `ml` with the
values in `sol`.

The obtained solution is as follows:
```
Worker 0: 20 days worked: 0001111001110011111001111001111
Worker 1: 20 days worked: 1111001111110001111110011110000
Worker 2: 21 days worked: 0000111100111110011111100111111
Worker 3: 21 days worked: 1111110011111100111000111111000
Worker 4: 21 days worked: 1111100111001111000111000111111
Worker 5: 21 days worked: 1110011110001111100111111000111
Workers each day        : 4444444444444444444444444444444
Total worker cost: 1465
Constraints violations: 0
```
We observe that a feasible shift schedule with a total worker cost of `1465` is obtained, and all constraints are satisfied.
