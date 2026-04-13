---
layout: default
nav_exclude: true
title: "Greatest Common Divisor"
nav_order: 4
lang: ja
hreflang_alt: "en/GCD"
hreflang_lang: "en"
---

# 最大公約数 (GCD)
$P$ と $Q$ を2つの正の整数とします。
**最大公約数 (GCD)** の計算はHUBO問題として定式化できます。

$p$、$q$、$r$ を以下の制約を満たす正の整数とします:

$$
\begin{aligned}
  p\cdot r &= P \\
  q\cdot r &=Q
\end{aligned}
$$

明らかに、$r$ は $P$ と $Q$ の公約数です。
したがって、これらの制約を満たす $r$ の最大値が $P$ と $Q$ の最大公約数となります。
そのような $r$ を求めるために、HUBO定式化において $-r$ を目的関数として使用します。

## QUBO++ プログラム
上記のアイデアに基づき、以下のQUBO++プログラムは2つの整数 `P = 858` と `Q = 693` の最大公約数を計算します:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  const int P = 858;
  const int Q = 693;
  auto p = 1 <= qbpp::var_int("p") <= 1000;
  auto q = 1 <= qbpp::var_int("q") <= 1000;
  auto r = 1 <= qbpp::var_int("r") <= 1000;

  auto constraint = (p * r == Q) + (q * r == P);
  auto f = -r + constraint * 1000;

  f.simplify_as_binary();

  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"time_limit", 1.0}});

  std::cout << "GCD = " << sol(r) << std::endl;
  std::cout << sol(p) << " * " << sol(r) << " = " << P << std::endl;
  std::cout << sol(q) << " * " << sol(r) << " = " << Q << std::endl;
}
```
{% endraw %}
このプログラムでは、`p`、`q`、`r` は $[1,1000]$ の範囲の整数変数として定義されています。
式 constraint は、両方の制約が満たされたときにゼロに評価されるように構成されています。

目的関数 `-r` はペナルティ係数 `1000` を掛けた制約項と組み合わされ、結果の式が `f` に格納されます。

EasySolverは `f` を最小化する解を探索します。
得られた `p`、`q`、`r` の値は以下のように出力されます:
```
GCD = 33
21 * 33 = 858
26 * 33 = 693
```
この出力から、858と693の最大公約数が正しく33として得られたことが確認できます。
