---
last_modified: 2026-10-10
layout: default
nav_exclude: true
title: "3桁演算"
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
{% raw %}
```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(1, 9))
y = qbpp.var("y", integer=(0, 9))
t = qbpp.var("t", integer=(0, 4))
z = 2 * t + 1
v = x * 100 + y * 10 + z

f = qbpp.cons(x * y * z == 252)

f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)
for sol in result.sols:
    print(sol(v), end=" ")
print()
```
{% endraw %}
このプログラムでは、**`x`**、**`y`**、**`t`** を上記の範囲の[ネイティブ整数変数](NATIVE_INTEGER)として定義します。
次に **`z`**、**`v`**、**`f`** を式として定義します。
`f` は条件 $xyz = 252$ を [`qbpp.cons()`](CONSTRAINTS) で制約として宣言したもので、条件が成り立つときにだけエネルギーが最小値0になります。
`f` に対するExhaustive Solverインスタンスを作成し、すべての最適解を `result.sols` に格納します。

`x`、`y`、`t` は整数のまま扱われるので、1つの解が1つの数字の組 (`x`,`y`,`z`) に対応し、同じ組が重複して現れることはありません。
各解の `v` の値を出力すると、以下のようになります：
```
479 497 667 749 947
```
