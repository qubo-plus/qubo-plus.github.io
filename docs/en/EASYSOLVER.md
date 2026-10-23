---
last_modified: 2026-10-19
layout: default
nav_exclude: true
title: "Easy Solver"
nav_order: 19
lang: en
hreflang_alt: "ja/EASYSOLVER"
hreflang_lang: "ja"
---

# Easy Solver Usage
The **Easy Solver** is a heuristic solver for QUBO/HUBO expressions.

Solving a problem with the Easy Solver consists of the following two steps:
1. Create an Easy Solver (or `qbpp::EasySolver`) object.
2. Search for solutions by calling the `search()` member function, passing parameters as an initializer list. It returns a `qbpp::EasySolverSol` object.

## Creating Easy Solver object
To use the Easy Solver, an Easy Solver object (or `qbpp::EasySolver`) is constructed with an expression (or `qbpp::Expr`) object as follows:
- **`qbpp::EasySolver(const qbpp::Expr& f)`**

Here, `f` is the expression to be solved.
It must be simplified as a binary expression in advance by calling the `simplify_as_binary()` function (an expression with only integer variables is simplified with `simplify()`).
This function converts the given expression `f` into an internal format that is used during the solution search.

## Setting Search Parameters
Search parameters are passed directly to the `search()` member function as an initializer list of key-value pairs.
The following parameters are available:

| Parameter | Description | Default |
|---|---|---|
| `time_limit` | Time limit in seconds. Set to `0` for no time limit. | `10.0` |
| `target_energy` | Target energy. The solver terminates when a solution with energy ≤ this value is found. With constraints declared by `cons()`, every constraint must also be satisfied (see [Solver support and semantics](CONSTRAINTS#solver-support-and-semantics)). | (none) |
| `enable_default_callback` | Set to `1` to print newly obtained best solutions. | `0` |
| `topk_sols` | Number of top-k solutions to keep. | (disabled) |
| `best_energy_sols` | Keep solutions with the best energy. `0` for unlimited count. | (disabled) |
| `thread_count` | Number of CPU threads used for the search. | (auto) |
| `seed` | Random seed. Fixes the random streams used for initial solutions and proposals. Fully reproducible runs are only guaranteed in serial configurations (e.g. `thread_count=1`); with many threads, timing nondeterminism still affects the outcome. | `0` (non-deterministic) |

Parameters are passed as an initializer list to `search()`:
{% raw %}
```cpp
auto sol = solver.search({{"time_limit", 5.0}, {"target_energy", 900}, {"enable_default_callback", 1}});
```
{% endraw %}

Unknown parameter keys will cause a runtime error.

## Searching Solutions
The Easy Solver searches for solutions by calling the **`search()`** member function, optionally passing parameters as an initializer list.

## Program Example
The following program searches for a solution to the Low Autocorrelation Binary Sequences (LABS) problem using the Easy Solver:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  size_t size = 100;
  auto x = qbpp::var("x", size);
  auto f = qbpp::toExpr(0);
  for (size_t d = 1; d < size; ++d) {
    auto temp = qbpp::toExpr(0);
    for (size_t i = 0; i < size - d; ++i) {
      temp += (2 * x[i] - 1) * (2 * x[i + d] - 1);
    }
    f += qbpp::sqr(temp);
  }
  f.simplify_as_binary();

  auto solver = qbpp::EasySolver(f);

  auto sol = solver.search({{"time_limit", 5.0}, {"target_energy", 900}, {"enable_default_callback", 1}});
  std::cout << sol.energy() << ": ";
  for (auto val : sol(x)) {
    std::cout << (val == 0 ? "-" : "+");
  }
  std::cout << std::endl;
}
```
{% endraw %}
In this example, the following parameters are passed to `search()`:
- a 5.0-second time limit,
- a target energy of 900, and
- the default callback is enabled.

Therefore, the solver terminates either when the elapsed time reaches 5.0 seconds
or when a solution with energy 900 or less is found.

For example, this program produces the following output:
```
TTS = 0.000s Energy = 300162
TTS = 0.000s Energy = 273350
TTS = 0.000s Energy = 248706
TTS = 0.000s Energy = 226086
TTS = 0.000s Energy = 205274
TTS = 0.000s Energy = 186142
TTS = 0.000s Energy = 168442
TTS = 0.000s Energy = 152134
TTS = 0.000s Energy = 137162
TTS = 0.000s Energy = 123374
TTS = 0.001s Energy = 110650
TTS = 0.001s Energy = 98990
TTS = 0.001s Energy = 88346
TTS = 0.001s Energy = 78678
TTS = 0.001s Energy = 69802
TTS = 0.001s Energy = 61798
TTS = 0.001s Energy = 54626
TTS = 0.001s Energy = 47982
TTS = 0.001s Energy = 42034
TTS = 0.001s Energy = 36598
TTS = 0.001s Energy = 31778
TTS = 0.001s Energy = 27446
TTS = 0.001s Energy = 23658
TTS = 0.002s Energy = 20286
TTS = 0.002s Energy = 17250
TTS = 0.002s Energy = 14614
TTS = 0.002s Energy = 12306
TTS = 0.002s Energy = 10350
TTS = 0.002s Energy = 8682
TTS = 0.002s Energy = 7214
TTS = 0.002s Energy = 5994
TTS = 0.002s Energy = 4990
TTS = 0.002s Energy = 4130
TTS = 0.002s Energy = 3478
TTS = 0.003s Energy = 2882
TTS = 0.003s Energy = 2414
TTS = 0.003s Energy = 2122
TTS = 0.003s Energy = 1822
TTS = 0.003s Energy = 1706
TTS = 0.003s Energy = 1574
TTS = 0.003s Energy = 1442
TTS = 0.003s Energy = 1350
TTS = 0.007s Energy = 1306
TTS = 0.008s Energy = 1274
TTS = 0.008s Energy = 1262
TTS = 0.008s Energy = 1202
TTS = 0.016s Energy = 1170
TTS = 0.018s Energy = 1166
TTS = 0.018s Energy = 994
TTS = 0.066s Energy = 986
TTS = 0.066s Energy = 982
TTS = 0.184s Energy = 954
TTS = 0.371s Energy = 942
TTS = 0.912s Energy = 930
TTS = 0.913s Energy = 902
TTS = 2.691s Energy = 898
898: ++-++-----+--+--++++++---++-+-+--++-------++-++-+-+-+-+-++-++++-++-+++++-+-+--++++++---+++--+++---++
```

## Advanced Usage

### Keeping multiple top-k solutions
The Easy Solver can store **multiple top-k solutions** found during the search.
To enable this feature, set the `topk_sols` parameter.

Once this parameter is set, the `EasySolverSol` object returned by `search()` contains the stored top-k solutions.
Given the returned object `sols`, you can access the stored solutions by index or by iteration:
- **`sols.sols[i]`**: Returns the `i`-th `qbpp::Sol` object (indexing the `sols` member vector).
- **`sols.size()`**: Returns the number of stored solutions.
- **`begin()`**, **`end()`**: Iterators that let you visit each solution with a range-based for loop (`for (const auto& sol : sols)`).

The following program solves the Low Autocorrelation Binary Sequence (LABS) problem using the Easy Solver.
Since `topk_sols` is set to `20`, the solver keeps **up to 20 top-k solutions**.
The program prints each stored solution using a range-based for loop.
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  size_t size = 20;
  auto x = qbpp::var("x", size);
  auto f = qbpp::toExpr(0);
  for (size_t d = 1; d < size; ++d) {
    auto temp = qbpp::toExpr(0);
    for (size_t i = 0; i < size - d; ++i) {
      temp += (2 * x[i] - 1) * (2 * x[i + d] - 1);
    }
    f += qbpp::sqr(temp);
  }
  f.simplify_as_binary();

  auto solver = qbpp::EasySolver(f);

  auto sols = solver.search({{"time_limit", 5.0}, {"topk_sols", 20}});
  for (const auto& sol : sols) {
    std::cout << sol.energy() << ": ";
    for (auto val : sol(x)) {
      std::cout << (val == 0 ? "-" : "+");
    }
    std::cout << std::endl;
  }
}
```
{% endraw %}
This program displays the following output:
```
26: -----+-+++-+--+++--+
26: +--+++--+-+++-+-----
26: -+-+----+----++-++--
26: --++-++----+----+-+-
26: -++---++-+---+-+++++
34: ---+++++-+++-++-+-++
34: +-+-+++++----++--++-
34: -+++++---+---+-+--+-
34: +++-----+---+--+-+--
34: --++--++-+--+-+-----
34: -+--+-+---+---+++++-
34: ---+++-+-+----+--+--
38: -++-++-+-+---++-----
38: --++++--+-+--+---+--
38: -+-+---++------++-++
38: ++++-++-+--+++-+---+
38: ----+--+-++---+-+++-
42: -+++++++--++-+-+-++-
42: -+-+----+++++-++--++
42: ++-----+---+--+-+--+
```

### Keeping multiple best-energy solutions
The Easy Solver can store multiple solutions that share the best (minimum) energy found during the search.
To enable this feature, set the `best_energy_sols` parameter.
The value specifies the maximum number of solutions to keep. Set to `0` for unlimited.

The usage is the same as that of `topk_sols`.
Therefore, to enable this feature in a QUBO++ program above, you can replace
`topk_sols` with `best_energy_sols` as follows:
{% raw %}
```cpp
  auto sols = solver.search({{"time_limit", 5.0}, {"best_energy_sols", 0}});  // unlimited
```
{% endraw %}
With this parameter set, the solver stores only the solutions whose energy is equal to the best energy found.
The resulting program produces the following solutions, all of which have the best energy value of 26:
```
26: +++++-+---+-++---++-
26: ++--+--++++-++++-+-+
26: -+-+----+----++-++--
26: +-+-++++-++++--+--++
26: -++---++-+---+-+++++
26: --++-++----+----+-+-
```

## Custom Callbacks

The built-in callback (enabled with `enable_default_callback`) only prints the energy and TTS each time a new best solution is found.
To receive and process the best solution during the search, use a custom callback in the same way as for [ABS3 Solver](ABS3#custom-callback).

1. **Register a function** — `solver.set_callback(fn)`. `fn` is called as `fn(solver)` with the solver itself
2. **Subclass** — inherit from `EasySolver` and override the virtual method `callback()`

If both are given, the override wins. To run both, call `EasySolver::callback()` from the override.

The callback is invoked on one of the following events:

| Event | Description |
|-------|-------------|
| `CallbackEvent::Start` | Called once when `search()` starts (`best_sol()` is the starting solution of the search) |
| `CallbackEvent::BestUpdated` | Called each time a new best solution is found |
| `CallbackEvent::Timer` | Called at the interval set with `timer()`, with the best solution so far |

Inside the callback, the following methods are available:
- **`best_sol()`** — returns a `const qbpp::Sol&` to the best solution. `.energy()`, `.tts()`, `.get(var)`, etc. can be used
- **`event()`** — returns the event that triggered this callback
- **`timer(seconds)`** — sets the interval of `Timer` events in seconds. `0` disables them. Without a call the interval does not change
- **`hint(sol)`** — passes the solution `sol` to the solver as a hint solution (see [Passing a hint solution](#passing-a-hint-solution) below). It can also be called from another thread
- **`terminate()`** — stops the current search cooperatively, so that `search()` returns with the best solution so far. It can also be called from another thread. Calling `search()` again on the same instance clears the stop request automatically

The callback is called from the search threads, but never two at the same time.

The following program prints the energy and TTS each time the best solution is updated, and the best energy so far every second.
When the energy reaches 0, it ends the search with `terminate()`.
{% raw %}
```cpp
#include <iostream>
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  auto x = qbpp::var("x", 20);
  auto f = qbpp::sqr(qbpp::sum(x) - 10);
  f.simplify_as_binary();

  qbpp::EasySolver solver(f);
  solver.set_callback([](const qbpp::EasySolver& s) {
    if (s.event() == qbpp::CallbackEvent::Start) {
      s.timer(1.0);  // enable a 1-second timer
    } else if (s.event() == qbpp::CallbackEvent::BestUpdated) {
      std::cout << "New best: energy=" << s.best_sol().energy()
                << " TTS=" << s.best_sol().tts() << "s" << std::endl;
      if (s.best_sol().energy() == 0) s.terminate();
    } else if (s.event() == qbpp::CallbackEvent::Timer) {
      std::cout << "Timer: energy=" << s.best_sol().energy() << std::endl;
    }
  });

  auto sol = solver.search({{"time_limit", 10}});
  std::cout << "energy=" << sol.energy() << std::endl;
}
```
{% endraw %}

To unregister, call `solver.set_callback(nullptr)`.
For subclassing, see the example on the [ABS3 Solver page](ABS3#method-2-subclassing) (read `ABS3Solver` as `EasySolver`).

### Passing a hint solution

`hint(sol)` passes a solution, for example one obtained by another method, to the solver as a hint solution.
Pass a solution of the same expression (a `qbpp::Sol(f)` whose values you set, or `best_sol()` in a callback).

- **During a search** (inside the callback, or from another thread), the solution is passed to the running search. The search also continues from it, and `search()` never returns a solution worse than the one passed. If the solution is better than the best so far, the update of the best solution is reported by a `BestUpdated` event
- **Before a search**, it becomes the starting point of the next `search()` (used only by that one search). If a hint solution is given with `hint(sol)` of the parameters passed to `search()` (`qbpp::Params`), that one takes precedence

It works the same way for expressions with integer variables (the values of the integer variables are passed as well).

The following program solves a 0-1 knapsack problem.
At `Timer` events every 0.5 seconds, it compares the solution obtained by a greedy method (packing items in decreasing value/weight) with the best solution, and passes the greedy solution to the search with `hint()` if it is better.
{% raw %}
```cpp
#include <algorithm>
#include <iostream>
#include <numeric>
#include <vector>
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  // 0-1 knapsack: maximize the total value within the capacity
  const int n = 1000;
  std::vector<int> w(n), v(n);
  for (int i = 0; i < n; ++i) {
    w[i] = 10 + i * 37 % 51;
    v[i] = 10 + i * 53 % 91;
  }
  const int cap = std::accumulate(w.begin(), w.end(), 0) / 4;
  auto x = qbpp::var("x", n);
  auto f = -qbpp::sum(qbpp::array(v) * x) +
           100 * qbpp::cons(qbpp::sum(qbpp::array(w) * x) <= cap);
  f.simplify_as_binary();

  // greedy: take the items in decreasing value/weight while they fit
  std::vector<int> order(n);
  std::iota(order.begin(), order.end(), 0);
  std::stable_sort(order.begin(), order.end(),
                   [&](int a, int b) { return v[a] * w[b] > v[b] * w[a]; });
  qbpp::Sol greedy(f);
  int rest = cap;
  for (int i : order) {
    if (w[i] <= rest) {
      greedy.set(x[i], true);
      rest -= w[i];
    }
  }
  const auto greedy_energy = f(greedy);
  std::cout << "greedy: energy=" << greedy_energy << std::endl;

  qbpp::EasySolver solver(f);
  solver.set_callback([&](const qbpp::EasySolver& s) {
    if (s.event() == qbpp::CallbackEvent::Start) {
      s.timer(0.5);
    } else if (s.event() == qbpp::CallbackEvent::Timer) {
      // pass the greedy solution if it is better than the best so far
      if (greedy_energy < s.best_sol().energy()) s.hint(greedy);
    }
  });
  auto sol = solver.search({{"time_limit", 2}});
  std::cout << "no worse than greedy: "
            << (sol.energy() <= greedy_energy ? "yes" : "no") << std::endl;
}
```
{% endraw %}

This program prints:
```
greedy: energy=-26934
no worse than greedy: yes
```
