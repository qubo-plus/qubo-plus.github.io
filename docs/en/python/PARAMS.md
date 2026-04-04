---
layout: default
nav_exclude: true
title: "Search Parameters"
nav_order: 19
lang: en
hreflang_alt: "ja/python/PARAMS"
hreflang_lang: "ja"
---

# Search Parameters

All three solvers in PyQBPP — **EasySolver**, **ExhaustiveSolver**, and **ABS3Solver** — accept search parameters through `search()`.
Parameters are passed as a standard Python **dict**.
Values can be strings, integers, or floats — they are automatically converted to strings before being passed to the C++ backend.

## Passing Parameters

Pass a dict directly to `search()`:
```python
sol = solver.search({"time_limit": 10, "target_energy": 0})
```
Values can be mixed — strings, integers, and floats:
```python
sol = solver.search({"time_limit": 2.5, "target_energy": "0"})
```

When you need to build parameters programmatically, create a dict and add entries:
```python
params = {}
params["time_limit"] = 10
params["target_energy"] = 0
sol = solver.search(params)
```

No special `Params` object is needed — a standard Python dict is all that is required.
Internally, PyQBPP converts each value to a string and passes the key-value pairs to the C++ solver.

## Common Parameters

The following parameters are shared by all three solvers:

| Parameter | Type | Description |
|---|---|---|
| `"target_energy"` | int | Stop when a solution with energy ≤ this value is found. |
| `"enable_default_callback"` | int (`0`/`1`) | Print newly obtained best solutions to stderr. Default: `0`. |
| `"topk_sols"` | int | Keep up to N top-k solutions during the search. |
| `"best_energy_sols"` | int (`0`/`1`) | Keep all solutions with the best energy. `0` = unlimited count. |

## EasySolver Parameters

| Parameter | Type | Description | Default |
|---|---|---|---|
| `"time_limit"` | float | Time limit in seconds. `0` for no limit. | `10.0` |
| `"target_energy"` | int | Target energy. | (none) |
| `"enable_default_callback"` | int (`0`/`1`) | Print progress. | `0` |
| `"topk_sols"` | int | Top-k solutions to keep. | (disabled) |
| `"best_energy_sols"` | int | Best-energy solutions to keep. | (disabled) |

Example:
```python
solver = qbpp.EasySolver(f)
sol = solver.search({"time_limit": 5, "target_energy": 0})
```

## ExhaustiveSolver Parameters

The ExhaustiveSolver does not have a `"time_limit"` parameter because it performs a complete search.

| Parameter | Type | Description | Default |
|---|---|---|---|
| `"target_energy"` | int | Target energy (for early termination). | (none) |
| `"verbose"` | int (`0`/`1`) | Display search progress percentage. | `0` |
| `"enable_default_callback"` | int (`0`/`1`) | Print progress. | `0` |
| `"topk_sols"` | int | Top-k solutions to keep. | (disabled) |
| `"best_energy_sols"` | int (`0`/`1`) | Keep all optimal solutions. | (disabled) |
| `"all_sols"` | int (`0`/`1`) | Keep all feasible solutions. | (disabled) |

Example:
```python
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search({"target_energy": 0})
```

Multiple solutions can be collected by combining parameters:
```python
sol = solver.search({"best_energy_sols": 0, "target_energy": 0})
for s in sol.sols():
    print(s.energy)
```

## ABS3Solver Parameters

| Parameter | Type | Description | Default |
|---|---|---|---|
| `"time_limit"` | float | Time limit in seconds. | `10.0` |
| `"target_energy"` | int | Target energy. | (none) |
| `"enable_default_callback"` | int (`0`/`1`) | Print progress. | `0` |
| `"topk_sols"` | int | Top-k solutions to keep. | (disabled) |
| `"best_energy_sols"` | int (`0`/`1`) | Keep all optimal solutions. | (disabled) |
| `"cpu_enable"` | int (`0`/`1`) | Enable/disable CPU solver. | `1` |
| `"cpu_thread_count"` | int | Number of CPU threads. | (auto) |
| `"block_count"` | int | Number of GPU blocks. | (auto) |
| `"thread_count"` | int | Number of GPU threads per block. | (auto) |

Example:
```python
solver = qbpp.ABS3Solver(f)
sol = solver.search({"time_limit": 10, "target_energy": 0})
```

## Error Handling
Unknown parameter keys will cause a runtime error.
