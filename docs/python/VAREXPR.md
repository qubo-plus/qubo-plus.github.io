---
layout: default
nav_exclude: true
title: "Data Types"
nav_order: 10
alt_lang: "C++ version"
alt_lang_url: "VAREXPR"
---

<div class="lang-en" markdown="1">
# Variable and Expression Classes

## Var and Expr classes

PyQBPP provides two main classes for building QUBO/HUBO expressions:
- **`Var`**: Represents a binary variable, associated with a display name.
- **`Expr`**: Represents an expression consisting of an integer constant and zero or more product terms.

`Var` objects are created using `qbpp.var()` and are **immutable**.
Expressions are built from variables using arithmetic operators (`+`, `-`, `*`) and are **mutable** via compound assignment operators such as `+=`.

The following program demonstrates variable and expression creation:
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = 2 * x * y - x + 1
f += 3 * y

print("f =", f)
```
This program prints:
```
f = 1 -x +2*x*y +3*y
```

> **NOTE**
> PyQBPP uses the C++ QUBO++ library as its backend, which internally distinguishes between `Term` (a single product term like `2*x*y`) and `Expr` (a sum of terms).
> In PyQBPP, however, you do not need to be aware of this distinction.
> Python's dynamic typing automatically converts between types as needed, so you can simply write expressions naturally.

## Coefficient and Energy Types
By default, `import pyqbpp` uses **arbitrary-precision integers** (`cpp_int`) for all coefficients and energy values.
This ensures correctness for any problem size without worrying about overflow.

For better performance, you can choose a fixed-precision type variant by importing a submodule:

```python
import pyqbpp as qbpp              # Default: arbitrary precision (cpp_int)
import pyqbpp.c32e64 as qbpp      # 32-bit coefficients, 64-bit energy (fastest for most problems)
```

The following type variants are available:

| Import | Coefficient | Energy | Use case |
|---|---|---|---|
| `import pyqbpp` | unlimited | unlimited | Development and validation |
| `import pyqbpp.c16e32` | 16-bit | 32-bit | Small problems |
| `import pyqbpp.c32e64` | 32-bit | 64-bit | Most common choice |
| `import pyqbpp.c64e64` | 64-bit | 64-bit | Large coefficients |
| `import pyqbpp.c64e128` | 64-bit | 128-bit | Large energy range |
| `import pyqbpp.c128e128` | 128-bit | 128-bit | Very large problems |

> **NOTE**
> The type variant must be chosen at import time and cannot be changed afterward.
> All variables, expressions, and solvers within a program use the same type.

### Example with arbitrary precision (default)
```python
import pyqbpp as qbpp

x = qbpp.var("x")
f = 123456789012345678901234567890 * x + 987654321098765432109876543210
print("f =", f)
```
This program produces the following output:
```
f = 987654321098765432109876543210 +123456789012345678901234567890*x
```
</div>

<div class="lang-ja" markdown="1">
# 変数と式のクラス

## VarクラスとExprクラス

PyQBPPはQUBO/HUBO式を構築するための2つの主要なクラスを提供します：
- **`Var`**: バイナリ変数を表し、表示用の名前が関連付けられます。
- **`Expr`**: 整数の定数と0個以上の積の項からなる式を表します。

`Var` オブジェクトは `qbpp.var()` で作成し、**イミュータブル（不変）**です。
式は変数から算術演算子（`+`, `-`, `*`）を使って構築し、`+=` などの複合代入演算子で**更新可能**です。

以下のプログラムは、変数と式の作成を示しています：
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = 2 * x * y - x + 1
f += 3 * y

print("f =", f)
```
このプログラムは以下を出力します：
```
f = 1 -x +2*x*y +3*y
```

> **NOTE**
> PyQBPPはバックエンドとしてC++ QUBO++ライブラリを使用しており、内部的には `Term`（`2*x*y` のような単一の積の項）と `Expr`（項の和）を区別しています。
> しかしPyQBPPでは、この区別を意識する必要はありません。
> Pythonの動的型付けが必要に応じて自動的に型変換を行うため、自然に式を記述できます。

## 係数型とエネルギー型
デフォルトの `import pyqbpp` では、全ての係数とエネルギー値に**任意精度整数**（`cpp_int`）を使用します。
これにより、問題のサイズに関係なくオーバーフローの心配がありません。

パフォーマンスを向上させるために、サブモジュールをインポートして固定精度の型バリアントを選択できます：

```python
import pyqbpp as qbpp              # デフォルト: 任意精度 (cpp_int)
import pyqbpp.c32e64 as qbpp      # 32ビット係数、64ビットエネルギー（大半の問題に最適）
```

以下の型バリアントが利用可能です：

| インポート | 係数 | エネルギー | 用途 |
|---|---|---|---|
| `import pyqbpp` | 無制限 | 無制限 | 開発・検証 |
| `import pyqbpp.c16e32` | 16ビット | 32ビット | 小規模問題 |
| `import pyqbpp.c32e64` | 32ビット | 64ビット | 最も一般的 |
| `import pyqbpp.c64e64` | 64ビット | 64ビット | 大きな係数 |
| `import pyqbpp.c64e128` | 64ビット | 128ビット | 大きなエネルギー範囲 |
| `import pyqbpp.c128e128` | 128ビット | 128ビット | 非常に大規模な問題 |

> **NOTE**
> 型バリアントはインポート時に選択し、後から変更することはできません。
> プログラム内の全ての変数、式、ソルバーが同じ型を使用します。

### 任意精度の例（デフォルト）
```python
import pyqbpp as qbpp

x = qbpp.var("x")
f = 123456789012345678901234567890 * x + 987654321098765432109876543210
print("f =", f)
```
このプログラムは以下の出力を生成します:
```
f = 987654321098765432109876543210 +123456789012345678901234567890*x
```
</div>
