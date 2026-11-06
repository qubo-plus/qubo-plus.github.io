---
last_modified: 2026-10-30
layout: default
nav_exclude: true
title: "Easy Solver"
nav_order: 19
lang: en
hreflang_alt: "ja/python/EASYSOLVER"
hreflang_lang: "ja"
---

# Easy Solver Usage
The **Easy Solver** is a heuristic solver for QUBO/HUBO expressions.

Solving a problem with the Easy Solver consists of the following two steps:
1. Create an **`EasySolver`** object for the expression to be solved.
2. Call the **`search()`** method with keyword arguments. It returns the best solution found.

## Creating an Easy Solver object
To use the Easy Solver, an `EasySolver` object is constructed with an expression as follows:
- **`EasySolver(f)`**

Here, `f` is the expression to be solved.
It must be simplified as a binary expression in advance by calling `simplify_as_binary()` (an expression with only integer variables is simplified with `simplify()`).
This converts the given expression `f` into an internal format that is used during the solution search.
The constructor loads the expression into host memory. Subsequent `search()` calls reuse this load, so repeated searches on the same expression incur no reloading overhead.

## Setting Search Parameters
Search parameters are passed directly to the `search()` method as keyword arguments.
The following parameters are available:

| Parameter | Type | Description | Default |
|---|---|---|---|
| `time_limit` | float | Time limit in seconds. Set to `0` for no time limit. | `10.0` |
| `target_energy` | int | Target energy. The solver terminates when a solution with energy less than or equal to this value is found. With constraints declared by `cons()`, every constraint must also be satisfied (see [Solver support and semantics](CONSTRAINTS#solver-support-and-semantics)). | (none) |
| `enable_default_callback` | int (0 or 1) | Set to `1` to print the energy and TTS of every newly obtained best solution. | `0` |
| `topk_sols` | int | Number of top-k solutions to keep. | (disabled) |
| `best_energy_sols` | int | Keep solutions with the best energy. `0` for unlimited count. | (disabled) |
| `thread_count` | int | Number of CPU threads used for the search. | (auto) |
| `seed` | int | Random seed. Fixes the random streams used for initial solutions and proposals. Fully reproducible runs are only guaranteed in serial configurations (e.g. `thread_count=1`); with many threads, timing nondeterminism still affects the outcome. | `0` (non-deterministic) |
| `hint` | Sol | A hint solution, used as the starting point of the search (see [Passing a hint solution](#passing-a-hint-solution)). `None` means no hint. | (none) |

Parameters are passed as keyword arguments to `search()`:
```python
sol = solver.search(time_limit=5.0, target_energy=900, enable_default_callback=1)
```

An unknown parameter key raises `RuntimeError`, and an invalid value `ValueError` or `TypeError` (see [error handling of search parameters](PARAMS#error-handling)).

## Searching for Solutions
The Easy Solver searches for solutions by calling the **`search()`** method, optionally passing parameters as keyword arguments.
The method returns the best solution found. The returned solution provides `sol.energy` (energy value), `sol(x)` (variable value lookup), `sol.info` (dict of solver info), and more. See [QR_SOLUTION](QR_SOLUTION) for details.

## Program Example
The following program searches for a solution to the Low Autocorrelation Binary Sequences (LABS) problem using the Easy Solver:
```python
import pyqbpp as qbpp

size = 100
x = qbpp.var("x", shape=size)
f = 0
for d in range(1, size):
    temp = 0
    for i in range(size - d):
        temp += (2 * x[i] - 1) * (2 * x[i + d] - 1)
    f += qbpp.sqr(temp)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=5.0, target_energy=900, enable_default_callback=1)
bits = "".join("-" if v == 0 else "+" for v in sol(x))
print(f"{sol.energy}: {bits}")
```
In this example, the following parameters are passed to `search()`:
- a 5.0-second time limit,
- a target energy of 900, and
- the default callback is enabled.

Therefore, the solver terminates either when the elapsed time reaches 5.0 seconds
or when a solution with energy 900 or less is found.

For example, this program produces output similar to the following:
{% raw %}
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
{% endraw %}

## Advanced Usage

### Keeping multiple top-k solutions
The Easy Solver can store **multiple top-k solutions** found during the search.
To enable this feature, set the `topk_sols` parameter.

Once this parameter is set, the solution returned by `search()` also carries the stored top-k solutions.
They can be retrieved via the following properties and operations:
- **`sol.sols`**: A list of stored solutions (sorted by ascending energy).
- **`sol.sols[i]`**: Returns the `i`-th stored solution.
- **`len(sol.sols)`**: The number of stored solutions.

The following program solves the LABS problem using the Easy Solver.
Since `topk_sols` is set to `20`, the solver keeps **up to 20 top-k solutions**.
The program prints each stored solution using a range-based for loop.
```python
import pyqbpp as qbpp

size = 20
x = qbpp.var("x", shape=size)
f = 0
for d in range(1, size):
    temp = 0
    for i in range(size - d):
        temp += (2 * x[i] - 1) * (2 * x[i + d] - 1)
    f += qbpp.sqr(temp)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=5.0, topk_sols=20)
for s in sol.sols:
    bits = "".join("-" if v == 0 else "+" for v in s(x))
    print(f"{s.energy}: {bits}")
```
This program displays output similar to the following:
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
Therefore, to enable this feature in the program above, you can replace
`topk_sols` with `best_energy_sols` as follows:
```python
sol = solver.search(time_limit=5.0, best_energy_sols=0)  # unlimited
```
With this parameter set, the solver stores only the solutions whose energy is equal to the best energy found.
The resulting program produces output similar to the following, where every listed solution has the best energy value of 26:
```
26: +++++-+---+-++---++-
26: ++--+--++++-++++-+-+
26: -+-+----+----++-++--
26: +-+-++++-++++--+--++
26: -++---++-+---+-+++++
26: --++-++----+----+-+-
```

## Custom Callbacks

The built-in callback (enabled with `enable_default_callback=1`) only prints the energy and TTS each time a new best solution is found.
To receive and process the best solution during the search, use a custom callback in the same way as for [ABS3 Solver](ABS3#custom-callback).

1. **Register a function** — `solver.set_callback(fn)`. `fn` is called as `fn(solver)` with the solver itself
2. **Subclass** — inherit from `EasySolver` and override the `callback()` method (no arguments)

If both are given, the override wins. To run both, call `super().callback()` from the override.

The callback is invoked on one of the following events:

| Event value | Name | Description |
|:-:|----|----|
| `0` | `Start` | Called once when `search()` starts (`best_sol()` is the starting solution of the search) |
| `1` | `BestUpdated` | Called each time a new best solution is found |
| `2` | `Timer` | Called at the interval set with `timer()`, with the best solution so far |

Inside the callback (and on the solver `s` that a registered function receives), the following methods are available:
- **`s.event()`** — the event that triggered the callback. Compare it with `qbpp.CallbackEvent.Start` and so on
- **`s.best_sol()`** — returns the best solution. `.energy`, `.tts`, `.get(var)`, etc. can be used
- **`s.timer(seconds)`** — sets the interval of `Timer` events in seconds. `0` disables them. Without a call the interval does not change
- **`s.hint(sol)`** — passes the solution `sol` to the solver as a hint solution (see [Passing a hint solution](#passing-a-hint-solution) below). It can also be called from another thread
- **`s.terminate()`** — stops the current search cooperatively, so that `search()` returns with the best solution so far. It can also be called from another thread. Calling `search()` again on the same instance clears the stop request automatically

The following program prints the energy and TTS each time the best solution is updated, and the best energy so far every second.
When the energy reaches 0, it ends the search with `terminate()`.

```python
import pyqbpp as qbpp

def on_event(s):
    if s.event() == qbpp.CallbackEvent.Start:
        s.timer(1.0)          # enable a 1-second timer
    elif s.event() == qbpp.CallbackEvent.BestUpdated:
        sol = s.best_sol()
        print(f"New best: energy={sol.energy} TTS={sol.tts:.3f}s")
        if sol.energy == 0:
            s.terminate()
    elif s.event() == qbpp.CallbackEvent.Timer:
        print(f"Timer: energy={s.best_sol().energy}")

x = qbpp.var("x", shape=20)
f = qbpp.sqr(qbpp.sum(x) - 10)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
solver.set_callback(on_event)
sol = solver.search(time_limit=10)
print(f"energy={sol.energy}")
```

To unregister, call `solver.set_callback(None)`.
For subclassing, see the example on the [ABS3 Solver page](ABS3#method-2-subclassing) (read `ABS3Solver` as `EasySolver`).

### Passing a hint solution

`hint(sol)` passes a solution, for example one obtained by another method, to the solver as a hint solution.
Pass a solution of the same expression (a `qbpp.Sol(f)` whose values you set, or `best_sol()` in a callback).

- **During a search** (inside the callback, or from another thread), the solution is passed to the running search. The search also continues from it, and `search()` never returns a solution worse than the one passed. If the solution is better than the best so far, the update of the best solution is reported by a `BestUpdated` event
- **Before a search**, it becomes the starting point of the next `search()` (used only by that one search). If a hint solution is given with the `hint=` argument of `search()`, that one takes precedence

It works the same way for expressions with integer variables (the values of the integer variables are passed as well).

The following program solves a 0-1 knapsack problem.
At `Timer` events every 0.5 seconds, it compares the solution obtained by a greedy method (packing items in decreasing value/weight) with the best solution, and passes the greedy solution to the search with `hint()` if it is better.

```python
import pyqbpp as qbpp

# 0-1 knapsack: maximize the total value within the capacity
n = 1000
w = [10 + i * 37 % 51 for i in range(n)]
v = [10 + i * 53 % 91 for i in range(n)]
cap = sum(w) // 4
x = qbpp.var("x", shape=n)
f = -qbpp.sum(qbpp.array(v) * x) + 100 * qbpp.cons(qbpp.sum(qbpp.array(w) * x) <= cap)
f.simplify_as_binary()

# greedy: take the items in decreasing value/weight while they fit
greedy = qbpp.Sol(f)
rest = cap
for i in sorted(range(n), key=lambda i: -v[i] / w[i]):
    if w[i] <= rest:
        greedy.set(x[i], 1)
        rest -= w[i]
greedy_energy = f(greedy)
print(f"greedy: energy={greedy_energy}")


def on_event(s):
    if s.event() == qbpp.CallbackEvent.Start:
        s.timer(0.5)
    elif s.event() == qbpp.CallbackEvent.Timer:
        # pass the greedy solution if it is better than the best so far
        if greedy_energy < s.best_sol().energy:
            s.hint(greedy)


solver = qbpp.EasySolver(f)
solver.set_callback(on_event)
sol = solver.search(time_limit=2)
print(f"no worse than greedy: {'yes' if sol.energy <= greedy_energy else 'no'}")
```

This program prints:
```
greedy: energy=-26934
no worse than greedy: yes
```
