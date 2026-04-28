---
layout: default
nav_exclude: true
title: "TSP"
nav_order: 21
lang: ja
hreflang_alt: "en/TSP"
hreflang_lang: "en"
---

# 巡回セールスマン問題
巡回セールスマン問題（TSP）は、すべての頂点をちょうど1回ずつ訪問して出発点に戻る最短巡回路を求める問題です。
頂点は平面上に配置され、巡回路の長さはユークリッド距離で測られるものとします。

以下の図は、9頂点と最適巡回路の例を示しています:

<p align="center">
  <img src="../images/tsp_solution.svg" alt="頂点とTSPの解の例" width="50%">
</p>


## TSPのQUBO定式化
巡回路は頂点の順列として表現できます。
そこで、TSPの解を符号化するために[置換行列](PERMUTATION)を使用します。

$X=(x_{i,j})$（$0\leq i,j\leq n-1$）を $n\times n$ のバイナリ値の行列とします。
行列 $X$ は**置換行列**であり、各行と各列にちょうど1つの1が含まれます。以下に例を示します。

<p align="center">
  <img src="../images/matrix.svg" alt="4x4の置換行列" width="50%">
</p>

$x_{k,i}$ を「巡回路の $k$ 番目の位置が頂点 $i$ である」と解釈します。
したがって、$X$ のすべての行とすべての列はone-hotでなければなりません。すなわち以下の制約が成り立つ必要があります:

$$
\begin{aligned}
{\rm row}:& \sum_{j=0}^{n-1}x_{i,j}=1 & (0\leq i\leq n-1)\\
{\rm column}:& \sum_{i=0}^{n-1}x_{i,j}=1 & (0\leq j\leq n-1)
\end{aligned}
$$

$d_{i,j}$ を頂点 $i$ と $j$ の間の距離とします。
置換行列 $X$ に対する巡回路の長さは次のように書けます:

$$
\begin{aligned}
{\rm objective}: &\sum_{k=0}^{k-1} d_{i,j}x_{k,i}x_{(k+1)\bmod n,j}
\end{aligned}
$$

この式は、頂点 $i$ が位置 $k$ で訪問され、頂点 $j$ が次の位置（$(k+1)\bmod n$）で訪問されるときにちょうど $d_{i,j}$ を加算するので、巡回路の総距離に等しくなります。

## TSPのQUBO++プログラム
上記の置換行列による定式化を用いて、TSPのQUBO++プログラムを以下のように記述できます:
{% raw %}
```cpp
#include <cmath>
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>
#include <qbpp/graph.hpp>

class Nodes {
  std::vector<std::pair<int, int>> nodes{{10, 12},  {33, 125},  {12, 226},
                                         {121, 11}, {108, 142}, {111, 243},
                                         {220, 4},  {210, 113}, {211, 233}};

 public:
  const std::pair<int, int>& operator[](std::size_t index) const {
    return nodes[index];
  }

  std::size_t size() const { return nodes.size(); }

  int dist(std::size_t i, std::size_t j) const {
    auto [x1, y1] = nodes[i];
    auto [x2, y2] = nodes[j];
    const int dx = x1 - x2;
    const int dy = y1 - y2;
    return static_cast<int>(
        std::llround(std::sqrt(static_cast<double>(dx * dx + dy * dy))));
  }
};

int main() {
  auto nodes = Nodes{};
  auto x = qbpp::var("x", nodes.size(), nodes.size());

  auto constraint = qbpp::sum(qbpp::vector_sum(x, 1) == 1) +
                    qbpp::sum(qbpp::vector_sum(x, 0) == 1);

  auto objective = qbpp::toExpr(0);
  for (size_t i = 0; i < nodes.size(); ++i) {
    auto next_i = (i + 1) % nodes.size();
    for (size_t j = 0; j < nodes.size(); ++j) {
      for (size_t k = 0; k < nodes.size(); ++k) {
        if (k != j) {
          objective += nodes.dist(j, k) * x[i][j] * x[next_i][k];
        }
      }
    }
  }

  auto f = objective + constraint * 1000;
  f.simplify_as_binary();

  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"time_limit", 1.0}});
  auto tour = qbpp::onehot_to_int(sol(x));

  std::cout << "Tour: " << tour << "\n";
  auto graph = qbpp::graph::GraphDrawer();
  for (size_t i = 0; i < nodes.size(); ++i) {
    graph.add(qbpp::graph::Node(i).position(nodes[i].first, nodes[i].second));
  }
  for (size_t i = 0; i < nodes.size(); ++i) {
    auto from = tour[i];
    auto to = tour[(i + 1) % nodes.size()];
    graph.add(qbpp::graph::Edge(from, to).color("red").penwidth(2).directed());
  }
  graph.write("tsp_solution.svg");
}
```
{% endraw %}
このプログラムでは、頂点 `0` から `8` の座標が `Nodes` オブジェクト `nodes` に格納されています。
バイナリ変数の2次元配列 `x` を作成し、one-hot制約と巡回路長の目的関数を構成します。
これらの項は、制約にペナルティ重み（ここでは `1000`）を付けて加算することで、1つのQUBO式 `f` にまとめられます。実行可能性が優先されます。

次に、1.0秒の制限時間で EasySolver を使って `f` を解きます。
得られた割り当て `sol(x)` は置換行列を形成します。
この行列は `qbpp::onehot_to_int()` を使って整数のリスト（順列）`tour` に変換され、出力されます。
最後に、計算された `tour` が有向グラフとして描画され、ファイル `tsp_solution.svg` に保存されます。

このプログラムは以下の出力を生成します:
```
Tour: {7,8,5,2,4,1,0,3,6}
```

## `slice`、`concat`、`einsum` を使った簡潔な目的関数

`objective` を構築する三重 for ループは数式
$\sum_{k} d_{j,k}\, x_{k,j}\, x_{(k+1) \bmod n, k}$ をそのまま書き下したものですが、
2 つの補助配列を用意すれば
[`qbpp::einsum`](EINSUM) の 1 行で書き換えられます。

1. 距離行列 `d`（形状 $n \times n$、`d[j][k] = nodes.dist(j, k)`）
2. `x` を軸 0 で巡回シフトした変数行列 `x_next`
   （`x_next[i][k] = x[(i+1) % n][k]`、[slice と concat](SLICE_CONCAT) で構築）

これらを使うと、目的関数は次の 1 行
`qbpp::einsum<0>("jk,ij,ik->", d, x, x_next)` に置き換わり、三重ループ全体が
不要になります。

{% raw %}
```cpp
  // 距離行列を 2 次元の整数定数配列として作成
  auto d = qbpp::array<qbpp::coeff_t>(nodes.size(), nodes.size());
  for (size_t j = 0; j < nodes.size(); ++j)
    for (size_t k = 0; k < nodes.size(); ++k)
      d[j][k] = nodes.dist(j, k);

  // x を軸 0 で巡回シフト:
  //   x_next[i, k] = x[(i+1) % n, k]
  auto x_next = qbpp::concat(
      x(qbpp::slice(1, qbpp::end), qbpp::all),
      x(qbpp::slice(0),            qbpp::all));

  // Σ_{i,j,k} d[j,k] * x[i,j] * x_next[i,k]
  auto objective = qbpp::einsum<0>("jk,ij,ik->", d, x, x_next);
```
{% endraw %}

`qbpp::array<qbpp::coeff_t>(nodes.size(), nodes.size())` は 0 で初期化された
2 次元の `Array<2, coeff_t>` を確保し、そこへ実行時に計算した距離値を
代入します。`slice` と `concat` で `x` の先頭行を末尾に移動し、巡回シフト
された行列 `x_next` を作っています。subscript `"jk,ij,ik->"` によって
`d` と `x` の間で `j` を、`d` と `x_next` の間で `k` を、`x` と `x_next`
の間で `i` を共有させ、`i, j, k` すべてを総和してスカラー目的関数を得ます。

ループ版にあった `if (k != j)` の対角項スキップは不要です。
`nodes.dist(j, j)` は常に 0 なので、対角項は自動的に消えます。

得られる QUBO 式の項集合はループ版と完全に同じですが、構築コードは大幅に
短くなり、しかも `einsum` は内部で複数 CPU スレッドを使って並列に式を構築
するため、$n$ が大きい場合は高速化も期待できます。

## 最初の頂点の固定
一般性を失うことなく、頂点0を巡回路の出発点と仮定できます。
TSPの巡回路は巡回シフトに対して不変であるため、出発位置を固定しても最適巡回路長は変わりません。

出発頂点を固定することで、QUBO式中のバイナリ変数の数を削減できます。
具体的には、置換行列において頂点0を位置0に割り当てることを強制します。
そのために、以下のバイナリ変数を固定します:

$$
\begin{aligned}
x_{0,0} &= 1\\
x_{i,0} &= 0& (i\geq 1)\\
x_{0,j} &= 0& (j\geq 1)
\end{aligned}
$$

これらの割り当てにより、頂点0は位置0にのみ現れ、他の頂点は位置0に割り当てられません。
結果として、実効的な問題サイズが削減され、局所探索ベースのソルバーにとってQUBOが解きやすくなります。

## 最初の頂点を固定するQUBO++プログラム
QUBO++では、固定された変数の割り当てを `qbpp::replace()` 関数を使って適用できます:
{% raw %}
```cpp
  qbpp::MapList ml;
  ml.push_back({x[0][0], 1});
  for (size_t i = 1; i < nodes.size(); ++i) {
    ml.push_back({x[i][0], 0});
    ml.push_back({x[0][i], 0});
  }

  auto g = qbpp::replace(f, ml);
  g.simplify_as_binary();

  auto solver = qbpp::EasySolver(g);
  auto sol = solver.search({{"time_limit", 1.0}});

  auto full_sol = qbpp::Sol(f).set(sol).set(ml);
  auto tour = qbpp::onehot_to_int(full_sol(x));
  std::cout << "Tour: " << tour << "\n";
```
{% endraw %}
まず、変数の固定割り当てを格納する `qbpp::MapList` オブジェクト `ml` を作成します。
各割り当ては `push_back()` メンバ関数で追加されます。

次に、`qbpp::replace(f, ml)` を呼び出します。これは `ml` で指定された固定値を元のQUBO式 `f` に代入して得られる新しい式を返します。
結果の式は `g` に格納され、簡約化されます。

次に、`g` に対するソルバーを作成して解 `sol` を得ます。
`sol` は縮小された問題に対応するため、`f` に対する `qbpp::Sol` オブジェクトを作成し、ソルバーの出力 `sol` と固定割り当て `ml` の両方を設定します。
結果の `full_sol` は `x` のすべての変数に対する完全な割り当てを格納します。

最後に、`full_sol(x)` で表される置換行列が `qbpp::onehot_to_int()` を使って順列に変換され、出力されます。

このプログラムは頂点0から始まる以下の巡回路を生成します:
```
Tour: {0,3,6,7,8,5,2,1,4}
```
