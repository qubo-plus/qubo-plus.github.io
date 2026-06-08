---
layout: default
nav_exclude: true
title: "MILP Solvers (Experimental)"
nav_order: 23
lang: en
hreflang_alt: "ja/python/MILP_SOLVERS"
hreflang_lang: "ja"
---

# Experimental MILP Solvers — SCIP, HiGHS, GLPK, CBC

PyQBPP can solve QUBO expressions with several third-party **exact MILP
solvers**. They share a single interface, so user code can switch between them —
and with `pyqbpp.GurobiSolver` / `pyqbpp.ABS3Solver` — by changing only the class
name.

> **Experimental.** These integrations are provided for experimentation and
> benchmarking. Their API may change without notice, and each solver's Python
> binding must be installed separately (see [Setup](#setup)). They solve **QUBO
> (degree ≤ 2) only** — reduce a HUBO to QUBO first, or use `pyqbpp.ABS3Solver` /
> `pyqbpp.EasySolver`, which support arbitrary degree.

Internally each binary product is replaced by an auxiliary variable with linear
linking constraints (Fortet linearization), so the QUBO is handed to the solver
as a pure MILP. The returned solution's energy is always recomputed exactly from
the original QUBO.

| Solver | Class | Python binding | License |
|----|----|----|----|
| [SCIP](https://www.scipopt.org)   | `pyqbpp.ScipSolver` | PySCIPOpt | Apache-2.0 |
| [HiGHS](https://highs.dev)        | `pyqbpp.HighsSolver` | highspy | MIT |
| [GLPK](https://www.gnu.org/software/glpk/) | `pyqbpp.GlpkSolver` | swiglpk | GPL |
| [CBC](https://github.com/coin-or/Cbc) | `pyqbpp.CbcSolver` | python-mip | EPL |

For the commercial exact solvers, see [Gurobi](GUROBI) and
[IBM CPLEX](EXPERIMENTAL_SOLVERS).

## Usage

All four solvers share the same interface. The following program solves a number
partitioning problem with SCIP — replace `qbpp.ScipSolver` with
`qbpp.HighsSolver`, `qbpp.GlpkSolver`, or `qbpp.CbcSolver` to use a different one:

```python
import pyqbpp as qbpp

w = qbpp.array([64, 27, 47, 74, 12, 83, 63, 40])
x = qbpp.var("x", shape=len(w))
p = qbpp.expr()
q = qbpp.expr()
for i in range(len(w)):
    p += w[i] * x[i]
    q += w[i] * (1 - x[i])
f = qbpp.sqr(p - q)
f.simplify_as_binary()

solver = qbpp.ScipSolver(f)            # swap the class name to switch solver
sol = solver.search(time_limit=10.0)

print(f"energy = {sol.energy}")
print(f"bound  = {sol.info.get('bound')}")
print(f"status = {sol.info.get('status')}")
print("P:", [w[i] for i in range(len(w)) if sol(x[i]) == 1])
print("Q:", [w[i] for i in range(len(w)) if sol(x[i]) == 0])
```

When the energy equals the bound, the solution is proven optimal. A solver object
is created from an expression; on construction the QUBO is linearized into the
solver's internal MILP model. A higher-degree (HUBO) expression raises an
exception.

## Parameters

Parameters are passed to `search()` as keyword arguments (a dict is also
accepted). The keys understood by every wrapper are:

| Key | Value | Description |
|----|----|----|
| **`time_limit`** | seconds | Stop when the time limit is reached |
| **`target_energy`** | energy | Stop when an energy ≤ this value is found |
| **`callback_timer_interval`** | seconds | Initial interval for `Timer` events |
| **`enable_default_callback`** | `1` | Print energy and TTS of each new incumbent |
| **`thread_count`** | threads | Worker threads (SCIP/HiGHS/CBC) |
| **`topk_sols`** | K | Return up to K solutions (best-effort) |
| **`gap_limit`** | gap | Relative MIP gap stop (SCIP/HiGHS) |
| **`output_flag`** | `1` | Show the solver's own log (SCIP/HiGHS) |

Solver-specific extras:

- **SCIP** — any unrecognized key is forwarded to SCIP verbatim (e.g.
  `solver.search({"limits/gap": 0.0})`). The `formulation` (linearize / quadratic)
  is a **constructor** argument, not a `search()` key — see below.
- **HiGHS** — any unrecognized key is forwarded to HiGHS `setOptionValue`
  (e.g. `presolve="on"`).

## SCIP: linearize vs quadratic formulation

`ScipSolver` can feed the QUBO to SCIP in two ways:

- **`"linearize"` (default)** — Fortet linearization to a pure MILP (the same
  transform used by the other solvers), giving SCIP a tight LP relaxation.
- **`"quadratic"`** — SCIP's objective is strictly linear, so the QUBO is modelled
  with one extra objective variable and a single **quadratic (nonlinear)
  constraint** that SCIP's nonlinear handler reformulates itself, adding no Fortet
  auxiliary variables. Its per-term relaxation is weaker, so it is usually slower
  on dense penalty QUBOs — provided mainly for comparison.

Both reach the same optimum. The formulation is fixed at **construction** — to
use a different one, create a new solver object (it is not a `search()` keyword):

```python
solver = qbpp.ScipSolver(f, formulation="quadratic")
sol = solver.search()
```

This option is specific to SCIP; HiGHS, GLPK, and CBC always use the linearized
MILP.

## Solver Info

`sol.info` carries solver-produced strings: `status`, `bound`, `mip_gap`
(SCIP/HiGHS), `node_count`, `solution_count`, `<solver>_version`
(`scip_version` / `highs_version` / `glpk_version`), and `run_time`.

## Custom Callback

Subclass the solver and override `callback()`. Inside, use `self.event()`,
`self.best_sol()` (a `pyqbpp.Sol`), `self.bound()`, `self.timer(seconds)`, and
`self.terminate()`. The event constants are class attributes:
`EVENT_START`, `EVENT_BEST_UPDATED`, `EVENT_TIMER`.

```python
import pyqbpp as qbpp

class MySolver(qbpp.HighsSolver):
    def callback(self):
        if self.event() == self.EVENT_BEST_UPDATED:
            s = self.best_sol()
            print(f"New best: energy={s.energy} TTS={s.tts}s bound={self.bound()}")
            if s.energy == 0:
                self.terminate()          # stop as soon as optimal is found

x = qbpp.var("x", shape=8)
f = qbpp.sqr(qbpp.sum(x) - 4)
f.simplify_as_binary()
sol = MySolver(f).search(time_limit=5)
print(f"energy={sol.energy}")
```

> **Live-callback support differs by binding.** `ScipSolver` and `HighsSolver`
> deliver `BestUpdated`/`Timer` during the solve. **`GlpkSolver` and `CbcSolver`
> deliver only `EVENT_START`** — swiglpk cannot install a Python branch-and-cut
> callback and python-mip's incumbent callback is not invoked on common builds.
> The C++ `qbpp::GlpkSolver` / `qbpp::CbcSolver` do deliver live events.
> `hint(sol)` warm-starts SCIP/HiGHS; it is a no-op for GLPK/CBC. Use
> `time_limit` to bound a run.

## Setup {#setup}

Install only the bindings you use:

| Solver | Install |
|----|----|
| SCIP  | `conda install -c conda-forge pyscipopt` |
| HiGHS | `pip install highspy` (or `conda install -c conda-forge highspy`) |
| GLPK  | `conda install -c conda-forge swiglpk` |
| CBC   | `pip install mip` |

The bindings are imported lazily, so `import pyqbpp` works even when a solver is
not installed; the error is raised only when you construct that solver.
