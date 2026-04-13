---
layout: default
nav_exclude: true
title: "Graph Bisection"
nav_order: 11
lang: en
hreflang_alt: "ja/BISECTION"
hreflang_lang: "ja"
---

# Minimum Graph Bisection Problem

Given an undirected graph $G=(V,E)$ with $n$ nodes (where $n$ is even), the **Minimum Graph Bisection** problem aims to partition the node set $V$ into two disjoint subsets $S$ and $\overline{S}$ of **equal size** ($\lvert S\rvert=\lvert\overline{S}\rvert=n/2$) so that the number of edges crossing the partition is **minimized**.

This problem differs from [Max-Cut](MAXCUT) in two ways:
1. The partition must be **balanced** (equal-sized halves).
2. We **minimize** (rather than maximize) the number of crossing edges.

Minimum Graph Bisection is NP-hard and arises in circuit partitioning, parallel computing, and graph-based data clustering.

## QUBO Formulation

Assume that the nodes are labeled $0,1,\ldots,n-1$.
We introduce $n$ binary variables $x_0, x_1, \ldots, x_{n-1}$, where $x_i=1$ if and only if node $i$ belongs to $S$.

### Objective

The number of edges crossing the partition is:

$$
\text{objective} = \sum_{(i,j)\in E}\Bigl(x_i\bar{x}_j + \bar{x}_ix_j\Bigr)
$$

We want to **minimize** this value.

### Constraint

The partition must be balanced:

$$
\text{constraint} = \Bigl(\sum_{i=0}^{n-1} x_i = \frac{n}{2}\Bigr)
$$

This constraint expression equals 0 when satisfied.

### QUBO expression

The final QUBO expression combines the objective and constraint with a penalty weight $P$:

$$
f = \text{objective} + P \times \text{constraint}
$$

where $P$ must be large enough (e.g., $P = \lvert E\rvert + 1$) to ensure that the balance constraint is always satisfied in an optimal solution.

## QUBO++ program

The following QUBO++ program solves the Minimum Graph Bisection problem for a 16-node graph:

```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>
#include <qbpp/graph.hpp>

int main() {
  const size_t N = 16;
  std::vector<std::pair<size_t, size_t>> edges = {
      {0, 1},   {0, 2},   {1, 3},   {1, 4},   {2, 5},   {2, 6},   {3, 7},
      {3, 13},  {4, 6},   {4, 7},   {4, 14},  {5, 8},   {6, 8},   {6, 12},
      {6, 14},  {7, 14},  {8, 9},   {9, 10},  {9, 12},  {10, 11}, {10, 12},
      {11, 13}, {11, 15}, {12, 14}, {12, 15}, {13, 15}, {14, 15}};
  const size_t M = edges.size();

  auto x = qbpp::var("x", N);

  // Objective: number of edges crossing the cut
  auto objective = qbpp::toExpr(0);
  for (const auto& e : edges) {
    objective += x[e.first] * ~x[e.second] +
                 ~x[e.first] * x[e.second];
  }

  // Constraint: exactly N/2 nodes in each partition
  auto constraint = (qbpp::sum(x) == static_cast<qbpp::energy_t>(N / 2));

  // Penalty weight: M + 1 ensures constraint is prioritized
  auto f = objective + static_cast<int>(M + 1) * constraint;
  f.simplify_as_binary();

  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search();

  std::cout << "Cut edges = " << sol(objective) << std::endl;
  std::cout << "constraint = " << sol(constraint) << std::endl;

  qbpp::graph::GraphDrawer graph;
  for (size_t i = 0; i < N; ++i) {
    graph.add_node(qbpp::graph::Node(i).color(sol(x[i])));
  }
  for (const auto& e : edges) {
    auto edge = qbpp::graph::Edge(e.first, e.second);
    if (sol(x[e.first]) != sol(x[e.second])) {
      edge.color(1).penwidth(2.0);
    }
    graph.add_edge(edge);
  }
  graph.write("bisection.svg");
}
```

In this program, the objective counts the number of edges crossing the cut, and the constraint enforces that exactly $N/2$ nodes are in each partition.
The penalty weight $P = M + 1$ ensures that the balance constraint is always satisfied.
Unlike the Max-Cut problem where we negate the objective for maximization, here we minimize the objective directly.

### Output
```
Cut edges = 6
constraint = 0
```

The solver finds a balanced partition with only 6 edges crossing the cut.
The resulting graph is rendered and stored in the file `bisection.svg`:

<p align="center">
  <img src="images/bisection.svg" alt="The solution of the Minimum Graph Bisection problem." width="80%">
</p>
