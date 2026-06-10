---
layout: default
nav_exclude: true
title: "MILP Solvers (Experimental)"
nav_order: 23
lang: en
hreflang_alt: "ja/MILP_SOLVERS"
hreflang_lang: "ja"
---

# Experimental MILP Solvers — SCIP, HiGHS, GLPK, CBC

QUBO++ can solve QUBO expressions with several third-party **exact MILP
solvers**. They are wrapped as header-only solvers that share a single
interface, so user code can switch between them — and with
`qbpp::ABS3Solver` — by changing only the class name.

These solvers minimize a **linear** objective, so the quadratic QUBO must be
**linearized** before it is handed over (see below). This is the defining
characteristic of this page: solvers that accept the quadratic objective
**directly** (Gurobi, IBM CPLEX — both MIQP) do **not** appear here; they are
documented under [QUBO/HUBO Solvers](QUBO_HUBO_SOLVERS). The constraint-programming
engine OR-Tools CP-SAT is documented under [CP Solvers](CP_SOLVERS).

> **Experimental.** These integrations are provided for experimentation and
> benchmarking. Their API may change without notice, and each solver must be
> installed separately (see [Setup](#setup)). They solve **QUBO (degree ≤ 2)
> only** — reduce a HUBO to QUBO first, or use `qbpp::ABS3Solver` /
> `qbpp::EasySolver`, which support arbitrary degree.

Internally, each binary product `x·y` is replaced by an auxiliary variable with
linear linking constraints (Fortet linearization), so the QUBO is handed to the
solver as a pure MILP. The energy of the returned solution is always recomputed
exactly from the original QUBO, independent of the solver's floating-point
objective.

| Solver | Class | License | Notes |
|----|----|----|----|
| [SCIP](https://www.scipopt.org)   | `qbpp::ScipSolver` | Apache-2.0 (OSS) | linearize / quadratic formulations |
| [HiGHS](https://highs.dev)        | `qbpp::HighsSolver` | MIT (OSS) | fast open-source MILP |
| [GLPK](https://www.gnu.org/software/glpk/) | `qbpp::GlpkSolver` | GPL (OSS) | lightweight |
| [CBC](https://github.com/coin-or/Cbc) | `qbpp::CbcSolver` | EPL (OSS) | COIN-OR branch & cut |

For the commercial exact solvers that accept the quadratic objective directly
(Gurobi, IBM CPLEX), see [QUBO/HUBO Solvers](QUBO_HUBO_SOLVERS) (Gurobi is
available from both C++ and PyQBPP; CPLEX from PyQBPP only).

## Usage

The interface is the same for all four solvers. The following program solves a
number partitioning problem with SCIP — replace `qbpp::ScipSolver` with
`qbpp::HighsSolver`, `qbpp::GlpkSolver`, or `qbpp::CbcSolver` to use a different
solver (and include the matching header):

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/scip.hpp>     // or highs.hpp / glpk.hpp / cbc.hpp

int main() {
  std::vector<int> w = {64, 27, 47, 74, 12, 83, 63, 40};
  auto x = qbpp::var("x", w.size());
  auto p = qbpp::toExpr(0), q = qbpp::toExpr(0);
  for (size_t i = 0; i < w.size(); ++i) { p += w[i] * x[i]; q += w[i] * (1 - x[i]); }
  auto f = qbpp::sqr(p - q);
  f.simplify_as_binary();

  auto solver = qbpp::ScipSolver(f);   // <- swap the class name to switch solver
  auto sol = solver.search({{"time_limit", 10.0}});

  std::cout << "energy = " << sol.energy() << std::endl;
  std::cout << "bound  = " << sol.info("bound") << std::endl;
  std::cout << "status = " << sol.info("status") << std::endl;
}
```
{% endraw %}

When the energy equals the lower bound (`sol.info("bound")`), the solution
is proven optimal:

```
energy = 0
bound  = 0.000000
status = OPTIMAL
```

A solver object is created from an expression; on construction the (simplified)
QUBO is linearized into the solver's internal MILP model. If the expression
contains higher-degree (HUBO) terms, the constructor throws an exception.

## Parameters

Parameters are passed to `search()` as an initializer list of key/value pairs.
The keys understood by every wrapper are:

| Key | Value | Description |
|----|----|----|
| **`time_limit`** | seconds | Stop when the time limit is reached |
| **`target_energy`** | energy | Stop when an energy ≤ this value is found |
| **`callback_timer_interval`** | seconds | Initial interval for `Timer` callback events |
| **`enable_default_callback`** | `1` | Print energy and TTS of each new incumbent |
| **`thread_count`** | threads | Worker threads (SCIP/HiGHS; ignored by GLPK/CBC wrapper) |
| **`topk_sols`** | K | Return up to K solutions (best-effort; see below) |
| **`gap_limit`** | gap | Relative MIP gap stop (SCIP/HiGHS) |
| **`output_flag`** | `1` | Show the solver's own log (SCIP/HiGHS) |

Solver-specific extras:

- **SCIP** — any key not listed is forwarded to SCIP verbatim (e.g.
  `"limits/gap"`, `"lp/threads"`). The `formulation` (linearize / quadratic) is a
  **constructor** option, not a `search()` key — see below.
- **HiGHS** — any unrecognized key is forwarded to HiGHS `setOptionValue`
  (e.g. `"presolve"`, `"mip_rel_gap"`).

> `topk_sols` is best-effort: unlike Gurobi's solution pool, these solvers
> return whatever distinct solutions remain in their internal storage (often
> just the incumbent).

## SCIP: linearize vs quadratic formulation

`qbpp::ScipSolver` can feed the QUBO to SCIP in two ways:

- **`"linearize"` (default)** — Fortet linearization to a pure MILP (the same
  transform used by the other solvers), giving SCIP a tight LP relaxation.
- **`"quadratic"`** — SCIP's objective is strictly linear, so the QUBO is modelled
  with one extra objective variable `t` and a single **quadratic (nonlinear)
  constraint** `t == const + Σ qᵢⱼ·xᵢ·xⱼ`, minimizing `t`. SCIP's nonlinear
  constraint handler reformulates the binary products itself, so no Fortet
  auxiliary variables are added. The per-term (McCormick) relaxation is weaker,
  so this is usually slower on dense penalty QUBOs — it is provided mainly for
  comparison.

Both formulations reach the same optimum. The formulation is fixed at
**construction** — to use a different one, create a new solver object (it is not
a `search()` parameter):

{% raw %}
```cpp
qbpp::ScipSolver solver(f, qbpp::ScipSolver::Formulation::Quadratic);
auto sol = solver.search();
```
{% endraw %}

This option is specific to SCIP; HiGHS, GLPK, and CBC always use the linearized
MILP.

## Solver Info

`sol.info()` carries solver-produced strings:

| Key | Description |
|----|----|
| `status` | `OPTIMAL`, `TIME_LIMIT`, `INFEASIBLE`, ... (solver-specific spelling) |
| `bound` | Best dual bound (lower bound) |
| `mip_gap` | Final relative MIP gap (SCIP/HiGHS) |
| `node_count` | Branch-and-bound nodes |
| `solution_count` | `1` if a solution was found, else `0` |
| `<solver>_version` | `scip_version` / `highs_version` / `glpk_version` |
| `run_time` | Wall-clock solve time (seconds) |

## Custom Callback

The callback API is identical to `qbpp::ABS3Solver` / `qbpp::GurobiSolver`.
Subclass the solver and override the `callback()` virtual method:

| Event | Description |
|-------|-------------|
| `CallbackEvent::Start` | Called once at the beginning of `search()` |
| `CallbackEvent::BestUpdated` | Called whenever the solver finds a new incumbent |
| `CallbackEvent::Timer` | Called periodically at the interval set by `timer(seconds)` |

Inside the callback: **`event()`**, **`best_sol()`** (current best `qbpp::Sol`),
**`bound()`** (current dual bound), **`timer(seconds)`** (set/disable the timer),
and **`terminate()`** (stop the search at the next safe point). `hint(sol)` warm-
starts SCIP and HiGHS; it is a no-op for GLPK.

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/highs.hpp>

class MySolver : public qbpp::HighsSolver {
 public:
  using HighsSolver::HighsSolver;
  void callback() const override {
    if (event() == qbpp::CallbackEvent::BestUpdated) {
      std::cout << "New best: energy=" << best_sol().energy()
                << " TTS=" << best_sol().tts() << "s  bound=" << bound() << std::endl;
      if (best_sol().energy() == 0) terminate();  // stop as soon as optimal is found
    }
  }
};

int main() {
  auto x = qbpp::var("x", 8);
  auto f = qbpp::sqr(qbpp::sum(x) - 4);
  f.simplify_as_binary();
  auto sol = MySolver(f).search({{"time_limit", 5}});
  std::cout << "energy=" << sol.energy() << std::endl;
}
```
{% endraw %}

## Setup

Each solver must be installed separately. The headers are independent
(`<qbpp/scip.hpp>`, `<qbpp/highs.hpp>`, `<qbpp/glpk.hpp>`, `<qbpp/cbc.hpp>`); include
only the one you use. qbpp itself is loaded via `dlopen`, so no `-lqbpp` is needed.
A convenient way to obtain all four is [conda-forge](https://conda-forge.org):

```sh
conda install -c conda-forge scip highs glpk coincbc
```

Build flags per solver (add `-ldl -pthread` as for any qbpp program):

| Solver | Link flags | Header path (conda) |
|----|----|----|
| SCIP  | `-lscip` | (system include or `-I$PREFIX/include`) |
| HiGHS | `-lhighs` | `-isystem $PREFIX/include/highs` |
| GLPK  | `-lglpk` | (system include or `-I$PREFIX/include`) |
| CBC   | `-lCbc -lCbcSolver -lCgl -lOsiClp -lClp -lOsi -lCoinUtils` | `-isystem $PREFIX/include/coin` |

For example, with a conda install at `$CONDA_PREFIX`:

```sh
g++ -std=c++17 your_program.cpp -o your_program \
    -isystem $CONDA_PREFIX/include/highs \
    -L$CONDA_PREFIX/lib -Wl,-rpath,$CONDA_PREFIX/lib -lhighs -ldl -pthread
```

SCIP from an apt/deb install (`SCIPOptSuite-*.deb`) places its headers and
`libscip.so` on the default paths, so only `-lscip` is needed.
