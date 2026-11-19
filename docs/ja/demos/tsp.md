---
last_modified: 2026-11-17
layout: demo
title: "巡回セールスマン問題をブラウザで解く: QUBO++ デモ"
description: "最大 32 都市を置いて、最短の巡回路をブラウザで求めるデモです。巡回セールスマン問題（TSP）を QUBO++ の構造制約 cycle() で書き、EasySolver で解きます。より短い巡回路が見つかるたびに描き直されます。"
lang: ja
hreflang_alt: "en/demos/tsp/"
hreflang_lang: "en"
permalink: /ja/demos/tsp/
nav_exclude: true
math: true
image: /assets/demos/og/tsp-ja.png
demo_id: tsp
heading: "巡回セールスマン問題を QUBO++ で解く"
lead: "クリックで都市を置いて Solve を押します。QUBO++ のソルバーがより短い巡回路を見つけるたびに描き直します。"
app_name: "巡回セールスマン ソルバー（QUBO++ デモ）"
docs_links:
  - label: "C++ 版（QUBO++）"
    url: "/ja/TSP#構造制約-cycle-を使う定式化"
  - label: "Python 版（PyQBPP）"
    url: "/ja/python/TSP#構造制約-cycle-を使う定式化"
---

## 使い方

- 盤をクリックすると都市を置けます（最大 32）。都市はドラッグで動かせます。
  **Clear** ですべての都市を消します。
- **Time** で探索時間を指定します。公開版のデモでは、探索は最長 10 秒で打ち切られます。
- **Solve** を押すと探索が始まります（都市は 3 つ以上必要です）。
  より短い巡回路が見つかるたびに描き直されます。
  結果は制限時間内に見つかった最短の巡回路で、最適であるとは限りません。
- 都市 0（緑）が巡回路の出発点です。
  盤の下には、0/1 変数の行列（$x_{i,j}=1$ は都市 $i$ から都市 $j$ へ進むこと）と、解いた式が表示されます。

このデモは資源の限られた AWS Lambda 上で動いています。
デスクトップ PC 上の QUBO++ は数倍速く動きます。

## 巡回セールスマン問題を式にする

都市 $i$ から都市 $j$ へ進むとき 1 になるバイナリ変数 $x_{i,j}$（$i \neq j$）を使います。
都市 $i$ と $j$ の距離（ユークリッド距離を整数に丸めたもの）を $d_{i,j}$ とすると、最小にする式は

$$
\sum_{i\neq j} d_{i,j}\,x_{i,j}
$$

だけです。これに、値が 1 の変数の矢印 $i\to j$ がすべての都市をちょうど 1 回ずつ通る 1 つの巡回路になる、という条件を
QUBO++ の構造制約 `qbpp.cycle(x)` で加えます。
ソルバーは巡回路を保ったまま探索するので、解はいつも 1 つの巡回路で、ペナルティの重みを決める必要もありません。
このモデルを、QUBO++ の EasySolver で解きます。

## プログラム

QUBO++ の Python 版である PyQBPP を使うと、このモデルは数行で書けます。
次のプログラムは 9 都市の巡回路を求めます。

```python
import math
import pyqbpp as qbpp

nodes = [(10, 12),  (33, 125),  (12, 226),
         (121, 11), (108, 142), (111, 243),
         (220, 4),  (210, 113), (211, 233)]
n = len(nodes)

def dist(i, j):
    dx = nodes[i][0] - nodes[j][0]
    dy = nodes[i][1] - nodes[j][1]
    return round(math.sqrt(dx * dx + dy * dy))

x = qbpp.var("x", shape=(n, n))
f = 0
for i in range(n):
    for j in range(n):
        if i != j:
            f += dist(i, j) * x[i][j]
f += qbpp.cycle(x)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)

# 都市 0 から矢印をたどって巡回路を求める
tour, v = [0], 0
while True:
    v = next(j for j in range(n) if j != v and sol(x[v][j]) == 1)
    if v == 0:
        break
    tour.append(v)
print("length =", sol.energy)
print("tour =", tour)
```

このプログラムの説明は [巡回セールスマン問題のページ](/ja/python/TSP#構造制約-cycle-を使う定式化)（[C++ 版](/ja/TSP#構造制約-cycle-を使う定式化)）にあります。
同じページで、都市の順番を表す 0/1 の行列とペナルティ式で書く方法も説明しています。
`qbpp.cycle()` の詳しい説明は [構造制約のページ](/ja/python/STRUCTURAL) にあります。

## 自分のコンピュータで動かす

PyQBPP は Linux（x86-64・ARM64）と、WSL 経由の Windows で動きます。

```bash
pip install pyqbpp
```

詳しくは [インストール](/ja/python/INSTALL) を見てください。
QUBO++ で解く問題は、[ほかのデモ](/ja/DEMOS) にもあります。
