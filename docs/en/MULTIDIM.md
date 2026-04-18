---
layout: default
nav_exclude: true
title: "Multi-dimensional Integers, Variables, and Expressions"
nav_order: 13
lang: en
hreflang_alt: "ja/MULTIDIM"
hreflang_lang: "ja"
---

# Multi-dimensional Integers, Variables, and Expressions

## Defining multi-dimensional variables
QUBO++ supports **multi-dimensional variables** (or `qbpp::Var` objects) and **multi-dimensional integer variables** (or `qbpp::VarInt` objects) of arbitrary depth using the functions `qbpp::var()` and `qbpp::var_int()`, respectively.
Their basic usage is as follows:
- `qbpp::var("name",s1,s2,...,sd)`: Creates an array of `qbpp::Var` objects with the given `name` and shape $s1\times s2\times \cdots\times sd$.
- `l <= qbpp::var_int("name",s1,s2,...,sd) <= u`: Creates an array of `qbpp::VarInt` objects with the specified range and shape $s1\times s2\times \cdots\times sd$.

The following QUBO++ program creates a binary variable and an integer variable, each with dimension $2\times 3\times 4$.
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 2, 3, 4);
  auto y = 1 <= qbpp::var_int("y", 2, 3, 4) <= 8;
  std::cout << "x : " << x << std::endl;
  std::cout << "y : " << y << std::endl;
}
```
This program outputs the following:
{% raw %}
```
x : {{{x[0][0][0],x[0][0][1],x[0][0][2],x[0][0][3]},{x[0][1][0],x[0][1][1],x[0][1][2],x[0][1][3]},{x[0][2][0],x[0][2][1],x[0][2][2],x[0][2][3]}},{{x[1][0][0],x[1][0][1],x[1][0][2],x[1][0][3]},{x[1][1][0],x[1][1][1],x[1][1][2],x[1][1][3]},{x[1][2][0],x[1][2][1],x[1][2][2],x[1][2][3]}}}
y : {{{1 +y[0][0][0][0] +2*y[0][0][0][1] +4*y[0][0][0][2],1 +y[0][0][1][0] +2*y[0][0][1][1] +4*y[0][0][1][2],1 +y[0][0][2][0] +2*y[0][0][2][1] +4*y[0][0][2][2],1 +y[0][0][3][0] +2*y[0][0][3][1] +4*y[0][0][3][2]},{1 +y[0][1][0][0] +2*y[0][1][0][1] +4*y[0][1][0][2],1 +y[0][1][1][0] +2*y[0][1][1][1] +4*y[0][1][1][2],1 +y[0][1][2][0] +2*y[0][1][2][1] +4*y[0][1][2][2],1 +y[0][1][3][0] +2*y[0][1][3][1] +4*y[0][1][3][2]},{1 +y[0][2][0][0] +2*y[0][2][0][1] +4*y[0][2][0][2],1 +y[0][2][1][0] +2*y[0][2][1][1] +4*y[0][2][1][2],1 +y[0][2][2][0] +2*y[0][2][2][1] +4*y[0][2][2][2],1 +y[0][2][3][0] +2*y[0][2][3][1] +4*y[0][2][3][2]}},{{1 +y[1][0][0][0] +2*y[1][0][0][1] +4*y[1][0][0][2],1 +y[1][0][1][0] +2*y[1][0][1][1] +4*y[1][0][1][2],1 +y[1][0][2][0] +2*y[1][0][2][1] +4*y[1][0][2][2],1 +y[1][0][3][0] +2*y[1][0][3][1] +4*y[1][0][3][2]},{1 +y[1][1][0][0] +2*y[1][1][0][1] +4*y[1][1][0][2],1 +y[1][1][1][0] +2*y[1][1][1][1] +4*y[1][1][1][2],1 +y[1][1][2][0] +2*y[1][1][2][1] +4*y[1][1][2][2],1 +y[1][1][3][0] +2*y[1][1][3][1] +4*y[1][1][3][2]},{1 +y[1][2][0][0] +2*y[1][2][0][1] +4*y[1][2][0][2],1 +y[1][2][1][0] +2*y[1][2][1][1] +4*y[1][2][1][2],1 +y[1][2][2][0] +2*y[1][2][2][1] +4*y[1][2][2][2],1 +y[1][2][3][0] +2*y[1][2][3][1] +4*y[1][2][3][2]}}}
```
{% endraw %}
Each `qbpp::Var` object in **`x`** can be accessed as **`x[i][j][k]`**.
Each `qbpp::VarInt` object in **`y`** can be accessed as **`y[i][j][k]`**,
which is internally represented by three binary variables:
- **`y[i][j][k][0]`**
- **`y[i][j][k][1]`**
- **`y[i][j][k][2]`**

corresponding to the binary encoding of integers in the specified range.

## Integer constant arrays (`qbpp::array`)

**`qbpp::array`** is a factory function that creates arrays of integer constants:

| Call form | Return type | Description |
|---|---|---|
| `qbpp::array({v1, v2, ...})` | 1-D integer constant array | 1-D integer constant array |
| `qbpp::array({% raw %}{{a,b},{c,d}}{% endraw %})` | 2-D integer constant array | 2-D integer constant array |
| `qbpp::array(s1, s2, ...)` | multi-dimensional integer array | Zero-initialized integer array (shape specified) |

Integer constant arrays can be used in element-wise operations with variable arrays. The following program computes the sum of the element-wise product of a $2\times 2$ integer constant matrix `c` and a binary variable matrix `x`:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto c = qbpp::array({{1, 2}, {3, 4}});
  auto x = qbpp::var("x", 2, 2);
  auto f = qbpp::sum(c * x);
  std::cout << "f = " << f << std::endl;
}
```
{% endraw %}
`c * x` returns an element-wise product as a 2D array of terms, and `qbpp::sum` sums all elements into a single `Expr`. The output of this program is:
```
f = x[0][0] +2*x[0][1] +3*x[1][0] +4*x[1][1]
```

## Creating integer variable arrays with individual ranges

When defining a multi-dimensional array of integer variables, all elements created by `l <= qbpp::var_int("name", s1, s2, ...) <= u` share the same range $[l, u]$.
In many practical problems, however, each element may need a different range.

In such cases, you can first create a **placeholder array** using **`qbpp::var_int("name", s1, s2, ...) == 0`**, and then assign individual ranges to each element in a loop:

```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto max_vals = qbpp::array({3, 7, 15, 5});
  auto x = qbpp::var_int("x", max_vals.size()) == 0;
  for (size_t i = 0; i < max_vals.size(); ++i) {
    x[i] = 0 <= qbpp::var_int() <= max_vals[i];
  }
  for (size_t i = 0; i < max_vals.size(); ++i) {
    std::cout << "x[" << i << "] = " << x[i] << std::endl;
  }
}
```
In this program, `qbpp::var_int("x", 4) == 0` creates an array of 4 constant-zero `VarInt` objects as placeholders.
Each element is then reassigned with its own range using `0 <= qbpp::var_int() <= max_vals[i]`.

This technique is commonly used in problems such as the **[Cutting Stock Problem](BAR_CUTTING)**, where the upper bound of each variable differs.

> **NOTE**
> The `== 0` syntax creates a `VarInt` with `min_val = max_val = 0` (i.e., a constant zero).
> It does **not** create an equality constraint.
> Any integer constant can be used, e.g., `qbpp::var_int("x", 4) == 5` creates constant-five placeholders.

## Defining multi-dimensional expressions
QUBO++ allows you to define **multi-dimensional expressions** (or `qbpp::Expr` objects) with arbitrary depth using the function `qbpp::expr()` as follows:
- **`qbpp::expr(s1,s2,...,sd)`**: Creates a multi-dimensional array of `qbpp::Expr` objects with shape $s1\times s2\times \cdots\times sd$.

The following program defines a 3-dimensional array **`x`** of `qbpp::Var` objects with shape $2\times 3\times 4$ and
a 2-dimensional array `f` of  size $2\times 3$.
Then, using a triple for-loop, each `f[i][j]` accumulates the sum of `x[i][j][0]`, `x[i][j][1]`, `x[i][j][2]`, and `x[i][j][3]`:
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 2, 3, 4);
  auto f = qbpp::expr(2, 3);
  for (size_t i = 0; i < 2; ++i) {
    for (size_t j = 0; j < 3; ++j) {
      for (size_t k = 0; k < 4; ++k) {
        f[i][j] += x[i][j][k];
      }
    }
  }
  f.simplify_as_binary();
  std::cout << "f = " << f << std::endl;
  for (size_t i = 0; i < 2; ++i) {
    for (size_t j = 0; j < 3; ++j) {
      std::cout << "f[" << i << "][" << j << "] = " << f[i][j] << std::endl;
    }
  }
}
```
Note that the `simplify_as_binary()` member function can be applied to a multi-dimensional array of `qbpp::Expr` objects.
When called on such an array, it applies `simplify_as_binary()` to each element individually (element-wise).

This program produces the following output:
{% raw %}
```
f = {{x[0][0][0] +x[0][0][1] +x[0][0][2] +x[0][0][3],x[0][1][0] +x[0][1][1] +x[0][1][2] +x[0][1][3],x[0][2][0] +x[0][2][1] +x[0][2][2] +x[0][2][3]},{x[1][0][0] +x[1][0][1] +x[1][0][2] +x[1][0][3],x[1][1][0] +x[1][1][1] +x[1][1][2] +x[1][1][3],x[1][2][0] +x[1][2][1] +x[1][2][2] +x[1][2][3]}}
f[0][0] = x[0][0][0] +x[0][0][1] +x[0][0][2] +x[0][0][3]
f[0][1] = x[0][1][0] +x[0][1][1] +x[0][1][2] +x[0][1][3]
f[0][2] = x[0][2][0] +x[0][2][1] +x[0][2][2] +x[0][2][3]
f[1][0] = x[1][0][0] +x[1][0][1] +x[1][0][2] +x[1][0][3]
f[1][1] = x[1][1][0] +x[1][1][1] +x[1][1][2] +x[1][1][3]
f[1][2] = x[1][2][0] +x[1][2][1] +x[1][2][2] +x[1][2][3]
```
{% endraw %}
## Creating an array of expressions by auto type deduction
An array of **`qbpp::Expr`** objects can be created without explicitly calling `qbpp::expr()`.
When a function call or an arithmetic operation yields an array-shaped result, an array of `qbpp::Expr` objects with the same shape can be defined using auto type deduction.

The following QUBO++ program creates an array **`f`** of `qbpp::Expr` objects with the same dimensions as an array **`x`** of `qbpp::Var` objects:
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 2, 3);
  auto f = x + 1;
  f += x - 2;
  f.simplify_as_binary();
  for (size_t i = 0; i < 2; ++i) {
    for (size_t j = 0; j < 3; ++j) {
      std::cout << "f[" << i << "][" << j << "] = " << f[i][j] << std::endl;
    }
  }
}
```
In this program, `x` is defined as a $2 \times 3$ array of `qbpp::Var` objects.
The expression `x + 1` produces a $2 \times 3$ array of `qbpp::Expr` objects, which is used to initialize `f` via auto type deduction.
After that, the expression `x - 2` is added element-wise to `f`.

This program outputs:
```
f[0][0] = -1 +2*x[0][0]
f[0][1] = -1 +2*x[0][1]
f[0][2] = -1 +2*x[0][2]
f[1][0] = -1 +2*x[1][0]
f[1][1] = -1 +2*x[1][1]
f[1][2] = -1 +2*x[1][2]
```

## Arrays
QUBO++ provides a multi-dimensional array type whose number of dimensions and element type (`qbpp::Var`, `qbpp::Expr`, `qbpp::Term`, `qbpp::VarInt`, or the integer coefficient type) are fixed at compile time.
In practice you rarely need to spell out the array type by hand: the factory functions and `auto` type deduction pick the right instantiation, and the compiler checks that operations (element-wise `+`, `-`, `*`, assignment, …) are consistent with the declared element type.
Arrays provide multi-dimensional indexing via `operator[]` chaining (e.g., `x[i][j][k]`) and element-wise arithmetic operations.

Arrays are created using the following factory functions:
- **`qbpp::var("name", s1, s2, ...)`**: multi-dimensional array of binary variables.
- **`qbpp::expr(s1, s2, ...)`**: multi-dimensional array of zero-initialized expressions.
- **`qbpp::array({v1, v2, ...})`**: 1D array of integer constants.
- **`qbpp::array(s1, s2, ...)`**: zero-initialized multi-dimensional integer array with given shape.
- **`l <= qbpp::var_int("name", s1, s2, ...) <= u`**: multi-dimensional array of integer variables.

Arrays provide the following member functions:
- **`size()`**: Returns the size of the outermost dimension.
- **`total()`**: Returns the total number of elements.
- **`ndim()`**: Returns the number of dimensions (equal to `Dim`).
- **`shape(d)`**: Returns the size of dimension `d`.
- **`empty()`**: Returns `true` if the array has no elements.
- **`operator[]`**: Returns an element (when `Dim == 1`) or a sub-array (when `Dim > 1`).
- **`begin()`** / **`end()`**: Iterators for range-based `for` loops.

> **NOTE — element type and arithmetic results**
> Arithmetic promotes the element type the same way scalar expressions do: a variable array plus `1` produces an expression array, the element-wise product of two variable arrays produces an array of terms, and so on. Compound assignments such as `+=`, `-=`, `*=` keep the left-hand side's element type fixed, so adding `1` to a variable array with `+=` is a compile-time error — use `auto f = x + 1;` to obtain an expression array instead.

In addition, arrays support the following operators for element-wise operations:
- **`+`**: Element-wise addition of two arrays, or an array and a scalar.
- **`-`**: Element-wise subtraction of two arrays, or an array and a scalar.
- **`*`**: Element-wise multiplication of two arrays, or an array and a scalar.
- unary **`-`**: Negates all elements in the array.
- unary **`~`**: Negates all variable literals in the array.

Multi-dimensional arrays are implemented as a single flat array with shape information.
For example, `x` in the following code is a 2D array of variables with shape `(2, 3)`:
```cpp
  auto x = qbpp::var("x", 2, 3);
```
The element-wise operations described above are supported for multi-dimensional arrays only when the operands have the same shape.

Multi-dimensional arrays can be accessed using index-based `for` loops with `operator[]`:
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 2, 3);
  auto f = x + 1;
  f += x - 2;
  f.simplify_as_binary();
  std::cout << "total = " << f.total() << std::endl;
  std::cout << "ndim = " << f.ndim() << std::endl;
  std::cout << "shape = (" << f.shape(0) << ", " << f.shape(1) << ")" << std::endl;
  for (size_t i = 0; i < f.size(); ++i) {
    for (size_t j = 0; j < f[i].size(); ++j) {
      std::cout << "(" << f[i][j] << ")";
    }
    std::cout << std::endl;
  }
}
```
Here, `f.total()` returns the total number of elements, `f.ndim()` the number of dimensions, and `f.shape(d)` returns the size of dimension `d`.
`f[i][j]` accesses the element at row `i`, column `j`.

This program outputs:
```
(-1 +2*x[0][0])(-1 +2*x[0][1])(-1 +2*x[0][2])
(-1 +2*x[1][0])(-1 +2*x[1][1])(-1 +2*x[1][2])
```

## Sub-array access and operations

To extract a sub-array (e.g., a row or column) from a multi-dimensional array, use the `row()`, `col()`, and `slice()` methods.
For slicing along arbitrary axes and concatenation, see **[Slice and Concat Functions](SLICE_CONCAT)**.
