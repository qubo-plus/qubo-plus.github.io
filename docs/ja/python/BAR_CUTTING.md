---
layout: default
nav_exclude: true
title: "Cutting Stock"
nav_order: 73
lang: ja
hreflang_alt: "en/python/BAR_CUTTING"
hreflang_lang: "en"
---

# 切出し問題（Cutting Stock Problem）
固定長 $L$ の同一の棒が $M$ 本と、ペア $(l_j,c_j)$ ($0\leq j\leq N-1$) で指定される $N$ 件の注文が与えられるとします。ここで $l_j$ は必要な長さ、$c_j$ は注文 $j$ の必要数量です。
**切出し問題**は、$M$ 本の棒をどのように切断すればすべての注文を満たせるかを決定することを目的とします。

一般に、切出し問題は使用する棒の本数を最小化する最小化問題として定式化されます。
簡単のため、この例では $M$ 本の棒で $N$ 件のすべての注文を満たせるかどうかを判定する実行可能性問題を考えます。


$x_{i,j}$ ($0\leq i\leq M-1, 0\leq j\leq N-1$) を棒 $i$ から切り出す注文 $j$ のピース数とします。
以下の制約を満たす必要があります。

### 注文制約：
各注文 $j$ について、すべての棒に割り当てられたピースの合計は $c_j$ に等しくなければなりません：

$$
\begin{aligned}
 \sum_{i=0}^{M-1}x_{i,j} &= c_j & &(0\leq j\leq N-1)
\end{aligned}
$$

### 棒制約
各棒 $i$ について、割り当てられたピースの合計長は $L$ を超えてはなりません：

$$
\begin{aligned}
 \sum_{j=0}^{N-1}l_jx_{i,j} &\leq  L & &(0\leq i\leq M-1)
\end{aligned}
$$

## PyQBPPプログラム
以下のPyQBPPプログラムは、長さ $L=60$ の $M=6$ 本の棒と以下の $N=4$ 件の注文に対する実行可能な切断計画を求めます：

| 注文 $j$ | 0 | 1 | 2 | 3 |
|:---:|:---:|:---:|:---:|:---:|
| 長さ $l_j$ | 13 | 23 | 8 | 11 |
| 数量 $c_j$ | 10 | 4 | 8 | 6 |

この切出し問題のPyQBPPプログラムは以下のとおりです：

```python
import pyqbpp as qbpp

L = 60
l = [13, 23, 8, 11]
c = [10, 4, 8, 6]
N = len(l)
M = 6

# 棒 i から切り出される注文 j のピース数を表す整数変数 x[i][j] を生成
x = [[qbpp.var(between=(0, c[j])) for j in range(N)] for i in range(M)]

# 注文制約：各注文について合計ピース数が c[j] と等しくなければならない
order_fulfilled_count = []
order_constraint = 0
for j in range(N):
    col_sum = 0
    for i in range(M):
        col_sum += x[i][j]
    order_fulfilled_count.append(col_sum)
    order_constraint += qbpp.constrain(col_sum, equal=c[j])

# 棒制約：各棒で使用される合計長は L を超えてはならない
bar_length_used = []
bar_constraint = 0
for i in range(M):
    used = 0
    for j in range(N):
        used += x[i][j] * l[j]
    bar_length_used.append(used)
    bar_constraint += qbpp.constrain(used, between=(0, L))

f = order_constraint + bar_constraint
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=10.0, target_energy=0)

for i in range(M):
    pieces = "  ".join(str(sol(x[i][j])) for j in range(N))
    used = sol(bar_length_used[i])
    print(f"Bar {i}:  {pieces}   used = {used}, waste = {L - used}")

for j in range(N):
    fulfilled = sol(order_fulfilled_count[j])
    print(f"Order {j} fulfilled = {fulfilled}, required = {c[j]}")
```
このプログラムは整数変数の `M`$\times$`N` 行列 `x` を作成します。各エントリ `x[i][j]` は `qbpp.var(between=(0, c[j]))` により生成され、`c[j]` 以下の非負整数値をとります。

制約は以下のように定義されます：
- `order_fulfilled_count`: $N$ 個の式のリストで、`order_fulfilled_count[j]` は注文 $j$ について生産されたピースの合計数を表します。
- `order_constraint`: `qbpp.constrain(col_sum, equal=c[j])` で構築された $N$ 個の制約式の和で、すべての $j$ に対して `col_sum == c[j]` を強制します。
- `bar_length_used`: $M$ 個の式のリストで、`bar_length_used[i]` は棒 $i$ で使用された合計長を表します。
- `bar_constraint`: `qbpp.constrain(used, between=(0, L))` で構築された $M$ 個の制約式の和で、すべての $i$ に対して `0 <= bar_length_used[i] <= L` を強制します。
- `f`: すべての制約式の和です。`f.simplify_as_binary()` を呼び出した後、Easy Solverはターゲットエネルギー0（すなわちすべての制約が満たされた状態）の解を探索します。

以下の出力は実行可能解の例です：
```
Bar 0:  2  0  0  3   used = 59, waste = 1
Bar 1:  4  0  1  0   used = 60, waste = 0
Bar 2:  1  1  3  0   used = 60, waste = 0
Bar 3:  0  0  4  2   used = 54, waste = 6
Bar 4:  2  1  0  1   used = 60, waste = 0
Bar 5:  1  2  0  0   used = 59, waste = 1
Order 0 fulfilled = 10, required = 10
Order 1 fulfilled = 4, required = 4
Order 2 fulfilled = 8, required = 8
Order 3 fulfilled = 6, required = 6
```
$N=4$ 件のすべての注文が $M=6$ 本の棒で満たされていることがわかります。

$M=5$ に設定すると、ソルバーは以下の実行不可能な解を返し、すべての注文が満たされていません：
```
Bar 0:  4  0  1  0   used = 60, waste = 0
Bar 1:  0  0  6  1   used = 59, waste = 1
Bar 2:  2  1  0  1   used = 60, waste = 0
Bar 3:  2  0  0  3   used = 59, waste = 1
Bar 4:  1  2  0  0   used = 59, waste = 1
Order 0 fulfilled = 9, required = 10
Order 1 fulfilled = 3, required = 4
Order 2 fulfilled = 7, required = 8
Order 3 fulfilled = 5, required = 6
```
