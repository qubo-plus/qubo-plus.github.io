---
layout: default
nav_exclude: true
title: "Graph Coloring"
nav_order: 18
lang: ja
hreflang_alt: "en/GRAPH_COLOR"
hreflang_lang: "en"
---

# グラフ彩色問題
無向グラフ $G=(V,E)$ が与えられたとき、**グラフ彩色問題**は、隣接するノードが異なる色を持つように各ノードに色を割り当てることを目的とします。
より具体的には、色の集合 $C$ に対して、すべての辺 $(u,v)\in E$ について $\sigma(u)\neq \sigma(v)$ となるような割り当て $\sigma:V\rightarrow C$ を求めます。グラフ彩色問題は QUBO 式として容易に定式化できます。
$V=\lbrace 0,1,\ldots ,n−1\rbrace$、$C=\lbrace 0,1,\ldots ,m−1\rbrace$ とします。
$n\times m$ のバイナリ変数行列 $X=(x_{i,j})$ を導入し、$x_{i,j}=1$ はノード $i$ に色 $j$ が割り当てられることを表します。

### ワンホット制約
各ノードにちょうど1つの色を割り当てる必要があるため、$X$ の各行はワンホットでなければなりません：

$$
\begin{aligned}
  \text{onehot}&= \sum_{i=0}^{n-1}\Bigl(\sum_{j=0}^{m-1}x_{i,j}==1\Bigr)\\
   &=\sum_{i=0}^{n-1}\Bigl(1-\sum_{j=0}^{m-1}x_{i,j}\Bigr)^2
\end{aligned}
$$

### 隣接ノードは異なる色
各辺について、その端点は同じ色を共有してはなりません。これは以下のようにペナルティ化できます：

$$
\begin{aligned}
  \text{different}&= \sum_{(u,v)\in E}x_u\cdot x_v\\
   &=\sum_{(u,v)\in E}\sum_{j=0}^{m-1}x_{u,j}x_{v,j}
\end{aligned}
$$

## QUBO 目的関数
これらの式を組み合わせることで、QUBO 目的関数が得られます：

$$
\begin{aligned}
  f &= \text{onehot}+\text{different}
\end{aligned}
$$

この目的関数は、グラフの有効な $m$-彩色が存在する場合にのみ最小値 0 を達成します。

## QUBO++ による定式化
任意の平面グラフは最大4色で彩色できるため、16 ノードの平面グラフと $m=4$ 色を例として使用します。以下の QUBO++ プログラムがこのインスタンスを解きます：
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>
#include <qbpp/graph.hpp>

int main() {
  const size_t n = 16;
  std::vector<std::pair<size_t, size_t>> edges = {
      {0, 1},   {0, 2},   {0, 4},   {1, 3},   {1, 4},   {1, 7},   {2, 5},
      {2, 6},   {3, 7},   {3, 13},  {3, 15},  {4, 6},   {4, 7},   {4, 14},
      {5, 8},   {6, 8},   {6, 14},  {7, 14},  {7, 15},  {8, 9},   {8, 12},
      {9, 10},  {9, 11},  {9, 12},  {10, 11}, {10, 12}, {10, 13}, {10, 14},
      {10, 15}, {11, 13}, {12, 14}, {13, 15}, {14, 15}};
  const size_t m = 4;

  auto x = qbpp::var("x", n, m);

  auto onehot = qbpp::sum(qbpp::vector_sum(x) == 1);
  auto different = qbpp::Expr(0);
  for (const auto& e : edges) {
    different += qbpp::sum(qbpp::row(x, e.first) * qbpp::row(x, e.second));
  }

  auto f = onehot + different;

  f.simplify_as_binary();
  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"target_energy", 0}});

  std::cout << "onehot = " << sol(onehot) << std::endl;
  std::cout << "different = " << sol(different) << std::endl;

  auto node_color = qbpp::onehot_to_int(sol(x));

  qbpp::graph::GraphDrawer graph;
  for (size_t i = 0; i < n; ++i) {
    graph.add_node(qbpp::graph::Node(i).color(node_color[i] + 1));
  }
  for (const auto& e : edges) {
    graph.add_edge(qbpp::graph::Edge(e.first, e.second));
  }

  graph.write("graph_color.svg");
}
```
{% endraw %}
このプログラムでは、まず $n\times m$ のバイナリ変数行列 `x` を定義し、上記の定式化に従って式 `onehot`、`different`、`f` を構築します。得られた QUBO を目標エネルギー 0 で Easy Solver を用いて解き、解を `sol` に格納します。

次に、`sol` における `onehot` と `different` の値を出力します。また、`sol(x)` に `qbpp::onehot_to_int()` を適用して、各ノードに割り当てられた色を格納する `node_color` を計算します。

最後に、`qbpp::graph::GraphDrawer` を使って彩色されたグラフを描画します。各ノード `i` は色番号 `node_color[i] + 1` で彩色されます。

関数 `qbpp::onehot_to_int()` は $[0,m−1]$ の範囲の整数ベクトルを返し、各エントリはワンホット行列の対応する行における 1 の位置を示します。行が有効なワンホットベクトルでない場合、その行に対して $−1$ を返します。
この場合、ノードの色は $-1 + 1 = 0$ となり、ノードは色 0（白）で描画されます。

### $m=4$ の結果
このプログラムの出力は以下の通りです：
```
onehot = 0
different = 0
```
したがって、有効な 4-彩色が見つかりました：
<p align="center">
  <img src="images/graph_color.svg" alt="グラフ彩色問題の解" width="80%">
</p>

### $m=3$ の結果
同じプログラムを $m=3$ で実行すると、以下の出力が得られます：
```
onehot = 1
different = 0
```
この出力は、ソルバーがちょうど1つのノードに色を割り当てられなかったことを示しています（つまり、1つの行がワンホットではありません）。結果のグラフでは、ノード 7 が未彩色のままです：

<p align="center">
  <img src="images/graph_color_m3.svg" alt="$m=3$色でのグラフ彩色問題の解" width="80%">
</p>
