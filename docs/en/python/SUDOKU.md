---
layout: default
nav_exclude: true
title: "Sudoku"
nav_order: 83
lang: en
hreflang_alt: "ja/python/SUDOKU"
hreflang_lang: "ja"
---

# Sudoku

**Sudoku** is a puzzle played on a $9\times 9$ grid in which each cell must be filled with a digit from 1 to 9, subject to the following conditions:

- Each row contains the digits 1 through 9 exactly once.
- Each column contains the digits 1 through 9 exactly once.
- Each of the nine $3\times 3$ blocks contains the digits 1 through 9 exactly once.

The puzzle is presented with a partial assignment (the **clues**); the goal is to fill in the remaining empty cells while satisfying the constraints above.

## QUBO formulation with one-hot encoding

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

These equality constraints are encoded as a sum of squared penalties to define the QUBO expression $f$. Any assignment with $f=0$ corresponds to a valid Sudoku solution.

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

Collecting these forced values into a dictionary `{Var: 0 or 1}` and passing it to `qbpp.replace` removes the corresponding variables from the QUBO expression, drastically reducing the number of variables the solver needs to handle.

## PyQBPP program

The following PyQBPP program builds the QUBO expression from the constraints, fixes the clue-related variables, and then solves the puzzle with EasySolver:

{% raw %}
```python
import pyqbpp as qbpp

# 0 represents an empty cell. "Hard" puzzle (Project Euler #1).
PUZZLE = [
    [0, 0, 3, 0, 2, 0, 6, 0, 0],
    [9, 0, 0, 3, 0, 5, 0, 0, 1],
    [0, 0, 1, 8, 0, 6, 4, 0, 0],
    [0, 0, 8, 1, 0, 2, 9, 0, 0],
    [7, 0, 0, 0, 0, 0, 0, 0, 8],
    [0, 0, 6, 7, 0, 8, 2, 0, 0],
    [0, 0, 2, 6, 0, 9, 5, 0, 0],
    [8, 0, 0, 2, 0, 3, 0, 0, 9],
    [0, 0, 5, 0, 1, 0, 3, 0, 0],
]


def sudoku_expr(x):
    f = qbpp.expr()
    # Each cell holds exactly one digit.
    for i in range(9):
        for j in range(9):
            f += qbpp.sum(x[i, j, :]) == 1
    # Each row / column has each digit exactly once.
    for k in range(9):
        for i in range(9):
            f += qbpp.sum(x[i, :, k]) == 1
        for j in range(9):
            f += qbpp.sum(x[:, j, k]) == 1
    # Each 3x3 box has each digit exactly once.
    for br in range(3):
        for bc in range(3):
            for k in range(9):
                f += qbpp.sum(x[3*br:3*br+3, 3*bc:3*bc+3, k]) == 1
    return f


def fix_variables(x, puzzle):
    sub = {}
    for i in range(9):
        for j in range(9):
            v = puzzle[i][j]
            if v == 0:
                continue
            k_clue = v - 1
            for k in range(9):
                sub[x[i, j, k]] = 1 if k == k_clue else 0
            for jj in range(9):
                if jj != j:
                    sub.setdefault(x[i, jj, k_clue], 0)
            for ii in range(9):
                if ii != i:
                    sub.setdefault(x[ii, j, k_clue], 0)
            br, bc = i // 3, j // 3
            for ii in range(3 * br, 3 * br + 3):
                for jj in range(3 * bc, 3 * bc + 3):
                    if (ii, jj) != (i, j):
                        sub.setdefault(x[ii, jj, k_clue], 0)
    return sub


def print_sudoku(solution):
    for i in range(9):
        if i % 3 == 0 and i > 0:
            print("------+-------+------")
        row = []
        for j in range(9):
            v = solution[i][j]
            row.append(str(v + 1) if v >= 0 else ".")
            if j % 3 == 2 and j < 8:
                row.append("|")
        print(" ".join(row))


x = qbpp.var("x", 9, 9, 9)
f = sudoku_expr(x)
sub = fix_variables(x, PUZZLE)

initial_sol = qbpp.Sol(f).set(sub)
print("Puzzle:")
print_sudoku(qbpp.onehot_to_int(initial_sol(x)))

g = qbpp.replace(f, sub)
g.simplify_as_binary()

solver = qbpp.EasySolver(g)
sol = solver.search(target_energy=0)
full_sol = qbpp.Sol(f).set(sol).set(sub)

print("\nSolution:")
print_sudoku(qbpp.onehot_to_int(full_sol(x)))
```
{% endraw %}

`qbpp.var("x", 9, 9, 9)` creates a 3-dimensional array `x` of binary variables with shape $(9, 9, 9)$.

The function `sudoku_expr` builds the four families of equality penalties using slice notation together with `qbpp.sum` and the `== 1` operator:
- `x[i, j, :]` is the 9-element vector of variables along axis $k$ for cell $(i, j)$.
- `x[i, :, k]` is the 9-element vector for digit $k+1$ along row $i$.
- `x[:, j, k]` is the 9-element vector for digit $k+1$ along column $j$.
- `x[3*br:3*br+3, 3*bc:3*bc+3, k]` is the 2D array of variables corresponding to digit $k+1$ in a $3\times 3$ block.

`qbpp.sum(...) == 1` applied to each of these yields a squared-difference penalty expression that is 0 exactly when the sum equals 1.

The function `fix_variables` collects all forced values (1 for the clue digit, 0 for everything that conflicts with it) into a dictionary `sub`. Because Python's dict naturally handles repeated writes to the same key, the clue cell entries use plain `sub[...] = ...` (overwrite) and the neighbor entries use `sub.setdefault(...)` (write only if the key is new). This ensures the "= 1" entry of a clue cell wins over any later "= 0" entries from another clue's neighbor rules.

`qbpp.replace(f, sub)` produces a new expression `g` in which every variable listed in `sub` has been substituted by its constant value (0 or 1). The forced variables therefore disappear, and `g.simplify_as_binary()` reduces `g` so it contains only the variables corresponding to empty cells.

`qbpp.EasySolver(g)` wraps `g` for solving, and `solver.search(target_energy=0)` searches for a solution `sol` reaching energy 0. Since `g` no longer references the clue-related variables, `sol` only holds values for the empty cells. To produce a complete assignment over the original variables of `f`, we build `qbpp.Sol(f).set(sol).set(sub)`: this creates a new `Sol` over the variables of `f`, copies the values of `sol`, and then applies the forced values from `sub`.

Finally, `full_sol(x)` returns the 3-dimensional 0/1 array, `qbpp.onehot_to_int` decodes each one-hot vector along axis $k$ into an integer in $\{0,\ldots,8\}$, and `print_sudoku` prints the value plus 1.

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
