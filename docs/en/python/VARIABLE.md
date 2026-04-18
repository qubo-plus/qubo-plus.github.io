---
layout: default
nav_exclude: true
title: "Variables and Expressions"
nav_order: 2
lang: en
hreflang_alt: "ja/python/VARIABLE"
hreflang_lang: "ja"
---

# Defining Variables and Creating Expressions

## Installing PyQBPP
To use PyQBPP, install it via pip:
```bash
pip install pyqbpp
```

## Importing the library
To use PyQBPP, import the **`pyqbpp`** module:
```python
import pyqbpp as qbpp
```

## Defining variables and expressions
You can define a variable using **`qbpp.var("name")`**.
The specified `name` is used when the variable is printed.

Expressions are constructed using standard arithmetic operators such as **`+`**, **`-`**, and **`*`**.

The following program defines three variables `a`, `b`, and `c`, and an expression `f`, which is printed:
```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
f = (a + b - 1) * (b + c - 1)
print("f =", f)
```
The expression `(a + b - 1) * (b + c - 1)` is automatically expanded and stored in `f`.

In this program, `a`, `b`, and `c` are variables and `f` is an expression.

Running the program prints the expanded expression:
```
f = 1 +a*b +b*b +a*c +b*c -a -b -b -c
```

> **NOTE**
> The variable name in `qbpp.var()` may be omitted.
> If omitted, a default name such as `{% raw %}{0}{% endraw %}`, `{% raw %}{1}{% endraw %}`,... is automatically assigned.

> **WARNING**
> Most PyQBPP objects, such as expressions, can be printed as text using `print()`.
> However, this textual output is not guaranteed to be stable and should not be used as input for subsequent computations, since its format may change in future releases.
> In addition, the output shown in the PyQBPP documentation may have been generated with an older version of PyQBPP, so the output produced by the latest version may differ.

Arrays of binary variables are introduced in [Arrays](VECTOR); multi-dimensional arrays in [Multi-dimensional Variables](MULTIDIM); integer variables in [Integer Variables](INTEGER).

## Simplifying expression
The expression stored in `f` can be simplified by calling the **`simplify()`** member function:
```python
print("f =", f.simplify())
```
With this change, the output of the program becomes:
```
f = 1 -a -2*b -c +a*b +a*c +b*b +b*c
```
The member function call **`f.simplify()`** simplifies the expression `f` in place and returns itself,
which is then printed.

## Simplifying expressions with binary variables
Assuming that all variables take **binary values (0 or 1)**, we can use the identity
**$b^2=b$** to further simplify the expression.
For this purpose, we use **`simplify_as_binary()`** instead:
```python
print("f =", f.simplify_as_binary())
```
Then the output becomes:
```
f = 1 -a -b -c +a*b +a*c +b*c
```

The simplify functions reorder the variables within each term and the terms within the expression so that lower-degree terms appear first, and terms of the same degree are sorted in the lexicographical order of their variables.
The variables themselves are ordered according to the order in which they were defined.

## Simplifying expressions with spin variables
If variables are assumed to take **spin values $-1$/$+1$**, the identity **$b^2 = 1$** can be used to further simplify the expression.
In this case, the expression can be simplified using the **`simplify_as_spin()`** member function:
```python
print("f =", f.simplify_as_spin())
```
Then the output becomes:
```
f = 2 -a -2*b -c +a*b +a*c +b*c
```

## Global functions for simplification
Member functions update the expression stored in `f`.
If you do not want to modify `f`, you can instead use the global functions
**`qbpp.simplify(f)`**, **`qbpp.simplify_as_binary(f)`**, and **`qbpp.simplify_as_spin(f)`**, which return the simplified expressions without changing `f`.

```python
import pyqbpp as qbpp
g = qbpp.simplify_as_binary(f)  # f is not modified, g is a new simplified expression
```

> **NOTE**
> In PyQBPP, most **member functions** update the object in place when possible, whereas **global functions** return a new value without modifying the original object.

## Negated literals
PyQBPP natively supports **negated literals** using the `~` operator.
For a binary variable `x`, the expression `~x` represents $1 - x$.

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
d = qbpp.var("d")
f = ~a * ~b * ~c * ~d + a * b
print("f =", f)
print("f =", qbpp.simplify_as_binary(f))
```
Output:
```
f = ~a*~b*~c*~d +a*b
f = a*b +~a*~b*~c*~d
```

The negated literal `~x` is stored internally as a single variable with a negation flag, **not** expanded as `1 - x`.
This is important for performance: if `~x` were naively expanded, a product of $k$ negated literals such as `~x1 * ~x2 * ... * ~xk` would produce up to $2^k$ terms after expanding $(1-x_1)(1-x_2)\cdots(1-x_k)$.
For example, the term `~a*~b*~c*~d` above is stored as a single quartic term, whereas its expanded form $(1-a)(1-b)(1-c)(1-d)$ produces 16 terms:
```
1 -a -b -c -d +a*b +a*c +a*d +b*c +b*d +c*d -a*b*c -a*b*d -a*c*d -b*c*d +a*b*c*d
```

All solvers bundled with PyQBPP (EasySolver, ExhaustiveSolver, ABS3 GPU Solver) handle negated literals natively, so it is not necessary to expand them before solving.
