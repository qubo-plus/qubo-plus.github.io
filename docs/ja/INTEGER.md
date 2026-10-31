---
last_modified: 2026-10-30
layout: default
nav_exclude: true
title: "整数変数"
nav_order: 6
lang: ja
hreflang_alt: "en/INTEGER"
hreflang_lang: "en"
---

# 整数変数と連立方程式の求解

QUBO++ では，バイナリ変数に加えて**整数変数**を使えます．
整数変数は値の範囲（下限と上限）を指定して宣言し，
QUBO++ にバンドルされているソルバー
（[Easy Solver](EASYSOLVER)・[Exhaustive Solver](EXHAUSTIVE)・[ABS3 Solver](ABS3)）が
整数値のまま直接探索します．

## 整数変数の宣言

**`qbpp::int_var("name")`** を範囲演算子 **`<= <=`** ではさむと，
その範囲の整数値をとる変数が作られます．範囲の指定は必須です．
宣言した変数は，バイナリ変数と同じように式の中で使えます:

```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto x = 0 <= qbpp::int_var("x") <= 10;
  auto f = x * x - 4 * x;
  f.simplify();
  std::cout << "f = " << f << std::endl;

  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search();
  std::cout << "x = " << sol(x) << std::endl;
  std::cout << "f = " << sol.energy() << std::endl;
}
```

`x` は 0 以上 10 以下の整数値をとる変数で，Exhaustive Solver が
$f = x^2 - 4x$ を最小にする `x` を求めます．
プログラムの出力は以下の通りです:

```
f = -4*x +x*x
x = 2
f = -4
```

`x * x` には，バイナリ変数の規則（$x \cdot x = x$）は適用されず，
整数の 2 乗としてそのまま扱われる点に注意してください．
このように整数変数だけの式は `simplify()` で簡約します．
バイナリ変数を含む式は，バイナリ変数の規則も使う `simplify_as_binary()` で簡約します．
整数変数だけの式にも `simplify_as_binary()` は使えますが，存在しないバイナリ変数の規則を適用しようとするので，効率が悪くなる可能性があります．

## 連立方程式を解く

整数変数を使って，次の連立方程式を解いてみます（解は $x=6$，$y=4$ です）:

$$
\begin{aligned}
x + y &= 10\\
2x+4y &= 28
\end{aligned}
$$

それぞれの方程式の左辺と右辺の差を 2 乗して足した式

$$
\begin{aligned}
f(x,y) &= (x+y-10)^2 + (2x+4y-28)^2
\end{aligned}
$$

は，2 つの方程式が同時に満たされるとき，かつそのときに限り最小値 0 をとります．
したがって，$f(x,y)$ を最小にする $x$ と $y$ が連立方程式の解です．
次のプログラムは，範囲 $[0,10]$ の整数変数 `x`，`y` で $f(x,y)$ を作り，Easy Solver で解きます:

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  auto x = 0 <= qbpp::int_var("x") <= 10;
  auto y = 0 <= qbpp::int_var("y") <= 10;
  auto f = qbpp::sqr(x + y - 10) + qbpp::sqr(2 * x + 4 * y - 28);
  f.simplify();
  std::cout << "f = " << f << std::endl;

  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"target_energy", 0}});
  std::cout << "x = " << sol(x) << ", y = " << sol(y) << std::endl;
  std::cout << "f = " << sol.energy() << std::endl;
}
```
{% endraw %}

最小値が 0 であることが分かっているので，`target_energy` に 0 を指定し，
エネルギー 0 の解が見つかった時点で探索を終了させています．
プログラムの出力は以下の通りです:

```
f = 884 -132*x -244*y +5*x*x +18*x*y +17*y*y
x = 6, y = 4
f = 0
```

`f` は `x` と `y` の 2 次式のまま保持され，ソルバーは `x` と `y` の値を整数のまま探索します．

## 整数変数の配列

`int_var()` に次元を渡すと，整数変数の配列が作れます．
要素には `s[i]` でアクセスし，`qbpp::sum()` で総和の式が作れます:

{% raw %}
```cpp
#include <qbpp/exhaustive_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto s = 0 <= qbpp::int_var("s", 3) <= 9;
  auto t = qbpp::sum(s);
  auto f = qbpp::sqr(t - 6) + qbpp::sqr(s[0] - s[1] + 1) +
           qbpp::sqr(s[1] - s[2] + 1);
  f.simplify();
  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search();
  std::cout << "s = " << sol(s[0]) << ", " << sol(s[1]) << ", " << sol(s[2])
            << std::endl;
  std::cout << "f = " << sol.energy() << std::endl;
}
```
{% endraw %}

プログラムの出力は以下の通りです:

```
s = 1, 2, 3
f = 0
```

配列全体の演算（`s + t`，`2 * s`，`qbpp::sqr(s)`，`s <= 5` のような
要素ごとの制約，`s(qbpp::slice(1, 3))`，`qbpp::vector_sum()`，
`qbpp::concat()`）は `Expr` の配列として扱われ，
`sol(s)` で全要素の値をまとめて取り出せます．
`qbpp::einsum()` に渡すときだけ，`qbpp::toExpr(s)` で `Expr` 配列に
変換してください．

## 要素ごとに範囲が異なる配列

配列形の宣言は，全要素が同じ範囲を共有します．範囲の下限・上限に
配列を指定すると，要素ごとに個別の範囲を持つ整数変数の
配列が作られます．下限と上限が等しい要素は，その値に固定された
定数になります:

{% raw %}
```cpp
#include <qbpp/exhaustive_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  const auto lower = qbpp::array({1, 0, 2});
  const auto upper = qbpp::array({4, 3, 2});
  auto v = lower <= qbpp::int_var("v", 3) <= upper;
  auto f = qbpp::sqr(qbpp::sum(v) - 6) + v[0];
  f.simplify();
  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search();
  std::cout << "v = " << sol(v[0]) << ", " << sol(v[1]) << ", " << sol(v[2])
            << std::endl;
  std::cout << "f = " << sol.energy() << std::endl;
}
```
{% endraw %}

プログラムの出力は以下の通りです（`v[2]` は下限＝上限なので
定数 2 に固定されます）:

```
v = 1, 3, 2
f = 1
```

片側だけ配列にすることもできます（例: `0 <= qbpp::int_var("w", 3) <= upper`
は下限 0 を全要素で共有します）．2 次元以上の配列（例: `qbpp::int_var("x", 3, 4)`）でも
同じように書けます．下限・上限の配列は変数の配列と同じ形にし，形が違うと
`std::invalid_argument` になります．

また，`qbpp::int_var("x", 3) == 0` は全要素が定数 0 の可変配列を作り，
各要素に整数変数をひとつずつ代入できます:

{% raw %}
```cpp
#include <qbpp/exhaustive_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  const auto cap = qbpp::array({3, 1, 2});
  auto x = qbpp::int_var("x", 3) == 0;
  for (size_t j = 0; j < cap.size(); j++) {
    x[j] = 0 <= qbpp::int_var() <= cap[j];
  }
  auto f = qbpp::sqr(qbpp::sum(x) - 5) - x[0] - x[1];
  f.simplify();
  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search();
  std::cout << "x = " << sol(x[0]) << ", " << sol(x[1]) << ", " << sol(x[2])
            << std::endl;
  std::cout << "f = " << sol.energy() << std::endl;
}
```
{% endraw %}

プログラムの出力は以下の通りです:

```
x = 3, 1, 1
f = -4
```

代入しなかった要素は定数（ここでは 0）のまま式に残ります．
定数には 0 以外の値も指定できます．

## 値の評価と置換

宣言した整数変数に値を与えて式の値を求めるには，バイナリ変数と同じく
[評価関数](EVAL) {% raw %}`f({{x, 3}})`{% endraw %} を使います．
与える値は宣言した範囲内でなければなりません（範囲外の値の扱いは後述）．
[置換関数](REPLACE) {% raw %}`qbpp::replace(f, {{x, e}})`{% endraw %} は，式 `f` に現れる `x` をすべて式 `e` に書き換えます．
`x * x` のような冪は出現ごとに置き換えられるので，`x` を `y + 1` で置換すると
$(y+1)^2 + (y+1)$ が展開されます:

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = 0 <= qbpp::int_var("x") <= 10;
  auto y = 0 <= qbpp::int_var("y") <= 10;
  auto f = x * x + x;

  std::cout << "f(3) = " << f({{x, 3}}) << std::endl;

  auto g = qbpp::replace(f, {{x, 2}});
  g.simplify();
  std::cout << "g = " << g << std::endl;

  auto h = qbpp::replace(f, {{x, y + 1}});
  h.simplify();
  std::cout << "h = " << h << std::endl;
}
```
{% endraw %}

プログラムの出力は以下の通りです:

```
f(3) = 12
g = 6
h = 2 +3*y +y*y
```

置換は記号的な書き換えで，`x` の範囲は結果に引き継がれません．
`y + 1` が `x` の範囲に収まるべきだという制約が自動的に付くことはなく，範囲外の定数で置換しても例外にはなりません（下限と上限が等しい固定の整数変数だけは，その値以外で置換すると `std::invalid_argument` になります）．
必要な制約は [`qbpp::cons()`](CONSTRAINTS) で明示してください．
結果の式が整数変数を含むかどうかは，置換に使った式に含まれる変数で決まります
（`y + 1` なら `y` の範囲と整数性がそのまま生きます）．
変数 `x` 自体の宣言は消えず，別の式で引き続き使えます．
なお，評価関数に範囲外の値を与えた場合は例外（`std::invalid_argument`）になります．

## 制約

整数変数を含む式の制約（$2x + 3y \leq 24$ など）は，`qbpp::cons()` で書けます．
[範囲制約と整数線形計画法の求解](RANGE)で説明します．

## 外部ソルバーとの連携

MIP ソルバーは整数変数をそのまま扱えるため，整数変数は**整数の列として直接渡されます**．
目的関数が線形で制約を `qbpp::cons()` で書いたモデルは，`qbpp::ScipSolver solver(f, qbpp::ilp);`
のように ILP オプションを付ければ MIP ソルバー（SCIP, HiGHS, CBC, GLPK）
すべてで解けます．

一方，バイナリ変数しか扱えない外部の QUBO ソルバーに渡す場合は，
整数変数をバイナリ変数で表す必要があります．
その方法は[バイナリエンコードの整数変数](BINARY_INTEGER)で説明します．

## 整数変数と one-hot 表現の使い分け

- 個数・時刻・在庫量など**数量**を表す変数には，整数変数が適しています．
- 「どれを選ぶか」という**ラベル**（訪問順序・色など）には，
  整数変数よりも one-hot 表現
  （[置換行列](PERMUTATION)・[One-hot 制約](ONEHOT)）が適しています．

なお，ライセンスの変数数の上限では，整数変数 1 個は，
その範囲（上限 − 下限）を $r$ とすると，次の個数のバイナリ変数分として
カウントされます:

$$
\lceil \log_2 (r+1) \rceil
$$

詳細は[ライセンス管理](LICENSE_MANAGEMENT)を参照してください．
