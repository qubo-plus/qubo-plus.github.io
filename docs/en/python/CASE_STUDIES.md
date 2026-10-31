---
last_modified: 2026-10-28
layout: default
title: "Case Studies"
nav_order: 6
lang: en
hreflang_alt: "ja/python/CASE_STUDIES"
hreflang_lang: "ja"
---

# Case Studies
This section provides examples of solving optimization, mathematical, and graph problems using PyQBPP.
The Easy / Medium / Hard label after each problem indicates how hard the page is to understand, judged from the background needed to understand the problem, the ideas in the formulation, and the structure of the program.

{% assign case_videos = site.data.videos.episodes | where_exp: "ep", "ep.kind == 'case' and ep.hidden != true" -%}
{%- if case_videos.size > 0 %}
Some of the case studies are also presented in videos (see the [Videos (Case Studies)](../VIDEO_CASE_STUDIES) page).
{%- endif %}

## Math Problems
1. [Math Problem: Find Three Integers](3INTEGERS) (Easy)
2. [3-Digit Math Problem](3DIGIT_MATH) (Easy)
3. [Cubic Equation](CUBIC_EQUATION) (Easy)
4. [Square Root](SQRT) (Easy)
5. [Fractions Close to Pi](PI_FRACTION) (Easy)
6. [Greatest Common Divisor (GCD)](GCD) (Easy)
7. [Remainder Problem](REMAINDER) (Easy)
8. [Pythagorean Triples](PYTHAGOREAN) (Medium)
9. [Taxicab Number 1729](TAXICAB) (Medium)
10. [Prime Factorization by Recursion](PRIME_FACTORIZATION) (Medium)

## Puzzle
1. [N-Queens Problem](QUEENS) (Easy)
2. [Star Battle](STAR_BATTLE) (Easy)
3. [Sudoku](SUDOKU) (Medium)
4. [Nonogram](NONOGRAM) (Medium)
5. [Magic Square](MAGIC) (Medium)
6. [SEND + MORE = MONEY Problem](SEND_MORE_MONEY) (Medium)

## Graph Problems
### Selecting vertices and sets
1. [Maximum Independent Set (MIS) Problem](GRAPH) (Easy)
2. [Maximum Clique Problem](MAX_CLIQUE) (Easy)
3. [Minimum Vertex Cover Problem](VERTEX_COVER) (Easy)
4. [Minimum Dominating Set Problem](DOMINATING) (Medium)
5. [Minimum Set Cover Problem](SETCOVER) (Medium)

### Cuts and partitioning
1. [Max-Cut Problem](MAXCUT) (Easy)
2. [Minimum Graph Bisection Problem](BISECTION) (Easy)
3. [Cutwidth Problem](CUTWIDTH) (Medium)

### Matching
1. [Maximum Matching Problem](MAX_MATCHING) (Easy)
2. [Minimum Maximal Matching Problem](MINMAX_MATCHING) (Medium)

### Coloring
1. [Graph Coloring Problem](GRAPH_COLOR) (Easy)
2. [Graph Edge Coloring Problem](EDGE_COLOR) (Medium)

### Isomorphism
1. [Subgraph Isomorphism Problem](SUBGRAPH_ISOMORPHISM) (Medium)

## Routing Problems
1. [Shortest Path Problem](SHORTEST_PATH) (Medium)
2. [Traveling Salesman Problem](TSP) (Medium)
3. [Capacitated Vehicle Routing Problem (CVRP)](CVRP) (Hard)

## Combinatorial Optimization Problems
1. [QUBO Problem](QUBO) (Easy)
2. [Integer Linear Programming](ILP) (Easy)
3. [LABS Problem](LABS) (Easy)
4. [Knapsack Problem](KNAPSACK) (Medium)
5. [Three Formulations of the Partitioning Problem](PARTITION_FORMULATIONS) (Medium)
6. [Interval Subset Sum Problem (ISSP)](ISSP) (Medium)
7. [Cutting Stock Problem](BAR_CUTTING) (Medium)
8. [Portfolio Optimization](PORTFOLIO) (Hard)

## Scheduling
1. [Shift Scheduling Problem](SHIFT_SCHEDULING) (Medium)
2. [Day and Night Shift Roster](SHIFT_ROSTER) (Medium)
3. [Machine Scheduling with Due Dates](MACHINE_SCHEDULING) (Hard)

## Satisfiability
1. [Boolean Satisfiability Problem (SAT)](SAT) (Medium)
2. [Not-All-Equal SAT (NAE-SAT)](NAESAT) (Medium)

## Circuit Simulation
1. [Adder Simulation](ADDER) (Medium)
2. [Multiplier Simulation and Factorization](MULTIPLIER) (Hard)

## Image processing
1. [Image Halftoning](HALFTONING) (Medium)
2. [Image Denoising](DENOISING) (Medium)
3. [Clustered-Dot Halftoning](CLUSTER_HALFTONING) (Hard)
4. [ASCII Art Generation](ASCII_ART) (Hard)

## Black-box optimization
1. [Black-Box Optimization with FMQA](FMQA) (Hard)
2. [Quantum Chemistry with FMQA](FMQA_CHEMISTRY) (Hard)

## Quantum annealers
1. [Simulating a Quantum Annealer](QUANTUM_ANNEALER) (Medium)

> **NOTE**
> Graph case studies include visualization code using `matplotlib` and `networkx`.
> Install them with: `pip install matplotlib networkx`
