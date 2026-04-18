---
layout: default
nav_exclude: true
title: "Operators and Functions"
nav_order: 11
lang: ja
hreflang_alt: "en/python/OPERATOR"
hreflang_lang: "en"
---

# 基本演算子と関数

## 単項演算子と二項演算子
PyQBPPは、式を構築するための以下の基本的な二項演算子をサポートしています：
- **`+`**: オペランドの和を返します。
- **`-`**: オペランドの差を返します。
- **`*`**: オペランドの積を返します。
- **`/`**: オペランドの商を返します。
除数は整数でなければならず、被除数の定数項とすべての係数は除数で割り切れる必要があります。
- 単項 **`-`**: オペランドの符号を反転した値を返します。
- 単項 **`~`**: 変数の否定リテラルを返します（バイナリ変数 `x` に対して、`~x` は $1-x$ を表します）。

Pythonの演算子オーバーロードは算術演算子についてはC++と同様に振る舞うため、`+`、`-`、`*`、`/` の優先順位は標準的なPythonの演算子優先順位規則に従い、これらについてはC++と等価となります。

以下のプログラムは、これらの演算子を使用して式を構築する方法を示しています：
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = 6 * -(x + 1) * (y - 1)
g = f / 3

print("f =", f)
print("g =", g)
```
このプログラムの出力は以下の通りです：
```
f = 6 -6*x*y +6*x -6*y
g = 2 -2*x*y +2*x -2*y
```

> **注意**
> C++では `qbpp::Expr` が独立した型であるのに対し、PyQBPPでは `+`、`-`、`*`、`/` のPython演算子が `Var`、`Term`、`Expr` クラス上でオーバーロードされています。結果として得られるのは常に式です。

## 複合代入演算子
式を更新するための以下の複合代入演算子もサポートされています：
- **`+=`**: 右辺のオペランドを左辺に加算します。
- **`-=`**: 右辺のオペランドを左辺から減算します。
- **`*=`**: 右辺のオペランドを左辺に乗算します。
- **`/=`**: 左辺のオペランドを右辺で除算します。右辺のオペランドは整数でなければならず、左辺の定数項とすべての係数は割り切れる必要があります。

以下のプログラムは、これらの複合代入演算子を使用して式を更新する方法を示しています：
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = 6 * x + 4

f += 3 * y
print("f =", f)

f -= 12
print("f =", f)

f *= 2 * y
print("f =", f)

f /= 2
print("f =", f)
```
このプログラムの出力は以下の通りです：
```
f = 4 +6*x +3*y
f = -8 +6*x +3*y
f = 12*x*y +6*y*y -16*y
f = 6*x*y +3*y*y -8*y
```

## 二乗関数
PyQBPPは、式の二乗を計算するためのグローバル関数 **`qbpp.sqr()`** と `Expr` クラスのメンバ関数 **`sqr()`** の両方を提供しています。

以下のプログラムでは、式 `f` に対して、グローバル関数 **`qbpp.sqr(f)`** は `f` を変更せずに `f` の二乗を表す新しい式を返します。
一方、メンバ関数 **`f.sqr()`** は `f` をその場でその二乗に置き換えて更新します。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
f = x + 1

print("f =", qbpp.sqr(f))
print("f =", f)

f.sqr()
print("f =", f)
```
このプログラムの出力は以下の通りです：
```
f = 1 +x*x +x +x
f = 1 +x
f = 1 +x*x +x +x
```

## 簡約化関数
式に演算子や関数が適用された後、式は自動的に展開されます。
項をソートし、結果の式を簡約化するには、簡約化関数を明示的に呼び出す必要があります。

PyQBPPは以下の3つの**グローバル簡約化関数**を提供しています：
- **`qbpp.simplify()`**:
同一の項の係数をマージして簡約化された式を返します。
- **`qbpp.simplify_as_binary()`**:
すべての変数がバイナリ値 $0/1$ を取ることを仮定して簡約化された式を返します。
すなわち、恒等式 $x^2=x$ が成り立ちます。
- **`qbpp.simplify_as_spin()`**:
すべての変数がスピン値 $-1/+1$ を取ることを仮定して簡約化された式を返します。すなわち、恒等式 $x^2=1$ が成り立ちます。

以下のプログラムは、これらの簡約化関数の動作を示しています：
```python
import pyqbpp as qbpp

x = qbpp.var("x")
f = qbpp.sqr(x - 1)

print("f =", f)
print("simplified(f) =", qbpp.simplify(f))
print("simplified_as_binary(f) =", qbpp.simplify_as_binary(f))
print("simplified_as_spin(f) =", qbpp.simplify_as_spin(f))
```
このプログラムの出力は以下の通りです：
```
f = 1 +x*x -x -x
simplified(f) = 1 -2*x +x*x
simplified_as_binary(f) = 1 -x
simplified_as_spin(f) = 2 -2*x
```

これらの簡約化関数の**メンバ関数**版も式に対して提供されており、式をその場で簡約化された結果に更新します。

例えば、以下のプログラムは **`simplify()`** を適用して `f` を更新します：
```python
import pyqbpp as qbpp

x = qbpp.var("x")
f = qbpp.sqr(x - 1)

f.simplify()
print("f =", f)
```
このプログラムの出力は以下の通りです：
```
f = 1 -2*x +x*x
```

> **注意**
> PyQBPPでは、**メンバ関数**（例: `f.simplify()`、`f.sqr()`）はオブジェクトをその場で更新しますが、**グローバル関数**（例: `qbpp.simplify(f)`、`qbpp.sqr(f)`）は元のオブジェクトを変更せずに新しいオブジェクトを返します。
