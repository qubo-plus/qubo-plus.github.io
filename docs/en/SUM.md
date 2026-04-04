---
layout: default
nav_exclude: true
title: "Sum Functions"
nav_order: 18
lang: en
hreflang_alt: "ja/SUM"
hreflang_lang: "ja"
---

# Sum Functions for Multi-dimensional Arrays
QUBO++ provides two sum functions for multi-dimensional arrays of variables or expressions:
- **`qbpp::sum()`**: Computes the sum of all elements in the array.
- **`qbpp::vector_sum()`**: Computes the sum along the lowest (innermost) dimension.
The resulting array has one fewer dimension than the input array.
The input array must have a dimension of 2 or greater.

The following program demonstrates the difference between `qbpp::sum()` and `qbpp::vector_sum()`:
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 2, 3, 3);
  auto y = x + 1;
  for (size_t i = 0; i < 2; ++i) {
    for (size_t j = 0; j < 3; ++j) {
      for (size_t k = 0; k < 3; ++k) {
        std::cout << "y[" << i << "][" << j << "][" << k << "] = " << y[i][j][k]
                  << std::endl;
      }
    }
  }
  auto sum = qbpp::sum(y).simplify();
  std::cout << "sum(y) = " << sum << std::endl;
  auto vector_sum = qbpp::vector_sum(y).simplify();
  for (size_t i = 0; i < 2; ++i) {
    for (size_t j = 0; j < 3; ++j) {
      std::cout << "vector_sum[" << i << "][" << j << "] = " << vector_sum[i][j]
                << std::endl;
    }
  }
}
```
First, an array `x` of variables with size $2 \times 3 \times 3$ is defined.
Next, an array `y` is created by adding 1 to every element of `x`,
and all elements of `y` are printed.
Then, `qbpp::sum(y)` is computed and printed.
After that, the `qbpp::vector_sum()` function is applied to `y` and the result is stored in `vector_sum`, which is a two-dimensional array of expressions with size $2 \times 3$.
Finally, all elements of `vector_sum` are printed.

This program produces the following output:
```
y[0][0][0] = 1 +x[0][0][0]
y[0][0][1] = 1 +x[0][0][1]
y[0][0][2] = 1 +x[0][0][2]
y[0][1][0] = 1 +x[0][1][0]
y[0][1][1] = 1 +x[0][1][1]
y[0][1][2] = 1 +x[0][1][2]
y[0][2][0] = 1 +x[0][2][0]
y[0][2][1] = 1 +x[0][2][1]
y[0][2][2] = 1 +x[0][2][2]
y[1][0][0] = 1 +x[1][0][0]
y[1][0][1] = 1 +x[1][0][1]
y[1][0][2] = 1 +x[1][0][2]
y[1][1][0] = 1 +x[1][1][0]
y[1][1][1] = 1 +x[1][1][1]
y[1][1][2] = 1 +x[1][1][2]
y[1][2][0] = 1 +x[1][2][0]
y[1][2][1] = 1 +x[1][2][1]
y[1][2][2] = 1 +x[1][2][2]
sum(y) = 18 +x[0][0][0] +x[0][0][1] +x[0][0][2] +x[0][1][0] +x[0][1][1] +x[0][1][2] +x[0][2][0] +x[0][2][1] +x[0][2][2] +x[1][0][0] +x[1][0][1] +x[1][0][2] +x[1][1][0] +x[1][1][1] +x[1][1][2] +x[1][2][0] +x[1][2][1] +x[1][2][2]
vector_sum[0][0] = 3 +x[0][0][0] +x[0][0][1] +x[0][0][2]
vector_sum[0][1] = 3 +x[0][1][0] +x[0][1][1] +x[0][1][2]
vector_sum[0][2] = 3 +x[0][2][0] +x[0][2][1] +x[0][2][2]
vector_sum[1][0] = 3 +x[1][0][0] +x[1][0][1] +x[1][0][2]
vector_sum[1][1] = 3 +x[1][1][0] +x[1][1][1] +x[1][1][2]
vector_sum[1][2] = 3 +x[1][2][0] +x[1][2][1] +x[1][2][2]
```
The same results can be obtained using explicit for-loops.
However, for large arrays, it is recommended to use `qbpp::sum()` and `qbpp::vector_sum()`, since these functions internally exploit multithreading to accelerate computation.

## Specifying the axis in `vector_sum()`

By default, `qbpp::vector_sum()` sums along the innermost (last) axis.
You can specify a different axis using **`qbpp::vector_sum(array, axis)`**.
Negative indices are also supported: axis `-1` refers to the last axis, `-2` to the second-to-last, and so on.

Using the same $2 \times 3 \times 3$ array `x` as above, the following program demonstrates summing along each of the three axes:

```cpp
  auto vs2 = qbpp::vector_sum(x, 2).simplify();  // sum along axis 2 (default)
  auto vs1 = qbpp::vector_sum(x, 1).simplify();  // sum along axis 1
  auto vs0 = qbpp::vector_sum(x, 0).simplify();  // sum along axis 0
```

- **`qbpp::vector_sum(x, 2)`** sums along axis 2 (the innermost axis), producing a $2 \times 3$ array. This is equivalent to `qbpp::vector_sum(x)`.

```
vs2[0][0] = x[0][0][0] +x[0][0][1] +x[0][0][2]
vs2[0][1] = x[0][1][0] +x[0][1][1] +x[0][1][2]
vs2[0][2] = x[0][2][0] +x[0][2][1] +x[0][2][2]
vs2[1][0] = x[1][0][0] +x[1][0][1] +x[1][0][2]
vs2[1][1] = x[1][1][0] +x[1][1][1] +x[1][1][2]
vs2[1][2] = x[1][2][0] +x[1][2][1] +x[1][2][2]
```

- **`qbpp::vector_sum(x, 1)`** sums along axis 1 (the middle axis), producing a $2 \times 3$ array.

```
vs1[0][0] = x[0][0][0] +x[0][1][0] +x[0][2][0]
vs1[0][1] = x[0][0][1] +x[0][1][1] +x[0][2][1]
vs1[0][2] = x[0][0][2] +x[0][1][2] +x[0][2][2]
vs1[1][0] = x[1][0][0] +x[1][1][0] +x[1][2][0]
vs1[1][1] = x[1][0][1] +x[1][1][1] +x[1][2][1]
vs1[1][2] = x[1][0][2] +x[1][1][2] +x[1][2][2]
```

- **`qbpp::vector_sum(x, 0)`** sums along axis 0 (the outermost axis), producing a $3 \times 3$ array.

```
vs0[0][0] = x[0][0][0] +x[1][0][0]
vs0[0][1] = x[0][0][1] +x[1][0][1]
vs0[0][2] = x[0][0][2] +x[1][0][2]
vs0[1][0] = x[0][1][0] +x[1][1][0]
vs0[1][1] = x[0][1][1] +x[1][1][1]
vs0[1][2] = x[0][1][2] +x[1][1][2]
vs0[2][0] = x[0][2][0] +x[1][2][0]
vs0[2][1] = x[0][2][1] +x[1][2][1]
vs0[2][2] = x[0][2][2] +x[1][2][2]
```
