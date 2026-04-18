---
layout: default
nav_exclude: true
title: "Exhaustive Solver"
nav_order: 20
lang: en
hreflang_alt: "ja/python/EXHAUSTIVE"
hreflang_lang: "ja"
---

# Exhaustive Solver Usage
The **Exhaustive Solver** is a complete-search solver for QUBO/HUBO expressions.
Since all possible assignments are examined, the optimality of the solutions is guaranteed.
The search is parallelized using CPU threads, and if a CUDA GPU is available, GPU acceleration is automatically enabled to further speed up the search.

Solving a problem with the Exhaustive Solver consists of the following two steps:
1. Create an Exhaustive Solver (`qbpp.ExhaustiveSolver`) object.
2. Call the `search()` method, optionally passing parameters as keyword arguments.


## Creating Exhaustive Solver object
To use the Exhaustive Solver, an Exhaustive Solver object
(`qbpp.ExhaustiveSolver`) is constructed with an expression as follows:
- **`qbpp.ExhaustiveSolver(f)`**

Here, `f` is the expression to be solved.
It must be simplified as a binary expression in advance by calling the
`simplify_as_binary()` method.
The constructor loads the expression into host memory and, when GPUs are available, also transfers it to device memory.
Subsequent `search()` calls reuse this load, so repeated searches on the same expression incur no reloading overhead.

## Setting Search Parameters
Search parameters are passed directly to the `search()` method as keyword arguments.
The following parameters are available:

| Parameter | Type | Description | Default |
|---|---|---|---|
| `target_energy` | int | Sets a target energy for early termination. When the solver finds a solution with energy less than or equal to this value, the search terminates immediately. | (none) |
| `verbose` | int (0 or 1) | Set to `1` to display the search progress as a percentage, which is helpful for estimating the total runtime. | `0` |
| `enable_default_callback` | int (0 or 1) | Set to `1` to print the energy and TTS of every newly obtained best solution. | `0` |
| `topk_sols` | int | Collects the top-k solutions with the lowest energy. | (disabled) |
| `best_energy_sols` | int (0 or 1) | Set to `1` to collect all optimal solutions (those with the minimum energy). | (disabled) |
| `all_sols` | int (0 or 1) | Set to `1` to collect all $2^n$ solutions. Memory usage grows exponentially with the number of variables `n`, so use this only when `n` is small. | (disabled) |

Parameters are passed as keyword arguments to `search()`:
```
sol = solver.search(target_energy=0, enable_default_callback=1)
```

Unknown parameter keys will cause a runtime error.

## Searching for Solutions
The Exhaustive Solver searches for solutions by calling the **`search()`** method, optionally passing parameters as keyword arguments.
The method returns the best solution found.
If a CUDA GPU is available, the search is automatically accelerated using the GPU alongside CPU threads.
The returned solution provides `sol.energy` (energy value), `sol(x)` (variable value lookup), `sol.info` (dict of solver info), and more. See [QR_SOLUTION](QR_SOLUTION) for details.

When `topk_sols`, `best_energy_sols`, or `all_sols` is set, the returned solution also carries the collected solutions.
They can be retrieved via the following properties and operations:
- **`sol.sols`**: A list of solutions sorted in increasing order of energy.
- **`sol.size`** (or `len(sol)`): The number of stored solutions.
- Iteration: `for s in sol:` yields each stored solution in energy order.
- Indexing: `sol[i]` returns the `i`-th stored solution (for integer `i`).

## Program Example
The following program searches for a solution to the
**Low Autocorrelation Binary Sequences (LABS)** problem using the Exhaustive
Solver:
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

solver = qbpp.ExhaustiveSolver(f)
sol = solver.search(enable_default_callback=1)
bits = "".join("-" if sol(x[i]) == 0 else "+" for i in range(size))
print(f"{sol.energy}: {bits}")
```
The output of this program is as follows:
{% raw %}
```
TTS = 0.002s Energy = 1786
TTS = 0.003s Energy = 314
TTS = 0.003s Energy = 206
TTS = 0.003s Energy = 154
TTS = 0.003s Energy = 102
TTS = 0.003s Energy = 94
TTS = 0.003s Energy = 74
TTS = 0.003s Energy = 66
TTS = 0.003s Energy = 50
TTS = 0.006s Energy = 46
TTS = 0.011s Energy = 34
TTS = 0.014s Energy = 26
26: -++---++-+---+-+++++
```
{% endraw %}
All optimal solutions can be obtained by setting `best_energy_sols` as follows:
```python
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search(best_energy_sols=1)
for s in sol.sols:
    bits = "".join("-" if s(x[i]) == 0 else "+" for i in range(size))
    print(f"{s.energy}: {bits}")
```
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
```python
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search(topk_sols=10)
for s in sol.sols:
    bits = "".join("-" if s(x[i]) == 0 else "+" for i in range(size))
    print(f"{s.energy}: {bits}")
```
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
```python
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search(all_sols=1)
for s in sol.sols:
    bits = "".join("-" if s(x[i]) == 0 else "+" for i in range(size))
    print(f"{s.energy}: {bits}")
```
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
