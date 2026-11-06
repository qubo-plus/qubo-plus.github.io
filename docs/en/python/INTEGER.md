---
last_modified: 2026-10-19
layout: default
nav_exclude: true
title: "Integer Variables"
nav_order: 7
lang: en
hreflang_alt: "ja/python/INTEGER"
hreflang_lang: "ja"
---

# Integer Variables and Solving Simultaneous Equations

In addition to binary variables, PyQBPP supports **integer variables**.
An integer variable is declared with its range of values (a lower bound and an upper bound),
and the solvers bundled with QUBO++
([Easy Solver](EASYSOLVER), [Exhaustive Solver](EXHAUSTIVE), and [ABS3 Solver](ABS3))
search over its integer values directly.

## Declaring integer variables

**`qbpp.var("name", integer=(lower, upper))`** creates a variable that takes
integer values in that range. The range is mandatory.
The declared variable can be used in expressions just like binary variables:

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 10))
f = x * x - 4 * x
f.simplify()
print("f =", f)

solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()
print("x =", sol(x))
print("f =", sol.energy)
```

`x` is a variable that takes integer values from 0 to 10, and the Exhaustive Solver finds
the `x` that minimizes $f = x^2 - 4x$.
The output of the program is as follows:

```
f = -4*x +x*x
x = 2
f = -4
```

Note that the binary-variable rule ($x \cdot x = x$) is not applied to `x * x`;
it is kept as the square of an integer.
An expression with only integer variables, like this one, is simplified with `simplify()`.
An expression that contains binary variables is simplified with `simplify_as_binary()`,
which also applies the binary-variable rules.
`simplify_as_binary()` also works on an expression with only integer variables,
but it may be less efficient because it tries to apply the binary-variable rules
even though there are no binary variables.

## Solving simultaneous equations

Using integer variables, we solve the following simultaneous equations (the solution is $x=6$, $y=4$):

$$
\begin{aligned}
x + y &= 10\\
2x+4y &= 28
\end{aligned}
$$

The sum of the squared differences between the left-hand and right-hand sides of the equations,

$$
\begin{aligned}
f(x,y) &= (x+y-10)^2 + (2x+4y-28)^2
\end{aligned}
$$

takes the minimum value 0 if and only if both equations are satisfied simultaneously.
Therefore, the $x$ and $y$ that minimize $f(x,y)$ are the solution of the simultaneous equations.
The following program builds $f(x,y)$ with integer variables `x` and `y` in the range $[0,10]$ and solves it with the Easy Solver:

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 10))
y = qbpp.var("y", integer=(0, 10))
f = qbpp.sqr(x + y - 10) + qbpp.sqr(2 * x + 4 * y - 28)
f.simplify()
print("f =", f)

solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=0)
print(f"x = {sol(x)}, y = {sol(y)}")
print("f =", sol.energy)
```

Since the minimum value is known to be 0, `target_energy` is set to 0
so that the search terminates as soon as a solution with energy 0 is found.
The output of the program is as follows:

```
f = 884 -132*x -244*y +5*x*x +18*x*y +17*y*y
x = 6, y = 4
f = 0
```

`f` is kept as a quadratic expression in `x` and `y`, and the solver searches over the values of `x` and `y` as integers.

## Arrays of integer variables

Passing dimensions together with `integer=` to `qbpp.var()` creates an
array of integer variables. Elements are accessed with `s[i]`,
and `s.sum()` builds the sum of all elements:

```python
import pyqbpp as qbpp

s = qbpp.var("s", 3, integer=(0, 9))
t = s.sum()
f = qbpp.sqr(t - 6) + qbpp.sqr(s[0] - s[1] + 1) + qbpp.sqr(s[1] - s[2] + 1)
f.simplify()

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

Whole-array operations (`s + t`, `2 * s`, `qbpp.sqr(s)`, element-wise
constraints such as `s <= 5`, slices `s[1:3]`, `qbpp.vector_sum()`, `qbpp.einsum()`,
`qbpp.concat()`) treat the array as an array of `Expr`,
and `sol(s)` reads all element values at once.

## Arrays with per-element ranges

The lower/upper bounds of `integer=` also accept lists instead of scalars.
With a list, each element of the array gets its own individual range
(a scalar on either side is shared across all elements).
An element whose lower and upper bounds are equal becomes the constant fixed to that value:

```python
import pyqbpp as qbpp

max_vals = [3, 7, 15, 5]
x = qbpp.var("x", shape=len(max_vals), integer=(0, max_vals))
f = qbpp.sqr(qbpp.sum(x) - 26) - x[0] - x[1] - x[2]
f.simplify()

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

For an array of two or more dimensions, give the lower/upper bounds as a nested list or a `qbpp.array`
of the array's shape (a flat list in row-major order also works). A shape that does not match raises `ValueError`.
In the following example, the upper bound of each element is the smaller of the row value `supply` and
the column value `demand`. `f` is minimized when every element reaches its own upper bound:

```python
import pyqbpp as qbpp

supply = [30, 25, 45]
demand = [20, 30, 25, 25]
upper = [[min(s, d) for d in demand] for s in supply]
x = qbpp.var("x", shape=(3, 4), integer=(0, upper))
f = -qbpp.sum(x)
f.simplify()
sol = qbpp.EasySolver(f).search(target_energy=-295)
print(sol(x))
```

The output of the program is as follows:

```
[[20, 30, 25, 25], [20, 25, 25, 25], [20, 30, 25, 25]]
```

## Evaluation and substitution

To evaluate an expression at given values of the declared integer variables, use the
[evaluation function](EVAL) `f({x: 3})` exactly as for binary variables.
The values must lie within the declared range (out-of-range values are discussed below).
The [replace function](REPLACE) `qbpp.replace(f, {x: e})` rewrites every occurrence of `x` in `f` as the expression `e`.
Powers such as `x * x` are substituted per occurrence, so replacing `x` by `y + 1` expands
$(y+1)^2 + (y+1)$:

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 10))
y = qbpp.var("y", integer=(0, 10))
f = x * x + x

print("f(3) =", f({x: 3}))

g = qbpp.replace(f, {x: 2})
g.simplify()
print("g =", g)

h = qbpp.replace(f, {x: y + 1})
h.simplify()
print("h =", h)
```

The output of the program is as follows:

```
f(3) = 12
g = 6
h = 2 +3*y +y*y
```

Substitution is a purely symbolic rewrite: the range of `x` is not carried over to the result.
No constraint forcing `y + 1` into the range of `x` is added, and substituting an out-of-range constant does not raise.
Add any required constraint explicitly with [`qbpp.cons()`](CONSTRAINTS).
Whether the resulting expression contains integer variables is decided by the variables in the substituted expression
(with `y + 1`, the range and integrality of `y` remain in force).
The declaration of `x` itself is untouched and `x` can still be used in other expressions.
Evaluating with an out-of-range value raises `ValueError`.

## Constraints

Constraints on expressions containing integer variables (such as $2x + 3y \leq 24$) can be written with `qbpp.cons()`.
They are explained in [Range Constraints and Solving Integer Linear Programming](RANGE).

## Working with external solvers

MIP solvers handle integer variables natively, so integer variables are
passed **directly as integer columns**.
When the objective is linear and the constraints are written with `qbpp.cons()`,
passing `ilp=True`, as in `qbpp.ScipSolver(f, ilp=True)`,
makes the model solvable by all the MIP solvers (SCIP, HiGHS, CBC, GLPK).
`qbpp.OrToolsCpSatSolver` likewise accepts a model with integer variables and
`qbpp.cons()` directly, in ILP form (integer variables plus linear constraint rows).

On the other hand, to pass a model to an external QUBO solver that only handles binary variables,
the integer variables must be represented by binary variables.
How to do this is explained in [Binary-Encoded Integer Variables](BINARY_INTEGER).

## Integer variables versus one-hot representations

- Integer variables suit variables that represent **quantities** such as counts, times, and stock levels.
- For **labels** ("which one to choose": visiting orders, colors, and so on),
  one-hot representations
  ([Permutation Matrix](PERMUTATION), [One-hot Constraints](ONEHOT))
  are better suited than integer variables.

Regarding the license variable limit, one integer variable counts as
the following number of binary variables, where $r$ denotes its range
(upper bound minus lower bound):

$$
\lceil \log_2 (r+1) \rceil
$$

See [License Management](../LICENSE_MANAGEMENT) for details.
