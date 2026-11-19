---
last_modified: 2026-11-19
layout: default
nav_exclude: true
title: "動画：構造制約"
description: "動画「QUBO++ 構造制約（Python）」の章ごとの要点と、動画に出てくるプログラムと出力。"
lang: ja
hreflang_alt: "en/python/VIDEO_STRUCTURAL"
hreflang_lang: "en"
video: structural
---

# 動画：構造制約（Python）

動画「QUBO++ 構造制約（Python）」の手引きです。
章ごとに、要点と動画に出てくるプログラム・出力、詳しい説明のページへのリンクをまとめています。
「▶ 動画の … から再生」をクリックすると、その場面から再生します。
動画では一部を省略して見せているプログラムも、ここではそのまま実行できる形で載せています。

{% include video_embed.html slug="structural" %}

この動画で扱うこと：

- 割り当てを `cons()` と重み P で書く方法と、P を決める手間
- 構造制約の 3 つの性質（重みがない、エネルギーに影響しない、ソルバーは形の整った解だけを相手に探す）
- `qbpp.distinct` で割り当て問題を解く方法と、`qbpp.replace` で選べる値を制限する方法
- `qbpp.cycle` で巡回セールスマン問題を解く方法と、`via=` で通らなくてもよい頂点のある閉路を表す方法
- `qbpp.cycles` で、積める量の違う 2 台の車両の配送ルートを求める方法
- 構造制約の使い方の決まりと、`is_feasible` で解を確かめる方法

[動画（チュートリアル）](../VIDEOS)の一覧に戻る

## 形の決まった解

### 割り当て問題と 2 部グラフ

{% include video_seek.html t="1:14" %}

4 人の作業者に 4 つの仕事を 1 つずつ割り当て、総コストを最小にします。作業者 $i$ が仕事 $j$ をするコストは配列 `cost` に書きます。
割り当ては、左に作業者、右に仕事を並べた 2 部グラフの、作業者から仕事への矢印で表せます。
プログラムでは 4 × 4 の 0 と 1 の配列 `x` で表し、`x[i][j]` が 1 なら作業者 $i$ から仕事 $j$ への矢印があります。
どの作業者からも矢印が 1 本出ることは各行に 1 がちょうど 1 つ、どの仕事にも矢印が 1 本入ることは各列に 1 がちょうど 1 つあることです。

### これまでの書き方：cons() と重み P

{% include video_seek.html t="2:50" %}

これまでは、各行の和が 1、各列の和が 1 という等式の制約を `cons()` で書き、重み P を掛けていました。
P が小さいとルールを破った解が最小になり、大きすぎるのもよくないので、P を決めるのは手間のかかる作業です。この例では P = 3 にします。

```python
import pyqbpp as qbpp

cost = qbpp.array([[7, 3, 8, 6], [5, 9, 4, 7], [6, 8, 5, 3], [4, 6, 9, 5]])
x = qbpp.var("x", shape=(4, 4))
P = 3
f = (qbpp.sum(cost * x)
     + P * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
     + P * qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)
print("cost =", sol.energy)
print("job =", qbpp.onehot_to_int(sol(x)))
```

出力：

```
cost = 14
job = [1, 2, 3, 0]
```

P を 2 以下にすると、ルールを破った割り当てが答えに混じります。

詳しくは[非線形関数とネイティブ制約](CONSTRAINTS)をご覧ください。

### 構造制約の 3 つの性質

{% include video_seek.html t="3:17" %}

構造制約は解の形を表す制約で、QUBO++ には `distinct`（項目が互いに違う値をとる）・`cycle`（選んだ辺が 1 つの閉路になる）・`cycles`（車両がデポから出て戻るルート）の 3 つがあります。
`cons()` と同じように式に足して使います。

- 重みがありません。必ず守られる制約で、EasySolver と ABS3Solver が返す解はいつも構造制約を満たします。
- エネルギーに影響しません。形を満たす解のエネルギーは、残りの式の値です。
- ソルバーは、形の整った解だけを相手に探します。

詳しくは[構造制約](STRUCTURAL)をご覧ください。

## distinct

### 割り当て問題を distinct で書く

{% include video_seek.html t="4:16" %}

式は、総コスト `qbpp.sum(cost * x)` に `qbpp.distinct(x)` を足すだけです。`cons()` の 2 つの式と重み P が、`distinct(x)` の 1 つに置き換わります。
`distinct(x)` は、どの項目（行）からも矢印が 1 本出て、どの値（列）にも高々 1 本入る、という制約です。

```python
import pyqbpp as qbpp

cost = qbpp.array([[7, 3, 8, 6], [5, 9, 4, 7], [6, 8, 5, 3], [4, 6, 9, 5]])
x = qbpp.var("x", shape=(4, 4))
f = qbpp.sum(cost * x) + qbpp.distinct(x)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)
print("cost =", sol.energy)
print("job =", qbpp.onehot_to_int(sol(x)))
```

出力：

```
cost = 14
job = [1, 2, 3, 0]
```

`qbpp.onehot_to_int` で各作業者の矢印の先を読みます。作業者 0・1・2・3 がそれぞれ仕事 1・2・3・0 をし、コストは $3 + 4 + 3 + 4 = 14$ で、`cons()` と重み P で解いた答えと同じです。

### 値が項目より多いとき

{% include video_seek.html t="5:30" %}

`distinct` の配列は、列が行より多くてもかまいません。3 人の作業者に 5 つの仕事から 1 つずつ割り当てます（`cost` に仕事 4 の列を足しました）。

```python
import pyqbpp as qbpp

cost = qbpp.array([[7, 3, 8, 6, 9], [5, 9, 4, 7, 6], [6, 8, 5, 3, 4]])
x = qbpp.var("x", shape=(3, 5))
f = qbpp.sum(cost * x) + qbpp.distinct(x)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)
print("cost =", sol.energy)
print("job =", qbpp.onehot_to_int(sol(x)))
```

出力：

```
cost = 10
job = [1, 2, 3]
```

仕事 0 と仕事 4 は誰も選びません。行と列の数が等しいときは、どの値もちょうど 1 回使われ、`distinct` は順列を表します。
項目の数が値の数より多いときは配列を転置し、行には必ず 1 つを選ぶ側を置きます。

## 選べる値の制限

### replace で取り除く・固定する

{% include video_seek.html t="6:31" %}

作業者 0 は仕事 1 ができない、作業者 3 は仕事 0 ができない、作業者 1 は仕事 3 に決まっている、という条件を `qbpp.replace` で表します。
変数を 0 に置き換えるとその選択肢を取り除き、1 に置き換えるとその選択に固定します。
作業者 1 を仕事 3 に固定すると、作業者 1 のほかの仕事と、ほかの作業者の仕事 3 は選べなくなるので、`replace` はこれらの変数も自動で 0 に置き換えます。

```python
import pyqbpp as qbpp

cost = qbpp.array([[7, 3, 8, 6], [5, 9, 4, 7], [6, 8, 5, 3], [4, 6, 9, 5]])
x = qbpp.var("x", shape=(4, 4))
f = qbpp.sum(cost * x) + qbpp.distinct(x)

ml = {x[0][1]: 0, x[3][0]: 0, x[1][3]: 1}
g = qbpp.replace(f, ml)
g.simplify_as_binary()
print(g)

solver = qbpp.EasySolver(g)
sol = solver.search(time_limit=1.0)
full = qbpp.Sol(f).set(sol, ml)
print("cost =", f(full))
print("job =", qbpp.onehot_to_int(full(x)))
```

出力：

```
7 +7*x[0][0] +8*x[0][2] +6*x[2][0] +8*x[2][1] +5*x[2][2] +6*x[3][1] +9*x[3][2]
+distinct(4 rows, 4 values, 7 choices, 1 fixed)
cost = 25
job = [0, 3, 2, 1]
```

1 行目の定数 7 は、固定した仕事のコストです。2 行目は `distinct` の部分で、4 つの行と 4 つの値、残った選択肢が 7 個、固定が 1 つです。
`g` の解には置き換えた変数が含まれないので、`qbpp.Sol(f).set(sol, ml)` で元の式 `f` の解に戻します。

詳しくは[置換関数](REPLACE)をご覧ください。

### 置き換えのエラー

{% include video_seek.html t="8:04" %}

置き換えられる値は 0 と 1 だけです。行の選択肢をすべて取り除く・1 つの行に 2 つ固定すると、`replace` の時点で ValueError になります。
置き換えそのものは正しくても割り当てられないとき（3 人が仕事 0 と 1 しかできない）は、EasySolver を作る時点で RuntimeError になります。

```python
import pyqbpp as qbpp

cost = qbpp.array([[7, 3, 8, 6], [5, 9, 4, 7], [6, 8, 5, 3], [4, 6, 9, 5]])
x = qbpp.var("x", shape=(4, 4))
f = qbpp.sum(cost * x) + qbpp.distinct(x)

# 作業者 0 はどの仕事もできない
try:
    g = qbpp.replace(f, {x[0][0]: 0, x[0][1]: 0, x[0][2]: 0, x[0][3]: 0})
except ValueError as e:
    print("ValueError:", e)

# 作業者 1 を 2 つの仕事に固定する
try:
    g = qbpp.replace(f, {x[1][0]: 1, x[1][2]: 1})
except ValueError as e:
    print("ValueError:", e)

# 作業者 0・1・2 は仕事 0 と 1 しかできない
ml = {x[i][j]: 0 for i in range(3) for j in [2, 3]}
g = qbpp.replace(f, ml)
g.simplify_as_binary()
try:
    solver = qbpp.EasySolver(g)
except RuntimeError as e:
    print("RuntimeError:", e)
```

出力：

```
ValueError: qbpp::replace: row 0 of a distinct constraint has no value left that it can take
ValueError: qbpp::replace: two values are fixed (replaced by 1) for row 1 of a distinct constraint
RuntimeError: EasySolver: no state that satisfies the constraint could be built to start the search (distinct: the items of a distinct constraint cannot all take different values under the restrictions (variables replaced by 0 or 1))
```

## cycle

### 巡回セールスマン問題

{% include video_seek.html t="8:58" %}

平面上の 9 つの頂点をすべて 1 回ずつ回って出発点に戻る、最短の巡回路を求めます。距離は座標から計算して整数に丸めます。
変数は 9 × 9 の配列 `x` で、`x[i][j]` が 1 なら頂点 $i$ から頂点 $j$ へ進みます。
`qbpp.cycle(x)` は、1 の矢印がすべての頂点を 1 回ずつ通る 1 つの巡回路になる、という制約です。
対角の変数 `x[i][i]` は自分自身への矢印で、解では常に 0 です。

```python
import math
import pyqbpp as qbpp

nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142),
         (111, 243), (220, 4), (210, 113), (211, 233)]
n = len(nodes)
d = qbpp.array([[round(math.dist(p, q)) for q in nodes] for p in nodes])
x = qbpp.var("x", shape=(n, n))
f = qbpp.sum(d * x) + qbpp.cycle(x)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)
print("length =", sol.energy)
tour, v = [0], 0
while True:
    v = next(j for j in range(n) if j != v and sol(x[v][j]) == 1)
    tour.append(v)
    if v == 0:
        break
print(" -> ".join(str(v) for v in tour))
```

動画での出力（巡回路の向きは実行ごとに変わることがあります）：

```
length = 959
0 -> 3 -> 6 -> 7 -> 8 -> 5 -> 2 -> 4 -> 1 -> 0
```

959 は、すべての順番を調べて確かめた最短の長さです。巡回路は、頂点 0 から 1 の矢印をたどって読みます。

詳しくは[巡回セールスマン問題](TSP)をご覧ください。

### 置換行列の書き方と比べる

{% include video_seek.html t="10:33" %}

`x[k][i]` が 1 なら $k$ 番目に頂点 $i$ を訪れる、という置換行列でも同じ問題が書けますが、行と列の条件を `cons()` と重みで書きます。
置換行列では、回り始める頂点が 9 通り、向きが 2 通りで、同じ巡回路の表し方が 18 通りあります。
`cycle` の配列は矢印そのものを変数にしているので、表し方は向きの 2 通りだけで、出発点を固定する置き換えも重みも要りません。変数の数は、どちらも 81 個です。

## 通らなくてもよい頂点

### 移動距離の上限の中で多くの頂点を回る

{% include video_seek.html t="11:31" %}

同じ地図で、頂点 0 を出て頂点 0 に戻ります。移動距離の上限 $L = 650$ の中で、なるべく多くの頂点を回ります（オリエンテーリング問題）。
`qbpp.cycle(x, via=[0])` は頂点 0 を通る閉路という制約で、`via` にない頂点は通っても通らなくてもかまいません。
回った頂点の数 `count` は選んだ矢印の数 `qbpp.sum(x)`、移動距離 `total` は `qbpp.sum(d * x)` です。
上限を 1 でも超えるとペナルティは 10 で、頂点が 1 つ増えて下がるエネルギー（1、多くても 8）より大きいので、上限は守られます。

```python
import math
import pyqbpp as qbpp

nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142),
         (111, 243), (220, 4), (210, 113), (211, 233)]
n = len(nodes)
d = qbpp.array([[round(math.dist(p, q)) for q in nodes] for p in nodes])
L = 650

x = qbpp.var("x", shape=(n, n))
count = qbpp.sum(x)
total = qbpp.sum(d * x)
f = -count + 10 * qbpp.cons(total <= L) + qbpp.cycle(x, via=[0])
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)
print("visited =", sol(count), " length =", sol(total))
tour, v = [0], 0
while True:
    v = next(j for j in range(n) if j != v and sol(x[v][j]) == 1)
    tour.append(v)
    if v == 0:
        break
print(" -> ".join(str(v) for v in tour))
```

動画での出力（巡回路の向きは実行ごとに変わることがあります）：

```
visited = 6  length = 617
0 -> 3 -> 6 -> 7 -> 4 -> 1 -> 0
```

上限 650 で回れる頂点は 6 つが最多で、その頂点の組は 1 つだけです。

詳しくは[オリエンテーリング問題](ORIENTEERING)をご覧ください。

### 上限を変えて解き直す

{% include video_seek.html t="13:16" %}

```python
import math
import pyqbpp as qbpp

nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142),
         (111, 243), (220, 4), (210, 113), (211, 233)]
n = len(nodes)
d = qbpp.array([[round(math.dist(p, q)) for q in nodes] for p in nodes])

def orienteering(L):
    x = qbpp.var(shape=(n, n))
    count = qbpp.sum(x)
    total = qbpp.sum(d * x)
    f = -count + 10 * qbpp.cons(total <= L) + qbpp.cycle(x, via=[0])
    f.simplify_as_binary()
    sol = qbpp.EasySolver(f).search(time_limit=1.0)
    tour, v = [0], 0
    while True:
        v = next(j for j in range(n) if j != v and sol(x[v][j]) == 1)
        tour.append(v)
        if v == 0:
            break
    print(f"L = {L}: visited = {sol(count)}, length = {sol(total)},",
          " -> ".join(str(v) for v in tour))

for L in [480, 650, 840]:
    orienteering(L)
```

動画での出力（巡回路の向きは実行ごとに変わることがあります）：

```
L = 480: visited = 4, length = 435, 0 -> 3 -> 4 -> 1 -> 0
L = 650: visited = 6, length = 617, 0 -> 3 -> 6 -> 7 -> 4 -> 1 -> 0
L = 840: visited = 8, length = 832, 0 -> 1 -> 4 -> 5 -> 8 -> 7 -> 6 -> 3 -> 0
```

9 つ全部を回るには 959 必要です。どの答えも、すべての回り方を調べた結果と一致します。
`via=[]` は必ず通る頂点がない閉路です。辺が一部の頂点の組にしかないグラフでは、辺を（始点、終点、変数）のリストで渡し、閉路の辺の数は `length=` で範囲を指定できます。

詳しくは[構造制約](STRUCTURAL)をご覧ください。

## cycles

{% include video_seek.html t="14:08" %}

デポ（頂点 0）で荷物を積み、配送先（頂点 1〜5）を回って戻る配送の問題です。車両は 2 台で、積める量は 11 と 8 です。
変数は車両ごとの 6 × 6 を並べた 2 × 6 × 6 の配列で、`x[k][i][j]` が 1 なら車両 $k$ が頂点 $i$ から $j$ へ進みます。
`qbpp.cycles(x, depot=0)` で、車両ごとの矢印がデポを通る閉路になり、デポ以外の頂点はちょうど 1 台のルートに入ります。使わない車両は矢印を 1 本も選びません。
総距離 `length` と車両ごとの積載量 `load` は `qbpp.einsum` で書き、`load <= capacity` は要素ごとの比較で上限の制約が 2 本できます。

```python
import pyqbpp as qbpp

dist = qbpp.array([[0, 9, 14, 11, 16, 8],
                   [10, 0, 7, 15, 21, 13],
                   [13, 8, 0, 10, 18, 17],
                   [12, 14, 11, 0, 9, 12],
                   [15, 22, 17, 10, 0, 10],
                   [9, 12, 18, 13, 11, 0]])
demand = qbpp.array([0, 4, 3, 5, 2, 4])
capacity = qbpp.array([11, 8])
n, K = 6, 2

x = qbpp.var("x", shape=(K, n, n))
length = qbpp.einsum("kij,ij->", x, dist)
load = qbpp.einsum("kij,j->k", x, demand)
f = length + 1000 * qbpp.cons(load <= capacity) + qbpp.cycles(x, depot=0)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)
print("total length =", sol.energy)
for k in range(K):
    route, v = [0], 0
    while True:
        v = next((j for j in range(n) if j != v and sol(x[k][v][j]) == 1), 0)
        route.append(v)
        if v == 0:
            break
    print(f"vehicle {k}:", " -> ".join(str(v) for v in route))
```

動画での出力（ルートの向きは実行ごとに変わることがあります）：

```
total length = 68
vehicle 0: 0 -> 3 -> 4 -> 5 -> 0
vehicle 1: 0 -> 1 -> 2 -> 0
```

車両 0 の荷物は 11 でちょうど上限、車両 1 の荷物は 7 です。すべての割り振りと順番を調べた最短と一致します。

詳しくは[容量制約付き配車計画問題（CVRP）](CVRP)と [Einsum 関数](EINSUM) をご覧ください。

## 使い方の決まり

### 構造制約に使える演算

{% include video_seek.html t="16:36" %}

構造制約は式に足すことだけができます。定数倍・符号の反転・変数との積・`sqr` は RuntimeError になります（重みがないので、数を掛ける意味がありません）。
構造制約に渡すのはバイナリ変数そのもので、`~x` は渡せません（目的関数や `cons()` の中では `~x` も使えます）。1 つの変数を 2 つの辺に使うこともできません。
1 つの式に複数の構造制約を足すことも、`cons()` や非線形関数と組み合わせることもできます。

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(3, 3))
for name, make in [("3 * distinct", lambda: 3 * qbpp.distinct(x)),
                   ("-distinct", lambda: -qbpp.distinct(x)),
                   ("x[0][0] * distinct", lambda: x[0][0] * qbpp.distinct(x)),
                   ("sqr(distinct)", lambda: qbpp.sqr(qbpp.distinct(x)))]:
    try:
        make()
        print(name, ": ok")
    except Exception as e:
        print(name, ":", type(e).__name__)

f = qbpp.sum(x) + qbpp.distinct(x) + 10 * qbpp.cons(x[0][0] + x[1][1] <= 1)
f.simplify_as_binary()
print(f)
```

出力：

```
3 * distinct : RuntimeError
-distinct : RuntimeError
x[0][0] * distinct : RuntimeError
sqr(distinct) : RuntimeError
x[0][0] +x[0][1] +x[0][2] +x[1][0] +x[1][1] +x[1][2] +x[2][0] +x[2][1] +x[2][2]
+distinct(3 rows, 3 values)
+10*cons(x[0][0] +x[1][1] <= 1)
```

`qbpp.replace` は 3 つの構造制約のすべてで使えます。`distinct` では 0 でその選択肢を取り除き、1 でその選択に固定します。
`cycle` と `cycles` では 0 でその辺を使わず、1 でその辺を必ず使います（`cycles` は車両ごと）。1 に固定すると、両立しないほかの変数は自動で 0 になります。

### 解を確かめる

{% include video_seek.html t="17:58" %}

解が構造制約を満たすかは `is_feasible` で確かめます。形を満たさない割り当てでは式の値が決まらないので、式の値を求めると例外になります。
構造制約が使えるソルバーは EasySolver と ABS3Solver で、ExhaustiveSolver に渡すとソルバーを作る時点で RuntimeError になります。

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(3, 3))
f = qbpp.sum(x) + qbpp.distinct(x)
f.simplify_as_binary()

sol = qbpp.Sol(f).set({x[0][0]: 1, x[1][1]: 1, x[2][2]: 1})
print(f.is_feasible(sol), f(sol))

sol = qbpp.Sol(f).set({x[0][0]: 1, x[1][1]: 1, x[2][1]: 1})
print(f.is_feasible(sol))
try:
    print(f(sol))
except RuntimeError:
    print("error")

try:
    qbpp.ExhaustiveSolver(f)
except RuntimeError as e:
    print("RuntimeError:", e)
```

出力：

```
True 3
False
error
RuntimeError: ExhaustiveSolver: cycle / cycles / distinct constraints are not supported by this solver
```

## まとめ

{% include video_seek.html t="18:43" %}

- 構造制約は、解の形を表す制約です。`distinct` は互いに違う値、`cycle` は 1 つの閉路、`cycles` は何台かの車両のルートです。
- どれも重みがなく、ソルバーが返す解は必ず形を満たします。形を満たす解のエネルギーは、残りの式の値です。
- `qbpp.replace` で、選べる値や辺を制限できます。1 に固定すると、両立しないほかの変数は自動で 0 になります。
- `cycle` と `via` で、全部の頂点を回らない巡回路も表せます。
- `cons()` と組み合わせて、距離や積める量の上限も入れられます。
