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
**容量制約付き配車計画問題（CVRP）**は、単一の**デポ**から出発して戻る $V$ 台の**車両**の経路集合を求め、すべての**顧客**にサービスを提供することを目的とする問題です。
**場所**を $i \in \lbrace 0,1,\ldots,N-1\rbrace$ でインデックス付けし、場所0をデポ、場所 $1,\ldots,N-1$ を顧客とします。
各顧客 $i\in \lbrace 1,\ldots,N-1\rbrace$ には配送すべき需要量 $d_i$ があります（デポでは $d_0=0$ とします）。
各車両 $v \in \lbrace 0,\ldots,V-1\rbrace$ はデポを出発し、顧客の部分集合を訪問してデポに戻ります。このとき、経路上の配送需要の合計が車両容量 $q_v$ を超えないという容量制約を満たす必要があります。
目的関数は、全車両の総移動コストを最小化することです。

場所は2次元平面上の点であり、2つの場所間の移動コストはユークリッド距離であると仮定します。
$c_{i,j}$ を場所 $i$ と $j$ の間の距離（コスト）とします。

## QUBO++定式化：バイナリ変数の配列
CVRPをQUBO式として定式化するために、$V\times N\times N$ のバイナリ変数配列 $A=(a_{v,t,i})$（$0\leq v\leq V, 0\leq t,i\leq N-1$）を使用します。
ここで $a_{v,t,i}$ は、車両 $v$ の $t$ 番目に訪問する場所が場所 $i$ である場合にのみ1となります。

以下は $V=3$、$N=10$ における $A=(a_{v,t,i})$ の割り当ての例で、CVRPの解を表しています。
各車両はデポ（場所0）から出発し、いくつかの顧客を訪問した後デポに戻ります。
車両がデポに戻った後は、残りの時間ステップではデポに留まります。
各顧客 $1, \ldots, 9$ はちょうど1台の車両によってちょうど1回訪問されるため、この配列は実行可能なCVRPの解を表しています。

### 車両 $v=0$
巡回路: $0\rightarrow 4\rightarrow 0$

| t \ i | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | onehot value |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 4 |
| 2 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 3 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 4 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 5 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 6 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 7 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 8 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 9 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |


### 車両 $v=1$
巡回路: $0\rightarrow 6\rightarrow 5\rightarrow 8\rightarrow  0$

| t \ i | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | onehot value |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 6 |
| 2 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 5 |
| 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 8 |
| 4 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 5 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 6 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 7 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 8 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 9 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

### 車両 $v=2$

巡回路: $0\rightarrow 7\rightarrow 9\rightarrow 1\rightarrow  3\rightarrow  2\rightarrow  0$

| t \ i | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | onehot value |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 7 |
| 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 9 |
| 3 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| 4 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 3 |
| 5 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 |
| 6 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 7 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 8 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 9 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |


## QUBO++定式化の制約

### 行制約（各時刻でone-hot）
各車両は各時刻 $t$ でちょうど1つの場所にいなければなりません。
one-hot制約を課します:

$$
\begin{aligned}
\text{row}\_\text{constraint} & = \sum_{v=0}^{V-1}\sum_{t=0}^{N-1}\bigr(\sum_{i=0}^{N-1} a_{v,t,i} = 1\bigl)\\
 &= \sum_{v=0}^{V-1}\sum_{t=0}^{N-1}\bigr(1-\sum_{i=0}^{N-1} a_{v,t,i}\bigl)^2
\end{aligned}
$$

**row\_constraint** は、すべての行がone-hotである場合にのみ最小値 $0$ をとります。

また、最初の位置をデポに固定します:

$$
\begin{aligned}
a_{v,0,0}& = 1 && (0\leq v\leq V-1) \\
a_{v,0,i}& = 0 && (0\leq v\leq V-1, 1\leq i\leq N-1)
\end{aligned}
$$

これらは変数の固定により強制できます。

### 連続デポ制約（「デポを再び出発しない」制約）
車両がデポに戻った後に再び顧客を訪問するパターンを禁止します。
デポ指示変数 $a_{v,t,0}$ を用いて、列

$$
a_{v,1,0}, a_{v,2,0}, \ldots, a_{v,N-1,0}
$$

が連続する0の後に連続する1で構成される（すなわち1になったら1のまま）ことを要求します。
禁止された遷移 $1\rightarrow 0$ にペナルティを与えることで強制します:

$$
\begin{aligned}
\text{consecutive}\_\text{constraint} &= \sum_{v=0}^{V-1}\sum_{t=1}^{N-2} (1-a_{v,t})a_{v,t+1}
\end{aligned}
$$

**consecutive\_constraint** は、デポ指示変数が $t$（$1\leq t\leq N-1$）について単調非減少である場合にのみ0をとります。

この制約は距離メトリックが三角不等式を満たす場合は冗長（そのような「再出発」解は最適になり得ない）ですが、ソルバーがそのような非最適な構造を避けるのに役立つことが多いです。

### 列制約
各顧客はちょうど1台の車両によってちょうど1つの時刻に1回だけ訪問されなければなりません:

$$
\begin{aligned}
\text{column}\_\text{constraint}
& = \sum_{i=1}^{N-1}\bigr(\sum_{v=0}^{V-1}\sum_{t=0}^{N-1} a_{v,t,i} = 1\bigl)\\
 &= \sum_{i=1}^{N-1}\bigr(1-\sum_{v=0}^{V-1}\sum_{t=0}^{N-1} a_{v,t,i}\bigl)^2
\end{aligned}
$$

**column\_constraint** は、すべての顧客 $i = 1, \dots ,N-1$ がちょうど1回訪問される場合にのみ0をとります。

### 容量制約
各車両 $v$ の配送需要の合計は

$$
\sum_{t=1}^{N-1}\sum_{i=1}^{N-1}d_ia_{v,t,i},
$$

であり、$q_v$ 以下でなければなりません。
以下の制約が0でなければなりません:

$$
\begin{aligned}
\text{capacity}\_\text{constraint} &= \sum_{v=0}^{V-1}\Bigr(0\leq \sum_{t=1}^{N-1}\sum_{i=1}^{N-1}d_ia_{v,t,i}\leq q_v\Bigl)
\end{aligned}
$$

**capacity\_constraint** は、すべての車両が容量を超えない場合にのみ0をとります。


## QUBO定式化の目的関数

総巡回コストは連続して訪問する場所から計算されます:

$$
\begin{aligned}
\text{objective} &= \sum_{v=0}^{V-1}\sum_{t=0}^{N-1}\sum_{i=0}^{N-1}\sum_{j=0}^{N-1}c_{i,j}a_{v,t,i}a_{v,(t+1)\bmod N, j}
\end{aligned}
$$

車両 $v$ が時間ステップ $t$ で場所 $i$ を訪問し、時間ステップ $(t+1)\bmod N$ で場所 $j$ に移動する場合、$a_{v,t,i}=a_{v,(t+1)\bmod N, j}=1$ となります。
この場合、対応する項は $c_{i,j}$ を和に寄与します。したがって、すべての制約が満たされている（各 $(v,t)$ にちょうど1つのアクティブな場所がある）とき、$\text{objective}$ はすべての車両の総移動コストに等しくなります。

ユークリッドメトリックの下では、すべての $i$ に対して $c_{i,i}=0$ であるため、同じ場所に留まっても追加コストは発生しません。

## CVRPのQUBO定式化

目的関数と制約を組み合わせて、QUBOを得ます:

$$
\begin{aligned}
f &= \text{objective} + P\cdot (\text{row}\_\text{constraint}+\text{consecutive}\_\text{constraint}+\text{column}\_\text{constraint}+\text{capacity}\_\text{constraint}),
\end{aligned}
$$

ここで $P$ は十分に大きな定数であり、コスト最小化よりも実行可能性（制約充足）が優先されます。

## PyQBPPプログラム
以下のPyQBPPプログラムは、$N=10$ 箇所、$V=3$ 台の車両のCVRPインスタンスの解を求めます。
リスト `locations` は3つ組 `(x,y,d)` を格納し、`(x,y)` は場所の2D座標、`d` は顧客の需要量（デポの需要量は0）です。
リスト `vehicle_capacity` は $V=3$ 台の車両の容量を格納します。
この例では `[100, 200, 300]` に設定されているため、車両0、1、2はそれぞれ小、中、大の容量を持ちます。

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

a = qbpp.var("a", shape=(V, N, N))

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
このプログラムは、$V\times N\times N$ のバイナリ変数配列 `a` を定義します。
次に、上記の定式化に従って目的関数項 `objective` と制約項 `row_constraint`、`column_constraint`、`consecutive_constraint`、`capacity_constraint` を定義し、ペナルティ付き目的関数
`f = objective + 10000 * ( row_constraint + column_constraint + consecutive_constraint + capacity_constraint )` にまとめます。

すべての車両の最初の訪問場所（$t=0$）をデポ（場所0）に固定するために、プログラムは辞書 `ml` を構成し、`qbpp.replace()` を使って `f` に適用します。
結果の式は `g` に格納されます。
次に Easy Solver を使って `g` を最小化する割り当て `sol` を探索します。

`g` には `ml` で固定された変数が含まれないため、プログラムは `sol` と `ml` を `full_sol` にマージし、`a` のすべての変数に値を割り当てます。
`full_sol` を使って各制約項と目的関数の値を出力し、$V=3$ 台の車両の巡回路も出力します。

例えば、プログラムは以下の結果を出力します:
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
