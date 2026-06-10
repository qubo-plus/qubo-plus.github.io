---
layout: default
nav_exclude: true
title: "CP Solvers"
nav_order: 24
lang: en
hreflang_alt: "ja/python/CP_SOLVERS"
hreflang_lang: "ja"
---

# CP Solvers — Google OR-Tools CP-SAT

This page covers **constraint-programming (CP)** backends, which are neither
direct QUBO/HUBO samplers (see [QUBO/HUBO Solvers](QUBO_HUBO_SOLVERS)) nor MILP
solvers (see [MILP Solvers](MILP_SOLVERS)). A CP engine searches over Boolean /
integer variables under constraints with a SAT-style core and returns a
**proven optimum**.

> **⚠️ Experimental — PyQBPP only.** The OR-Tools library itself is a
> production tool; the **PyQBPP integration** is experimental and its wrapper
> API may change without notice. OR-Tools ships only as a Python package
> (`pip install ortools`), so this solver has no C++ entry point. It is imported
> lazily when the solver is instantiated.

## OrToolsCpSatSolver

[Google OR-Tools CP-SAT](https://developers.google.com/optimization/cp/cp_solver)
— a constraint-programming engine with a SAT-solver core. CP-SAT
doesn't natively accept quadratic objectives; PyQBPP encodes each
non-linear monomial ``ℓ_a ℓ_b ... ℓ_k`` (each ``ℓ`` either ``x_i`` or
``~x_i``) as a fresh Boolean ``z`` with ``z = ℓ_a ∧ ... ∧ ℓ_k`` and
minimizes the resulting linear objective. **HUBO of any degree** works
with the same encoding, and **negated literals are handled natively**
via CP-SAT's ``BoolVar.Not()`` — no ``all_positive`` expansion is
applied (which would multiply each m-negation monomial into 2^m
sub-terms)::

    sol = qbpp.OrToolsCpSatSolver(e).search(time_limit=5.0)

This makes `OrToolsCpSatSolver` the only external solver in PyQBPP that
accepts arbitrary-degree HUBO **and** negated literals natively while
returning a proven optimum.

Common `search()` kwargs:
`time_limit` (s, mapped to `parameters.max_time_in_seconds`),
`thread_count` (`num_search_workers`), `log` (boolean).

## Common return type

`OrToolsCpSatSolver` returns the standard PyQBPP `SolverSol` (same as
`EasySolverSol`/`ABS3SolverSol`), so the rest of your program is
solver-agnostic:

```python
print(sol.energy)            # best objective value
print(sol.tts)               # time-to-best-solution (seconds)
print(sol.info["solver"])    # "OrToolsCpSatSolver"
for s in sol.sols:           # additional candidate solutions
    print(s.energy, s.tts)
```
