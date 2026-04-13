---
layout: default
nav_exclude: true
title: "Search Parameters"
nav_order: 18
lang: en
hreflang_alt: "ja/PARAMS"
hreflang_lang: "ja"
---

# Search Parameters

All three solvers in QUBO++ — **Easy Solver**, **Exhaustive Solver**, and **ABS3 Solver** — accept search parameters through `search()`.
Parameters are key-value pairs.
Values can be strings, integers, or floating-point numbers — numeric values are automatically converted to strings internally.

## Passing Parameters

Pass an initializer list directly to `search()`:
{% raw %}
```cpp
auto sol = solver.search({{"time_limit", 10}, {"target_energy", 0}});
```
{% endraw %}
Values can be mixed — strings, integers, and floating-point numbers:
{% raw %}
```cpp
auto sol = solver.search({{"time_limit", 2.5}, {"target_energy", "0"}});
```
{% endraw %}

When you need to build parameters programmatically, create a `qbpp::Params` object and use `operator()`:
```cpp
qbpp::Params params;
params("time_limit", 10);
params("target_energy", 0);
auto sol = solver.search(params);
```

## Common Parameters

The following parameters are shared by all three solvers:

| Parameter | Type | Description |
|---|---|---|
| `target_energy` | integer | Stop when a solution with energy ≤ this value is found. |
| `enable_default_callback` | `0`/`1` | Print newly obtained best solutions to stderr. Default: `0`. |
| `topk_sols` | integer | Keep up to N top-k solutions during the search. |
| `best_energy_sols` | `0`/`1` | Keep all solutions with the best energy. `0` = unlimited count. |

## Easy Solver Parameters

| Parameter | Type | Description | Default |
|---|---|---|---|
| `time_limit` | float | Time limit in seconds. `0` for no limit. | `10.0` |
| `target_energy` | integer | Target energy. | (none) |
| `enable_default_callback` | `0`/`1` | Print progress. | `0` |
| `topk_sols` | integer | Top-k solutions to keep. | (disabled) |
| `best_energy_sols` | `0`/integer | Best-energy solutions to keep. | (disabled) |

Example:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

auto solver = qbpp::EasySolver(f);
auto sol = solver.search({{"time_limit", 5}, {"target_energy", 0}});
```
{% endraw %}

## Exhaustive Solver Parameters

The Exhaustive Solver does not have a `time_limit` parameter because it performs a complete search.

| Parameter | Type | Description | Default |
|---|---|---|---|
| `target_energy` | integer | Target energy (for early termination). | (none) |
| `verbose` | `0`/`1` | Display search progress percentage. | `0` |
| `enable_default_callback` | `0`/`1` | Print progress. | `0` |
| `topk_sols` | integer | Top-k solutions to keep. | (disabled) |
| `best_energy_sols` | `0`/`1` | Keep all optimal solutions. | (disabled) |
| `all_sols` | `0`/`1` | Keep all feasible solutions. | (disabled) |

Example:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

auto solver = qbpp::ExhaustiveSolver(f);
auto sol = solver.search({{"target_energy", 0}});
```
{% endraw %}

## ABS3 Solver Parameters

| Parameter | Type | Description | Default |
|---|---|---|---|
| `time_limit` | float | Time limit in seconds. | `10.0` |
| `target_energy` | integer | Target energy. | (none) |
| `enable_default_callback` | `0`/`1` | Print progress. | `0` |
| `topk_sols` | integer | Top-k solutions to keep. | (disabled) |
| `best_energy_sols` | `0`/`1` | Keep all optimal solutions. | (disabled) |
| `cpu_enable` | `0`/`1` | Enable/disable CPU solver. | `1` |
| `cpu_thread_count` | integer | Number of CPU threads. | (auto) |
| `block_count` | integer | Number of GPU blocks. | (auto) |
| `thread_count` | integer | Number of GPU threads per block. | (auto) |

Example:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/abs3_solver.hpp>

auto solver = qbpp::abs3::ABS3Solver(f);
auto sol = solver.search({{"time_limit", 10}, {"target_energy", 0}});
```
{% endraw %}

## Error Handling
Unknown parameter keys will cause a `std::runtime_error` at runtime.
