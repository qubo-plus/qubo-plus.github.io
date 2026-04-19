---
layout: default
nav_exclude: true
title: "Factorization"
nav_order: 8
lang: en
hreflang_alt: "ja/python/FACTORIZATION"
hreflang_lang: "ja"
---

# Factorization Through HUBO Expression

## HUBO for factorizing the product of two prime numbers
We consider the **factorization of integers** that are products of two prime numbers.
For example, when the product $pq = 35$ is given, the goal is to recover the two prime factors $p=5$ and $q=7$.

Since $\sqrt{35}=5.91$ and $35/2=17.5$, we can restrict the search ranges of $p$ and $q$ as follows:

$$
\begin{aligned}
  2 \leq &p \leq 5 \\
  6 \leq &q \leq 17
\end{aligned}
$$

For such integer variables, the factorization problem for $35$ can be formulated using the penalty expression:

$$
\begin{aligned}
f(p,q) &= (pq-35)^2
\end{aligned}
$$

Because the integer variables $p$ and $q$ are implemented as linear expressions of binary variables, their product
$pq$ becomes a quadratic expression, and therefore
$f(p,q)$ becomes quartic.
Clearly, $f(p,q)$ attains the minimum value 0 exactly when $p$ and $q$ are the correct factors of 35.

## PyQBPP program for factorization
The following program constructs the HUBO expression $f(p,q)$, and solves the optimization problem using the Easy Solver:
```python
import pyqbpp as qbpp

p = qbpp.var("p", between=(2, 5))
q = qbpp.var("q", between=(6, 17))

f = qbpp.constrain(p * q, equal=35)
f.simplify_as_binary()
print("f =", f)
print("f.body =", f.body)

solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=0)

print("sol =", sol)
print("p =", sol(p))
print("q =", sol(q))
print("f(sol) =", f(sol))
print("f.body(sol) =", f.body(sol))
```

In this program, `qbpp.var("p", between=(2, 5))` creates an integer variable $p$ whose value ranges over $\{2, 3, 4, 5\}$, internally represented as a linear combination of binary variables `p[0]`, `p[1]`. Similarly, `q` ranging over $\{6, 7, \dots, 17\}$ is expanded into binary variables `q[0]`, `q[1]`, `q[2]`, `q[3]`. The expression `qbpp.constrain(p * q, equal=35)` is automatically converted into `sqr(p * q - 35)`, which achieves an energy value of 0 when the equality is satisfied. `f` is a constraint expression that holds both the expanded penalty `sqr(p * q - 35)` and the original expression `p * q`. `f` itself represents the expression `sqr(p * q - 35)`, while `f.body` returns the original expression `p * q`. `f.simplify_as_binary()` simplifies both `f` itself (the penalty) and `f.body` (the original expression) at the same time. Because the integer variables are linear in the underlying binary variables, their product $pq$ is quadratic and the squared penalty $f(p,q)$ is quartic.

The output of this program is as follows:
```
f = 529 -240*p[0] -408*p[1] -88*q[0] -168*q[1] -304*q[2] -304*q[3] +144*p[0]*p[1] -5*p[0]*q[0] +40*p[0]*q[2] +40*p[0]*q[3] +16*p[1]*q[0] +56*p[1]*q[1] +208*p[1]*q[2] +208*p[1]*q[3] +16*q[0]*q[1] +32*q[0]*q[2] +32*q[0]*q[3] +64*q[1]*q[2] +64*q[1]*q[3] +128*q[2]*q[3] +52*p[0]*p[1]*q[0] +112*p[0]*p[1]*q[1] +256*p[0]*p[1]*q[2] +256*p[0]*p[1]*q[3] +20*p[0]*q[0]*q[1] +40*p[0]*q[0]*q[2] +40*p[0]*q[0]*q[3] +80*p[0]*q[1]*q[2] +80*p[0]*q[1]*q[3] +160*p[0]*q[2]*q[3] +48*p[1]*q[0]*q[1] +96*p[1]*q[0]*q[2] +96*p[1]*q[0]*q[3] +192*p[1]*q[1]*q[2] +192*p[1]*q[1]*q[3] +384*p[1]*q[2]*q[3] +16*p[0]*p[1]*q[0]*q[1] +32*p[0]*p[1]*q[0]*q[2] +32*p[0]*p[1]*q[0]*q[3] +64*p[0]*p[1]*q[1]*q[2] +64*p[0]*p[1]*q[1]*q[3] +128*p[0]*p[1]*q[2]*q[3]
f.body = 12 +6*p[0] +12*p[1] +2*q[0] +4*q[1] +8*q[2] +8*q[3] +p[0]*q[0] +2*p[0]*q[1] +4*p[0]*q[2] +4*p[0]*q[3] +2*p[1]*q[0] +4*p[1]*q[1] +8*p[1]*q[2] +8*p[1]*q[3]
sol = Sol(energy=0, {p[0]: 1, p[1]: 1, q[0]: 1, q[1]: 0, q[2]: 0, q[3]: 0})
p = 5
q = 7
f(sol) = 0
f.body(sol) = 35
```
From the output, we can observe that the expression `f` contains quartic terms, confirming that it is a HUBO expression.
The solver correctly finds the prime factors $p=5$ and $q=7$.

## Unlimited large coefficients for prime factorization of large numbers
By default, the PyQBPP module `pyqbpp` (alias of `pyqbpp.c32e64`) uses 32-bit coefficients and 64-bit energy values, which runs fastest.
For factorizing large composite numbers whose penalty coefficients may exceed 32 bits, we switch to arbitrary precision integer arithmetic by importing `pyqbpp.cppint`. This corresponds to defining `INTEGER_TYPE_CPP_INT` in the C++ version, which sets both `coeff_t` and `energy_t` to `cpp_int`.
In PyQBPP, the type selection that corresponds to the C++ `INTEGER_TYPE_*` macros is made by importing the appropriate submodule (`pyqbpp.c32e64`, `pyqbpp.cppint`, etc.). All subsequent `qbpp.var`, `qbpp.constrain`, `qbpp.EasySolver` calls then use the chosen coefficient/energy types consistently.

The following program factorizes the product of two large prime numbers:
```python
import pyqbpp.cppint as qbpp

p = qbpp.var("p", between=(2, 2000000))
q = qbpp.var("q", between=(2, 2000000))

f = qbpp.constrain(p * q, equal=1000039 * 1000079)
f.simplify_as_binary()
print("f =", f)

solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=0)

print("sol =", sol)
print("p =", sol(p))
print("q =", sol(q))
```

Since Python natively supports arbitrary-precision integers, the target value `1000039 * 1000079` is written directly as a Python `int` — no special constructor (the C++ equivalent `qbpp::integer("1000039") * qbpp::integer("1000079")`, which uses decimal string literals to avoid intermediate `int * int` overflow) is needed. Once `pyqbpp.cppint` is imported, PyQBPP stores and manipulates all coefficients and energy values as Python `int`, so the upper bound `2000000` and the target product can be written naturally as Python integers.

This program outputs the following result:
```
f = 1000236020078726181467929 -4000472012304*p[0] -8000944024600*p[1] -16001888049168*p[2] -32003776098208*p[3] -64007552195904*p[4] -128015104389760*p[5] -256030208771328*p[6] -512060417509888*p[7] -1024120834888704*p[8] -2048241669253120*p[9] -4096483336409088*p[10] -8192966664429568*p[11] -16385933295304704*p[12] -32771866456391680*p[13] -65543732375912448*p[14] -131087462604341248*p[15] -262174916618747904*p[16] -524349798877757440*p[17] -1048699460316561408*p[18] -2097398370877308928*p[19] -3806137462543214568*p[20] -4000472012304*q[0] -8000944024600*q[1] ...

[omitted]

... +995284220088838892027904*p[19]*p[20]*q[19]*q[20]
sol = Sol(energy=0, {p[0]: 0, p[1]: 1, p[2]: 1, p[3]: 1, p[4]: 0, ..., q[19]: 0, q[20]: 1})
p = 1000079
q = 1000039
```
We can see that the expression `f` contains very large coefficients (well beyond the 64-bit range), and the factorization of the large composite number is correctly obtained as $1000079 \times 1000039$. Each of the integer variables $p$ and $q$ is expanded into 21 binary variables (`p[0]`-`p[20]`, `q[0]`-`q[20]`) to cover the range $[2, 2000000]$.

> **TIP**
> For arbitrary precision integers, use `import pyqbpp.cppint as qbpp` (equivalent to defining `INTEGER_TYPE_CPP_INT` in C++). For other integer type variants, import the corresponding submodule such as `pyqbpp.c64e64` or `pyqbpp.c128e128` (equivalent to the C++ `INTEGER_TYPE_C64E64` / `INTEGER_TYPE_C128E128` macros).
