---
last_modified: 2026-10-08
layout: demo
title: "巡回セールスマン問題をブラウザで解く: QUBO デモ"
description: "最大 32 都市を置いて、短い巡回路をブラウザで求めるデモです。巡回セールスマン問題（TSP）を QUBO++ で QUBO モデルにし、ABS3 ソルバーで解きます。より短い巡回路が見つかるたびに描き直されます。"
lang: ja
hreflang_alt: "en/demos/tsp/"
hreflang_lang: "en"
permalink: /ja/demos/tsp/
nav_exclude: true
math: true
image: /assets/demos/og/tsp-ja.png
demo_id: tsp
heading: "巡回セールスマン問題を QUBO で解く"
lead: "クリックで都市を置いて Solve を押します。QUBO++ が巡回セールスマン問題を QUBO モデルにし、ソルバーがより短い巡回路を見つけるたびに描き直します。"
app_name: "巡回セールスマン ソルバー（QUBO++ デモ）"
docs_links:
  - label: "C++ 版（QUBO++）"
    url: /ja/TSP
  - label: "Python 版（PyQBPP）"
    url: /ja/python/TSP
---

## 使い方

- 盤をクリックすると都市を置けます（最大 32）。都市はドラッグで動かせます。
  **Clear** ですべての都市を消します。
- **Time** で探索時間を指定します。公開版のデモでは、探索は最長 10 秒で打ち切られます。
- **Solve** を押すと探索が始まります（都市は 3 つ以上必要です）。
  より短い巡回路が見つかるたびに描き直されます。
  結果は制限時間内に見つかった最短の巡回路で、最適であるとは限りません。
- 都市 0（緑）が巡回路の出発点です。
  盤の下には、0/1 変数の行列（行 = 巡回路の何番目か、列 = 都市）と、解いた QUBO の式が表示されます。

このデモは資源の限られた AWS Lambda 上で動いています。
デスクトップ PC 上の QUBO++ は数倍速く動きます。

## 巡回セールスマン問題を QUBO にする

QUBO（Quadratic Unconstrained Binary Optimization、制約なし二次二値最適化）は、
2 次以下の多項式を最小にする 0/1 の変数の値を求める問題です。
量子アニーリングやイジングマシンが扱う問題の形式で、QUBO++ はこれを通常の CPU や GPU で解きます。

$n$ 都市の巡回路は都市の並べ方（順列）なので、このデモでは $n^2$ 個のバイナリ変数で表します。
$x_{i,j}=1$ は、巡回路の $i$ 番目の都市が都市 $j$ であることを表します。
都市 $j$ と $k$ の距離（ユークリッド距離を整数に丸めたもの）を $d_{j,k}$ とすると、最小にする多項式は次のとおりです。

$$
\sum_{i=0}^{n-1}\sum_{j\neq k} d_{j,k}\,x_{i,j}\,x_{(i+1)\bmod n,\,k}
\;+\;P\sum_{i}\Big(\sum_{j} x_{i,j}-1\Big)^2
\;+\;P\sum_{j}\Big(\sum_{i} x_{i,j}-1\Big)^2 .
$$

最初の和が巡回路の長さです。都市 $j$ を $i$ 番目に訪れ、次に都市 $k$ を訪れるときにだけ $d_{j,k}$ が加わります。
残りの 2 つの和はペナルティで、どの順番にも都市がちょうど 1 つあり、どの都市もちょうど 1 回現れるとき、
つまり 0/1 の行列が順列を表すときにだけ 0 になります。
重み $P$ は都市の座標の最大値（100 以上）です。
都市 0 は 1 番目に固定します。同じ巡回路を回転したものが除かれ、変数は $(n-1)^2$ 個になります。
このモデルを、QUBO++ の ABS3 ソルバーが CPU 上で解きます。

## プログラム

QUBO++ の Python 版である PyQBPP を使うと、このモデルは数行で書けます。
次のプログラムは 9 都市の巡回路を求めます。

```python
import math
import pyqbpp as qbpp

nodes = [(10, 12),  (33, 125),  (12, 226),
         (121, 11), (108, 142), (111, 243),
         (220, 4),  (210, 113), (211, 233)]

def dist(i, j):
    dx = nodes[i][0] - nodes[j][0]
    dy = nodes[i][1] - nodes[j][1]
    return round(math.sqrt(dx * dx + dy * dy))

n = len(nodes)
x = qbpp.var("x", shape=(n, n))

constraint = qbpp.sum(qbpp.vector_sum(x, axis=1) == 1) + \
             qbpp.sum(qbpp.vector_sum(x, axis=0) == 1)

objective = 0
for i in range(n):
    next_i = (i + 1) % n
    for j in range(n):
        for k in range(n):
            if k != j:
                objective += dist(j, k) * x[i][j] * x[next_i][k]

f = objective + constraint * 1000
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)

# 置換行列から巡回路（頂点番号のリスト）を抽出
tour = []
for i in range(n):
    for j in range(n):
        if sol(x[i][j]) == 1:
            tour.append(j)
            break
print(f"Tour: {tour}")
```

プログラムの説明は [巡回セールスマン問題のページ](/ja/python/TSP) にあります。
[C++ 版](/ja/TSP) もあります。

## 自分のコンピュータで動かす

PyQBPP は Linux（x86-64・ARM64）と、WSL 経由の Windows で動きます。

```bash
pip install pyqbpp
```

詳しくは [インストール](/ja/python/INSTALL) を見てください。
QUBO++ で解く問題は、[ほかのデモ](/ja/DEMOS) にもあります。
