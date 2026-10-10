---
last_modified: 2026-10-10
layout: default
nav_exclude: true
title: "集合被覆"
nav_order: 16
lang: ja
hreflang_alt: "en/SETCOVER"
hreflang_lang: "en"
---

# 最小集合被覆問題
$U$ を全体集合、${\cal 𝐹}=\lbrace S_0, S_1, \ldots S_{m-1}\rbrace$ を $U$ の部分集合の族とします。
部分族 $\cal S\subseteq \cal F$ が $U$ のすべての要素を被覆するとき、すなわち

$$
\begin{aligned}
\bigcup_{S_j\in \cal S}S_j &= U
\end{aligned}
$$

が成り立つとき、$\cal S$ を**集合被覆**と呼びます。

**最小集合被覆問題**は、最小の濃度を持つ集合被覆 $\cal S$ を求める問題です。
ここでは重み付き版を考えます。各部分集合 $S_j$ に重み $w_j$ が与えられ、**総重みが最小の集合被覆**を求めることが目標です。

## 最小集合被覆問題の定式化
$U=\lbrace 0,1,\ldots, n-1\rbrace$ とし、$m$ 個の部分集合 $S_0, S_1, \ldots, S_{m-1}$ が与えられているとします。
$m$ 個のバイナリ変数 $x_0, x_1, \ldots, x_{m-1}$ を導入し、$x_j=1$ は $S_j\in\cal S$ であることを表します。

各要素 $i\in U$ に対して次を定義します:

$$
\begin{aligned}
c_i &=\sum_{j: i\in S_j} x_j && (0\leq i\leq n-1)
\end{aligned}
$$

$c_i\geq 1$ であれば、少なくとも1つの選択された部分集合 $S_j$ が $i$ を被覆しています。
$c_i=0$ であれば、選択された部分集合のいずれも $i$ を被覆していません。
QUBO++ では、各要素の不等式 $c_i\geq 1$ を [`qbpp::cons()`](CONSTRAINTS) で囲んで制約として宣言します。
制約を破ると、違反量の2乗に重みを掛けた値がエネルギーに加わります。

**目的関数**は選択された部分集合の総重みを最小化することです:

$$
\begin{aligned}
\text{objective} &=\sum_{j=0}^{m-1}w_jx_j
\end{aligned}
$$

重み付き最小集合被覆問題の式を次のように構築できます:

$$
\begin{aligned}
f &= \text{objective}+P\times\sum_{i=0}^{n-1}\text{cons}(c_i\geq 1),
\end{aligned}
$$

ここで $P$ は実行可能性を目的関数より優先するための十分大きな正の定数です。

## 最小集合被覆問題のQUBO++プログラム
以下のQUBO++プログラムは、$n=10$ 個の要素と $m=8$ 個の部分集合を持つ重み付き最小集合被覆インスタンスを解きます:
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  const size_t n = 10;
  std::vector<std::vector<size_t>> cover = {
      {0, 1, 2}, {2, 3, 4},       {4, 5, 6},    {6, 7, 8},
      {9, 0, 1}, {1, 3, 5, 7, 9}, {0, 3, 6, 9}, {1, 4, 7, 8}};
  auto cost = qbpp::array({3, 4, 3, 2, 3, 4, 3, 3});
  auto m = cover.size();

  auto x = qbpp::var("x", m);

  auto c = qbpp::expr(n);
  for (size_t i = 0; i < m; ++i) {
    for (size_t j : cover[i]) {
      c[j] += x[i];
    }
  }

  auto objective = qbpp::sum(cost * x);

  auto constraint = qbpp::cons(c >= 1);

  auto f = objective + 1000 * constraint;

  f.simplify_as_binary();
  auto solver = qbpp::ExhaustiveSolver(f);

  auto sol = solver.search();

  std::cout << "objective = " << objective(sol) << std::endl;
  std::cout << "violated constraints = " << f.cons(sol) << std::endl;

  for (size_t i = 0; i < m; ++i) {
    if (sol(x[i]) == 1) {
      std::cout << "Set " << i << ": {";
      for (size_t k = 0; k < cover[i].size(); ++k)
        std::cout << (k ? "," : "") << cover[i][k];
      std::cout << "} cost = " << cost[i] << std::endl;
    }
  }
}
```
このプログラムは $m=8$ 個の**バイナリ変数**の配列 **`x`** と、$n=10$ 個の**式**の配列 **`c`** を定義しています。
各式 `c[j]` は要素 $j\in U$ に対応し、0で初期化されます。
各部分集合 $S_i$ と各要素 $j\in S_i$ に対して、`c[j]` に `x[i]` を加えます。
その結果、`c[j]` は要素 `j` を被覆する選択された部分集合の個数になります。

`c >= 1` は `c` の要素ごとの制約の配列を作り、**`constraint`** はそれらを `qbpp::cons()` でまとめて制約として宣言したものです。
重み付き **`objective`** は `cost` と `x` の内積として定義されます。
`f` では制約の重みを1000とし、実行可能性を優先しています。

次に、Exhaustive Solver を用いて最適解 `sol` を求めます。
プログラムは `objective` の値と、破った制約の本数 `f.cons(sol)` を出力し、最後に選択されたすべての部分集合を一覧表示します。例えば、出力は以下のようになります：
```
objective = 11
violated constraints = 0
Set 0: {0,1,2} cost = 3
Set 2: {4,5,6} cost = 3
Set 3: {6,7,8} cost = 2
Set 6: {0,3,6,9} cost = 3
```
この出力は、総コスト11の実行可能な集合被覆が得られたことを示しています。

`qbpp::cons()` を付けずに `c[j] >= 1` と書くと、通常のペナルティ式になり、補助変数が導入されます。
`qbpp::cons()` で宣言した制約には補助変数が入りません。

## 否定リテラルの積を使うHUBO定式化
[否定リテラル](NEGATIVE)を使うと、被覆制約を積で書くこともできます。
各要素 $i\in U$ に対して、次の式を定義します:

$$
\begin{aligned}
c_i &=\prod_{j: i\in S_j}\bar{x}_j && (0\leq i\leq n-1)
\end{aligned}
$$

選択された部分集合のいずれも $i$ を含まない場合、$i\in S_j$ であるすべての $j$ に対して $x_j=0$ が成り立ち、$c_i=1$ となります。
一方、少なくとも1つの選択された部分集合が $i$ を含む場合、因子 $\bar{x}_j$ の1つが0になるため $c_i=0$ となります。
したがって、$\sum_{i=0}^{n-1}c_i$ はすべての要素が被覆されているときかつそのときに限り0になり、ペナルティとしてそのまま目的関数に加えられます。
プログラムの `c` と `constraint` の部分は次のようになります:
```cpp
  auto c = qbpp::expr(n) + 1;  // initialize all elements to 1
  for (size_t i = 0; i < m; ++i) {
    for (size_t j : cover[i]) {
      c[j] *= ~x[i];
    }
  }

  auto constraint = qbpp::sum(c);
```
`c[j]` の次数は要素 `j` を含む部分集合の個数なので、式は3次以上の項を含みます。
この修正でも、プログラムは同じ最適解を生成します。
