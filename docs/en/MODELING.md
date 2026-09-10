---
last_modified: 2026-08-26
layout: default
title: "Expressive Power of QUBO++"
nav_order: 2.5
lang: en
hreflang_alt: "ja/MODELING"
hreflang_lang: "ja"
---

# Expressive Power of QUBO++

What a QUBO/HUBO solver ultimately receives is a polynomial over binary
variables. Traditionally, you had to **lower** your problem down to that form
yourself: expand integers into strings of binary variables, add slack
variables to inequalities, express absolute values and maxima with auxiliary
variables and case analysis, and reduce terms of degree 3 or higher to
degree 2. Every one of those conversions adds variables, creates the chore of
tuning penalty weights, and hides the structure of the original problem.

QUBO++ does not ask you to do this.
**The model you write is the model that gets solved.**

| Manual work a plain QUBO requires | How you write it in QUBO++ | Details |
|---|---|---|
| Reduce terms of degree 3 or higher with auxiliary variables | write them as they are | [HUBO and QUBO](HUBO_QUBO) |
| Expand $\bar{x}$ into $1-x$ (the term count explodes) | write `~x` | [Negated Literals](NEGATIVE) |
| Expand an integer into a string of binary variables | declare it with `qbpp::int_var()` | [Native Integer Variables](NATIVE_INTEGER) |
| Express absolute values and maxima with auxiliary variables and case analysis | write `qbpp::abs()` / `qbpp::max()` | [Nonlinear Functions and Native Constraints](CONSTRAINTS) |
| Add slack variables to inequalities and tune the weights | wrap it in `qbpp::cons()` | [Nonlinear Functions and Native Constraints](CONSTRAINTS) |
| Manage coefficient overflow yourself | pick a type | [Data Types of Variables and Expressions](VAREXPR) |

This page is an **overview** of these features. For the full explanation of
each one, follow the link in the rightmost column.

## Terms of Any Degree

Expressions in QUBO++ are not limited to degree 2. Terms of degree 3 or higher
can be written as they are.

```cpp
auto y = qbpp::var("y", 4);
auto cubic = 2 * y[0] * y[1] * y[2] - 3 * y[1] * y[2] * y[3];
std::cout << "cubic = " << cubic << std::endl;
```

The output of this program is as follows:

```
cubic = 2*y[0]*y[1]*y[2] -3*y[1]*y[2]*y[3]
```

The solvers bundled with QUBO++ handle HUBO directly, so no reduction to
degree 2 is needed. Reduce to degree 2 with
[Reducing HUBO to QUBO](REDUCE) only when passing the model to an external
solver that accepts quadratic models alone.

## Negated Literals

The negation $\bar{x}$ of a binary variable $x$ is written **`~x`**. There is
no need to replace $\bar{x}$ with $1-x$ and expand.

```cpp
auto x = qbpp::var("x", 4);
auto neg = ~x[0] * ~x[1] * ~x[2] * ~x[3];
auto expanded = qbpp::simplify((1 - x[0]) * (1 - x[1]) * (1 - x[2]) * (1 - x[3]));
std::cout << "neg      = " << neg << std::endl;
std::cout << "expanded = " << expanded << std::endl;
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

QUBO++ offers two kinds of integer variables with different characters.

```cpp
auto a = 0 <= qbpp::var_int("a") <= 10;   // binary encoding
auto b = 0 <= qbpp::int_var("b") <= 10;   // native integer variable
std::cout << "a = " << a << std::endl;
std::cout << "b = " << b << std::endl;
```

The output of this program is as follows:

```
a = a[0] +2*a[1] +4*a[2] +3*a[3]
b = b
```

An integer variable declared with **`qbpp::var_int()`** is expanded on the
spot into a weighted sum of binary variables
([Integer Variables](INTEGER)). An integer variable declared with
**`qbpp::int_var()`** is not expanded and holds the integer value itself
([Native Integer Variables](NATIVE_INTEGER)). Both are used the same way
inside expressions.

| | `qbpp::var_int()` | `qbpp::int_var()` |
|---|---|---|
| What it is in an expression | weighted sum of binary variables | the integer value itself |
| Bundled solvers | searched as binary variables | searched as integer values |
| Widening the range | increases the variable count | leaves the variable count unchanged |
| Binary-only external solvers | passed as is | converted with `qbpp::binarize()` |
| MILP solvers | passed as binary variables | passed as integer variables |

Native integer variables suit **quantities** (counts, times, stock levels).
For a **label** that selects one of several choices (visiting order, color),
a [one-hot representation](ONEHOT) suits better than an integer variable.

## Nonlinear Functions

Absolute value, ReLU, maximum, and minimum can be used directly inside an
expression. There is no need to introduce auxiliary variables or write case
analysis.

```cpp
auto q = 0 <= qbpp::int_var("q") <= 10;
auto r = 0 <= qbpp::int_var("r") <= 10;
auto over = 2 * qbpp::relu(q - 6);   // cost that grows beyond 6
auto gap = qbpp::abs(q - 5);         // deviation from 5
auto peak = qbpp::max(q, r);         // maximum of two expressions
```

Writing `qbpp::abs(f, 2)` / `qbpp::relu(f, 2)` gives the squared value. See
[Nonlinear Functions and Native Constraints](CONSTRAINTS) for details.

## Declaring Constraints

Wrapping the constraint part of an expression in **`qbpp::cons()`** marks that
part as a constraint, which is then treated specially. You do not have to add
slack variables yourself.

```cpp
auto w = qbpp::var("w", 3);
auto load = 3 * w[0] + 5 * w[1] + 7 * w[2];
auto obj = -qbpp::sum(w)                         // objective
         + 100 * qbpp::cons(load <= 10)          // inequality constraint
         + 100 * qbpp::cons(qbpp::sum(w) == 2);  // equality constraint
```

Equalities, one-sided inequalities, and two-sided ranges are all declared the
same way. The solver reports how many constraints are violated, so you can
tell whether a feasible solution was found. See
[Nonlinear Functions and Native Constraints](CONSTRAINTS) for details.

## Coefficient Types

The types of coefficients and energy values are switched with a single macro.
You can choose anything from `int32_t` to 128-bit integers, the
unlimited-precision `qbpp::cpp_int`, and real-valued `double`. Expressions are
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

{% raw %}
```cpp
#include <qbpp/exhaustive_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto use = qbpp::var("use", 3);              // binary variables
  auto q = 0 <= qbpp::int_var("q", 3) <= 10;   // native integer variables

  auto f = qbpp::toExpr(0);
  for (int i = 0; i < 3; ++i) {
    f += 5 * use[i];                                 // setup fee
    f += 2 * qbpp::relu(q[i] - 6);                   // overtime fee
    f += 100 * qbpp::cons(q[i] - 10 * use[i] <= 0);  // a line that is off cannot produce
  }
  f += qbpp::abs(q[0] - q[1]);                       // imbalance between lines
  f += 50 * ~use[0] * ~use[1] * ~use[2];             // penalty for shutting down everything
  f += 100 * qbpp::cons(qbpp::sum(q) == 20);         // meet the demand exactly

  f.simplify_as_binary();
  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search();
  for (int i = 0; i < 3; ++i)
    std::cout << "use[" << i << "] = " << sol(use[i])
              << ", q[" << i << "] = " << sol(q[i]) << std::endl;
  std::cout << "energy = " << sol.energy() << std::endl;
}
```
{% endraw %}

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

## Lowering to the Traditional Form

When the traditional form is needed — to pass the model to an external solver,
for instance — it can be lowered explicitly.

| Function | Conversion |
|---|---|
| `qbpp::binarize(f)` | native integer variables into binary encoding |
| `qbpp::expand_cons(f)` | `qbpp::cons()` declarations into traditional penalty expressions |
| `qbpp::reduce(f)` | terms of degree 3 or higher into degree 2 |

```cpp
auto n = 0 <= qbpp::int_var("n") <= 10;
auto bits = qbpp::binarize(n);
std::cout << "bits = " << bits << std::endl;
```

The output of this program is as follows:

```
bits = n#0 +2*n#1 +4*n#2 +3*n#3
```

For MILP solvers, an [ILP mode](ILP) that passes integer variables as integers
is also available.

## What to Read Next

- [Reducing HUBO to QUBO](REDUCE) — reducing terms of degree 3 or higher to degree 2
- [Negated Literals](NEGATIVE) — working with negated literals
- [Integer Variables and Solving Simultaneous Equations](INTEGER) — binary-encoded integer variables
- [Native Integer Variables](NATIVE_INTEGER) — variables that hold the integer value itself
- [Nonlinear Functions and Native Constraints](CONSTRAINTS) — `abs`, `relu`, `max`, `min`, and `cons()`
- [Data Types of Variables and Expressions](VAREXPR) — coefficient and energy types
- [Quick Start](QUICK) — your first program
