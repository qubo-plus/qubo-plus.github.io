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
The table below summarizes the operators and functions available for `pyqbpp.Expr` objects.

| Operators/Functions           | Syntax                                                | Global/In-place | Return Type       | Argument Type            |
|-------------------------------|-------------------------------------------------------|-----------------|-------------------|--------------------------|
| Binary Operators              | `f + g`, `f - g`, `f * g`                             | Global          | `Expr`            | `ExprType`-`ExprType`    |
| Compound Assignment           | `f += g`, `f -= g`, `f *= g`                          | In-place        | `Expr`            | `ExprType` or `int`      |
| Division                      | `f / n`                                               | Global          | `Expr`            | `ExprType`-`int`         |
| Compound Division             | `f /= n`                                              | In-place        | `Expr`            | `int`                    |
| Unary Operators               | `+f`, `-f`                                            | Global          | `Expr`            | `ExprType`               |
| Comparison (Equality)         | `f == n`                                              | Global          | `ExprExpr`        | `ExprType`-`int`         |
| Comparison (Range)            | `qbpp.between(f, l, u)`                                    | Global          | `ExprExpr`        | `ExprType`-`int`-`int`   |
| Square                        | `qbpp.sqr(f)`                                              | Global          | `Expr`            | `ExprType`               |
| GCD                           | `qbpp.gcd(f)`                                              | Global          | `int`             | `ExprType`               |
| Simplify                      | `qbpp.simplify_as_binary(f)`, etc.                         | Global          | `Expr`            | `ExprType`               |
| Simplify                      | `f.simplify_as_binary()`, etc.                        | In-place        | `Expr`            | —                        |
| Eval                          | `f(ml)`                                               | Global          | `int`             | `Expr`-`list`            |
| Replace                       | `qbpp.replace(f, ml)`                                      | Global          | `Expr`            | `ExprType`-`list`        |
| Replace                       | `f.replace(ml)`                                       | In-place        | `Expr`            | `list`                   |
| Binary/Spin Conversion        | `qbpp.spin_to_binary(f)`, `qbpp.binary_to_spin(f)`              | Global          | `Expr`            | `ExprType`               |
| Binary/Spin Conversion        | `f.spin_to_binary()`, `f.binary_to_spin()`            | In-place        | `Expr`            | —                        |
| Slice                         | `v[from:to]`, `v[:, from:to]`                         | Global          | `Array`          | `Array`                 |
| Concatenation                 | `qbpp.concat(a, b)`, `qbpp.concat(a, b, dim)`           | Global          | `Array`          | `Array`/`int`           |

## Expression-related type: **`ExprType`**
The term **`ExprType`** denotes a category of types that can be converted to a `pyqbpp.Expr` object.
In PyQBPP, this includes:
- `int` — integer constant
- `pyqbpp.Var` — binary variable
- `pyqbpp.Term` — polynomial term
- `pyqbpp.Expr` — expression

## Global Functions and In-place Methods
Many operations are provided in two forms:
- **Global**: Takes arguments and returns a new object without modifying the inputs. Example: `qbpp.simplify_as_binary(f)` returns a simplified copy; `f` is unchanged.
- **In-place**: A method that updates the object itself and returns it. Example: `f.simplify_as_binary()` modifies `f` in place.

## Assignment
In Python, the `=` operator rebinds the variable name to a new object.
To copy an expression, use the `Expr` constructor:
```python
f = qbpp.Expr(g)  # f is a copy of g
```

## Binary Operators: `+`, `-`, `*`
These operators take two `ExprType` operands, compute the result, and return it.
If at least one operand is a `pyqbpp.Expr`, the result is always a `pyqbpp.Expr`.
If neither operand is a `pyqbpp.Expr`, the result may be a `pyqbpp.Term`.

### Example
For a variable `x` of type `pyqbpp.Var`:
- `2 + x`: `pyqbpp.Expr`
- `2 * x`: `pyqbpp.Term`

## Compound Assignment Operators: `+=`, `-=`, `*=`
The left-hand side must be a `pyqbpp.Expr`.
The specified operation is applied using the right-hand side operand.
The left-hand side expression is updated in place.

> **NOTE**
> `*=` only accepts `int` operands in PyQBPP.

## Division `/` and Compound Division `/=`
The division operator `/` takes a `pyqbpp.Expr` as the **dividend** and an integer as the **divisor**, and returns the **quotient** as a new `pyqbpp.Expr`.

The dividend expression must be divisible by the divisor; that is,
both the integer constant term and all integer coefficients in the expression must be divisible by the divisor.

The compound division operator `/=` divides the expression in place.

### Example
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = 6 * x + 4 * y + 2
g = f / 2          # g = 3*x + 2*y + 1
f = qbpp.Expr(f)
f /= 2             # f = 3*x + 2*y + 1
```

## Comparison (Equality): `==`
The equality comparison operator `==` takes:
- a `pyqbpp.Expr` (or `ExprType` that creates one) on the left-hand side, and
- an integer on the right-hand side.

It returns an expression whose minimum value is 0 when the equality constraint is satisfied.
More specifically, for a `pyqbpp.Expr` object `f` and an integer `n`, the operator returns: `sqr(f - n)`.

For the returned object `g`:
- **`g`** represents the constraint expression `sqr(f - n)`, and
- **`g.body`** returns the underlying expression `f`.

### `pyqbpp.ExprExpr` class
Here, `g` is a **`pyqbpp.ExprExpr`** object, which is a derived class of `pyqbpp.Expr`.
The `body` property returns the associated underlying `pyqbpp.Expr` object.

### Comparison with C++ QUBO++
In C++ QUBO++, `*g` (dereference operator) is used to access the underlying expression.
In PyQBPP, `g.body` property is used instead.

## Comparison (Range): `between()`
In C++ QUBO++, the range comparison is written as `l <= f <= u`.
In PyQBPP, the `between()` function is used instead:
```python
g = qbpp.between(f, l, u)
```
where:
- `f` is a non-integer `ExprType`, and
- `l` and `u` are integers.

This function returns an expression whose minimum value is 0 when the range constraint `l <= f <= u` is satisfied.

More specifically, an auxiliary integer variable `a` with unit gaps, taking values in the range `[l, u-1]`, is implicitly introduced, and the function returns:
```python
(f - a) * (f - (a + 1))
```

For the returned `pyqbpp.ExprExpr` object `g`:
- **`g`** represents the constraint expression `(f - a) * (f - (a + 1))`, and
- **`g.body`** returns the underlying expression `f`.

### Comparison with C++ QUBO++

| C++ QUBO++       | PyQBPP            |
|------------------|---------------------|
| `l <= f <= u`    | `qbpp.between(f, l, u)`  |
| `*g`             | `g.body`            |

## Square function: `sqr()`
For a `pyqbpp.Expr` object `f`:
- **`pyqbpp.sqr(f)`** (global function): Returns the expression `f * f`.
The argument `f` may be any `ExprType` object.

For a `pyqbpp.Array` object `v`:
- **`pyqbpp.sqr(v)`**: Returns a new `pyqbpp.Array` with each element squared.

### Example
```python
import pyqbpp as qbpp

x = qbpp.var("x")
f = qbpp.sqr(x)       # x * x
```

## Greatest Common Divisor function: `gcd()`
The global function **`pyqbpp.gcd()`** takes a `pyqbpp.Expr` object as its argument and returns the greatest common divisor (GCD) of all integer coefficients and the integer constant term.

Since the given expression is divisible by the resulting GCD, all integer coefficients and the integer constant term can be reduced by dividing by the GCD.

### Example
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = 6 * x + 4 * y + 2
print(qbpp.gcd(f))    # 2
g = f / qbpp.gcd(f)   # 3*x + 2*y + 1
```

## Simplify functions: `simplify()`, `simplify_as_binary()`, `simplify_as_spin()`
For a `pyqbpp.Expr` object `f`, the member function **`f.simplify()`** performs the following operations in place:
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
f = qbpp.Expr(x * x + x)
f.simplify_as_binary()  # 2*x (since x^2 = x)

g = qbpp.Expr(x * x + x)
g.simplify_as_spin()    # 1 + x (since x^2 = 1)
```

## Evaluation function: `f(ml)`
The evaluation function takes a list of `(variable, value)` pairs, where each pair defines a mapping from a variable to an integer value.

For a `pyqbpp.Expr` object `f` and a list of pairs `ml`, the evaluation function `f(ml)` evaluates the value of `f` under the variable assignments specified by `ml` and returns the resulting integer value.

All variables appearing in `f` must have corresponding mappings defined in `ml`.

### Example
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = 3 * x + 2 * y + 1

print(f([(x, 1), (y, 0)]))  # 4  (= 3*1 + 2*0 + 1)
```

## Replace functions: `replace()`
The `replace()` function accepts a list of `(variable, expression)` pairs, where the expression can also be an integer value.

For a `pyqbpp.Expr` object `f` and a list of pairs `ml`:
- **`pyqbpp.replace(f, ml)`** (global function):
Returns a new `pyqbpp.Expr` object obtained by replacing variables in `f` according to the mappings in `ml`, without modifying `f`.
- **`f.replace(ml)`** (member function):
Replaces variables in `f` according to the mappings in `ml` in place and returns the resulting `pyqbpp.Expr` object.

### Creating a list of pairs
```python
import pyqbpp as qbpp

ml = [(x, 0), (y, 1)]                    # List of (variable, expression) pairs
ml = [(x, 0), (y, qbpp.Expr(z))]         # Expressions can also be integer values
```

### Example
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = 2 * x + 3 * y + 1

ml = [(x, 1), (y, 0)]
g = qbpp.replace(f, ml)   # g = 2*1 + 3*0 + 1 = 3 (new Expr)
f.replace(ml)         # f is modified in place
```

### Comparison with C++ QUBO++

| C++ QUBO++                    | PyQBPP                          |
|-------------------------------|-----------------------------------|
| `qbpp::MapList ml;`           | `ml = []`                         |
| `ml.push_back({x, 0});`      | `ml.append((x, 0))`              |
| `qbpp::replace(f, ml)`       | `qbpp.replace(f, ml)`                  |
| `f.replace(ml)`              | `f.replace(ml)`                   |

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
k = qbpp.binary_to_spin(h)   # 2 + 2*b  (replaced b with (b+1)/2, multiplied by 2)
```

### Comparison with C++ QUBO++

<table>
<thead>
<tr><th>C++ QUBO++</th><th>PyQBPP</th></tr>
</thead>
<tbody>
<tr><td><code>qbpp::spin_to_binary(f)</code></td><td><code>qbpp.spin_to_binary(f)</code></td></tr>
<tr><td><code>f.spin_to_binary()</code></td><td><code>f.spin_to_binary()</code></td></tr>
<tr><td><code>qbpp::binary_to_spin(f)</code></td><td><code>qbpp.binary_to_spin(f)</code></td></tr>
<tr><td><code>f.binary_to_spin()</code></td><td><code>f.binary_to_spin()</code></td></tr>
</tbody>
</table>

## Slice functions: `v[from:to]`

Python slice notation extracts a sub-range from an `Array`. Slicing returns a new `Array`.

- **`v[from:to]`**: Elements in `[from, to)` along the outermost dimension.
- **`v[:n]`**: First `n` elements. Equivalent to C++ `head(v, n)`.
- **`v[-n:]`**: Last `n` elements. Equivalent to C++ `tail(v, n)`.

For multi-dimensional arrays, use tuple indexing to slice along inner dimensions:

- **`v[:, from:to]`**: Slice each row (dim=1). Equivalent to C++ `slice(v, from, to, 1)`.
- **`v[:, :, from:to]`**: Slice along dim=2. Works for any depth.

### Example
```python
import pyqbpp as qbpp

x = qbpp.var("x", 3, 5)
print(x[:, :3])     # first 3 columns of each row
print(x[1:3, 2:4])  # rows 1-2, columns 2-3
```

## Concat function: `concat()`

The `concat()` function joins arrays or prepends/appends scalars.

- **`qbpp.concat(a, b)`**: Concatenates two arrays along the outermost dimension.
- **`concat(scalar, v)`**: Prepends a scalar (converted to `Expr`).
- **`concat(v, scalar)`**: Appends a scalar.
- **`concat(scalar, v, dim)`**: `dim=0` prepends a row filled with scalar; `dim=1` prepends scalar to each row.
- **`concat(v, scalar, dim)`**: `dim=0` appends a row; `dim=1` appends to each row.

### Example
```python
import pyqbpp as qbpp

x = qbpp.var("x", 4)
y = qbpp.concat(1, qbpp.concat(x, 0))
# y = [1, x[0], x[1], x[2], x[3], 0]

z = qbpp.var("z", 3, 4)
zg = qbpp.concat(1, qbpp.concat(z, 0, 1), 1)
# each row: [1, z[i][0], ..., z[i][3], 0]
```

### Comparison with C++ QUBO++

<table>
<thead>
<tr><th>C++ QUBO++</th><th>PyQBPP</th></tr>
</thead>
<tbody>
<tr><td><code>qbpp::head(v, n)</code></td><td><code>v[:n]</code></td></tr>
<tr><td><code>qbpp::tail(v, n)</code></td><td><code>v[-n:]</code></td></tr>
<tr><td><code>qbpp::slice(v, from, to)</code></td><td><code>v[from:to]</code></td></tr>
<tr><td><code>qbpp::head(v, n, 1)</code></td><td><code>v[:, :n]</code></td></tr>
<tr><td><code>qbpp::tail(v, n, 1)</code></td><td><code>v[:, -n:]</code></td></tr>
<tr><td><code>qbpp::concat(1, v)</code></td><td><code>qbpp.concat(1, v)</code></td></tr>
<tr><td><code>qbpp::concat(1, v, 0)</code></td><td><code>qbpp.concat(1, v, 0)</code></td></tr>
<tr><td><code>qbpp::concat(1, v, 1)</code></td><td><code>qbpp.concat(1, v, 1)</code></td></tr>
</tbody>
</table>

## Term Member Functions

The following member functions of `pyqbpp.Term` provide read-only access to the internal structure of a term.

| Expression | Return Type | Description |
|------------|-------------|-------------|
| `t.coeff()` | `int` | Return the coefficient |
| `t.degree()` | `int` | Return the degree (number of variables) |
| `t.var(i)` | `Var` | Return the `i`-th variable |
| `t.has(v)` | `bool` | Return `True` if `Var` `v` appears in the term |

### Example
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
t = 3 * x * y

t.coeff()    # 3
t.degree()   # 2
t.var(0)     # x
t.var(1)     # y
t.has(x)     # True
t.has(z)     # False
```

## Expr Member Functions

The following member functions of `pyqbpp.Expr` provide read-only access to the internal structure of an expression.

| Expression | Return Type | Description |
|------------|-------------|-------------|
| `f.constant()` | `int` | Return the constant term |
| `f.term_count()` | `int` | Return the number of terms (excluding the constant) |
| `f.term_count(d)` | `int` | Return the number of terms of degree `d` |
| `f.term(i)` | `Term` | Return a copy of the `i`-th term |
| `f.max_degree()` | `int` | Return the maximum degree of all terms |
| `f.has(v)` | `bool` | Return `True` if `Var` `v` appears in the expression |

### Example
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = qbpp.simplify(3 * x + 2 * x * y + 5)
# f = 5 + 3*x + 2*x*y

f.constant()          # 5
f.term_count()        # 2
f.term(0)             # 3*x
f.term(1)             # 2*x*y
f.term(1).coeff()     # 2
f.term(1).var(0)      # x
f.term(1).var(1)      # y
f.max_degree()        # 2
f.has(x)              # True
f.has(y)              # True
```