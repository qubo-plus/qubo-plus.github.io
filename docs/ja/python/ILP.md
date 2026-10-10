---
last_modified: 2026-10-10
layout: default
nav_exclude: true
title: "整数線形計画"
nav_order: 74
lang: ja
hreflang_alt: "en/python/ILP"
hreflang_lang: "en"
---

# 整数線形計画法（ILP）
**整数線形計画法（ILP）**の問題は、PyQBPP の[ネイティブ整数変数](NATIVE_INTEGER)と [`qbpp.cons()`](CONSTRAINTS) を使うと、そのままの形で書いて解けます。
例として、以下のILPを考えます:

$$
\begin{aligned}
\text{Maximize:} && 2x_0 +5x_1+5x_2\\
\text{Subject to:} && x_0 + 3 x_1 + x_2 &\leq 12 \\
                &&  x_0 + 2x_2 &\leq 5\\
                && x_1 + x_2 &\leq 4;
\end{aligned}
$$

## PyQBPPプログラム
以下のPyQBPPプログラムは、このILPを定式化し、Easy Solver を使って解きます:
{% raw %}
```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=3, integer=(0, 5))
objective = 2 * x[0] + 5 * x[1] + 5 * x[2]
c1 = x[0] + 3 * x[1] + x[2]
c2 = x[0] + 2 * x[2]
c3 = x[1] + x[2]

f = (-objective + 100 * qbpp.cons(c1 <= 12)
     + 100 * qbpp.cons(c2 <= 5) + 100 * qbpp.cons(c3 <= 4))
f.simplify_as_binary()
solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)
print(f"x0 = {sol(x[0])}, x1 = {sol(x[1])}, x2 = {sol(x[2])}")
print(f"objective = {sol(objective)}")
print(f"c1 = {sol(c1)}, c2 = {sol(c2)}, c3 = {sol(c3)}")
print(f"violated constraints = {f.cons(sol)}")
```
{% endraw %}
このプログラムでは、`x` は3つのネイティブ整数変数の配列であり、それぞれ $[0, 5]$ の範囲の整数値をとります。
`x` はバイナリ変数に展開されず、ソルバーが整数のまま探索します。
目的関数は `objective`、3つの制約の左辺は `c1`、`c2`、`c3` です。
目的関数を最大化するため、`f` では `objective` の符号を反転しています。

各制約を `qbpp.cons()` で囲むと、ソルバーはそれを制約として扱います。
制約を破ると、違反量の2乗に重み `100` を掛けた値がエネルギーに加わります。
重みは、制約を破って目的関数を良くするより、制約を守るほうが得になるように選びます。

Easy Solver は `f` の低エネルギー解を探索し、`sol` として返します。
`f.cons(sol)` は、`sol` が破っている制約の本数です。
プログラムの出力は以下のとおりです:
```
x0 = 2, x1 = 3, x2 = 1
objective = 24
c1 = 12, c2 = 4, c3 = 4
violated constraints = 0
```
目的関数値24の解が得られ、すべての制約が満たされていることが確認できます。

このモデルは線形なので、`qbpp.ScipSolver(f, ilp=True)` のように [MILP ソルバー](MILP_SOLVERS)に ILP として渡すこともできます。
整数をバイナリ変数で表し、制約をペナルティ式で書く方法は、[整数変数](INTEGER)を参照してください。
