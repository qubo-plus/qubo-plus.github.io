---
layout: default
nav_exclude: true
title: "ピタゴラスの三つ組"
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
  auto c = y - x >= 1;
  auto g = f + c;
  g.simplify_as_binary();
  auto solver = qbpp::EasySolver(g);
  auto sols = solver.search({{"time_limit", 10.0}, {"best_energy_sols", 0}});
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
- `"best_energy_sols"` を `0` に設定: 最良（最低）エネルギーを共有する解をすべて保持します（`0` は無制限）。

`search()` の呼び出しは、最良の解を格納する `qbpp::easy_solver::Sols` オブジェクト `sols` を返します。
`qbpp::easy_solver::Sols` は格納された最良エネルギー解へのイテレータアクセス（`begin()`、`end()`、`cbegin()`、`cend()`）を提供するため、範囲ベースのforループで出力できます。

このプログラムは以下のような出力を生成します:
```
x=3, y=4, z=5, f.body()=0, c.body()=1
x=6, y=8, z=10, f.body()=0, c.body()=2
x=9, y=12, z=15, f.body()=0, c.body()=3
x=5, y=12, z=13, f.body()=0, c.body()=7
```

## `qbpp::cons()` を使ってより大きな範囲を探索する

等式 $x^2+y^2-z^2=0$ と不等式 $x+1\leq y$ は、`qbpp::cons()` で囲むことで
**制約**として記述できます。バンドルされたソルバーは、目的関数を最適化しつつ
制約を満たす割り当てを探索するため、はるかに大きな範囲を実用的に探索できます。
以下のプログラムでは範囲を `1..1000` に広げ、目的関数 `-z` を加えることで、
斜辺ができるだけ大きい三つ組をソルバーが返すようにしています:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  auto x = 1 <= qbpp::var_int("x") <= 1000;
  auto y = 1 <= qbpp::var_int("y") <= 1000;
  auto z = 1 <= qbpp::var_int("z") <= 1000;
  auto f = -qbpp::toExpr(z)  // 斜辺 z を最大化
         + 2000 * qbpp::cons(x * x + y * y - z * z == 0)
         + 2000 * qbpp::cons(y - x >= 1);
  f.simplify_as_binary();
  auto sol = qbpp::EasySolver(f).search({{"time_limit", 15.0}});
  std::cout << "x=" << sol(x) << ", y=" << sol(y) << ", z=" << sol(z)
            << ", violations=" << f.cons(sol) << std::endl;
}
```
{% endraw %}
ここで `f.cons(sol)` は違反した制約の本数を返します。`0` は、返された三つ組が
`y > x` を満たす正しいピタゴラス数であることを意味します。典型的な出力は次の
とおりです:
```
x=352, y=936, z=1000, violations=0
```

## `c64e128` で大きな整数を扱う

大きな整数範囲では、ソルバーが扱う途中の値が64ビット整数の範囲を超えることが
あります。その場合は、プログラム先頭に `#define INTEGER_TYPE_C64E128` を置いて
`c64e128` 型（64ビット係数・128ビットエネルギー）を選択します。以下は範囲を
`1..10000` にした版です:
{% raw %}
```cpp
#define INTEGER_TYPE_C64E128

#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  auto x = 1 <= qbpp::var_int("x") <= 10000;
  auto y = 1 <= qbpp::var_int("y") <= 10000;
  auto z = 1 <= qbpp::var_int("z") <= 10000;
  auto f = -qbpp::toExpr(z)  // 斜辺 z を最大化
         + 20000 * qbpp::cons(x * x + y * y - z * z == 0)
         + 20000 * qbpp::cons(y - x >= 1);
  f.simplify_as_binary();
  auto sol = qbpp::EasySolver(f).search({{"time_limit", 20.0}});
  std::cout << "x=" << sol(x) << ", y=" << sol(y) << ", z=" << sol(z)
            << ", violations=" << f.cons(sol) << std::endl;
}
```
{% endraw %}
典型的な出力は次のとおりです:
```
x=3520, y=9360, z=10000, violations=0
```
利用可能な整数型は[変数・式クラス](VAREXPR)に一覧があります。
