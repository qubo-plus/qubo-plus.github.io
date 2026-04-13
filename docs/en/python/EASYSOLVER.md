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
1. Create an **`EasySolver`** object.
2. Call the **`search()`** method with keyword arguments, which returns a **`Sol`** object.

## Creating Easy Solver object
To use the Easy Solver, an `EasySolver` object is constructed with an expression as follows:
- **`EasySolver(f)`**

Here, `f` is the expression to be solved.
It must be simplified as a binary expression in advance by calling `simplify_as_binary()`.

## Search Parameters
Parameters are passed as keyword arguments to the **`search()`** method.

| Parameter | Description | Default |
|---|---|---|
| `time_limit` | Time limit in seconds (float). Set to 0 for no time limit. | 10.0 |
| `target_energy` | Target energy (int). The solver terminates when a solution with energy ≤ this value is found. | (none) |
| `topk_sols` | Number of top-k solutions to keep (int). | (disabled) |
| `best_energy_sols` | Keep solutions with the best energy (int). `0` for unlimited. | (disabled) |
| `enable_default_callback` | Print newly obtained best solutions (int, `1` to enable). | (disabled) |

Unknown parameter keys will cause a runtime error.

## Searching Solutions
The Easy Solver searches for solutions by calling **`search()`** with keyword arguments. It returns a **`Sol`** object.

### Multiple Solutions
When `topk_sols` is specified, the solver collects up to `n` solutions with the best energies encountered during the search.
These can be retrieved by calling **`sol.sols`** on the returned `Sol`, which returns a list of `Sol` objects sorted in increasing order of energy.

```python
solver = qbpp.EasySolver(f)
sol = solver.search(topk_sols=5)
for s in sol.sols:
    print(f"energy = {s.energy}")
```

## Program Example
The following program searches for a solution to the
**Low Autocorrelation Binary Sequences (LABS)** problem using the Easy Solver:
```python
import pyqbpp as qbpp

size = 100
x = qbpp.var("x", size)
f = qbpp.expr()
for d in range(1, size):
    temp = qbpp.expr()
    for i in range(size - d):
        temp += (2 * x[i] - 1) * (2 * x[i + d] - 1)
    f += qbpp.sqr(temp)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=5.0, target_energy=900, enable_default_callback=1)
bits = "".join("-" if sol(x[i]) == 0 else "+" for i in range(size))
print(f"{sol.energy}: {bits}")
```
In this example, the following options are set:
- a 5.0-second time limit,
- a target energy of 900, and
- a default callback that prints the energy and TTS whenever a new best solution is found.

Therefore, the solver terminates either when the elapsed time reaches 5.0 seconds
or when a solution with energy 900 or less is found.

For example, this program produces the following output:
{% raw %}
```
TTS = 0.000s Energy = 300162
TTS = 0.000s Energy = 273350
...
TTS = 2.691s Energy = 898
898: ++-++-----+--+--++++++---++-+-+--++-------++-++-+-+-+-+-++-++++-++-+++++-+-+--++++++---+++--+++---++
```
{% endraw %}
