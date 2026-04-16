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

Integer variables (`pyqbpp.VarInt`) and constraints (`pyqbpp.ExprExpr`) are **two dedicated object types** that complement `pyqbpp.Expr`. Both are **immutable**.

> **Core principles**
> - **Method-form in-place modification raises an error** (`vi.simplify_as_binary()`, `ee.replace(ml)` etc. → `TypeError`).
> - **Compound assignment (`vi += 1` etc.) is silent rebinding**: matches Python's idiom for immutable types (Decimal, Fraction, str). `vi` is rebound to a fresh `Expr` (the original VarInt metadata / ExprExpr body is discarded).
> - **In arithmetic contexts both decay to `Expr`**. Once you have an `Expr`, in-place modification is fine again.
> - To apply a function, **use the global free functions** (`qbpp.simplify_as_binary(ee)`, etc.). They return a fresh `Expr`. The original `VarInt` / `ExprExpr` is not modified.

---

## 1. `pyqbpp.VarInt`

### Construction

| Syntax | Result |
|---|---|
| `qbpp.var("x", between=(l, u))` | `VarInt` (range `[l, u]`) |
| `qbpp.var("x", shape=N, between=(l, u))` | `Array` (VarInt elements) |
| `qbpp.var("x", shape=(s1, s2, ...), between=(l, u))` | multi-dim VarInt array |
| `qbpp.var("x", shape=N, equal=0)` | placeholder VarInt array (assign each element later) |

### Allowed operations / functions

| Category | Example | Result | Notes |
|---|---|---|---|
| Unary | `-vi` | `Expr` | delegates to `_expr()` |
| Arithmetic (RHS Expr-like) | `vi + 1`, `vi * 2`, `vi - x` | `Expr` | delegates to `_expr()` |
| Arithmetic (RHS VarInt) | `vi1 + vi2`, `vi1 * vi2` | `Expr` | both sides `_expr()` |
| Constraint (equality) | `qbpp.constrain(vi, equal=5)` | `ExprExpr` | constraint creation |
| Constraint (range) | `qbpp.constrain(vi, between=(l, u))` | `ExprExpr` | range constraint |
| Global functions | `qbpp.sqr(vi)`, `qbpp.simplify(vi)`, `qbpp.simplify_as_binary(vi)` | `Expr` | applied to decayed Expr |
| Metadata properties | `vi.name`, `vi.min_val`, `vi.max_val` | various | read-only |
| Structure properties / methods | `vi.var_count`, `vi.coeff(i)`, `vi.get_var(i)`, `vi[i]` | various | read-only |
| Array properties | `vi.vars`, `vi.coeffs` | `list` | read-only |
| Expr access | `vi._expr()`, `vi.to_expr()`, `str(vi)` | `Expr` / `str` | clones |
| Assignment | `vi = other_vi` | (rebinding) | normal Python assignment |
| Compound assignment (silent rebind) | `vi += 1`, `vi -= 1`, `vi *= 2`, `vi //= 2`, `vi /= 2` | (`vi` becomes `Expr`) | equivalent to `vi = vi + 1`. VarInt metadata discarded |

### Disallowed operations / functions

| Category | Example | Result |
|---|---|---|
| In-place mutator methods | `vi.simplify()`, `vi.simplify_as_binary()`, `vi.simplify_as_spin()`, `vi.sqr()` | **`TypeError`** (use: `qbpp.simplify_as_binary(vi)`) |
| Replace | `vi.replace(ml)` | **`TypeError`** (use: `qbpp.replace(vi, ml)`) |

The error message names the specific replacement form (e.g. `qbpp.simplify_as_binary(vi)`).

---

## 2. `pyqbpp.ExprExpr`

### Construction

| Syntax | Result | Meaning (penalty / body) |
|---|---|---|
| `qbpp.constrain(f, equal=n)` | `ExprExpr` | penalty = `sqr(f - n)`, body = `f` |
| `qbpp.constrain(f, between=(l, u))` | `ExprExpr` | penalty = between, body = `f` |
| `qbpp.constrain(f, between=(l, None))` | `ExprExpr` | `f >= l` (no upper bound) |
| `qbpp.constrain(f, between=(None, u))` | `ExprExpr` | `f <= u` (no lower bound) |

`f` is a non-integer expression type (`Var`, `Term`, `Expr`, `VarInt`); `n`, `l`, `u` are integers.

### Allowed operations / functions

| Category | Example | Result | Notes |
|---|---|---|---|
| Unary | `-ee` | `Expr` | works via Expr inheritance |
| Arithmetic (RHS Expr-like) | `ee + 1`, `ee * 2`, `ee + x` | `Expr` | Expr inheritance |
| Arithmetic (RHS ExprExpr) | `ee1 + ee2` | `Expr` | both sides as penalty |
| Global functions | `qbpp.sqr(ee)`, `qbpp.simplify_as_binary(ee)`, `qbpp.replace(ee, ml)` | `Expr` | applied to penalty, returns new `Expr` |
| Properties | `ee.penalty`, `ee.body`, `str(ee)` | `Expr` / `str` | clones |
| Evaluation by Sol | `sol(ee)` (evaluate penalty), `sol(ee.body)` (evaluate body) | `coeff_t` | for constraint verification |
| Assignment | `ee = other_ee` | (rebinding) | normal Python assignment |
| Compound assignment (silent rebind) | `ee += 1`, `ee -= 1`, `ee *= 2`, `ee //= 2`, `ee /= 2` | (`ee` becomes `Expr`) | equivalent to `ee = ee + 1`. **body is discarded** |

### Disallowed operations / functions

| Category | Example | Result |
|---|---|---|
| In-place mutator methods | `ee.simplify()`, `ee.simplify_as_binary()`, `ee.simplify_as_spin()`, `ee.sqr()` | **`TypeError`** (use: `qbpp.simplify_as_binary(ee)`) |
| Replace | `ee.replace(ml)` | **`TypeError`** (use: `qbpp.replace(ee, ml)`) |

---

## 3. Global functions: return a new `Expr`

The principal global functions that accept `VarInt` / `ExprExpr`. **All return a new `pyqbpp.Expr` and never modify their argument**:

| Function | Result | Description |
|---|---|---|
| `qbpp.sqr(x)` | `Expr` | `x * x` |
| `qbpp.simplify(x)` | `Expr` | merge like terms |
| `qbpp.simplify_as_binary(x)` | `Expr` | binary (0/1) simplification |
| `qbpp.simplify_as_spin(x)` | `Expr` | spin (±1) simplification |
| `qbpp.replace(x, ml)` | `Expr` | variable substitution |
| `qbpp.constrain(f, equal=n)` | `ExprExpr` | equality constraint |
| `qbpp.constrain(f, between=(l, u))` | `ExprExpr` | range constraint |

The argument `x` may be `Var`, `Term`, `Expr`, `VarInt`, or `ExprExpr` (decays internally to `Expr`).

---

## 4. Array variants

`pyqbpp.Array` whose element type is `VarInt` / `ExprExpr` follows the same rules:
- **Each element is immutable**
- **Arithmetic decays each element to `Expr`** → result is an `Expr` array
- **No in-place mutators**, use global functions instead

```python
# VarInt array
x = qbpp.var("x", shape=3, between=(0, 7))      # Array (VarInt elements)
sum_expr = qbpp.sum(x)                           # Expr
f = qbpp.sqr(sum_expr - 5)                       # Expr

# ExprExpr array (per-element constraints)
m = qbpp.var("m", shape=(3, 4))                  # 2D Var array
rows = qbpp.vector_sum(m, axis=0)                # sum of each row (Expr array)
onehot = qbpp.constrain(rows, equal=1)           # Array (ExprExpr elements)
penalty = qbpp.sum(onehot)                       # Expr (sum of all penalties)
```

Per-element `body` access: `arr[i].body`.

---

## 5. Differences from C++

C++ raises a compile-time error for `+=` etc. on these types, while Python silent-rebinds the variable. See the section "Immutability of `VarInt` and `ExprExpr`" in [Differences between QUBO++ (C++) and PyQBPP (Python)](../CPP_VS_PYTHON).

---

## See also

- [Integer Variables and Solving Simultaneous Equations](INTEGER) — examples using `qbpp.var(..., between=...)` and `qbpp.constrain(...)`
- [Comparison Operators](COMPARISON) — `==` constraint creation
- [Replace](REPLACE) — `qbpp.replace(...)` usage
