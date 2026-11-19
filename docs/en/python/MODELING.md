---
last_modified: 2026-11-17
layout: default
title: "Expressive Power of PyQBPP"
nav_order: 2.5
lang: en
hreflang_alt: "ja/python/MODELING"
hreflang_lang: "ja"
---

# Expressive Power of PyQBPP

What a QUBO/HUBO solver ultimately receives is a polynomial over binary
variables. Traditionally, you had to **lower** your problem down to that form
yourself: expand integers into strings of binary variables, add slack
variables to inequalities, express absolute values and maxima with auxiliary
variables and case analysis, represent permutations and tours by combining
one-hot constraints, and reduce terms of degree 3 or higher to degree 2. Every one of those conversions adds variables, creates the chore of
tuning penalty weights, and hides the structure of the original problem.

PyQBPP does not ask you to do this.
**The model you write is the model that gets solved.**

| Manual work a plain QUBO requires | How you write it in PyQBPP | Details |
|---|---|---|
| Reduce terms of degree 3 or higher with auxiliary variables | write them as they are | [HUBO and QUBO](../HUBO_QUBO) |
| Expand $\bar{x}$ into $1-x$ (the term count explodes) | write `~x` | [Negated Literals](NEGATIVE) |
| Expand an integer into a string of binary variables | declare it with `integer=` | [Native Integer Variables](INTEGER) |
| Express absolute values and maxima with auxiliary variables and case analysis | write `qbpp.abs()` / `qbpp.max()` | [Nonlinear Functions and Native Constraints](CONSTRAINTS) |
| Add slack variables to inequalities and tune the weights | wrap it in `qbpp.cons()` | [Nonlinear Functions and Native Constraints](CONSTRAINTS) |
| Build assignments, tours, and delivery routes from one-hot constraints and tune the weights | write `qbpp.distinct()` / `qbpp.cycle()` / `qbpp.cycles()` | [Structural Constraints](STRUCTURAL) |
| Manage coefficient overflow yourself | pick a module | [Data Types of Variables and Expressions](VAREXPR) |

This page is an **overview** of these features. For the full explanation of
each one, follow the link in the rightmost column.

## Terms of Any Degree

Expressions in PyQBPP are not limited to degree 2. Terms of degree 3 or higher
can be written as they are.

```python
import pyqbpp as qbpp

y = qbpp.var("y", 4)
cubic = 2 * y[0] * y[1] * y[2] - 3 * y[1] * y[2] * y[3]
print("cubic =", cubic)
```

The output of this program is as follows:

```
cubic = 2*y[0]*y[1]*y[2] -3*y[1]*y[2]*y[3]
```

The solvers bundled with PyQBPP handle HUBO directly, so no reduction to
degree 2 is needed. Reduce to degree 2 with
[Reducing HUBO to QUBO](REDUCE) only when passing the model to an external
solver that accepts quadratic models alone.

## Negated Literals

The negation $\bar{x}$ of a binary variable $x$ is written **`~x`**. There is
no need to replace $\bar{x}$ with $1-x$ and expand.

```python
import pyqbpp as qbpp

x = qbpp.var("x", 4)
neg = ~x[0] * ~x[1] * ~x[2] * ~x[3]
expanded = qbpp.simplify((1 - x[0]) * (1 - x[1]) * (1 - x[2]) * (1 - x[3]))
print("neg      =", neg)
print("expanded =", expanded)
```

The output of this program is as follows:

```
neg      = ~x[0]*~x[1]*~x[2]*~x[3]
expanded = 1 -x[0] -x[1] -x[2] -x[3] +x[0]*x[1] +x[0]*x[2] +x[0]*x[3] +x[1]*x[2] +x[1]*x[3] +x[2]*x[3] -x[0]*x[1]*x[2] -x[0]*x[1]*x[3] -x[0]*x[2]*x[3] -x[1]*x[2]*x[3] +x[0]*x[1]*x[2]*x[3]
```

Both expressions take the same value, but one has 1 term and the other has 16.
Each additional negated literal doubles the expanded term count, so the gap
widens as the number of variables grows.

## Integer Variables — Two Choices

PyQBPP offers two kinds of integer variables with different characters.

```python
import pyqbpp as qbpp

a = qbpp.var("a", between=(0, 10))   # binary encoding
b = qbpp.var("b", integer=(0, 10))   # native integer variable
print("a =", a)
print("b =", b)
```

The output of this program is as follows:

```
a = a[0] +2*a[1] +4*a[2] +3*a[3]
b = b
```

An integer variable declared with **`between=`** is expanded on the spot into
a weighted sum of binary variables ([Binary-Encoded Integer Variables](BINARY_INTEGER)). An integer
variable declared with **`integer=`** is not expanded and holds the integer
value itself ([Integer Variables](INTEGER)). Both are used the
same way inside expressions.

| | `between=` | `integer=` |
|---|---|---|
| What it is in an expression | weighted sum of binary variables | the integer value itself |
| Bundled solvers | searched as binary variables | searched as integer values |
| Widening the range | increases the variable count | leaves the variable count unchanged |
| Binary-only external solvers | passed as is | converted with `qbpp.binarize()` |
| MILP solvers | passed as binary variables in the plain mode; in the ILP mode (`ilp=True`), restored to an integer variable when the model is linear and the variable appears as a whole | passed as integer variables in the ILP mode (`ilp=True`) |

Native integer variables suit **quantities** (counts, times, stock levels).
For a **label** that selects one of several choices (a color, for instance),
a [one-hot representation](ONEHOT) suits better than an integer variable.
Items that must take values different from each other, such as a visiting order or an assignment,
are expressed with [structural constraints](STRUCTURAL) (`distinct`, `cycle`).

## Nonlinear Functions

Absolute value, ReLU, maximum, and minimum can be used directly inside an
expression. There is no need to introduce auxiliary variables or write case
analysis.

```python
import pyqbpp as qbpp

q = qbpp.var("q", integer=(0, 10))
r = qbpp.var("r", integer=(0, 10))
over = 2 * qbpp.relu(q - 6)   # cost that grows beyond 6
gap = qbpp.abs(q - 5)         # deviation from 5
peak = qbpp.max(q, r)         # maximum of two expressions
```

Writing `qbpp.abs(f, 2)` / `qbpp.relu(f, 2)` gives the squared value. See
[Nonlinear Functions and Native Constraints](CONSTRAINTS) for details.

## Declaring Constraints

Wrapping the constraint part of an expression in **`qbpp.cons()`** marks that
part as a constraint, which is then treated specially. You do not have to add
slack variables yourself.

```python
import pyqbpp as qbpp

w = qbpp.var("w", 3)
load = 3 * w[0] + 5 * w[1] + 7 * w[2]
obj = -qbpp.sum(w)                        # objective
obj += 100 * qbpp.cons(load <= 10)        # inequality constraint
obj += 100 * qbpp.cons(qbpp.sum(w) == 2)  # equality constraint
```

Equalities, one-sided inequalities, and two-sided ranges are all declared the
same way. The solver reports how many constraints are violated, so you can
tell whether a feasible solution was found. See
[Nonlinear Functions and Native Constraints](CONSTRAINTS) for details.

## Structural Constraints

For problems whose solution must have a fixed **shape** — an assignment (a permutation), a tour, delivery routes —
the shape can be declared as a single constraint.

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(5, 5))
tour = qbpp.cycle(x)                     # a tour through all 5 sites
y = qbpp.var("y", shape=(4, 6))
assign = qbpp.distinct(y)                # 4 jobs on 6 machines, no two on the same machine
r = qbpp.var("r", shape=(3, 5, 5))
routes = qbpp.cycles(r, depot=0)         # routes of 3 vehicles from site 0
```

They are added to an expression just like the objective and `cons()`.
Unlike `cons()` they have no weight: the solutions returned by Easy Solver and ABS3 Solver always have this shape,
and there is no weight to tune as there is when the same shape is built from one-hot constraints.
`qbpp.cycle()` also takes a list of arcs and nodes that must be visited (`via=`),
so a cycle that does not pass every node, such as a shortest path, can be expressed as well.
See [Structural Constraints](STRUCTURAL) for details.

## Coefficient Types

The types of coefficients and energy values are switched by the module you
import. You can choose anything from 32-bit integers to 128-bit integers,
unlimited-precision big integers, and real-valued `float`. Expressions are
written the same way regardless of the type. See
[Data Types of Variables and Expressions](VAREXPR) for the full list.

## Putting It All Together

These features combine freely. The following program assigns production
across three lines.

- Whether line $i$ is used is a binary variable `use[i]`; using it costs a setup fee of 5
- The production of line $i$ is a native integer variable `q[i]` between 0 and 10
- Production beyond 6 incurs an overtime fee at twice the rate (`relu`)
- The imbalance between lines 0 and 1 adds to the cost (`abs`)
- A line that is off cannot produce (inequality constraint)
- The three lines produce exactly 20 in total (equality constraint)
- Shutting down all three incurs a penalty of 50 (cubic negated-literal term)

```python
import pyqbpp as qbpp

use = qbpp.var("use", 3)                 # binary variables
q = qbpp.var("q", 3, integer=(0, 10))    # native integer variables

f = 0
for i in range(3):
    f += 5 * use[i]                                 # setup fee
    f += 2 * qbpp.relu(q[i] - 6)                    # overtime fee
    f += 100 * qbpp.cons(q[i] - 10 * use[i] <= 0)   # a line that is off cannot produce
f += qbpp.abs(q[0] - q[1])                          # imbalance between lines
f += 50 * ~use[0] * ~use[1] * ~use[2]               # penalty for shutting down everything
f += 100 * qbpp.cons(qbpp.sum(q) == 20)             # meet the demand exactly

f.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(f).search()
for i in range(3):
    print(f"use[{i}] = {sol(use[i])}, q[{i}] = {sol(q[i])}")
print("energy =", sol.energy)
```

The output of this program is as follows:

```
use[0] = 1, q[0] = 7
use[1] = 1, q[1] = 7
use[2] = 1, q[2] = 6
energy = 19
```

That is a setup fee of 15, an overtime fee of 4 (two lines producing 7), an
imbalance of 0, and no constraint violation, for a total of 19. Not a single
auxiliary or slack variable appears in this model.

## A Model with a Structural Constraint

Structural constraints can be combined with the other features, too.
The following program finds a tour that leaves site 0 and comes back to it,
is at most 72 long, and maximizes the total score of the sites it visits.
It does not have to visit every site.

- Binary variable `x[i][j]` tells whether the tour goes from site $i$ to site $j$
- If an arc leaves site $i$, the score of site $i$ is earned (`qbpp.einsum("ij,i->", x, score)` multiplies `x[i][j]` by `score[i]` and sums; the expression has the opposite sign, since the total score is maximized)
- The tour is at most 72 long (an inequality constraint)
- The chosen arcs form one cycle through site 0 (`qbpp.cycle(x, via=[0])`)

```python
import pyqbpp as qbpp

n = 6
dist = qbpp.array([[0, 12, 18, 25, 16, 22],
                   [12, 0, 10, 20, 24, 30],
                   [18, 10, 0, 11, 19, 25],
                   [25, 20, 11, 0, 13, 17],
                   [16, 24, 19, 13, 0, 9],
                   [22, 30, 25, 17, 9, 0]])
score = qbpp.array([0, 8, 6, 9, 5, 7])
x = qbpp.var("x", shape=(n, n))  # x[i][j] = 1: go from site i to site j

length = qbpp.sum(dist * x)                # the length of the tour
gain = qbpp.einsum("ij,i->", x, score)     # the total score of the visited sites
f = -gain
f += 100 * qbpp.cons(length <= 72)  # the tour is at most 72 long
f += qbpp.cycle(x, via=[0])         # one cycle through site 0

f.simplify_as_binary()
solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)
visited = [i for i in range(n) for j in range(n) if sol(x[i][j]) == 1]
print("visited:", *visited)
print("length =", length(sol))
print("energy =", sol.energy)
```

The output of this program is as follows:

```
visited: 0 1 2 3 5
length = 72
energy = -30
```

The tour visits sites 1, 2, 3 and 5, is 72 long, and earns a score of 30.
Visiting site 4 (score 5) as well would make the tour 75 long, over the limit.
Exhaustive Solver does not support structural constraints, so this example is solved with Easy Solver.

## Lowering to the Traditional Form

When the traditional form is needed — to pass the model to an external solver,
for instance — it can be lowered explicitly.

| Function | Conversion |
|---|---|
| `qbpp.binarize(f)` | native integer variables into binary encoding |
| `qbpp.expand_cons(f)` | `qbpp.cons()` declarations into traditional penalty expressions |
| `qbpp.reduce(f)` | terms of degree 3 or higher into degree 2 |

```python
import pyqbpp as qbpp

n = qbpp.var("n", integer=(0, 10))
bits = qbpp.binarize(n)
print("bits =", bits)
```

The output of this program is as follows:

```
bits = n#0 +2*n#1 +4*n#2 +3*n#3
```

For MILP solvers, an [ILP mode](MILP_SOLVERS) that passes integer variables as integers
is also available.
Structural constraints cannot be expanded into traditional penalty expressions with `qbpp.expand_cons()`;
see [Structural Constraints](STRUCTURAL) for how they are passed to MILP solvers.

## What to Read Next

- [Reducing HUBO to QUBO](REDUCE) — reducing terms of degree 3 or higher to degree 2
- [Negated Literals](NEGATIVE) — working with negated literals
- [Integer Variables and Solving Simultaneous Equations](INTEGER) — integer variables that hold the integer value itself
- [Binary-Encoded Integer Variables](BINARY_INTEGER) — integer variables expressed as weighted sums of binary variables
- [Nonlinear Functions and Native Constraints](CONSTRAINTS) — `abs`, `relu`, `max`, `min`, and `cons()`
- [Structural Constraints](STRUCTURAL) — `distinct`, `cycle`, and `cycles`
- [Data Types of Variables and Expressions](VAREXPR) — coefficient and energy types
- [Quick Start](QUICK) — your first program
