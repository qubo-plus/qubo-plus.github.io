---
layout: default
nav_exclude: true
title: "Cubic Equation"
nav_order: 7
lang: ja
hreflang_alt: "en/CUBIC_EQUATION"
hreflang_lang: "en"
---

# 3次方程式
QUBO++ を用いて整数上の3次方程式を解くことができます。例えば、次の方程式を考えます:

$$
\begin{aligned}
x^3 -147x +286 &=0.
\end{aligned}
$$

この方程式には3つの整数解があります: $x = -13, 2, 11$。

## 3次方程式を解くQUBO++プログラム
以下のQUBO++プログラムでは、$[-100, 100]$ の範囲の整数変数 x を定義し、Exhaustive Solverを用いてすべての最適解を列挙します:
{% raw %}
```cpp
#define INTEGER_TYPE_CPP_INT

#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto x = -100 <= qbpp::var_int("x") <= 100;
  auto f = x * x * x - 147 * x + 286 == 0;
  f.simplify_as_binary();

  auto solver = qbpp::exhaustive_solver::ExhaustiveSolver(f);
  auto sols = solver.search({{"best_energy_sols", 1}});

  for (const auto& sol : sols) {
    std::cout << "x= " << x(sol) << " sol = " << sol << std::endl;
  }
}
```
{% endraw %}
式 `f` は以下の目的関数に対応します:

$$
\begin{aligned}
f & = (x^3 -147x +286)^2
\end{aligned}
$$

整数変数 `x` はバイナリ変数の線形式として実装されるため、`f` は6次の多項式になります。
このプログラムの出力は以下のとおりです:
{% raw %}
```
x = 11 sol = 0:{{x[0],0},{x[1],1},{x[2],1},{x[3],0},{x[4],0},{x[5],1},{x[6],0},{x[7],1}}
x = 2 sol = 0:{{x[0],0},{x[1],1},{x[2],1},{x[3],0},{x[4],0},{x[5],1},{x[6],1},{x[7],0}}
x = -13 sol = 0:{{x[0],0},{x[1],1},{x[2],1},{x[3],1},{x[4],0},{x[5],0},{x[6],0},{x[7],1}}
x = 2 sol = 0:{{x[0],1},{x[1],0},{x[2],1},{x[3],1},{x[4],1},{x[5],0},{x[6],0},{x[7],1}}
x = -13 sol = 0:{{x[0],1},{x[1],1},{x[2],1},{x[3],0},{x[4],1},{x[5],0},{x[6],1},{x[7],0}}
x = 11 sol = 0:{{x[0],1},{x[1],1},{x[2],1},{x[3],1},{x[4],0},{x[5],1},{x[6],1},{x[7],0}}
```
{% endraw %}
最初の行は、整数変数 `x` が8個のバイナリ変数を用いてエンコードされていることを示しています。
また、元の3次方程式には3つの整数解しかないにもかかわらず、プログラムは6つの最適解を出力しています。
これは、`x[7]` の係数 `73` が2のべき乗ではないため、`x` をエンコードするバイナリ変数の異なる割り当てによって同じ整数値を表現できるためです。

`x` の重複した値を除去するには、`std::unordered_set` を使用するようにプログラムを以下のように変更します:
```cpp
#include <unordered_set>

... omitted ...

  std::unordered_set<qbpp::energy_t> seen;
  for (const auto& sol : sols) {
    const auto xv = x(sol);
    if (!seen.insert(xv).second) continue;
    std::cout << "x = " << xv << " sol = " << sol << "\n";
  }
```
この修正されたプログラムは、以下の重複のない解を出力します:
{% raw %}
```
x = 11 sol = 0:{{x[0],0},{x[1],1},{x[2],1},{x[3],0},{x[4],0},{x[5],1},{x[6],0},{x[7],1}}
x = 2 sol = 0:{{x[0],0},{x[1],1},{x[2],1},{x[3],0},{x[4],0},{x[5],1},{x[6],1},{x[7],0}}
x = -13 sol = 0:{{x[0],0},{x[1],1},{x[2],1},{x[3],1},{x[4],0},{x[5],0},{x[6],0},{x[7],1}}
```
{% endraw %}
