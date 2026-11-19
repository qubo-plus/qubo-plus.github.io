---
last_modified: 2026-10-28
layout: default
nav_exclude: true
title: "Video: Graph Partitioning"
description: "The points of each chapter of the video \"QUBO++ Case Study: Graph Partitioning (Python)\", with the programs shown in it and their output."
lang: en
hreflang_alt: "ja/python/VIDEO_CUTWIDTH"
hreflang_lang: "ja"
video: cutwidth
---

# Video: Graph Partitioning (Python)

A companion to the video "QUBO++ Case Study: Graph Partitioning (Python)".
For each chapter it gives the main points, the programs shown in the video with their output, and links to the pages that explain more.
Click "▶ Play the video from …" to play from that scene.

{% include video_embed.html slug="cutwidth" %}

What the video covers:

- The 4-dimensional hypercube (16 vertices, 32 edges) and three problems about how many edges are cut when a graph is cut
- The cut expression `x[i] * ~x[j] + ~x[i] * x[j]` shared by all three problems
- Max cut (minimizing minus the cut) and bisection width (adding the equal halves constraint with `qbpp.cons()`)
- Cutwidth: the number of each vertex as a domain wall, each column of the variable table as a split at a gap, and a ceiling integer variable `w` that minimizes the largest gap
- The rook graph of a 4 × 4 board (K4 × K4), with the same programs and only the edges built differently
- For graphs joining the vertices whose numbers differ in one digit, the number order is optimal; K4 × K4 × K4 × K4 (256 vertices) solved with `ABS3Solver`

The written explanation is on the pages [Cutwidth Problem](CUTWIDTH), [Max-Cut Problem](MAXCUT), and [Minimum Graph Bisection](BISECTION). Back to the list of [Videos (Case Studies)](../VIDEO_CASE_STUDIES)

## The 4-dimensional hypercube

{% include video_seek.html t="0:33" %}

- It has 16 vertices, numbered 0 to 15 and written as 4-digit binary. Two vertices are joined when they differ in exactly one bit (for example, 0000 is joined to 0001, 0010, 0100, and 1000).
- Every vertex is joined to 4 others, so there are 16 × 4 ÷ 2 = 32 edges.
- The 8 vertices whose top bit is 0 and the 8 whose top bit is 1 each form a 3-dimensional cube, and matching vertices of the two cubes are joined by 8 edges.

## Max cut

{% include video_seek.html t="1:31" %}

- We split the vertices into two groups. An edge whose ends are in different groups is a **cut edge**, and the number of cut edges is the **cut**. The **max cut problem** asks for the split with the largest cut.
- Variable `x[i]` is 1 if vertex $i$ is in one group and 0 otherwise. For an edge $(i, j)$, `x[i] * ~x[j] + ~x[i] * x[j]` is 1 only when the two ends differ. The sum over all the edges is the cut expression `cut`.
- The solver minimizes, so we minimize `-cut`.
- In the 4-dimensional hypercube all 32 edges can be cut. The two ends of an edge differ by one in their number of 1s, so splitting by even and odd numbers of 1s cuts every edge.

## The program (max cut and bisection width)

{% include video_seek.html t="2:32" %}

- The list of edges, `edges`, uses `j = i ^ (1 << b)`, the number with only bit `b` of `i` flipped. An edge is added only when `i < j`, so each appears once.
- `qbpp.var` makes the array `x` of 16 binary variables, and the loop builds the cut expression `cut`. A negation is a `~` before the variable.
- For max cut, `f = -cut` is tidied with `simplify_as_binary()` and solved by `ExhaustiveSolver`. With 16 variables, every assignment can be checked.
- The bisection width part (the second half) is explained in the next chapter.

```python
import pyqbpp as qbpp

N = 16
edges = []
for i in range(N):
    for b in range(4):
        j = i ^ (1 << b)  # the number that differs from i in one bit
        if i < j:
            edges.append((i, j))
M = len(edges)

x = qbpp.var("x", shape=N)
cut = 0
for i, j in edges:
    cut += x[i] * ~x[j] + ~x[i] * x[j]

# max cut
f = -cut
f.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(f).search()
print("max cut =", sol(cut))
print("S:", *[i for i in range(N) if sol(x[i]) == 1])

# minimum bisection
g = cut + (M + 1) * qbpp.cons(qbpp.sum(x) == N // 2)
g.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(g).search()
print("bisection width =", sol(cut))
print("S:", *[i for i in range(N) if sol(x[i]) == 1])
```

Output:

```
max cut = 32
S: 1 2 4 7 8 11 13 14
bisection width = 8
S: 0 1 2 3 4 5 6 7
```

The group printed for max cut is the vertices with an odd number of 1s in binary.

See [Max-Cut Problem](MAXCUT) for more.

## Bisection width

{% include video_seek.html t="3:31" %}

- The smallest cut of a split into two groups of equal size is the **bisection width**.
- The same `cut` expression is used. The condition "the sum of `x` is 8" becomes a constraint with `qbpp.cons()` and is added to `cut` with a weight (the second half of the program above).
- The weight is the number of edges plus 1, that is, 33. The cut is at most 32, so breaking the constraint always costs more.
- The answer is 8, with the vertices 0 through 7 chosen. The split is by the top bit, into the two cubes, and only the 8 edges between the cubes are cut.

See [Minimum Graph Bisection](BISECTION) for more.

## Cutwidth

{% include video_seek.html t="4:27" %}

- We line up the vertices in a row and route the edges above them. Edges on the same layer must not overlap (sharing only an end vertex is allowed).
- A space between two neighboring vertices is a **gap**. The edges through one gap are all on different layers, so the number of layers needed is the largest number of edges through a gap. This is the **cutwidth of the line-up**, and the smallest one over all line-ups is the **cutwidth of the graph**.
- In number order, the numbers of edges through the 15 gaps are as follows, with the largest 10.

```
4 6 8 8 10 10 10 8 10 10 10 8 8 6 4
```

- The middle gap splits the vertices into two groups of 8. The bisection width is the smallest middle gap over all line-ups and the cutwidth is the smallest largest gap, so cutwidth ≥ bisection width.

## Numbers as domain walls

{% include video_seek.html t="5:36" %}

- Lining up the vertices means giving each vertex its number from the left, 0 to 15, all different.
- The number of vertex $i$ is a domain wall of 15 binary variables (a run of 1s followed by a run of 0s), and the number of 1s before the wall is the number. `x[i][k]` is 1 exactly when the number of vertex $i$ is larger than $k$.
- The variable `x` is a 16 by 15 array, and each row is one vertex.
- The first constraint: each row is a domain wall (a 1 never comes right after a 0).
- The second constraint: the numbers are all different. For this, the number of 1s in column $k$ is set to $15-k$. Conversely, these counts in every column make each number appear exactly once.

See "Representing the numbers with domain walls" in [Cutwidth Problem](CUTWIDTH) for more.

## Gap cuts and the ceiling

{% include video_seek.html t="6:41" %}

- In column $k$, the vertices with 0 have numbers up to $k$ and those with 1 have numbers above $k$. So column $k$ splits the vertices into left and right at the $k$-th gap.
- The edges through a gap are therefore counted with the same expression as max cut. We write the cut of column $k$ as `cut[k]`.
- We prepare an integer variable `w`, require `cut[k]` ≤ `w` for every $k$, and minimize `w`. `w` is a ceiling that holds the cuts of all the gaps from above; as it goes down, it stops at the highest gap.
- Every constraint has the weight 33, the number of edges plus 1. Breaking constraints only gains the drop of `w`, which is at most 32.
- The variables are just 240 binary variables and one integer variable, with no auxiliary variables.

See "The cut of each column" and "Minimizing the largest cut" in [Cutwidth Problem](CUTWIDTH) for more.

## The program (cutwidth)

{% include video_seek.html t="7:44" %}

- `qbpp.var` with `shape` makes the 16 by 15 variable array `x`, and with `integer` the integer variable `w` from 0 to 32.
- For the first constraint, slices take columns 1 to 14 and columns 0 to 13 and subtract them, and the difference must be at most 0. This writes 224 constraints, 16 rows by 14 columns, in one line.
- For the second constraint, `qbpp.vector_sum()` with `axis=0` gives the sums of the 15 columns, compared element by element with a list from 15 down to 1.
- The cut expression is the same loop as in max cut, but `x[i]` is a row vector of length 15, so `cut` is an array of the cuts of the 15 gaps. The constraint `cut - w <= 0` gives all 15 at once.
- With 240 variables, `EasySolver` searches with a time limit. Counting the 1s in each row of the solution gives the number of each vertex, and the program prints the vertices in order of number and the cut at each gap.

```python
import pyqbpp as qbpp

N = 16
edges = []
for i in range(N):
    for b in range(4):
        j = i ^ (1 << b)  # the number that differs from i in one bit
        if i < j:
            edges.append((i, j))
M = len(edges)

x = qbpp.var("x", shape=(N, N - 1))
w = qbpp.var("w", integer=(0, M))

# each row is a domain wall
constraint = qbpp.cons(x[:, 1:] - x[:, :-1] <= 0)
# all numbers differ: column k has N-1-k ones
constraint += qbpp.cons(qbpp.vector_sum(x, axis=0) == list(range(N - 1, 0, -1)))
# the cut at each gap: x[i] is a row vector of length N-1
cut = 0
for i, j in edges:
    cut += x[i] * ~x[j] + ~x[i] * x[j]
constraint += qbpp.cons(cut - w <= 0)

f = w + (M + 1) * constraint
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=5)

print("cutwidth =", sol(w))
print("violated constraints =", f.cons(sol))
order = [0] * N
for i in range(N):
    t = 0
    for k in range(N - 1):
        t += sol(x[i][k])
    order[t] = i
print("order:", *order)
print("cuts:", *sol(cut))
```

## Running it

{% include video_seek.html t="9:13" %}

Example output:

```
cutwidth = 10
violated constraints = 0
order: 14 15 12 6 7 13 5 4 8 0 2 1 9 10 11 3
cuts: 4 6 8 10 10 10 10 8 10 10 10 10 8 6 4
```

- The cutwidth is 10, with 0 violated constraints. Lining up the vertices in the printed order, the edges can be routed on 10 layers.
- The order changes from run to run, but the cutwidth is 10.
- Only 8 edges pass through the middle gap, fewer than the largest, 10.

See "Checking with hypercubes" in [Cutwidth Problem](CUTWIDTH) for more.

## Another graph

{% include video_seek.html t="9:47" %}

- The cells of a 4 × 4 board are the vertices, and cells in the same row or the same column are joined (the cells a chess rook can reach in one move). There are 16 vertices and 48 edges.
- In the two programs above, only the part that builds the edges changes, as follows. A cell's number divided by 4 gives the row, and the remainder the column.

```python
N = 16
edges = []
for i in range(N):
    for j in range(i + 1, N):
        if i // 4 == j // 4 or i % 4 == j % 4:  # same row or same column
            edges.append((i, j))
M = len(edges)
```

Output of max cut and bisection width:

```
max cut = 32
S: 2 3 6 7 8 9 12 13
bisection width = 16
S: 0 1 2 3 4 5 6 7
```

Example output of cutwidth:

```
cutwidth = 18
violated constraints = 0
order: 8 12 15 13 14 9 10 11 5 4 7 3 2 0 6 1
cuts: 6 10 14 16 16 18 18 16 18 18 16 16 16 12 6
```

- The max cut is 32. The four cells of one row are joined to each other by 6 edges, and splitting them two and two cuts 4, the most for one row. With 8 rows and columns in all, 8 × 4 = 32 is the upper bound, and the printed split reaches it.
- The bisection width is 16: the top two rows against the bottom two.
- The cutwidth is 18. Here too, the middle gap has 16 edges, fewer than the largest, 18.

### Why the middle gap is a valley

{% include video_seek.html t="10:45" %}

- In number order, the top digit splits the vertices into blocks, and the middle gap lies exactly on a border between blocks.
- Only the edges between blocks pass through the border, but a gap slightly off the border also cuts inside a block, so more edges pass through it.
- The bisection width looks only at the middle gap and the cutwidth at every gap, so the two are not always equal.

## A larger graph

{% include video_seek.html t="11:16" %}

- The vertex numbers of the 4-dimensional hypercube have 4 binary digits, and the cell numbers of the 4 × 4 board have 2 digits in base 4 (the upper is the row, the lower the column). Both graphs join the vertices whose numbers differ in exactly one digit.
- For graphs of this form, the number order is proven to be optimal (K. Nakano, Linear Layouts of Generalized Hypercubes, WG 1993). The 10 and 18 found by the solver equal the cutwidths of the number order, so both are optimal.
- A larger one, with 4-digit numbers in base 4 (K4 × K4 × K4 × K4), is tried too. It has 256 vertices and 1536 edges; the variable table is 256 by 255, with 65,280 binary variables.
- In the program, only the part that builds the edges (the base-4 digits are compared, and an edge is added when exactly one differs) and the solver change. The solver is `ABS3Solver`, which also uses GPUs.

```python
import pyqbpp as qbpp


def digits(v):  # 4 digits in base 4
    return [v // 4**t % 4 for t in range(4)]


N = 256
edges = []
for i in range(N):
    for j in range(i + 1, N):
        diff = sum(a != b for a, b in zip(digits(i), digits(j)))
        if diff == 1:  # exactly one digit differs
            edges.append((i, j))
M = len(edges)

x = qbpp.var("x", shape=(N, N - 1))
w = qbpp.var("w", integer=(0, M))

# each row is a domain wall
constraint = qbpp.cons(x[:, 1:] - x[:, :-1] <= 0)
# all numbers differ: column k has N-1-k ones
constraint += qbpp.cons(qbpp.vector_sum(x, axis=0) == list(range(N - 1, 0, -1)))
# the cut at each gap: x[i] is a row vector of length N-1
cut = 0
for i, j in edges:
    cut += x[i] * ~x[j] + ~x[i] * x[j]
constraint += qbpp.cons(cut - w <= 0)

f = w + (M + 1) * constraint
f.simplify_as_binary()

solver = qbpp.ABS3Solver(f)
sol = solver.search(time_limit=10)

print("vertices =", N, " edges =", M)
print("cutwidth =", sol(w))
print("violated constraints =", f.cons(sol))
```

Output:

```
vertices = 256  edges = 1536
cutwidth = 306
violated constraints = 0
```

- Number order also has at most 306 edges through a gap, so 306 is the cutwidth of this graph.
- The middle gap of number order has 256 edges, a valley here too.

## Summary

{% include video_seek.html t="12:30" %}

- Max cut, bisection width, and cutwidth were all built from the same cut expression.
- For max cut, we minimized minus the cut; for bisection width, `qbpp.cons()` added the equal halves constraint.
- For cutwidth, the vertex numbers were domain walls. Each column of the variable table is a split at a gap, and the ceiling integer variable `w` minimized the largest gap.
- For graphs joining the vertices whose numbers differ in one digit, the number order is optimal; for K4 × K4 × K4 × K4 with 256 vertices, `ABS3Solver` found the optimal cutwidth 306.
