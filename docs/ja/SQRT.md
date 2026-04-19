---
layout: default
nav_exclude: true
title: "Square Root"
nav_order: 3
lang: ja
hreflang_alt: "en/SQRT"
hreflang_lang: "en"
---

# 平方根

この例では、`qbpp::cpp_int` で表現される大きな整数を用いて、$c=2$ の平方根を計算する方法を示します。
$s = 10^{20}$ を固定の整数とします。
QUBO++ は実数を直接扱えないため、$\sqrt{c}$ の代わりに $\sqrt{cs^2}$ を計算します。
以下の関係式から、

$$
\begin{aligned}
\sqrt{c} &= \sqrt{cs^2}/s
\end{aligned}
$$

$\sqrt{c}$ の20桁精度の近似値を得ることができます。

## 平方根計算のHUBO定式化
整数変数 $x$ を $[s, 2s]$ の範囲で定義します。
次の等式を用いて問題を定式化します:

$$
\begin{aligned}
x ^ 2 &= cs ^ 2
\end{aligned}
$$

QUBO++ では、この等式制約は以下のHUBO式に変換されます:

$$
(x ^ 2 -cs^2)^2
$$

この式を最小化する $x$ の値を求めることで、$c$ の平方根の10桁精度の近似値が得られます。
$x$ は内部的にバイナリ変数の線形式として表現されるため、この目的関数はバイナリ変数に関して4次式になります。

## QUBO++ プログラム
以下のQUBO++プログラムは、上記のアイデアに基づいてHUBO式を構築し、Easy Solverを用いて解きます:
{% raw %}
```cpp
#define INTEGER_TYPE_CPP_INT

#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  const int c = 2;
  auto s = qbpp::integer("100000000000000000000");
  auto x = s <= qbpp::var_int("x") <= c * s;
  auto f = x * x == c * s * s;
  f.simplify_as_binary();
  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"time_limit", 10.0}});
  auto xv = sol(x);
  std::cout << "sqrt(" << c << ") ≈ " << xv << " / " << s << std::endl;
  std::cout << "       = " << (xv / s) << "." << (xv % s) << std::endl;
  std::cout << "Energy = " << sol.energy() << std::endl;
}
```
{% endraw %}

非常に大きな係数を使用するため、ヘッダのインクルード前に `INTEGER_TYPE_CPP_INT` を定義し、`coeff_t` と `energy_t` を任意精度整数 `cpp_int` に設定しています。
定数 `s`、整数変数 `x`、HUBO式 `f` は上述の定式化に従って定義されています。
Easy Solverは制限時間10秒で実行されます。

得られた整数解 `xv` を商 `xv / s` と剰余 `xv % s` に分け、小数点で連結して 10 進表記を得ます。`double` に変換せず cpp_int の整数演算のみで精度を保っています。

このプログラムの出力は以下のとおりです:
```
sqrt(2) ≈ 141421356237309504880 / 100000000000000000000
       = 1.41421356237309504880
Energy = 2281431565136320033809509291861647360000
```
Easy Solverが正しい近似値を出力していることが確認できます:

$$
 \sqrt{2}\approx 1.41421356237309504880
$$

報告されたエネルギー値がゼロではなく、等式制約が厳密には満たされていないことに注意してください。
これは、等式を厳密に満たす整数解が存在しないためです。
代わりに、ソルバーは等式制約の誤差を最小化する解を見つけます。
出力に表示されるエネルギー値は、この誤差の二乗に相当します。
誤差が最小化されるため、得られた $x$ の値は平方根の近似値を表しています。
