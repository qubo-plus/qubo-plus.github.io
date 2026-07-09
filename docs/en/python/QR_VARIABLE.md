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
Internally, however, PyQBPP offers multiple shared-library variants,
and the variant is **chosen at import time** by selecting a submodule.
The default `import pyqbpp` corresponds to `c32e64` — 32-bit coefficients and 64-bit energy.

```python
import pyqbpp as qbpp                # default: c32e64
# import pyqbpp.cppint as qbpp       # arbitrary precision (cpp_int)
# import pyqbpp.c32e64m4 as qbpp     # c32e64 with fixed-length up to degree 4
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

> **NOTE — Overflow.** The coefficient width bounds each coefficient and the energy width bounds the accumulated energy (the sum of active terms). A fixed-width variant does **not** detect overflow: if the total energy exceeds the energy width, it silently wraps around. Use a wider variant (or `pyqbpp.cppint`, arbitrary precision) when the energy can be large.

### Real (double) coefficients

Coefficients can also be **`double`** (Python `float`). Import one of the following submodules
instead of an integer variant:

| Import | Coefficient | Energy | Solved with |
|---|---|---|---|
| `import pyqbpp.d` / `pyqbpp.double` / `pyqbpp.dc64e64` | `float` | `float` | 64-bit integer solver |
| `import pyqbpp.dc128e128` | `float` | `float` | 128-bit integer solver (higher precision) |

```python
import pyqbpp.d as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = -1.5 * x - 2.5 * y + 4.0 * x * y          # real (float) coefficients
```

- Expressions are built, simplified, and evaluated entirely in `float`;
  `sol.energy` is a `float`.
- When a problem is solved, the coefficients are **automatically scaled to integers** and handed
  to the integer solver listed above — no manual quantization is needed.
- Dyadic coefficients (1, 1/2, 1/4, ...) are represented exactly. A coefficient vastly smaller
  than the largest one may fall below the scaling precision and is then dropped with a short
  notice; `pyqbpp.dc128e128` gives a much wider dynamic range.
- Division (`/`, `/=`) is real division — the divisibility requirement of the integer
  variants does not apply.
- The VarArray mode suffix can be combined as usual (e.g. `import pyqbpp.dc64e64m2`).
- `qbpp.array()`, `qbpp.einsum()`, and the element-wise array operators accept `float` lists and
  **numpy ndarrays** directly (see [MULTIDIM](MULTIDIM) / [EINSUM](EINSUM)).

See [Real (double) coefficients](VAREXPR#real-double-coefficients) for details.

Each variant can also be combined with a VarArray mode suffix `m0` / `m2` / `m4`,
which controls how each `qbpp::Term` stores its variables
(e.g. `import pyqbpp.c32e64m4 as qbpp`):

| Suffix | Max degree | Description |
|---|---|---|
| (none) / `m0` | unlimited | Variable-length (default; heap allocation for degree 3+) |
| `m2` | 2 | Fixed-length, QUBO only (no heap allocation, fastest) |
| `m4` | 4 | Fixed-length, up to degree 4 (no heap allocation) |

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
  Creates a one-dimensional array of binary variables with the base name `"name"`.
  Each element is represented as `name[i]`.

- **`pyqbpp.var("name", shape=(s1, s2))`**:
  Creates a two-dimensional array (matrix) of binary variables with the base name `"name"`.
  Each element is represented as `name[i][j]`.

- **`pyqbpp.var("name", shape=(s1, s2, ...))`**:
  Creates a higher-dimensional array of binary variables with the base name `"name"`.
  Each element is represented as `name[i][j]...`.

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

## Integer variables
An **integer variable** is a `pyqbpp.Expr` carrying range and binary-decomposition metadata; it represents an integer value in a specified range.

### Integer variable creation functions
The following functions are provided to create integer variables:

- **`pyqbpp.var("name", between=(l, u))`**:
  Here, `l` and `u` must be integers.
  This expression creates a `pyqbpp.Expr` integer variable with the name `"name"`,
  whose held expression represents all integers in the range `[l, u]`.
  Internally, this also creates `pyqbpp.Var` objects used in the underlying expression.

- **`pyqbpp.var("name", shape=s1, between=(l, u))`**:
  Creates a one-dimensional array of integer variables with the base name `"name"`
  and the same range `[l, u]`.
  Each element is represented as `name[i]`.
  Higher-dimensional arrays of integer variables can be created in the same way as binary variables.

### Examples
```python
import pyqbpp as qbpp

x = qbpp.var("x", between=(0, 10))                    # Integer variable x in [0, 10]
y = qbpp.var("y", shape=3, between=(-5, 5))           # Array of 3 integer variables in [-5, 5]
z = qbpp.var("z", shape=(2, 3), between=(1, 8))       # 2x3 matrix of integer variables in [1, 8]
```

### Integer variable properties
For an integer variable `x` (a `pyqbpp.Expr`), the following are available:

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
x.min_val + sum(v * c for v, c in zip(x.vars, x.coeffs))
```
