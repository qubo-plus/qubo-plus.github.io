---
layout: default
nav_exclude: true
title: "Graph Bisection"
nav_order: 11
lang: ja
hreflang_alt: "en/python/BISECTION"
hreflang_lang: "en"
---

# 最小グラフ二分割問題

無向グラフ $G=(V,E)$（$n$ ノード、$n$ は偶数）が与えられたとき、**最小グラフ二分割**問題は、ノード集合 $V$ を**等しいサイズ**（$\lvert S\rvert=\lvert\overline{S}\rvert=n/2$）の2つの互いに素な部分集合 $S$ と $\overline{S}$ に分割し、分割を横断する辺の数を**最小化**することを目的とします。

この問題は[最大カット](MAXCUT)と2つの点で異なります：
1. 分割は**均等**（同サイズの半分）でなければなりません。
2. 横断辺の数を（最大化ではなく）**最小化**します。

最小グラフ二分割は NP 困難であり、回路分割、並列計算、グラフベースのデータクラスタリングなどの応用があります。

## QUBO 定式化

ノードに $0,1,\ldots,n-1$ のラベルが付いているとします。
$n$ 個のバイナリ変数 $x_0, x_1, \ldots, x_{n-1}$ を導入し、$x_i=1$ はノード $i$ が $S$ に属することを表します。

### 目的関数

分割を横断する辺の数は以下の通りです：

$$
\text{objective} = \sum_{(i,j)\in E}\Bigl(x_i\overline{x_j} + \overline{x_i}x_j\Bigr)
$$

この値を**最小化**します。

### 制約

分割は均等でなければなりません：

$$
\text{constraint} = \Bigl(\sum_{i=0}^{n-1} x_i = \frac{n}{2}\Bigr)
$$

この制約式は充足されたとき 0 になります。

### QUBO 式

最終的な QUBO 式は、目的関数と制約をペナルティ重み $P$ で組み合わせます：

$$
f = \text{objective} + P \times \text{constraint}
$$

ここで $P$ は十分大きく（例えば $P = \lvert E\rvert + 1$）、最適解で均等制約が常に満たされるようにします。

## PyQBPP プログラム

以下の PyQBPP プログラムは、16 ノードのグラフに対する最小グラフ二分割問題を解きます：

```python
import pyqbpp as qbpp

N = 16
edges = [
    (0, 1),   (0, 2),   (1, 3),   (1, 4),   (2, 5),   (2, 6),   (3, 7),
    (3, 13),  (4, 6),   (4, 7),   (4, 14),  (5, 8),   (6, 8),   (6, 12),
    (6, 14),  (7, 14),  (8, 9),   (9, 10),  (9, 12),  (10, 11), (10, 12),
    (11, 13), (11, 15), (12, 14), (12, 15), (13, 15), (14, 15),
]
M = len(edges)

x = qbpp.var("x", shape=N)

# 目的関数: カットを横断する辺の数
objective = 0
for i, j in edges:
    objective += x[i] * ~x[j] + ~x[i] * x[j]

# 制約: 各パーティションに正確に N/2 ノード
constraint = qbpp.constrain(qbpp.sum(x), equal=N // 2)

# ペナルティ重み: M + 1 で制約を優先
f = objective + (M + 1) * constraint
f.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()

print(f"Cut edges = {sol(objective)}")
print(f"constraint = {sol(constraint)}")
```

このプログラムでは、目的関数がカットを横断する辺の数をカウントし、制約が各パーティションに正確に $N/2$ ノードが含まれることを強制します。
ペナルティ重み $P = M + 1$ により、均等制約が常に満たされます。
最大カット問題では最大化のために目的関数を符号反転しますが、ここでは目的関数を直接最小化します。

### 出力結果
```
Cut edges = 6
constraint = 0
```

ソルバーは横断辺が 6 本のみの均等分割を見つけます。

## matplotlib による可視化

以下のコードは `matplotlib` と `networkx` を用いて最小グラフ二分割の解を可視化します：

```python
import matplotlib.pyplot as plt
import networkx as nx

G = nx.Graph()
G.add_nodes_from(range(N))
G.add_edges_from(edges)
pos = nx.spring_layout(G, seed=42)

colors = ["#e74c3c" if sol(x[i]) == 1 else "#3498db" for i in range(N)]
edge_colors = ["#e74c3c" if sol(x[u]) != sol(x[v]) else "#cccccc"
               for u, v in edges]
edge_widths = [2.5 if sol(x[u]) != sol(x[v]) else 1.0
               for u, v in edges]
nx.draw(G, pos, with_labels=True, node_color=colors, node_size=400,
        font_size=9, edge_color=edge_colors, width=edge_widths)
plt.title("Minimum Graph Bisection")
plt.savefig("bisection.png", dpi=150, bbox_inches="tight")
plt.show()
```

2つの均等な分割は赤と青で表示されます。カット辺（分割を横切る辺）は赤でハイライトされます。
