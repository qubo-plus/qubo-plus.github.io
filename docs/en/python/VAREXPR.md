---
last_modified: 2026-10-09
layout: default
nav_exclude: true
title: "Data Types"
nav_order: 10
lang: en
hreflang_alt: "ja/python/VAREXPR"
hreflang_lang: "en"
---

# Variables and expressions

## pyqbpp.Var, pyqbpp.Term, and pyqbpp.Expr classes

PyQBPP provides the following fundamental classes:

- **`pyqbpp.Var`**: Represents a variable symbolically and is associated with a string used for display.
Internally, a 32-bit unsigned integer is used as its identifier.
- **`pyqbpp.Term`**: Represents a product term consisting of an integer coefficient and one or more variables.
The data type of the integer coefficient is governed by the coefficient type of the selected variant (default: 32-bit).
Each term stores its variables using a static array (inline buffer of 2 elements) combined with dynamic allocation for higher-degree terms, allowing terms of arbitrary degree with no upper limit.
- **`pyqbpp.Expr`**: Represents an expanded expression consisting of an integer constant term and zero or more product terms.
The data type of the integer constant term is governed by the energy type of the selected variant (default: 64-bit).
Every operation **expands the expression automatically**, so an expression is always stored internally as a **sum of product terms** (e.g., `(x + 1) * (y + 2)` is expanded on the fly to `2 + x*y + 2*x + y`).

In addition, Python's built-in `int` is used directly as constants and coefficients — no helper is needed to write large values.

In the following program, **`x`** and **`y`** are variables, **`t`** is a product term, and **`f`** is an expression:
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
t = 2 * x * y
f = t - x + 1

print("x =", x)
print("y =", y)
print("t =", t)
print("f =", f)
```
This program produces the following output:
```
x = x
y = y
t = 2*x*y
f = 1 +2*x*y -x
```

> **NOTE**
> Python's dynamic typing automatically handles the necessary type conversions
> while building an expression, so you do not have to think about the types of
> intermediate results — just mix integers, variables, and expressions freely.
> The library promotes intermediate results (`int` → `Var` → `Term` → `Expr`)
> to the appropriate type.

`pyqbpp.Var` objects are **immutable** and cannot be updated after creation.
In contrast, `pyqbpp.Term` and `pyqbpp.Expr` objects are **mutable** and can be updated via compound assignment operators.

For example, as shown in the following program, compound assignment operators can be used to update terms and expressions:
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
t = 2 * x * y
f = t - x + 1

print("t =", t)
print("f =", f)

t *= 3 * x
f += 2 * y

print("t =", t)
print("f =", f)
```
This program prints the following output:
```
t = 2*x*y
f = 1 +2*x*y -x
t = 6*x*y*x
f = 1 +2*x*y -x +2*y
```
> **NOTE**
> In Python, rebinding a name such as `x = x + 1` does not modify the original
> object; it simply makes `x` refer to a new object. Because of this, even though
> `pyqbpp.Var` objects are immutable, writing `x += 1` after `x = qbpp.var("x")`
> silently rebinds `x` to a new `Expr` — which is usually not what you want.
> Keep variable names (the result of `qbpp.var(...)`) pristine and accumulate
> into a separate expression variable.

### Aliasing and Copying

Because `pyqbpp.Term` and `pyqbpp.Expr` are mutable, they follow standard
Python mutable-object semantics: assigning one variable to another creates an
**alias** (both names refer to the same object), not an independent copy.
Modifying one through compound assignment will be visible through the other:

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = x + 1           # a new Expr containing x
g = f               # alias — f and g point to the same Expr
f += y              # f is mutated in place; g sees the same change
print("f =", f)     # f = 1 +x +y
print("g =", g)     # g = 1 +x +y   (also updated)
```
If you want an independent copy, use the constructor `qbpp.Expr(other)`
(which deep-copies):
```python
g = qbpp.Expr(f)    # deep copy via constructor
f += y              # f is mutated; g is unaffected
```
The same rule applies to `pyqbpp.Sol`: passing a `Sol` to
`qbpp.Sol(other_sol)` creates an independent deep copy.

The C++ frontend (QUBO++) uses value semantics instead — `Expr g = f;`
already creates an independent copy. See [C++ vs Python](../CPP_VS_PYTHON#object-copy-and-aliasing)
for a side-by-side comparison.

## Building an expression

Python does not require you to construct an `Expr` explicitly — arithmetic operators automatically promote `int` / `Var` / `Term` into `Expr` when needed. For example, `2 * x * y` is a `Term`, but once you `+=` another term onto it, it is promoted to an `Expr`:
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")

t = 2 * x * y   # Term
t += x + 1      # promoted to Expr
f = 1           # int
f += t          # promoted to Expr

print("t =", t)
print("f =", f)
```
This program produces the following output:
```
t = 1 +x +2*x*y
f = 2 +x +2*x*y
```

## Integer Ranges: Coefficient and Energy Types

The coefficient type governs the integer coefficients of product terms, and the energy type governs the integer constant term of an `Expr` and the energy values produced by the solvers.
The following types can be specified:

| Type | Range | Large-constant syntax |
|------|-------|-----------------------|
| 32-bit | ±2.1×10⁹ | `12345` (Python int literal) |
| 64-bit | ±9.2×10¹⁸ | `1234567890123456789` |
| 128-bit | ±1.7×10³⁸ | `12345678901234567890` |
| `cpp_int` | unlimited | `12345678901234567890...` |

Because Python integer literals are arbitrary precision by construction, no helper function is needed to write large constants — you simply write the integer. When building an expression, each integer literal is converted into the current coefficient or energy type; if the value does not fit in the coefficient type of the selected variant, an exception is raised.

By default, `import pyqbpp` uses **32-bit coefficients and 64-bit energy** (`c32e64`),
which is the fastest type variant suitable for most problems.
To use a different type, import a different submodule:

| Import | Coefficient | Energy |
|---|---|---|
| `import pyqbpp.c32e32` | 32-bit | 32-bit |
| `import pyqbpp` (default) | 32-bit | 64-bit |
| `import pyqbpp.c32e64` | 32-bit | 64-bit |
| `import pyqbpp.c64e64` | 64-bit | 64-bit |
| `import pyqbpp.c64e128` | 64-bit | 128-bit |
| `import pyqbpp.c128e128` | 128-bit | 128-bit |
| `import pyqbpp.cppint` | unlimited | unlimited |

Coefficients and constants are **range-checked at input**: passing an integer that does not fit
the selected variant's `coeff_t` / `energy_t` (e.g. `1654971540019 * x` with the default 32-bit
coefficients) raises `OverflowError` with a suggestion to use a wider variant, instead of
silently wrapping around. Arithmetic *inside* the solver library (sums and products computed
during `simplify()` or energy evaluation) is still unchecked for performance — pick a variant
wide enough for the intermediate values, or use `pyqbpp.cppint` to be safe.

### Real (double) coefficients

Coefficients and energy can also be **`double`** (Python `float`). Import one of the following submodules:

| Import | Solved with |
|---|---|
| `import pyqbpp.d` or `import pyqbpp.double` | 64-bit integer solver |
| `import pyqbpp.dc64e64` | 64-bit integer solver |
| `import pyqbpp.dc64e128` | 128-bit integer solver (higher precision, recommended) |
| `import pyqbpp.dc128e128` | 128-bit integer solver (widest dynamic range) |

```python
import pyqbpp.d as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = -1.5 * x - 2.5 * y + 4.0 * x * y          # real (double) coefficients
```

Expressions are built in `float`. When a problem is solved, QUBO++ automatically scales the coefficients to
integers, solves with the integer solver, and returns the energy as a `float` (`sol.energy` is a `float`) —
so you work entirely in `float` without dealing with the integer backend. Dyadic coefficients
(1, 1/2, 1/4, …) are represented exactly.

A coefficient that is vastly smaller than the largest one may fall below the scaling precision; it is then
treated as `0` and its term is dropped (PyQBPP prints a short notice rather than failing). A variable left
without any term has no effect on the objective — reading it from the solution (`sol(x)`, `sol(x[i])`)
returns `0`, and `sol.has(x[i])` reports whether it is still present. The same holds for a variable that
cancels out during `simplify_as_binary()`. A genuine overflow of the energy range is still reported as an
error.

#### Choosing a module

Start with the default `import pyqbpp.d`. For most models it keeps essentially all of the precision of the
original `float` coefficients.

Precision runs out when **the spread between your smallest and largest coefficients is large compared to
the size of the whole model**. Consider `import pyqbpp.dc64e128` when:

- the model has very many terms (10^7 and up is a useful rule of thumb),
- constraint penalty weights are orders of magnitude larger than the objective coefficients, or
- coefficients within one model span many orders of magnitude.

`pyqbpp.dc64e128` keeps far more coefficient precision while **searching at essentially the same speed as
`pyqbpp.d`**; it uses somewhat more memory. `pyqbpp.dc128e128` handles a wider dynamic range still, but
reaches worse solutions in the same time, so use it only when coefficients do not fit with
`pyqbpp.dc64e128`.

#### Inspecting the expression the solver solves: qbpp.quantize()

**`qbpp.quantize()`** returns the integer conversion that happens when a problem is solved: the expression
the solver actually solves, with integer coefficients. You can pass it to a solver instead of the original
expression; both solve the same problem.

```python
import math

import pyqbpp.d as qbpp

x = qbpp.var("x", 3)
f = 0.3 * x[0] + 0.5 * x[1] + 0.4 * x[2] + 1000 * qbpp.cons(
    0.06 * x[0] + 0.05 * x[1] + 0.07 * x[2] >= 0.1)
f.simplify_as_binary()

g = qbpp.quantize(f)
print(f"scale = 2^{math.log2(g.scale):g}")
print(g)

sol = qbpp.EasySolver(g).search()
print(sol)
print(f"g.energy(sol) = {g.energy(sol)}, g.cons(sol) = {g.cons(sol)}")
```

The output of this program is:

```
scale = 2^58
86469112845513520*x[0] +144115188075855872*x[1] +115292150460684704*x[2]
+1024000*cons(1006633*x[0] +838861*x[1] +1174405*x[2] >= 1677722)
Sol(energy=0.7, {x[0]: 1, x[1]: 0, x[2]: 1})
g.energy(sol) = 0.7, g.cons(sol) = 0
```

- The objective coefficients are multiplied by `g.scale` (a power of two, 2<sup>58</sup> here) and rounded
  to integers.
- A `qbpp.cons()` constraint has its body and bounds made integral with a separate factor (2<sup>24</sup>
  here), and its weight is converted so that the penalty is in the same units as the objective
  (1000 × 2<sup>58</sup> / (2<sup>24</sup>)<sup>2</sup> = 1024000). Values such as 0.06 and 0.1 that have
  no finite binary form are rounded with relative error at most 2<sup>−20</sup> (0.1 becomes
  1677722 / 2<sup>24</sup>). A constraint that cannot keep this precision is an error that suggests
  `pyqbpp.dc64e128` or writing the coefficients and bounds as integers.
- For a model with integer coefficients, `g.scale` is 1 and `g` is the original expression.

The expression `g` returned by `qbpp.quantize()` provides:

| Property / function | Description |
|---|---|
| `g.scale` | The factor applied to the coefficients |
| `g.energy(sol)` | Energy of a solution in the original units; equals `sol.energy` for a solution returned by a solver |
| `g.energy_int(sol)` | Energy of a solution in integer units (`g.scale` times `g.energy(sol)`) |
| `g.cons(sol)` | Number of violated constraints (the same test as the solver) |
| `g.is_feasible(sol)` | `True` if every constraint is satisfied |
| `g.violations(sol)` | Value, bounds and violation of each constraint (rounded values, in the original units) |
| `g.expr()` | The expression with integer coefficients |

Evaluating the original expression, `f(sol)`, gives the `float` value before rounding. It can differ
slightly from `g.energy(sol)`, and for a solution exactly on a constraint boundary `f.cons(sol)` and
`g.cons(sol)` can disagree. Evaluate with `g` when you need the same judgement as the solver. To accept
a tiny violation, pass a tolerance such as `f.cons(sol, tol=1e-6)` (see
[Nonlinear functions and native constraints](CONSTRAINTS#checking-a-solution)).

### VarArray mode

Each type variant is also available with a VarArray mode suffix (e.g., `import pyqbpp.c32e64m4`).
The mode controls how variables within each term are stored internally.
Fixed-length modes eliminate heap allocation and improve performance when the maximum degree of the problem is known in advance:

| Suffix | Max degree | Description |
|---|---|---|
| `m0` (or no suffix) | unlimited | Variable-length (heap allocation for degree 3+) |
| `m2` | 2 | Fixed-length, QUBO only (no heap allocation, fastest) |
| `m4` | 4 | Fixed-length, up to degree 4 (no heap allocation) |

Example — selecting both type and VarArray mode (a program imports only one of them):
```python
import pyqbpp.c32e64m4 as qbpp     # default type, degree 4 max
# import pyqbpp.c32e32m2 as qbpp   # 32-bit coeff/energy, QUBO only
# import pyqbpp as qbpp            # default (c32e64m0, any degree)
```

The appropriate shared library is automatically loaded at import time based on the selected module.

> **NOTE**
> The type variant must be chosen at import time and cannot be changed afterward.
> All variables, expressions, and solvers within a program use the same type.

### Large constants

In Python, integer literals are arbitrary precision by construction, so writing a large value is just a matter of typing it — for example, `12345678901234567890 * x`.
Each such literal is converted to the current `coeff_t` type at the moment it participates in an operation.
If the value does not fit, an exception is raised.

For repeated computations of very large integer values inside a hot loop (e.g. powers such as `10**12`), bind the value to a variable once instead of materializing it on every iteration:
```python
K = 10**12   # computed once
for i in range(n):
    f += K * x[i]
```

> **NOTE**
> Ordinary Python integer literals work directly with any variant.
> There is no Python equivalent of `qbpp::integer("...")` because Python's `int`
> already handles arbitrary precision natively.

### Example with 128-bit integers

The following program creates an expression with coefficients exceeding the 64-bit range:
```python
import pyqbpp.c128e128 as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = 12345678901234567890 * x + 98765432109876543210 * y
print("f =", f)
```
This program produces the following output:
```
f = 12345678901234567890*x +98765432109876543210*y
```

### Example with arbitrary-precision integers (cpp_int)

The following program creates an expression with very large coefficient and constant terms:
```python
import pyqbpp.cppint as qbpp

x = qbpp.var("x")
f = 123456789012345678901234567890 * x + 987654321098765432109876543210
print("f =", f)
```
This program produces the following output:
```
f = 987654321098765432109876543210 +123456789012345678901234567890*x
```

Note that the source code for the 128-bit and `cpp_int` examples differs only in the `import` line — the rest of the program is identical regardless of the underlying integer type.
