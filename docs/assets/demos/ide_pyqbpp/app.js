/* Generated from demos/ide_pyqbpp/app.js by demos/sync_docs_demos.py. Do not edit. */
// PyQBPP Playground - Frontend Logic

"use strict";
// Solver endpoint. Empty = same origin (Lambda-served page, local server.py);
// the docs page (qubo-plus.github.io) sets window.QBPP_DEMO_API to the Lambda URL.
const API_BASE = (window.QBPP_DEMO_API || "").replace(/\/$/, "");

// -- Template programs -------------------------------------------------------

const TEMPLATES = {
  simple: {
    name: "Simple",
    desc: "Find binary a, b, c satisfying a+2b+3c=3",
    source: `# Simple equation: Find binary variables a, b, c satisfying a + 2b + 3c = 3.
#
# QUBO formulation:
#   Variables: a, b, c in {0, 1}
#   Constraint: a + 2b + 3c == 3 (declared with qbpp.cons())
#
# Demonstrates two solvers:
#   EasySolver       -- heuristic bit-flip + tabu search (finds one solution)
#   ExhaustiveSolver -- brute-force enumeration (finds all optimal solutions)

import pyqbpp as qbpp

# Create binary variables
a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")

# Wrapping the equality in qbpp.cons() declares it as a constraint.
# The bundled solvers search for solutions satisfying declared constraints.
f = qbpp.cons(a + 2 * b + 3 * c == 3)
f.simplify_as_binary()
print(f"constraints:\\n{f.cons()}")

# EasySolver: heuristic search (finds one solution quickly)
easy_solver = qbpp.EasySolver(f)
sol = easy_solver.search(time_limit=10, target_energy=0)
print(f"\\nEasySolver:")
print(f"  a={sol(a)}, b={sol(b)}, c={sol(c)}, energy={sol.energy}")

# ExhaustiveSolver: enumerate all optimal solutions (feasible for small problems)
exhaustive_solver = qbpp.ExhaustiveSolver(f)
result = exhaustive_solver.search(best_energy_sols=0)
print(f"\\nExhaustiveSolver: {len(result.sols)} optimal solutions")
for sol in result.sols:
    print(f"  a={sol(a)}, b={sol(b)}, c={sol(c)}, energy={sol.energy}")
`,
  },

  partitioning: {
    name: "Partition Problem",
    desc: "Split a set of integers into two subsets minimizing the difference of sums",
    source: `# Partition Problem: Split a set of integers into two subsets P and Q
# so that the difference of their sums is minimized.
#
# QUBO formulation:
#   Variables: x[i] in {0, 1} -- assigns w[i] to subset P (1) or Q (0)
#   Objective: minimize (sum_P - sum_Q)^2

import pyqbpp as qbpp

# Input: a set of integers to partition
w = [64, 27, 47, 74, 12, 83, 63, 40]

# Binary variables: x[i] = 1 assigns w[i] to subset P, 0 to subset Q
x = qbpp.var("x", shape=len(w))

# Sum of each subset as symbolic expressions
p = 0  # sum of P
q = 0  # sum of Q
for i in range(len(w)):
    p += w[i] * x[i]
    q += w[i] * ~x[i]

# Objective: minimize (p - q)^2
# f >= 0, and f == 0 iff the two subsets have equal sums.
f = qbpp.sqr(p - q)

# Alternatively, using qbpp.sum and the == operator:
#   p = qbpp.sum(w * x)
#   q = qbpp.sum(w * ~x)
#   f = (p - q == 0)

print(f"f = {f.simplify_as_binary()}")

# ExhaustiveSolver: find the optimal partition (feasible for 8 variables)
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()

# Display results
print(f"\\nSolution: energy={sol.energy}")
print(f"f(sol) = {sol(f)}")
print(f"p(sol) = {sol(p)}")
print(f"q(sol) = {sol(q)}")

print("P:", end="")
for i in range(len(w)):
    if sol(x[i]) == 1:
        print(f" {w[i]}", end="")
print()

print("Q:", end="")
for i in range(len(w)):
    if sol(x[i]) == 0:
        print(f" {w[i]}", end="")
print()
`,
  },

  knapsack: {
    name: "Knapsack",
    desc: "Select items to maximize value without exceeding capacity",
    source: `# 0/1 Knapsack Problem: Select items to maximize total value
# without exceeding the knapsack capacity.
#
# QUBO formulation:
#   Variables: x[i] in {0, 1} -- whether item i is selected
#   Objective: maximize sum of v[i] * x[i]
#   Constraint: sum of w[i] * x[i] <= capacity (declared with qbpp.cons())

import pyqbpp as qbpp

# 10 items with weights and values, capacity = 50
w = [10, 20, 30, 5, 8, 15, 12, 7, 17, 18]
v = [60, 100, 120, 60, 80, 150, 110, 70, 150, 160]
capacity = 50

# Binary variables: x[i] = 1 means item i is selected
x = qbpp.var("x", shape=len(w))

# Constraint: total weight must not exceed capacity.
# Wrapping the range in qbpp.cons() declares it as a constraint;
# the bundled solvers search for solutions satisfying it.
constraint = qbpp.cons((0 <= qbpp.sum(w * x)) & (qbpp.same <= capacity))

# Objective: total value (to be maximized)
objective = qbpp.sum(v * x)

# Negate objective (QUBO minimizes) and add the weighted constraint.
f = -objective + 1000 * constraint
f.simplify_as_binary()

# ExhaustiveSolver: enumerate all optimal solutions (feasible for 10 variables)
solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)

# Display results: sol(constraint.body) evaluates the body of the constraint
# (i.e., the total weight expression).
for i, sol in enumerate(result.sols):
    print(f"[Solution {i}]")
    print(f"  Total weight = {sol(constraint.body)} / {capacity}")
    print(f"  Total value  = {sol(objective)}")
    print("  Items:", end="")
    for j in range(len(w)):
        if sol(x[j]) == 1:
            print(f" {j}(w={w[j]},v={v[j]})", end="")
    print()
`,
  },

  nqueens: {
    name: "N-Queens",
    desc: "Place N queens on an NxN board with no attacks (default N=8, args: N)",
    source: `# N-Queens Problem: Place N queens on an N x N chessboard so that
# no two queens attack each other (share a row, column, or diagonal).
#
# QUBO formulation:
#   Variables: x[i][j] in {0, 1} -- whether a queen is at row i, column j
#   Constraints:
#     Row:      exactly one queen per row      (vector_sum along axis 0 == 1)
#     Column:   exactly one queen per column   (vector_sum along axis 1 == 1)
#     Diagonal: at most one queen per diagonal (diag_sum <= 1)
#
# Usage: python source.py [N]  (default: N=8)

import pyqbpp as qbpp
import sys

n = int(sys.argv[1]) if len(sys.argv) >= 2 else 8

# Binary variables: x[i][j] = 1 places a queen at row i, column j
x = qbpp.var("x", shape=(n, n))

# Row and column constraints: exactly one queen per row/column.
# vector_sum(x, axis=0) sums along axis 0 (rows) giving column sums.
# vector_sum(x, axis=1) sums along axis 1 (columns) giving row sums.
# qbpp.cons() declares one constraint per array element; the bundled
# solvers search for solutions satisfying all declared constraints.
f = qbpp.cons(qbpp.vector_sum(x, axis=0) == 1) + qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)

# Diagonal constraints: at most one queen per diagonal.
m = 2 * n - 3
a = [0] * m  # sums of each anti-diagonal
b = [0] * m  # sums of each diagonal

for i in range(m):
    k = i + 1
    for r in range(n):
        c = k - r
        if 0 <= c < n:
            a[i] += x[r][c]
    d = i - (n - 2)
    for r in range(n):
        c = r + d
        if 0 <= c < n:
            b[i] += x[r][c]

# qbpp.cons(e, between=(None, 1)) declares the one-sided constraint e <= 1.
for i in range(m):
    f += qbpp.cons(a[i], between=(None, 1))
    f += qbpp.cons(b[i], between=(None, 1))

f.simplify_as_binary()

# EasySolver: heuristic search, stop early when energy 0 (all constraints met)
solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=0)

# Display the board
print(f"Energy: {sol.energy}")
for i in range(n):
    row = ""
    for j in range(n):
        row += "Q " if sol(x[i][j]) else ". "
    print(row)
`,
  },

  ilp: {
    name: "Integer Linear Programming",
    desc: "Solve an ILP problem with native integer variables",
    source: `# Integer Linear Programming (ILP): Solve an ILP problem with native
# integer variables and declared constraints.
#
# Formulation:
#   Variables: x[0], x[1], x[2] in {0, 1, ..., 5} (native integer)
#   Objective: maximize 2*x[0] + 5*x[1] + 5*x[2]
#   Constraints:
#     x[0] + 3*x[1] +   x[2] <= 12
#     x[0]           + 2*x[2] <=  5
#            x[1]    +   x[2] <=  4

import pyqbpp as qbpp

# Native integer variables with bounds: 0 <= x[i] <= 5.
# var("x", shape=3, integer=(0, 5)) keeps them as integers — the solvers
# search integer values directly (no binary encoding).
x = qbpp.var("x", shape=3, integer=(0, 5))

# Objective: maximize 2*x[0] + 5*x[1] + 5*x[2]
objective = 2 * x[0] + 5 * x[1] + 5 * x[2]

# Constraints: qbpp.cons(e, between=(None, hi)) declares e <= hi as a
# constraint; the bundled solvers search for solutions satisfying them.
c1 = qbpp.cons(x[0] + 3 * x[1] + x[2], between=(None, 12))
c2 = qbpp.cons(x[0] + 2 * x[2], between=(None, 5))
c3 = qbpp.cons(x[1] + x[2], between=(None, 4))

# Negate objective (QUBO minimizes) and add the constraints.
# Multiplying by a positive scalar (100) scales all constraint weights.
f = -objective + 100 * (c1 + c2 + c3)
f.simplify_as_binary()

# EasySolver: heuristic search with 1-second time limit
solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)

# Display results
print(f"x[0] = {sol(x[0])}, x[1] = {sol(x[1])}, x[2] = {sol(x[2])}")
print(f"Objective = {sol(objective)}")

# sol(c.body) evaluates the body of the constraint (the constrained expression).
# Equivalent to sol(c1.body()) in C++ QUBO++.
print(f"x[0]+3*x[1]+x[2] = {sol(c1.body)}, "
      f"x[0]+2*x[2] = {sol(c2.body)}, "
      f"x[1]+x[2] = {sol(c3.body)}")
`,
  },

  factorization: {
    name: "Factorization",
    desc: "Factorize N into p * q (default N=15, args: N or p q)",
    source: `# Integer Factorization: Find factors p, q such that p * q = N.
#
# QUBO formulation:
#   Variables: p in [2, sqrt(N)], q in [sqrt(N), N-1] (native integer)
#   Constraint: p * q == N (declared with qbpp.cons();
#               nonlinear equality constraints are supported)
#
# Native integer search factors 8-digit semiprimes in seconds
# (try: python source.py 99400891).
#
# Uses arbitrary-precision integers (cppint variant) for large N.
#
# Usage: python source.py [N]        (factorize N, default: N=15)
#        python source.py [p] [q]    (factorize p*q)

import pyqbpp.cppint as qbpp
import sys

# Parse command-line arguments: N (single integer) or p q (two factors)
N = 15
if len(sys.argv) >= 3:
    N = int(sys.argv[1]) * int(sys.argv[2])
elif len(sys.argv) == 2:
    N = int(sys.argv[1])

# Compute integer square root of N to bound the smaller factor.
sqrtN = 1
while (sqrtN + 1) * (sqrtN + 1) <= N:
    sqrtN += 1

# Integer variables with restricted ranges:
#   p in [2, sqrtN], q in [sqrtN, N-1]
# This ensures p <= q without an explicit constraint, reducing search space.
p = qbpp.var("p", integer=(2, sqrtN))
q = qbpp.var("q", integer=(sqrtN, N - 1))

# Constraint: p * q == N, declared with qbpp.cons().
# The bundled solvers search for solutions satisfying the constraint.
f = qbpp.cons(p * q == N)
f.simplify_as_binary()

# EasySolver: heuristic search, stop early when energy 0 (factorization found)
solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=10, target_energy=0)

# Display result
print(f"Energy: {sol.energy}")
p_val, q_val = sol(p), sol(q)
result = f"{p_val} * {q_val} = {p_val * q_val}"
if p_val * q_val != N:
    result += f" != {N}"
print(result)
`,
  },

  cutting_stock: {
    name: "Cutting Stock",
    desc: "Find a feasible cutting plan for bar stock (default M=6 bars, args: M)",
    source: `# Cutting Stock Problem: Given M bars of length L and N order types with
# lengths and required counts, find a feasible cutting plan
# that fulfills all orders without exceeding bar lengths.
#
# QUBO formulation:
#   Variables: x[i][j] in {0, ..., c[j]} -- number of items of order j from bar i
#   Constraints:
#     Order:    sum over bars i of x[i][j] == c[j] for each order j
#     Capacity: sum of x[i][j] * lengths[j] <= L for each bar i
#
# Usage: python source.py [M]  (default: M=6)

import pyqbpp as qbpp
import sys

L = 60       # Length of each bar
M = int(sys.argv[1]) if len(sys.argv) > 1 else 6  # Number of bars
lengths = [13, 23, 8, 11]   # Lengths of each order type
c = [10, 4, 8, 6]           # Required counts
N = len(lengths)

# Native integer variables: x[i][j] = number of items of order j cut from
# bar i, with per-element bounds 0 <= x[i][j] <= c[j]. A list as the upper
# bound of integer= gives each element its own range (the flat list is
# row-major, so the per-order caps repeat for each bar).
x = qbpp.var("x", shape=(M, N), integer=(0, c * M))

# Order constraint: each order j must be fulfilled exactly.
# vector_sum(x, axis=0) sums along axis 0 (bars), giving fulfilled[j] for each j.
# qbpp.cons() declares one constraint per array element (compared against
# the required-count list c); the bundled solvers search for solutions
# satisfying all declared constraints.
fulfilled = qbpp.vector_sum(x, axis=0)
order_constraint = qbpp.cons(fulfilled == c)

# Capacity constraint: each bar i must not exceed length L.
# qbpp.cons(e, between=(0, L)) declares the range constraint 0 <= e <= L.
used = []
bar_constraint = 0
for i in range(M):
    used.append(qbpp.sum(x[i] * lengths))
    bar_constraint += qbpp.cons(used[i], between=(0, L))

# Energy 0 means all constraints are satisfied.
f = order_constraint + bar_constraint
f.simplify_as_binary()

# EasySolver: heuristic search, stop early when energy 0 (feasible plan found)
solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=10.0, target_energy=0)

# Display results
print(f"Energy: {sol.energy}")
for i in range(M):
    print(f"Bar {i}:", end="")
    for j in range(N):
        print(f"  {sol(x[i][j])}", end="")
    print(f"  (used={sol(used[i])}, waste={L - sol(used[i])})")
for j in range(N):
    print(f"Order {j}: fulfilled={sol(fulfilled[j])}, required={c[j]}")
`,
  },

  max_matching: {
    name: "Maximum Matching",
    desc: "Find the largest set of edges without common vertices (16 vertices, 27 edges)",
    source: `# Maximum Matching: Given a graph, find the largest set of edges
# such that no two edges share a vertex.
#
# QUBO formulation:
#   Variables: x[i] in {0, 1} -- whether edge i is in the matching
#   Objective: maximize sum of x[i] (number of matched edges)
#   Constraint: x[i] * x[j] = 0 for all pairs of edges sharing a vertex

import pyqbpp as qbpp

# Graph represented as an edge list (16 vertices, 27 edges)
edges = [
    (0, 1),   (0, 2),   (1, 3),   (1, 4),   (2, 5),   (2, 6),   (3, 7),
    (3, 13),  (4, 6),   (4, 7),   (4, 14),  (5, 8),   (6, 8),   (6, 12),
    (6, 14),  (7, 14),  (8, 9),   (9, 10),  (9, 12),  (10, 11), (10, 12),
    (11, 13), (11, 15), (12, 14), (12, 15), (13, 15), (14, 15),
]
M = len(edges)
N = 16  # Number of vertices

# Binary variables: x[i] = 1 means edge i is in the matching
x = qbpp.var("x", shape=M)

# Objective: maximize the number of matched edges
objective = qbpp.sum(x)

# Constraint: no two edges in the matching can share a vertex.
# For each pair of edges sharing a vertex, add x[i]*x[j] as a penalty.
constraint = 0
for i in range(M):
    for j in range(i + 1, M):
        if (edges[i][0] == edges[j][0] or edges[i][0] == edges[j][1] or
            edges[i][1] == edges[j][0] or edges[i][1] == edges[j][1]):
            constraint += x[i] * x[j]

# Negate objective (QUBO minimizes) and add penalty for constraint.
# The penalty weight (2) ensures that violating a constraint costs more
# than the benefit of including one extra edge.
f = -objective + 2 * constraint
f.simplify_as_binary()

# EasySolver: heuristic search, stop early at energy -N/2 (perfect matching)
solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=10, target_energy=-N // 2)

# Display results
print(f"Energy = {sol.energy}")
print("Maximum matching:", end="")
count = 0
for i in range(M):
    if sol(x[i]):
        print(f" ({edges[i][0]}, {edges[i][1]})", end="")
        count += 1
print()
print(f"Matching size = {count}")
`,
  },

  tsp: {
    name: "Traveling Salesman",
    desc: "Find the shortest tour visiting all cities exactly once (9 cities)",
    source: `# Traveling Salesman Problem (TSP): Find the shortest closed tour
# visiting all cities exactly once.
#
# QUBO formulation (one-hot matrix):
#   Variables: x[i][j] in {0, 1} -- whether position i in the tour visits city j
#   Objective: minimize total tour distance
#   Constraints:
#     Row:    each position visits exactly one city (vector_sum along axis 0 == 1)
#     Column: each city is visited exactly once    (vector_sum along axis 1 == 1)
#
# Distances are kept as exact doubles (no rounding). Importing pyqbpp.d makes
# coefficients and energy float; PyQBPP automatically quantizes them to the
# integer solver and returns the energy as a float.

import pyqbpp.d as qbpp
import math

# City coordinates and Euclidean distance
coords = [
    (10, 12), (33, 125), (12, 226), (121, 11), (108, 142),
    (111, 243), (220, 4), (210, 113), (211, 233),
]
n = len(coords)

def dist(i, j):
    dx = coords[i][0] - coords[j][0]
    dy = coords[i][1] - coords[j][1]
    return math.sqrt(dx * dx + dy * dy)   # exact Euclidean distance (no rounding)

# Binary variables: x[i][j] = 1 means position i in the tour visits city j
x = qbpp.var("x", shape=(n, n))

# Constraints: each row and column sums to 1, declared with qbpp.cons()
# (one constraint per array element; qbpp.sum() is not needed).
# This ensures each position has one city and each city is visited once.
constraint = qbpp.cons(qbpp.vector_sum(x, axis=0) == 1) + qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)

# Objective: total tour distance.
# For consecutive positions (i, next), sum dist(j, k) * x[i][j] * x[next][k]
# over all city pairs (j, k) with j != k.
objective = 0
for i in range(n):
    next_pos = (i + 1) % n
    for j in range(n):
        for k in range(n):
            if k != j:
                objective += dist(j, k) * x[i][j] * x[next_pos][k]

# Combine the objective and the weighted constraints.
# Multiplying by a positive scalar (1000) scales all constraint weights.
f = objective + 1000 * constraint
f.simplify_as_binary()

# EasySolver: heuristic search with 1-second time limit
solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)

# Extract tour from one-hot matrix
tour = []
for i in range(n):
    for j in range(n):
        if sol(x[i][j]):
            tour.append(j)
            break

# Display results
print("Tour:", end="")
total_dist = 0
for i in range(n):
    cx, cy = coords[tour[i]]
    print(f" {tour[i]}({cx},{cy})", end="")
    total_dist += dist(tour[i], tour[(i + 1) % n])
print()
print(f"Total distance = {total_dist}")
`,
  },

  sqrt: {
    name: "Square Root",
    desc: "Compute the integer square root of c (default c=2, args: c in 1..100)",
    source: `# Square Root: Compute an approximation of sqrt(c) with 20-digit precision.
#
# Since PyQBPP handles only integers, we compute sqrt(c * s^2) where s = 10^20.
# Then sqrt(c) ≈ sqrt(c * s^2) / s.
#
# HUBO formulation:
#   Variable: x in [s, c*s] (native integer)
#   Objective: minimize (x^2 - c*s^2)^2
#
# The equality constraint x^2 == c*s^2 has no exact integer solution
# (unless c is a perfect square), so the solver minimizes the error.
#
# Usage: python program.py [c]  (default: c=2, range: 1..100)
import sys
import pyqbpp.cppint as qbpp  # arbitrary-precision integers needed

c = 2
if len(sys.argv) >= 2:
    c = int(sys.argv[1])
if c < 1 or c > 100:
    print("c must be between 1 and 100", file=sys.stderr)
    sys.exit(1)

s = 10**20
x = qbpp.var("x", integer=(s, c * s))
f = (x * x == c * s * s)
f.simplify_as_binary()

# Native integer search reaches the exact 20-digit floor(sqrt)
# in about a second.
solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)
xv = sol(x)

print(f"sqrt({c}) ≈ {xv} / {s}")
print(f"       = {xv // s}.{xv % s}")
print(f"Energy = {sol.energy}")
`,
  },
};

// -- State -------------------------------------------------------------------

let editor = null;
let isRunning = false;
let runCooldownUntil = 0;
const COOLDOWN_MS = 3000;
let currentFileName = "";
let maxLines = 0;

// -- DOM refs ----------------------------------------------------------------

const $ = (id) => document.getElementById(id);

const btnRun = $("btn-run");
const btnLoad = $("btn-load");
const btnSave = $("btn-save");
const btnTheme = $("btn-theme");
const templateSelect = $("template-select");
const outputContent = $("output-content");
const statusText = $("status-text");
const statusLines = $("status-lines");
const statusBar = $("status-bar");
const lineInfo = $("line-info");
const resizeHandle = $("resize-handle");
const fileInput = $("file-input");
const runArgs = $("run-args");

// -- Theme -------------------------------------------------------------------

function getTheme() {
  return document.documentElement.getAttribute("data-theme") || "dark";
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("pyqbpp-ide-theme", theme);
  btnTheme.textContent = theme === "dark" ? "\u263C" : "\u263E";
  if (editor) {
    monaco.editor.setTheme(theme === "dark" ? "vs-dark" : "vs");
  }
}

btnTheme.addEventListener("click", () => {
  setTheme(getTheme() === "dark" ? "light" : "dark");
});

// -- Output ------------------------------------------------------------------

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

// -- Line count --------------------------------------------------------------

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

// -- Monaco Editor -----------------------------------------------------------

function initEditor() {
  require.config({
    paths: {
      vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs",
    },
  });

  require(["vs/editor/editor.main"], function () {
    const savedTheme = localStorage.getItem("pyqbpp-ide-theme") || "dark";
    setTheme(savedTheme);

    editor = monaco.editor.create($("editor"), {
      value: "",
      language: "python",
      theme: savedTheme === "dark" ? "vs-dark" : "vs",
      fontSize: 14,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 4,
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
      id: "run",
      label: "Run",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR],
      run: () => {
        if (isRunning) {
          stopRun();
        } else {
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

// -- Load helper -------------------------------------------------------------

function loadTemplate(key) {
  const tmpl = TEMPLATES[key];
  if (tmpl && editor) {
    editor.setValue(tmpl.source);
    currentFileName = "";
    clearOutput();
    appendOutput(`Template: ${tmpl.name}\n`, "output-info");
    appendOutput(`${tmpl.desc}\n`, "output-info");
    monaco.editor.setModelMarkers(editor.getModel(), "python", []);
  }
}

// -- Cooldown ----------------------------------------------------------------

function startRunCooldown(ms) {
  runCooldownUntil = Date.now() + ms;
  const tick = () => {
    const sec = Math.ceil((runCooldownUntil - Date.now()) / 1000);
    if (sec <= 0) {
      btnRun.textContent = "Run";
      btnRun.disabled = false;
      return;
    }
    btnRun.textContent = `Wait ${sec}s`;
    btnRun.disabled = true;
    setTimeout(tick, 500);
  };
  tick();
}

// -- Run ---------------------------------------------------------------------

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

async function doRun() {
  if (isRunning) return;
  if (Date.now() < runCooldownUntil) return;

  const source = editor.getValue();
  if (!source.trim()) {
    appendOutput("Error: Empty source code\n", "output-error");
    return;
  }

  isRunning = true;
  runStopped = false;
  runAbortController = new AbortController();
  btnRun.textContent = "Stop";
  btnRun.disabled = false;
  clearOutput();
  setStatus("Running...", "");

  // Clear previous error markers
  monaco.editor.setModelMarkers(editor.getModel(), "python", []);

  const runStart = Date.now();
  const runTimer = setInterval(() => {
    const elapsed = ((Date.now() - runStart) / 1000).toFixed(1);
    if (isRunning) setStatus(`Running... [${elapsed}s]`, "");
  }, 100);

  let stderrText = "";

  try {
    const resp = await fetch(API_BASE + "/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source,
        timeout: 60,
        args: runArgs.value.trim(),
      }),
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
      // NDJSON streaming mode (Lambda)
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
              const event = JSON.parse(line);
              if (event.type === "stderr") stderrText += event.text;
              processEvents([event]);
            } catch (_) {}
          }
        }
      } finally {
        reader.releaseLock();
      }

      if (buffer.trim()) {
        try {
          const event = JSON.parse(buffer);
          if (event.type === "stderr") stderrText += event.text;
          processEvents([event]);
        } catch (_) {}
      }

      if (runStopped) {
        appendOutput("\nProcess stopped by user\n", "output-warning");
        setStatus("Stopped", "");
      }
    } else {
      // JSON mode (local server polling)
      const data = await resp.json();

      if (data.started) {
        while (!runStopped) {
          await new Promise((r) => setTimeout(r, 100));
          try {
            const outResp = await fetch(API_BASE + "/run/output");
            const outData = await outResp.json();
            for (const event of outData.events) {
              if (event.type === "stderr") stderrText += event.text;
            }
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
    if (err.name !== "AbortError") {
      appendOutput("Network error: " + err.message + "\n", "output-error");
      setStatus("Network error", "error");
    }
  } finally {
    clearInterval(runTimer);
    isRunning = false;
    runStopped = false;
    runAbortController = null;
    btnRun.textContent = "Run";
    startRunCooldown(COOLDOWN_MS);
    parseAndSetMarkers(stderrText);
  }
}

// -- Error marker parsing ----------------------------------------------------

function parseAndSetMarkers(errorText) {
  if (!editor || !errorText) return;

  const markers = [];

  // Match Python traceback format: File "source.py", line N
  const regex = /File "source\.py", line (\d+)/g;
  let match;
  while ((match = regex.exec(errorText)) !== null) {
    const line = parseInt(match[1], 10);
    markers.push({
      severity: monaco.MarkerSeverity.Error,
      startLineNumber: line,
      startColumn: 1,
      endLineNumber: line,
      endColumn: 1000,
      message: "Error occurred here",
    });
  }

  // Also match SyntaxError with line number
  const syntaxRegex = /SyntaxError:.*line (\d+)/g;
  while ((match = syntaxRegex.exec(errorText)) !== null) {
    const line = parseInt(match[1], 10);
    const exists = markers.some((m) => m.startLineNumber === line);
    if (!exists) {
      markers.push({
        severity: monaco.MarkerSeverity.Error,
        startLineNumber: line,
        startColumn: 1,
        endLineNumber: line,
        endColumn: 1000,
        message: "SyntaxError",
      });
    }
  }

  // Extract the last error message line for better marker messages
  const errorLines = errorText.split("\n");
  const lastError = errorLines.filter((l) => l && !l.startsWith(" ") && !l.startsWith("Traceback")).pop();
  if (lastError && markers.length > 0) {
    markers[markers.length - 1].message = lastError.trim();
  }

  if (markers.length > 0) {
    monaco.editor.setModelMarkers(editor.getModel(), "python", markers);
    editor.revealLineInCenter(markers[0].startLineNumber);
    editor.setPosition({
      lineNumber: markers[0].startLineNumber,
      column: 1,
    });
  }
}

// -- Resize handle -----------------------------------------------------------

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

// -- Button event listeners --------------------------------------------------

btnRun.addEventListener("click", () => {
  if (isRunning) {
    stopRun();
  } else {
    doRun();
  }
});

// -- Load / Save -------------------------------------------------------------

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
      currentFileName = file.name;
      clearOutput();
      appendOutput(`Loaded: ${file.name}\n`, "output-info");
      monaco.editor.setModelMarkers(editor.getModel(), "python", []);
    }
  };
  reader.readAsText(file);
  fileInput.value = "";
});

// Save via parent postMessage (for cross-origin iframe)
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
    _saveAckResolve = (acked) => {
      _saveAckResolve = null;
      if (!acked) { resolve({ error: "unsupported" }); return; }
      _saveResultResolve = resolve;
    };
    window.parent.postMessage({ type: "save-file", content: source, name }, "*");
    setTimeout(() => { if (_saveAckResolve) { _saveAckResolve(false); _saveAckResolve = null; } }, 2000);
  });
}

let _isSaving = false;

btnSave.addEventListener("click", async () => {
  if (!editor || _isSaving) return;
  _isSaving = true;
  try {
  const source = editor.getValue();
  const name = currentFileName || "source.py";

  if (_inIframe) {
    const result = await _saveViaParent(source, name);
    if (result.ok) {
      currentFileName = result.name;
      appendOutput(`Saved: ${result.name}\n`, "output-info");
      return;
    }
    if (result.cancelled) return;
    appendOutput("Save is not supported in this context.\n", "output-warning");
    return;
  }

  if (!_inIframe && window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: name,
        types: [{
          description: "Python Source",
          accept: { "text/plain": [".py"] },
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

// -- Global keyboard shortcuts -----------------------------------------------

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

// -- Initialize --------------------------------------------------------------

fetch(API_BASE + "/config").then(r => r.json()).then(data => {
  if (data.max_lines) { maxLines = data.max_lines; updateLineCount(); }
}).catch(() => {});

initEditor();

// -- Help / 使い方 modal -----------------------------------------------------

(function initHelp() {
  const HELP = {
    ja: `
<h3>PyQBPP Playground とは</h3>
<p>ブラウザ上で PyQBPP（Python）プログラムを書き、<b>Run</b> で実行できます。実行はクラウド（CPU のみ）で行われます。</p>

<h3>基本の流れ</h3>
<ul>
<li>上部のドロップダウンからサンプル（Simple / N-Queens / Knapsack 等）を選び <b>Load</b>。</li>
<li><b>Run</b>（Ctrl+R）で実行。</li>
<li><code>args</code> 欄に <code>sys.argv</code> 用のコマンドライン引数を入力できます（例: N-Queens の盤サイズ）。</li>
<li><b>Save</b> でソース保存、<b>Load</b>（Local File 選択時）でローカルファイルを開きます。</li>
</ul>

<h3>サポートするソルバー</h3>
<ul>
<li><code>qbpp.EasySolver</code> — ヒューリスティック探索（ビットフリップ＋タブー）。良い解を高速に1つ。</li>
<li><code>qbpp.ExhaustiveSolver</code> — 全探索。小規模（〜数十変数）向けの厳密解。</li>
</ul>
<p>いずれも <b>CPU 実行</b>（この環境に GPU はありません）。ABS3Solver や外部 MILP ソルバーは利用できません。</p>

<h3>search() のオプション（キーワード引数）</h3>
<p><b>EasySolver</b></p>
<table>
<tr><th>オプション</th><th>意味</th></tr>
<tr><td><code>time_limit</code></td><td>制限時間（秒）。0 = 無制限</td></tr>
<tr><td><code>target_energy</code></td><td>この値以下の解が出たら停止</td></tr>
<tr><td><code>topk_sols</code></td><td>上位 k 個の解を保持</td></tr>
<tr><td><code>best_energy_sols</code></td><td>最良エネルギーの解を保持（0 = 個数上限なし）</td></tr>
</table>
<pre><code>sol = qbpp.EasySolver(f).search(time_limit=10, target_energy=0)
print(sol.energy, sol(x))</code></pre>
<p><b>ExhaustiveSolver</b>（全探索のため <code>time_limit</code> はありません）</p>
<table>
<tr><th>オプション</th><th>意味</th></tr>
<tr><td><code>target_energy</code></td><td>早期終了用の目標エネルギー</td></tr>
<tr><td><code>best_energy_sols</code></td><td>すべての最適解を保持（0/1）</td></tr>
<tr><td><code>all_sols</code></td><td>すべての実行可能解を保持（0/1）</td></tr>
</table>
<pre><code>result = qbpp.ExhaustiveSolver(f).search(best_energy_sols=0)
for sol in result.sols: print(sol.energy)</code></pre>

<h3>整数型の選択</h3>
<p>インポートで選択します（既定は <code>c32e64</code>）。</p>
<pre><code>import pyqbpp as qbpp            # int32 係数 / int64 エネルギー（既定）
import pyqbpp.cppint as qbpp     # 任意精度（大きな整数）</code></pre>
<table>
<tr><th>インポート</th><th>係数 / エネルギー</th></tr>
<tr><td><code>pyqbpp</code>（= c32e64）</td><td>int32 / int64（既定）</td></tr>
<tr><td><code>pyqbpp.c32e32</code></td><td>int32 / int32</td></tr>
<tr><td><code>pyqbpp.c64e64</code></td><td>int64 / int64</td></tr>
<tr><td><code>pyqbpp.c64e128</code></td><td>int64 / int128</td></tr>
<tr><td><code>pyqbpp.c128e128</code></td><td>int128 / int128</td></tr>
<tr><td><code>pyqbpp.cppint</code></td><td>任意精度</td></tr>
</table>

<h3>変数・式・制約</h3>
<ul>
<li>変数: <code>x = qbpp.var("x", shape=n)</code>（バイナリ配列）、<code>y = qbpp.var("y", between=(0, 5))</code>（整数変数）</li>
<li>式: <code>qbpp.sum(x)</code>, <code>qbpp.vector_sum(x, axis=0)</code>, <code>qbpp.sqr(e)</code></li>
<li>制約（<code>qbpp.cons()</code> で囲むと制約として宣言され、ソルバーが充足解を効率よく探索）: <code>qbpp.cons(e == n)</code> / <code>qbpp.cons(e, between=(lo, hi))</code>（片側は <code>None</code>）。重みはスカラー係数で: <code>obj + 100 * qbpp.cons(e == n)</code></li>
<li>配列の制約（要素ごとに1本）: <code>qbpp.cons(rows == c)</code>（<code>c</code> はリストまたは整数配列）</li>
<li>ソルバーに渡す前に <code>f.simplify_as_binary()</code> で QUBO/HUBO 形へ簡約。</li>
</ul>

<h3>制限事項</h3>
<ul>
<li>実行時間・メモリ・短時間あたりのリクエスト数に上限があります。</li>
<li>ネットワークアクセスや外部ソルバーは利用できません。</li>
</ul>
`,
    en: `
<h3>What is PyQBPP Playground</h3>
<p>Write PyQBPP (Python) programs in your browser and <b>Run</b> them. Execution happens in the cloud (CPU only).</p>

<h3>Basic workflow</h3>
<ul>
<li>Pick a sample (Simple / N-Queens / Knapsack ...) from the dropdown and click <b>Load</b>.</li>
<li>Click <b>Run</b> (Ctrl+R).</li>
<li>Use the <code>args</code> field for command-line arguments (<code>sys.argv</code>), e.g. the board size for N-Queens.</li>
<li><b>Save</b> stores your source; <b>Load</b> (with "Local File" selected) opens a local file.</li>
</ul>

<h3>Supported solvers</h3>
<ul>
<li><code>qbpp.EasySolver</code> — heuristic search (bit-flip + tabu). Finds one good solution fast.</li>
<li><code>qbpp.ExhaustiveSolver</code> — brute-force enumeration. Exact, for small problems (up to a few dozen variables).</li>
</ul>
<p>Both run on <b>CPU</b> (no GPU in this environment). ABS3Solver and external MILP solvers are not available.</p>

<h3>search() options (keyword arguments)</h3>
<p><b>EasySolver</b></p>
<table>
<tr><th>Option</th><th>Meaning</th></tr>
<tr><td><code>time_limit</code></td><td>Time limit in seconds. 0 = unlimited</td></tr>
<tr><td><code>target_energy</code></td><td>Stop once a solution with energy ≤ this is found</td></tr>
<tr><td><code>topk_sols</code></td><td>Keep the top-k solutions</td></tr>
<tr><td><code>best_energy_sols</code></td><td>Keep best-energy solutions (0 = no count limit)</td></tr>
</table>
<pre><code>sol = qbpp.EasySolver(f).search(time_limit=10, target_energy=0)
print(sol.energy, sol(x))</code></pre>
<p><b>ExhaustiveSolver</b> (no <code>time_limit</code> — it enumerates everything)</p>
<table>
<tr><th>Option</th><th>Meaning</th></tr>
<tr><td><code>target_energy</code></td><td>Target energy for early termination</td></tr>
<tr><td><code>best_energy_sols</code></td><td>Keep all optimal solutions (0/1)</td></tr>
<tr><td><code>all_sols</code></td><td>Keep all feasible solutions (0/1)</td></tr>
</table>
<pre><code>result = qbpp.ExhaustiveSolver(f).search(best_energy_sols=0)
for sol in result.sols: print(sol.energy)</code></pre>

<h3>Choosing the integer type</h3>
<p>Select via the import (default is <code>c32e64</code>).</p>
<pre><code>import pyqbpp as qbpp            # int32 coeff / int64 energy (default)
import pyqbpp.cppint as qbpp     # arbitrary precision (large integers)</code></pre>
<table>
<tr><th>Import</th><th>coeff / energy</th></tr>
<tr><td><code>pyqbpp</code> (= c32e64)</td><td>int32 / int64 (default)</td></tr>
<tr><td><code>pyqbpp.c32e32</code></td><td>int32 / int32</td></tr>
<tr><td><code>pyqbpp.c64e64</code></td><td>int64 / int64</td></tr>
<tr><td><code>pyqbpp.c64e128</code></td><td>int64 / int128</td></tr>
<tr><td><code>pyqbpp.c128e128</code></td><td>int128 / int128</td></tr>
<tr><td><code>pyqbpp.cppint</code></td><td>arbitrary precision</td></tr>
</table>

<h3>Variables, expressions, constraints</h3>
<ul>
<li>Variables: <code>x = qbpp.var("x", shape=n)</code> (binary array), <code>y = qbpp.var("y", between=(0, 5))</code> (integer)</li>
<li>Expressions: <code>qbpp.sum(x)</code>, <code>qbpp.vector_sum(x, axis=0)</code>, <code>qbpp.sqr(e)</code></li>
<li>Constraints (wrap in <code>qbpp.cons()</code> to declare; the solvers search for solutions that satisfy them): <code>qbpp.cons(e == n)</code> / <code>qbpp.cons(e, between=(lo, hi))</code> (use <code>None</code> for one-sided bounds). Weights are scalar coefficients: <code>obj + 100 * qbpp.cons(e == n)</code></li>
<li>Array constraints (one per element): <code>qbpp.cons(rows == c)</code> (where <code>c</code> is a list or integer array)</li>
<li>Call <code>f.simplify_as_binary()</code> to reduce to QUBO/HUBO form before solving.</li>
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
