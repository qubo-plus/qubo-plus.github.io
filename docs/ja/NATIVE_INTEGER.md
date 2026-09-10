---
last_modified: 2026-08-24
layout: default
nav_exclude: true
title: "ネイティブ整数変数"
nav_order: 52
lang: ja
hreflang_alt: "en/NATIVE_INTEGER"
hreflang_lang: "en"
---

# ネイティブ整数変数

[整数変数と連立方程式の求解](INTEGER)では，複数のバイナリ変数を組み合わせて
整数を表現する方法を説明しました．QUBO++ はこれに加えて，
**整数値をそのまま保持するネイティブ整数変数**をサポートしています．
`qbpp::int_var()` で宣言した変数はバイナリ変数に展開されず，
QUBO++ にバンドルされているソルバー
（[EasySolver](EASYSOLVER)・[ABS3 Solver](ABS3)・[Exhaustive Solver](EXHAUSTIVE)）が
整数値を直接扱って効率よく探索を行います．

## 宣言と基本的な使い方

ネイティブ整数変数は，[整数変数](INTEGER)（`var_int`）と同じ書き方で，
名前と値の範囲（下限・上限）を範囲演算子で指定して宣言します．
範囲の指定は必須です．宣言した変数は通常の変数と同じように式の中で使えます:

{% raw %}
```cpp
#include <qbpp/exhaustive_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto x = 0 <= qbpp::int_var("x") <= 10;
  auto f = x * x - 4 * x;
  f.simplify_as_binary();
  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search();
  std::cout << "x = " << sol(x) << std::endl;
  std::cout << "f = " << sol.energy() << std::endl;
}
```
{% endraw %}

プログラムの出力は以下の通りです:

```
x = 2
f = -4
```

`x * x` のような冪に，バイナリ変数の規則（$x \cdot x = x$）は適用されず，
整数の二乗としてそのまま扱われる点に注意してください．

## 連立方程式を解く例

次のプログラムは，連立方程式 $x + 2y = 700$，$x - y = 100$ を
2 乗誤差の最小化として解きます:

{% raw %}
```cpp
#include <qbpp/easy_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto x = 0 <= qbpp::int_var("x") <= 1000;
  auto y = -1000 <= qbpp::int_var("y") <= 1000;
  auto f = qbpp::sqr(x + 2 * y - 700) + qbpp::sqr(x - y - 100);
  f.simplify_as_binary();
  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"time_limit", 1.0}});
  std::cout << "x = " << sol(x) << ", y = " << sol(y) << std::endl;
  std::cout << "f = " << sol.energy() << std::endl;
}
```
{% endraw %}

プログラムの出力は以下の通りです:

```
x = 300, y = 200
f = 0
```

## 整数変数の配列

`int_var()` に次元を渡すと，ネイティブ整数変数の配列が作れます．
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
  f.simplify_as_binary();
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

## 要素ごとに範囲が異なる配列

配列形の宣言は，全要素が同じ範囲を共有します．範囲の下限・上限に
配列を指定すると，要素ごとに個別の範囲を持つネイティブ整数変数の
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
  f.simplify_as_binary();
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
は下限 0 を全要素で共有します）．

また，[切り出し](BAR_CUTTING)の `var_int` と同じ
プレースホルダの書き方も使えます．`qbpp::int_var("x", 3) == 0` は
全要素が定数 0 の可変配列を作り，各要素にネイティブ整数変数を
ひとつずつ代入できます:

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
  f.simplify_as_binary();
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

## 制約との併用

[ネイティブ制約](CONSTRAINTS)の `qbpp::cons()` は，
ネイティブ整数変数を含む式にもそのまま使えます:

{% raw %}
```cpp
#include <qbpp/exhaustive_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto x = 0 <= qbpp::int_var("x") <= 5;
  auto y = 0 <= qbpp::int_var("y") <= 5;
  auto f = -(2 * x + 3 * y) + 50 * qbpp::cons(x + y == 8);
  f.simplify_as_binary();
  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search();
  std::cout << "x = " << sol(x) << ", y = " << sol(y) << std::endl;
}
```
{% endraw %}

プログラムの出力は以下の通りです:

```
x = 3, y = 5
```

## 外部ソルバーとの連携

MIP ソルバーは整数変数をそのまま
扱えるため，ネイティブ整数変数は**整数の列として直接渡されます**
（バイナリ変数には展開されません）．目的関数が線形で制約を
`qbpp::cons()` で書いたモデルは，`qbpp::ScipSolver solver(f, qbpp::ilp);`
のように ILP オプションを付ければ MIP ソルバー（SCIP, HiGHS, CBC, GLPK）
すべてで解けます．

一方，バイナリ変数専用の外部 QUBO ソルバーに渡す場合は，
`qbpp::binarize()` で[従来のバイナリエンコーディング](INTEGER)に
変換してください:

{% raw %}
```cpp
#include <qbpp/exhaustive_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto x = 0 <= qbpp::int_var("x") <= 10;
  auto f = x * x - 4 * x;
  auto g = qbpp::binarize(f);
  g.simplify_as_binary();
  auto solver = qbpp::ExhaustiveSolver(g);
  auto sol = solver.search();
  std::cout << "minimum = " << sol.energy() << std::endl;
}
```
{% endraw %}

プログラムの出力は以下の通りです:

```
minimum = -4
```

## 使い分けの指針

- 個数・時刻・在庫量など**数量**を表す変数には，ネイティブ整数変数が適しています．
- 外部のバイナリ専用ソルバーに渡すモデルは，
  [バイナリエンコーディングの整数変数](INTEGER)（`var_int`）を使うか，
  `qbpp::binarize()` で変換してください．
- 「どれを選ぶか」という**ラベル**（訪問順序・色など）には，
  ネイティブ整数変数よりも one-hot 表現
  （[置換行列](PERMUTATION)・[One-hot 制約](ONEHOT)）が適しています．

なお，ライセンスの変数数の上限では，ネイティブ整数変数 1 個は，
その範囲（上限 − 下限）を $r$ とすると，次の個数のバイナリ変数分として
カウントされます:

$$
\lceil \log_2 (r+1) \rceil
$$

詳細は[ライセンス管理](LICENSE_MANAGEMENT)を参照してください．
