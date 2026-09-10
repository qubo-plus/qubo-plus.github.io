---
last_modified: 2026-09-01
layout: default
nav_exclude: true
title: "Nonlinear Functions and Native Constraints"
nav_order: 27
lang: en
hreflang_alt: "ja/python/CONSTRAINTS"
hreflang_lang: "ja"
---

# Nonlinear Functions and Native Constraints

PyQBPP supports the following **nonlinear functions** directly inside
expressions:

| Function | Value | Typical use |
|---|---|---|
| `qbpp.abs(f)` / `qbpp.abs(f, 2)` | $\lvert f \rvert$ / $\lvert f \rvert^2$ | minimizing errors and deviations |
| `qbpp.relu(f)` / `qbpp.relu(f, 2)` | $\max(0, f)$ / $\max(0, f)^2$ | penalizing the excess over a threshold |
| `qbpp.max(f, g)` / `qbpp.min(f, g)` | maximum / minimum of two expressions | partition problems, minimizing a makespan, etc. |
| `qbpp.cons(f, between=(l, u))` etc. | squared violation (0 when satisfied) | **declaring constraints** |

The solvers bundled with QUBO++ handle the function values directly and
search efficiently — there is no need to design auxiliary variables or
penalty polynomials by hand. These functions can also be combined with
[Native Integer Variables](NATIVE_INTEGER).

Only `cons()` carries, in addition to its value, the semantics of a
*constraint* — the first half of this page covers `abs`, `relu`, `max`,
and `min`, and the second half covers `cons()`.

## Absolute value: abs

`qbpp.abs(f)` denotes $|f|$ and `qbpp.abs(f, 2)` denotes $|f|^2$
(the exponent is 1 or 2). The following program minimizes
$|x + y - 13| + |x - y - 3|$:

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 10))
y = qbpp.var("y", integer=(0, 10))
f = qbpp.abs(x + y - 13) + qbpp.abs(x - y - 3)
f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()
print(f"x = {sol(x)}, y = {sol(y)}")
print(f"f = {sol.energy}")
```

The output of the program is as follows:

```
x = 8, y = 5
f = 0
```

As another example, the following program solves the
[partition problem](PARTITION) — splitting 8 numbers into two sets
$P$ and $Q$ so that their sums are as close as possible — by writing
its objective $|P - Q|$ directly with `abs`:

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

The [partition problem](PARTITION) page formulates the same problem as
minimizing the squared penalty $(P - Q)^2$. With `abs`, the objective
$|P - Q|$ is written as-is, and the minimum value is the difference
itself. See the case study
[Three Formulations of the Partitioning Problem](PARTITION_FORMULATIONS)
for a side-by-side comparison of the three formulations
(`sqr`, `abs`, and `cons`).

## ReLU: relu

`qbpp.relu(f)` denotes $\max(0, f)$ and `qbpp.relu(f, 2)` denotes
$\max(0, f)^2$; they are convenient for penalizing only the **excess**
over a threshold. The following program maximizes the profit $4x + 7y$
while quadratically penalizing the workload $2x + 3y$ beyond 36 and
imposing the constraint $x + y \le 12$ with `qbpp.cons()` (explained
in the second half of this page):

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 20))
y = qbpp.var("y", integer=(0, 20))
profit = 4 * x + 7 * y
overtime = qbpp.relu(2 * x + 3 * y - 36, 2)
f = -profit + overtime + 100 * qbpp.cons(x + y <= 12)
f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()
print(f"x = {sol(x)}, y = {sol(y)}")
print(f"profit = {sol(profit)}")
```

The output of the program is as follows:

```
x = 0, y = 12
profit = 84
```

## Maximum and minimum: max / min

`qbpp.max(f, g)` and `qbpp.min(f, g)` denote the maximum and minimum of
two expressions. The following program solves the same
[partition problem](PARTITION) as in the `abs` example using `max`.
Since the total $P + Q$ is the same for every split, minimizing the
larger sum $\max(P, Q)$ is equivalent to minimizing the difference
$|P - Q|$:

```python
import pyqbpp as qbpp

w = qbpp.array([64, 27, 47, 74, 12, 83, 63, 40])
x = qbpp.var("x", shape=len(w))
p = qbpp.sum(w * x)
q = qbpp.sum(w * ~x)
f = qbpp.max(p, q)
f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()
print(f"max(P, Q) = {sol.energy}")
print(f"P = {sol(p)}, Q = {sol(q)}")
```

The output of the program is as follows:

```
max(P, Q) = 205
P = 205, Q = 205
```

With the `max` formulation, the minimum objective value directly gives
the sum of the larger set.

## Declaring constraints: cons

Wrapping part of an expression in `qbpp.cons()` declares it as a
**constraint, which receives special handling**. The bundled solvers
search efficiently for good solutions that satisfy the declared
constraints.

A constraint declared with `qbpp.cons()` takes, under a variable
assignment, the **squared violation** as its value. With $f$ denoting the
body of the constraint, an equality constraint has the value

$$
\operatorname{cons}(f = k) = (f - k)^2
$$

and a range constraint has the value

$$
\operatorname{cons}(l \le f \le u) =
\begin{cases}
(l - f)^2 & (f < l) \\
0 & (l \le f \le u) \\
(f - u)^2 & (u < f)
\end{cases}
$$

(a one-sided constraint acts on its declared side only). Value-wise,
`cons()` is therefore a member of the same family of nonlinear
functions:

$$
\operatorname{cons}(f = k) = \operatorname{abs}(f - k,\, 2), \qquad
\operatorname{cons}(l \le f \le u) =
\operatorname{relu}(l - f,\, 2) + \operatorname{relu}(f - u,\, 2)
$$

(at most one side can be violated, so the two relu terms are never
positive at the same time). A weighted constraint
$P \cdot \operatorname{cons}(\cdots)$ takes $P$ times this value, and
the value of the whole model is

$$
f(\mathrm{sol}) = \mathrm{objective} + \sum_{c} P_c \cdot \mathrm{viol}_c^2
$$

which coincides with the Energy reported by the bundled solvers. For a
solution satisfying all constraints, Energy = objective.

The difference from `abs()` and `relu()` is the semantics. `cons()`
**declares the expression as a constraint**: it participates in the
violation count (Viol) and in the feasibility / `target_energy`
decisions. `abs()` and `relu()` are pure objective terms with no
constraint semantics. Use `cons()` for conditions that must be
satisfied, and `abs()` / `relu()` for quantities whose value itself is
a cost.

## Solving integer linear programming with `cons()`

In [Range Constraints and Solving Integer Linear Programming](RANGE), the
following integer linear programming problem was solved by adding the range
constraints to the objective as weighted penalty expressions:

$$
\begin{aligned}
\text{Maximize: } & & & 5x + 4y \\
\text{Subject to: } & && 2x + 3y \le 24 \\
                   & & & 7x + 5y \le 54
\end{aligned}
$$

The same problem can be written as follows by creating the constraints with `qbpp.cons()`:

```python
import pyqbpp as qbpp

x = qbpp.var("x", between=(0, 10))
y = qbpp.var("y", between=(0, 10))
f = 5 * x + 4 * y
g = -f + 100 * qbpp.cons(2 * x + 3 * y, between=(0, 24))
g += 100 * qbpp.cons(7 * x + 5 * y, between=(0, 54))
g.simplify_as_binary()

solver = qbpp.EasySolver(g)
sol = solver.search(time_limit=1.0)

print(f"x = {sol(x)}, y = {sol(y)}")
print(f"f = {sol(f)}")
print(f"violated constraints = {g.cons(sol)}")
```

The only change is replacing the penalty expressions built with `constrain()`
by `qbpp.cons()` (the arguments are written the same way).
With this change alone, the two range constraints are **declared as
constraints** rather than mere penalty expressions, and the solver searches
efficiently for solutions that satisfy them.
`g.cons(sol)` returns the number of constraints violated by the solution `sol`
(0 means all constraints are satisfied).
The program outputs:

```
x = 4, y = 5
f = 40
violated constraints = 0
```

## Comparison with the penalty form

Let us solve the same problem in both styles — with the constraints added to
the objective as penalty expressions, and with them declared by
`qbpp.cons()` — and compare the size of the model handed to the solver.
`var_count` and `term_count` in `sol.info` are the number of variables and
the number of terms of the model:

```python
import pyqbpp as qbpp

x = qbpp.var("x", between=(0, 10))
y = qbpp.var("y", between=(0, 10))
f = 5 * x + 4 * y

gp = -f + 100 * qbpp.constrain(2 * x + 3 * y, between=(0, 24))  # penalty form
gp += 100 * qbpp.constrain(7 * x + 5 * y, between=(0, 54))
gp.simplify_as_binary()
sp = qbpp.EasySolver(gp).search(time_limit=1.0)

gc = -f + 100 * qbpp.cons(2 * x + 3 * y, between=(0, 24))  # declared
gc += 100 * qbpp.cons(7 * x + 5 * y, between=(0, 54))
gc.simplify_as_binary()
sc = qbpp.EasySolver(gc).search(time_limit=1.0)

print(f"penalty: var_count = {sp.info['var_count']}, term_count = {sp.info['term_count']}, f = {sp(f)}")
print(f"cons:    var_count = {sc.info['var_count']}, term_count = {sc.info['term_count']}, f = {sc(f)}")
```

The program outputs:

```
penalty: var_count = 17, term_count = 133, f = 40
cons:    var_count = 8, term_count = 8, f = 40
```

Both styles reach the optimum $f = 40$, but the models differ greatly in size.
Since $x$ and $y$ are each represented by 4 binary variables, the objective and
the constraints involve 8 variables in total. Writing an inequality constraint
as a penalty expression, however, requires **auxiliary (slack) variables** to
build a polynomial that is 0 exactly when the constraint is satisfied (see
[Range Constraints](RANGE)); in this example they add 9 more variables, for a
total of 17. Expanding the squares also grows the number of terms from 8 to
133.

Nine extra binary variables enlarge the search space by a factor of
$2^9 = 512$, and more terms make each solution more expensive to evaluate, so
the problem becomes harder for the solver. When the constraints are declared
with `qbpp.cons()`, no auxiliary variables are introduced, and only the terms of the
objective remain in the model. The wider the range of a constraint and the more
constraints a problem has, the larger this difference becomes.

## A knapsack example

As another example, the following program solves a small knapsack problem
(a capacity constraint and an equality constraint) with `cons()`:

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(6,))
value = [3, 5, 2, 7, 4, 6]
weight = [2, 4, 1, 5, 3, 4]

obj = 0
load = 0
for i in range(6):
    obj += -value[i] * x[i]
    load += weight[i] * x[i]

f = obj + 100 * qbpp.cons(load, between=(None, 8))  # capacity
f += 10 * qbpp.cons((x[0] + x[1]) == 1)             # equality
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1)
print("objective =", sol.energy)
```

On many problems this yields considerably better solutions than solving
the same constraints in the classic penalty form. See "Migrating from and
comparing with the classic penalty form" below for how to migrate an
existing penalty formulation. See the
[knapsack problem](KNAPSACK) page
for a side-by-side comparison of the capacity constraint written in the
classic penalty form, with `relu`, and with `cons()`.

## Writing constraints

A constraint is `qbpp.cons(expression == integer)`, or a range given
directly as keyword arguments: `qbpp.cons(expression, between=(lower,
upper))` (either bound may be `None`). Weights are written as scalar
factors on the constraint, and constraints combine freely with the
objective and each other via `+`:

```python
import pyqbpp as qbpp

a, b, c = qbpp.var("a"), qbpp.var("b"), qbpp.var("c")
u, v, w = qbpp.var("u"), qbpp.var("v"), qbpp.var("w")

cons = 1000 * qbpp.cons((a + b + c) == 2)                        # equality
cons += 1000 * qbpp.cons(10*u + 30*v - 10*w, between=(None, 35)) # one-sided
cons += 500 * qbpp.cons(a + b - c, between=(0, 1))               # two-sided
```

Wrapping an array comparison adds one constraint per element, so the
one-hot rows of a matrix are a single statement:

```python
import pyqbpp as qbpp

y = qbpp.var("y", shape=(4, 4))
one_hot = 1000 * qbpp.cons(qbpp.vector_sum(y) == 1)  # one per row
```

Throughout this documentation, weights are written as scalar factors
outside `qbpp.cons()`, and each `qbpp.cons()` holds exactly one
comparison or one `between=` range (an array comparison gives one
constraint per element).

A two-sided range cannot be written as a chained comparison `l <= f <= u`:
Python evaluates that as `(l <= f) and (f <= u)`, which loses the `l <= f`
half. PyQBPP detects the form and raises, so write
`qbpp.cons(f, between=(l, u))` or `qbpp.cons((l <= f) & (qbpp.same <= u))`
instead (in C++, `qbpp::cons(l <= f <= u)` works as written).

Applying `*=` to an accumulated constraint expression scales the weight of
every accumulated constraint at once:

```python
import pyqbpp as qbpp

k0, k1, k2 = qbpp.var("k0"), qbpp.var("k1"), qbpp.var("k2")
cons4 = qbpp.cons((k0 + k1 + k2) == 2)
cons4 += qbpp.cons(k0 + k1 - k2, between=(None, 1))
cons4 *= 1000                       # scale ALL weights at once
```

Printing the expression shows the **objective polynomial** followed by the
declared constraints in `cons(...)` form, one per line, so the whole
expression is printed. `f.cons()` returns the declared **constraint list**
alone as a printable string (the weight prefix is omitted when 1, one-sided
bounds are shown one-sided):

```python
import pyqbpp as qbpp

m0, m1, m2 = qbpp.var("m0"), qbpp.var("m1"), qbpp.var("m2")
printed = 1000 * qbpp.cons((m0 + m1 + m2) == 2)
printed += 500 * qbpp.cons(m0 + m1 - m2, between=(0, 1))
print(printed)
print(printed.cons())
```

The output is:

```
1000*cons(m0 +m1 +m2 == 2)
+500*cons(0 <= m0 +m1 -m2 <= 1)
1000 * (m0 +m1 +m2 == 2)
500 * (0 <= m0 +m1 -m2 <= 1)
```

### Discrete allowed-value sets

A constraint that requires an expression to equal **one of a discrete set of
values** is written with `equal=[...]`. `qbpp.cons(s, equal=[0, 2])` is
satisfied only when `s` is 0 or 2. Any number of values, and any integers,
may be listed.

```python
e = qbpp.var("e", 5)
# choose 0 or 2 of the edges incident to each vertex
deg = 100 * qbpp.cons(qbpp.sum(e), equal=[0, 2])
```

This is handy for problems that select edges forming a path or cycle in a
graph (satisfied when every vertex has degree 0 or 2). Because the allowed
values are discrete, they cannot be expressed as a two-sided range
`between=(l, u)`. The constraint list shows it as `== {0, 2}`. This constraint
is supported by `EasySolver`, `ExhaustiveSolver`, and `ABS3Solver` (the MIP
solvers do not support it). It is not available in the arbitrary-precision
(`pyqbpp.cppint`) and double-coefficient (`pyqbpp.d`) variants.

### Nonlinear constraint bodies

Nonlinear (degree ≥ 2) expressions inside `qbpp.cons()` are handled as
constraints too — both **equalities** (such as `x*y + z == 1`) and **ranges**
(such as `qbpp.cons(x*y + z*w, between=(1, 2))`). The bundled solvers
(`EasySolver`, `ExhaustiveSolver`, `ABS3Solver`) search for assignments that
satisfy them. Constraint bodies may also contain negated literals `~x` (for
example `~x*~y*~z + w == 1`). External MIP/ILP solvers do not accept nonlinear
constraint bodies; expand them to the classic penalty form with `expand_cons()`
(see below) before handing the expression to those solvers.

## Arithmetic rules

A constraint-carrying expression `f` is a complete model description.
The rules below apply not only to `cons()` constraints but equally to
expressions containing the nonlinear functions `abs`, `relu`, `max`,
and `min`:

- `sol(f)` matches the Energy reported by the solvers.
- `f.cons(sol)` returns the **number** of violated constraints
  (0 == all satisfied).
- Objective adjustments (`+`, `-`, adding constants), nonzero scalar
  multiplication (bulk weight scaling), `simplify_as_binary()`, and
  `qbpp.replace()` all preserve the constraints.
- `f.simplify_as_binary()` applies to both the objective and the
  constraints. Call it once before handing the expression to a solver —
  in particular after `qbpp.replace()` substitutes variables.
- Weights are normally positive, but negative weights are also accepted
  (subtracting a constraint expression or applying unary minus likewise
  negates the weights). A negative weight *rewards* violation — a special
  use supported only by the bundled solvers (`EasySolver`,
  `ExhaustiveSolver`, `ABS3Solver`); handing it to a MIP solver (hard
  semantics) raises `RuntimeError`.
- Operations that would destroy the constraint declaration —
  `qbpp.sqr()`, multiplying two expressions, multiplying by zero (the
  constraints would silently vanish), `qbpp.reduce()`, ... — raise
  `RuntimeError`.
- Nonlinear functions and `cons()` **cannot be nested** — placing a
  function term or a `cons()` inside a function body or inside a
  `cons()` constraint body raises `RuntimeError` (likewise for the
  arguments of `max` / `min`). Function terms and constraints add
  freely with `+`, so write combinations as sums.

## Solver support and semantics

The bundled solvers accept the same expression `f` as their single
argument. The nonlinear functions `abs`, `relu`, `max`, and `min` are
supported as follows:

- The bundled solvers ([EasySolver](EASYSOLVER),
  [ABS3 Solver](ABS3), and [Exhaustive Solver](EXHAUSTIVE)) support
  `abs` and `relu` (exponents 1 and 2) as well as `max` and `min`.
- The MIP wrappers do not support nonlinear functions (only the C++
  ScipSolver Quadratic formulation does — see [the C++ page](../CONSTRAINTS)).
- Any constant coefficient works, including negative ones (a negative
  coefficient rewards a large function value). Multiplication is
  supported by scalar constants only — multiplying by a variable or an
  expression, and `qbpp.sqr()`, raise `RuntimeError`. Expressions
  containing `abs`, `relu`, `max`, or `min` do not support
  `expand_cons()` or `reduce()`.
- The value `f(sol)` of the expression at a solution `sol` always
  matches the energy reported by the solvers.

The semantics of the constraints declared with `cons()` depend on the
solver:

| Solver | Semantics |
|---|---|
| `EasySolver`, `ABS3Solver` | **soft**: violated constraints incur a penalty according to their weight; the search is driven toward good solutions that satisfy the constraints |
| `ExhaustiveSolver` | **soft**: ranks every assignment by the same penalty-inclusive energy as `EasySolver`/`ABS3Solver` and returns its **exact minimum** (ground truth for verifying and debugging on small instances) |
| external MIP solvers (`ScipSolver`, ...) with `ilp=True` | **hard**: constraints are passed to the MIP as linear constraints (weights are ignored; `RuntimeError` if any constraint carries a negative weight) |

To hand a constraint-carrying model to an external MIP solver, use its ILP
mode: pass `ilp=True` (e.g. `qbpp.ScipSolver(f, ilp=True)`); the model must
be linear. Without `ilp=True` these solvers report an error for models with
declared constraints.

The identical model definition can be verified with an exact solver and
then scaled up with a heuristic solver:

```python
import pyqbpp as qbpp

z = qbpp.var("z", shape=(4,))
obj = -3*z[0] - 5*z[1] - 2*z[2] - 7*z[3]
f = obj + 100 * qbpp.cons((z[0] + z[1] + z[2] + z[3]) == 2)
f.simplify_as_binary()

exact = qbpp.ExhaustiveSolver(f)                  # ground truth
print("exact optimum =", exact.search().energy)

heuristic = qbpp.EasySolver(f)                    # same model, scales up
print("heuristic     =", heuristic.search(time_limit=1).energy)
```

With native constraints, `target_energy` stops the search only when the
energy reaches the target **and every constraint is satisfied**.

The default callback of `EasySolver` reports the feasibility progress next
to the energy: `Energy` is the penalized total, `Obj` is the objective
part, and `Viol = k/m` says `k` of the `m` constraints are still violated.
When all constraints hold, `Energy` equals `Obj`.

## Checking a solution

`violations(sol)` evaluates every constraint against a solution and
returns one dict per constraint with the value, bounds, violation
distance, and weight:

```python
import pyqbpp as qbpp

s = qbpp.var("s", shape=(3,))
obj = -1*s[0] - 2*s[1] - 3*s[2]
f = obj + 10 * qbpp.cons((s[0] + s[1] + s[2]) == 1)
f.simplify_as_binary()

sol = qbpp.ExhaustiveSolver(f).search()
for t in f.violations(sol):
    print(t["lower"], "<=", t["value"], "<=", t["upper"],
          " violation =", t["violation"])
print("feasible" if f.is_feasible(sol) else "infeasible")
```

## Expanding into the classic penalty form

`qbpp.expand_cons(f)` returns an ordinary expression in which the
declared constraints are expanded into the **classic penalty form** — the
same form you would get by writing them with the comparison operators or
`qbpp.constrain`. Use it to hand a model to external QUBO/HUBO tools that
do not support native constraints. The in-place method `f.expand_cons()`
overwrites `f` instead. The expanded expression is not simplified; call
`simplify_as_binary()` before handing it to a solver.

```python
import pyqbpp as qbpp

n0, n1, n2 = qbpp.var("n0"), qbpp.var("n1"), qbpp.var("n2")
fe = n0 + 10 * qbpp.cons((n1 + n2) == 1)
ge = qbpp.expand_cons(fe)          # fe is unchanged; ge is a plain Expr
ge.simplify_as_binary()
```

## Migrating from and comparing with the classic penalty form

A sum of constraints that an existing model builds in the classic penalty
form with the comparison operators or `qbpp.constrain()` can be migrated to native
constraints simply by wrapping that expression in `qbpp.cons()`. Every
constraint contained in the wrapped expression is declared individually,
keeping its weight.

```python
import pyqbpp as qbpp

s0, s1, s2 = qbpp.var("s0"), qbpp.var("s1"), qbpp.var("s2")
obj3 = -3 * s0 + 2 * s1 - 5 * s2
constraints = 100 * ((s0 + s1 + s2) == 2)                    # classic penalty form
constraints += 150 * qbpp.constrain(10*s0 + 30*s1 - 10*s2, between=(None, 35))
fp = obj3 + constraints             # penalty form
fc = obj3 + qbpp.cons(constraints)  # same constraints, declared
fp.simplify_as_binary()
fc.simplify_as_binary()
print(fc.cons())
```

The output is:

```
100 * (s0 +s1 +s2 == 2)
150 * (10*s0 +30*s1 -10*s2 <= 35)
```

`fp` is the classic penalty model (the polynomial of `constraints` is added
to the objective as is), and `fc` declares the same constraints with
`cons()`. Reserve this form — adding several constraints first and then
wrapping the sum in `qbpp.cons()` — for migrating an existing penalty
formulation or for comparing a penalty-form model with its native-constraint
counterpart. When writing new constraints, wrap each one in its own
`qbpp.cons()` with the weight outside, as described above. On many problems
`fc` yields considerably better solutions than `fp`.

**Note on the meaning of the weights**: an equality constraint `f == v` is
penalized by $(f-v)^2$ in both forms, but a range constraint (`l <= f <= u`
and the one-sided `f <= u`, `f >= l`) is penalized by $v(v+1)$ for a
violation of $v$ in the classic penalty form (the `(f-l)(f-u)` expansion
described in [Comparison Constraints](COMPARISON)) and by $v^2$ with `qbpp.cons()`. For a violation of 1 the
classic form is twice as large, so migrating with the same weights makes
violating a range constraint cheaper. This changes the balance with any
penalty expressions left on the objective side — in particular expressions
such as `x * (1 - y - z)` that can become negative once a constraint is
broken — and a solution that violates a constraint may end up with a lower
energy. After migrating, check with `f.cons(sol)` or `violations(sol)` that
no violating solution is being chosen; if so, revisit the weights of the
range constraints or rewrite such expressions as linear constraints inside
`qbpp.cons()` as well.

## Free-form penalties

Passing an expression that is not a comparison to `qbpp.cons()` declares
it as a free-form penalty that is **satisfied exactly when its value is
0**. This lets you line up classic QUBO-style penalty expressions — any
expression whose value is **0 exactly when the constraint is satisfied** —
next to comparison constraints in the same form:

```python
import pyqbpp as qbpp

d, e, f2 = qbpp.var("d"), qbpp.var("e"), qbpp.var("f2")
g, h, i = qbpp.var("g"), qbpp.var("h"), qbpp.var("i")
mixed = 100 * qbpp.cons((d + e + f2) == 2)   # tracked comparison
mixed += 200 * qbpp.cons(~g * ~h * ~i)       # penalty: not all of g,h,i are 0
```

Comparison constraints are tracked individually; the free-form part counts
as satisfied only when its value is 0. The default callback shows this
part as `Pen = ...` (0 when satisfied), and `violations()` reports it as a
final entry with bounds `[0, 0]`. Ensuring that the expression is
nonnegative with minimum 0 is the caller's responsibility.
