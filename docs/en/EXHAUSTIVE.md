---
layout: default
nav_exclude: true
title: "Exhaustive Solver"
nav_order: 20
lang: en
hreflang_alt: "ja/EXHAUSTIVE"
hreflang_lang: "ja"
---

# Exhaustive Solver Usage
The **Exhaustive Solver** is a complete-search solver for QUBO/HUBO expressions.
Since all possible assignments are examined, the optimality of the solutions is guaranteed.
The search is parallelized using CPU threads, and if a CUDA GPU is available, GPU acceleration is automatically enabled to further speed up the search.

Solving a problem with the Exhaustive Solver consists of the following three steps:
1. Create an Exhaustive Solver (`qbpp::ExhaustiveSolver`) object.
2. Call the `search()` member function, optionally passing parameters as an initializer list.


## Creating Exhaustive Solver object
To use the Exhaustive Solver, an Exhaustive Solver object
(`qbpp::ExhaustiveSolver`) is constructed with an expression
(`qbpp::Expr`) object as follows:
- **`qbpp::ExhaustiveSolver(const qbpp::Expr& f)`**:
Here, `f` is the expression to be solved.
It must be simplified as a binary expression in advance by calling the
`simplify_as_binary()` function.
This function converts the given expression `f` into an internal format that is
used during the solution search.

## Setting Parameters
Search parameters are passed directly to `search()` as an initializer list of key-value pairs.
The following parameters are available:

| Parameter | Value | Description |
|---|---|---|
| `target_energy` | energy string | Sets a target energy for early termination. When the solver finds a solution with energy ≤ the target, the search terminates immediately. |
| `verbose` | `"1"` or `"true"` | Displays the search progress as a percentage, which is helpful for estimating the total runtime. |
| `enable_default_callback` | `"1"` or `"true"` | Enables the default callback function, which prints newly obtained best solutions. |
| `topk_sols` | integer string | Collects the top-k solutions with the lowest energy. |
| `best_energy_sols` | `"1"` | Collects all optimal solutions (those with the minimum energy). |
| `all_sols` | `"1"` or `"true"` | Collects all $2^n$ solutions. |

## Searching Solutions
- **`search()`**: Returns the best solution found (without parameters). If a CUDA GPU is available, the search is automatically accelerated using the GPU alongside CPU threads.
- **`search(params)`**: Returns a `Sol` object. When `topk_sols`, `best_energy_sols`, or `all_sols` is set, the collected solutions are accessible via `sol.sols()`, sorted in increasing order of energy.

# Program example
The following program searches for a solution to the
**Low Autocorrelation Binary Sequences (LABS)** problem using the Exhaustive
Solver:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  size_t size = 20;
  auto x = qbpp::var("x", size);
  auto f = qbpp::expr();
  for (size_t d = 1; d < size; ++d) {
    auto temp = qbpp::expr();
    for (size_t i = 0; i < size - d; ++i) {
      temp += (2 * x[i] - 1) * (2 * x[i + d] - 1);
    }
    f += qbpp::sqr(temp);
  }
  f.simplify_as_binary();

  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search({{"enable_default_callback", 1}});
  std::cout << sol.energy() << ": ";
  for (auto val : sol(x)) {
    std::cout << (val == 0 ? "-" : "+");
  }
  std::cout << std::endl;
}
```
{% endraw %}
The output of this program is as follows:
{% raw %}
```
TTS = 0.000s Energy = 1506
TTS = 0.000s Energy = 1030
TTS = 0.000s Energy = 502
TTS = 0.000s Energy = 446
TTS = 0.000s Energy = 234
TTS = 0.000s Energy = 110
TTS = 0.001s Energy = 106
TTS = 0.001s Energy = 74
TTS = 0.001s Energy = 66
TTS = 0.001s Energy = 42
TTS = 0.001s Energy = 34
TTS = 0.004s Energy = 26
26: --++-++----+----+-+-
```
{% endraw %}
All optimal solutions can be obtained by setting `best_energy_sols` as follows:
{% raw %}
```cpp
  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search({{"best_energy_sols", 1}});
  for (const auto& s : sol.sols()) {
    std::cout << s.energy << ": ";
    for (auto val : s(x)) {
      std::cout << (val == 0 ? "-" : "+");
    }
    std::cout << std::endl;
  }
```
{% endraw %}
The output is as follows:
{% raw %}
```
26: -----+-+++-+--+++--+
26: --++-++----+----+-+-
26: -+-+----+----++-++--
26: -++---++-+---+-+++++
26: +--+++--+-+++-+-----
26: +-+-++++-++++--+--++
26: ++--+--++++-++++-+-+
26: +++++-+---+-++---++-
```
{% endraw %}
The top-k solutions with the lowest energy can be obtained by setting `topk_sols` as follows:
{% raw %}
```cpp
  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search({{"topk_sols", 10}});
  for (const auto& s : sol.sols()) {
    std::cout << s.energy << ": ";
    for (auto val : s(x)) {
      std::cout << (val == 0 ? "-" : "+");
    }
    std::cout << std::endl;
  }
```
{% endraw %}
The output is as follows:
{% raw %}
```
26: -----+-+++-+--+++--+
26: --++-++----+----+-+-
26: -+-+----+----++-++--
26: -++---++-+---+-+++++
26: +--+++--+-+++-+-----
26: +-+-++++-++++--+--++
26: ++--+--++++-++++-+-+
26: +++++-+---+-++---++-
34: ++--++--+-++-+-+++++
34: +++---+-+-++++-++-++
```
{% endraw %}
Furthermore, all solutions, including non-optimal ones, can be obtained by setting `all_sols` as follows.
Note that this stores all $2^n$ solutions in memory, where $n$ is the number of variables.
For example, with $n = 20$, over one million solutions are stored, and memory usage grows exponentially with $n$.
Use this only when $n$ is small enough.
{% raw %}
```cpp
  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search({{"all_sols", 1}});
  for (const auto& s : sol.sols()) {
    std::cout << s.energy << ": ";
    for (auto val : s(x)) {
      std::cout << (val == 0 ? "-" : "+");
    }
    std::cout << std::endl;
  }
```
{% endraw %}
This prints all $2^{20}$ solutions in increasing order of energy, as
shown below:
{% raw %}
```
26: -----+-+++-+--+++--+
26: --++-++----+----+-+-
26: -+-+----+----++-++--
26: -++---++-+---+-+++++
26: +--+++--+-+++-+-----
26: +-+-++++-++++--+--++
26: ++--+--++++-++++-+-+
26: +++++-+---+-++---++-
34: -----+-+--+-++--++--
34: ----+----++-++---+-+
34: ----+--+++--+-+++-+-
34: ---+++-+-+----+--+--
34: ---+++++-+++-++-+-++
34: --+--+----+-+-+++---
34: --+-+--+---+-----+++
34: --++--++-+--+-+-----
34: -+--+------+-+++---+
34: -+--+-+---+---+++++-
[omitted]
```
{% endraw %}
