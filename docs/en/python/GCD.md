---
last_modified: 2026-10-10
layout: default
nav_exclude: true
title: "Greatest Common Divisor"
nav_order: 43
lang: en
hreflang_alt: "ja/python/GCD"
hreflang_lang: "ja"
---

# Greatest Common Divisor (GCD)
Let $P$ and $Q$ be two positive integers.
The computation of the **greatest common divisor (GCD)** can be formulated as an optimization problem with constraints.

Let $p$, $q$, and $r$ be positive integers satisfying the following constraints:

$$
\begin{aligned}
  p\cdot r &= P \\
  q\cdot r &=Q
\end{aligned}
$$

Clearly, $r$ is a common divisor of $P$ and $Q$.
Therefore, the maximum value of $r$ satisfying these constraints is the GCD of $P$ and $Q$.
To find such an $r$, we use $-r$ as the objective function.

## PyQBPP program
Based on the idea above, the following PyQBPP program computes the GCD of two integers,
`P = 858` and `Q = 693`:
```python
import pyqbpp as qbpp

P = 858
Q = 693
p = qbpp.var("p", integer=(1, 1000))
q = qbpp.var("q", integer=(1, 1000))
r = qbpp.var("r", integer=(1, 1000))

constraint = qbpp.cons(p * r == P) + qbpp.cons(q * r == Q)
f = -r + constraint * 1000

f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)

print(f"GCD = {sol(r)}")
print(f"{sol(p)} * {sol(r)} = {P}")
print(f"{sol(q)} * {sol(r)} = {Q}")
print(f"violated constraints = {f.cons(sol)}")
```
In this program, `p`, `q`, and `r` are defined as [native integer variables](NATIVE_INTEGER) in the range $[1,1000]$.
The two equalities are declared as constraints with [`qbpp.cons()`](CONSTRAINTS), and the expression constraint evaluates to zero when both constraints are satisfied.
With native integer variables and `qbpp.cons()`, the equalities are not squared and expanded, so the coefficients stay small and the default `pyqbpp` module suffices.

The objective function `-r` is combined with the constraint term multiplied by a weight of `1000`, and the resulting expression is stored in `f`.

The EasySolver searches for a solution that minimizes `f`.
The resulting values of `p`, `q`, and `r` and the number of violated constraints `f.cons(sol)` are printed as follows:
```
GCD = 33
26 * 33 = 858
21 * 33 = 693
violated constraints = 0
```
This output confirms that the GCD of 858 and 693 is correctly obtained as 33.
