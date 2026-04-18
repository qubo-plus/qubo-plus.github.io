---
layout: default
nav_exclude: true
title: "Reference Integer & Constraint"
nav_order: 32
lang: ja
hreflang_alt: "en/QR_INTCONSTRAINT"
hreflang_lang: "en"
---

# クイックリファレンス: 整数変数と制約に関する演算と関数

整数変数 (`qbpp::VarInt`) と制約 (`qbpp::ExprExpr`) は、`qbpp::Expr` を補う **2 つの専用オブジェクト型** で、共に **immutable** です。

> **基本原則**
> - **in-place 変更は不可** (`vi += 1`, `ee.simplify_as_binary()` などはエラー)
> - **上書きできるのは同じ型の代入のみ** (`vi = other_vi`, `ee = other_ee`)
> - **算術文脈では `Expr` に decay** する (暗黙変換)。一旦 `Expr` になれば in-place 変更も自由
> - 関数を適用したい時は **グローバル関数** を使う (`qbpp::simplify_as_binary(ee)` 等は新しい `Expr` を返す。元の `VarInt` / `ExprExpr` は変更されない)

---

## 1. `qbpp::VarInt`

### 生成

| 構文 | 戻り値 |
|---|---|
| `l <= qbpp::var_int("x") <= u` | `VarInt` (範囲 `[l, u]`) |
| `l <= qbpp::var_int("x", s1, s2, ...) <= u` | `Array<Dim, VarInt>` |

### 使える演算・関数

| カテゴリ | 例 | 戻り値 | 備考 |
|---|---|---|---|
| 単項 | `-vi`, `vi` (Expr decay) | `Expr` | `Expr` への暗黙変換 |
| 算術 (右辺 Expr) | `vi + 1`, `vi * 2`, `vi - x` | `Expr` | 暗黙変換 → Expr 演算 |
| 算術 (右辺 VarInt) | `vi1 + vi2`, `vi1 * vi2` | `Expr` | 両辺 decay |
| 比較 (== int) | `vi == 5` | `ExprExpr` | 制約生成 |
| 比較 (範囲) | `2 <= vi <= 5` | `ExprExpr` | between 制約 |
| グローバル関数 | `qbpp::sqr(vi)`, `qbpp::simplify(vi)`, `qbpp::sqr(vi - 3)` | `Expr` | decay → Expr に適用 |
| メタ情報メンバ | `vi.name()`, `vi.min_val()`, `vi.max_val()` | 各種 | 不変 (read-only) |
| 構造メンバ | `vi.var_count()`, `vi.coeff(i)`, `vi.get_var(i)`, `vi[i]` | 各種 | read-only |
| 配列アクセス | `vi.vars()`, `vi.coeffs()` | `Array<1, ...>` | read-only |
| Expr 取得 | `Expr(vi)` (decay) | `Expr` | clone |
| in-place 簡約 | `vi.simplify()`, `vi.simplify_as_binary()`, `vi.simplify_as_spin()` | `VarInt&` | Expr 部分のみ簡約（メタデータ不変） |
| 代入 | `vi = other_vi` | `VarInt&` | 同じ型のみ |

### 使えない演算・関数

| カテゴリ | 例 | 結果 |
|---|---|---|
| 複合代入 | `vi += 1`, `vi -= 1`, `vi *= 2`, `vi /= 2` | **コンパイルエラー** (`= delete`) |
| 二乗 | `vi.sqr()` | **コンパイルエラー** (`= delete`、`qbpp::sqr(vi)` を使用) |
| 置換 | `vi.replace(ml)` | **エラー** |
| Expr の代入 | `vi = some_expr` | **コンパイルエラー** (型不一致) |

---

## 2. `qbpp::ExprExpr`

### 生成

| 構文 | 戻り値 | 意味 (penalty / body) |
|---|---|---|
| `f == n` | `ExprExpr` | penalty = `sqr(f - n)`, body = `f` |
| `l <= f <= u` | `ExprExpr` | penalty = `(f-a)(f-(a+1))` (a は slack), body = `f` |

ここで `f` は非整数の `ExprType` (`Var`, `Term`, `Expr`, `VarInt`)。

### 使える演算・関数

| カテゴリ | 例 | 戻り値 | 備考 |
|---|---|---|---|
| 単項 | `-ee` | `Expr` | `Expr` への暗黙変換 (penalty) |
| 算術 (右辺 Expr) | `ee + 1`, `ee * 2`, `ee + x` | `Expr` | decay → Expr 演算 |
| 算術 (右辺 ExprExpr) | `ee1 + ee2`, `ee * ee` | `Expr` | 両辺 decay (penalty 同士) |
| グローバル関数 | `qbpp::sqr(ee)`, `qbpp::simplify_as_binary(ee)`, `qbpp::replace(ee, ml)` | `Expr` | penalty に適用、新 `Expr` を返す |
| メンバ取得 | `*ee` (body), `Expr(ee)` (penalty) | `Expr` | clone |
| 解での評価 | `sol(ee)` (penalty を評価), `sol(*ee)` (body を評価) | `coeff_t` | 制約満足度の検証に使用 |
| in-place 簡約 | `ee.simplify()`, `ee.simplify_as_binary()`, `ee.simplify_as_spin()` | `ExprExpr&` | penalty と body を同時に簡約 |
| 代入 | `ee = other_ee` | `ExprExpr&` | 同じ型のみ |

### 使えない演算・関数

| カテゴリ | 例 | 結果 |
|---|---|---|
| 複合代入 | `ee += 1`, `ee -= 1`, `ee *= 2`, `ee /= 2` | **コンパイルエラー** (`= delete`) |
| 二乗 | `ee.sqr()` | **コンパイルエラー** (`= delete`、`qbpp::sqr(ee)` を使用) |
| 置換 | `ee.replace(ml)` | **コンパイルエラー** (`= delete`、`qbpp::replace(ee, ml)` を使用) |
| Expr の代入 | `ee = some_expr` | **コンパイルエラー** (型不一致) |

> **Python との挙動の違い**: Python では `+=` 等の複合代入は silent rebind (新しい `Expr` に再束縛)。詳細は [QUBO++ (C++) と PyQBPP (Python) の違い](CPP_VS_PYTHON) を参照。

---

## 3. グローバル関数: 新しい `Expr` を返す

`VarInt` / `ExprExpr` を引数に取れる主要なグローバル関数。**いずれも引数を変更せず、新しい `qbpp::Expr` を返します**:

| 関数 | 戻り値 | 説明 |
|---|---|---|
| `qbpp::sqr(x)` | `Expr` | `x * x` |
| `qbpp::simplify(x)` | `Expr` | 同類項マージ |
| `qbpp::simplify_as_binary(x)` | `Expr` | binary (0/1) ルールで簡約 |
| `qbpp::simplify_as_spin(x)` | `Expr` | spin (±1) ルールで簡約 |
| `qbpp::replace(x, ml)` | `Expr` | 変数置換 |

引数 `x` は `Var`, `Term`, `Expr`, `VarInt`, `ExprExpr` のいずれでも OK (内部で `Expr` に decay)。

---

## 4. 配列版

`VarInt` の配列および `ExprExpr` の配列も同じ性質:
- **要素ごとに immutable**
- **算術では各要素が `Expr` に decay** → 結果は `Array<Dim, Expr>`
- **in-place mutator は不可**、グローバル関数で代用

```cpp
// VarInt 配列
auto x = 0 <= qbpp::var_int("x", 3) <= 7;     // Array<1, VarInt>
auto sum = qbpp::sum(x);                       // Expr (各要素を decay して合計)

// ExprExpr 配列 (要素ごとの制約)
auto m = qbpp::var("m", 3, 4);                 // Array<2, Var>
auto rows = qbpp::vector_sum(m, 0);            // Array<1, Expr> (各行の和)
auto onehot = (rows == 1);                     // Array<1, ExprExpr>
auto penalty = qbpp::sum(onehot);              // Expr (全制約の合計)
```

要素ごとの `body` アクセスは `*arr[i]`。

---

## 関連ページ

- [整数変数](INTEGER) — `VarInt` を使った方程式の解き方
- [比較演算子](COMPARISON) — `==`, `<= <=` の詳細
- [置換関数](REPLACE) — `replace()` の使用例
