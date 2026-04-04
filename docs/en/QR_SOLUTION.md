---
layout: default
nav_exclude: true
title: "QR: Solutions"
nav_order: 32
lang: en
hreflang_alt: "ja/QR_SOLUTION"
hreflang_lang: "ja"
---

# Quick Reference: Solutions

The `qbpp::Sol` class represents a solution to a QUBO problem.
It stores variable assignments (as a packed bit array) along with the energy value and time-to-solution.

## Creating a Sol

| Expression | Description |
|------------|-------------|
| `Sol(expr)` | Create an all-zero solution for expression `expr` |

## Evaluating Variables, Terms, and Expressions

Given a solution `sol`, variable values and expression results can be obtained using two equivalent calling conventions:

| Expression | Equivalent | Return Type | Description |
|------------|------------|-------------|-------------|
| `sol(x)` | `x(sol)` | `energy_t` | Evaluate `Var` `x` (returns 0 or 1) |
| `sol(t)` | `t(sol)` | `energy_t` | Evaluate `Term` `t` |
| `sol(f)` | `f(sol)` | `energy_t` | Evaluate `Expr` `f` |
| `sol(arr)` | `arr(sol)` | `Array<coeff_t>` | Evaluate array of variables/expressions |

Both `sol(x)` and `x(sol)` produce the same result.
The `x(sol)` form is convenient for use in array contexts: for a `Var` array `x` of size $n \times m$,
`x(sol)` returns an `Array<coeff_t>` of size $n \times m$ containing the assigned values (0 or 1).

## Setting Variable Values

| Expression | Description |
|------------|-------------|
| `sol.set(x, value)` | Set variable `x` to `value` (0 or 1) |
| `sol.set(other)` | Copy all variable values from another `Sol` |
| `sol.set(ml)` | Set variable values from a `MapList` |
{% raw %}| `sol.set(other, ml)` | Copy from `other`, then apply `MapList` `ml` |{% endraw %}

A `MapList` is a list of `(Var, value)` or `(VarInt, value)` pairs:
{% raw %}
```cpp
qbpp::MapList ml = {{x[0], 1}, {x[1], 0}, {vi, 5}};
sol.set(ml);
```
{% endraw %}

The `set` methods return `Sol&`, allowing chaining:
```cpp
auto full_sol = qbpp::Sol(f).set(sol).set(ml);
```

## Energy and Evaluation

| Expression | Return Type | Description |
|------------|-------------|-------------|
| `sol.energy()` | `energy_t` | Return the stored energy value |
| `sol.comp_energy()` | `energy_t` | Recompute energy from current variable values and store it |
| `sol.tts()` | `double` | Time-to-solution (seconds) |

`sol.energy()` returns the energy value that was stored when the solver found the solution.
It does **not** recompute the energy.
After calling `sol.set()` to modify variable values, the stored energy becomes **invalid**.
Calling `sol.energy()` in this state throws an error.
Call `sol.comp_energy()` to recompute and update the energy before accessing it.

## Extracting Integers from Solutions

### `onehot_to_int()` — One-Hot Decoding

| Expression | Return Type | Description |
|------------|-------------|-------------|
| `onehot_to_int(sol(x))` | `Array<coeff_t>` | Decode one-hot along last axis (default) |
| `onehot_to_int(sol(x), k)` | `Array<coeff_t>` | Decode one-hot along axis $k$ |

Decodes along the specified axis and returns an array with one fewer dimension.
The output shape is the input shape with axis $k$ removed, and each element is the index of the 1 along that axis.
Negative indices are supported (e.g., `-1` = last axis).
Returns $-1$ for slices that are not valid one-hot vectors (i.e., do not contain exactly one 1).

For more details and examples, see **[Extracting Integers](ONEHOT)**.

## Solver Info

The solver result classes (`EasySolverSol`, `ExhaustiveSolverSol`, `ABS3SolverSol`) inherit from `Sol`
and provide additional information via **`info()`**.

| Expression | Return Type | Description |
|------------|-------------|-------------|
| `sol.info()` | `const KeyValueVector&` | Key-value pairs of solver information |
| `sol.sols()` | `const std::vector<Sol>&` | All collected solutions |
| `sol.size()` | `size_t` | Number of collected solutions |
| `sol[i]` | `const Sol&` | Access the $i$-th solution |

The `info()` object contains solver metadata as string key-value pairs.
Representative keys include:

| Key | Description |
|-----|-------------|
| `"flip_count"` | Total number of variable flips performed |
| `"var_count"` | Number of variables in the model |
| `"term_count"` | Number of terms in the model |
| `"version"` | QUBO++ version |
| `"cpu_name"` | CPU model name |
| `"hostname"` | Machine hostname |

You can iterate over all entries or access by key:
```cpp
for (const auto& kv : sol.info()) {
  std::cout << kv.key << " = " << kv.value << std::endl;
}
```

## Printing

`Sol` objects can be printed with `std::cout`:
```cpp
std::cout << sol << std::endl;
```
This outputs a human-readable representation of the solution including variable assignments.
