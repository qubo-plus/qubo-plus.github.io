---
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

## HUBO formulation of the square root computation
We define an integer variable $x$ that takes values in the range $[s, 2s]$.
We then formulate the problem using the following equation:

$$
\begin{aligned}
x ^ 2 &= cs ^ 2
\end{aligned}
$$

In PyQBPP, this equality constraint is converted into the following HUBO expression:

$$
(x ^ 2 -cs^2)^2
$$

By finding the value of $x$ that minimizes this expression,
we obtain an approximation of the square root of $c$ with
20 decimal-digit precision.
Since $x$ is internally represented as a linear expression of binary variables, this objective function becomes quartic in those binary variables.

## PyQBPP program
The following PyQBPP program constructs a HUBO expression based on the above idea and solves it using the Easy Solver:
```python
import pyqbpp.cppint as qbpp

c = 2
s = 10**20
x = qbpp.var("x", between=(s, c * s))
f = qbpp.constrain(x * x, equal=c * s * s)
f.simplify_as_binary()
solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=10.0)
xv = sol(x)
print(f"sqrt({c}) ≈ {xv} / {s}")
print(f"       = {xv // s}.{xv % s}")
print(f"Energy = {sol.energy}")
```

Because the coefficients and energy values of the HUBO expression exceed 64 bits, we import the arbitrary-precision `cpp_int` variant (`pyqbpp.cppint`).
The constant `s`, the integer variable `x`, and the HUBO expression `f` are defined according to the formulation described above.
The Easy Solver is executed with a time limit of 10 seconds, passed as a parameter to `search()`.

The integer solution `xv` is split into its quotient `xv // s` and remainder `xv % s`, which are joined by a decimal point to obtain the decimal representation. No `float` conversion is performed, so full precision is preserved using Python's arbitrary-precision integers.

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
