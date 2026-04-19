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

`qbpp::Expr` は通常の式・整数変数・制約式を **統一的に表現する型** です。3 つとも同じ型で、持つメタデータが違うだけです。

`Expr` は 3 つの「顔」を持ちます:
- **通常の式** (多項式): `x + 2*y*z` などの算術式
- **整数変数**: `l <= qbpp::var_int("x") <= u` などで作った `Expr`。範囲・ビット分解のメタデータを保持
- **制約式**: `e == 5` / `lo <= e <= hi` などで作った `Expr`。penalty + body のメタデータを保持

> **基本原則**
> - `qbpp::Expr` の演算・関数はすべて、どの「顔」の Expr にも適用できる
> - **固有 accessor** (`min_val()`, `body` 等) は対応する「顔」の Expr でのみ有効。合わない Expr で呼ぶと **runtime abort**（エラーメッセージ付き）
> - **式を変更するメンバ関数** (`+=`, `-=`, `*=`, `/=`, `sqr()`, `replace()`) を呼ぶと、内部表現は通常の式に戻る（固有メタデータは破棄され、固有 accessor は以後呼べなくなる）
> - **例外: `simplify*()`** は固有メタデータを保ったまま、保持している式のみを簡約する。「顔」は維持される
> - `is_varint()` / `is_exprexpr()` で現在の「顔」を実行時に確認できる

---

## 1. 整数変数

### 生成

| 構文 | 戻り値 |
|---|---|
| `l <= qbpp::var_int("x") <= u` | `Expr` (範囲 `[l, u]` の整数変数) |
| `l <= qbpp::var_int("x", s1, s2, ...) <= u` | 整数変数の多次元配列 `Array<Dim, Expr>` |

### 使える演算・関数

| カテゴリ | 例 | 戻り値 | 備考 |
|---|---|---|---|
| 単項 | `-vi` | `Expr` | |
| 算術 (右辺 Expr) | `vi + 1`, `vi * 2`, `vi - x` | `Expr` | |
| 算術 (右辺 整数変数) | `vi1 + vi2`, `vi1 * vi2` | `Expr` | |
| 比較 (== int) | `vi == 5` | `Expr` (制約式) | 制約生成 |
| 比較 (範囲) | `2 <= vi <= 5` | `Expr` (制約式) | between 制約 |
| グローバル関数 | `qbpp::sqr(vi)`, `qbpp::simplify(vi)`, `qbpp::sqr(vi - 3)` | `Expr` | |
| 整数変数固有メタ情報 | `vi.min_val()`, `vi.max_val()` | `coeff_t` | read-only |
| 整数変数固有構造メンバ | `vi.var_count()`, `vi.coeff(i)`, `vi.get_var(i)`, `vi[i]` | 各種 | read-only |
| 配列アクセス | `vi.vars()`, `vi.coeffs()` | `Array<1, ...>` | read-only |
| **複合代入** | `vi += 1`, `vi -= 1`, `vi *= 2`, `vi /= 2` | `Expr&` | **以後は通常の式相当**（固有メタは破棄） |
| **二乗** | `vi.sqr()` | `Expr&` | **以後は通常の式相当** |
| **置換** | `vi.replace(ml)` | `Expr&` | **以後は通常の式相当** |
| in-place 簡約 | `vi.simplify()`, `vi.simplify_as_binary()`, `vi.simplify_as_spin()` | `Expr&` | 保持式のみ簡約、**整数変数のメタは保たれる** |
| 代入 | `vi = other` | `Expr&` | 同じ型 |

> **注意**: `vi += 1` 等の式変更系を呼んだ後、静的な型は引き続き `qbpp::Expr` ですが内部状態は通常の式相当です。`vi.min_val()` 等の整数変数固有 accessor は **runtime error** になります。

---

## 2. 制約式

### 生成

| 構文 | 戻り値 | 意味 (penalty / body) |
|---|---|---|
| `f == n` | `Expr` (制約式) | penalty = `sqr(f - n)`, body = `f` |
| `l <= f <= u` | `Expr` (制約式) | penalty = `(f-a)(f-(a+1))` (a は slack), body = `f` |

ここで `f` は整数変数以外の式 (`Var`, `Term`, `Expr`, 整数変数 `Expr`)。

### 使える演算・関数

| カテゴリ | 例 | 戻り値 | 備考 |
|---|---|---|---|
| 単項 | `-ee` | `Expr` | penalty を反転 |
| 算術 (右辺 Expr) | `ee + 1`, `ee * 2`, `ee + x` | `Expr` | |
| 算術 (右辺 制約式) | `ee1 + ee2`, `ee * ee` | `Expr` | penalty 同士 |
| グローバル関数 | `qbpp::sqr(ee)`, `qbpp::simplify_as_binary(ee)`, `qbpp::replace(ee, ml)` | `Expr` | penalty に適用 |
| body 取得 | `ee.body()` | `Expr` | clone |
| 解での評価 | `sol(ee)` (penalty を評価), `ee.body(sol)` (body を評価) | `coeff_t` | 制約満足度の検証に使用 |
| **複合代入** | `ee += 1`, `ee -= 1`, `ee *= 2`, `ee /= 2` | `Expr&` | **以後は通常の式相当**（body 参照不可に） |
| **二乗** | `ee.sqr()` | `Expr&` | **以後は通常の式相当** |
| **置換** | `ee.replace(ml)` | `Expr&` | **以後は通常の式相当** |
| in-place 簡約 | `ee.simplify()`, `ee.simplify_as_binary()`, `ee.simplify_as_spin()` | `Expr&` | penalty と body を同時に簡約、**制約式のまま** |
| 代入 | `ee = other` | `Expr&` | 同じ型 |

> **注意**: `ee += 1` 等の式変更系を呼ぶと penalty のみが更新され body は参照できなくなります。一方 `ee.simplify*()` は penalty と body 両方に同じ rule を適用するため、制約式の整合性が保たれます。

> **Python との挙動の違い**: Python では `+=` 等の複合代入は silent rebind (新しい `Expr` に再束縛)。一方 C++ は同じ object の内部状態が通常の式相当に変わります。詳細は [QUBO++ (C++) と PyQBPP (Python) の違い](CPP_VS_PYTHON) を参照。

---

## 3. グローバル関数: 新しい `Expr` を返す

整数変数・制約式を引数に取れる主要なグローバル関数。**いずれも引数を変更せず、新しい `qbpp::Expr` を返します**:

| 関数 | 戻り値 | 説明 |
|---|---|---|
| `qbpp::sqr(x)` | `Expr` | `x * x` |
| `qbpp::simplify(x)` | `Expr` | 同類項マージ |
| `qbpp::simplify_as_binary(x)` | `Expr` | binary (0/1) ルールで簡約 |
| `qbpp::simplify_as_spin(x)` | `Expr` | spin (±1) ルールで簡約 |
| `qbpp::replace(x, ml)` | `Expr` | 変数置換 |

引数 `x` は `Var`, `Term`, 任意の顔の `Expr` のいずれでも OK (内部では `Expr` として扱われる)。

---

## 4. 配列版

整数変数の配列および制約式の配列も同じ性質:
- **算術では各要素が `Expr` として扱われる** → 結果は `Array<Dim, Expr>`
- **in-place mutator (`+=`, `*=` 等)** は使えるが、要素ごとに上記と同じく通常の式相当に戻る

```cpp
// 整数変数の配列
auto x = 0 <= qbpp::var_int("x", 3) <= 7;     // Array<1, Expr> の整数変数配列
auto sum = qbpp::sum(x);                       // Expr (各要素を Expr として合計)

// 制約式の配列 (要素ごとの制約)
auto m = qbpp::var("m", 3, 4);                 // Array<2, Var>
auto rows = qbpp::vector_sum(m, 0);            // Array<1, Expr> (各行の和)
auto onehot = (rows == 1);                     // Array<1, Expr> の制約式
auto penalty = qbpp::sum(onehot);              // Expr (全制約の合計)
```

要素ごとの `body` アクセスは `*arr[i]`。

---

## 関連ページ

- [整数変数](INTEGER) — 整数変数を使った方程式の解き方
- [比較演算子](COMPARISON) — `==`, `<= <=` の詳細
- [置換関数](REPLACE) — `replace()` の使用例
