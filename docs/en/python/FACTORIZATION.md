---
last_modified: 2026-10-14
layout: default
nav_exclude: true
title: "Factorization"
nav_order: 8
lang: en
hreflang_alt: "ja/python/FACTORIZATION"
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

$f(p,q)$ attains the minimum value 0 if and only if $p$ and $q$ are the correct factors of 35.

## PyQBPP program for factorization
The following program constructs the expression $f(p,q)$ and solves the optimization problem using the Easy Solver:
```python
import pyqbpp as qbpp

p = qbpp.var("p", integer=(2, 5))
q = qbpp.var("q", integer=(6, 17))
f = qbpp.sqr(p * q - 35)
f.simplify()
print("f =", f)

solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=0)
print(f"p = {sol(p)}, q = {sol(q)}")
print("f =", sol.energy)
```

The output of this program is as follows:
```
f = 1225 -70*p*q +p*p*q*q
p = 5, q = 7
f = 0
```

Expanding $f(p,q)$ gives $p^2q^2 - 70pq + 1225$, which contains the quartic term `p*p*q*q`.
The QUBO++ solvers can solve such expressions containing terms of degree 3 or higher as they are.
The solver correctly finds the prime factors $p=5$ and $q=7$.

If $p$ and $q$ are represented by [binary-encoded integer variables](BINARY_INTEGER),
the same expression becomes a quartic expression of binary variables (a HUBO expression), and the number of terms also increases greatly.

## Unlimited large coefficients for prime factorization of large numbers
By default, the PyQBPP module `pyqbpp` (alias of `pyqbpp.c32e64`) uses 32-bit coefficients and 64-bit energy values, which runs fastest.
For factorizing large composite numbers, the coefficients of the expression may exceed 64 bits, so we switch to arbitrary precision integer arithmetic (both `coeff_t` and `energy_t` set to `cpp_int`) by importing `pyqbpp.cppint`.
In PyQBPP, the coefficient/energy type selection is made by the name of the imported submodule (`pyqbpp.c32e64`, `pyqbpp.cppint`, etc.). All subsequent calls such as `qbpp.var` and `qbpp.EasySolver` then use the chosen coefficient/energy types consistently.

The following program factorizes the product of two large prime numbers:
```python
import pyqbpp.cppint as qbpp

p = qbpp.var("p", integer=(2, 2000000))
q = qbpp.var("q", integer=(2, 2000000))
f = qbpp.sqr(p * q - 1000039 * 1000079)
f.simplify()
print("f =", f)

solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=0)
print(f"p = {sol(p)}, q = {sol(q)}")
print("f =", sol.energy)
```

Since Python natively supports arbitrary-precision integers, the target value `1000039 * 1000079` is written directly as a Python `int`. Once `pyqbpp.cppint` is imported, PyQBPP stores and manipulates all coefficients and energy values as Python `int`.

This program outputs the following result (the values of `p` and `q` may be printed swapped):
```
f = 1000236020086727125492561 -2000236006162*p*q +p*p*q*q
p = 1000079, q = 1000039
f = 0
```
The constant term is a large value beyond the 64-bit range (about $9.2 \times 10^{18}$),
but we can see that the factorization of the large composite number is correctly obtained.

> **TIP**
> For arbitrary precision integers, use `import pyqbpp.cppint as qbpp`. For other integer type variants, import the corresponding submodule such as `pyqbpp.c64e64` or `pyqbpp.c128e128`.

For an example that factors an integer completely into primes (down to all of its prime factors), see the case study [Prime Factorization by Recursion](PRIME_FACTORIZATION).
