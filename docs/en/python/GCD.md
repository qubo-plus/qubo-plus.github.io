---
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

## PyQBPP program
Based on the idea above, the following PyQBPP program computes the GCD of two integers,
`P = 858` and `Q = 693`:
```python
import pyqbpp as qbpp

P = 858
Q = 693
p = qbpp.between(qbpp.var_int("p"), 1, 1000)
q = qbpp.between(qbpp.var_int("q"), 1, 1000)
r = qbpp.between(qbpp.var_int("r"), 1, 1000)

constraint = (p * r == Q) + (q * r == P)
f = -r + constraint * 1000

f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search({"time_limit": 1.0})

print(f"GCD = {sol(r)}")
print(f"{sol(p)} * {sol(r)} = {P}")
print(f"{sol(q)} * {sol(r)} = {Q}")
```
In this program, `p`, `q`, and `r` are defined as integer variables in the range $[1,1000]$.
The expression constraint is constructed so that it evaluates to zero when both constraints are satisfied.

The objective function `-r` is combined with the constraint term multiplied by a penalty factor of `1000`, and the resulting expression is stored in `f`.

The EasySolver searches for a solution that minimizes `f`.
The resulting values of `p`, `q`, and `r` are printed as follows:
```
GCD = 33
21 * 33 = 858
26 * 33 = 693
```
This output confirms that the GCD of 858 and 693 is correctly obtained as 33.
