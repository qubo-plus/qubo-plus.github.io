---
last_modified: 2026-10-14
layout: default
nav_exclude: true
title: "Factorization"
nav_order: 7
lang: en
hreflang_alt: "ja/FACTORIZATION"
hreflang_lang: "ja"
---

# Factorization with Integer Variables

## Factorizing the product of two prime numbers
We consider the **factorization of integers** that are products of two prime numbers.
For example, when the product $pq = 35$ is given, the goal is to recover the two prime factors $p=5$ and $q=7$.

Since $\sqrt{35}=5.91$ and $35/2=17.5$, we can restrict the search ranges of $p$ and $q$ as follows:

$$
\begin{aligned}
  2 \leq &p \leq 5 \\
  6 \leq &q \leq 17
\end{aligned}
$$

For such [integer variables](INTEGER) $p$ and $q$, the factorization problem for $35$ can be formulated using the following expression:

$$
\begin{aligned}
f(p,q) &= (pq-35)^2
\end{aligned}
$$

$f(p,q)$ takes the minimum value 0 if and only if $p$ and $q$ are the correct factors of 35.

## QUBO++ program for factorization
The following QUBO++ program constructs the expression $f(p,q)$ and solves the optimization problem using the Easy Solver:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  auto p = 2 <= qbpp::int_var("p") <= 5;
  auto q = 6 <= qbpp::int_var("q") <= 17;
  auto f = qbpp::sqr(p * q - 35);
  f.simplify();
  std::cout << "f = " << f << std::endl;

  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"target_energy", 0}});
  std::cout << "p = " << sol(p) << ", q = " << sol(q) << std::endl;
  std::cout << "f = " << sol.energy() << std::endl;
}
```
{% endraw %}

The output of this program is as follows:

```
f = 1225 -70*p*q +p*p*q*q
p = 5, q = 7
f = 0
```

Expanding $f(p,q)$ gives $p^2q^2 - 70pq + 1225$, which contains the quartic term `p*p*q*q`.
The QUBO++ solvers can solve expressions containing such terms of degree 3 or higher as they are.
The solver correctly finds the prime factors $p=5$ and $q=7$.

If $p$ and $q$ are represented by [binary-encoded integer variables](BINARY_INTEGER),
the same expression becomes a quartic expression of binary variables (a HUBO expression), and the number of terms also increases greatly.

## Unlimited large coefficients for prime factorization of large numbers
By default, the data types of expression coefficients and energy values in QUBO++ are `int32_t` and `int64_t`, respectively.
These types can be switched by defining one of the **`INTEGER_TYPE_*`** macros (`INTEGER_TYPE_C32E32`, `INTEGER_TYPE_C32E64` (default), `INTEGER_TYPE_C64E64`, `INTEGER_TYPE_C64E128`, `INTEGER_TYPE_C128E128`, `INTEGER_TYPE_CPP_INT`) — see [VAREXPR](VAREXPR#integer-ranges-coeff_t-and-energy_t).

Furthermore, QUBO++ supports expressions with arbitrarily large coefficients and energy values via **`INTEGER_TYPE_CPP_INT`**, which sets both `coeff_t` and `energy_t` to **`qbpp::cpp_int`**.
The following QUBO++ program factorizes the product of two large prime numbers:
{% raw %}
```cpp
#define INTEGER_TYPE_CPP_INT

#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  auto p = 2 <= qbpp::int_var("p") <= qbpp::integer("2000000");
  auto q = 2 <= qbpp::int_var("q") <= qbpp::integer("2000000");
  auto f = qbpp::sqr(p * q - qbpp::integer("1000039") * qbpp::integer("1000079"));
  f.simplify();
  std::cout << "f = " << f << std::endl;

  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"target_energy", 0}});
  std::cout << "p = " << sol(p) << ", q = " << sol(q) << std::endl;
  std::cout << "f = " << sol.energy() << std::endl;
}
```
{% endraw %}

Before including `qbpp/qbpp.hpp`, `INTEGER_TYPE_CPP_INT` is defined to set both `coeff_t` and `energy_t` to the arbitrary-precision integer `cpp_int`.
Constant integers are specified using **`qbpp::integer()`** with a decimal string literal as its argument
(the product is written as `qbpp::integer("1000039") * qbpp::integer("1000079")` to avoid intermediate `int * int` overflow).

This program outputs the following result (the values of `p` and `q` may be printed swapped):
```
f = 1000236020086727125492561 -2000236006162*p*q +p*p*q*q
p = 1000079, q = 1000039
f = 0
```
The constant term is a large value that exceeds the range of `int64_t` (about $9.2 \times 10^{18}$),
but the factorization of the large composite number is correctly obtained.

>**TIP**
> For arbitrary precision integers, define **`INTEGER_TYPE_CPP_INT`** before including the header (or pass `-DINTEGER_TYPE_CPP_INT` as a compiler flag). The other supported types are selected via **`INTEGER_TYPE_C32E32`**, **`INTEGER_TYPE_C32E64`** (default), **`INTEGER_TYPE_C64E64`**, **`INTEGER_TYPE_C64E128`**, **`INTEGER_TYPE_C128E128`** — see [VAREXPR](VAREXPR#integer-ranges-coeff_t-and-energy_t) for the full table.

For an example that factors an integer completely into primes, see the case study [Prime Factorization by Recursion](PRIME_FACTORIZATION).
