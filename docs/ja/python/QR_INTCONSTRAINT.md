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

整数変数 (`pyqbpp.VarInt`) と制約 (`pyqbpp.ExprExpr`) は、`pyqbpp.Expr` を補う **2 つの専用オブジェクト型** で、共に **immutable** です。

> **基本原則**
> - **`simplify()` / `simplify_as_binary()` / `simplify_as_spin()` は in-place 対応**: VarInt は Expr 部分を、ExprExpr は penalty と body の両方を同時に簡約
> - **`sqr()`, `replace()` はエラー** → `TypeError`。代替はグローバル関数 (`qbpp.sqr(vi)` 等)
> - **複合代入 (`vi += 1` など) は silent rebind**: Python の immutable 型 (Decimal, Fraction, str) と同じ挙動で、`vi` は新しい `Expr` に再束縛されます (元の VarInt の metadata / ExprExpr の body は破棄)
> - **算術文脈では `Expr` として扱われる**: 一旦 `Expr` になれば in-place 変更も自由

---

## 1. `pyqbpp.VarInt`

### 生成

| 構文 | 戻り値 |
|---|---|
| `qbpp.var("x", between=(l, u))` | `VarInt` (範囲 `[l, u]`) |
| `qbpp.var("x", shape=N, between=(l, u))` | array (VarInt 要素) |
| `qbpp.var("x", shape=(s1, s2, ...), between=(l, u))` | 多次元 VarInt 配列 |
| `qbpp.var("x", shape=N, equal=0)` | placeholder VarInt 配列 (各要素を後から代入) |

### 使える演算・関数

| カテゴリ | 例 | 戻り値 | 備考 |
|---|---|---|---|
| 単項 | `-vi` | `Expr` | `_expr()` に委譲 |
| 算術 (右辺 Expr 系) | `vi + 1`, `vi * 2`, `vi - x` | `Expr` | `_expr()` に委譲 |
| 算術 (右辺 VarInt) | `vi1 + vi2`, `vi1 * vi2` | `Expr` | 両辺 `_expr()` |
| 制約 (等値) | `qbpp.constrain(vi, equal=5)` | `ExprExpr` | 制約生成 |
| 制約 (範囲) | `qbpp.constrain(vi, between=(l, u))` | `ExprExpr` | 範囲制約 |
| グローバル関数 | `qbpp.sqr(vi)`, `qbpp.simplify(vi)`, `qbpp.simplify_as_binary(vi)` | `Expr` | `Expr` に変換して適用 |
| メタ情報プロパティ | `vi.name`, `vi.min_val`, `vi.max_val` | 各種 | read-only |
| 構造プロパティ・メソッド | `vi.var_count`, `vi.coeff(i)`, `vi.get_var(i)`, `vi[i]` | 各種 | read-only |
| 配列プロパティ | `vi.vars`, `vi.coeffs` | `list` | read-only |
| Expr 取得 | `Expr(vi)`, `str(vi)` | `Expr` / `str` | clone |
| in-place 簡約 | `vi.simplify()`, `vi.simplify_as_binary()`, `vi.simplify_as_spin()` | `VarInt` | Expr 部分のみ簡約（メタデータ不変） |
| 代入 | `vi = other_vi` | (再束縛) | Python の通常の代入 |
| 複合代入 (silent rebind) | `vi += 1`, `vi -= 1`, `vi *= 2`, `vi //= 2`, `vi /= 2` | (`vi` が `Expr` に変わる) | `vi = vi + 1` と等価。VarInt metadata は破棄 |

### 使えない演算・関数

| カテゴリ | 例 | 結果 |
|---|---|---|
| 二乗 | `vi.sqr()` | **`TypeError`** (代替: `qbpp.sqr(vi)`) |
| 置換 | `vi.replace(ml)` | **`TypeError`** (代替: `qbpp.replace(vi, ml)`) |

---

## 2. `pyqbpp.ExprExpr`

### 生成

| 構文 | 戻り値 | 意味 (penalty / body) |
|---|---|---|
| `qbpp.constrain(f, equal=n)` | `ExprExpr` | penalty = `sqr(f - n)`, body = `f` |
| `qbpp.constrain(f, between=(l, u))` | `ExprExpr` | penalty = between, body = `f` |
| `qbpp.constrain(f, between=(l, None))` | `ExprExpr` | `f >= l` (無上限) |
| `qbpp.constrain(f, between=(None, u))` | `ExprExpr` | `f <= u` (無下限) |

`f` は非整数の式型 (`Var`, `Term`, `Expr`, `VarInt`)、`n`, `l`, `u` は整数。

### 使える演算・関数

| カテゴリ | 例 | 戻り値 | 備考 |
|---|---|---|---|
| 単項 | `-ee` | `Expr` | Expr 継承で動作 |
| 算術 (右辺 Expr 系) | `ee + 1`, `ee * 2`, `ee + x` | `Expr` | Expr 継承 |
| 算術 (右辺 ExprExpr) | `ee1 + ee2` | `Expr` | 両辺 penalty |
| グローバル関数 | `qbpp.sqr(ee)`, `qbpp.simplify_as_binary(ee)`, `qbpp.replace(ee, ml)` | `Expr` | penalty に適用、新 `Expr` を返す |
| プロパティ | `ee.body`, `str(ee)` | `Expr` / `str` | clone (penalty は `Expr(ee)` で取得) |
| 解での評価 | `sol(ee)` (penalty を評価), `sol(ee.body)` (body を評価) | `coeff_t` | 制約満足度の検証 |
| 代入 | `ee = other_ee` | (再束縛) | Python の通常の代入 |
| in-place 簡約 | `ee.simplify()`, `ee.simplify_as_binary()`, `ee.simplify_as_spin()` | `ExprExpr` | penalty と body を同時に簡約 |
| 複合代入 (silent rebind) | `ee += 1`, `ee -= 1`, `ee *= 2`, `ee //= 2`, `ee /= 2` | (`ee` が `Expr` に変わる) | `ee = ee + 1` と等価。**body は破棄** |

### 使えない演算・関数

| カテゴリ | 例 | 結果 |
|---|---|---|
| 二乗 | `ee.sqr()` | **`TypeError`** (代替: `qbpp.sqr(ee)`) |
| 置換 | `ee.replace(ml)` | **`TypeError`** (代替: `qbpp.replace(ee, ml)`) |

---

## 3. グローバル関数: 新しい `Expr` を返す

`VarInt` / `ExprExpr` を引数に取れる主要なグローバル関数。**いずれも引数を変更せず、新しい `pyqbpp.Expr` を返します**:

| 関数 | 戻り値 | 説明 |
|---|---|---|
| `qbpp.sqr(x)` | `Expr` | `x * x` |
| `qbpp.simplify(x)` | `Expr` | 同類項マージ |
| `qbpp.simplify_as_binary(x)` | `Expr` | binary (0/1) ルールで簡約 |
| `qbpp.simplify_as_spin(x)` | `Expr` | spin (±1) ルールで簡約 |
| `qbpp.replace(x, ml)` | `Expr` | 変数置換 |
| `qbpp.constrain(f, equal=n)` | `ExprExpr` | 等値制約 |
| `qbpp.constrain(f, between=(l, u))` | `ExprExpr` | 範囲制約 |

引数 `x` は `Var`, `Term`, `Expr`, `VarInt`, `ExprExpr` のいずれでも OK (内部で `Expr` に変換)。

---

## 4. 配列版

`VarInt` / `ExprExpr` の配列も同じ規則:
- **要素ごとに immutable**
- **算術では各要素が `Expr` に変換** → 結果は `Expr` 配列
- **in-place mutator は不可**、グローバル関数で代用

```python
# VarInt 配列
x = qbpp.var("x", shape=3, between=(0, 7))      # Array (VarInt 要素)
sum_expr = qbpp.sum(x)                           # Expr
f = qbpp.sqr(sum_expr - 5)                       # Expr

# ExprExpr 配列 (要素ごとの制約)
m = qbpp.var("m", shape=(3, 4))                  # 2D Var 配列
rows = qbpp.vector_sum(m, axis=0)                # 各行の和 (Expr 配列)
onehot = qbpp.constrain(rows, equal=1)           # Array (ExprExpr 要素)
penalty = qbpp.sum(onehot)                       # Expr (全制約の合計)
```

要素ごとの `body` アクセスは `arr[i].body`。

---

## 5. C++ 版との差異

C++ では `+=` 等の複合代入はコンパイルエラー、Python では silent rebind になるなど挙動の違いがあります。詳細は [QUBO++ (C++) と PyQBPP (Python) の違い](../CPP_VS_PYTHON) の「整数変数 (`VarInt`) と制約 (`ExprExpr`) の immutability」を参照。

---

## 関連ページ

- [整数変数と連立方程式の求解](INTEGER) — `qbpp.var(..., between=...)` と `qbpp.constrain(...)` を使った例
- [比較制約](COMPARISON) — `qbpp.constrain(f, equal=n)` による制約生成
- [置換関数](REPLACE) — `qbpp.replace(...)` の使用例
