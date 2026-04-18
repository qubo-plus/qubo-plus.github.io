---
layout: default
nav_exclude: true
title: "Edge Coloring"
nav_order: 60
lang: ja
hreflang_alt: "en/python/EDGE_COLOR"
hreflang_lang: "en"
---

# グラフ辺彩色問題
無向グラフ $G=(V,E)$ が与えられたとき、**グラフ辺彩色問題**は、同じ色の2つの辺が共通の端点を持たないように各辺に色を割り当てることを目的とします。

より具体的には、色の集合 $C$ に対して、同じノードに接続する任意の2つの異なる辺 $e$ と $e'$ について $\sigma(e)\neq \sigma(e')$ となるような割り当て $\sigma:E\rightarrow C$ を求めます。
同等に、すべてのノード $u\in V$ と $(u,v)\in E$ かつ $(u,v')\in E$ である任意の2つの異なる隣接ノード $v\neq v'$ について、以下が成り立つ必要があります：

$$
\sigma((u,v))\neq \sigma((u,v')).
$$


グラフ辺彩色問題は QUBO 式として容易に定式化できます。
$V=\lbrace 0,1,\ldots,n−1\rbrace$、$C=\lbrace 0,1,\ldots,m−1\rbrace$ とします。
$s=|E|$ 本の辺に一意の ID $0,1,\ldots,s−1$ を割り当て、$(u_i,v_i)$ で第 $i$ 辺を表します。

$s\times m$ のバイナリ変数行列 $X=(x_{i,j})$ を導入し、$x_{i,j}=1$ は辺 $(u_i,v_i)$ に色 $j$ が割り当てられることを表します。

### ワンホット制約
各辺にちょうど1つの色を割り当てる必要があるため、$X$ の各行はワンホットでなければなりません：

$$
\begin{aligned}
  \text{onehot}&= \sum_{i=0}^{s-1}\bigr(\sum_{j=0}^{m-1}x_{i,j}==1\bigl)\\
   &=\sum_{i=0}^{s-1}\bigr(1-\sum_{j=0}^{m-1}x_{i,j}\bigl)^2
\end{aligned}
$$

### 接続辺は異なる色
各ノードについて、接続する任意の2つの異なる辺は同じ色を割り当ててはなりません。これは以下のようにペナルティ化できます：

$$
\begin{aligned}
  \text{different}&= \sum_{u\in V}\sum_{\substack{i<k\\ i,k\in I(u)}}x_i\cdot x_k\\
   &=\sum_{u\in V}\sum_{\substack{i<k\\ i,k\in I(u)}}\sum_{j=0}^{m-1}x_{i,j}x_{k,j}
\end{aligned}
$$

ここで $I(u)\subseteq \lbrace 0,1,\ldots,s−1\rbrace$ はノード $u$ に接続する辺の ID の集合を表します。

## QUBO 目的関数
これらの式を組み合わせることで、QUBO 目的関数が得られます：

$$
\begin{aligned}
  f &= \text{onehot}+\text{different}
\end{aligned}
$$

この目的関数は、有効な辺彩色が存在する場合にのみ最小値 0 を達成します。

## PyQBPP による定式化
単純グラフの辺彩色数は $\Delta$ または $\Delta+1$ であることが知られています。ここで $\Delta$ はグラフの最大次数です。以下の PyQBPP プログラムは、$n$ ノード、$s$ 辺のグラフに対して $m=\Delta$ 色での辺彩色を求めます：
{% raw %}
```python
import pyqbpp as qbpp

n = 16
edges = [
    (0, 1),  (0, 2),  (0, 4),  (1, 3),  (1, 4),  (1, 7),  (2, 5),
    (2, 6),  (3, 7),  (3, 13), (3, 15), (4, 6),  (4, 7),  (4, 14),
    (5, 8),  (6, 8),  (6, 14), (7, 14), (7, 15), (8, 9),  (8, 12),
    (9, 10), (9, 11), (9, 12), (10, 11),(10, 12),(10, 13),(10, 14),
    (10, 15),(11, 13),(12, 14),(13, 15),(14, 15)]

adj = [[] for _ in range(n)]
for i, (u, v) in enumerate(edges):
    adj[u].append(i)
    adj[v].append(i)

max_degree = max(len(neighbors) for neighbors in adj)
m = max_degree

s = len(edges)
x = qbpp.var("x", shape=(s, m))

onehot = qbpp.sum(qbpp.constrain(qbpp.vector_sum(x), equal=1))
different = 0
for i in range(n):
    for u in adj[i]:
        for v in adj[i]:
            if u < v:
                different += qbpp.sum(qbpp.row(x, u) * qbpp.row(x, v))

f = onehot + different

f.simplify_as_binary()
solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=0)

print(f"colors = {m}")
print(f"onehot = {sol(onehot)}")
print(f"different = {sol(different)}")

# 各辺に割り当てられた色を取得（行が one-hot でなければ -1）
edge_color = [next((j for j in range(m) if sol(x[i][j]) == 1), -1)
              for i in range(s)]
for i in range(s):
    print(f"Edge {edges[i]}: color {edge_color[i]}")
```
{% endraw %}
このプログラムでは、まず接続リスト `adj` を構築します。`adj[i]` にはノード `i` に接続する辺のインデックスが格納されます。
次に、最大次数 $\Delta$ を計算し、`m=`$\Delta$ と設定します。
そして、`s`$\times$`m` のバイナリ変数行列 `x` を定義します。`x[i][j]=1` は辺 `i` に色 `j` が割り当てられることを意味します。
式 `onehot`、`different`、`f` を以下のように構築します：
- `onehot` は各辺にちょうど1つの色が割り当てられることを強制します。`qbpp.vector_sum(x)` で各行の総和を取り、`qbpp.constrain(..., equal=1)` で各行に対する制約を作成します。
- `different` は端点を共有し同じ色が割り当てられた辺のペアにペナルティを課します。`qbpp.row(x, u) * qbpp.row(x, v)` で2つの行の要素積を取り、`qbpp.sum()` で `m` 個の色の列にわたって和を取ります。
- `f = onehot + different` は QUBO 目的関数であり、有効な `m`-辺彩色が見つかった場合にのみ最小値 0 を達成します。

得られた QUBO を `target_energy=0` で Easy Solver を用いて解き、解を `sol` に格納します。次に、`sol` における `onehot` と `different` の値を出力します。

また、`sol(x)` の各行を走査して 1 の位置を記録することで、各辺に割り当てられた色を格納する `edge_color` を計算します。行が有効なワンホットベクトルでない場合、代わりに `-1` を記録します。

このプログラムの出力は以下の通りです：
```
colors = 6
onehot = 0
different = 0
```
したがって、`m = 6` 色を使った有効な辺彩色が見つかりました。

## matplotlib による可視化
以下のコードは、辺彩色の解を可視化します。各辺はソルバーが割り当てた色で描画され、固定のパレットを循環的に使用します：
```python
import matplotlib.pyplot as plt
import networkx as nx

G = nx.Graph()
G.add_nodes_from(range(n))
G.add_edges_from(edges)
pos = nx.spring_layout(G, seed=42)

palette = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c",
           "#e67e22", "#2c3e50"]
edge_color_idx = [next((k for k in range(m) if sol(x[i][k]) == 1), 0)
                  for i in range(len(edges))]
edge_colors = [palette[c % len(palette)] for c in edge_color_idx]
nx.draw(G, pos, with_labels=True, node_color="#d5dbdb", node_size=400,
        font_size=9, edge_color=edge_colors, width=2.5)
plt.title(f"Edge Coloring ({m} colors)")
plt.savefig("edge_color.png", dpi=150, bbox_inches="tight")
plt.show()
```

各辺は割り当てられた色に従って彩色され、端点を共有する2つの辺は異なる色となります。
