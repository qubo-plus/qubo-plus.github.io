---
last_modified: 2026-10-14
layout: default
nav_exclude: true
title: "Square Root"
nav_order: 42
lang: en
hreflang_alt: "ja/python/SQRT"
hreflang_lang: "ja"
---

# Square Root

This example demonstrates how to compute the square root of
$c=2$ using large integers.
Let $s = 10 ^{20}$ be a fixed integer.
Since PyQBPP cannot handle real numbers directly, we compute  $\sqrt{cs^2}$ instead of $\sqrt{c}$.
From the following relation,

$$
\begin{aligned}
\sqrt{c} &= \sqrt{cs^2}/s
\end{aligned}
$$

we can obtain an approximation of $\sqrt{c}$ with 20 decimal-digit precision.

## Formulation of the square root computation
We define a [native integer variable](INTEGER) $x$ that takes values in the range $[s, 2s]$.
We then formulate the problem using the following equation:

$$
\begin{aligned}
x ^ 2 &= cs ^ 2
\end{aligned}
$$

Declaring this equality as a constraint with [`qbpp.cons()`](CONSTRAINTS) makes the energy the square of the violation, that is:

$$
(x ^ 2 -cs^2)^2
$$

By finding the value of $x$ that minimizes this expression,
we obtain an approximation of the square root of $c$ with
20 decimal-digit precision.
Since $x$ is not expanded into binary variables, the constraint stays a quadratic expression in $x$.

## PyQBPP program
The following PyQBPP program constructs an expression based on the above idea and solves it using the Easy Solver:
```python
import pyqbpp.cppint as qbpp

c = 2
s = 10**20
x = qbpp.var("x", integer=(s, c * s))
f = qbpp.cons(x * x == c * s * s)
f.simplify()
solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=10.0)
xv = sol(x)
print(f"sqrt({c}) ≈ {xv} / {s}")
print(f"       = {xv // s}.{xv % s}")
print(f"Energy = {sol.energy}")
```

Because the values of the expression reach about $10^{40}$ and exceed 64 bits, we import the arbitrary-precision `cpp_int` variant (`pyqbpp.cppint`).
The constant `s`, the native integer variable `x`, and the expression `f` are defined according to the formulation described above.
The Easy Solver is executed with a time limit of 10 seconds, passed as a parameter to `search()`.

The integer solution `xv` is split into its quotient `xv // s` and remainder `xv % s`, which are joined by a decimal point to obtain the decimal representation. No `float` conversion is performed, so full precision is preserved using Python's arbitrary-precision integers. Note, however, that leading zeros of the remainder are lost when it has fewer than 20 digits (for example, for $c=26$, $\sqrt{26}=5.0990\ldots$ would be printed as `5.990...`). In general, the remainder must be zero-padded to 20 digits, as in `{xv % s:020d}`. In this example with $c=2$, the remainder has exactly 20 digits, so this is not a problem.

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
