---
layout: default
nav_exclude: true
title: "Range Constraints"
nav_order: 9
lang: ja
hreflang_alt: "en/python/RANGE"
hreflang_lang: "en"
---

# 範囲制約と整数線形計画法の求解

## 範囲制約の多項式定式化
$f$ をバイナリ変数の多項式とします。
範囲制約は $l<u$ のもとで **$l\leq f\leq u$** の形式を持ちます。
目標は、範囲制約が満たされるときかつそのときに限り最小値0を取る多項式を設計することです。

鍵となるアイデアは、範囲 $[l,u]$ の値を取る**補助整数変数** $a$ を導入することです。
以下の式を考えます：

$$
\begin{aligned}
g &= (f-a)^2
\end{aligned}
$$

この式 $g$ は $f=a$ のときちょうど最小値0を取ります。
$a$ は $[l,u]$ の任意の整数値を取れるため、
式 $g$ が0になるのは $f$ 自体が同じ範囲内の整数値を取るときかつそのときに限ります。

この補助変数の手法を用いて、PyQBPPは **`constrain()`** 関数により範囲制約を実装しています。

## 整数線形計画法の求解
**整数線形計画法**のインスタンスは、**目的関数**と複数の**線形制約**から構成されます。
例えば、以下の整数線形計画は2つの変数、1つの目的関数、2つの制約を持ちます：

$$
\begin{aligned}
\text{Maximize: } & & & 5x + 4y \\
\text{Subject to: } & && 2x + 3y \le 24 \\
                   & & & 7x + 5y \le 54
\end{aligned}
$$

この問題の最適解は $x=4$, $y=5$ で、目的関数の値は $40$ です。

以下のPyQBPPプログラムは、Easy Solverを使ってこの最適解を求めます：
```python
import pyqbpp as qbpp

x = qbpp.var("x", between=(0, 10))
y = qbpp.var("y", between=(0, 10))
f = 5 * x + 4 * y
c1 = qbpp.constrain(2 * x + 3 * y, between=(0, 24))
c2 = qbpp.constrain(7 * x + 5 * y, between=(0, 54))
g = -f + 100 * (c1 + c2)
g.simplify_as_binary()

solver = qbpp.EasySolver(g)
sol = solver.search(time_limit=1.0)

print(f"x = {sol(x)}, y = {sol(y)}")
print(f"f = {sol(f)}")
print(f"c1 = {sol(c1)}, c2 = {sol(c2)}")
print(f"2x+3y = {sol(c1.body)}, 7x+5y = {sol(c2.body)}")
```

このプログラムでは、
- **`f`** は目的関数を表し、
- **`c1`** と **`c2`** は **`constrain()`** を使って作成された範囲制約を表し、
- **`g`** はそれらを1つの最適化式にまとめたものです。

目標が最大化であるため、目的関数は `-f` として符号を反転しています。
制約 `c1` と `c2` は重み100のペナルティを付けて、高い優先度で満たされるようにしています。

`g` に対してEasy Solverのインスタンスを作成し、制限時間1.0秒を `search()` のパラメータとして渡して探索を実行します。
最適解 `sol` を得た後、プログラムは `x`、`y`、`f`、`c1`、`c2`、および制約本体の式の値を出力します。

プログラムの出力は以下の通りです：
```
x = 4, y = 5
f = 40
c1 = 0, c2 = 0
2x+3y = 23, 7x+5y = 53
```
ここで、
- **`c1`** は制約 `0 <= 2x + 3y <= 24` のペナルティであり、
- **`c1.body`** は線形式 `2x + 3y` を表します。

ソルバーが正しく最適解を見つけていることが確認できます。
