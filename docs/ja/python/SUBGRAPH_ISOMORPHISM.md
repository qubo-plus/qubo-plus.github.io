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
2つの無向グラフ $G_H=(V_H,E_H)$（ホストグラフ）と $G_G=(V_G,E_G)$（ゲストグラフ）が与えられたとき、**部分グラフ同型問題**は $G_H$ が $G_G$ と同型な部分グラフを含むかどうかを判定する問題です。

より形式的には、すべての辺 $(u,v)\in E_G$ に対して $(\sigma(u),\sigma(v))$ がホストグラフの辺でもある（すなわち $(\sigma(u),\sigma(v))\in E_H$）ような**単射** $\sigma:V_G\rightarrow V_H$ を見つけることが目標です。

例として、以下のホストグラフとゲストグラフを考えます:
<p align="center">
  <img src="../../images/host_graph.svg" alt="ホストグラフ" width="50%"><br>
  10頂点のホストグラフ $G_H=(V_H,E_H)$ の例
</p>

<p align="center">
  <img src="../../images/guest_graph.svg" alt="ゲストグラフ" width="30%"><br>
  6頂点のゲストグラフ $G_G=(V_G,E_G)$ の例
</p>

解 $\sigma$ の一例は次の通りです:

| $G_G$ の頂点 $i$ | 0 | 1 | 2 | 3 | 4 | 5 |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| $G_H$ の頂点 $\sigma(i)$ | 1 | 4 | 6 | 7 | 9 | 8 |


この解は次のように可視化されます:

<p align="center">
  <img src="../../images/subgraph_isomorphism.svg" alt="部分グラフ同型問題の解" width="50%"><br>
  部分グラフ同型問題の解
</p>

## 部分グラフ同型問題のQUBO定式化
**ゲストグラフ** $G_G=(V_G,E_G)$ が $m$ 個の頂点（ラベル $0, 1, \ldots m-1$）を持ち、**ホストグラフ** $G_H=(V_H,E_H)$ が $n$ 個の頂点（ラベル $0, 1, \ldots n-1$）を持つとします。
$mn$ 個のバイナリ変数を持つ $m\times n$ の**バイナリ行列** $X=(x_{i,j})$（$0\leq i\leq m-1, 0\leq j\leq n-1$）を導入します。
この行列は単射 $\sigma:V_G\rightarrow V_H$ を表し、$x_{i,j}=1$ は $\sigma(i)=j$ の場合です。

例えば、部分グラフ同型問題の解は以下の $6\times 10$ バイナリ行列で表現できます:

| $i$ | $\sigma(i)$ | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 0 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 1 | 4 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| 2 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| 3 | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| 4 | 9 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| 5 | 8 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 |

$X$ は単射を表すため、以下の制約を満たす必要があります:
- **行制約**: 各ゲスト頂点はちょうど1つのホスト頂点に写像される。すなわち各行の和が1。
- **列制約**: 各ホスト頂点は高々1つのゲスト頂点から写像される。すなわち各列の和が0または1。

これらをまとめると、すべての制約が満たされたときに最小値をとる以下の**QUBO++形式の制約**になります:

$$
\begin{aligned}
\text{constraint} &= \sum_{i=0}^{m-1}\Bigl(\sum_{j=0}^{n-1}x_{i,j} = 1\Bigr)+\sum_{j=0}^{m-1}\Bigl(0\leq \sum_{i=0}^{n-1}x_{i,j} \leq 1\Bigr)
\end{aligned}
$$

QUBO形式では、同じ制約を次のように表現できます:

$$
\begin{aligned}
\text{constraint}
 &=  \sum_{i=0}^{m-1}\Bigl(\sum_{j=0}^{n-1}x_{i,j} - 1\Bigr)^2+\sum_{j=0}^{m-1}\sum_{i=0}^{n-1}x_{i,j}\Bigl(\sum_{i=0}^{n-1}x_{i,j}-1\Bigr)
\end{aligned}
$$

次に、目的関数をホスト辺に写像されたゲスト辺の数として定義します:

$$
\begin{aligned}
\text{objective} &= \sum_{(u_G,v_G)\in E_G}\sum_{(u_H,v_H)\in E_H} (x_{u_G,u_H}x_{v_G,v_H}+x_{u_G,v_H}x_{v_G,u_H})
\end{aligned}
$$

ここで、無向のゲスト辺 $(u_G,v_G)\in E_G$ はホスト辺 $(u_H,v_H)\in E_H$ に2つの対称的な方法で対応できます:
- $(u_G, v_G)\mapsto (u_H,v_H)$
- $(u_G, v_G)\mapsto (v_H,u_H)$

したがって、2次の項 $x_{u_G,u_H}x_{v_G,v_H}$ と $x_{u_G,v_H}x_{v_G,u_H}$ の両方を含めます。

最終的に、目的関数と制約を1つのQUBO式にまとめます:

$$
\begin{aligned}
f  &= -\text{objective} + mn\times \text{constraint}
\end{aligned}
$$

ペナルティ係数 $mn$ は、目的関数の改善よりも制約の充足を優先するために選ばれています。
$f$ の最良値は、制約項が0で目的関数がゲスト辺の数に等しいときに達成されます。

## 部分グラフ同型問題のPyQBPPプログラム
上記のQUBO定式化に基づき、以下のPyQBPPプログラムは $M=6$ 頂点のゲストグラフと $N=10$ 頂点のホストグラフに対する部分グラフ同型問題を解きます:
{% raw %}
```python
import pyqbpp as qbpp

N = 10
host = [
    (0, 1), (0, 2), (1, 3), (1, 4), (1, 6), (2, 5), (3, 7), (4, 6),
    (4, 7), (5, 6), (5, 8), (6, 8), (6, 7), (7, 9), (8, 9)]

M = 6
guest = [
    (0, 1), (0, 2), (1, 2), (1, 3), (2, 3), (2, 5), (3, 4), (4, 5)]

x = qbpp.var("x", shape=(M, N))

host_assigned = qbpp.vector_sum(x, 0)

constraint = qbpp.sum(qbpp.constrain(qbpp.vector_sum(x, 1), equal=1)) + \
             qbpp.sum(qbpp.constrain(host_assigned, between=(0, 1)))

objective = 0
for ug, vg in guest:
    for uh, vh in host:
        objective += x[ug][uh] * x[vg][vh] + x[ug][vh] * x[vg][uh]

f = -objective + constraint * (M * N)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=-len(guest))

print(f"sol(x) = {sol(x)}")
print(f"sol(objective) = {sol(objective)}")
print(f"sol(constraint) = {sol(constraint)}")

guest_to_host = qbpp.onehot_to_int(sol(x), axis=1)
print(f"guest_to_host = {guest_to_host}")

host_to_guest = qbpp.onehot_to_int(sol(x), axis=0)
print(f"host_to_guest = {host_to_guest}")
```
{% endraw %}
ゲストグラフとホストグラフは、それぞれ辺リスト `guest` と `host` として与えられます。
$M\times N$ のバイナリ行列 `x` を定義し、上記の定式化に従って `constraint`、`objective`、`f` を構成します。

Easy Solver のインスタンスを `f` に対して作成し、目標エネルギーを $-|E_G|$（ゲスト辺数の負の値）に設定します。これはすべてのゲスト辺がホスト辺に写像されたときの `-objective` の最良値です。
得られた解は `sol` に格納されます。
`sol` の下での `x`、`objective`、`constraint` の値が出力されます。

関数 **`qbpp.onehot_to_int()`** を用いて、ゲスト頂点からホスト頂点への写像（`guest_to_host`、$\sigma$）とホスト頂点からゲスト頂点への写像（`host_to_guest`、$\sigma^{-1}$）も出力します。

このプログラムは以下の出力を生成します:
{% raw %}
```
sol(x) = {{0,1,0,0,0,0,0,0,0,0},{0,0,0,0,1,0,0,0,0,0},{0,0,0,0,0,0,1,0,0,0},{0,0,0,0,0,0,0,1,0,0},{0,0,0,0,0,0,0,0,0,1},{0,0,0,0,0,0,0,0,1,0}}
sol(objective) = 8
sol(constraint) = 0
guest_to_host = {1,4,6,7,9,8}
host_to_guest = {-1,0,-1,-1,1,-1,2,3,5,4}
```
{% endraw %}
目的関数値はゲスト辺の数（$|E_G|=8$）に等しく、すべての制約が満たされています（`constraint` = 0）。
したがって、プログラムは有効な部分グラフ同型に対応する最適解を見つけました。
`host_to_guest` のエントリが `-1` の場合、対応するホスト頂点にはゲスト頂点が写像されていないことを意味します。

## matplotlibによる可視化
以下のコードは、ホストグラフ上で部分グラフ同型の解を可視化します:
```python
import matplotlib.pyplot as plt
import networkx as nx

G_host = nx.Graph()
G_host.add_nodes_from(range(N))
G_host.add_edges_from(host)
pos = nx.spring_layout(G_host, seed=42)

# 写像されたホスト頂点を特定
mapped = [0] * N
for i in range(M):
    for j in range(N):
        if sol(x[i][j]) == 1:
            mapped[j] = 1
colors = ["#e74c3c" if mapped[j] else "#d5dbdb" for j in range(N)]

# ゲスト辺に対応する辺を強調
guest_adj = set()
for u, v in guest:
    guest_adj.add((u, v))
    guest_adj.add((v, u))

guest_to_host_map = {}
for i in range(M):
    for j in range(N):
        if sol(x[i][j]) == 1:
            guest_to_host_map[i] = j
host_to_guest_map = {v: k for k, v in guest_to_host_map.items()}

edge_colors = []
edge_widths = []
for u, v in host:
    gu = host_to_guest_map.get(u)
    gv = host_to_guest_map.get(v)
    if gu is not None and gv is not None and (gu, gv) in guest_adj:
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

写像されたホスト頂点は赤色で表示され、ゲスト辺に対応する辺が強調表示されます。
