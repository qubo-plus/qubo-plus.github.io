---
last_modified: 2026-09-01
layout: default
nav_exclude: true
title: "分割問題の3通りの定式化"
nav_order: 36
lang: ja
hreflang_alt: "en/PARTITION_FORMULATIONS"
hreflang_lang: "en"
---

# 分割問題の3通りの定式化

QUBO++ では、同じ問題を従来の **2 乗ペナルティ**（`sqr`）、
**非線形関数**（`abs`）、**ネイティブ制約**（`cons()`）の
いずれでも定式化できます。このケーススタディでは
[分割問題](PARTITION)を題材に 3 通りの定式化を並べて書き、
エネルギーの意味・モデルの大きさ・得られる情報の違いを比較します。
非線形関数とネイティブ制約そのものの説明は
[非線形関数とネイティブ制約](CONSTRAINTS)を参照してください。

分割問題は、$n$ 個の正の数 $w_0, w_1, \ldots, w_{n-1}$ を
2 つの集合に分割し、両集合の和 $P$ と $Q$ ができるだけ近くなるように
する問題です（詳細は[分割問題](PARTITION)）。
バイナリ変数 $x_i$ を用いると、2 つの和は

$$
P = \sum_{i=0}^{n-1} w_i x_i, \qquad
Q = \sum_{i=0}^{n-1} w_i \overline{x_i}
$$

と書けます。ここで $\overline{x_i}$ は $x_i$ の否定リテラルです。
以下の 3 つのプログラムは、式 `p`・`q` の構築までは共通で、
目的関数 `f` を作る 1 行だけが異なります。

## 定式化 1: 2 乗ペナルティ `sqr`

差の 2 乗 $(P - Q)^2$ を最小化する、従来の QUBO 定式化です:

{% raw %}
```cpp
#include <qbpp/exhaustive_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto w = qbpp::array({64, 27, 47, 74, 12, 83, 63, 40});
  auto x = qbpp::var("x", w.size());
  auto p = qbpp::sum(w * x);
  auto q = qbpp::sum(w * ~x);
  auto f = qbpp::sqr(p - q);
  f.simplify_as_binary();
  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search();
  std::cout << "(P - Q)^2 = " << sol.energy() << std::endl;
  std::cout << "P = " << sol(p) << ", Q = " << sol(q) << std::endl;
}
```
{% endraw %}

プログラムの出力は以下の通りです:

```
(P - Q)^2 = 0
P = 205, Q = 205
```

`simplify_as_binary()` により、`f` は 2 乗が展開された
2 次の QUBO 多項式になります（展開後の式全体は
[分割問題](PARTITION)のページに示されています）。
展開後は通常の 2 次式なので、QUBO++ のすべてのソルバーはもちろん、
ネイティブ制約に対応しない外部の QUBO ツールでもそのまま扱える、
最も汎用的な形です。一方、エネルギーは差の **2 乗**であり、
差そのものを知るには `p`・`q` を評価する必要があります。

## 定式化 2: 絶対値 `abs`

非線形関数 `qbpp::abs` を使うと、分割問題の目的関数
$|P - Q|$ をそのまま書けます:

{% raw %}
```cpp
#include <qbpp/exhaustive_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto w = qbpp::array({64, 27, 47, 74, 12, 83, 63, 40});
  auto x = qbpp::var("x", w.size());
  auto p = qbpp::sum(w * x);
  auto q = qbpp::sum(w * ~x);
  auto f = qbpp::abs(p - q);
  f.simplify_as_binary();
  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search();
  std::cout << "|P - Q| = " << sol.energy() << std::endl;
  std::cout << "P = " << sol(p) << ", Q = " << sol(q) << std::endl;
}
```
{% endraw %}

プログラムの出力は以下の通りです:

```
|P - Q| = 0
P = 205, Q = 205
```

エネルギーが差 $|P - Q|$ **そのもの**になり、解の質を
直接読み取れます。2 乗の展開は起きず、線形式 $P - Q$ は
展開されないまま関数の本体として扱われます。
`abs` を含む式は、QUBO++ にバンドルされているソルバーが
関数値を直接扱って探索します（対応ソルバーの一覧は
[非線形関数とネイティブ制約](CONSTRAINTS)を参照）。

## 定式化 3: ネイティブ制約 `cons`

「$P - Q = 0$（等分割）」を**制約として宣言**する書き方です。
目的関数はなく、モデルは制約だけからなります:

{% raw %}
```cpp
#include <qbpp/exhaustive_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto w = qbpp::array({64, 27, 47, 74, 12, 83, 63, 40});
  auto x = qbpp::var("x", w.size());
  auto p = qbpp::sum(w * x);
  auto q = qbpp::sum(w * ~x);
  auto f = qbpp::cons(p - q == 0);
  f.simplify_as_binary();
  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search();
  std::cout << "Energy = " << sol.energy() << std::endl;
  std::cout << "P = " << sol(p) << ", Q = " << sol(q) << std::endl;
  std::cout << "violated constraints = " << f.cons(sol) << std::endl;
}
```
{% endraw %}

プログラムの出力は以下の通りです:

```
Energy = 0
P = 205, Q = 205
violated constraints = 0
```

`cons()` で宣言した等式制約の値は違反量の 2 乗 $(P - Q)^2$ なので、
エネルギーの値は定式化 1 と同じです。違いは意味論です —
式は制約として宣言されているため、違反本数を返す `f.cons(sol)` や
制約ごとの違反量を報告する `violations()` が使え、
`target_energy` は「エネルギーが target 以下**かつ全制約充足**」の
ときに探索を停止します。大きなインスタンスを
[EasySolver](EASYSOLVER) で解くときに `target_energy` に 0 を
指定すると、完全分割が見つかった時点で探索を打ち切れます。

## モデルの大きさの比較

3 通りの定式化でソルバーに渡されるモデルの大きさを比べてみます。
`sol.info()` の `var_count`・`term_count` が、それぞれモデルの
変数数と目的関数の多項式の項数です:

{% raw %}
```cpp
#include <qbpp/exhaustive_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto w = qbpp::array({64, 27, 47, 74, 12, 83, 63, 40});
  auto x = qbpp::var("x", w.size());
  auto p = qbpp::sum(w * x);
  auto q = qbpp::sum(w * ~x);

  auto f1 = qbpp::sqr(p - q);
  f1.simplify_as_binary();
  auto s1 = qbpp::ExhaustiveSolver(f1).search();

  auto f2 = qbpp::abs(p - q);
  f2.simplify_as_binary();
  auto s2 = qbpp::ExhaustiveSolver(f2).search();

  auto f3 = qbpp::cons(p - q == 0);
  f3.simplify_as_binary();
  auto s3 = qbpp::ExhaustiveSolver(f3).search();

  std::cout << "sqr : var_count = " << s1.info().get("var_count")
            << ", term_count = " << s1.info().get("term_count") << std::endl;
  std::cout << "abs : var_count = " << s2.info().get("var_count")
            << ", term_count = " << s2.info().get("term_count") << std::endl;
  std::cout << "cons: var_count = " << s3.info().get("var_count")
            << ", term_count = " << s3.info().get("term_count") << std::endl;
}
```
{% endraw %}

プログラムの出力は以下の通りです:

```
sqr : var_count = 8, term_count = 36
abs : var_count = 8, term_count = 0
cons: var_count = 8, term_count = 0
```

`sqr` では 2 乗の展開により、8 個の 1 次項と
$\binom{8}{2} = 28$ 個の 2 次項、計 36 項の QUBO 多項式になります。
`abs`・`cons` では展開は起きません — 目的関数の多項式は空
（`term_count = 0`）で、8 項の線形式 $P - Q$ が関数・制約の
本体としてそのまま保持されます。

一般に $n$ 個の数では、`sqr` の項数は $n(n + 1)/2$ に増えます —
$n = 1000$ なら約 50 万項です。`abs`・`cons` の本体は $n$ 項の
線形式のままなので、モデルの構築も解 1 つの評価も軽く、
インスタンスが大きいほど差が広がります。

## 完全分割が存在しない場合

3 通りのエネルギーの意味の違いは、完全分割
（$P = Q$ となる分割）が存在しないインスタンスで
はっきり現れます。次のプログラムは、最良の分割でも差が 5 になる
8 個の数で 3 通りの定式化を解きます:

{% raw %}
```cpp
#include <qbpp/exhaustive_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto w = qbpp::array({17, 18, 39, 61, 84, 85, 88, 89});
  auto x = qbpp::var("x", w.size());
  auto p = qbpp::sum(w * x);
  auto q = qbpp::sum(w * ~x);

  auto f1 = qbpp::sqr(p - q);
  f1.simplify_as_binary();
  std::cout << "sqr : " << qbpp::ExhaustiveSolver(f1).search().energy()
            << std::endl;

  auto f2 = qbpp::abs(p - q);
  f2.simplify_as_binary();
  std::cout << "abs : " << qbpp::ExhaustiveSolver(f2).search().energy()
            << std::endl;

  auto f3 = qbpp::cons(p - q == 0);
  f3.simplify_as_binary();
  auto sol = qbpp::ExhaustiveSolver(f3).search();
  std::cout << "cons: " << sol.energy()
            << ", violated constraints = " << f3.cons(sol) << std::endl;
  std::cout << "P = " << sol(p) << ", Q = " << sol(q) << std::endl;
}
```
{% endraw %}

プログラムの出力は以下の通りです:

```
sqr : 25
abs : 5
cons: 25, violated constraints = 1
P = 243, Q = 238
```

最適な分割は $P = 243$、$Q = 238$ で、差は 5 です。
`sqr` と `cons` のエネルギーは $5^2 = 25$、`abs` のエネルギーは
5 と、それぞれの定義どおりの値になります。`cons` では
制約 $P - Q = 0$ を満たす分割が存在しないため違反本数が 1 と
報告されますが、ソルバーはエラーにはならず、違反量が最小の解
（= 最良の分割）を返します。制約が満たせないときは最も制約に
近い解が得られる — これがネイティブ制約のソフトな意味論です。

## まとめ

| 定式化 | エネルギー | モデル | 特徴 |
|---|---|---|---|
| `sqr(p - q)` | $(P - Q)^2$ | 2 次式に展開（$n(n+1)/2$ 項） | 最も汎用的。外部の QUBO ツールでも扱える |
| `abs(p - q)` | $\lvert P - Q \rvert$ | 展開なし（$n$ 項の本体） | エネルギーが差そのもの |
| `cons(p - q == 0)` | $(P - Q)^2$ | 展開なし（$n$ 項の本体） | 制約として宣言。違反の集計・`target_energy` に参加 |

どの定式化でも、得られる最適な分割そのものは同じです。
目的の量（差）を直接エネルギーとして読みたいなら `abs`、
「等分割」という制約を宣言して充足を追跡したいなら `cons()`、
ネイティブ制約に対応しない外部の QUBO ツールに渡す必要が
あるなら `sqr` が適しています。対応ソルバーの一覧と詳細な
演算規則は[非線形関数とネイティブ制約](CONSTRAINTS)を
参照してください。不等式制約についての同様の比較は、
[ナップサック問題](KNAPSACK)を
参照してください。
