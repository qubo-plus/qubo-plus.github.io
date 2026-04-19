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
| Integer-specific metadata | `vi.min_val()`, `vi.max_val()` | `coeff_t` | read-only |
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
| Evaluation by Sol | `sol(ee)` (evaluate penalty), `ee.body(sol)` (evaluate body) | `coeff_t` | for constraint verification |
| **Compound assignment** | `ee += 1`, `ee -= 1`, `ee *= 2`, `ee /= 2` | `Expr&` | **becomes a plain expression** (body no longer reachable) |
| **Square** | `ee.sqr()` | `Expr&` | **becomes a plain expression** |
| **Replace** | `ee.replace(ml)` | `Expr&` | **becomes a plain expression** |
| In-place simplify | `ee.simplify()`, `ee.simplify_as_binary()`, `ee.simplify_as_spin()` | `Expr&` | applies the rule to **both** penalty and body, **stays a constraint** |
| Assignment | `ee = other` | `Expr&` | same type |

> **Note**: After `ee += 1` etc., only the penalty is updated and the body becomes inaccessible. In contrast, `ee.simplify*()` applies the same rule to both penalty and body, keeping the constraint in a consistent state.

> **Note on Python**: Python instead silent-rebinds for `+=` (the variable is rebound to a new `Expr`). C++ mutates the same object, with the internal state becoming a plain expression. See [Differences between QUBO++ (C++) and PyQBPP (Python)](CPP_VS_PYTHON) for details.

---

## 3. Global functions: return a new `Expr`

The principal global functions that accept integer variables / constraint expressions. **All return a new `qbpp::Expr` and never modify their argument**:

| Function | Result | Description |
|---|---|---|
| `qbpp::sqr(x)` | `Expr` | `x * x` |
| `qbpp::simplify(x)` | `Expr` | merge like terms |
| `qbpp::simplify_as_binary(x)` | `Expr` | binary (0/1) simplification |
| `qbpp::simplify_as_spin(x)` | `Expr` | spin (±1) simplification |
| `qbpp::replace(x, ml)` | `Expr` | variable substitution |

The argument `x` may be `Var`, `Term`, `Expr` (of any face) — internally it is treated as `Expr`.

---

## 4. Array variants

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

Per-element `body` access: `*arr[i]`.

---

## See also

- [Integer Variables](INTEGER) — solving equations with integer variables
- [Comparison Operators](COMPARISON) — `==`, `<= <=` details
- [Replace](REPLACE) — `replace()` usage
