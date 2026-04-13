---
layout: default
nav_exclude: true
title: "Dominating Set"
nav_order: 14
lang: ja
hreflang_alt: "en/DOMINATING"
hreflang_lang: "en"
---

# 最小支配集合問題
無向グラフ $G=(V,E)$ の支配集合とは、すべての頂点 $u\in V$ が $S$ に含まれるか、$S$ 中の頂点に隣接しているような部分集合 $S\subseteq V$ のことです。

$N(u)=\{v\in V\mid (u,v)\in E\}$ を $u\in V$ の隣接頂点の集合、$N[u]=\{u\}\cup N(u)$ を $u$ の閉近傍とします。
このとき、$S$ が支配集合であるための必要十分条件は

$$
\begin{aligned}
V = \bigcup_{u\in V} N[u].
\end{aligned}
$$

です。

最小支配集合問題は、要素数が最小の支配集合を求める問題です。
$n$ 頂点のグラフ $G=(V,E)$（頂点に $0,1,\ldots,n-1$ のラベルが付いている）に対して、$n$ 個のバイナリ変数 $x_0, x_1, \ldots, x_{n-1}$ を導入します。ここで $x_i=1$ は頂点 $i$ が支配集合 $S$ に含まれる場合です。
否定リテラル $\overline{x}_i$（$\overline{x}_i=1$ は $x_i=0$ のとき）を用いると、以下に示すようにHUBO制約の定式化が簡潔になります。

2つの定式化を示します:
- **HUBO定式化**: 式に高次の項が含まれる場合があります。
- **QUBO定式化**: 式は2次ですが、補助変数を使用します。


## 最小支配集合問題のHUBO定式化
各頂点 $i\in V$ に対して、以下の条件が満たされなければなりません:
- ある $j\in N[i]$ に対して $x_j=1$（すなわち頂点 $i$ が支配されている）。

頂点 $i$ が支配されていないのは、すべての $j\in N[i]$ に対して $x_j=0$ のとき、すなわち $\prod_{j\in N[i]}\overline{x}_j=1$ のときのみです。
したがって、制約を次のように定義します:

$$
\begin{aligned}
\text{constraint} = \sum_{i=0}^{n-1} \prod_{j\in N[i]}\overline{x}_j
\end{aligned}
$$

頂点 $i$ に対する項の次数は $\lvert N[i] \rvert$ であるため、制約は2次にならない場合があります。

目的関数は、選択された頂点の数を最小化することです:

$$
\begin{aligned}
\text{objective} = \sum_{i=0}^{n-1} x_i
\end{aligned}
$$


最終的に、式 $f$ は次のようになります:

$$
\begin{aligned}
f &= \text{objective} + (n+1)\times \text{constraint}
\end{aligned}
$$

ペナルティ係数 $n+1$ は、目的関数の最小化よりも支配集合制約の充足を優先するための安全な値です。

## HUBO定式化のQUBO++プログラム
以下のQUBO++プログラムは、$N=16$ 頂点のグラフに対する解を求めます:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>
#include <qbpp/graph.hpp>

int main() {
  const size_t N = 16;
  std::vector<std::pair<size_t, size_t>> edges = {
      {0, 1},   {0, 2},   {1, 3},   {1, 4},   {2, 5},  {2, 6},
      {3, 7},   {3, 13},  {4, 6},   {4, 7},   {5, 8},  {6, 8},
      {6, 14},  {7, 14},  {8, 9},   {9, 10},  {9, 12}, {10, 11},
      {10, 12}, {11, 13}, {12, 14}, {13, 15}, {14, 15}};

  std::vector<std::vector<size_t>> adj(N);
  for (const auto& e : edges) {
    adj[e.first].push_back(e.second);
    adj[e.second].push_back(e.first);
  }

  auto x = qbpp::var("x", N);

  auto objective = qbpp::sum(x);

  auto constraint = qbpp::toExpr(0);
  for (size_t i = 0; i < N; ++i) {
    auto t = qbpp::toExpr(~x[i]);
    for (size_t j : adj[i]) {
      t *= ~x[j];
    }
    constraint += t;
  }

  auto f = objective + (N + 1) * constraint;
  f.simplify_as_binary();

  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"time_limit", 1.0}});

  std::cout << "objective = " << objective(sol) << std::endl;
  std::cout << "constraint = " << constraint(sol) << std::endl;

  qbpp::graph::GraphDrawer graph;
  for (size_t i = 0; i < N; ++i) {
    graph.add_node(qbpp::graph::Node(i).color(sol(x[i])));
  }
  for (const auto& e : edges) {
    graph.add_edge(qbpp::graph::Edge(e.first, e.second));
  }
  graph.write("dominatingset.svg");
}
```
{% endraw %}
このプログラムは、まず辺リスト `edges` から隣接リスト `adj` を構築します。各 `adj[i]` には頂点 `i` の隣接頂点が格納されます。
次に、HUBO定式化に従って `constraint`、`objective`、`f` を構成します。
Easy Solver を `f` に適用して解 `sol` を求めます。
`sol` に対する `objective` と `constraint` の値が出力され、結果のグラフが `dominatingset.svg` として保存されます。選択された頂点がハイライトされています。

このプログラムは以下の出力を生成します:
```
objective = 5
constraint = 0
```
画像ファイルには以下の画像が格納されています:

<p align="center">
  <img src="images/dominatingset.svg" alt="最小支配集合問題の解" width="80%">
</p>

## QUBO定式化とQUBO++プログラム
頂点 $i$ が支配されているとは、$N[i]\cap S$ が空でないことです。
バイナリ変数 $x_i$（$x_j=1$ は頂点 $j$ が $S$ に含まれることを意味する）を用いると、この条件は以下の不等式と同値です:

$$
\begin{aligned}
\sum_{j\in N[i]}x_j &\geq 1
\end{aligned}
$$

QUBO++の記法では、ペナルティ式の和として支配集合制約を表現できます:

$$
\begin{aligned}
\text{constraint} &= \sum_{i=0}^{n-1} \bigl(\sum_{j\in N[i]}x_j \geq 1\bigr)
\end{aligned}
$$

目的関数と $f$ はHUBO定式化と同様に定義できます。

上記の制約はQUBO++プログラムとして次のように記述できます:
```cpp
  auto constraint = qbpp::toExpr(0);
  for (size_t i = 0; i < N; ++i) {
    auto t = qbpp::toExpr(x[i]);
    for (size_t j : adj[i]) {
      t += x[j];
    }
    constraint += 1 <= t <= +qbpp::inf;
  }
```
このコードでは、`t` に式

$$
\sum_{j\in N[i]}x_j
$$

が格納され、範囲演算子により

$$
1\leq \sum_{j\in N[i]}x_j \leq +\infty,
$$

に対するペナルティ式が生成されます。この式は不等式が満たされるときにのみ最小値0をとります。
`f` を最小化することで、プログラムは最小支配集合を求めます。
