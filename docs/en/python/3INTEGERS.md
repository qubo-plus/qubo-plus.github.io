---
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

The following PyQBPP program formulates these constraints as a HUBO expression and solves it using the Exhaustive Solver:

```python
import pyqbpp as qbpp

x = qbpp.var("x", between=(1, 10))
y = qbpp.var("y", between=(1, 10))
z = qbpp.var("z", between=(1, 10))

c1 = qbpp.constrain(x * y + y * z + z * x - x * y * z, equal=0)
c2 = qbpp.constrain(y - x, between=(1, 9))
c3 = qbpp.constrain(z - y, between=(1, 9))

f = c1 + c2 + c3
f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)

seen = set()
for sol in result.sols:
    key = (sol(x), sol(y), sol(z))
    if key not in seen:
        seen.add(key)
        xv, yv, zv = key
        print(f"(x,y,z) = ({xv}, {yv}, {zv})")
```
The three constraints are encoded as `c1`, `c2`, and `c3`, and combined into a single objective `f`.
The Exhaustive Solver searches for optimal solutions of f and prints the resulting
$(x,y,z)$ tuples.

Because `f` introduces auxiliary variables during binary simplification, the same
$(x,y,z)$ assignment may appear multiple times in the returned solution set.
Therefore, we use a `set` to remove duplicates before printing.

This program produces the following output:
```
(x,y,z) = (2, 3, 6)
```
This indicates that the problem has exactly one solution in the searched range, namely $(x,y,z)=(2,3,6)$.
