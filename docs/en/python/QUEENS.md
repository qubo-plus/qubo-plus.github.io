---
layout: default
nav_exclude: true
title: "N-Queens"
nav_order: 81
lang: en
hreflang_alt: "ja/python/QUEENS"
hreflang_lang: "ja"
---

# N-Queens Problem
The **8-Queens problem** aims to place 8 queens on a chessboard so that no two queens attack each other; that is, no two queens share the same row, the same column, or the same diagonal (in either direction).
The **N-Queens problem** generalizes this: place
$N$ queens on an $N\times N$ chessboard under the same conditions.

To formulate this problem using PyQBPP, we use an $N\times N$ matrix $X=(x_{i,j})$ of binary variables, where
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

- At most one queen on each diagonal (from top-left to bottom-right):
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

## PyQBPP program
The following PyQBPP program constructs an expression representing the constraints above and then finds a feasible solution using the Easy Solver:
{% raw %}
```python
import pyqbpp as qbpp

n = 8
x = qbpp.var("x", shape=(n, n))

f = qbpp.sum(qbpp.constrain(qbpp.vector_sum(x, axis=0), equal=1)) + \
    qbpp.sum(qbpp.constrain(qbpp.vector_sum(x, axis=1), equal=1))

m = 2 * n - 3
a = qbpp.expr(shape=m)
b = qbpp.expr(shape=m)

for i in range(m):
    k = i + 1
    for r in range(n):
        c = k - r
        if 0 <= c < n:
            a[i] += x[r][c]

    d = i - (n - 2)
    for r in range(n):
        c = r + d
        if 0 <= c < n:
            b[i] += x[r][c]

f += qbpp.sum(qbpp.constrain(a, between=(0, 1)))
f += qbpp.sum(qbpp.constrain(b, between=(0, 1)))

f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=0)
for i in range(n):
    for j in range(n):
        print("Q" if sol(x[i][j]) == 1 else ".", end="")
    print()
```
{% endraw %}
An `n`$\times$`n` matrix `x` of binary variables is introduced, where `x[i][j] = 1` indicates that a queen is placed at row `i` and column `j`.
The column-wise sums are computed using `qbpp.vector_sum(x, axis=0)`, which returns a vector of `n` expressions (one per column).
Applying `qbpp.constrain(..., equal=1)` element-wise produces a vector of penalty expressions; each expression evaluates to 0 if and only if the corresponding column sum equals 1.
Similarly, we can enforce the row-wise one-hot constraints using `qbpp.vector_sum(x, axis=1)`.
Wrapping both vectors of penalty expressions with `qbpp.sum(...)` reduces each vector to a single scalar expression, which is then combined into `f`.

To enforce diagonal constraints, we build two vectors of expressions, `a` and `b`, each of length `m = 2*n - 3`, using `qbpp.expr(shape=m)` which creates a one-dimensional array of zero expressions.
For each index `i`, `a[i]` accumulates variables on a diagonal with a fixed value of `r + c` (diagonals from top-left to bottom-right), excluding diagonals of length 1.
Similarly, `b[i]` accumulates variables on an anti-diagonal with a fixed value of `c - r` (diagonals from top-right to bottom-left), again excluding diagonals of length 1.
The element-wise range constraint `qbpp.constrain(a, between=(0, 1))` (and similarly for `b`) produces a vector of penalty expressions that become 0 if and only if each diagonal/anti-diagonal contains at most one queen.
These penalties are reduced with `qbpp.sum(...)` and added to `f`.

After converting the expression into a binary QUBO form with the in-place call `f.simplify_as_binary()`, the Easy Solver searches for a solution with target energy 0 by passing `target_energy=0` as a keyword argument to `search()`.
The returned object `sol` supports evaluation via the call syntax `sol(x[i][j])`, which returns the assigned value (0 or 1) of the binary variable `x[i][j]`.
The resulting assignment `sol` is then printed as an 8-by-8 board, where `Q` denotes a queen and `.` denotes an empty square.
Since `sol(x[i][j])` returns an integer value, it is compared with `1` to decide whether to print `Q` or `.`.
For example, the program may produce the following output:
```
..Q.....
.....Q..
.......Q
.Q......
...Q....
Q.......
......Q.
....Q...
```
This output confirms a valid placement of eight queens, since no two queens share the same row, column, diagonal, or anti-diagonal.
