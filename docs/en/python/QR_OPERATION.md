---
layout: default
nav_exclude: true
title: "QR: Operations"
nav_order: 31
lang: en
hreflang_alt: "ja/python/QR_OPERATION"
hreflang_lang: "ja"
---

# Quick Reference: Operators and Functions for Expressions
The table below summarizes the operators and functions available for expressions (`pyqbpp.Expr`).
Here, an "expression" is a polynomial built from the three concepts described in [VAREXPR](VAREXPR)
(integer, variable, and expression).
An `expression` entry in the *Argument Type* column means that an integer, a variable, or an
expression is accepted.

## Global functions and in-place methods
Operations on expressions are provided, whenever applicable, as a pair:

- **Global function** `qbpp.func(f, ...)` — **non-destructive**. Does not modify `f`; returns a new result object.
- **In-place method** `f.func(...)` — **overwrites `f` with the result** and returns `self` (supports method chaining).

Use the global form when you want to keep `f` unchanged; use the method form when you want `f` to become the processed result.
Even when the return type of the global differs from `Expr`, the member form is consistent — it writes the result back into `self`.
For example, `qbpp.gcd(f)` returns an integer, while `f.gcd()` overwrites `f` with a constant expression whose value is that integer.

## Summary of operators and functions

| Operator/Function      | Syntax                                            | Kind     | Return type                       | Argument type              |
|------------------------|---------------------------------------------------|----------|-----------------------------------|----------------------------|
| Copy                   | `qbpp.copy(f)`                                    | Global   | expression                        | integer / variable / expression |
| Binary operators       | `f + g`, `f - g`, `f * g`                         | Global   | expression                        | expression ⊕ expression    |
| Compound assignment    | `f += g`, `f -= g`, `f *= g`                      | In-place | expression                        | expression                 |
| Division               | `f / n`                                           | Global   | expression                        | expression, integer        |
| Compound division      | `f /= n`                                          | In-place | expression                        | integer                    |
| Unary operators        | `+f`, `-f`                                        | Global   | expression                        | expression                 |
| Equality constraint    | `qbpp.constrain(f, equal=n)`                      | Global   | `ExprExpr`                        | expression, integer        |
| Range constraint       | `qbpp.constrain(f, between=(l, u))`               | Global   | `ExprExpr`                        | expression, integer, integer |
| Square                 | `qbpp.sqr(f)`                                     | Global   | expression                        | expression                 |
| Square                 | `f.sqr()`                                         | In-place | expression                        | —                          |
| GCD                    | `qbpp.gcd(f)`                                     | Global   | integer                           | expression                 |
| GCD                    | `f.gcd()`                                         | In-place | expression (overwritten to constant) | —                      |
| Simplify               | `qbpp.simplify(f)`                                | Global   | expression                        | expression                 |
| Simplify               | `f.simplify()`                                    | In-place | expression                        | —                          |
| Binary simplify        | `qbpp.simplify_as_binary(f)`                      | Global   | expression                        | expression                 |
| Binary simplify        | `f.simplify_as_binary()`                          | In-place | expression                        | —                          |
| Spin simplify          | `qbpp.simplify_as_spin(f)`                        | Global   | expression                        | expression                 |
| Spin simplify          | `f.simplify_as_spin()`                            | In-place | expression                        | —                          |
| Evaluation             | `f(ml)`                                           | Global   | integer                           | expression, dict           |
| Replace                | `qbpp.replace(f, ml)`                             | Global   | expression                        | expression, dict           |
| Replace                | `f.replace(ml)`                                   | In-place | expression                        | dict                       |
| Spin → binary          | `qbpp.spin_to_binary(f)`                          | Global   | expression                        | expression                 |
| Spin → binary          | `f.spin_to_binary()`                              | In-place | expression                        | —                          |
| Binary → spin          | `qbpp.binary_to_spin(f)`                          | Global   | expression                        | expression                 |
| Binary → spin          | `f.binary_to_spin()`                              | In-place | expression                        | —                          |
| Slice                  | `v[from:to]`, `v[:, from:to]`                     | Global   | array                           | array                    |
| Concatenation          | `qbpp.concat(a, b)`, `qbpp.concat(a, b, dim)`     | Global   | array                           | array, integer / variable / expression |

## Assignment: `g = f` vs. `g = qbpp.copy(f)`
Python's `=` is **name binding**, not value copying.
Writing `g = f` simply binds the new name `g` to the same object that `f` refers to,
so `f` and `g` **share a single expression object**.
In contrast, `g = qbpp.copy(f)` creates a new, independent expression.
The difference becomes visible as soon as you apply an **in-place operation**
(a compound assignment or an in-place member).

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")

# --- g = f: shared reference ---
f = 2 * x + 3 * y
g = f                    # g and f are the same object (g is f → True)
g += 100
print(f)                 # 100 +2*x +3*y  ← f is also mutated
print(g)                 # 100 +2*x +3*y

# --- g = qbpp.copy(f): independent copy ---
f = 2 * x + 3 * y
g = qbpp.copy(f)         # g holds a separate object with the same value (g is f → False)
g += 100
print(f)                 # 2*x +3*y       ← f is untouched
print(g)                 # 100 +2*x +3*y
```

> **NOTE**
> When the right-hand side is a **binary or unary operation** such as `f + 1`, `2 * f`, or `-f`,
> the operator returns a fresh expression each time, so the result is automatically
> independent of `f`. The footgun is limited to the specific pattern
> "`g = f` followed by an in-place mutation of `g`". Use **`qbpp.copy(f)`** whenever you want
> an independent copy.

> **NOTE**
> The same trap applies when the right-hand side is just an **in-place member call**.
> An in-place member overwrites `f` with the result and returns `self`, so `g = f.sqr()`
> is not "assign a new expression to `g`" — it is "square `f` in place and bind that same
> `f` to `g` under a new name". The three typical forms behave differently:
>
> | Statement | Effect |
> |---|---|
> | `g = f.sqr()`           | `f` is squared in place, and `g` refers to the same object as `f` (`g is f` → True) |
> | `g = qbpp.sqr(f)`       | Non-destructive global form. `f` is unchanged; `g` is a fresh, independent expression |
> | `g = qbpp.copy(f.sqr())`| `f` is squared in place, then the result is copied into an independent `g` (the mutation of `f` persists) |
>
> When you want the squared value without touching `f`, use the **global form `qbpp.sqr(f)`**.
> The same rule holds for every other in-place member (`simplify_as_binary`, `replace`,
> `spin_to_binary`, …).

> **NOTE**
> `qbpp.copy()` is safe to call on integers and variables too. Since those are **immutable**,
> sharing cannot cause any surprise and `copy()` simply returns the original object.
> You do not need to special-case the argument type.

## Binary Operators: `+`, `-`, `*`
`+`, `-`, `*` accept any mix of integers, variables, and expressions and return an expression.
You can write naturally — e.g. `2 * x * y - x + 1` — without thinking about operand types.

## Compound Assignment Operators: `+=`, `-=`, `*=`
The left-hand side must be an expression. The right-hand side may be an integer, a variable,
or an expression. The operation is applied and the left-hand side is updated in place.

## Division `/` and Compound Division `/=`
The division operator `/` takes an expression as the **dividend** and an integer as the **divisor**, and returns the **quotient** as a new expression.

The dividend expression must be divisible by the divisor; that is,
both the integer constant term and all integer coefficients in the expression must be divisible by the divisor.

The compound division operator `/=` divides the expression in place.

### Example
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = 6 * x + 4 * y + 2
g = f / 2          # g = 3*x + 2*y + 1 (new Expr)
f /= 2             # f = 3*x + 2*y + 1 (in-place)
```

## Equality and range constraints: `constrain()`
The `constrain()` function expresses a constraint on an expression `f` as a penalty expression.
Both equality and range constraints are written through the same function:

```python
g = qbpp.constrain(f, equal=n)           # penalty for the constraint f = n
g = qbpp.constrain(f, between=(l, u))    # penalty for l <= f <= u
g = qbpp.constrain(f, between=(l, None)) # penalty for l <= f  (no upper bound)
g = qbpp.constrain(f, between=(None, u)) # penalty for f <= u  (no lower bound)
```

Here `f` is an expression and `n` / `l` / `u` are integers.
Each form returns an expression whose minimum value is 0 when the constraint is satisfied.

- **`equal=n`**: returns `sqr(f - n)`.
- **`between=(l, u)`**: implicitly introduces an auxiliary integer variable `a` with unit gaps, taking values in `[l, u-1]`, and returns `(f - a) * (f - (a + 1))`.
- **`between=(l, None)`** / **`between=(None, u)`**: half-open forms that constrain only one side.

### `pyqbpp.ExprExpr` class
The object `g` returned by `constrain()` is a **`pyqbpp.ExprExpr`**, a derived class of `pyqbpp.Expr`.

- **`g`** is the penalty expression itself (corresponding to C++ `*g`) and can be used like any expression — evaluated, simplified, or passed to solvers.
- **`g.body`** returns the original expression `f` before the constraint was applied.

## Square function: `sqr()`
For an expression `f`:
- **`pyqbpp.sqr(f)`** (global function): Returns `f * f`.
The argument `f` may be an integer, a variable, or an expression.

For an array `v`:
- **`pyqbpp.sqr(v)`**: Returns a new array with each element squared.

### Example
```python
import pyqbpp as qbpp

x = qbpp.var("x")
f = qbpp.sqr(x)       # x * x
```

## Greatest Common Divisor function: `gcd()`
Computes the greatest common divisor (GCD) of all integer coefficients and the integer constant
term of an expression `f`. Two forms are available:

- **`qbpp.gcd(f)`** (global, non-destructive):
  Does not modify `f`; returns the GCD as an **integer value**.
- **`f.gcd()`** (member, in-place):
  **Overwrites** `f` with a constant expression whose value is that GCD, and returns `self`.

To reduce an expression by its GCD, combine the global form with compound division: `f /= qbpp.gcd(f)`.

### Example
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = 6 * x + 4 * y + 2

# Global form: get the value, f is unchanged
print(qbpp.gcd(f))     # 2
print(f)               # 2 +6*x +4*y

# To reduce f, combine the global with /=
g = qbpp.copy(f)
g /= qbpp.gcd(g)       # g = 1 +3*x +2*y
print(g)

# In-place: overwrite f with the GCD as a constant expression
h = qbpp.copy(f)
h.gcd()                # h = 2 (constant expression)
print(h)
```

## Simplify functions: `simplify()`, `simplify_as_binary()`, `simplify_as_spin()`
For an expression `f`, the member function **`f.simplify()`** performs the following operations in place:
- Sort variables within each term according to their unique variable IDs
- Merge duplicated terms
- Sort terms such that:
  - lower-degree terms appear earlier, and
  - terms of the same degree are ordered lexicographically.

The global function **`pyqbpp.simplify(f)`** performs the same operations without modifying `f`.

### Binary and Spin Simplification
Two specialized variants of the simplification function are provided:
- **`simplify_as_binary()`**:
Simplification is performed under the assumption that all variables take binary values
$\lbrace 0,1\rbrace$.
The identity $x^2=x$ is applied to all variables $x$.
- **`simplify_as_spin()`**:
Simplification is performed under the assumption that all variables take spin values
$\lbrace -1,+1\rbrace$.
The identity $x^2=1$ is applied to all variables $x$.

Both variants are available as member functions and global functions:
- Member functions (in-place): `f.simplify_as_binary()`, `f.simplify_as_spin()`
- Global functions (non-destructive): `qbpp.simplify_as_binary(f)`, `qbpp.simplify_as_spin(f)`

### Example
```python
import pyqbpp as qbpp

x = qbpp.var("x")
f = x * x + x
f.simplify_as_binary()  # 2*x (since x^2 = x)

g = x * x + x
g.simplify_as_spin()    # 1 + x (since x^2 = 1)
```

## Evaluation function: `f(ml)`
The evaluation function takes a dict mapping variables to integer values.

For an expression `f` and a dict `ml`, the evaluation function `f(ml)` evaluates the value of `f` under the variable assignments specified by `ml` and returns the resulting integer value.

All variables appearing in `f` must have corresponding mappings defined in `ml`.

### Example
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = 3 * x + 2 * y + 1

print(f({x: 1, y: 0}))  # 4  (= 3*1 + 2*0 + 1)
```

## Replace functions: `replace()`
The `replace()` function accepts a dict mapping variables to expressions (integers are also accepted on the right side).

For an expression `f` and a dict `ml`:
- **`pyqbpp.replace(f, ml)`** (global function):
Returns a new expression obtained by replacing variables in `f` according to the mappings in `ml`, without modifying `f`.
- **`f.replace(ml)`** (member function):
Replaces variables in `f` according to the mappings in `ml` in place and returns the resulting expression.

### Creating a dict
```python
import pyqbpp as qbpp

ml = {x: 0, y: 1}                    # Dict mapping variables to expressions
ml = {x: 0, y: z}                    # Values may be variables too
```

### Example
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = 2 * x + 3 * y + 1

ml = {x: 1, y: 0}
g = qbpp.replace(f, ml)   # g = 2*1 + 3*0 + 1 = 3 (new Expr)
f.replace(ml)         # f is modified in place
```

## Binary/Spin Conversion functions: `spin_to_binary()`, `binary_to_spin()`
Let `x` be a binary variable and `s` be a spin variable.
We assume that `x = 1` if and only if `s = 1`.
Under this assumption, the following relations hold:

$$
\begin{aligned}
 s &= 2x-1 \\
 x &= (s+1)/2
\end{aligned}
$$

The **`spin_to_binary()`** function converts a spin-variable expression to a binary-variable expression
by replacing all spin variables `s` with `2 * s - 1`.

The **`binary_to_spin()`** function converts a binary-variable expression to a spin-variable expression
by replacing all binary variables `x` with `(x + 1) / 2`.
The resulting expression is multiplied by $2^d$ (where $d$ is the maximum degree) so that all coefficients remain integers.

Both functions are available as member functions (in-place) and global functions (non-destructive).

### Example
```python
import pyqbpp as qbpp

s = qbpp.var("s")
f = 3 * s + 1
g = qbpp.spin_to_binary(f)   # -2 + 6*s  (replaced s with 2*s-1)

b = qbpp.var("b")
h = 2 * b + 1
k = qbpp.binary_to_spin(h)   # 4 + 2*b  (replaced b with (b+1)/2, multiplied by 2)
```

## Slice functions: `v[from:to]`

Python slice notation extracts a sub-range from an array. Slicing returns a new array.

- **`v[from:to]`**: Elements in `[from, to)` along the outermost dimension.
- **`v[:n]`**: First `n` elements. Equivalent to C++ `head(v, n)`.
- **`v[-n:]`**: Last `n` elements. Equivalent to C++ `tail(v, n)`.

For multi-dimensional arrays, use tuple indexing to slice along inner dimensions:

- **`v[:, from:to]`**: Slice each row (dim=1). Equivalent to C++ `slice(v, from, to, 1)`.
- **`v[:, :, from:to]`**: Slice along dim=2. Works for any depth.

### Example
```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(3, 5))
print(x[:, :3])     # first 3 columns of each row
print(x[1:3, 2:4])  # rows 1-2, columns 2-3
```

## Concatenation function: `concat()`

The `concat()` function joins arrays or prepends/appends scalars.

- **`qbpp.concat(a, b)`**: Concatenates two arrays along the outermost dimension.
- **`qbpp.concat(scalar, v)`**: Prepends a scalar (converted to `Expr`).
- **`qbpp.concat(v, scalar)`**: Appends a scalar.
- **`qbpp.concat(scalar, v, dim)`**: `dim=0` prepends a row filled with the scalar; `dim=1` prepends the scalar to each row.
- **`qbpp.concat(v, scalar, dim)`**: `dim=0` appends a row; `dim=1` appends to each row.

Scalars can be an integer, a variable, or an expression. When the two sides have different element types, the result is automatically promoted to an array of expressions.

### Example
```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=4)
y = qbpp.concat(1, qbpp.concat(x, 0))
# y = [1, x[0], x[1], x[2], x[3], 0]

z = qbpp.var("z", shape=(3, 4))
zg = qbpp.concat(1, qbpp.concat(z, 0, 1), 1)
# each row: [1, z[i][0], ..., z[i][3], 0]
```

## Expression members

The following members of an expression `f` provide read-only access to its internal structure.

| Expression | Return Type | Description |
|------------|-------------|-------------|
| `f.constant` | integer | Constant term (property) |
| `f.max_degree` | integer | Maximum degree over all terms (property) |
| `f.term_count()` | integer | Number of terms (excluding the constant) |
| `f.term_count(d)` | integer | Number of terms of degree `d` |
| `f.term(i)` | single-term expression | The `i`-th term as an expression with a single monomial |
| `f.has(v)` | `bool` | `True` if variable `v` appears in `f` |

The single-term expression `t` returned by `f.term(i)` supports the following additional
accessors for inspecting that one monomial:

| Expression | Return Type | Description |
|------------|-------------|-------------|
| `t.coeff` | integer | Coefficient of the monomial (property) |
| `t.degree` | integer | Degree (number of variables in the monomial; property) |
| `t.var(i)` | `Var` | The `i`-th variable of the monomial |
| `t.has(v)` | `bool` | `True` if variable `v` appears in the monomial |

### Example
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = qbpp.simplify(3 * x + 2 * x * y + 5)
# f = 5 + 3*x + 2*x*y

f.constant            # 5
f.term_count()        # 2
f.max_degree          # 2
f.has(x)              # True
f.has(y)              # True

t = f.term(1)         # 2*x*y (single-term expression)
t.coeff               # 2
t.degree              # 2
t.var(0)              # x
t.var(1)              # y
t.has(x)              # True
```
