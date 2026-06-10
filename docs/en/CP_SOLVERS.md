---
layout: default
nav_exclude: true
title: "CP Solvers"
nav_order: 24
lang: en
hreflang_alt: "ja/CP_SOLVERS"
hreflang_lang: "ja"
---

# CP Solvers — Google OR-Tools CP-SAT (PyQBPP only)

This page covers **constraint-programming (CP)** backends, which are neither
direct QUBO/HUBO samplers (see [QUBO/HUBO Solvers](QUBO_HUBO_SOLVERS)) nor MILP
solvers (see [MILP Solvers](MILP_SOLVERS)). A CP engine searches over Boolean /
integer variables under constraints with a SAT-style core and returns a
**proven optimum**.

Currently the only CP backend is **Google OR-Tools CP-SAT**. It ships only as a
Python package, so it is available **only from PyQBPP (Python)** — there is no
C++ entry point.

→ See the PyQBPP documentation:
[**CP Solvers — Google OR-Tools CP-SAT**](python/CP_SOLVERS)

OR-Tools CP-SAT encodes each non-linear monomial as a fresh Boolean AND, so it
handles **HUBO of any degree** and **negated literals (`~x`) natively**, while
returning a proven optimum — the only external QUBO++ solver with that
combination.
