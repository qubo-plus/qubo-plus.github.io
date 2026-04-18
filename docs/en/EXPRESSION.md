---
layout: default
nav_exclude: true
title: "Expression Classes"
nav_order: 15
lang: en
hreflang_alt: "ja/EXPRESSION"
hreflang_lang: "ja"
---

# Expression Classes
The most important feature of QUBO++ is its ability to create expressions for solving combinatorial optimization problems.
The following three classes are used for this purpose:

| Class | Contains | Details |
|------|-----|-----|
| `qbpp::Var` | A variable  |  a 32-bit ID and a string to display |
| `qbpp::Term` | A product term | Zero or more variables and an integer coefficient |
| `qbpp::Expr` | An expression | Zero ore moter terms and an integer constant term |

In addition, QUBO++ provides two related classes built on top of `qbpp::Expr`:

| Class | Contains | Details |
|------|-----|-----|
| `qbpp::VarInt` | Integer variable | A bounded integer variable encoded by binary variables |
| `qbpp::ExprExpr` | Constraint expression | A pair of (penalty, body) produced by comparison / range operators |

Both implicitly convert to `qbpp::Expr` in arithmetic contexts, so they can be freely mixed with ordinary expressions.

## `qbpp::Var` class
An instance of this class represents **a variable symbolically**.
In many cases, it is used to represent a binary variable.
However, this class is not associated with any specific variable attributes, and its instances can be used to represent variables of any type symbolically.

Each qbpp::Var instance simply consists of:
- **a unique 32-bit ID,** and
- **a string used for display**.

For example, the following program creates a `qbpp::Var` object **`x`**,
which is assigned an automatically generated ID and uses the string `"x"` for display:
```cpp
  auto x = qbpp::var("x");
  std::cout << x << std::endl;
```
This simpliy prints `x`.
It is recommended to use the same string as the variable symbol,
but a different display string can also be used:
```cpp
  auto x = qbpp::var("symbol_x");
  std::cout << x << std::endl;
```
This prints `symbol_x`.

## `qbpp::Term` class
An instance of this class represents **a product term** involving:
- **an integer coefficient**, and
- **zero or more `qbpp::Var` objects**.

For example, the following program creates a `qbpp::Term` object **`t`**
with an integer coefficient `2` and variables `x` and `y`:
```cpp
  auto x = qbpp::var("x");
  auto y = qbpp::var("y");
  auto t = 2 * x * y;
  std::cout << t << std::endl;
```
This program prints:
```
2*x*y`
```

## `qbpp::Expr` class
An instance of this class represents **an expression** involving:
- **an integer constant term**, and
- **zero or more `qbpp::Term` objects**.

For example, the following program creates a **`qbpp::Expr`** object **`f`**
with a constant term `3` and the terms `2*x*y` and `3*x`:
```cpp
  auto x = qbpp::var("x");
  auto y = qbpp::var("y");
  auto f = 3 + 2 * x * y + 3 * x;
  std::cout << f << std::endl;
```
This program prints
```
3 +2*x*y +3*x
```

Expressions can be written using basic operators such as **`+`**, **`-`**, and **`*`**,
as well as parentheses **`(`** and **`)`**.

Expressions are automatically expanded and stored as a `qbpp::Expr` object.
For example, the following program creates a **`qbpp::Expr`** object **`f`** that stores the expanded expression:
```cpp
  auto x = qbpp::var("x");
  auto y = qbpp::var("y");
  auto f = (x + y - 2) * (x - 2 * y + 3);
  std::cout << f << std::endl;
```
This program prints:
```
-6 +x*x +y*x -2*x*y -2*y*y +3*x +3*y -2*x +4*y
```
Note that these mathematical operations only expand the expression.
To simplify the expression, you need to explicitly call a simplify function, as shown below:
```cpp
  auto x = qbpp::var("x");
  auto y = qbpp::var("y");
  auto f = (x + y - 2) * (x - 2 * y + 3);
  f.simplify();
  std::cout << f << std::endl;
```
This program prints:
```
-6 +x +7*y +x*x -x*y -2*y*y
```
For details of the available simplify functions and operators,
see [Basic Operators and Functions](OPERATOR).

## Important Notes on Expressions
Since the `qbpp::Term` class has a simpler data structure than `qbpp::Expr`,
it requires less memory and has lower operation overhead.
However, a `qbpp::Term` object cannot store a full expression.

For example, the following QUBO++ program results in a compilation error,
because `t` is a `qbpp::Term` object:
```cpp
  auto x = qbpp::var("x");
  auto y = qbpp::var("y");
  auto t = 2 * x * y;
  t += 3 * x;
  std::cout << t << std::endl;
```
To store and manipulate expressions, you must explicitly create a
`qbpp::Expr` object using the **`qbpp::toExpr()`** function, as shown below:
```cpp
  auto x = qbpp::var("x");
  auto y = qbpp::var("y");
  auto t = qbpp::toExpr(2 * x * y);
  t += 3 * x;
  std::cout << t << std::endl;
```
This program creates a `qbpp::Expr` object **`t`** and prints:
```cpp
2*x*y +3*x
```

If an object is intended to store an expression, it is recommended to use
the `qbpp::toExpr()` function to construct it from integers, variables, or terms:
```cpp
  auto x = qbpp::var("x");
  auto f = qbpp::toExpr(0);
  auto g = qbpp::toExpr(x);
  auto h = qbpp::toExpr(3 * x);
  std::cout << "f = " << f << std::endl;
  std::cout << "g = " << g << std::endl;
  std::cout << "h = " << h << std::endl;
```
In this program, `f`, `g`, and `h` are all created as `qbpp::Expr` objects.
If `qbpp::toExpr()` is not used, they would instead be of type `int`,
`qbpp::Var`, and `qbpp::Term`, respectively.

For example, the following program incrementally builds an expression
using a `qbpp::Expr` object **`f**:
```cpp
  auto x = qbpp::var("x", 4);
  auto f = qbpp::toExpr(-1);
  for (size_t i = 0; i < x.size(); ++i) {
    f += x[i];
  }
  std::cout << f << std::endl;
```
This program prints:
```
-1 +x[0] +x[1] +x[2] +x[3]
```

However, if `qbpp::toExpr()` is not used, `f` would be an `int` variable,
and a compilation error would occur when applying the `+=` operator.

## `qbpp::VarInt` class
An instance of this class represents an **integer variable** that takes a value in a specified integer range, internally encoded by multiple binary `qbpp::Var` objects.
A `VarInt` is created using the range-chain syntax:
```cpp
auto x = 0 <= qbpp::var_int("x") <= 10;   // integer variable in [0, 10]
std::cout << x << std::endl;
```
The underlying linear expression (binary variables weighted by powers of two plus an offset) is printed:
```
x[0] +2*x[1] +4*x[2] +3*x[3]
```

A `VarInt` **implicitly converts to `qbpp::Expr`** in arithmetic contexts, so it can be used anywhere an expression is expected:
```cpp
auto y = 0 <= qbpp::var_int("y") <= 10;
auto f = qbpp::sqr(x + y - 7);            // x + y - 7 decays to Expr
```
In addition to the embedded expression, a `VarInt` carries metadata: `name()`, `min_val()`, `max_val()`, and the underlying binary `Var` objects. Details and usage examples are in [Integer Variables](INTEGER).

## `qbpp::ExprExpr` class
An instance of this class represents a **constraint expression**, produced by comparison or range operators applied to an expression. An `ExprExpr` holds two parts:
- **penalty**: an `Expr` that equals 0 when the constraint is satisfied and is positive otherwise
- **body**: the original expression, accessed via `*ee` (useful for inspecting the actual value under a solution)

Common ways to construct one:
```cpp
auto x = 0 <= qbpp::var_int("x") <= 10;
auto c1 = (x == 3);                    // penalty = sqr(x - 3), body = x
auto c2 = (2 <= x <= 5);               // penalty = 0 iff 2 <= x <= 5, body = x
```

Like `VarInt`, an `ExprExpr` **implicitly converts to `qbpp::Expr`** (its penalty part) in arithmetic contexts:
```cpp
auto f = c1 + c2 + qbpp::sqr(x - 4);   // mixing ExprExpr and Expr freely
f.simplify_as_binary();
```
Use `*ee` to access the unevaluated body expression (for example, `sol(*ee)` gives the body's value under a solution). Details and the list of supported comparison forms are in [Comparison Operators](COMPARISON).
