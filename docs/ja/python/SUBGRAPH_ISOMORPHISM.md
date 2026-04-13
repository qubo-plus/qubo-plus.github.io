---
layout: default
nav_exclude: true
title: "Subgraph Isomorphism"
nav_order: 56
lang: ja
hreflang_alt: "en/python/SUBGRAPH_ISOMORPHISM"
hreflang_lang: "en"
---

# 部分グラフ同型問題
2つの無向グラフ $G_H=(V_H,E_H)$（ホストグラフ）と $G_G=(V_G,E_G)$（ゲストグラフ）が与えられたとき、**部分グラフ同型問題**は $G_H$ が $G_G$ と同型な部分グラフを含むかどうかを問う問題です。

より形式的には、すべての辺 $(u,v)\in E_G$ に対して $(\sigma(u),\sigma(v))$ もホストグラフの辺である（すなわち $(\sigma(u),\sigma(v))\in E_H$）ような**単射写像** $\sigma:V_G\rightarrow V_H$ を求めることが目標です。

例として、以下のホストグラフとゲストグラフを考えます：
<p align="center">
  <img src="../../images/host_graph.svg" alt="Host Graph" width="50%"><br>
  10ノードのホストグラフ $G_H=(V_H,E_H)$ の例
</p>

<p align="center">
  <img src="../../images/guest_graph.svg" alt="Guest Graph" width="30%"><br>
  6ノードのゲストグラフ $G_G=(V_G,E_G)$ の例
</p>

## 部分グラフ同型問題のQUBO定式化
**ゲストグラフ** $G_G=(V_G,E_G)$ が $0, 1, \ldots m-1$ とラベル付けされた $m$ 個のノードを持ち、**ホストグラフ** $G_H=(V_H,E_H)$ が $0, 1, \ldots n-1$ とラベル付けされた $n$ 個のノードを持つとします。
$mn$ 個のバイナリ変数を持つ $m\times n$ の**バイナリ行列** $X=(x_{i,j})$（$0\leq i\leq m-1, 0\leq j\leq n-1$）を導入します。
この行列は $x_{i,j}=1$ のとき $\sigma(i)=j$ となるような単射写像 $\sigma:V_G\rightarrow V_H$ を表します。

$X$ が単射写像を表すため、以下の制約を満たす必要があります：
- **行制約**: 各ゲストノードはちょうど1つのホストノードに写像される、すなわち各行の和が1である。
- **列制約**: 各ホストノードは最大1つのゲストノードに使用される、すなわち各列の和が0または1である。

次に、ホストグラフの辺に写像されたゲストグラフの辺の数を目的関数として定義します：

$$
\begin{aligned}
\text{objective} &= \sum_{(u_G,v_G)\in E_G}\sum_{(u_H,v_H)\in E_H} (x_{u_G,u_H}x_{v_G,v_H}+x_{u_G,v_H}x_{v_G,u_H})
\end{aligned}
$$

最終的に、目的関数と制約を1つのQUBO式にまとめます：

$$
\begin{aligned}
f  &= -\text{objective} + mn\times \text{constraint}
\end{aligned}
$$

## 部分グラフ同型問題のPyQBPPプログラム
```python
import pyqbpp as qbpp

N = 10
host = [
    (0, 1), (0, 2), (1, 3), (1, 4), (1, 6), (2, 5), (3, 7), (4, 6),
    (4, 7), (5, 6), (5, 8), (6, 8), (6, 7), (7, 9), (8, 9)]

M = 6
guest = [
    (0, 1), (0, 2), (1, 2), (1, 3), (2, 3), (2, 5), (3, 4), (4, 5)]

x = qbpp.var("x", M, N)

host_assigned = qbpp.vector_sum(x, 0)

constraint = qbpp.sum(qbpp.constrain(qbpp.vector_sum(x, 1), equal=1)) + qbpp.sum(qbpp.constrain(host_assigned, between=(0, 1)))

objective = 0
for ug, vg in guest:
    for uh, vh in host:
        objective += x[ug][uh] * x[vg][vh] + x[ug][vh] * x[vg][uh]

f = -objective + constraint * (M * N)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=-len(guest))

print(f"objective = {sol(objective)}")
print(f"constraint = {sol(constraint)}")

# Extract guest-to-host mapping
print("Guest -> Host mapping:")
for i in range(M):
    for j in range(N):
        if sol(x[i][j]) == 1:
            print(f"  guest {i} -> host {j}")
```
ゲストグラフとホストグラフは辺リストとして与えられます。
$M\times N$ のバイナリ行列 `x` を定義し、上記の定式化に従って `constraint`、`objective`、`f` の式を構築します。

Easy Solverのインスタンスを `f` に対して作成し、ターゲットエネルギー $−|E_G|$（ゲストグラフの辺数の負値）を `search()` のパラメータとして渡して探索を実行します。これは、すべてのゲストグラフの辺がホストグラフの辺に写像されたときの `-objective` の最良値です。

このプログラムの出力は以下のとおりです：
{% raw %}
```
objective = 8
constraint = 0
Guest -> Host mapping:
  guest 0 -> host 1
  guest 1 -> host 4
  guest 2 -> host 6
  guest 3 -> host 7
  guest 4 -> host 9
  guest 5 -> host 8
```
{% endraw %}
目的関数値はゲストグラフの辺数（$|E_G|=8$）と等しく、すべての制約が満たされています。

<p align="center">
  <img src="../../images/subgraph_isomorphism.svg" alt="The solution of the subgraph isomorphism problem" width="50%"><br>
  部分グラフ同型問題の解
</p>

## matplotlibによる可視化
以下のコードは、ホストグラフ上で部分グラフ同型の解を可視化します：
```python
import matplotlib.pyplot as plt
import networkx as nx

G_host = nx.Graph()
G_host.add_nodes_from(range(N_host))
G_host.add_edges_from(host_edges)
pos = nx.spring_layout(G_host, seed=42)

# Determine which host nodes are mapped
mapped = [0] * N_host
for i in range(N_guest):
    for j in range(N_host):
        if sol(x[i][j]) == 1:
            mapped[j] = 1
colors = ["#e74c3c" if mapped[j] else "#d5dbdb" for j in range(N_host)]

# Highlight edges corresponding to guest edges
edge_colors = []
edge_widths = []
guest_to_host = {}
for i in range(N_guest):
    for j in range(N_host):
        if sol(x[i][j]) == 1:
            guest_to_host[i] = j
for u, v in host_edges:
    host_to_guest_u = {v2: k for k, v2 in guest_to_host.items()}
    gu = host_to_guest_u.get(u)
    gv = host_to_guest_u.get(v)
    if gu is not None and gv is not None and (gu, gv) in guest_edges or (gv, gu) in guest_edges:
        edge_colors.append("#e74c3c")
        edge_widths.append(2.5)
    else:
        edge_colors.append("#cccccc")
        edge_widths.append(1.0)

nx.draw(G_host, pos, with_labels=True, node_color=colors, node_size=400,
        font_size=9, edge_color=edge_colors, width=edge_widths)
plt.title("Subgraph Isomorphism")
plt.savefig("subgraph_isomorphism.png", dpi=150, bbox_inches="tight")
plt.show()
```

写像されたホストノードは赤色で表示され、ゲストグラフの辺に対応する辺が強調表示されます。
