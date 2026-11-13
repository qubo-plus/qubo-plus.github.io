---
last_modified: 2026-11-13
layout: default
nav_exclude: true
title: "Video: Placing Dominoes on a Chessboard"
description: "The chapters of the video \"QUBO++ Case Study: Placing Dominoes on a Chessboard (Python)\", with the programs and outputs shown in it."
lang: en
hreflang_alt: "ja/python/VIDEO_DOMINOES"
hreflang_lang: "ja"
video: dominoes
---

# Video: Placing Dominoes on a Chessboard (Python)

A guide to the video "QUBO++ Case Study: Placing Dominoes on a Chessboard (Python)".
For each chapter it gives the main points, the programs and outputs shown in the video, and links to the pages with the details.
Click "▶ Play the video from …" to play from that scene.

{% include video_embed.html slug="dominoes" %}

What the video covers:

- Placing as many dominoes as possible on the 8×8 board (32)
- Representing the board with two diagonally opposite corners cut as a graph whose vertices are the cells and whose edges are the pairs of adjacent cells, solving it as a maximum matching (30), and why 31 dominoes don't fit
- Placing as few dominoes as possible on the full 8×8 board until no more fits (the minimum maximal matching, 22)
- Writing both problems with a variable $x$ for each edge and the number $N(v)$ of dominoes covering a cell, changing only the sign of the objective and the constraints

The written explanation is on the [Maximum Matching](MAX_MATCHING#placing-dominoes-on-a-chessboard) and [Minimum Maximal Matching](MINMAX_MATCHING#placing-dominoes-on-a-chessboard) pages. Back to the [Videos (case studies)](../VIDEO_CASE_STUDIES) list

To see only the result, play the [Result: 22 Dominoes](#result-22-dominoes) chapter.

## As Many as Possible

{% include video_seek.html t="0:36" %}

- A domino covers two cells that are adjacent vertically or horizontally. Dominoes may not overlap.
- On the 8×8 board, four horizontal dominoes in each row make 32 and cover all 64 cells. Each domino covers 2 cells, so 33 cannot fit, and the maximum is 32.

## Cutting Two Corners

{% include video_seek.html t="1:05" %}

- Cutting off two diagonally opposite corner cells leaves 62 cells. Do 31 dominoes fit?
- Joining adjacent cells by edges gives a graph written $G=(V,E)$, where $V$ is the set of vertices and $E$ is the set of edges. The 62-cell board has 108 edges.
- Placing a domino is choosing an edge, and dominoes not overlapping means the chosen edges share no vertex. A set of edges sharing no vertex is a **matching**, and a matching with the most edges is a **maximum matching**.

## The Formula of the Maximum Matching

{% include video_seek.html t="1:55" %}

- For each edge $e$ a binary variable $x_e$ is 1 when a domino is placed on that edge. The number of dominoes is $\sum_e x_e$.
- The number of dominoes covering cell $v$ is $N(v)=\sum_{(v,u)\in E} x_{vu}$. $N(v)$ is not a new variable but a number determined by the values of $x$: 0 if the cell is empty, 1 if it is covered, and 2 or more if dominoes overlap.
- Dominoes do not overlap when $N(v)\le 1$ for every cell. QUBO++ minimizes, so the sign is flipped, and the constraints are declared with `qbpp.cons()` and multiplied by the weight 2:

$$
f = -\sum_e x_e + 2\sum_v \text{cons}(N(v)\le 1)
$$

- A broken constraint adds the square of its violation times the weight to the energy. Removing one of two overlapping dominoes decreases the sum of $x$ by 1, increasing $f$ by 1, but the penalty decreases by 2 or more, so a solution with an overlap is never the minimum. With weight 1 the two balance, and an overlapping solution could also be a minimum.

For `qbpp.cons()` and weights, see the [Constraints](CONSTRAINTS) page.

## The Program

{% include video_seek.html t="3:32" %}

```python
import pyqbpp as qbpp

# 62 cells: the 8×8 board without two diagonally opposite corners
cells = [(r, c) for r in range(8) for c in range(8)
         if (r, c) not in [(0, 0), (7, 7)]]
index = {cell: i for i, cell in enumerate(cells)}

# pairs of adjacent cells (the right and lower neighbors)
edges = []
for r, c in cells:
    for cell in [(r, c + 1), (r + 1, c)]:
        if cell in index:
            edges.append((index[(r, c)], index[cell]))

x = qbpp.var("x", shape=len(edges))

# N[v]: the number of dominoes covering cell v
N = [0] * len(cells)
for i, (u, v) in enumerate(edges):
    N[u] += x[i]
    N[v] += x[i]

objective = qbpp.sum(x)

constraint = 0
for v in range(len(cells)):
    constraint += qbpp.cons(N[v] <= 1)

f = -objective + 2 * constraint
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=10)

print(f"dominoes = {sol(objective)}")
print(f"violated constraints = {f.cons(sol)}")
board = [[" "] * 8 for _ in range(8)]
for r, c in cells:
    board[r][c] = "."
for i, (u, v) in enumerate(edges):
    if sol(x[i]) == 1:
        (r1, c1), (r2, c2) = cells[u], cells[v]
        if r1 == r2:
            board[r1][c1], board[r2][c2] = "<", ">"
        else:
            board[r1][c1], board[r2][c2] = "^", "v"
for row in board:
    print(" ".join(row))
```

- `cells` lists the (row, column) of the 62 cells, `index` maps a cell to its number, and `edges` lists the pairs of numbers of adjacent cells. Adding only the right and lower neighbors adds the left and upper pairs as the right and lower neighbors of the other cell.
- `N` is the list of $N(v)$ for each cell; for each edge, its `x` is added to `N` of both end cells `u` and `v`.
- There are $2^{108}$ assignments of the variables, too many to check them all, so [EasySolver](EASYSOLVER) searches for 10 seconds. `sol(objective)` is the number of dominoes, and `f.cons(sol)` is the number of broken constraints.
- The board shows a horizontal domino as `<>`, a vertical one as `^` and `v`, and an empty cell as `.`.

## Result: 30 Dominoes

{% include video_seek.html t="5:02" %}

The output in the video (the placement may change from run to run):

```
dominoes = 30
violated constraints = 0
  ^ ^ ^ < > ^ ^
^ v v v < > v v
v ^ ^ ^ < > ^ ^
^ v v v < > v v
v . ^ . < > ^ ^
< > v ^ < > v v
^ ^ ^ v < > < >
v v v < > < >  
```

- 30 dominoes are placed, and no constraint is broken. Only two cells are empty, and they are not adjacent, so no domino fits.

## Why 31 Dominoes Don't Fit

{% include video_seek.html t="5:21" %}

- On a chessboard two adjacent cells always have different colors, so a domino covers one white cell and one black cell.
- The two cut corners are both white, so there are 30 white cells and 32 black cells. 31 dominoes would need 31 white cells, so 31 dominoes cannot fit. The two empty cells of the result are both black.
- So the 30 dominoes found by QUBO++ are the maximum. This puzzle is known as the mutilated chessboard problem.

## Until No More Fits

{% include video_seek.html t="6:08" %}

- Now the main problem: on the full 8×8 board, place dominoes until not even one more fits. Placing them one by one at random positions stopped at 29 dominoes in the example.
- A matching to which no edge can be added is a **maximal matching**. On a row of 4 cells, one domino in the middle is already maximal, but the maximum is 2. Maximal means no more fits; maximum means the most; they differ.
- We look for the fewest dominoes that leave no room for another: a maximal matching with the fewest edges, the **minimum maximal matching**.

## The Condition That No More Fits

{% include video_seek.html t="7:04" %}

- We use the constraint $1\le N(u)+N(v)\le 2$ for every edge $uv$. $N(u)+N(v)$ adds the $x$ of all edges around $u$ and $v$, counting the middle edge $uv$ twice.
- With a domino on $uv$ the sum is 2; if only one cell is covered by another domino it is 1; if both are covered by different dominoes it is 2. If both cells are empty the sum is 0, breaking the constraint, since a domino still fits there. If dominoes overlap, a cell covered twice and the other cell of a domino covering it give a sum of 3 or more.
- So 1 to 2 on every edge is the same as no overlaps and no more room.

The paper shown in the corner of the screen as a reference: Y. Nakahara, S. Tsukiyama, K. Nakano, V. Parque, and Y. Ito, "A penalty-free QUBO formulation for the minimum maximal matching problem," International Journal of Parallel, Emergent and Distributed Systems, pp. 1-19, 2025.

## The Formula of the Minimum Maximal Matching

{% include video_seek.html t="8:17" %}

- The 8×8 board has 112 edges, so there are 112 variables $x$. The goal is to minimize the sum of $x$, so the sign is not flipped:

$$
f = \sum_e x_e + 2\sum_{(u,v)\in E} \text{cons}(1\le N(u)+N(v)\le 2)
$$

- A single pair of adjacent empty cells is a violation of 1. With weight 1, the solution that leaves the gap and the one that fills it with a domino have the same energy. With weight 2 the filled one has the smaller energy, so a solution with a gap is never the minimum.

## Changing the Program

{% include video_seek.html t="9:03" %}

```python
import pyqbpp as qbpp

# the 64 cells of the 8×8 board
cells = [(r, c) for r in range(8) for c in range(8)]
index = {cell: i for i, cell in enumerate(cells)}

# pairs of adjacent cells (the right and lower neighbors)
edges = []
for r, c in cells:
    for cell in [(r, c + 1), (r + 1, c)]:
        if cell in index:
            edges.append((index[(r, c)], index[cell]))

x = qbpp.var("x", shape=len(edges))

# N[v]: the number of dominoes covering cell v
N = [0] * len(cells)
for i, (u, v) in enumerate(edges):
    N[u] += x[i]
    N[v] += x[i]

objective = qbpp.sum(x)

constraint = 0
for u, v in edges:
    constraint += qbpp.cons(N[u] + N[v], between=(1, 2))

f = objective + 2 * constraint
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=10)

print(f"dominoes = {sol(objective)}")
print(f"violated constraints = {f.cons(sol)}")
board = [[" "] * 8 for _ in range(8)]
for r, c in cells:
    board[r][c] = "."
for i, (u, v) in enumerate(edges):
    if sol(x[i]) == 1:
        (r1, c1), (r2, c2) = cells[u], cells[v]
        if r1 == r2:
            board[r1][c1], board[r2][c2] = "<", ">"
        else:
            board[r1][c1], board[r2][c2] = "^", "v"
for row in board:
    print(" ".join(row))
```

- From the first program, only `cells` (the 64 cells, without the condition that removes two corners), the constraint (per edge instead of per cell, $1\le N(u)+N(v)\le 2$ with `between` of `qbpp.cons()`), and `f` (no minus sign, since we minimize) change.
- The parts that build `edges` and `N`, and the parts that solve and print, stay the same. The solver is the same EasySolver.

## Result: 22 Dominoes

{% include video_seek.html t="9:47" %}

The output in the video (the placement may change from run to run):

```
dominoes = 22
violated constraints = 0
. ^ < > . < > .
^ v . < > ^ . ^
v . < > . v ^ v
. < > . < > v .
< > . < > . < >
. < > ^ . < > .
< > . v ^ . < >
. < > . v < > .
```

- 22 dominoes are placed, and no constraint is broken. No two of the 20 empty cells are adjacent, so no more domino fits — with 10 fewer dominoes than the 32 of the full placement.
- Placing dominoes at random 100,000 times always stopped between 25 and 32 dominoes, most often at 29, and never at 22 to 24.
- That 22 is the minimum was also confirmed by another method.

## Summary

{% include video_seek.html t="10:34" %}

- As many as possible on the 8×8 board is 32; on the board with two corners cut, the constraint $N(v)\le 1$ for each cell gives 30.
- The fewest dominoes that leave the 8×8 board with no room for another is 22, found with the constraint $1\le N(u)+N(v)\le 2$ for each edge.
- Both are written with a variable $x$ for each edge and the number $N(v)$ of dominoes covering a cell; changing only the sign of the objective and the constraints solves a different problem.
