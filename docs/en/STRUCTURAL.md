---
last_modified: 2026-11-18
layout: default
nav_exclude: true
title: "Structural Constraints: distinct, cycle, and cycles"
nav_order: 27
lang: en
hreflang_alt: "ja/STRUCTURAL"
hreflang_lang: "ja"
---

# Structural Constraints: distinct, cycle, and cycles

In some problems a solution must have a fixed **shape**: an assignment (a permutation), a tour, or a set of delivery routes.
QUBO++ lets you declare such a shape as a single constraint:

| Function | Variables | Shape |
|---|---|---|
| `qbpp::distinct(x)` | an $n \times m$ array ($n \le m$) | $n$ items take pairwise different values (a permutation when $n = m$) |
| `qbpp::cycle(...)` | one per arc | the chosen arcs form exactly one cycle |
| `qbpp::cycles(x, depot)` | a $K \times n \times n$ array | the routes of $K$ vehicles |

They are added to an expression in the same way as [`cons()`](CONSTRAINTS), with two differences:

- **They have no weight.** `cons()` adds a value that grows with the violation to the energy, and it can be violated when its weight is small.
  A structural constraint always holds: every solution returned by the [Easy Solver](EASYSOLVER) and the [ABS3 Solver](ABS3) satisfies it.
- **They do not change the energy.** The energy of a solution that satisfies the structural constraints is the value of the rest of the expression (the objective, `cons()` terms, and so on).

The same shapes can be written as combinations of one-hot constraints, but with a structural constraint
there is no weight to tune, and the solver searches only among solutions that have the shape.

## distinct: pairwise different values

In `qbpp::distinct(x)`, `x` is an $n \times m$ array of binary variables, and `x[i][v] = 1` means "item $i$ takes value $v$".
The constraint is that every row has exactly one 1 and every column has at most one 1.

The following program assigns four jobs to four workers, one job each. `cost[i][j]` is the cost of worker $i$ doing job $j$:

{% raw %}
```cpp
#include <qbpp/easy_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto cost = qbpp::array({{7, 3, 8, 6}, {5, 9, 4, 7}, {6, 8, 5, 3}, {4, 6, 9, 5}});
  auto x = qbpp::var("x", 4, 4);
  auto f = qbpp::sum(cost * x) + qbpp::distinct(x);
  f.simplify_as_binary();

  qbpp::EasySolver solver(f);
  auto sol = solver.search({{"time_limit", 1.0}});
  std::cout << "cost = " << sol.energy() << std::endl;
  std::cout << "job = " << qbpp::onehot_to_int(sol(x)) << std::endl;
}
```
{% endraw %}

`qbpp::sum(cost * x)` is the total cost and `qbpp::distinct(x)` is the constraint that the four workers do different jobs.
The output is as follows:

```
cost = 14
job = {1,2,3,0}
```

Workers 0, 1, 2, and 3 do jobs 1, 2, 3, and 0, and the total cost is $3 + 4 + 3 + 4 = 14$.

### Restricting the values

Conditions such as "worker 0 cannot do job 1" or "worker 1 must do job 3" are written by
replacing variables with constants using [`qbpp::replace()`](REPLACE):

- Replacing a variable with **0** removes that choice.
- Replacing a variable with **1** fixes that choice.

{% raw %}
```cpp
#include <qbpp/easy_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto cost = qbpp::array({{7, 3, 8, 6}, {5, 9, 4, 7}, {6, 8, 5, 3}, {4, 6, 9, 5}});
  auto x = qbpp::var("x", 4, 4);
  auto f = qbpp::sum(cost * x) + qbpp::distinct(x);

  qbpp::MapList ml = {{x[0][1], 0}, {x[3][0], 0}, {x[1][3], 1}};
  auto g = qbpp::replace(f, ml);
  g.simplify_as_binary();
  std::cout << g << std::endl;

  qbpp::EasySolver solver(g);
  auto sol = solver.search({{"time_limit", 1.0}});
  auto full = qbpp::Sol(f).set(sol, ml);
  std::cout << "cost = " << f(full) << std::endl;
  std::cout << "job = " << qbpp::onehot_to_int(full(x)) << std::endl;
}
```
{% endraw %}

Job 1 of worker 0 and job 0 of worker 3 are removed, and worker 1 is fixed to job 3.
The output is as follows:

```
7 +7*x[0][0] +8*x[0][2] +6*x[2][0] +8*x[2][1] +5*x[2][2] +6*x[3][1] +9*x[3][2]
+distinct(4 rows, 4 values, 7 choices, 1 fixed)
cost = 25
job = {0,3,2,1}
```

The second line of `g` shows that 7 of the 16 choices remain and that one row is fixed.
Fixing worker 1 to job 3 rules out the other jobs of worker 1 and job 3 for the other workers,
so these variables are also replaced by 0 automatically and disappear from the total cost on the first line.
The cost 7 of the fixed choice has become a constant.
To keep them as variables, use `qbpp::replace(f, ml, qbpp::no_propagate)`.
The solver then keeps them at 0 during the search, so the answer is the same.
The solution `sol` of `g` does not contain the replaced variables, so `qbpp::Sol(f).set(sol, ml)` turns it back into a solution of the original expression `f` before it is read.

Only 0 and 1 can be used as replacements. Fixing two values in one row, or removing every choice of a row,
throws `std::invalid_argument`.

## cycle: exactly one cycle

`qbpp::cycle()` takes one binary variable per arc of a directed graph and states that
the arcs whose variables are 1 form exactly one cycle.

### A tour of all nodes

When `x` is an $n \times n$ array of binary variables, `qbpp::cycle(x)` is the constraint that
the arcs $i \to j$ with `x[i][j] = 1` form one tour that visits every node exactly once.
The following program solves a traveling salesman problem with five cities. `dist[i][j]` is the distance from city $i$ to city $j$:

{% raw %}
```cpp
#include <qbpp/easy_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto dist = qbpp::array({{0, 25, 18, 12, 31},
                           {23, 0, 20, 16, 11},
                           {20, 18, 0, 24, 15},
                           {14, 14, 22, 0, 27},
                           {29, 13, 16, 25, 0}});
  const int n = 5;
  auto x = qbpp::var("x", n, n);
  auto f = qbpp::sum(dist * x) + qbpp::cycle(x);
  f.simplify_as_binary();

  qbpp::EasySolver solver(f);
  auto sol = solver.search({{"time_limit", 1.0}});
  std::cout << "length = " << sol.energy() << std::endl;
  int v = 0;
  do {
    std::cout << v << " -> ";
    for (int j = 0; j < n; ++j)
      if (j != v && sol(x[v][j]) == 1) {
        v = j;
        break;
      }
  } while (v != 0);
  std::cout << 0 << std::endl;
}
```
{% endraw %}

The output is as follows:

```
length = 73
0 -> 3 -> 1 -> 4 -> 2 -> 0
```

The diagonal variables `x[i][i]` are arcs from a node to itself and are always 0 in a solution.
They may appear in the expression (for example, `qbpp::sum(x)` is the number of chosen arcs).
An example with 9 cities in the plane, and the same problem written with a permutation matrix and penalty terms, are on the [traveling salesman problem](TSP#formulation-with-the-structural-constraint-cycle) page.

### A list of arcs, required nodes, and the length

For a graph that has arcs only between some pairs of nodes, pass the arcs as a list of `qbpp::Arc{from, to, variable}`.
Both the list form and the array form take the following options:

| Option | Meaning |
|---|---|
| `qbpp::via{a, b, ...}` | nodes the cycle must visit (`qbpp::via{}`: no node has to be visited; when omitted, every node) |
| `qbpp::length{lo, hi}` | the range of the number of arcs of the cycle (`qbpp::inf` for no upper limit; at least 2 when omitted) |

For a list of arcs, "every node" means every node that has an arc. The two options combine as follows, the same in the list form and the array form:

| Required nodes | Number of arcs | The cycle |
|---|---|---|
| omitted | omitted | a tour that visits every node exactly once |
| omitted | `qbpp::length{lo, hi}` | a tour of every node (as many arcs as nodes); if the number of nodes is not in lo..hi, there is no solution and creating the solver raises an exception |
| `qbpp::via{}` | omitted | a cycle through any nodes (at least 2 arcs) |
| `qbpp::via{}` | `qbpp::length{lo, hi}` | a cycle through any nodes with lo..hi arcs |
| `qbpp::via{a, b, ...}` | omitted | a cycle through a, b, ...; the other nodes may be left out (at least 2 arcs) |
| `qbpp::via{a, b, ...}` | `qbpp::length{lo, hi}` | a cycle through a, b, ... with lo..hi arcs |

To limit only the number of arcs without requiring any node, write `qbpp::via{}` (without it, the cycle is a tour of every node).
`qbpp::cycle(x, qbpp::via{0})` means "a cycle through node 0; the other nodes may be left out".

As an example, we find the **shortest path** from a node $s$ to a node $t$.
Add one arc that returns from $t$ to $s$ and ask for a cycle through $s$ and $t$: the cycle without the returning arc is a path from $s$ to $t$:

{% raw %}
```cpp
#include <qbpp/easy_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  struct Edge {
    uint32_t from, to;
    int length;
  };
  const std::vector<Edge> edges = {{0, 1, 7}, {0, 2, 3}, {1, 3, 2}, {2, 1, 2}, {2, 3, 8},
                                   {2, 4, 6}, {3, 5, 4}, {4, 3, 1}, {4, 5, 9}};
  const uint32_t s = 0, t = 5;
  const int m = static_cast<int>(edges.size());
  auto x = qbpp::var("x", m);  // x[k] = 1: edge k is on the path
  auto r = qbpp::var("r");     // the arc that returns from t to s

  std::vector<qbpp::Arc> arcs;
  auto f = qbpp::toExpr(0);
  for (int k = 0; k < m; ++k) {
    arcs.push_back({edges[k].from, edges[k].to, x[k]});
    f += edges[k].length * x[k];
  }
  arcs.push_back({t, s, r});
  f += qbpp::cycle(arcs, qbpp::via{s, t});
  f.simplify_as_binary();

  qbpp::EasySolver solver(f);
  auto sol = solver.search({{"time_limit", 1.0}});
  std::cout << "length = " << sol.energy() << std::endl;
  uint32_t v = s;
  std::cout << v;
  while (v != t)
    for (int k = 0; k < m; ++k)
      if (edges[k].from == v && sol(x[k]) == 1) {
        v = edges[k].to;
        std::cout << " -> " << v;
        break;
      }
  std::cout << std::endl;
}
```
{% endraw %}

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

In `qbpp::cycles(x, qbpp::depot{d})`, `x` is a $K \times n \times n$ array of binary variables, and
`x[k][i][j] = 1` means "vehicle $k$ goes from node $i$ to node $j$". The constraint states:

- The arcs `x[k]` of each vehicle form one cycle through the depot $d$, or none of them is chosen (the vehicle is not used).
- Every node other than the depot is on the route of exactly one vehicle.

Conditions such as vehicle capacities are written with `cons()` on `x[k]`.
The following program visits five customers from a depot (node 0) with two vehicles of capacities 11 and 8:

{% raw %}
```cpp
#include <qbpp/easy_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto dist = qbpp::array({{0, 9, 14, 11, 16, 8},
                           {10, 0, 7, 15, 21, 13},
                           {13, 8, 0, 10, 18, 17},
                           {12, 14, 11, 0, 9, 12},
                           {15, 22, 17, 10, 0, 10},
                           {9, 12, 18, 13, 11, 0}});
  auto demand = qbpp::array({0, 4, 3, 5, 2, 4});
  auto capacity = qbpp::array({11, 8});
  const int n = 6, K = 2;

  auto x = qbpp::var("x", K, n, n);
  qbpp::Expr length = qbpp::einsum<0>("kij,ij->", x, dist);
  auto load = qbpp::einsum<1>("kij,j->k", x, demand);
  auto f = length + 1000 * qbpp::cons(load <= capacity) + qbpp::cycles(x, qbpp::depot{0});
  f.simplify_as_binary();

  qbpp::EasySolver solver(f);
  auto sol = solver.search({{"time_limit", 1.0}});
  std::cout << "total length = " << sol.energy() << std::endl;
  for (int k = 0; k < K; ++k) {
    std::cout << "vehicle " << k << ": 0";
    int v = 0;
    do {
      int next = 0;
      for (int j = 0; j < n; ++j)
        if (j != v && sol(x[k][v][j]) == 1) next = j;
      v = next;
      std::cout << " -> " << v;
    } while (v != 0);
    std::cout << std::endl;
  }
}
```
{% endraw %}

[`qbpp::einsum()`](EINSUM) writes the total length and the loads as array operations:

- `length` is the sum of the products of `x[k][i][j]` and `dist[i][j]` over all $k, i, j$.
  Nothing follows `->` in the subscript `"kij,ij->"`, so the sum runs over every index and gives one expression (output dimension 0).
- `load` uses the subscript `"kij,j->k"`: each arc `x[k][i][j]` entering node $j$ is multiplied by the demand `demand[j]` of $j$ and summed over $i$ and $j$.
  $k$ remains after `->`, so the result is an array of length $K$, one value per vehicle (output dimension 1).
  Exactly one arc enters each customer, so `load[k]` is the total demand of the customers visited by vehicle $k$ (the depot has demand 0).
- `load <= capacity` is an array of capacity constraints, one per vehicle, added at once by `qbpp::cons()` with weight 1000.

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

- A structural constraint can only be **added** to an expression. Multiplying it by a constant (`3 * qbpp::cycle(x)`), negating it, multiplying it by an expression or a variable, and `sqr()` are errors.
- The arrays and arc variables given to `qbpp::distinct()`, `qbpp::cycle()` and `qbpp::cycles()` must be the variables themselves, not `~x`. In the objective and in `qbpp::cons()`, negated variables such as `~x[0][1]` can be used. One variable cannot be used for two arcs.
- Several structural constraints can be added to one expression, and they can be combined with `cons()` and the [nonlinear functions](CONSTRAINTS).
- Variables can be replaced with constants by `qbpp::replace()`: 0 (remove a choice) and 1 (fix a choice) for `distinct`,
  and 0 (remove an arc) and 1 (the arc must be used) for `cycle`.
  Replacing an arc $i \to j$ of `cycle` by 1 makes $i$ and $j$ required nodes and sets the other arcs leaving $i$ and entering $j$ to 0.
  `cycles` supports 0 (the vehicle cannot use the arc) and 1 (the vehicle must use the arc) as well.
  For example, a road that vehicle $k$ cannot take is `x[k][i][j]` replaced by 0.
- `expand_cons()` cannot expand a structural constraint into a penalty expression.

## Checking a solution

Whether an assignment satisfies the structural constraints can be checked with `f.is_feasible(sol)`, as for `cons()`.
The value of the expression is not defined for an assignment that breaks a structural constraint, so `f(sol)` does not return a value and ends with an exception (caught with `catch` in the example):

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 3, 3);
  auto f = qbpp::sum(x) + qbpp::distinct(x);
  f.simplify_as_binary();

  qbpp::Sol sol(f);
  sol.set({{x[0][0], 1}, {x[1][1], 1}, {x[2][2], 1}});
  std::cout << f.is_feasible(sol) << " " << f(sol) << std::endl;

  sol.set({{x[2][2], 0}, {x[2][1], 1}});
  std::cout << f.is_feasible(sol) << std::endl;
  try {
    std::cout << f(sol) << std::endl;
  } catch (const std::runtime_error& e) {
    std::cout << "error" << std::endl;
  }
}
```
{% endraw %}

In the second assignment, items 1 and 2 both take value 1, which breaks the structural constraint:

```
1 3
0
error
```

## Solver support

| Solver | Support |
|---|---|
| [Easy Solver](EASYSOLVER) | Supported. Every returned solution satisfies the structural constraints |
| [ABS3 Solver](ABS3) | Supported. Every returned solution satisfies the structural constraints (depending on the constraint, the search may run on the CPU only) |
| [Exhaustive Solver](EXHAUSTIVE) | Not supported (an error) |
| MIP solvers (HiGHS, SCIP, CBC, GLPK) | `cycle` and `cycles` are supported in the ILP mode (`qbpp::HighsSolver(f, qbpp::ilp)` and so on), when the objective and the other constraints are linear. `distinct` is also supported in the ordinary mode (`qbpp::HighsSolver(f)` and so on), where the objective may be quadratic |

For an expression whose structural constraints cannot be satisfied by any assignment (a `distinct` whose restrictions leave no way to give different values, a `cycle` on a graph that has no cycle, and so on),
creating the Easy Solver or the ABS3 Solver throws `std::runtime_error`.
On a graph with few arcs and many required nodes, the same error can occur even though a valid cycle exists, because no cycle to start the search from could be built.

The structural constraints are passed to the MIP solvers as linear constraints.
The same expression can therefore be solved by the Easy Solver or the ABS3 Solver and then checked for optimality by a MIP solver.
