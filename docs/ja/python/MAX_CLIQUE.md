---
layout: default
nav_exclude: true
title: "Maximum Clique"
nav_order: 53
lang: ja
hreflang_alt: "en/python/MAX_CLIQUE"
hreflang_lang: "en"
---

# 最大クリーク問題

無向グラフ $G=(V,E)$ が与えられたとき、最大クリーク問題は、$S$ 内のすべての異なる頂点対が $E$ の辺で接続されているような最大の部分集合 $S\subseteq V$ を求めることを目的とします。

頂点は $0,1,\ldots,n−1$ とラベル付けされているとします。
$n$ 個のバイナリ変数 $x_0, x_1, \ldots, x_{n-1}$ を導入し、$x_i=1$ はノード $i$ が $S$ に属する場合にのみ成り立ちます（$0\leq i\leq n−1$）。
このとき、$S$ のサイズは次のように与えられます：

$$
\begin{aligned}
\text{objective} &= \sum_{i=0}^{n-1}x_i.
\end{aligned}
$$

$S$ がクリークであるためには、選択されたすべてのノード対が辺で接続されていなければなりません。
同値的に、$(i,j)\not\in E$ であるすべてのノード対 $i$ と $j$ について、両方を選択することはできません。
これは以下の制約で表現できます：

$$
\begin{aligned}
\text{constraint} &= \sum_{(i,j)\not\in E}x_ix_j
\end{aligned}
$$

実行可能なクリークは $constraint=0$ を満たします。
したがって、以下の QUBO 定式化 $f$（最小化対象）を得ます：

$$
\begin{aligned}
f &= -\text{objective}+2\times \text{constraint}
\end{aligned}
$$

## 最大クリーク問題の PyQBPP プログラム
```python
import pyqbpp as qbpp

N = 16
edges = [
    (0, 1),  (0, 2),  (1, 3),  (1, 4),  (2, 5),  (2, 6),
    (3, 7),  (3, 13), (4, 6),  (4, 7),  (4, 12), (4, 14),
    (5, 8),  (6, 8),  (6, 12), (6, 14), (7, 14), (7, 15),
    (8, 9),  (9, 10), (9, 12), (10, 11),(10, 12),(11, 13),
    (11, 15),(12, 14),(12, 15),(13, 15),(14, 15)]

adj = [[False] * N for _ in range(N)]
for u, v in edges:
    adj[u][v] = adj[v][u] = True

x = qbpp.var("x", shape=N)

objective = qbpp.sum(x)

constraint = 0
for i in range(N):
    for j in range(i + 1, N):
        if not adj[i][j]:
            constraint += x[i] * x[j]

f = -objective + N * constraint
f.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()

print(f"objective = {sol(objective)}")
print(f"constraint = {sol(constraint)}")
print("Clique nodes:", end="")
for i in range(N):
    if sol(x[i]) == 1:
        print(f" {i}", end="")
print()
```
辺リスト `edges` から隣接行列 `adj` を構築し、与えられたノード対がグラフの辺を形成するかどうかを判定できるようにします。
`N = 16` 個のバイナリ変数のベクトル `x` に対して、上記の QUBO 定式化に従って式 `objective`、`constraint`、`f` を構築します。

このプログラムは以下の出力を生成します：
```
objective = 4
constraint = 0
```
この出力から、制約を違反することなく4ノードの最大クリークが得られました。

## matplotlib による可視化
以下のコードは、最大クリークの解を可視化します：
```python
import matplotlib.pyplot as plt
import networkx as nx

G = nx.Graph()
G.add_nodes_from(range(N))
G.add_edges_from(edges)
pos = nx.spring_layout(G, seed=42)

colors = ["#e74c3c" if sol(x[i]) == 1 else "#d5dbdb" for i in range(N)]
edge_colors = ["#e74c3c" if sol(x[u]) == 1 and sol(x[v]) == 1
               else "#cccccc" for u, v in edges]
edge_widths = [2.5 if sol(x[u]) == 1 and sol(x[v]) == 1
               else 1.0 for u, v in edges]
nx.draw(G, pos, with_labels=True, node_color=colors, node_size=400,
        font_size=9, edge_color=edge_colors, width=edge_widths)
plt.title("Maximum Clique")
plt.savefig("max_clique.png", dpi=150, bbox_inches="tight")
plt.show()
```

クリークのノードは赤で表示され、クリーク内の辺はハイライトされます。
