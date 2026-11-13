---
last_modified: 2026-10-08
layout: demo
title: "N クイーン問題をブラウザで解く: QUBO デモ"
description: "N クイーン問題（8 クイーン・エイトクイーンの一般化、N = 4〜32）をブラウザで解くデモです。QUBO++ で QUBO モデルを作り、EasySolver で解きます。クイーンの一部を自分で置いて、残りをソルバーに置かせることもできます。"
lang: ja
hreflang_alt: "en/demos/n-queens/"
hreflang_lang: "en"
permalink: /ja/demos/n-queens/
nav_exclude: true
math: true
image: /assets/demos/og/n-queens-ja.png
demo_id: nqueen
heading: "N クイーン問題を QUBO で解く"
lead: "N×N の盤に、どの 2 つも互いに取り合わないように N 個のクイーンを置く問題です。QUBO++ が問題を QUBO モデルにし、EasySolver が数秒で配置を探します。"
app_name: "N クイーン ソルバー（QUBO++ デモ）"
docs_links:
  - label: "C++ 版（QUBO++）"
    url: /ja/QUEENS
  - label: "Python 版（PyQBPP）"
    url: /ja/python/QUEENS
---

## 使い方

- **N** で盤の大きさ（4〜32）を、**Time** で探索の制限時間を指定します。
- マスをクリックすると、そこにクイーンを置けます。もう一度クリックすると取り除きます。
  自分で置いたクイーンが取れるマスには置けません。
- **Solve** を押すと探索が始まります。互いに取り合わない配置が見つかった時点か、
  制限時間に達した時点で止まります。
- クイーンにマウスを重ねると、そのクイーンが取れる筋が表示されます。
  正しい配置が見つからなかったときは、取り合っているクイーンが赤で表示されます。
  自分で置いたクイーンの組によっては、そもそも完成できないこともあります。
- 盤の下には、解の 0/1 変数の行列と、N ≤ 12 のときは解いた QUBO の式が表示されます。

このデモは資源の限られた AWS Lambda 上で動いています。
デスクトップ PC 上の QUBO++ は数倍速く動きます。

## N クイーン問題を QUBO にする

QUBO（Quadratic Unconstrained Binary Optimization、制約なし二次二値最適化）は、
2 次以下の多項式を最小にする 0/1 の変数の値を求める問題です。
量子アニーリングやイジングマシンが扱う問題の形式で、QUBO++ はこれを通常の CPU や GPU で解きます。
このデモでは、マスごとに 1 つのバイナリ変数 $x_{i,j}$ を使います。
$x_{i,j}=1$ は、行 $i$、列 $j$ のマスにクイーンを置くことを表します。
最小にする多項式は、次のペナルティの和です。

- 各行 $i$ にクイーンがちょうど 1 つ: $\left(\sum_{j} x_{i,j}-1\right)^2$
- 各列 $j$ にクイーンがちょうど 1 つ: $\left(\sum_{i} x_{i,j}-1\right)^2$
- 各対角線・各逆対角線 $D$ にクイーンが高々 1 つ: $S_D(S_D-1)$（$S_D$ は $D$ 上のクイーンの数）

どのペナルティも条件を満たせば 0、満たさなければ正の値になります。
したがって、多項式の値が 0 になる配置が、ちょうど問題の解です。
自分で置いたクイーンは、解く前にモデルに代入します。
その変数は 1 に、そのクイーンが取れるマスの変数は 0 に固定されるので、モデルが小さくなります。

## プログラム

QUBO++ の Python 版である PyQBPP を使うと、上のモデルは数行で書けます。
次のプログラムは $N=8$ の解を 1 つ表示します。

```python
import pyqbpp as qbpp

n = 8
x = qbpp.var("x", shape=(n, n))

f = qbpp.sum(qbpp.vector_sum(x, axis=0) == 1) + \
    qbpp.sum(qbpp.vector_sum(x, axis=1) == 1)

m = 2 * n - 3
a = qbpp.expr(shape=m)
b = qbpp.expr(shape=m)

for i in range(m):
    k = i + 1
    for r in range(n):
        c = k - r
        if 0 <= c < n:
            a[i] += x[r][c]

    d = i - (n - 2)
    for r in range(n):
        c = r + d
        if 0 <= c < n:
            b[i] += x[r][c]

f += qbpp.sum((0 <= a) & (qbpp.same <= 1))
f += qbpp.sum((0 <= b) & (qbpp.same <= 1))

f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=0)
for i in range(n):
    for j in range(n):
        print("Q" if sol(x[i][j]) == 1 else ".", end="")
    print()
```

プログラムの詳しい説明は [N-Queens 問題のページ](/ja/python/QUEENS) にあります。
[C++ 版](/ja/QUEENS) もあります。

## 自分のコンピュータで動かす

PyQBPP は Linux（x86-64・ARM64）と、WSL 経由の Windows で動きます。

```bash
pip install pyqbpp
```

詳しくは [インストール](/ja/python/INSTALL) を見てください。
QUBO++ で解く問題は、[ほかのデモ](/ja/DEMOS) にもあります。
