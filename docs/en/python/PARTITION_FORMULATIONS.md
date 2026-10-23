---
last_modified: 2026-09-01
layout: default
nav_exclude: true
title: "Three Formulations of the Partitioning Problem"
nav_order: 36
lang: en
hreflang_alt: "ja/python/PARTITION_FORMULATIONS"
hreflang_lang: "ja"
---

# Three Formulations of the Partitioning Problem

PyQBPP lets you formulate the same problem with the conventional
**squared penalty** (`sqr`), with a **nonlinear function** (`abs`),
or with a **native constraint** (`cons()`).
This case study takes the [partition problem](PARTITION) and writes
the three formulations side by side, comparing the meaning of the
energy, the size of the model, and the information each one provides.
See [Nonlinear Functions and Native Constraints](CONSTRAINTS) for the
general description of nonlinear functions and native constraints.

The partition problem asks to split $n$ positive numbers
$w_0, w_1, \ldots, w_{n-1}$ into two sets so that the two set sums
$P$ and $Q$ are as close as possible
(see [partition problem](PARTITION) for details).
Using binary variables $x_i$, the two sums can be written as

$$
P = \sum_{i=0}^{n-1} w_i x_i, \qquad
Q = \sum_{i=0}^{n-1} w_i \overline{x_i}
$$

where $\overline{x_i}$ is the negated literal of $x_i$.
The three programs below share the construction of the expressions
`p` and `q`; only the single line that builds the objective `f` differs.

## Formulation 1: squared penalty `sqr`

The conventional QUBO formulation minimizes the squared difference
$(P - Q)^2$:

```python
import pyqbpp as qbpp

w = qbpp.array([64, 27, 47, 74, 12, 83, 63, 40])
x = qbpp.var("x", shape=len(w))
p = qbpp.sum(w * x)
q = qbpp.sum(w * ~x)
f = qbpp.sqr(p - q)
f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()
print(f"(P - Q)^2 = {sol.energy}")
print(f"P = {sol(p)}, Q = {sol(q)}")
```

The output of the program is as follows:

```
(P - Q)^2 = 0
P = 205, Q = 205
```

`simplify_as_binary()` expands the square, turning `f` into a
quadratic QUBO polynomial (the expanded expression is shown on the
[partition problem](PARTITION) page).
Since the result is an ordinary quadratic expression, it can be
handled as is by every QUBO++ solver and also by external QUBO tools
that do not support native constraints — this is the most portable
form. On the other hand, the energy is the **square** of the
difference; to know the difference itself you have to evaluate
`p` and `q`.

## Formulation 2: absolute value `abs`

With the nonlinear function `qbpp.abs`, the objective of the
partition problem, $|P - Q|$, can be written directly:

```python
import pyqbpp as qbpp

w = qbpp.array([64, 27, 47, 74, 12, 83, 63, 40])
x = qbpp.var("x", shape=len(w))
p = qbpp.sum(w * x)
q = qbpp.sum(w * ~x)
f = qbpp.abs(p - q)
f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()
print(f"|P - Q| = {sol.energy}")
print(f"P = {sol(p)}, Q = {sol(q)}")
```

The output of the program is as follows:

```
|P - Q| = 0
P = 205, Q = 205
```

The energy is the difference $|P - Q|$ **itself**, so the quality of
a solution can be read off directly. No squaring takes place: the
linear expression $P - Q$ is kept unexpanded as the body of the
function. Expressions containing `abs` are searched by the solvers
bundled with QUBO++, which handle the function value directly
(see [Nonlinear Functions and Native Constraints](CONSTRAINTS) for
the list of supported solvers).

## Formulation 3: native constraint `cons`

This formulation **declares** "$P - Q = 0$ (an even split)" as a
constraint. There is no objective function; the model consists of
the constraint alone:

```python
import pyqbpp as qbpp

w = qbpp.array([64, 27, 47, 74, 12, 83, 63, 40])
x = qbpp.var("x", shape=len(w))
p = qbpp.sum(w * x)
q = qbpp.sum(w * ~x)
f = qbpp.cons(p - q == 0)
f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()
print(f"Energy = {sol.energy}")
print(f"P = {sol(p)}, Q = {sol(q)}")
print(f"violated constraints = {f.cons(sol)}")
```

The output of the program is as follows:

```
Energy = 0
P = 205, Q = 205
violated constraints = 0
```

The value of an equality constraint declared with `cons()` is the
squared violation $(P - Q)^2$, so the energy is the same as in
Formulation 1. The difference is the semantics — because the
expression is declared as a constraint, `f.cons(sol)` returns the
number of violated constraints, `violations()` reports the violation
of each constraint, and `target_energy` stops the search only when
the energy reaches the target **and all constraints are satisfied**.
When solving large instances with the [EasySolver](EASYSOLVER),
setting `target_energy` to 0 stops the search as soon as a perfect
partition is found.

## Comparing the model sizes

Let us compare the size of the model passed to the solver for the
three formulations. `var_count` and `term_count` of `sol.info` are
the number of variables and the number of terms of the objective
polynomial of the model:

```python
import pyqbpp as qbpp

w = qbpp.array([64, 27, 47, 74, 12, 83, 63, 40])
x = qbpp.var("x", shape=len(w))
p = qbpp.sum(w * x)
q = qbpp.sum(w * ~x)

f1 = qbpp.sqr(p - q)
f1.simplify_as_binary()
s1 = qbpp.ExhaustiveSolver(f1).search()

f2 = qbpp.abs(p - q)
f2.simplify_as_binary()
s2 = qbpp.ExhaustiveSolver(f2).search()

f3 = qbpp.cons(p - q == 0)
f3.simplify_as_binary()
s3 = qbpp.ExhaustiveSolver(f3).search()

print(f"sqr : var_count = {s1.info['var_count']}, term_count = {s1.info['term_count']}")
print(f"abs : var_count = {s2.info['var_count']}, term_count = {s2.info['term_count']}")
print(f"cons: var_count = {s3.info['var_count']}, term_count = {s3.info['term_count']}")
```

The output of the program is as follows:

```
sqr : var_count = 8, term_count = 36
abs : var_count = 8, term_count = 0
cons: var_count = 8, term_count = 0
```

With `sqr`, expanding the square produces a QUBO polynomial with
8 linear terms and $\binom{8}{2} = 28$ quadratic terms, 36 terms in
total. With `abs` and `cons` no expansion takes place — the objective
polynomial is empty (`term_count = 0`), and the 8-term linear
expression $P - Q$ is kept as is as the body of the function or the
constraint.

In general, with $n$ numbers the term count of `sqr` grows to
$n(n + 1)/2$ — about 500,000 terms for $n = 1000$. The body used by
`abs` and `cons` remains a linear expression with $n$ terms, so both
building the model and evaluating a solution stay cheap, and the gap
widens as the instance grows.

## When no perfect partition exists

The difference in the meaning of the energies shows up clearly on an
instance that has no perfect partition (no split with $P = Q$).
The following program solves the three formulations on 8 numbers
whose best split leaves a difference of 5:

```python
import pyqbpp as qbpp

w = qbpp.array([17, 18, 39, 61, 84, 85, 88, 89])
x = qbpp.var("x", shape=len(w))
p = qbpp.sum(w * x)
q = qbpp.sum(w * ~x)

f1 = qbpp.sqr(p - q)
f1.simplify_as_binary()
print(f"sqr : {qbpp.ExhaustiveSolver(f1).search().energy}")

f2 = qbpp.abs(p - q)
f2.simplify_as_binary()
print(f"abs : {qbpp.ExhaustiveSolver(f2).search().energy}")

f3 = qbpp.cons(p - q == 0)
f3.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(f3).search()
print(f"cons: {sol.energy}, violated constraints = {f3.cons(sol)}")
print(f"P = {sol(p)}, Q = {sol(q)}")
```

The output of the program is as follows:

```
sqr : 25
abs : 5
cons: 25, violated constraints = 1
P = 243, Q = 238
```

The best split is $P = 243$, $Q = 238$, with a difference of 5.
The energy of `sqr` and `cons` is $5^2 = 25$ and the energy of `abs`
is 5, exactly as their definitions state. With `cons`, no split
satisfies the constraint $P - Q = 0$, so one violated constraint is
reported — but the solver does not fail; it returns the solution
with the smallest violation (= the best split). When a constraint
cannot be satisfied, you still get the solution closest to
satisfying it — this is the soft semantics of native constraints.

## Summary

| Formulation | Energy | Model | Characteristics |
|---|---|---|---|
| `qbpp.sqr(p - q)` | $(P - Q)^2$ | expanded to quadratic ($n(n+1)/2$ terms) | most portable; works with external QUBO tools |
| `qbpp.abs(p - q)` | $\lvert P - Q \rvert$ | no expansion ($n$-term body) | energy is the difference itself |
| `qbpp.cons(p - q == 0)` | $(P - Q)^2$ | no expansion ($n$-term body) | declared as a constraint; participates in violation counting and `target_energy` |

All three formulations produce the same optimal partition.
Use `abs` when you want to read the quantity of interest (the
difference) directly as the energy, `cons()` when you want to declare
the even split as a constraint and track its satisfaction, and `sqr`
when the model must be passed to an external QUBO tool that does not
support native constraints. See
[Nonlinear Functions and Native Constraints](CONSTRAINTS) for the
list of supported solvers and the detailed rules. For a similar
comparison of an inequality constraint, see
the [knapsack problem](KNAPSACK) page.
