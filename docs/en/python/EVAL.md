---
layout: default
nav_exclude: true
title: "Evaluating Expressions"
nav_order: 16
lang: en
hreflang_alt: "ja/python/EVAL"
hreflang_lang: "ja"
---

# Evaluating Expressions

## Evaluation using a list of pairs
The value of an expression can be computed by providing an assignment of values to all variables
as a list of `(variable, value)` pairs.

The following program computes the function $f(x,y,z)$ for $(x,y,z)=(0,1,1)$:
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
f = qbpp.sqr(x + 2 * y + 3 * z - 3)

print("f(0,1,1) =", f([(x, 0), (y, 1), (z, 1)]))
```
In this program, a list of pairs `[(x, 0), (y, 1), (z, 1)]` defines the assignment $x=0$, $y=1$, $z=1$.
Then `f(...)` returns the value of $f(0,1,1)$.
This program displays the following output:
```
f(0,1,1) = 4
```

## Evaluation using Sol
A solution object (**`Sol`**) can also be used to evaluate the value of an expression.
To do this, we first construct a `Sol` object associated with a given expression.
The newly created `Sol` object is initialized with the all-zero assignment.

Using the **`set()`** method, we can assign values to individual variables.
Then **`sol(f)`** returns the value of the expression `f` under the assignment stored in `sol`.

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
f = qbpp.sqr(x + 2 * y + 3 * z - 3)
f.simplify_as_binary()

sol = qbpp.Sol(f)
sol.set(y, 1)
sol.set(z, 1)

print("f(0,1,1) =", sol(f))
```

The method **`comp_energy()`** computes the energy value and caches it internally.
A solution object returned by a solver already has its energy cached.
To retrieve the cached energy, use the **`energy`** property:
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
f = qbpp.sqr(x + 2 * y + 3 * z - 4)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search({"target_energy": 0})

print(sol)
print("energy =", sol.energy)
```
This program produces the following output:
```
Sol(energy=0, x=1, y=0, z=1)
energy = 0
```

After modifying a solution (e.g., using `flip()`), the cached energy becomes invalid.
You must explicitly recompute it by calling **`comp_energy()`**:
```python
sol.flip(z)
print("comp_energy =", sol.comp_energy())
print("energy =", sol.energy)
```
