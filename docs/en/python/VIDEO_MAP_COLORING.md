---
last_modified: 2026-10-26
layout: default
nav_exclude: true
title: "Video: Map Coloring"
description: "The points of each chapter of the video \"QUBO++ Case Study: Map Coloring (Python)\", with the programs shown in it and their output."
lang: en
hreflang_alt: "ja/python/VIDEO_MAP_COLORING"
hreflang_lang: "ja"
video: map-coloring
---

# Video: Map Coloring (Python)

A companion to the video "QUBO++ Case Study: Map Coloring (Python)".
For each chapter it gives the main points, the programs shown in the video with their output, and links to the pages that explain more.
Click "▶ Play the video from …" to play from that scene.
Programs that the video shows in part are given here in full, ready to run.

{% include video_embed.html slug="map-coloring" %}

What the video covers:

- Coloring a map so that neighboring regions get different colors, seen as graph coloring
- Binary variables `x[v][c]` for each region and color, the constraint (exactly one color) and the objective (the number of neighboring pairs with the same color)
- Solving it as a plain QUBO without `qbpp.cons()`, written with array operations (`qbpp.vector_sum`, `qbpp.sqr`, `qbpp.sum`)
- Checking with ExhaustiveSolver that three colors are not enough, and how large the penalty weight $P$ must be
- Rewriting the same constraint with `qbpp.cons()`, and coloring the 48 contiguous US states with four colors

Back to the list of [Videos (Case Studies)](../VIDEO_CASE_STUDIES)

## The problem as a graph

### The small map

{% include video_seek.html t="0:30" %}

A map of seven regions, numbered 0 to 6, is colored so that neighboring regions get different colors.
Two regions that share a border are neighbors. Touching only at a point does not count.
This map can be colored with four colors. In fact, any map can be colored with four colors (the four color theorem).

### The map as a graph

{% include video_seek.html t="1:10" %}

With the regions as vertices and the pairs that share a border as edges, the map becomes a graph of 7 vertices and 12 edges.
Coloring the map means coloring the vertices so that the two ends of every edge differ (graph coloring).

| | Edges (pairs of regions) |
|---|---|
| Region 0 and | 1, 2, 3, 4, 5 |
| Region 1 and | 2, 5, 6 |
| Region 2 and | 3, 6 |
| Region 3 and | 4 |
| Region 4 and | 5 |

## Variables, constraint and objective

### Variables x[v][c]

{% include video_seek.html t="1:43" %}

The binary variable $x_{v,c}$ is 1 if region $v$ gets color $c$, and 0 otherwise.
With 7 regions and 4 colors there are 28 variables, arranged in a 7 × 4 table: rows are regions, columns are colors.
In a coloring, every row has exactly one 1.
In QUBO++, `x = qbpp.var("x", shape=(n, K))` makes them an $n \times K$ variable array.

### The constraint and the objective

{% include video_seek.html t="2:23" %}

- Constraint: every region gets exactly one color. Each row sum of the table is 1: one constraint per region, 7 in all.
  $\sum_{c} x_{v,c} = 1$
- Objective: the number of neighboring pairs with the same color.
  $x_{u,c}\,x_{v,c}$ is 1 only when the two ends $u$ and $v$ of an edge both have color $c$, so it is added up over every edge and every color.

If the objective is 0, the map is properly colored.

## Solving it as a QUBO

### The penalty

{% include video_seek.html t="3:21" %}

First, without `qbpp.cons()`, the constraint is added to the objective as a penalty.
Each row sum minus 1, squared, is 0 with exactly one color and at least 1 otherwise.
These squares are added over the 7 regions and multiplied by a weight $P$; adding the objective gives $f$ ($E$ is the set of edges).

$$
f = P\sum_{v}\Bigl(\sum_{c} x_{v,c} - 1\Bigr)^2 + \sum_{(u,v)\in E}\sum_{c} x_{u,c}\,x_{v,c}
$$

Breaking the constraint costs at least $P$, so $P$ is chosen so that breaking it never pays off just to remove a same-colored pair. Here, $P = 2$.
$f$ is quadratic in $x$ (a QUBO), and $f = 0$ means the map is colored.

### The program

{% include video_seek.html t="4:03" %}

The penalty is written with array operations only, without a loop.
`qbpp.vector_sum(x, axis=1)` gives the row sums of the table; 1 is subtracted, `qbpp.sqr` squares them and `qbpp.sum` adds them all.
`x[u] * x[v]` is the four products of two rows, element by element.
EasySolver with `target_energy=0` stops as soon as it finds a solution with $f = 0$.
`qbpp.onehot_to_int` turns the position of the 1 in each row into a color number.

```python
import pyqbpp as qbpp

edges = [(0, 1), (0, 2), (0, 3), (0, 4), (0, 5), (1, 2),
         (1, 5), (1, 6), (2, 3), (2, 6), (3, 4), (4, 5)]
n, K, P = 7, 4, 2

x = qbpp.var("x", shape=(n, K))
onehot = qbpp.sum(qbpp.sqr(qbpp.vector_sum(x, axis=1) - 1))
conflict = 0
for u, v in edges:
    conflict += qbpp.sum(x[u] * x[v])
f = P * onehot + conflict
f.simplify_as_binary()
print("terms =", f.term_count())

sol = qbpp.EasySolver(f).search(target_energy=0)
print("f =", sol(f))
for v in range(n):
    print(v, sol(x[v]))
print("colors =", qbpp.onehot_to_int(sol(x), axis=1))
```

See [Arrays](VECTOR) and [One-Hot to Integer Conversion](ONEHOT) for more.

### The result

{% include video_seek.html t="5:15" %}

The output in the video (EasySolver may give different results on each run, for example with the colors swapped):

```
terms = 118
f = 0
0 [0, 1, 0, 0]
1 [1, 0, 0, 0]
2 [0, 0, 0, 1]
3 [1, 0, 0, 0]
4 [0, 0, 1, 0]
5 [0, 0, 0, 1]
6 [0, 0, 1, 0]
colors = [1, 0, 3, 0, 2, 3, 2]
```

The expression has 118 terms, including those from expanding the squared penalty.
$f = 0$, and every row has exactly one 1.
The color numbers are 0 red, 1 yellow, 2 green and 3 blue. Painted with them, all neighboring regions differ.

## Three colors?

### Exhaustive search with three colors

{% include video_seek.html t="5:56" %}

The program only sets $K$ to 3; the rest is the same.
With 7 × 3 = 21 variables, ExhaustiveSolver checks every assignment and finds the best solution.

```python
import pyqbpp as qbpp

edges = [(0, 1), (0, 2), (0, 3), (0, 4), (0, 5), (1, 2),
         (1, 5), (1, 6), (2, 3), (2, 6), (3, 4), (4, 5)]
n, K, P = 7, 3, 2

x = qbpp.var("x", shape=(n, K))
onehot = qbpp.sum(qbpp.sqr(qbpp.vector_sum(x, axis=1) - 1))
conflict = 0
for u, v in edges:
    conflict += qbpp.sum(x[u] * x[v])
f = P * onehot + conflict
f.simplify_as_binary()

sol = qbpp.ExhaustiveSolver(f).search()
print("min f =", sol.energy)
```

Output:

```
min f = 1
```

The minimum of $f$ is 1: however the map is colored, at least one neighboring pair shares a color.
Regions 1 to 5 surround region 0 like a ring, and an odd ring alone needs three colors.
Region 0 neighbors all five regions of the ring, so it needs a fourth color, different from all of them.

See [Exhaustive Solver](EXHAUSTIVE) for more.

### The penalty weight P

{% include video_seek.html t="6:52" %}

With three colors and $P$ set to 1 and 2, `best_energy_sols=0` collects every solution with the smallest $f$.
Among them, the program counts those with a blank region (a region whose row in the 7 × 3 table is all 0).

```python
import pyqbpp as qbpp

edges = [(0, 1), (0, 2), (0, 3), (0, 4), (0, 5), (1, 2),
         (1, 5), (1, 6), (2, 3), (2, 6), (3, 4), (4, 5)]
n, K = 7, 3

x = qbpp.var("x", shape=(n, K))
onehot = qbpp.sum(qbpp.sqr(qbpp.vector_sum(x, axis=1) - 1))
conflict = 0
for u, v in edges:
    conflict += qbpp.sum(x[u] * x[v])
for P in (1, 2):
    f = P * onehot + conflict
    f.simplify_as_binary()
    sol = qbpp.ExhaustiveSolver(f).search(best_energy_sols=0)
    blank = [s for s in sol.sols
             if 0 in [s(qbpp.sum(x[v])) for v in range(n)]]
    print(f"P = {P}: min f = {sol.energy}, optimal = {len(sol.sols)},"
          f" with a blank region = {len(blank)}")
```

Output:

```
P = 1: min f = 1, optimal = 138, with a blank region = 72
P = 2: min f = 1, optimal = 66, with a blank region = 0
```

With $P = 1$, leaving a region blank costs 1, but its same-colored pair is gone, so nothing is gained or lost.
So solutions that break the constraint mix into the best ones. With $P = 2$ it costs 2, and leaving a region blank is a loss.
In a plain QUBO, you have to think about how large $P$ should be.

## Writing it with cons()

{% include video_seek.html t="7:47" %}

Only the line of the constraint differs from the previous program.
Instead of the squared penalty, `qbpp.cons()` wraps the comparison "each row sum equals 1".
A constraint in `cons()` is not expanded and goes to the solver as a constraint, so the number of terms goes down from 118 to 48 (the objective's terms: 12 edges times four colors).
A violation costs the weight times the square of the amount violated.

```python
import pyqbpp as qbpp

edges = [(0, 1), (0, 2), (0, 3), (0, 4), (0, 5), (1, 2),
         (1, 5), (1, 6), (2, 3), (2, 6), (3, 4), (4, 5)]
n, K, P = 7, 4, 2

x = qbpp.var("x", shape=(n, K))
conflict = 0
for u, v in edges:
    conflict += qbpp.sum(x[u] * x[v])
f = conflict + P * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
f.simplify_as_binary()
print("terms =", f.term_count())

sol = qbpp.EasySolver(f).search(target_energy=0)
print("f =", sol(f), " colors =", qbpp.onehot_to_int(sol(x), axis=1))
```

The output in the video (the colors may change on each run):

```
terms = 48
f = 0  colors = [2, 0, 1, 3, 1, 3, 3]
```

See [Nonlinear Functions and Native Constraints](CONSTRAINTS) for more.

## The US map

### A graph of 48 states

{% include video_seek.html t="8:34" %}

The 48 contiguous states, without Alaska and Hawaii, are colored.
With the states as vertices and the pairs that share a border as edges, there are 105 edges.
At the Four Corners four states meet at a point; the two diagonal pairs only touch at a point, so they are not edges.

The state names and the edges are in the JSON file [usa48.json](../../images/usa48.json).
An edge is a pair of state numbers: for example, `[1, 25]` is Arizona (`names[1]`) and Nevada (`names[25]`).

```
"names": ["Alabama", "Arizona", ...],
"edges": [[0, 7], [0, 8], [0, 21],
          [0, 39], [1, 3], [1, 25], ...]
```

### Four colors

{% include video_seek.html t="9:12" %}

The program is almost the same as the one for the small map with `cons()`.
The difference is that the state names and the edges are read from the file with `json.load`. The variable `x` has 48 × 4 = 192 variables.
The color numbers are taken out with `qbpp.onehot_to_int` and written to the file usa_colors.json.
Put [usa48.json](../../images/usa48.json) in the directory where you run it.

```python
import json
import pyqbpp as qbpp

data = json.load(open("usa48.json"))
names, edges = data["names"], data["edges"]
n, K, P = len(names), 4, 2

x = qbpp.var("x", shape=(n, K))
conflict = 0
for u, v in edges:
    conflict += qbpp.sum(x[u] * x[v])
f = conflict + P * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
f.simplify_as_binary()

sol = qbpp.EasySolver(f).search(target_energy=0)
color = qbpp.onehot_to_int(sol(x), axis=1)
print("states =", n, " edges =", len(edges), " f =", sol(f))
json.dump(dict(zip(names, map(int, color))), open("usa_colors.json", "w"), indent=1)
```

Output:

```
states = 48  edges = 105  f = 0
```

$f = 0$, so all neighboring states differ. Four colors are enough for the 48 US states too.

### Three colors

{% include video_seek.html t="10:03" %}

$K$ is set to 3, and the program is otherwise the same.
With 48 × 3 = 144 variables, EasySolver is used, not exhaustive search.
`f.cons(sol)` is the number of constraints the solution violates.

```python
import json
import pyqbpp as qbpp

data = json.load(open("usa48.json"))
names, edges = data["names"], data["edges"]
n, K, P = len(names), 3, 2

x = qbpp.var("x", shape=(n, K))
conflict = 0
for u, v in edges:
    conflict += qbpp.sum(x[u] * x[v])
f = conflict + P * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
f.simplify_as_binary()

sol = qbpp.EasySolver(f).search(time_limit=10)
print("K = 3: f =", sol(f), " violated =", f.cons(sol))
nv = names.index("Nevada")
print("Nevada:", sorted(names[v if u == nv else u] for u, v in edges if nv in (u, v)))
```

The output in the video (EasySolver may give different results on each run):

```
K = 3: f = 2  violated = 0
Nevada: ['Arizona', 'California', 'Idaho', 'Oregon', 'Utah']
```

Even after searching for a while, the best found has $f = 2$.
`f.cons(sol)` is 0, so every state has exactly one color, and two neighboring pairs share a color.
One reason: Nevada's five neighbors connect like a ring. It is the same shape as region 0 and its ring on the small map, so Nevada needs a fourth color.

See [Graph Coloring](GRAPH_COLOR) for more.

## Summary

{% include video_seek.html t="10:48" %}

- Map coloring is graph coloring: regions are vertices, and neighboring pairs are edges.
- We used a binary variable for each region and color, and wrote the expression with array operations (`qbpp.vector_sum`, `qbpp.sqr`, `qbpp.sum`).
- EasySolver found a solution, and `qbpp.onehot_to_int` turned it into a color for each region.
- With three colors, exhaustive search with ExhaustiveSolver found that the minimum of $f$ is 1.
- If the penalty weight $P$ is too small, solutions with a blank region mix into the best ones.
- With `qbpp.cons()`, the constraint is written as it is, with fewer terms (118 → 48).
- Four colors work for the 48 states; the ring around Nevada rules out three.
