---
layout: default
nav_exclude: true
title: "Data Types"
nav_order: 10
lang: en
hreflang_alt: "ja/python/VAREXPR"
hreflang_lang: "ja"
---

# Variable and Expression Classes

## Var and Expr classes

PyQBPP provides two main classes for building QUBO/HUBO expressions:
- **`Var`**: Represents a binary variable, associated with a display name.
- **`Expr`**: Represents an expression consisting of an integer constant and zero or more product terms.

`Var` objects are created using `qbpp.var()` and are **immutable**.
Expressions are built from variables using arithmetic operators (`+`, `-`, `*`) and are **mutable** via compound assignment operators such as `+=`.

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
> PyQBPP uses the C++ QUBO++ library as its backend, which internally distinguishes between `Term` (a single product term like `2*x*y`) and `Expr` (a sum of terms).
> In PyQBPP, however, you do not need to be aware of this distinction.
> Python's dynamic typing automatically converts between types as needed, so you can simply write expressions naturally.

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
| `import pyqbpp.c16e32` | 16-bit | 32-bit | Small problems |
| `import pyqbpp.c32e64` | 32-bit | 64-bit | Same as default |
| `import pyqbpp.c64e64` | 64-bit | 64-bit | Large coefficients |
| `import pyqbpp.c64e128` | 64-bit | 128-bit | Large energy range |
| `import pyqbpp.c128e128` | 128-bit | 128-bit | Very large problems |
| `import pyqbpp.cppint` | unlimited | unlimited | Arbitrary precision |

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
