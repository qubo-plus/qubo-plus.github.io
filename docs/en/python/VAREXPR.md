---
layout: default
nav_exclude: true
title: "Data Types"
nav_order: 10
lang: en
hreflang_alt: "ja/python/VAREXPR"
hreflang_lang: "ja"
---

# Variables and expressions

## The three concepts
PyQBPP uses only three concepts to represent QUBO/HUBO problems:

- **integer**: Python's built-in `int`, used as constants and coefficients.
- **variable**: a binary variable created by `qbpp.var("x")`. Its type is `pyqbpp.Var` and it is **immutable**.
- **expression**: a polynomial built from integers and variables using the arithmetic operators `+`, `-`, `*`. Its type is `pyqbpp.Expr` and it is **mutable** via compound assignment operators such as `+=`. Every operation **expands the expression automatically**, so an expression is always stored internally as a **sum of product terms** (e.g., `(x + 1) * (y + 2)` is expanded on the fly to `2 + x*y + 2*x + y`).

The following program demonstrates variable and expression creation:
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = 2 * x * y - x + 1
f += 3 * y

print("f =", f)
```
This program prints:
```
f = 1 -x +2*x*y +3*y
```

> **NOTE**
> Python's dynamic typing automatically handles the necessary type conversions
> while building an expression, so you do not have to think about the types of
> intermediate results — just mix integers, variables, and expressions freely.

## Coefficient and Energy Types
By default, `import pyqbpp` uses **32-bit coefficients and 64-bit energy** (`c32e64`),
which is the fastest type variant suitable for most problems.

For larger problems or arbitrary precision, you can choose a different type variant by importing a submodule:

```python
import pyqbpp as qbpp              # Default: c32e64 (32-bit coeff, 64-bit energy)
import pyqbpp.cppint as qbpp       # Arbitrary precision (cpp_int) for very large coefficients
```

The following type variants are available:

| Import | Coefficient | Energy | Use case |
|---|---|---|---|
| `import pyqbpp` | 32-bit | 64-bit | Default; most common choice |
| `import pyqbpp.c32e64` | 32-bit | 64-bit | Same as default |
| `import pyqbpp.c64e64` | 64-bit | 64-bit | Large coefficients |
| `import pyqbpp.c64e128` | 64-bit | 128-bit | Large energy range |
| `import pyqbpp.c128e128` | 128-bit | 128-bit | Very large problems |
| `import pyqbpp.cppint` | unlimited | unlimited | Arbitrary precision |

Each type variant is also available with a VarArray mode suffix (e.g., `import pyqbpp.c32e64m4`).
The mode controls internal variable storage:

| Suffix | Max degree | Description |
|---|---|---|
| `m0` (or no suffix) | unlimited | Variable-length (default) |
| `m2` | 2 | Fixed-length, QUBO only (fastest) |
| `m4` | 4 | Fixed-length, up to degree 4 |
| `m6` | 6 | Fixed-length, up to degree 6 |

```python
import pyqbpp.c32e64m4 as qbpp   # degree 4, fastest
import pyqbpp.c32e64m2 as qbpp   # QUBO only
import pyqbpp as qbpp             # default (m0, any degree)
```

> **NOTE**
> The type variant must be chosen at import time and cannot be changed afterward.
> All variables, expressions, and solvers within a program use the same type.

### Example with arbitrary precision
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
