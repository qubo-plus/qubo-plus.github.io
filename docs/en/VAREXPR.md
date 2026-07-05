---
layout: default
nav_exclude: true
title: "Variable and Expression Classes"
nav_order: 10
lang: en
hreflang_alt: "ja/VAREXPR"
hreflang_lang: "ja"
---

# Variable and Expression Classes

## qbpp::Var, qbpp::Term, and qbpp::Expr classes

QUBO++ provides the following fundamental classes:
- **`qbpp::Var`**: Represents a variable symbolically and is associated with a string used for display.
Internally, a 32-bit unsigned integer is used as its identifier.
- **`qbpp::Term`**: Represents a product term consisting of an integer coefficient and one or more `qbpp::Var` objects.
The coefficient type is `qbpp::coeff_t` (default `int32_t`); it is selected at build time via one of the `INTEGER_TYPE_*` macros (see below).
Each `qbpp::Term` stores its variables using a static array (inline buffer of 2 elements) combined with dynamic allocation for higher-degree terms, allowing terms of arbitrary degree with no upper limit in the default variable-length mode (see the fixed-length VarArray modes below).
- **`qbpp::Expr`**: Represents an expanded expression consisting of an integer constant term and zero or more `qbpp::Term` objects.
The constant-term type is `qbpp::energy_t` (default `int64_t`), also selected at build time via the `INTEGER_TYPE_*` macros.

In the following program, **`x`** and **`y`** are `qbpp::Var` objects, **`t`** is a `qbpp::Term` object, and **`f`** is a `qbpp::Expr` object:
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto y = qbpp::var("y");
  auto t = 2 * x * y;
  auto f = t - x + 1;

  std::cout << "x = " << x << std::endl;
  std::cout << "y = " << y << std::endl;
  std::cout << "t = " << t << std::endl;
  std::cout << "f = " << f << std::endl;
}
```
This program produces the following output:
```
x = x
y = y
t = 2*x*y
f = 1 +2*x*y -x
```
If the data types are to be explicitly specified, the program can be rewritten as follows:
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  qbpp::Var x = qbpp::var("x");
  qbpp::Var y = qbpp::var("y");
  qbpp::Term t = 2 * x * y;
  qbpp::Expr f = t - x + 1;

  std::cout << "x = " << x << std::endl;
  std::cout << "y = " << y << std::endl;
  std::cout << "t = " << t << std::endl;
  std::cout << "f = " << f << std::endl;
}
```
`qbpp::Var` objects are **immutable** and cannot be updated after creation.
In contrast, `qbpp::Term` and `qbpp::Expr` objects are **mutable** and can be updated via assignment.

For example, as shown in the following program, compound assignment operators can be used to update `qbpp::Term` and `qbpp::Expr` objects:
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  qbpp::Var x = qbpp::var("x");
  qbpp::Var y = qbpp::var("y");
  qbpp::Term t = 2 * x * y;
  qbpp::Expr f = t - x + 1;

  std::cout << "t = " << t << std::endl;
  std::cout << "f = " << f << std::endl;

  t *= 3 * x;
  f += 2 * y;

  std::cout << "t = " << t << std::endl;
  std::cout << "f = " << f << std::endl;
}
```
This program prints the following output:
```
t = 2*x*y
f = 1 +2*x*y -x
t = 6*x*y*x
f = 1 +2*x*y -x +2*y
```

### Aliasing and Copying

C++ uses **value semantics** by default. Assigning one `qbpp::Term` or
`qbpp::Expr` to another performs a deep copy, producing two independent
objects:
```cpp
qbpp::Expr f = x;
qbpp::Expr g = f;   // independent copy
f += y;
std::cout << "f = " << f << std::endl;   // f = x +y
std::cout << "g = " << g << std::endl;   // g = x   (unaffected)
```
`f = f + x` and `f += x` produce the same observable result — both update `f`
and leave any other object alone. Their difference is purely in performance:
the compiler picks an in-place rvalue overload for binary `+` to avoid
unnecessary copies when the left-hand side is a temporary.

The Python frontend (PyQBPP) follows different rules due to Python's reference
semantics — see [C++ vs Python](CPP_VS_PYTHON#object-copy-and-aliasing) for a
side-by-side comparison.

In most cases, there is no need to explicitly use `qbpp::Term` objects.
They should only be used when maximum performance optimization is required.

However, note that `auto` type deduction may create a `qbpp::Term` object, which cannot store general expressions.
For example, the following program results in a compilation error because an expression is assigned to a `qbpp::Term` object:
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto y = qbpp::var("y");

  auto t = 2 * x * y;
  t = x + 1;
}
```
If a `qbpp::Expr` object is intended, **`qbpp::toExpr()`** can be used to explicitly construct one, as shown below:
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto y = qbpp::var("y");
  auto t = qbpp::toExpr(2 * x * y);
  auto f = qbpp::toExpr(1);

  t += x + 1;
  f += t;

  std::cout << "t = " << t << std::endl;
  std::cout << "f = " << f << std::endl;
}
```
In this program, both **`t`** and **`f`** are `qbpp::Expr` objects and can store general expressions.
In particular, `f` is created as a `qbpp::Expr` object containing only a constant term with value `1` and no product terms.

## Integer Ranges: coeff_t and energy_t
The type aliases **`qbpp::coeff_t`** and **`qbpp::energy_t`** determine the data types used for coefficients and energy values in expressions.
`qbpp::energy_t` is also the data type of the integer constant term of a `qbpp::Expr` object.
The following types can be chosen:

| Type | Range | Large constant syntax |
|------|-------|-----------------------|
| `int32_t` | ±2.1×10⁹ | `12345` (integer literal) |
| `int64_t` | ±9.2×10¹⁸ | `1234567890123456789LL` |
| `qbpp::int128_t` | ±1.7×10³⁸ | `qbpp::integer("12345678901234567890")` |
| `qbpp::cpp_int` | unlimited | `qbpp::integer("...")` |

The type **`qbpp::cpp_int`** represents an integer with an arbitrary number of digits.
The helper function **`qbpp::integer("...")`** parses a decimal string into the current `coeff_t` type,
so the same source code works unchanged for any build from `int32_t` through `cpp_int`.

By default, `coeff_t` is `int32_t` and `energy_t` is `int64_t`.
To use a different type, define one of the following macros before including the header (or pass as a compiler flag `-D...`):

| Macro | `coeff_t` | `energy_t` |
|---|---|---|
| `INTEGER_TYPE_C32E32` | `int32_t` | `int32_t` |
| `INTEGER_TYPE_C32E64` (default) | `int32_t` | `int64_t` |
| `INTEGER_TYPE_C64E64` | `int64_t` | `int64_t` |
| `INTEGER_TYPE_C64E128` | `int64_t` | `int128_t` |
| `INTEGER_TYPE_C128E128` | `int128_t` | `int128_t` |
| `INTEGER_TYPE_CPP_INT` | `cpp_int` | `cpp_int` |

### Real (double) Coefficients

Coefficients and energy values can also be **`double`**. Define one of the following macros before
including the header (or pass it as a compiler flag `-D...`):

| Macro | Solved with |
|---|---|
| `DOUBLE_TYPE` (default double) | 64-bit integer solver |
| `DOUBLE_TYPE_C64E64` | 64-bit integer solver |
| `DOUBLE_TYPE_C128E128` | 128-bit integer solver (higher precision) |

```cpp
#define DOUBLE_TYPE
#include <qbpp/qbpp.hpp>

auto x = qbpp::var("x");
auto y = qbpp::var("y");
qbpp::Expr f = -1.5 * x - 2.5 * y + 4.0 * x * y;   // real (double) coefficients
```

Expressions are built and simplified in `double`. When a problem is solved, QUBO++ automatically scales
the coefficients to integers, solves with the integer solver, and returns the energy as a `double`
(for example, `sol.energy()` returns a `double`) — so you work entirely in `double` without dealing with
the integer backend. Dyadic coefficients (1, 1/2, 1/4, …) are represented exactly.

A coefficient that is vastly smaller than the largest one may fall below the scaling precision; it is then
treated as `0` and its term is dropped (QUBO++ prints a short notice rather than failing). A variable left
without any term has no effect on the objective — reading it from the solution (`sol(x)`, `sol(x[i])`)
returns `0`, and `sol.has(x[i])` reports whether it is still present. The same holds for a variable that
cancels out during `simplify_as_binary`. For a wider dynamic range use `DOUBLE_TYPE_C128E128`; a genuine
overflow of the energy range is still reported as an error.

### VarArray Mode

The `MAXDEG` macro controls how variables within each term are stored internally.
Fixed-length modes eliminate heap allocation and improve performance when the maximum degree is known:

| Macro | Max degree | Description |
|---|---|---|
| `MAXDEG0` (default) | unlimited | Variable-length (heap allocation for degree 3+) |
| `MAXDEG2` | 2 | Fixed-length, QUBO only (no heap allocation, fastest) |
| `MAXDEG4` | 4 | Fixed-length, up to degree 4 (no heap allocation) |
| `MAXDEG6` | 6 | Fixed-length, up to degree 6 (no heap allocation) |

Example — selecting both type and VarArray mode:
```cpp
#define INTEGER_TYPE_C32E32
#define MAXDEG2
#include <qbpp/qbpp.hpp>
```

The appropriate library is automatically loaded at runtime based on the specified macros.

### Large constants: qbpp::integer()
Constant values that exceed the 64-bit integer range are specified by passing a decimal string
to the helper function **`qbpp::integer("...")`**.
It parses the string into the current `coeff_t` type (`int32_t` through `cpp_int`),
so the same source code works for every build.
If the value does not fit in `coeff_t`, `std::out_of_range` is thrown.

Small values such as `qbpp::integer("0")` and `qbpp::integer("-1")` are accepted as well.
However, the string-to-value conversion happens **at runtime**, so for values that fit in
`int64_t` (±9.2×10¹⁸) it is more efficient to use ordinary integer literals (e.g., `12345`,
`1234567890123456789LL`).
When the same string appears inside a hot loop, bind it once to a variable to avoid repeated
parse overhead:
```cpp
const auto K = qbpp::integer("1000000000000");  // parsed once
for (int i = 0; i < n; ++i) f += K * x[i];
```

> **Note**:
> Standard integer literals (e.g., `12345`) and 64-bit literals with the `LL` suffix can be used directly
> with any type via implicit conversion.
> `qbpp::integer()` is only needed when the value exceeds the `int64_t` range.

### Example with 128-bit integers

The following program creates a `qbpp::Expr` object with coefficients exceeding 64-bit range:
```cpp
#define INTEGER_TYPE_C128E128

#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto y = qbpp::var("y");
  auto f = qbpp::integer("12345678901234567890") * x +
           qbpp::integer("98765432109876543210") * y;
  std::cout << "f = " << f << std::endl;
}
```
This program produces the following output:
```
f = 12345678901234567890*x +98765432109876543210*y
```

### Example with arbitrary-precision integers (cpp_int)

The following program creates a `qbpp::Expr` object with very large coefficient and constant terms:
```cpp
#define INTEGER_TYPE_CPP_INT

#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto f = qbpp::integer("123456789012345678901234567890") * x +
           qbpp::integer("987654321098765432109876543210");
  std::cout << "f = " << f << std::endl;
}
```
This program produces the following output:
```
f = 987654321098765432109876543210 +123456789012345678901234567890*x
```
