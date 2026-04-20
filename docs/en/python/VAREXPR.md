---
layout: default
nav_exclude: true
title: "Data Types"
nav_order: 10
lang: en
hreflang_alt: "ja/python/VAREXPR"
hreflang_lang: "en"
---

# Variables and expressions

## pyqbpp.Var, pyqbpp.Term, and pyqbpp.Expr classes

PyQBPP provides the following fundamental classes:

- **`pyqbpp.Var`**: Represents a variable symbolically and is associated with a string used for display.
Internally, a 32-bit unsigned integer is used as its identifier.
- **`pyqbpp.Term`**: Represents a product term consisting of an integer coefficient and one or more variables.
The data type of the integer coefficient is governed by the coefficient type of the selected variant (default: 32-bit).
Each term stores its variables using a static array (inline buffer of 2 elements) combined with dynamic allocation for higher-degree terms, allowing terms of arbitrary degree with no upper limit.
- **`pyqbpp.Expr`**: Represents an expanded expression consisting of an integer constant term and zero or more product terms.
The data type of the integer constant term is governed by the energy type of the selected variant (default: 64-bit).
Every operation **expands the expression automatically**, so an expression is always stored internally as a **sum of product terms** (e.g., `(x + 1) * (y + 2)` is expanded on the fly to `2 + x*y + 2*x + y`).

In addition, Python's built-in `int` is used directly as constants and coefficients — no helper is needed to write large values.

In the following program, **`x`** and **`y`** are variables, **`t`** is a product term, and **`f`** is an expression:
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
t = 2 * x * y
f = t - x + 1

print("x =", x)
print("y =", y)
print("t =", t)
print("f =", f)
```
This program produces the following output:
```
x = x
y = y
t = 2*x*y
f = 1 +2*x*y -x
```

> **NOTE**
> Python's dynamic typing automatically handles the necessary type conversions
> while building an expression, so you do not have to think about the types of
> intermediate results — just mix integers, variables, and expressions freely.
> The library promotes intermediate results (`int` → `Var` → `Term` → `Expr`)
> to the appropriate type.

`pyqbpp.Var` objects are **immutable** and cannot be updated after creation.
In contrast, `pyqbpp.Term` and `pyqbpp.Expr` objects are **mutable** and can be updated via compound assignment operators.

For example, as shown in the following program, compound assignment operators can be used to update terms and expressions:
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
t = 2 * x * y
f = t - x + 1

print("t =", t)
print("f =", f)

t *= 3 * x
f += 2 * y

print("t =", t)
print("f =", f)
```
This program prints the following output:
```
t = 2*x*y
f = 1 +2*x*y -x
t = 6*x*y*x
f = 1 +2*x*y -x +2*y
```
> **NOTE**
> In Python, rebinding a name such as `x = x + 1` does not modify the original
> object; it simply makes `x` refer to a new object. Because of this, even though
> `pyqbpp.Var` objects are immutable, writing `x += 1` after `x = qbpp.var("x")`
> silently rebinds `x` to a new `Expr` — which is usually not what you want.
> Keep variable names (the result of `qbpp.var(...)`) pristine and accumulate
> into a separate expression variable.

## Building an expression

Python does not require you to construct an `Expr` explicitly — arithmetic operators automatically promote `int` / `Var` / `Term` into `Expr` when needed. For example, `2 * x * y` is a `Term`, but once you `+=` another term onto it, it is promoted to an `Expr`:
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")

t = 2 * x * y   # Term
t += x + 1      # promoted to Expr
f = 1           # int
f += t          # promoted to Expr

print("t =", t)
print("f =", f)
```
This program produces the following output:
```
t = 1 +2*x*y +x
f = 2 +2*x*y +x
```

## Integer Ranges: Coefficient and Energy Types

The coefficient type governs the integer coefficients of product terms, and the energy type governs the integer constant term of an `Expr` and the energy values produced by the solvers.
The following types can be specified:

| Type | Range | Large-constant syntax |
|------|-------|-----------------------|
| 32-bit | ±2.1×10⁹ | `12345` (Python int literal) |
| 64-bit | ±9.2×10¹⁸ | `1234567890123456789` |
| 128-bit | ±1.7×10³⁸ | `12345678901234567890` |
| `cpp_int` | unlimited | `12345678901234567890...` |

Because Python integer literals are arbitrary precision by construction, no helper function is needed to write large constants — you simply write the integer. When building an expression, each integer literal is converted into the current coefficient or energy type; if the value does not fit in the coefficient type of the selected variant, an exception is raised.

By default, `import pyqbpp` uses **32-bit coefficients and 64-bit energy** (`c32e64`),
which is the fastest type variant suitable for most problems.
To use a different type, import a different submodule:

| Import | Coefficient | Energy |
|---|---|---|
| `import pyqbpp.c32e32` | 32-bit | 32-bit |
| `import pyqbpp` (default) | 32-bit | 64-bit |
| `import pyqbpp.c32e64` | 32-bit | 64-bit |
| `import pyqbpp.c64e64` | 64-bit | 64-bit |
| `import pyqbpp.c64e128` | 64-bit | 128-bit |
| `import pyqbpp.c128e128` | 128-bit | 128-bit |
| `import pyqbpp.cppint` | unlimited | unlimited |

### VarArray mode

Each type variant is also available with a VarArray mode suffix (e.g., `import pyqbpp.c32e64m4`).
The mode controls how variables within each term are stored internally.
Fixed-length modes eliminate heap allocation and improve performance when the maximum degree of the problem is known in advance:

| Suffix | Max degree | Description |
|---|---|---|
| `m0` (or no suffix) | unlimited | Variable-length (heap allocation for degree 3+) |
| `m2` | 2 | Fixed-length, QUBO only (no heap allocation, fastest) |
| `m4` | 4 | Fixed-length, up to degree 4 (no heap allocation) |
| `m6` | 6 | Fixed-length, up to degree 6 (no heap allocation) |

Example — selecting both type and VarArray mode:
```python
import pyqbpp.c32e32m2 as qbpp   # 32-bit coeff/energy, QUBO only
import pyqbpp.c32e64m4 as qbpp   # default type, degree 4 max
import pyqbpp as qbpp             # default (c32e64m0, any degree)
```

The appropriate shared library is automatically loaded at import time based on the selected module.

> **NOTE**
> The type variant must be chosen at import time and cannot be changed afterward.
> All variables, expressions, and solvers within a program use the same type.

### Large constants

In Python, integer literals are arbitrary precision by construction, so writing a large value is just a matter of typing it — for example, `12345678901234567890 * x`.
Each such literal is converted to the current `coeff_t` type at the moment it participates in an operation.
If the value does not fit, an exception is raised.

For very large integer-string conversions inside a hot loop, bind the value to a variable once instead of materializing it on every iteration:
```python
K = 10**12   # computed once
for i in range(n):
    f += K * x[i]
```

> **NOTE**
> Ordinary Python integer literals work directly with any variant.
> There is no Python equivalent of `qbpp::integer("...")` because Python's `int`
> already handles arbitrary precision natively.

### Example with 128-bit integers

The following program creates an expression with coefficients exceeding the 64-bit range:
```python
import pyqbpp.c128e128 as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = 12345678901234567890 * x + 98765432109876543210 * y
print("f =", f)
```
This program produces the following output:
```
f = 12345678901234567890*x +98765432109876543210*y
```

### Example with arbitrary-precision integers (cpp_int)

The following program creates an expression with very large coefficient and constant terms:
```python
import pyqbpp.cppint as qbpp

x = qbpp.var("x")
f = 123456789012345678901234567890 * x + 987654321098765432109876543210
print("f =", f)
```
This program produces the following output:
```
f = 987654321098765432109876543210 +123456789012345678901234567890*x
```

Note that the source code for the 128-bit and `cpp_int` examples differs only in the `import` line — the rest of the program is identical regardless of the underlying integer type.
