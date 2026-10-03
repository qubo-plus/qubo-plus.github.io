---
last_modified: 2026-09-02
layout: default
nav_exclude: true
title: "Star Battle"
nav_order: 84
lang: en
hreflang_alt: "ja/python/STAR_BATTLE"
hreflang_lang: "ja"
---

# Star Battle

**Star Battle** is a puzzle played on an $N\times N$ board that is divided into $N$ regions.
Stars must be placed on the board so that all of the following conditions hold:

- Every row contains exactly $k$ stars.
- Every column contains exactly $k$ stars.
- Every region contains exactly $k$ stars.
- No two stars are adjacent, horizontally, vertically or diagonally.

Here we solve an instance with $N=10$ and $k=2$.
Cells with the same letter belong to the same region:

```
A A A A A B B B C C
A B B B B B B C C D
A E B F F C C C D D
E E B F F G C C C D
E E E F F G H I I D
E E E F F G H I I D
E F F F F G H H I D
E F J J J G H H I I
J J J J G G G H H G
J J J J J J G G G G
```

## QUBO Formulation

Assign a binary variable $x_{i,j}$ to each cell, where $x_{i,j}=1$ means that a star is
placed on cell $(i,j)$. The number of variables equals the number of cells, $N^2$.

- Exactly $k$ stars in each row:

$$
\begin{aligned}
\sum_{j=0}^{N-1} x_{i,j}=k && (0\leq i\leq N-1)
\end{aligned}
$$

- Exactly $k$ stars in each column:

$$
\begin{aligned}
\sum_{i=0}^{N-1} x_{i,j}=k && (0\leq j\leq N-1)
\end{aligned}
$$

- Exactly $k$ stars in each region $R_r$:

$$
\begin{aligned}
\sum_{(i,j)\in R_r} x_{i,j}=k && (0\leq r\leq N-1)
\end{aligned}
$$

- No two stars are adjacent.

Instead of enumerating the pairs of adjacent cells one by one, the last condition can be
written as **at most one star in every $2\times 2$ window**:

$$
\begin{aligned}
x_{i,j}+x_{i,j+1}+x_{i+1,j}+x_{i+1,j+1}\leq 1 && (0\leq i,j\leq N-2)
\end{aligned}
$$

Two adjacent cells always sit together in some $2\times 2$ window, and conversely two stars
in a $2\times 2$ window are always adjacent, so these $(N-1)^2$ inequalities are equivalent
to the condition that no two stars are adjacent.
Enumerating the windows also covers the horizontal, vertical and diagonal cases at once.

## PyQBPP Program

The following program declares the constraints above as
[native constraints](CONSTRAINTS) with `qbpp.cons()` and solves the puzzle with the Easy Solver:

```python
import pyqbpp as qbpp

N = 10  # board size = number of regions
K = 2   # stars per row, per column and per region

# Region id (0 to N-1) of each cell.
REGION = [
    [0, 0, 0, 0, 0, 1, 1, 1, 2, 2],
    [0, 1, 1, 1, 1, 1, 1, 2, 2, 3],
    [0, 4, 1, 5, 5, 2, 2, 2, 3, 3],
    [4, 4, 1, 5, 5, 6, 2, 2, 2, 3],
    [4, 4, 4, 5, 5, 6, 7, 8, 8, 3],
    [4, 4, 4, 5, 5, 6, 7, 8, 8, 3],
    [4, 5, 5, 5, 5, 6, 7, 7, 8, 3],
    [4, 5, 9, 9, 9, 6, 7, 7, 8, 8],
    [9, 9, 9, 9, 6, 6, 6, 7, 7, 6],
    [9, 9, 9, 9, 9, 9, 6, 6, 6, 6],
]

x = qbpp.var("x", shape=(N, N))

# List of expressions holding the number of stars in each region.
region = [0] * N
for i in range(N):
    for j in range(N):
        region[REGION[i][j]] += x[i, j]

f = 0
for i in range(N):
    f += qbpp.cons(qbpp.sum(x[i, :]) == K)  # row i
    f += qbpp.cons(qbpp.sum(x[:, i]) == K)  # column i
    f += qbpp.cons(region[i] == K)          # region i

# At most one star per 2x2 window = no two stars are adjacent.
for i in range(N - 1):
    for j in range(N - 1):
        f += 2 * qbpp.cons(qbpp.sum(x[i:i+2, j:j+2]) <= 1)

sol = qbpp.EasySolver(f).search(target_energy=0)

# Print the solution: a starred cell shows its region letter in parentheses.
for i in range(N):
    line = [" "] * (2 * N + 1)
    for j in range(N):
        line[2 * j + 1] = chr(ord("A") + REGION[i][j])
        if sol(x[i, j]):
            line[2 * j] = "("
            line[2 * j + 2] = ")"
    print("".join(line).rstrip())
```

`qbpp.var("x", shape=(N, N))` creates an $N\times N$ array `x` of binary variables.

Unlike rows and columns, regions have arbitrary shapes, so the board is scanned once to add
the variable of each cell to `region[r]` for its region $r$, producing a list of expressions
that hold the number of stars in each region.

The three kinds of equality constraints and the $2\times 2$ window inequalities are all
declared with `qbpp.cons()`:
- `x[i, :]` is the vector of $N$ variables in row $i$, and `x[:, i]` is the vector of $N$
  variables in column $i$.
- `x[i:i+2, j:j+2]` is the $2\times 2$ window of four variables whose top-left cell is $(i,j)$.
- Applying `qbpp.sum` to them and writing `== K` or `<= 1` produces a constraint.

Constraints declared with `qbpp.cons()` are passed to the solver directly instead of being
expanded into a penalty expression, and the solver searches for assignments that satisfy them.
See [Nonlinear Functions and Native Constraints](CONSTRAINTS) for details.

This puzzle has no objective function to minimize: finding one placement that satisfies every
constraint solves it. The energy is $0$ exactly when all constraints are satisfied, so
`search(target_energy=0)` stops the search as soon as the target energy $0$ is reached.

Running the program prints the solution. A cell holding a star shows its region letter in
parentheses, like `(A)`, and every other cell shows its region letter alone
(since stars are never adjacent, the parentheses never collide with a neighboring cell):

```
(A)A A A(A)B B B C C
 A B(B)B B B B C C(D)
 A E B F F(C)C(C)D D
 E E(B)F F G C C C(D)
 E E E F(F)G(H)I I D
 E(E)E F F G H I(I)D
 E F F(F)F G(H)H I D
(E)F J J J G H H(I)I
 J J J(J)G(G)G H H G
 J(J)J J J J G(G)G G
```

Every row, column and region holds exactly two stars, and no two stars are adjacent
horizontally, vertically or diagonally.

## Constraint Weights

A constraint declared with `qbpp.cons()` can be weighted by multiplying it by a scalar.
In the program above, only the $2\times 2$ window constraints are weighted by `2 *`.

In a problem that asks for an assignment satisfying every constraint, all constraints must
hold equally, but the weights decide which violations the search repairs first, and therefore
affect how long it takes to find a solution.
For this puzzle, making the adjacency constraints heavier than the counting constraints on
rows, columns and regions turns the search into one that moves stars around while preserving
their counts, which reaches a solution more easily.
