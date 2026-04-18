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
The data type of the integer coefficient is defined by the `COEFF_TYPE` macro, whose default value is `int32_t`.
Each `qbpp::Term` stores its variables using a static array (inline buffer of 2 elements) combined with dynamic allocation for higher-degree terms, allowing terms of arbitrary degree with no upper limit.
- **`qbpp::Expr`**: Represents an expanded expression consisting of an integer constant term and zero or more `qbpp::Term` objects.
The data type of the integer constant term is defined by the `ENERGY_TYPE` macro, whose default value is `int64_t`.

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
f = 1 -x +2*x*y
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
f = 1 -x +2*x*y
t = 6*x*y*x
f = 1 -x +2*x*y +2*y
```
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

## Integer Ranges: COEFF_TYPE and ENERGY_TYPE
The macros **`COEFF_TYPE`** and **`ENERGY_TYPE`** define the data types used for coefficients and energy values in expressions.
The `ENERGY_TYPE` macro is also used as the data type for the integer constant term of a `qbpp::Expr` object.
The following types can be specified:

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
| (default) | `int32_t` | `int64_t` |
| `INTEGER_TYPE_C64E64` | `int64_t` | `int64_t` |
| `INTEGER_TYPE_C64E128` | `int64_t` | `int128_t` |
| `INTEGER_TYPE_C128E128` | `int128_t` | `int128_t` |
| `INTEGER_TYPE_CPP_INT` | `cpp_int` | `cpp_int` |

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
