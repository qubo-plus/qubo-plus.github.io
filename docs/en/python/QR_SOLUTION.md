---
last_modified: 2026-10-14
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
| `Sol(expr)` | Create a solution for expression `expr` with every variable set to 0 (a [native integer variable](INTEGER) is set to its lower bound) |

## Getting Variable Values

For any `Var`, `Term`, or `Expr` (plain, integer-variable, or constraint), both `sol(x)` and `x(sol)`
return the same value. In addition, `sol[x]` is a shortcut for `sol(x)`.

| Expression | Return Type | Description |
|------------|-------------|-------------|
| `sol(x)` / `x(sol)` / `sol[x]` | `int` | Get value of variable `x` (returns 0 or 1) |
| `sol(vi)` / `vi(sol)` / `sol[vi]` | `int` | Get value of integer variable `vi` |
| `sol.get(x)` | `int` | Get the value of variable `x` (`Var` or native integer variable); same as `sol(x)` |
| `sol(t)` / `t(sol)` | `int` | Evaluate term `t` |
| `sol(f)` / `f(sol)` | `int` | Evaluate expression `f` |
| `sol(c)` / `c(sol)` | `int` | Evaluate the penalty of a constraint `c` |

Reading a variable that is not in the solution's model (the expression given to the solver), or evaluating an
expression that contains one, raises `RuntimeError`.
A variable whose value was fixed with [`replace`](REPLACE) is not in the solution of the fixed expression:
restore a solution of the original expression `f` with `qbpp.Sol(f).set(sol, ml)` before reading it.
`sol.has(x)` reports whether a variable is in the model.

For arrays, use element-wise access:
```python
for i in range(n):
    print(sol[x[i]])
```

## Setting Variable Values

| Expression | Description |
|------------|-------------|
| `sol.set(x, value)` | Set variable `x` to `value` (0 or 1, or an integer for an integer variable) |
| `sol.flip(x)` | Flip the value of binary variable `x` (0 ↔ 1); the stored energy becomes invalid. Not available for native integer variables |
| `sol.set(other_sol)` | Copy all variable values from another solution |
| `sol.set({x: val, ...})` | Set variable values from a dict |
| `sol.set([(x, val), ...])` | Set variable values from a list of tuples |
| `sol.set(other_sol, {x: val, ...})` | Copy from another solution, then apply dict |
| `sol.set(other_sol, [(x, val), ...])` | Copy from another solution, then apply list |

```python
sol.set(x[0], 1)
sol.set(x[1], 0)
sol.set(vi, 5)

# Set multiple values at once with a dict
sol.set({x[0]: 1, x[1]: 0, vi: 5})
```

The `set` and `flip` methods return `self`. To build a solution of the original expression `f` from a solution `sol` of an expression whose variables were fixed with [`replace`](REPLACE), use `set(sol, ml)`:
```python
full_sol = qbpp.Sol(f).set(sol, ml)
```

The values in `ml` may also be expressions such as `~x[1]`; they are evaluated with the variable values of `sol`.
In `set({x: val, ...})` without a solution, the values must be integers: an expression raises `TypeError`.

## Energy and Evaluation

| Expression | Return Type | Description |
|------------|-------------|-------------|
| `sol.energy` | `int` | Return the stored energy value |
| `sol.comp_energy()` | `int` | Return energy (recompute only if invalid) |
| `sol.tts` | `float` | Time-to-solution (seconds) |

`sol.energy` is a property that returns the energy value stored when the solver found the solution.
It does **not** recompute the energy.
After modifying variable values (e.g., `sol.set(x, val)` or `sol.flip(x)`), the stored energy becomes **invalid**.
Accessing `sol.energy` in this state raises an error.
Call `sol.comp_energy()` to recompute and cache the energy.
If the energy is already valid, `comp_energy()` returns the cached value without recomputation.

## Extracting Integers from Solutions

### `onehot_to_int()` — One-Hot Decoding

| Expression | Return Type | Description |
|------------|-------------|-------------|
| `qbpp.onehot_to_int(sol(x))` | array | Decode one-hot along last axis (default) |
| `qbpp.onehot_to_int(sol(x), axis=k)` | array | Decode one-hot along axis $k$ |

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
| `"flip_count"` | Total number of variable flips performed (`"total_flip_count"` for `ABS3Solver`) |
| `"var_count"` | Number of variables in the model |
| `"term_count"` | Number of terms in the model |
| `"version"` | QUBO++ version |
| `"cpu_name"` | CPU model name |
| `"hostname"` | Machine hostname |

The keys returned differ by solver. For example, `ExhaustiveSolver` does not return `flip_count`, `version`, `cpu_name`, or `hostname` (nor `var_count` and `term_count` for a model with native integer variables).
To see which keys are present, iterate over all entries:
```python
for k, v in sol.info.items():
    print(f"{k} = {v}")
```

## Printing

```python
print(sol)
```
This prints a human-readable representation of the solution including variable assignments.
For examples, see [Quick Reference: Printing Objects](QR_PRINT#solutions).
