---
layout: default
nav_exclude: true
title: "Einsum Function"
nav_order: 19
lang: en
hreflang_alt: "ja/python/EINSUM"
hreflang_lang: "ja"
---

# Einsum: Numpy-style Tensor Contraction
PyQBPP provides **`qbpp.einsum(subscript, *arrays)`** — a numpy-style
[Einstein summation](https://en.wikipedia.org/wiki/Einstein_notation) that
contracts arbitrary multi-dimensional arrays of integers, variables, terms, and
expressions in a single concise call.

The output dimension is inferred automatically from the subscript, so unlike
the C++ template `qbpp::einsum<OutDim>(...)`, the Python version takes only the
subscript and the input arrays.

## Subscript syntax

```
"labels1,labels2,...->out_labels"
```

- Each **label** is a single ASCII character (other than `,`, `-`, `>`, or whitespace).
- Each input array must have exactly as many labels as it has dimensions.
- Labels that appear in the inputs but **not** in the output are **summed (contracted)**.
- Labels that appear in **both** inputs and the output are kept as free axes.
- A label that **appears twice within a single input** ties the two axes
  (used for trace and diagonal extraction).
- The implicit form `"ij,jk"` (no `->`) treats labels appearing exactly once
  across all inputs as the output, sorted alphabetically. This matches numpy.
- An empty right-hand side (`"i,i->"`) produces a **scalar**.

## Output type

- If **all inputs are integer arrays**, the result is an integer array — or an
  `int` scalar when the output has 0 dimensions.
- Otherwise (any input contains `Var`, `Term`, `Expr`, or `VarInt`), the result
  is an `Expr` array — or an `Expr` scalar when the output has 0 dimensions.

## Examples

The following program demonstrates several common `einsum` patterns:

```python
import pyqbpp as qbpp

# 1. Matrix-matrix multiplication: C[i,k] = Σ_j A[i,j] * B[j,k]
A = qbpp.array([[1, 2, 3], [4, 5, 6]])               # 2x3
B = qbpp.array([[7, 8], [9, 10], [11, 12]])          # 3x2
C = qbpp.einsum("ij,jk->ik", A, B)                   # 2x2
for i in range(2):
    for k in range(2):
        print(f"C[{i}][{k}] =", C[i][k])

# 2. Symbolic matmul: Var × Var → Expr
x = qbpp.var("x", 2, 3)
y = qbpp.var("y", 3, 2)
Z = qbpp.einsum("ij,jk->ik", x, y)
print("Z[0][0] =", Z[0][0])

# 3. Dot product (scalar output): s = Σ_i v[i] * w[i]
v = qbpp.array([1, 2, 3])
w = qbpp.array([4, 5, 6])
print("dot =", qbpp.einsum("i,i->", v, w))

# 4. Trace: tr = Σ_i M[i,i]
M = qbpp.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
print("trace =", qbpp.einsum("ii->", M))

# 5. Diagonal extraction: d[i] = M[i,i]
D = qbpp.array([[10, 0, 0], [0, 20, 0], [0, 0, 30]])
d = qbpp.einsum("ii->i", D)
print("d =", [d[0], d[1], d[2]])

# 6. Outer product (no contraction)
u = qbpp.array([1, 2])
t = qbpp.array([10, 20, 30])
Outer = qbpp.einsum("i,j->ij", u, t)
print("Outer[1][2] =", Outer[1][2])

# 7. Bilinear form: s = Σ_{i,j} x[i] * W[i,j] * y[j]
W = qbpp.array([[1, 2], [3, 4]])
xx = qbpp.var("u", 2)
yy = qbpp.var("w", 2)
print("bilinear =", qbpp.einsum("i,ij,j->", xx, W, yy))

# 8. Reductions over an array
AA = qbpp.array([[1, 2, 3], [4, 5, 6]])
rowsum = qbpp.einsum("ij->i", AA)        # sum each row
colsum = qbpp.einsum("ij->j", AA)        # sum each column
total  = qbpp.einsum("ij->",  AA)        # full reduction
print("rowsum =", [rowsum[0], rowsum[1]])
print("total  =", total)
```

This program produces the following output:
```
C[0][0] = 58
C[0][1] = 64
C[1][0] = 139
C[1][1] = 154
Z[0][0] = x[0][0]*y[0][0] +x[0][1]*y[1][0] +x[0][2]*y[2][0]
dot = 32
trace = 15
d = [10, 20, 30]
Outer[1][2] = 60
bilinear = u[0]*w[0] +2*u[0]*w[1] +3*u[1]*w[0] +4*u[1]*w[1]
rowsum = [6, 15]
total  = 21
```

## Three or more inputs

`einsum` accepts any number of input arrays. A common use case in
combinatorial optimization is the **Quadratic Assignment Problem (QAP)** style
objective $\sum_{a,k,l} f_a\, d_{kl}\, x_{a,k}\, x_{a,l}$:

```python
f = qbpp.array([1, 2, 3])                      # facility flows
d = qbpp.array([[0, 5], [7, 0]])               # location distances
x = qbpp.var("x", 3, 2)                        # assignment matrix
obj = qbpp.einsum("a,kl,ak,al->", f, d, x, x)
```

This single line replaces a quadruple nested for-loop and is internally
parallelized over multiple CPU threads.

## When to use `einsum`

Use `einsum` whenever an objective or constraint can be written as a sum of
products indexed by tensor indices. Compared to writing explicit nested loops,
`einsum`:

- expresses the mathematical structure directly,
- avoids manual index arithmetic,
- and is internally multithreaded for large arrays.

For simple total or per-axis sums, **`qbpp.sum()`** and **`qbpp.vector_sum()`**
(see [Sum Functions](SUM)) are slightly more direct. Reach for `einsum` once
multiple arrays are multiplied together or once index relationships become
non-trivial.
