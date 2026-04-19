---
layout: default
nav_exclude: true
title: "QR: Integer & Constraint"
nav_order: 32
lang: ja
hreflang_alt: "en/python/QR_INTCONSTRAINT"
hreflang_lang: "en"
---

# クイックリファレンス: 整数変数と制約に関する演算と関数

`pyqbpp.Expr` は通常の式・整数変数・制約式を **統一的に表現する型** です。3 つとも同じ型で、持つメタデータが違うだけです。

`Expr` は 3 つの「顔」を持ちます:
- **通常の式** (多項式): `x + 2*y*z` などの算術式
- **整数変数**: `qbpp.var("x", between=(0, 10))` で作った `Expr`
- **制約式**: `qbpp.constrain(e, equal=5)` などで作った `Expr`

> **基本原則**
> - `pyqbpp.Expr` の演算・関数はすべて、どの「顔」の Expr にも適用できる
> - **固有 accessor** (`min_val`, `body` 等) は対応する「顔」の Expr でのみ有効。合わない Expr で呼ぶと **runtime abort**
> - **式を変更するメソッド** (`+=`, `-=`, `*=`, `/=`, `//=`, `sqr()`, `replace()`) を呼ぶと、内部表現は通常の式に戻る（固有メタデータは破棄）
> - **例外: `simplify*()`** は固有メタデータを保ったまま簡約
> - `e.is_varint()` / `e.is_exprexpr()` で現在の「顔」を実行時に確認できる

---

## 1. 整数変数

### 生成

| 構文 | 戻り値 |
|---|---|
| `qbpp.var("x", between=(l, u))` | `Expr` (範囲 `[l, u]` の整数変数) |
| `qbpp.var("x", shape=N, between=(l, u))` | 整数変数 `Expr` 要素の配列 |
| `qbpp.var("x", shape=(s1, s2, ...), between=(l, u))` | 多次元の整数変数配列 |
| `qbpp.var("x", shape=N, equal=0)` | placeholder の整数変数配列 (各要素を後から代入) |

### 演算・関数

| カテゴリ | 例 | 戻り値 | 備考 |
|---|---|---|---|
| 単項 | `-vi` | `Expr` | |
| 算術 (右辺 Expr 系) | `vi + 1`, `vi * 2`, `vi - x` | `Expr` | |
| 算術 (右辺 整数変数) | `vi1 + vi2`, `vi1 * vi2` | `Expr` | |
| 制約 (等値) | `qbpp.constrain(vi, equal=5)` | `Expr` (制約式) | 制約生成 |
| 制約 (範囲) | `qbpp.constrain(vi, between=(l, u))` | `Expr` (制約式) | 範囲制約 |
| グローバル関数 | `qbpp.sqr(vi)`, `qbpp.simplify(vi)`, `qbpp.simplify_as_binary(vi)` | `Expr` | |
| 整数変数固有メタ情報 | `vi.min_val`, `vi.max_val` | 各種 | read-only |
| 整数変数固有構造 | `vi.var_count`, `vi.coeff(i)`, `vi.get_var(i)`, `vi[i]` | 各種 | read-only |
| 配列プロパティ | `vi.vars`, `vi.coeffs` | `list` | read-only |
| Expr 取得 | `str(vi)` | `str` | |
| **複合代入** | `vi += 1`, `vi -= 1`, `vi *= 2`, `vi //= 2`, `vi /= 2` | (`vi` が通常の式相当に) | **以後整数変数固有 accessor は使えなくなる** |
| **二乗** | `vi.sqr()` | (`vi` が通常の式相当に) | |
| **置換** | `vi.replace(ml)` | (`vi` が通常の式相当に) | |
| in-place 簡約 | `vi.simplify()`, `vi.simplify_as_binary()`, `vi.simplify_as_spin()` | `Expr` | 保持式のみ簡約、**整数変数のメタは保たれる** |
| 代入 | `vi = other` | (再束縛) | Python の通常の代入 |

> **注意**: `vi += 1` 等を呼んだ後、Python の型は引き続き `Expr` ですが内部状態は通常の式相当です。`vi.min_val` 等の整数変数固有 accessor は **runtime error** になります。

---

## 2. 制約式

### 生成

| 構文 | 戻り値 | 意味 (penalty / body) |
|---|---|---|
| `qbpp.constrain(f, equal=n)` | `Expr` (制約式) | penalty = `sqr(f - n)`, body = `f` |
| `qbpp.constrain(f, between=(l, u))` | `Expr` (制約式) | penalty = between, body = `f` |
| `qbpp.constrain(f, between=(l, None))` | `Expr` (制約式) | `f >= l` (無上限) |
| `qbpp.constrain(f, between=(None, u))` | `Expr` (制約式) | `f <= u` (無下限) |

`f` は整数変数以外の式 (`Var`, `Term`, `Expr`, 整数変数 `Expr`)、`n`, `l`, `u` は整数。

### 演算・関数

| カテゴリ | 例 | 戻り値 | 備考 |
|---|---|---|---|
| 単項 | `-ee` | `Expr` | penalty を反転 |
| 算術 (右辺 Expr 系) | `ee + 1`, `ee * 2`, `ee + x` | `Expr` | |
| 算術 (右辺 制約式) | `ee1 + ee2` | `Expr` | penalty 同士 |
| グローバル関数 | `qbpp.sqr(ee)`, `qbpp.simplify_as_binary(ee)`, `qbpp.replace(ee, ml)` | `Expr` | penalty に適用 |
| プロパティ | `ee.body`, `str(ee)` | `Expr` / `str` | clone |
| 解での評価 | `sol(ee)` (penalty を評価), `sol(ee.body)` (body を評価) | `coeff_t` | 制約満足度の検証 |
| **複合代入** | `ee += 1`, `ee -= 1`, `ee *= 2`, `ee //= 2`, `ee /= 2` | (`ee` が通常の式相当に) | **body は参照不可に** |
| **二乗** | `ee.sqr()` | (`ee` が通常の式相当に) | |
| **置換** | `ee.replace(ml)` | (`ee` が通常の式相当に) | |
| in-place 簡約 | `ee.simplify()`, `ee.simplify_as_binary()`, `ee.simplify_as_spin()` | `Expr` | penalty と body を同時に簡約、**制約式のまま** |
| 代入 | `ee = other` | (再束縛) | Python の通常の代入 |

> **注意**: `ee += 1` 等の式変更系を呼ぶと penalty のみが更新され body は参照できなくなります。`ee.simplify*()` は penalty と body 両方に同じ rule を適用するため、制約式の整合性が保たれます。

---

## 3. グローバル関数: 新しい `Expr` を返す

整数変数・制約式を引数に取れる主要なグローバル関数。**いずれも引数を変更せず、新しい `pyqbpp.Expr` を返します**:

| 関数 | 戻り値 | 説明 |
|---|---|---|
| `qbpp.sqr(x)` | `Expr` | `x * x` |
| `qbpp.simplify(x)` | `Expr` | 同類項マージ |
| `qbpp.simplify_as_binary(x)` | `Expr` | binary (0/1) ルールで簡約 |
| `qbpp.simplify_as_spin(x)` | `Expr` | spin (±1) ルールで簡約 |
| `qbpp.replace(x, ml)` | `Expr` | 変数置換 |
| `qbpp.constrain(f, equal=n)` | `Expr` (制約式) | 等値制約 |
| `qbpp.constrain(f, between=(l, u))` | `Expr` (制約式) | 範囲制約 |

引数 `x` は `Var`, `Term`, 任意の顔の `Expr` のいずれでも OK (内部では `Expr` として扱われる)。

---

## 4. 配列版

整数変数・制約式の配列も同じ規則:
- **算術では各要素が `Expr` として扱われる** → 結果は `Expr` 配列
- **in-place mutator (`+=`, `*=` 等) も使える**が、要素ごとに上記と同じく通常の式相当に戻る

```python
# 整数変数の配列
x = qbpp.var("x", shape=3, between=(0, 7))      # 整数変数 Expr の配列
sum_expr = qbpp.sum(x)                           # Expr
f = qbpp.sqr(sum_expr - 5)                       # Expr

# 制約式の配列 (要素ごとの制約)
m = qbpp.var("m", shape=(3, 4))                  # 2D Var 配列
rows = qbpp.vector_sum(m, axis=0)                # 各行の和 (Expr 配列)
onehot = qbpp.constrain(rows, equal=1)           # 制約式 Expr の配列
penalty = qbpp.sum(onehot)                       # Expr (全制約の合計)
```

要素ごとの `body` アクセスは `arr[i].body`。

---

## 5. C++ 版との差異

C++ / Python とも `+=` 等の式変更操作は許可されますが、その後の挙動が異なります:

- **C++**: 同じ object の内部状態が通常の式相当に変わる。固有 accessor 呼出は runtime error
- **Python**: 同じ `_handle` の中身が変わる。Python の object identity は保たれるが、固有 accessor は同じく runtime error

---

## 関連ページ

- [整数変数と連立方程式の求解](INTEGER) — `qbpp.var(..., between=...)` と `qbpp.constrain(...)` を使った例
- [比較制約](COMPARISON) — `qbpp.constrain(f, equal=n)` による制約生成
- [置換関数](REPLACE) — `qbpp.replace(...)` の使用例
