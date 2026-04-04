---
layout: default
nav_exclude: true
title: "Comparison Operators"
nav_order: 14
lang: en
hreflang_alt: "ja/python/COMPARISON"
hreflang_lang: "ja"
---

# Comparison Operators
PyQBPP supports two types of operators for creating constraints:

- **Equality operator**: `f == n`, where `f` is an expression and `n` is an integer.
- **Range operator**: `between(f, l, u)`, where `f` is an expression and `l` and `u` ($l\leq u$) are integers.

These operators return an `ExprExpr` object that attains **the minimum value of 0 if and only if the corresponding constraints are satisfied**.

## Equality operator
The equality operator `f == n` creates the following expression:

$$
(f-n)^2
$$

This expression attains the minimum value of 0 if and only if the equality $f=n$ is satisfied.

The following program searches for all solutions satisfying
$a+2b+3c=3$ using the Exhaustive Solver:
```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
f = a + 2 * b + 3 * c == 3
f.simplify_as_binary()
print("f =", f)
print("body =", f.body)

solver = qbpp.ExhaustiveSolver(f)
result = solver.search({"best_energy_sols": 0})
for sol in result.sols():
    print(f"a={sol(a)}, b={sol(b)}, c={sol(c)}, "
          f"f={sol(f)}, body={sol(f.body)}")
```
In this program, `f` internally holds two expressions:
- **`f`**: $(a+2b+3c-3)^2$, which attains the minimum value of 0 if the equality is satisfied.
- **`f.body`**: the left-hand side of the equality, $a+2b+3c$.

This program produces the following output:
```
f = 9 -5*a -8*b -9*c +4*a*b +6*a*c +12*b*c
body = a +2*b +3*c
a=0, b=0, c=1, f=0, body=3
a=1, b=1, c=0, f=0, body=3
```

## Notes on Supported Equality Forms
PyQBPP supports the equality operator only in the following form:
- **`expression == integer`**

The following forms are not supported:
- **`integer == expression`**
- **`expression1 == expression2`**

Instead of `expression1 == expression2`, you can rewrite the constraint as:
- **`expression1 - expression2 == 0`**

## Range operator
The range operator `between(f, l, u)` creates an expression that attains the minimum value of 0 if and only if the constraint $l\leq f\leq u$ is satisfied.

> **NOTE**
> Unlike the C++ version which uses the syntax `l <= f <= u`, PyQBPP uses the function `between(f, l, u)` for range constraints on expressions.

The following program demonstrates the use of the range operator:
```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
f = qbpp.between(4 * a + 9 * b + 15 * c, 5, 14)
f.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(f)
result = solver.search({"best_energy_sols": 0})
for sol in result.sols():
    print(f"a={sol(a)}, b={sol(b)}, c={sol(c)}, "
          f"f={sol(f)}, body={sol(f.body)}")
```
This program searches for solutions satisfying the constraint $5\leq 4a+9b+15c \leq 14$ and produces the following output:
```
a=0, b=1, c=0, f=0, body=9
a=1, b=1, c=0, f=0, body=13
```
