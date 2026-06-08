---
layout: default
nav_exclude: true
title: "Experimental Solver Support"
nav_order: 25
lang: en
hreflang_alt: "ja/EXPERIMENTAL_SOLVERS"
hreflang_lang: "ja"
---

# Experimental Solver Support — PyQBPP only

PyQBPP wraps a number of third-party solvers as **experimental
integrations**, available **only from PyQBPP (Python)** — not from the
C++ QUBO++ library. Currently supported:

- **Fixstars Amplify** (cloud meta — Fixstars AE, Fujitsu DA, Toshiba SBM, …)
- **D-Wave** — Advantage QPU, Leap Hybrid, Neal (classical SA), Tabu, Steepest Descent
- **dimod** — ExactSolver (brute-force enumeration)
- **OpenJij** (local SA / SQA, HUBO via `sample_hubo`)
- **TYTAN-SDK** — MIKASAmpler (HUBO-native PyTorch SA)
- **qubovert** (pure-Python HUBO SA)
- **Simulated Bifurcation** (Toshiba SB algorithm, PyTorch CPU/GPU)
- **IBM CPLEX** (commercial MIQP)
- **IBM Qiskit Optimization** (classical exact / QAOA / VQE)
- **Google OR-Tools CP-SAT** (HUBO via Boolean encoding)

Each backend is distributed only as a Python package, so PyQBPP forwards
models to them directly through Python; there is no C++ entry point.

→ See the PyQBPP documentation:
[**Experimental Solver Support (Amplify, D-Wave, OpenJij, TYTAN, qubovert, …)**](python/EXPERIMENTAL_SOLVERS)

## Solvers available from C++

The following built-in solvers are available from both C++ and PyQBPP:

- [Easy Solver](EASYSOLVER) — heuristic, multicore CPU
- [Exhaustive Solver](EXHAUSTIVE) — complete search (CPU + GPU)
- [ABS3 Solver](ABS3) — high-performance heuristic (CPU + GPU)
- [Gurobi Optimizer](GUROBI) — exact solver via Gurobi (license required)
- [MILP Solvers (SCIP, HiGHS, GLPK, CBC)](MILP_SOLVERS) — experimental open-source exact solvers
