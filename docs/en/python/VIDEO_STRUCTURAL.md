---
last_modified: 2026-11-19
layout: default
nav_exclude: true
title: "Video: Structural Constraints"
description: "The points of each chapter of the video \"QUBO++ Structural Constraints (Python)\", with the programs shown in it and their output."
lang: en
hreflang_alt: "ja/python/VIDEO_STRUCTURAL"
hreflang_lang: "ja"
video: structural
---

# Video: Structural Constraints (Python)

A companion to the video "QUBO++ Structural Constraints (Python)".
For each chapter it gives the main points, the programs shown in the video with their output, and links to the pages that explain more.
Click "▶ Play the video from …" to play from that scene.
Programs that the video shows in part are given here in full, ready to run.

{% include video_embed.html slug="structural" %}

What the video covers:

- Writing an assignment with `cons()` and a weight P, and what it takes to choose P
- The three properties of structural constraints (no weight, no effect on the energy, the solver searches only solutions of the right shape)
- Solving an assignment problem with `qbpp.distinct`, and restricting the values with `qbpp.replace`
- Solving the traveling salesman problem with `qbpp.cycle`, and a cycle that may skip vertices with `via=`
- Delivery routes for 2 vehicles with different capacities with `qbpp.cycles`
- The rules for using structural constraints, and checking a solution with `is_feasible`

Back to the list of [Videos (Tutorials)](../VIDEOS)

## Solutions of a Fixed Shape

### The assignment problem and the bipartite graph

{% include video_seek.html t="1:04" %}

We assign 4 jobs to 4 workers, one each, minimizing the total cost. The cost of worker $i$ doing job $j$ is in the array `cost`.
An assignment can be drawn as arrows from workers to jobs in a bipartite graph, with the workers on the left and the jobs on the right.
The program uses a 4 × 4 array `x` of 0s and 1s: `x[i][j]` is 1 if there is an arrow from worker $i$ to job $j$.
One arrow leaving each worker means exactly one 1 in each row, and one arrow entering each job means exactly one 1 in each column.

### The earlier way: cons() and a weight P

{% include video_seek.html t="2:23" %}

So far we wrote "the sum of each row is 1" and "the sum of each column is 1" as equality constraints with `cons()`, multiplied by a weight P.
If P is too small, a solution that breaks the rules becomes the minimum, and P should not be needlessly large either, so choosing P takes effort. In this example P = 3.

```python
import pyqbpp as qbpp

cost = qbpp.array([[7, 3, 8, 6], [5, 9, 4, 7], [6, 8, 5, 3], [4, 6, 9, 5]])
x = qbpp.var("x", shape=(4, 4))
P = 3
f = (qbpp.sum(cost * x)
     + P * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
     + P * qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)
print("cost =", sol.energy)
print("job =", qbpp.onehot_to_int(sol(x)))
```

Output:

```
cost = 14
job = [1, 2, 3, 0]
```

With P of 2 or less, assignments that break the rules appear among the answers.

See [Nonlinear Functions and Native Constraints](CONSTRAINTS) for more.

### Three properties of structural constraints

{% include video_seek.html t="2:49" %}

A structural constraint describes the shape of a solution. QUBO++ has three: `distinct` (items take values different from each other), `cycle` (the chosen edges form one cycle) and `cycles` (routes of vehicles that leave the depot and come back).
They are added to an expression just like `cons()`.

- They have no weight. They are always satisfied: a solution returned by EasySolver or ABS3Solver always satisfies them.
- They do not affect the energy. The energy of a solution of the right shape is the value of the rest of the expression.
- The solver searches only solutions of the right shape.

See [Structural Constraints](STRUCTURAL) for more.

## distinct

### The assignment problem with distinct

{% include video_seek.html t="3:39" %}

The expression is just the total cost `qbpp.sum(cost * x)` plus `qbpp.distinct(x)`. The two `cons()` expressions and the weight P are replaced by a single `distinct(x)`.
`distinct(x)` means that exactly one arrow leaves each item (row) and at most one arrow enters each value (column).

```python
import pyqbpp as qbpp

cost = qbpp.array([[7, 3, 8, 6], [5, 9, 4, 7], [6, 8, 5, 3], [4, 6, 9, 5]])
x = qbpp.var("x", shape=(4, 4))
f = qbpp.sum(cost * x) + qbpp.distinct(x)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)
print("cost =", sol.energy)
print("job =", qbpp.onehot_to_int(sol(x)))
```

Output:

```
cost = 14
job = [1, 2, 3, 0]
```

`qbpp.onehot_to_int` reads where each worker's arrow points. Workers 0, 1, 2 and 3 do jobs 1, 2, 3 and 0, for a cost of $3 + 4 + 3 + 4 = 14$, the same answer as with `cons()` and the weight P.

### More values than items

{% include video_seek.html t="4:44" %}

The array of `distinct` may have more columns than rows. We assign 3 workers to 5 jobs, one each (the column of job 4 is added to `cost`).

```python
import pyqbpp as qbpp

cost = qbpp.array([[7, 3, 8, 6, 9], [5, 9, 4, 7, 6], [6, 8, 5, 3, 4]])
x = qbpp.var("x", shape=(3, 5))
f = qbpp.sum(cost * x) + qbpp.distinct(x)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)
print("cost =", sol.energy)
print("job =", qbpp.onehot_to_int(sol(x)))
```

Output:

```
cost = 10
job = [1, 2, 3]
```

No one takes jobs 0 and 4. When the numbers of rows and columns are equal, every value is used exactly once and `distinct` represents a permutation.
When there are more items than values, transpose the array: the rows are always the side that must choose exactly one.

## Restricting the Values

### Removing and fixing choices with replace

{% include video_seek.html t="5:36" %}

Worker 0 cannot do job 1, worker 3 cannot do job 0, and worker 1 must do job 3: these conditions are written with `qbpp.replace`.
Replacing a variable by 0 removes that choice, and replacing it by 1 fixes that choice.
Once worker 1 is fixed to job 3, worker 1 cannot take other jobs and the other workers cannot take job 3, so `replace` also replaces those variables by 0 automatically.

```python
import pyqbpp as qbpp

cost = qbpp.array([[7, 3, 8, 6], [5, 9, 4, 7], [6, 8, 5, 3], [4, 6, 9, 5]])
x = qbpp.var("x", shape=(4, 4))
f = qbpp.sum(cost * x) + qbpp.distinct(x)

ml = {x[0][1]: 0, x[3][0]: 0, x[1][3]: 1}
g = qbpp.replace(f, ml)
g.simplify_as_binary()
print(g)

solver = qbpp.EasySolver(g)
sol = solver.search(time_limit=1.0)
full = qbpp.Sol(f).set(sol, ml)
print("cost =", f(full))
print("job =", qbpp.onehot_to_int(full(x)))
```

Output:

```
7 +7*x[0][0] +8*x[0][2] +6*x[2][0] +8*x[2][1] +5*x[2][2] +6*x[3][1] +9*x[3][2]
+distinct(4 rows, 4 values, 7 choices, 1 fixed)
cost = 25
job = [0, 3, 2, 1]
```

The constant 7 on the first line is the cost of the fixed job. The second line is the `distinct` part: 4 rows, 4 values, 7 choices left and 1 fixed.
The solution of `g` does not contain the replaced variables, so `qbpp.Sol(f).set(sol, ml)` turns it back into a solution of the original `f`.

See [Replace Functions](REPLACE) for more.

### Errors of the replacement

{% include video_seek.html t="7:00" %}

Only 0 and 1 can be used. Removing all choices of a row, or fixing two values in one row, raises ValueError at `replace`.
When the replacement itself is fine but no assignment is possible (3 workers who can only do jobs 0 and 1), creating EasySolver raises RuntimeError.

```python
import pyqbpp as qbpp

cost = qbpp.array([[7, 3, 8, 6], [5, 9, 4, 7], [6, 8, 5, 3], [4, 6, 9, 5]])
x = qbpp.var("x", shape=(4, 4))
f = qbpp.sum(cost * x) + qbpp.distinct(x)

# worker 0 can do no job
try:
    g = qbpp.replace(f, {x[0][0]: 0, x[0][1]: 0, x[0][2]: 0, x[0][3]: 0})
except ValueError as e:
    print("ValueError:", e)

# worker 1 is fixed to two jobs
try:
    g = qbpp.replace(f, {x[1][0]: 1, x[1][2]: 1})
except ValueError as e:
    print("ValueError:", e)

# workers 0, 1 and 2 can only do jobs 0 and 1
ml = {x[i][j]: 0 for i in range(3) for j in [2, 3]}
g = qbpp.replace(f, ml)
g.simplify_as_binary()
try:
    solver = qbpp.EasySolver(g)
except RuntimeError as e:
    print("RuntimeError:", e)
```

Output:

```
ValueError: qbpp::replace: row 0 of a distinct constraint has no value left that it can take
ValueError: qbpp::replace: two values are fixed (replaced by 1) for row 1 of a distinct constraint
RuntimeError: EasySolver: no state that satisfies the constraint could be built to start the search (distinct: the items of a distinct constraint cannot all take different values under the restrictions (variables replaced by 0 or 1))
```

## cycle

### The traveling salesman problem

{% include video_seek.html t="7:43" %}

We find the shortest tour that visits each of 9 vertices on a plane once and returns to the start. The distances are computed from the coordinates and rounded to integers.
The variables are a 9 × 9 array `x`: `x[i][j]` is 1 if the tour goes from vertex $i$ to vertex $j$.
`qbpp.cycle(x)` means that the arrows with 1 form one tour that passes through every vertex once.
The diagonal variables `x[i][i]` are arrows from a vertex to itself and are always 0 in a solution.

```python
import math
import pyqbpp as qbpp

nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142),
         (111, 243), (220, 4), (210, 113), (211, 233)]
n = len(nodes)
d = qbpp.array([[round(math.dist(p, q)) for q in nodes] for p in nodes])
x = qbpp.var("x", shape=(n, n))
f = qbpp.sum(d * x) + qbpp.cycle(x)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)
print("length =", sol.energy)
tour, v = [0], 0
while True:
    v = next(j for j in range(n) if j != v and sol(x[v][j]) == 1)
    tour.append(v)
    if v == 0:
        break
print(" -> ".join(str(v) for v in tour))
```

The output in the video (the direction of the tour may change on each run):

```
length = 959
0 -> 3 -> 6 -> 7 -> 8 -> 5 -> 2 -> 4 -> 1 -> 0
```

959 is the shortest length, checked by trying every order. The tour is read by following the arrows with 1 from vertex 0.

See [Traveling Salesman Problem](TSP) for more.

### Compared with a permutation matrix

{% include video_seek.html t="9:04" %}

The same problem can be written with a permutation matrix, where `x[k][i]` is 1 if vertex $i$ is visited $k$-th, but then the row and column conditions are written with `cons()` and a weight.
With a permutation matrix, the same tour has 18 representations: 9 starting vertices times 2 directions.
The array of `cycle` takes the arrows themselves as variables, so there are only the 2 directions, and neither a replacement fixing the start nor a weight is needed. Both use 81 variables.

## Vertices That May Be Skipped

### Visiting many vertices within a distance limit

{% include video_seek.html t="9:54" %}

On the same map, we leave vertex 0 and come back to it, visiting as many vertices as possible within the travel limit $L = 650$ (the orienteering problem).
`qbpp.cycle(x, via=[0])` means a cycle through vertex 0; the vertices not in `via` may or may not be visited.
The number of visited vertices `count` is the number of chosen arrows `qbpp.sum(x)`, and the travel distance `total` is `qbpp.sum(d * x)`.
Exceeding the limit even by 1 costs a penalty of 10, more than the energy gained by visiting more vertices (1 each, at most 8), so the limit is kept.

```python
import math
import pyqbpp as qbpp

nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142),
         (111, 243), (220, 4), (210, 113), (211, 233)]
n = len(nodes)
d = qbpp.array([[round(math.dist(p, q)) for q in nodes] for p in nodes])
L = 650

x = qbpp.var("x", shape=(n, n))
count = qbpp.sum(x)
total = qbpp.sum(d * x)
f = -count + 10 * qbpp.cons(total <= L) + qbpp.cycle(x, via=[0])
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)
print("visited =", sol(count), " length =", sol(total))
tour, v = [0], 0
while True:
    v = next(j for j in range(n) if j != v and sol(x[v][j]) == 1)
    tour.append(v)
    if v == 0:
        break
print(" -> ".join(str(v) for v in tour))
```

The output in the video (the direction of the tour may change on each run):

```
visited = 6  length = 617
0 -> 3 -> 6 -> 7 -> 4 -> 1 -> 0
```

With the limit 650, at most 6 vertices can be visited, and there is only one such set of vertices.

See [Orienteering Problem](ORIENTEERING) for more.

### Solving again with other limits

{% include video_seek.html t="11:25" %}

```python
import math
import pyqbpp as qbpp

nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142),
         (111, 243), (220, 4), (210, 113), (211, 233)]
n = len(nodes)
d = qbpp.array([[round(math.dist(p, q)) for q in nodes] for p in nodes])

def orienteering(L):
    x = qbpp.var(shape=(n, n))
    count = qbpp.sum(x)
    total = qbpp.sum(d * x)
    f = -count + 10 * qbpp.cons(total <= L) + qbpp.cycle(x, via=[0])
    f.simplify_as_binary()
    sol = qbpp.EasySolver(f).search(time_limit=1.0)
    tour, v = [0], 0
    while True:
        v = next(j for j in range(n) if j != v and sol(x[v][j]) == 1)
        tour.append(v)
        if v == 0:
            break
    print(f"L = {L}: visited = {sol(count)}, length = {sol(total)},",
          " -> ".join(str(v) for v in tour))

for L in [480, 650, 840]:
    orienteering(L)
```

The output in the video (the direction of the tours may change on each run):

```
L = 480: visited = 4, length = 435, 0 -> 3 -> 4 -> 1 -> 0
L = 650: visited = 6, length = 617, 0 -> 3 -> 6 -> 7 -> 4 -> 1 -> 0
L = 840: visited = 8, length = 832, 0 -> 1 -> 4 -> 5 -> 8 -> 7 -> 6 -> 3 -> 0
```

Visiting all 9 vertices takes 959. Every answer agrees with the result of trying every route.
`via=[]` is a cycle with no vertex that must be visited. For a graph with edges only between some pairs of vertices, pass the edges as a list of (start, end, variable); the range of the number of edges of the cycle can be set with `length=`.

See [Structural Constraints](STRUCTURAL) for more.

## cycles

{% include video_seek.html t="12:13" %}

Vehicles load at the depot (vertex 0), visit the delivery points (vertices 1 to 5) and come back. There are 2 vehicles with capacities 11 and 8.
The variables are a 2 × 6 × 6 array, one 6 × 6 array per vehicle: `x[k][i][j]` is 1 if vehicle $k$ goes from vertex $i$ to vertex $j$.
With `qbpp.cycles(x, depot=0)`, the arrows of each vehicle form a cycle through the depot, and every vertex other than the depot is on exactly one vehicle's route. An unused vehicle chooses no arrows.
The total distance `length` and the load of each vehicle `load` are written with `qbpp.einsum`; `load <= capacity` compares element by element and gives two limit constraints.

```python
import pyqbpp as qbpp

dist = qbpp.array([[0, 9, 14, 11, 16, 8],
                   [10, 0, 7, 15, 21, 13],
                   [13, 8, 0, 10, 18, 17],
                   [12, 14, 11, 0, 9, 12],
                   [15, 22, 17, 10, 0, 10],
                   [9, 12, 18, 13, 11, 0]])
demand = qbpp.array([0, 4, 3, 5, 2, 4])
capacity = qbpp.array([11, 8])
n, K = 6, 2

x = qbpp.var("x", shape=(K, n, n))
length = qbpp.einsum("kij,ij->", x, dist)
load = qbpp.einsum("kij,j->k", x, demand)
f = length + 1000 * qbpp.cons(load <= capacity) + qbpp.cycles(x, depot=0)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)
print("total length =", sol.energy)
for k in range(K):
    route, v = [0], 0
    while True:
        v = next((j for j in range(n) if j != v and sol(x[k][v][j]) == 1), 0)
        route.append(v)
        if v == 0:
            break
    print(f"vehicle {k}:", " -> ".join(str(v) for v in route))
```

The output in the video (the direction of the routes may change on each run):

```
total length = 68
vehicle 0: 0 -> 3 -> 4 -> 5 -> 0
vehicle 1: 0 -> 1 -> 2 -> 0
```

Vehicle 0 carries 11, exactly its capacity, and vehicle 1 carries 7. This agrees with the shortest found by trying every split and order.

See [Capacitated Vehicle Routing Problem (CVRP)](CVRP) and [Einsum Function](EINSUM) for more.

## Rules of Use

### Operations allowed on structural constraints

{% include video_seek.html t="14:24" %}

A structural constraint can only be added to an expression. Multiplying it by a constant, negating it, multiplying it by a variable and `sqr` raise RuntimeError (with no weight, multiplying by a number has no meaning).
Pass the binary variables themselves to a structural constraint, not `~x` (`~x` can be used in the objective and in `cons()`). One variable cannot be used for two edges.
One expression can have several structural constraints, and they can be combined with `cons()` and nonlinear functions.

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(3, 3))
for name, make in [("3 * distinct", lambda: 3 * qbpp.distinct(x)),
                   ("-distinct", lambda: -qbpp.distinct(x)),
                   ("x[0][0] * distinct", lambda: x[0][0] * qbpp.distinct(x)),
                   ("sqr(distinct)", lambda: qbpp.sqr(qbpp.distinct(x)))]:
    try:
        make()
        print(name, ": ok")
    except Exception as e:
        print(name, ":", type(e).__name__)

f = qbpp.sum(x) + qbpp.distinct(x) + 10 * qbpp.cons(x[0][0] + x[1][1] <= 1)
f.simplify_as_binary()
print(f)
```

Output:

```
3 * distinct : RuntimeError
-distinct : RuntimeError
x[0][0] * distinct : RuntimeError
sqr(distinct) : RuntimeError
x[0][0] +x[0][1] +x[0][2] +x[1][0] +x[1][1] +x[1][2] +x[2][0] +x[2][1] +x[2][2]
+distinct(3 rows, 3 values)
+10*cons(x[0][0] +x[1][1] <= 1)
```

`qbpp.replace` works with all three structural constraints. With `distinct`, 0 removes that choice and 1 fixes it.
With `cycle` and `cycles`, 0 means the edge is not used and 1 means it is always used (per vehicle for `cycles`). After fixing a variable to 1, the other variables that conflict with it become 0 automatically.

### Checking a solution

{% include video_seek.html t="15:31" %}

Use `is_feasible` to check whether a solution satisfies the structural constraints. For an assignment that does not have the shape, the expression has no value, so evaluating it raises an exception.
The solvers that accept structural constraints are EasySolver and ABS3Solver; passing one to ExhaustiveSolver raises RuntimeError when the solver is created.

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(3, 3))
f = qbpp.sum(x) + qbpp.distinct(x)
f.simplify_as_binary()

sol = qbpp.Sol(f).set({x[0][0]: 1, x[1][1]: 1, x[2][2]: 1})
print(f.is_feasible(sol), f(sol))

sol = qbpp.Sol(f).set({x[0][0]: 1, x[1][1]: 1, x[2][1]: 1})
print(f.is_feasible(sol))
try:
    print(f(sol))
except RuntimeError:
    print("error")

try:
    qbpp.ExhaustiveSolver(f)
except RuntimeError as e:
    print("RuntimeError:", e)
```

Output:

```
True 3
False
error
RuntimeError: ExhaustiveSolver: cycle / cycles / distinct constraints are not supported by this solver
```

## Summary

{% include video_seek.html t="16:10" %}

- A structural constraint describes the shape of a solution: `distinct` is values different from each other, `cycle` one cycle, and `cycles` the routes of several vehicles.
- None of them has a weight, and a solution returned by the solver always has the shape. The energy of a solution of the right shape is the value of the rest of the expression.
- `qbpp.replace` restricts the values or edges that can be chosen. Fixing a variable to 1 sets the other variables that conflict with it to 0 automatically.
- With `cycle` and `via`, a tour does not have to visit every vertex.
- Combined with `cons()`, limits on the distance or the load can be added.
