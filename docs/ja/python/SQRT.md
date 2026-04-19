---
layout: default
nav_exclude: true
title: "Square Root"
nav_order: 42
lang: ja
hreflang_alt: "en/python/SQRT"
hreflang_lang: "en"
---

# 平方根

この例では、大きな整数を用いて $c=2$ の平方根を計算する方法を示します。
$s = 10^{20}$ を固定整数とします。
PyQBPP は実数を直接扱えないため、$\sqrt{c}$ の代わりに $\sqrt{cs^2}$ を計算します。
以下の関係式から、

$$
\begin{aligned}
\sqrt{c} &= \sqrt{cs^2}/s
\end{aligned}
$$

20桁の10進精度で $\sqrt{c}$ の近似値を得ることができます。

## 平方根計算の HUBO 定式化
範囲 $[s, 2s]$ の値を取る整数変数 $x$ を定義します。
次に、以下の等式を用いて問題を定式化します:

$$
\begin{aligned}
x ^ 2 &= cs ^ 2
\end{aligned}
$$

PyQBPP では、この等式制約は以下の HUBO 式に変換されます:

$$
(x ^ 2 -cs^2)^2
$$

この式を最小化する $x$ の値を見つけることで、20桁の10進精度で $c$ の平方根の近似値を得ます。
$x$ は内部的にバイナリ変数の線形式として表現されるため、この目的関数はバイナリ変数に関して4次式になります。

## PyQBPP プログラム
以下の PyQBPP プログラムは、上記の考え方に基づいて HUBO 式を構築し、Easy Solver を用いて解きます:
```python
import pyqbpp.cppint as qbpp

c = 2
s = 10**20
x = qbpp.var("x", between=(s, c * s))
f = qbpp.constrain(x * x, equal=c * s * s)
f.simplify_as_binary()
solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=10.0)
xv = sol(x)
print(f"sqrt({c}) ≈ {xv} / {s}")
print(f"       = {xv // s}.{xv % s}")
print(f"Energy = {sol.energy}")
```

HUBO 式の係数やエネルギーが 64 bit を超えるため、任意精度の `cpp_int` バリアント (`pyqbpp.cppint`) をインポートしています。
定数 `s`、整数変数 `x`、HUBO 式 `f` は上述の定式化に従って定義されています。
Easy Solver は制限時間10秒で実行されます。パラメータは `search()` の引数として渡します。

得られた整数解 `xv` を商 `xv // s` と剰余 `xv % s` に分け、小数点で連結して 10 進表記を得ます。`float` に変換せず Python の任意精度整数のまま計算するので精度が保たれます。

このプログラムは以下の出力を生成します:
```
sqrt(2) ≈ 141421356237309504880 / 100000000000000000000
       = 1.41421356237309504880
Energy = 2281431565136320033809509291861647360000
```
Easy Solver が正しい近似値を出力していることが確認できます:

$$
 \sqrt{2}\approx 1.41421356237309504880
$$

報告されたエネルギー値はゼロではなく、等式制約は厳密には満たされていないことに注意してください。
これは単に、この等式に対する厳密な整数解が存在しないためです。
代わりに、ソルバーは等式制約の誤差を最小化する解を見つけます。
出力に示されているエネルギー値は、この誤差の2乗に対応しています。
誤差が最小化されるため、得られた $x$ の値は平方根の近似値を表しています。
