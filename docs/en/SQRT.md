---
layout: default
nav_exclude: true
title: "Square Root"
nav_order: 3
lang: en
hreflang_alt: "ja/SQRT"
hreflang_lang: "ja"
---

# Square Root

This example demonstrates how to compute the square root of
$c=2$ using large integers represented by `qbpp::cpp_int`.
Let $s = 10 ^{20}$ be a fixed integer.
Since QUBO++ cannot handle real numbers directly, we compute  $\sqrt{cs^2}$ instead of $\sqrt{c}$.
From the following relation,

$$
\begin{aligned}
\sqrt{c} &= \sqrt{cs^2}/s
\end{aligned}
$$

we can obtain an approximation of $\sqrt{c}$ with 20 decimal-digit precision.

## HUBO formulation of the square root computation
We define an integer variable $x$ that takes values in the range $[s, 2s]$.
We then formulate the problem using the following equation:

$$
\begin{aligned}
x ^ 2 &= cs ^ 2
\end{aligned}
$$

In QUBO++, this equality constraint is converted into the following HUBO expression:

$$
(x ^ 2 -cs^2)^2
$$

By finding the value of $x$ that minimizes this expression,
we obtain an approximation of the square root of $c$ with
20 decimal-digit precision.
Since $x$ is internally represented as a linear expression of binary variables, this objective function becomes quartic in those binary variables.

## QUBO++ parogram
The following QUBO++ program constructs a HUBO expression based on the above idea and solves it using the Easy Solver:
{% raw %}
```cpp
#define INTEGER_TYPE_CPP_INT

#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  const int c = 2;
  auto s = qbpp::integer("100000000000000000000");
  auto x = s <= qbpp::var_int("x") <= c * s;
  auto f = x * x == c * s * s;
  f.simplify_as_binary();
  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"time_limit", 10.0}});
  auto xv = sol(x);
  std::cout << "sqrt(" << c << ") ≈ " << xv << " / " << s << std::endl;
  std::cout << "       = " << (xv / s) << "." << (xv % s) << std::endl;
  std::cout << "Energy = " << sol.energy() << std::endl;
}
```
{% endraw %}

Since very large coefficients are used, we define `INTEGER_TYPE_CPP_INT` before including the header,
which sets both `coeff_t` and `energy_t` to `cpp_int` (arbitrarily large integers).
The constant `s`, the integer variable `x`, and the HUBO expression `f` are defined according to the formulation described above.
The Easy Solver is executed with a time limit of 10 seconds.

The integer solution `xv` is split into its quotient `xv / s` and remainder `xv % s`, which are joined by a decimal point to obtain the decimal representation. Only `cpp_int` integer arithmetic is used, so no precision is lost by converting to `double`.

This program produces the following output:
```
sqrt(2) ≈ 141421356237309504880 / 100000000000000000000
       = 1.41421356237309504880
Energy = 2281431565136320033809509291861647360000
```
We can confirm that the Easy Solver outputs the correct approximation:

$$
 \sqrt{2}\approx 1.41421356237309504880
$$

Note that the reported energy value is not zero, and the equality constraint is not satisfied exactly.
This is simply because there is no exact integer solution to the equality.
Instead, the solver finds a solution that minimizes the error of the equality constraint.
The energy value shown in the output corresponds to the square of this error.
Since the error is minimized, the resulting value of $x$ represents an approximation of the square root.
