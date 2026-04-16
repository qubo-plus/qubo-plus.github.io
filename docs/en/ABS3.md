---
layout: default
nav_exclude: true
title: "ABS3 Solver"
nav_order: 21
lang: en
hreflang_alt: "ja/ABS3"
hreflang_lang: "ja"
---

# ABS3 Solver Usage
Solving an expression `f` using the ABS3 Solver involves the following three steps:
1. Create an ABS3 Solver (or **`qbpp::ABS3Solver`**) object for the expression `f`.
2. Call the **`search()`** member function, passing parameters as an initializer list. It returns the obtained solution.

## Solving LABS problem using the ABS3 Solver
The following QUBO++ program solves the **Low Autocorrelation Binary Sequence (LABS)** problem using the ABS3 Solver:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/abs3_solver.hpp>

int main() {
  const size_t size = 100;
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

  auto solver = qbpp::ABS3Solver(f);

  auto sol = solver.search({{"time_limit", 10.0}, {"enable_default_callback", 1}});
  std::cout << sol.energy() << ": ";
  for (auto val : sol(x)) {
    std::cout << (val == 0 ? "-" : "+");
  }
  std::cout << std::endl;
}
```
{% endraw %}
In this program, an ABS3 Solver object **`solver`** is first created for the expression `f`.
The **`search()`** member function is then called with parameters passed as an initializer list.
The `time_limit` option specifies the maximum search time in seconds, while `enable_default_callback` enables a built-in callback function that prints the energy and TTS of newly found best solutions during the search.
This function returns the best solution found within the given time limit, which is stored in `sol`.

The program prints the energy of the solution and the corresponding binary sequence, where "+" represents 1 and "-" represents 0.

This program produces the following output:
```
TTS = 0.002s Energy = 1218
TTS = 0.002s Energy = 1170
TTS = 0.002s Energy = 994
TTS = 0.015s Energy = 958
TTS = 0.018s Energy = 922
TTS = 0.034s Energy = 874
TTS = 4.364s Energy = 834
834: -+--+---++-++-+---++-++--+++--+-+-+++++----+++-+-+---++-+--+-----+--+----++----+-+--++++++---+------
```

## ABS3 Solver object
An ABS3 Solver (or `qbpp::ABS3Solver`) object is created for a given expression.
When the solver object is constructed, the expression is converted into an internal data format and loaded into GPU memory.
An optional second argument `gpu` controls GPU usage:
- **`qbpp::ABS3Solver(expression)`**: Automatically uses all available GPUs. If no GPU is available, falls back to CPU-only mode.
- **`qbpp::ABS3Solver(expression, 0)`**: Forces CPU-only mode (no GPU is used).
- **`qbpp::ABS3Solver(expression, n)`**: Uses `n` GPUs.

Search parameters are passed directly to `search()` as an initializer list of key-value pairs.
In the example above:
- **`"time_limit", 10.0`**: Sets the time limit to 10.0 seconds.
- **`"enable_default_callback", 1`**: Enables the built-in callback function, which prints the energy of newly obtained solutions.

## ABS3 Parameters
Parameters are passed directly to the `search()` method as an initializer list.
In the program above, `"time_limit", 10.0` sets the time limit to 10.0 seconds
and `"enable_default_callback", 1` enables the built-in callback function, which prints the energy of newly obtained solutions.

### Basic Options

| Key | Value | Description |
|----|----|----|
| **`time_limit`** | time limit in seconds | Terminates the search when the time limit is reached |
| **`target_energy`** | target energy value | Terminates the search when the target energy is achieved |

### Advanced Options

| Key | Value | Description |
|----|----|----|
| **`enable_default_callback`** | "1" | Enables the built-in callback that prints energy and TTS |
| **`cpu_enable`** | "0" or "1" | Enables/disables the CPU solver running alongside the GPU (default: "1") |
| **`cpu_thread_count`** | number of CPU threads | Number of CPU solver threads (default: auto) |
| **`block_count`** | CUDA block count per GPU | Number of CUDA blocks launched by the solver kernel |
| **`thread_count`** | thread count per CUDA block | Number of threads per CUDA block |
| **`topk_sols`** | number of solutions | Returns the top-K solutions with the best energies |
| **`best_energy_sols`** | max count ("0" = unlimited) | Returns all solutions with the best energy found |

## Collecting Multiple Solutions

The ABS3 Solver can collect multiple solutions during the search.
Two modes are available:

### Top-K Solutions (`topk_sols`)

The `topk_sols` parameter collects the top-K solutions sorted by energy in ascending order.

{% raw %}
```cpp
auto result = solver.search({{"topk_sols", 10}});  // collect up to 10 best solutions
```
{% endraw %}

### Best Energy Solutions (`best_energy_sols`)

The `best_energy_sols` parameter collects all solutions that share the best energy found.
Whenever a better energy is discovered, the pool is cleared and only solutions with the new best energy are kept.

{% raw %}
```cpp
auto result = solver.search({{"best_energy_sols", 0}});  // collect all best-energy solutions (unlimited)
```
{% endraw %}

Alternatively, `best_energy_sols` can be set with a maximum count:
{% raw %}
```cpp
auto result = solver.search({{"best_energy_sols", 100}});  // collect up to 100
```
{% endraw %}

Note that `topk_sols` and `best_energy_sols` share the same internal pool.
If both are specified, the last one takes effect.

### Accessing Collected Solutions

The `search()` method returns an `ABS3Sols` object, which provides access to the collected solutions:

```cpp
auto result = solver.search(params);

std::cout << "Best energy: " << result.energy << std::endl;
std::cout << "Number of solutions: " << result.size() << std::endl;

for (const auto& sol : result.sols()) {
  std::cout << "Energy = " << sol.energy() << " TTS = " << sol.tts() << "s" << std::endl;
}
```

The `ABS3Sols` object supports:
- **`size()`** — number of collected solutions
- **`sols()`** / **`sols()`** — access the solution vector
- **`operator[](i)`** — access the i-th solution
- Range-based for loop iteration

## Custom Callback

The built-in callback (enabled by `enable_default_callback`) simply prints the energy and TTS whenever a new best solution is found.
For more control, you can subclass `ABS3Solver` and override the `callback()` virtual method.

The callback is invoked with one of the following events:

| Event | Description |
|-------|-------------|
| `CallbackEvent::Start` | Called once at the beginning of `search()` |
| `CallbackEvent::BestUpdated` | Called whenever a new best solution is found |
| `CallbackEvent::Timer` | Called periodically at a configurable interval |

Inside the callback, the following methods are available:
- **`best_sol()`** — returns `const qbpp::Sol&` to the current best solution. Use `.energy`, `.tts`, `.get(var)`, etc.
- **`event()`** — returns the event that triggered this callback
- **`hint(sol)`** — provides a hint solution to the solver during the search (see [Solution Hint](#solution-hint))

### Timer Control

The `Timer` event is not enabled by default.
To enable periodic timer callbacks, call `timer(seconds)` inside the `callback()` method:
- **`timer(1.0)`** — fire `Timer` callbacks every 1 second
- **`timer(0)`** — disable the timer
- If `timer()` is not called, the timer interval remains unchanged.

Typically, `timer()` is called once during the `Start` callback to establish the interval.
It can also be called during `BestUpdated` or `Timer` callbacks to adjust or disable the timer dynamically.

### Example: Custom Callback
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/abs3_solver.hpp>

class MySolver : public qbpp::ABS3Solver {
 public:
  using ABS3Solver::ABS3Solver;

  void callback() const override {
    if (event() == qbpp::CallbackEvent::Start) {
      timer(1.0);  // enable timer callback every 1 second
    }
    if (event() == qbpp::CallbackEvent::BestUpdated) {
      std::cout << "New best: energy=" << best_sol().energy
                << " TTS=" << best_sol().tts << "s" << std::endl;
    }
  }
};

int main() {
  auto x = qbpp::var("x", 8);
  auto f = qbpp::sum(x) == 4;
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
```cpp
params.hint(sol);  // provide a hint solution for the search
auto result = solver.search(params);
```
The solution is written directly to the solver's internal data structure before the search begins.

For advanced use cases such as running an external solver concurrently, you can also call **`hint(sol)`** during a callback to feed solutions dynamically.
In this scenario, setting up a periodic timer (e.g., `timer(1.0)`) is recommended so that the callback is invoked regularly to check for new external solutions.

### Example: Providing a Hint Solution

The following example solves a factorization problem twice.
The first run finds the optimal solution normally.
The second run provides the first solution as a hint via `params.hint(sol)`, causing the solver to converge much faster.

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/abs3_solver.hpp>

int main() {
  auto p = 2 <= qbpp::var_int("p") <= 1000;
  auto q = 2 <= qbpp::var_int("q") <= 1000;
  auto f = p * q == 899 * 997;
  f.simplify_as_binary();

  auto solver = qbpp::ABS3Solver(f);

  // Run 1: normal search
  const auto sol1 = solver.search({{"target_energy", 0}, {"time_limit", 10}, {"enable_default_callback", 1}});
  std::cout << "Run 1: p=" << sol1(p) << " q=" << sol1(q)
            << " energy=" << sol1.energy << std::endl;

  // Run 2: provide previous solution as a hint
  qbpp::abs3_solver::Params params2({{"target_energy", 0}, {"time_limit", 10}, {"enable_default_callback", 1}});
  params2.hint(sol1);
  const auto sol2 = solver.search(params2);
  std::cout << "Run 2: p=" << sol2(p) << " q=" << sol2(q)
            << " energy=" << sol2.energy
            << " TTS=" << sol2.tts << "s" << std::endl;
}
```
{% endraw %}

The hint solution is written directly to the solver's internal data structure before the search begins.
The solver evaluates its energy and uses it as the initial state, then continues searching for better solutions.
