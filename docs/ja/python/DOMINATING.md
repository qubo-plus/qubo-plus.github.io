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
無向グラフ $G=(V,E)$ の支配集合とは、すべてのノード $u\in V$ が $S$ に含まれるか、$S$ 内の頂点に隣接しているような部分集合 $S\subseteq V$ のことです。

$N(u)=\lbrace v\in V\mid (u,v)\in E\rbrace$ を $u\in V$ の隣接ノード集合、$N[u]=\lbrace u\rbrace\cup N(u)$ を $u$ の閉近傍とします。
このとき、$S$ が支配集合であることは以下と同値です：

$$
\begin{aligned}
V = \bigcup_{u\in V} N[u].
\end{aligned}
$$

最小支配集合問題は、最小の要素数を持つ支配集合を求める問題です。

ここでは2つの定式化を示します：
- **HUBO定式化**: 高次の項を含む式を使用します。
- **QUBO定式化**: 二次式ですが、補助変数を使用します。

## 最小支配集合問題のHUBO定式化

各ノード $i\in V$ について、ノード $i$ が支配されていないのは $j\in N[i]$ のすべてについて $x_j=0$ のとき、すなわち $\prod_{j\in N[i]}\overline{x}_j=1$ のときのみです。
したがって、制約を以下のように定義します：

$$
\begin{aligned}
\text{constraint} = \sum_{i=0}^{n-1} \prod_{j\in N[i]}\overline{x}_j
\end{aligned}
$$

目的関数は、選択されたノード数の最小化です：

$$
\begin{aligned}
\text{objective} = \sum_{i=0}^{n-1} x_i
\end{aligned}
$$

最終的な式 $f$ は以下のとおりです：

$$
\begin{aligned}
f &= \text{objective} + (n+1)\times \text{constraint}
\end{aligned}
$$

## HUBO定式化のPyQBPPプログラム
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

x = qbpp.var("x", N)

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
sol = solver.search({"time_limit": 1.0})

print(f"objective = {sol(objective)}")
print(f"constraint = {sol(constraint)}")
print("Dominating set:", end="")
for i in range(N):
    if sol(x[i]) == 1:
        print(f" {i}", end="")
print()
```
このプログラムは、まず辺リスト `edges` から隣接リスト `adj` を構築します。
次に、HUBO定式化に従って `constraint`、`objective`、`f` を構築します。

このプログラムの出力は以下のとおりです：
```
objective = 5
constraint = 0
```

## QUBO定式化とPyQBPPプログラム
ノード $i$ が支配されているとは、$N[i]\cap S$ が空でないことを意味します。
この条件は以下の不等式と同値です：

$$
\begin{aligned}
\sum_{j\in N[i]}x_j &\geq 1
\end{aligned}
$$

この制約はPyQBPPで以下のように記述できます：
```python
import pyqbpp as qbpp

constraint = 0
for i in range(N):
    t = x[i]
    for j in adj[i]:
        t += x[j]
    constraint += qbpp.between(t, 1, len(adj[i]) + 1)
```
このコードでは、`t` は式 $\sum_{j\in N[i]}x_j$ を格納し、`between()` 関数は $1\leq \sum_{j\in N[i]}x_j \leq |N[i]|+1$ のペナルティ式を生成します。この式は不等式が満たされている場合にのみ最小値0をとります。

### C++ QUBO++との比較

| C++ QUBO++                  | PyQBPP                                |
|-----------------------------|----------------------------------------|
| `~x[i]`                    | `~x[i]`                               |
| `1 <= t <= +qbpp::inf`     | `between(t, 1, upper_bound)`          |

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
