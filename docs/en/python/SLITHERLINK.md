---
last_modified: 2026-11-01
layout: default
nav_exclude: true
title: "Slitherlink"
nav_order: 109
lang: en
hreflang_alt: "ja/python/SLITHERLINK"
hreflang_lang: "ja"
---

# Slitherlink

**Slitherlink** is a puzzle played on a grid of points: you connect adjacent points with lines to form a single loop (a closed line).
The lines must satisfy all of the following:

- The lines form one loop in total. The loop neither branches nor crosses itself.
- In a cell with a digit, the number of the cell's four sides that carry a line equals the digit.
- The sides of a cell without a digit have no condition.

Here we solve the following puzzle with $10\times 10$ cells.
`+` marks a grid point and the digits are the clues:

```
+   +   +   +   +   +   +   +   +   +   +
      1   1           0       0       0
+   +   +   +   +   +   +   +   +   +   +
      2                       2
+   +   +   +   +   +   +   +   +   +   +
      2   2   1       0
+   +   +   +   +   +   +   +   +   +   +
          3                           1
+   +   +   +   +   +   +   +   +   +   +
  3               1   2   1   1   2
+   +   +   +   +   +   +   +   +   +   +
      0       1               1   1   1
+   +   +   +   +   +   +   +   +   +   +
  1                   1       2
+   +   +   +   +   +   +   +   +   +   +
  1               0           2       2
+   +   +   +   +   +   +   +   +   +   +
  1       0                           1
+   +   +   +   +   +   +   +   +   +   +
  2           1   1           1   1
+   +   +   +   +   +   +   +   +   +   +
```

This puzzle was made for QUBO++, and we have checked that it has exactly one solution.

The method on this page is based on the iterative method of the following paper.

> **Reference**:
> Nakahara, Y., Nakano, K., Ito, Y., Ii, K., & Teranishi, K. (2026). **Solving Slitherlink via Iterative Elimination of Multi-Loop Solutions in HUBO and QUBO Formulations**. Proceedings of the International Symposium on Computing and Networking (CANDAR 2026), to appear.

## Formulation

Let the board have $R$ rows and $C$ columns of cells (here $R=C=10$), and denote the grid points by $(i, j)$ ($0\leq i\leq R$, $0\leq j\leq C$).
We place a binary variable on every edge joining two adjacent grid points and read the value 1 as drawing a line on that edge:

- Horizontal edge $h_{i,j}$: joins grid points $(i,j)$ and $(i,j+1)$ ($0\leq i\leq R$, $0\leq j\leq C-1$).
- Vertical edge $v_{i,j}$: joins grid points $(i,j)$ and $(i+1,j)$ ($0\leq i\leq R-1$, $0\leq j\leq C$).

There are $(R+1)C + R(C+1) = 220$ variables.

**Clues**: if cell $(i,j)$ has a digit $n_{i,j}$, the number of its four sides that carry a line is $n_{i,j}$:

$$
h_{i,j} + h_{i+1,j} + v_{i,j} + v_{i,j+1} = n_{i,j}
$$

**Degree of a grid point**: let $\deg(p)$ be the number of edges at grid point $p$ that carry a line.
Since the loop does not branch, this is 2 at a grid point on the loop and 0 at any other grid point:

$$
\deg(p) \in \lbrace 0, 2\rbrace \qquad (\text{every grid point } p)
$$

As in the [shortest path problem](SHORTEST_PATH), this condition can be written directly with `qbpp.cons()` and the [allowed-value set](CONSTRAINTS#discrete-allowed-value-sets) `equal=[0, 2]`.

Because the degree of every grid point is 0 or 2, the edges with lines split into several disjoint loops.
However, there need not be only one loop.
With only the two constraints above, a **multi-loop** solution, which satisfies the clues with several loops, also has energy 0.
"There is one loop" is a condition on the whole board and cannot be written directly as a formula per cell or per grid point.

## Eliminating multiple loops

Following the iterative method of the paper, we therefore solve the puzzle as follows:

1. Solve with only the clue and degree constraints.
2. Split the solution into loops. If one loop by itself satisfies all the clues, it is the answer.
3. Otherwise, add a constraint forbidding each loop of the solution and go back to step 1.

The constraint forbidding a loop $L$ is the inequality saying that not all edges of $L$ are selected:

$$
\sum_{e\in L} x_e \leq |L|-1
$$

Here $x_e$ is the variable of edge $e$ and $|L|$ is the number of edges of loop $L$.
It is violated only when all edges of $L$ are selected, by an amount of 1, so the energy increases by 1.

Adding this constraint keeps the energy of the answer loop at 0.
If the answer loop contained all edges of $L$, then $L$ would be a loop made of part of the answer loop.
Part of the edges of a single loop cannot form a loop, so this happens only when $L$ is the answer loop itself.
Step 2 prevents the answer loop from being eliminated.

Step 2 checks whether one loop by itself satisfies all the clues.
Since the whole solution also satisfies all the clues, if loop $L$ alone satisfies them, the other loops use no side of a cell with a digit.
Then $L$ without the other loops satisfies all the conditions of the puzzle.

## PyQBPP program

The following PyQBPP program solves Slitherlink with this iterative method:

```python
import pyqbpp as qbpp

# Board: digits are clues, "." is a cell without a clue.
BOARD = [".11..0.0.0", ".2.....2..", ".221.0....", "..3......1", "3...12112.",
         ".0.1...111", "1....1.2..", "1...0..2.2", "1.0......1", "2..11..11."]
R, C = len(BOARD), len(BOARD[0])


# Positions of the horizontal edge h[i][j] and the vertical edge v[i][j]
# in edges.
def h_index(i, j):
    return i * C + j


def v_index(i, j):
    return (R + 1) * C + i * (C + 1) + j


# Draws the selected edges on the board.
def print_board(selected):
    for i in range(R + 1):
        line = ""
        for j in range(C):
            line += "+---" if selected[h_index(i, j)] else "+   "
        print(line + "+")
        if i == R:
            break
        line = ""
        for j in range(C + 1):
            line += "|" if selected[v_index(i, j)] else " "
            if j < C:
                line += " " + (" " if BOARD[i][j] == "." else BOARD[i][j]) + " "
        print(line.rstrip())


# Splits the selected edges of a solution into loops (lists of edge numbers).
def find_loops(selected, edges):
    used = [False] * len(edges)
    loops = []
    for s in range(len(edges)):
        if not selected[s] or used[s]:
            continue
        loop = []
        k, p = s, edges[s][2]  # start at edge s and walk toward grid point p
        while not used[k]:
            used[k] = True
            loop.append(k)
            for k2, (_, a, b) in enumerate(edges):
                if selected[k2] and not used[k2] and p in (a, b):
                    p = b if a == p else a
                    k = k2
                    break
        loops.append(loop)
    return loops


# Whether a single loop satisfies all the clues by itself.
def satisfies_clues(loop):
    in_loop = set(loop)
    for i in range(R):
        for j in range(C):
            if BOARD[i][j] == ".":
                continue
            sides = [h_index(i, j), h_index(i + 1, j), v_index(i, j), v_index(i, j + 1)]
            if sum(k in in_loop for k in sides) != int(BOARD[i][j]):
                return False
    return True


h = qbpp.var("h", shape=(R + 1, C))  # horizontal edges
v = qbpp.var("v", shape=(R, C + 1))  # vertical edges
# Edges: (variable, end point, end point).
# Grid point (i, j) is numbered i * (C + 1) + j.
edges = []
for i in range(R + 1):
    for j in range(C):
        edges.append((h[i][j], i * (C + 1) + j, i * (C + 1) + j + 1))
for i in range(R):
    for j in range(C + 1):
        edges.append((v[i][j], i * (C + 1) + j, (i + 1) * (C + 1) + j))

# Clues: the number of selected edges around a cell equals its digit.
f = 0
for i in range(R):
    for j in range(C):
        if BOARD[i][j] != ".":
            n = int(BOARD[i][j])
            f += qbpp.cons(h[i][j] + h[i + 1][j] + v[i][j] + v[i][j + 1] == n)

# The number of selected edges at each grid point (its degree) is 0 or 2.
for p in range((R + 1) * (C + 1)):
    deg = 0
    for x, a, b in edges:
        if p in (a, b):
            deg += x
    f += qbpp.cons(deg, equal=[0, 2])

hint = None
iteration = 0
while True:
    iteration += 1
    f.simplify_as_binary()
    solver = qbpp.ABS3Solver(f)
    sol = solver.search(target_energy=0, hint=hint)
    hint = sol  # the next iteration starts from this solution

    selected = [sol(x) == 1 for x, _, _ in edges]
    loops = find_loops(selected, edges)
    sizes = [len(loop) for loop in loops]
    print(f"iteration {iteration}: energy = {sol.energy}, loops =", *sizes)
    if iteration == 1:
        print_board(selected)
    if sol.energy != 0:
        continue

    answer = [loop for loop in loops if satisfies_clues(loop)]
    if answer:
        print_board([k in answer[0] for k in range(len(edges))])
        break
    # No loop satisfies the clues by itself: forbid the loops found.
    for loop in loops:
        f += qbpp.cons(qbpp.sum([edges[k][0] for k in loop]) <= len(loop) - 1)
```

`qbpp.var("h", shape=(R + 1, C))` and `qbpp.var("v", shape=(R, C + 1))` create the arrays of variables of the horizontal and vertical edges,
and every edge is stored in `edges` as a (variable, grid point, grid point) triple.
Grid point $(i,j)$ is numbered $i(C+1)+j$.

A clue constraint applies `==` to the sum of the variables of the four sides of cell $(i,j)$ and is declared with `qbpp.cons()`.
For the degree constraints, the degree `deg` of each grid point `p` is the sum of the variables of the edges ending at `p`,
and `qbpp.cons(deg, equal=[0, 2])` declares the constraint.

The iteration loop creates a new ABS3 Solver from `f` every time.
Since the energy is 0 when all the constraints are satisfied,
`target_energy=0` stops the search as soon as the target energy 0 is reached.
`hint=hint` passes the previous solution as a [solution hint](ABS3#solution-hint) (`None`, i.e. no hint, in the first iteration).
Only the loops of the previous solution violate the new constraints, so starting from the previous solution finds a new solution quickly.

`find_loops()` follows the selected edges to split a solution into loops.
Since the degree of every grid point is 0 or 2, starting at an edge and repeatedly moving to an adjacent edge not yet followed returns to the starting edge and gives one loop.
`satisfies_clues()` checks whether the edges of a single loop satisfy all the clues by themselves.
If no loop satisfies the clues, a constraint saying that the sum of the variables of the loop's edges is at most `len(loop) - 1` is added with `qbpp.cons()` for each loop of the solution.

## Results

The program prints the energy and the numbers of edges of the loops of the solution at every iteration.
It draws the first solution and the final answer on the board.
An example of the output is shown below:

```
iteration 1: energy = 0, loops = 10 4 4 58 4 4
+   +   +   +   +   +   +   +   +   +   +
      1   1           0       0       0
+---+---+---+---+   +   +---+   +---+   +
|     2         |       |   | 2 |   |
+---+---+---+---+   +   +---+   +---+   +
      2   2   1       0
+---+---+---+   +---+   +   +---+---+   +
|         3 |   |   |       |       | 1
+---+   +---+   +   +---+---+   +---+   +
  3 |   |       | 1   2   1   1 | 2
+---+   +---+---+   +---+   +   +   +   +
|     0       1     |   |     1 | 1   1
+   +   +---+   +   +---+   +   +   +---+
| 1     |   |         1       2 |   |   |
+   +   +---+   +   +   +---+---+   +   +
| 1               0     |     2     | 2 |
+   +   +   +   +   +---+   +---+---+   +
| 1       0         |       |         1 |
+   +   +   +   +   +---+---+   +   +   +
| 2           1   1           1   1     |
+---+---+---+---+---+---+---+---+---+---+
iteration 2: energy = 0, loops = 62 4 6
iteration 3: energy = 0, loops = 66 4
iteration 4: energy = 0, loops = 64 6
iteration 5: energy = 0, loops = 60 8
iteration 6: energy = 0, loops = 4 58 6
iteration 7: energy = 0, loops = 58 6 10
iteration 8: energy = 0, loops = 50 8 4 4
iteration 9: energy = 0, loops = 66 8
iteration 10: energy = 0, loops = 12 60
iteration 11: energy = 0, loops = 8 66
iteration 12: energy = 0, loops = 64 4
+   +   +   +   +   +   +   +   +   +   +
      1   1           0       0       0
+   +---+---+   +   +   +   +   +---+   +
    | 2     |                 2 |   |
+   +   +---+   +   +   +   +---+   +   +
    | 2 | 2   1       0     |       |
+---+   +   +---+---+   +---+   +   +   +
|       | 3 |       |   |           | 1
+---+   +---+   +   +---+   +   +   +   +
  3 |             1   2   1   1   2 |
+---+   +   +   +---+---+---+---+---+   +
|     0       1 |             1   1   1
+   +   +   +   +---+---+---+   +   +---+
| 1                   1     | 2     |   |
+   +   +   +   +   +   +   +---+   +   +
| 1               0           2 |   | 2 |
+   +   +   +   +   +   +   +   +---+   +
| 1       0                           1 |
+   +   +   +   +   +   +   +   +   +   +
| 2           1   1           1   1     |
+---+---+---+---+---+---+---+---+---+---+
```

The first solution has energy 0 and satisfies all the clue and degree constraints, but it consists of 6 loops.
The small loops of 4 edges surround cells without a digit.
The loops found are forbidden at every iteration; in the 12th solution the loop of 64 edges by itself satisfies all the clues, so it is drawn as the answer.
The loop of 4 edges left in the 12th solution uses no side of a cell with a digit, so removing it keeps all the clues satisfied.

The solver's search uses random numbers, so the intermediate solutions and the number of iterations change from run to run.
For this puzzle the answer was found in 2 to 12 iterations, and the whole run took a few seconds with a GPU.
Since the puzzle has exactly one solution, the answer loop is always the same.

## HUBO form

The constraint $\sum_{e\in L} x_e \leq |L|-1$ forbidding loop $L$ increases the energy by 1 only when all edges of $L$ are selected.
This is the same value as the product of the variables of the edges of $L$:

$$
\prod_{e\in L} x_e
$$

The paper forbids loops by adding these product terms (HUBO).
Adding the product of the variables of the loop's edges to `f` instead of the `qbpp.cons()` forbidding the loop gives the same energy function.
The degree of a product term is the number of edges of the loop (sometimes more than 60 for this puzzle), and the QUBO++ solvers handle such high-degree terms directly.

## QUBO form

Solving with an external QUBO solver requires rewriting the formula with terms of degree at most 2.
The paper writes the degree constraint $\deg(p)\in\lbrace 0,2\rbrace$ as $(\deg(p)-2y_p)^2$ with an auxiliary binary variable $y_p$,
and also writes the inequality forbidding a loop as a penalty with auxiliary (slack) variables.
With `qbpp.cons()`, the constraints are passed to the solver as they are, without auxiliary variables.
