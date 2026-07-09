---
layout: default
nav_exclude: true
title: "Reference Variables"
nav_order: 30
lang: en
hreflang_alt: "ja/QR_VARIABLE"
hreflang_lang: "ja"
---

# Quick Reference: Variables and Expressions

## Data types used in `qbpp::Expr`
- **`coeff_t`**:
  The integer data type used for coefficients in `qbpp::Term` objects. The default is `int32_t`.
- **`energy_t`**:
  The integer data type used to compute energy values of `qbpp::Expr` objects,
  as well as for integer constant terms in `qbpp::Expr`. The default is `int64_t`.
  The bit width of `energy_t` is guaranteed to be equal to or larger than that of `coeff_t`.

These types come as prebuilt shared-library variants. Select one by defining one of the
following `INTEGER_TYPE_*` shorthand macros before including the header (or pass it as a
compiler flag `-D...`):

| Macro | `coeff_t` | `energy_t` |
|---|---|---|
| `INTEGER_TYPE_C32E32` | `int32_t` | `int32_t` |
| `INTEGER_TYPE_C32E64` (default) | `int32_t` | `int64_t` |
| `INTEGER_TYPE_C64E64` | `int64_t` | `int64_t` |
| `INTEGER_TYPE_C64E128` | `int64_t` | `int128_t` |
| `INTEGER_TYPE_C128E128` | `int128_t` | `int128_t` |
| `INTEGER_TYPE_CPP_INT` | `cpp_int` | `cpp_int` |

> **NOTE — Overflow.** `coeff_t` bounds each coefficient and `energy_t` bounds the accumulated energy (the sum of active terms). A fixed-width type does **not** detect overflow: if the total energy exceeds `energy_t`, it silently wraps around, exactly like built-in C++ integer arithmetic. Choose a variant whose `energy_t` covers your worst-case energy; `INTEGER_TYPE_CPP_INT` (arbitrary precision) never overflows.

### Real (double) coefficients

Coefficients can also be **`double`** (real numbers). Define one of the following `DOUBLE_TYPE*`
macros instead of `INTEGER_TYPE_*`; `coeff_t` and `energy_t` then both become `double`:

| Macro | `coeff_t` | `energy_t` | Solved with |
|---|---|---|---|
| `DOUBLE_TYPE` (= `DOUBLE_TYPE_C64E64`) | `double` | `double` | 64-bit integer solver |
| `DOUBLE_TYPE_C128E128` | `double` | `double` | 128-bit integer solver (higher precision) |

```cpp
#define DOUBLE_TYPE
#include <qbpp/qbpp.hpp>

auto x = qbpp::var("x");
auto y = qbpp::var("y");
qbpp::Expr f = -1.5 * x - 2.5 * y + 4.0 * x * y;   // real (double) coefficients
```

- Expressions are built, simplified, and evaluated entirely in `double`;
  `sol.energy()` returns a `double`.
- When a problem is solved, the coefficients are **automatically scaled to integers** and handed
  to the integer solver listed above — no manual quantization is needed.
- Dyadic coefficients (1, 1/2, 1/4, ...) are represented exactly. A coefficient vastly smaller
  than the largest one may fall below the scaling precision and is then dropped with a short
  notice; `DOUBLE_TYPE_C128E128` gives a much wider dynamic range.
- Division (`/`, `/=`) is real division — the divisibility requirement of the integer
  variants does not apply.
- `MAXDEG*` can be combined as with the integer variants (e.g. `DOUBLE_TYPE` + `MAXDEG2`).
- Constant arrays and `qbpp::einsum` accept `double` values as well
  (see [MULTIDIM](MULTIDIM) / [EINSUM](EINSUM)).

See [Real (double) Coefficients](VAREXPR#real-double-coefficients) for details.

In addition, the `MAXDEG*` macro controls how each `qbpp::Term` stores its variables.
Fixed-length modes eliminate heap allocation and improve performance when the maximum degree
is known in advance:

| Macro | Max degree | Description |
|---|---|---|
| `MAXDEG0` (default) | unlimited | Variable-length (heap allocation for degree 3+) |
| `MAXDEG2` | 2 | Fixed-length, QUBO only (no heap allocation, fastest) |
| `MAXDEG4` | 4 | Fixed-length, up to degree 4 (no heap allocation) |

`INTEGER_TYPE_*` and `MAXDEG*` can be combined independently. See [VAREXPR](VAREXPR) for details.

> **WARNING**
> To maximize performance, QUBO++ does not check for arithmetic overflow.
> During development and testing, it is recommended to use wider bit widths for
> `coeff_t` and `energy_t`.
> If the required bit widths are unclear, use `qbpp::cpp_int` to ensure correctness,
> and switch to fixed-width integer types after validation.

## Printing class objects
Most classes in QUBO++ can be printed using the `<<` operator with `std::ostream`,
which is useful for debugging.
For example, an object `obj` in QUBO++ can be printed to `std::cout` as follows:
```cpp
std::cout << obj << std::endl;
```
This design allows easy inspection of internal states without relying on a debugger.


## Variable classes
- **`qbpp::Var`**:
  A class that holds a unique 32-bit integer ID.
  The variable name is stored in a global registry and can be inspected via `std::cout << x`.


> **NOTE**
> A `qbpp::Var` object represents a variable symbolically.
> No specific data type is associated with it.
> It can be used to represent binary, spin, or other types of variables.

### Variable creation functions
The following functions are provided to create variables:

- **`qbpp::var("name")`**:
  Creates a `qbpp::Var` object with the given name `"name"`.

- **`qbpp::var("name", s1)`**:
  Creates a 1-dimensional variable array with the base name `"name"`.
  Each element is represented as `name[i]`.

- **`qbpp::var("name", s1, s2)`**:
  Creates a 2-dimensional variable array (matrix) with the base name `"name"`.
  Each element is represented as `name[i][j]`.

- **`qbpp::var("name", s1, s2, ...)`**:
  Creates an N-dimensional variable array with the base name `"name"`, where `N` is the number of dimensions.
  Each element is represented as `name[i][j]...`.

> **NOTE**
> If `"name"` is omitted, numbered names such as `"{0}"`, `"{1}"`, ... are automatically assigned in creation order.

## `qbpp::Var` member functions
For a `qbpp::Var` instance `x`, the following member functions are available:

- **`uint32_t x.index()`**:
  Returns the unique integer ID of `x`.

Usually, there is no need to call these member functions explicitly in QUBO++ programs.

## Integer variables
An **integer variable** is a `qbpp::Expr` carrying range and binary-decomposition metadata; it represents an integer value in a specified range.

### Integer variable creation functions
The following functions are provided to create integer variables:

- **`qbpp::var_int("name")`**:
  Returns an internally used helper object and does not create an integer variable by itself.
  To define an integer variable, the range must be specified using the `<=` operator, as shown below.

- **`l <= qbpp::var_int("name") <= u`**:
  Here, `l` and `u` must be integers.
  This expression creates a `qbpp::Expr` integer variable with the name `"name"`,
  whose held expression represents all integers in the range `[l, u]`.
  Internally, this also creates `qbpp::Var` objects used in the underlying expression.

- **`l <= qbpp::var_int("name", s1) <= u`**:
  Creates a 1-dimensional array (vector) of integer-variable `qbpp::Expr` objects with the base name `"name"`
  and the same range `[l, u]`.
  Each element is represented as `name[i]`.
  Higher-dimensional arrays of integer variables can be created in the same way as `qbpp::Var` objects.

### Integer variable member functions
For an integer variable `x` (a `qbpp::Expr`), the following member functions are available:

- **`energy_t x.min_val()`**:
  Returns the minimum value `l` of `x`.

- **`energy_t x.max_val()`**:
  Returns the maximum value `u` of `x`.

- **`Array<1, Var> x.vars()`**:
  Returns the `qbpp::Var` object array used to represent the integer variable.

- **`Array<1, coeff_t> x.coeffs()`**:
  Returns the integer coefficient array.

The following expression is equivalent to the expression stored in `x`:
```cpp
qbpp::sum(x.coeffs() * x.vars()) + x.min_val()
```
