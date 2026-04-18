---
layout: default
nav_exclude: true
title: "Multi-dimensional Variables"
nav_order: 13
lang: en
hreflang_alt: "ja/python/MULTIDIM"
hreflang_lang: "ja"
---

# Multi-dimensional Variables and Expressions

## Defining multi-dimensional variables
PyQBPP supports **multi-dimensional variables** and **multi-dimensional integer variables** of arbitrary depth using the `var()` function.
Their basic usage is as follows:
- `var("name", shape=(s1, s2, ..., sd))`: Creates an array of variables with the given `name` and shape $s_1\times s_2\times \cdots\times s_d$.
- `var("name", shape=(s1, s2, ..., sd), between=(l, u))`: Creates an array of integer variables with the specified range and shape.

The following program creates a binary variable with dimension $2\times 3\times 4$:
```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(2, 3, 4))
print("x =", x)
```
{% raw %}
Each variable in **`x`** can be accessed as **`x[i][j][k]`**.
{% endraw %}

## Arrays of constants, variables, and expressions

Passing a Python list to **`qbpp.array(list)`** creates an array whose element type is automatically deduced from the first element (equivalent to `qbpp::array()` in C++):

| Call form | Result | Description |
|---|---|---|
| `qbpp.array([1, 2, 3])` | 1D integer constant array | Integer constant array |
| `qbpp.array([[1,2],[3,4]])` | 2D integer constant array | 2-D integer constant array |
| `qbpp.array([v1, v2])` | 1D binary variable array | Binary variable array |
| `qbpp.array([e1, e2])` | 1D expression array | Expression array |

Integer constant arrays can be used in element-wise operations with variable arrays. The following program computes the sum of the element-wise product of a $2\times 2$ integer constant matrix `c` and a binary variable matrix `x`:
```python
import pyqbpp as qbpp

c = qbpp.array([[1, 2], [3, 4]])
x = qbpp.var("x", shape=(2, 2))
f = qbpp.sum(c * x)
print("f =", f)
```
`c * x` returns an element-wise product, and `qbpp.sum` sums all elements into a single expression. The output of this program is:
```
f = x[0][0] +2*x[0][1] +3*x[1][0] +4*x[1][1]
```

## Creating integer variable arrays with individual ranges

When defining a multi-dimensional array of integer variables, all elements created by `qbpp.var("name", shape=(s1, s2, ...), between=(l, u))` share the same range $[l, u]$.
In many practical problems, however, each element may need a different range.
There are three approaches to achieve this.

### Approach 1: Placeholder array

First create a **placeholder array** using **`qbpp.var("name", shape=..., equal=val)`**, then assign individual ranges to each element using `qbpp.constrain()`:

```python
import pyqbpp as qbpp

max_vals = [3, 7, 15, 5]
x = qbpp.var("x", shape=len(max_vals), equal=0)
for i in range(len(max_vals)):
    x[i] = qbpp.constrain(x[i], between=(0, max_vals[i]))
for i in range(len(max_vals)):
    print(f"x[{i}] = {x[i]}")
```
Here, `qbpp.var("x", shape=4, equal=0)` creates a mutable array of 4 integer variable placeholders, each initialized with the constant value 0.
Each element is then reassigned with its own range using `qbpp.constrain(x[i], between=(0, max_vals[i]))`.
The `qbpp.constrain()` function automatically inherits the name from the placeholder, so no explicit name is needed.

> **NOTE**
> The `equal=` value can be any integer (not just 0). It allocates a mutable array in memory where each element can be individually reassigned.
> It does **not** create an equality constraint.

### Approach 2: Passing lists to `between=`

You can pass Python lists as the `between` bounds.
Each element of the array will be assigned the corresponding range from the lists:

```python
import pyqbpp as qbpp

max_vals = [3, 7, 15, 5]
x = qbpp.var("x", shape=len(max_vals), between=(0, max_vals))
for i in range(len(max_vals)):
    print(f"x[{i}] = {x[i]}")
```

This is the most concise approach. The `shape=` specifies the array dimensions, and
`between=` assigns individual ranges from the lists element by element.
This is analogous to the C++ syntax `lower <= qbpp::var_int("x", n) <= upper`.

### Approach 3: List comprehension with array

You can also use a Python list comprehension wrapped with `qbpp.array()`:

```python
import pyqbpp as qbpp

max_vals = [3, 7, 15, 5]
x = qbpp.array([qbpp.var(f"x[{i}]", between=(0, max_vals[i]))
                  for i in range(len(max_vals))])
```

This approach creates the variables directly without placeholders.
Note that an explicit name (e.g., `f"x[{i}]"`) must be provided for each variable,
and the result must be wrapped with `qbpp.array()` to enable element-wise operations.

## Defining multi-dimensional expressions
PyQBPP allows you to define **multi-dimensional expressions** with arbitrary depth using the function `expr()`:
- **`expr(shape=(s1, s2, ..., sd))`**: Creates a multi-dimensional array of expressions with shape $s_1\times s_2\times \cdots\times s_d$.

The following program defines a 3-dimensional array **`x`** of variables with shape $2\times 3\times 4$ and
a 2-dimensional array `f` of size $2\times 3$.
Then, using nested loops, each `f[i][j]` accumulates the sum of `x[i][j][0]` through `x[i][j][3]`:
```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(2, 3, 4))
f = qbpp.expr(shape=(2, 3))
for i in range(2):
    for j in range(3):
        for k in range(4):
            f[i][j] += x[i][j][k]
f.simplify_as_binary()

for i in range(2):
    for j in range(3):
        print(f"f[{i}][{j}] =", f[i][j])
```
This program produces the following output:
```
f[0][0] = x[0][0][0] +x[0][0][1] +x[0][0][2] +x[0][0][3]
f[0][1] = x[0][1][0] +x[0][1][1] +x[0][1][2] +x[0][1][3]
f[0][2] = x[0][2][0] +x[0][2][1] +x[0][2][2] +x[0][2][3]
f[1][0] = x[1][0][0] +x[1][0][1] +x[1][0][2] +x[1][0][3]
f[1][1] = x[1][1][0] +x[1][1][1] +x[1][1][2] +x[1][1][3]
f[1][2] = x[1][2][0] +x[1][2][1] +x[1][2][2] +x[1][2][3]
```

## Creating an array of expressions by operations
An array of expressions can be created without explicitly calling `expr()`.
When an arithmetic operation yields an array-shaped result, an array of expressions with the same shape is created automatically.

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(2, 3))
f = x + 1
f += x - 2
f.simplify_as_binary()
for i in range(2):
    for j in range(3):
        print(f"f[{i}][{j}] =", f[i][j])
```
This program outputs:
```
f[0][0] = -1 +2*x[0][0]
f[0][1] = -1 +2*x[0][1]
f[0][2] = -1 +2*x[0][2]
f[1][0] = -1 +2*x[1][0]
f[1][1] = -1 +2*x[1][1]
f[1][2] = -1 +2*x[1][2]
```

## Iterating over multi-dimensional arrays
Since PyQBPP arrays support Python iteration, nested for loops can be used:
```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(2, 3))
f = x + 1
f += x - 2
f.simplify_as_binary()
for row in f:
    for element in row:
        print(f"({element})", end="")
    print()
```
This program outputs:
```
(-1 +2*x[0][0])(-1 +2*x[0][1])(-1 +2*x[0][2])
(-1 +2*x[1][0])(-1 +2*x[1][1])(-1 +2*x[1][2])
```

## array and Python `list`

PyQBPP's array is an opaque object backed by the QUBO++ shared library (`.so`).
It is **not** a Python `list` — it is a specialized data structure optimized for QUBO++ operations.

### Creating an array from a Python list

You can convert a Python list into an array using `qbpp.array()`:

```python
w = qbpp.array([64, 27, 47, 74, 12, 83, 63, 40])
```

Once converted, the array supports element-wise arithmetic (`+`, `-`, `*`, `/`, `~`), `sum()`, `sqr()`, `simplify()`, and other QUBO++ functions efficiently.

### When you don't need `qbpp.array()`

When a Python list is used in an arithmetic operation with an array, it is automatically converted.
For example:

```python
w = [64, 27, 47, 74, 12, 83, 63, 40]
x = qbpp.var("x", shape=len(w))
f = w * x       # list * Array → element-wise multiplication
```

In this case, wrapping `w` with `qbpp.array()` is not necessary.
However, if `w` is used repeatedly in multiple operations, wrapping it once with `qbpp.array()` can improve performance by avoiding repeated conversions from `list` to array.

### Example: `list` vs array behavior

The following example illustrates the difference between a Python `list` and an array:

```python
import pyqbpp as qbpp

x = qbpp.var("x")
u = [x+2, x+3, x+5, x+7]
w = qbpp.array([x+2, x+3, x+5, x+7])
print(f"2 * u = {2 * u}")
print(f"2 * w = {2 * w}")
```

Output:
```
2 * u = [2 +x, 3 +x, 5 +x, 7 +x, 2 +x, 3 +x, 5 +x, 7 +x]
2 * w = [4 +2*x, 6 +2*x, 10 +2*x, 14 +2*x]
```

With the Python `list` `u`, `2 * u` produces a **repeated list** (8 elements).
With the array `w`, `2 * w` produces an **element-wise multiplication** (each element multiplied by 2).

### Key differences from Python `list`

| | array | Python `list` |
|---|---|---|
| **Element-wise `+`** | Element-wise addition | List concatenation |
| **Element-wise `*`** | Element-wise multiplication | List repetition |
| **`~x`** | Element-wise negation | TypeError |
| **`sum()`** | Sum of all elements as an expression | Python built-in sum |
| **`sqr()`** | Element-wise squaring | Not available |
| **`append()`, `pop()`** | Not available | Available |
| **Slicing** | `slice()`, `head()`, `tail()` | `x[1:3]` |

> **NOTE**
> An array is a fixed-size, opaque container. Python list operations such as `append()`, `pop()`, `insert()`, and slice assignment are **not** supported.
> Use QUBO++ functions like `slice()`, `head()`, `tail()` for extracting sub-arrays.
