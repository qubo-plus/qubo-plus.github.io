---
layout: default
nav_exclude: true
title: "Slice and Concat"
nav_order: 19
lang: en
hreflang_alt: "ja/python/SLICE_CONCAT"
hreflang_lang: "ja"
---

# Slice and Concat

PyQBPP supports Python-style slicing and a `concat()` function for manipulating arrays.
This page demonstrates these operations through **domain wall encoding** and the **Dual-Matrix Domain Wall** method.

## Slicing

PyQBPP arrays support standard Python slice notation. Slicing returns a new `Array`:

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

Python's unpack operator `*` can replace `concat()` by unpacking an `Array` inside an `Array()` constructor:

```python
# 1D: equivalent to concat(1, concat(x, 0))
y = qbpp.Array([1, *x, 0])

# 2D dim=0: equivalent to concat(1, concat(z, 0, 0), 0)
ones = qbpp.Array([1] * 4)
zeros = qbpp.Array([0] * 4)
zg0 = qbpp.Array([ones, *z, zeros])

# 2D dim=1: equivalent to concat(1, concat(z, 0, 1), 1)
zg1 = qbpp.Array([qbpp.Array([1, *row, 0]) for row in z])
```

For the outermost dimension, the unpack style is often clearer.
For inner dimensions, `concat(scalar, x, dim)` avoids nested list comprehensions.

## Domain Wall Encoding

A **domain wall** is a binary pattern $1\cdots 1\, 0\cdots 0$.
For $n$ variables, there are $n+1$ such patterns, representing integers $0$ through $n$.

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

## Dual-Matrix Domain Wall

The **Dual-Matrix Domain Wall** method constructs an $n \times n$ permutation matrix
using two binary matrices: `x` of size $(n{-}1) \times n$ and `y` of size $n \times (n{-}1)$.
Adding guard bits and taking adjacent differences produces two $n \times n$ one-hot matrices.
Matching them yields a permutation matrix — without explicit loops.
For details, see: [https://arxiv.org/abs/2308.01024](https://arxiv.org/abs/2308.01024)

```python
import pyqbpp as qbpp

n = 6
x = qbpp.var("x", shape=(n - 1, n))  # (n-1) x n
y = qbpp.var("y", shape=(n, n - 1))  # n x (n-1)

# x: guard rows (dim=0), diff -> n x n (column one-hot)
xg = qbpp.concat(1, qbpp.concat(x, 0, 0), 0)
x_oh = xg[:n] - xg[-n:]
x_dw = qbpp.sum(qbpp.sqr(x_oh))

# y: guard cols (dim=1), diff -> n x n (row one-hot)
yg = qbpp.concat(1, qbpp.concat(y, 0, 1), 1)
y_oh = yg[:, :n] - yg[:, -n:]
y_dw = qbpp.sum(qbpp.sqr(y_oh))

# Match: x_oh == y_oh
match = qbpp.sum(qbpp.constrain(x_oh - y_oh, equal=0))

f = x_dw + y_dw + match
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=2 * n)

print("energy =", sol.energy)
print("permutation:")
for i in range(n):
    print(" ", "".join(str(sol(x_oh[i][j])) for j in range(n)))
```

### Key operations

- **`x[:n]` / `x[-n:]`**: Python slice notation replaces C++ `head()` / `tail()`.
- **`x[:, :n]` / `x[:, -n:]`**: Tuple indexing for slicing along inner dimensions.
- **`concat(1, x, 0)`** (`dim=0`): Adds a guard row of 1s at the top.
- **`concat(1, x, 1)`** (`dim=1`): Prepends 1 to each row.

### Output

```
energy = 12
permutation:
  000001
  100000
  000100
  010000
  000010
  001000
```
