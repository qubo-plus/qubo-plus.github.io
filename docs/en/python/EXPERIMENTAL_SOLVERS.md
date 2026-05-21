---
layout: default
nav_exclude: true
title: "Experimental Solver Support"
nav_order: 25
lang: en
hreflang_alt: "ja/python/EXPERIMENTAL_SOLVERS"
hreflang_lang: "ja"
---

# Experimental Solver Support: Amplify, D-Wave, OpenJij

> **⚠️ Experimental — PyQBPP only**
>
> The third-party solvers themselves (Fixstars Amplify, D-Wave Advantage /
> Leap Hybrid, OpenJij) are production tools. What is **experimental** here
> is the PyQBPP integration — the wrapper classes `AmplifySolver`,
> `DWaveSolver`, `DWaveHybridSolver`, and `OpenJijSolver`. Their API may
> change without notice in future PyQBPP releases.
>
> They are **available only from PyQBPP (Python)**, not from the C++
> QUBO++ library. Each backend (Amplify SDK, D-Wave Ocean SDK, OpenJij)
> ships only as a Python package, so PyQBPP forwards models to them
> directly through Python — there is no C++ entry point.
>
> Each solver requires the corresponding third-party Python package to be
> installed separately. PyQBPP does **not** depend on these packages directly;
> they are imported lazily when a solver is instantiated.

PyQBPP can dispatch a model to the following external solvers without any
changes to your problem formulation. The solver protocol mirrors
[`qbpp.EasySolver`](EASYSOLVER) and [`qbpp.GurobiSolver`](GUROBI):

```python
solver = qbpp.AmplifySolver(e)        # or DWaveSolver / DWaveHybridSolver / OpenJijSolver
sol    = solver.search(...)
print(sol.energy, sol.info)
```

## At a glance

| Solver | Backend | Install | Token | `time_limit` | HUBO | Negated literals |
|---|---|---|---|---|---|---|
| [`AmplifySolver`](#amplifysolver) | Fixstars Amplify SDK (cloud — Fixstars AE, Fujitsu DA, etc.) | `pip install amplify` | yes (default Fixstars AE) | yes | ✅ (auto-quadratized by SDK) | ❌ requires `all_positive=True` |
| [`DWaveSolver`](#dwavesolver) | D-Wave QPU (Advantage, via Ocean SDK) | `pip install dwave-ocean-sdk` | yes (D-Wave Leap) | **no** — use `num_reads` | ❌ degree ≤ 2 | — |
| [`DWaveHybridSolver`](#dwavehybridsolver) | D-Wave Leap Hybrid Sampler | `pip install dwave-ocean-sdk` | yes (D-Wave Leap) | yes | ❌ degree ≤ 2 | — |
| [`DWaveNealSolver`](#dwavenealsolver) | D-Wave Neal — classical SA, **not a quantum solver** | `pip install dwave-samplers` | **no** | **no** — use `num_reads` | ❌ degree ≤ 2 | — |
| [`DWaveTabuSolver`](#dwavetabusolver) | D-Wave samplers — classical Tabu search | `pip install dwave-samplers` | **no** | **no** — use `timeout` (ms) | ❌ degree ≤ 2 | — |
| [`DWaveSteepestDescentSolver`](#dwavesteepestdescentsolver) | D-Wave samplers — greedy local descent | `pip install dwave-samplers` | **no** | **no** — use `num_reads` | ❌ degree ≤ 2 | — |
| [`DimodExactSolver`](#dimodexactsolver) | dimod brute-force enumeration (≤ ~20 vars) | `pip install dimod` | **no** | **no** | ❌ degree ≤ 2 | — |
| [`OpenJijSolver`](#openjijsolver) | OpenJij (local SA / SQA, open-source) | `pip install openjij` | **no** | **no** — use `num_reads` | ✅ via `sample_hubo` (SASampler) | ❌ requires `all_positive=True` |
| [`HobotanMikasSolver`](#hobotanmikassolver) | TYTAN-SDK MIKASAmpler — HUBO-native PyTorch SA | `pip install -U git+https://github.com/tytansdk/tytan` (+ `torch`) | **no** | **no** — use `shots` | ✅ dense tensor | ❌ requires `all_positive=True` |
| [`QubovertSolver`](#qubovertsolver) | qubovert.sim.anneal_pubo — pure-Python HUBO SA | `pip install qubovert` | **no** | **no** — use `num_anneals` | ✅ sparse PUBO | ❌ requires `all_positive=True` |
| [`SimulatedBifurcationSolver`](#simulatedbifurcationsolver) | Toshiba SB algorithm (PyTorch CPU/GPU) | `pip install simulated-bifurcation` | **no** | **no** — use `timeout` / `max_steps` | ❌ degree ≤ 2 | — |
| [`CplexSolver`](#cplexsolver) | IBM CPLEX MIQP (commercial) | `pip install cplex` (license required) | **no** (license) | yes | ❌ degree ≤ 2 | — |
| [`QiskitOptimizationSolver`](#qiskitoptimizationsolver) | IBM Qiskit Optimization (classical or QAOA / VQE) | `pip install qiskit qiskit-optimization qiskit-algorithms` | **no** | **no** — configure on eigensolver | ❌ degree ≤ 2 | — |
| [`OrToolsCpSatSolver`](#ortoolscpsatsolver) | Google OR-Tools CP-SAT (HUBO via Boolean encoding) | `pip install ortools` | **no** | yes | ✅ via Boolean AND | ✅ native (`BoolVar.Not()`) |

**About negated literals.** PyQBPP expressions (`Expr`) can hold `~x`
literals inside terms of degree ≥ 3, but solvers marked "❌ requires
`all_positive=True`" target backends that cannot represent `~x` directly.
For those you must pre-process the expression with
`qbpp.simplify_as_binary(expr, all_positive=True)` to expand every `~x`
into `(1 - x)` before constructing the solver; otherwise solver
construction raises `RuntimeError`. Solvers marked `—` only accept
degree ≤ 2, where Model construction already rejects any `~x`, so
`all_positive=True` never enters the picture for them.
`OrToolsCpSatSolver` is the sole HUBO solver in this list that handles
`~x` natively via `BoolVar.Not()`, so passing `all_positive=True` is
unnecessary (and would blow up the term count, so it's discouraged).

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
parameter name across the entire experimental solver suite::

    for cls in [qbpp.DWaveNealSolver, qbpp.OpenJijSolver,
                qbpp.QubovertSolver, qbpp.HobotanMikasSolver]:
        sol = cls(e).search(num_reads=200)
        print(cls.__name__, sol.energy)

## Platform support

All solvers on this page run on both x86_64 and aarch64 (ARM) Linux.
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
`num_sweeps`, `beta_range`, `beta_schedule_type`. Like `DWaveSolver`,
`time_limit` is rejected and degree must be ≤ 2.

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
sol = qbpp.OpenJijSolver(qbpp.sqr(x[0]+x[1]+x[2]+x[3]-1)).search(num_reads=1000)

# HUBO degree 3 — sample_hubo() is used automatically
e = qbpp.Expr(x[0]*x[1]*x[2]) - qbpp.Expr(x[0])
sol = qbpp.OpenJijSolver(e).search(num_reads=200)

# SQA — only for QUBO; HUBO would error
sol = qbpp.OpenJijSolver(e_quad, sampler=oj.SQASampler()).search(num_reads=100)
```

Common `search()` kwargs (forwarded to the underlying sample call):
`num_reads`, `num_sweeps`, `beta_min`, `beta_max`, `schedule`.
`time_limit` is rejected; control runtime via `num_reads` / `num_sweeps`.

## DWaveTabuSolver

Tabu-search heuristic via the [`dwave-samplers`](https://docs.ocean.dwavesys.com/en/stable/docs_samplers/)
package. Classical, local, no token / network. Useful as a non-SA
baseline alongside `DWaveNealSolver` and `OpenJijSolver`::

    sol = qbpp.DWaveTabuSolver(e).search(num_reads=10, timeout=2000)

Common `search()` kwargs forwarded to `TabuSampler.sample()`:
`num_reads`, `timeout` (milliseconds, *per restart*), `tenure`,
`num_restarts`, `seed`, `initial_states`. BQM only; `time_limit` is
rejected.

## DWaveSteepestDescentSolver

Greedy local descent via `dwave-samplers`. Each initial state is
descended monotonically to a local minimum — deterministic given the
seed, fast, and a useful baseline::

    sol = qbpp.DWaveSteepestDescentSolver(e).search(num_reads=100)

Common `search()` kwargs: `num_reads`, `initial_states`, `seed`,
`large_sparse_opt`. BQM only.

## DimodExactSolver

Brute-force enumeration of all `2**n` assignments via
[`dimod.ExactSolver`](https://docs.ocean.dwavesys.com/projects/dimod/en/latest/reference/sampler_composites/samplers.html).
Feasible only for small problems (typically `n <= 20`); returns every
assignment in the SampleSet sorted by energy. Ideal for **verifying**
a small model or **benchmarking** heuristics::

    sol = qbpp.DimodExactSolver(e).search()
    print(sol.energy)
    for s in sol.sols:
        print(s.energy)

BQM only; no kwargs (the search is exhaustive).

## HobotanMikasSolver

Calls [TYTAN-SDK](https://github.com/tytansdk/tytan)'s **MIKASAmpler**,
a PyTorch-based simulated-annealing sampler that handles **HUBO directly**
(no quadratization step). Despite the SDK name "TYTAN" / "Hobotan", no
token / license / network is required — MIKAS runs locally on CPU or
GPU (CUDA / MPS) via PyTorch.

Install (the SDK is published only on GitHub, not PyPI)::

    pip install -U git+https://github.com/tytansdk/tytan
    pip install torch          # CPU build; PyTorch CUDA / MPS auto-detected

Use::

    import pyqbpp as qbpp
    x = qbpp.var("x", 4)
    e = qbpp.Expr(x[0]*x[1]*x[2]) + qbpp.Expr(x[1]*x[2]*x[3]) - qbpp.Expr(x[0])
    sol = qbpp.HobotanMikasSolver(e).search(shots=100)

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
blow-up::

    sol = qbpp.QubovertSolver(e).search(num_anneals=100)

No token, no GPU, no native deps — just `pip install qubovert`.
Negated literals are auto-expanded via `simplify_as_binary(e, all_positive=True)`.

Common `search()` kwargs (forwarded to `anneal_pubo`):
`num_anneals`, `anneal_duration`, `initial_state`, `seed`,
`temperature_range`, `schedule`. `time_limit` is rejected.

## SimulatedBifurcationSolver

[simulated-bifurcation](https://github.com/bqth29/simulated-bifurcation-algorithm)
implements Toshiba's **Simulated Bifurcation (SB)** algorithm — a fast
classical heuristic for QUBO/Ising, often competitive with SA on dense
quadratic problems. PyTorch-based; runs on CPU or GPU::

    sol = qbpp.SimulatedBifurcationSolver(e).search(agents=128, max_steps=10000)

Common `search()` kwargs (forwarded to `sb.minimize`):
`agents`, `max_steps`, `mode` (`"ballistic"` / `"discrete"`), `heated`,
`early_stopping`, `timeout` (seconds, internal). BQM only — HUBO is
rejected (use `OpenJijSolver` / `HobotanMikasSolver` / `QubovertSolver`
for higher-degree problems). `time_limit` is rejected.

## CplexSolver

[IBM CPLEX](https://www.ibm.com/products/ilog-cplex-optimization-studio)
MIQP — the commercial sibling of Gurobi. A valid CPLEX license is
required at runtime; the free Community Edition is limited to ~1000
variables. BQM only::

    sol = qbpp.CplexSolver(e).search(time_limit=10.0)

Recognized `search()` kwargs: `time_limit` (s, mapped to
`parameters.timelimit`), `thread_count` (`parameters.threads`),
`target_energy`. Any other kwarg is forwarded to
`cplex.parameters.<name>.set(value)` (dotted paths supported).

## QiskitOptimizationSolver

[IBM Qiskit Optimization](https://qiskit-community.github.io/qiskit-optimization/)
— builds an ``qiskit_optimization.QuadraticProgram`` and solves it with
a configurable :class:`MinimumEigenOptimizer`. The default eigensolver
is the **classical** :class:`NumPyMinimumEigensolver` (exact — useful
for verifying small models). Inject ``QAOA`` / ``VQE`` for quantum
simulation::

    from qiskit_algorithms import QAOA
    from qiskit.primitives import Sampler
    sol = qbpp.QiskitOptimizationSolver(
        e, eigensolver=QAOA(Sampler(), reps=2)).search()

BQM only — Qiskit's `QuadraticProgram` is quadratic by definition. For
HUBO via QAOA/VQE you'd need to construct a Pauli Hamiltonian directly;
that path is not yet wrapped here.

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

Common `search()` kwargs:
`time_limit` (s, mapped to `parameters.max_time_in_seconds`),
`thread_count` (`num_search_workers`), `log` (boolean).

## Common return type

All fourteen solvers return the standard PyQBPP `SolverSol` (same as
`EasySolverSol`/`ABS3SolverSol`/`GurobiSolverSol`), so the rest of your
program is solver-agnostic:

```python
print(sol.energy)            # best objective value
print(sol.tts)               # time-to-best-solution (seconds)
print(sol.info["solver"])    # "AmplifySolver" / "DWaveSolver" / ...
for s in sol.sols:           # additional candidate solutions
    print(s.energy, s.tts)
```

The `sol.info` dict varies by solver:

- `AmplifySolver`: `amplify_version`, `client`, `execution_time`,
  `response_time`, `total_time`, …
- `DWaveSolver` / `DWaveHybridSolver`: `dimod_<key>` for every entry in
  the underlying `SampleSet.info` (timing, embedding context, …).
- `OpenJijSolver`: `dimod_<key>` likewise.
