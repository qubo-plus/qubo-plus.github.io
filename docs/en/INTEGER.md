---
last_modified: 2026-10-30
layout: default
nav_exclude: true
title: "Integer Variables"
nav_order: 6
lang: en
hreflang_alt: "ja/INTEGER"
hreflang_lang: "ja"
---

# Integer Variables and Solving Simultaneous Equations

In addition to binary variables, QUBO++ supports **integer variables**.
An integer variable is declared with a range of values (a lower bound and an upper bound),
and the solvers bundled with QUBO++
([Easy Solver](EASYSOLVER), [Exhaustive Solver](EXHAUSTIVE), and [ABS3 Solver](ABS3))
search its integer values directly.

## Declaring integer variables

Placing **`qbpp::int_var("name")`** between the range operators **`<= <=`**
creates a variable that takes integer values in that range. The range is mandatory.
The declared variable can be used in expressions just like binary variables:

```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto x = 0 <= qbpp::int_var("x") <= 10;
  auto f = x * x - 4 * x;
  f.simplify();
  std::cout << "f = " << f << std::endl;

  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search();
  std::cout << "x = " << sol(x) << std::endl;
  std::cout << "f = " << sol.energy() << std::endl;
}
```

`x` is a variable that takes integer values from 0 to 10, and the Exhaustive Solver
finds the `x` that minimizes $f = x^2 - 4x$.
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

The expression obtained by squaring the difference between the left-hand and right-hand sides of each equation and adding them up

$$
\begin{aligned}
f(x,y) &= (x+y-10)^2 + (2x+4y-28)^2
\end{aligned}
$$

takes the minimum value 0 if and only if both equations are satisfied simultaneously.
Therefore, the $x$ and $y$ that minimize $f(x,y)$ are the solution of the simultaneous equations.
The following program builds $f(x,y)$ with integer variables `x` and `y` in the range $[0,10]$ and solves it with the Easy Solver:

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  auto x = 0 <= qbpp::int_var("x") <= 10;
  auto y = 0 <= qbpp::int_var("y") <= 10;
  auto f = qbpp::sqr(x + y - 10) + qbpp::sqr(2 * x + 4 * y - 28);
  f.simplify();
  std::cout << "f = " << f << std::endl;

  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"target_energy", 0}});
  std::cout << "x = " << sol(x) << ", y = " << sol(y) << std::endl;
  std::cout << "f = " << sol.energy() << std::endl;
}
```
{% endraw %}

Since the minimum value is known to be 0, `target_energy` is set to 0
so that the search terminates as soon as a solution with energy 0 is found.
The output of the program is as follows:

```
f = 884 -132*x -244*y +5*x*x +18*x*y +17*y*y
x = 6, y = 4
f = 0
```

`f` is kept as a quadratic expression in `x` and `y`, and the solver searches the values of `x` and `y` as integers.

## Arrays of integer variables

Passing dimensions to `int_var()` creates an array of integer variables.
Elements are accessed with `s[i]`, and `qbpp::sum()` builds the sum of all elements:

{% raw %}
```cpp
#include <qbpp/exhaustive_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto s = 0 <= qbpp::int_var("s", 3) <= 9;
  auto t = qbpp::sum(s);
  auto f = qbpp::sqr(t - 6) + qbpp::sqr(s[0] - s[1] + 1) +
           qbpp::sqr(s[1] - s[2] + 1);
  f.simplify();
  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search();
  std::cout << "s = " << sol(s[0]) << ", " << sol(s[1]) << ", " << sol(s[2])
            << std::endl;
  std::cout << "f = " << sol.energy() << std::endl;
}
```
{% endraw %}

The output of the program is as follows:

```
s = 1, 2, 3
f = 0
```

Whole-array operations (`s + t`, `2 * s`, `qbpp::sqr(s)`, element-wise
constraints such as `s <= 5`, `s(qbpp::slice(1, 3))`,
`qbpp::vector_sum()`, `qbpp::concat()`) treat the array as an array of
`Expr`, and `sol(s)` reads all element values at once.
Only when passing the array to `qbpp::einsum()` do you need to convert it
to an `Expr` array with `qbpp::toExpr(s)`.

## Arrays with per-element ranges

The array declaration shares a single range across all elements. Passing
arrays as the lower/upper bounds creates an array of integer
variables with individual per-element ranges. An element whose lower and
upper bounds are equal becomes a constant fixed to that value:

{% raw %}
```cpp
#include <qbpp/exhaustive_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  const auto lower = qbpp::array({1, 0, 2});
  const auto upper = qbpp::array({4, 3, 2});
  auto v = lower <= qbpp::int_var("v", 3) <= upper;
  auto f = qbpp::sqr(qbpp::sum(v) - 6) + v[0];
  f.simplify();
  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search();
  std::cout << "v = " << sol(v[0]) << ", " << sol(v[1]) << ", " << sol(v[2])
            << std::endl;
  std::cout << "f = " << sol.energy() << std::endl;
}
```
{% endraw %}

The output of the program is as follows (`v[2]` is fixed to the constant 2
because its lower and upper bounds coincide):

```
v = 1, 3, 2
f = 1
```

Only one of the bounds can be an array as well (e.g.
`0 <= qbpp::int_var("w", 3) <= upper` shares the lower bound 0 across all
elements). Arrays of two or more dimensions (e.g. `qbpp::int_var("x", 3, 4)`)
work the same way. The bound arrays must have the shape of the variable array;
a different shape throws `std::invalid_argument`.

In addition, `qbpp::int_var("x", 3) == 0` creates a mutable array whose
elements are all the constant 0, and an integer variable can be assigned
to each element individually:

{% raw %}
```cpp
#include <qbpp/exhaustive_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  const auto cap = qbpp::array({3, 1, 2});
  auto x = qbpp::int_var("x", 3) == 0;
  for (size_t j = 0; j < cap.size(); j++) {
    x[j] = 0 <= qbpp::int_var() <= cap[j];
  }
  auto f = qbpp::sqr(qbpp::sum(x) - 5) - x[0] - x[1];
  f.simplify();
  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search();
  std::cout << "x = " << sol(x[0]) << ", " << sol(x[1]) << ", " << sol(x[2])
            << std::endl;
  std::cout << "f = " << sol.energy() << std::endl;
}
```
{% endraw %}

The output of the program is as follows:

```
x = 3, 1, 1
f = -4
```

Elements that are not assigned remain the constant (0 here) in the
expression. Constants other than 0 can also be used.

## Evaluation and substitution

To evaluate an expression at given values of the integer variables, use the
[evaluation function](EVAL) {% raw %}`f({{x, 3}})`{% endraw %} exactly as for binary variables.
The values must lie within the declared range (out-of-range values are discussed below).
The [replace function](REPLACE) {% raw %}`qbpp::replace(f, {{x, e}})`{% endraw %} rewrites every occurrence of `x` in `f` as the expression `e`.
Powers such as `x * x` are substituted per occurrence, so replacing `x` by `y + 1` expands
$(y+1)^2 + (y+1)$:

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = 0 <= qbpp::int_var("x") <= 10;
  auto y = 0 <= qbpp::int_var("y") <= 10;
  auto f = x * x + x;

  std::cout << "f(3) = " << f({{x, 3}}) << std::endl;

  auto g = qbpp::replace(f, {{x, 2}});
  g.simplify();
  std::cout << "g = " << g << std::endl;

  auto h = qbpp::replace(f, {{x, y + 1}});
  h.simplify();
  std::cout << "h = " << h << std::endl;
}
```
{% endraw %}

The output of the program is as follows:

```
f(3) = 12
g = 6
h = 2 +3*y +y*y
```

Substitution is a symbolic rewrite: the range of `x` is not carried over to the result.
No constraint forcing `y + 1` into the range of `x` is added automatically, and substituting an out-of-range
constant does not throw an exception (only a fixed integer variable, whose lower and upper bounds are equal, throws `std::invalid_argument` when replaced by a value other than its own).
Add any required constraint explicitly with [`qbpp::cons()`](CONSTRAINTS).
Whether the resulting expression contains integer variables is decided by the variables
in the substituted expression (with `y + 1`, the range and integrality of `y` remain in force).
The declaration of the variable `x` itself is untouched, and `x` can still be used in other expressions.
Evaluating with an out-of-range value, on the other hand, throws an exception (`std::invalid_argument`).

## Constraints

Constraints on expressions containing integer variables (such as $2x + 3y \leq 24$) can be written with `qbpp::cons()`.
They are explained in [Range Constraints and Solving Integer Linear Programming](RANGE).

## Working with external solvers

MIP solvers handle integer variables natively, so integer variables are **passed directly as integer columns**.
When the objective is linear and the constraints are written with `qbpp::cons()`,
adding the ILP option, as in `qbpp::ScipSolver solver(f, qbpp::ilp);`,
makes the model solvable by all of the MIP solvers (SCIP, HiGHS, CBC, GLPK).

On the other hand, to pass a model to an external QUBO solver that only accepts binary variables,
the integer variables must be represented by binary variables.
How to do this is explained in [Binary-Encoded Integer Variables](BINARY_INTEGER).

## Choosing between integer variables and one-hot representations

- Integer variables suit variables that represent **quantities**
  such as counts, times, and stock levels.
- For **labels** ("which one to choose": visiting orders, colors, and so on),
  one-hot representations
  ([Permutation Matrix](PERMUTATION), [One-hot Constraints](ONEHOT))
  are more suitable than integer variables.

Regarding the license variable limit, one integer variable
counts as the following number of binary variables, where $r$ denotes
its range (upper bound minus lower bound):

$$
\lceil \log_2 (r+1) \rceil
$$

See [License Management](LICENSE_MANAGEMENT) for details.
