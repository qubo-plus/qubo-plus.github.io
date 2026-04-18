---
layout: default
nav_exclude: true
title: "Operators and Functions"
nav_order: 11
lang: en
hreflang_alt: "ja/python/OPERATOR"
hreflang_lang: "ja"
---

# Basic Operators and Functions

## Unary and Binary Operators
PyQBPP supports the following basic binary operators for constructing expressions:
- **`+`**: Returns the sum of the operands.
- **`-`**: Returns the difference of the operands.
- **`*`**: Returns the product of the operands.
- **`/`**: Returns the quotient of the operands.
The divisor must be an integer, and both the constant term and all coefficients of the dividend must be divisible by the divisor.
- unary **`-`**: Returns the negation of the operand.
- unary **`~`**: Returns the negated literal of a variable (i.e., `~x` represents $1-x$ for a binary variable `x`).

Because Python's operator overloading mirrors C++ for arithmetic operators, the operator precedence of `+`, `-`, `*`, and `/` follows the standard Python operator precedence rules, which are equivalent to those of C++ for these operators.

The following program demonstrates how to construct expressions using these operators:
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = 6 * -(x + 1) * (y - 1)
g = f / 3

print("f =", f)
print("g =", g)
```
This program produces the following output:
```
f = 6 -6*x*y +6*x -6*y
g = 2 -2*x*y +2*x -2*y
```

> **NOTE**
> Unlike C++ where `qbpp::Expr` is a distinct type, in PyQBPP the `+`, `-`, `*`, `/` Python operators are overloaded on the `Var`, `Term`, and `Expr` classes. The result is always an expression.

## Compound operators
The following compound operators for updating expressions are also supported:
- **`+=`**: Adds the right-hand side operand to the left-hand side.
- **`-=`**: Subtracts the right-hand side operand from the left-hand side.
- **`*=`**: Multiplies the right-hand side operand to the left-hand side.
- **`/=`**: Divides the left-hand side operand by the right-hand side. The right-hand side operand must be an integer, and the constant term and all coefficients of the left-hand side must be divisible by it.

The following program demonstrates how to update expressions using these compound operators:
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = 6 * x + 4

f += 3 * y
print("f =", f)

f -= 12
print("f =", f)

f *= 2 * y
print("f =", f)

f /= 2
print("f =", f)
```
This program produces the following output:
```
f = 4 +6*x +3*y
f = -8 +6*x +3*y
f = 12*x*y +6*y*y -16*y
f = 6*x*y +3*y*y -8*y
```

## Square function
PyQBPP provides both a global function **`qbpp.sqr()`** and a member function **`sqr()`** of the `Expr` class to compute the square of an expression.

In the following program, for an expression `f`, the global function **`qbpp.sqr(f)`** returns a new expression representing the square of `f` without modifying `f`,
whereas the member function **`f.sqr()`** updates `f` in place by replacing it with its square.

```python
import pyqbpp as qbpp

x = qbpp.var("x")
f = x + 1

print("f =", qbpp.sqr(f))
print("f =", f)

f.sqr()
print("f =", f)
```
This program produces the following output:
```
f = 1 +x*x +x +x
f = 1 +x
f = 1 +x*x +x +x
```

## Simplify functions
After operators or functions are applied to expressions, expressions are automatically expanded.
To sort terms and simplify the resulting expressions, simplify functions must be explicitly called.

PyQBPP provides the following three **global simplify functions**:
- **`qbpp.simplify()`**:
Returns a simplified expression by merging coefficients of identical terms.
- **`qbpp.simplify_as_binary()`**:
Returns a simplified expression under the assumption that all variables take binary values $0/1$,
i.e., the identity $x^2=x$ holds.
- **`qbpp.simplify_as_spin()`**:
Returns a simplified expression under the assumption that all variables take spin values $-1/+1$, i.e., the identity $x^2=1$ holds.

The following program demonstrates the behavior of these simplify functions:
```python
import pyqbpp as qbpp

x = qbpp.var("x")
f = qbpp.sqr(x - 1)

print("f =", f)
print("simplified(f) =", qbpp.simplify(f))
print("simplified_as_binary(f) =", qbpp.simplify_as_binary(f))
print("simplified_as_spin(f) =", qbpp.simplify_as_spin(f))
```
This program produces the following output:
```
f = 1 +x*x -x -x
simplified(f) = 1 -2*x +x*x
simplified_as_binary(f) = 1 -x
simplified_as_spin(f) = 2 -2*x
```

**Member function** versions of these simplify functions are also provided for expressions, and they update the expression in place with the simplified result.

For example, the following program updates `f` by applying **`simplify()`**:
```python
import pyqbpp as qbpp

x = qbpp.var("x")
f = qbpp.sqr(x - 1)

f.simplify()
print("f =", f)
```
This program prints the following output:
```
f = 1 -2*x +x*x
```

> **NOTE**
> In PyQBPP, **member functions** (e.g., `f.simplify()`, `f.sqr()`) update the object in place, whereas **global functions** (e.g., `qbpp.simplify(f)`, `qbpp.sqr(f)`) return a new object without modifying the original.
