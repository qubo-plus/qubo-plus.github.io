---
layout: default
nav_exclude: true
title: "Pythagorean Triples"
nav_order: 40
lang: en
hreflang_alt: "ja/python/PYTHAGOREAN"
hreflang_lang: "ja"
---

# Pythagorean Triples

Three integers $x$, $y$, and $z$ are **Pythagorean triples** if they satisfy

$$
\begin{aligned}
x^2+y^2&=z^2
\end{aligned}
$$

To avoid duplicates, we assume $x<y$.

## PyQBPP program for listing Pythagorean Triples
The following program lists Pythagorean triples with $x\leq 16$, $y\leq 16$, and $z\leq 16$:
```python
import pyqbpp as qbpp

x = qbpp.var("x", between=(1, 16))
y = qbpp.var("y", between=(1, 16))
z = qbpp.var("z", between=(1, 16))
f = (x * x + y * y - z * z == 0)
c = (y - x >= 1)
g = f + c
g.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(g)
result = solver.search(best_energy_sols=0)

seen = set()
for sol in result.sols:
    key = (sol(x), sol(y), sol(z))
    if key not in seen:
        seen.add(key)
        print(f"x={key[0]}, y={key[1]}, z={key[2]}, f={sol(f.body)}, c={sol(c.body)}")
```
In this program, we define integer variables `x`, `y`, and `z` with ranges from 1 to 16.
We then create two constraint expressions:
- `f` for $x^2+y^2-z^2=0$, and
- `c` for $x+1\leq y$.

They are combined into `g`.
The expression `g` attains its minimum value 0 when all constraints are satisfied.

An Exhaustive Solver object `solver` is created for `g`.
Calling `search(best_energy_sols=0)` keeps every best-energy (optimal) solution; they are read from `result.sols`.

Because integer variables are encoded by multiple binary variables, the same
$(x,y,z)$ assignment may appear multiple times.
Therefore, we use a `set` to remove duplicates before printing.

This program produces the following output:
```
x=3, y=4, z=5, f=0, c=1
x=5, y=12, z=13, f=0, c=7
x=6, y=8, z=10, f=0, c=2
x=9, y=12, z=15, f=0, c=3
```

## Using `qbpp.cons()` to search larger ranges

The equality $x^2+y^2-z^2=0$ and the inequality $x+1\leq y$ can also be written
as **constraints** by wrapping them in `qbpp.cons()`. The bundled solvers then
search for an assignment that satisfies the constraints while optimizing the
objective, which makes it practical to search much larger ranges. The program
below extends the range to `1..1000` and adds the objective `-z`, so the solver
returns a triple with the largest possible hypotenuse:
```python
import pyqbpp as qbpp

x = qbpp.var("x", between=(1, 1000))
y = qbpp.var("y", between=(1, 1000))
z = qbpp.var("z", between=(1, 1000))
f = (-z  # maximize the hypotenuse z
     + 2000 * qbpp.cons(x * x + y * y - z * z == 0)
     + 2000 * qbpp.cons(y - x >= 1))
f.simplify_as_binary()
sol = qbpp.EasySolver(f).search(time_limit=15.0)
print(f"x={sol(x)}, y={sol(y)}, z={sol(z)}, violations={f.cons(sol)}")
```
Here `f.cons(sol)` reports the number of violated constraints; `0` means the
returned triple is a valid Pythagorean triple with `y > x`. A typical result is:
```
x=352, y=936, z=1000, violations=0
```

## Handling large integers with `c64e128`

For large integer ranges, the intermediate values handled by the solver can
exceed the range of 64-bit integers. In that case, import the `c64e128` data
type (64-bit coefficients and 128-bit energy) with `import pyqbpp.c64e128 as qbpp`.
The version below searches the range `1..10000`:
```python
import pyqbpp.c64e128 as qbpp

x = qbpp.var("x", between=(1, 10000))
y = qbpp.var("y", between=(1, 10000))
z = qbpp.var("z", between=(1, 10000))
f = (-z  # maximize the hypotenuse z
     + 20000 * qbpp.cons(x * x + y * y - z * z == 0)
     + 20000 * qbpp.cons(y - x >= 1))
f.simplify_as_binary()
sol = qbpp.EasySolver(f).search(time_limit=20.0)
print(f"x={sol(x)}, y={sol(y)}, z={sol(z)}, violations={f.cons(sol)}")
```
A typical result is:
```
x=5376, y=8432, z=10000, violations=0
```
The available data types are listed in [Data Types](VAREXPR).
