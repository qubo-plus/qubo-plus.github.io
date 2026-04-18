---
layout: default
nav_exclude: true
title: "Expression Classes"
nav_order: 15
lang: en
hreflang_alt: "ja/python/EXPRESSION"
hreflang_lang: "ja"
---

# Expression Classes
The most important feature of PyQBPP is its ability to create expressions for solving combinatorial optimization problems. The following three classes are used for this purpose.

| Class | Content | Details |
|------|-----|-----|
| `pyqbpp.Var` | Variable | 32-bit ID + display string |
| `pyqbpp.Term` | Product term | zero or more variables + integer coefficient |
| `pyqbpp.Expr` | Expression | zero or more terms + integer constant |

In addition, PyQBPP provides two related classes that are built on top of `Expr`:

| Class | Content | Details |
|------|-----|-----|
| `pyqbpp.VarInt` | Integer variable | A bounded integer encoded by binary variables |
| `pyqbpp.ExprExpr` | Constraint expression | A pair of (penalty, body) produced by comparison / range operators |

Both decay to `Expr` in arithmetic contexts, so most user code can treat them as expressions.

Unlike the C++ version (QUBO++), in PyQBPP **you usually do not need to be conscious of the difference between these classes**. Python's dynamic typing performs the type conversion automatically (e.g., `2 * x * y` produces a `Term`; using `+=` promotes it to `Expr`). Still, understanding which class is used internally helps interpret error messages and optimize hot loops.

## `pyqbpp.Var` class
Instances of this class **symbolically represent a variable**. In most cases, they are used to represent binary variables. However, this class is not tied to any specific variable attribute; its instances can symbolically represent variables of any kind.

Each `Var` instance simply consists of:
- a **unique 32-bit ID**
- a **display string**

For example, the following program creates a variable **`x`**. An auto-generated ID is assigned, and the display string `"x"` is used when printing.
```python
import pyqbpp as qbpp

x = qbpp.var("x")
print(x)
```
This simply prints `x`. Using the same string as the variable symbol is recommended, but you can also use a different display string:
```python
x = qbpp.var("symbol_x")
print(x)
```
This prints `symbol_x`.

## `pyqbpp.Term` class
Instances of this class represent a **product term** containing:
- an **integer coefficient**
- zero or more **`Var` objects**

For example, the following program creates a term **`t`** with integer coefficient `2` and variables `x`, `y`.
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
t = 2 * x * y
print(t)
```
This program prints:
```
2*x*y
```

## `pyqbpp.Expr` class
Instances of this class represent an **expression** containing:
- an **integer constant term**
- zero or more **`Term` objects**

For example, the following program creates an expression **`f`** with constant `3` and terms `2*x*y` and `3*x`.
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = 3 + 2 * x * y + 3 * x
print(f)
```
This program prints:
```
3 +2*x*y +3*x
```

Expressions can be written using the basic operators **`+`**, **`-`**, **`*`** and parentheses **`(`**, **`)`**.

Expressions are automatically expanded and stored as `Expr` objects. For example, the following program creates an expression **`f`** storing the expanded form:
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = (x + y - 2) * (x - 2 * y + 3)
print(f)
```
This program prints:
```
-6 +x*x +y*x -2*x*y -2*y*y +3*x +3*y -2*x +4*y
```
Note that these mathematical operations only expand the expression. To simplify it, call the simplification function explicitly as shown below.
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = (x + y - 2) * (x - 2 * y + 3)
f.simplify()
print(f)
```
This program prints:
```
-6 +x +7*y +x*x -x*y -2*y*y
```
For details on the available simplification functions and operators, see [Basic Operators and Functions](OPERATOR).

## Important Notes on Expressions
The `Term` class has a simpler data structure than `Expr`, so it consumes less memory and has lower operation overhead. However, a `Term` object cannot hold a full expression (sum of multiple terms).

Because Python performs type conversion automatically, unlike C++ the following program is not an error — by the time `t += 3 * x` is executed, `t` is rebound from `Term` to `Expr`:
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
t = 2 * x * y          # Term
t += 3 * x             # rebound to Expr (t is no longer a Term)
print(t)
```
This program prints:
```
2*x*y +3*x
```

Unlike the C++ version, Python does not require you to construct an `Expr` explicitly — arithmetic operators automatically promote `int` / `Var` / `Term` into `Expr` as needed. For example, the following program builds an expression incrementally starting from a plain `int`:
```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=4)
f = -1
for i in range(len(x)):
    f += x[i]
print(f)
```
The first `+=` promotes `int → Expr`. This program prints:
```
-1 +x[0] +x[1] +x[2] +x[3]
```

## `pyqbpp.VarInt` class
Instances of this class represent an **integer variable** that takes a value in a specified integer range, internally encoded by multiple binary variables. A `VarInt` is created by passing the `between=` argument to `qbpp.var()`:
```python
import pyqbpp as qbpp

x = qbpp.var("x", between=(0, 10))   # integer variable in [0, 10]
print(x)
```
The underlying linear expression (binary variables weighted by powers of two plus an offset) is printed:
```
x[0] +2*x[1] +4*x[2] +3*x[3]
```

A `VarInt` **decays to `Expr`** in arithmetic contexts, so it can be used anywhere an expression is expected:
```python
y = qbpp.var("y", between=(0, 10))
f = qbpp.sqr(x + y - 7)              # x + y - 7 promotes to Expr
```
In addition to the embedded expression, a `VarInt` carries metadata: `name`, `min_val`, `max_val`, and the underlying binary variables. Details and usage examples are in [Integer Variables](INTEGER).

## `pyqbpp.ExprExpr` class
Instances of this class represent a **constraint expression**, produced by comparison or range operators applied to an expression. An `ExprExpr` holds two parts:
- **`penalty`**: an `Expr` that equals 0 when the constraint is satisfied and is positive otherwise
- **`body`**: the original expression (useful for inspecting the actual value under a solution)

It is typically constructed via `qbpp.constrain()`:
```python
import pyqbpp as qbpp

x = qbpp.var("x", between=(0, 10))
c1 = qbpp.constrain(x, equal=3)              # penalty = (x - 3)^2
c2 = qbpp.constrain(x, between=(2, 5))       # penalty = 0 when 2 <= x <= 5
```

Like `VarInt`, an `ExprExpr` **decays to `Expr`** (its penalty part) in arithmetic contexts:
```python
f = c1 + c2 + qbpp.sqr(x - 4)        # mixing ExprExpr and Expr freely
f.simplify_as_binary()
```
Use `c.body` to access the unevaluated expression (for example, to inspect `sol(c.body)` after solving). Details and the list of supported comparison forms are in [Comparison Operators](COMPARISON).
