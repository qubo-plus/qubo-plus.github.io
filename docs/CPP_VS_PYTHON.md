---
layout: default
title: "C++ vs Python"
nav_order: 3
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
| **Platform** | Ubuntu (amd64 / arm64) | Linux (amd64 / arm64) |
| **Details** | [Installation](INSTALL) | [Installation](python/INSTALL) |

## Coefficient and Energy Precision

In C++, the coefficient type (`coeff_t`) and energy type (`energy_t`) are fixed at compile time.
The default types are `int32_t` and `int64_t`, which may overflow for problems with large coefficients.
To use arbitrary-precision integers, you must specify the types explicitly:

```cpp
// Compile with:
// g++ -DCOEFF_TYPE=cpp_int -DENERGY_TYPE=cpp_int ...
```

In Python, **arbitrary-precision integers are always used**. There is no need to specify
`COEFF_TYPE` or `ENERGY_TYPE` — coefficients and energies of any magnitude are handled automatically.

| | C++ | Python |
|---|---|---|
| **Default coefficient** | `int32_t` (32-bit) | Arbitrary precision (unlimited) |
| **Default energy** | `int64_t` (64-bit) | Arbitrary precision (unlimited) |
| **Changing precision** | `-DCOEFF_TYPE=...` at compile time | Not needed |

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
| **Max degree** | `#define MAXDEG 2` | Not needed |
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
| **Solution value** | `sol(x)` | `sol(x)` |
| **Output** | `std::cout << sol << std::endl;` | `print(sol)` |

### Quick Start Example

The same problem solved in both languages:

**C++:**
```cpp
#define MAXDEG 2
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
- **Maximum degree optimization**: By specifying the maximum degree of expressions with `#define MAXDEG`, the compiler can optimize internal data structures for that degree. When the maximum degree is unknown, setting `MAXDEG` to `0` removes the limit. In Python, there is no such setting — expressions of any degree are handled automatically but without this optimization.
- **Mathematical range syntax**: Range constraints use the natural notation `l <= f <= u`, which reads like a mathematical formula.

### Python (PyQBPP) — Strengths

- **No compilation**: Write and run immediately. Ideal for interactive exploration with Jupyter notebooks and the Python REPL.
- **No overflow worries**: Arbitrary-precision integers are always used. You never need to think about `COEFF_TYPE`, `ENERGY_TYPE`, or `MAXDEG`.
- **Simpler syntax**: Less boilerplate — no `#include`, `#define`, `main()`, `auto`, or namespace qualifiers.
- **Easy installation**: `pip install pyqbpp` in a virtual environment, no `sudo` required.
- **Data science ecosystem**: Seamless integration with NumPy, pandas, matplotlib, and other Python libraries for data preparation and result analysis.

### Summary

| | C++ (QUBO++) | Python (PyQBPP) |
|---|---|---|
| **Expression building speed** | Fast (native) | Slower (ctypes overhead) |
| **Solver speed** | Same | Same |
| **Type control** | Fine-grained (int32 ~ cpp_int) | Always arbitrary precision |
| **MAXDEG optimization** | Available | Not available |
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
| **プラットフォーム** | Ubuntu（amd64 / arm64） | Linux（amd64 / arm64） |
| **詳細** | [インストール](INSTALL) | [インストール](python/INSTALL) |

## 係数とエネルギーの精度

C++ では、係数型（`coeff_t`）とエネルギー型（`energy_t`）はコンパイル時に固定されます。
デフォルトは `int32_t` と `int64_t` であり、大きな係数を持つ問題ではオーバーフローする可能性があります。
多倍長整数を使用するには、型を明示的に指定する必要があります：

```cpp
// コンパイルオプション:
// g++ -DCOEFF_TYPE=cpp_int -DENERGY_TYPE=cpp_int ...
```

Python では、**常に多倍長整数が使用されます**。`COEFF_TYPE` や `ENERGY_TYPE` を指定する必要はなく、
任意の大きさの係数とエネルギーが自動的に処理されます。

| | C++ | Python |
|---|---|---|
| **デフォルト係数型** | `int32_t`（32ビット） | 多倍長整数（制限なし） |
| **デフォルトエネルギー型** | `int64_t`（64ビット） | 多倍長整数（制限なし） |
| **精度の変更** | コンパイル時に `-DCOEFF_TYPE=...` | 不要 |

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
| **最大次数** | `#define MAXDEG 2` | 不要 |
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
| **解の値** | `sol(x)` | `sol(x)` |
| **出力** | `std::cout << sol << std::endl;` | `print(sol)` |

### Quick Start の例

同じ問題を両方の言語で解く例：

**C++:**
```cpp
#define MAXDEG 2
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
- **最大次数の最適化**: `#define MAXDEG` で式の最大次数を指定することで、コンパイラがその次数に最適化された内部データ構造を生成できます。最大次数が不明な場合は `MAXDEG` を `0` にすれば上限がなくなります。Python ではこの設定はなく、任意の次数の式が自動的に処理されますが、この最適化は行われません。
- **数学的な範囲制約構文**: 範囲制約に `l <= f <= u` という数式に近い自然な記法を使えます。

### Python（PyQBPP）の長所

- **コンパイル不要**: すぐに書いて実行できます。Jupyter ノートブックや Python REPL での対話的な探索に最適です。
- **オーバーフローの心配なし**: 常に多倍長整数が使用されます。`COEFF_TYPE`、`ENERGY_TYPE`、`MAXDEG` を意識する必要がありません。
- **シンプルな構文**: `#include`、`#define`、`main()`、`auto`、名前空間修飾子などの定型コードが不要です。
- **簡単なインストール**: 仮想環境内で `pip install pyqbpp` するだけで、`sudo` は不要です。
- **データサイエンスエコシステム**: NumPy、pandas、matplotlib などの Python ライブラリとシームレスに連携し、データの前処理や結果の分析が容易です。

### まとめ

| | C++（QUBO++） | Python（PyQBPP） |
|---|---|---|
| **式の構築速度** | 高速（ネイティブ） | やや遅い（ctypes オーバーヘッド） |
| **ソルバー速度** | 同じ | 同じ |
| **型制御** | きめ細かい（int32 〜 cpp_int） | 常に多倍長 |
| **MAXDEG 最適化** | あり | なし |
| **使いやすさ** | 普通 | 簡単 |
| **対話的利用** | 不可 | 可能（Jupyter、REPL） |

**推奨**: まず **PyQBPP（Python）** でプロトタイピングや学習を始め、大規模問題での式構築の高速化や性能のための型制御が必要になったら **C++（QUBO++）** に移行してください。

</div>
