---
last_modified: 2026-10-10
layout: default
nav_exclude: true
title: "3次方程式"
nav_order: 46
lang: ja
hreflang_alt: "en/python/CUBIC_EQUATION"
hreflang_lang: "en"
---

# 3次方程式
整数上の3次方程式は PyQBPP を使って解くことができます。例えば、次の方程式を考えます:

$$
\begin{aligned}
x^3 -147x +286 &=0.
\end{aligned}
$$

この方程式には3つの整数解があります: $x = -13, 2, 11$。

## 3次方程式を解く PyQBPP プログラム
以下の PyQBPP プログラムでは、$[-100, 100]$ の値を取る[ネイティブ整数変数](NATIVE_INTEGER) x を定義し、全探索ソルバーを使ってすべての最適解を列挙します:
```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(-100, 100))
f = qbpp.cons(x * x * x - 147 * x + 286 == 0)
f.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)

for sol in result.sols:
    print(f"x = {sol(x)} sol = {sol}")
```
`qbpp.var("x", integer=(-100, 100))` で宣言した `x` はバイナリ変数に展開されず、整数のまま扱われます。
方程式を [`qbpp.cons()`](CONSTRAINTS) で囲むと、`f` のエネルギーは違反量の2乗、すなわち

$$
\begin{aligned}
f & = (x^3 -147x +286)^2
\end{aligned}
$$

になり、方程式が成り立つときにだけ最小値0をとります。
全探索ソルバーは `x` の201通りの値をすべて調べ、`best_energy_sols` に0を指定すると、エネルギーが最小のすべての解を返します。
このプログラムは以下の出力を生成します:
{% raw %}
```
x = -13 sol = Sol(energy=0, {x: -13})
x = 2 sol = Sol(energy=0, {x: 2})
x = 11 sol = Sol(energy=0, {x: 11})
```
{% endraw %}
解は `x` の値そのもので表されるので、3つの整数解がちょうど1回ずつ出力されます。

## バイナリ変数で表す整数変数との違い
`between=` で宣言する[整数変数](INTEGER)とペナルティ式で同じ方程式を書くこともできます:
```python
x = qbpp.var("x", between=(-100, 100))
f = (x * x * x - 147 * x + 286 == 0)
```
この場合、`x` は8個のバイナリ変数の線形式として表されるため、`f` は6次の多項式になります。
また、最も重いビットの係数が2のべき乗ではない（$-100$ から $100$ までを表すために `73` になる）ため、同じ整数値を表すバイナリ変数の割り当てが複数あり、同じ解が重複して出力されます。
さらに、展開した多項式の係数が32ビット整数に収まらないため、[`pyqbpp.cppint`](VAREXPR) などの広い整数型が必要です。
ネイティブ整数変数と `qbpp.cons()` を使えば、式は3次のままで、重複もなく、既定の `pyqbpp` で解けます。
