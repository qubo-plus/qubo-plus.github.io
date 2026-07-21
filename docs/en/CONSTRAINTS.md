---
layout: default
nav_exclude: true
title: "Native Constraints"
nav_order: 27
lang: en
hreflang_alt: "ja/CONSTRAINTS"
hreflang_lang: "ja"
---

# Native Constraints

In QUBO++, wrapping part of an expression in `qbpp::cons()` declares it as a
**constraint, which receives special handling**. The solvers bundled with
QUBO++ search efficiently for good solutions that satisfy the declared
constraints.

## Solving integer linear programming with `cons()`

In [Range Constraints and Solving Integer Linear Programming](RANGE), the
following integer linear programming problem was solved by adding the range
constraints `c1` and `c2` to the objective as weighted penalty expressions:

$$
\begin{aligned}
\text{Maximize: } & & & 5x + 4y \\
\text{Subject to: } & && 2x + 3y \le 24 \\
                   & & & 7x + 5y \le 54
\end{aligned}
$$

The same problem can be written as follows by wrapping the constraints in `qbpp::cons()`:

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  auto x = 0 <= qbpp::var_int("x") <= 10;
  auto y = 0 <= qbpp::var_int("y") <= 10;
  auto f = 5 * x + 4 * y;
  auto c1 = 0 <= 2 * x + 3 * y <= 24;
  auto c2 = 0 <= 7 * x + 5 * y <= 54;
  auto g = -f + 100 * (qbpp::cons(c1) + qbpp::cons(c2));
  g.simplify_as_binary();
  auto solver = qbpp::EasySolver(g);
  auto sol = solver.search({{"time_limit", 1.0}});
  std::cout << "x = " << sol(x) << ", y = " << sol(y) << std::endl;
  std::cout << "f = " << sol(f) << std::endl;
  std::cout << "violated constraints = " << g.cons(sol) << std::endl;
}
```
{% endraw %}

The only change is rewriting the penalty sum `100 * (c1 + c2)` as
`100 * (qbpp::cons(c1) + qbpp::cons(c2))`.
With this change alone, `c1` and `c2` are **declared as constraints** rather
than mere penalty expressions, and the solver searches efficiently for
solutions that satisfy them.
`g.cons(sol)` returns the number of constraints violated by the solution `sol`
(0 means all constraints are satisfied).
The program outputs:

```
x = 4, y = 5
f = 40
violated constraints = 0
```

## A knapsack example

As another example, the following program solves a small knapsack problem
(a capacity constraint and an equality constraint) with `cons()`:

{% raw %}
```cpp
#include <qbpp/easy_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 6);
  int value[] = {3, 5, 2, 7, 4, 6};
  int weight[] = {2, 4, 1, 5, 3, 4};

  qbpp::Expr obj, load;
  for (int i = 0; i < 6; ++i) {
    obj += -value[i] * x(i);
    load += weight[i] * x(i);
  }

  auto f = obj + 100 * qbpp::cons(load <= 8)        // capacity, weight 100
               + 10 * qbpp::cons(x(0) + x(1) == 1); // equality, weight 10
  f.simplify_as_binary();

  qbpp::EasySolver solver(f);
  auto sol = solver.search({{"time_limit", 1}});
  std::cout << "objective = " << sol.energy() << std::endl;
}
```
{% endraw %}

Migrating an existing penalty formulation just means wrapping the
constraint part in `qbpp::cons()` — replace `obj + 1000 * (rows + cols)`
with `obj + 1000 * qbpp::cons(rows + cols)`. On many problems this yields
considerably better solutions than solving the same constraints in penalty
form.

## Writing constraints

A constraint is a comparison with an integer right-hand side, or a chained
two-sided range, wrapped in `qbpp::cons()`. Weights are written as scalar
factors on the constraint, and constraints combine freely with the
objective and each other via `+`:

```cpp
auto a = qbpp::var("a"), b = qbpp::var("b"), c = qbpp::var("c");
auto u = qbpp::var("u"), v = qbpp::var("v"), w = qbpp::var("w");

auto cons = 1000 * qbpp::cons(a + b + c == 2)                  // equality
          + 1000 * qbpp::cons(10 * u + 30 * v - 10 * w <= 35)  // one-sided
          + 500 * qbpp::cons(0 <= a + b - c <= 1);             // two-sided
```

Wrapping an array comparison adds one constraint per element, so the
one-hot rows of a matrix are a single statement:

```cpp
auto y = qbpp::var("y", 4, 4);
auto one_hot = 1000 * qbpp::cons(qbpp::vector_sum(y) == 1);  // one per row
```

A weighted sum of constraints can also be wrapped at once — the following
creates two constraints with weights 100 and 150:

```cpp
auto p = qbpp::var("p"), q = qbpp::var("q"), r = qbpp::var("r");
auto cons2 = qbpp::cons(100 * (p + q + r == 2) +
                        150 * (10 * p + 30 * q - 10 * r <= 35));
```

Applying `*=` to an accumulated constraint expression scales the weight of
every accumulated constraint at once:

```cpp
auto k0 = qbpp::var("k0"), k1 = qbpp::var("k1"), k2 = qbpp::var("k2");
auto cons4 = qbpp::cons(k0 + k1 + k2 == 2);
cons4 += qbpp::cons(k0 + k1 - k2 <= 1);
cons4 *= 1000;                      // scale ALL weights at once
```

Printing the expression shows the **objective polynomial**; printing
`f.cons()` shows the declared **constraint list** (the weight prefix is
omitted when 1, one-sided bounds are shown one-sided):

```cpp
auto m0 = qbpp::var("m0"), m1 = qbpp::var("m1"), m2 = qbpp::var("m2");
auto printed = 1000 * qbpp::cons(m0 + m1 + m2 == 2)
             + 500 * qbpp::cons(0 <= m0 + m1 - m2 <= 1);
std::cout << printed.cons() << std::endl;
```

The output is:

```
1000 * (m0 +m1 +m2 == 2)
500 * (0 <= m0 +m1 -m2 <= 1)
```

### Discrete allowed-value sets

A constraint that requires an expression to equal **one of a discrete set of
values** is written with `qbpp::equal{...}`. `qbpp::cons(s == qbpp::equal{0, 2})`
is satisfied only when `s` is 0 or 2 (`qbpp::cons(s, qbpp::equal{0, 2})` is
equivalent). Any number of values, and any integers, may be listed.

```cpp
auto e = qbpp::var("e", 5);
// choose 0 or 2 of the edges incident to each vertex
auto deg = 100 * qbpp::cons(qbpp::sum(e) == qbpp::equal{0, 2});
```

This is handy for problems that select edges forming a path or cycle in a
graph (satisfied when every vertex has degree 0 or 2). Because the allowed
values are discrete, they cannot be expressed as a two-sided range
`l <= f <= u`. The constraint list shows it as `== {0, 2}`. This constraint
is supported by `EasySolver`, `ExhaustiveSolver`, and `ABS3Solver` (the MIP
solvers do not support it). It is not available with the double-coefficient
frontend (`DOUBLE_TYPE*`).

## Arithmetic rules

A constraint-carrying expression `f` is a complete model description:

- `f(sol)` matches the Energy reported by the solvers.
- `f.cons(sol)` returns the **number** of violated constraints
  (0 == all satisfied).
- Objective adjustments (`+`, `-`, adding constants), positive scalar
  multiplication (bulk weight scaling), `simplify_as_binary()`, and
  `qbpp::replace()` all preserve the constraints.
- `f.simplify_as_binary()` applies to both the objective and the
  constraints. Call it once before handing the expression to a solver —
  in particular after `qbpp::replace()` substitutes variables.
- Operations that would destroy the constraint declaration — `sqr()`,
  multiplying two expressions, multiplying by a non-positive scalar,
  subtracting a constraint expression, `reduce()`, ... — report an
  explicit error.

## Solver semantics

Every solver accepts the same expression `f` as its single argument:

| Solver | Semantics |
|---|---|
| `EasySolver`, `ABS3Solver` | **soft**: violated constraints incur a penalty according to their weight; the search is driven toward good solutions that satisfy the constraints |
| `ExhaustiveSolver` | **soft**: ranks every assignment by the same penalty-inclusive energy as `EasySolver`/`ABS3Solver` and returns its **exact minimum** (ground truth for verifying and debugging on small instances) |
| `GurobiSolver`, `ScipSolver`, `HighsSolver`, `CbcSolver`, `GlpkSolver` | **hard**: constraints are passed to the MIP as linear constraints (weights are ignored) |

The identical model definition can be verified with an exact solver and
then scaled up with a heuristic solver:

{% raw %}
```cpp
#include <qbpp/easy_solver.hpp>
#include <qbpp/exhaustive_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto z = qbpp::var("z", 4);
  qbpp::Expr obj = -3 * z(0) - 5 * z(1) - 2 * z(2) - 7 * z(3);
  auto f = obj + 100 * qbpp::cons(z(0) + z(1) + z(2) + z(3) == 2);
  f.simplify_as_binary();

  qbpp::ExhaustiveSolver exact(f);             // ground truth
  std::cout << "exact optimum = " << exact.search().energy() << std::endl;

  qbpp::EasySolver heuristic(f);               // same model, scales up
  auto sol = heuristic.search({{"time_limit", 1}});
  std::cout << "heuristic     = " << sol.energy() << std::endl;
}
```
{% endraw %}

With native constraints, `target_energy` stops the search only when the
energy reaches the target **and every constraint is satisfied**.

The default callback of `EasySolver` reports the feasibility progress next
to the energy: `Energy` is the penalized total, `Obj` is the objective
part, and `Viol = k/m` says `k` of the `m` constraints are still violated.
When all constraints hold, `Energy` equals `Obj`.

## Checking a solution

`violations()` evaluates every constraint against a solution and reports
the value, bounds, violation distance, and weight:

```cpp
auto s = qbpp::var("s", 3);
qbpp::Expr obj2 = -1 * s(0) - 2 * s(1) - 3 * s(2);
auto f3 = obj2 + 10 * qbpp::cons(s(0) + s(1) + s(2) == 1);
f3.simplify_as_binary();

qbpp::ExhaustiveSolver solver3(f3);
auto sol3 = solver3.search();
for (const auto& t : f3.violations(sol3)) {
  std::cout << t.lower << " <= " << t.value << " <= " << t.upper
            << "  violation = " << t.violation << std::endl;
}
std::cout << (f3.is_feasible(sol3) ? "feasible" : "infeasible")
          << std::endl;
```

## Expanding into the classic penalty form

`qbpp::expand_cons(f)` returns an ordinary expression in which the
declared constraints are expanded into the **classic penalty form** — the
same form you would get by writing them with the comparison operators.
Use it to hand a model to external QUBO/HUBO tools that do
not support native constraints. The in-place member `f.expand_cons()`
overwrites `f` instead. The expanded expression is not simplified; call
`simplify_as_binary()` before handing it to a solver.

```cpp
auto n0 = qbpp::var("n0"), n1 = qbpp::var("n1"), n2 = qbpp::var("n2");
auto fe = n0 + 10 * qbpp::cons(n1 + n2 == 1);
auto ge = qbpp::expand_cons(fe);   // fe is unchanged; ge is a plain Expr
ge.simplify_as_binary();
```

## Free-form penalties

Any expression whose value is **0 exactly when the constraint is
satisfied** can be mixed into `qbpp::cons()` — the classic QUBO penalty
style:

```cpp
auto d = qbpp::var("d"), e = qbpp::var("e"), f = qbpp::var("f");
auto g = qbpp::var("g"), h = qbpp::var("h"), i = qbpp::var("i");
auto mixed = qbpp::cons(100 * (d + e + f == 2)      // tracked comparison
                        + 200 * (~g * ~h * ~i));    // penalty: not all 0
```

Comparison constraints are tracked individually; the free-form part counts
as satisfied only when its value is 0. The default callback shows this
part as `Pen = ...` (0 when satisfied), and `violations()` reports it as a
final entry with bounds `[0, 0]`. Ensuring that the expression is
nonnegative with minimum 0 is the caller's responsibility.

Nonlinear (degree ≥ 2) expressions inside `qbpp::cons()` are handled as
constraints too — both **equalities** (such as `x*y + z == 1`) and **ranges**
(such as `1 <= x*y + z*w <= 2`). The bundled solvers (`EasySolver`,
`ExhaustiveSolver`, `ABS3Solver`) search for assignments that satisfy them.
External MIP/ILP solvers do not accept nonlinear constraint bodies; expand them
to the classic penalty form with `expand_cons()` (see below) before handing the
expression to those solvers.
