---
layout: default
nav_exclude: true
title: "Min-Max Matching"
nav_order: 58
lang: ja
hreflang_alt: "en/python/MINMAX_MATCHING"
hreflang_lang: "en"
---

# 最小極大マッチング問題

無向グラフにおける**マッチング**とは、どの2辺も共通の端点を持たない辺の集合です。
**極大マッチング**とは、マッチング条件を崩さずにこれ以上辺を追加できないマッチングのことです。
無向グラフ $G=(V,E)$ が与えられたとき、最小極大マッチング問題は、辺数が最小の極大マッチング $S \subseteq E$ を求める問題です。

マッチングの極大性条件は、次のようにコンパクトに記述できます。
頂点 $u\in V$ に対して、$N(u)$ を $u$ に接続する $S$ 中の辺の集合とします。
このとき、$S$ が極大マッチングであるための必要十分条件は、すべての辺 $(u,v)\in E$ に対して以下が成り立つことです:

$$
 1 \leq |N(u)|+|N(v)| \leq 2
$$

この条件は $S$ が極大マッチングを構成する場合にのみ満たされます。$S$ が極大マッチングであることを保証するために、以下のケースがすべての場合を網羅します:

<p align="center">
  <img src="../../images/min_max_matching.svg" alt="最大マッチング問題の解" width="80%">
</p>

最小極大マッチング問題は、上記の条件を満たし、かつ要素数が最小の部分集合 $S$ を見つける問題として定式化できます。

厳密な証明については、以下の論文を参照してください:

> **参考文献**:
> Nakahara, Y., Tsukiyama, S., Nakano, K., Parque, V., & Ito, Y. (2025). **A penalty-free QUBO formulation for the minimum maximal matching problem**. International Journal of Parallel, Emergent and Distributed Systems, 1--19. https://doi.org/10.1080/17445760.2025.2579546


## 最小極大マッチングの QUBO 定式化
グラフが $n$ 個の頂点と $m$ 本の辺を持ち、辺に $0,1,\ldots,m-1$ のラベルが付いているとします。
$m$ 個のバイナリ変数 $x_0, x_1, \ldots, x_{m-1}$ を導入し、$x_i=1$ は辺 $i$ が選択されている（すなわち $S$ に属する）場合とします。
目的関数は、選択された辺の数を最小化することです:

$$
\begin{aligned}
\text{objective} &= \sum_{i=0}^{m-1} x_i .
\end{aligned}
$$

極大性条件を課すために、以下の制約を使用します:

$$
\begin{aligned}
\text{constraint} &= \sum_{(u,v)\in E} (1 \leq |N(u)|+|N(v)| \leq 2)
\end{aligned}
$$

目的関数と制約を組み合わせて、QUBO 式 $f$ を次のように構成します:

$$
\begin{aligned}
f &= \text{objective} + \text{constraint}.
\end{aligned}
$$

## PyQBPP プログラム
以下の PyQBPP プログラムは、$N=16$ 頂点、$M=27$ 辺の固定された無向グラフの最小極大マッチングを求めます:
```python
import pyqbpp as qbpp

N = 16
edges = [
    (0, 1),  (0, 2),  (1, 3),  (1, 4),  (2, 5),  (2, 6),  (3, 7),
    (3, 13), (4, 6),  (4, 7),  (4, 14), (5, 8),  (6, 8),  (6, 12),
    (6, 14), (7, 14), (8, 9),  (9, 10), (9, 12), (10, 11),(10, 12),
    (11, 13),(11, 15),(12, 14),(12, 15),(13, 15),(14, 15)]
M = len(edges)

adj = [[] for _ in range(N)]
for i in range(M):
    adj[edges[i][0]].append(i)
    adj[edges[i][1]].append(i)

x = qbpp.var("x", shape=M)

objective = qbpp.sum(x)

constraint = 0
for u, v in edges:
    t = 0
    for idx in adj[u]:
        t += x[idx]
    for idx in adj[v]:
        t += x[idx]
    constraint += qbpp.constrain(t, between=(1, 2))

f = objective + constraint

f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()

print(f"objective = {sol(objective)}")
print(f"constraint = {sol(constraint)}")
print("Selected edges:", end="")
for i in range(M):
    if sol(x[i]) == 1:
        print(f" {edges[i]}", end="")
print()
```
まず `M` 個のバイナリ変数のベクトル `x` を定義し、上記の定式化に基づいて `objective`、`constraint`、`f` を定義します。
Exhaustive Solver を用いて `f` の最適解を求めます。
目的関数値と制約値、および選択された辺の一覧が出力されます。

このプログラムは以下の出力を生成します:
```
objective = 6
constraint = 0
```
したがって、$S$ は6本の辺を含み、最小極大マッチングを形成しています。

## matplotlib による可視化
以下のコードは、最小極大マッチングの解を可視化します。$S$ 中の選択された辺と、それらの辺に接続するすべての頂点が赤でハイライトされます:
```python
import matplotlib.pyplot as plt
import networkx as nx

G = nx.Graph()
G.add_nodes_from(range(N))
G.add_edges_from(edges)
pos = nx.spring_layout(G, seed=42)

matched_nodes = set()
for i in range(M):
    if sol(x[i]) == 1:
        matched_nodes.add(edges[i][0])
        matched_nodes.add(edges[i][1])
colors = ["#e74c3c" if i in matched_nodes else "#d5dbdb" for i in range(N)]
edge_colors = ["#e74c3c" if sol(x[i]) == 1 else "#cccccc"
               for i in range(M)]
edge_widths = [2.5 if sol(x[i]) == 1 else 1.0 for i in range(M)]
nx.draw(G, pos, with_labels=True, node_color=colors, node_size=400,
        font_size=9, edge_color=edge_colors, width=edge_widths)
plt.title("Minimum Maximal Matching")
plt.savefig("minmax_matching.png", dpi=150, bbox_inches="tight")
plt.show()
```

結果の図では、$S$ 中の選択された辺と、それらの辺に接続するすべての頂点が赤でハイライトされます。
これ以上辺を追加できないことが確認でき、極大性条件が満たされています。
