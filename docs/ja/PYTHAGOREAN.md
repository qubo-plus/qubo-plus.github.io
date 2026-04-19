---
layout: default
nav_exclude: true
title: "Pythagorean Triples"
nav_order: 1
lang: ja
hreflang_alt: "en/PYTHAGOREAN"
hreflang_lang: "en"
---

# ピタゴラスの三つ組

3つの整数 $x$、$y$、$z$ が以下を満たすとき、**ピタゴラスの三つ組**と呼ばれます:

$$
\begin{aligned}
x^2+y^2&=z^2
\end{aligned}
$$

重複を避けるため、$x<y$ と仮定します。

## ピタゴラスの三つ組を列挙するQUBO++プログラム
以下のプログラムは、$x\leq 16$、$y\leq 16$、$z\leq 16$ の範囲でピタゴラスの三つ組を列挙します:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  auto x = 1 <= qbpp::var_int("x") <= 16;
  auto y = 1 <= qbpp::var_int("y") <= 16;
  auto z = 1 <= qbpp::var_int("z") <= 16;
  auto f = x * x + y * y - z * z == 0;
  auto c = 1 <= y - x <= +qbpp::inf;
  auto g = f + c;
  g.simplify_as_binary();
  auto solver = qbpp::EasySolver(g);
  auto sols = solver.search({{"time_limit", 10.0}, {"best_energy_sols", 10}});
  for (const auto& sol : sols) {
    std::cout << "x=" << sol(x) << ", y=" << sol(y) << ", z=" << sol(z)
              << ", f.body()=" << f.body(sol) << ", c.body()=" << c.body(sol) << std::endl;
  }
}
```
{% endraw %}
このプログラムでは、1から16の範囲の整数変数 `x`、`y`、`z` を定義しています。
次に、2つの制約式を作成します:
- `f`: $x^2+y^2-z^2=0$
- `c`: $x+1\leq y$

これらを `g` に結合します。
すべての制約が満たされたとき、式 `g` は最小値0を取ります。

`g` に対してEasy Solverオブジェクト `solver` を作成し、`search()` に初期化子リストとして以下のオプションを渡します:
- `"time_limit"` を `10.0` に設定: 10秒後に探索を終了します。
- `"best_energy_sols"` を `10` に設定: 最良（最低）エネルギーの解を最大10個保持します。

`search()` の呼び出しは、最良の解を格納する `qbpp::easy_solver::Sols` オブジェクト `sols` を返します。
`qbpp::easy_solver::Sols` は格納された最良エネルギー解へのイテレータアクセス（`begin()`、`end()`、`cbegin()`、`cend()`）を提供するため、範囲ベースのforループで出力できます。

このプログラムは以下のような出力を生成します:
```
x=3, y=4, z=5, f.body()=0, c.body()=1
x=6, y=8, z=10, f.body()=0, c.body()=2
x=9, y=12, z=15, f.body()=0, c.body()=3
x=5, y=12, z=13, f.body()=0, c.body()=7
```
