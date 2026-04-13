---
layout: default
nav_exclude: true
title: "CVRP"
nav_order: 61
lang: ja
hreflang_alt: "en/python/CVRP"
hreflang_lang: "en"
---

# 容量制約付き配車計画問題（CVRP）
**容量制約付き配車計画問題（CVRP）**は、1つの**デポ**を出発・帰着点とし、すべての**顧客**を訪問する $V$ 台の**車両**の経路集合を求める問題です。
**地点**を $i \in \lbrace 0,1,\ldots,N-1\rbrace$ でインデックス付けし、地点0をデポ、地点 $1,\ldots,N-1$ を顧客とします。
各顧客 $i\in \lbrace 1,\ldots,N-1\rbrace$ には配送すべき需要量 $d_i$ があります（デポについては $d_0=0$ とします）。
各車両 $v \in \lbrace 0,\ldots,V-1\rbrace$ はデポを出発し、顧客の部分集合を訪問してデポに戻ります。このとき、経路上の配送需要の合計が車両容量 $q_v$ を超えないという容量制約を満たす必要があります。
目的は、すべての車両の総移動コストを最小化することです。

## QUBO定式化
$V\times N\times N$ のバイナリ変数の配列 $A=(a_{v,t,i})$ を使用します。
$a_{v,t,i}$ は車両 $v$ の $t$ 番目の訪問地点が地点 $i$ である場合にのみ1となります。

### 制約
- **行制約**: 各車両は各時刻 $t$ においてちょうど1つの地点にいなければならない。
- **列制約**: 各顧客はちょうど1回訪問されなければならない。
- **連続デポ制約**: 車両がデポに戻ったら、そこに留まらなければならない。
- **容量制約**: 各経路上の総需要量が車両容量を超えてはならない。

### 目的関数
総巡回コストは連続する訪問地点から計算されます：

$$
\begin{aligned}
\text{objective} &= \sum_{v=0}^{V-1}\sum_{t=0}^{N-1}\sum_{i=0}^{N-1}\sum_{j=0}^{N-1}c_{i,j}a_{v,t,i}a_{v,(t+1)\bmod N, j}
\end{aligned}
$$

## PyQBPPプログラム
```python
import math
import pyqbpp as qbpp

locations = [
    (200, 200, 0),  (247, 296, 44), (31, 393, 57), (96, 398, 94),
    (391, 230, 91), (118, 95, 66),  (197, 99, 59), (224, 8, 10),
    (3, 10, 52),    (281, 379, 83)]
vehicle_capacity = [100, 200, 300]

N = len(locations)
V = len(vehicle_capacity)

a = qbpp.var("a", V, N, N)

row_constraint = qbpp.sum(qbpp.constrain(qbpp.vector_sum(a), equal=1))

column_sum = [0 for _ in range(N - 1)]
for v in range(V):
    for t in range(N):
        for i in range(1, N):
            column_sum[i - 1] += a[v][t][i]
column_constraint = 0
for i in range(N - 1):
    column_constraint += qbpp.constrain(column_sum[i], equal=1)

consecutive_constraint = 0
for v in range(V):
    for t in range(1, N - 1):
        consecutive_constraint += a[v][t][0] * (1 - a[v][t + 1][0])

vehicle_load = [0 for _ in range(V)]
capacity_constraint = 0
for v in range(V):
    for t in range(N):
        for i in range(1, N):
            vehicle_load[v] += a[v][t][i] * locations[i][2]
    capacity_constraint += qbpp.constrain(vehicle_load[v], between=(0, vehicle_capacity[v]))

objective = 0
for v in range(V):
    for t in range(N):
        next_t = (t + 1) % N
        for i in range(N):
            x1, y1 = locations[i][0], locations[i][1]
            for j in range(N):
                x2, y2 = locations[j][0], locations[j][1]
                dist = int(math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2))
                objective += dist * a[v][t][i] * a[v][next_t][j]

f = objective + 10000 * (row_constraint + column_constraint +
                          consecutive_constraint + capacity_constraint)

ml = {a[v][0][0]: 1 for v in range(V)}
ml.update({a[v][0][i]: 0 for v in range(V) for i in range(1, N)})

g = qbpp.replace(f, ml)
f.simplify_as_binary()
g.simplify_as_binary()
solver = qbpp.EasySolver(g)

sol = solver.search()

full_sol = qbpp.Sol(f).set([sol, ml])

print(f"row_constraint = {full_sol(row_constraint)}")
print(f"column_constraint = {full_sol(column_constraint)}")
print(f"consecutive_constraint = {full_sol(consecutive_constraint)}")
print(f"capacity_constraint = {full_sol(capacity_constraint)}")
print(f"objective = {full_sol(objective)}")

for v in range(V):
    load = full_sol(vehicle_load[v])
    route = f"Vehicle {v} : load = {load} / {vehicle_capacity[v]} : 0 "
    for t in range(1, N):
        for i in range(1, N):
            if full_sol(a[v][t][i]) == 1:
                route += f"-> {i}({locations[i][2]}) "
                break
    route += "-> 0"
    print(route)
```
このプログラムは $V\times N\times N$ のバイナリ変数の配列 `a` を定義します。
次に、上記の定式化に従って目的関数と制約項を定義します。

すべての車両の最初の訪問地点（$t=0$）をデポ（地点0）に固定するため、辞書を構築し `replace()` を使って適用します。

例えば、このプログラムは以下の結果を出力します：
```
row_constraint = 0
column_constraint = 0
consecutive_constraint = 0
capacity_constraint = 0
objective = 2142
Vehicle 0 : load = 91 / 100 : 0 -> 4(91) -> 0
Vehicle 1 : load = 177 / 200 : 0 -> 6(59) -> 5(66) -> 8(52) -> 0
Vehicle 2 : load = 288 / 300 : 0 -> 7(10) -> 9(83) -> 1(44) -> 3(94) -> 2(57) -> 0
```

## matplotlibによる可視化
以下のコードはCVRPの解を可視化します：
```python
import matplotlib.pyplot as plt

vehicle_colors = ["#e74c3c", "#3498db", "#2ecc71"]
plt.figure(figsize=(6, 6))
for i, (lx, ly, q) in enumerate(locations):
    plt.plot(lx, ly, "ko", markersize=8)
    plt.annotate(f"{i}" + (f"({q})" if q > 0 else ""),
                 (lx, ly), textcoords="offset points", xytext=(5, 5))

for v in range(V):
    route_nodes = [0]
    for t in range(1, N):
        for i in range(1, N):
            if full_sol(a[v][t][i]) == 1:
                route_nodes.append(i)
                break
    route_nodes.append(0)
    for k in range(len(route_nodes) - 1):
        fr, to = route_nodes[k], route_nodes[k + 1]
        plt.annotate("", xy=(locations[to][0], locations[to][1]),
                     xytext=(locations[fr][0], locations[fr][1]),
                     arrowprops=dict(arrowstyle="->", color=vehicle_colors[v],
                                    lw=2))
plt.title("CVRP Solution")
plt.savefig("cvrp.png", dpi=150, bbox_inches="tight")
plt.show()
```

各車両の経路は異なる色で表示され、矢印が移動方向を示しています。
