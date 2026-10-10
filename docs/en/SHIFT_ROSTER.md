---
last_modified: 2026-10-10
layout: default
nav_exclude: true
title: "Day and Night Shift Roster"
nav_order: 62
lang: en
hreflang_alt: "ja/SHIFT_ROSTER"
hreflang_lang: "ja"
---

# Day and Night Shift Roster

A workplace runs a day shift and a night shift every day, weekends included.
Its 11 staff are 3 managers, 3 skilled workers and 5 regular staff.
We make a roster for four weeks starting on a Monday.
Some staff have asked for days off: paid leave on a weekday, or no holiday work on a weekend day.
The roster must follow these rules:

1. Each day a person works the day shift, the night shift, or is off.
   Nobody works on a requested day off; other days, weekdays included, may be off too.
2. A weekday day shift has exactly 5 staff; a weekday night shift and every weekend shift have exactly 3.
3. A weekday day shift needs a manager (to deal with customers);
   a night shift and a weekend day shift need a manager or a skilled worker.
4. Nobody works more than 6 days in a row.
5. A person switching between the day shift and the night shift has at least one day off in between.

Among the rosters that follow the rules, we look for one that shares the working days,
the night shifts and the holiday work (work on weekends) as evenly as possible.
A roster with a single kind of shift is solved on the [Shift Scheduling Problem](SHIFT_SCHEDULING) page.
The same problem can be tried in the browser in the [Shift Scheduling demo](demos/shift-scheduling/).

## Formulation

We use binary variables $d_{i,t}$ and $n_{i,t}$ that are 1 if person $i$ works the day shift or the night shift on day $t$.
Let $M$ and $S$ be the managers and the skilled workers, and let $L_t$ be the staff who can lead the day shift on day $t$:
the managers on a weekday, and the managers and the skilled workers on a weekend day.
A requested day off $(i,t)$ is not written as a rule: we fix $d_{i,t} = n_{i,t} = 0$.
The five rules are, for every person $i$ and day $t$,

$$
\begin{aligned}
& d_{i,t} + n_{i,t} \le 1 && \text{rule 1}\\
& \textstyle\sum_i d_{i,t} = 5\ (\text{weekday}),\ 3\ (\text{weekend}), \qquad \sum_i n_{i,t} = 3 && \text{rule 2}\\
& \textstyle\sum_{i \in L_{t}} d_{i,t} \ge 1, \qquad \sum_{i \in M \cup S} n_{i,t} \ge 1 && \text{rule 3}\\
& \textstyle\sum_{u=t}^{t+6} (d_{i,u} + n_{i,u}) \le 6 && \text{rule 4}\\
& n_{i,t} + d_{i,t+1} \le 1, \qquad d_{i,t} + n_{i,t+1} \le 1 && \text{rule 5}
\end{aligned}
$$

and the objective is

$$
\text{minimize}\quad \sum_i \Big(\sum_t (d_{i,t} + n_{i,t})\Big)^2 + \sum_i \Big(\sum_t n_{i,t}\Big)^2 + \sum_i \Big(\sum_{t\ \text{weekend}} (d_{i,t} + n_{i,t})\Big)^2
$$

Rule 2 fixes the number of staff on every shift, so every roster has the same totals:
208 working days, 84 night shifts and 48 holiday shifts.
For a fixed total, a sum of squares is smallest when the numbers are equal: two people with 6 nights each give $72$, and 4 and 8 nights give $80$.

All the rules are linear equations and inequalities.
Each is written with `qbpp::cons()` and given the weight 100000, larger than any value of the objective
(at most $11 \times (28^2 + 28^2 + 8^2) = 17952$), so a roster that breaks a rule always has a higher energy than one that follows them.
QUBO++ handles these constraints directly, so the more than one thousand inequalities need no slack variables:
the model has only the variables $d_{i,t}$ and $n_{i,t}$, 598 of them after fixing the requested days off.

## Program

The requested days off are pairs (person, day) counted from 0, where day 0 is the first Monday.

{% raw %}
```cpp
#include <iomanip>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

#include <qbpp/abs3_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  // staff: M = manager, S = skilled worker, E = regular staff
  std::string kind = "MMMSSSEEEEE";
  int n = kind.size();
  int days = 28;  // four weeks starting on a Monday
  // requested days off {person, day}: paid leave on a weekday,
  // no holiday work on a weekend day
  std::vector<std::pair<int, int>> requests = {
      {1, 9}, {4, 3}, {6, 17}, {9, 22}, {10, 2}, {3, 15}, {0, 5}, {5, 13}, {8, 20}};
  // required staff: need[weekend][shift], shift 0 = day, 1 = night
  int need[2][2] = {{5, 3}, {3, 3}};

  auto weekend = [](int d) { return d % 7 >= 5; };
  std::vector<std::vector<bool>> off(n, std::vector<bool>(days, false));
  for (auto [i, d] : requests) off[i][d] = true;

  auto day = qbpp::var("day", n, days);
  auto night = qbpp::var("night", n, days);
  qbpp::Expr f;

  // rule 1: at most one shift a day
  for (int i = 0; i < n; ++i)
    for (int d = 0; d < days; ++d)
      f += 100000 * qbpp::cons(day[i][d] + night[i][d] <= 1);

  // rules 2 and 3: exactly the required staff and a leader on every shift
  for (int d = 0; d < days; ++d) {
    int w = weekend(d);
    qbpp::Expr day_staff, night_staff, day_lead, night_lead;
    for (int i = 0; i < n; ++i) {
      day_staff += day[i][d];
      night_staff += night[i][d];
      if (kind[i] == 'M' || (kind[i] == 'S' && w)) day_lead += day[i][d];
      if (kind[i] != 'E') night_lead += night[i][d];
    }
    f += 100000 * qbpp::cons(day_staff == need[w][0]);
    f += 100000 * qbpp::cons(night_staff == need[w][1]);
    f += 100000 * qbpp::cons(day_lead >= 1);
    f += 100000 * qbpp::cons(night_lead >= 1);
  }

  // rule 4: at most 6 working days in a row
  for (int i = 0; i < n; ++i) {
    for (int d = 0; d + 6 < days; ++d) {
      qbpp::Expr work;
      for (int t = d; t <= d + 6; ++t) work += day[i][t] + night[i][t];
      f += 100000 * qbpp::cons(work <= 6);
    }
  }

  // rule 5: a day off between a day shift and a night shift
  for (int i = 0; i < n; ++i) {
    for (int d = 0; d + 1 < days; ++d) {
      f += 100000 * qbpp::cons(night[i][d] + day[i][d + 1] <= 1);
      f += 100000 * qbpp::cons(day[i][d] + night[i][d + 1] <= 1);
    }
  }

  // objective: spread the working days, the night shifts and the holiday work
  for (int i = 0; i < n; ++i) {
    qbpp::Expr work, nights, holiday;
    for (int d = 0; d < days; ++d) {
      work += day[i][d] + night[i][d];
      nights += night[i][d];
      if (weekend(d)) holiday += day[i][d] + night[i][d];
    }
    f += qbpp::sqr(work) + qbpp::sqr(nights) + qbpp::sqr(holiday);
  }
  f.simplify_as_binary();

  // requested days off: fix the variables to 0
  qbpp::MapList ml;
  for (auto [i, d] : requests) {
    ml.push_back({day[i][d], 0});
    ml.push_back({night[i][d], 0});
  }
  auto g = qbpp::replace(f, ml);
  g.simplify_as_binary();

  auto solver = qbpp::ABS3Solver(g);
  auto sol = solver.search({{"time_limit", 10.0}});
  auto full_sol = qbpp::Sol(f).set(sol).set(ml);

  std::cout << "      MTWTFSSMTWTFSSMTWTFSSMTWTFSS  work nights holiday" << std::endl;
  for (int i = 0; i < n; ++i) {
    std::cout << kind[i] << std::setw(2) << i + 1 << "    ";
    int work = 0, nights = 0, holiday = 0;
    for (int d = 0; d < days; ++d) {
      char c = '.';
      if (off[i][d])
        c = weekend(d) ? 'x' : 'L';
      else if (full_sol(day[i][d]) == 1)
        c = 'D';
      else if (full_sol(night[i][d]) == 1)
        c = 'N';
      if (c == 'D' || c == 'N') ++work;
      if (c == 'N') ++nights;
      if (weekend(d) && (c == 'D' || c == 'N')) ++holiday;
      std::cout << c;
    }
    std::cout << std::setw(6) << work << std::setw(7) << nights << std::setw(8) << holiday
              << std::endl;
  }
  std::cout << "Sum of squares: " << f(full_sol) << std::endl;
}
```
{% endraw %}

The program prints the roster, one row per person:
`D` is a day shift, `N` a night shift, `.` a day off, `L` paid leave and `x` a weekend day kept free.
The output is, for example,

```
      MTWTFSSMTWTFSSMTWTFSSMTWTFSS  work nights holiday
M 1    .NNNNxN.DDDD.D.NN.D.DDD.DD.N    19      8       4
M 2    N.DDDD.DDLNN.NNN.DD.N.DDD.D.    19      7       4
M 3    DDDDD..NNN..N.DDDDD.N....NNN    18      8       4
S 4    NN.NNN...DDDD.NLNN.D.DDD.DDD    19      8       5
S 5    ..DLD.DDD.DD.DDDD.NN.NNNNNN.    19      8       4
S 6    D.N.DDDD.NNNNxDD.D.D.DD.NNN.    19      8       5
E 7    DDDDDD.NNNN..D..DLDD.NNNN..D    19      8       4
E 8    NNNNN.DDDD..D.DDDDD.D.NN..D.    19      7       4
E 9    DDDD.NNN.D.NNNN.DD.NxD.DDD..    19      8       5
E10    .D...N.DDDDDD.DD.NNNNNLDDD.N    19      7       5
E11    DDLD..N.N.DD.N.NNNN.DDDDDD.D    19      7       4
Sum of squares: 4790
```

- `day` and `night` are the variables $d_{i,t}$ and $n_{i,t}$.
- `day_lead` counts the staff on the day shift who can lead it (the set $L_t$),
  and `night_lead` counts the managers and skilled workers on the night shift.
- `ml` holds the value 0 for the variables of the requested days off.
  `qbpp::replace(f, ml)` replaces them with 0 (see [Replace Functions](REPLACE)), so they do not appear in `g`.
- `ABS3Solver` searches `g` for 10 seconds. `sol` holds only the variables of `g`,
  so `qbpp::Sol(f).set(sol).set(ml)` builds `full_sol`, the solution of `f` with the fixed values added.
  The program prints the roster and `f(full_sol)` from `full_sol`.

Every rule is met, and every shift has exactly the required staff; the staff not needed on a weekday get the day off.
Each person works 18 or 19 days, 7 or 8 night shifts and 4 or 5 weekend shifts.
This is the best possible: the totals 208, 84 and 48 spread over 11 people as evenly as possible give
$10 \times 19^2 + 18^2 = 3934$, $7 \times 8^2 + 4 \times 7^2 = 644$ and $4 \times 5^2 + 7 \times 4^2 = 212$,
and $3934 + 644 + 212 = 4790$ is exactly the sum printed.
The search is randomized, so another run may print a slightly larger sum.

Because a switch between the two shifts needs a day off, the night shifts come in blocks:
person 5, for example, works the night shift for six days in a row, from day 22 to day 27.

## Try it in the browser

In the [Shift Scheduling demo](demos/shift-scheduling/) you can request days off, add staff or change their kinds,
change the required staff and the limit on consecutive working days, and solve the model on a server.
Cells that break a rule are shown in red.
