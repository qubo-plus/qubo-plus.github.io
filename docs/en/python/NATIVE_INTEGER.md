---
last_modified: 2026-08-24
layout: default
nav_exclude: true
title: "Native Integer Variables"
nav_order: 52
lang: en
hreflang_alt: "ja/python/NATIVE_INTEGER"
hreflang_lang: "ja"
---

# Native Integer Variables

[Integer Variables](INTEGER) explained how integers are represented by
combining multiple binary variables. In addition, PyQBPP supports
**native integer variables** that keep their integer values as is.
A variable declared with the `integer=` keyword of `qbpp.var()` is not
expanded into binary variables; the solvers bundled with QUBO++
([EasySolver](EASYSOLVER), [ABS3 Solver](ABS3), and
[Exhaustive Solver](EXHAUSTIVE)) handle the integer values directly and
search efficiently.

## Declaration and basic usage

A native integer variable is declared with `integer=(lower, upper)`.
The range is mandatory. The declared variable can be used in
expressions just like ordinary variables:

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 10))
f = x * x - 4 * x
f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()
print(f"x = {sol(x)}")
print(f"f = {sol.energy}")
```

The output of the program is as follows:

```
x = 2
f = -4
```

Note that powers such as `x * x` are kept as integer squares — the
binary-variable rule ($x \cdot x = x$) is never applied.

## Solving simultaneous equations

The following program solves the simultaneous equations $x + 2y = 700$
and $x - y = 100$ by minimizing the squared error:

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 1000))
y = qbpp.var("y", integer=(-1000, 1000))
f = qbpp.sqr(x + 2 * y - 700) + qbpp.sqr(x - y - 100)
f.simplify_as_binary()
solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)
print(f"x = {sol(x)}, y = {sol(y)}")
print(f"f = {sol.energy}")
```

The output of the program is as follows:

```
x = 300, y = 200
f = 0
```

## Arrays of integer variables

Passing dimensions together with `integer=` to `qbpp.var()` creates an
array of native integer variables. Elements are accessed with `s[i]`,
and `s.sum()` builds the sum of all elements:

```python
import pyqbpp as qbpp

s = qbpp.var("s", 3, integer=(0, 9))
t = s.sum()
f = qbpp.sqr(t - 6) + qbpp.sqr(s[0] - s[1] + 1) + qbpp.sqr(s[1] - s[2] + 1)
f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()
print(f"s = {sol(s[0])}, {sol(s[1])}, {sol(s[2])}")
print(f"f = {sol.energy}")
```

The output of the program is as follows:

```
s = 1, 2, 3
f = 0
```

## Arrays with per-element ranges

The lower/upper bounds of `integer=` also accept lists instead of scalars.
With a list, each element of the array gets its own individual range (a
scalar on either side is shared across all elements). An element whose
lower and upper bounds are equal becomes the constant fixed to that value:

```python
import pyqbpp as qbpp

max_vals = [3, 7, 15, 5]
x = qbpp.var("x", shape=len(max_vals), integer=(0, max_vals))
f = qbpp.sqr(qbpp.sum(x) - 26) - x[0] - x[1] - x[2]
f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()
print(f"x = {sol(x[0])}, {sol(x[1])}, {sol(x[2])}, {sol(x[3])}")
print(f"f = {sol.energy}")
```

The output of the program is as follows:

```
x = 3, 7, 15, 1
f = -25
```

## Using constraints

`qbpp.cons()` of [Native Constraints](CONSTRAINTS) works with
expressions containing native integer variables as is:

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 5))
y = qbpp.var("y", integer=(0, 5))
f = -(2 * x + 3 * y) + 50 * qbpp.cons(x + y == 8)
f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()
print(f"x = {sol(x)}, y = {sol(y)}")
```

The output of the program is as follows:

```
x = 3, y = 5
```

## Working with external solvers

MIP solvers handle integer variables natively, so native integer
variables are passed **directly as integer columns** (they are never
expanded into binary variables). When the objective is linear and the
constraints are written with `qbpp.cons()`, passing `ilp=True` — e.g.
`qbpp.ScipSolver(f, ilp=True)` — makes the model solvable by all the
MIP solvers (SCIP, HiGHS, CBC, GLPK).

For external QUBO solvers that only accept binary variables, convert
the model to the [conventional binary encoding](INTEGER) with
`qbpp.binarize()`:

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 10))
f = x * x - 4 * x
g = qbpp.binarize(f)
g.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(g)
sol = solver.search()
print(f"minimum = {sol.energy}")
```

The output of the program is as follows:

```
minimum = -4
```

## Which representation to choose

- Native integer variables suit variables that represent **quantities**
  such as counts, times, and stock levels.
- For models handed to external binary-only solvers, use
  [binary-encoded integer variables](INTEGER) (`between=`) or convert
  with `qbpp.binarize()`.
- For **labels** ("which one to choose" — visiting orders, colors, and
  so on), one-hot representations
  ([Permutation Matrix](PERMUTATION), [One-hot Constraints](ONEHOT))
  usually work better than integer variables.

Regarding the license variable limit, one native integer variable
counts as the following number of binary variables, where $r$ denotes
its range (upper bound minus lower bound):

$$
\lceil \log_2 (r+1) \rceil
$$

