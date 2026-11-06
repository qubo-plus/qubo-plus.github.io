---
last_modified: 2026-10-14
layout: default
nav_exclude: true
title: "Fractions Close to Pi"
nav_order: 68
lang: en
hreflang_alt: "ja/PI_FRACTION"
hreflang_lang: "ja"
---

# Fractions Close to Pi

Well-known fractions close to $\pi = 3.14159265\ldots$ are $22/7$ and $355/113$.
On this page, we use EasySolver to find the fraction closest to $\pi$ whose numerator and denominator are both 5-digit integers.

## Problem

Find integers $p$ and $q$ with $10000 \le p, q \le 99999$ that minimize

$$
\left\lvert \frac{p}{q} - \pi \right\rvert
$$

An expression with a division cannot be written as a polynomial, so we minimize the following value instead:

$$
\lvert p - \pi q \rvert = q \left\lvert \frac{p}{q} - \pi \right\rvert
$$

Because of the factor $q$, the two values are not always minimized by the same fraction.
For this problem, they are (you can confirm this by checking every $q$ one by one).

In addition, coefficients in QUBO++ are integers, so we replace $\pi$ with $31415926535898 / 10^{13}$ ($\pi$ rounded to 13 decimal places), multiply by $10^{13}$, and minimize

$$
\left\lvert 10^{13} p - 31415926535898\, q \right\rvert
$$

## Program

{% raw %}
```cpp
#define INTEGER_TYPE_C64E64
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  auto p = 10000 <= qbpp::int_var("p") <= 99999;
  auto q = 10000 <= qbpp::int_var("q") <= 99999;
  // π ≈ 31415926535898 / 10^13
  auto f = qbpp::abs(10000000000000 * p - 31415926535898 * q);
  f.simplify();
  std::cout << "f = " << f << std::endl;

  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"time_limit", 1.0}});
  std::cout << "p/q = " << sol(p) << "/" << sol(q) << ", energy = " << sol.energy()
            << std::endl;
}
```
{% endraw %}

We define $p$ and $q$ as integers from 10000 to 99999 with the [native integer variable](INTEGER) `int_var`,
and build the objective `f` with the [absolute value](CONSTRAINTS#absolute-value-abs) `qbpp::abs()`.

This program produces the following output:
```
f = abs(10000000000000*p -31415926535898*q, 1)
p/q = 99733/31746, energy = 3808617908
```

- The fraction found is $99733/31746 = 3.1415926415\ldots$, which differs from $\pi$ by $1.2 \times 10^{-8}$. This is more than 20 times closer than $355/113$ ($31595/10057$ in 5 digits), which differs by $2.7 \times 10^{-7}$.
- The energy is the value of $\lvert 10^{13} p - 31415926535898\, q \rvert$. Dividing it by $10^{13}$ gives $\lvert p - \pi q \rvert \approx 3.8 \times 10^{-4}$, and dividing that by $q$ gives the difference from $\pi$.
- The rounding error of $\pi$ is less than $10^{-13}$, so even multiplied by $q$ it is less than $10^{-8}$. The closest fraction and the second closest ($99378/31633$) differ in $\lvert p - \pi q \rvert$ by $3 \times 10^{-5}$, so the rounding does not change the answer.
- The coefficient $31415926535898$ and the value of the expression (up to about $10^{18}$) do not fit in 32-bit integers, so `INTEGER_TYPE_C64E64` at the top makes coefficients and energies 64-bit integers (see [Integer Ranges: coeff_t and energy_t](VAREXPR#integer-ranges-coeff_t-and-energy_t)).
- Once $q$ is fixed, the best $p$ is the integer closest to $\pi q$. Also, since $p \le 99999$, $q$ is at most 31830. EasySolver finds the answer in well under a second.
