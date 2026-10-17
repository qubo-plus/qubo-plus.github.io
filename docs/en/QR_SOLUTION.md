---
last_modified: 2026-10-15
layout: default
nav_exclude: true
title: "QR: Solutions"
nav_order: 33
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
| `Sol(expr)` | Create a solution for expression `expr` with every variable set to 0 (a [native integer variable](INTEGER) is set to its lower bound) |

## Evaluating Variables, Terms, and Expressions

Given a solution `sol`, variable values and expression results can be obtained using two equivalent calling conventions:

| Expression | Equivalent | Return Type | Description |
|------------|------------|-------------|-------------|
| `sol(x)` | `x(sol)` | `energy_t` | Evaluate `Var` `x` (returns 0 or 1) |
| `sol.get(x)` | `sol(x)` | `coeff_t` | Get the value (0 or 1) of `Var` `x`; for a native integer variable, its integer value (`energy_t`) |
| `sol(vi)` | `vi(sol)` | `energy_t` | Evaluate an integer variable `vi` (integer value) |
| `sol(t)` | `t(sol)` | `energy_t` | Evaluate `Term` `t` |
| `sol(f)` | `f(sol)` | `energy_t` | Evaluate `Expr` `f` |
| `sol(c)` | `c(sol)` | `energy_t` | Evaluate the penalty of a constraint expression `c` |
| `sol(arr)` | `arr(sol)` | `Array<coeff_t>` | Evaluate an array of variables (`Var`), of native integer variables, or of expressions (`Term`, `Expr`) (same shape) |

Both `sol(x)` and `x(sol)` produce the same result.
The `x(sol)` form is convenient for use in array contexts: for a `Var` array `x` of size $n \times m$,
`x(sol)` returns an `Array<coeff_t>` of size $n \times m$ containing the assigned values (0 or 1).
An array of expressions (`Array<Dim, Expr>`) is also evaluated by `sol(arr)` / `arr(sol)`, which returns an `Array<coeff_t>` of the same shape (a sub-array `arr[i]` works too).
An element whose value does not fit `coeff_t` throws `std::overflow_error`; evaluate such elements one at a time with `arr[i](sol)` (`energy_t`).

Reading a variable that is not in the solution's model (the expression given to the solver), or evaluating an
expression that contains one, is an error (a `std::runtime_error` exception).
A variable whose value was fixed with [`replace`](REPLACE) is not in the solution of the fixed expression:
restore a solution of the original expression `f` with `Sol(f).set(sol, ml)` before reading it.
`sol.has(x)` reports whether a variable is in the model.

## Setting Variable Values

| Expression | Description |
|------------|-------------|
| `sol.set(x, value)` | Set variable `x` to `value` (0 or 1, or an integer for a [native integer variable](INTEGER)) |
| `sol.flip(x)` | Flip the value of binary variable `x` (0 ↔ 1); the stored energy becomes invalid. Not available for native integer variables |
| `sol.set(other)` | Copy all variable values from another `Sol` |
| `sol.set(ml)` | Set variable values from a `MapList` |
{% raw %}| `sol.set(other, ml)` | Copy from `other`, then apply `MapList` `ml` |{% endraw %}

A `MapList` is a list of `(Var, value)` or `(Expr, value)` pairs (where the `Expr` is an integer variable):
{% raw %}
```cpp
qbpp::MapList ml = {{x[0], 1}, {x[1], 0}, {vi, 5}};
sol.set(ml);
```
{% endraw %}

`set()` returns `Sol&`. To build a solution of the original expression `f` from a solution `sol` of an expression whose variables were fixed with [`replace`](REPLACE), use `set(sol, ml)`:
```cpp
auto full_sol = qbpp::Sol(f).set(sol, ml);
```

The values in `ml` may also be expressions such as `~x[1]`; they are evaluated with the variable values of `sol`.
In `set(ml)` without a solution, the values must be constants: an expression throws `std::invalid_argument`.

## Energy and Evaluation

| Expression | Return Type | Description |
|------------|-------------|-------------|
| `sol.energy()` | `energy_t` | Return the stored energy value |
| `sol.comp_energy()` | `energy_t` | Return the energy (recomputed from current variable values only when invalid) |
| `sol.tts()` | `double` | Time-to-solution (seconds) |

`sol.energy()` returns the energy value that was stored when the solver found the solution.
It does **not** recompute the energy.
After calling `sol.set()` or `sol.flip()` to modify variable values, the stored energy becomes **invalid**.
Calling `sol.energy()` in this state throws an error.
Call `sol.comp_energy()` to recompute and update the energy before accessing it.
If the energy is already valid, `comp_energy()` returns the cached value without recomputation.

## Extracting Integers from Solutions

### `onehot_to_int()` — One-Hot Decoding

| Expression | Return Type | Description |
|------------|-------------|-------------|
| `onehot_to_int(sol(x))` | `Array<coeff_t>` | Decode one-hot along last axis (default) |
| `onehot_to_int(sol(x), k)` | `Array<coeff_t>` | Decode one-hot along axis $k$ |

Decodes along the specified axis and returns an array with one fewer dimension.
For a one-dimensional array, it returns a `coeff_t` scalar (the position of the 1) instead of an array (no axis is given).
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
| `sol.info().get(key)` | `const char*` | Value for a key (`nullptr` if absent) |
| `sol.sols` | `const std::vector<Sol>&` | All collected solutions |
| `sol.size()` | `size_t` | Number of collected solutions |
| `sol.sols[i]` | `const Sol&` | Access the $i$-th solution |

The `info()` object contains solver metadata as string key-value pairs.
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
`info().get(key)` returns `nullptr` for an absent key.
You can iterate over all entries or access by key:
```cpp
for (const auto& kv : sol.info()) {
  std::cout << kv.key << " = " << kv.value << std::endl;
}
std::cout << "var_count = " << sol.info().get("var_count") << std::endl;
```

## Printing

`Sol` objects can be printed with `std::cout`:
```cpp
std::cout << sol << std::endl;
```
This outputs a human-readable representation of the solution including variable assignments.
For examples, see [Quick Reference: Printing Objects](QR_PRINT#solutions).
