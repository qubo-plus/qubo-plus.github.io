---
last_modified: 2026-11-01
layout: default
nav_exclude: true
title: "Slitherlink"
nav_order: 71
lang: en
hreflang_alt: "ja/SLITHERLINK"
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

As in the [shortest path problem](SHORTEST_PATH), this condition can be written directly with `qbpp::cons()` and the [allowed-value set](CONSTRAINTS#discrete-allowed-value-sets) `qbpp::equal{0, 2}`.

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

## QUBO++ program

The following program solves Slitherlink with this iterative method:

{% raw %}
```cpp
#include <qbpp/abs3_solver.hpp>
#include <qbpp/qbpp.hpp>

#include <iostream>
#include <string>
#include <vector>

// Board: digits are clues, '.' is a cell without a clue.
const std::vector<std::string> BOARD = {
    ".11..0.0.0", ".2.....2..", ".221.0....", "..3......1", "3...12112.",
    ".0.1...111", "1....1.2..", "1...0..2.2", "1.0......1", "2..11..11.",
};
const int R = static_cast<int>(BOARD.size());
const int C = static_cast<int>(BOARD[0].size());

// Edge: its variable and its two grid points.
// Grid point (i, j) is numbered i * (C + 1) + j.
struct Edge {
  qbpp::Var x;
  int a, b;
};

// Positions of the horizontal edge h[i][j] and the vertical edge v[i][j]
// in edges.
int h_index(int i, int j) { return i * C + j; }
int v_index(int i, int j) { return (R + 1) * C + i * (C + 1) + j; }

// Draws the selected edges on the board.
void print_board(const std::vector<bool>& selected) {
  for (int i = 0; i <= R; ++i) {
    std::string line;
    for (int j = 0; j < C; ++j)
      line += selected[h_index(i, j)] ? "+---" : "+   ";
    std::cout << line << "+" << std::endl;
    if (i == R) break;
    line = "";
    for (int j = 0; j <= C; ++j) {
      line += selected[v_index(i, j)] ? "|" : " ";
      if (j < C) {
        line += ' ';
        line += (BOARD[i][j] == '.') ? ' ' : BOARD[i][j];
        line += ' ';
      }
    }
    while (!line.empty() && line.back() == ' ') line.pop_back();
    std::cout << line << std::endl;
  }
}

// Splits the selected edges of a solution into loops (lists of edge numbers).
std::vector<std::vector<int>> find_loops(const std::vector<bool>& selected,
                                         const std::vector<Edge>& edges) {
  const int M = static_cast<int>(edges.size());
  std::vector<bool> used(M, false);
  std::vector<std::vector<int>> loops;
  for (int s = 0; s < M; ++s) {
    if (!selected[s] || used[s]) continue;
    std::vector<int> loop;
    int k = s, p = edges[s].b;  // start at edge s and walk toward grid point p
    while (!used[k]) {
      used[k] = true;
      loop.push_back(k);
      for (int k2 = 0; k2 < M; ++k2) {
        if (selected[k2] && !used[k2] &&
            (edges[k2].a == p || edges[k2].b == p)) {
          p = (edges[k2].a == p) ? edges[k2].b : edges[k2].a;
          k = k2;
          break;
        }
      }
    }
    loops.push_back(loop);
  }
  return loops;
}

// Whether a single loop satisfies all the clues by itself.
bool satisfies_clues(const std::vector<int>& loop, int M) {
  std::vector<bool> in_loop(M, false);
  for (int k : loop) in_loop[k] = true;
  for (int i = 0; i < R; ++i)
    for (int j = 0; j < C; ++j) {
      if (BOARD[i][j] == '.') continue;
      int count = in_loop[h_index(i, j)] + in_loop[h_index(i + 1, j)] +
                  in_loop[v_index(i, j)] + in_loop[v_index(i, j + 1)];
      if (count != BOARD[i][j] - '0') return false;
    }
  return true;
}

int main() {
  auto h = qbpp::var("h", R + 1, C);  // horizontal edges
  auto v = qbpp::var("v", R, C + 1);  // vertical edges
  std::vector<Edge> edges;
  for (int i = 0; i <= R; ++i)
    for (int j = 0; j < C; ++j)
      edges.push_back({h[i][j], i * (C + 1) + j, i * (C + 1) + j + 1});
  for (int i = 0; i < R; ++i)
    for (int j = 0; j <= C; ++j)
      edges.push_back({v[i][j], i * (C + 1) + j, (i + 1) * (C + 1) + j});
  const int M = static_cast<int>(edges.size());

  // Clues: the number of selected edges around a cell equals its digit.
  auto f = qbpp::toExpr(0);
  for (int i = 0; i < R; ++i)
    for (int j = 0; j < C; ++j)
      if (BOARD[i][j] != '.')
        f += qbpp::cons(h[i][j] + h[i + 1][j] + v[i][j] + v[i][j + 1] ==
                        BOARD[i][j] - '0');

  // The number of selected edges at each grid point (its degree) is 0 or 2.
  for (int p = 0; p < (R + 1) * (C + 1); ++p) {
    auto deg = qbpp::toExpr(0);
    for (const auto& e : edges)
      if (e.a == p || e.b == p) deg += e.x;
    f += qbpp::cons(deg == qbpp::equal{0, 2});
  }

  qbpp::Sol sol(f);
  for (int iteration = 1;; ++iteration) {
    f.simplify_as_binary();
    auto solver = qbpp::ABS3Solver(f);
    qbpp::Params params({{"target_energy", 0}});
    if (iteration > 1) params.hint(sol);  // start from the previous solution
    sol = solver.search(params);

    std::vector<bool> selected(M);
    for (int k = 0; k < M; ++k) selected[k] = sol(edges[k].x) == 1;
    auto loops = find_loops(selected, edges);
    std::cout << "iteration " << iteration << ": energy = " << sol.energy()
              << ", loops =";
    for (const auto& loop : loops) std::cout << " " << loop.size();
    std::cout << std::endl;
    if (iteration == 1) print_board(selected);
    if (sol.energy() != 0) continue;

    for (const auto& loop : loops) {
      if (satisfies_clues(loop, M)) {
        std::vector<bool> answer(M, false);
        for (int k : loop) answer[k] = true;
        print_board(answer);
        return 0;
      }
    }
    // No loop satisfies the clues by itself: forbid the loops found.
    for (const auto& loop : loops) {
      auto sum = qbpp::toExpr(0);
      for (int k : loop) sum += edges[k].x;
      f += qbpp::cons(sum <= static_cast<int>(loop.size()) - 1);
    }
  }
}
```
{% endraw %}

`qbpp::var("h", R + 1, C)` and `qbpp::var("v", R, C + 1)` create the arrays of variables of the horizontal and vertical edges,
and every edge is stored in `edges` as a (variable, grid point, grid point) triple.
Grid point $(i,j)$ is numbered $i(C+1)+j$.

A clue constraint applies `==` to the sum of the variables of the four sides of cell $(i,j)$ and is declared with `qbpp::cons()`.
For the degree constraints, the degree `deg` of each grid point `p` is the sum of the variables of the edges ending at `p`,
and `qbpp::cons(deg == qbpp::equal{0, 2})` declares the constraint.

The iteration loop creates a new ABS3 Solver from `f` every time.
Since the energy is 0 when all the constraints are satisfied,
{% raw %}`qbpp::Params params({{"target_energy", 0}})`{% endraw %} stops the search as soon as the target energy 0 is reached.
From the second iteration on, `params.hint(sol)` passes the previous solution as a [solution hint](ABS3#solution-hint).
Only the loops of the previous solution violate the new constraints, so starting from the previous solution finds a new solution quickly.

`find_loops()` follows the selected edges to split a solution into loops.
Since the degree of every grid point is 0 or 2, starting at an edge and repeatedly moving to an adjacent edge not yet followed returns to the starting edge and gives one loop.
`satisfies_clues()` checks whether the edges of a single loop satisfy all the clues by themselves.
If no loop satisfies the clues, `qbpp::cons(sum <= loop.size() - 1)` is added for each loop of the solution.

## Results

The program prints the energy and the numbers of edges of the loops of the solution at every iteration.
It draws the first solution and the final answer on the board.
An example of the output is shown below:

```
iteration 1: energy = 0, loops = 14 4 4 56 4 4
+---+---+---+---+   +   +   +   +   +   +
|     1   1     |     0       0       0
+---+   +   +   +---+   +---+   +---+   +
    | 2             |   |   | 2 |   |
+   +---+---+---+---+   +---+   +---+   +
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
+   +   +   +   +   +   +   +---+---+   +
| 1       0             |   |         1 |
+   +   +   +   +   +   +---+   +   +   +
| 2           1   1           1   1     |
+---+---+---+---+---+---+---+---+---+---+
iteration 2: energy = 0, loops = 4 48 4 8 6 4 4
iteration 3: energy = 0, loops = 6 52 10 12
iteration 4: energy = 0, loops = 12 52 10
iteration 5: energy = 0, loops = 8 62 4 8
iteration 6: energy = 0, loops = 62 8 6
iteration 7: energy = 0, loops = 12 60 4
iteration 8: energy = 0, loops = 66 6
iteration 9: energy = 0, loops = 60 6
iteration 10: energy = 0, loops = 64 4
iteration 11: energy = 0, loops = 64 6
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
The loops found are forbidden at every iteration; in the 11th solution the loop of 64 edges by itself satisfies all the clues, so it is drawn as the answer.
The loop of 6 edges left in the 11th solution uses no side of a cell with a digit, so removing it keeps all the clues satisfied.

The solver's search uses random numbers, so the intermediate solutions and the number of iterations change from run to run.
For this puzzle the answer was found in 6 to 14 iterations, and the whole run took a few seconds with a GPU and a few seconds to a few tens of seconds without one.
Since the puzzle has exactly one solution, the answer loop is always the same.

## HUBO form

The constraint $\sum_{e\in L} x_e \leq |L|-1$ forbidding loop $L$ increases the energy by 1 only when all edges of $L$ are selected.
This is the same value as the product of the variables of the edges of $L$:

$$
\prod_{e\in L} x_e
$$

The paper forbids loops by adding these product terms (HUBO).
Adding the product of the variables of the loop's edges to `f` instead of `qbpp::cons(sum <= loop.size() - 1)` gives the same energy function.
The degree of a product term is the number of edges of the loop (sometimes more than 60 for this puzzle), and the QUBO++ solvers handle such high-degree terms directly.

## QUBO form

Solving with an external QUBO solver requires rewriting the formula with terms of degree at most 2.
The paper writes the degree constraint $\deg(p)\in\lbrace 0,2\rbrace$ as $(\deg(p)-2y_p)^2$ with an auxiliary binary variable $y_p$,
and also writes the inequality forbidding a loop as a penalty with auxiliary (slack) variables.
With `qbpp::cons()`, the constraints are passed to the solver as they are, without auxiliary variables.
