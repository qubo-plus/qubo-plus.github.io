---
last_modified: 2026-10-26
layout: default
nav_exclude: true
title: "Video: Fixing Variables"
description: "The points of each chapter of the video \"QUBO++ Fixing Variables (Python)\", with the programs shown in it and their output."
lang: en
hreflang_alt: "ja/python/VIDEO_REPLACE"
hreflang_lang: "ja"
video: replace
---

# Video: Fixing Variables (Python)

A companion to the video "QUBO++ Fixing Variables (Python)".
For each chapter it gives the main points, the programs shown in the video with their output, and links to the pages that explain more.
Click "▶ Play the video from …" to play from that scene.
Programs that the video shows in part are given here in full, ready to run.

{% include video_embed.html slug="replace" %}

What the video covers:

- Writing the traveling salesman problem with a permutation matrix and solving it
- Fixing the values of variables with `qbpp.replace` to make node 0 the start
- Restoring a solution of the original expression from the solution of the fixed one with `qbpp.Sol(f).set(sol, ml)`
- Changing the values of a solution with `set` and `flip`, and recomputing the energy with `comp_energy()`
- Why not to fix values with `qbpp.cons`, and multiplication, division and factoring with integer variables
- Max-cut with constraints, as an `ml` whose values are expressions

Back to the list of [Videos (Tutorials)](../VIDEOS)

## The traveling salesman problem

### The problem

{% include video_seek.html t="2:23" %}

Find the shortest tour that visits every node exactly once and returns to the start.
The example uses 9 nodes (0 to 8) in the plane; the distance between two nodes is computed from their coordinates and rounded to an integer.
The shortest tour is 0→1→4→2→5→8→7→6→3→0, of length 959.

### A tour as a permutation matrix

{% include video_seek.html t="3:21" %}

A tour is a 9 × 9 matrix $x$ of 0s and 1s. Rows are steps $k$, columns are nodes $i$, and $x[k][i]=1$ means "node $i$ is visited at step $k$".
Each step visits one node and each node is visited once, so every row and every column has exactly one 1 (a permutation matrix).
These are exactly the constraints of the assignment problem from the arrays video.

### The tour length

{% include video_seek.html t="4:33" %}

$x[k][i]\,x[k+1][j]$ is 1 only when step $k$ is node $i$ and the next step is node $j$, so multiplying by the distance $d[i][j]$ and adding gives the tour length.
After the last row comes row 0 again.

$$
\text{length} = \sum_{k=0}^{n-1}\sum_{i=0}^{n-1}\sum_{j=0}^{n-1} d[i][j]\, x[k][i]\, x[(k+1) \bmod n][j]
$$

### The program

{% include video_seek.html t="5:42" %}

The length expression gets the constraints "every row sums to 1" (`axis=1`) and "every column sums to 1" (`axis=0`), with weight 1000.
`qbpp.onehot_to_int` lists, for each row, the column of its 1.

```python
import math
import pyqbpp as qbpp

nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142),
         (111, 243), (220, 4), (210, 113), (211, 233)]
n = len(nodes)
d = [[round(math.dist(nodes[i], nodes[j])) for j in range(n)] for i in range(n)]
x = qbpp.var("x", shape=(n, n))
length = 0
for k in range(n):
    for i in range(n):
        for j in range(n):
            length += d[i][j] * x[k][i] * x[(k + 1) % n][j]
f = (length
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
f.simplify_as_binary()
sol = qbpp.EasySolver(f).search(time_limit=2)
print("length =", sol(length), " tour =", qbpp.onehot_to_int(sol(x), axis=1))
```

The output in the video (EasySolver gives different results on each run):

```
length = 959  tour = [3, 6, 7, 8, 5, 2, 4, 1, 0]
```

It is the shortest tour, of length 959, but it starts at node 3. The start and the direction may change from run to run.

See [Traveling Salesman Problem](TSP) for more.

## One tour, many matrices

{% include video_seek.html t="8:08" %}

The same expression for the first 5 nodes only, solved with ExhaustiveSolver for all optimal solutions (`best_energy_sols=0`).
There are 10 optimal solutions, all of them the same tour: 5 starting nodes × 2 directions.
With $n$ nodes, one tour has $2n$ matrices.

```python
import math
import pyqbpp as qbpp

# f is the expression of the first 5 nodes (as before)
nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142)]
n = len(nodes)
d = [[round(math.dist(nodes[i], nodes[j])) for j in range(n)] for i in range(n)]
x = qbpp.var("x", shape=(n, n))
length = 0
for k in range(n):
    for i in range(n):
        for j in range(n):
            length += d[i][j] * x[k][i] * x[(k + 1) % n][j]
f = (length
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
f.simplify_as_binary()

sol = qbpp.ExhaustiveSolver(f).search(best_energy_sols=0)
print(len(sol.sols), "optimal solutions")
for s in sol.sols:
    print(s.energy, qbpp.onehot_to_int(s(x), axis=1))
```

Output:

```
10 optimal solutions
589 [3, 4, 2, 1, 0]
589 [1, 2, 4, 3, 0]
589 [2, 4, 3, 0, 1]
589 [0, 3, 4, 2, 1]
589 [4, 3, 0, 1, 2]
589 [1, 0, 3, 4, 2]
589 [4, 2, 1, 0, 3]
589 [0, 1, 2, 4, 3]
589 [3, 0, 1, 2, 4]
589 [2, 1, 0, 3, 4]
```

See [Permutation matrix generation](PERMUTATION) for more.

## Fixing with replace

{% include video_seek.html t="9:39" %}

To make node 0 the start, set $x[0][0]$ to 1 and the rest of column 0 and row 0 to 0.
Put the variables and their values in a dictionary `ml` (9 items) and pass it to `qbpp.replace(f, ml)`: it returns a new expression with the variables replaced by the values. The original `f` does not change.
`g` keeps the 16 variables of rows 1 to 4 and columns 1 to 4, down from 25.

```python
import math
import pyqbpp as qbpp

# f is the 5-node expression (as before)
nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142)]
n = len(nodes)
d = [[round(math.dist(nodes[i], nodes[j])) for j in range(n)] for i in range(n)]
x = qbpp.var("x", shape=(n, n))
length = 0
for k in range(n):
    for i in range(n):
        for j in range(n):
            length += d[i][j] * x[k][i] * x[(k + 1) % n][j]
f = (length
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
f.simplify_as_binary()

ml = {x[0][0]: 1}
ml.update({x[k][0]: 0 for k in range(1, n)})
ml.update({x[0][i]: 0 for i in range(1, n)})
g = qbpp.replace(f, ml)
g.simplify_as_binary()
```

See [Replace Functions](REPLACE) for more.

## Restoring the solution

### Reading the solution of the fixed expression fails

{% include video_seek.html t="11:18" %}

Solving the fixed `g` with ExhaustiveSolver gives 2 optimal solutions (the tour and its reverse).
But a solution `s` of `g` has only the values of the 16 variables left in `g`, so reading `x[0][0]` with `s(x)` raises a RuntimeError (an intended error example).
The message says to restore the full solution with `Sol(f).set(sol, ml)`.

```python
import math
import pyqbpp as qbpp

# f is the 5-node expression (as before)
nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142)]
n = len(nodes)
d = [[round(math.dist(nodes[i], nodes[j])) for j in range(n)] for i in range(n)]
x = qbpp.var("x", shape=(n, n))
length = 0
for k in range(n):
    for i in range(n):
        for j in range(n):
            length += d[i][j] * x[k][i] * x[(k + 1) % n][j]
f = (length
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
f.simplify_as_binary()

ml = {x[0][0]: 1}
ml.update({x[k][0]: 0 for k in range(1, n)})
ml.update({x[0][i]: 0 for i in range(1, n)})
g = qbpp.replace(f, ml)
g.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(g).search(best_energy_sols=0)
print(len(sol.sols), "optimal solutions")
for s in sol.sols:
    print(s.energy, qbpp.onehot_to_int(s(x), axis=1))
```

Output (traceback cut):

```
2 optimal solutions
Traceback (most recent call last):
  …
RuntimeError: Sol: variable x[0][0] is not in the model of this solution (it was fixed with replace, is not used in the expression, or cancelled out in simplify); to read variables fixed with replace, restore the full solution with Sol(f).set(sol, ml)
```

### Back to a solution of the original expression

{% include video_seek.html t="13:11" %}

`qbpp.Sol(f)` is a solution with all 25 variables of the original `f` (all 0 at first).
Passing a solution of `g` and `ml` to its `set` puts in the 16 values of the solution and the 9 values of `ml`: a solution of the original expression.

```python
import math
import pyqbpp as qbpp

# f is the 5-node expression (as before)
nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142)]
n = len(nodes)
d = [[round(math.dist(nodes[i], nodes[j])) for j in range(n)] for i in range(n)]
x = qbpp.var("x", shape=(n, n))
length = 0
for k in range(n):
    for i in range(n):
        for j in range(n):
            length += d[i][j] * x[k][i] * x[(k + 1) % n][j]
f = (length
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
f.simplify_as_binary()

ml = {x[0][0]: 1}
ml.update({x[k][0]: 0 for k in range(1, n)})
ml.update({x[0][i]: 0 for i in range(1, n)})
g = qbpp.replace(f, ml)
g.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(g).search(best_energy_sols=0)
for s in sol.sols:
    full_sol = qbpp.Sol(f).set(s, ml)
    print(f(full_sol), qbpp.onehot_to_int(full_sol(x), axis=1))
```

Output:

```
589 [0, 3, 4, 2, 1]
589 [0, 1, 2, 4, 3]
```

See [Quick Reference: Solutions](QR_SOLUTION) for more.

### Fixing and solving 9 nodes

{% include video_seek.html t="14:50" %}

Fixed the same way, the 9-node problem goes from 81 to 64 variables, and the matrices of one tour from 18 to 2.
The restored tour always starts at node 0.

```python
import math
import pyqbpp as qbpp

nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142),
         (111, 243), (220, 4), (210, 113), (211, 233)]
n = len(nodes)
d = [[round(math.dist(nodes[i], nodes[j])) for j in range(n)] for i in range(n)]
x = qbpp.var("x", shape=(n, n))
length = 0
for k in range(n):
    for i in range(n):
        for j in range(n):
            length += d[i][j] * x[k][i] * x[(k + 1) % n][j]
f = (length
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
f.simplify_as_binary()
ml = {x[0][0]: 1}
ml.update({x[k][0]: 0 for k in range(1, n)})
ml.update({x[0][i]: 0 for i in range(1, n)})
g = qbpp.replace(f, ml)
g.simplify_as_binary()
sol = qbpp.EasySolver(g).search(time_limit=2)
full_sol = qbpp.Sol(f).set(sol, ml)
print("length =", full_sol(length), " tour =", qbpp.onehot_to_int(full_sol(x), axis=1))
```

The output in the video (EasySolver gives different results on each run):

```
length = 959  tour = [0, 1, 4, 2, 5, 8, 7, 6, 3]
```

Checking all 8! orders that start at node 0 shows that the shortest length is 959.

## Changing a solution

### Changing values with set

{% include video_seek.html t="16:25" %}

Passing a dictionary to `full_sol.set` changes the values of several variables at once: the keys are the variables, the values their new values.
Here rows 2 and 3 of the permutation matrix are swapped, which swaps the nodes visited at steps 2 and 3.
The tour becomes 0, 3, 2, 4, 1 and its length goes from 589 to 672.

```python
import math
import pyqbpp as qbpp

# f is the 5-node expression (as before)
nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142)]
n = len(nodes)
d = [[round(math.dist(nodes[i], nodes[j])) for j in range(n)] for i in range(n)]
x = qbpp.var("x", shape=(n, n))
length = 0
for k in range(n):
    for i in range(n):
        for j in range(n):
            length += d[i][j] * x[k][i] * x[(k + 1) % n][j]
f = (length
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
f.simplify_as_binary()

# full_sol: the restored 5-node solution (as in the last chapter)
ml = {x[0][0]: 1}
ml.update({x[k][0]: 0 for k in range(1, n)})
ml.update({x[0][i]: 0 for i in range(1, n)})
g = qbpp.replace(f, ml)
g.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(g).search()
full_sol = qbpp.Sol(f).set(sol, ml)

a = qbpp.onehot_to_int(full_sol(x), axis=1)
print(a, f(full_sol))
full_sol.set({x[2][a[2]]: 0, x[2][a[3]]: 1, x[3][a[3]]: 0, x[3][a[2]]: 1})
print(qbpp.onehot_to_int(full_sol(x), axis=1), f(full_sol))
```

Output:

```
[0, 3, 4, 2, 1] 589
[0, 3, 2, 4, 1] 672
```

### After a change, recompute with comp_energy()

{% include video_seek.html t="18:31" %}

A solution stores the energy it had when it was found; `energy` reads it.
After a change the stored energy no longer matches the values, so reading `full_sol.energy` raises a RuntimeError (an intended error example).
A solution made with `qbpp.Sol(f).set` is the same right after it is made.

```python
import math
import pyqbpp as qbpp

# f is the 5-node expression (as before)
nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142)]
n = len(nodes)
d = [[round(math.dist(nodes[i], nodes[j])) for j in range(n)] for i in range(n)]
x = qbpp.var("x", shape=(n, n))
length = 0
for k in range(n):
    for i in range(n):
        for j in range(n):
            length += d[i][j] * x[k][i] * x[(k + 1) % n][j]
f = (length
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
f.simplify_as_binary()

# full_sol: the restored 5-node solution (as in the last chapter)
ml = {x[0][0]: 1}
ml.update({x[k][0]: 0 for k in range(1, n)})
ml.update({x[0][i]: 0 for i in range(1, n)})
g = qbpp.replace(f, ml)
g.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(g).search()
full_sol = qbpp.Sol(f).set(sol, ml)

# after the swap with set
a = qbpp.onehot_to_int(full_sol(x), axis=1)
full_sol.set({x[2][a[2]]: 0, x[2][a[3]]: 1, x[3][a[3]]: 0, x[3][a[2]]: 1})
print(full_sol.energy)
```

Output (traceback cut):

```
Traceback (most recent call last):
  …
RuntimeError: Sol.energy: energy is invalid (variable changed after last computation). Call comp_energy() first.
```

`comp_energy()` recomputes the energy from the current values, returns it and stores it in the solution, so `energy` can be read again.
`f(full_sol)`, the original expression evaluated on the solution, is computed on the spot and works at any time.

```python
import math
import pyqbpp as qbpp

# f is the 5-node expression (as before)
nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142)]
n = len(nodes)
d = [[round(math.dist(nodes[i], nodes[j])) for j in range(n)] for i in range(n)]
x = qbpp.var("x", shape=(n, n))
length = 0
for k in range(n):
    for i in range(n):
        for j in range(n):
            length += d[i][j] * x[k][i] * x[(k + 1) % n][j]
f = (length
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
f.simplify_as_binary()

# full_sol: the restored 5-node solution (as in the last chapter)
ml = {x[0][0]: 1}
ml.update({x[k][0]: 0 for k in range(1, n)})
ml.update({x[0][i]: 0 for i in range(1, n)})
g = qbpp.replace(f, ml)
g.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(g).search()
full_sol = qbpp.Sol(f).set(sol, ml)

# after the swap with set
a = qbpp.onehot_to_int(full_sol(x), axis=1)
full_sol.set({x[2][a[2]]: 0, x[2][a[3]]: 1, x[3][a[3]]: 0, x[3][a[2]]: 1})
print(full_sol.comp_energy())
print(full_sol.energy)
```

Output:

```
672
672
```

### Swapping 0 and 1 with flip

{% include video_seek.html t="20:23" %}

`flip` turns the value of a variable from 0 to 1 or from 1 to 0.
With `x[0][0]` at 0, neither row 0 nor column 0 has a 1, and `qbpp.onehot_to_int` shows that row as -1.
The energy 2446 is the path 3→2→4→1 that skips node 0 (446) plus the penalty 2000 of the two broken constraints.
`f.cons(full_sol)` is the number of broken constraints. Flipping again gives the solution back.

```python
import math
import pyqbpp as qbpp

# f is the 5-node expression (as before)
nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142)]
n = len(nodes)
d = [[round(math.dist(nodes[i], nodes[j])) for j in range(n)] for i in range(n)]
x = qbpp.var("x", shape=(n, n))
length = 0
for k in range(n):
    for i in range(n):
        for j in range(n):
            length += d[i][j] * x[k][i] * x[(k + 1) % n][j]
f = (length
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
f.simplify_as_binary()

# full_sol: the restored 5-node solution (as in the last chapter)
ml = {x[0][0]: 1}
ml.update({x[k][0]: 0 for k in range(1, n)})
ml.update({x[0][i]: 0 for i in range(1, n)})
g = qbpp.replace(f, ml)
g.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(g).search()
full_sol = qbpp.Sol(f).set(sol, ml)

# after the swap with set
a = qbpp.onehot_to_int(full_sol(x), axis=1)
full_sol.set({x[2][a[2]]: 0, x[2][a[3]]: 1, x[3][a[3]]: 0, x[3][a[2]]: 1})
full_sol.flip(x[0][0])
print(qbpp.onehot_to_int(full_sol(x), axis=1), full_sol.comp_energy(), f.cons(full_sol))
full_sol.flip(x[0][0])
print(qbpp.onehot_to_int(full_sol(x), axis=1), full_sol.comp_energy(), f.cons(full_sol))
```

Output:

```
[-1, 3, 2, 4, 1] 2446 2
[0, 3, 2, 4, 1] 672 0
```

See [Quick Reference: Solutions](QR_SOLUTION) for more.

## Do not fix with cons

{% include video_seek.html t="22:17" %}

Adding the constraint "`x[0][0]` is 1" with `qbpp.cons` also leaves 2 optimal solutions, so it looks fixed.
But there are still 25 variables.

```python
import math
import pyqbpp as qbpp

# f is the 5-node expression
nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142)]
n = len(nodes)
d = [[round(math.dist(nodes[i], nodes[j])) for j in range(n)] for i in range(n)]
x = qbpp.var("x", shape=(n, n))
length = 0
for k in range(n):
    for i in range(n):
        for j in range(n):
            length += d[i][j] * x[k][i] * x[(k + 1) % n][j]
f = (length
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
f.simplify_as_binary()

h = f + 1000 * qbpp.cons(x[0][0] == 1)
h.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(h).search(best_energy_sols=0)
print(len(sol.sols), "optimal solutions,", sol.info["var_count"], "variables")
```

Output:

```
2 optimal solutions, 25 variables
```

| | Fixing with `cons` | Fixing with `replace` |
|---|---|---|
| Variables | still 25 | down to 16 |
| Assignments to check | $2^{25}$ | $2^{16}$ (1/512 of it) |
| How it fixes | A weighted penalty: it flips between 0 and 1 | Replaced by a constant: exact |

To fix a value, do not add a constraint: replace the variable with `qbpp.replace`.

## Integer variables

### x × y = z

{% include video_seek.html t="24:16" %}

$x$ and $y$ are integer variables from 2 to 99 and $z$ from 4 to 9801; the energy is 0 when the constraint `x * y - z == 0` is met.
The expression has integer variables only, so it is simplified with `simplify`, not `simplify_as_binary`.
Fixing $x$ and $y$ gives multiplication, fixing $x$ and $z$ gives division, and fixing $z$ alone gives factoring.

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(2, 99))
y = qbpp.var("y", integer=(2, 99))
z = qbpp.var("z", integer=(4, 9801))
f = qbpp.cons(x * y - z == 0)
f.simplify()
```

### Fixing it three ways

{% include video_seek.html t="25:57" %}

The same `f` is fixed with three `ml` and solved. The original `f` does not change, so each `ml` starts from the same `f`.
With `target_energy=0`, the search stops when it finds a solution that meets the constraint.
Printing `g` shows the problem left after fixing.

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(2, 99))
y = qbpp.var("y", integer=(2, 99))
z = qbpp.var("z", integer=(4, 9801))
f = qbpp.cons(x * y - z == 0)
f.simplify()
for ml in ({x: 37, y: 53}, {x: 37, z: 1961}, {z: 1961}):
    g = qbpp.replace(f, ml)
    g.simplify()
    sol = qbpp.EasySolver(g).search(target_energy=0)
    full_sol = qbpp.Sol(f).set(sol, ml)
    print("g =", g, "  ->", f"x = {full_sol(x)}, y = {full_sol(y)}, z = {full_sol(z)}")
```

The output in the video (EasySolver gives different results on each run):

```
g = cons(1961 -z == 0)   -> x = 37, y = 53, z = 1961
g = cons(-1961 +37*y == 0)   -> x = 37, y = 53, z = 1961
g = cons(-1961 +x*y == 0)   -> x = 53, y = 37, z = 1961
```

In factoring, $x$ and $y$ may be found the other way round in another run.

See [Factorization with Integer Variables](FACTORIZATION) for more.

## Replacing with expressions

### Max-cut with constraints

{% include video_seek.html t="27:41" %}

Split the nodes of a graph into two groups and maximize the number of edges between the groups (the cut).
On the Petersen graph (10 nodes, 15 edges), nodes 0 and 1 and nodes 5 and 8 must be in the same group, nodes 2 and 7 and nodes 3 and 6 in different groups.
$x[i]$ is the group of node $i$, and the cut of edge $(i, j)$ is `x[i] * ~x[j] + ~x[i] * x[j]`.
The largest cut is 12 without the constraints and 11 with them; there are two optimal groupings (the colors swapped).

### An ml with expressions

{% include video_seek.html t="29:42" %}

For a pair in the same group, `x[j]` is replaced by `x[i]`; for a pair in different groups, by `~x[i]`.
There are two rules for writing `ml`:

- `~x[j]` is a key too: `qbpp.replace` treats `x[j]` and `~x[j]` as separate keys.
- No replaced variable in a value: all keys are replaced at once, and the results are not replaced again.

`g` has 6 variables. `qbpp.Sol(f).set(sol, ml)` evaluates the expressions in `ml` with the values of `sol` to get the values of the replaced variables.

```python
import pyqbpp as qbpp

edges = [(0, 1), (1, 2), (2, 3), (3, 4), (4, 0), (0, 5), (1, 6), (2, 7),
         (3, 8), (4, 9), (5, 7), (7, 9), (9, 6), (6, 8), (8, 5)]
same = [(0, 1), (5, 8)]   # same group
diff = [(2, 7), (3, 6)]   # different groups
x = qbpp.var("x", shape=10)
f = 0
for i, j in edges:
    f -= x[i] * ~x[j] + ~x[i] * x[j]   # -1 for each edge cut
ml = {}
for i, j in same:
    ml[x[j]], ml[~x[j]] = x[i], ~x[i]
for i, j in diff:
    ml[x[j]], ml[~x[j]] = ~x[i], x[i]
g = qbpp.replace(f, ml)
g.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(g).search(best_energy_sols=0)
print("variables =", sol.info["var_count"], "energy =", sol.energy,
      "optimal =", len(sol.sols))
full_sol = qbpp.Sol(f).set(sol, ml)
print("cut =", -full_sol(f),
      "same:", [full_sol(x[i]) == full_sol(x[j]) for i, j in same],
      "diff:", [full_sol(x[i]) != full_sol(x[j]) for i, j in diff])
```

Output:

```
variables = 6 energy = -11 optimal = 2
cut = 11 same: [True, True] diff: [True, True]
```

See [Replace Functions](REPLACE) and [Max-Cut Problem](MAXCUT) for more.

### Compared with cons()

{% include video_seek.html t="33:26" %}

The same constraints written with `qbpp.cons` give the same answer, but all 10 variables stay (an exhaustive search checks 1024 assignments instead of 64).
The weight of the constraints also has to be chosen. On the other hand, the solution `sol` has all 10 variables and can be used as it is.

```python
import pyqbpp as qbpp

edges = [(0, 1), (1, 2), (2, 3), (3, 4), (4, 0), (0, 5), (1, 6), (2, 7),
         (3, 8), (4, 9), (5, 7), (7, 9), (9, 6), (6, 8), (8, 5)]
same = [(0, 1), (5, 8)]   # same group
diff = [(2, 7), (3, 6)]   # different groups
x = qbpp.var("x", shape=10)
f = 0
for i, j in edges:
    f -= x[i] * ~x[j] + ~x[i] * x[j]   # -1 for each edge cut
for i, j in same:
    f += 100 * qbpp.cons(x[i] - x[j] == 0)
for i, j in diff:
    f += 100 * qbpp.cons(x[i] + x[j] == 1)
f.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(f).search(best_energy_sols=0)
print("variables =", sol.info["var_count"], "energy =", sol.energy,
      "optimal =", len(sol.sols))
print("cut =", -sol(f),
      "same:", [sol(x[i]) == sol(x[j]) for i, j in same],
      "diff:", [sol(x[i]) != sol(x[j]) for i, j in diff])
```

Output:

```
variables = 10 energy = -11 optimal = 2
cut = 11 same: [True, True] diff: [True, True]
```

Writing a constraint on the values of variables with `qbpp.cons` is a bad idea: replace through `ml` and reduce the variables with `qbpp.replace`.

## Summary

{% include video_seek.html t="36:00" %}

- To fix the values of variables, write the variables and their values in a dictionary `ml` and use `qbpp.replace(f, ml)`. It returns a new expression with them replaced; the original `f` does not change.
- After replacing, simplify the expression: `simplify_as_binary` for an expression with binary variables, `simplify` for one with integer variables only.
- The fixed variables leave the expression, so the search space shrinks. For the traveling salesman problem the optimal solutions went from 10 to 2. One integer expression solved multiplication, division and factoring, just by changing which variables are fixed.
- A solution of the fixed `g` is turned back into one of the original `f` with `qbpp.Sol(f).set(sol, ml)`. The values of `ml` can also be other variables or negated literals; then write `~x[j]` as a key too.
- The values of a solution are changed by passing a dictionary to `set`, and `flip` swaps the 0 and 1 of a variable. A change makes the stored `energy` invalid, so recompute it with `comp_energy()`.
- Avoid fixing values with `qbpp.cons`: the variables stay, so the search space does not shrink.
