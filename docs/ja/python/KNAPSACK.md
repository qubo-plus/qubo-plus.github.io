---
layout: default
nav_exclude: true
title: "Knapsack"
nav_order: 70
lang: ja
hreflang_alt: "en/python/KNAPSACK"
hreflang_lang: "en"
---

# ナップサック問題
重さと価値を持つアイテムの集合と、重量制限のあるナップサックが与えられたとき、**ナップサック問題**は、総重量を容量以内に保ちながら総価値を最大化するアイテムの部分集合を選択する問題です。

$w_i$ と $v_i$（$0\leq i\leq n-1$）をそれぞれアイテム $i$ の重さと価値とします。
$S\in \lbrace 0, 1, \ldots n-1\rbrace$ を選択されたアイテムの集合とします。

$$
\begin{aligned}
\text{Maximize:} & \sum_{i\in S} v_i \\
\text{Subject to:} & \sum_{i\in S} w_i \leq W
\end{aligned}
$$

ここで $W$ はナップサックの重量容量です。

## QUBO定式化
$n$ 個のバイナリ変数 $x_i\in\lbrace 0,1\rbrace$（$0\leq i\leq n-1$）を導入します。
アイテム $i$ が選択されるのは $x_i=1$ のときかつそのときに限ります。
QUBO目的関数は以下のとおりです：

$$
\begin{aligned}
f(X) &= -\sum_{i=0}^{n-1} v_ix_i + P\times (0\leq \sum_{i=0}^{n-1} w_ix_i \leq W)
\end{aligned}
$$

## PyQBPPプログラム
```python
import pyqbpp as qbpp

w = [10, 20, 30, 5, 8, 15, 12, 7, 17, 18]
v = [60, 100, 120, 60, 80, 150, 110, 70, 150, 160]
capacity = 50

x = qbpp.var("x", len(w))

constraint = qbpp.between(qbpp.sum(w * x), 0, capacity)
objective = qbpp.sum(v * x)

f = -objective + 1000 * constraint
f.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(f)
result = solver.search({"best_energy_sols": 0})
for idx, sol in enumerate(result.sols()):
    print(f"[Solution {idx}]")
    print(f"Energy = {sol.energy}")
    print(f"Constraint = {sol(constraint.body)}")
    print(f"Objective = {sol(objective)}")
    for j in range(len(w)):
        if sol(x[j]) == 1:
            print(f"Item {j}: weight = {w[j]}, value = {v[j]}")
```
`constraint` と `objective` の式を個別に構築し、最終的なQUBO式 `f` にまとめます。
次に、Exhaustive Solverを適用してすべての最適解を列挙します。

以下の出力は最適解を示しています：
```
[Solution 0]
Energy = -480
Constraint = 50
Objective = 480
Item 3: weight = 5, value = 60
Item 5: weight = 15, value = 150
Item 6: weight = 12, value = 110
Item 9: weight = 18, value = 160
[Solution 1]
Energy = -480
Constraint = 50
Objective = 480
Item 3: weight = 5, value = 60
Item 4: weight = 8, value = 80
Item 6: weight = 12, value = 110
Item 7: weight = 7, value = 70
Item 9: weight = 18, value = 160
```

### C++ QUBO++との比較

| C++ QUBO++                   | PyQBPP                              |
|------------------------------|---------------------------------------|
| `0 <= sum(w * x) <= capacity`| `between(sum(w * x), 0, capacity)`   |
| `sol(*constraint)`           | `sol(constraint.body)`           |
