---
layout: default
nav_exclude: true
title: "Replace Functions"
nav_order: 17
lang: en
hreflang_alt: "ja/python/REPLACE"
hreflang_lang: "ja"
---

# Replace Functions

PyQBPP provides the following replace function, which can be used to fix variable values in an expression:
- **`replace(f, ml)`**: Returns a new expression in which variables are replaced according to the dict `ml`.
- **`f.replace(ml)`**: Replaces variables in expression `f` in place.

Here, `ml` is a Python dict mapping variables to expressions, where the expression can also be an integer value, e.g., `{x: 0, y: ~z}`.

## Using the replace function to fix variable values
We explain the `replace()` function using the
[partitioning problem](PARTITION).
This program finds a partition of the numbers in a list into two subsets $P$ and $Q$ such that the difference between their sums is minimized.

We modify this problem so that 64 must belong to $P$ and 27 must belong to $Q$:

```python
import pyqbpp as qbpp

w = [64, 27, 47, 74, 12, 83, 63, 40]
x = qbpp.var("x", len(w))
p = qbpp.sum([w[i] * x[i] for i in range(len(w))])
q = qbpp.sum([w[i] * ~x[i] for i in range(len(w))])
f = qbpp.sqr(p - q)
f.simplify_as_binary()

ml = {x[0]: 1, x[1]: 0}
g = qbpp.replace(f, ml)
g.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(g)
sol = solver.search()

full_sol = qbpp.Sol(f).set([sol, ml])

print("energy =", full_sol.comp_energy())
P = [w[i] for i in range(len(w)) if full_sol(x[i]) == 1]
Q = [w[i] for i in range(len(w)) if full_sol(x[i]) == 0]
print("P:", P)
print("Q:", Q)
```
In this program, a dict **`ml`** fixes `x[0]=1` (64 in $P$) and `x[1]=0` (27 in $Q$).
The `replace()` function substitutes these values into `f`, and the Exhaustive Solver finds the optimal partition for the remaining variables.

This program produces the following output:
```
energy = 4
P: [64, 47, 12, 83]
Q: [27, 74, 63, 40]
```

## Using the replace function to replace variables with expressions
The `replace()` function can also replace a variable with an expression.

For example, to ensure that 64 and 27 are placed in distinct subsets,
we replace `x[0]` with `~x[1]` so they always take opposite values:

```python
ml = {x[0]: ~x[1]}
g = qbpp.replace(f, ml)
g.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(g)
sol = solver.search()

full_sol = qbpp.Sol(f).set([sol, ml])

print("energy =", full_sol.comp_energy())
P = [w[i] for i in range(len(w)) if full_sol(x[i]) == 1]
Q = [w[i] for i in range(len(w)) if full_sol(x[i]) == 0]
print("P:", P)
print("Q:", Q)
```
This program produces the following output:
```
energy = 4
P: [64, 47, 12, 83]
Q: [27, 74, 63, 40]
```

## Replace functions for integer variables
Integer variables can be replaced with fixed integer values using the `replace()` function.

Here, we demonstrate this feature using a simple **multiplication/factorization** example.
Let $p$, $q$, and $r$ be integer variables with the constraint $p\times q - r = 0$.

### Multiplication
Fix $p=5$ and $q=7$ to find $r=35$:
```python
import pyqbpp as qbpp

p = qbpp.var("p", between=(2, 8))
q = qbpp.var("q", between=(2, 8))
r = qbpp.var("r", between=(2, 40))
f = qbpp.constrain(p * q - r, equal=0)
f.simplify_as_binary()

ml = {p: 5, q: 7}
g = qbpp.replace(f, ml)
g.simplify_as_binary()

solver = qbpp.EasySolver(g)
sol = solver.search(target_energy=0)

full_sol = qbpp.Sol(f).set([sol, ml])
print(f"p={full_sol(p)}, q={full_sol(q)}, r={full_sol(r)}")
```
This program produces the following output:
```
p=5, q=7, r=35
```

### Factorization
Fix $r=35$ to find $p$ and $q$:
```python
ml = {r: 35}
g = qbpp.replace(f, ml)
g.simplify_as_binary()
# ... same solver setup ...
```

### Division
Fix $p=5$ and $r=35$ to find $q=7$:
```python
ml = {p: 5, r: 35}
g = qbpp.replace(f, ml)
g.simplify_as_binary()
# ... same solver setup ...
```

> **NOTE**
> - **`f.replace(ml)`** updates the expression `f` in place.
> - **`replace(f, ml)`** returns a new expression without modifying the original.

> **NOTE: Using `replace()` with Terms**
> Both `replace(t, ml)` and `t.replace(ml)` work with `Term` objects.
> The `Term` is promoted to an `Expr`, and a new `Expr` is returned:
> ```python
> t = ~a * b * ~c * ~d  # Term
> e = t.replace({~a: 1 - a, ~c: 1 - c, d: 1 - d})  # returns Expr
> ```

> **NOTE: Negated literals and `replace()`**
> The `replace()` function treats `x` and `~x` as independent keys.
> Specifying `x: 0` in the dict does **not** automatically replace `~x` with `1`.
> If the expression contains negated literals such as `~x`, you should explicitly include both mappings:
> ```python
> ml = {x: 0, ~x: 1}
> ```
