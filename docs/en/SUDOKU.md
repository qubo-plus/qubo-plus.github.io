---
last_modified: 2026-10-26
layout: default
nav_exclude: true
title: "Sudoku"
nav_order: 43
lang: en
hreflang_alt: "ja/SUDOKU"
hreflang_lang: "ja"
---

# Sudoku

**Sudoku** is a puzzle played on a $9\times 9$ grid in which each cell must be filled with a digit from 1 to 9, subject to the following conditions:

- Each row contains the digits 1 through 9 exactly once.
- Each column contains the digits 1 through 9 exactly once.
- Each of the nine $3\times 3$ blocks contains the digits 1 through 9 exactly once.

The puzzle is presented with a partial assignment (the **clues**); the goal is to fill in the remaining empty cells while satisfying the constraints above.

{% include video_embed.html slug="sudoku" %}

The programs in the video, chapter by chapter, are on the page [Video: Sudoku](python/VIDEO_SUDOKU).

## Formulation with one-hot encoding

We use a 3-dimensional array of binary variables $X=(x_{i,j,k})$ ($0\leq i, j, k \leq 8$), with the **one-hot encoding** that $x_{i,j,k}=1$ iff cell $(i, j)$ contains digit $k+1$.
Because each cell holds exactly one digit, exactly one of the nine $x_{i,j,k}$ values along axis $k$ is 1.

We impose the following constraints:

- Each cell holds exactly one digit:

$$
\begin{aligned}
\sum_{k=0}^{8} x_{i,j,k}=1 && (0\leq i,j \leq 8)
\end{aligned}
$$

- Each row contains each digit exactly once:

$$
\begin{aligned}
\sum_{j=0}^{8} x_{i,j,k}=1 && (0\leq i,k \leq 8)
\end{aligned}
$$

- Each column contains each digit exactly once:

$$
\begin{aligned}
\sum_{i=0}^{8} x_{i,j,k}=1 && (0\leq j,k \leq 8)
\end{aligned}
$$

- Each $3\times 3$ block contains each digit exactly once:

$$
\begin{aligned}
\sum_{i=3b_r}^{3b_r+2}\sum_{j=3b_c}^{3b_c+2} x_{i,j,k}=1 && (0\leq b_r, b_c\leq 2,\ 0\leq k \leq 8)
\end{aligned}
$$

These equalities are declared as constraints with [`qbpp::cons()`](CONSTRAINTS) to define the expression $f$. The energy of a constraint is the square of its violation, and any assignment with $f=0$ corresponds to a valid Sudoku solution.

## Fixing variables from clues

Rather than encoding clues as additional penalties, we fix the affected variables directly to 0 or 1.
When the clue tells us that cell $(i, j)$ contains digit $v$, the following variables are forced:

$$
\begin{aligned}
x_{i,j,v-1} &= 1 && \text{(cell $(i, j)$ IS digit $v$)}\\
x_{i,j,k} &= 0 && \text{($k \ne v-1$, cell $(i, j)$ is not any other digit)}\\
x_{i,j',v-1} &= 0 && \text{($j' \ne j$, no other cell in the same row holds $v$)}\\
x_{i',j,v-1} &= 0 && \text{($i' \ne i$, same for the column)}\\
x_{i',j',v-1} &= 0 && \text{($(i', j')$ in the same $3\times 3$ block, same for the block)}
\end{aligned}
$$

Collecting these forced values into a `qbpp::MapList` and passing it to `qbpp::replace` removes the corresponding variables from the expression, drastically reducing the number of variables the solver needs to handle.

## QUBO++ program

The following QUBO++ program builds the expression with the declared constraints, fixes the clue-related variables, and then solves the puzzle with EasySolver:

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

#include <iostream>
#include <unordered_set>

// 0 represents an empty cell. The example puzzle (Grid 01) of Project Euler Problem 96.
static const int PUZZLE[9][9] = {
  {0, 0, 3, 0, 2, 0, 6, 0, 0},
  {9, 0, 0, 3, 0, 5, 0, 0, 1},
  {0, 0, 1, 8, 0, 6, 4, 0, 0},
  {0, 0, 8, 1, 0, 2, 9, 0, 0},
  {7, 0, 0, 0, 0, 0, 0, 0, 8},
  {0, 0, 6, 7, 0, 8, 2, 0, 0},
  {0, 0, 2, 6, 0, 9, 5, 0, 0},
  {8, 0, 0, 2, 0, 3, 0, 0, 9},
  {0, 0, 5, 0, 1, 0, 3, 0, 0},
};

qbpp::Expr sudoku_expr(const qbpp::Array<3, qbpp::Var>& x) {
  // Each cell holds exactly one digit.
  qbpp::Expr f = qbpp::cons(qbpp::vector_sum(x, 2) == 1);
  // Each row has each digit exactly once.
  f += qbpp::cons(qbpp::vector_sum(x, 1) == 1);
  // Each column has each digit exactly once.
  f += qbpp::cons(qbpp::vector_sum(x, 0) == 1);

  // Each 3x3 box has each digit exactly once.
  for (size_t br = 0; br < 3; ++br)
    for (size_t bc = 0; bc < 3; ++bc)
      for (size_t k = 0; k < 9; ++k)
        f += qbpp::cons(qbpp::sum(x(qbpp::slice(3 * br, 3 * br + 3),
                                    qbpp::slice(3 * bc, 3 * bc + 3),
                                    k)) == 1);
  return f;
}

qbpp::MapList fix_variables(const qbpp::Array<3, qbpp::Var>& x) {
  // Collect forced values (0 or 1) derived from clues into a MapList.
  // A given variable may be written more than once; the unordered_set
  // keeps only the first write (in a valid puzzle, all writes to the
  // same variable have the same value).
  qbpp::MapList ml;
  std::unordered_set<qbpp::vindex_t> seen;
  auto add = [&](int i, int j, int k, int val) {
    qbpp::Var v(x[i][j][k]);
    if (seen.insert(v.index()).second) ml.emplace_back(v, val);
  };
  for (int i = 0; i < 9; ++i) {
    for (int j = 0; j < 9; ++j) {
      int v = PUZZLE[i][j];
      if (v == 0) continue;
      int k_clue = v - 1;
      // Cell (i, j) IS k_clue, and is NOT any other digit.
      for (int k = 0; k < 9; ++k) add(i, j, k, k == k_clue ? 1 : 0);
      // No other cell in this row / column / box can be k_clue.
      for (int jj = 0; jj < 9; ++jj)
        if (jj != j) add(i, jj, k_clue, 0);
      for (int ii = 0; ii < 9; ++ii)
        if (ii != i) add(ii, j, k_clue, 0);
      int br = i / 3, bc = j / 3;
      for (int ii = 3 * br; ii < 3 * br + 3; ++ii)
        for (int jj = 3 * bc; jj < 3 * bc + 3; ++jj)
          if (ii != i || jj != j) add(ii, jj, k_clue, 0);
    }
  }
  return ml;
}

void print_sudoku(const qbpp::Array<2, qbpp::coeff_t>& solution) {
  for (size_t i = 0; i < 9; ++i) {
    if (i > 0 && i % 3 == 0) std::cout << "------+-------+------\n";
    for (size_t j = 0; j < 9; ++j) {
      int v = static_cast<int>(solution[i][j]);
      std::cout << (v >= 0 ? std::to_string(v + 1) : ".");
      if (j == 2 || j == 5) std::cout << " | ";
      else if (j != 8) std::cout << ' ';
    }
    std::cout << '\n';
  }
}

int main() {
  auto x = qbpp::var("x", 9, 9, 9);
  auto f = sudoku_expr(x);
  auto sub = fix_variables(x);

  auto initial_sol = qbpp::Sol(f).set(sub);
  std::cout << "Puzzle:\n";
  print_sudoku(qbpp::onehot_to_int(initial_sol(x)));

  auto g = qbpp::replace(f, sub);
  g.simplify_as_binary();

  qbpp::EasySolver solver(g);
  auto sol = solver.search({{"target_energy", 0}});
  auto full_sol = qbpp::Sol(f).set(sol, sub);

  std::cout << "\nSolution:\n";
  print_sudoku(qbpp::onehot_to_int(full_sol(x)));
}
```
{% endraw %}

`qbpp::var("x", 9, 9, 9)` creates a 3-dimensional array `x` of binary variables with shape $(9, 9, 9)$.

The function `sudoku_expr` declares the four families of equality constraints.
The cell, row and column constraints use [`qbpp::vector_sum(x, axis)`](SUM), which sums an array along one axis.
The summed axis disappears, so each result is a $9\times 9$ array of 81 sums:
- `qbpp::vector_sum(x, 2)` sums along axis $k$; element $(i, j)$ is the sum of the 9 variables of cell $(i, j)$.
- `qbpp::vector_sum(x, 1)` sums along axis $j$; element $(i, k)$ is the sum of the 9 variables for digit $k+1$ in row $i$.
- `qbpp::vector_sum(x, 0)` sums along axis $i$; element $(j, k)$ is the sum of the 9 variables for digit $k+1$ in column $j$.

Applying `== 1` to an array gives 81 element-wise equalities, and enclosing them in `qbpp::cons()` declares all 81 constraints at once.
For the block constraints, `x(qbpp::slice(3*br, 3*br+3), qbpp::slice(3*bc, 3*bc+3), k)` extracts the 2D array of the 9 variables for digit $k+1$ in a $3\times 3$ block; its `qbpp::sum` is compared with `== 1` and enclosed in `qbpp::cons()`.
For an expression with declared constraints, the search stops when the energy is at most `target_energy` and all constraints are satisfied.

The function `fix_variables` collects all forced values (1 for the clue digit, 0 for everything that conflicts with it) into a `qbpp::MapList`. Because the same variable may be written multiple times, we use `std::unordered_set<qbpp::vindex_t>` to keep only the first write. In a valid puzzle (no two clues with the same digit in a row, column or block), all writes to the same variable have the same value, so it does not matter which one is kept: no neighbor rule of another clue writes "= 0" to the "= 1" variable of a clue.

`qbpp::replace(f, sub)` produces a new expression `g` in which every variable listed in `sub` has been substituted by its constant value (0 or 1). The forced variables therefore disappear, and `g.simplify_as_binary()` reduces `g` so it contains only the variables corresponding to empty cells.

`qbpp::EasySolver(g)` wraps `g` for solving, and {% raw %}`search({{"target_energy", 0}})`{% endraw %} searches for a solution `sol` reaching energy 0. Since `g` no longer references the clue-related variables, `sol` only holds values for the empty cells. To produce a complete assignment over the original variables of `f`, we build `qbpp::Sol(f).set(sol, sub)`: this creates a new `Sol` over the variables of `f`, copies the values of `sol`, and then applies the forced values from `sub`.

Finally, `full_sol(x)` returns the 3-dimensional 0/1 array, `qbpp::onehot_to_int` decodes each one-hot vector along axis $k$ into an integer in $\lbrace0,\ldots,8\rbrace$, and `print_sudoku` prints the value plus 1.

Running the program produces the clues (with `.` for empty cells) and the solution:
```
Puzzle:
. . 3 | . 2 . | 6 . .
9 . . | 3 . 5 | . . 1
. . 1 | 8 . 6 | 4 . .
------+-------+------
. . 8 | 1 . 2 | 9 . .
7 . . | . . . | . . 8
. . 6 | 7 . 8 | 2 . .
------+-------+------
. . 2 | 6 . 9 | 5 . .
8 . . | 2 . 3 | . . 9
. . 5 | . 1 . | 3 . .

Solution:
4 8 3 | 9 2 1 | 6 5 7
9 6 7 | 3 4 5 | 8 2 1
2 5 1 | 8 7 6 | 4 9 3
------+-------+------
5 4 8 | 1 3 2 | 9 7 6
7 2 9 | 5 6 4 | 1 3 8
1 3 6 | 7 9 8 | 2 4 5
------+-------+------
3 7 2 | 6 8 9 | 5 1 4
8 1 4 | 2 5 3 | 7 6 9
6 9 5 | 4 1 7 | 3 8 2
```
