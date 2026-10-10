---
last_modified: 2026-10-10
layout: default
nav_exclude: true
title: "Find Three Integers"
nav_order: 44
lang: en
hreflang_alt: "ja/python/3INTEGERS"
hreflang_lang: "ja"
---

# Math Problem: Find Three Integers

The following math problem can be solved using PyQBPP.

### Problem
Find integers $x$, $y$, $z$ that satisfy:

$$
\begin{aligned}
\frac{1}{x}+\frac{1}{y}+\frac{1}{z} = 1\\
1 < x < y < z
\end{aligned}
$$



### PyQBPP program

Since PyQBPP can handle polynomial expressions, we first rewrite the constraints.
Multiplying both sides of the first constraint by $xyz$ yields:

$$
xy+yz+zx - xyz = 0
$$

The strict inequalities $x<y<z$ can be encoded as

$$
\begin{aligned}
1 &\leq y-x \\
1 &\leq z-y
\end{aligned}
$$

The following PyQBPP program makes $x$, $y$, and $z$ [native integer variables](NATIVE_INTEGER), declares these expressions as constraints with [`qbpp.cons()`](CONSTRAINTS), and solves the problem using the Exhaustive Solver:

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(1, 10))
y = qbpp.var("y", integer=(1, 10))
z = qbpp.var("z", integer=(1, 10))

c1 = qbpp.cons(x * y + y * z + z * x - x * y * z == 0)
c2 = qbpp.cons(y - x >= 1)
c3 = qbpp.cons(z - y >= 1)

f = c1 + c2 + c3
f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)

for sol in result.sols:
    print(f"(x,y,z) = ({sol(x)}, {sol(y)}, {sol(z)})")
```

The three constraints are declared as `c1`, `c2`, and `c3`, and combined into a single expression `f`.
The energy of `f` is the sum of the squared violations of the constraints, and it is 0 only when all the constraints are satisfied.
The Exhaustive Solver examines all $10^3$ combinations of $x$, $y$, and $z$, and returns all solutions with the minimum energy.

Because `x`, `y`, and `z` are handled as integers and the inequalities introduce no auxiliary variables, the same $(x,y,z)$ is never returned more than once.

This program produces the following output:
```
(x,y,z) = (2, 3, 6)
```
This indicates that the problem has exactly one solution in the searched range, namely $(x,y,z)=(2,3,6)$.
