---
layout: default
nav_exclude: true
title: "Dominating Set"
nav_order: 55
lang: ja
hreflang_alt: "en/python/DOMINATING"
hreflang_lang: "en"
---

# 最小支配集合問題
無向グラフ $G=(V,E)$ の支配集合とは、すべての頂点 $u\in V$ が $S$ に含まれるか、$S$ 中の頂点に隣接しているような部分集合 $S\subseteq V$ のことです。

$N(u)=\lbrace v\in V\mid (u,v)\in E\rbrace$ を $u\in V$ の隣接頂点の集合、$N[u]=\lbrace u\rbrace\cup N(u)$ を $u$ の閉近傍とします。
このとき、$S$ が支配集合であるための必要十分条件は

$$
\begin{aligned}
V = \bigcup_{u\in V} N[u].
\end{aligned}
$$

です。

最小支配集合問題は、要素数が最小の支配集合を求める問題です。
$n$ 頂点のグラフ $G=(V,E)$（頂点に $0,1,\ldots,n-1$ のラベルが付いている）に対して、$n$ 個のバイナリ変数 $x_0, x_1, \ldots, x_{n-1}$ を導入します。ここで $x_i=1$ は頂点 $i$ が支配集合 $S$ に含まれる場合です。
否定リテラル $\overline{x}_i$（$\overline{x}_i=1$ は $x_i=0$ のとき）を用いると、以下に示すようにHUBO制約の定式化が簡潔になります。

ここでは2つの定式化を示します：
- **HUBO定式化**: 高次の項を含む式を使用します。
- **QUBO定式化**: 二次式ですが、補助変数を使用します。

## 最小支配集合問題のHUBO定式化
各頂点 $i\in V$ に対して、以下の条件が満たされなければなりません:
- ある $j\in N[i]$ に対して $x_j=1$（すなわち頂点 $i$ が支配されている）。

頂点 $i$ が支配されていないのは、すべての $j\in N[i]$ に対して $x_j=0$ のとき、すなわち $\prod_{j\in N[i]}\overline{x}_j=1$ のときのみです。
したがって、制約を次のように定義します：

$$
\begin{aligned}
\text{constraint} = \sum_{i=0}^{n-1} \prod_{j\in N[i]}\overline{x}_j
\end{aligned}
$$

頂点 $i$ に対する項の次数は $\lvert N[i] \rvert$ であるため、制約は2次にならない場合があります。

目的関数は、選択された頂点の数を最小化することです：

$$
\begin{aligned}
\text{objective} = \sum_{i=0}^{n-1} x_i
\end{aligned}
$$

最終的に、式 $f$ は次のようになります：

$$
\begin{aligned}
f &= \text{objective} + (n+1)\times \text{constraint}
\end{aligned}
$$

ペナルティ係数 $n+1$ は、目的関数の最小化よりも支配集合制約の充足を優先するための安全な値です。

## HUBO定式化のPyQBPPプログラム
以下のPyQBPPプログラムは、$N=16$ 頂点のグラフに対する解を求めます：
```python
import pyqbpp as qbpp

N = 16
edges = [
    (0, 1),  (0, 2),  (1, 3),  (1, 4),  (2, 5),  (2, 6),
    (3, 7),  (3, 13), (4, 6),  (4, 7),  (5, 8),  (6, 8),
    (6, 14), (7, 14), (8, 9),  (9, 10), (9, 12), (10, 11),
    (10, 12),(11, 13),(12, 14),(13, 15),(14, 15)]

adj = [[] for _ in range(N)]
for u, v in edges:
    adj[u].append(v)
    adj[v].append(u)

x = qbpp.var("x", shape=N)

objective = qbpp.sum(x)

constraint = 0
for i in range(N):
    t = ~x[i]
    for j in adj[i]:
        t *= ~x[j]
    constraint += t

f = objective + (N + 1) * constraint
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)

print(f"objective = {sol(objective)}")
print(f"constraint = {sol(constraint)}")
print("Dominating set:", end="")
for i in range(N):
    if sol(x[i]) == 1:
        print(f" {i}", end="")
print()
```
このプログラムは、まず辺リスト `edges` から隣接リスト `adj` を構築します。各 `adj[i]` には頂点 `i` の隣接頂点が格納されます。
次に、HUBO定式化に従って `constraint`、`objective`、`f` を構成します。
Easy Solver を `f` に適用して解 `sol` を求めます。
`sol` に対する `objective` と `constraint` の値が出力され、続いて支配集合を構成する選択された頂点のリストが出力されます。

このプログラムの出力は以下のとおりです：
```
objective = 5
constraint = 0
```

## QUBO定式化とPyQBPPプログラム
頂点 $i$ が支配されているとは、$N[i]\cap S$ が空でないことです。
バイナリ変数 $x_i$（$x_j=1$ は頂点 $j$ が $S$ に含まれることを意味する）を用いると、この条件は以下の不等式と同値です：

$$
\begin{aligned}
\sum_{j\in N[i]}x_j &\geq 1
\end{aligned}
$$

PyQBPPの記法では、ペナルティ式の和として支配集合制約を表現できます：

$$
\begin{aligned}
\text{constraint} &= \sum_{i=0}^{n-1} \bigl(\sum_{j\in N[i]}x_j \geq 1\bigr)
\end{aligned}
$$

目的関数と `f` はHUBO定式化と同様に定義できます。

上記の制約はPyQBPPプログラムとして次のように記述できます：
```python
constraint = 0
for i in range(N):
    t = x[i]
    for j in adj[i]:
        t += x[j]
    constraint += qbpp.constrain(t, between=(1, len(adj[i]) + 1))
```
このコードでは、`t` に式

$$
\sum_{j\in N[i]}x_j
$$

が格納され、`qbpp.constrain()` により

$$
1\leq \sum_{j\in N[i]}x_j \leq |N[i]|+1,
$$

に対するペナルティ式が生成されます。この式は不等式が満たされるときにのみ最小値0をとります。
`f` を最小化することで、プログラムは最小支配集合を求めます。

なお、PyQBPPの `between` には有限の上限値を明示的に指定する必要があります。$\sum_{j\in N[i]}x_j$ は $|N[i]|$ を超えないため、$|N[i]|+1$ を上限とすれば十分です。

## matplotlibによる可視化
以下のコードは支配集合の解を可視化します：
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
plt.title("Minimum Dominating Set")
plt.savefig("dominating_set.png", dpi=150, bbox_inches="tight")
plt.show()
```

支配集合の頂点は赤色で表示されます。すべての灰色のノードは少なくとも1つの赤いノードに隣接しています。
