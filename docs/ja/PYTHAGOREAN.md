---
last_modified: 2026-10-10
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
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto x = 1 <= qbpp::int_var("x") <= 16;
  auto y = 1 <= qbpp::int_var("y") <= 16;
  auto z = 1 <= qbpp::int_var("z") <= 16;
  auto f = x * x + y * y - z * z;
  auto c = y - x;
  auto g = qbpp::cons(f == 0) + qbpp::cons(c >= 1);
  g.simplify_as_binary();
  auto solver = qbpp::ExhaustiveSolver(g);
  auto sols = solver.search({{"best_energy_sols", 0}});
  for (const auto& sol : sols) {
    std::cout << "x=" << sol(x) << ", y=" << sol(y) << ", z=" << sol(z)
              << ", f=" << sol(f) << ", c=" << sol(c) << std::endl;
  }
}
```
{% endraw %}
このプログラムでは、1から16の範囲の[ネイティブ整数変数](NATIVE_INTEGER) `x`、`y`、`z` を定義しています。
次に、2つの式を作成します:
- `f`: $x^2+y^2-z^2$
- `c`: $y-x$

等式 $f=0$ と不等式 $c\geq 1$（すなわち $x+1\leq y$）を [`qbpp::cons()`](CONSTRAINTS) で制約として宣言し、`g` にまとめます。
すべての制約が満たされたとき、式 `g` は最小値0を取ります。

`g` に対してExhaustive Solverオブジェクト `solver` を作成し、`search()` に `"best_energy_sols"` を `0` として渡すと、最良（最低）エネルギーを共有する解がすべて返されます（`0` は無制限）。
`x`、`y`、`z` は整数のまま扱われるので、同じ三つ組が重複して返されることはありません。
返された `sols` は範囲ベースのforループで出力できます。

このプログラムは以下の出力を生成します:
```
x=3, y=4, z=5, f=0, c=1
x=5, y=12, z=13, f=0, c=7
x=6, y=8, z=10, f=0, c=2
x=9, y=12, z=15, f=0, c=3
```

## より大きな範囲を探索する

等式 $x^2+y^2-z^2=0$ と不等式 $x+1\leq y$ は `qbpp::cons()` で**制約**として宣言しているので、
バンドルされたソルバーは、目的関数を最適化しつつ制約を満たす割り当てを探索します。
そのため、はるかに大きな範囲も実用的に探索できます。
以下のプログラムでは範囲を `1..1000` に広げ、目的関数 `-z` を加えることで、
斜辺ができるだけ大きい三つ組をソルバーが返すようにしています:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  auto x = 1 <= qbpp::int_var("x") <= 1000;
  auto y = 1 <= qbpp::int_var("y") <= 1000;
  auto z = 1 <= qbpp::int_var("z") <= 1000;
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
  auto x = 1 <= qbpp::int_var("x") <= 10000;
  auto y = 1 <= qbpp::int_var("y") <= 10000;
  auto z = 1 <= qbpp::int_var("z") <= 10000;
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
