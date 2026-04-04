---
layout: default
title: "C++ vs Python"
nav_order: 3
alt_lang: "Python version"
alt_lang_url: "python/CPP_VS_PYTHON"
---

<div class="lang-en" markdown="1">

# QUBO++ (C++) vs PyQBPP (Python)

QUBO++ is available in two languages: **C++ (QUBO++)** and **Python (PyQBPP)**.
Both provide the same core functionality for formulating and solving QUBO/HUBO problems.
This page summarizes the key differences between the two.

## Installation

| | C++ (QUBO++) | Python (PyQBPP) |
|---|---|---|
| **Command** | `sudo apt install qbpp` | `pip install pyqbpp` |
| **Platform** | Linux (amd64 / arm64) | Linux (amd64 / arm64) |
| **Details** | [Installation](INSTALL) | [Installation](python/INSTALL) |

## Coefficient and Energy Precision

In C++, the coefficient type (`coeff_t`) and energy type (`energy_t`) are fixed at compile time.
The default types are `int32_t` and `int64_t`, which may overflow for problems with large coefficients.
To use arbitrary-precision integers, define `INTEGER_TYPE_CPP_INT` before including the header:

```cpp
#define INTEGER_TYPE_CPP_INT
#include <qbpp/qbpp.hpp>
```

Alternatively, you can pass `-DINTEGER_TYPE_CPP_INT` as a compiler option.

In Python, **arbitrary-precision integers are used by default** (`import pyqbpp`).
For better performance, you can choose a fixed-precision type by importing a submodule:

```python
import pyqbpp as qbpp              # Default: arbitrary precision (cpp_int)
import pyqbpp.c32e64 as qbpp      # 32-bit coefficients, 64-bit energy (fastest)
```

| | C++ | Python |
|---|---|---|
| **Default coefficient** | `int32_t` (32-bit) | Arbitrary precision (unlimited) |
| **Default energy** | `int64_t` (64-bit) | Arbitrary precision (unlimited) |
| **Changing precision** | `#define INTEGER_TYPE_CPP_INT` etc. | `import pyqbpp.c32e64` at import time |
| **Details** | [C++ Data Types](VAREXPR) | [Python Data Types](python/VAREXPR) |

### Large Integer Constants

When working with problems involving large integer constants that exceed the range of `int64_t`,
the handling differs between C++ and Python.

**C++**: You must define `INTEGER_TYPE_CPP_INT` and write large constants as **strings**,
because C++ integer literals cannot exceed `int64_t`:

```cpp
#define INTEGER_TYPE_CPP_INT
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto f = x * qbpp::coeff_t("123456789012345678901234567890");
  std::cout << f << std::endl;
}
```

**Python**: Large integers work naturally with no special handling, since Python has built-in
arbitrary-precision integers and `import pyqbpp` uses `cpp_int` by default:

```python
import pyqbpp as qbpp

x = qbpp.var("x")
f = x * 123456789012345678901234567890
print(f)
```

Both produce: `123456789012345678901234567890*x`

## Type Distinctions

In C++, there are distinct types for variables (`Var`), terms (`Term`), and expressions (`Expr`).
Although implicit conversions are provided (e.g., `Var` → `Term` → `Expr`),
understanding these types is important for reading and writing QUBO++ code.

In Python, **you do not need to be aware of these class distinctions**.
Dynamic typing handles conversions automatically, so you can mix variables, terms,
and expressions freely in arithmetic operations.

For example, in C++, writing `auto f = 2;` makes `f` an `int`, so `f += x;` causes a compile error.
You must explicitly create an `Expr`:

```cpp
auto x = qbpp::var("x");
auto f = qbpp::Expr(2);  // Must be Expr, not int
f += x;                   // f is now Expr representing 2 + x
```

In Python, no such type awareness is needed:

```python
x = qbpp.var("x")
f = 2          # Just an int — no problem
f += x         # f automatically becomes an Expr representing 2 + x
```

## Syntax Differences

The following table shows the main syntax differences between C++ and Python.

| Feature | C++ (QUBO++) | Python (PyQBPP) |
|---|---|---|
| **Include / Import** | `#include <qbpp/qbpp.hpp>` | `import pyqbpp as qbpp` |
| **Variable** | `auto a = qbpp::var("a");` | `a = qbpp.var("a")` |
| **Variable vector** | `auto x = qbpp::var("x", n);` | `x = qbpp.var("x", n)` |
| **Negated literal** | `~x` | `~x` |
| **Integer variable** | `auto x = 0 <= qbpp::var_int("x") <= 10;` | `x = qbpp.between(qbpp.var_int("x"), 0, 10)` |
| **Equality** | `auto f = (expr == 3);` | `f = (expr == 3)` |
| **Range constraint** | `auto f = (1 <= expr <= 5);` | `f = qbpp.between(expr, 1, 5)` |
| **Body of ExprExpr** | `*f` | `f.body` |
| **Simplify** | `expr.simplify_as_binary();` | `expr.simplify_as_binary()` |
| **Easy Solver** | `qbpp::easy_solver::EasySolver(expr)` | `qbpp.EasySolver(expr)` |
| **Exhaustive Solver** | `qbpp::exhaustive_solver::ExhaustiveSolver(expr)` | `qbpp.ExhaustiveSolver(expr)` |
| **ABS3 Solver** | `qbpp::abs3_solver::ABS3Solver(expr)` | `qbpp.ABS3Solver(expr)` |
| **Search** | `auto sol = solver.search();` | `sol = solver.search()` |
| **Search with params** | `solver.search({% raw %}{{"time_limit", 10}, {"target_energy", 0}}{% endraw %})` | `solver.search({"time_limit": 10, "target_energy": 0})` |
| **Solution value** | `sol(x)` | `sol(x)` |
| **Output** | `std::cout << sol << std::endl;` | `print(sol)` |

### Quick Start Example

The same problem solved in both languages:

**C++:**
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto x = 0 <= qbpp::var_int("x") <= 10;
  auto y = 0 <= qbpp::var_int("y") <= 10;
  auto h = (x + y == 10) + (2 * x + 4 * y == 28);
  h.simplify_as_binary();
  auto sol = qbpp::exhaustive_solver::ExhaustiveSolver(h).search();
  std::cout << "x = " << sol(x) << ", y = " << sol(y) << std::endl;
}
```

**Python:**
```python
import pyqbpp as qbpp

x = qbpp.between(qbpp.var_int("x"), 0, 10)
y = qbpp.between(qbpp.var_int("y"), 0, 10)
h = (x + y == 10) + (2 * x + 4 * y == 28)
h.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(h).search()
print(f"x = {sol(x)}, y = {sol(y)}")
```

Both output: `x = 6, y = 4`

## Which Should I Use?

### C++ (QUBO++) — Strengths

- **Faster expression building**: Building large expressions with millions of terms is significantly faster in native C++. The solver execution time is the same in both languages, but the time to construct the model can differ substantially for large problems.
- **Fine-grained type control**: You can choose smaller coefficient types (e.g., `int32_t`, `int64_t`) when arbitrary precision is not needed. Fixed-width integers are much faster than arbitrary-precision integers, which can make a noticeable difference in both expression building and solver performance. When overflow-free computation is needed, you can switch to `cpp_int` for arbitrary-precision integers at the cost of speed — giving you the flexibility to trade performance for correctness on a per-project basis.
- **Mathematical range syntax**: Range constraints use the natural notation `l <= f <= u`, which reads like a mathematical formula.

### Python (PyQBPP) — Strengths

- **No compilation**: Write and run immediately. Ideal for interactive exploration with Jupyter notebooks and the Python REPL.
- **No overflow worries by default**: Arbitrary-precision integers are used by default. For performance, fixed-precision types are also available via `import pyqbpp.c32e64`.
- **Simpler syntax**: Less boilerplate — no `#include`, `#define`, `main()`, `auto`, or namespace qualifiers.
- **Easy installation**: `pip install pyqbpp` in a virtual environment, no `sudo` required.
- **Data science ecosystem**: Seamless integration with NumPy, pandas, matplotlib, and other Python libraries for data preparation and result analysis.

### Summary

| | C++ (QUBO++) | Python (PyQBPP) |
|---|---|---|
| **Expression building speed** | Fast (native) | Slower (ctypes overhead) |
| **Solver speed** | Same | Same |
| **Type control** | Fine-grained (int16 ~ cpp_int) | Same (default: cpp_int) |
| **Ease of use** | Moderate | Easy |
| **Interactive use** | No | Yes (Jupyter, REPL) |

**Recommendation**: Start with **PyQBPP (Python)** for prototyping and learning. Switch to **C++ (QUBO++)** if you need faster expression building for large-scale problems or fine-grained type control for performance.

</div>

<div class="lang-ja" markdown="1">

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

Python では、デフォルトで**多倍長整数が使用されます**（`import pyqbpp`）。
パフォーマンスを向上させるために、サブモジュールで固定精度型を選択できます：

```python
import pyqbpp as qbpp              # デフォルト: 任意精度 (cpp_int)
import pyqbpp.c32e64 as qbpp      # 32ビット係数、64ビットエネルギー（高速）
```

| | C++ | Python |
|---|---|---|
| **デフォルト係数型** | `int32_t`（32ビット） | 多倍長整数（制限なし） |
| **デフォルトエネルギー型** | `int64_t`（64ビット） | 多倍長整数（制限なし） |
| **精度の変更** | `#define INTEGER_TYPE_CPP_INT` 等 | インポート時に `import pyqbpp.c32e64` |
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

**Python**: 特別な処理は不要です。Python は組み込みの多倍長整数を持っており、
`import pyqbpp` はデフォルトで `cpp_int` を使用するため、巨大整数をそのまま書けます：

```python
import pyqbpp as qbpp

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
auto f = qbpp::Expr(2);  // int ではなく Expr にする必要がある
f += x;                   // f は 2 + x を表す Expr になる
```

Python ではこのような型の意識は不要です：

```python
x = qbpp.var("x")
f = 2          # ただの int — 問題なし
f += x         # f は自動的に 2 + x を表す Expr になる
```

## 構文の違い

以下の表に、C++ と Python の主な構文の違いを示します。

| 機能 | C++（QUBO++） | Python（PyQBPP） |
|---|---|---|
| **インクルード / インポート** | `#include <qbpp/qbpp.hpp>` | `import pyqbpp as qbpp` |
| **変数** | `auto a = qbpp::var("a");` | `a = qbpp.var("a")` |
| **変数ベクトル** | `auto x = qbpp::var("x", n);` | `x = qbpp.var("x", n)` |
| **否定リテラル** | `~x` | `~x` |
| **整数変数** | `auto x = 0 <= qbpp::var_int("x") <= 10;` | `x = qbpp.between(qbpp.var_int("x"), 0, 10)` |
| **等式制約** | `auto f = (expr == 3);` | `f = (expr == 3)` |
| **範囲制約** | `auto f = (1 <= expr <= 5);` | `f = qbpp.between(expr, 1, 5)` |
| **ExprExpr の本体** | `*f` | `f.body` |
| **簡約化** | `expr.simplify_as_binary();` | `expr.simplify_as_binary()` |
| **Easy Solver** | `qbpp::easy_solver::EasySolver(expr)` | `qbpp.EasySolver(expr)` |
| **Exhaustive Solver** | `qbpp::exhaustive_solver::ExhaustiveSolver(expr)` | `qbpp.ExhaustiveSolver(expr)` |
| **ABS3 Solver** | `qbpp::abs3_solver::ABS3Solver(expr)` | `qbpp.ABS3Solver(expr)` |
| **探索** | `auto sol = solver.search();` | `sol = solver.search()` |
| **パラメータ付き探索** | `solver.search({% raw %}{{"time_limit", 10}, {"target_energy", 0}}{% endraw %})` | `solver.search({"time_limit": 10, "target_energy": 0})` |
| **解の値** | `sol(x)` | `sol(x)` |
| **出力** | `std::cout << sol << std::endl;` | `print(sol)` |

### Quick Start の例

同じ問題を両方の言語で解く例：

**C++:**
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto x = 0 <= qbpp::var_int("x") <= 10;
  auto y = 0 <= qbpp::var_int("y") <= 10;
  auto h = (x + y == 10) + (2 * x + 4 * y == 28);
  h.simplify_as_binary();
  auto sol = qbpp::exhaustive_solver::ExhaustiveSolver(h).search();
  std::cout << "x = " << sol(x) << ", y = " << sol(y) << std::endl;
}
```

**Python:**
```python
import pyqbpp as qbpp

x = qbpp.between(qbpp.var_int("x"), 0, 10)
y = qbpp.between(qbpp.var_int("y"), 0, 10)
h = (x + y == 10) + (2 * x + 4 * y == 28)
h.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(h).search()
print(f"x = {sol(x)}, y = {sol(y)}")
```

どちらも出力: `x = 6, y = 4`

## どちらを使うべきか？

### C++（QUBO++）の長所

- **式の構築が高速**: 数百万項を含む大規模な式の構築は、ネイティブ C++ の方が大幅に高速です。ソルバーの実行時間は両言語で同じですが、モデルの構築時間は大規模問題で大きく異なります。
- **きめ細かい型制御**: 多倍長精度が不要な場合、小さい係数型（例: `int32_t`、`int64_t`）を選択できます。固定幅整数は多倍長整数よりはるかに高速で、式の構築とソルバーの両方の性能に影響します。オーバーフローのない計算が必要な場合は、速度を犠牲にして `cpp_int` による多倍長整数に切り替えることもでき、プロジェクトごとに性能と正確性のバランスを柔軟に選択できます。
- **数学的な範囲制約構文**: 範囲制約に `l <= f <= u` という数式に近い自然な記法を使えます。

### Python（PyQBPP）の長所

- **コンパイル不要**: すぐに書いて実行できます。Jupyter ノートブックや Python REPL での対話的な探索に最適です。
- **デフォルトでオーバーフローの心配なし**: デフォルトで多倍長整数が使用されます。パフォーマンス重視の場合は `import pyqbpp.c32e64` で固定精度型も選択可能です。
- **シンプルな構文**: `#include`、`#define`、`main()`、`auto`、名前空間修飾子などの定型コードが不要です。
- **簡単なインストール**: 仮想環境内で `pip install pyqbpp` するだけで、`sudo` は不要です。
- **データサイエンスエコシステム**: NumPy、pandas、matplotlib などの Python ライブラリとシームレスに連携し、データの前処理や結果の分析が容易です。

### まとめ

| | C++（QUBO++） | Python（PyQBPP） |
|---|---|---|
| **式の構築速度** | 高速（ネイティブ） | やや遅い（ctypes オーバーヘッド） |
| **ソルバー速度** | 同じ | 同じ |
| **型制御** | きめ細かい（int16 〜 cpp_int） | 同じ（デフォルト: cpp_int） |
| **使いやすさ** | 普通 | 簡単 |
| **対話的利用** | 不可 | 可能（Jupyter、REPL） |

**推奨**: まず **PyQBPP（Python）** でプロトタイピングや学習を始め、大規模問題での式構築の高速化や性能のための型制御が必要になったら **C++（QUBO++）** に移行してください。

</div>
