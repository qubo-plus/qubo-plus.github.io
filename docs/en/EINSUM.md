---
layout: default
nav_exclude: true
title: "Einsum Function"
nav_order: 19
lang: en
hreflang_alt: "ja/EINSUM"
hreflang_lang: "en"
---

# Einsum: Numpy-style Tensor Contraction
QUBO++ provides **`qbpp::einsum<OutDim>(subscript, arrays...)`** — a numpy-style
[Einstein summation](https://en.wikipedia.org/wiki/Einstein_notation) that
contracts arbitrary multi-dimensional arrays of integers, variables, terms, and
expressions in a single concise call.

The template parameter `OutDim` specifies the dimension of the output array,
matched at runtime against the number of output labels in the subscript.

## Why `OutDim` is required in C++

In QUBO++, multi-dimensional arrays are represented by **`Array<Dim, T>`**, where
the dimension `Dim` is a **template (compile-time) parameter** — `Array<1, Expr>`
and `Array<2, Expr>` are entirely different types. The compiler must know the
output type when generating code for `einsum`.

The output dimension, however, is determined by the subscript string
(e.g. `"ij,jk->ik"` produces a 2-D array; `"i,i->"` produces a scalar). Since
the subscript is a `const char*` argument that is only inspected at runtime,
**the C++ compiler cannot deduce the output dimension** from it.

`OutDim` therefore has to be supplied explicitly by the caller as a template
argument:

```cpp
auto C  = qbpp::einsum<2>("ij,jk->ik", A, B);   // OutDim = 2 → Array<2, ...>
auto rs = qbpp::einsum<1>("ij->i",     A);      // OutDim = 1 → Array<1, ...>
qbpp::Expr s = qbpp::einsum<0>("i,i->", v, w);  // OutDim = 0 → scalar
```

The runtime checks that `OutDim` matches the actual number of output labels in
the subscript and reports an error if they disagree, so a wrong template
argument is caught immediately rather than producing a silently mis-shaped
array.

The Python version does not need this argument because Python objects carry
their dimension at runtime, so the binding parses the subscript and constructs
the correct output array on its own.

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
- An empty right-hand side (`"i,i->"`) produces a **scalar** (`OutDim == 0`).

## Output type

- If **all inputs are integer arrays** (`Array<Dim, coeff_t>`), the result
  is an integer array (`Array<OutDim, coeff_t>`) — or a `coeff_t` scalar when
  `OutDim == 0`.
- Otherwise (any input contains `Var`, `Term`, `Expr`, or `VarInt`), the result
  is `Array<OutDim, Expr>` — or an `Expr` scalar when `OutDim == 0`.

## Examples

The following program demonstrates several common `einsum` patterns:

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  // 1. Matrix-matrix multiplication: C[i,k] = Σ_j A[i,j] * B[j,k]
  auto A = qbpp::array({{1, 2, 3}, {4, 5, 6}});                // 2×3
  auto B = qbpp::array({{7, 8}, {9, 10}, {11, 12}});           // 3×2
  auto C = qbpp::einsum<2>("ij,jk->ik", A, B);                 // 2×2
  for (size_t i = 0; i < 2; ++i)
    for (size_t k = 0; k < 2; ++k)
      std::cout << "C[" << i << "][" << k << "] = " << C[i][k] << std::endl;

  // 2. Symbolic matmul: Array<Var> × Array<Var> → Array<Expr>
  auto x = qbpp::var("x", 2, 3);
  auto y = qbpp::var("y", 3, 2);
  auto Z = qbpp::einsum<2>("ij,jk->ik", x, y);
  std::cout << "Z[0][0] = " << Z[0][0] << std::endl;

  // 3. Dot product (scalar output): s = Σ_i v[i] * w[i]
  auto v = qbpp::array({1, 2, 3});
  auto w = qbpp::array({4, 5, 6});
  qbpp::coeff_t s = qbpp::einsum<0>("i,i->", v, w);
  std::cout << "dot = " << s << std::endl;

  // 4. Trace: tr = Σ_i M[i,i]
  auto M = qbpp::array({{1, 2, 3}, {4, 5, 6}, {7, 8, 9}});
  qbpp::coeff_t tr = qbpp::einsum<0>("ii->", M);
  std::cout << "trace = " << tr << std::endl;

  // 5. Diagonal extraction: d[i] = M[i,i]
  auto D = qbpp::array({{10, 0, 0}, {0, 20, 0}, {0, 0, 30}});
  auto d = qbpp::einsum<1>("ii->i", D);
  std::cout << "d = " << d[0] << " " << d[1] << " " << d[2] << std::endl;

  // 6. Outer product (no contraction)
  auto u = qbpp::array({1, 2});
  auto t = qbpp::array({10, 20, 30});
  auto Outer = qbpp::einsum<2>("i,j->ij", u, t);
  std::cout << "Outer[1][2] = " << Outer[1][2] << std::endl;

  // 7. Bilinear form: s = Σ_{i,j} x[i] * W[i,j] * y[j]
  auto W = qbpp::array({{1, 2}, {3, 4}});
  auto xx = qbpp::var("u", 2);
  auto yy = qbpp::var("w", 2);
  qbpp::Expr bil = qbpp::einsum<0>("i,ij,j->", xx, W, yy);
  std::cout << "bilinear = " << bil << std::endl;

  // 8. Reductions over an array
  auto AA = qbpp::array({{1, 2, 3}, {4, 5, 6}});
  auto rowsum = qbpp::einsum<1>("ij->i", AA);   // sum each row
  auto colsum = qbpp::einsum<1>("ij->j", AA);   // sum each column
  qbpp::coeff_t total = qbpp::einsum<0>("ij->", AA);
  std::cout << "rowsum = " << rowsum[0] << " " << rowsum[1] << std::endl;
  std::cout << "total = " << total << std::endl;
}
```
{% endraw %}

This program produces the following output:
```
C[0][0] = 58
C[0][1] = 64
C[1][0] = 139
C[1][1] = 154
Z[0][0] = x[0][0]*y[0][0] +x[0][1]*y[1][0] +x[0][2]*y[2][0]
dot = 32
trace = 15
d = 10 20 30
Outer[1][2] = 60
bilinear = u[0]*w[0] +2*u[0]*w[1] +3*u[1]*w[0] +4*u[1]*w[1]
rowsum = 6 15
total = 21
```

## Three or more inputs

`einsum` accepts any number of input arrays. A common use case in
combinatorial optimization is the **Quadratic Assignment Problem (QAP)** style
objective $\sum_{a,k,l} f_a\, d_{kl}\, x_{a,k}\, x_{a,l}$:

{% raw %}
```cpp
auto f = qbpp::array({1, 2, 3});                   // facility flows
auto d = qbpp::array({{0, 5}, {7, 0}});            // location distances
auto x = qbpp::var("x", 3, 2);                     // assignment matrix
qbpp::Expr obj = qbpp::einsum<0>("a,kl,ak,al->", f, d, x, x);
```
{% endraw %}

This single line replaces a quadruple nested for-loop and is internally
parallelized over multiple CPU threads.

## When to use `einsum`

Use `einsum` whenever an objective or constraint can be written as a sum of
products indexed by tensor indices. Compared to writing explicit nested loops,
`einsum`:

- expresses the mathematical structure directly,
- avoids manual index arithmetic,
- and is internally multithreaded for large arrays.

For simple total or per-axis sums, **`qbpp::sum()`** and **`qbpp::vector_sum()`**
(see [Sum Functions](SUM)) are slightly more direct. Reach for `einsum` once
multiple arrays are multiplied together or once index relationships become
non-trivial.
