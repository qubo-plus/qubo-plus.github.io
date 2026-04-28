---
layout: default
nav_exclude: true
title: "QUBO Problem"
nav_order: 39
lang: ja
hreflang_alt: "en/QUBO"
hreflang_lang: "en"
---

# QUBO 問題

QUBO問題は，次の式 $f$ で定義されることが多いです．

$$
f(X) = \sum_{i=0}^{n-1}\sum_{j=0}^{n-1}w_{i,j}\, x_i x_j
$$

ここで $X = (x_0, x_1, \ldots, x_{n-1})$ は $n$ 個の二値変数，$W = (w_{i,j})$（$0 \leq i, j \leq n-1$）は係数を表す $n \times n$ の行列です．
つまり，行列 $W$ によって QUBO 式が定義されます．
このような形で QUBO 式が与えられた場合，QUBO++ では次のように簡単に式を構築し，解を探索できます．

{% raw %}
```cpp
#include <qbpp/easy_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  int w[3][3] = {{1, -2, 1}, {-4, 3, 2}, {4, 2, -1}};
  auto x = qbpp::var("x", 3);
  auto f = qbpp::toExpr(0);
  for (size_t i = 0; i < 3; ++i) {
    for (size_t j = 0; j < 3; ++j) {
      f += w[i][j] * x[i] * x[j];
    }
  }
  f.simplify_as_binary();
  std::cout << "f = " << f << std::endl;
  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"time_limit", 1}});
  std::cout << "sol = " << sol << std::endl;
}
```
{% endraw %}

このプログラムは $n = 3$ の例です．
$3 \times 3$ の `int` 配列 `w` を定義し，それをもとに式 `f` を構築しています．
`simplify_as_binary()` で二値変数のルール（$x_i^2 = x_i$）を適用して式を整理した後，EasySolver で解探索を行います．
このプログラムを実行すると，次の出力が得られます．

{% raw %}
```
f = x[0] +3*x[1] -x[2] -6*x[0]*x[1] +5*x[0]*x[2] +4*x[1]*x[2]
sol = -2:{{x[0],1},{x[1],1},{x[2],0}}
```
{% endraw %}

## `einsum` を用いたより簡潔な書き方

上の二重 for ループは数式定義をそのまま書き下したものですが，同じ式は
[`qbpp::einsum`](EINSUM) の 1 行で書くこともできます．

{% raw %}
```cpp
#include <qbpp/easy_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto W = qbpp::array({{1, -2, 1}, {-4, 3, 2}, {4, 2, -1}});
  auto x = qbpp::var("x", 3);
  auto f = qbpp::einsum<0>("ij,i,j->", W, x, x);
  f.simplify_as_binary();
  std::cout << "f = " << f << std::endl;
  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"time_limit", 1}});
  std::cout << "sol = " << sol << std::endl;
}
```
{% endraw %}

ここでは `qbpp::array(...)` で $3 \times 3$ の整数配列 `W`（行列
$W = (w_{i,j})$ に対応）を作り，`qbpp::var("x", 3)` で二値変数ベクトル
$X = (x_0, x_1, x_2)$ を作成しています．

subscript `"ij,i,j->"` は数式 $\sum_{i,j} W_{ij}\, x_i\, x_j$ をそのまま
表しています．

- 第 1 入力 `W` はラベル `ij`（行列の行と列）．
- 第 2 入力 `x` はラベル `i`（`W` の行と対応）．
- 第 3 入力 `x` はラベル `j`（`W` の列と対応）．
- 右辺が空なので `i` と `j` は両方とも縮約（総和）され，結果はスカラー
  `Expr` になります．これが `qbpp::einsum<0>` の `OutDim = 0` に対応します．

得られる式 `f`，整理後の形，解はいずれも for ループ版とまったく同じです．
$n$ が大きい場合，`einsum` 版は内部で複数の CPU スレッドを用いて
並列に式を構築するため高速です．