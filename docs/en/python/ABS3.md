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
x = qbpp.var("x", shape=size)
f = qbpp.expr()
for d in range(1, size):
    temp = qbpp.expr()
    for i in range(size - d):
        temp += (2 * x[i] - 1) * (2 * x[i + d] - 1)
    f += qbpp.sqr(temp)
f.simplify_as_binary()

solver = qbpp.ABS3Solver(f)
sol = solver.search(time_limit=10.0, enable_default_callback=1)
bits = "".join("-" if sol(x[i]) == 0 else "+" for i in range(size))
print(f"{sol.energy}: {bits}")
```
In this program, an `ABS3Solver` object `solver` is first created for the expression `f`.
The `search()` method is then called with parameters passed as keyword arguments.
The `time_limit` option specifies the maximum search time in seconds, while `enable_default_callback=1` enables a built-in callback that prints the energy and TTS of newly found best solutions during the search.
This method returns the best solution found within the given time limit, which is stored in `sol`.

The program prints the energy of the solution and the corresponding binary sequence, where "+" represents 1 and "-" represents 0.

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
The constructor converts the expression into an internal data format and loads it into host memory, and also transfers it to device memory when GPUs are available.
Subsequent `search()` calls reuse this load, so repeated searches on the same expression incur no reloading overhead.

An optional second argument `gpu` controls GPU usage:
- **`ABS3Solver(f)`**: Automatically uses all available GPUs. If no GPU is available, falls back to CPU-only mode.
- **`ABS3Solver(f, 0)`**: Forces CPU-only mode (no GPU is used).
- **`ABS3Solver(f, n)`**: Uses `n` GPUs. The expression is loaded onto all `n` GPUs.

Search parameters are passed directly to `search()` as keyword arguments.
In the example above:
- **`time_limit=10.0`**: Sets the time limit to 10.0 seconds.
- **`enable_default_callback=1`**: Enables the built-in callback function, which prints the energy and TTS of newly obtained solutions.

## ABS3 Parameters
Parameters are passed directly to the `search()` method as keyword arguments.
In the program above, `time_limit=10.0` sets the time limit to 10.0 seconds
and `enable_default_callback=1` enables the built-in callback function, which prints the energy of newly obtained solutions.

The return value is a solution that provides `sol.energy` (energy value), `sol(x)` (variable value lookup), `sol.info` (dict of solver info), and more. See [QR_SOLUTION](QR_SOLUTION) for details.

### Basic Options

| Key | Type | Description |
|----|----|----|
| **`time_limit`** | float | Time limit in seconds. Terminates the search when the time limit is reached |
| **`target_energy`** | int | Terminates the search when the target energy is achieved |

### Advanced Options

| Key | Type | Description |
|----|----|----|
| **`enable_default_callback`** | int (0 or 1) | Enables the built-in callback that prints energy and TTS |
| **`cpu_enable`** | int (0 or 1) | Enables/disables the CPU solver running alongside the GPU (default: 1) |
| **`cpu_thread_count`** | int | Number of CPU solver threads (default: auto) |
| **`block_count`** | int | Number of CUDA blocks per GPU |
| **`thread_count`** | int | Number of threads per CUDA block |
| **`topk_sols`** | int | Returns the top-K solutions with the best energies |
| **`best_energy_sols`** | int | Max count (`0` = unlimited). Returns all solutions with the best energy found |

## Collecting Multiple Solutions

The ABS3 Solver can collect multiple solutions during the search.
Two modes are available:

### Top-K Solutions (`topk_sols`)

The `topk_sols` parameter collects the top-K solutions sorted by energy in ascending order.

```python
sol = solver.search(topk_sols=10)  # collect up to 10 best solutions
```

### Best Energy Solutions (`best_energy_sols`)

The `best_energy_sols` parameter collects all solutions that share the best energy found.
Whenever a better energy is discovered, the pool is cleared and only solutions with the new best energy are kept.

```python
sol = solver.search(best_energy_sols=0)  # collect all best-energy solutions (unlimited)
```

Alternatively, `best_energy_sols` can be set with a maximum count:
```python
sol = solver.search(best_energy_sols=100)  # collect up to 100
```

Note that `topk_sols` and `best_energy_sols` share the same internal pool.
If both are specified, the last one takes effect.

### Accessing Collected Solutions

The return value of `search()` is a solution that provides access to the collected solutions via the `sol.sols` property:

```python
sol = solver.search(topk_sols=5)

print(f"Best energy: {sol.energy}")
print(f"Number of solutions: {len(sol.sols)}")

for s in sol.sols:
    print(f"energy = {s.energy}  TTS = {s.tts}s")
```

The returned object supports:
- **`sol.energy`** — the best solution's energy
- **`sol.tts`** — time in seconds at which the best solution was found
- **`sol.sols`** — list of collected solutions (sorted by ascending energy)
- **`len(sol)`** — number of collected solutions
- **`sol[i]`** — access the i-th solution
- **`sol.info`** — dict of solver info strings
- Iteration via `for s in sol: ...`

## Custom Callback

The built-in callback (enabled by `enable_default_callback=1`) simply prints the energy and TTS whenever a new best solution is found.
For more control, **subclass `ABS3Solver`** and override the `callback()` method (no arguments).

The callback is invoked with one of the following events:

| Event value | Name | Description |
|:-:|----|----|
| `0` | `Start` | Called once at the beginning of `search()` |
| `1` | `BestUpdated` | Called whenever a new best solution is found |
| `2` | `Timer` | Called periodically at a configurable interval |

Inside `callback()`, the following methods are available:
- **`self.event()`** — the event that triggered this callback (int: 0=Start, 1=BestUpdated, 2=Timer)
- **`self.best_sol()`** — returns the current best solution. Use `.energy`, `.tts`, `.get(var)`, etc.
- **`self.timer(seconds)`** — set the timer interval in seconds for periodic `Timer` callbacks. `0` disables the timer (see below)
- **`self.hint(sol)`** — provide a hint solution to the solver during the search (see [Solution Hint](#solution-hint))

### Timer Control

The `Timer` event is not enabled by default.
To enable periodic timer callbacks, call `self.timer(seconds)` inside the `callback()` method:
- **`self.timer(1.0)`** — fire `Timer` callbacks every 1 second
- **`self.timer(0)`** — disable the timer
- If `self.timer()` is not called, the timer interval remains unchanged.

Typically, `self.timer()` is called once during the `Start` callback to establish the interval.
It can also be called during `BestUpdated` or `Timer` callbacks to adjust or disable the timer dynamically.

### Example: Custom Callback

```python
import pyqbpp as qbpp

class MySolver(qbpp.ABS3Solver):
    def callback(self):
        if self.event() == 0:        # Start
            self.timer(1.0)          # enable timer callback every 1 second
        if self.event() == 1:        # BestUpdated
            sol = self.best_sol()
            print(f"New best: energy={sol.energy} TTS={sol.tts:.3f}s")

x = qbpp.var("x", shape=8)
f = qbpp.sqr(qbpp.sum(x) - 4)
f.simplify_as_binary()

solver = MySolver(f)
sol = solver.search(time_limit=5, target_energy=0)
print(f"energy={sol.energy}")
```

## Solution Hint

A hint solution allows warm-starting a search with a previously found solution.

The simplest way is to call `solver.hint(sol)` before `search()`:
```python
solver.hint(prev_sol)            # provide a hint solution for the search
sol = solver.search(time_limit=10)
```
The solution is written directly to the solver's internal data structure before the search begins.

For advanced use cases such as running an external solver concurrently, you can also call `self.hint(sol)` inside a callback to feed solutions dynamically.
In this scenario, setting up a periodic timer (e.g., `self.timer(1.0)`) is recommended so that the callback is invoked regularly to check for new external solutions.

### Example: Providing a Hint Solution

The following example solves a factorization problem twice.
The first run finds the optimal solution normally.
The second run provides the first solution as a hint via `solver.hint(sol1)`, causing the solver to converge much faster.

```python
import pyqbpp as qbpp

p = qbpp.var("p", between=(2, 1000))
q = qbpp.var("q", between=(2, 1000))
f = qbpp.sqr(p * q - 899 * 997)
f.simplify_as_binary()

solver = qbpp.ABS3Solver(f)

# Run 1: normal search
sol1 = solver.search(target_energy=0, time_limit=10, enable_default_callback=1)
print(f"Run 1: p={sol1(p)} q={sol1(q)} energy={sol1.energy} TTS={sol1.tts:.3f}s")

# Run 2: provide previous solution as a hint
solver.hint(sol1)
sol2 = solver.search(target_energy=0, time_limit=10, enable_default_callback=1)
print(f"Run 2: p={sol2(p)} q={sol2(q)} energy={sol2.energy} TTS={sol2.tts:.3f}s")
```

The hint solution is written directly to the solver's internal data structure before the search begins.
The solver evaluates its energy and uses it as the initial state, then continues searching for better solutions.
