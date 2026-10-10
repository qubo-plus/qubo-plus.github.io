---
last_modified: 2026-10-10
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

x = qbpp.var("x", integer=(1, 16))
y = qbpp.var("y", integer=(1, 16))
z = qbpp.var("z", integer=(1, 16))
f = x * x + y * y - z * z
c = y - x
g = qbpp.cons(f == 0) + qbpp.cons(c >= 1)
g.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(g)
result = solver.search(best_energy_sols=0)

for sol in result.sols:
    print(f"x={sol(x)}, y={sol(y)}, z={sol(z)}, f={sol(f)}, c={sol(c)}")
```
In this program, we define [native integer variables](NATIVE_INTEGER) `x`, `y`, and `z` with ranges from 1 to 16.
We then create two expressions:
- `f` for $x^2+y^2-z^2$, and
- `c` for $y-x$.

The equality $f=0$ and the inequality $c\geq 1$ (that is, $x+1\leq y$) are declared as constraints with [`qbpp.cons()`](CONSTRAINTS) and combined into `g`.
The expression `g` attains its minimum value 0 when all constraints are satisfied.

An Exhaustive Solver object `solver` is created for `g`.
Calling `search(best_energy_sols=0)` keeps every best-energy (optimal) solution; they are read from `result.sols`.
Because `x`, `y`, and `z` are handled as integers, the same $(x,y,z)$ is never returned more than once.

This program produces the following output:
```
x=3, y=4, z=5, f=0, c=1
x=5, y=12, z=13, f=0, c=7
x=6, y=8, z=10, f=0, c=2
x=9, y=12, z=15, f=0, c=3
```

## Searching larger ranges

Because the equality $x^2+y^2-z^2=0$ and the inequality $x+1\leq y$ are declared
as **constraints** with `qbpp.cons()`, the bundled solvers search for an assignment that
satisfies the constraints while optimizing the objective. This makes it practical
to search much larger ranges. The program
below extends the range to `1..1000` and adds the objective `-z`, so the solver
returns a triple with the largest possible hypotenuse:
```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(1, 1000))
y = qbpp.var("y", integer=(1, 1000))
z = qbpp.var("z", integer=(1, 1000))
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

x = qbpp.var("x", integer=(1, 10000))
y = qbpp.var("y", integer=(1, 10000))
z = qbpp.var("z", integer=(1, 10000))
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
