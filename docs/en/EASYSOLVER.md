---
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

Solving a problem with the Easy Solver consists of the following three steps:
1. Create an Easy Solver (or `qbpp::easy_solver::EasySolver`) object.
2. Search for solutions by calling the `search()` member function, passing parameters as an initializer list. It returns a `qbpp::easy_solver::Sols` object.

## Creating Easy Solver object
To use the Easy Solver, an Easy Solver object (or `qbpp::easy_solver::EasySolver`) is constructed with an expression (or `qbpp::Expr`) object as follows:
- **`qbpp::easy_solver::EasySolver(const qbpp::Expr& f)`**

Here, `f` is the expression to be solved.
It must be simplified as a binary expression in advance by calling the `simplify_as_binary()` function.
This function converts the given expression `f` into an internal format that is used during the solution search.

## Setting Search Parameters
Search parameters are passed directly to the `search()` member function as an initializer list of key-value pairs.
The following parameters are available:

| Parameter | Description | Default |
|---|---|---|
| `time_limit` | Time limit in seconds. Set to `0` for no time limit. | `10.0` |
| `target_energy` | Target energy. The solver terminates when a solution with energy ≤ this value is found. | (none) |
| `enable_default_callback` | Set to `1` to print newly obtained best solutions. | `0` |
| `topk_sols` | Number of top-k solutions to keep. | (disabled) |
| `best_energy_sols` | Keep solutions with the best energy. `0` for unlimited count. | (disabled) |

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
  auto f = qbpp::expr();
  for (size_t d = 1; d < size; ++d) {
    auto temp = qbpp::expr();
    for (size_t i = 0; i < size - d; ++i) {
      temp += (2 * x[i] - 1) * (2 * x[i + d] - 1);
    }
    f += qbpp::sqr(temp);
  }
  f.simplify_as_binary();

  auto solver = qbpp::easy_solver::EasySolver(f);

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
TTS = 0.000s Energy = 300162 thread = 0 Random
TTS = 0.000s Energy = 273350 thread = 0 Random(neighbor)
TTS = 0.000s Energy = 248706 thread = 0 Greedy(neighbor)
TTS = 0.000s Energy = 226086 thread = 0 Greedy(neighbor)
TTS = 0.000s Energy = 205274 thread = 0 Greedy(neighbor)
TTS = 0.000s Energy = 186142 thread = 0 Greedy(neighbor)
TTS = 0.000s Energy = 168442 thread = 0 Greedy(neighbor)
TTS = 0.000s Energy = 152134 thread = 0 Greedy(neighbor)
TTS = 0.000s Energy = 137162 thread = 0 Greedy(neighbor)
TTS = 0.000s Energy = 123374 thread = 0 Greedy(neighbor)
TTS = 0.001s Energy = 110650 thread = 0 Greedy(neighbor)
TTS = 0.001s Energy = 98990 thread = 0 Greedy(neighbor)
TTS = 0.001s Energy = 88346 thread = 0 Greedy(neighbor)
TTS = 0.001s Energy = 78678 thread = 0 Greedy(neighbor)
TTS = 0.001s Energy = 69802 thread = 0 Greedy(neighbor)
TTS = 0.001s Energy = 61798 thread = 0 Greedy(neighbor)
TTS = 0.001s Energy = 54626 thread = 0 Greedy(neighbor)
TTS = 0.001s Energy = 47982 thread = 0 Greedy(neighbor)
TTS = 0.001s Energy = 42034 thread = 0 Greedy(neighbor)
TTS = 0.001s Energy = 36598 thread = 0 Greedy(neighbor)
TTS = 0.001s Energy = 31778 thread = 0 Greedy(neighbor)
TTS = 0.001s Energy = 27446 thread = 0 Greedy(neighbor)
TTS = 0.001s Energy = 23658 thread = 0 Greedy(neighbor)
TTS = 0.002s Energy = 20286 thread = 0 Greedy(neighbor)
TTS = 0.002s Energy = 17250 thread = 0 Greedy(neighbor)
TTS = 0.002s Energy = 14614 thread = 0 Greedy(neighbor)
TTS = 0.002s Energy = 12306 thread = 0 Greedy(neighbor)
TTS = 0.002s Energy = 10350 thread = 0 Greedy(neighbor)
TTS = 0.002s Energy = 8682 thread = 0 Greedy(neighbor)
TTS = 0.002s Energy = 7214 thread = 0 Greedy(neighbor)
TTS = 0.002s Energy = 5994 thread = 0 Greedy(neighbor)
TTS = 0.002s Energy = 4990 thread = 0 Greedy(neighbor)
TTS = 0.002s Energy = 4130 thread = 0 Greedy(neighbor)
TTS = 0.002s Energy = 3478 thread = 0 Greedy(neighbor)
TTS = 0.003s Energy = 2882 thread = 0 Greedy(neighbor)
TTS = 0.003s Energy = 2414 thread = 0 Greedy(neighbor)
TTS = 0.003s Energy = 2122 thread = 0 Greedy(neighbor)
TTS = 0.003s Energy = 1822 thread = 0 Greedy(neighbor)
TTS = 0.003s Energy = 1706 thread = 0 Greedy(neighbor)
TTS = 0.003s Energy = 1574 thread = 0 Greedy(neighbor)
TTS = 0.003s Energy = 1442 thread = 0 Greedy(neighbor)
TTS = 0.003s Energy = 1350 thread = 0 Greedy(neighbor)
TTS = 0.007s Energy = 1306 thread = 7 MoveTo
TTS = 0.008s Energy = 1274 thread = 12 Greedy
TTS = 0.008s Energy = 1262 thread = 12 Greedy(neighbor)
TTS = 0.008s Energy = 1202 thread = 12 Greedy(neighbor)
TTS = 0.016s Energy = 1170 thread = 20 PosMin
TTS = 0.018s Energy = 1166 thread = 23 PosMin
TTS = 0.018s Energy = 994 thread = 23 PosMin(neighbor)
TTS = 0.066s Energy = 986 thread = 7 Greedy
TTS = 0.066s Energy = 982 thread = 7 Greedy(neighbor)
TTS = 0.184s Energy = 954 thread = 10 PosMin
TTS = 0.371s Energy = 942 thread = 12 PosMin
TTS = 0.912s Energy = 930 thread = 4 PosMin
TTS = 0.913s Energy = 902 thread = 4 PosMin(neighbor)
TTS = 2.691s Energy = 898 thread = 15 PosMin
898: ++-++-----+--+--++++++---++-+-+--++-------++-++-+-+-+-+-++-++++-++-+++++-+-+--++++++---+++--+++---++
```

## Advanced Usage

### Keeping multiple top-k solutions
The Easy Solver can store **multiple top-k solutions** found during the search.
To enable this feature, set the `topk_sols` parameter.

Once this parameter is set, the `Sols` object returned by `search()` contains the stored top-k solutions.
For the returned object sols, you can access the stored solutions using either indices or iterators:
- **`sols[i]`**: Returns the `i`-th `qbpp::Sol` object.
- **`size()`**: Returns the number of stored solutions.
- **`begin()`**, **`end()`**, **`cbegin()`**, **`cend()`**: Iterators that allow you to access each solution in turn using a range-based for loop.

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
  auto f = qbpp::expr();
  for (size_t d = 1; d < size; ++d) {
    auto temp = qbpp::expr();
    for (size_t i = 0; i < size - d; ++i) {
      temp += (2 * x[i] - 1) * (2 * x[i + d] - 1);
    }
    f += qbpp::sqr(temp);
  }
  f.simplify_as_binary();

  auto solver = qbpp::easy_solver::EasySolver(f);

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
