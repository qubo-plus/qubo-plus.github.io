---
layout: default
nav_exclude: true
title: "One-Hot to Integer Conversion"
nav_order: 19
lang: en
hreflang_alt: "ja/python/ONEHOT"
hreflang_lang: "ja"
---

# One-Hot to Integer Conversion

A **one-hot vector** is a binary vector in which exactly one element is 1 and all others are 0.
The position of the 1 encodes an integer value.
For example, `[0, 0, 1, 0]` represents the integer 2.

The global function **`qbpp.onehot_to_int()`** decodes one-hot encoded rows in an integer array
and returns an array of integers indicating the positions of the 1s.

### Basic Usage (2D Array)

For a 2D array of size $n \times m$, `onehot_to_int()` decodes each row
and returns a 1D array of $n$ integers, each in the range $[0, m-1]$.
If a row is not a valid one-hot vector (i.e., it does not contain exactly one 1),
the function returns $-1$ for that row.

{% raw %}
```python
import pyqbpp as qbpp

n, m = 5, 5
x = qbpp.var("x", shape=(n, m))

# One-hot constraint: each row has exactly one 1
onehot = qbpp.sum(qbpp.constrain(qbpp.vector_sum(x), equal=1))
# All-different constraint: each column has exactly one 1
alldiff = qbpp.sum(qbpp.constrain(qbpp.vector_sum(x, axis=0), equal=1))

f = onehot + alldiff
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=0)

print("x =", sol(x))

result = qbpp.onehot_to_int(sol(x))
print("onehot_to_int =", result)
```
{% endraw %}

This program defines a $5 \times 5$ permutation matrix and decodes it into a permutation:

{% raw %}
```
x = {{0,0,0,1,0},{1,0,0,0,0},{0,0,1,0,0},{0,1,0,0,0},{0,0,0,0,1}}
onehot_to_int = {3,0,2,1,4}
```
{% endraw %}

### Specifying the Axis

By default, `onehot_to_int()` decodes along the last axis (`axis=-1`).
You can specify any axis using **`onehot_to_int(arr, axis)`**.
Negative indices are also supported: axis `-1` refers to the last axis, `-2` to the second-to-last, and so on.

For a 2D array of size $n \times m$:
- **`onehot_to_int(arr)`** or **`onehot_to_int(arr, axis=1)`**: decodes each row, returns $n$ integers in $[0, m-1]$.
- **`onehot_to_int(arr, axis=0)`**: decodes each column, returns $m$ integers in $[0, n-1]$.

```python
row_result = qbpp.onehot_to_int(sol(x))          # {3,0,2,1,4}
col_result = qbpp.onehot_to_int(sol(x), axis=0)  # {1,3,2,0,4}
```

When `x` is a permutation matrix, `onehot_to_int(sol(x))` gives the permutation $\sigma$,
and `onehot_to_int(sol(x), axis=0)` gives its inverse $\sigma^{-1}$.

### 1D Input

For a 1D array of size $m$, `onehot_to_int()` returns a single-element array containing the position of the 1,
or $-1$ if the input is not a valid one-hot vector.

```python
v = qbpp.var("v", shape=4)
# ... solve so that v = {0, 0, 1, 0} ...
idx = qbpp.onehot_to_int(sol(v))  # {2}
```

### Higher-Dimensional Arrays

For arrays with dimension $d \geq 3$, `onehot_to_int()` decodes along the specified axis
and returns an array with dimension $d - 1$.
For example, for a $2 \times 3 \times 4$ array:
- **`onehot_to_int(arr)`** or **`onehot_to_int(arr, axis=2)`**: decode along axis 2 (last), result shape $2 \times 3$.
- **`onehot_to_int(arr, axis=1)`**: decode along axis 1, result shape $2 \times 4$.
- **`onehot_to_int(arr, axis=0)`**: decode along axis 0, result shape $3 \times 4$.

### Summary

| Input Shape      | Axis | Output Shape | Value Range   |
|------------------|------|--------------|---------------|
| $(m)$            | —    | $(1)$        | $[0, m-1]$ or $-1$ |
| $(d_0 \times \cdots \times d_{n-1})$ | $k$ | all dims except $d_k$ | $[0, d_k-1]$ or $-1$ |
