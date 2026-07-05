---
layout: default
nav_exclude: true
title: "QUBO/HUBO Solvers"
nav_order: 22
lang: en
hreflang_alt: "ja/python/QUBO_HUBO_SOLVERS"
hreflang_lang: "ja"
---

# QUBO/HUBO Solvers — Gurobi, D-Wave, Amplify, OpenJij, …

This page covers external solvers that consume a **QUBO/HUBO model directly**,
with no linearization step. PyQBPP hands the polynomial (or its quadratic /
Ising form) straight to the backend. They fall into two groups:

1. **Exact optimizers that accept the quadratic objective directly**
   ([Gurobi](#gurobi), [`CplexSolver`](#cplexsolver),
   [`DimodExactSolver`](#dimodexactsolver),
   [`QiskitOptimizationSolver`](#qiskitoptimizationsolver)) — branch-and-bound /
   enumeration that returns a proven optimum (and, for the MIQP solvers, a dual
   bound). No Fortet auxiliary variables are introduced; the quadratic objective
   is given to the solver as-is.
2. **Heuristic samplers and annealers** ([`AmplifySolver`](#amplifysolver),
   the [D-Wave family](#dwavesolver), [`OpenJijSolver`](#openjijsolver),
   [`HobotanMikasSolver`](#hobotanmikassolver), [`QubovertSolver`](#qubovertsolver),
   [`SimulatedBifurcationSolver`](#simulatedbifurcationsolver)) — physics-inspired
   or local-search heuristics that draw samples and return the best one found.

> **Where other solvers live.** Solvers that require **linearization** of the
> quadratic objective into a pure MILP (SCIP, HiGHS, GLPK, CBC) are documented
> under [MILP Solvers](MILP_SOLVERS). Google OR-Tools CP-SAT, a
> constraint-programming engine, is documented under [CP Solvers](CP_SOLVERS).

> **Experimental.** These integrations are provided for experimentation and
> benchmarking, and their wrapper API may change without notice. Except for
> Gurobi (also available from C++), the solvers on this page have **no C++ entry
> point**. Each backend ships only as a Python package and is imported lazily
> when a solver is instantiated; PyQBPP does not depend on these packages
> directly.

All solvers return the standard PyQBPP solution object and follow the same
`search()` protocol as [`qbpp.EasySolver`](EASYSOLVER) /
[`qbpp.ABS3Solver`](ABS3), so the rest of your program stays solver-agnostic:

```python
solver = qbpp.GurobiSolver(e)         # or AmplifySolver / DWaveSolver / OpenJijSolver / ...
sol    = solver.search(...)
print(sol.energy, sol.info)
```

## At a glance

| Solver | Group | Backend | Install | Token | `time_limit` | HUBO | Negated literals |
|---|---|---|---|---|---|---|---|
| [`GurobiSolver`](#gurobi) | exact (MIQP) | Gurobi Optimizer (`libgurobi*.so`) | Gurobi install | **license** | yes | ❌ degree ≤ 2 | — |
| [`CplexSolver`](#cplexsolver) | exact (MIQP) | IBM CPLEX (commercial) | `pip install cplex` | **license** | yes | ❌ degree ≤ 2 | — |
| [`DimodExactSolver`](#dimodexactsolver) | exact (enum) | dimod brute-force (≤ ~20 vars) | `pip install dimod` | no | no | ❌ degree ≤ 2 | — |
| [`QiskitOptimizationSolver`](#qiskitoptimizationsolver) | exact / quantum | IBM Qiskit Optimization (classical or QAOA / VQE) | `pip install qiskit qiskit-optimization qiskit-algorithms` | no | no | ❌ degree ≤ 2 | — |
| [`AmplifySolver`](#amplifysolver) | sampler | Fixstars Amplify SDK (cloud — Fixstars AE, Fujitsu DA, etc.) | `pip install amplify` | yes (default Fixstars AE) | yes | ✅ (auto-quadratized by SDK) | ❌ requires `all_positive=True` |
| [`DWaveSolver`](#dwavesolver) | sampler / quantum | D-Wave QPU (Advantage, via Ocean SDK) | `pip install dwave-ocean-sdk` | yes (D-Wave Leap) | **no** — use `num_reads` | ❌ degree ≤ 2 | — |
| [`DWaveNativeSolver`](#dwavenativesolver) | sampler / quantum | D-Wave QPU — native topology, **no minor-embedding** | `pip install dwave-ocean-sdk` | yes (D-Wave Leap) | **no** — use `num_reads` | ❌ degree ≤ 2 | — |
| [`DWaveHybridSolver`](#dwavehybridsolver) | sampler / hybrid | D-Wave Leap Hybrid Sampler | `pip install dwave-ocean-sdk` | yes (D-Wave Leap) | yes | ❌ degree ≤ 2 | — |
| [`DWaveNealSolver`](#dwavenealsolver) | sampler | D-Wave Neal — classical SA, **not a quantum solver** | `pip install dwave-samplers` | **no** | **no** — use `num_reads` | ❌ degree ≤ 2 | — |
| [`DWaveTabuSolver`](#dwavetabusolver) | sampler | D-Wave samplers — classical Tabu search | `pip install dwave-samplers` | **no** | **no** — use `timeout` (ms) | ❌ degree ≤ 2 | — |
| [`DWaveSteepestDescentSolver`](#dwavesteepestdescentsolver) | sampler | D-Wave samplers — greedy local descent | `pip install dwave-samplers` | **no** | **no** — use `num_reads` | ❌ degree ≤ 2 | — |
| [`OpenJijSolver`](#openjijsolver) | sampler | OpenJij (local SA / SQA, open-source) | `pip install openjij` | **no** | **no** — use `num_reads` | ✅ via `sample_hubo` (SASampler) | ❌ requires `all_positive=True` |
| [`HobotanMikasSolver`](#hobotanmikassolver) | sampler | TYTAN-SDK MIKASAmpler — HUBO-native PyTorch SA | `pip install -U git+https://github.com/tytansdk/tytan` (+ `torch`) | **no** | **no** — use `shots` | ✅ dense tensor | ❌ requires `all_positive=True` |
| [`QubovertSolver`](#qubovertsolver) | sampler | qubovert.sim.anneal_pubo — pure-Python HUBO SA | `pip install qubovert` | **no** | **no** — use `num_anneals` | ✅ sparse PUBO | ❌ requires `all_positive=True` |
| [`SimulatedBifurcationSolver`](#simulatedbifurcationsolver) | sampler | Toshiba SB algorithm (PyTorch CPU/GPU) | `pip install simulated-bifurcation` | **no** | **no** — use `timeout` / `max_steps` | ❌ degree ≤ 2 | — |

---

# Exact optimizers (quadratic objective accepted directly)

These solvers branch-and-bound or enumerate over the original quadratic
objective and return a **proven optimum**. For the MIQP solvers (Gurobi,
CPLEX), when the solution energy equals the dual `bound`, optimality is
certified. They require **degree ≤ 2** (BQM); reduce a HUBO to QUBO first, or
use a HUBO-capable solver such as [`ABS3Solver`](ABS3).

## Gurobi

PyQBPP can solve QUBO expressions using the [Gurobi Optimizer](https://www.gurobi.com).
PyQBPP calls Gurobi's C runtime (`libgurobi*.so`) directly — **no `gurobipy` dependency**. On Python 3.11 and earlier (the ctypes backend) the call goes through `ctypes.CDLL`; on Python 3.12+ (the nanobind backend) it goes through the C++ header-only wrapper `qbpp/gurobi.hpp`, which `dlopen`s the same `libgurobi*.so`. Either way, the underlying runtime is the system Gurobi installation. A valid Gurobi license is required.

Solving an expression `f` using **`pyqbpp.GurobiSolver`** involves the following two steps:
1. Create a `GurobiSolver` object for the expression `f`.
2. Call the **`search()`** method with keyword arguments, which returns the obtained solution.

The interface mirrors `pyqbpp.ABS3Solver`, so most user code switches between solvers with no changes other than the class name.

### Solving a partition problem using the Gurobi Solver
The following program solves a number partitioning problem using the Gurobi Optimizer:
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

solver = qbpp.GurobiSolver(f)
sol = solver.search(time_limit=10.0, enable_default_callback=1)

print(f"energy = {sol.energy}")
print(f"bound  = {sol.info.get('bound')}")
print(f"status = {sol.info.get('status')}")
print("P:", [w[i] for i in range(len(w)) if sol(x[i]) == 1])
print("Q:", [w[i] for i in range(len(w)) if sol(x[i]) == 0])
```

The program first creates a `GurobiSolver` object for `f`.
The `search()` method is then called with parameters as keyword arguments.
`time_limit` specifies the maximum search time in seconds, and `enable_default_callback=1` enables the built-in callback that prints energy and TTS for newly found best solutions.

When the energy of the obtained solution equals the lower bound returned by `sol.info['bound']`, the solution is guaranteed to be optimal:

```
energy = 0
bound  = 0.0
status = OPTIMAL
P: [64, 27, 74, 40]
Q: [47, 12, 83, 63]
```

### GurobiSolver object
A `GurobiSolver` object is created from a given expression.
On construction, the expression is converted to Gurobi's internal model:
- **`GurobiSolver(f)`**: Builds a Gurobi model from the expression.

`GurobiSolver` only supports **QUBO** (degree ≤ 2). If the expression contains higher-degree terms (HUBO), the constructor raises an exception.
Reduce the HUBO to QUBO using auxiliary variables, or use `pyqbpp.ABS3Solver` / `pyqbpp.EasySolver`, which support arbitrary degree.

### Gurobi Parameters
Parameters are passed directly to `search()` as keyword arguments (or as a single dict).
The keys recognized by pyqbpp's wrapper are listed below; **any key not in this list is forwarded transparently to Gurobi**, so the full set of [Gurobi parameters](https://docs.gurobi.com/projects/optimizer/en/current/reference/parameters.html) is available (e.g., `MIPFocus`, `Heuristics`, `Cuts`, `Seed`, `LogFile`, `OutputFlag`, ...).

#### Basic Options

| Key | Type | Description |
|----|----|----|
| **`time_limit`** | float | Time limit in seconds. Terminates the search when reached |
| **`target_energy`** | int | Terminates the search when the target energy is achieved |
| **`thread_count`** | int | Number of Gurobi worker threads |

#### Advanced Options

| Key | Type | Description |
|----|----|----|
| **`enable_default_callback`** | int (0 or 1) | Enables the built-in callback that prints energy and TTS |
| **`callback_timer_interval`** | float | Initial interval (seconds) for `Timer` callback events |
| **`topk_sols`** | int | Returns the top-K solutions (sets `PoolSearchMode=2` and `PoolSolutions=K`) |
| **`license_file`** | str | Overrides `$GRB_LICENSE_FILE` |

> Note: `best_energy_sols` (ABS3) is not provided here because Gurobi's solution pool does not have a "best-energy-only" mode — equal-energy filtering would require a different API (e.g., `PoolGap=0`).

Other Gurobi-native parameter names (e.g., `MIPFocus=1`, `Heuristics=0.5`, `OutputFlag=1`) can be passed as keyword arguments and are forwarded to Gurobi as-is.

The return value is a solution that provides `sol.energy`, `sol(x)`, `sol.info`, and more. See [QR_SOLUTION](QR_SOLUTION) for details.

### Collecting Multiple Solutions

Setting `topk_sols` enables Gurobi's solution pool, returning multiple distinct solutions sorted by energy.

```python
sol = solver.search(topk_sols=5)

print(f"Best energy: {sol.energy}")
print(f"Number of additional solutions: {len(sol.sols)}")
for s in sol.sols:
    print(f"energy={s.energy} tts={s.tts:.3f}s")
```

The returned object provides:
- **`sol.energy`** — energy of the best (incumbent) solution
- **`sol.sols`** — list of additional pool solutions (sorted by ascending energy)
- **`len(sol.sols)`** — number of additional solutions
- **`sol.info`** — dict of solver info strings

### Solver Info

`sol.info` is a dict with strings produced by Gurobi:

| Key | Description |
|----|----|
| `status` | `OPTIMAL`, `TIME_LIMIT`, `INFEASIBLE`, `INTERRUPTED`, ... |
| `bound` | Best objective bound (LP relaxation) found by Gurobi |
| `mip_gap` | Final MIP gap |
| `node_count` | Number of branch-and-bound nodes explored |
| `iter_count` | Number of simplex iterations |
| `solution_count` | Number of solutions Gurobi has |
| `gurobi_version` | Gurobi version string (e.g., `13.0.1`) |
| `run_time` | Wall-clock time of the optimize call (seconds) |

### Custom Callback

The callback API is identical to `pyqbpp.ABS3Solver`. **Subclass `GurobiSolver`** and override the `callback()` method (no arguments).

The callback is invoked with one of the following events:

| Event value | Constant | Description |
|:-:|----|----|
| `0` | `EVENT_START` | Called once at the beginning of `search()` |
| `1` | `EVENT_BEST_UPDATED` | Called whenever Gurobi finds a new incumbent (i.e., `MIPSOL`) |
| `2` | `EVENT_TIMER` | Called periodically at the interval set by `self.timer(seconds)` |

Inside `callback()`, the following methods are available:
- **`self.event()`** — current event, as an integer that compares equal to the `EVENT_*` constants (`EVENT_START`=0, `EVENT_BEST_UPDATED`=1, `EVENT_TIMER`=2)
- **`self.best_sol()`** — current best solution. Use `.energy`, `.tts`, `.get(var)`, etc. Valid during `BestUpdated`; cached afterwards for `Timer`. Undefined during `Start`.
- **`self.bound()`** — best objective bound (LP relaxation lower bound, `float`) known to Gurobi at this moment. Refreshed on each Gurobi callback firing. Returns `float("-inf")` until Gurobi has produced its first bound (e.g., during `Start` or before the root LP is solved). Note that `BestUpdated` often fires from a heuristic before the LP runs, so `bound()` may still be `-inf` there; use `Timer` events (which fire after LP processing) to read meaningful bounds.
- **`self.timer(seconds)`** — set/disable the Timer interval (effective on the next callback boundary)
- **`self.hint(sol)`** — provide a hint solution (queued and injected at the next `MIPNODE` callback)

#### Example: Custom Callback

```python
import pyqbpp as qbpp

class MySolver(qbpp.GurobiSolver):
    def callback(self):
        if self.event() == qbpp.GurobiSolver.EVENT_START:
            self.timer(1.0)          # fire Timer events every 1 second
        if self.event() == qbpp.GurobiSolver.EVENT_BEST_UPDATED:
            sol = self.best_sol()
            print(f"New best: energy={sol.energy} TTS={sol.tts:.3f}s")

x = qbpp.var("x", shape=8)
f = qbpp.sqr(qbpp.sum(x) - 4)
f.simplify_as_binary()

solver = MySolver(f)
sol = solver.search(time_limit=5, target_energy=0)
print(f"energy={sol.energy}")
```

### Solution Hint

A hint solution allows warm-starting a search with a previously found solution.

The simplest way is to call `solver.hint(prev_sol)` before `search()`:
```python
solver.hint(prev_sol)
sol = solver.search(time_limit=10)
```

This is queued and delivered to Gurobi at the start of optimization (also written as MIPSTART when possible).

For advanced use cases such as feeding solutions from an external solver concurrently, you can also call `self.hint(sol)` inside a callback. Hints injected from a callback are queued and delivered at the next `MIPNODE` event (Gurobi's API restriction). Setting up a periodic `self.timer()` is recommended so the callback runs regularly.

### Setup

Follow Gurobi's official Software Installation Guide. After extracting the Gurobi tar.gz, set the standard environment variables (Linux x86_64):

```sh
export GUROBI_HOME="$HOME/gurobi1301/linux64"
export PATH="${PATH}:${GUROBI_HOME}/bin"
export LD_LIBRARY_PATH="${LD_LIBRARY_PATH}:${GUROBI_HOME}/lib"
```

Place your license at `~/gurobi.lic`, or set `GRB_LICENSE_FILE`. That's it — no `pip install gurobipy` required, no `make` in `$GUROBI_HOME/src/build`. PyQBPP loads `libgurobi<MAJOR><MINOR>.so` lazily (via `ctypes.CDLL` on the ctypes backend, or via `dlopen` from the C++ wrapper on the nanobind backend) from the same setup the C++ side uses.

For ARM64 Linux, replace `linux64` with `armlinux64`.

## CplexSolver

[IBM CPLEX](https://www.ibm.com/products/ilog-cplex-optimization-studio)
MIQP — the commercial sibling of Gurobi. A valid CPLEX license is
required at runtime; the free Community Edition is limited to ~1000
variables. BQM only:

```python
sol = qbpp.CplexSolver(e).search(time_limit=10.0)
```

Recognized `search()` kwargs: `time_limit` (s, mapped to
`parameters.timelimit`), `thread_count` (`parameters.threads`),
`target_energy`. Any other kwarg is forwarded to
`cplex.parameters.<name>.set(value)` (dotted paths supported).

## DimodExactSolver

Brute-force enumeration of all `2**n` assignments via
[`dimod.ExactSolver`](https://docs.ocean.dwavesys.com/projects/dimod/en/latest/reference/sampler_composites/samplers.html).
Feasible only for small problems (typically `n <= 20`); returns every
assignment in the SampleSet sorted by energy. Ideal for **verifying**
a small model or **benchmarking** heuristics:

```python
sol = qbpp.DimodExactSolver(e).search()
print(sol.energy)
for s in sol.sols:
    print(s.energy)
```

BQM only; no kwargs (the search is exhaustive).

## QiskitOptimizationSolver

[IBM Qiskit Optimization](https://qiskit-community.github.io/qiskit-optimization/)
— builds an ``qiskit_optimization.QuadraticProgram`` and solves it with
a configurable :class:`MinimumEigenOptimizer`. The default eigensolver
is the **classical** :class:`NumPyMinimumEigensolver` (exact — useful
for verifying small models). Inject ``QAOA`` / ``VQE`` for quantum
simulation:

```python
from qiskit_algorithms import QAOA
from qiskit_algorithms.optimizers import COBYLA
from qiskit.primitives import Sampler
sol = qbpp.QiskitOptimizationSolver(
    e, eigensolver=QAOA(Sampler(), COBYLA(), reps=2)).search()
```

BQM only — Qiskit's `QuadraticProgram` is quadratic by definition. For
HUBO via QAOA/VQE you'd need to construct a Pauli Hamiltonian directly;
that path is not yet wrapped here.

---

# Heuristic samplers and annealers

> **⚠️ Experimental — PyQBPP only**
>
> The third-party solvers themselves (Fixstars Amplify, D-Wave Advantage /
> Leap Hybrid, OpenJij, TYTAN-SDK, qubovert, Simulated Bifurcation) are
> production tools. What is **experimental** here is the PyQBPP integration —
> the wrapper classes. Their API may change without notice in future PyQBPP
> releases. They are **available only from PyQBPP (Python)**, not from the C++
> QUBO++ library: each backend ships only as a Python package, so PyQBPP
> forwards models to them directly through Python. Each solver requires the
> corresponding third-party Python package to be installed separately; they are
> imported lazily when a solver is instantiated.

These solvers draw samples from the QUBO/HUBO and return the best assignment
found — there is no optimality certificate.

**About negated literals.** PyQBPP expressions (`Expr`) can hold `~x`
literals inside terms of degree ≥ 3, but solvers marked "❌ requires
`all_positive=True`" target backends that cannot represent `~x` directly.
For those you must pre-process the expression with
`qbpp.simplify_as_binary(expr, all_positive=True)` to expand every `~x`
into `(1 - x)` before constructing the solver; otherwise solver
construction raises `RuntimeError`. Solvers marked `—` only accept
degree ≤ 2, where Model construction already rejects any `~x`, so
`all_positive=True` never enters the picture for them.

The D-Wave QPU, D-Wave Neal, OpenJij, and TYTAN-SDK samplers do not
have a wall-clock time limit concept. PyQBPP rejects `time_limit=...`
for these solvers with a clear error rather than silently ignoring it
(the underlying dimod samplers generally accept unknown kwargs without
complaint).

## Unified `num_reads` keyword

Each backend uses a different native name for "number of independent
samples to draw" — D-Wave / dimod / OpenJij call it `num_reads`,
TYTAN-SDK calls it `shots`, qubovert calls it `num_anneals`, Simulated
Bifurcation calls it `agents`. PyQBPP accepts the unified keyword
**`num_reads`** on all five and forwards it to the backend's native
parameter:

| Solver | Native key | `num_reads` alias |
|---|---|:---:|
| `DWaveSolver` / `DWaveNealSolver` / `DWaveTabuSolver` / `DWaveSteepestDescentSolver` / `OpenJijSolver` | `num_reads` | (passthrough) |
| `HobotanMikasSolver` | `shots` | ✅ |
| `QubovertSolver` | `num_anneals` | ✅ |
| `SimulatedBifurcationSolver` | `agents` | ✅ (each agent → one sample) |

The native key is still accepted; if both are passed, the native key
takes precedence. This lets solver-agnostic code use a single
parameter name across the entire experimental solver suite:

```python
for cls in [qbpp.DWaveNealSolver, qbpp.OpenJijSolver,
            qbpp.QubovertSolver, qbpp.HobotanMikasSolver]:
    sol = cls(e).search(num_reads=200)
    print(cls.__name__, sol.energy)
```

## Platform support

All solvers in this group run on both x86_64 and aarch64 (ARM) Linux.
The PyPI wheels are listed below; if you are on an unlisted Python
version, pip falls back to a source build, which works for `dimod` /
`dwave-samplers` / `dwave-system` (small Cython extensions) but is
laborious for `amplify` and `openjij`/`jij-cimod`. Use a Python version
with prebuilt wheels when possible.

| Package | Linux x86_64 | Linux aarch64 | Required Python |
|---|:---:|:---:|---|
| `amplify` | ✅ | ✅ | **3.10+** (no aarch64 wheels for 3.9 or older) |
| `openjij` + `jij-cimod` | ✅ | ✅ | **3.10–3.12** for aarch64 wheels |
| `dimod` | ✅ | ✅ | **3.10+** for aarch64 wheels |
| `dwave-samplers` (Neal) | ✅ | ✅ | **3.10+** for aarch64 wheels |
| `dwave-cloud-client`, `dwave-system` | ✅ pure-Python | ✅ pure-Python | any |

In practice this means:

- **Ubuntu 22.04 / 24.04** (default Python 3.10 / 3.12) on x86_64 or
  ARM: install with plain `pip install ...` and you are done.
- **Ubuntu 20.04** (default Python 3.8): the wheels are unavailable.
  Either install Python 3.10+ from the
  [deadsnakes PPA](https://launchpad.net/~deadsnakes/+archive/ubuntu/ppa)
  and use a venv, or move to a newer Ubuntu release.

## AmplifySolver

Calls the [Fixstars Amplify SDK](https://amplify.fixstars.com/). The default
backend is the Fixstars Amplify Annealing Engine; any Amplify client
(`FixstarsClient`, `FujitsuDA4Client`, `LeapHybridSamplerClient`, …) can
be supplied via `client=`.

```python
import pyqbpp as qbpp

x = qbpp.var("x", 4)
e = qbpp.sqr(x[0] + 2*x[1] + 3*x[2] + 4*x[3] - 5)

# Default: Fixstars AE
sol = qbpp.AmplifySolver(e).search(token="...", time_limit=1.0)

# Inject a different Amplify client
from amplify import FujitsuDA4Client
sol = qbpp.AmplifySolver(e, client=FujitsuDA4Client(token="...")
                         ).search(time_limit=5.0)
```

Recognized `search()` kwargs:

| kwarg | meaning |
|---|---|
| `time_limit` | seconds (float). Sets `client.parameters.timeout`. |
| `token` | API token. Sets `client.token`. |
| `proxy` / `url` | network overrides. |
| any other | forwarded to `client.parameters.<name>` if the attribute exists. |

`AmplifySolver` accepts polynomials of arbitrary degree. The Amplify SDK
quadratizes higher-degree terms automatically when the chosen backend
requires it.

## DWaveSolver

Calls the D-Wave QPU (Advantage) directly via the Ocean SDK. Minor
embedding is automatic (`EmbeddingComposite(DWaveSampler(...))`). For
offline experimentation, inject any dimod-compatible sampler.

```python
import pyqbpp as qbpp

# Live QPU
sol = qbpp.DWaveSolver(e, token="DEV-...", solver="Advantage_system6.4"
                       ).search(num_reads=1000, chain_strength=2.0)

# Offline classical SA (use DWaveNealSolver instead — see below)
from dwave.samplers import SimulatedAnnealingSampler
sol = qbpp.DWaveSolver(e, sampler=SimulatedAnnealingSampler()
                       ).search(num_reads=1000)
```

`DWaveSolver` requires the model to be **degree ≤ 2** (BQM). Higher-degree
terms must be quadratized first; trying to construct `DWaveSolver` from a
HUBO raises a `RuntimeError`.

`time_limit` is **not supported**: the QPU runtime is the product of
`num_reads` and `annealing_time` (microseconds per anneal). Passing
`time_limit=...` raises a `RuntimeError` to prevent the wall-clock budget
from being silently ignored.

## DWaveNativeSolver

Submits a problem that is **already laid out on the QPU's native topology**
to a specified Advantage annealer **without minor-embedding**. Unlike
`DWaveSolver` (which lets minorminer place a logical problem onto arbitrary
qubits), each variable is mapped onto **one specific physical qubit** via
`qubit_map`, using a trivial chain-length-1 embedding. The instance's
interaction graph must therefore be a subgraph of the target QPU's working
graph — by default this is **validated before submission**.

This is the right solver for benchmarks generated directly on the hardware
coupler graph (e.g. a random Ising spin glass on the Advantage Pegasus
graph), where the variable indices already correspond to physical qubits, so
no re-embedding is wanted.

```python
import pyqbpp as qbpp

# Ising laid out directly on the Advantage native graph: the index of each
# variable is the physical qubit number; J keys are existing couplers.
s = qbpp.var("s", num_qubits)
E = qbpp.expr()
for (i, j), c in couplers.items():     # i, j are physical qubit indices
    E += c * s[i] * s[j]
for i, hi in fields.items():
    E += hi * s[i]
qubo = qbpp.spin_to_binary(E)          # spin -> binary QUBO (value preserved)

# Map each variable to its physical qubit and submit with NO embedding.
qubit_map = {s[i]: i for i in qubits}
sol = qbpp.DWaveNativeSolver(qubo, qubit_map,
                             token="DEV-...", solver="Advantage_system4.1"
                             ).search(num_reads=1000, annealing_time=20)
print(sol.energy)
```

- **`qubit_map`** maps each qbpp variable (or its integer index) to a physical
  qubit index on the target solver, e.g. `{s[i]: i for i in qubits}`.
- **`validate=True`** (default) checks that every mapped qubit is in the QPU
  `nodelist` and every degree-2 interaction is in its `edgelist` before
  submission, raising a `RuntimeError` that lists the missing qubits/couplers
  if the instance does not fit the working graph. Set `validate=False` to skip
  the check.

For offline testing without a QPU, inject a structured mock as the child
sampler:

```python
import dimod
from dwave.samplers import SimulatedAnnealingSampler
child = dimod.StructureComposite(SimulatedAnnealingSampler(), nodelist, edgelist)
sol = qbpp.DWaveNativeSolver(qubo, qubit_map, sampler=child).search(num_reads=100)
```

Like `DWaveSolver`, requires degree ≤ 2, and `time_limit` is **not
supported** (use `num_reads` / `annealing_time`).

## DWaveHybridSolver

Calls the D-Wave [Leap Hybrid Sampler](https://docs.ocean.dwavesys.com/),
which combines classical optimization with QPU calls and handles much
larger problems than the bare QPU (~10⁶ variables). Wall-clock control
via `time_limit` (seconds).

```python
sol = qbpp.DWaveHybridSolver(e, token="DEV-...").search(time_limit=5)
```

Like `DWaveSolver`, requires degree ≤ 2.

## DWaveNealSolver

Despite the "DWave" prefix, **Neal is not a quantum solver**. It is a
classical CPU-based simulated-annealing implementation distributed by
D-Wave in the [`dwave-samplers`](https://docs.ocean.dwavesys.com/en/stable/docs_samplers/)
package (formerly the standalone `dwave-neal` package). No Leap token,
no network access, no D-Wave account required.

Useful as a fast classical baseline alongside `OpenJijSolver`::

```python
sol = qbpp.DWaveNealSolver(e).search(num_reads=1000)
```

Common `search()` kwargs (forwarded to
`SimulatedAnnealingSampler.sample(bqm, **kwargs)`): `num_reads`,
`num_sweeps`, `beta_range`, `beta_schedule_type`, `seed`. Like `DWaveSolver`,
`time_limit` is rejected and degree must be ≤ 2.

## DWaveTabuSolver

Tabu-search heuristic via the [`dwave-samplers`](https://docs.ocean.dwavesys.com/en/stable/docs_samplers/)
package. Classical, local, no token / network. Useful as a non-SA
baseline alongside `DWaveNealSolver` and `OpenJijSolver`:

```python
sol = qbpp.DWaveTabuSolver(e).search(num_reads=10, timeout=2000)
```

Common `search()` kwargs forwarded to `TabuSampler.sample()`:
`num_reads`, `timeout` (milliseconds, *per restart*), `tenure`,
`num_restarts`, `seed`, `initial_states`. BQM only; `time_limit` is
rejected.

## DWaveSteepestDescentSolver

Greedy local descent via `dwave-samplers`. Each initial state is
descended monotonically to a local minimum — deterministic given the
seed, fast, and a useful baseline:

```python
sol = qbpp.DWaveSteepestDescentSolver(e).search(num_reads=100)
```

Common `search()` kwargs: `num_reads`, `initial_states`, `seed`,
`large_sparse_opt`. BQM only.

## OpenJijSolver

Calls [OpenJij](https://www.openjij.org/) (Jij Inc., open-source Ising/QUBO
sampler). The default sampler is `openjij.SASampler()` (Simulated
Annealing); inject `SQASampler()` (Simulated Quantum Annealing),
`CSQASampler()` (Continuous-time SQA), or any cloud sampler from JijZept.

**HUBO support.** When the model has `max_degree >= 3`, OpenJijSolver
dispatches to `SASampler.sample_hubo()` instead of `sample()`. No
quadratization needed — terms of any degree go straight to the sampler
as a sparse dict. Negated literals (`~x`) at any degree are
auto-expanded to `1 - x` because OpenJij's dict format has no native
notion of negation.

`sample_hubo()` is currently only on `openjij.SASampler`. Injecting
`SQASampler` / `CSQASampler` for a `max_degree >= 3` problem raises a
clear error.

```python
import pyqbpp as qbpp
import openjij as oj

# QUBO via SA
x = qbpp.var("x", 4)
f = qbpp.sqr(x[0] + x[1] + x[2] + x[3] - 1)
f.simplify_as_binary()
sol = qbpp.OpenJijSolver(f).search(num_reads=1000)

# HUBO degree 3 — sample_hubo() is used automatically
e = x[0] * x[1] * x[2] - x[0]
e.simplify_as_binary()
sol = qbpp.OpenJijSolver(e).search(num_reads=200)

# SQA — QUBO only (passing the HUBO e would error)
sol = qbpp.OpenJijSolver(f, sampler=oj.SQASampler()).search(num_reads=100)
```

Common `search()` kwargs (forwarded to the underlying sample call):
`num_reads`, `num_sweeps`, `beta_min`, `beta_max`, `schedule`, `seed`.
`time_limit` is rejected; control runtime via `num_reads` / `num_sweeps`.

## HobotanMikasSolver

Calls [TYTAN-SDK](https://github.com/tytansdk/tytan)'s **MIKASAmpler**,
a PyTorch-based simulated-annealing sampler that handles **HUBO directly**
(no quadratization step). Despite the SDK name "TYTAN" / "Hobotan", no
token / license / network is required — MIKAS runs locally on CPU or
GPU (CUDA / MPS) via PyTorch.

Install (the SDK is published only on GitHub, not PyPI):

```bash
pip install -U git+https://github.com/tytansdk/tytan
pip install torch          # CPU build; PyTorch CUDA / MPS auto-detected
```

Use:

```python
import pyqbpp as qbpp
x = qbpp.var("x", 4)
e = qbpp.Expr(x[0]*x[1]*x[2]) + qbpp.Expr(x[1]*x[2]*x[3]) - qbpp.Expr(x[0])
sol = qbpp.HobotanMikasSolver(e).search(shots=100)
```

Common `search()` kwargs (forwarded to `MIKASAmpler.run(hobo, **kwargs)`):
`shots`, `mode` (`"CPU"` / `"GPU"`), `T_init`, `T_end`, `num_sweep`.
Like the other dimod-style solvers, `time_limit` is rejected; control
runtime via `shots` / `num_sweep`.

> **Sparse HUBO is rejected.** TYTAN's HUBO format is a **dense** tensor
> of shape `(n,)*d` where `n` = variable count, `d` = max degree. PyQBPP
> rejects problems whose `n^d` exceeds 10⁸ to prevent memory blow-up.
> For very sparse high-degree problems prefer `ABS3Solver` (built-in,
> sparse, GPU-accelerated) instead.

## QubovertSolver

[qubovert](https://github.com/jiosue/qubovert) is a pure-Python QUBO/HUBO
toolkit. ``QubovertSolver`` uses `qubovert.sim.anneal_pubo` — classical
simulated annealing on a sparse PUBO (Polynomial Unconstrained Binary
Optimization) representation, supporting **any degree** with no tensor
blow-up:

```python
sol = qbpp.QubovertSolver(e).search(num_anneals=100)
```

No token, no GPU, no native deps — just `pip install qubovert`.
Negated literals are auto-expanded via `simplify_as_binary(e, all_positive=True)`.

Common `search()` kwargs (forwarded to `anneal_pubo`):
`num_anneals`, `anneal_duration`, `initial_state`, `seed`,
`temperature_range`, `schedule`. `time_limit` is rejected.

## SimulatedBifurcationSolver

[simulated-bifurcation](https://github.com/bqth29/simulated-bifurcation-algorithm)
implements Toshiba's **Simulated Bifurcation (SB)** algorithm — a fast
classical heuristic for QUBO/Ising, often competitive with SA on dense
quadratic problems. PyTorch-based; runs on CPU or GPU:

```python
sol = qbpp.SimulatedBifurcationSolver(e).search(agents=128, max_steps=10000)
```

Common `search()` kwargs (forwarded to `sb.minimize`):
`agents`, `max_steps`, `mode` (`"ballistic"` / `"discrete"`), `heated`,
`early_stopping`, `timeout` (seconds, internal). BQM only — HUBO is
rejected (use `OpenJijSolver` / `HobotanMikasSolver` / `QubovertSolver`
for higher-degree problems). `time_limit` is rejected.

---

## Common return type

All solvers on this page return the standard PyQBPP `SolverSol` (same as
`EasySolverSol`/`ABS3SolverSol`/`GurobiSolverSol`), so the rest of your
program is solver-agnostic:

```python
print(sol.energy)            # best objective value
print(sol.tts)               # time-to-best-solution (seconds)
print(sol.info["solver"])    # "GurobiSolver" / "AmplifySolver" / "DWaveSolver" / ...
for s in sol.sols:           # additional candidate solutions
    print(s.energy, s.tts)
```

The `sol.info` dict varies by solver:

- `GurobiSolver` / `CplexSolver`: `status`, `bound`, `mip_gap`, `node_count`, …
- `AmplifySolver`: `amplify_version`, `client`, `execution_time`,
  `response_time`, `total_time`, …
- `DWaveSolver` / `DWaveHybridSolver`: `dimod_<key>` for every entry in
  the underlying `SampleSet.info` (timing, embedding context, …).
- `OpenJijSolver`: `dimod_<key>` likewise.
