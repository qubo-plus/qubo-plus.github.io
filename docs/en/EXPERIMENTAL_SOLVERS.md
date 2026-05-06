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

The experimental solver integrations for **Fixstars Amplify**,
**D-Wave Advantage / Leap Hybrid**, and **OpenJij** are available **only
from PyQBPP (Python)**. They are not exposed from the C++ QUBO++ library.

Each backend (Amplify SDK, D-Wave Ocean SDK, OpenJij) is distributed only
as a Python package, so PyQBPP forwards models to them directly through
Python; there is no C++ entry point.

→ See the PyQBPP documentation:
[**Experimental Solver Support (Amplify, D-Wave, OpenJij)**](python/EXPERIMENTAL_SOLVERS)

## Solvers available from C++

The following built-in solvers are available from both C++ and PyQBPP:

- [Easy Solver](EASYSOLVER) — heuristic, multicore CPU
- [Exhaustive Solver](EXHAUSTIVE) — complete search (CPU + GPU)
- [ABS3 Solver](ABS3) — high-performance heuristic (CPU + GPU)
- [Gurobi Optimizer](GUROBI) — exact solver via Gurobi (license required)
