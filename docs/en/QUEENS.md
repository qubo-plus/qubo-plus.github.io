---
last_modified: 2026-10-10
layout: default
nav_exclude: true
title: "N-Queens"
nav_order: 41
lang: en
hreflang_alt: "ja/QUEENS"
hreflang_lang: "ja"
---

# N-Queens Problem
The **8-Queens problem** aims to place 8 queens on a chessboard so that no two queens attack each other; that is, no two queens share the same row, the same column, or the same diagonal (in either direction).
The **N-Queens problem** generalizes this: place
$N$ queens on an $N\times N$ chessboard under the same conditions.

To formulate this problem using QUBO++, we use an $N\times N$ matrix $X=(x_{i,j})$ of binary variables, where
$x_{i,j}=1$ if a queen is placed at row $i$ and column $j$, and $x_{i,j}=0$ otherwise.
We impose the following constraints:
- Exactly one queen in each row:

$$
\begin{aligned}
\sum_{j=0}^{N-1} x_{i,j}&=1 && (0\leq i\leq N-1)
\end{aligned}
$$

- Exactly one queen in each column:

$$
\begin{aligned}
\sum_{i=0}^{N-1} x_{i,j}&=1 && (0\leq j\leq N-1)
\end{aligned}
$$

- At most one queen on each diagonal (from top-right to bottom-left):
A diagonal is characterized by $i+j=k$.
We consider only diagonals of length at least 2, i.e.,
$k=1,2,\ldots,2N−3$, and require:

$$
\begin{aligned}
0\leq \sum_{\substack{0\le i,j \le N-1\\ i+j=k}}x_{i,j}\leq 1 &&(1\leq k\leq 2N-3)
\end{aligned}
$$

- The sum of each anti-diagonal of $X$ is 0 or 1:
An anti-diagonal is characterized by $j−i=d$.
We consider only anti-diagonals of length at least 2, i.e.,
$d=−(N−2),\ldots,(N−2)$, and require:

$$
\begin{aligned}
0\leq \sum_{\substack{0\le i,j \le N-1\\ j-i=d}}x_{i,j}\leq 1 &&(-(N-2)\leq d\leq (N-2))
\end{aligned}
$$

## QUBO++ program
The following QUBO++ program declares the constraints above with [`qbpp::cons()`](CONSTRAINTS) and then finds a feasible solution using the Easy Solver:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  const int n = 8;
  auto x = qbpp::var("x", n, n);

  auto f = qbpp::cons(qbpp::vector_sum(x, 0) == 1) +
           qbpp::cons(qbpp::vector_sum(x, 1) == 1);

  const int m = 2 * n - 3;
  auto a = qbpp::expr(m);
  auto b = qbpp::expr(m);

  for (int i = 0; i < m; ++i) {
    const int k = i + 1;
    for (int r = 0; r < n; ++r) {
      const int c = k - r;
      if (0 <= c && c < n) {
        a[static_cast<size_t>(i)] +=
            x[static_cast<size_t>(r)][static_cast<size_t>(c)];
      }
    }

    const int d = i - (n - 2);
    for (int r = 0; r < n; ++r) {
      const int c = r + d;
      if (0 <= c && c < n) {
        b[static_cast<size_t>(i)] +=
            x[static_cast<size_t>(r)][static_cast<size_t>(c)];
      }
    }
  }

  f += qbpp::cons(a <= 1);
  f += qbpp::cons(b <= 1);

  f.simplify_as_binary();

  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"target_energy", 0}});
  for (size_t i = 0; i < n; i++) {
    for (size_t j = 0; j < n; j++) {
      std::cout << (sol(x[i][j]) ? "Q" : ".");
    }
    std::cout << std::endl;
  }
  std::cout << "violated constraints = " << f.cons(sol) << std::endl;
}
```
{% endraw %}
An `n`$\times$`n` matrix `x` of binary variables is introduced, where `x[i][j] = 1` indicates that a queen is placed at row `i` and column `j`.
The column-wise sums are computed using `qbpp::vector_sum(x, 0)`, which returns a vector of `n` expressions (one per column).
Applying the `==` operator element-wise produces an array of constraints that each column sum equals 1, and `qbpp::cons()` declares all of them as constraints.
Similarly, we declare the row-wise one-hot constraints using `qbpp::vector_sum(x, 1)`.

To enforce diagonal constraints, we build two vectors of expressions, a and b, each of length `m = 2*n - 3`.
For each index `i`, `a[i]` accumulates variables on a diagonal with a fixed value of `r + c` (diagonals from top-right to bottom-left), excluding diagonals of length 1.
Similarly, `b[i]` accumulates variables on an anti-diagonal with a fixed value of `c - r` (diagonals from top-left to bottom-right), again excluding diagonals of length 1.
The comparison `a <= 1` (and similarly for b) is applied element-wise and produces an array of constraints that each diagonal/anti-diagonal contains at most one queen.
They are declared with `qbpp::cons()` and added to `f`.

After simplifying the expression with `f.simplify_as_binary()`, the Easy Solver searches for a solution with target energy 0.
For an expression with declared constraints, the search stops when the energy is at most the target and all constraints are satisfied.
The resulting assignment sol is then printed as an 8-by-8 board, where `Q` denotes a queen and `.` denotes an empty square.
Finally, the number of violated constraints `f.cons(sol)` is printed.
For example, the program may produce the following output:
```
......Q.
.Q......
.....Q..
..Q.....
Q.......
...Q....
.......Q
....Q...
violated constraints = 0
```
This output confirms a valid placement of eight queens, since no two queens share the same row, column, diagonal, or anti-diagonal.
