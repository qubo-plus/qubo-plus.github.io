---
layout: default
nav_exclude: true
title: "MIS Problem"
nav_order: 50
lang: ja
hreflang_alt: "en/python/GRAPH"
hreflang_lang: "en"
---

# 最大独立集合（MIS）問題とグラフの可視化

## PyQBPP でのグラフ可視化
QUBO++ のC++版には、Graphviz をラップした簡易グラフ描画ライブラリ（`qbpp::graph::GraphDrawer`）が付属しており、グラフを `svg` / `png` / `jpg` / `pdf` に直接出力できます。詳細は [C++ 版のグラフライブラリのページ](../GRAPH) を参照してください。

PyQBPP には専用のグラフクラスは**ありません**。その代わりに、Python エコシステムで広く使われている以下のライブラリを使ってグラフを可視化できます:

- [`networkx`](https://networkx.org/) — グラフデータ構造とレイアウトアルゴリズム
- [`matplotlib`](https://matplotlib.org/) — 作図と画像出力

インストールは以下のコマンドで行えます:
```bash
pip install networkx matplotlib
```

このページの以降では、最大独立集合（MIS）問題を QUBO として定式化し、PyQBPP で解き、得られた結果を `networkx` + `matplotlib` で可視化する方法を説明します。

> **警告**: 以下に示す可視化コードは、PyQBPP のサンプルプログラムで得られた結果を例示する目的のものです。
> API が変更され得るサードパーティライブラリに依存しているため、ミッションクリティカルなアプリケーションでの使用は推奨しません。

## 最大独立集合（MIS）問題

無向グラフ $G=(V,E)$ の独立集合とは、$S$ 内のどの2頂点も $E$ の辺で接続されていないような頂点の部分集合 $S\subseteq V$ のことです。
最大独立集合（MIS）問題は、要素数が最大の独立集合を求める問題です。

MIS問題は以下のようにQUBOとして定式化できます。
$G$ が $0$ から $n-1$ までインデックス付けされた $n$ 個の頂点を持つとします。
$n$ 個のバイナリ変数 $x_i$ $(0\le i\le n-1)$ を導入し、$x_i=1$ であることと頂点 $i$ が $S$ に含まれることを同値とします。
$\|S\|=\sum_{i=0}^{n-1}x_i$ を最大化したいので、以下の目的関数を最小化します:

$$
\begin{aligned}
\text{objective} = -\sum_{i=0}^{n-1} x_i .
\end{aligned}
$$

独立性を保証するために、すべての辺 $(i,j)\in E$ に対して、両端点を同時に選択してはなりません。
これは以下のペナルティで表現できます:

$$
\begin{aligned}
\text{constraint} = \sum_{(i,j)\in E} x_i x_j .
\end{aligned}
$$

目的関数とペナルティを組み合わせると、以下のQUBO関数が得られます:

$$
\begin{aligned}
f = \text{objective} + 2\times\text{constraint}.
\end{aligned}
$$

ペナルティ係数 $2$ は、集合サイズの増加よりも実行可能性を優先するのに十分です。

## MIS問題のPyQBPPプログラム
上記のMIS問題のQUBO定式化に基づき、以下のPyQBPPプログラムは16ノードのインスタンスを解きます。辺は `edges` に格納されています:
```python
import pyqbpp as qbpp

N = 16
edges = [
    (0, 1),  (0, 2),  (1, 3),  (1, 4),  (2, 5),  (2, 6),
    (3, 7),  (3, 13), (4, 6),  (4, 7),  (5, 8),  (6, 8),
    (6, 14), (7, 14), (8, 9),  (9, 10), (9, 12), (10, 11),
    (10, 12),(11, 13),(12, 14),(13, 15),(14, 15)]

x = qbpp.var("x", shape=N)

objective = -qbpp.sum(x)
constraint = qbpp.expr()
for u, v in edges:
    constraint += x[u] * x[v]
f = objective + constraint * 2
f.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()

print(f"objective = {sol(objective)}")
print(f"constraint = {sol(constraint)}")

print("Selected nodes:", end="")
for i in range(N):
    if sol(x[i]) == 1:
        print(f" {i}", end="")
print()
```
`qbpp.var("x", shape=N)` によって生成された `N = 16` 個のバイナリ変数のベクトル `x` に対して、上記のQUBO定式化に従って式 `objective`、`constraint`、`f` が構築されます。ここで `qbpp.expr()` はゼロ式を生成し、辺に関するペナルティ和のアキュムレータとして機能し、`qbpp.sum(x)` は `x` のすべての要素の和を計算します。続いて `f.simplify_as_binary()` により、バイナリ(0/1)ルールに基づく同類項のマージなどの簡約が in-place に適用されます。

次にExhaustive Solverを使用して `f` の最適解を求め、`sol` に格納します。`sol(objective)` と `sol(constraint)` によって `sol` における `objective` と `constraint` の評価値が得られ、表示されます。最後に、インデックス `i` をループし、`sol(x[i]) == 1` を判定することで解におけるバイナリ変数 `x[i]` の値を評価し、選択されたノードの一覧を出力します。

このプログラムは以下の出力を生成します:
```
objective = -7
constraint = 0
Selected nodes: 0 4 5 9 11 13 14
```
これは、得られた解が7個のノードを選択し、すべての制約を満たしていることを意味します。

## matplotlib と networkx による可視化
以下のコードは、`matplotlib` と `networkx` を使用して MIS の解を可視化します。上記のプログラムの末尾に追加し、`edges`、`N`、`x`、`sol` が有効な状態で実行してください:
```python
import matplotlib.pyplot as plt
import networkx as nx

G = nx.Graph()
G.add_nodes_from(range(N))
G.add_edges_from(edges)
pos = nx.spring_layout(G, seed=42)

colors = ["#e74c3c" if sol(x[i]) == 1 else "#d5dbdb" for i in range(N)]
nx.draw(G, pos, with_labels=True, node_color=colors, node_size=400,
        font_size=9, edge_color="#888888", width=1.2)
plt.title("Maximum Independent Set")
plt.savefig("mis.png", dpi=150, bbox_inches="tight")
plt.show()
```

`networkx.Graph` オブジェクト `G` を作成し、`add_nodes_from()` と `add_edges_from()` でノードと辺を追加します。レイアウト位置 `pos` は spring-layout アルゴリズム（再現性のために固定シードを指定）で計算します。

ソルバの解に基づき、色リスト `colors` を構築します。選択されたノード（`sol(x[i]) == 1`）は赤色（`#e74c3c`）で、選択されていないノードは薄灰色（`#d5dbdb`）で描画されます。`nx.draw()` がノードラベル付きでグラフを描画し、`plt.savefig()` で結果の画像を `mis.png` に書き出します。出力フォーマットはファイル拡張子によって決まるため、`"mis.png"` の代わりに `"mis.svg"` や `"mis.pdf"` を渡せば対応するフォーマットで出力できます。

描画される画像は以下と同等です（以下の画像はC++版の `qbpp::graph::GraphDrawer` で生成されたものです）。なお、`networkx.spring_layout` は力学的配置アルゴリズムを使用するのに対し、C++ 版は Graphviz の `neato` を使うため、ノードの正確な配置は異なる場合があります:

<p align="center">
  <img src="../../images/mis.svg" alt="MIS問題の解" width="80%">
</p>

## C++ グラフライブラリとの対応

下表は、C++ のグラフ描画 API と Python エコシステムとの対応関係をまとめたものです:

| C++（`qbpp/graph.hpp`）         | Python での対応                                            |
|---------------------------------|-----------------------------------------------------------|
| `qbpp::graph::Node(i)`          | `networkx.Graph` の `G.add_node(i)`                        |
| `Node::color(int)` / `color(str)` | `nx.draw()` の `node_color=[...]` 引数                   |
| `Node::position(x, y)`          | `nx.draw()` に渡す `pos` 辞書のエントリ                    |
| `Node::penwidth(f)`             | `nx.draw()` の `linewidths=...` 引数                       |
| `qbpp::graph::Edge(u, v)`       | `networkx.Graph` の `G.add_edge(u, v)`                     |
| `Edge::directed()`              | `Graph` の代わりに `networkx.DiGraph` を使用              |
| `Edge::color(...)`              | `nx.draw()` の `edge_color=[...]` 引数                     |
| `Edge::penwidth(f)`             | `nx.draw()` の `width=...` 引数                            |
| `GraphDrawer::add_node/edge`    | `G.add_node` / `G.add_edge`                               |
| `GraphDrawer::write("f.svg")`   | `plt.savefig("f.svg")`（`.png` / `.pdf` / `.jpg` も可）   |

> **注意**: PyQBPP では、C++ のグラフ描画ヘルパーを意図的に再実装していません。
> `networkx` + `matplotlib` は豊富で十分メンテナンスされた Python のエコシステムであり、QUBO 定式化のソルバ出力を可視化するという目的では C++ 版と同等の結果が得られます。
