---
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
以下の PyQBPP プログラムでは、$[-100, 100]$ の値を取る整数変数 x を定義し、全探索ソルバーを使ってすべての最適解を列挙します:
```python
import pyqbpp.cppint as qbpp

x = qbpp.var("x", between=(-100, 100))
f = (x * x * x - 147 * x + 286 == 0)
f.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)

for sol in result.sols:
    print(f"x = {sol(x)} sol = {sol}")
```
ここで `qbpp.var("x", between=(-100, 100))` は整数変数 `x` を区間 $[-100, 100]$ で定義する構文です。

式 `f` は以下の目的関数に対応します:

$$
\begin{aligned}
f & = (x^3 -147x +286)^2
\end{aligned}
$$

整数変数 `x` はバイナリ変数の線形式として実装されるため、`f` は6次の多項式になります。

ここではデフォルトの `import pyqbpp as qbpp` ではなく `import pyqbpp.cppint as qbpp` を使っている点に注意してください。デフォルトモジュール `pyqbpp`（`pyqbpp.c32e64` の別名）は係数を 32 ビット整数で保持しますが、$f$ の定数項は $x=-100$ において $(-100^3 + 147\cdot 100 + 286)^2 \approx 9.7\times 10^{11}$ となり、32 ビット範囲を超えてオーバーフローしてしまいます。`pyqbpp.cppint` サブモジュールは係数とエネルギー値の両方を任意精度整数で扱うため、多項式が正確に表現され、ソルバーがエネルギー 0 の解を見つけられます。目安として、展開後の HUBO/QUBO 多項式の係数が $2^{31}-1 \approx 2.1 \times 10^9$ を超え得る場合は `pyqbpp.cppint` に切り替えるとよいでしょう。

このプログラムは以下の出力を生成します:
{% raw %}
```
x = 11 sol = Sol(energy=0, {x[0]: 0, x[1]: 1, x[2]: 1, x[3]: 0, x[4]: 0, x[5]: 1, x[6]: 0, x[7]: 1})
x = 2 sol = Sol(energy=0, {x[0]: 0, x[1]: 1, x[2]: 1, x[3]: 0, x[4]: 0, x[5]: 1, x[6]: 1, x[7]: 0})
x = -13 sol = Sol(energy=0, {x[0]: 0, x[1]: 1, x[2]: 1, x[3]: 1, x[4]: 0, x[5]: 0, x[6]: 0, x[7]: 1})
x = 2 sol = Sol(energy=0, {x[0]: 1, x[1]: 0, x[2]: 1, x[3]: 1, x[4]: 1, x[5]: 0, x[6]: 0, x[7]: 1})
x = -13 sol = Sol(energy=0, {x[0]: 1, x[1]: 1, x[2]: 1, x[3]: 0, x[4]: 1, x[5]: 0, x[6]: 1, x[7]: 0})
x = 11 sol = Sol(energy=0, {x[0]: 1, x[1]: 1, x[2]: 1, x[3]: 1, x[4]: 0, x[5]: 1, x[6]: 1, x[7]: 0})
```
{% endraw %}
最初の行は、整数変数 `x` が8個のバイナリ変数を用いてエンコードされていることを示しています。
また、元の3次方程式には3つの整数解しかないにもかかわらず、プログラムは6つの最適解を出力しています。
これは、`x[7]` の係数 `73` が2のべき乗ではないため、`x` をエンコードするバイナリ変数の異なる割り当てによって同じ整数値を表現できるためです。

`x` の重複した値を除去するには、`set` を使用するようにプログラムを以下のように変更します:
```python
seen = set()
for sol in result.sols:
    xv = sol(x)
    if xv in seen:
        continue
    seen.add(xv)
    print(f"x = {xv} sol = {sol}")
```
この修正されたプログラムは、以下の重複のない解を出力します:
{% raw %}
```
x = 11 sol = Sol(energy=0, {x[0]: 0, x[1]: 1, x[2]: 1, x[3]: 0, x[4]: 0, x[5]: 1, x[6]: 0, x[7]: 1})
x = 2 sol = Sol(energy=0, {x[0]: 0, x[1]: 1, x[2]: 1, x[3]: 0, x[4]: 0, x[5]: 1, x[6]: 1, x[7]: 0})
x = -13 sol = Sol(energy=0, {x[0]: 0, x[1]: 1, x[2]: 1, x[3]: 1, x[4]: 0, x[5]: 0, x[6]: 0, x[7]: 1})
```
{% endraw %}
