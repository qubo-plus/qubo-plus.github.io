---
layout: default
nav_exclude: true
title: "Gurobi Solver"
nav_order: 22
lang: en
hreflang_alt: "ja/python/GUROBI"
hreflang_lang: "ja"
---

# Gurobi Optimizer Usage
PyQBPP can solve QUBO expressions using the [Gurobi Optimizer](https://www.gurobi.com).
PyQBPP calls Gurobi's C runtime (`libgurobi*.so`) directly — **no `gurobipy` dependency**. On Python 3.11 and earlier (the ctypes backend) the call goes through `ctypes.CDLL`; on Python 3.12+ (the nanobind backend) it goes through the C++ header-only wrapper `qbpp/gurobi.hpp`, which `dlopen`s the same `libgurobi*.so`. Either way, the underlying runtime is the system Gurobi installation. A valid Gurobi license is required.

Solving an expression `f` using **`pyqbpp.GurobiSolver`** involves the following two steps:
1. Create a `GurobiSolver` object for the expression `f`.
2. Call the **`search()`** method with keyword arguments, which returns the obtained solution.

The interface mirrors `pyqbpp.ABS3Solver`, so most user code switches between solvers with no changes other than the class name.

## Solving a partition problem using the Gurobi Solver
The following program solves a number partitioning problem using the Gurobi Optimizer:
```python
import pyqbpp as qbpp

w = [64, 27, 47, 74, 12, 83, 63, 40]
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

## GurobiSolver object
A `GurobiSolver` object is created from a given expression.
On construction, the expression is converted to Gurobi's internal model:
- **`GurobiSolver(f)`**: Builds a Gurobi model from the expression.

`GurobiSolver` only supports **QUBO** (degree ≤ 2). If the expression contains higher-degree terms (HUBO), the constructor raises an exception.
Reduce the HUBO to QUBO using auxiliary variables, or use `pyqbpp.ABS3Solver` / `pyqbpp.EasySolver`, which support arbitrary degree.

## Gurobi Parameters
Parameters are passed directly to `search()` as keyword arguments (or as a single dict).
The keys recognized by pyqbpp's wrapper are listed below; **any key not in this list is forwarded transparently to Gurobi**, so the full set of [Gurobi parameters](https://docs.gurobi.com/projects/optimizer/en/current/reference/parameters.html) is available (e.g., `MIPFocus`, `Heuristics`, `Cuts`, `Seed`, `LogFile`, `OutputFlag`, ...).

### Basic Options

| Key | Type | Description |
|----|----|----|
| **`time_limit`** | float | Time limit in seconds. Terminates the search when reached |
| **`target_energy`** | int | Terminates the search when the target energy is achieved |
| **`thread_count`** | int | Number of Gurobi worker threads |

### Advanced Options

| Key | Type | Description |
|----|----|----|
| **`enable_default_callback`** | int (0 or 1) | Enables the built-in callback that prints energy and TTS |
| **`callback_timer_interval`** | float | Initial interval (seconds) for `Timer` callback events |
| **`topk_sols`** | int | Returns the top-K solutions (sets `PoolSearchMode=2` and `PoolSolutions=K`) |
| **`license_file`** | str | Overrides `$GRB_LICENSE_FILE` |

> Note: `best_energy_sols` (ABS3) is not provided here because Gurobi's solution pool does not have a "best-energy-only" mode — equal-energy filtering would require a different API (e.g., `PoolGap=0`).

Other Gurobi-native parameter names (e.g., `MIPFocus=1`, `Heuristics=0.5`, `OutputFlag=1`) can be passed as keyword arguments and are forwarded to Gurobi as-is.

The return value is a solution that provides `sol.energy`, `sol(x)`, `sol.info`, and more. See [QR_SOLUTION](QR_SOLUTION) for details.

## Collecting Multiple Solutions

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

## Solver Info

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

## Custom Callback

The callback API is identical to `pyqbpp.ABS3Solver`. **Subclass `GurobiSolver`** and override the `callback()` method (no arguments).

The callback is invoked with one of the following events:

| Event value | Constant | Description |
|:-:|----|----|
| `0` | `EVENT_START` | Called once at the beginning of `search()` |
| `1` | `EVENT_BEST_UPDATED` | Called whenever Gurobi finds a new incumbent (i.e., `MIPSOL`) |
| `2` | `EVENT_TIMER` | Called periodically at the interval set by `self.timer(seconds)` |

Inside `callback()`, the following methods are available:
- **`self.event()`** — current event (int: 0=Start, 1=BestUpdated, 2=Timer)
- **`self.best_sol()`** — current best solution. Use `.energy`, `.tts`, `.get(var)`, etc. Valid during `BestUpdated`; cached afterwards for `Timer`. Undefined during `Start`.
- **`self.bound()`** — best objective bound (LP relaxation lower bound, `float`) known to Gurobi at this moment. Refreshed on each Gurobi callback firing. Returns `float("-inf")` until Gurobi has produced its first bound (e.g., during `Start` or before the root LP is solved). Note that `BestUpdated` often fires from a heuristic before the LP runs, so `bound()` may still be `-inf` there; use `Timer` events (which fire after LP processing) to read meaningful bounds.
- **`self.timer(seconds)`** — set/disable the Timer interval (effective on the next callback boundary)
- **`self.hint(sol)`** — provide a hint solution (queued and injected at the next `MIPNODE` callback)

### Example: Custom Callback

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

## Solution Hint

A hint solution allows warm-starting a search with a previously found solution.

The simplest way is to call `solver.hint(prev_sol)` before `search()`:
```python
solver.hint(prev_sol)
sol = solver.search(time_limit=10)
```

This is queued and delivered to Gurobi at the start of optimization (also written as MIPSTART when possible).

For advanced use cases such as feeding solutions from an external solver concurrently, you can also call `self.hint(sol)` inside a callback. Hints injected from a callback are queued and delivered at the next `MIPNODE` event (Gurobi's API restriction). Setting up a periodic `self.timer()` is recommended so the callback runs regularly.

## Setup

Follow Gurobi's official Software Installation Guide. After extracting the Gurobi tar.gz, set the standard environment variables (Linux x86_64):

```sh
export GUROBI_HOME="$HOME/gurobi1301/linux64"
export PATH="${PATH}:${GUROBI_HOME}/bin"
export LD_LIBRARY_PATH="${LD_LIBRARY_PATH}:${GUROBI_HOME}/lib"
```

Place your license at `~/gurobi.lic`, or set `GRB_LICENSE_FILE`. That's it — no `pip install gurobipy` required, no `make` in `$GUROBI_HOME/src/build`. PyQBPP loads `libgurobi<MAJOR><MINOR>.so` lazily (via `ctypes.CDLL` on the ctypes backend, or via `dlopen` from the C++ wrapper on the nanobind backend) from the same setup the C++ side uses.

For ARM64 Linux, replace `linux64` with `armlinux64`.
