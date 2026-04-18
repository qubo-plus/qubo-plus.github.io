---
layout: default
nav_exclude: true
title: "Arrays"
nav_order: 4
lang: ja
hreflang_alt: "en/python/VECTOR"
hreflang_lang: "en"
---

# 変数の配列と配列関数

PyQBPPは変数の配列と配列演算をサポートしています。

## 変数配列の定義
バイナリ変数の配列は **`var()`** 関数を使って作成できます。
- **`var("name", shape=size)`** は、指定された `name` を持つ `size` 個の変数からなる配列を返します。

以下のプログラムは、**`x`** という名前の5個の変数からなる配列を定義します。
`x` を表示すると、5つの変数 **`x[0]`**、**`x[1]`**、**`x[2]`**、**`x[3]`**、**`x[4]`** が含まれていることが確認できます。
次に、`f = 0` から始め、`i = 0` から `4` までの for ループで、各変数 `x[i]` を複合演算子 **`+=`** で `f` に加えます。
最後に、`f` を簡約化して表示します。
```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=5)
print(x)
f = 0
for i in range(5):
    f += x[i]
print("f =", f.simplify_as_binary())
```
このプログラムの出力は以下の通りです。
```
[x[0], x[1], x[2], x[3], x[4]]
f = x[0] +x[1] +x[2] +x[3] +x[4]
```

## Sum 関数
ユーティリティ関数 **`sum()`** を使って、バイナリ変数配列の合計を取得できます。
以下のプログラムは `sum()` を使って配列 `x` のすべての変数の合計を計算します。
```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=5)
print(x)
f = qbpp.sum(x)
print("f =", f.simplify_as_binary())
```
このプログラムの出力は、前のプログラムとまったく同じです。

## One-hot 制約の QUBO
バイナリ変数の配列が **one-hot** であるとは、**ちょうど1つの要素が1に等しい**こと、すなわち要素の合計が1に等しいことを意味します。
$X = (x_0, x_1, \ldots, x_{n-1})$ を $n$ 個のバイナリ変数の配列とします。
以下の式 $f(X)$ は、$X$ が one-hot であるとき、かつそのときに限り最小値 0 をとります。

$$
\begin{align}
f(X) &= \left(1 - \sum_{i=0}^{n-1}x_i\right)^2
\end{align}
$$

以下のプログラムは式 $f$ を作成し、すべての最適解を求めます。
```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=5)
f = qbpp.sqr(qbpp.sum(x) - 1)
print("f =", f.simplify_as_binary())

solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)
for i, sol in enumerate(result.sols):
    print(f"({i}) {sol}")
```
関数 **`sum()`** は配列内のすべての変数の合計を計算します。
関数 **`sqr()`** は引数の二乗を計算します。
Exhaustive Solver は、エネルギー値 0 のすべての最適解を以下のように求めます。
```
f = 1 -x[0] -x[1] -x[2] -x[3] -x[4] +2*x[0]*x[1] +2*x[0]*x[2] +2*x[0]*x[3] +2*x[0]*x[4] +2*x[1]*x[2] +2*x[1]*x[3] +2*x[1]*x[4] +2*x[2]*x[3] +2*x[2]*x[4] +2*x[3]*x[4]
(0) Sol(energy=0, {x[0]: 0, x[1]: 0, x[2]: 0, x[3]: 0, x[4]: 1})
(1) Sol(energy=0, {x[0]: 0, x[1]: 0, x[2]: 0, x[3]: 1, x[4]: 0})
(2) Sol(energy=0, {x[0]: 0, x[1]: 0, x[2]: 1, x[3]: 0, x[4]: 0})
(3) Sol(energy=0, {x[0]: 0, x[1]: 1, x[2]: 0, x[3]: 0, x[4]: 0})
(4) Sol(energy=0, {x[0]: 1, x[1]: 0, x[2]: 0, x[3]: 0, x[4]: 0})
```
5つの最適解がすべて表示されます。
