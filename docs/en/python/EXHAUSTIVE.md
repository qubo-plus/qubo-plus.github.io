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

Solving a problem with the Exhaustive Solver consists of the following three steps:
1. Create an **`ExhaustiveSolver`** object.
2. Set search options by calling methods of the solver object.
3. Search for solutions by calling one of the search methods.


## Creating Exhaustive Solver object
To use the Exhaustive Solver, an **`ExhaustiveSolver`** object is constructed with an expression
(`Expr`) object as follows:
- **`ExhaustiveSolver(f)`**:
Here, `f` is the expression to be solved.
It must be simplified as a binary expression in advance by calling the
`simplify_as_binary()` method.

## Setting Exhaustive Solver Options
- **`verbose()`**:
Displays the search progress as a percentage, which is helpful for estimating the total runtime.
- **`callback(func)`**:
Sets a callback function that is called when a new best solution is found.
The callback receives two arguments: `energy` (int) and `tts` (float, time to solution in seconds).
- **`target_energy(energy)`**:
Sets a target energy value for early termination.
When the solver finds a solution with energy less than or equal to the target, the search terminates immediately.

## Searching Solutions
The Exhaustive Solver searches for solutions by calling the **`search()`** method with keyword arguments.
Multiple solutions can be collected by setting the appropriate parameter:
- **`best_energy_sols=0`**: Collect all optimal solutions (minimum energy). Use `sol.sols` to retrieve them.
- **`topk_sols=k`**: Collect the top-k solutions with the lowest energy.
- **`{"all_sols": 1}`**: Collect all $2^n$ solutions (use with care — memory intensive).

# Program example
The following program searches for a solution to the
**Low Autocorrelation Binary Sequences (LABS)** problem using the Exhaustive
Solver:
```python
import pyqbpp as qbpp

size = 20
x = qbpp.var("x", size)
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
All optimal solutions can be collected by passing `best_energy_sols` to `search()`:
```python
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search(best_energy_sols=0)
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
The top-k solutions with the lowest energy can be collected by passing `topk_sols`:
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
34: ----+----++-++---+-+
34: +-++-+-+++-+++-----+
```
{% endraw %}
Furthermore, all solutions, including non-optimal ones, can be collected by passing `all_sols`.
Note that this stores all $2^n$ solutions in memory, where $n$ is the number of variables.
For example, with $n = 20$, over one million solutions are stored, and memory usage grows exponentially with $n$.
Use this option only when $n$ is small enough.
```python
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search(all_sols=1)
for s in sol.sols:
    bits = "".join("-" if s(x[i]) == 0 else "+" for i in range(size))
    print(f"{s.energy}: {bits}")
```
This prints all $2^{20}$ solutions in increasing order of energy.
