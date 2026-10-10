---
last_modified: 2026-10-10
layout: default
nav_exclude: true
title: "剰余問題"
nav_order: 2
lang: ja
hreflang_alt: "en/REMAINDER"
hreflang_lang: "en"
---

# 剰余問題
以下の問題はQUBO++を用いて解くことができます。
次の条件を満たす最小の非負整数 $x$ を求めます:

- $x$ を3で割った余りが2
- $x$ を5で割った余りが3
- $x$ を7で割った余りが5

3、5、7は互いに素であるため、1周期内で $x$ を探索すれば十分です:

$$
 0\leq x \leq 3\times 5\times 7 -1
$$

非負整数 $d_3$、$d_5$、$d_7$（商）を導入し、剰余条件を線形等式として書き直します:

$$
\begin{aligned}
 x - 3d_3 &= 2 \\
 x - 5d_5 &=3 \\
 x - 7d_7 &= 5
\end{aligned}
$$

これらの制約の下で $x$ を最小化したいです。
上記の $x$ の範囲から、商の変数は以下のように制限できます:

$$
\begin{aligned}
 0&\leq d_3 \leq 5\times 7-1 \\
 0&\leq d_5 \leq 3\times 7-1 \\
 0&\leq d_7 \leq 3\times 5-1
\end{aligned}
$$

## QUBO++ プログラム
以下のプログラムは、この剰余問題の解 $x$ を求めます:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  auto x = 0 <= qbpp::int_var("x") <= 3 * 5 * 7 - 1;
  auto d3 = 0 <= qbpp::int_var("d3") <= 5 * 7 - 1;
  auto d5 = 0 <= qbpp::int_var("d5") <= 3 * 7 - 1;
  auto d7 = 0 <= qbpp::int_var("d7") <= 3 * 5 - 1;
  auto c3 = x - 3 * d3;
  auto c5 = x - 5 * d5;
  auto c7 = x - 7 * d7;
  auto f = x + 1000 * (qbpp::cons(c3 == 2) + qbpp::cons(c5 == 3) +
                       qbpp::cons(c7 == 5));
  f.simplify_as_binary();

  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"time_limit", 1.0}});

  std::cout << "x = " << sol(x) << std::endl;
  std::cout << sol(x) << " - 3 * " << sol(d3) << " = " << sol(c3) << std::endl;
  std::cout << sol(x) << " - 5 * " << sol(d5) << " = " << sol(c5) << std::endl;
  std::cout << sol(x) << " - 7 * " << sol(d7) << " = " << sol(c7) << std::endl;
  std::cout << "violated constraints = " << f.cons(sol) << std::endl;
}
```
{% endraw %}

`x` と商 `d3`、`d5`、`d7` は[ネイティブ整数変数](NATIVE_INTEGER)で、バイナリ変数に展開されずに整数のまま探索されます。
3つの等式の左辺を `c3`、`c5`、`c7` とし、各等式を [`qbpp::cons()`](CONSTRAINTS) で制約として宣言します。
制約を破ると、違反量の2乗に重みを掛けた値がエネルギーに加わります。

次に、制約の充足を $x$ の削減よりも優先するために、大きな重み（1000）を用いて `x` を最小化します。

最後に、Easy Solverが制限時間（1.0秒）内で f の低エネルギー解を探索し、得られた値と、破った制約の本数 `f.cons(sol)` は以下のように出力されます:
```
x = 68
68 - 3 * 22 = 2
68 - 5 * 13 = 3
68 - 7 * 9 = 5
violated constraints = 0
```
したがって、

$$
\begin{aligned}
x &\equiv 68 & (\bmod 105)
\end{aligned}
$$

最小の解は $x=68$ です。
