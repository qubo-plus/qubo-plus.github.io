---
layout: default
nav_exclude: true
title: "ABS3 Solver"
nav_order: 21
lang: en
hreflang_alt: "ja/python/ABS3"
hreflang_lang: "ja"
---

# ABS3 Solver Usage
Solving an expression `f` using the ABS3 Solver involves the following two steps:
1. Create an **`ABS3Solver`** object for the expression `f`.
2. Call the **`search()`** method with keyword arguments, which returns the obtained solution.

## Solving LABS problem using the ABS3 Solver
The following program solves the **Low Autocorrelation Binary Sequence (LABS)** problem using the ABS3 Solver:
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

solver = qbpp.ABS3Solver(f)
solver.callback(lambda energy, tts, event: print(f"TTS = {tts:.3f}s Energy = {energy}"))
sol = solver.search(time_limit=10.0)
bits = "".join("-" if sol(x[i]) == 0 else "+" for i in range(size))
print(f"{sol.energy}: {bits}")
```
In this program, an `ABS3Solver` object is created for the expression `f`.
The `callback()` sets a function that prints the energy and TTS of newly found best solutions, and search parameters such as `time_limit` are passed as keyword arguments to `search()`.

This program produces output similar to the following:
{% raw %}
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
{% endraw %}

## ABS3 Solver object
An `ABS3Solver` object is created for a given expression.
An optional second argument `gpu` controls GPU usage:
- **`ABS3Solver(f)`**: Automatically uses all available GPUs. If no GPU is available, falls back to CPU-only mode.
- **`ABS3Solver(f, 0)`**: Forces CPU-only mode (no GPU is used).
- **`ABS3Solver(f, n)`**: Uses `n` GPUs.

## Search Parameters
The **`search()`** method runs the search. The following keyword arguments can be specified:

| Key | Type | Description |
|----|----|----|
| **`time_limit`** | float | Time limit in seconds |
| **`target_energy`** | int | Target energy for early termination |
| **`enable_default_callback`** | int (0 or 1) | Print energy and TTS when a new best solution is found |
| **`cpu_enable`** | int (0 or 1) | Enables/disables the CPU solver alongside the GPU (default: 1) |
| **`cpu_thread_count`** | int | Number of CPU solver threads (default: auto) |
| **`block_count`** | int | Number of CUDA blocks per GPU |
| **`thread_count`** | int | Number of threads per CUDA block |
| **`topk_sols`** | int | Collect the top-K solutions with the best energies |
| **`best_energy_sols`** | int | Collect all optimal solutions (`0` for unlimited) |

## Multiple Solutions
When **`topk_sols`** or **`best_energy_sols`** is set, the solver collects multiple solutions.
These can be retrieved by calling **`sol.sols`** on the returned `Sol`, which returns a list of `Sol` objects sorted in increasing order of energy.

```python
solver = qbpp.ABS3Solver(f)
sol = solver.search(topk_sols=5)
for s in sol.sols:
    print(f"energy = {s.energy}")
```

## Custom Callback
The built-in callback (enabled by `enable_default_callback`) simply prints the energy and TTS whenever a new best solution is found.
For more control, use the **`callback(func)`** method to set a custom callback function.

### Simple callback with `callback(func)`
The function receives three arguments: `energy` (int), `tts` (float), and `event` (string).
The `event` argument is one of:

| Event | Description |
|-------|-------------|
| `"start"` | Called once at the beginning of `search()` |
| `"best_updated"` | Called whenever a new best solution is found |
| `"timer"` | Called periodically at a configurable interval |

```python
solver = qbpp.ABS3Solver(f)
solver.callback(lambda energy, tts, event: print(f"TTS = {tts:.3f}s Energy = {energy}"))
sol = solver.search(time_limit=10.0)
```

### Advanced callback with subclass
For access to `timer()` and `hint()`, subclass `ABS3Solver` and override the `callback()` method (no arguments).
Inside `callback()`, the following are available:

- **`self.event`** — the event that triggered this callback (int: 0=Start, 1=BestUpdated, 2=Timer)
- **`self.best_sol`** — current best `Sol` object (energy, tts, get(var))
- **`self.timer(seconds)`** — set the timer interval for periodic `Timer` callbacks. `0` disables the timer.
- **`self.hint(sol)`** — feed a hint solution to the solver

```python
class MyCallback(qbpp.ABS3Solver):
    def callback(self):
        if self.event == 0:       # Start
            self.timer(1.0)       # enable 1-second timer
        if self.event == 1:       # BestUpdated
            sol = self.best_sol
            print(f"TTS = {sol.tts:.3f}s Energy = {sol.energy}")

solver = MyCallback(f)
sol = solver.search(time_limit=10.0)
```

## Properties
- **`is_gpu`**: Returns `True` if the solver is using GPU acceleration.

## Program Example: CPU-only mode
To use the ABS3 Solver without a GPU, pass `0` as the second argument:
```python
solver = qbpp.ABS3Solver(f, 0)
sol = solver.search(time_limit=5.0, target_energy=0)
print(sol)
```
