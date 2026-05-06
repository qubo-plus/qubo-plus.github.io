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

| Solver | Backend | Install | Token | `time_limit` |
|---|---|---|---|---|
| [`AmplifySolver`](#amplifysolver) | Fixstars Amplify SDK (cloud — Fixstars AE, Fujitsu DA, etc.) | `pip install amplify` | yes (default Fixstars AE) | yes |
| [`DWaveSolver`](#dwavesolver) | D-Wave QPU (Advantage, via Ocean SDK) | `pip install dwave-ocean-sdk` | yes (D-Wave Leap) | **no** — use `num_reads` |
| [`DWaveHybridSolver`](#dwavehybridsolver) | D-Wave Leap Hybrid Sampler | `pip install dwave-ocean-sdk` | yes (D-Wave Leap) | yes |
| [`OpenJijSolver`](#openjijsolver) | OpenJij (local SA / SQA, open-source) | `pip install openjij` | no | **no** — use `num_reads` |

The D-Wave QPU and OpenJij samplers do not have a wall-clock time limit
concept. PyQBPP rejects `time_limit=...` for these solvers with a clear
error rather than silently ignoring it (the underlying dimod samplers
generally accept unknown kwargs without complaint).

## Platform support

All three solvers run on both x86_64 and aarch64 (ARM) Linux. The PyPI
wheels are listed below; if you are on an unlisted Python version, pip
falls back to a source build, which works for `dimod`/`dwave-system`
(small Cython extensions) but is laborious for `amplify` and
`openjij`/`jij-cimod`. Use a Python version with prebuilt wheels when
possible.

| Package | Linux x86_64 | Linux aarch64 | Required Python |
|---|:---:|:---:|---|
| `amplify` | ✅ | ✅ | **3.10+** (no aarch64 wheels for 3.9 or older) |
| `openjij` + `jij-cimod` | ✅ | ✅ | **3.10–3.12** for aarch64 wheels |
| `dimod` | ✅ | ✅ | **3.10+** for aarch64 wheels |
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

# Offline simulated annealing (no token, no network)
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

## OpenJijSolver

Calls [OpenJij](https://www.openjij.org/) (Jij Inc., open-source Ising/QUBO
sampler). The default sampler is `openjij.SASampler()` (Simulated
Annealing); inject `SQASampler()` (Simulated Quantum Annealing),
`CSQASampler()` (Continuous-time SQA), or any cloud sampler from JijZept.

```python
import pyqbpp as qbpp
import openjij as oj

# Default: local Simulated Annealing
sol = qbpp.OpenJijSolver(e).search(num_reads=1000)

# SQA
sol = qbpp.OpenJijSolver(e, sampler=oj.SQASampler()).search(num_reads=100)
```

Common `search()` kwargs (forwarded to `sampler.sample(bqm, **kwargs)`):
`num_reads`, `num_sweeps`, `beta_min`, `beta_max`, `schedule`. Like
`DWaveSolver`, `time_limit` is rejected and degree must be ≤ 2.

## Common return type

All four solvers return the standard PyQBPP `SolverSol` (same as
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
