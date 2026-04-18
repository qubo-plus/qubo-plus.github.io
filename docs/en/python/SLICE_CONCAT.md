---
layout: default
nav_exclude: true
title: "Slice and Concat"
nav_order: 19
lang: en
hreflang_alt: "ja/python/SLICE_CONCAT"
hreflang_lang: "en"
---

# Slice and Concat

PyQBPP supports Python-style slicing and a `concat()` function for manipulating arrays.
This page demonstrates these operations through **domain wall encoding** and the **Dual-Matrix Domain Wall** method.

## Slicing

PyQBPP arrays support standard Python slice notation. Slicing returns a new array:

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=8)
print(x[:3])     # first 3:  [x[0], x[1], x[2]]
print(x[-3:])    # last 3:   [x[5], x[6], x[7]]
print(x[2:5])    # range:    [x[2], x[3], x[4]]
```

For multi-dimensional arrays, use tuple indexing (similar to NumPy):

```python
x = qbpp.var("x", shape=(3, 5))
print(x[:, :3])    # first 3 columns of each row
print(x[:, -2:])   # last 2 columns of each row
print(x[1:3, 1:4]) # rows 1-2, columns 1-3

x = qbpp.var("x", shape=(2, 3, 4))
print(x[:, :, :2]) # first 2 elements along the 3rd dimension
```

The global functions `qbpp.slice()`, `qbpp.head()`, and `qbpp.tail()` provide
equivalent range-based slicing along a specified dimension while preserving the
number of dimensions:

```python
qbpp.slice(x, 1, 3, dim=0)   # rows 1-2 along axis 0
qbpp.head(x, 3)              # first 3 along axis 0
qbpp.tail(x, 2, dim=1)       # last 2 along axis 1
```

## Concat

The `concat()` function joins arrays or prepends/appends scalars:

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=4)

# 1D: scalar + array, array + scalar
y = qbpp.concat(1, qbpp.concat(x, 0))
# y = [1, x[0], x[1], x[2], x[3], 0]

# 2D with dim parameter
z = qbpp.var("z", shape=(3, 4))
zg0 = qbpp.concat(1, qbpp.concat(z, 0, 0), 0)  # dim=0: guard rows -> 5 x 4
zg1 = qbpp.concat(1, qbpp.concat(z, 0, 1), 1)  # dim=1: guard cols -> 3 x 6
```

### Pythonic alternative using `*` (unpack operator)

Python's unpack operator `*` can replace `concat()` by unpacking an array inside an `Array()` constructor:

```python
# 1D: equivalent to concat(1, concat(x, 0))
y = qbpp.array([1, *x, 0])

# 2D dim=0: equivalent to concat(1, concat(z, 0, 0), 0)
ones = qbpp.array([1] * 4)
zeros = qbpp.array([0] * 4)
zg0 = qbpp.array([ones, *z, zeros])

# 2D dim=1: equivalent to concat(1, concat(z, 0, 1), 1)
zg1 = qbpp.array([qbpp.array([1, *row, 0]) for row in z])
```

For the outermost dimension, the unpack style is often clearer.
For inner dimensions, `concat(scalar, x, dim)` avoids nested list comprehensions.

## Domain Wall Encoding

A **domain wall** is a binary pattern of the form $1\cdots 1\, 0\cdots 0$,
where all 1s appear before all 0s.
For $n$ binary variables, there are exactly $n+1$ domain wall patterns
(including the all-1 and all-0 patterns),
so a domain wall can represent an integer in the range $[0, n]$.

Using `concat`, Python slicing (or `head`/`tail`), and `sqr`, we can construct a
QUBO expression whose minimum-energy solutions are exactly the domain wall
patterns.

## PyQBPP program

```python
import pyqbpp as qbpp

n = 8
x = qbpp.var("x", shape=n)

# y = (1, x[0], ..., x[n-1], 0)
y = qbpp.concat(1, qbpp.concat(x, 0))

# Adjacent difference
diff = y[:n+1] - y[-(n+1):]

# Penalty: minimum 1 iff domain wall
f = qbpp.sum(qbpp.sqr(diff))
f.simplify_as_binary()

print("f =", f)

solver = qbpp.ExhaustiveSolver(f)
sol = solver.search(best_energy_sols=0)

print("energy =", sol.energy)
print("solutions =", len(sol.all_solutions()))
for s in sol.all_solutions():
    bits = "".join(str(s(x[i])) for i in range(n))
    print(f"  {bits}  (sum = {s(qbpp.sum(x))})")
```

### How it works

**Step 1: Guard bits with `concat`**

`concat(1, concat(x, 0))` constructs the extended vector:

$$
y = (1,\; x_0,\; x_1,\; \ldots,\; x_{n-1},\; 0)
$$

The guard bit 1 at the beginning and 0 at the end ensure that the domain wall
pattern is bounded.

**Step 2: Adjacent difference with Python slicing**

`y[:n+1] - y[-(n+1):]` computes the element-wise difference between consecutive
elements:

$$
\text{diff}_i = y_i - y_{i+1} \quad (0 \le i \le n)
$$

This is the direct Python equivalent of the C++ `head(y, n+1) - tail(y, n+1)`
idiom. `qbpp.head(y, n+1) - qbpp.tail(y, n+1)` would produce the same result.

**Step 3: Penalty with `sqr` and `sum`**

`qbpp.sum(qbpp.sqr(diff))` computes $\sum_{i=0}^{n} (y_i - y_{i+1})^2$.
Since each $y_i \in \{0, 1\}$, each squared difference is either 0 or 1.
The sum counts the number of transitions (changes from 0 to 1 or 1 to 0) in $y$.

A domain wall pattern has exactly **one** transition (from 1 to 0),
so the minimum energy is **1**, and all $n+1$ domain wall patterns achieve this minimum.

### Output

```
f = 1 +2*x[1] +2*x[2] +2*x[3] +2*x[4] +2*x[5] +2*x[6] +2*x[7] -2*x[0]*x[1] -2*x[1]*x[2] -2*x[2]*x[3] -2*x[3]*x[4] -2*x[4]*x[5] -2*x[5]*x[6] -2*x[6]*x[7]
energy = 1
solutions = 9
  00000000  (sum = 0)
  10000000  (sum = 1)
  11000000  (sum = 2)
  11100000  (sum = 3)
  11110000  (sum = 4)
  11111000  (sum = 5)
  11111100  (sum = 6)
  11111110  (sum = 7)
  11111111  (sum = 8)
```

All 9 optimal solutions are domain wall patterns, representing integers 0 through 8.

## Dual-Matrix Domain Wall

The **Dual-Matrix Domain Wall** method constructs an $n \times n$ permutation matrix
using two separate binary matrices with different shapes:
`x` of size $(n{-}1) \times n$ with column-wise domain walls, and
`y` of size $n \times (n{-}1)$ with row-wise domain walls.
By adding guard bits and taking adjacent differences, each produces an $n \times n$ one-hot matrix.
Requiring these two one-hot matrices to match ensures that each row and each column contains exactly one 1, forming a permutation matrix.
For details, see: [https://arxiv.org/abs/2308.01024](https://arxiv.org/abs/2308.01024)

```python
import pyqbpp as qbpp

n = 6
x = qbpp.var("x", shape=(n - 1, n))  # (n-1) x n
y = qbpp.var("y", shape=(n, n - 1))  # n x (n-1)

# x: guard rows (dim=0) -> (n+1) x n, diff -> n x n (column one-hot)
xg = qbpp.concat(1, qbpp.concat(x, 0, 0), 0)
x_oh = xg[:n] - xg[-n:]
x_dw = qbpp.sum(qbpp.sqr(x_oh))

# y: guard cols (dim=1) -> n x (n+1), diff -> n x n (row one-hot)
yg = qbpp.concat(1, qbpp.concat(y, 0, 1), 1)
y_oh = yg[:, :n] - yg[:, -n:]
y_dw = qbpp.sum(qbpp.sqr(y_oh))

# Match: x_oh == y_oh (both n x n, no transpose needed)
match = qbpp.sum(qbpp.constrain(x_oh - y_oh, equal=0))

f = x_dw + y_dw + match
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=2 * n)

print("energy =", sol.energy)
print(f"x ({n-1}x{n})  x_oh ({n}x{n})")
for i in range(n):
    if i < n - 1:
        row_x = "".join(str(sol(x[i][j])) for j in range(n))
    else:
        row_x = " " * n
    row_oh = "".join(str(sol(x_oh[i][j])) for j in range(n))
    print(f"{row_x}  ->  {row_oh}")
print(f"y ({n}x{n-1})  y_oh ({n}x{n})")
for i in range(n):
    row_y = "".join(str(sol(y[i][j])) for j in range(n - 1))
    row_oh = "".join(str(sol(y_oh[i][j])) for j in range(n))
    print(f"{row_y}   ->  {row_oh}")
```

### How it works

1. **`x`** is $(n{-}1) \times n$. Adding guard rows via `concat(1, concat(x, 0, 0), 0)` along `dim=0` gives $(n{+}1) \times n$, where each column is a domain wall ($1\cdots 1\, 0\cdots 0$). Taking `xg[:n] - xg[-n:]` (equivalent to `head - tail` along `dim=0`) produces an $n \times n$ matrix `x_oh` where each **column** is one-hot.

2. **`y`** is $n \times (n{-}1)$. Adding guard columns via `concat(1, concat(y, 0, 1), 1)` along `dim=1` gives $n \times (n{+}1)$, where each row is a domain wall. Taking `yg[:, :n] - yg[:, -n:]` (equivalent to `head - tail` along `dim=1`) produces an $n \times n$ matrix `y_oh` where each **row** is one-hot.

3. **`x_oh == y_oh`**: Both are $n \times n$, so they can be directly compared without transposition. When matched, the resulting matrix has exactly one 1 in each row and each column — a **permutation matrix**.

### Key operations

- **`x[:n]` / `x[-n:]`**: Python slice notation replaces C++ `head()` / `tail()`.
- **`x[:, :n]` / `x[:, -n:]`**: Tuple indexing for slicing along inner dimensions.
- **`concat(1, x, 0)`** (`dim=0`): Adds a guard row of 1s at the top.
- **`concat(1, x, 1)`** (`dim=1`): Prepends 1 to each row.

### Output

```
energy = 12
x (5x6)  x_oh (6x6)
111101  ->  000010
111100  ->  000001
110100  ->  001000
010100  ->  100000
010000  ->  000100
        ->  010000
y (6x5)  y_oh (6x6)
11110   ->  000010
11111   ->  000001
11000   ->  001000
00000   ->  100000
11100   ->  000100
10000   ->  010000
```

The optimal energy is $2n = 12$. `x_oh` and `y_oh` are identical, forming a valid $6 \times 6$ permutation matrix.

## Axis-fixing Slice (`slice_axes`, `row`, `col`)

To extract a sub-array by fixing specific axes of a multi-dimensional array,
use `qbpp.row()`, `qbpp.col()`, and `qbpp.slice_axes()`. These are
**global functions only** and return a new sub-array without modifying the
original. The number of dimensions is **reduced** by the number of fixed axes.

### `row(i)` and `col(j)`

`row(i)` fixes axis 0 at index `i`; `col(j)` fixes axis 1 at index `j`:

```python
x = qbpp.var("x", shape=(3, 4))  # 3x4

row0 = qbpp.row(x, 0)  # {x[0][0], x[0][1], x[0][2], x[0][3]}
col2 = qbpp.col(x, 2)  # {x[0][2], x[1][2], x[2][2]}
# row() and col() are global functions only (no member function version)
```

Example: element-wise product of two rows:

```python
prod = qbpp.row(x, 0) * qbpp.row(x, 1)  # 1D Array of Terms with 4 elements
s = qbpp.sum(prod)                        # Expr
```

### `slice_axes`

`slice_axes` can fix multiple axes simultaneously. It takes a dict that maps
axis index to the value at which that axis is fixed:

```python
z = qbpp.var("z", shape=(2, 3, 4))  # 2x3x4

s1 = qbpp.slice_axes(z, {0: 1})         # fix axis 0 to 1 -> 3x4
s2 = qbpp.slice_axes(z, {0: 1, 2: 3})   # fix axis 0=1, axis 2=3 -> 3 elements
# slice_axes() is a global function only (no member function version)
```

Out-of-range indices or duplicate axes result in a runtime error.

> **NOTE**
> `operator[]` / `x[i]` is for accessing scalar elements by specifying all
> dimensions. It cannot be used to extract sub-arrays at intermediate
> dimensions — use NumPy-style tuple slicing (e.g. `x[:, :3]`),
> `qbpp.row()`, `qbpp.col()`, or `qbpp.slice_axes()` to obtain sub-arrays.
>
> Note also that `qbpp.slice()`, `qbpp.head()`, and `qbpp.tail()` are
> **range-based** slices that preserve the number of dimensions, whereas
> `qbpp.row()`, `qbpp.col()`, and `qbpp.slice_axes()` are **axis-fixing**
> slices that reduce the number of dimensions.
