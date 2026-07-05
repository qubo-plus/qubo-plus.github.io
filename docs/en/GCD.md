---
layout: default
nav_exclude: true
title: "Greatest Common Divisor"
nav_order: 4
lang: en
hreflang_alt: "ja/GCD"
hreflang_lang: "ja"
---

# Greatest Common Divisor (GCD)
Let $P$ and $Q$ be two positive integers.
The computation of the **greatest common divisor (GCD)** can be formulated as a HUBO problem.

Let $p$, $q$, and $r$ be positive integers satisfying the following constraints:

$$
\begin{aligned}
  p\cdot r &= P \\
  q\cdot r &=Q
\end{aligned}
$$

Clearly, $r$ is a common divisor of $P$ and $Q$.
Therefore, the maximum value of $r$ satisfying these constraints is the GCD of $P$ and $Q$.
To find such an $r$, we use $-r$ as the objective function in the HUBO formulation.

## QUBO++ program
Based on the idea above, the following QUBO++ program computes the GCD of two integers,
`P = 858` and `Q = 693`:
{% raw %}
```cpp
#define INTEGER_TYPE_C64E64
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  const int P = 858;
  const int Q = 693;
  auto p = 1 <= qbpp::var_int("p") <= 1000;
  auto q = 1 <= qbpp::var_int("q") <= 1000;
  auto r = 1 <= qbpp::var_int("r") <= 1000;

  auto constraint = (p * r == P) + (q * r == Q);
  auto f = -r + constraint * 1000;

  f.simplify_as_binary();

  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"time_limit", 1.0}});

  std::cout << "GCD = " << sol(r) << std::endl;
  std::cout << sol(p) << " * " << sol(r) << " = " << P << std::endl;
  std::cout << sol(q) << " * " << sol(r) << " = " << Q << std::endl;
}
```
{% endraw %}
In this program, `p`, `q`, and `r` are defined as integer variables in the range $[1,1000]$.
The squared penalty terms expand to coefficients on the order of $10^{13}$, which exceed the default 32-bit `coeff_t`, so `INTEGER_TYPE_C64E64` is defined before including the header to use 64-bit coefficients and energies (see [FACTORIZATION](FACTORIZATION) for the full list of integer-type macros).
The expression constraint is constructed so that it evaluates to zero when both constraints are satisfied.

The objective function `-r` is combined with the constraint term multiplied by a penalty factor of `1000`, and the resulting expression is stored in `f`.

The EasySolver searches for a solution that minimizes `f`.
The resulting values of `p`, `q`, and `r` are printed as follows:
```
GCD = 33
26 * 33 = 858
21 * 33 = 693
```
This output confirms that the GCD of 858 and 693 is correctly obtained as 33.
