---
layout: default
nav_exclude: true
title: "Reference Integer & Constraint"
nav_order: 32
lang: en
hreflang_alt: "ja/QR_INTCONSTRAINT"
hreflang_lang: "ja"
---

# Quick Reference: Operations and Functions for Integer Variables and Constraints

Integer variables (`qbpp::VarInt`) and constraints (`qbpp::ExprExpr`) are **two dedicated object types** that complement `qbpp::Expr`. Both are **immutable**.

> **Core principles**
> - **No in-place modification** (`vi += 1`, `ee.simplify_as_binary()`, etc. raise an error).
> - **The only way to overwrite** a `VarInt` / `ExprExpr` variable is to assign another `VarInt` / `ExprExpr` to it (`vi = other_vi`, `ee = other_ee`).
> - **In arithmetic contexts both decay to `Expr`** via implicit conversion. Once you have an `Expr`, in-place modification is fine again.
> - To apply a function, **use the global free functions** which return a fresh `Expr` (`qbpp::simplify_as_binary(ee)`, etc.). The original `VarInt` / `ExprExpr` is not modified.

---

## 1. `qbpp::VarInt`

### Construction

| Syntax | Result |
|---|---|
| `l <= qbpp::var_int("x") <= u` | `VarInt` (range `[l, u]`) |
| `l <= qbpp::var_int("x", s1, s2, ...) <= u` | `Array<Dim, VarInt>` |
| `qbpp::between(qbpp::var_int("x"), l, u)` | `VarInt` (function form) |

### Allowed operations / functions

| Category | Example | Result | Notes |
|---|---|---|---|
| Unary | `-vi`, `vi` (decay) | `Expr` | Implicit conversion to `Expr` |
| Arithmetic (RHS Expr-like) | `vi + 1`, `vi * 2`, `vi - x` | `Expr` | Implicit decay → Expr op |
| Arithmetic (RHS VarInt) | `vi1 + vi2`, `vi1 * vi2` | `Expr` | Both sides decay |
| Constraint (== int) | `vi == 5` | `ExprExpr` | Constraint generation |
| Constraint (range) | `2 <= vi <= 5` | `ExprExpr` | Between constraint |
| Global functions | `qbpp::sqr(vi)`, `qbpp::simplify(vi)`, `qbpp::sqr(vi - 3)` | `Expr` | Apply to decayed Expr |
| Metadata members | `vi.name()`, `vi.min_val()`, `vi.max_val()` | various | read-only |
| Structure members | `vi.var_count()`, `vi.coeff(i)`, `vi.get_var(i)`, `vi[i]` | various | read-only |
| Array accessors | `vi.vars()`, `vi.coeffs()` | `Array<1, ...>` | read-only |
| Expr access | `vi.expr()`, `vi.str()` | `Expr` / `string` | clones |
| Assignment | `vi = other_vi` | `VarInt&` | same type only |

### Disallowed operations / functions

| Category | Example | Result |
|---|---|---|
| Compound assignment | `vi += 1`, `vi -= 1`, `vi *= 2`, `vi /= 2` | **compile error** (`= delete`) |
| In-place mutator methods | `vi.simplify()`, `vi.simplify_as_binary()`, `vi.simplify_as_spin()`, `vi.sqr()` | **compile error** (`= delete`) |
| Replace | `vi.replace(ml)` | **error** |
| Expr assignment | `vi = some_expr` | **compile error** (type mismatch) |

→ Use the **global functions** (`qbpp::simplify_as_binary(vi)` etc.) instead.

---

## 2. `qbpp::ExprExpr`

### Construction

| Syntax | Result | Meaning (penalty / body) |
|---|---|---|
| `f == n` | `ExprExpr` | penalty = `sqr(f - n)`, body = `f` |
| `l <= f <= u` | `ExprExpr` | penalty = `(f-a)(f-(a+1))` (a is slack), body = `f` |
| `qbpp::between(f, l, u)` | `ExprExpr` | same as above (function form) |

`f` is any non-integer `ExprType` (`Var`, `Term`, `Expr`, `VarInt`).

### Allowed operations / functions

| Category | Example | Result | Notes |
|---|---|---|---|
| Unary | `-ee` | `Expr` | Implicit conversion to `Expr` (penalty) |
| Arithmetic (RHS Expr-like) | `ee + 1`, `ee * 2`, `ee + x` | `Expr` | decay → Expr op |
| Arithmetic (RHS ExprExpr) | `ee1 + ee2`, `ee * ee` | `Expr` | Both sides decay (penalty + penalty) |
| Global functions | `qbpp::sqr(ee)`, `qbpp::simplify_as_binary(ee)`, `qbpp::replace(ee, ml)` | `Expr` | applied to penalty, returns new `Expr` |
| Member accessors | `ee.penalty()`, `ee.body()`, `ee.str()` | `Expr` / `string` | clones |
| Evaluation by Sol | `sol(ee)` (evaluate penalty), `sol(ee.body())` (evaluate body) | `coeff_t` | for constraint verification |
| Assignment | `ee = other_ee` | `ExprExpr&` | same type only |

### Disallowed operations / functions

| Category | Example | Result |
|---|---|---|
| Compound assignment | `ee += 1`, `ee -= 1`, `ee *= 2`, `ee /= 2` | **compile error** (`= delete`) |
| In-place mutator methods | `ee.simplify()`, `ee.simplify_as_binary()`, `ee.simplify_as_spin()`, `ee.sqr()` | **compile error** (`= delete`) |
| Replace | `ee.replace(ml)` | **compile error** (`= delete`) |
| Expr assignment | `ee = some_expr` | **compile error** (type mismatch) |

→ Use the **global functions** instead (`qbpp::simplify_as_binary(ee)` etc. return an `Expr`, leaving `ee` untouched).

> **Note on Python**: Python instead silent-rebinds for `+=` (the variable becomes `Expr`) and raises `TypeError` for methods. See [Differences between QUBO++ (C++) and PyQBPP (Python)](CPP_VS_PYTHON) for details.

---

## 3. Global functions: return a new `Expr`

The principal global functions that accept `VarInt` / `ExprExpr`. **All return a new `qbpp::Expr` and never modify their argument**:

| Function | Result | Description |
|---|---|---|
| `qbpp::sqr(x)` | `Expr` | `x * x` |
| `qbpp::simplify(x)` | `Expr` | merge like terms |
| `qbpp::simplify_as_binary(x)` | `Expr` | binary (0/1) simplification |
| `qbpp::simplify_as_spin(x)` | `Expr` | spin (±1) simplification |
| `qbpp::replace(x, ml)` | `Expr` | variable substitution |
| `qbpp::between(x, l, u)` | `ExprExpr` | range constraint (same as `l <= x <= u`) |

The argument `x` may be `Var`, `Term`, `Expr`, `VarInt`, or `ExprExpr` (decays internally to `Expr`).

---

## 4. Array variants

`qbpp::Array<Dim, VarInt>` and `qbpp::Array<Dim, ExprExpr>` follow the same rules:
- **Each element is immutable**
- **Arithmetic decays each element to `Expr`** → result is `Array<Dim, Expr>`
- **No in-place mutators**, use global functions instead

```cpp
// VarInt array
auto x = 0 <= qbpp::var_int("x", 3) <= 7;     // Array<1, VarInt>
auto sum = qbpp::sum(x);                       // Expr (each element decays, then summed)

// ExprExpr array (per-element constraints)
auto m = qbpp::var("m", 3, 4);                 // Array<2, Var>
auto rows = qbpp::vector_sum(m, 0);            // Array<1, Expr> (sum of each row)
auto onehot = (rows == 1);                     // Array<1, ExprExpr>
auto penalty = qbpp::sum(onehot);              // Expr (sum of all constraint penalties)
```

Per-element `body` access: `arr[i].body()`.

---

## See also

- [Integer Variables](INTEGER) — solving equations with `VarInt`
- [Comparison Operators](COMPARISON) — `==`, `<= <=` details
- [Replace](REPLACE) — `replace()` usage
