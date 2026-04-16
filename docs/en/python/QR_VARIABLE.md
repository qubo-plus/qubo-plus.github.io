---
layout: default
nav_exclude: true
title: "QR: Variables"
nav_order: 30
lang: en
hreflang_alt: "ja/python/QR_VARIABLE"
hreflang_lang: "ja"
---

# Quick Reference: Variables and Expressions
## Data types in PyQBPP
In user code, PyQBPP represents coefficients, energy values, and constants as Python's
native `int`, so you don't need to worry about `coeff_t` or `energy_t`.
Internally, however, PyQBPP uses the same shared-library variants as the C++ version,
and the variant is **chosen at import time** by selecting a submodule.
The default `import pyqbpp` corresponds to `c32e64` — 32-bit coefficients and 64-bit energy.

```python
import pyqbpp as qbpp              # default: c32e64
import pyqbpp.cppint as qbpp       # arbitrary precision (cpp_int)
import pyqbpp.c32e64m4 as qbpp     # c32e64 with fixed-length up to degree 4
```

Available type variants:

| Import | Coefficient | Energy | Use case |
|---|---|---|---|
| `import pyqbpp` / `pyqbpp.c32e64` | 32-bit | 64-bit | Default, most common |
| `import pyqbpp.c32e32` | 32-bit | 32-bit | Small problems |
| `import pyqbpp.c64e64` | 64-bit | 64-bit | Larger coefficients |
| `import pyqbpp.c64e128` | 64-bit | 128-bit | Larger energy range |
| `import pyqbpp.c128e128` | 128-bit | 128-bit | Very large problems |
| `import pyqbpp.cppint` | unlimited | unlimited | Arbitrary precision (`cpp_int`) |

Each variant can also be combined with a VarArray mode suffix `m0` / `m2` / `m4` / `m6`,
which controls how each `qbpp::Term` stores its variables
(e.g. `import pyqbpp.c32e64m4 as qbpp`):

| Suffix | Max degree | Description |
|---|---|---|
| (none) / `m0` | unlimited | Variable-length (default; heap allocation for degree 3+) |
| `m2` | 2 | Fixed-length, QUBO only (no heap allocation, fastest) |
| `m4` | 4 | Fixed-length, up to degree 4 (no heap allocation) |
| `m6` | 6 | Fixed-length, up to degree 6 (no heap allocation) |

The type variant is chosen at import time and cannot be changed at runtime.
See [VAREXPR](VAREXPR) for details.

## Printing objects
All PyQBPP objects can be printed using `print()` or converted to strings using `str()`:
```python
print(obj)
s = str(obj)
```

## Variable classes
- **`pyqbpp.Var`**:
  A class that holds a unique 32-bit integer ID.
  The variable name can be retrieved via `str(x)`.

> **NOTE**
> A `pyqbpp.Var` object represents a variable symbolically.
> No specific data type is associated with it.
> It can be used to represent binary, spin, or other types of variables.

### Variable creation functions
The following functions are provided to create variables:

- **`pyqbpp.var("name")`**:
  Creates a `pyqbpp.Var` object with the given name `"name"`.

- **`pyqbpp.var("name", shape=s1)`**:
  Creates a one-dimensional array of `pyqbpp.Var` objects with the base name `"name"`.
  Each element is represented as `name[i]`.
  The resulting type is `pyqbpp.Array`.

- **`pyqbpp.var("name", shape=(s1, s2))`**:
  Creates a two-dimensional array (matrix) of `pyqbpp.Var` objects with the base name `"name"`.
  Each element is represented as `name[i][j]`.
  The resulting type is a nested `pyqbpp.Array`.

- **`pyqbpp.var("name", shape=(s1, s2, ...))`**:
  Creates a higher-dimensional array of `pyqbpp.Var` objects with the base name `"name"`.
  Each element is represented as `name[i][j]...`.
  The resulting type is a nested `pyqbpp.Array`.

> **NOTE**
> If `"name"` is omitted, numbered names such as `"{0}"`, `"{1}"`, ... are automatically assigned in creation order.

### Examples
```python
import pyqbpp as qbpp

x = qbpp.var("x")              # Single variable named "x"
y = qbpp.var("y", shape=3)     # Array: y[0], y[1], y[2]
z = qbpp.var("z", shape=(2, 3))  # 2x3 matrix: z[0][0], ..., z[1][2]
a = qbpp.var()                 # Single unnamed variable
b = qbpp.var(shape=5)          # Array of 5 unnamed variables
```

## `pyqbpp.Var` properties and methods
For a `pyqbpp.Var` instance `x`, the following are available:

- **`str(x)`**:
  Returns the name of `x` as a string.

## Integer variable class
- **`pyqbpp.VarInt`**:
  A class derived from `pyqbpp.Expr` that represents an integer variable with a specified range.

### Integer variable creation functions
The following functions are provided to create integer variables:

- **`pyqbpp.var("name", between=(l, u))`**:
  Here, `l` and `u` must be integers.
  This expression creates a `pyqbpp.VarInt` object with the name `"name"`,
  which internally contains a `pyqbpp.Expr` object representing all integers in the range `[l, u]`.
  Internally, this also creates `pyqbpp.Var` objects used in the underlying expression.

- **`pyqbpp.var("name", shape=s1, between=(l, u))`**:
  Creates a one-dimensional array of `pyqbpp.VarInt` objects with the base name `"name"`
  and the same range `[l, u]`.
  Each element is represented as `name[i]`.
  The resulting type is `pyqbpp.Array`.
  Higher-dimensional arrays of `pyqbpp.VarInt` objects can be created in the same way as `pyqbpp.Var` objects.

### Examples
```python
import pyqbpp as qbpp

x = qbpp.var("x", between=(0, 10))                    # Integer variable x in [0, 10]
y = qbpp.var("y", shape=3, between=(-5, 5))           # Array of 3 integer variables in [-5, 5]
z = qbpp.var("z", shape=(2, 3), between=(1, 8))       # 2x3 matrix of integer variables in [1, 8]
```

### Integer variable properties
For a `pyqbpp.VarInt` instance `x`, the following are available:

- **`x.min_val`** (property):
  Returns the minimum value `l` of `x`.

- **`x.max_val`** (property):
  Returns the maximum value `u` of `x`.

- **`x.vars`** (property):
  Returns the list of `pyqbpp.Var` objects used to represent the integer variable.

- **`x.coeffs`** (property):
  Returns a list of integer coefficients.

The following expression is equivalent to the expression stored in `x`:
```python
x.min_val + qbpp.sum(x.vars * x.coeffs)
```
