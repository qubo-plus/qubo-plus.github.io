---
layout: default
nav_exclude: true
title: "Slice and Concat Functions"
nav_order: 19
lang: en
hreflang_alt: "ja/SLICE_CONCAT"
hreflang_lang: "ja"
---

# Slice and Concat Functions

QUBO++ provides slice and concat functions for manipulating vectors of variables and expressions.
This page demonstrates these functions through a practical example: **domain wall encoding**.

## Domain Wall Encoding

A **domain wall** is a binary pattern of the form $1\cdots 1\, 0\cdots 0$,
where all 1s appear before all 0s.
For $n$ binary variables, there are exactly $n+1$ domain wall patterns
(including the all-1 and all-0 patterns),
so a domain wall can represent an integer in the range $[0, n]$.

Using `concat`, tuple indexing (`a(slice(...))`), and `sqr`, we can construct a QUBO expression
whose minimum-energy solutions are exactly the domain wall patterns.

## QUBO++ program

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  const size_t n = 8;
  auto x = qbpp::var("x", n);

  // y = (1, x[0], x[1], ..., x[n-1], 0)
  auto y = qbpp::concat(1, qbpp::concat(x, 0));

  // Adjacent difference
  auto diff = y(qbpp::slice(0, n + 1)) - y(qbpp::slice(qbpp::end - (n + 1), qbpp::end));

  // Penalty: minimum value 1 iff domain wall
  auto f = qbpp::sum(qbpp::sqr(diff));
  f.simplify_as_binary();

  std::cout << "f = " << f << std::endl;

  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search({{"best_energy_sols", 1}});

  std::cout << "energy = " << sol.energy() << std::endl;
  std::cout << "solutions = " << sol.sols.size() << std::endl;
  for (const auto& s : sol.sols) {
    for (size_t i = 0; i < n; ++i) std::cout << s(x[i]);
    std::cout << "  (sum = " << s(qbpp::sum(x)) << ")" << std::endl;
  }
}
```
{% endraw %}

### How it works

**Step 1: Guard bits with `concat`**

`concat(1, concat(x, 0))` constructs the extended vector:

$$
y = (1,\; x_0,\; x_1,\; \ldots,\; x_{n-1},\; 0)
$$

The guard bit 1 at the beginning and 0 at the end ensure that the domain wall pattern is bounded.

**Step 2: Adjacent difference with tuple indexing**

`y(slice(0, n+1)) - y(slice(end - (n+1), end))` computes the element-wise difference between consecutive elements:

$$
\text{diff}_i = y_i - y_{i+1} \quad (0 \le i \le n)
$$

**Step 3: Penalty with `sqr` and `sum`**

`sum(sqr(diff))` computes $\sum_{i=0}^{n} (y_i - y_{i+1})^2$.
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

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  const size_t n = 6;
  auto x = qbpp::var("x", n - 1, n);  // (n-1) x n
  auto y = qbpp::var("y", n, n - 1);  // n x (n-1)

  // x: guard rows along dim=0 -> (n+1) x n, diff -> n x n (column one-hot)
  auto xg = qbpp::concat(1, qbpp::concat(x, 0, 0), 0);
  auto x_oh = xg(qbpp::slice(0, n)) - xg(qbpp::slice(qbpp::end - n, qbpp::end));
  auto x_dw = qbpp::sum(qbpp::sqr(x_oh));

  // y: guard cols along dim=1 -> n x (n+1), diff -> n x n (row one-hot)
  auto yg = qbpp::concat(1, qbpp::concat(y, 0, 1), 1);
  auto y_oh = yg(qbpp::all, qbpp::slice(0, n)) - yg(qbpp::all, qbpp::slice(qbpp::end - n, qbpp::end));
  auto y_dw = qbpp::sum(qbpp::sqr(y_oh));

  // Match: x_oh == y_oh (both n x n, no transpose needed)
  auto match = qbpp::sum(x_oh - y_oh == 0);

  auto f = x_dw + y_dw + match;
  f.simplify_as_binary();

  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"target_energy", std::to_string(static_cast<int64_t>(2 * n))}});

  std::cout << "energy = " << sol.energy() << std::endl;
  std::cout << "x (" << n-1 << "x" << n << ")  x_oh (" << n << "x" << n << ")" << std::endl;
  for (size_t i = 0; i < n; ++i) {
    if (i < n - 1) {
      for (size_t j = 0; j < n; ++j) std::cout << sol(x[i][j]);
    } else {
      for (size_t j = 0; j < n; ++j) std::cout << " ";
    }
    std::cout << "  ->  ";
    for (size_t j = 0; j < n; ++j) std::cout << sol(x_oh[i][j]);
    std::cout << std::endl;
  }
  std::cout << "y (" << n << "x" << n-1 << ")  y_oh (" << n << "x" << n << ")" << std::endl;
  for (size_t i = 0; i < n; ++i) {
    for (size_t j = 0; j < n - 1; ++j) std::cout << sol(y[i][j]);
    std::cout << "   ->  ";
    for (size_t j = 0; j < n; ++j) std::cout << sol(y_oh[i][j]);
    std::cout << std::endl;
  }
}
```
{% endraw %}

### How it works

1. **`x`** is $(n{-}1) \times n$. Adding guard rows via `concat(1, concat(x, 0, 0), 0)` along `dim=0` gives $(n{+}1) \times n$, where each column is a domain wall ($1\cdots 1\, 0\cdots 0$). Taking the adjacent difference along `dim=0` (via `xg(slice(0, n)) - xg(slice(end - n, end))`) produces an $n \times n$ matrix `x_oh` where each **column** is one-hot.

2. **`y`** is $n \times (n{-}1)$. Adding guard columns via `concat(1, concat(y, 0, 1), 1)` along `dim=1` gives $n \times (n{+}1)$, where each row is a domain wall. Taking the adjacent difference along `dim=1` (via `yg(all, slice(0, n)) - yg(all, slice(end - n, end))`) produces an $n \times n$ matrix `y_oh` where each **row** is one-hot.

3. **`x_oh == y_oh`**: Both are $n \times n$, so they can be directly compared without transposition. When matched, the resulting matrix has exactly one 1 in each row and each column — a **permutation matrix**.

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

## Tuple indexing `a(...)`

To extract a sub-array from a multi-dimensional array, use `Array::operator()`. Each argument selects one axis:

| Argument | Meaning | Dimension change |
|---|---|---|
| integer `i` | Fix the axis at `i` | Axis removed |
| `qbpp::all` | Full range `:` | Axis kept |
| `qbpp::slice(from, to)` | Range `[from, to)` | Axis kept |
| `qbpp::slice(i)` | Single element `[i, i+1)` (shorthand for `slice(i, i+1)`) | Axis kept |
| `qbpp::end` / `qbpp::end - n` | Position computed from the axis size | Fix or range endpoint |

Trailing axes not given are implicitly `qbpp::all`. The output is built with a single call to the unified `view` C ABI, so the copy cost is **O(output_size)**, independent of the input size.

### Examples

```cpp
auto x = qbpp::var("x", 3, 4);  // 3×4

auto row0 = x(0);                     // fix axis 0 to 0 → 1D (4,)
auto col2 = x(qbpp::all, 2);          // fix axis 1 to 2 → 1D (3,)
auto sub  = x(qbpp::slice(0, 2), qbpp::slice(1, 3));  // 2D (2, 2)
```

Element-wise product of two rows:

```cpp
auto prod = x(0) * x(1);        // rows 0 and 1
auto s = qbpp::sum(prod);        // Expr
```

### Mixing fixed axes and ranges

```cpp
auto z = qbpp::var("z", 2, 3, 4);  // 2×3×4

auto s1 = z(1);                  // fix axis 0 to 1 → 3×4
auto s2 = z(1, qbpp::all, 3);    // fix axis 0=1, axis 2=3 → 1D (3,)
auto v  = z(1, 2, 3);            // all axes fixed → Var
auto r  = z(qbpp::slice(0, 2), qbpp::all, qbpp::slice(1, 3));  // 3D (2, 3, 2)
```

### `end` keyword (MATLAB-like)

```cpp
auto last5 = x(qbpp::slice(qbpp::end - 5, qbpp::end));         // last 5 elements
auto mid   = x(qbpp::all, qbpp::slice(1, qbpp::end - 1));      // interior only
```

> **NOTE**
> `operator[]` is for accessing scalar elements by specifying all dimensions. It cannot be used to extract sub-arrays at intermediate dimensions.
> Use `a(...)` tuple indexing to obtain sub-arrays.
