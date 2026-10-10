---
last_modified: 2026-10-08
layout: default
nav_exclude: true
title: "Machine Scheduling with Due Dates"
nav_order: 59
lang: en
hreflang_alt: "ja/MACHINE_SCHEDULING"
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
The same problem can be tried in the browser in the [Machine Scheduling demo](demos/machine-scheduling/).

The orders are as follows (times in minutes; – means that the machine cannot process the order):

| Order | Due date | Machine 1 | Machine 2 | Machine 3 |
|---:|---:|---:|---:|---:|
| 1 | 250 | – | 75 | – |
| 2 | 170 | 95 | – | 160 |
| 3 | 320 | 90 | – | 140 |
| 4 | 405 | 65 | – | – |
| 5 | 190 | 95 | 155 | 155 |
| 6 | 355 | 85 | 95 | – |
| 7 | 360 | 40 | 60 | 80 |
| 8 | 225 | 85 | 120 | 135 |
| 9 | 480 | 80 | 130 | 145 |
| 10 | 100 | 100 | 100 | – |
| 11 | 300 | 110 | 135 | 175 |
| 12 | 500 | 90 | 150 | – |

A faster machine saves time, but putting every order on its fastest machine overloads machine 1,
and 10 of the 12 orders then miss their due dates.

## Formulation

We use a binary variable $y_{j,m}$ that is 1 if order $j$ is processed on machine $m$,
only for the pairs where machine $m$ can process order $j$
(27 variables for these orders).

The order in which a machine processes its orders does not change the total processing time.
If some order of the jobs on a machine meets all their due dates,
processing them in due-date order does too.
So every machine processes its orders in due-date order, and only the assignment has to be decided.
With the orders numbered in due-date order, order $j$ finishes on machine $m$ at

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

Each constraint is written with `qbpp::cons()` and given the weight 100000,
much larger than any total processing time.
QUBO++ handles these constraints directly, so the inequalities need no slack variables.

## Program

{% raw %}
```cpp
#include <algorithm>
#include <iostream>
#include <numeric>
#include <vector>

#include <qbpp/easy_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  // due date and processing times (minutes) on machines 1, 2, 3 (0: cannot process)
  std::vector<int> due = {250, 170, 320, 405, 190, 355, 360, 225, 480, 100, 300, 500};
  std::vector<std::vector<int>> time = {
      {0, 75, 0},     {95, 0, 160},  {90, 0, 140},    {65, 0, 0},
      {95, 155, 155}, {85, 95, 0},   {40, 60, 80},    {85, 120, 135},
      {80, 130, 145}, {100, 100, 0}, {110, 135, 175}, {90, 150, 0}};
  int n = due.size();
  int machines = 3;

  // orders sorted by due date
  std::vector<int> order(n);
  std::iota(order.begin(), order.end(), 0);
  std::stable_sort(order.begin(), order.end(),
                   [&](int a, int b) { return due[a] < due[b]; });

  auto y = qbpp::var("y", n, machines);
  qbpp::Expr f;
  for (int j = 0; j < n; ++j)
    for (int m = 0; m < machines; ++m)
      if (time[j][m] > 0) f += time[j][m] * y[j][m];

  // each order is processed on exactly one machine
  for (int j = 0; j < n; ++j) {
    qbpp::Expr row;
    for (int m = 0; m < machines; ++m)
      if (time[j][m] > 0) row += y[j][m];
    f += 100000 * qbpp::cons(row == 1);
  }

  // each order finishes by its due date
  for (int m = 0; m < machines; ++m) {
    qbpp::Expr finish;
    for (int j : order) {
      if (time[j][m] == 0) continue;
      finish += time[j][m] * y[j][m];
      f += 100000 * qbpp::cons(finish <= due[j]);
    }
  }
  f.simplify_as_binary();

  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"time_limit", 1.0}});

  int total = 0;
  for (int m = 0; m < machines; ++m) {
    std::cout << "Machine " << m + 1 << ":";
    int t = 0;
    for (int j : order) {
      if (time[j][m] == 0 || sol(y[j][m]) == 0) continue;
      std::cout << " #" << j + 1 << "(" << t << "-" << t + time[j][m] << ")";
      t += time[j][m];
      total += time[j][m];
    }
    std::cout << std::endl;
  }
  std::cout << "Total processing time: " << total << std::endl;
}
```
{% endraw %}

This program prints the orders on each machine with their start and finish times:

```
Machine 1: #2(0-95) #5(95-190) #11(190-300) #7(300-340) #4(340-405) #12(405-495)
Machine 2: #10(0-100) #1(100-175) #6(175-270) #9(270-400)
Machine 3: #8(0-135) #3(135-275)
Total processing time: 1170
```

- `order` lists the orders in due-date order, and `y` holds the variables $y_{j,m}$.
- `f` is the total processing time plus the constraints.
  `finish` is the finish time $C_{j,m}$ of order `j` on machine `m`, so `finish <= due[j]` is its due date.
- `EasySolver` searches for 1 second.

Every order meets its due date, and the total processing time is 1170 minutes.
Enumerating all assignments confirms that this is the smallest possible for these orders.

## Minimizing the makespan

In the schedule above, machine 1 works until 495 minutes while machine 3 stops at 275.
To minimize the makespan, we add a [native integer variable](NATIVE_INTEGER) $z$ for the makespan,
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
The total processing time of these orders can change by at most 466 minutes
(the sum over the orders of the slowest minus the fastest processing time).
So the makespan is minimized first,
and the total processing time decides among the schedules with the same makespan.

The program declares $z$ with `0 <= qbpp::int_var("z") <= 600` and adds the new terms after the due dates:

{% raw %}
```cpp
#include <algorithm>
#include <iostream>
#include <numeric>
#include <vector>

#include <qbpp/easy_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  // due date and processing times (minutes) on machines 1, 2, 3 (0: cannot process)
  std::vector<int> due = {250, 170, 320, 405, 190, 355, 360, 225, 480, 100, 300, 500};
  std::vector<std::vector<int>> time = {
      {0, 75, 0},     {95, 0, 160},  {90, 0, 140},    {65, 0, 0},
      {95, 155, 155}, {85, 95, 0},   {40, 60, 80},    {85, 120, 135},
      {80, 130, 145}, {100, 100, 0}, {110, 135, 175}, {90, 150, 0}};
  int n = due.size();
  int machines = 3;

  // orders sorted by due date
  std::vector<int> order(n);
  std::iota(order.begin(), order.end(), 0);
  std::stable_sort(order.begin(), order.end(),
                   [&](int a, int b) { return due[a] < due[b]; });

  auto y = qbpp::var("y", n, machines);
  qbpp::Expr f;
  for (int j = 0; j < n; ++j)
    for (int m = 0; m < machines; ++m)
      if (time[j][m] > 0) f += time[j][m] * y[j][m];

  // each order is processed on exactly one machine
  for (int j = 0; j < n; ++j) {
    qbpp::Expr row;
    for (int m = 0; m < machines; ++m)
      if (time[j][m] > 0) row += y[j][m];
    f += 100000 * qbpp::cons(row == 1);
  }

  // each order finishes by its due date
  for (int m = 0; m < machines; ++m) {
    qbpp::Expr finish;
    for (int j : order) {
      if (time[j][m] == 0) continue;
      finish += time[j][m] * y[j][m];
      f += 100000 * qbpp::cons(finish <= due[j]);
    }
  }

  // makespan z: every machine finishes by z
  auto z = 0 <= qbpp::int_var("z") <= 600;
  f += 100 * z;
  for (int m = 0; m < machines; ++m) {
    qbpp::Expr load;
    for (int j = 0; j < n; ++j)
      if (time[j][m] > 0) load += time[j][m] * y[j][m];
    f += 100000 * qbpp::cons(load - z <= 0);
  }
  f.simplify_as_binary();

  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"time_limit", 1.0}});

  int total = 0;
  for (int m = 0; m < machines; ++m) {
    std::cout << "Machine " << m + 1 << ":";
    int t = 0;
    for (int j : order) {
      if (time[j][m] == 0 || sol(y[j][m]) == 0) continue;
      std::cout << " #" << j + 1 << "(" << t << "-" << t + time[j][m] << ")";
      t += time[j][m];
      total += time[j][m];
    }
    std::cout << std::endl;
  }
  std::cout << "Makespan: " << sol(z) << std::endl;
  std::cout << "Total processing time: " << total << std::endl;
}
```
{% endraw %}

This program prints

```
Machine 1: #2(0-95) #5(95-190) #11(190-300) #7(300-340) #4(340-405)
Machine 2: #10(0-100) #1(100-175) #6(175-270) #12(270-420)
Machine 3: #8(0-135) #3(135-275) #9(275-420)
Makespan: 420
Total processing time: 1245
```

The makespan drops from 495 to 420 minutes,
and the total processing time grows from 1170 to 1245 minutes in exchange.

## Try it in the browser

In the [Machine Scheduling demo](demos/machine-scheduling/) you can edit the orders, move them on a chart,
choose the objective, and solve the model on a server.
The demo also accepts orders whose due dates cannot all be met:
it then minimizes the total lateness first, written with `relu()`.
