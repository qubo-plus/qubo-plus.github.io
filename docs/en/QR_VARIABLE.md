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
| (default) | `int32_t` | `int64_t` |
| `INTEGER_TYPE_C64E64` | `int64_t` | `int64_t` |
| `INTEGER_TYPE_C64E128` | `int64_t` | `int128_t` |
| `INTEGER_TYPE_C128E128` | `int128_t` | `int128_t` |
| `INTEGER_TYPE_CPP_INT` | `cpp_int` | `cpp_int` |

In addition, the `MAXDEG*` macro controls how each `qbpp::Term` stores its variables.
Fixed-length modes eliminate heap allocation and improve performance when the maximum degree
is known in advance:

| Macro | Max degree | Description |
|---|---|---|
| `MAXDEG0` (default) | unlimited | Variable-length (heap allocation for degree 3+) |
| `MAXDEG2` | 2 | Fixed-length, QUBO only (no heap allocation, fastest) |
| `MAXDEG4` | 4 | Fixed-length, up to degree 4 (no heap allocation) |
| `MAXDEG6` | 6 | Fixed-length, up to degree 6 (no heap allocation) |

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

## Integer variable class
- **`qbpp::VarInt`**:
  A class derived from `qbpp::Expr` that represents an integer variable with a specified range.

### Integer variable creation functions
The following functions are provided to create integer variables:

- **`qbpp::var_int("name")`**:
  Returns an internally used helper object and does not create a `qbpp::VarInt` by itself.
  To define a `qbpp::VarInt`, the range must be specified using the `<=` operator, as shown below.

- **`l <= qbpp::var_int("name") <= u`**:
  Here, `l` and `u` must be integers.
  This expression creates a `qbpp::VarInt` object with the name `"name"`,
  which internally contains a `qbpp::Expr` object representing all integers in the range `[l, u]`.
  Internally, this also creates `qbpp::Var` objects used in the underlying expression.

- **`l <= qbpp::var_int("name", s1) <= u`**:
  Creates a 1-dimensional array (vector) of `qbpp::VarInt` objects with the base name `"name"`
  and the same range `[l, u]`.
  Each element is represented as `name[i]`.
  Higher-dimensional arrays of `qbpp::VarInt` can be created in the same way as `qbpp::Var` objects.

### Integer variable member functions
For a `qbpp::VarInt` instance `x`, the following member functions are available:

- **`std::string x.name()`**:
  Returns the name of `x`.

- **`energy_t x.min_val`**:
  Returns the minimum value `l` of `x`.

- **`energy_t x.max_val`**:
  Returns the maximum value `u` of `x`.

- **`x.vars`**:
  Returns the `qbpp::Var` object array used to represent the integer variable.

- **`x.coeffs`**:
  Returns the integer coefficient array.

The following expression is equivalent to the expression stored in `x`:
```cpp
x.min_val + qbpp::sum(x.coeffs * x.vars)
```
