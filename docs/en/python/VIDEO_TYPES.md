---
last_modified: 2026-10-26
layout: default
nav_exclude: true
title: "Video: Coefficient and Energy Types"
description: "The points of each chapter of the video \"QUBO++ Coefficient and Energy Types (Python)\", with the programs shown in it and their output."
lang: en
hreflang_alt: "ja/python/VIDEO_TYPES"
hreflang_lang: "ja"
video: types
---

# Video: Coefficient and Energy Types (Python)

A companion to the video "QUBO++ Coefficient and Energy Types (Python)".
For each chapter it gives the main points, the programs shown in the video with their output, and links to the pages that explain more.
Click "▶ Play the video from …" to play from that scene.
Programs that the video shows in part are given here in full, ready to run.

{% include video_embed.html slug="types" %}

What the video covers:

- Choosing the coefficient and energy types with the module you import
- Values that do not fit the type wrapping around silently into a wrong answer (overflow), and the checks of the numbers you write
- `cppint`, a type with no limit on digits, and how the range of an integer variable depends on the types
- Real coefficients (`pyqbpp.d`), and checking the integer expression the solvers solve with `qbpp.quantize`
- Fixing the maximum degree of terms with the suffixes `m2` and `m4`, and how to choose a type

Back to the list of [Videos (Tutorials)](../VIDEOS)

## Choosing a type

{% include video_seek.html t="2:22" %}

In PyQBPP, the module you import decides the integer types. The default `pyqbpp` is `c32e64` (32-bit coefficients, 64-bit energies).
Coefficients are the numbers that multiply variables; the energy is the value of an expression. In $f = 3xy + 5$, 3 is a coefficient and 5 a constant, and with $x = y = 1$ the energy is 8 (constants are kept in the energy type too).
A program imports only one of them. Using a second type gives an `ImportError`.

```python
import pyqbpp as qbpp           # default (c32e64)
# import pyqbpp.c64e64 as qbpp  # 64-bit coefficients
# import pyqbpp.cppint as qbpp  # unlimited
```

| Module | Coefficients | Energies |
|---|---:|---:|
| `pyqbpp.c32e32` | 32 bits | 32 bits |
| `pyqbpp.c32e64` (the default `pyqbpp`) | 32 bits | 64 bits |
| `pyqbpp.c64e64` | 64 bits | 64 bits |
| `pyqbpp.c64e128` | 64 bits | 128 bits |
| `pyqbpp.c128e128` | 128 bits | 128 bits |
| `pyqbpp.cppint` | unlimited | unlimited |

Fewer bits run faster but overflow more easily. To change the type, change only the import line.

See [Variables and expressions](VAREXPR) for more.

## Overflow

### Coefficients wrap around silently

{% include video_seek.html t="4:18" %}

Expanding $(100000x + 100000y - 150000)^2$ should give the coefficient $-2\times 10^{10}$ for $x$ and $y$, and $2\times 10^{10}$ for $xy$.
A 32-bit coefficient holds only about ±2.1 billion, so the values overflow and wrap around with no error and no warning ($-2\times 10^{10} + 5\times 2^{32} = 1474836480$).
The constant 22.5 billion fits the 64-bit energy type and stays correct.
The solver solves this wrong expression and returns the solution with both 0. The true minimum is 2.5 billion, with three optimal solutions.
22.5 billion is also the correct value at (0, 0), so the output alone does not show the mistake.

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = qbpp.sqr(100000 * x + 100000 * y - 150000)
f.simplify_as_binary()
print(f)
sol = qbpp.ExhaustiveSolver(f).search(best_energy_sols=0)
for s in sol.sols:
    print(s.energy, s(x), s(y))
```

Output:

```
22500000000 +1474836480*x +1474836480*y -1474836480*x*y
22500000000 0 0
```

### Solving again with another type

{% include video_seek.html t="7:16" %}

Changing the import to `pyqbpp.c64e64` (64-bit coefficients too) makes the coefficient a correct $-2\times 10^{10}$, and gives the three optimal solutions.
Intermediate values (expanding, sums and products, inside the solvers) are not checked, for speed.
Estimate how large the coefficients and energies get, and choose a type they fit in.

```python
import pyqbpp.c64e64 as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = qbpp.sqr(100000 * x + 100000 * y - 150000)
f.simplify_as_binary()
print(f)
sol = qbpp.ExhaustiveSolver(f).search(best_energy_sols=0)
for s in sol.sols:
    print(s.energy, s(x), s(y))
```

Output:

```
22500000000 -20000000000*x -20000000000*y +20000000000*x*y
2500000000 1 0
2500000000 0 1
2500000000 1 1
```

## Input checks

{% include video_seek.html t="8:53" %}

Numbers written in a program are checked when they are entered. Which type checks them depends on how the number is used:

- Numbers multiplying variables, and the values of integer arrays (`qbpp.array`): the coefficient type
- Constants and constraint values: the energy type

With the default `c32e64`, $2^{40}$ is fine as a constant or a constraint value, but $2^{31}$ multiplying a variable does not fit the coefficient type (int32), and $2^{63}$ added as a constant does not fit even the energy type (int64).
A number that does not fit gives an overflow error (an intended error example, caught with `try` and `except` to print the message). The message suggests a wider type.

```python
import pyqbpp as qbpp

x = qbpp.var("x")
print(x + 2**40)
print(qbpp.cons(x == 2**40))
try:
    print(2**31 * x)
except OverflowError as e:
    print("OverflowError:", e)
try:
    print(x + 2**63)
except OverflowError as e:
    print("OverflowError:", e)
```

Output:

```
1099511627776 +x
cons(x == 1099511627776)
OverflowError: coefficient 2147483648 is out of range for this variant (coeff_t = int32). Use a wider variant such as pyqbpp.c64e64 / pyqbpp.c128e128 / pyqbpp.cppint.
OverflowError: constant 9223372036854775808 is out of range for this variant (energy_t = int64). Use a wider variant such as pyqbpp.c64e128 / pyqbpp.c128e128 / pyqbpp.cppint.
```

Only the numbers you write are checked. The $-2\times 10^{10}$ of the previous program came up during the expansion, so it was not checked.

## cppint

{% include video_seek.html t="11:27" %}

`pyqbpp.cppint` is a type with no limit on the digits of coefficients and energies. Like Python's integers, it never overflows.
Expanding $(10^{30}x - 3\times 10^{29})^2$ gives the constant $9\times 10^{58}$ (59 digits) and the coefficient $4\times 10^{59}$ of $x$ (60 digits), exactly.
But it is slower than the fixed-size types and uses no GPUs (ExhaustiveSolver and ABS3Solver also run on CPUs only).
Use it when you cannot estimate the sizes, or to check results obtained with a fixed-size type.

```python
import pyqbpp.cppint as qbpp

x = qbpp.var("x")
f = qbpp.sqr(10**30 * x - 3 * 10**29)
f.simplify_as_binary()
print(f)
```

Output:

```
90000000000000000000000000000000000000000000000000000000000 +400000000000000000000000000000000000000000000000000000000000*x
```

## Integer variable ranges

{% include video_seek.html t="14:16" %}

An integer variable made with `integer=` keeps its range in the energy type, so even the default `c32e64` allows a wide range such as 0 to $2^{40}$.
An integer variable made with `between=` is a sum of binary variables, and its coefficients 1, 2, 4, 3 are kept in the coefficient type.
`between=(0, 2**40)` needs the coefficient $2^{31}$, which does not fit a 32-bit coefficient, so it gives an overflow error (an intended error example). The message suggests a wider type or an `integer=` variable.

```python
import pyqbpp as qbpp

n = qbpp.var("n", integer=(0, 2**40))
print(qbpp.cons(n <= 10**12))
v = qbpp.var("v", between=(0, 10))
print(v)
try:
    w = qbpp.var("w", between=(0, 2**40))
except OverflowError as e:
    print("OverflowError:", e)
```

Output:

```
cons(n <= 1000000000000)
v[0] +2*v[1] +4*v[2] +3*v[3]
OverflowError: between=(0, 1099511627776): the range needs the binary coefficient 2147483648, which is out of range for this variant (coeff_t = int32). Use a wider variant such as pyqbpp.c64e64 / pyqbpp.c128e128 / pyqbpp.cppint, or a native integer variable (integer=), whose range uses energy_t.
```

When integer variables are used in constraints, watch the size of the energy too. A penalty is the weight times the squared violation, so a violation of about $2^{40}$ gives about $2^{80}$, which does not fit a 64-bit energy.
Values inside the solvers are not checked, so leave room in the energy type, for example with `c64e128` and its 128-bit energies.

See [Integer Variables and Solving Simultaneous Equations](INTEGER) for more.

## Real coefficients

### Writing decimals with pyqbpp.d

{% include video_seek.html t="16:56" %}

With `pyqbpp.d`, coefficients and energies are written as decimals (Python's `float`).
From three items, choose some so that their total amount (0.06, 0.05, 0.07) is at least 0.1, at the least cost (0.3, 0.5, 0.4).

| Items chosen | Total amount | Cost |
|---|---:|---:|
| 0 and 1 | 0.11 | 0.8 |
| 0 and 2 | 0.13 | 0.7 |
| 1 and 2 | 0.12 | 0.9 |
| all three | 0.18 | 1.2 |

A single item does not reach 0.1. The least cost is items 0 and 2, 0.7.

```python
import pyqbpp.d as qbpp

x = qbpp.var("x", 3)
f = 0.3 * x[0] + 0.5 * x[1] + 0.4 * x[2] + 1000 * qbpp.cons(
    0.06 * x[0] + 0.05 * x[1] + 0.07 * x[2] >= 0.1)
f.simplify_as_binary()
sol = qbpp.EasySolver(f).search()
print(sol)
```

The output in the video (EasySolver may give different results on each run):

```
Sol(energy=0.7, {x[0]: 1, x[1]: 0, x[2]: 1})
```

The solvers do not work with decimals: they multiply the coefficients by a scale and round them to integers. This is done automatically.

### Seeing the expression the solvers solve with quantize

{% include video_seek.html t="19:07" %}

`qbpp.quantize(f)` returns the expression with integer coefficients that the solvers actually solve; `g.scale` is the scale of the objective.
The objective is multiplied by $2^{58}$, and the constraint by another scale, $2^{24}$, and rounded. 0.1 becomes $0.1\times 2^{24} = 1677721.6$, rounded to 1677722, and the weight 1000 is shown as 1024000.

```python
import math

import pyqbpp.d as qbpp

# f: the same as in the previous program
x = qbpp.var("x", 3)
f = 0.3 * x[0] + 0.5 * x[1] + 0.4 * x[2] + 1000 * qbpp.cons(
    0.06 * x[0] + 0.05 * x[1] + 0.07 * x[2] >= 0.1)
f.simplify_as_binary()
g = qbpp.quantize(f)
print(f"scale = 2^{math.log2(g.scale):g}")
print(g)
```

Output:

```
scale = 2^58
86469112845513520*x[0] +144115188075855872*x[1] +115292150460684704*x[2]
+1024000*cons(1006633*x[0] +838861*x[1] +1174405*x[2] >= 1677722)
```

See [Quick Reference: Variables and Expressions](QR_VARIABLE) for more.

### What the module names mean

{% include video_seek.html t="20:35" %}

The name of a real-coefficient module is `d` followed by the name of the integer type after quantization.
For example, `dc64e128` quantizes the expression written in decimals into an integer expression with 64-bit coefficients and 128-bit energies, and solves that.
All of them are used the same way: change only the import line (`import pyqbpp.dc64e128 as qbpp`, for example).

| Module | Type after quantization | When to use |
|---|---|---|
| `pyqbpp.d` (= `dc64e64`) | `c64e64` | The default for real coefficients |
| `pyqbpp.dc64e128` | `c64e128` | Coefficients of very different sizes: more precise, and searches about as fast as `pyqbpp.d` |
| `pyqbpp.dc128e128` | `c128e128` | The last resort when `dc64e128` is not precise enough; searches more slowly |

### Judging with the original and the quantized expression

{% include video_seek.html t="22:47" %}

Quantizing rounds decimals to nearby integers, so a solution exactly on the boundary of a constraint may be judged differently.
Choosing items 0 and 1 gives 0.7 + 0.1, which in the original `f` is 0.7999999999999999 (at most 0.8): satisfied, and `f.cons(sol)` is 0.
In the quantized `g`, 5872026 + 838861 = 6710887 exceeds the bound 6710886 by 1, so `g.cons(sol)` is 1.
The solvers solve `g`, so to judge the way the solvers do, evaluate with `g`.
A tolerance `tol` counts a violation up to `tol` as satisfied (the violation of `g` is $2^{-23}\approx 1.2\times 10^{-7}$ in the original units). `tol` changes only the judgment, not the expression the solvers solve.

```python
import pyqbpp.d as qbpp

x = qbpp.var("x", 3)
f = -x[0] - x[1] - x[2] + 1000 * qbpp.cons(0.7 * x[0] + 0.1 * x[1] + 0.2 * x[2] <= 0.8)
f.simplify_as_binary()
g = qbpp.quantize(f)
print(g)
sol = qbpp.Sol(f).set({x[0]: 1, x[1]: 1, x[2]: 0})
print(f.cons(sol), g.cons(sol), g.cons(sol, tol=1e-6))
```

Output:

```
-72057594037927936*x[0] -72057594037927936*x[1] -72057594037927936*x[2]
+1024000*cons(5872026*x[0] +838861*x[1] +1677722*x[2] <= 6710886)
0 1 0
```

See [Nonlinear Functions and Native Constraints](CONSTRAINTS) for more.

## Maximum degree

{% include video_seek.html t="26:03" %}

The suffix `m2` or `m4` after a type name fixes the maximum degree of terms: `m2` allows terms up to degree 2, `m4` up to degree 4.
With `pyqbpp.c32e64m2`, making the degree-3 term `x[0] * x[1] * x[2]` gives an error (an intended error example; the 2 at the end of the message is the maximum degree).
Without a suffix there is no limit on the degree. A fixed maximum degree builds expressions faster, but only the building gets faster; the solvers run at the same speed.

```python
import pyqbpp.c32e64m2 as qbpp

x = qbpp.var("x", 3)
f = x[0] * x[1] + x[1] * x[2]
print(f)
try:
    g = x[0] * x[1] * x[2]
except RuntimeError as e:
    print("RuntimeError:", e)
```

Output:

```
x[0]*x[1] +x[1]*x[2]
RuntimeError: VarArray: degree exceeds MAXDEG capacity (2)
```

## How to choose

{% include video_seek.html t="27:57" %}

| Situation | Module | Note |
|---|---|---|
| To start | `pyqbpp` | the default is `c32e64` |
| Coefficients may exceed about $\pm 2.1\times 10^{9}$ | `pyqbpp.c64e64` | |
| Energies may exceed about $\pm 9.2\times 10^{18}$ | `pyqbpp.c64e128` | `c128e128` to widen coefficients too |
| Sizes cannot be estimated, or to check results | `pyqbpp.cppint` | slow; uses no GPUs |
| Decimal coefficients | `pyqbpp.d` | quantized to integers with a scale |
| Decimals of very different sizes | `pyqbpp.dc64e128` | quantized to `c64e128` |
| Up to degree 2 (QUBO) | `pyqbpp.c32e64m2` | faster building; `m4` up to degree 4 |

When in doubt, start with the default type and switch to a wider one if it is not enough.

## Summary

{% include video_seek.html t="29:57" %}

- You choose the coefficient and energy types with a pyqbpp module. For example, importing `pyqbpp.c64e64` makes both coefficients and energies 64-bit integers. Coefficients multiply variables; the energy is an expression's value.
- Intermediate values are not checked, for speed, so an overflow gives no error and no warning: just a wrong answer. Looking at the output alone, you may not notice it.
- The numbers you write are checked when you enter them; if they do not fit, you get an `OverflowError`. Numbers multiplying variables are checked with the coefficient type, constants and constraint values with the energy type.
- When in doubt, check with `cppint`, which never overflows. It is slower and uses no GPUs, but has no limit on digits.
- `integer=` keeps an integer variable's range in the energy type. `between=` is a sum of binary variables, so it uses the coefficient type.
- Write real coefficients with `pyqbpp.d`, and check the expression the solvers solve with `qbpp.quantize`. The solvers solve the quantized `g`. When the original `f` and `g` judge a constraint differently, judge with `g` and allow tiny violations with `tol`.
- The suffixes `m2` and `m4` fix the maximum degree of terms. Building expressions gets faster; the solvers run at the same speed.
