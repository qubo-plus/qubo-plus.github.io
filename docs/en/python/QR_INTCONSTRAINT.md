---
layout: default
nav_exclude: true
title: "QR: Integer & Constraint"
nav_order: 32
lang: en
hreflang_alt: "ja/python/QR_INTCONSTRAINT"
hreflang_lang: "ja"
---

# Quick Reference: Operations and Functions for Integer Variables and Constraints

`pyqbpp.Expr` is a **unified type** for plain expressions, integer variables, and constraint expressions. The same type is used for all three; only the extra metadata differs.

An `Expr` has three "faces":
- **Plain expression** (polynomial): e.g. `x + 2*y*z`
- **Integer variable**: created via `qbpp.var("x", between=(0, 10))`
- **Constraint expression**: created via `qbpp.constrain(e, equal=5)` etc.

> **Core principles**
> - All `pyqbpp.Expr` operations / functions work on every Expr, regardless of face.
> - **Face-specific accessors** (`min_val`, `body`, ...) abort at runtime when called on a mismatching Expr.
> - **Mutating methods** (`+=`, `-=`, `*=`, `/=`, `//=`, `sqr()`, `replace()`) turn the internal state into a plain expression: metadata is discarded.
> - **Exception: `simplify*()`** preserves face identity.
> - Use `e.is_varint()` / `e.is_exprexpr()` for runtime face checks.

---

## 1. Integer variables

### Construction

| Syntax | Result |
|---|---|
| `qbpp.var("x", between=(l, u))` | `Expr` (integer variable in `[l, u]`) |
| `qbpp.var("x", shape=N, between=(l, u))` | array of integer-variable `Expr` elements |
| `qbpp.var("x", shape=(s1, s2, ...), between=(l, u))` | multi-dim integer-variable array |
| `qbpp.var("x", shape=N, equal=0)` | placeholder integer-variable array (assign each element later) |

### Operations / functions

| Category | Example | Result | Notes |
|---|---|---|---|
| Unary | `-vi` | `Expr` | |
| Arithmetic (RHS Expr-like) | `vi + 1`, `vi * 2`, `vi - x` | `Expr` | |
| Arithmetic (RHS integer variable) | `vi1 + vi2`, `vi1 * vi2` | `Expr` | |
| Constraint (equality) | `qbpp.constrain(vi, equal=5)` | `Expr` (constraint) | constraint creation |
| Constraint (range) | `qbpp.constrain(vi, between=(l, u))` | `Expr` (constraint) | range constraint |
| Global functions | `qbpp.sqr(vi)`, `qbpp.simplify(vi)`, `qbpp.simplify_as_binary(vi)` | `Expr` | |
| Integer-specific metadata | `vi.min_val`, `vi.max_val` | various | read-only |
| Integer-specific structure | `vi.var_count`, `vi.coeff(i)`, `vi.get_var(i)`, `vi[i]` | various | read-only |
| Array properties | `vi.vars`, `vi.coeffs` | `list` | read-only |
| Expr access | `str(vi)` | `str` | |
| **Compound assignment** | `vi += 1`, `vi -= 1`, `vi *= 2`, `vi //= 2`, `vi /= 2` | (`vi` becomes a plain expression) | **integer-specific accessors no longer available** |
| **Square** | `vi.sqr()` | (`vi` becomes a plain expression) | |
| **Replace** | `vi.replace(ml)` | (`vi` becomes a plain expression) | |
| In-place simplify | `vi.simplify()`, `vi.simplify_as_binary()`, `vi.simplify_as_spin()` | `Expr` | only the held expression is rewritten; **integer-variable metadata is preserved** |
| Assignment | `vi = other` | (rebinding) | normal Python assignment |

> **Note**: After calling a mutator like `vi += 1`, the Python type is still `Expr` but the internal state is a plain expression. Calling integer-specific accessors (`vi.min_val`, etc.) afterward raises a **runtime error**.

---

## 2. Constraint expressions

### Construction

| Syntax | Result | Meaning (penalty / body) |
|---|---|---|
| `qbpp.constrain(f, equal=n)` | `Expr` (constraint) | penalty = `sqr(f - n)`, body = `f` |
| `qbpp.constrain(f, between=(l, u))` | `Expr` (constraint) | penalty = between, body = `f` |
| `qbpp.constrain(f, between=(l, None))` | `Expr` (constraint) | `f >= l` (no upper bound) |
| `qbpp.constrain(f, between=(None, u))` | `Expr` (constraint) | `f <= u` (no lower bound) |

`f` is a non-integer expression (`Var`, `Term`, `Expr`, integer-variable `Expr`); `n`, `l`, `u` are integers.

### Operations / functions

| Category | Example | Result | Notes |
|---|---|---|---|
| Unary | `-ee` | `Expr` | negates penalty |
| Arithmetic (RHS Expr-like) | `ee + 1`, `ee * 2`, `ee + x` | `Expr` | |
| Arithmetic (RHS constraint) | `ee1 + ee2` | `Expr` | penalty + penalty |
| Global functions | `qbpp.sqr(ee)`, `qbpp.simplify_as_binary(ee)`, `qbpp.replace(ee, ml)` | `Expr` | applied to penalty |
| Properties | `ee.body`, `str(ee)` | `Expr` / `str` | clones |
| Evaluation by Sol | `sol(ee)` (evaluate penalty), `sol(ee.body)` (evaluate body) | `coeff_t` | for constraint verification |
| **Compound assignment** | `ee += 1`, `ee -= 1`, `ee *= 2`, `ee //= 2`, `ee /= 2` | (`ee` becomes a plain expression) | **body no longer reachable** |
| **Square** | `ee.sqr()` | (`ee` becomes a plain expression) | |
| **Replace** | `ee.replace(ml)` | (`ee` becomes a plain expression) | |
| In-place simplify | `ee.simplify()`, `ee.simplify_as_binary()`, `ee.simplify_as_spin()` | `Expr` | applies the rule to **both** penalty and body, **stays a constraint** |
| Assignment | `ee = other` | (rebinding) | normal Python assignment |

> **Note**: After `ee += 1` etc., only the penalty is updated and the body becomes inaccessible. In contrast, `ee.simplify*()` applies the same rule to both penalty and body, keeping the constraint in a consistent state.

---

## 3. Global functions: return a new `Expr`

The principal global functions that accept integer variables / constraint expressions. **All return a new `pyqbpp.Expr` and never modify their argument**:

| Function | Result | Description |
|---|---|---|
| `qbpp.sqr(x)` | `Expr` | `x * x` |
| `qbpp.simplify(x)` | `Expr` | merge like terms |
| `qbpp.simplify_as_binary(x)` | `Expr` | binary (0/1) simplification |
| `qbpp.simplify_as_spin(x)` | `Expr` | spin (±1) simplification |
| `qbpp.replace(x, ml)` | `Expr` | variable substitution |
| `qbpp.constrain(f, equal=n)` | `Expr` (constraint) | equality constraint |
| `qbpp.constrain(f, between=(l, u))` | `Expr` (constraint) | range constraint |

The argument `x` may be `Var`, `Term`, or `Expr` of any face (internally treated as `Expr`).

---

## 4. Array variants

Arrays of integer variables / constraint expressions follow the same rules:
- **Arithmetic treats each element as `Expr`** -> result is an `Expr` array
- **In-place mutators (`+=`, `*=`, etc.) are allowed**; per element, the same
  decay rule above applies (the element becomes a plain expression).

```python
# Integer-variable array
x = qbpp.var("x", shape=3, between=(0, 7))      # Array of integer-variable Expr
sum_expr = qbpp.sum(x)                           # Expr
f = qbpp.sqr(sum_expr - 5)                       # Expr

# Constraint-expression array (per-element constraints)
m = qbpp.var("m", shape=(3, 4))                  # 2D Var array
rows = qbpp.vector_sum(m, axis=0)                # sum of each row (Expr array)
onehot = qbpp.constrain(rows, equal=1)           # Array of constraint Expr
penalty = qbpp.sum(onehot)                       # Expr (sum of all penalties)
```

Per-element `body` access: `arr[i].body`.

---

## 5. Differences from C++

Both C++ and Python allow `+=` etc. on these forms, but the semantics differ slightly:

- **C++**: the same object's internal state changes to a plain expression. Face-specific accessors raise a runtime error afterward.
- **Python**: the same `_handle` is rewritten in place; Python object identity is preserved, but face-specific accessors raise a runtime error too.

---

## See also

- [Integer Variables and Solving Simultaneous Equations](INTEGER) — examples using `qbpp.var(..., between=...)` and `qbpp.constrain(...)`
- [Comparison Constraints](COMPARISON) — `qbpp.constrain(f, equal=n)` constraint creation
- [Replace](REPLACE) — `qbpp.replace(...)` usage
