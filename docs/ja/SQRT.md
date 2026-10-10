---
last_modified: 2026-10-10
layout: default
nav_exclude: true
title: "平方根"
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

## 平方根計算の定式化
[ネイティブ整数変数](NATIVE_INTEGER) $x$ を $[s, 2s]$ の範囲で定義します。
次の等式を用いて問題を定式化します:

$$
\begin{aligned}
x ^ 2 &= cs ^ 2
\end{aligned}
$$

この等式を [`qbpp::cons()`](CONSTRAINTS) で制約として宣言すると、エネルギーは違反量の2乗、すなわち以下の値になります:

$$
(x ^ 2 -cs^2)^2
$$

この式を最小化する $x$ の値を求めることで、$c$ の平方根の20桁精度の近似値が得られます。
$x$ はバイナリ変数に展開されないので、制約の式は $x$ の2次式のままです。

## QUBO++ プログラム
以下のQUBO++プログラムは、上記のアイデアに基づいて式を構築し、Easy Solverを用いて解きます:
{% raw %}
```cpp
#define INTEGER_TYPE_CPP_INT

#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  const int c = 2;
  auto s = qbpp::integer("100000000000000000000");
  auto x = s <= qbpp::int_var("x") <= c * s;
  auto f = qbpp::cons(x * x == c * s * s);
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

式の値が $10^{40}$ 程度になり64ビット整数に収まらないため、ヘッダのインクルード前に `INTEGER_TYPE_CPP_INT` を定義し、`coeff_t` と `energy_t` を任意精度整数 `cpp_int` に設定しています。
定数 `s`、ネイティブ整数変数 `x`、式 `f` は上述の定式化に従って定義されています。
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
