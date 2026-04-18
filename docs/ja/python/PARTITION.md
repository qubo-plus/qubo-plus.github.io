---
layout: default
nav_exclude: true
title: "Partitioning Problem"
nav_order: 5
lang: ja
hreflang_alt: "en/python/PARTITION"
hreflang_lang: "en"
---

# 変数配列を用いた分割問題の求解

## 分割問題
$w=(w_0, w_1, \ldots, w_{n-1})$ を $n$ 個の正の数とします。
**分割問題**とは、これらの数を2つの集合 $P$ と $Q$ ($=\overline{P}$) に分割し、両集合の要素の和ができるだけ近くなるようにする問題です。
より具体的には、以下を最小化する部分集合 $L \subseteq \lbrace 0,1,\ldots, n-1\rbrace$ を求めます：

$$
\begin{aligned}
P(L) &= \sum_{i\in L}w_i \\
Q(L) &= \sum_{i\not\in L}w_i \\
f(L) &= \left| P(L)-Q(L) \right|
\end{aligned}
$$

この問題はQUBO問題として定式化できます。
集合 $L$ を表すバイナリ変数 $x=(x_0, x_1, \ldots, x_{n-1})$ を導入します。
すなわち、$i\in L$ であることと $x_i=1$ であることは同値です。
$P(L)$、$Q(L)$、$f(L)$ を $x$ を用いて次のように書き換えられます：

$$
\begin{aligned}
P(x) &= \sum_{i=0}^{n-1} w_ix_i \\
Q(x) &= \sum_{i=0}^{n-1} w_i \overline{x_i} \\
f(x)    &= \left( P(x)-Q(x) \right)^2
\end{aligned}
$$

ここで $\overline{x_i}$ は $x_i$ の**否定リテラル**であり、$x_i=0$ のとき $1$、$x_i=1$ のとき $0$ を取ります。
数学的には $\overline{x_i} = 1 - x_i$ ですが、PyQBPPは否定リテラルを `~` 演算子（例: `~x[i]`）でネイティブに扱えるため、$1 - x_i$ への展開を避けて効率的に処理できます。
詳細は**[否定リテラル](NEGATIVE)**を参照してください。

明らかに $f(x)=f(L)^2$ が成り立ちます。
関数 $f(x)$ は $x$ の2次式であり、$f(x)$ を最小化する最適解は元の分割問題の最適解を与えます。

## 分割問題のPyQBPPプログラム
以下のプログラムは、8個の数の固定集合に対する分割問題のQUBO定式化を作成し、Exhaustive Solverを用いて解を求めます。

```python
import pyqbpp as qbpp

w = [64, 27, 47, 74, 12, 83, 63, 40]

x = qbpp.var("x", shape=len(w))
p = qbpp.expr()
q = qbpp.expr()
for i in range(len(w)):
    p += w[i] * x[i]
    q += w[i] * ~x[i]
f = qbpp.sqr(p - q)
print("f =", f.simplify_as_binary())

solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()

print("Solution:", sol)
print("f(sol) =", sol(f))
print("p(sol) =", sol(p))
print("q(sol) =", sol(q))

print("P :", end="")
for i in range(len(w)):
    if sol(x[i]) == 1:
        print(f" {w[i]}", end="")
print()

print("Q :", end="")
for i in range(len(w)):
    if sol(x[i]) == 0:
        print(f" {w[i]}", end="")
print()
```

このプログラムでは、**`w`** は8個の数を持つPythonリストです。
`len(w)=8` 個のバイナリ変数の配列 **`x`** を定義します。
2つの式 **`p`** と **`q`** を定義し、forループで $P(x)$ と $Q(x)$ の式を構築します。
ここで **`~x[i]`** は `x[i]` の否定リテラル $\overline{x_i}$ を表します。
式 **`f`** に $f(x)$ の式を格納します。

`f` に対するExhaustive Solverオブジェクト **`solver`** を作成し、
`search()` メソッドを呼び出して解 **`sol`** を取得します。

$f(x)$、$P(x)$、$Q(x)$ の値は、それぞれ **`sol(f)`**、**`sol(p)`**、**`sol(q)`** で評価します。
集合 $L$ と $\overline{L}$ に含まれる数はforループで表示します。
これらのループでは、**`sol(x[i])`** が `sol` における `x[i]` の値を返します。

このプログラムの出力は以下の通りです：
```
f = 168100 -88576*x[0] ...
Solution: Sol(energy=0, {x[0]: 0, x[1]: 0, x[2]: 1, x[3]: 0, x[4]: 1, x[5]: 1, x[6]: 1, x[7]: 0})
f(sol) = 0
p(sol) = 205
q(sol) = 205
P : 47 12 83 63
Q : 64 27 74 40
```

> **注釈**
> 式 `f` と解 `sol` に対して、**`f(sol)`** と **`sol(f)`** はどちらも `sol` 上で `f` を評価した値を返します。
> 同様に、変数 `a` に対して、**`a(sol)`** と **`sol(a)`** はどちらも解 `sol` における `a` の値を返します。
> **`f(sol)`** の形式は、関数をある点で評価することに対応するため、**数学的な観点**からは自然です。
> 一方、**`sol(f)`** は解オブジェクトが式を評価するという、**オブジェクト指向プログラミングの観点**からは自然です。
> 好みに応じてどちらの形式を使用しても構いません。

## 配列演算を用いたPyQBPPプログラム
PyQBPPにはコードを簡潔にするための豊富な配列演算があります。

以下のコードでは、`w` は整数のPythonリストです。
Pythonリストと array の乗算（例: `w * x`）では、PyQBPPの `__rmul__` が自動的に要素ごとの乗算を行います。
オーバーロード演算子 `*` は要素ごとの乗算を行うため、
**`qbpp.sum(w * x)`** は $P(L)$ を表す式を返します。
変数の配列に対する `~` 演算子は否定リテラルの配列を返します。
したがって、**`qbpp.sum(w * ~x)`** は $Q(L)$ を格納する式を返します。

```python
import pyqbpp as qbpp

w = [64, 27, 47, 74, 12, 83, 63, 40]
x = qbpp.var("x", shape=len(w))
p = qbpp.sum(w * x)
q = qbpp.sum(w * ~x)
f = qbpp.sqr(p - q)
```

これらの配列演算を使用することで、PyQBPPプログラムを簡潔に記述できます。

> **注釈**
> 演算子 `+`、`-`、`*` は、2つの配列間、およびスカラーと配列間の両方でオーバーロードされています。
> 2つの配列の場合、オーバーロード演算子は要素ごとの演算を行います。
> スカラーと配列の場合、オーバーロード演算子は配列の各要素にスカラー演算を適用します。
