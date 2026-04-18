---
layout: default
nav_exclude: true
title: "Vertex Cover"
nav_order: 54
lang: ja
hreflang_alt: "en/python/VERTEX_COVER"
hreflang_lang: "en"
---

# 最小頂点被覆問題
無向グラフ $G=(V,E)$ の**頂点被覆**とは、すべての辺 $(u,v)\in E$ に対して、少なくとも一方の端点が含まれるような部分集合 $S\subseteq V$ のことです。
**最小頂点被覆問題**は、要素数が最小の頂点被覆を求める問題です。

この問題はQUBO式として定式化できます。
$n$ 頂点のグラフ $G=(V,E)$（頂点に $0,1,\ldots,n-1$ のラベルが付いている）に対して、
$n$ 個のバイナリ変数 $x_0,x_1,\ldots, x_{n-1}$ を導入します。ここで $x_i=1$ は頂点 $i$ が選択されている（すなわち $i\in S$）場合です。

否定リテラル $\overline{x}_i$（$\overline{x}_i=1$ は $x_i=0$ のとき）を用いて、
すべての辺が被覆されている場合にのみ0となる以下のペナルティ項を定義します:

$$
\begin{aligned}
\text{constraint} &= \sum_{(i,j)\in E} \overline{x}_i\,\overline{x}_j
\end{aligned}
$$

辺 $(i,j)$ に対して、積 $\overline{x}_i\,\overline{x}_j$ はどちらの端点も選択されていないとき（辺が被覆されていないとき）にのみ1となります。したがって、この和は被覆されていない辺の数を数えます。

同等に、条件 $1\leq x_i+x_j\leq 2$ は一方または両方の端点が選択されていることを意味するので、QUBO++形式の定式化として次のように書けます:

$$
\begin{aligned}
\text{constraint'} &= \sum_{(i,j)\in E} (1\leq x_i+x_j\leq 2)
\end{aligned}
$$

目的関数は、選択された頂点の数を最小化することです:

$$
\begin{aligned}
\text{objective} &= \sum_{i=0}^{n-1}x_i
\end{aligned}
$$

最終的に、QUBO式 $f$ は次のようになります:

$$
\begin{aligned}
f &= \text{objective} + 2\times \text{constraint}, \text{or}\\
  &= \text{objective} + \text{constraint'}
\end{aligned}
$$

ペナルティ係数2は、目的関数の最小化よりも制約の充足を優先するために使用されます。

## 最小頂点被覆問題のPyQBPPプログラム
以下のPyQBPPプログラムは、$N=16$ 頂点のグラフに対する最小頂点被覆問題を解きます:

```python
import pyqbpp as qbpp

N = 16
edges = [
    (0, 1),  (0, 2),  (1, 3),  (1, 4),  (2, 5),  (2, 6),
    (3, 7),  (3, 13), (4, 6),  (4, 7),  (5, 8),  (6, 8),
    (6, 14), (7, 14), (8, 9),  (9, 10), (9, 12), (10, 11),
    (10, 12),(11, 13),(12, 14),(13, 15),(14, 15)]

x = qbpp.var("x", shape=N)

objective = qbpp.sum(x)
constraint = qbpp.sum([~x[u] * ~x[v] for u, v in edges])
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
このプログラムでは、上記の定式化に従って `objective`、`constraint`、`f` を構築しています。
Exhaustive Solverを `f` に適用して最適解を探索します。

このプログラムは以下の出力を生成します:
```
objective = 9
constraint = 0
```
目的関数値9、制約値0の最適解が得られました。

## matplotlibによる可視化
以下のコードは頂点被覆の解を可視化し、`vertex_cover.png` として保存します:
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
plt.title("Minimum Vertex Cover")
plt.savefig("vertex_cover.png", dpi=150, bbox_inches="tight")
plt.show()
```

被覆頂点は赤色で表示されます。すべての辺は少なくとも1つの赤い端点を持ち、選択された部分集合が有効な頂点被覆であることを確認できます。
