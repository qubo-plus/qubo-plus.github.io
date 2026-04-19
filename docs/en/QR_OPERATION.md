---
layout: default
nav_exclude: true
title: "QR: Operations"
nav_order: 31
lang: en
hreflang_alt: "ja/QR_OPERATION"
hreflang_lang: "ja"
---

# Quick Reference: Operators and Functions for Expressions

The table below summarizes the operators and functions available for `qbpp::Expr` objects.

| Operators/Functions           | Operator Symbols/Function Names                      | Function Type | Return Type    | Argument Type          |
|-------------------------------|------------------------------------------------------|---------------|----------------|------------------------|
| Type Conversion               | `toExpr()`                                             | Global        | `qbpp::Expr`     | `ExprType`               |
| Assignment                    | `=`                                                  | Member        | `qbpp::Expr`     | `ExprType`               |
| Binary Operators              | `+`, `-`, `*`                                        | Global        | `qbpp::Expr`     | `ExprType`-`ExprType`      |
| Compound Assignment Operators | `+=`, `-=`, `*=`                                     | Member        | `qbpp::Expr`     | `ExprType`               |
| Division                      | `/`                                                  | Global        | `qbpp::Expr`     | `ExprType`-`Int`           |
| Compound Division             | `/=`                                                 | Member        | `qbpp::Expr`     | `Int`                    |
| Unary Operators               | `+`, `-`                                             | Global        | `qbpp::Expr`     | `ExprType`               |
| Comparison (Equality)         | `==`                                                 | Global        | `qbpp::Expr` (constraint) | `ExprType`-`Int`           |
| Comparison (Range Comparison) | `<= <=`                                              | Global        | `qbpp::Expr` (constraint) | `IntInf`-`ExprType`-`IntInf` |
| Square                        | `sqr()`                                                | Global        | `qbpp::Expr`     | `ExprType`               |
| Square                        | `sqr()`                                                | Member        | `qbpp::Expr`     | -                      |
| GCD                           | `gcd()`                                                | Global        | `Int`            | `ExprType`               |
| Simplify                      | `simplify()`, `simplify_as_binary()`, `simplify_as_spin()` | Global        | `qbpp::Expr`     | `ExprType`               |
| Simplify                      | `simplify()`, `simplify_as_binary()`, `simplify_as_spin()` | Member        | `qbpp::Expr`     | -                      |
| Eval                          | `operator()`                                           | Member        | `Int`            | `ExprType`-`qbpp::MapList`       |
| Replace                       | `replace()`                                            | Global        | `qbpp::Expr`     | `ExprType`-`qbpp::MapList`       |
| Replace                       | `replace()`                                            | Member        | `qbpp::Expr`     | `qbpp::MapList`                |
| Binary/Spin Conversion        | `binary_to_spin()`, `spin_to_binary()`                   | Global        | `qbpp::Expr`     | `ExprType`               |
| Binary/Spin Conversion        | `binary_to_spin()`, `spin_to_binary()`                   | Member        | `qbpp::Expr`     | -                      |
| Slice (tuple indexing)        | `operator()`                                             | Member        | `Array`          | -                        |
| Concatenation                 | `concat()`                                               | Global        | `Array`          | `Array`-`Array`     |
| Concatenation (with scalar)   | `concat()`                                               | Global        | `Array`          | `Expr`-`Array`         |

## Type Conversion: **`qbpp::toExpr()`**
The global function **`qbpp::toExpr()`** converts its argument into a `qbpp::Expr` instance and returns it.
The argument may be:
- an integer
- a variable (`qbpp::Var`)
- a product term (`qbpp::Term`)
- an expression (`qbpp::Expr`) — in this case, no conversion is performed

We refer to these argument types collectively as `ExprType`.


## Expression-related type: **`ExprType`**
The term **`ExprType`** denotes a category of types that can be converted to a `qbpp::Expr` object.

## Integer-Related Types: **`Int`** and **`IntInf`**
- **`Int`**: ordinary integers
- **`IntInf`**: either an integer, `-qbpp::inf`, or `+qbpp::inf`, representing infinite bounds.

## Global and Member Functions
Operators and functions related to `qbpp::Expr` are provided in two forms:
- **Global functions**:
These take at least one ExprType argument and typically return a new `qbpp::Expr` object without modifying the inputs.
- **Member functions**:
These are member functions of the `qbpp::Expr` class.
In many cases, they update the calling object and also return the resulting `qbpp::Expr`.

### Example: `sqr()`
The `sqr()` function computes the square of an expression and is available in both forms:
- `sqr(f)` (global): returns the square of f without modifying f
- `f.sqr()` (member): updates f to its square and returns the updated expression

## Assignment Operator: `=`
The left-hand side must be a `qbpp::Expr` object.
The right-hand side must be an `ExprType`, which is first converted to a `qbpp::Expr`.
The converted expression is then assigned to the left-hand side.

## Binary Operators: `+`, `-`, `*`
These operators are defined as global functions.
They take two `ExprType` operands, compute the result, and return it.
If at least one operand is a `qbpp::Expr`, the result is always a `qbpp::Expr`.
If neither operand is a `qbpp::Expr`, the result may be a `qbpp::Term`.

### Example
For a variable `x` of type `qbpp::Var`:
- `2 + x`: `qbpp::Expr`
- `2 * x`: `qbpp::Term`

## Compound Assignment Operators: `+=`, `-=`, `*=`
These operators are defined as member functions.
The left-hand side must be a `qbpp::Expr`.
The specified operation is applied using the right-hand side operand.
The left-hand side expression is updated in place.

## Division `/` and Compound Division `/=`
The division operator `/` is defined as a global function.

It takes a non-integer `ExprType` operand as the **dividend** and an integer operand as the **divisor**, and returns the **quotient** as a `qbpp::Expr`.

The dividend expression must be divisible by the divisor; that is,
both the integer constant term and all integer coefficients in the expression must be divisible by the divisor.

The compound division operator `/=` is defined as a member function.
- The left-hand side must be a `qbpp::Expr`.
- The right-hand side must be an integer.

The same divisibility condition applies, and the division is performed in place, updating the left-hand side expression.

## Comparison (Equality): `==`
The equality comparison operator `==` takes:
- a non-integer `ExprType` on the left-hand side, and
- an integer on the right-hand side.

It returns an expression whose minimum value is 0 when the equality constraint is satisfied.
More specifically, for a non-integer `ExprType` object `f` and an integer `n`, the operator returns: `qbpp::sqr(f-n)`.

For the returned object `g`:
- **`g`** represents the constraint expression `qbpp::sqr(f - n)`, and
- **`g.body()`** returns the underlying expression `f`.

### Constraint-expression `qbpp::Expr`

Here, `g` is a constraint-expression `qbpp::Expr` (a plain `qbpp::Expr` carrying penalty + body metadata).
Calling `g.body()` returns the associated underlying `qbpp::Expr` object.

## Comparison (Range Comparison): `<= <=`
The **range comparison operator** is written in the form:
```cpp
l <= f <= u
```
where:
- `f` is a non-integer ExprType, and
- `l` and `u` are integers.

This operator returns an expression whose minimum value is 0 when the range constraint is satisfied.

More specifically, an auxiliary integer variable `a` with unit gaps, taking values in the range `[l,u−1]`, is implicitly introduced, and the operator returns:
```cpp
(f - a)(f - (a + 1))
```

For the returned constraint-expression `qbpp::Expr` object `g`:
- **`g`** represents the constraint expression `(f - a)(f - (a + 1))`, and
- **`g.body()`** returns the underlying expression `f`.

## Square functions: `sqr()`
For a qbpp::Expr object `f`:
- **`qbpp::sqr(f)`** (global function): Returns the expression `f * f`.
The argument `f` may be a non-integer `ExprType` object.
- **`f.sqr()`** (member function):
Updates `f` in place by replacing it with `f * f`, and returns the updated expression.

## Greatest Common Divisor function `gcd()`
The global function **`gcd()`** takes a `qbpp::Expr` object as its argument and returns the greatest common divisor (GCD) of all integer coefficients and the integer constant term.

Since the given `qbpp::Expr` object is divisible by the resulting GCD, all integer coefficients and the integer constant term can be reduced by dividing by the GCD without changing the structure of the expression or its optimal solutions.


## Simplify functions: `simplify()`, `simplify_as_binary()`, `simplify_as_spin()`
For a `qbpp::Expr` object `f`, the member function **`f.simplify()`** performs the following operations in place:
- Sort variables within each term according to their unique variable IDs
- Merge duplicated terms
- Sort terms such that:
  - lower-degree terms appear earlier, and
  - terms of the same degree are ordered lexicographically.

The global function **`qbpp::simplify(f)`** performs the same operations without modifying `f`.

### Binary and Spin Simplification
Two specialized variants of the simplification function are provided:
- **`simplify_as_binary()`**:
Simplification is performed under the assumption that all variables take binary values
$\lbrace 0,1\rbrace$.
The identity $x^2=x$ is applied to all variables $x$.
- **`simplify_as_spin()`**
Simplification is performed under the assumption that all variables take spin values
$\lbrace -1,+1\rbrace$.
The identity $x^2=1$ is applied to all variables $x$.

Both variants are available as member functions and global functions:
- Member functions: These perform simplification in place and update `f`.
  - `f.simplify_as_binary()`
  - `f.simplify_as_spin()`
- Global functions: These return a simplified expression without modifying f.
  - `qbpp::simplify_as_binary(f)`
  - `qbpp::simplify_as_spin(f)`

## Evaluation function
A **`qbpp::MapList`** object stores a list of pairs consisting of a `qbpp::Var` object and an integer.
Each pair defines a mapping from a variable to an integer value.

For a `qbpp::Expr` object `f` and a `qbpp::MapList` object `ml`, the evaluation function `f(ml)` evaluates the value of `f` under the variable assignments specified by `ml` and returns the resulting integer value.

All variables appearing in `f` must have corresponding mappings defined in `ml`.

## Replace Functions: `replace()`
A **`qbpp::MapList`** object may also contain pairs consisting of a `qbpp::Var` object and an `ExprType` object.
Such pairs define mappings from variables to expressions.

For a `qbpp::Expr` object `f` and a `qbpp::MapList` object `ml`:
- **`qbpp::replace(f, ml)`**:
Returns a new `qbpp::Expr` object obtained by replacing variables in `f` according to the mappings in `ml`, without modifying `f`.
- **`f.replace(ml)`**:
Replaces variables in `f` according to the mappings in `ml` in place and returns the resulting `qbpp::Expr` object.

## Binary/Spin Conversion functions: `spin_to_binary()`, `binary_to_spin()`
Let `x` be a binary variable and s be a spin variable.
We assume that `x = 1` if and only if `s = 1`.
Under this assumption, the following relations hold:

$$
\begin{aligned}
 s &= 2x-1 \\
 x &= (s+1)/2
\end{aligned}
$$

Let $f(s)$ be a function of a spin variable $s$.
Then the function $g(x)=f(2x−1)$ is a function of the binary variable $x$ that yields the same value under the above relation.

The **`spin_to_binary()`** function uses this relation to convert a `qbpp::Expr` object representing a function of spin variables into an equivalent `qbpp::Expr` object representing a function of binary variables.
More specifically, it replaces all spin variables `s` in `f` by `2 * s - 1`.
- **`qbpp::spin_to_binary(f)`**:
Produces and returns a new `qbpp::Expr` object by replacing all spin variables `s` in `f` with `2 * s - 1`.
- **`f.spin_to_binary()`**:
Updates `f` in place using `qbpp::spin_to_binary(f)` and returns the updated expression.

Similarly, the **`binary_to_spin()`** function replaces all binary variables `x` in `f` by `(x + 1) / 2`.
The resulting expression may contain non-integer coefficients.
Therefore, the entire expression is multiplied by
$2^d$ where $d$ is the maximum degree of all terms, so that all coefficients become integers.

As with `spin_to_binary()`, both global and member function variants of `binary_to_spin()` are provided.

## Tuple indexing `a(...)`

`Array::operator()` provides Python-like tuple indexing to extract sub-arrays. Each argument specifies one axis:

| Argument | Meaning | Dimension change |
|---|---|---|
| integer `i` | Fix the axis at `i` | Axis removed |
| `qbpp::all` | Full range `:` | Axis kept |
| `qbpp::slice(from, to)` | Range `[from, to)` | Axis kept |
| `qbpp::end` / `qbpp::end - n` | Position computed from the axis size | Fix or range endpoint |

Trailing axes not given are implicitly `qbpp::all`.

The output is built with a single call to the unified `view` C ABI, so the copy cost is **O(output_size)**, independent of the input size.

### Examples

```cpp
// 2D array
auto x = qbpp::var("x", 3, 4);
auto row0 = x(0);                        // fix axis 0 to 0 → 1D (4,)
auto col2 = x(qbpp::all, 2);             // fix axis 1 to 2 → 1D (3,)
auto sub  = x(qbpp::slice(0, 2), qbpp::slice(1, 3));  // 2D (2, 2)

// 3D array
auto y = qbpp::var("y", 2, 3, 4);
auto s  = y(1, qbpp::all, 3);            // fix axes 0 and 2 → 1D (3,)
auto v  = y(1, 2, 3);                    // all axes fixed → Var

// end (MATLAB-like)
auto last5 = x(qbpp::slice(qbpp::end - 5, qbpp::end));  // last 5 elements
auto mid   = x(qbpp::all, qbpp::slice(1, qbpp::end - 1));  // interior only
```

For more details and examples, see **[Slice and Concat Functions](SLICE_CONCAT)**.

## Concat Functions: `concat()`
The concat functions join arrays or append/prepend scalars.

### Array + Array
- **`qbpp::concat(a, b)`**: Concatenates two arrays of the same type along the outermost dimension.

### Scalar + Array / Array + Scalar
- **`qbpp::concat(scalar, v)`**: Prepends a scalar to an array. Returns `Array`.
- **`qbpp::concat(v, scalar)`**: Appends a scalar to an array. Returns `Array`.

The scalar is implicitly converted to `qbpp::Expr`.

### 2D Concat with Dimension
- **`qbpp::concat(a, b, dim)`**: Concatenates two 2D arrays along the specified dimension.
  - `dim=0`: row concatenation (appends rows)
  - `dim=1`: column concatenation (appends columns; both must have the same number of rows)

### Example: Boundary Difference
```cpp
auto x = qbpp::var("x", 4);
auto diff = qbpp::concat(1, x) - qbpp::concat(x, 0);
// diff = {1-x[0], x[0]-x[1], x[1]-x[2], x[2]-x[3], x[3]-0}
```

## Term Member Functions

The following member functions of `qbpp::Term` provide read-only access to the internal structure of a term.

| Expression | Return Type | Description |
|------------|-------------|-------------|
| `t.coeff()` | `coeff_t` | Return the coefficient |
| `t.degree()` | `uint32_t` | Return the degree (number of variables) |
| `t.var(i)` | `qbpp::Var` | Return the `i`-th variable |
| `t.has(v)` | `bool` | Return `true` if `Var` `v` appears in the term |

### Example
```cpp
auto x = qbpp::var("x");
auto y = qbpp::var("y");
auto z = qbpp::var("z");
qbpp::Term t = 3 * x * y;

t.coeff();    // 3
t.degree();   // 2
t.var(0);     // x
t.var(1);     // y
t.has(x);     // true
t.has(z);     // false
```

## Expr Member Functions

The following member functions of `qbpp::Expr` provide read-only access to the internal structure of an expression.

| Expression | Return Type | Description |
|------------|-------------|-------------|
| `f.constant` | `energy_t` | Return the constant term |
| `f.term_count()` | `size_t` | Return the number of terms (excluding the constant) |
| `f.term_count(d)` | `size_t` | Return the number of terms of degree `d` |
| `f.term(i)` | `qbpp::Term` | Return a copy of the `i`-th term |
| `f.max_degree` | `uint32_t` | Return the maximum degree of all terms |
| `f.has(v)` | `bool` | Return `true` if `Var` `v` appears in the expression |
| `f.has(vi)` | `bool` | Return `true` if all variables of the integer variable `vi` appear in the expression |

### Example
```cpp
auto x = qbpp::var("x");
auto y = qbpp::var("y");
qbpp::Expr f = qbpp::simplify(3 * x + 2 * x * y + 5);
// f = 5 + 3*x + 2*x*y

f.constant;          // 5
f.term_count();        // 2
f.term(0);             // 3*x
f.term(1);             // 2*x*y
f.term(1).coeff();     // 2
f.term(1).var(0);      // x
f.term(1).var(1);      // y
f.max_degree;        // 2
f.has(x);              // true
f.has(y);              // true
```