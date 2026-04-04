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
PyQBPPは係数、エネルギー値、定数にPythonのネイティブな `int` 型を使用します。
Pythonの整数は精度に制限がないため、C++版のように `coeff_t` や `energy_t` を指定する必要はありません。

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

- **`pyqbpp.var("name", s1)`**:
  基本名 `"name"` を持つ `pyqbpp.Var` オブジェクトの1次元配列を作成します。
  各要素は `name[i]` として表されます。
  結果の型は `pyqbpp.Array` です。

- **`pyqbpp.var("name", s1, s2)`**:
  基本名 `"name"` を持つ `pyqbpp.Var` オブジェクトの2次元配列（行列）を作成します。
  各要素は `name[i][j]` として表されます。
  結果の型はネストされた `pyqbpp.Array` です。

- **`pyqbpp.var("name", s1, s2, ...)`**:
  基本名 `"name"` を持つ `pyqbpp.Var` オブジェクトの高次元配列を作成します。
  各要素は `name[i][j]...` として表されます。
  結果の型はネストされた `pyqbpp.Array` です。

> **NOTE**
> `"name"` を省略すると、作成順に `"{0}"`、`"{1}"` などの番号付き名前が自動的に割り当てられます。

### 例
```python
import pyqbpp as qbpp

x = qbpp.var("x")          # Single variable named "x"
y = qbpp.var("y", 3)       # Array: y[0], y[1], y[2]
z = qbpp.var("z", 2, 3)    # 2x3 matrix: z[0][0], ..., z[1][2]
a = qbpp.var()             # Single unnamed variable
b = qbpp.var(5)            # Array of 5 unnamed variables
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

- **`pyqbpp.var_int("name")`**:
  内部的に使用されるヘルパーオブジェクト（`pyqbpp.VarIntCore`）を返し、それ自体では `pyqbpp.VarInt` を作成しません。
  `pyqbpp.VarInt` を定義するには、以下に示すように `between()` 関数を使って範囲を指定する必要があります。

- **`pyqbpp.between(pyqbpp.var_int("name"), l, u)`**:
  ここで `l` と `u` は整数でなければなりません。
  この式は名前 `"name"` を持つ `pyqbpp.VarInt` オブジェクトを作成し、
  内部的に範囲 `[l, u]` のすべての整数を表す `pyqbpp.Expr` オブジェクトを含みます。
  内部的に、基礎となる式で使用される `pyqbpp.Var` オブジェクトも作成します。

- **`pyqbpp.between(pyqbpp.var_int("name", s1), l, u)`**:
  基本名 `"name"` と同じ範囲 `[l, u]` を持つ `pyqbpp.VarInt` オブジェクトの1次元配列を作成します。
  各要素は `name[i]` として表されます。
  結果の型は `pyqbpp.Array` です。
  `pyqbpp.VarInt` オブジェクトの高次元配列は、`pyqbpp.Var` オブジェクトと同じ方法で作成できます。

### 例
```python
import pyqbpp as qbpp

x = qbpp.between(qbpp.var_int("x"), 0, 10)       # Integer variable x in [0, 10]
y = qbpp.between(qbpp.var_int("y", 3), -5, 5)    # Array of 3 integer variables in [-5, 5]
z = qbpp.between(qbpp.var_int("z", 2, 3), 1, 8)  # 2x3 matrix of integer variables in [1, 8]
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

### C++ QUBO++ との比較

<table>
<thead>
<tr><th>C++ QUBO++</th><th>PyQBPP</th></tr>
</thead>
<tbody>
<tr><td><code>l &lt;= qbpp::var_int("name") &lt;= u</code></td><td><code>between(var_int("name"), l, u)</code></td></tr>
<tr><td><code>l &lt;= qbpp::var_int("name", s1) &lt;= u</code></td><td><code>between(var_int("name", s1), l, u)</code></td></tr>
<tr><td><code>x.name()</code></td><td><code>x.name</code></td></tr>
<tr><td><code>x.str()</code></td><td><code>str(x)</code></td></tr>
<tr><td><code>x.min_val()</code></td><td><code>x.min_val</code> (property)</td></tr>
<tr><td><code>x.max_val()</code></td><td><code>x.max_val</code> (property)</td></tr>
<tr><td><code>x.vars()</code></td><td><code>x.vars</code> (property)</td></tr>
<tr><td><code>x.coeffs()</code></td><td><code>x.coeffs</code> (property)</td></tr>
</tbody>
</table>
