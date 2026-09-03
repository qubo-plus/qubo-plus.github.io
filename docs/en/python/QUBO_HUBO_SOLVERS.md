---
last_modified: 2026-08-29
layout: default
nav_exclude: true
title: "QUBO/HUBO Solvers"
nav_order: 22
lang: en
hreflang_alt: "ja/python/QUBO_HUBO_SOLVERS"
hreflang_lang: "ja"
---

# QUBO/HUBO Solvers — OpenJij, dimod samplers, Qiskit, …

This page covers external solvers that consume a **QUBO/HUBO model directly**,
with no linearization step. PyQBPP hands the polynomial (or its quadratic /
Ising form) straight to the backend. They fall into two groups:

1. **Exact optimizers that accept the quadratic objective directly**
   ([`DimodExactSolver`](#dimodexactsolver),
   [`QiskitOptimizationSolver`](#qiskitoptimizationsolver)) — enumeration /
   exact algorithms that return a proven optimum. No Fortet auxiliary
   variables are introduced; the quadratic objective is given to the solver
   as-is.
2. **Heuristic samplers and annealers**
   (the [D-Wave samplers](#dwavenealsolver), [`OpenJijSolver`](#openjijsolver),
   [`HobotanMikasSolver`](#hobotanmikassolver), [`QubovertSolver`](#qubovertsolver),
   [`SimulatedBifurcationSolver`](#simulatedbifurcationsolver)) — physics-inspired
   or local-search heuristics that draw samples and return the best one found.

> **Where other solvers live.** Solvers that require **linearization** of the
> quadratic objective into a pure MILP (SCIP, HiGHS, GLPK, CBC) are documented
> under [MILP Solvers](MILP_SOLVERS). Google OR-Tools CP-SAT, a
> constraint-programming engine, is documented under [CP Solvers](CP_SOLVERS).

> **Experimental.** These integrations are provided for experimentation and
> benchmarking, and their wrapper API may change without notice. The solvers
> on this page have **no C++ entry
> point**. Each backend ships only as a Python package and is imported lazily
> when a solver is instantiated; PyQBPP does not depend on these packages
> directly.

All solvers return the standard PyQBPP solution object and follow the same
`search()` protocol as [`qbpp.EasySolver`](EASYSOLVER) /
[`qbpp.ABS3Solver`](ABS3), so the rest of your program stays solver-agnostic:

```python
solver = qbpp.OpenJijSolver(e)        # or DWaveNealSolver / QubovertSolver / ...
sol    = solver.search(num_reads=100)
print(sol.energy, sol.info)
```

## At a glance

| Solver | Group | Backend | Install | Token | `time_limit` | HUBO | Negated literals |
|---|---|---|---|---|---|---|---|
| [`DimodExactSolver`](#dimodexactsolver) | exact (enum) | dimod brute-force (≤ ~20 vars) | `pip install dimod` | no | no | ❌ degree ≤ 2 | — |
| [`QiskitOptimizationSolver`](#qiskitoptimizationsolver) | exact / quantum | IBM Qiskit Optimization (classical or QAOA / VQE) | `pip install qiskit qiskit-optimization qiskit-algorithms` | no | no | ❌ degree ≤ 2 | — |
| [`DWaveNealSolver`](#dwavenealsolver) | sampler | D-Wave Neal — classical SA, **not a quantum solver** | `pip install dwave-samplers` | **no** | **no** — use `num_reads` | ❌ degree ≤ 2 | — |
| [`DWaveTabuSolver`](#dwavetabusolver) | sampler | D-Wave samplers — classical Tabu search | `pip install dwave-samplers` | **no** | **no** — use `timeout` (ms) | ❌ degree ≤ 2 | — |
| [`DWaveSteepestDescentSolver`](#dwavesteepestdescentsolver) | sampler | D-Wave samplers — greedy local descent | `pip install dwave-samplers` | **no** | **no** — use `num_reads` | ❌ degree ≤ 2 | — |
| [`OpenJijSolver`](#openjijsolver) | sampler | OpenJij (local SA / SQA, open-source) | `pip install openjij` | **no** | **no** — use `num_reads` | ✅ via `sample_hubo` (SASampler) | ❌ requires `all_positive=True` |
| [`HobotanMikasSolver`](#hobotanmikassolver) | sampler | TYTAN-SDK MIKASAmpler — HUBO-native PyTorch SA | `pip install -U git+https://github.com/tytansdk/tytan` (+ `torch`) | **no** | **no** — use `shots` | ✅ dense tensor | ❌ requires `all_positive=True` |
| [`QubovertSolver`](#qubovertsolver) | sampler | qubovert.sim.anneal_pubo — pure-Python HUBO SA | `pip install qubovert` | **no** | **no** — use `num_anneals` | ✅ sparse PUBO | ❌ requires `all_positive=True` |
| [`SimulatedBifurcationSolver`](#simulatedbifurcationsolver) | sampler | Toshiba SB algorithm (PyTorch CPU/GPU) | `pip install simulated-bifurcation` | **no** | **no** — use `timeout` / `max_steps` | ❌ degree ≤ 2 | — |

---

# Exact optimizers (quadratic objective accepted directly)

These solvers enumerate or solve exactly over the original quadratic
objective and return a **proven optimum**. They require **degree ≤ 2** (BQM); reduce a HUBO to QUBO first, or
use a HUBO-capable solver such as [`ABS3Solver`](ABS3).



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
> The third-party solvers themselves (dwave-samplers,
> OpenJij, TYTAN-SDK, qubovert, Simulated Bifurcation) are
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
| `DWaveNealSolver` / `DWaveTabuSolver` / `DWaveSteepestDescentSolver` / `OpenJijSolver` | `num_reads` | (passthrough) |
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
laborious for `openjij`/`jij-cimod`. Use a Python version
with prebuilt wheels when possible.

| Package | Linux x86_64 | Linux aarch64 | Required Python |
|---|:---:|:---:|---|
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
`num_sweeps`, `beta_range`, `beta_schedule_type`, `seed`.
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
e = x[0]*x[1]*x[2] + x[1]*x[2]*x[3] - x[0]
e.simplify_as_binary()
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
`EasySolverSol`/`ABS3SolverSol`), so the rest of your
program is solver-agnostic:

```python
print(sol.energy)            # best objective value
print(sol.tts)               # time-to-best-solution (seconds)
print(sol.info["solver"])    # "OpenJijSolver" / "DWaveNealSolver" / ...
for s in sol.sols:           # additional candidate solutions
    print(s.energy, s.tts)
```

The `sol.info` dict varies by solver:

- dimod-based samplers (`DWaveNealSolver`, …): `dimod_<key>` for every
  entry in the underlying `SampleSet.info`.
- `OpenJijSolver`: `dimod_<key>` likewise.
