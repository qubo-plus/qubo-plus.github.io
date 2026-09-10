---
last_modified: 2026-09-01
layout: default
nav_exclude: true
title: "Knapsack"
nav_order: 70
lang: en
hreflang_alt: "ja/python/KNAPSACK"
hreflang_lang: "ja"
---

# Knapsack Problem
Given a set of items, each with a weight and a value, and a knapsack with a limited weight capacity, **the knapsack problem** aims to select a subset of items that maximizes the total value while keeping the total weight within the capacity.

Let $w_i$ and $v_i$ ($0\leq i\leq n-1$) denote the weight and value of item
$i$, respectively.
Let $S\in \lbrace 0, 1, \ldots n-1\rbrace$ be the set of selected items.

$$
\begin{aligned}
\text{Maximize:} & \sum_{i\in S} v_i \\
\text{Subject to:} & \sum_{i\in S} w_i \leq W
\end{aligned}
$$

where $W$ is the weight capacity of the knapsack.

## QUBO formulation
To formulate this problem as a QUBO, we introduce a set
$X$ of $n$ binary variables $x_i\in\lbrace 0,1\rbrace$ ($0\leq i\leq n-1$),
where item $i$ is selected if and only if $x_i=1$.

The above formulation can be rewritten as:

$$
\begin{aligned}
\text{Maximize:} & \sum_{i=0}^{n-1} v_ix_i \\
\text{Subject to:} & \sum_{i=0}^{n-1} w_ix_i \leq W
\end{aligned}
$$

PyQBPP lets you express this capacity constraint (an **inequality
constraint**) in three ways: as the conventional **penalty
expression** written with comparison operators, with the
**nonlinear function** `relu`, or with the **native constraint**
`cons()`. Below we solve the same instance in all three styles and
compare the penalty values, the size of the model, and the
information each one provides (see
[Nonlinear Functions and Native Constraints](CONSTRAINTS) for the
general description of nonlinear functions and native constraints).

## PyQBPP program
The constraint can be expressed using **the range operator**
`(lo <= expr) & (qbpp.same <= hi)` provided by PyQBPP.
The resulting QUBO objective function is defined as:

$$
\begin{aligned}
f(X) &= -\sum_{i=0}^{n-1} v_ix_i + P\times (0\leq \sum_{i=0}^{n-1} w_ix_i \leq W)
\end{aligned}
$$

Since QUBO solvers minimize the objective function, the original maximization objective is negated.
The constant $P$ is a sufficiently large penalty parameter to enforce the constraint.

The following PyQBPP program solves a knapsack problem with 10 items using the Exhaustive Solver:
```python
import pyqbpp as qbpp

w = qbpp.array([10, 20, 30, 5, 8, 15, 12, 7, 17, 18])
v = qbpp.array([60, 100, 120, 60, 80, 150, 110, 70, 150, 160])
capacity = 50

x = qbpp.var("x", shape=len(w))

constraint = (0 <= qbpp.sum(w * x)) & (qbpp.same <= capacity)
objective = qbpp.sum(v * x)

f = -objective + 1000 * constraint
f.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)
for idx, sol in enumerate(result.sols):
    print(f"[Solution {idx}]")
    print(f"Energy = {sol.energy}")
    print(f"Constraint = {sol(constraint.body)}")
    print(f"Objective = {sol(objective)}")
    for j in range(len(w)):
        if sol(x[j]) == 1:
            print(f"Item {j}: weight = {w[j]}, value = {v[j]}")
```

In this program, the expressions `constraint` and `objective` are constructed separately and combined into the final QUBO expression `f` using a penalty coefficient of `1000`.
The Exhaustive Solver is then applied to `f` to enumerate all optimal solutions.

The following output shows the optimal solutions, including the energy, constraint value, and objective value:
```
[Solution 0]
Energy = -480
Constraint = 50
Objective = 480
Item 3: weight = 5, value = 60
Item 5: weight = 15, value = 150
Item 6: weight = 12, value = 110
Item 9: weight = 18, value = 160
[Solution 1]
Energy = -480
Constraint = 50
Objective = 480
Item 3: weight = 5, value = 60
Item 4: weight = 8, value = 80
Item 6: weight = 12, value = 110
Item 7: weight = 7, value = 70
Item 9: weight = 18, value = 160
```
We can observe that this instance has two optimal solutions, both achieving a total value of `480` while exactly satisfying the capacity constraint.

The range expression `(0 <= qbpp.sum(w * x)) & (qbpp.same <= capacity)`
is expanded into a polynomial that attains its minimum value 0
exactly when the constraint is satisfied (see
[Comparison Constraints](COMPARISON) and
[Range Constraints](RANGE)). Building this polynomial introduces
**slack auxiliary variables** and expands the square. Since the
result is an ordinary quadratic expression, it can be handled as is
by every QUBO++ solver and also by external QUBO tools that do not
support native constraints — this is the most portable form. The
penalty value for a violation $v$ is $v(v+1)$.

## Using `relu` for the capacity constraint

With the nonlinear function `qbpp.relu`, the squared penalty on the
**excess only**, $\max(0, \mathrm{load} - W)^2$, can be written
directly. The following program defines the total-weight expression
`load` and writes the capacity constraint in the single line
`1000 * qbpp.relu(load - capacity, 2)`:

```python
import pyqbpp as qbpp

w = qbpp.array([10, 20, 30, 5, 8, 15, 12, 7, 17, 18])
v = qbpp.array([60, 100, 120, 60, 80, 150, 110, 70, 150, 160])
capacity = 50

x = qbpp.var("x", shape=len(w))
load = qbpp.sum(w * x)
objective = qbpp.sum(v * x)

f = -objective + 1000 * qbpp.relu(load - capacity, 2)
f.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(f).search()
print(f"Energy = {sol.energy}")
print(f"value = {sol(objective)}, weight = {sol(load)}")
```

The output of the program is as follows:

```
Energy = -480
value = 480, weight = 50
```

No slack variables are introduced and no squaring takes place — the
linear expression `load - capacity` is kept unexpanded as the body
of the function. The penalty value for a violation $v$ is $v^2$.
Note that `relu` is a pure **objective term** with no semantics; it
is not treated as a constraint. It can also be used when you want to
allow the excess but charge a cost for it (like a soft overage fee).

## Using `qbpp.cons()` for the capacity constraint

To **declare** the capacity constraint as a constraint, wrap the
range expression in `qbpp.cons()`. Again, only the line that writes
the constraint changes:

```python
import pyqbpp as qbpp

w = qbpp.array([10, 20, 30, 5, 8, 15, 12, 7, 17, 18])
v = qbpp.array([60, 100, 120, 60, 80, 150, 110, 70, 150, 160])
capacity = 50

x = qbpp.var("x", shape=len(w))
load = qbpp.sum(w * x)
objective = qbpp.sum(v * x)

f = -objective + 1000 * qbpp.cons((0 <= load) & (qbpp.same <= capacity))
f.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(f).search()
print(f"Energy = {sol.energy}")
print(f"value = {sol(objective)}, weight = {sol(load)}")
print(f"violated constraints = {f.cons(sol)}")
```

The output of the program is as follows:

```
Energy = -480
value = 480, weight = 50
violated constraints = 0
```

The value of a constraint declared with `cons()` is the squared
violation $v^2$ — the **same value** as `relu`. The difference is
the semantics — because the expression is declared as a constraint,
`f.cons(sol)` returns the number of violated constraints,
`violations()` reports the violation of each constraint,
`target_energy` stops the search only when the energy reaches the
target **and all constraints are satisfied**, and the default
callback of the [EasySolver](EASYSOLVER) shows the satisfaction
progress (Viol). The bundled solvers search efficiently for
solutions that satisfy the declared constraints, which also keeps
larger knapsack instances tractable.

## Comparing the model sizes

Let us compare the size of the model passed to the solver for the
three styles. `var_count` and `term_count` of `sol.info` are the
number of variables and the number of terms of the objective
polynomial of the model:

```python
import pyqbpp as qbpp

w = qbpp.array([10, 20, 30, 5, 8, 15, 12, 7, 17, 18])
v = qbpp.array([60, 100, 120, 60, 80, 150, 110, 70, 150, 160])
capacity = 50

x = qbpp.var("x", shape=len(w))
load = qbpp.sum(w * x)
objective = qbpp.sum(v * x)

f1 = -objective + 1000 * ((0 <= load) & (qbpp.same <= capacity))
f1.simplify_as_binary()
s1 = qbpp.ExhaustiveSolver(f1).search()

f2 = -objective + 1000 * qbpp.relu(load - capacity, 2)
f2.simplify_as_binary()
s2 = qbpp.ExhaustiveSolver(f2).search()

f3 = -objective + 1000 * qbpp.cons((0 <= load) & (qbpp.same <= capacity))
f3.simplify_as_binary()
s3 = qbpp.ExhaustiveSolver(f3).search()

print(f"penalty: var_count = {s1.info['var_count']}, term_count = {s1.info['term_count']}")
print(f"relu   : var_count = {s2.info['var_count']}, term_count = {s2.info['term_count']}")
print(f"cons   : var_count = {s3.info['var_count']}, term_count = {s3.info['term_count']}")
```

The output of the program is as follows:

```
penalty: var_count = 15, term_count = 120
relu   : var_count = 10, term_count = 10
cons   : var_count = 10, term_count = 10
```

With the penalty expression, 5 slack variables are added, bringing
the variable count to 15, and expanding the square increases the
term count to 120. Adding 5 slack variables multiplies the search
space by $2^5 = 32$, and more terms raise the cost of evaluating a
solution. With `relu` and `cons` no auxiliary variables are
introduced, and only the 10 terms of the objective remain in the
model — the body of the capacity constraint (a 10-term linear
expression) is kept as is without expansion. The wider the range of
the constrained expression and the more constraints the problem
has, the larger this difference becomes.

## When the penalty weight is small

The penalty values differ: $v(v+1)$ for the penalty expression and
$v^2$ for `relu(..., 2)` and `cons()`. With a sufficiently large
weight (1000 in the examples above), all three styles reach the same
feasible optimum, but with a small weight the difference shows up in
the result. The following program solves the same problem with
weight 6:

```python
import pyqbpp as qbpp

w = qbpp.array([10, 20, 30, 5, 8, 15, 12, 7, 17, 18])
v = qbpp.array([60, 100, 120, 60, 80, 150, 110, 70, 150, 160])
capacity = 50

x = qbpp.var("x", shape=len(w))
load = qbpp.sum(w * x)
objective = qbpp.sum(v * x)

f1 = -objective + 6 * ((0 <= load) & (qbpp.same <= capacity))
f1.simplify_as_binary()
s1 = qbpp.ExhaustiveSolver(f1).search()
print(f"penalty: value = {s1(objective)}, weight = {s1(load)}")

f2 = -objective + 6 * qbpp.relu(load - capacity, 2)
f2.simplify_as_binary()
s2 = qbpp.ExhaustiveSolver(f2).search()
print(f"relu   : value = {s2(objective)}, weight = {s2(load)}")

f3 = -objective + 6 * qbpp.cons((0 <= load) & (qbpp.same <= capacity))
f3.simplify_as_binary()
s3 = qbpp.ExhaustiveSolver(f3).search()
print(f"cons   : value = {s3(objective)}, weight = {s3(load)}, violated constraints = {f3.cons(s3)}")
```

The output of the program is as follows:

```
penalty: value = 480, weight = 50
relu   : value = 510, weight = 52
cons   : value = 510, weight = 52, violated constraints = 1
```

For the solution that exceeds the capacity by 2 and gains 30 in
value (value = 510, weight = 52), the penalty expression charges
$6 \times 2 \times 3 = 36 > 30$, so the violation does not pay off
and the feasible optimum is returned. With `relu` and `cons` the
charge is $6 \times 2^2 = 24 < 30$, so the violating solution has
the lower energy. With the same weight, a different penalty
definition returns a different solution. When migrating an existing
penalty-expression model to `relu` or `cons()`, revisit the weights
with this difference in mind (see "Note on the meaning of the
weights" in
[Nonlinear Functions and Native Constraints](CONSTRAINTS)).
Note that only `cons()`, which declares the constraint, can detect
such a violation mechanically (`violated constraints = 1`).

## Summary

| Formulation | Penalty for violation $v$ | Model | Characteristics |
|---|---|---|---|
| `(0 <= load) & (qbpp.same <= capacity)` | $v(v+1)$ | slack variables + squared expansion | most portable; works with external QUBO tools |
| `qbpp.relu(load - capacity, 2)` | $v^2$ | no expansion | objective term charging the excess |
| `qbpp.cons((0 <= load) & (qbpp.same <= capacity))` | $v^2$ | no expansion | declared as a constraint; participates in violation counting and `target_energy` |

With a sufficiently large weight, all three styles find the same
optimum. Use `cons()` for a condition that must be satisfied,
`relu` for a quantity whose excess should be allowed but charged,
and the penalty expression when the model must be passed to an
external QUBO tool that does not support native constraints. See
[Nonlinear Functions and Native Constraints](CONSTRAINTS) for the
list of supported solvers and the detailed rules. For a similar
comparison of an equality constraint and an objective, see
[Three Formulations of the Partitioning Problem](PARTITION_FORMULATIONS).
