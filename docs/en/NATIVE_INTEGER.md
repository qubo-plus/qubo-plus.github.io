---
last_modified: 2026-09-22
layout: default
nav_exclude: true
title: "Native Integer Variables"
nav_order: 52
lang: en
hreflang_alt: "ja/NATIVE_INTEGER"
hreflang_lang: "ja"
---

# Native Integer Variables

[Integer Variables](INTEGER) explained how integers are represented by
combining multiple binary variables. In addition, QUBO++ supports
**native integer variables** that keep their integer values as is.
A variable declared with `qbpp::int_var()` is not expanded into binary
variables; the solvers bundled with QUBO++
([EasySolver](EASYSOLVER), [ABS3 Solver](ABS3), and
[Exhaustive Solver](EXHAUSTIVE)) handle the integer values directly and
search efficiently.

## Declaration and basic usage

A native integer variable is declared exactly like an
[integer variable](INTEGER) (`var_int`): a name combined with the range
operators specifying the lower and upper bounds. The range is mandatory.
The declared variable can be used in expressions just like ordinary
variables:

{% raw %}
```cpp
#include <qbpp/exhaustive_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto x = 0 <= qbpp::int_var("x") <= 10;
  auto f = x * x - 4 * x;
  f.simplify_as_binary();
  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search();
  std::cout << "x = " << sol(x) << std::endl;
  std::cout << "f = " << sol.energy() << std::endl;
}
```
{% endraw %}

The output of the program is as follows:

```
x = 2
f = -4
```

Note that powers such as `x * x` are kept as integer squares — the
binary-variable rule ($x \cdot x = x$) is never applied.

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

Substitution is a purely symbolic rewrite: the range of `x` is not carried over to the result.
No constraint forcing `y + 1` into the range of `x` is added, and substituting an out-of-range
constant does not throw. Add any required constraint explicitly with [`qbpp::cons()`](CONSTRAINTS).
Whether the resulting expression is an integer model or a binary model is decided by the variables
in the substituted expression (with `y + 1`, the range and integrality of `y` remain in force).
The declaration of `x` itself is untouched and `x` can still be used in other expressions.
Evaluating with an out-of-range value throws `std::invalid_argument`.

## Solving simultaneous equations

The following program solves the simultaneous equations $x + 2y = 700$
and $x - y = 100$ by minimizing the squared error:

{% raw %}
```cpp
#include <qbpp/easy_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto x = 0 <= qbpp::int_var("x") <= 1000;
  auto y = -1000 <= qbpp::int_var("y") <= 1000;
  auto f = qbpp::sqr(x + 2 * y - 700) + qbpp::sqr(x - y - 100);
  f.simplify_as_binary();
  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"time_limit", 1.0}});
  std::cout << "x = " << sol(x) << ", y = " << sol(y) << std::endl;
  std::cout << "f = " << sol.energy() << std::endl;
}
```
{% endraw %}

The output of the program is as follows:

```
x = 300, y = 200
f = 0
```

## Arrays of integer variables

Passing dimensions to `int_var()` creates an array of native integer
variables. Elements are accessed with `s[i]`, and `qbpp::sum()` builds
the sum of all elements:

{% raw %}
```cpp
#include <qbpp/exhaustive_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto s = 0 <= qbpp::int_var("s", 3) <= 9;
  auto t = qbpp::sum(s);
  auto f = qbpp::sqr(t - 6) + qbpp::sqr(s[0] - s[1] + 1) +
           qbpp::sqr(s[1] - s[2] + 1);
  f.simplify_as_binary();
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

## Arrays with per-element ranges

The array declaration shares a single range across all elements. Passing
arrays as the lower/upper bounds creates an array of native integer
variables with individual per-element ranges. An element whose lower and
upper bounds are equal becomes the constant fixed to that value:

{% raw %}
```cpp
#include <qbpp/exhaustive_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  const auto lower = qbpp::array({1, 0, 2});
  const auto upper = qbpp::array({4, 3, 2});
  auto v = lower <= qbpp::int_var("v", 3) <= upper;
  auto f = qbpp::sqr(qbpp::sum(v) - 6) + v[0];
  f.simplify_as_binary();
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

One side can also stay a scalar (e.g.
`0 <= qbpp::int_var("w", 3) <= upper` shares the lower bound 0 across all
elements).

The same placeholder idiom as `var_int` in
[Cutting Stock](BAR_CUTTING) is also available: `qbpp::int_var("x", 3) == 0`
creates a mutable array whose elements are all the constant 0, and a native
integer variable can be assigned to each element individually:

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
  f.simplify_as_binary();
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

Elements that are never re-assigned remain the constant (0 here) in the
expression. Any constant value can be used in place of 0.

## Using constraints

`qbpp::cons()` of [Native Constraints](CONSTRAINTS) works with
expressions containing native integer variables as is:

{% raw %}
```cpp
#include <qbpp/exhaustive_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto x = 0 <= qbpp::int_var("x") <= 5;
  auto y = 0 <= qbpp::int_var("y") <= 5;
  auto f = -(2 * x + 3 * y) + 50 * qbpp::cons(x + y == 8);
  f.simplify_as_binary();
  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search();
  std::cout << "x = " << sol(x) << ", y = " << sol(y) << std::endl;
}
```
{% endraw %}

The output of the program is as follows:

```
x = 3, y = 5
```

## Working with external solvers

MIP solvers handle integer variables
natively, so native integer variables are passed **directly as integer
columns** (they are never expanded into binary variables).
When the objective is linear and the constraints are written
with `qbpp::cons()`, adding the ILP option — e.g.
`qbpp::ScipSolver solver(f, qbpp::ilp);` — makes the model solvable by
all five MIP solvers.

For external QUBO solvers that only accept binary variables, convert
the model to the [conventional binary encoding](INTEGER) with
`qbpp::binarize()`:

{% raw %}
```cpp
#include <qbpp/exhaustive_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto x = 0 <= qbpp::int_var("x") <= 10;
  auto f = x * x - 4 * x;
  auto g = qbpp::binarize(f);
  g.simplify_as_binary();
  auto solver = qbpp::ExhaustiveSolver(g);
  auto sol = solver.search();
  std::cout << "minimum = " << sol.energy() << std::endl;
}
```
{% endraw %}

The output of the program is as follows:

```
minimum = -4
```

## Which representation to choose

- Native integer variables suit variables that represent **quantities**
  such as counts, times, and stock levels.
- For models handed to external binary-only solvers, use
  [binary-encoded integer variables](INTEGER) (`var_int`) or convert
  with `qbpp::binarize()`.
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

See [License Management](LICENSE_MANAGEMENT) for details.
