---
layout: default
nav_exclude: true
title: "Gurobi Solver"
nav_order: 22
lang: en
hreflang_alt: "ja/GUROBI"
hreflang_lang: "ja"
---

# Gurobi Optimizer Usage
QUBO++ can solve QUBO expressions using the [Gurobi Optimizer](https://www.gurobi.com).
A valid Gurobi license is required.

Solving an expression `f` using **`qbpp::GurobiSolver`** involves the following two steps:
1. Create a Gurobi solver (`qbpp::GurobiSolver`) object for the expression `f`.
2. Call the **`search()`** member function, passing parameters as an initializer list. It returns the obtained solution.

The interface is intentionally aligned with `qbpp::ABS3Solver`, so most user code can switch between solvers with minimal changes.

## Solving a partition problem using the Gurobi Solver
The following QUBO++ program solves a number partitioning problem using the Gurobi Optimizer:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/gurobi.hpp>

int main() {
  std::vector<int> w = {64, 27, 47, 74, 12, 83, 63, 40};
  auto x = qbpp::var("x", w.size());
  auto p = qbpp::toExpr(0);
  auto q = qbpp::toExpr(0);
  for (size_t i = 0; i < w.size(); ++i) {
    p += w[i] * x[i];
    q += w[i] * (1 - x[i]);
  }
  auto f = qbpp::sqr(p - q);
  f.simplify_as_binary();

  auto solver = qbpp::GurobiSolver(f);
  auto sol = solver.search({{"time_limit", 10.0}, {"enable_default_callback", 1}});

  std::cout << "energy = " << sol.energy() << std::endl;
  std::cout << "bound  = " << sol.info().get("bound") << std::endl;
  std::cout << "status = " << sol.info().get("status") << std::endl;
  std::cout << "P :"; for (size_t i = 0; i < w.size(); ++i) if (sol(x[i]) == 1) std::cout << " " << w[i];
  std::cout << std::endl;
  std::cout << "Q :"; for (size_t i = 0; i < w.size(); ++i) if (sol(x[i]) == 0) std::cout << " " << w[i];
  std::cout << std::endl;
}
```
{% endraw %}

The program first creates a `GurobiSolver` object for the expression `f`.
The `search()` member function is then called with parameters as an initializer list.
The `time_limit` option specifies the maximum search time in seconds, and `enable_default_callback` enables a built-in callback that prints the energy and TTS of newly found best solutions during the search.

When the energy of the obtained solution equals the lower bound returned by `sol.info().get("bound")`, the solution is guaranteed to be optimal:

```
energy = 0
bound  = 0.000000
status = OPTIMAL
P : 64 27 74 40
Q : 47 12 83 63
```

## GurobiSolver object
A `qbpp::GurobiSolver` object is created from a given expression.
On construction, the expression is converted to Gurobi's internal model (`GRBmodel`):
- **`qbpp::GurobiSolver(expression)`**: Builds a Gurobi model from the expression.

`GurobiSolver` only supports **QUBO** (degree ≤ 2). If the expression contains higher-degree terms (HUBO), the constructor throws an exception.
Reduce the HUBO to QUBO using auxiliary variables, or use `qbpp::ABS3Solver` / `qbpp::EasySolver`, which support arbitrary degree.

## Gurobi Parameters
Parameters are passed directly to `search()` as an initializer list of key-value pairs.
The keys recognized by qbpp's wrapper are listed below; **any key not in this list is forwarded transparently to Gurobi**, so the full set of [Gurobi parameters](https://docs.gurobi.com/projects/optimizer/en/current/reference/parameters.html) is available (e.g., `MIPFocus`, `Heuristics`, `Cuts`, `Seed`, `LogFile`, `OutputFlag`, ...).

### Basic Options

| Key | Value | Description |
|----|----|----|
| **`time_limit`** | time limit in seconds | Terminates the search when the time limit is reached |
| **`target_energy`** | target energy value | Terminates the search when the target energy is achieved |
| **`thread_count`** | number of threads | Number of Gurobi worker threads |

### Advanced Options

| Key | Value | Description |
|----|----|----|
| **`enable_default_callback`** | `1` | Enables the built-in callback that prints energy and TTS |
| **`callback_timer_interval`** | seconds | Initial interval for `Timer` callback events |
| **`topk_sols`** | number of solutions | Returns the top-K solutions (sets `PoolSearchMode=2` and `PoolSolutions=K`) |
| **`license_file`** | path | Overrides `$GRB_LICENSE_FILE` |

> Note: `best_energy_sols` (ABS3) is not provided here because Gurobi's solution pool does not have a "best-energy-only" mode — equal-energy filtering would require a different API (e.g., `PoolGap=0`).

Other Gurobi-native parameter names (e.g., `"MIPFocus", 1`, `"Heuristics", 0.5`, `"OutputFlag", 1`) can be passed in the same initializer list and are forwarded to Gurobi as-is.

## Collecting Multiple Solutions

Setting `topk_sols` enables Gurobi's solution pool, returning multiple distinct solutions sorted by energy.

{% raw %}
```cpp
auto result = solver.search({{"topk_sols", 5}});

std::cout << "Best energy: " << result.energy() << std::endl;
std::cout << "Number of additional solutions: " << result.size() << std::endl;
for (const auto& s : result.sols) {
  std::cout << "energy=" << s.energy() << " tts=" << s.tts() << "s" << std::endl;
}
```
{% endraw %}

The returned object provides:
- **`energy()`** — energy of the best (incumbent) solution
- **`sols`** — vector of additional pool solutions (sorted by ascending energy)
- **`size()`** — number of additional solutions
- **`info().get(key)`** — solver info strings (see below)

## Solver Info

`sol.info()` carries strings produced by Gurobi:

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

The callback API is identical to `qbpp::ABS3Solver`. Subclass `qbpp::GurobiSolver` and override the `callback()` virtual method:

| Event | Description |
|-------|-------------|
| `CallbackEvent::Start` | Called once at the beginning of `search()` |
| `CallbackEvent::BestUpdated` | Called whenever Gurobi finds a new incumbent (i.e., `MIPSOL`) |
| `CallbackEvent::Timer` | Called periodically at the interval set by `timer(seconds)` |

Inside the callback, the following methods are available:
- **`event()`** — current event
- **`best_sol()`** — current best `qbpp::Sol`. Valid during `BestUpdated`; cached afterwards for `Timer`. Undefined during `Start`.
- **`bound()`** — best objective bound (LP relaxation lower bound, `double`) known to Gurobi at this moment. Refreshed on each Gurobi callback firing. Returns `-infinity` until Gurobi has produced its first bound (e.g., during `Start` or before the root LP is solved). Note that `BestUpdated` (= `MIPSOL`) often fires from a heuristic before the LP runs, so `bound()` may still be `-infinity` there; use `Timer` events (which fire from the `MIP` context after LP processing) to read meaningful bounds.
- **`timer(seconds)`** — set/disable the Timer interval (effective on the next callback boundary)
- **`hint(sol)`** — provide a hint solution (queued and injected at the next `MIPNODE` callback)

### Example: Custom Callback
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/gurobi.hpp>

class MySolver : public qbpp::GurobiSolver {
 public:
  using GurobiSolver::GurobiSolver;

  void callback() const override {
    if (event() == qbpp::CallbackEvent::Start) {
      timer(1.0);  // fire Timer events every 1 second
    }
    if (event() == qbpp::CallbackEvent::BestUpdated) {
      std::cout << "New best: energy=" << best_sol().energy()
                << " TTS=" << best_sol().tts() << "s" << std::endl;
    }
  }
};

int main() {
  auto x = qbpp::var("x", 8);
  auto f = qbpp::sqr(qbpp::sum(x) - 4);
  f.simplify_as_binary();

  auto solver = MySolver(f);
  auto sol = solver.search({{"time_limit", 5}, {"target_energy", 0}});
  std::cout << "energy=" << sol.energy() << std::endl;
}
```
{% endraw %}

## Solution Hint

A hint solution allows warm-starting a search with a previously found solution.

The simplest way is to call **`params.hint(sol)`** before `search()`:
{% raw %}
```cpp
qbpp::Params params({{"time_limit", 10.0}});
params.hint(prev_sol);
auto result = solver.search(params);
```
{% endraw %}

This writes the solution to Gurobi's MIPSTART attribute (`GRB_DBL_ATTR_START`).

For advanced use cases such as feeding solutions from an external solver concurrently, you can also call **`hint(sol)`** during a callback. Hints injected from a callback are queued and delivered to Gurobi at the next `MIPNODE` event (Gurobi's API restriction). Setting up a periodic `timer()` is recommended so the callback runs regularly.

## Setup

Gurobi installation and license setup follow Gurobi's official Software Installation Guide. After extracting the Gurobi tar.gz, set the standard environment variables (Linux x86_64):

```sh
export GUROBI_HOME="$HOME/gurobi1301/linux64"
export PATH="${PATH}:${GUROBI_HOME}/bin"
export LD_LIBRARY_PATH="${LD_LIBRARY_PATH}:${GUROBI_HOME}/lib"
export CPLUS_INCLUDE_PATH="${CPLUS_INCLUDE_PATH}:${GUROBI_HOME}/include"
```

Build (same flags as any other qbpp program — link only `-ldl -pthread`):
```sh
g++ -std=c++17 your_program.cpp -o your_program -ldl -pthread
```

`qbpp::GurobiSolver` loads `libgurobi<MAJOR><MINOR>.so` lazily via `dlopen`, so no link-time `-lgurobi*` flag is needed. **You do not need to run `make` in `$GUROBI_HOME/src/build`** — the C++ wrapper layer is not used. qbpp itself is also loaded via `dlopen`, so no `-lqbpp` is needed either.

For ARM64 Linux, replace `linux64` with `armlinux64`.
