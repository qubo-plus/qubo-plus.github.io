---
layout: default
nav_exclude: true
title: "Adder Simulation"
nav_order: 90
lang: en
hreflang_alt: "ja/python/ADDER"
hreflang_lang: "ja"
---

# Adder Simulation

## Full adder and ripple carry adder
A full adder has three input bits: $a$, $b$, and $i$ (carry-in) and
$o$ (carry-out) and $s$ (sum).
The sum of the three input bits is represented using these two output bits.

A ripple-carry adder computes the sum of two multi-bit integers by cascading multiple full adders, as illustrated below:
<p align="center">
 <img src="../../images/adder.svg" alt="4-bit ripple carry adder" width="50%">
</p>

This ripple-carry adder computes the sum of two 4-bit integers $x_3x_2x_1x_0$ and $y_3y_2y_1y_0$
and outputs the 4-bit sum$z_3z_2z_1z_0$ using four full adders.
The corresponding 5-bit carry signals $c_4c_3c_2c_1c_0$ are also shown.

## QUBO formulation for full adder
A full adder can be formulated using the following expression:

$$
\begin{aligned}
fa(a,b,i,c,s) &=((a+b+i)-(2o+s))^2
\end{aligned}
$$

This expression attains its minimum value of 0 if and only if the five variables take values consistent with a valid full-adder operation.
The following PyQBPP program verifies this formulation using the exhaustive solver:
```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
i = qbpp.var("i")
o = qbpp.var("o")
s = qbpp.var("s")
fa = qbpp.constrain((a + b + i) - (2 * o + s), equal=0)
fa.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(fa)
result = solver.search(best_energy_sols=0)
for idx, sol in enumerate(result.sols):
    vals = {v: sol(v) for v in [a, b, i, o, s]}
    print(f"({idx}) {sol.energy}: a={vals[a]}, b={vals[b]}, i={vals[i]}, o={vals[o]}, s={vals[s]}")
```
In this program, the constraint $fa(a,b,i,c,s)$ is implemented using `constrain(..., equal=0)`, which intuitively represents the constraint $a+b+i=2o+s$.
The program produces the following output, confirming that the expression correctly models a full adder:
```
(0) 0: a=0, b=0, i=0, o=0, s=0
(1) 0: a=0, b=0, i=1, o=0, s=1
(2) 0: a=0, b=1, i=0, o=0, s=1
(3) 0: a=0, b=1, i=1, o=1, s=0
(4) 0: a=1, b=0, i=0, o=0, s=1
(5) 0: a=1, b=0, i=1, o=1, s=0
(6) 0: a=1, b=1, i=0, o=1, s=0
(7) 0: a=1, b=1, i=1, o=1, s=1
```

If some bits are fixed, the valid values of the remaining bits can be derived.
For example, the three input bits can be fixed using the `replace()` function:
```python
ml = {a: 1, b: 1, i: 0}
fa2 = qbpp.replace(fa, ml)
fa2.simplify_as_binary()
solver2 = qbpp.ExhaustiveSolver(fa2)
sols2 = solver2.search_optimal_solutions()
for idx, sol in enumerate(sols2):
    print(f"({idx}) {sol.energy}: o={sol(o)}, s={sol(s)}")
```

The program then produces the following output:
```
(0) 0: o=1, s=0
```

## Simulating a ripple carry adder using multiple full adders
Using the QUBO expression for a full adder, we can construct a QUBO expression that simulates a ripple-carry adder.
The following PyQBPP program creates a QUBO expression for simulating a 4-bit adder by combining four full adders:
```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
i = qbpp.var("i")
o = qbpp.var("o")
s = qbpp.var("s")
fa = qbpp.constrain((a + b + i) - (2 * o + s), equal=0)

x = qbpp.var("x", shape=4)
y = qbpp.var("y", shape=4)
c = qbpp.var("c", shape=5)
z = qbpp.var("z", shape=4)

fa0 = qbpp.replace(fa, {a: x[0], b: y[0], i: c[0], o: c[1], s: z[0]})
fa1 = qbpp.replace(fa, {a: x[1], b: y[1], i: c[1], o: c[2], s: z[1]})
fa2 = qbpp.replace(fa, {a: x[2], b: y[2], i: c[2], o: c[3], s: z[2]})
fa3 = qbpp.replace(fa, {a: x[3], b: y[3], i: c[3], o: c[4], s: z[3]})

adder = fa0 + fa1 + fa2 + fa3
adder.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(adder)
result = solver.search(best_energy_sols=0)
print(f"Number of valid solutions: {len(result.sols)}")
for idx in [0, 1, len(result.sols)-2, len(result.sols)-1]:
    sol = sols[idx]
    xv = "".join(str(sol(x[j])) for j in range(4))
    yv = "".join(str(sol(y[j])) for j in range(4))
    cv = "".join(str(sol(c[j])) for j in range(5))
    zv = "".join(str(sol(z[j])) for j in range(4))
    print(f"({idx}) x={xv}, y={yv}, c={cv}, z={zv}")
```
In this program, four full-adder expressions are created using the `replace()` function with dicts, and combined into a single expression, `adder`.
The Exhaustive Solver is then used to enumerate all optimal solutions.

This program produces 512 valid solutions, corresponding to all possible input combinations of a 4-bit adder:
```
Number of valid solutions: 512
(0) x=0000, y=0000, c=00000, z=0000
(1) x=0000, y=0000, c=10000, z=1000
(510) x=1111, y=1111, c=01111, z=0111
(511) x=1111, y=1111, c=11111, z=1111
```

Alternatively, we can define a Python function `fa` to construct full-adder constraints in a more concise manner:
```python
import pyqbpp as qbpp

def fa(a, b, i, o, s):
    return qbpp.constrain((a + b + i) - (2 * o + s), equal=0)

x = qbpp.var("x", shape=4)
y = qbpp.var("y", shape=4)
c = qbpp.var("c", shape=5)
z = qbpp.var("z", shape=4)

adder = 0
for j in range(4):
    adder += fa(x[j], y[j], c[j], c[j + 1], z[j])

adder = qbpp.replace(adder, {c[0]: 0, c[4]: 0})
adder.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(adder)
result = solver.search(best_energy_sols=0)
print(f"Number of valid solutions: {len(result.sols)}")
```
This program produces 136 valid solutions (carry-in and carry-out are both fixed to 0, so only pairs with $x + y \leq 15$ are valid).
