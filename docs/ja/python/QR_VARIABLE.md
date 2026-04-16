---
layout: default
nav_exclude: true
title: "QR: Variables"
nav_order: 30
lang: ja
hreflang_alt: "en/python/QR_VARIABLE"
hreflang_lang: "en"
---

# クイックリファレンス: 変数と式
## PyQBPP のデータ型
PyQBPPでは係数・エネルギー値・定数をPythonのネイティブな `int` 型で扱うため、
ユーザーコード上で `coeff_t` や `energy_t` を気にする必要はありません。
ただし、内部で使用する共有ライブラリは C++ 版と同じ型バリアントを備えており、
**インポート時にサブモジュールを選択する**ことで切り替えます
（デフォルトの `import pyqbpp` は `c32e64`、つまり32ビット係数・64ビットエネルギー）。

```python
import pyqbpp as qbpp              # デフォルト: c32e64
import pyqbpp.cppint as qbpp       # 任意精度 (cpp_int)
import pyqbpp.c32e64m4 as qbpp     # c32e64 + 4次まで固定長
```

利用可能な型バリアント:

| インポート | 係数 | エネルギー | 用途 |
|---|---|---|---|
| `import pyqbpp` / `pyqbpp.c32e64` | 32ビット | 64ビット | デフォルト、最も一般的 |
| `import pyqbpp.c32e32` | 32ビット | 32ビット | 小規模問題 |
| `import pyqbpp.c64e64` | 64ビット | 64ビット | 大きな係数 |
| `import pyqbpp.c64e128` | 64ビット | 128ビット | 大きなエネルギー範囲 |
| `import pyqbpp.c128e128` | 128ビット | 128ビット | 非常に大規模な問題 |
| `import pyqbpp.cppint` | 無制限 | 無制限 | 任意精度 (`cpp_int`) |

さらに各バリアントに VarArray モード接尾辞 `m0` / `m2` / `m4` / `m6` を付けて、
`qbpp::Term` の変数格納方式を選択できます
（例: `import pyqbpp.c32e64m4 as qbpp`）:

| 接尾辞 | 最大次数 | 説明 |
|---|---|---|
| （なし）/ `m0` | 無制限 | 可変長（デフォルト、3次以上でヒープ確保） |
| `m2` | 2 | 固定長、QUBO専用（ヒープ確保なし、最速） |
| `m4` | 4 | 固定長、4次まで（ヒープ確保なし） |
| `m6` | 6 | 固定長、6次まで（ヒープ確保なし） |

型バリアントはインポート時に選択し、プログラム実行中に切り替えることはできません。
詳細は [VAREXPR](VAREXPR) を参照してください。

## オブジェクトの表示
すべてのPyQBPPオブジェクトは `print()` で表示するか、`str()` で文字列に変換できます。
```python
print(obj)
s = str(obj)
```

## 変数クラス
- **`pyqbpp.Var`**:
  一意な32ビット整数IDを保持するクラスです。
  変数名は `str(x)` で取得できます。

> **NOTE**
> `pyqbpp.Var` オブジェクトは変数をシンボリックに表現します。
> 特定のデータ型は関連付けられていません。
> バイナリ変数、スピン変数、その他の種類の変数を表現するために使用できます。

### 変数作成関数
変数を作成するために以下の関数が提供されています。

- **`pyqbpp.var("name")`**:
  指定された名前 `"name"` を持つ `pyqbpp.Var` オブジェクトを作成します。

- **`pyqbpp.var("name", shape=s1)`**:
  基本名 `"name"` を持つ `pyqbpp.Var` オブジェクトの1次元配列を作成します。
  各要素は `name[i]` として表されます。
  結果の型は `pyqbpp.Array` です。

- **`pyqbpp.var("name", shape=(s1, s2))`**:
  基本名 `"name"` を持つ `pyqbpp.Var` オブジェクトの2次元配列（行列）を作成します。
  各要素は `name[i][j]` として表されます。
  結果の型はネストされた `pyqbpp.Array` です。

- **`pyqbpp.var("name", shape=(s1, s2, ...))`**:
  基本名 `"name"` を持つ `pyqbpp.Var` オブジェクトの高次元配列を作成します。
  各要素は `name[i][j]...` として表されます。
  結果の型はネストされた `pyqbpp.Array` です。

> **NOTE**
> `"name"` を省略すると、作成順に `"{0}"`、`"{1}"` などの番号付き名前が自動的に割り当てられます。

### 例
```python
import pyqbpp as qbpp

x = qbpp.var("x")          # Single variable named "x"
y = qbpp.var("y", shape=3)       # Array: y[0], y[1], y[2]
z = qbpp.var("z", shape=(2, 3))    # 2x3 matrix: z[0][0], ..., z[1][2]
a = qbpp.var()             # Single unnamed variable
b = qbpp.var(shape=5)            # Array of 5 unnamed variables
```

## `pyqbpp.Var` のプロパティとメソッド
`pyqbpp.Var` のインスタンス `x` に対して、以下が利用可能です。

- **`str(x)`**:
  `x` の名前を文字列として返します。

## 整数変数クラス
- **`pyqbpp.VarInt`**:
  `pyqbpp.Expr` から派生したクラスで、指定された範囲を持つ整数変数を表現します。

### 整数変数作成関数
整数変数を作成するために以下の関数が提供されています。

- **`pyqbpp.var("name", between=(l, u))`**:
  ここで `l` と `u` は整数でなければなりません。
  この式は名前 `"name"` を持つ `pyqbpp.VarInt` オブジェクトを作成し、
  内部的に範囲 `[l, u]` のすべての整数を表す `pyqbpp.Expr` オブジェクトを含みます。
  内部的に、基礎となる式で使用される `pyqbpp.Var` オブジェクトも作成します。

- **`pyqbpp.var("name", shape=s1, between=(l, u))`**:
  基本名 `"name"` と同じ範囲 `[l, u]` を持つ `pyqbpp.VarInt` オブジェクトの1次元配列を作成します。
  各要素は `name[i]` として表されます。
  結果の型は `pyqbpp.Array` です。
  `pyqbpp.VarInt` オブジェクトの高次元配列は、`pyqbpp.Var` オブジェクトと同じ方法で作成できます。

### 例
```python
import pyqbpp as qbpp

x = qbpp.var("x", between=(0, 10))           # Integer variable x in [0, 10]
y = qbpp.var("y", shape=3, between=(-5, 5))        # Array of 3 integer variables in [-5, 5]
z = qbpp.var("z", shape=(2, 3), between=(1, 8))      # 2x3 matrix of integer variables in [1, 8]
```

### 整数変数のプロパティ
`pyqbpp.VarInt` のインスタンス `x` に対して、以下が利用可能です。

- **`x.min_val`** (プロパティ):
  `x` の最小値 `l` を返します。

- **`x.max_val`** (プロパティ):
  `x` の最大値 `u` を返します。

- **`x.vars`** (プロパティ):
  整数変数を表現するために使用される `pyqbpp.Var` オブジェクトのリストを返します。

- **`x.coeffs`** (プロパティ):
  整数係数のリストを返します。

以下の式は `x` に格納されている式と等価です。
```python
x.min_val + qbpp.sum(x.vars * x.coeffs)
```
