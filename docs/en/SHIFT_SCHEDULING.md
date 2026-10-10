---
last_modified: 2026-10-10
layout: default
nav_exclude: true
title: "Shift Scheduling"
nav_order: 31
lang: en
hreflang_alt: "ja/SHIFT_SCHEDULING"
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


## Formulation of the shift scheduling problem
The formulation uses a $6\times 33$ matrix of binary variables $X=(x_{i,j})$ ($0\leq i\leq 5, 0\leq j\leq 32$) where worker $i$ works on day $j$ if and only if $x_{i,j}=1$.

Since all workers are off on day 0 and day 32, we fix

$$
\begin{aligned}
x_{i,0}=x_{i,32}=0 & &(0\leq i\leq 5).
\end{aligned}
$$

The constraints are formulated as follows. The minimum consecutive working days and no isolated day off constraints are written as products, representing the forbidden working patterns, that must be 0.

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
No worker may work for more than 6 consecutive days; that is, any 7 consecutive days contain at most 6 working days:

$$
\begin{aligned}
 \sum_{k=j}^{j+6} x_{i,k} \leq 6 & &(0\leq i\leq 5, 0\leq j\leq 26)\\
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

## QUBO++ program for the shift scheduling
The shift scheduling problem defined above can be formulated and solved using QUBO++ as follows:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  const size_t days = 31;
  const auto worker_cost = qbpp::array({13, 13, 12, 12, 11, 10});
  const size_t workers = worker_cost.size();

  auto x = qbpp::var("x", workers, days + 2);

  auto workers_each_day = qbpp::vector_sum(x, 0);
  auto each_day_4_workers = qbpp::toExpr(0);
  for (size_t j = 1; j <= days; ++j) {
    each_day_4_workers += qbpp::cons(workers_each_day[j] == 4);
  }

  auto workers_working_days = qbpp::vector_sum(x);
  auto work_20_21_days = qbpp::cons(20 <= workers_working_days <= 21);

  auto no_more_than_6_consecutive_working_days = qbpp::toExpr(0);
  for (size_t w = 0; w < workers; ++w) {
    for (size_t j = 0; j <= days - 5; ++j) {
      auto work = qbpp::toExpr(0);
      for (size_t k = j; k <= j + 6; ++k) {
        work += x[w][k];
      }
      no_more_than_6_consecutive_working_days += qbpp::cons(work <= 6);
    }
  }
  auto no_less_than_3_consecutive_working_days = qbpp::toExpr(0);
  for (size_t w = 0; w < workers; ++w) {
    for (size_t j = 0; j < days - 1; ++j) {
      no_less_than_3_consecutive_working_days +=
          qbpp::cons(~x[w][j] * x[w][j + 1] * x[w][j + 2] * ~x[w][j + 3]);
    }
    for (size_t j = 0; j < days; ++j) {
      no_less_than_3_consecutive_working_days +=
          qbpp::cons(~x[w][j] * x[w][j + 1] * ~x[w][j + 2]);
    }
  }

  auto no_single_day_off = qbpp::toExpr(0);
  for (size_t w = 0; w < workers; ++w) {
    for (size_t j = 0; j <= days - 1; ++j) {
      no_single_day_off += qbpp::cons(x[w][j] * ~x[w][j + 1] * x[w][j + 2]);
    }
  }

  auto total_worker_cost = qbpp::sum(worker_cost * workers_working_days);

  auto constraints = work_20_21_days + no_less_than_3_consecutive_working_days +
                     no_more_than_6_consecutive_working_days +
                     no_single_day_off + each_day_4_workers;
  auto f = total_worker_cost + 10000 * constraints;

  qbpp::MapList ml;
  for (size_t i = 0; i < workers; ++i) {
    ml.push_back({x[i][0], 0});
    ml.push_back({~x[i][0], 1});
    ml.push_back({x[i][days + 1], 0});
    ml.push_back({~x[i][days + 1], 1});
  }
  f.simplify_as_binary();

  auto g = qbpp::replace(f, ml);
  g.simplify_as_binary();
  workers_working_days.replace(ml);

  auto solver = qbpp::EasySolver(g);
  auto sol = solver.search({{"time_limit", 5.0}});
  for (size_t i = 0; i < workers; ++i) {
    std::cout << "Worker " << i << ": " << sol(workers_working_days[i])
              << " days worked: ";
    for (size_t j = 1; j <= days; ++j) {
      std::cout << sol(x[i][j]);
    }
    std::cout << std::endl;
  }
  std::cout << "Workers each day        : ";
  for (size_t d = 1; d <= days; ++d) {
    std::cout << sol(workers_each_day[d]);
  }
  std::cout << std::endl;

  auto sol_f = qbpp::Sol(f).set(ml).set(sol);

  std::cout << "Total worker cost: " << sol_f(total_worker_cost) << std::endl;
  std::cout << "Violated constraints: " << f.cons(sol_f) << std::endl;
}
```
{% endraw %}
In this program, the variables and expressions are defined as follows:
- `x`: A $6\times 33$ matrix of binary variables,
- `workers_each_day`: An array containing the column-wise sums of `x`, representing the number of workers assigned to each day.
- `each_day_4_workers`: The constraints that exactly four workers are assigned to each day.
- `workers_working_days`: An array of row-wise sums of `x`, representing the total number of working days for each worker.
- `work_20_21_days`: The constraints that each worker works for either 20 or 21 days.
- `no_more_than_6_consecutive_working_days`: The constraints that any 7 consecutive days contain at most 6 working days.
- `no_less_than_3_consecutive_working_days`: The constraints that every working period lasts at least 3 days. The products representing a working period of one or two days must be 0.
- `no_single_day_off`: The constraints that no worker has a single day off between two working days. The products representing a single day off must be 0.
- `constraints`: The sum of all constraints.
- `total_worker_cost`: An expression representing the total worker cost.

### Solving
Each constraint is declared with `qbpp::cons()`, so the solver treats it as a constraint.
For the working-pattern constraints, the products are enclosed in `qbpp::cons()`; such a constraint is satisfied when the product is 0.
By summing `total_worker_cost` and `constraints` with a weight of 10000, we obtain an expression `f`.

A `qbpp::MapList` object `ml` is used to fix the values of the variables corresponding to day 0 and day 32.
Applying the `qbpp::replace()` function to `f` with `ml` yields a new expression `g`.

The Easy Solver is then applied to `g`, and the resulting solution is stored in `sol`.
The obtained solution is as follows:
```
Worker 0: 20 days worked: 1111110001110011111100011111000
Worker 1: 20 days worked: 1111100011111100111001111110000
Worker 2: 21 days worked: 0001111110011111100111111000111
Worker 3: 21 days worked: 1110011111100001110011111001111
Worker 4: 21 days worked: 0000111100111110011111100111111
Worker 5: 21 days worked: 1111001111001111001110000111111
Workers each day        : 4444444444444444444444444444444
Total worker cost: 1465
Violated constraints: 0
```
`f.cons(sol_f)` is the number of violated constraints. We observe that a feasible shift schedule with a total worker cost of `1465` is obtained, and all constraints are satisfied.
The total number of working days is $4\times 31=124$, so if each of the 6 workers works 20 or 21 days, four of them work 21 days and two work 20 days.
Letting the four cheapest workers work 21 days gives $21\times(12+12+11+10)+20\times(13+13)=1465$, which is the minimum total worker cost.
