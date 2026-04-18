---
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
It must be simplified as a binary expression in advance by calling `simplify_as_binary()`.
This converts the given expression `f` into an internal format that is used during the solution search.
The constructor loads the expression into host memory. Subsequent `search()` calls reuse this load, so repeated searches on the same expression incur no reloading overhead.

## Setting Search Parameters
Search parameters are passed directly to the `search()` method as keyword arguments.
The following parameters are available:

| Parameter | Type | Description | Default |
|---|---|---|---|
| `time_limit` | float | Time limit in seconds. Set to `0` for no time limit. | `10.0` |
| `target_energy` | int | Target energy. The solver terminates when a solution with energy less than or equal to this value is found. | (none) |
| `enable_default_callback` | int (0 or 1) | Set to `1` to print the energy and TTS of every newly obtained best solution. | `0` |
| `topk_sols` | int | Number of top-k solutions to keep. | (disabled) |
| `best_energy_sols` | int | Keep solutions with the best energy. `0` for unlimited count. | (disabled) |

Parameters are passed as keyword arguments to `search()`:
```python
sol = solver.search(time_limit=5.0, target_energy=900, enable_default_callback=1)
```

Unknown parameter keys will cause a runtime error.

## Searching for Solutions
The Easy Solver searches for solutions by calling the **`search()`** method, optionally passing parameters as keyword arguments.
The method returns the best solution found. The returned solution provides `sol.energy` (energy value), `sol(x)` (variable value lookup), `sol.info` (dict of solver info), and more. See [QR_SOLUTION](QR_SOLUTION) for details.

## Program Example
The following program searches for a solution to the Low Autocorrelation Binary Sequences (LABS) problem using the Easy Solver:
```python
import pyqbpp as qbpp

size = 100
x = qbpp.var("x", shape=size)
f = qbpp.expr()
for d in range(1, size):
    temp = qbpp.expr()
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
{% endraw %}

## Advanced Usage

### Keeping multiple top-k solutions
The Easy Solver can store **multiple top-k solutions** found during the search.
To enable this feature, set the `topk_sols` parameter.

Once this parameter is set, the solution returned by `search()` also carries the stored top-k solutions.
They can be retrieved via the following properties and operations:
- **`sol.sols`**: A list of solutions sorted in increasing order of energy.
- **`sol.size`** (or `len(sol)`): The number of stored solutions.
- Iteration: `for s in sol:` yields each stored solution in energy order.
- Indexing: `sol[i]` returns the `i`-th stored solution (for `int i`).

The following program solves the LABS problem using the Easy Solver.
Since `topk_sols` is set to `20`, the solver keeps **up to 20 top-k solutions**.
The program prints each stored solution using a range-based for loop.
```python
import pyqbpp as qbpp

size = 20
x = qbpp.var("x", shape=size)
f = qbpp.expr()
for d in range(1, size):
    temp = qbpp.expr()
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
