---
last_modified: 2026-10-26
layout: default
nav_exclude: true
title: "Video: Sudoku"
description: "The points of each chapter of the video \"QUBO++ Case Study: Sudoku (Python)\", with the programs shown in it and their output."
lang: en
hreflang_alt: "ja/python/VIDEO_SUDOKU"
hreflang_lang: "ja"
video: sudoku
---

# Video: Sudoku (Python)

A companion to the video "QUBO++ Case Study: Sudoku (Python)".
For each chapter it gives the main points, the programs shown in the video with their output, and links to the pages that explain more.
Click "▶ Play the video from …" to play from that scene.
Programs that the video shows in part are given here in full, ready to run.

{% include video_embed.html slug="sudoku" %}

What the video covers:

- The rules of Sudoku, and how Sudoku is graph coloring
- Binary variables `x[i][j][k]` for each cell and digit, made as a 3-D array
- The cell, row and column constraints in one line each by changing the `axis` of `qbpp.vector_sum`, the block constraints with slices, all declared with `qbpp.cons()`
- Registering the variables the clues decide in a dictionary and fixing them with `qbpp.replace` (729 variables become 174)
- Restoring a solution of the original expression with `qbpp.Sol(f).set(sol, sub)`, and solving a board with 22 clues with the same program

Back to the list of [Videos (Case Studies)](../VIDEO_CASE_STUDIES)

## The problem

{% include video_seek.html t="0:32" %}

Sudoku is a puzzle that puts the digits 1 to 9 into a 9 × 9 grid of cells. The digits given at the start are the clues.
The other cells are filled so that the following three rules hold:

- every row holds 1 to 9 exactly once
- every column holds 1 to 9 exactly once
- every 3 × 3 block, marked by thick lines, holds 1 to 9 exactly once

The board in the video has 28 clues and only one answer.

## Sudoku and graph coloring

{% include video_seek.html t="1:24" %}

Graph coloring colors the vertices so that two vertices joined by an edge get different colors.
In Sudoku, the 81 cells are the vertices, and two cells in the same row, column or block are joined by an edge.
Each cell has 20 edges (8 in its row, 8 in its column and 4 to the rest of its block), so there are $81 \times 20 / 2 = 810$ edges in all.
With digits as colors, the rule is that the two ends of every edge hold different digits; the clues are vertices whose color is given from the start.

## Variables and constraints

### Variables x[i][j][k]

{% include video_seek.html t="2:16" %}

The binary variable $x_{i,j,k}$ is 1 if the digit of cell $(i, j)$ is $k+1$, and 0 otherwise.
$i$ is the row, $j$ the column and $k$ the digit, each from 0 to 8, so there are $9 \times 9 \times 9 = 729$ variables.
Think of one 9 × 9 board for each digit: in the answer, every cell is 1 on exactly one of the 9 boards.
For example, if the cell in row 0, column 2 holds 3, that cell is 1 only on the board $k = 2$.
In QUBO++, `x = qbpp.var("x", shape=(9, 9, 9))` makes them a 3-D variable array.

### Four kinds of constraints

{% include video_seek.html t="3:19" %}

There are four kinds of constraints, each of the form "the sum is 1".

| Constraint | Meaning | Added over | Count |
|---|---|---|---|
| Cell | every cell holds exactly one digit | the digit $k$ | 81 |
| Row | every row holds each digit exactly once | the column $j$ | 81 |
| Column | every column holds each digit exactly once | the row $i$ | 81 |
| Block | every block holds each digit exactly once | the 9 cells of 3 × 3 | 81 |

That makes $81 \times 4 = 324$ constraints. There is no objective, only constraints, so the assignment that meets them all and makes $f$ zero is the answer.

## Writing it in QUBO++

{% include video_seek.html t="4:26" %}

`qbpp.vector_sum` adds up an array along one axis, and `axis` is the number of that axis (0 is $i$, 1 is $j$, 2 is $k$).
With `axis=2` it gives the sum of each cell, with `axis=1` the row sums, and with `axis=0` the column sums: each a 9 × 9 array of 81 sums.
Comparing an array with `== 1` gives one constraint per element, 81, and `qbpp.cons()` declares them all as constraints.
Only the blocks are cut out with the slice `x[i:i+3, j:j+3, k]` and added up. `i:i+3` means the 3 indices starting at $i$.

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(9, 9, 9))
f = qbpp.cons(qbpp.vector_sum(x, axis=2) == 1)      # cells
f += qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)     # rows
f += qbpp.cons(qbpp.vector_sum(x, axis=0) == 1)     # columns
for i in range(0, 9, 3):
    for j in range(0, 9, 3):
        for k in range(9):
            f += qbpp.cons(qbpp.sum(x[i:i+3, j:j+3, k]) == 1)   # blocks
```

See [Sum Functions](SUM), [Slice and Concat](SLICE_CONCAT) and [Nonlinear Functions and Native Constraints](CONSTRAINTS) for more.

## Fixing the clues

### Registering them in the dictionary sub

{% include video_seek.html t="5:39" %}

The clues decide the values of some variables first. The solver need not search for a variable whose value is decided.
For example, the clue 3 in row 0, column 2 is on the board $k = 2$, so `x[0][2][2]` is 1, and the variables of the other eight digits of this cell are 0.
On the digit-3 board, the other eight cells of the row, eight cells of the column and the block's other four cells are 0 too: one clue decides 29 variables.
They are registered in the dictionary `sub`, with variables as keys and 0 or 1 as values, in the same way for all 28 clues.

### The program

{% include video_seek.html t="6:30" %}

The board is read from the text file [main.txt](../../images/sudoku/main.txt), with dots for blank cells.
A dot becomes 0 and a digit an integer, in a 9 × 9 list, `puzzle`.

```
..3295...
4...67..9
......8..
57...4..6
.4.....2.
3..6...74
..8......
9..75...1
...9136..
```

In a clue cell, `v` is its digit and `k` is `v - 1`.
The cell's nine variables are registered by assignment, and those of the same row, column and block with `setdefault`.
`setdefault` registers a key only if it is not in the dictionary yet. In the row loop, when `t` is 2, the key `x[0][2][2]` is the very key registered as 1 for the clue cell, and assigning 0 would overwrite that 1.
After registering everything, `qbpp.replace` is called just once: it replaces the variables of `sub` in `f` with constants, and 729 variables become 174.
Put main.txt in the directory where you run it.

```python
import pyqbpp as qbpp

puzzle = [[int(c) if c != "." else 0 for c in line.strip()] for line in open("main.txt")]

x = qbpp.var("x", shape=(9, 9, 9))
f = qbpp.cons(qbpp.vector_sum(x, axis=2) == 1)      # cells
f += qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)     # rows
f += qbpp.cons(qbpp.vector_sum(x, axis=0) == 1)     # columns
for i in range(0, 9, 3):
    for j in range(0, 9, 3):
        for k in range(9):
            f += qbpp.cons(qbpp.sum(x[i:i+3, j:j+3, k]) == 1)   # blocks

sub = {}
for i in range(9):
    for j in range(9):
        v = puzzle[i][j]
        if v > 0:
            k = v - 1
            for t in range(9):
                sub[x[i][j][t]] = 1 if t == k else 0     # cell (i, j) is v
            for t in range(9):
                sub.setdefault(x[i][t][k], 0)            # same row
                sub.setdefault(x[t][j][k], 0)            # same column
            for a in range(i // 3 * 3, i // 3 * 3 + 3):
                for b in range(j // 3 * 3, j // 3 * 3 + 3):
                    sub.setdefault(x[a][b][k], 0)        # same block
g = qbpp.replace(f, sub)
g.simplify_as_binary()

solver = qbpp.EasySolver(g)
print("variables =", solver.var_count)
sol = solver.search(target_energy=0)
full = qbpp.Sol(f).set(sol, sub)
print("f =", full(f), " violated =", f.cons(full))
for row in qbpp.onehot_to_int(full(x), axis=2):
    print(*(v + 1 for v in row))
```

See [Replace Functions](REPLACE) for more.

## Results

### A solution of the original expression

{% include video_seek.html t="7:40" %}

EasySolver solves `g` with `target_energy=0`. $f$ is zero when every constraint is met, so the search stops at zero.
The solver's solution `sol` holds only the 174 remaining variables; the values of the fixed variables are in the dictionary `sub`.
`qbpp.Sol(f)` is a solution with all 729 variables of `f` zero, and `set(sol, sub)` puts both sets of values in, giving `full`.
`full(x)` is a 9 × 9 × 9 array; `qbpp.onehot_to_int(..., axis=2)` finds the position of the 1 along the digits (0 to 8), so adding one gives the digit of each cell.

See [QR: Solutions](QR_SOLUTION) and [One-Hot to Integer Conversion](ONEHOT) for more.

### The output

{% include video_seek.html t="8:48" %}

Output:

```
variables = 174
f = 0  violated = 0
6 8 3 2 9 5 4 1 7
4 2 1 8 6 7 3 5 9
7 9 5 3 4 1 8 6 2
5 7 2 1 3 4 9 8 6
8 4 6 5 7 9 1 2 3
3 1 9 6 8 2 5 7 4
1 3 8 4 2 6 7 9 5
9 6 4 7 5 8 2 3 1
2 5 7 9 1 3 6 4 8
```

The first line is the number of variables left after `qbpp.replace`.
$f$ is zero and no constraint is violated. With constraints only and no objective, $f = 0$ means every rule holds.
This board has only one answer, so every run gives the same board.

### A board with 22 clues

{% include video_seek.html t="9:28" %}

A board with only 22 clues, [hard.txt](../../images/sudoku/hard.txt), is solved with the same program; only the name of the file it reads has changed.

```
..92....4
...5..8..
.....13..
.1.7..5..
...6....9
.5.4.2...
..2.....3
......75.
...1.9.2.
```

With fewer clues, fewer variables can be fixed: 250 variables remain.
Put hard.txt in the directory where you run it.

```python
import pyqbpp as qbpp

puzzle = [[int(c) if c != "." else 0 for c in line.strip()] for line in open("hard.txt")]

x = qbpp.var("x", shape=(9, 9, 9))
f = qbpp.cons(qbpp.vector_sum(x, axis=2) == 1)      # cells
f += qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)     # rows
f += qbpp.cons(qbpp.vector_sum(x, axis=0) == 1)     # columns
for i in range(0, 9, 3):
    for j in range(0, 9, 3):
        for k in range(9):
            f += qbpp.cons(qbpp.sum(x[i:i+3, j:j+3, k]) == 1)   # blocks

sub = {}
for i in range(9):
    for j in range(9):
        v = puzzle[i][j]
        if v > 0:
            k = v - 1
            for t in range(9):
                sub[x[i][j][t]] = 1 if t == k else 0     # cell (i, j) is v
            for t in range(9):
                sub.setdefault(x[i][t][k], 0)            # same row
                sub.setdefault(x[t][j][k], 0)            # same column
            for a in range(i // 3 * 3, i // 3 * 3 + 3):
                for b in range(j // 3 * 3, j // 3 * 3 + 3):
                    sub.setdefault(x[a][b][k], 0)        # same block
g = qbpp.replace(f, sub)
g.simplify_as_binary()

solver = qbpp.EasySolver(g)
print("variables =", solver.var_count)
sol = solver.search(target_energy=0)
full = qbpp.Sol(f).set(sol, sub)
print("f =", full(f), " violated =", f.cons(full))
for row in qbpp.onehot_to_int(full(x), axis=2):
    print(*(v + 1 for v in row))
```

Output:

```
variables = 250
f = 0  violated = 0
5 3 9 2 8 7 6 1 4
7 4 1 5 6 3 8 9 2
6 2 8 9 4 1 3 7 5
2 1 3 7 9 8 5 4 6
4 8 7 6 1 5 2 3 9
9 5 6 4 3 2 1 8 7
1 7 2 8 5 4 9 6 3
8 9 4 3 2 6 7 5 1
3 6 5 1 7 9 4 2 8
```

$f$ is zero and no constraint is violated. This board, too, has only one answer.

See [Sudoku](SUDOKU) for more.

## Summary

{% include video_seek.html t="10:06" %}

- We used one binary variable per cell and digit, in a 3-D array.
- For cells, rows and columns, only the `axis` of `qbpp.vector_sum` changes.
- Blocks were cut out with slices, and every constraint was written with `qbpp.cons()`.
- The variables the clues decide went into the dictionary `sub`, and `qbpp.replace` fixed them, taking 729 variables down to 174.
- `qbpp.Sol(f).set(sol, sub)` gave a solution of the original expression, and `qbpp.onehot_to_int` gave the digits.
- There is no objective: a solution with $f$ equal to zero is the answer.
