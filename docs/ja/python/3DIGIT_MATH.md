---
layout: default
nav_exclude: true
title: "3-Digit Math"
nav_order: 45
lang: ja
hreflang_alt: "en/python/3DIGIT_MATH"
hreflang_lang: "en"
---

# 3桁の数学問題

以下の数学問題をPyQBPPを用いて解きます。

> **数学問題**：
> **各桁の積**が**252**である3桁の奇数をすべて求めてください。

$x$、$y$、$z$ をそれぞれ百の位、十の位、一の位の数字とします。
より具体的には：
- $x$ は $[1, 9]$ の整数、
- $y$ は $[0, 9]$ の整数、
- $t$ は $[0, 4]$ の整数、
- $z = 2t + 1$（$z$ は奇数）。

3桁の整数 $xyz$ の値 $v$ は

$$
\begin{aligned}
v&=100x+10y+z
\end{aligned}
$$


以下を満たすすべての解を求めます：

$$
\begin{aligned}
xyz &= 252
\end{aligned}
$$

## PyQBPPプログラム
以下のPyQBPPプログラムですべての解を求めます：
```python
import pyqbpp as qbpp

x = qbpp.var("x", between=(1, 9))
y = qbpp.var("y", between=(0, 9))
t = qbpp.var("t", between=(0, 4))
z = 2 * t + 1
v = x * 100 + y * 10 + z

f = qbpp.constrain(x * y * z, equal=252)

f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)
results = set()
for sol in result.sols:
    results.add(sol(v))
for val in sorted(results):
    print(val, end=" ")
print()
```
このプログラムでは、**`x`**、**`y`**、**`t`** を上記の範囲の整数変数として定義します。
次に **`z`**、**`v`**、**`f`** を式として定義します。
`f` に対するExhaustive Solverインスタンスを作成し、すべての最適解を `sols` に格納します。

`x`、`y`、`t` は複数のバイナリ変数でエンコードされるため、異なるバイナリ割り当てが同じ整数値を表す場合があります。
その結果、同じ数字の組 (`x`,`y`,`z`) が `sols` に複数回現れる可能性があります。
そのため、結果の整数値 `v` のみを集めることで `set` を使って重複を除去しています。

出力される整数は以下の通りです：
```
479 497 667 749 947
```
