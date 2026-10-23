---
last_modified: 2026-10-14
layout: default
nav_exclude: true
title: "円周率に近い分数"
nav_order: 68
lang: ja
hreflang_alt: "en/PI_FRACTION"
hreflang_lang: "en"
---

# 円周率に近い分数

円周率 $\pi = 3.14159265\ldots$ に近い分数としては、$22/7$ や $355/113$ がよく知られています。
このページでは、分子と分母がどちらも 5 桁の整数である分数のうち、$\pi$ に最も近いものを EasySolver で求めます。

## 問題

$10000 \le p, q \le 99999$ の整数 $p$、$q$ で

$$
\left\lvert \frac{p}{q} - \pi \right\rvert
$$

を最小にするものを求めます。

割り算を含む式は多項式で書けないので、代わりに次の値を最小にします:

$$
\lvert p - \pi q \rvert = q \left\lvert \frac{p}{q} - \pi \right\rvert
$$

$q$ 倍しているので、一般には 2 つの値を最小にする分数が同じとは限りません。
この問題では同じ分数になります（$q$ を 1 つずつ全部調べると確かめられます）。

また、QUBO++ の係数は整数なので、$\pi$ を小数点以下 13 桁に丸めた $31415926535898 / 10^{13}$ で置き換えて $10^{13}$ 倍した

$$
\left\lvert 10^{13} p - 31415926535898\, q \right\rvert
$$

を最小にします。

## プログラム

{% raw %}
```cpp
#define INTEGER_TYPE_C64E64
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  auto p = 10000 <= qbpp::int_var("p") <= 99999;
  auto q = 10000 <= qbpp::int_var("q") <= 99999;
  // π ≈ 31415926535898 / 10^13
  auto f = qbpp::abs(10000000000000 * p - 31415926535898 * q);
  f.simplify();
  std::cout << "f = " << f << std::endl;

  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"time_limit", 1.0}});
  std::cout << "p/q = " << sol(p) << "/" << sol(q) << ", energy = " << sol.energy()
            << std::endl;
}
```
{% endraw %}

[ネイティブ整数変数](INTEGER) `int_var` で $p$、$q$ を 10000〜99999 の整数として定義し、
[絶対値](CONSTRAINTS#絶対値-abs) `qbpp::abs()` で目的関数 `f` を作ります。

このプログラムの出力は次のとおりです:
```
f = abs(10000000000000*p -31415926535898*q, 1)
p/q = 99733/31746, energy = 3808617908
```

- 求める分数は $99733/31746 = 3.1415926415\ldots$ で、$\pi$ との差は $1.2 \times 10^{-8}$ です。$355/113$（5 桁にすると $31595/10057$）の差 $2.7 \times 10^{-7}$ より 20 倍以上近い値です。
- エネルギーは $\lvert 10^{13} p - 31415926535898\, q \rvert$ の値です。$10^{13}$ で割ると $\lvert p - \pi q \rvert \approx 3.8 \times 10^{-4}$ になり、さらに $q$ で割ると $\pi$ との差になります。
- $\pi$ を丸めた誤差は $10^{-13}$ 未満なので、$q$ 倍しても $10^{-8}$ 未満です。最も近い分数と 2 番目に近い分数（$99378/31633$）では $\lvert p - \pi q \rvert$ が $3 \times 10^{-5}$ 違うので、丸めで答えが変わることはありません。
- 係数 $31415926535898$ と式の値（最大で約 $10^{18}$）は 32 ビット整数に収まらないので、先頭の `INTEGER_TYPE_C64E64` で係数とエネルギーを 64 ビット整数にしています（[整数の範囲：coeff_t と energy_t](VAREXPR#整数の範囲coeff_t-と-energy_t)を参照）。
- $q$ を決めると、最も近い $p$ は $\pi q$ に最も近い整数です。また $p \le 99999$ なので $q$ は 31830 以下です。EasySolver は 1 秒もかからずに答えを見つけます。
