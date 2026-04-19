---
layout: default
nav_exclude: true
title: "QR: Solutions"
nav_order: 33
lang: en
hreflang_alt: "ja/python/QR_SOLUTION"
hreflang_lang: "ja"
---

# Quick Reference: Solutions

The `Sol` class represents a solution to a QUBO problem.
It stores variable assignments along with the energy value and time-to-solution.

## Creating a Sol

| Expression | Description |
|------------|-------------|
| `Sol(expr)` | Create an all-zero solution for expression `expr` |

## Getting Variable Values

| Expression | Return Type | Description |
|------------|-------------|-------------|
| `sol[x]` | `int` | Get value of variable `x` (returns 0 or 1) |
| `sol[vi]` | `int` | Get value of integer variable `vi` |
| `sol(t)` | `int` | Evaluate term `t` |
| `sol(f)` | `int` | Evaluate expression `f` |

For arrays, use element-wise access:
```python
for i in range(n):
    print(sol[x[i]])
```

## Setting Variable Values

| Expression | Description |
|------------|-------------|
| `sol[x] = value` | Set variable `x` to `value` (0 or 1) |
| `sol[vi] = value` | Set integer variable `vi` to `value` |
| `sol.set(x, value)` | Set variable `x` to `value` (0 or 1) |
| `sol.set(other_sol)` | Copy all variable values from another solution |
| `sol.set({x: val, ...})` | Set variable values from a dict |
| `sol.set([(x, val), ...])` | Set variable values from a list of tuples |
| `sol.set(other_sol, {x: val, ...})` | Copy from another solution, then apply dict |
| `sol.set(other_sol, [(x, val), ...])` | Copy from another solution, then apply list |

```python
sol[x[0]] = 1
sol[x[1]] = 0
sol[vi] = 5

# Set multiple values at once with a dict
sol.set({x[0]: 1, x[1]: 0, vi: 5})
```

The `set` method returns `self`, enabling chaining:
```python
full_sol = Sol(f).set(sol).set({x[0]: 1})
```

## Energy and Evaluation

| Expression | Return Type | Description |
|------------|-------------|-------------|
| `sol.energy` | `int` | Return the stored energy value |
| `sol.comp_energy()` | `int` | Return energy (recompute only if invalid) |
| `sol.tts` | `float` | Time-to-solution (seconds) |

`sol.energy` is a property that returns the energy value stored when the solver found the solution.
It does **not** recompute the energy.
After modifying variable values (e.g., `sol[x] = val`), the stored energy becomes **invalid**.
Accessing `sol.energy` in this state raises an error.
Call `sol.comp_energy()` to recompute and cache the energy.
If the energy is already valid, `comp_energy()` returns the cached value without recomputation.

## Extracting Integers from Solutions

### `onehot_to_int()` — One-Hot Decoding

| Expression | Return Type | Description |
|------------|-------------|-------------|
| `qbpp.onehot_to_int(sol(x))` | array | Decode one-hot along last axis (default) |
| `qbpp.onehot_to_int(sol(x), k)` | array | Decode one-hot along axis $k$ |

Decodes along the specified axis and returns an array with one fewer dimension.
The output shape is the input shape with axis $k$ removed, and each element is the index of the 1 along that axis.
Negative indices are supported (e.g., `-1` = last axis).
Returns $-1$ for slices that are not valid one-hot vectors.

For more details and examples, see **[One-Hot to Integer Conversion](ONEHOT)**.

## Solver Info

The solver result classes (`EasySolverSol`, `ExhaustiveSolverSol`, `ABS3SolverSol`) inherit from `Sol`
and provide additional information via **`info`**.

| Expression | Return Type | Description |
|------------|-------------|-------------|
| `sol.info` | `dict` | Key-value pairs of solver information |
| `sol.sols` | `list[Sol]` | All collected solutions |
| `sol.size` | `int` | Number of collected solutions |
| `sol.sols[i]` | `Sol` | Access the $i$-th solution |

The `info` dictionary contains solver metadata as string key-value pairs.
Representative keys include:

| Key | Description |
|-----|-------------|
| `"flip_count"` | Total number of variable flips performed |
| `"var_count"` | Number of variables in the model |
| `"term_count"` | Number of terms in the model |
| `"version"` | QUBO++ version |
| `"cpu_name"` | CPU model name |
| `"hostname"` | Machine hostname |

```python
for k, v in sol.info.items():
    print(f"{k} = {v}")
```

## Printing

```python
print(sol)
```
