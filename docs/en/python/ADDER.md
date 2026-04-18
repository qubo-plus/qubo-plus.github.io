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
In this program, the constraint $fa(a,b,i,c,s)$ is implemented using `qbpp.constrain(..., equal=0)`, which intuitively represents the constraint $a+b+i=2o+s$.
Setting `best_energy_sols=0` collects all solutions that achieve the minimum (best) energy with no upper bound on their count.
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
Each line shows the index, the energy (0 for valid assignments), and the value of every variable. All eight rows of the full-adder truth table appear as optimal solutions.

If some bits are fixed, the valid values of the remaining bits can be derived.
For example, the three input bits can be fixed using the `qbpp.replace()` function:
```python
fa2 = qbpp.replace(fa, {a: 1, b: 1, i: 0})
fa2.simplify_as_binary()
```
`qbpp.replace(expr, mapping)` returns a new expression with every key in the dict substituted by its value (a constant or another variable or expression). The original `fa` is left unchanged. Then solve with `qbpp.ExhaustiveSolver(fa2)`.

The program then produces the following output:
```
(0) 0: o=1, s=0
```
which is the expected carry-out/sum for $1 + 1 + 0$.

Conversely, if the two output bits are fixed:
```python
fa2 = qbpp.replace(fa, {o: 1, s: 0})
fa2.simplify_as_binary()
```
the program produces all valid combinations of the input bits:
```
(0) 0: a=0, b=1, i=1
(1) 0: a=1, b=0, i=1
(2) 0: a=1, b=1, i=0
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
for idx, sol in enumerate(result.sols):
    print(f"({idx}) {sol.energy}: x={sol(x)}, y={sol(y)}, c={sol(c)}, z={sol(z)}")
```
In this PyQBPP program, four expressions representing full adders are created using the `replace()` function and combined into a single expression, `adder`.
Here `qbpp.var("x", shape=4)` returns an array of four binary variables `x[0], x[1], x[2], x[3]`, and the dict passed to `qbpp.replace()` substitutes each scalar placeholder (`a`, `b`, `i`, `o`, `s`) with the appropriate array element.
The Exhaustive Solver is then used to enumerate all optimal solutions; `sol(x)`, `sol(y)`, `sol(c)`, `sol(z)` return the assigned values of the arrays as Python lists.

This program produces 512 valid solutions, corresponding to all possible input combinations of a 4-bit adder:
```
(0) 0: x=[0, 0, 0, 0], y=[0, 0, 0, 0], c=[0, 0, 0, 0, 0], z=[0, 0, 0, 0]
(1) 0: x=[0, 0, 0, 0], y=[0, 0, 0, 0], c=[1, 0, 0, 0, 0], z=[1, 0, 0, 0]
(2) 0: x=[0, 0, 0, 0], y=[1, 0, 0, 0], c=[0, 0, 0, 0, 0], z=[1, 0, 0, 0]
(3) 0: x=[0, 0, 0, 0], y=[1, 0, 0, 0], c=[1, 0, 0, 0, 0], z=[0, 1, 0, 0]

... omitted ...

(510) 0: x=[1, 1, 1, 1], y=[1, 1, 1, 1], c=[0, 1, 1, 1, 1], z=[1, 1, 1, 1]
(511) 0: x=[1, 1, 1, 1], y=[1, 1, 1, 1], c=[1, 1, 1, 1, 1], z=[0, 0, 0, 0]
```
The 512 solutions correspond to every combination of the 4-bit inputs `x`, `y`, and the initial carry-in `c[0]` (2<sup>4</sup> x 2<sup>4</sup> x 2 = 512).

Alternatively, we can define a Python function `fa` to construct full-adder constraints in a more concise and readable manner:
```python
import pyqbpp as qbpp

def fa(a, b, i, o, s):
    return qbpp.constrain((a + b + i) - (2 * o + s), equal=0)

x = qbpp.var("x", shape=4)
y = qbpp.var("y", shape=4)
c = qbpp.var("c", shape=5)
z = qbpp.var("z", shape=4)

fa0 = fa(x[0], y[0], c[0], c[1], z[0])
fa1 = fa(x[1], y[1], c[1], c[2], z[1])
fa2 = fa(x[2], y[2], c[2], c[3], z[2])
fa3 = fa(x[3], y[3], c[3], c[4], z[3])
adder = fa0 + fa1 + fa2 + fa3
adder.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(adder)
result = solver.search(best_energy_sols=0)
for idx, sol in enumerate(result.sols):
    print(f"({idx}) {sol.energy}: x={sol(x)}, y={sol(y)}, c={sol(c)}, z={sol(z)}")
```
This program produces the same 512 optimal solutions as the previous implementation.

If some of the binary variables are fixed, the valid values of the remaining variables can be derived using the Exhaustive Solver.
For example, the following dict `ml` fixes the carry-in, carry-out, and sum bits:
```python
ml = {c[4]: 1, c[0]: 0, z[3]: 1,
      z[2]: 1, z[1]: 0, z[0]: 1}
adder = qbpp.replace(adder, ml)
adder.simplify_as_binary()
```
This assigns the 4-bit sum `z = 1101` (binary, LSB first: `z[0]=1, z[1]=0, z[2]=1, z[3]=1`) with carry-in `c[0]=0` and carry-out `c[4]=1`, i.e. the sum $x + y = 11101_{2} = 29$ with no initial carry.
The resulting program produces the following output:
```
(0) 0: x=[0, 1, 1, 1], y=[1, 1, 1, 1], c=[0, 0, 1, 1, 1], z=[1, 0, 1, 1]
(1) 0: x=[1, 1, 1, 1], y=[0, 1, 1, 1], c=[0, 0, 1, 1, 1], z=[1, 0, 1, 1]
```
Both solutions correspond to $14 + 15 = 29$ and $15 + 14 = 29$, the only two ways to obtain a 4-bit sum of `1101` with the prescribed carry pattern.
