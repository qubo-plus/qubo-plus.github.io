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

## Evaluation using a dict
The value of an expression can simply be computed by providing an assignment of values to all variables
as a dict mapping variables to values.
A dict plays the same role as `qbpp::MapList` in the C++ API: it carries a list of
`(variable, value)` pairs that together specify a complete assignment.

The following program computes the function $f(x,y,z)$ for $(x,y,z)=(0,1,1)$:
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
f = qbpp.sqr(x + 2 * y + 3 * z - 3)

ml = {x: 0, y: 1, z: 1}

print("assignment =", ml)
print("f(0,1,1) =", f(ml))
```

In this program, the dict `ml = {x: 0, y: 1, z: 1}` defines the assignment
$x=0$, $y=1$, $z=1$, and `f(ml)` returns the value of $f(0,1,1)$.
This program displays the following output:

{% raw %}
```
assignment = {x: 0, y: 1, z: 1}
f(0,1,1) = 4
```
{% endraw %}

Alternatively, we can provide an assignment directly as a dict literal, or as a list of
`(variable, value)` tuples:
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
f = qbpp.sqr(x + 2 * y + 3 * z - 3)

print("f(0,1,1) =", f({x: 0, y: 1, z: 1}))
print("f(0,1,1) =", f([(x, 0), (y, 1), (z, 1)]))
```
The dict form and the list-of-tuples form are equivalent and return the same result.

## Evaluation using Sol
A solution (**`Sol`**) can also be used to evaluate the value of an expression.
To do this, we first construct a solution `sol` associated with a given expression `f`.
The newly created solution is initialized with the all-zero assignment.

Using the **`sol.set(x, value)`** method, we can assign values to individual variables.
Then, both **`f(sol)`** and **`sol(f)`** return the value of the expression `f` under the
assignment stored in `sol`.
Furthermore, the **`comp_energy()`** method computes and returns the same value.

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

print("f(0,1,1) =", f(sol))
print("f(0,1,1) =", sol(f))
print("f(0,1,1) =", sol.comp_energy())
```

Note that the method **`comp_energy()`** of a solution `sol` computes the energy value
and caches it inside the solution.
In addition, a solution returned by a solver already has its energy value computed and cached.
To retrieve the energy without recomputing it, you can use the **`energy`** property, as shown below:
{% raw %}
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
f = qbpp.sqr(x + 2 * y + 3 * z - 4)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=0)

print("sol =", sol)
print("energy =", sol.energy)

sol.flip(z)
print("flipped sol =", sol)
print("flipped energy =", sol.energy)
```
{% endraw %}
In this program, `sol.energy` correctly returns 0.
However, after flipping the variable `z`, the cached energy value becomes invalid.
Accessing `sol.energy` without recomputing the energy therefore results in **a runtime error**,
as shown below:
{% raw %}
```
sol = 0:{{x,1},{y,0},{z,1}}
energy = 0
RuntimeError: energy is not up to date; call comp_energy() after modifying the solution
```
{% endraw %}
To resolve this issue, you must explicitly recompute the energy by calling **`sol.comp_energy()`**
after modifying the solution, as follows:
```python
print("sol =", sol)
print("energy =", sol.energy)

sol.flip(z)
print("sol.comp_energy() =", sol.comp_energy())
print("flipped sol =", sol)
print("flipped energy =", sol.energy)
```
This program produces the following output:
{% raw %}
```
sol = 0:{{x,1},{y,0},{z,1}}
energy = 0
sol.comp_energy() = 9
flipped sol = 9:{{x,1},{y,0},{z,0}}
flipped energy = 9
```
{% endraw %}
After calling `comp_energy()`, the `sol.energy` property also returns the correct
(recomputed) energy.
