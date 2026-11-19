---
last_modified: 2026-11-19
layout: default
nav_exclude: true
title: "Structural Constraints: distinct, cycle, and cycles"
nav_order: 27
lang: en
hreflang_alt: "ja/python/STRUCTURAL"
hreflang_lang: "ja"
---

# Structural Constraints: distinct, cycle, and cycles

In some problems a solution must have a fixed **shape**: an assignment (a permutation), a tour, or a set of delivery routes.
PyQBPP lets you declare such a shape as a single constraint:

| Function | Variables | Shape |
|---|---|---|
| `qbpp.distinct(x)` | an $n \times m$ array ($n \le m$) | $n$ items take pairwise different values (a permutation when $n = m$) |
| `qbpp.cycle(...)` | one per arc | the chosen arcs form exactly one cycle |
| `qbpp.cycles(x, depot=d)` | a $K \times n \times n$ array | the routes of $K$ vehicles |

They are added to an expression in the same way as [`cons()`](CONSTRAINTS), with two differences:

- **They have no weight.** `cons()` adds a value that grows with the violation to the energy, and it can be violated when its weight is small.
  A structural constraint always holds: every solution returned by the [Easy Solver](EASYSOLVER) and the [ABS3 Solver](ABS3) satisfies it.
- **They do not change the energy.** The energy of a solution that satisfies the structural constraints is the value of the rest of the expression (the objective, `cons()` terms, and so on).

The same shapes can be written as combinations of one-hot constraints, but with a structural constraint
there is no weight to tune, and the solver searches only among solutions that have the shape.

The video also explains this: [Video: Structural Constraints](VIDEO_STRUCTURAL) (the programs in the video, chapter by chapter)

## distinct: pairwise different values

In `qbpp.distinct(x)`, `x` is an $n \times m$ array of binary variables, and `x[i][v] = 1` means "item $i$ takes value $v$".
The constraint is that every row has exactly one 1 and every column has at most one 1.

The following program assigns four jobs to four workers, one job each. `cost[i][j]` is the cost of worker $i$ doing job $j$:

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

`qbpp.sum(cost * x)` is the total cost and `qbpp.distinct(x)` is the constraint that the four workers do different jobs.
The output is as follows:

```
cost = 14
job = [1, 2, 3, 0]
```

Workers 0, 1, 2, and 3 do jobs 1, 2, 3, and 0, and the total cost is $3 + 4 + 3 + 4 = 14$.

### Restricting the values

Conditions such as "worker 0 cannot do job 1" or "worker 1 must do job 3" are written by
replacing variables with constants using [`qbpp.replace()`](REPLACE):

- Replacing a variable with **0** removes that choice.
- Replacing a variable with **1** fixes that choice.

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

Job 1 of worker 0 and job 0 of worker 3 are removed, and worker 1 is fixed to job 3.
The output is as follows:

```
7 +7*x[0][0] +8*x[0][2] +6*x[2][0] +8*x[2][1] +5*x[2][2] +6*x[3][1] +9*x[3][2]
+distinct(4 rows, 4 values, 7 choices, 1 fixed)
cost = 25
job = [0, 3, 2, 1]
```

The second line of `g` shows that 7 of the 16 choices remain and that one row is fixed.
Fixing worker 1 to job 3 rules out the other jobs of worker 1 and job 3 for the other workers,
so these variables are also replaced by 0 automatically and disappear from the total cost on the first line.
The cost 7 of the fixed choice has become a constant.
To keep them as variables, use `qbpp.replace(f, ml, propagate=False)`.
The solver then keeps them at 0 during the search, so the answer is the same.
The solution `sol` of `g` does not contain the replaced variables, so `qbpp.Sol(f).set(sol, ml)` turns it back into a solution of the original expression `f` before it is read.

Only 0 and 1 can be used as replacements. Fixing two values in one row, or removing every choice of a row,
raises `ValueError`.

## cycle: exactly one cycle

`qbpp.cycle()` takes one binary variable per arc of a directed graph and states that
the arcs whose variables are 1 form exactly one cycle.

### A tour of all nodes

When `x` is an $n \times n$ array of binary variables, `qbpp.cycle(x)` is the constraint that
the arcs $i \to j$ with `x[i][j] = 1` form one tour that visits every node exactly once.
The following program solves a traveling salesman problem with five cities. `dist[i][j]` is the distance from city $i$ to city $j$:

```python
import pyqbpp as qbpp

dist = qbpp.array([[0, 25, 18, 12, 31],
                   [23, 0, 20, 16, 11],
                   [20, 18, 0, 24, 15],
                   [14, 14, 22, 0, 27],
                   [29, 13, 16, 25, 0]])
n = 5
x = qbpp.var("x", shape=(n, n))
f = qbpp.sum(dist * x) + qbpp.cycle(x)
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

The output is as follows:

```
length = 73
0 -> 3 -> 1 -> 4 -> 2 -> 0
```

The diagonal variables `x[i][i]` are arcs from a node to itself and are always 0 in a solution.
They may appear in the expression (for example, `qbpp.sum(x)` is the number of chosen arcs).
An example with 9 cities in the plane, and the same problem written with a permutation matrix and penalty terms, are on the [traveling salesman problem](TSP#formulation-with-the-structural-constraint-cycle) page.

### A list of arcs, required nodes, and the length

For a graph that has arcs only between some pairs of nodes, pass the arcs as a list of `(from, to, variable)`.
Both the list form and the array form take the following options:

| Option | Meaning |
|---|---|
| `via=[a, b, ...]` | nodes the cycle must visit (`via=[]`: no node has to be visited; when omitted, every node) |
| `length=(lo, hi)` | the range of the number of arcs of the cycle (`None` for no upper limit; at least 2 when omitted) |

For a list of arcs, "every node" means every node that has an arc. The two options combine as follows, the same in the list form and the array form:

| Required nodes | Number of arcs | The cycle |
|---|---|---|
| omitted | omitted | a tour that visits every node exactly once |
| omitted | `length=(lo, hi)` | a tour of every node (as many arcs as nodes); if the number of nodes is not in lo..hi, there is no solution and creating the solver raises an exception |
| `via=[]` | omitted | a cycle through any nodes (at least 2 arcs) |
| `via=[]` | `length=(lo, hi)` | a cycle through any nodes with lo..hi arcs |
| `via=[a, b, ...]` | omitted | a cycle through a, b, ...; the other nodes may be left out (at least 2 arcs) |
| `via=[a, b, ...]` | `length=(lo, hi)` | a cycle through a, b, ... with lo..hi arcs |

To limit only the number of arcs without requiring any node, write `via=[]` (without it, the cycle is a tour of every node).
`qbpp.cycle(x, via=[0])` means "a cycle through node 0; the other nodes may be left out".

As an example, we find the **shortest path** from a node $s$ to a node $t$.
Add one arc that returns from $t$ to $s$ and ask for a cycle through $s$ and $t$: the cycle without the returning arc is a path from $s$ to $t$:

```python
import pyqbpp as qbpp

# (from, to, length)
edges = [(0, 1, 7), (0, 2, 3), (1, 3, 2), (2, 1, 2), (2, 3, 8),
         (2, 4, 6), (3, 5, 4), (4, 3, 1), (4, 5, 9)]
s, t = 0, 5
m = len(edges)
x = qbpp.var("x", shape=m)  # x[k] = 1: edge k is on the path
r = qbpp.var("r")           # the arc that returns from t to s

arcs = [(u, v, x[k]) for k, (u, v, _) in enumerate(edges)] + [(t, s, r)]
f = qbpp.sum(w * x[k] for k, (_, _, w) in enumerate(edges))
f += qbpp.cycle(arcs, via=[s, t])
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)
print("length =", sol.energy)
path, v = [s], s
while v != t:
    v = next(b for k, (a, b, _) in enumerate(edges) if a == v and sol(x[k]) == 1)
    path.append(v)
print(" -> ".join(str(v) for v in path))
```

The variable `r` of the returning arc has no length, so the energy is the length of the path.
The output is as follows:

```
length = 11
0 -> 2 -> 1 -> 3 -> 5
```

This graph has no arc that enters $s$ and no arc that leaves $t$, so a cycle through $s$ and $t$ always uses the returning arc.
For a graph that has such arcs, leave them out of the list.
The shortest path in an undirected graph (both directions of each edge become arcs), with a limit on the number of edges and a node that must be visited, is on the [shortest path problem](SHORTEST_PATH#formulation-with-the-structural-constraint-cycle) page.

## cycles: routes of several vehicles

In `qbpp.cycles(x, depot=d)`, `x` is a $K \times n \times n$ array of binary variables, and
`x[k][i][j] = 1` means "vehicle $k$ goes from node $i$ to node $j$". The constraint states:

- The arcs `x[k]` of each vehicle form one cycle through the depot $d$, or none of them is chosen (the vehicle is not used).
- Every node other than the depot is on the route of exactly one vehicle.

Conditions such as vehicle capacities are written with `cons()` on `x[k]`.
The following program visits five customers from a depot (node 0) with two vehicles of capacities 11 and 8:

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

[`qbpp.einsum()`](EINSUM) writes the total length and the loads as array operations:

- `length` is the sum of the products of `x[k][i][j]` and `dist[i][j]` over all $k, i, j$.
  Nothing follows `->` in the subscript `"kij,ij->"`, so the sum runs over every index and gives one expression.
- `load` uses the subscript `"kij,j->k"`: each arc `x[k][i][j]` entering node $j$ is multiplied by the demand `demand[j]` of $j$ and summed over $i$ and $j$.
  $k$ remains after `->`, so the result is an array of length $K$, one value per vehicle.
  Exactly one arc enters each customer, so `load[k]` is the total demand of the customers visited by vehicle $k$ (the depot has demand 0).
- `load <= capacity` is an array of capacity constraints, one per vehicle, added at once by `qbpp.cons()` with weight 1000.

The arcs from a node to itself, `x[k][i][i]`, also appear in `length` and `load`, but the diagonal variables are always 0 in a solution, so they do not change the values.
The output is as follows:

```
total length = 68
vehicle 0: 0 -> 3 -> 4 -> 5 -> 0
vehicle 1: 0 -> 1 -> 2 -> 0
```

Vehicle 0 carries $5 + 2 + 4 = 11$ and vehicle 1 carries $4 + 3 = 7$, both within the capacities.
An example with 15 locations in the plane and 3 vehicles, and the same problem written with slots and penalty terms, are on the [capacitated vehicle routing problem](CVRP#formulation-with-the-structural-constraint-cycles) page.

## Rules for expressions

- A structural constraint can only be **added** to an expression. Multiplying it by a constant (`3 * qbpp.cycle(x)`), negating it, multiplying it by an expression or a variable, and `sqr()` are errors.
- The arrays and arc variables given to `qbpp.distinct()`, `qbpp.cycle()` and `qbpp.cycles()` must be the variables themselves, not `~x`. In the objective and in `qbpp.cons()`, negated variables such as `~x[0][1]` can be used. One variable cannot be used for two arcs.
- Several structural constraints can be added to one expression, and they can be combined with `cons()` and the [nonlinear functions](CONSTRAINTS).
- Variables can be replaced with constants by `qbpp.replace()`: 0 (remove a choice) and 1 (fix a choice) for `distinct`,
  and 0 (remove an arc) and 1 (the arc must be used) for `cycle`.
  Replacing an arc $i \to j$ of `cycle` by 1 makes $i$ and $j$ required nodes and sets the other arcs leaving $i$ and entering $j$ to 0.
  `cycles` supports 0 (the vehicle cannot use the arc) and 1 (the vehicle must use the arc) as well.
  For example, a road that vehicle $k$ cannot take is `x[k][i][j]` replaced by 0.
- `expand_cons()` cannot expand a structural constraint into a penalty expression.

## Checking a solution

Whether an assignment satisfies the structural constraints can be checked with `f.is_feasible(sol)`, as for `cons()`.
The value of the expression is not defined for an assignment that breaks a structural constraint, so `f(sol)` does not return a value and ends with an exception (caught with `except` in the example):

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
```

In the second assignment, items 1 and 2 both take value 1, which breaks the structural constraint:

```
True 3
False
error
```

## Solver support

| Solver | Support |
|---|---|
| [Easy Solver](EASYSOLVER) | Supported. Every returned solution satisfies the structural constraints |
| [ABS3 Solver](ABS3) | Supported. Every returned solution satisfies the structural constraints (depending on the constraint, the search may run on the CPU only) |
| [Exhaustive Solver](EXHAUSTIVE) | Not supported (an error) |
| MIP solvers (HiGHS, SCIP, CBC, GLPK) | Supported in the ILP mode (`qbpp.HighsSolver(f, ilp=True)` and so on), when the objective and the other constraints are linear. An expression whose only constraints are `distinct` can also be solved in the ordinary mode (`qbpp.HighsSolver(f)` and so on), where the objective may be quadratic |
| OR-Tools CP-SAT (`qbpp.OrToolsCpSatSolver(f)`) | Supported, when the objective and the other constraints are linear. For an expression whose only constraints are `distinct`, the objective may be quadratic or of higher degree |

For an expression whose structural constraints cannot be satisfied by any assignment (a `distinct` whose restrictions leave no way to give different values, a `cycle` on a graph that has no cycle, and so on),
creating the Easy Solver or the ABS3 Solver raises `RuntimeError`.
On a graph with few arcs and many required nodes, the same error can occur even though a valid cycle exists, because no cycle to start the search from could be built.

The structural constraints are passed to the MIP solvers as linear constraints.
CP-SAT receives `cycle` and `cycles` as its own circuit constraints.
The same expression can therefore be solved by the Easy Solver or the ABS3 Solver and then checked for optimality by a MIP solver or CP-SAT.
