---
layout: default
nav_exclude: true
title: "Maximum Matching"
nav_order: 52
lang: ja
hreflang_alt: "en/python/MAX_MATCHING"
hreflang_lang: "en"
---

# 最大マッチング問題

無向グラフにおける**マッチング**とは、共通のノードを持たない辺の集合のことです。
無向グラフ $G=(V,E)$ が与えられたとき、**最大マッチング問題**は、辺の数が最大となるマッチング $S \subseteq E$ を求めることを目的とします。

グラフが $n$ 個の頂点と $m$ 本の辺を持ち、辺は $0,1,\ldots,m-1$ とラベル付けされているとします。
$m$ 個のバイナリ変数 $x_0, x_1, \ldots, x_{m-1}$ を導入し、$x_i=1$ は辺 $i$ が選択されている（すなわち $S$ に属する）場合にのみ成り立ちます（$0\le i\le m-1$）。
目的は選択された辺の数を最大化することです：

$$
\begin{aligned}
\text{objective} &= \sum_{i=0}^{m-1} x_i .
\end{aligned}
$$

マッチング条件を課すために、共通のノードを持つ選択された辺の対にペナルティを与えます。
$\mathcal{P}$ を、共通の端点を持つ異なる辺の順序なし対 $(e_1,e_2)$ の集合とします。
すると、以下のペナルティは、選択された辺がマッチングを形成する場合にのみ $0$ をとります：

$$
\begin{aligned}
\text{constraint} &= \sum_{\{e_1,e_2\}\in \mathcal{P}} x_{e_1}x_{e_2}.
\end{aligned}
$$

目的関数とペナルティを以下のように組み合わせて QUBO 式 $f$ を構築します：

$$
\begin{aligned}
f &= -\text{objective} + 2 \times \text{constraint}.
\end{aligned}
$$

## 最大マッチングの PyQBPP プログラム
```python
import pyqbpp as qbpp

N = 16
edges = [
    (0, 1),  (0, 2),  (1, 3),  (1, 4),  (2, 5),  (2, 6),  (3, 7),
    (3, 13), (4, 6),  (4, 7),  (4, 14), (5, 8),  (6, 8),  (6, 12),
    (6, 14), (7, 14), (8, 9),  (9, 10), (9, 12), (10, 11),(10, 12),
    (11, 13),(11, 15),(12, 14),(12, 15),(13, 15),(14, 15)]
M = len(edges)

x = qbpp.var("x", shape=M)

objective = qbpp.sum(x)

constraint = 0
for i in range(M):
    for j in range(i + 1, M):
        if (edges[i][0] == edges[j][0] or edges[i][0] == edges[j][1] or
            edges[i][1] == edges[j][0] or edges[i][1] == edges[j][1]):
            constraint += x[i] * x[j]

f = -objective + 2 * constraint
f.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()

print(f"objective = {sol(objective)}")
print("Selected edges:", end="")
for i in range(M):
    if sol(x[i]) == 1:
        print(f" {edges[i]}", end="")
print()
```
このプログラムは式 `objective`、`constraint`、`f` を作成します。`f` は `objective` の符号反転にペナルティ項を加えたものです。
Exhaustive Solver が `f` を最小化し、最適な割り当てが `sol` に格納されます。

## matplotlib による可視化
以下のコードは、最大マッチングの解を可視化します：
```python
import matplotlib.pyplot as plt
import networkx as nx

G = nx.Graph()
G.add_nodes_from(range(N))
G.add_edges_from(edges)
pos = nx.spring_layout(G, seed=42)

edge_colors = ["#e74c3c" if sol(x[i]) == 1 else "#cccccc"
               for i in range(M)]
edge_widths = [2.5 if sol(x[i]) == 1 else 1.0 for i in range(M)]
nx.draw(G, pos, with_labels=True, node_color="#d5dbdb", node_size=400,
        font_size=9, edge_color=edge_colors, width=edge_widths)
plt.title("Maximum Matching")
plt.savefig("max_matching.png", dpi=150, bbox_inches="tight")
plt.show()
```

選択されたマッチング辺は赤で表示されます。
