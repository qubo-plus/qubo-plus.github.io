---
layout: default
nav_exclude: true
title: "Reference Integer & Constraint"
nav_order: 32
lang: en
hreflang_alt: "ja/QR_INTCONSTRAINT"
hreflang_lang: "en"
---

# Quick Reference: Operations and Functions for Integer Variables and Constraints

`qbpp::Expr` is a **unified type** for plain expressions, integer variables, and constraint expressions. The same type is used for all three; only the extra metadata differs.

An `Expr` has three "faces":
- **Plain expression** (polynomial): e.g. `x + 2*y*z`
- **Integer variable**: created via `l <= qbpp::var_int("x") <= u` — carries range / binary-decomposition metadata
- **Constraint expression**: created via `e == 5` or `lo <= e <= hi` — carries a penalty + original body

> **Core principles**
> - All `qbpp::Expr` operations / functions work on every Expr, regardless of face.
> - **Face-specific accessors** (`min_val()`, `body()`, ...) are valid only on Exprs of the matching face. Calling them on a mismatching Expr **aborts at runtime** (with a descriptive message).
> - **Mutating members** (`+=`, `-=`, `*=`, `/=`, `sqr()`, `replace()`) turn the internal state into a plain expression: face-specific metadata is discarded, so face-specific accessors fail afterwards.
> - **Exception: `simplify*()`** preserves the metadata and only rewrites the held expression. Face identity is kept.
> - Use `is_varint()` / `is_exprexpr()` for runtime face checks.

---

## 1. Integer variables

### Construction

| Syntax | Result |
|---|---|
| `l <= qbpp::var_int("x") <= u` | `Expr` (integer variable in `[l, u]`) |
| `l <= qbpp::var_int("x", s1, s2, ...) <= u` | multi-dimensional `Array<Dim, Expr>` of integer variables |

### Operations / functions

| Category | Example | Result | Notes |
|---|---|---|---|
| Unary | `-vi` | `Expr` | |
| Arithmetic (RHS Expr-like) | `vi + 1`, `vi * 2`, `vi - x` | `Expr` | |
| Arithmetic (RHS integer variable) | `vi1 + vi2`, `vi1 * vi2` | `Expr` | |
| Constraint (== int) | `vi == 5` | `Expr` (constraint) | constraint generation |
| Constraint (range) | `2 <= vi <= 5` | `Expr` (constraint) | between constraint |
| Global functions | `qbpp::sqr(vi)`, `qbpp::simplify(vi)`, `qbpp::sqr(vi - 3)` | `Expr` | |
| Integer-specific metadata | `vi.min_val()`, `vi.max_val()` | `energy_t` | read-only |
| Integer-specific structure | `vi.var_count()`, `vi.coeff(i)`, `vi.get_var(i)`, `vi[i]` | various | read-only |
| Array accessors | `vi.vars()`, `vi.coeffs()` | `Array<1, ...>` | read-only |
| **Compound assignment** | `vi += 1`, `vi -= 1`, `vi *= 2`, `vi /= 2` | `Expr&` | **becomes a plain expression** (metadata discarded) |
| **Square** | `vi.sqr()` | `Expr&` | **becomes a plain expression** |
| **Replace** | `vi.replace(ml)` | `Expr&` | **becomes a plain expression** |
| In-place simplify | `vi.simplify()`, `vi.simplify_as_binary()`, `vi.simplify_as_spin()` | `Expr&` | only the held expression is rewritten; **integer-variable metadata is preserved** |
| Assignment | `vi = other` | `Expr&` | same type |

> **Note**: After calling a mutator like `vi += 1`, the static type is still `qbpp::Expr` but the internal state is a plain expression. Calling integer-specific accessors (`vi.min_val()`, etc.) afterward raises a **runtime error**.

---

## 2. Constraint expressions

### Construction

| Syntax | Result | Meaning (penalty / body) |
|---|---|---|
| `f == n` | `Expr` (constraint) | penalty = `sqr(f - n)`, body = `f` |
| `l <= f <= u` | `Expr` (constraint) | penalty = `(f-a)(f-(a+1))` (a is slack), body = `f` |

`f` is any non-integer expression (`Var`, `Term`, `Expr`, integer-variable `Expr`).

### Operations / functions

| Category | Example | Result | Notes |
|---|---|---|---|
| Unary | `-ee` | `Expr` | negates penalty |
| Arithmetic (RHS Expr-like) | `ee + 1`, `ee * 2`, `ee + x` | `Expr` | |
| Arithmetic (RHS constraint) | `ee1 + ee2`, `ee * ee` | `Expr` | penalty + penalty |
| Global functions | `qbpp::sqr(ee)`, `qbpp::simplify_as_binary(ee)`, `qbpp::replace(ee, ml)` | `Expr` | applied to penalty |
| Body access | `ee.body()` | `Expr` | clones |
| Evaluation by Sol | `sol(ee)` (evaluate penalty), `ee.body(sol)` (evaluate body) | `energy_t` | for constraint verification |
| **Compound assignment** | `ee += 1`, `ee -= 1`, `ee *= 2`, `ee /= 2` | `Expr&` | **becomes a plain expression** (body no longer reachable) |
| **Square** | `ee.sqr()` | `Expr&` | **becomes a plain expression** |
| **Replace** | `ee.replace(ml)` | `Expr&` | **becomes a plain expression** |
| In-place simplify | `ee.simplify()`, `ee.simplify_as_binary()`, `ee.simplify_as_spin()` | `Expr&` | applies the rule to **both** penalty and body, **stays a constraint** |
| Assignment | `ee = other` | `Expr&` | same type |

> **Note**: After `ee += 1` etc., only the penalty is updated and the body becomes inaccessible. In contrast, `ee.simplify*()` applies the same rule to both penalty and body, keeping the constraint in a consistent state.

> **Note on Python**: Python instead silent-rebinds for `+=` (the variable is rebound to a new `Expr`). C++ mutates the same object, with the internal state becoming a plain expression. See [Differences between QUBO++ (C++) and PyQBPP (Python)](CPP_VS_PYTHON) for details.

---

## 3. Native constraints (`cons`)

Wrapping a comparison or constraint expression in `qbpp::cons()` produces an expression with a **declared native constraint**.
Declared constraints are treated specially as constraints, and the bundled solvers search efficiently for solutions that satisfy them.
See [Native Constraints](CONSTRAINTS) for details.

### Construction

| Syntax | Meaning |
|---|---|
| `qbpp::cons(f == n)` | equality constraint `f == n` |
| `qbpp::cons(f <= n)` | one-sided constraint |
| `qbpp::cons(l <= f <= u)` | two-sided range constraint |
| `qbpp::cons(f == qbpp::equal{a, b, ...})` | discrete allowed-value set (`f` must be one of `a`, `b`, ...) |
| `qbpp::cons(arr == n)` (array comparison) | **one constraint per element** |
| `P * qbpp::cons(...)` | assigns weight `P` (positive integer) |
| `obj + qbpp::cons(...) + qbpp::cons(...)` | combines freely with the objective and other constraints via `+` |

### Operations / functions

For an expression `f` containing declared constraints:

| Example | Result | Description |
|---|---|---|
| `f.is_declared_cons()` | `bool` | whether `f` contains declared constraints |
| `f(sol)` | `energy_t` | matches the Energy reported by the solvers (objective + penalties) |
| `f.cons(sol)` | `size_t` | number of constraints violated by `sol` (0 means all satisfied) |
| `f.cons()` | printable view | `std::cout << f.cons()` prints the declared constraint list |
| `f.violations(sol)` | list | reports value, bounds, violation, and weight of each constraint |
| `f.is_feasible(sol)` | `bool` | whether all constraints are satisfied |
| `f.simplify_as_binary()` | `Expr&` | simplifies both objective and constraints, **declarations preserved** |
| `qbpp::replace(f, ml)` | `Expr` | variable substitution, declarations preserved |
| `qbpp::expand_cons(f)` / `f.expand_cons()` | `Expr` / `Expr&` | expands into the classic penalty form (declarations removed) |
| `sqr()`, expression multiplication, scalar factor ≤ 0, subtracting a constraint, `reduce()`, etc. | — | operations that would break the declarations are **explicit runtime errors** |

---

## 4. Global functions: return a new `Expr`

The principal global functions that accept integer variables / constraint expressions. **All return a new `qbpp::Expr` and never modify their argument**:

| Function | Result | Description |
|---|---|---|
| `qbpp::sqr(x)` | `Expr` | `x * x` |
| `qbpp::simplify(x)` | `Expr` | merge like terms |
| `qbpp::simplify_as_binary(x)` | `Expr` | binary (0/1) simplification |
| `qbpp::simplify_as_spin(x)` | `Expr` | spin (±1) simplification |
| `qbpp::replace(x, ml)` | `Expr` | variable substitution |
| `qbpp::cons(x)` | `Expr` (declared constraint) | declares a native constraint |
| `qbpp::expand_cons(x)` | `Expr` | expands declared constraints into penalty form |

The argument `x` may be `Var`, `Term`, `Expr` (of any face) — internally it is treated as `Expr`.

---

## 5. Array variants

Multi-dimensional arrays of integer variables and constraint expressions follow the same rules:
- **Arithmetic treats each element as `Expr`** -> result is an array of `Expr`
- **In-place mutators (`+=`, `*=`, etc.) are allowed**; per element, the same
  decay rule above applies (the element becomes a plain expression).

```cpp
// Integer-variable array
auto x = 0 <= qbpp::var_int("x", 3) <= 7;     // Array<1, Expr> of integer variables
auto sum = qbpp::sum(x);                       // Expr (each element treated as Expr, then summed)

// Constraint-expression array (per-element constraints)
auto m = qbpp::var("m", 3, 4);                 // Array<2, Var>
auto rows = qbpp::vector_sum(m, 0);            // Array<1, Expr> (sum of each row)
auto onehot = (rows == 1);                     // Array<1, Expr> of constraints
auto penalty = qbpp::sum(onehot);              // Expr (sum of all constraint penalties)
```

Per-element `body` access: `qbpp::Expr(arr[i]).body()`.

---

## See also

- [Integer Variables](INTEGER) — solving equations with integer variables
- [Comparison Operators](COMPARISON) — `==`, `<= <=` details
- [Native Constraints](CONSTRAINTS) — `qbpp::cons()` usage and per-solver semantics
- [Replace](REPLACE) — `replace()` usage
