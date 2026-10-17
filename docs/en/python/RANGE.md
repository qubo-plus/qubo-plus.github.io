---
last_modified: 2026-10-14
layout: default
nav_exclude: true
title: "Range Constraints"
nav_order: 9
lang: en
hreflang_alt: "ja/python/RANGE"
hreflang_lang: "ja"
---

# Range Constraints and Solving Integer Linear Programming

## Solving Integer Linear Programming
An instance of **integer linear programming** consists of an **objective function** and multiple **linear constraints**.
For example, the following integer linear program has two variables, one objective, and two constraints:

$$
\begin{aligned}
\text{Maximize: } & & & 5x + 4y \\
\text{Subject to: } & && 2x + 3y \le 24 \\
                   & & & 7x + 5y \le 54
\end{aligned}
$$

The optimal solution of this problem is $x=4$, $y=5$, with the objective value $40$.

The following PyQBPP program finds this optimal solution with the Easy Solver, using [integer variables](INTEGER) `x` and `y`:
```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 10))
y = qbpp.var("y", integer=(0, 10))
f = 5 * x + 4 * y
g = -f + 100 * qbpp.cons(2 * x + 3 * y <= 24) + 100 * qbpp.cons(7 * x + 5 * y <= 54)
g.simplify()
print("g =", g)

solver = qbpp.EasySolver(g)
sol = solver.search(time_limit=1.0)
print(f"x = {sol(x)}, y = {sol(y)}")
print(f"f = {sol(f)}")
print(f"violated constraints = {g.cons(sol)}")
```

In this program,
- **`f`** represents the objective function,
- **`qbpp.cons(2 * x + 3 * y <= 24)`** and **`qbpp.cons(7 * x + 5 * y <= 54)`** represent the two constraints, and
- **`g`** combines them into a single optimization expression.

Since the goal is maximization, the objective is negated as `-f`.
Comparisons enclosed in `qbpp.cons()` are **treated specially as constraints**,
and the bundled solvers search efficiently for solutions that satisfy the constraints.
When a constraint is violated, a penalty equal to the square of the violation (in this example, the amount by which the left-hand side exceeds the right-hand side) multiplied by the weight 100 is added.
The weight is chosen large enough that violating a constraint to improve the objective does not pay off.

An Easy Solver instance is created for `g`, and a search is performed with a time limit of 1.0 seconds passed as a parameter to `search()`.
`g.cons(sol)` returns the number of constraints violated by the solution `sol` (0 means all constraints are satisfied).
The program outputs:
```
g = -5*x -4*y
+100*cons(2*x +3*y <= 24)
+100*cons(7*x +5*y <= 54)
x = 4, y = 5
f = 40
violated constraints = 0
```

Printing `g` shows the objective polynomial followed by the declared constraints, one per line.
We can confirm that the solver correctly finds the optimal solution.

## Range constraints
In addition to one-sided inequalities, constraints can also be **range constraints** $l \leq f \leq u$.
The following four kinds of constraints can be written with `qbpp.cons()`:

| Syntax | Meaning |
|---|---|
| `qbpp.cons(f <= u)` | $f \leq u$ |
| `qbpp.cons(f >= l)` | $f \geq l$ |
| `qbpp.cons(f, between=(l, u))` | $l \leq f \leq u$ (range constraint) |
| `qbpp.cons(f == v)` | $f = v$ |

Python's language rules do not allow a range constraint to be written as the chained comparison `l <= f <= u`,
so it is specified with `between=(l, u)` (PyQBPP detects the chained form and raises an error).

For example, adding the range constraint "$x - y$ is at least 1 and at most 3" to the problem above changes the optimal solution to $x=5$, $y=3$ (objective value $37$):

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 10))
y = qbpp.var("y", integer=(0, 10))
f = 5 * x + 4 * y
g = -f + 100 * qbpp.cons(2 * x + 3 * y <= 24) + 100 * qbpp.cons(7 * x + 5 * y <= 54)
g += 100 * qbpp.cons(x - y, between=(1, 3))
g.simplify()

solver = qbpp.ExhaustiveSolver(g)
sol = solver.search()
print(f"x = {sol(x)}, y = {sol(y)}")
print(f"f = {sol(f)}")
print(f"violated constraints = {g.cons(sol)}")
```

Here, the Exhaustive Solver searches all assignments to obtain the exact optimal solution.
The output of the program is as follows:
```
x = 5, y = 3
f = 37
violated constraints = 0
```

Constraints declared with `cons()` have the same meaning in all three bundled
solvers (Easy Solver, Exhaustive Solver, and ABS3 Solver), and the Exhaustive
Solver returns the **exact minimum** of this penalty-inclusive energy.
The MIP solvers (SCIP, etc.) treat them as **hard constraints** (constraints
that must be satisfied) when `ilp=True` is specified.
See [Native Constraints](CONSTRAINTS) for details.

## Range constraints with penalty expressions
Using `qbpp.constrain()` instead of `qbpp.cons()` creates a **penalty expression** that can be represented as a QUBO or HUBO (an expression that takes the minimum value 0 if and only if the constraint is satisfied).
The arguments are written the same way as for `qbpp.cons()`: `between=(l, u)` for a range constraint and `equal=n` for an equality constraint.
Use this penalty expression when passing a model to an external QUBO solver that only handles binary variables.

The penalty expression for a range constraint $l\leq f\leq u$ is built by introducing an **auxiliary integer variable** $a$ that takes values in the range $[l,u]$:

$$
\begin{aligned}
g &= (f-a)^2
\end{aligned}
$$

This expression $g$ takes the minimum value 0 exactly when $f=a$.
Since $a$ can take any integer value in $[l,u]$, the expression
$g$ achieves 0 if and only if $f$ itself takes an integer value within the same range.
The auxiliary variable $a$ is introduced as a [binary-encoded integer variable](BINARY_INTEGER).
If $f$ is linear, $g$ is a QUBO expression.
If $f$ is quadratic or higher, $g$ is a HUBO expression (since the degree of $g$ is twice that of $f$).

Penalty expressions need this auxiliary variable for every range constraint,
whereas constraints declared with `qbpp.cons()` introduce none.
The section "Comparison with the penalty form" of [Native Constraints](CONSTRAINTS)
compares how much the numbers of variables and terms of the model change.
A model written with `qbpp.cons()` can be expanded into penalty expressions with [`qbpp.expand_cons()`](CONSTRAINTS#expanding-into-the-classic-penalty-form).

>**NOTE**
> PyQBPP internally employs a lightweight improvement that enables range constraints to be encoded with a slightly smaller number of binary variables.
> Details are described in [Comparison Operators](COMPARISON).
