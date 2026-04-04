---
layout: default
nav_exclude: true
title: "Remainder Problem"
nav_order: 41
lang: ja
hreflang_alt: "en/python/REMAINDER"
hreflang_lang: "en"
---

# 余り問題
以下の問題は PyQBPP を使って解くことができます。
次の条件を満たす最小の非負整数 $x$ を求めます:

- $x$ を 3 で割った余りが 2、
- $x$ を 5 で割った余りが 3、
- $x$ を 7 で割った余りが 5。

3、5、7 は互いに素であるため、1周期内で $x$ を探索すれば十分です:

$$
 0\leq x \leq 3\times 5\times 7 -1
$$

非負整数 $d_3$、$d_5$、$d_7$（商）を導入し、余りの条件を線形等式として書き直します:

$$
\begin{aligned}
 x - 3d_3 &= 2 \\
 x - 5d_5 &=3 \\
 x - 7d_7 &= 5
\end{aligned}
$$

これらの制約の下で $x$ を最小化したいです。
上記の $x$ の範囲から、商の変数を以下のように制限できます:

$$
\begin{aligned}
 0&\leq d_3 \leq 5\times 7-1 \\
 0&\leq d_5 \leq 3\times 7-1 \\
 0&\leq d_7 \leq 3\times 5-1
\end{aligned}
$$

## PyQBPP プログラム
以下のプログラムは、この余り問題の解 $x$ を求めます:
```python
import pyqbpp as qbpp

x = qbpp.between(qbpp.var_int("x"), 0, 3 * 5 * 7 - 1)
d3 = qbpp.between(qbpp.var_int("d3"), 0, 5 * 7 - 1)
d5 = qbpp.between(qbpp.var_int("d5"), 0, 3 * 7 - 1)
d7 = qbpp.between(qbpp.var_int("d7"), 0, 3 * 5 - 1)
c3 = x - 3 * d3 == 2
c5 = x - 5 * d5 == 3
c7 = x - 7 * d7 == 5
f = x + 1000 * (c3 + c5 + c7)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search({"time_limit": 1.0})

print(f"x = {sol(x)}")
print(f"{sol(x)} - 3 * {sol(d3)} = {sol(c3.body)}")
print(f"{sol(x)} - 5 * {sol(d5)} = {sol(c5.body)}")
print(f"{sol(x)} - 7 * {sol(d7)} = {sol(c7.body)}")
```

3つの制約は `c3`、`c5`、`c7` として表現されています。
それぞれは、対応する等式が成り立つときに 0 となる QUBO ペナルティ項に変換されます。

大きなペナルティ重み（1000）を使って `x` を最小化することで、`x` の削減よりも制約の充足が優先されます。

最後に、Easy Solver がパラメータ辞書で指定された制限時間（1.0秒）内で f の低エネルギー解を探索し、得られた値は以下のように出力されます:
```
x = 68
68 - 3 * 22 = 2
68 - 5 * 13 = 3
68 - 7 * 9 = 5
```
したがって、

$$
\begin{aligned}
x &\equiv 68 & (\bmod 105)
\end{aligned}
$$

最小の解は $x=68$ です。
