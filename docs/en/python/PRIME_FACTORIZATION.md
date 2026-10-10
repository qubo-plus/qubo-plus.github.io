---
last_modified: 2026-10-09
layout: default
nav_exclude: true
title: "Prime Factorization by Recursion"
nav_order: 101
lang: en
hreflang_alt: "ja/python/PRIME_FACTORIZATION"
hreflang_lang: "ja"
---

# Prime Factorization by Recursion

[Factorization Through HUBO Expression](FACTORIZATION) splits a product of two primes into its two factors.
This page repeats that step to break an integer down into its prime factors.
Each step uses native integer variables (`integer=`) and `qbpp.cons()` to find $x$ and $y$ with $xy = n$ by the Easy Solver.
Once $n$ is split, $x$ and $y$ are split in the same way.

## One split

A composite number $n$ can be written as a product $n = xy$ of two integers with $2 \le x \le y$.
If $x \le y$, then $x^2 \le xy = n \le y^2$, so $x \le \sqrt{n} \le y$.
Since $x \ge 2$, also $y \le n/2$.
So we look for $x$ and $y$ in the ranges

$$
2 \le x \le \lfloor\sqrt{n}\rfloor, \qquad \lfloor\sqrt{n}\rfloor \le y \le \lfloor n/2 \rfloor
$$

that satisfy the constraint

$$
xy = n.
$$

The condition $x \le y$ removes the solutions that only swap $x$ and $y$.

## Primality test

If $n$ is prime, no $x$ and $y$ satisfy this constraint.
A solver, however, cannot show that no solution exists.
It cannot tell whether it finds nothing because $n$ is prime or because it has not searched enough, so it keeps searching until the time limit.
We therefore test primality without PyQBPP, using `isprime` from sympy, and give only composite numbers to the solver.
sympy can be installed with `pip install sympy`.

## Program

```python
import math
from sympy import isprime
import pyqbpp.c64e128 as qbpp


def split(n):
    r = math.isqrt(n)
    x = qbpp.var("x", integer=(2, r))
    y = qbpp.var("y", integer=(r, n // 2))
    f = qbpp.cons(x * y == n)
    f.simplify_as_binary()
    sol = qbpp.EasySolver(f).search(time_limit=10, target_energy=0)
    return sol(x), sol(y)


def factorize(n):
    if isprime(n):
        return [n]
    if n == 4:  # x and y would both be the constant 2
        return [2, 2]
    x, y = split(n)
    if x * y != n:
        raise RuntimeError(f"no factor of {n} found within the time limit")
    print(f"{n} = {x} * {y}")
    return factorize(x) + factorize(y)


for n in [4294967297, 999999999999]:
    factors = sorted(factorize(n))
    print(n, "=", " * ".join(str(p) for p in factors))
```

- `split(n)` creates native integer variables `x` and `y` with the ranges above and solves `qbpp.cons(x * y == n)` with the Easy Solver.
  Since `target_energy` is 0, the search stops as soon as a solution satisfying the constraint is found.
- `factorize(n)` returns `[n]` if `n` is prime; otherwise it splits `n` into two with `split(n)` and factorizes both recursively.
  If no split is found within 10 seconds, it raises an exception and stops.
- When `n` is 4, the ranges of `x` and `y` both contain only 2 and no variable is left in the expression, so this case is handled before calling the solver.
- `pyqbpp.c64e128` is the module with 64-bit integer coefficients and 128-bit integer energies (the reason is explained below).

For example, this program prints:

```
4294967297 = 641 * 6700417
4294967297 = 641 * 6700417
999999999999 = 3 * 333333333333
333333333333 = 3 * 111111111111
111111111111 = 3 * 37037037037
37037037037 = 7 * 5291005291
5291005291 = 11 * 481000481
481000481 = 13 * 37000037
37000037 = 37 * 1000001
1000001 = 101 * 9901
999999999999 = 3 * 3 * 3 * 7 * 11 * 13 * 37 * 101 * 9901
```

$4294967297 = 2^{32}+1$ is a number that Fermat conjectured to be prime; Euler showed in 1732 that it is divisible by $641$.
Because the Easy Solver uses random numbers, which pair of divisors it finds changes from run to run, and so can the intermediate splits.
The final list of prime factors does not change.

## Coefficient and energy types

$n$ fits in a 64-bit integer, but much larger values appear during the search.
When $x$ and $y$ are at the upper ends of their ranges, $xy$ is about $n^{1.5}/2$, and the value of the constraint (the squared violation) $(xy-n)^2$ is about $n^3/4$.
For $n < 10^{12}$ this value is at most about $2.5\times10^{35}$, which fits in a 128-bit integer (up to about $1.7\times10^{38}$).
We therefore use `pyqbpp.c64e128`, with 64-bit coefficients and 128-bit energies.
The default `pyqbpp` (32-bit coefficients and 64-bit energies) is not enough.
Since an overflow gives no warning, choose the types by the largest value that can appear during the search.
When $n$ exceeds about $9\times10^{12}$, even 128 bits are not enough, and `pyqbpp.cppint`, whose number of digits is unlimited, is needed (see [Data Types](VAREXPR)).

## Numbers that take long

Whether this method splits a number quickly depends on where the smaller factor $x$ lies.

- When the factor is small (close to 2), or the two factors are close ($x$ is close to $\sqrt{n}$), the answer is at an end of the range and is found quickly.
  For 30 random 12-digit composite numbers, the first split was always found within 0.15 seconds.
- When the smaller factor lies in the middle of the range, it takes long.
  For 30 numbers of 12 digits that are products of a 4- to 6-digit prime and another prime, 20 were split within a 20-second limit (median 6.6 seconds) and 10 were not.
  For example, $508069567969 = 7793 \times 65195633$ was not split within 20 seconds (measured on a 20-core CPU).

$(xy-n)^2$ does not necessarily decrease as $x$ approaches a factor, so it gives no hint where a factor is.
The solver therefore searches for $x$ almost blindly.
This is an inherent limit of factoring with QUBO, and the method on this page is not a practical way to factor integers (trial division or the elliptic curve method, for example, are far faster).
