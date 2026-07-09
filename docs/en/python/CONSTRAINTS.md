---
layout: default
nav_exclude: true
title: "Native Constraints"
nav_order: 27
lang: en
hreflang_alt: "ja/python/CONSTRAINTS"
hreflang_lang: "ja"
---

# Native Constraints

In PyQBPP, wrapping part of an expression in `qbpp.cons()` declares it as a
**constraint, which receives special handling**. The solvers bundled with
QUBO++ search efficiently for good solutions that satisfy the declared
constraints:

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(6,))
value = [3, 5, 2, 7, 4, 6]
weight = [2, 4, 1, 5, 3, 4]

obj = qbpp.Expr(0)
load = qbpp.Expr(0)
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

Migrating an existing penalty formulation just means wrapping the
constraint part in `qbpp.cons()` — replace `obj + 1000 * (rows + cols)`
with `obj + 1000 * qbpp.cons(rows + cols)`. On many problems this yields
considerably better solutions than solving the same constraints in penalty
form.

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

Applying `*=` to an accumulated constraint expression scales the weight of
every accumulated constraint at once:

```python
import pyqbpp as qbpp

k0, k1, k2 = qbpp.var("k0"), qbpp.var("k1"), qbpp.var("k2")
cons4 = qbpp.cons((k0 + k1 + k2) == 2)
cons4 += qbpp.cons(k0 + k1 - k2, between=(None, 1))
cons4 *= 1000                       # scale ALL weights at once
```

Printing the expression shows the **objective polynomial**, while
`f.cons()` returns the declared **constraint list** as a printable string
(the weight prefix is omitted when 1, one-sided bounds are shown
one-sided):

```python
import pyqbpp as qbpp

m0, m1, m2 = qbpp.var("m0"), qbpp.var("m1"), qbpp.var("m2")
printed = 1000 * qbpp.cons((m0 + m1 + m2) == 2)
printed += 500 * qbpp.cons(m0 + m1 - m2, between=(0, 1))
print(printed.cons())
```

The output is:

```
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
solvers do not support it).

## Arithmetic rules

A constraint-carrying expression `f` is a complete model description:

- `sol(f)` matches the Energy reported by the solvers.
- `f.cons(sol)` returns the **number** of violated constraints
  (0 == all satisfied).
- Objective adjustments (`+`, `-`, adding constants), positive scalar
  multiplication (bulk weight scaling), `simplify_as_binary()`, and
  `qbpp.replace()` all preserve the constraints.
- `f.simplify_as_binary()` applies to both the objective and the
  constraints. Call it once before handing the expression to a solver —
  in particular after `qbpp.replace()` substitutes variables.
- Operations that would destroy the constraint declaration —
  `qbpp.sqr()`, multiplying two expressions, multiplying by a
  non-positive scalar, subtracting a constraint expression,
  `qbpp.reduce()`, ... — raise `RuntimeError`.

## Solver semantics

Every solver accepts the same expression `f` as its single argument:

| Solver | Semantics |
|---|---|
| `EasySolver`, `ABS3Solver` | **soft**: violated constraints incur a penalty according to their weight; the search is driven toward good solutions that satisfy the constraints |
| `ExhaustiveSolver` | **hard**: minimizes the objective over the assignments that satisfy the constraints (weights are ignored); reports an error when no feasible assignment exists |
| external MIP solvers (`ScipSolver`, ...) | **hard**: constraints are passed to the MIP as linear constraints (weights are ignored) |

The identical model definition can be verified with an exact solver and
then scaled up with a heuristic solver:

```python
import pyqbpp as qbpp

z = qbpp.var("z", shape=(4,))
obj = -3*z[0] - 5*z[1] - 2*z[2] - 7*z[3] + qbpp.Expr(0)
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
obj = -1*s[0] - 2*s[1] - 3*s[2] + qbpp.Expr(0)
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

## Free-form penalties

Any expression whose value is **0 exactly when the constraint is
satisfied** can be mixed into `qbpp.cons()` — the classic QUBO penalty
style:

```python
import pyqbpp as qbpp

d, e, f2 = qbpp.var("d"), qbpp.var("e"), qbpp.var("f2")
g, h, i = qbpp.var("g"), qbpp.var("h"), qbpp.var("i")
mixed = qbpp.cons(100 * ((d + e + f2) == 2)   # tracked comparison
                  + 200 * (~g * ~h * ~i))     # penalty: not all of g,h,i are 0
```

Comparison constraints are tracked individually; the free-form part counts
as satisfied only when its value is 0. The default callback shows this
part as `Pen = ...` (0 when satisfied), and `violations()` reports it as a
final entry with bounds `[0, 0]`. Ensuring that the expression is
nonnegative with minimum 0 is the caller's responsibility.

Nonlinear (degree ≥ 2) expressions inside `qbpp.cons()` are handled as
constraints too — both **equalities** (such as `x*y + z == 1`) and **ranges**
(such as `qbpp.cons(x*y + z*w, between=(1, 2))`). The bundled solvers
(`EasySolver`, `ExhaustiveSolver`, `ABS3Solver`) search for assignments that
satisfy them. External MIP/ILP solvers do not accept nonlinear constraint
bodies; expand them to the classic penalty form with `expand_cons()` (see below)
before handing the expression to those solvers.
