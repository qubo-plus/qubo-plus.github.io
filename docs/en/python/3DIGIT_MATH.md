---
last_modified: 2026-10-10
layout: default
nav_exclude: true
title: "3-Digit Math"
nav_order: 45
lang: en
hreflang_alt: "ja/python/3DIGIT_MATH"
hreflang_lang: "ja"
---

# 3-Digit Math Problem

Let us solve the following math problem using PyQBPP.

> **Math Problem**:
> Find all three-digit odd integers whose **product of digits** is **252**.

Let $x$, $y$, and $z$ be the hundreds, tens, and ones digits of the integer, respectively.
More specifically:
- $x$ is an integer in $[1, 9]$,
- $y$ is an integer in $[0, 9]$,
- $t$ is an integer in $[0, 4]$,
- $z = 2t + 1$ (so $z$ is odd).

Then the value $v$ of the three-digit integer $xyz$ is

$$
\begin{aligned}
v&=100x+10y+z
\end{aligned}
$$


We find all solutions satisfying:

$$
\begin{aligned}
xyz &= 252
\end{aligned}
$$

## PyQBPP program
The following PyQBPP program finds all solutions:
{% raw %}
```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(1, 9))
y = qbpp.var("y", integer=(0, 9))
t = qbpp.var("t", integer=(0, 4))
z = 2 * t + 1
v = x * 100 + y * 10 + z

f = qbpp.cons(x * y * z == 252)

f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)
for sol in result.sols:
    print(sol(v), end=" ")
print()
```
{% endraw %}
In this program, **`x`**, **`y`**, and **`t`** are defined as [native integer variables](NATIVE_INTEGER) with the ranges above.
Then **`z`**, **`v`**, and **`f`** are defined as expressions.
`f` declares the condition $xyz = 252$ as a constraint with [`qbpp.cons()`](CONSTRAINTS), so its energy takes the minimum value 0 only when the condition holds.
We create an Exhaustive Solver instance for `f` and store all optimal solutions in `result.sols`.

Because `x`, `y`, and `t` are handled as integers, each solution corresponds to exactly one digit triple (`x`,`y`,`z`), and no triple appears more than once.
Printing the value of `v` for each solution gives:
```
479 497 667 749 947
```
