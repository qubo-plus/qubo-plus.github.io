---
layout: default
nav_exclude: true
title: "Variables and Expressions"
nav_order: 2
lang: ja
hreflang_alt: "en/python/VARIABLE"
hreflang_lang: "en"
---

# 変数の定義と式の作成

## PyQBPPのインストール
PyQBPPを使用するには、pipでインストールしてください:
```bash
pip install pyqbpp
```

## ライブラリのインポート
PyQBPPを使用するには、**`pyqbpp`**モジュールから必要な関数をインポートします:
```python
import pyqbpp as qbpp
```

## 変数と式の定義
変数は**`var("name")`**を使って定義できます。
指定した`name`は変数を表示する際に使用されます。

式は**`+`**、**`-`**、**`*`**などの標準的な算術演算子を使って構築します。

以下のプログラムは、3つの変数`a`、`b`、`c`と式`f`を定義し、表示します:
```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
f = (a + b - 1) * (b + c - 1)
print("f =", f)
```
式`(a + b - 1) * (b + c - 1)`は自動的に展開され、`f`に格納されます。

このプログラムでは、変数`a`、`b`、`c`はクラス**`Var`**のオブジェクトであり、式`f`はクラス**`Expr`**のオブジェクトです。

プログラムを実行すると、展開された式が表示されます:
```
f = 1 +a*b +b*b +a*c +b*c -a -b -b -c
```

> **NOTE**
> `var()`の変数名は省略可能です。
> 省略した場合、`{0}`、`{1}`、...のようなデフォルト名が自動的に割り当てられます。

> **WARNING**
> 式のテキスト出力は安定性が保証されておらず、今後のリリースで形式が変更される可能性があるため、後続の計算への入力として使用しないでください。

## 式の簡約化
**`Expr`**オブジェクトに格納された式は、**`simplify()`**メンバ関数を呼び出すことで簡約化できます:
```python
print("f =", f.simplify())
```
この変更により、プログラムの出力は以下のようになります:
```
f = 1 -a -2*b -c +a*b +a*c +b*b +b*c
```
メンバ関数呼び出し**`f.simplify()`**は式`f`をその場で簡約化し、自身を返します。

すべての変数が**バイナリ値（0または1）**を取ると仮定すると、恒等式
**$b^2=b$**を使って式をさらに簡約化できます。
この目的には、代わりに**`simplify_as_binary()`**を使用します:
```python
print("f =", f.simplify_as_binary())
```
すると出力は以下のようになります:
```
f = 1 -a -b -c +a*b +a*c +b*c
```

## スピン変数での式の簡約化
変数が**スピン値 -1/+1**を取ると仮定する場合、恒等式**$b^2 = 1$**を使って式をさらに簡約化できます。
この場合、**`simplify_as_spin()`**メンバ関数を使って式を簡約化できます:
```python
print("f =", f.simplify_as_spin())
```
すると出力は以下のようになります:
```
f = 2 -a -2*b -c +a*b +a*c +b*c
```

## 簡約化のグローバル関数
メンバ関数は式をその場で更新します。
`f`を変更したくない場合は、代わりにグローバル関数
**`simplify(f)`**、**`simplify_as_binary(f)`**、**`simplify_as_spin(f)`**を使用できます。これらは`f`を変更せずに簡約化された式を返します。

```python
import pyqbpp as qbpp
g = qbpp.simplify_as_binary(f)  # fは変更されず、gは新しい簡約化された式
```

> **NOTE**
> PyQBPPでは、ほとんどの**メンバ関数**は可能な場合にオブジェクトをその場で更新しますが、**グローバル関数**は元のオブジェクトを変更せずに新しい値を返します。
