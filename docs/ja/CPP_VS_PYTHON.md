---
layout: default
title: "C++ vs Python"
nav_order: 3
lang: ja
hreflang_alt: "en/CPP_VS_PYTHON"
hreflang_lang: "en"
---

# QUBO++（C++）と PyQBPP（Python）の違い

QUBO++ は **C++（QUBO++）** と **Python（PyQBPP）** の2つの言語で利用できます。
どちらも QUBO/HUBO 問題の定式化と求解のための同じコア機能を提供します。
このページでは、両者の主な違いをまとめます。

## インストール

| | C++（QUBO++） | Python（PyQBPP） |
|---|---|---|
| **コマンド** | `sudo apt install qbpp` | `pip install pyqbpp` |
| **プラットフォーム** | Linux（amd64 / arm64） | Linux（amd64 / arm64） |
| **詳細** | [インストール](INSTALL) | [インストール](python/INSTALL) |

## 係数とエネルギーの精度

C++ では、係数型（`coeff_t`）とエネルギー型（`energy_t`）はコンパイル時に固定されます。
デフォルトは `int32_t` と `int64_t` であり、大きな係数を持つ問題ではオーバーフローする可能性があります。
多倍長整数を使用するには、ヘッダのインクルード前に `INTEGER_TYPE_CPP_INT` を定義します：

```cpp
#define INTEGER_TYPE_CPP_INT
#include <qbpp/qbpp.hpp>
```

コンパイラオプション `-DINTEGER_TYPE_CPP_INT` で指定することもできます。

Python では、デフォルトで **32ビット係数・64ビットエネルギー**（`c32e64`）が使用されます（`import pyqbpp`）。
任意精度が必要な場合は cppint サブモジュールをインポートしてください：

```python
import pyqbpp as qbpp              # デフォルト: c32e64 (32ビット係数、64ビットエネルギー)
import pyqbpp.cppint as qbpp       # 任意精度 (cpp_int)
```

| | C++ | Python |
|---|---|---|
| **デフォルト係数型** | `int32_t`（32ビット） | `int32_t`（32ビット） |
| **デフォルトエネルギー型** | `int64_t`（64ビット） | `int64_t`（64ビット） |
| **精度の変更** | `#define INTEGER_TYPE_CPP_INT` 等 | インポート時に `import pyqbpp.cppint` |
| **詳細** | [C++ データ型](VAREXPR) | [Python データ型](python/VAREXPR) |

### 巨大整数定数の扱い

`int64_t` の範囲を超える巨大整数定数を使う場合、C++ と Python で扱いが異なります。

**C++**: `INTEGER_TYPE_CPP_INT` を定義し、巨大定数は**文字列**として記述する必要があります。
C++ の整数リテラルは `int64_t` を超えられないためです：

```cpp
#define INTEGER_TYPE_CPP_INT
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto f = x * qbpp::coeff_t("123456789012345678901234567890");
  std::cout << f << std::endl;
}
```

**Python**: `int64_t` を超える巨大整数定数を使う場合は、`cppint` サブモジュールをインポートします
（`cpp_int` による任意精度）：

```python
import pyqbpp.cppint as qbpp

x = qbpp.var("x")
f = x * 123456789012345678901234567890
print(f)
```

どちらも出力: `123456789012345678901234567890*x`

## 型の区別

C++ では、変数（`Var`）、項（`Term`）、式（`Expr`）に明確な型の区別があります。
暗黙の型変換は提供されていますが（例：`Var` → `Term` → `Expr`）、
QUBO++ のコードを読み書きする際にはこれらの型を理解しておくことが重要です。

Python では、**これらのクラスの区別を意識する必要はありません**。
動的型付けにより変換が自動的に処理されるため、変数、項、式を算術演算で自由に混在させることができます。

例えば、C++ で `auto f = 2;` と書くと `f` は `int` 型になり、`f += x;` はコンパイルエラーになります。
明示的に `Expr` を作成する必要があります：

```cpp
auto x = qbpp::var("x");
auto f = qbpp::toExpr(2);  // int ではなく Expr にする必要がある
f += x;                   // f は 2 + x を表す Expr になる
```

Python ではこのような型の意識は不要です：

```python
x = qbpp.var("x")
f = 2          # ただの int — 問題なし
f += x         # f は自動的に 2 + x を表す Expr になる
```

## 整数変数・制約式の mutation

整数変数・制約式はいずれも `Expr` 型で、追加のメタデータを持つだけです。**両言語とも mutation** (`+=`, `sqr()`, `replace()` 等) **は許可**されますが、mutation を行うと**そのメタデータは破棄**され、内部状態は通常の式になります（以後、顔固有の accessor は失敗）。例外は `simplify*()` で、メタデータを保ったまま簡約されます。

| 操作 | C++ | Python |
|---|---|---|
| `vi += 1`, `ee += 1` (複合代入) | **in-place**；内部状態は通常の式に戻る。以後 `min_val()`, `body()` 等の固有 accessor は runtime error | **in-place**；同じ `_handle` の中身を書き換え。以後固有 accessor は runtime error |
| `vi.sqr()`, `vi.replace(ml)`, `ee.sqr()`, `ee.replace(ml)` | **in-place**；上と同じ規則 | **in-place**；上と同じ規則 |
| `vi.simplify_as_binary()` 等の simplify メソッド | **in-place** — 顔は維持される | **in-place** — 顔は維持される |

両言語に共通する原則:
- **算術は新しい `Expr` を返す**: `vi + 1`, `ee + ee2` などは新しい通常 `Expr` を返す
- **非破壊的に変換したい時はグローバル関数**: `qbpp::simplify_as_binary(ee)` (C++) / `qbpp.simplify_as_binary(ee)` (Python) — 元のオブジェクトは変更されず新しい `Expr` を返す

詳細はクイックリファレンス [整数変数と制約に関する演算と関数](QR_INTCONSTRAINT) を参照。

## 構文の違い

以下の表に、C++ と Python の主な構文の違いを示します。

| 機能 | C++（QUBO++） | Python（PyQBPP） |
|---|---|---|
| **インクルード / インポート** | `#include <qbpp/qbpp.hpp>` | `import pyqbpp as qbpp` |
| **変数** | `auto a = qbpp::var("a");` | `a = qbpp.var("a")` |
| **変数配列** | `auto x = qbpp::var("x", n);` | `x = qbpp.var("x", shape=n)` |
| **整数変数** | `auto x = 0 <= qbpp::var_int("x") <= 10;` | `x = qbpp.var("x", between=(0, 10))` |
| **等式制約** | `auto f = (expr == 3);` | `f = qbpp.constrain(expr, equal=3)` |
| **範囲制約** | `auto f = (1 <= expr <= 5);` | `f = qbpp.constrain(expr, between=(1, 5))` |
| **制約の本体** | `f.body()` | `f.body` |
| **配列スライス** | `x(qbpp::slice(1, 3))`, `x(qbpp::all, j)` | `x[1:3]`, `x[:, j]` |
| **配列連結** | `qbpp::concat(a, b)` | `qbpp.concat([a, b])` |
| **探索** | `auto sol = solver.search();` | `sol = solver.search()` |
| **パラメータ付き探索** | `solver.search({% raw %}{{"time_limit", 10}, {"target_energy", 0}}{% endraw %})` | `solver.search(time_limit=10, target_energy=0)` |
| **出力** | `std::cout << sol << std::endl;` | `print(sol)` |
| **配列の出力形式** | `{x[0], x[1], x[2]}` (中括弧) | `[x[0], x[1], x[2]]` (角括弧) |

### Quick Start の例

同じ問題を両方の言語で解く例 (式 $f = (a + 2b + 3c - 4)^2$ を `EasySolver` で最小化):

**C++:**
{% raw %}
```cpp
#include <qbpp/easy_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto a = qbpp::var("a");
  auto b = qbpp::var("b");
  auto c = qbpp::var("c");
  auto f = qbpp::sqr(a + 2 * b + 3 * c - 4);
  f.simplify_as_binary();

  std::cout << "f = " << f << std::endl;

  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"time_limit", 10}, {"target_energy", 0}});
  std::cout << "sol = " << sol << std::endl;
}
```
{% endraw %}

**Python:**
```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
f = qbpp.sqr(a + 2 * b + 3 * c - 4)
f = qbpp.simplify_as_binary(f)
print("f =", f)

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=10, target_energy=0)
print("sol =", sol)
```

出力 (C++):
{% raw %}
```
f = 16 -7*a -12*b -15*c +4*a*b +6*a*c +12*b*c
sol = 0:{{a,1},{b,0},{c,1}}
```
{% endraw %}

出力 (Python):
```
f = 16 -7*a -12*b -15*c +4*a*b +6*a*c +12*b*c
sol = Sol(energy=0, {a: 1, b: 0, c: 1})
```

## どちらを使うべきか？

### C++（QUBO++）の長所

- **式の構築が高速**: 数百万項を含む大規模な式の構築は、ネイティブ C++ の方が大幅に高速です。ソルバーの実行時間は両言語で同じですが、モデルの構築時間は大規模問題で大きく異なります。
- **数学的な範囲制約構文**: 範囲制約に `l <= f <= u` という数式に近い自然な記法を使えます。
- **既存の C++ プロジェクトとの統合**: 既存の C++ アプリケーションに組み込んで使えます。

### Python（PyQBPP）の長所

- **コンパイル不要**: すぐに書いて実行できます。Jupyter ノートブックや Python REPL での対話的な探索に最適です。
- **デフォルトで高速な固定精度**: 32ビット係数・64ビットエネルギー（`c32e64`）がデフォルトです。任意精度が必要な場合は `import pyqbpp.cppint` を使用できます。
- **シンプルな構文**: `#include`、`#define`、`main()`、`auto`、名前空間修飾子などの定型コードが不要です。
- **簡単なインストール**: 仮想環境内で `pip install pyqbpp` するだけで、`sudo` は不要です。
- **データサイエンスエコシステム**: NumPy、pandas、matplotlib などの Python ライブラリとシームレスに連携し、データの前処理や結果の分析が容易です。

### まとめ

| | C++（QUBO++） | Python（PyQBPP） |
|---|---|---|
| **式の構築速度** | 高速（ネイティブ） | やや遅い（ctypes オーバーヘッド） |
| **ソルバー速度** | 同じ | 同じ |
| **使いやすさ** | 普通 | 簡単 |
| **対話的利用** | 不可 | 可能（Jupyter、REPL） |

**推奨**: まず **PyQBPP（Python）** でプロトタイピングや学習を始め、大規模問題での式構築の高速化が必要になったら **C++（QUBO++）** に移行してください。
