/* Generated from demos/ide/app.js by demos/sync_docs_demos.py. Do not edit. */
// QUBO++ Playground - Frontend Logic

"use strict";

const API_KEY = "ide-demo-2026-qbpp";
// Solver endpoint. Empty = same origin (Lambda-served page, local server.py);
// the docs page (qubo-plus.github.io) sets window.QBPP_DEMO_API to the Lambda URL.
const API_BASE = (window.QBPP_DEMO_API || "").replace(/\/$/, "");

// ── Template programs ──────────────────────────────────────────────

const TEMPLATES = {
  simple: {
    name: "Simple",
    desc: "Find binary a, b, c satisfying a+2b+3c=3 (EasySolver + ExhaustiveSolver)",
    source: `// Simple equation: Find binary variables a, b, c satisfying a + 2b + 3c = 3.
//
// QUBO formulation:
//   Variables: a, b, c in {0, 1}
//   Constraint: a + 2b + 3c == 3 (declared with qbpp::cons())
//
// Demonstrates two solvers:
//   EasySolver       — heuristic bit-flip + tabu search (finds one solution)
//   ExhaustiveSolver — brute-force enumeration (finds all optimal solutions)
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  // Create binary variables
  auto a = qbpp::var("a");
  auto b = qbpp::var("b");
  auto c = qbpp::var("c");

  // Wrapping the equality in qbpp::cons() declares it as a constraint.
  // The bundled solvers search for solutions satisfying declared constraints.
  auto f = qbpp::cons(a + 2 * b + 3 * c == 3);
  f.simplify_as_binary();
  std::cout << "constraints:\\n" << f.cons() << std::endl;

  // EasySolver: heuristic search (finds one solution quickly)
  auto easy_solver = qbpp::easy_solver::EasySolver(f);
  auto sol = easy_solver.search({{"time_limit", 10}, {"target_energy", 0}});
  std::cout << "EasySolver\\n" << sol << std::endl;

  // ExhaustiveSolver: enumerate all optimal solutions (feasible for small problems)
  auto exhaustive_solver = qbpp::exhaustive_solver::ExhaustiveSolver(f);
  auto result = exhaustive_solver.search({{"best_energy_sols", 0}});
  std::cout << "ExhaustiveSolver\\n" << result << std::endl;
}
`,
  },

  partitioning: {
    name: "Partition Problem",
    desc: "Split a set of integers into two subsets minimizing the difference of sums",
    source: `// Partition Problem: Split a set of integers into two subsets P and Q
// so that the difference of their sums is minimized.
//
// QUBO formulation:
//   Variables: x[i] in {0, 1} — assigns w[i] to subset P (1) or Q (0)
//   Objective: minimize (sum_P - sum_Q)^2
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  // Input: a set of integers to partition
  auto w = qbpp::array({64, 27, 47, 74, 12, 83, 63, 40});

  // Binary variables: x[i] = 1 assigns w[i] to subset P, 0 to subset Q
  auto x = qbpp::var("x", w.size());

  // Sum of each subset as symbolic expressions
  auto p = qbpp::sum(w * x);   // sum of P (items where x[i] == 1)
  auto q = qbpp::sum(w * ~x);  // sum of Q (items where x[i] == 0)

  // Objective: minimize (p - q)^2
  // f >= 0, and f == 0 iff the two subsets have equal sums.
  auto f = qbpp::sqr(p - q);

  std::cout << "f = " << f.simplify_as_binary() << std::endl;

  // ExhaustiveSolver: find the optimal partition (feasible for 8 variables)
  auto solver = qbpp::exhaustive_solver::ExhaustiveSolver(f);
  auto sol = solver.search();

  // Display results
  std::cout << "Solution: " << sol << std::endl;
  std::cout << "f(sol) = " << f(sol) << std::endl;
  std::cout << "p(sol) = " << p(sol) << std::endl;
  std::cout << "q(sol) = " << q(sol) << std::endl;

  // Show the partition
  std::cout << "P:";
  for (size_t i = 0; i < w.size(); ++i) {
    if (x[i](sol) == 1) std::cout << " " << w[i];
  }
  std::cout << std::endl;

  std::cout << "Q:";
  for (size_t i = 0; i < w.size(); ++i) {
    if (x[i](sol) == 0) std::cout << " " << w[i];
  }
  std::cout << std::endl;
}
`,
  },

  knapsack: {
    name: "Knapsack",
    desc: "Select items to maximize value without exceeding capacity",
    source: `// 0/1 Knapsack Problem: Select items to maximize total value
// without exceeding the knapsack capacity.
//
// QUBO formulation:
//   Variables: x[i] in {0, 1} — whether item i is selected
//   Objective: maximize sum of v[i] * x[i]
//   Constraint: sum of w[i] * x[i] <= capacity (declared with qbpp::cons())
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  // 10 items with weights and values, capacity = 50
  auto w = qbpp::array({10, 20, 30, 5, 8, 15, 12, 7, 17, 18});
  auto v = qbpp::array({60, 100, 120, 60, 80, 150, 110, 70, 150, 160});
  int capacity = 50;

  // Binary variables: x[i] = 1 means item i is selected
  auto x = qbpp::var("x", w.size());

  // Constraint: total weight must not exceed capacity.
  // Wrapping the range in qbpp::cons() declares it as a constraint;
  // the bundled solvers search for solutions satisfying it.
  auto constraint = qbpp::cons(0 <= qbpp::sum(w * x) <= capacity);

  // Objective: total value (to be maximized)
  auto objective = qbpp::sum(v * x);

  // Negate objective (QUBO minimizes) and add the weighted constraint.
  auto f = -objective + 1000 * constraint;
  f.simplify_as_binary();

  // ExhaustiveSolver: enumerate all optimal solutions (feasible for 10 variables)
  auto solver = qbpp::exhaustive_solver::ExhaustiveSolver(f);
  auto result = solver.search({{"best_energy_sols", 0}});

  // Display results: constraint.body(sol) evaluates the inner expression of
  // the constraint (i.e., the total weight).
  for (size_t i = 0; i < result.sols.size(); ++i) {
    const auto &sol = result.sols[i];
    std::cout << "[Solution " << i << "]" << std::endl;
    std::cout << "  Total weight = " << constraint.body(sol) << " / " << capacity << std::endl;
    std::cout << "  Total value  = " << sol(objective) << std::endl;
    std::cout << "  Items:";
    for (size_t j = 0; j < w.size(); ++j) {
      if (sol(x[j]) == 1) {
        std::cout << " " << j << "(w=" << w[j] << ",v=" << v[j] << ")";
      }
    }
    std::cout << std::endl;
  }
}
`,
  },

  nqueens: {
    name: "N-Queens",
    desc: "Solve the N-Queens problem with EasySolver (default N=8, args: N)",
    source: `// N-Queens Problem: Place N queens on an N x N chessboard so that
// no two queens attack each other (share a row, column, or diagonal).
//
// QUBO formulation:
//   Variables: x[i][j] in {0, 1} — whether a queen is at row i, column j
//   Constraints:
//     Row:      exactly one queen per row      (vector_sum along axis 0 == 1)
//     Column:   exactly one queen per column   (vector_sum along axis 1 == 1)
//     Diagonal: at most one queen per diagonal (diagonal_sum <= 1)
//
// Usage: ./program [N]  (default: N=8)
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>
#include <cstdlib>

int main(int argc, char *argv[]) {
  const int n = (argc >= 2) ? std::atoi(argv[1]) : 8;

  // Binary variables: x[i][j] = 1 places a queen at row i, column j
  auto x = qbpp::var("x", n, n);

  // Row and column constraints: exactly one queen per row/column.
  // vector_sum(x, 0) sums along axis 0 (rows) giving column sums.
  // vector_sum(x, 1) sums along axis 1 (columns) giving row sums.
  // qbpp::cons() declares one constraint per array element; the bundled
  // solvers search for solutions satisfying all declared constraints.
  auto f = qbpp::cons(qbpp::vector_sum(x, 0) == 1) +
           qbpp::cons(qbpp::vector_sum(x, 1) == 1);

  // Diagonal constraints: at most one queen per diagonal.
  const int m = 2 * n - 3;
  for (int i = 0; i < m; ++i) {
    qbpp::Expr diag_a, diag_b;
    const int k = i + 1;
    const int d = i - (n - 2);
    for (int r = 0; r < n; ++r) {
      int ca = k - r;
      if (0 <= ca && ca < n)
        diag_a += x[static_cast<size_t>(r)][static_cast<size_t>(ca)];
      int cb = r + d;
      if (0 <= cb && cb < n)
        diag_b += x[static_cast<size_t>(r)][static_cast<size_t>(cb)];
    }
    f += qbpp::cons(diag_a <= 1);
    f += qbpp::cons(diag_b <= 1);
  }

  f.simplify_as_binary();

  // EasySolver: heuristic search, stop early when energy 0 (all constraints met)
  auto solver = qbpp::easy_solver::EasySolver(f);
  auto sol = solver.search({{"target_energy", 0}});

  // Display the board
  std::cout << "Energy: " << sol.energy() << std::endl;
  for (size_t i = 0; i < n; i++) {
    for (size_t j = 0; j < n; j++) {
      std::cout << (sol(x[i][j]) ? "Q " : ". ");
    }
    std::cout << std::endl;
  }
}
`,
  },

  ilp: {
    name: "Integer Linear Programming",
    desc: "Solve an ILP problem with native integer variables",
    source: `// Integer Linear Programming (ILP): Solve an ILP problem with native
// integer variables and declared constraints.
//
// Formulation:
//   Variables: x[0], x[1], x[2] in {0, 1, ..., 5} (native integer)
//   Objective: maximize 2*x[0] + 5*x[1] + 5*x[2]
//   Constraints:
//     x[0] + 3*x[1] +   x[2] <= 12
//     x[0]           + 2*x[2] <=  5
//            x[1]    +   x[2] <=  4
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  // Native integer variables with bounds: 0 <= x[i] <= 5.
  // int_var keeps them as integers — the solvers search integer values
  // directly (no binary encoding).
  auto x = 0 <= qbpp::int_var("x", 3) <= 5;

  // Objective: maximize 2*x[0] + 5*x[1] + 5*x[2]
  auto objective = 2 * x[0] + 5 * x[1] + 5 * x[2];

  // Constraints: wrap each inequality in qbpp::cons() to declare it as a
  // constraint; the bundled solvers search for solutions satisfying them.
  auto c1 = qbpp::cons(x[0] + 3 * x[1] + x[2] <= 12);
  auto c2 = qbpp::cons(x[0] + 2 * x[2] <= 5);
  auto c3 = qbpp::cons(x[1] + x[2] <= 4);

  // Negate objective (QUBO minimizes) and add the constraints.
  // Multiplying by a positive scalar (100) scales all constraint weights.
  auto f = -objective + 100 * (c1 + c2 + c3);
  f.simplify_as_binary();

  // EasySolver: heuristic search with 1-second time limit
  auto solver = qbpp::easy_solver::EasySolver(f);
  auto sol = solver.search({{"time_limit", 1.0}});

  // Display results
  std::cout << "x[0] = " << sol(x[0])
            << ", x[1] = " << sol(x[1])
            << ", x[2] = " << sol(x[2]) << std::endl;
  std::cout << "Objective = " << sol(objective) << std::endl;

  // .body(sol) evaluates the inner expression of a constraint
  // (the left-hand side of the inequality).
  std::cout << "x[0]+3*x[1]+x[2] = " << c1.body(sol)
            << ", x[0]+2*x[2] = " << c2.body(sol)
            << ", x[1]+x[2] = " << c3.body(sol) << std::endl;
}
`,
  },

  factorization: {
    name: "Factorization",
    desc: "Factorize N into p * q with EasySolver (default N=15, args: N or p q)",
    source: `// Integer Factorization: Find factors p, q such that p * q = N.
//
// QUBO formulation:
//   Variables: p in [2, sqrt(N)], q in [sqrt(N), N-1] (native integer)
//   Constraint: p * q == N (declared with qbpp::cons();
//               nonlinear equality constraints are supported)
//
// Native integer search factors 8-digit semiprimes in seconds
// (try: ./program 99400891).
//
// Uses cpp_int for arbitrary-precision integer arithmetic.
//
// Usage: ./program [N]        (factorize N, default: N=15)
//        ./program [p] [q]    (factorize p*q)
#define INTEGER_TYPE_CPP_INT
#include <cstdlib>

#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main(int argc, char* argv[]) {
  // Parse command-line arguments: N (single integer) or p q (two factors)
  qbpp::cpp_int N = 15;
  if (argc >= 3)
    N = qbpp::integer(argv[1]) * qbpp::integer(argv[2]);
  else if (argc == 2)
    N = qbpp::integer(argv[1]);

  // Compute integer square root of N to bound the smaller factor.
  // A loop is used instead of std::sqrt to avoid floating-point rounding
  // issues with large integers (e.g., sqrt(25) could give 4.999...).
  qbpp::cpp_int sqrtN = 1;
  while ((sqrtN + 1) * (sqrtN + 1) <= N) ++sqrtN;

  // Integer variables with restricted ranges:
  //   p in [2, sqrtN], q in [sqrtN, N-1]
  // This ensures p <= q without an explicit constraint, reducing search space.
  auto p = 2 <= qbpp::int_var("p") <= sqrtN;
  auto q = sqrtN <= qbpp::int_var("q") <= N - 1;

  // Constraint: p * q == N, declared with qbpp::cons().
  // The bundled solvers search for solutions satisfying the constraint.
  auto f = qbpp::cons(p * q == N);
  f.simplify_as_binary();

  // EasySolver: heuristic search, stop early when energy 0 (factorization found)
  auto solver = qbpp::easy_solver::EasySolver(f);
  auto sol = solver.search({{"time_limit", 10}, {"target_energy", 0}});

  // Display result
  std::cout << "Energy: " << sol.energy() << std::endl;
  std::cout << p(sol) << " * " << q(sol) << " = " << p(sol) * q(sol);
  if (p(sol) * q(sol) != N) std::cout << " != " << N;
  std::cout << std::endl;
}
`,
  },

  cutting_stock: {
    name: "Cutting Stock",
    desc: "Find a feasible cutting plan for M bars of length L (default M=6, args: M)",
    source: `// Cutting Stock Problem: Given M bars of length L and N order types with
// lengths l[j] and required counts c[j], find a feasible cutting plan
// that fulfills all orders without exceeding bar lengths.
//
// QUBO formulation:
//   Variables: x[i][j] in {0, ..., c[j]} — number of items of order j from bar i
//   Constraints:
//     Order:    sum over bars i of x[i][j] == c[j] for each order j
//     Capacity: sum of l[j] * x[i][j] <= L for each bar i
//
// Usage: ./program [M]  (default: M=6)
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main(int argc, char* argv[]) {
  const int L = 60;
  const size_t M = argc > 1 ? std::stoull(argv[1]) : 6;
  const auto l = qbpp::array({13, 23, 8, 11});
  const auto c = qbpp::array({10, 4, 8, 6});
  const size_t N = l.size();

  auto x = qbpp::int_var("x", M, N) == 0;
  for (size_t i = 0; i < M; i++) {
    for (size_t j = 0; j < N; j++) {
      x[i][j] = 0 <= qbpp::int_var() <= c[j];
    }
  }

  // qbpp::cons() declares one constraint per array element; the bundled
  // solvers search for solutions satisfying all declared constraints.
  auto order_fulfilled_count = qbpp::vector_sum(x, 0);
  auto order_constraint = qbpp::cons(order_fulfilled_count == c);

  auto bar_length_used = qbpp::expr(M);
  for (size_t i = 0; i < M; i++) {
    bar_length_used[i] = qbpp::sum(x(i) * l);
  }
  auto bar_constraint = qbpp::cons(0 <= bar_length_used <= L);

  auto f = order_constraint + bar_constraint;
  f.simplify_as_binary();

  auto solver = qbpp::easy_solver::EasySolver(f);
  auto sol = solver.search({{"time_limit", 10.0}, {"target_energy", 0}});
  for (size_t i = 0; i < M; i++) {
    std::cout << "Bar " << i << ":  ";
    for (size_t j = 0; j < N; j++) {
      std::cout << sol(x[i][j]) << "  ";
    }
    std::cout << " used = " << sol(bar_length_used[i])
              << ", waste = " << L - sol(bar_length_used[i]) << std::endl;
  }
  for (size_t j = 0; j < N; j++) {
    std::cout << "Order " << j
              << " fulfilled = " << sol(order_fulfilled_count[j])
              << ", required = " << c[j] << std::endl;
  }
}
`,
  },

  max_matching: {
    name: "Maximum Matching",
    desc: "Find the largest set of edges without common vertices (16 vertices, 27 edges)",
    source: `// Maximum Matching: Given a graph, find the largest set of edges
// such that no two edges share a vertex.
//
// QUBO formulation:
//   Variables: x[i] in {0, 1} — whether edge i is in the matching
//   Objective: maximize sum of x[i] (number of matched edges)
//   Constraint: x[i] * x[j] = 0 for all pairs of edges sharing a vertex
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  // Graph represented as an edge list (16 vertices, 27 edges)
  std::vector<std::pair<size_t, size_t>> edges = {
      {0, 1},   {0, 2},   {1, 3},   {1, 4},   {2, 5},   {2, 6},   {3, 7},
      {3, 13},  {4, 6},   {4, 7},   {4, 14},  {5, 8},   {6, 8},   {6, 12},
      {6, 14},  {7, 14},  {8, 9},   {9, 10},  {9, 12},  {10, 11}, {10, 12},
      {11, 13}, {11, 15}, {12, 14}, {12, 15}, {13, 15}, {14, 15}};
  const size_t M = edges.size();
  const size_t N = 16;  // Number of vertices

  // Binary variables: x[i] = 1 means edge i is in the matching
  auto x = qbpp::var("x", M);

  // Objective: maximize the number of matched edges
  auto objective = qbpp::sum(x);

  // Constraint: no two edges in the matching can share a vertex.
  // For each pair of edges sharing a vertex, add x[i]*x[j] as a penalty.
  auto constraint = qbpp::toExpr(0);
  for (size_t i = 0; i < M; ++i) {
    for (size_t j = i + 1; j < M; ++j) {
      if (edges[i].first == edges[j].first ||
          edges[i].first == edges[j].second ||
          edges[i].second == edges[j].first ||
          edges[i].second == edges[j].second) {
        constraint += x[i] * x[j];
      }
    }
  }

  // Negate objective (QUBO minimizes) and add penalty for constraint.
  // The penalty weight (2) ensures that violating a constraint costs more
  // than the benefit of including one extra edge.
  auto f = -objective + 2 * constraint;
  f.simplify_as_binary();

  // EasySolver: heuristic search, stop early at energy -N/2 (perfect matching)
  auto solver = qbpp::easy_solver::EasySolver(f);
  auto sol = solver.search({{"time_limit", 10},
    {"target_energy", std::to_string(-static_cast<int>(N / 2))}});

  // Display results
  std::cout << "Energy = " << sol.energy() << std::endl;
  std::cout << "Maximum matching:";
  int count = 0;
  for (size_t i = 0; i < M; ++i) {
    if (sol(x[i])) {
      std::cout << " (" << edges[i].first << ", " << edges[i].second << ")";
      ++count;
    }
  }
  std::cout << std::endl;
  std::cout << "Matching size = " << count << std::endl;
}
`,
  },

  tsp: {
    name: "Traveling Salesman",
    desc: "Find the shortest tour visiting 9 cities (one-hot matrix formulation)",
    source: `// Traveling Salesman Problem (TSP): Find the shortest closed tour
// visiting all cities exactly once.
//
// QUBO formulation (one-hot matrix):
//   Variables: x[i][j] in {0, 1} — whether position i in the tour visits city j
//   Objective: minimize total tour distance
//   Constraints:
//     Row:    each position visits exactly one city (vector_sum along axis 0 == 1)
//     Column: each city is visited exactly once    (vector_sum along axis 1 == 1)
//
// Distances are kept as exact doubles (no rounding). Defining DOUBLE_TYPE makes
// coefficients and energy 'double'; QUBO++ automatically quantizes them to the
// integer solver and returns the energy as a double.
#define DOUBLE_TYPE
#include <cmath>
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

// City coordinates and Euclidean distance
class Cities {
  std::vector<std::pair<int, int>> coords{
      {10, 12}, {33, 125}, {12, 226}, {121, 11}, {108, 142},
      {111, 243}, {220, 4}, {210, 113}, {211, 233}};

 public:
  size_t size() const { return coords.size(); }

  const std::pair<int, int>& operator[](size_t i) const { return coords[i]; }

  double dist(size_t i, size_t j) const {
    auto [x1, y1] = coords[i];
    auto [x2, y2] = coords[j];
    double dx = x1 - x2, dy = y1 - y2;
    return std::sqrt(dx * dx + dy * dy);   // exact Euclidean distance (no rounding)
  }
};

int main() {
  Cities cities;
  const size_t n = cities.size();

  // Binary variables: x[i][j] = 1 means position i in the tour visits city j
  auto x = qbpp::var("x", n, n);

  // Constraints: each row and column sums to 1, declared with qbpp::cons()
  // (one constraint per array element; qbpp::sum() is not needed).
  // This ensures each position has one city and each city is visited once.
  auto constraint = qbpp::cons(qbpp::vector_sum(x, 0) == 1) +
                    qbpp::cons(qbpp::vector_sum(x, 1) == 1);

  // Objective: total tour distance.
  // For consecutive positions (i, next), sum dist(j, k) * x[i][j] * x[next][k]
  // over all city pairs (j, k) with j != k.
  auto objective = qbpp::expr();
  for (size_t i = 0; i < n; ++i) {
    size_t next = (i + 1) % n;
    for (size_t j = 0; j < n; ++j)
      for (size_t k = 0; k < n; ++k)
        if (k != j) objective += cities.dist(j, k) * x[i][j] * x[next][k];
  }

  // Combine the objective and the weighted constraints.
  // Multiplying by a positive scalar (1000) scales all constraint weights.
  auto f = objective + 1000 * constraint;
  f.simplify_as_binary();

  // EasySolver: heuristic search with 1-second time limit
  auto solver = qbpp::easy_solver::EasySolver(f);
  auto sol = solver.search({{"time_limit", 1.0}});

  // Extract tour using onehot_to_int: converts one-hot rows to city indices
  auto tour = qbpp::onehot_to_int(sol(x));
  std::cout << "Tour:";
  double total_dist = 0;
  for (size_t i = 0; i < n; ++i) {
    auto [cx, cy] = cities[static_cast<size_t>(tour[i])];
    std::cout << " " << tour[i] << "(" << cx << "," << cy << ")";
    total_dist += cities.dist(static_cast<size_t>(tour[i]),
                              static_cast<size_t>(tour[(i + 1) % n]));
  }
  std::cout << std::endl;
  std::cout << "Total distance = " << total_dist << std::endl;
}
`,
  },

  sqrt: {
    name: "Square Root",
    desc: "Compute the integer square root of c (default c=2, args: c in 1..100)",
    source: `// Square Root: Compute an approximation of sqrt(c) with 20-digit precision.
//
// Since QUBO++ handles only integers, we compute sqrt(c * s^2) where s = 10^20.
// Then sqrt(c) ≈ sqrt(c * s^2) / s.
//
// HUBO formulation:
//   Variable: x in [s, c*s] (native integer)
//   Objective: minimize (x^2 - c*s^2)^2
//
// The equality constraint x^2 == c*s^2 has no exact integer solution
// (unless c is a perfect square), so the solver minimizes the error.
//
// Usage: ./program [c]  (default: c=2, range: 1..100)
#define INTEGER_TYPE_CPP_INT
#include <cstdlib>

#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main(int argc, char* argv[]) {
  int c = 2;
  if (argc >= 2) c = std::atoi(argv[1]);
  if (c < 1 || c > 100) {
    std::cerr << "c must be between 1 and 100" << std::endl;
    return 1;
  }

  auto s = qbpp::integer("100000000000000000000");  // 10^20
  auto x = s <= qbpp::int_var("x") <= c * s;
  auto f = x * x == c * s * s;
  f.simplify_as_binary();

  // Native integer search reaches the exact 20-digit floor(sqrt)
  // in about a second.
  auto solver = qbpp::easy_solver::EasySolver(f);
  auto sol = solver.search({{"time_limit", 1.0}});
  auto xv = sol(x);

  std::cout << "sqrt(" << c << ") ≈ " << xv << " / " << s << std::endl;
  std::cout << "       = " << (xv / s) << "." << (xv % s) << std::endl;
  std::cout << "Energy = " << sol.energy() << std::endl;
}
`,
  },
};

// ── State ──────────────────────────────────────────────────────────

let editor = null;
let compiledBinary = null; // base64 string
let compiledSignature = null; // HMAC signature from server
let compiledSize = 0;
let isCompiling = false;
let isRunning = false;
let compileCooldownUntil = 0;
let runCooldownUntil = 0;
const COOLDOWN_MS = 5000;
let currentFileName = "";
let maxLines = 0; // fetched from server

// ── DOM refs ───────────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);

const btnCompile = $("btn-compile");
const btnRun = $("btn-run");
const btnLoad = $("btn-load");
const btnSave = $("btn-save");
const btnTheme = $("btn-theme");
const templateSelect = $("template-select");
const outputContent = $("output-content");
const statusText = $("status-text");
const statusBinary = $("status-binary");
const statusLines = $("status-lines");
const statusBar = $("status-bar");
const lineInfo = $("line-info");
const resizeHandle = $("resize-handle");
const fileInput = $("file-input");
const runArgs = $("run-args");

// ── Theme ──────────────────────────────────────────────────────────

function getTheme() {
  return document.documentElement.getAttribute("data-theme") || "dark";
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("qbpp-ide-theme", theme);
  btnTheme.textContent = theme === "dark" ? "\u263C" : "\u263E";
  if (editor) {
    monaco.editor.setTheme(theme === "dark" ? "vs-dark" : "vs");
  }
}

btnTheme.addEventListener("click", () => {
  setTheme(getTheme() === "dark" ? "light" : "dark");
});

// ── Output ─────────────────────────────────────────────────────────

const MAX_OUTPUT_LINES = 5000;
let outputLineCount = 0;
let outputTruncated = false;
let pendingOutput = [];
let outputRafId = 0;

function clearOutput() {
  outputContent.innerHTML = "";
  outputLineCount = 0;
  outputTruncated = false;
  pendingOutput = [];
  if (outputRafId) { cancelAnimationFrame(outputRafId); outputRafId = 0; }
}

function appendOutput(text, className) {
  if (outputTruncated) return;
  const newLines = (text.match(/\n/g) || []).length;
  if (outputLineCount + newLines > MAX_OUTPUT_LINES) {
    // Show text up to the line limit, then truncate
    const remaining = MAX_OUTPUT_LINES - outputLineCount;
    if (remaining > 0) {
      let idx = 0;
      for (let i = 0; i < remaining; i++) {
        const next = text.indexOf("\n", idx);
        if (next === -1) { idx = text.length; break; }
        idx = next + 1;
      }
      pendingOutput.push({ text: text.slice(0, idx), className });
    }
    outputTruncated = true;
    pendingOutput.push({ text: `\n[Output truncated at ${MAX_OUTPUT_LINES} lines]\n`, className: "output-warning" });
    flushOutput();
    return;
  }
  outputLineCount += newLines;
  pendingOutput.push({ text, className });
  if (!outputRafId) {
    outputRafId = requestAnimationFrame(flushOutput);
  }
}

function flushOutput() {
  outputRafId = 0;
  const frag = document.createDocumentFragment();
  for (const { text, className } of pendingOutput) {
    const span = document.createElement("span");
    span.className = className || "";
    span.textContent = text;
    frag.appendChild(span);
  }
  pendingOutput = [];
  outputContent.appendChild(frag);
  outputContent.scrollTop = outputContent.scrollHeight;
}

function setStatus(text, type) {
  statusText.textContent = text;
  statusBar.className = "status-bar" + (type ? " " + type : "");
}

function updateBinaryStatus() {
  if (compiledBinary) {
    const kb = (compiledSize / 1024).toFixed(0);
    statusBinary.textContent = `Binary: ${kb} KB`;
    btnRun.disabled = false;
  } else {
    statusBinary.textContent = "No binary";
    btnRun.disabled = true;
  }
}

// ── Line count ────────────────────────────────────────────────────

function updateLineCount() {
  if (!editor) return;
  const count = editor.getModel().getLineCount();
  if (maxLines > 0) {
    statusLines.textContent = `Lines: ${count}/${maxLines}`;
    statusLines.style.color = count > maxLines ? "var(--error-color, #dc3545)" : "";
  } else {
    statusLines.textContent = `Lines: ${count}`;
  }
}

// ── Monaco Editor ──────────────────────────────────────────────────

function initEditor() {
  require.config({
    paths: {
      vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs",
    },
  });

  require(["vs/editor/editor.main"], function () {
    const savedTheme = localStorage.getItem("qbpp-ide-theme") || "dark";
    setTheme(savedTheme);

    editor = monaco.editor.create($("editor"), {
      value: "",
      language: "cpp",
      theme: savedTheme === "dark" ? "vs-dark" : "vs",
      fontSize: 14,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      renderWhitespace: "selection",
      lineNumbers: "on",
      glyphMargin: true,
      folding: true,
      wordWrap: "off",
    });

    // Cursor position display
    editor.onDidChangeCursorPosition((e) => {
      lineInfo.textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
    });

    // Line count display
    editor.getModel().onDidChangeContent(() => updateLineCount());
    updateLineCount();

    // Keyboard shortcuts
    editor.addAction({
      id: "compile",
      label: "Compile",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB],
      run: () => doCompile(),
    });

    editor.addAction({
      id: "run",
      label: "Run",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR],
      run: () => {
        if (isRunning) {
          stopRun();
        } else if (compiledBinary) {
          doRun();
        }
      },
    });

    editor.addAction({
      id: "save",
      label: "Save",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => btnSave.click(),
    });

    editor.addAction({
      id: "open",
      label: "Open File",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyO],
      run: () => btnLoad.click(),
    });

  });
}

// ── Load helper ───────────────────────────────────────────────────

function loadTemplate(key) {
  const tmpl = TEMPLATES[key];
  if (tmpl && editor) {
    editor.setValue(tmpl.source);
    compiledBinary = null;
    compiledSignature = null;
    compiledSize = 0;
    currentFileName = "";
    updateBinaryStatus();
    clearOutput();
    appendOutput(`Template: ${tmpl.name}\n`, "output-info");
    appendOutput(`${tmpl.desc}\n`, "output-info");
    monaco.editor.setModelMarkers(editor.getModel(), "compiler", []);
  }
}

// ── Cooldown ──────────────────────────────────────────────────────

function startCompileCooldown(ms) {
  compileCooldownUntil = Date.now() + ms;
  const tick = () => {
    const sec = Math.ceil((compileCooldownUntil - Date.now()) / 1000);
    if (sec <= 0) {
      btnCompile.textContent = "Compile";
      btnCompile.disabled = false;
      return;
    }
    btnCompile.textContent = `Wait ${sec}s`;
    btnCompile.disabled = true;
    setTimeout(tick, 500);
  };
  tick();
}

function startRunCooldown(ms) {
  runCooldownUntil = Date.now() + ms;
  const tick = () => {
    const sec = Math.ceil((runCooldownUntil - Date.now()) / 1000);
    if (sec <= 0) {
      btnRun.textContent = "Run";
      btnRun.disabled = !compiledBinary;
      return;
    }
    btnRun.textContent = `Wait ${sec}s`;
    btnRun.disabled = true;
    setTimeout(tick, 500);
  };
  tick();
}

// ── Compile ────────────────────────────────────────────────────────

function handleCompileDone(doneEvent, stderrText) {
  if (doneEvent.timeout) {
    appendOutput(`\nCompilation timed out (${doneEvent.timeout}s)\n`, "output-error");
    setStatus("Compilation timed out", "error");
    compiledBinary = null;
    compiledSignature = null;
    compiledSize = 0;
  } else if (doneEvent.success) {
    compiledBinary = doneEvent.binary;
    compiledSignature = doneEvent.signature || null;
    compiledSize = doneEvent.size || 0;
    appendOutput(
      `\nCompilation successful (${doneEvent.time.toFixed(1)}s)\n`,
      "output-success"
    );
    setStatus("Compiled successfully", "success");
  } else {
    compiledBinary = null;
    compiledSignature = null;
    compiledSize = 0;
    if (doneEvent.error) {
      appendOutput(doneEvent.error + "\n", "output-error");
    }
    setStatus("Compilation failed", "error");
  }
  updateBinaryStatus();
  parseAndSetMarkers(stderrText);
}

async function doCompile() {
  if (isCompiling || isRunning) return;
  if (Date.now() < compileCooldownUntil) return;

  const source = editor.getValue();
  if (!source.trim()) {
    appendOutput("Error: Empty source code\n", "output-error");
    return;
  }

  isCompiling = true;
  btnCompile.disabled = true;
  btnRun.disabled = true;
  clearOutput();
  appendOutput("Compiling...\n", "output-info");
  setStatus("Compiling...", "");
  const compileStart = Date.now();
  const compileTimer = setInterval(() => {
    const elapsed = ((Date.now() - compileStart) / 1000).toFixed(1);
    setStatus(`Compiling... [${elapsed}s]`, "");
  }, 100);

  // Clear previous error markers
  monaco.editor.setModelMarkers(editor.getModel(), "compiler", []);

  try {
    const resp = await fetch(API_BASE + "/compile", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
      body: JSON.stringify({ source }),
    });

    if (resp.status === 429) {
      const data = await resp.json();
      const wait = data.retry_after || 10;
      setStatus(`Rate limited. Wait ${wait}s.`, "error");
      appendOutput(`Too many requests. Please wait ${wait}s.\n`, "output-error");
      startCompileCooldown(wait * 1000);
      return false;
    }

    const contentType = resp.headers.get("content-type") || "";
    let stderrText = "";

    if (contentType.includes("ndjson")) {
      // NDJSON streaming mode (Lambda)
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let doneEvent = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            if (event.type === "stdout") {
              appendOutput(event.text, "");
            } else if (event.type === "stderr") {
              stderrText += event.text;
              appendOutput(event.text, "output-error");
            } else if (event.type === "done") {
              doneEvent = event;
            }
          } catch (_) {}
        }
      }
      if (buffer.trim()) {
        try {
          const event = JSON.parse(buffer);
          if (event.type === "stdout") {
            appendOutput(event.text, "");
          } else if (event.type === "stderr") {
            stderrText += event.text;
            appendOutput(event.text, "output-error");
          } else if (event.type === "done") {
            doneEvent = event;
          }
        } catch (_) {}
      }
      reader.releaseLock();

      if (doneEvent) {
        handleCompileDone(doneEvent, stderrText);
      }
    } else {
      // JSON mode (local server with polling)
      const data = await resp.json();

      if (data.started) {
        // Poll /compile/output
        while (true) {
          await new Promise((r) => setTimeout(r, 100));
          const outResp = await fetch(API_BASE + "/compile/output", {
            headers: { "X-API-Key": API_KEY },
          });
          const outData = await outResp.json();

          for (const event of outData.events) {
            if (event.type === "stdout") {
              appendOutput(event.text, "");
            } else if (event.type === "stderr") {
              stderrText += event.text;
              appendOutput(event.text, "output-error");
            } else if (event.type === "done") {
              handleCompileDone(event, stderrText);
            }
          }
          if (outData.finished) break;
        }
      } else if (data.success !== undefined) {
        // Legacy one-shot response (fallback)
        if (data.success) {
          compiledBinary = data.binary;
          compiledSignature = data.signature || null;
          compiledSize = data.size || 0;
          updateBinaryStatus();
          appendOutput(
            `Compilation successful (${data.time.toFixed(1)}s)\n`,
            "output-success"
          );
          if (data.warnings) {
            appendOutput("Warnings:\n" + data.warnings + "\n", "output-warning");
          }
          setStatus("Compiled successfully", "success");
        } else {
          compiledBinary = null;
          compiledSignature = null;
          compiledSize = 0;
          updateBinaryStatus();
          appendOutput("Compilation failed:\n", "output-error");
          appendOutput(data.error + "\n", "output-error");
          setStatus("Compilation failed", "error");
          parseAndSetMarkers(data.error);
        }
      } else if (data.error) {
        appendOutput("Error: " + data.error + "\n", "output-error");
        setStatus("Error", "error");
      }
    }
  } catch (err) {
    appendOutput("Network error: " + err.message + "\n", "output-error");
    setStatus("Network error", "error");
    return false;
  } finally {
    clearInterval(compileTimer);
    isCompiling = false;
    // Compile button: 5s cooldown; Run button: immediately available
    startCompileCooldown(COOLDOWN_MS);
    btnRun.disabled = !compiledBinary;
  }
}

// ── Run ────────────────────────────────────────────────────────────

let runStopped = false;
let runAbortController = null;

function showExitStatus(event) {
  if (event.returncode === 0) {
    appendOutput(`\nProcess exited with code 0 (${event.time.toFixed(2)}s)\n`, "output-success");
    setStatus("Finished", "success");
  } else if (event.timeout) {
    appendOutput(`\nProcess timed out after ${event.timeout}s\n`, "output-error");
    setStatus("Timed out", "error");
  } else {
    appendOutput(`\nProcess exited with code ${event.returncode} (${event.time.toFixed(2)}s)\n`, "output-error");
    setStatus("Runtime error", "error");
  }
}

function stopRun() {
  runStopped = true;
  // Abort fetch to close the stream — server detects disconnect via heartbeat and kills process
  if (runAbortController) runAbortController.abort();
}

function processEvents(events) {
  for (const event of events) {
    if (event.type === "heartbeat") continue;
    if (event.type === "stdout") {
      appendOutput(event.text, "output-stdout");
    } else if (event.type === "stderr") {
      appendOutput(event.text, "output-stderr");
    } else if (event.type === "exit") {
      showExitStatus(event);
    }
  }
}

/** Read NDJSON stream and process events in real-time. */
async function readNdjsonStream(resp) {
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (!runStopped) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          processEvents([JSON.parse(line)]);
        } catch (_) { /* skip malformed lines */ }
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Process remaining buffer
  if (buffer.trim()) {
    try {
      processEvents([JSON.parse(buffer)]);
    } catch (_) { /* ignore */ }
  }

  if (runStopped) {
    appendOutput("\nProcess stopped by user\n", "output-warning");
    setStatus("Stopped", "");
  }
}

async function doRun() {
  if (isRunning || isCompiling || !compiledBinary) return;
  if (Date.now() < runCooldownUntil) return;

  isRunning = true;
  runStopped = false;
  runAbortController = new AbortController();
  btnRun.textContent = "Stop";
  btnRun.disabled = false;
  btnCompile.disabled = true;
  clearOutput();
  setStatus("Running...", "");

  try {
    const resp = await fetch(API_BASE + "/run", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
      body: JSON.stringify({ binary: compiledBinary, signature: compiledSignature, timeout: 30, args: runArgs.value.trim() }),
      signal: runAbortController.signal,
    });

    if (resp.status === 429) {
      const data = await resp.json();
      const wait = data.retry_after || 10;
      setStatus(`Rate limited. Wait ${wait}s.`, "error");
      appendOutput(`Too many requests. Please wait ${wait}s.\n`, "output-error");
      startRunCooldown(wait * 1000);
      return;
    }

    const contentType = resp.headers.get("content-type") || "";

    if (contentType.includes("ndjson")) {
      // NDJSON streaming mode (Lambda with response streaming)
      await readNdjsonStream(resp);
    } else {
      // JSON mode (local server polling or one-shot fallback)
      const data = await resp.json();

      if (data.started) {
        // Polling mode (local server): poll /run/output every 100ms
        while (!runStopped) {
          await new Promise((r) => setTimeout(r, 100));
          try {
            const outResp = await fetch(API_BASE + "/run/output", {
              headers: { "X-API-Key": API_KEY },
            });
            const outData = await outResp.json();
            processEvents(outData.events);
            if (outData.finished) break;
          } catch (e) {
            if (runStopped) break;
            throw e;
          }
        }
        if (runStopped) {
          appendOutput("\nProcess stopped by user\n", "output-warning");
          setStatus("Stopped", "");
        }
      } else if (data.error) {
        appendOutput("Error: " + data.error + "\n", "output-error");
        setStatus("Error", "error");
      }
    }
  } catch (err) {
    if (err.name === "AbortError") {
      // User stopped — already handled in stopRun
    } else {
      appendOutput("Network error: " + err.message + "\n", "output-error");
      setStatus("Network error", "error");
    }
  } finally {
    isRunning = false;
    runStopped = false;
    runAbortController = null;
    btnRun.textContent = "Run";
    startRunCooldown(COOLDOWN_MS);
    btnCompile.disabled = false;
  }
}

// ── Error marker parsing ───────────────────────────────────────────

function parseAndSetMarkers(errorText) {
  if (!editor || !errorText) return;

  const markers = [];
  // Match g++ error format: source.cpp:LINE:COL: error: message
  const regex = /source\.cpp:(\d+):(\d+):\s*(error|warning|note):\s*(.+)/g;
  let match;

  while ((match = regex.exec(errorText)) !== null) {
    const line = parseInt(match[1], 10);
    const col = parseInt(match[2], 10);
    const severity =
      match[3] === "error"
        ? monaco.MarkerSeverity.Error
        : match[3] === "warning"
          ? monaco.MarkerSeverity.Warning
          : monaco.MarkerSeverity.Info;
    markers.push({
      severity,
      startLineNumber: line,
      startColumn: col,
      endLineNumber: line,
      endColumn: col + 1,
      message: match[4],
    });
  }

  if (markers.length > 0) {
    monaco.editor.setModelMarkers(editor.getModel(), "compiler", markers);
    // Jump to first error
    editor.revealLineInCenter(markers[0].startLineNumber);
    editor.setPosition({
      lineNumber: markers[0].startLineNumber,
      column: markers[0].startColumn,
    });
  }
}

// ── Resize handle ──────────────────────────────────────────────────

(function initResize() {
  let startY, startEditorH, startOutputH;
  const editorContainer = document.querySelector(".editor-container");
  const outputPanel = document.querySelector(".output-panel");

  resizeHandle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    startY = e.clientY;
    startEditorH = editorContainer.offsetHeight;
    startOutputH = outputPanel.offsetHeight;
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  function onMouseMove(e) {
    const dy = e.clientY - startY;
    const newEditorH = Math.max(100, startEditorH + dy);
    const newOutputH = Math.max(50, startOutputH - dy);
    editorContainer.style.flex = "none";
    editorContainer.style.height = newEditorH + "px";
    outputPanel.style.flex = "none";
    outputPanel.style.height = newOutputH + "px";
  }

  function onMouseUp() {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }
})();

// ── Button event listeners ─────────────────────────────────────────

btnCompile.addEventListener("click", doCompile);
btnRun.addEventListener("click", () => {
  if (isRunning) {
    stopRun();
  } else {
    doRun();
  }
});

// ── Load / Save ───────────────────────────────────────────────────

btnLoad.addEventListener("click", () => {
  const sel = templateSelect.value;
  if (sel === "local_file") {
    fileInput.click();
  } else {
    loadTemplate(sel);
  }
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    if (editor) {
      editor.setValue(e.target.result);
      compiledBinary = null;
      compiledSignature = null;
      compiledSize = 0;
      currentFileName = file.name;
      updateBinaryStatus();
      clearOutput();
      appendOutput(`Loaded: ${file.name}\n`, "output-info");
      monaco.editor.setModelMarkers(editor.getModel(), "compiler", []);
    }
  };
  reader.readAsText(file);
  fileInput.value = "";
});

// Save via parent postMessage (for cross-origin iframe)
// Protocol:
//   iframe → parent: { type: "save-file", content, name }
//   parent → iframe: { type: "save-file-ack" }           (immediate, within 2s)
//   parent → iframe: { type: "save-file-result", ok/cancelled/error }
const _inIframe = window.self !== window.top;
let _saveAckResolve = null;
let _saveResultResolve = null;

if (_inIframe) {
  window.addEventListener("message", (e) => {
    if (!e.data) return;
    if (e.data.type === "save-file-ack" && _saveAckResolve) {
      _saveAckResolve(true);
      _saveAckResolve = null;
    } else if (e.data.type === "save-file-result" && _saveResultResolve) {
      _saveResultResolve(e.data);
      _saveResultResolve = null;
    }
  });
}

function _saveViaParent(source, name) {
  return new Promise((resolve) => {
    // Phase 1: wait for ack (parent supports save-file?)
    _saveAckResolve = (acked) => {
      _saveAckResolve = null;
      if (!acked) { resolve({ error: "unsupported" }); return; }
      // Phase 2: ack received — wait for result (no timeout)
      _saveResultResolve = resolve;
    };
    window.parent.postMessage({ type: "save-file", content: source, name }, "*");
    // If no ack within 2s, parent doesn't support save-file
    setTimeout(() => { if (_saveAckResolve) { _saveAckResolve(false); _saveAckResolve = null; } }, 2000);
  });
}

let _isSaving = false;

btnSave.addEventListener("click", async () => {
  if (!editor || _isSaving) return;
  _isSaving = true;
  try {
  const source = editor.getValue();
  const name = currentFileName || "source.cpp";

  // 1. In iframe: delegate to parent page via postMessage
  if (_inIframe) {
    const result = await _saveViaParent(source, name);
    if (result.ok) {
      currentFileName = result.name;
      appendOutput(`Saved: ${result.name}\n`, "output-info");
      return;
    }
    if (result.cancelled) return;
    // Parent unsupported — fall through to download fallback
  }

  // 2. Use native file picker (works in top-level; in iframe may throw SecurityError → caught below)
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: name,
        types: [{
          description: "C++ Source",
          accept: { "text/plain": [".cpp", ".hpp", ".h", ".cc", ".cxx"] },
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(new Blob([source], { type: "text/plain" }));
      await writable.close();
      currentFileName = handle.name;
      appendOutput(`Saved: ${handle.name}\n`, "output-info");
      return;
    } catch (e) {
      if (e.name === "AbortError") return;
      console.warn("showSaveFilePicker failed:", e.name, e.message);
    }
  }

  // 3. Fallback: download
  const fname = prompt("Save as:", name);
  if (!fname) return;
  currentFileName = fname;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([source], { type: "text/plain" }));
  a.download = fname;
  a.click();
  URL.revokeObjectURL(a.href);
  } finally {
    _isSaving = false;
  }
});

// ── Global keyboard shortcuts ──────────────────────────────────────

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === "s" || e.key === "S") {
      e.preventDefault();
      btnSave.click();
    } else if (e.key === "o" || e.key === "O") {
      e.preventDefault();
      btnLoad.click();
    }
  }
});

// ── Initialize ─────────────────────────────────────────────────────

fetch(API_BASE + "/config").then(r => r.json()).then(data => {
  if (data.max_lines) { maxLines = data.max_lines; updateLineCount(); }
}).catch(() => {});

initEditor();

// -- Help / 使い方 modal -----------------------------------------------------

(function initHelp() {
  const HELP = {
    ja: `
<h3>QUBO++ Playground とは</h3>
<p>ブラウザ上で QUBO++（C++）プログラムを書き、<b>Compile</b> でコンパイル、<b>Run</b> で実行できます。コンパイルと実行はクラウド（CPU のみ）で行われます。</p>

<h3>基本の流れ</h3>
<ul>
<li>上部のドロップダウンからサンプル（Simple / N-Queens / Knapsack 等）を選び <b>Load</b>。</li>
<li><b>Compile</b>（Ctrl+B）→ <b>Run</b>（Ctrl+R）。</li>
<li><code>args</code> 欄に <code>argv</code> 用のコマンドライン引数を入力できます（例: N-Queens の盤サイズ）。</li>
<li><b>Save</b> でソース保存、<b>Load</b>（Local File 選択時）でローカルファイルを開きます。</li>
</ul>

<h3>サポートするソルバー</h3>
<ul>
<li><code>qbpp::easy_solver::EasySolver</code> — ヒューリスティック探索（ビットフリップ＋タブー）。良い解を高速に1つ。</li>
<li><code>qbpp::exhaustive_solver::ExhaustiveSolver</code> — 全探索。小規模（〜数十変数）向けの厳密解。</li>
</ul>
<p>いずれも <b>CPU 実行</b>（この環境に GPU はありません）。ABS3Solver や外部 MILP ソルバーは利用できません。</p>

<h3>search() のオプション</h3>
<p><code>solver.search({{"key", value}, ...})</code> の形で指定します。</p>
<p><b>EasySolver</b></p>
<table>
<tr><th>オプション</th><th>意味</th></tr>
<tr><td><code>time_limit</code></td><td>制限時間（秒）。0 = 無制限</td></tr>
<tr><td><code>target_energy</code></td><td>この値以下の解が出たら停止</td></tr>
<tr><td><code>topk_sols</code></td><td>上位 k 個の解を保持</td></tr>
<tr><td><code>best_energy_sols</code></td><td>最良エネルギーの解を保持（0 = 個数上限なし）</td></tr>
<tr><td><code>enable_default_callback</code></td><td>新しい最良解を標準エラーに表示（0/1）</td></tr>
</table>
<p><b>ExhaustiveSolver</b>（全探索のため <code>time_limit</code> はありません）</p>
<table>
<tr><th>オプション</th><th>意味</th></tr>
<tr><td><code>target_energy</code></td><td>早期終了用の目標エネルギー</td></tr>
<tr><td><code>best_energy_sols</code></td><td>すべての最適解を保持（0/1）</td></tr>
<tr><td><code>all_sols</code></td><td>すべての実行可能解を保持（0/1）</td></tr>
</table>

<h3>整数型の選択</h3>
<p>プログラム先頭でマクロ指定します（無指定なら <code>c32e64</code>）。</p>
<pre><code>#define INTEGER_TYPE_CPP_INT   // 任意精度（大きな整数）
#include &lt;qbpp/qbpp.hpp&gt;</code></pre>
<table>
<tr><th>マクロ</th><th>係数 / エネルギー</th></tr>
<tr><td>（無指定）</td><td>int32 / int64（既定）</td></tr>
<tr><td><code>INTEGER_TYPE_C32E32</code></td><td>int32 / int32</td></tr>
<tr><td><code>INTEGER_TYPE_C64E64</code></td><td>int64 / int64</td></tr>
<tr><td><code>INTEGER_TYPE_C64E128</code></td><td>int64 / int128</td></tr>
<tr><td><code>INTEGER_TYPE_C128E128</code></td><td>int128 / int128</td></tr>
<tr><td><code>INTEGER_TYPE_CPP_INT</code></td><td>任意精度</td></tr>
</table>

<h3>変数・式・制約</h3>
<ul>
<li>変数: <code>auto x = qbpp::var("x", n);</code>（バイナリ配列）、<code>auto y = 0 &lt;= qbpp::var_int("y") &lt;= 5;</code>（整数変数）</li>
<li>式: <code>qbpp::sum(x)</code>, <code>qbpp::vector_sum(x, axis)</code>, <code>qbpp::sqr(e)</code></li>
<li>制約（<code>qbpp::cons()</code> で囲むと制約として宣言され、ソルバーが充足解を効率よく探索）: <code>qbpp::cons(e == n)</code> / <code>qbpp::cons(e &lt;= n)</code> / <code>qbpp::cons(lo &lt;= e &lt;= hi)</code>。重みはスカラー係数で: <code>obj + 100 * qbpp::cons(e == n)</code></li>
<li>配列の制約（要素ごとに1本）: <code>qbpp::cons(rows == c)</code> / <code>qbpp::cons(rows &lt;= hi)</code> / <code>qbpp::cons(lo &lt;= rows &lt;= hi)</code>（<code>c, lo, hi</code> は <code>qbpp::array({...})</code>）</li>
<li>ソルバーに渡す前に <code>f.simplify_as_binary();</code> で QUBO/HUBO 形へ簡約。</li>
</ul>

<h3>制限事項</h3>
<ul>
<li>実行時間・メモリ・短時間あたりのリクエスト数に上限があります。</li>
<li>ネットワークアクセスや外部ソルバーは利用できません。</li>
</ul>
`,
    en: `
<h3>What is QUBO++ Playground</h3>
<p>Write QUBO++ (C++) programs in your browser, <b>Compile</b> them, and <b>Run</b> them. Compilation and execution happen in the cloud (CPU only).</p>

<h3>Basic workflow</h3>
<ul>
<li>Pick a sample (Simple / N-Queens / Knapsack ...) from the dropdown and click <b>Load</b>.</li>
<li><b>Compile</b> (Ctrl+B) → <b>Run</b> (Ctrl+R).</li>
<li>Use the <code>args</code> field for command-line arguments (<code>argv</code>), e.g. the board size for N-Queens.</li>
<li><b>Save</b> stores your source; <b>Load</b> (with "Local File" selected) opens a local file.</li>
</ul>

<h3>Supported solvers</h3>
<ul>
<li><code>qbpp::easy_solver::EasySolver</code> — heuristic search (bit-flip + tabu). Finds one good solution fast.</li>
<li><code>qbpp::exhaustive_solver::ExhaustiveSolver</code> — brute-force enumeration. Exact, for small problems (up to a few dozen variables).</li>
</ul>
<p>Both run on <b>CPU</b> (no GPU in this environment). ABS3Solver and external MILP solvers are not available.</p>

<h3>search() options</h3>
<p>Pass options as <code>solver.search({{"key", value}, ...})</code>.</p>
<p><b>EasySolver</b></p>
<table>
<tr><th>Option</th><th>Meaning</th></tr>
<tr><td><code>time_limit</code></td><td>Time limit in seconds. 0 = unlimited</td></tr>
<tr><td><code>target_energy</code></td><td>Stop once a solution with energy ≤ this is found</td></tr>
<tr><td><code>topk_sols</code></td><td>Keep the top-k solutions</td></tr>
<tr><td><code>best_energy_sols</code></td><td>Keep best-energy solutions (0 = no count limit)</td></tr>
<tr><td><code>enable_default_callback</code></td><td>Print each new best solution to stderr (0/1)</td></tr>
</table>
<p><b>ExhaustiveSolver</b> (no <code>time_limit</code> — it enumerates everything)</p>
<table>
<tr><th>Option</th><th>Meaning</th></tr>
<tr><td><code>target_energy</code></td><td>Target energy for early termination</td></tr>
<tr><td><code>best_energy_sols</code></td><td>Keep all optimal solutions (0/1)</td></tr>
<tr><td><code>all_sols</code></td><td>Keep all feasible solutions (0/1)</td></tr>
</table>

<h3>Choosing the integer type</h3>
<p>Select with a macro at the top of the program (default is <code>c32e64</code>).</p>
<pre><code>#define INTEGER_TYPE_CPP_INT   // arbitrary precision (large integers)
#include &lt;qbpp/qbpp.hpp&gt;</code></pre>
<table>
<tr><th>Macro</th><th>coeff / energy</th></tr>
<tr><td>(none)</td><td>int32 / int64 (default)</td></tr>
<tr><td><code>INTEGER_TYPE_C32E32</code></td><td>int32 / int32</td></tr>
<tr><td><code>INTEGER_TYPE_C64E64</code></td><td>int64 / int64</td></tr>
<tr><td><code>INTEGER_TYPE_C64E128</code></td><td>int64 / int128</td></tr>
<tr><td><code>INTEGER_TYPE_C128E128</code></td><td>int128 / int128</td></tr>
<tr><td><code>INTEGER_TYPE_CPP_INT</code></td><td>arbitrary precision</td></tr>
</table>

<h3>Variables, expressions, constraints</h3>
<ul>
<li>Variables: <code>auto x = qbpp::var("x", n);</code> (binary array), <code>auto y = 0 &lt;= qbpp::var_int("y") &lt;= 5;</code> (integer)</li>
<li>Expressions: <code>qbpp::sum(x)</code>, <code>qbpp::vector_sum(x, axis)</code>, <code>qbpp::sqr(e)</code></li>
<li>Constraints (wrap in <code>qbpp::cons()</code> to declare; the solvers search for solutions that satisfy them): <code>qbpp::cons(e == n)</code> / <code>qbpp::cons(e &lt;= n)</code> / <code>qbpp::cons(lo &lt;= e &lt;= hi)</code>. Weights are scalar coefficients: <code>obj + 100 * qbpp::cons(e == n)</code></li>
<li>Array constraints (one per element): <code>qbpp::cons(rows == c)</code> / <code>qbpp::cons(rows &lt;= hi)</code> / <code>qbpp::cons(lo &lt;= rows &lt;= hi)</code> (where <code>c, lo, hi</code> are <code>qbpp::array({...})</code>)</li>
<li>Call <code>f.simplify_as_binary();</code> to reduce to QUBO/HUBO form before solving.</li>
</ul>

<h3>Limitations</h3>
<ul>
<li>Execution time, memory, and request rate are capped.</li>
<li>No network access and no external solvers.</li>
</ul>
`
  };

  const overlay = document.getElementById("help-overlay");
  const contentEl = document.getElementById("help-content");
  const titleEl = document.getElementById("help-title");
  const btnHelp = document.getElementById("btn-help");
  const btnClose = document.getElementById("help-close");
  const btnJa = document.getElementById("help-lang-ja");
  const btnEn = document.getElementById("help-lang-en");
  if (!overlay || !btnHelp) return;

  let lang = localStorage.getItem("qbpp-help-lang");
  if (lang !== "ja" && lang !== "en") {
    lang = (navigator.language || "en").toLowerCase().startsWith("ja") ? "ja" : "en";
  }

  function render() {
    contentEl.innerHTML = HELP[lang];
    titleEl.textContent = lang === "ja" ? "使い方" : "Usage";
    btnJa.classList.toggle("active", lang === "ja");
    btnEn.classList.toggle("active", lang === "en");
    contentEl.scrollTop = 0;
  }
  function setLang(l) { lang = l; localStorage.setItem("qbpp-help-lang", l); render(); }
  function openHelp() { render(); overlay.style.display = "flex"; }
  function closeHelp() { overlay.style.display = "none"; }

  btnHelp.addEventListener("click", openHelp);
  btnClose.addEventListener("click", closeHelp);
  btnJa.addEventListener("click", () => setLang("ja"));
  btnEn.addEventListener("click", () => setLang("en"));
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeHelp(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.style.display !== "none") closeHelp();
  });
})();
