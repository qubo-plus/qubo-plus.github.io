---
last_modified: 2026-10-26
layout: default
nav_exclude: true
title: "動画：地図の塗り分け"
description: "動画「QUBO++ ケーススタディ 地図の塗り分け（Python）」の章ごとの要点と、動画に出てくるプログラムと出力。"
lang: ja
hreflang_alt: "en/python/VIDEO_MAP_COLORING"
hreflang_lang: "en"
video: map-coloring
---

# 動画：地図の塗り分け（Python）

動画「QUBO++ ケーススタディ 地図の塗り分け（Python）」の手引きです。
章ごとに、要点と動画に出てくるプログラム・出力、詳しい説明のページへのリンクをまとめています。
「▶ 動画の … から再生」をクリックすると、その場面から再生します。
動画では一部を省略して見せているプログラムも、ここではそのまま実行できる形で載せています。

{% include video_embed.html slug="map-coloring" %}

この動画で扱うこと：

- 隣り合う地域が違う色になるように地図を塗る問題を、グラフの彩色として考える
- 地域と色の組ごとのバイナリ変数 `x[v][c]` と、制約（色はちょうど 1 つ）・目的関数（同じ色の隣り合う組の数）
- `qbpp.cons()` を使わない普通の QUBO として、配列の演算（`qbpp.vector_sum`・`qbpp.sqr`・`qbpp.sum`）で書いて解く
- 3 色では塗り分けられないことと、ペナルティの重み $P$ の大きさを ExhaustiveSolver で確かめる
- 同じ制約を `qbpp.cons()` で書き直し、アメリカ本土 48 州を 4 色で塗り分ける

[動画（ケーススタディ）](../VIDEO_CASE_STUDIES)の一覧に戻る

## 問題とグラフ

### 小さな地図

{% include video_seek.html t="0:37" %}

0 から 6 の番号が付いた 7 つの地域からなる地図を、隣り合う地域が違う色になるように塗ります。
境界線を共有する 2 つの地域を、隣り合う地域と呼びます。点で接するだけなら、隣り合うとはみなしません。
この地図は 4 色で塗り分けられます。どんな地図も 4 色あれば塗り分けられることが知られています（四色定理）。

### 地図をグラフに

{% include video_seek.html t="1:28" %}

各地域を頂点に、境界線を共有する 2 つの地域を辺にすると、頂点 7 個・辺 12 本のグラフになります。
地図の塗り分けは、どの辺でも両端の頂点が違う色になるように頂点に色を付ける問題（グラフの彩色）になります。

| | 辺（地域の組） |
|---|---|
| 地域 0 と | 1, 2, 3, 4, 5 |
| 地域 1 と | 2, 5, 6 |
| 地域 2 と | 3, 6 |
| 地域 3 と | 4 |
| 地域 4 と | 5 |

## 変数・制約・目的関数

### 変数 x[v][c]

{% include video_seek.html t="2:08" %}

バイナリ変数 $x_{v,c}$ は、地域 $v$ を色 $c$ で塗るなら 1、そうでなければ 0 です。
地域が 7 つ、色が 4 つなので、変数は 28 個で、行が地域・列が色の 7×4 の表に並べられます。
塗り分けでは、どの行にも 1 がちょうど 1 つになります。
QUBO++ では、`x = qbpp.var("x", shape=(n, K))` で $n \times K$ の変数の配列として作ります。

### 制約と目的関数

{% include video_seek.html t="2:53" %}

- 制約：どの地域も色はちょうど 1 つです。表の行ごとの和が 1 で、地域ごとに 1 本、全部で 7 本です。
  $\sum_{c} x_{v,c} = 1$
- 目的関数：同じ色になった、隣り合う組の数です。
  $x_{u,c}\,x_{v,c}$ は、辺の両端 $u$ と $v$ がどちらも色 $c$ のときだけ 1 なので、これをすべての辺と色について足します。

目的関数が 0 なら、地図は塗り分けられています。

## QUBO として解く

### ペナルティの式

{% include video_seek.html t="4:01" %}

まず `qbpp.cons()` を使わずに、制約をペナルティとして目的関数に足します。
行ごとの和から 1 を引いて 2 乗すると、色がちょうど 1 つなら 0、そうでなければ 1 以上になります。
これを 7 つの地域について足して重み $P$ を掛け、目的関数を足したものが $f$ です（$E$ は辺の集合）。

$$
f = P\sum_{v}\Bigl(\sum_{c} x_{v,c} - 1\Bigr)^2 + \sum_{(u,v)\in E}\sum_{c} x_{u,c}\,x_{v,c}
$$

制約を破ると $P$ 以上の罰になるので、同じ色の組を減らすために制約を破る方が得にならないように選びます。ここでは $P = 2$ にします。
$f$ は $x$ の 2 次式（QUBO）で、$f = 0$ なら塗り分けられています。

### プログラム

{% include video_seek.html t="4:50" %}

ペナルティは、ループを書かずに配列の演算だけで書けます。
`qbpp.vector_sum(x, axis=1)` が表の行ごとの和で、1 を引いて `qbpp.sqr` で 2 乗し、`qbpp.sum` で全部足します。
`x[u] * x[v]` は、2 つの行を要素ごとに掛けた 4 つの積です。
EasySolver で `target_energy=0` にして解くと、$f$ が 0 の解が見つかったところで探索が止まります。
`qbpp.onehot_to_int` は、行ごとに 1 の位置を色の番号にします。

```python
import pyqbpp as qbpp

edges = [(0, 1), (0, 2), (0, 3), (0, 4), (0, 5), (1, 2),
         (1, 5), (1, 6), (2, 3), (2, 6), (3, 4), (4, 5)]
n, K, P = 7, 4, 2

x = qbpp.var("x", shape=(n, K))
onehot = qbpp.sum(qbpp.sqr(qbpp.vector_sum(x, axis=1) - 1))
conflict = 0
for u, v in edges:
    conflict += qbpp.sum(x[u] * x[v])
f = P * onehot + conflict
f.simplify_as_binary()
print("terms =", f.term_count())

sol = qbpp.EasySolver(f).search(target_energy=0)
print("f =", sol(f))
for v in range(n):
    print(v, sol(x[v]))
print("colors =", qbpp.onehot_to_int(sol(x), axis=1))
```

詳しくは[配列](VECTOR)、[ワンホットから整数への変換](ONEHOT)をご覧ください。

### 実行結果

{% include video_seek.html t="6:07" %}

動画での出力（EasySolver の結果は、色の入れ替えなどで実行ごとに変わることがあります）：

```
terms = 118
f = 0
0 [0, 1, 0, 0]
1 [1, 0, 0, 0]
2 [0, 0, 0, 1]
3 [1, 0, 0, 0]
4 [0, 0, 1, 0]
5 [0, 0, 0, 1]
6 [0, 0, 1, 0]
colors = [1, 0, 3, 0, 2, 3, 2]
```

式の項は 118 個で、ペナルティの 2 乗を展開した分も含まれています。
$f = 0$ になり、どの行にも 1 がちょうど 1 つです。
色の番号は、0 が赤、1 が黄色、2 が緑、3 が青です。その色で塗ると、隣り合う地域はすべて違う色になります。

## 3 色では？

### 3 色の全探索

{% include video_seek.html t="6:53" %}

$K$ を 3 にするだけで、ほかは同じプログラムです。
変数は 7×3 の 21 個なので、ExhaustiveSolver ですべての割り当てを調べて最小の解を求めます。

```python
import pyqbpp as qbpp

edges = [(0, 1), (0, 2), (0, 3), (0, 4), (0, 5), (1, 2),
         (1, 5), (1, 6), (2, 3), (2, 6), (3, 4), (4, 5)]
n, K, P = 7, 3, 2

x = qbpp.var("x", shape=(n, K))
onehot = qbpp.sum(qbpp.sqr(qbpp.vector_sum(x, axis=1) - 1))
conflict = 0
for u, v in edges:
    conflict += qbpp.sum(x[u] * x[v])
f = P * onehot + conflict
f.simplify_as_binary()

sol = qbpp.ExhaustiveSolver(f).search()
print("min f =", sol.energy)
```

出力：

```
min f = 1
```

$f$ の最小は 1 で、どう塗っても同じ色の隣り合う組が必ず 1 つ以上残ります。
1 から 5 の 5 つの地域が輪のように地域 0 を囲んでいて、奇数個の輪はそれだけで 3 色が必要です。
地域 0 は輪の 5 つの地域すべてと隣り合うので、どれとも違う 4 色目が必要になります。

詳しくは[Exhaustive Solver](EXHAUSTIVE)をご覧ください。

### ペナルティの重み P

{% include video_seek.html t="7:59" %}

3 色の場合で、$P$ を 1 と 2 にして、$f$ が最小になる解を `best_energy_sols=0` ですべて集めます。
その中で、色のない地域（7×3 の表の行が全部 0 の地域）がある解を数えます。

```python
import pyqbpp as qbpp

edges = [(0, 1), (0, 2), (0, 3), (0, 4), (0, 5), (1, 2),
         (1, 5), (1, 6), (2, 3), (2, 6), (3, 4), (4, 5)]
n, K = 7, 3

x = qbpp.var("x", shape=(n, K))
onehot = qbpp.sum(qbpp.sqr(qbpp.vector_sum(x, axis=1) - 1))
conflict = 0
for u, v in edges:
    conflict += qbpp.sum(x[u] * x[v])
for P in (1, 2):
    f = P * onehot + conflict
    f.simplify_as_binary()
    sol = qbpp.ExhaustiveSolver(f).search(best_energy_sols=0)
    blank = [s for s in sol.sols
             if 0 in [s(qbpp.sum(x[v])) for v in range(n)]]
    print(f"P = {P}: min f = {sol.energy}, optimal = {len(sol.sols)},"
          f" with a blank region = {len(blank)}")
```

出力：

```
P = 1: min f = 1, optimal = 138, with a blank region = 72
P = 2: min f = 1, optimal = 66, with a blank region = 0
```

$P = 1$ では、地域を 1 つ塗らないと罰は 1 ですが、その地域と同じ色だった組が 1 つ減るので損得がありません。
そのため、制約を破った解が最小の解に混ざります。$P = 2$ なら罰は 2 になり、色を塗らない方が損になります。
普通の QUBO では、このように $P$ の大きさを考えて決める必要があります。

## cons() で書く

{% include video_seek.html t="9:00" %}

前のプログラムとの違いは、制約を書く行だけです。
2 乗のペナルティのかわりに、行ごとの和が 1 という比較を `qbpp.cons()` で囲みます。
`cons()` で囲んだ制約は展開されず、制約のままソルバーに渡されるので、項の数は 118 個から 48 個（12 本の辺と 4 色の組で、目的関数の項）に減ります。
制約を破ったときの罰は、重みと違反した量の 2 乗の積です。

```python
import pyqbpp as qbpp

edges = [(0, 1), (0, 2), (0, 3), (0, 4), (0, 5), (1, 2),
         (1, 5), (1, 6), (2, 3), (2, 6), (3, 4), (4, 5)]
n, K, P = 7, 4, 2

x = qbpp.var("x", shape=(n, K))
conflict = 0
for u, v in edges:
    conflict += qbpp.sum(x[u] * x[v])
f = conflict + P * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
f.simplify_as_binary()
print("terms =", f.term_count())

sol = qbpp.EasySolver(f).search(target_energy=0)
print("f =", sol(f), " colors =", qbpp.onehot_to_int(sol(x), axis=1))
```

動画での出力（色は実行ごとに変わることがあります）：

```
terms = 48
f = 0  colors = [2, 0, 1, 3, 1, 3, 3]
```

詳しくは[非線形関数とネイティブ制約](CONSTRAINTS)をご覧ください。

## アメリカの地図

### 48 州のグラフ

{% include video_seek.html t="9:57" %}

アラスカとハワイを除く本土の 48 州を塗り分けます。
州を頂点に、境界線を共有する州の組を辺にすると、辺は 105 本になります。
フォーコーナーズでは 4 つの州が 1 点で接しますが、斜めに向かい合う 2 組は点で接するだけなので辺にしません。

州の名前と辺の一覧は、JSON ファイル [usa48.json](../../images/usa48.json) に入っています。
辺は州の番号の組で、たとえば `[1, 25]` はアリゾナ（`names[1]`）とネバダ（`names[25]`）です。

```
"names": ["Alabama", "Arizona", ...],
"edges": [[0, 7], [0, 8], [0, 21],
          [0, 39], [1, 3], [1, 25], ...]
```

### 4 色で塗り分ける

{% include video_seek.html t="10:38" %}

プログラムは、`cons()` で書いた小さな地図のものとほとんど同じです。
違うのは、州の名前と辺の一覧を `json.load` でファイルから読むところです。変数 `x` は 48×4 の 192 個になります。
色の番号は `qbpp.onehot_to_int` で取り出し、ファイル usa_colors.json に書き出します。
[usa48.json](../../images/usa48.json) を、実行するディレクトリに置いて実行します。

```python
import json
import pyqbpp as qbpp

data = json.load(open("usa48.json"))
names, edges = data["names"], data["edges"]
n, K, P = len(names), 4, 2

x = qbpp.var("x", shape=(n, K))
conflict = 0
for u, v in edges:
    conflict += qbpp.sum(x[u] * x[v])
f = conflict + P * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
f.simplify_as_binary()

sol = qbpp.EasySolver(f).search(target_energy=0)
color = qbpp.onehot_to_int(sol(x), axis=1)
print("states =", n, " edges =", len(edges), " f =", sol(f))
json.dump(dict(zip(names, map(int, color))), open("usa_colors.json", "w"), indent=1)
```

出力：

```
states = 48  edges = 105  f = 0
```

$f = 0$ なので、隣り合う州はすべて違う色です。4 色あれば、アメリカの 48 州も塗り分けられます。

### 3 色では

{% include video_seek.html t="11:35" %}

$K$ を 3 にして、ほかは同じプログラムで探します。
変数は 48×3 の 144 個あるので、全探索ではなく EasySolver を使います。
`f.cons(sol)` は、解が違反している制約の本数です。

```python
import json
import pyqbpp as qbpp

data = json.load(open("usa48.json"))
names, edges = data["names"], data["edges"]
n, K, P = len(names), 3, 2

x = qbpp.var("x", shape=(n, K))
conflict = 0
for u, v in edges:
    conflict += qbpp.sum(x[u] * x[v])
f = conflict + P * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
f.simplify_as_binary()

sol = qbpp.EasySolver(f).search(time_limit=10)
print("K = 3: f =", sol(f), " violated =", f.cons(sol))
nv = names.index("Nevada")
print("Nevada:", sorted(names[v if u == nv else u] for u, v in edges if nv in (u, v)))
```

動画での出力（EasySolver の結果は実行ごとに変わることがあります）：

```
K = 3: f = 2  violated = 0
Nevada: ['Arizona', 'California', 'Idaho', 'Oregon', 'Utah']
```

しばらく探しても、$f$ が 2 の解までしか見つかりません。
`f.cons(sol)` は 0 なので、どの州も色はちょうど 1 つで、同じ色の隣り合う組が 2 組残っています。
理由の 1 つは、ネバダの隣の 5 州が輪のようにつながっていることです。小さな地図の、地域 0 と 5 つの地域の輪と同じ形なので、ネバダには 4 色目が要ります。

詳しくは[グラフ彩色](GRAPH_COLOR)をご覧ください。

## まとめ

{% include video_seek.html t="12:27" %}

- 地図の塗り分けは、地域を頂点、隣り合う組を辺にしたグラフの彩色です。
- 地域と色の組ごとにバイナリ変数を用意し、配列の演算（`qbpp.vector_sum`・`qbpp.sqr`・`qbpp.sum`）で式を書きました。
- 解は EasySolver で探し、`qbpp.onehot_to_int` で地域ごとの色に戻しました。
- 3 色では、ExhaustiveSolver の全探索で $f$ の最小値が 1 になりました。
- ペナルティの重み $P$ が小さすぎると、色のない地域のある解が最小の解に混ざります。
- `qbpp.cons()` を使えば、制約をそのまま書けて、項の数も減ります（118 個 → 48 個）。
- 48 州は 4 色で塗れ、ネバダのまわりの輪のため 3 色では塗れません。
