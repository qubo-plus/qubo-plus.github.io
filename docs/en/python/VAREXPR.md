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
By default, `import pyqbpp` uses **arbitrary-precision integers** (`cpp_int`) for all coefficients and energy values.
This ensures correctness for any problem size without worrying about overflow.

For better performance, you can choose a fixed-precision type variant by importing a submodule:

```python
import pyqbpp as qbpp              # Default: arbitrary precision (cpp_int)
import pyqbpp.c32e64 as qbpp      # 32-bit coefficients, 64-bit energy (fastest for most problems)
```

The following type variants are available:

| Import | Coefficient | Energy | Use case |
|---|---|---|---|
| `import pyqbpp` | unlimited | unlimited | Development and validation |
| `import pyqbpp.c16e32` | 16-bit | 32-bit | Small problems |
| `import pyqbpp.c32e64` | 32-bit | 64-bit | Most common choice |
| `import pyqbpp.c64e64` | 64-bit | 64-bit | Large coefficients |
| `import pyqbpp.c64e128` | 64-bit | 128-bit | Large energy range |
| `import pyqbpp.c128e128` | 128-bit | 128-bit | Very large problems |

> **NOTE**
> The type variant must be chosen at import time and cannot be changed afterward.
> All variables, expressions, and solvers within a program use the same type.

### Example with arbitrary precision (default)
```python
import pyqbpp as qbpp

x = qbpp.var("x")
f = 123456789012345678901234567890 * x + 987654321098765432109876543210
print("f =", f)
```
This program produces the following output:
```
f = 987654321098765432109876543210 +123456789012345678901234567890*x
```
