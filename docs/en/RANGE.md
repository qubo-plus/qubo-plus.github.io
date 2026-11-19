---
last_modified: 2026-10-14
layout: default
nav_exclude: true
title: "Range Constraints"
nav_order: 8
lang: en
hreflang_alt: "ja/RANGE"
hreflang_lang: "ja"
---

# Range Constraints and Solving Integer Linear Programming

## Solving integer linear programming
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

The following QUBO++ program finds this optimal solution with the Easy Solver, using [integer variables](INTEGER) `x` and `y`:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  auto x = 0 <= qbpp::int_var("x") <= 10;
  auto y = 0 <= qbpp::int_var("y") <= 10;
  auto f = 5 * x + 4 * y;
  auto g = -f + 100 * qbpp::cons(2 * x + 3 * y <= 24) +
           100 * qbpp::cons(7 * x + 5 * y <= 54);
  g.simplify();
  std::cout << "g = " << g << std::endl;

  auto solver = qbpp::EasySolver(g);
  auto sol = solver.search({{"time_limit", 1.0}});
  std::cout << "x = " << sol(x) << ", y = " << sol(y) << std::endl;
  std::cout << "f = " << sol(f) << std::endl;
  std::cout << "violated constraints = " << g.cons(sol) << std::endl;
}
```
{% endraw %}

In this QUBO++ program,
- **`f`** represents the objective function,
- **`qbpp::cons(2 * x + 3 * y <= 24)`** and **`qbpp::cons(7 * x + 5 * y <= 54)`** represent the two constraints, and
- **`g`** combines them into a single optimization expression.

Since the goal is maximization, the objective is negated as `-f`.
Comparison expressions wrapped in `qbpp::cons()` are **treated specially as constraints**,
and the bundled solvers search efficiently for solutions that satisfy the constraints.
When a constraint is violated, a penalty equal to the square of the violation amount (in this example, the amount by which the left-hand side exceeds the right-hand side) multiplied by the weight 100 is added.
The weight should be large enough that violating a constraint to improve the objective does not pay off.

An Easy Solver instance is created for `g`, and a search is performed with a time limit of 1.0 seconds.
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
In addition to one-sided inequalities, a constraint can also be a **range constraint** $l \leq f \leq u$.
The following four kinds of comparison expressions can be written inside `qbpp::cons()`:

| Syntax | Meaning |
|---|---|
| `qbpp::cons(f <= u)` | $f \leq u$ |
| `qbpp::cons(f >= l)` | $f \geq l$ |
| `qbpp::cons(l <= f <= u)` | $l \leq f \leq u$ (range constraint) |
| `qbpp::cons(f == v)` | $f = v$ |

For example, adding the range constraint "$x - y$ is at least 1 and at most 3" to the problem above changes the optimal solution to $x=5$, $y=3$ (objective value $37$):

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto x = 0 <= qbpp::int_var("x") <= 10;
  auto y = 0 <= qbpp::int_var("y") <= 10;
  auto f = 5 * x + 4 * y;
  auto g = -f + 100 * qbpp::cons(2 * x + 3 * y <= 24) +
           100 * qbpp::cons(7 * x + 5 * y <= 54) +
           100 * qbpp::cons(1 <= x - y <= 3);
  g.simplify();

  auto solver = qbpp::ExhaustiveSolver(g);
  auto sol = solver.search();
  std::cout << "x = " << sol(x) << ", y = " << sol(y) << std::endl;
  std::cout << "f = " << sol(f) << std::endl;
  std::cout << "violated constraints = " << g.cons(sol) << std::endl;
}
```
{% endraw %}

Here, the Exhaustive Solver searches all assignments to obtain the exact optimal solution.
The program outputs:
```
x = 5, y = 3
f = 37
violated constraints = 0
```

Constraints declared with `cons()` have the same meaning in all three bundled
solvers (Easy Solver, Exhaustive Solver, and ABS3 Solver), and the Exhaustive
Solver returns the **exact minimum** of this penalty-inclusive energy.
The MIP solvers (SCIP, etc.) treat them as **hard constraints** (constraints that must be satisfied).
See [Native Constraints](CONSTRAINTS) for details.

## Range constraints with penalty expressions
Comparison expressions not wrapped in `qbpp::cons()` become **penalty expressions** that can be represented as QUBO or HUBO (expressions that take the minimum value 0 if and only if the constraint is satisfied).
These penalty expressions are used when passing a model to an external QUBO solver that only accepts binary variables.

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
If $f$ is a linear expression, then $g$ becomes a QUBO expression.
If $f$ is quadratic or of higher degree, then $g$ becomes a HUBO expression (the degree of $g$ is twice that of $f$).

The penalty form needs this auxiliary variable for every range constraint,
whereas constraints declared with `cons()` introduce no auxiliary variables.
The section "Comparison with the penalty form" of [Native Constraints](CONSTRAINTS)
compares how the number of variables and terms of the model changes.
A model written with `cons()` can be expanded into penalty expressions with [`qbpp::expand_cons()`](CONSTRAINTS#expanding-into-the-classic-penalty-form).

>**NOTE**
> QUBO++ internally employs a lightweight improvement that enables range constraints to be encoded with a slightly smaller number of binary variables.
> Details are described in [Comparison Operators](COMPARISON).
