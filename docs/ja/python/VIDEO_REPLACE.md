---
last_modified: 2026-10-26
layout: default
nav_exclude: true
title: "動画：変数の固定"
description: "動画「QUBO++ 変数の固定（Python）」の章ごとの要点と、動画に出てくるプログラムと出力。"
lang: ja
hreflang_alt: "en/python/VIDEO_REPLACE"
hreflang_lang: "en"
video: replace
---

# 動画：変数の固定（Python）

動画「QUBO++ 変数の固定（Python）」の手引きです。
章ごとに、要点と動画に出てくるプログラム・出力、詳しい説明のページへのリンクをまとめています。
「▶ 動画の … から再生」をクリックすると、その場面から再生します。
動画では一部を省略して見せているプログラムも、ここではそのまま実行できる形で載せています。

{% include video_embed.html slug="replace" %}

この動画で扱うこと：

- 巡回セールスマン問題を置換行列で表して解く
- `qbpp.replace` で変数の値を固定し、出発点を頂点 0 に決める
- 固定した式の解から、`qbpp.Sol(f).set(sol, ml)` で元の式の解を復元する
- 解の値を `set` や `flip` で書き換え、`comp_energy()` でエネルギーを計算し直す
- 値の固定に `qbpp.cons` を使わない理由と、整数変数の掛け算・割り算・因数分解
- `ml` の値に式を書く例として、制約付きの最大カットを解く

[動画（チュートリアル）](../VIDEOS)の一覧に戻る

## 巡回セールスマン問題

### 問題

{% include video_seek.html t="2:47" %}

すべての頂点をちょうど 1 回ずつ訪れて出発点に戻る巡回路のうち、最も短いものを探します。
平面上の 9 個の頂点（0〜8）を使い、2 点の距離は座標から計算して整数に丸めます。
最短の巡回路は 0→1→4→2→5→8→7→6→3→0 で、長さは 959 です。

### 置換行列で巡回路を表す

{% include video_seek.html t="4:02" %}

巡回路は 9 行 9 列の 0/1 の行列 $x$ で表します。行は訪れる順番 $k$、列は頂点 $i$ で、$x[k][i]=1$ は「$k$ 番目に頂点 $i$ を訪れる」という意味です。
どの順番にも頂点は 1 つ、どの頂点も 1 回なので、各行と各列に 1 がちょうど 1 つずつあります（置換行列）。
この制約は、配列の動画で解いた割当問題とまったく同じです。

### 巡回路の長さ

{% include video_seek.html t="5:34" %}

$k$ 番目が頂点 $i$、その次が頂点 $j$ のときだけ $x[k][i]\,x[k+1][j]$ が 1 になるので、距離 $d[i][j]$ を掛けて足せば巡回路の長さになります。
最後の行の次は 0 番目の行に戻ります。

$$
\text{length} = \sum_{k=0}^{n-1}\sum_{i=0}^{n-1}\sum_{j=0}^{n-1} d[i][j]\, x[k][i]\, x[(k+1) \bmod n][j]
$$

### プログラム

{% include video_seek.html t="6:56" %}

長さの式に、各行の和が 1（`axis=1`）と各列の和が 1（`axis=0`）の制約を重み 1000 で足して解きます。
`qbpp.onehot_to_int` は、各行で 1 になっている列の番号を並べます。

```python
import math
import pyqbpp as qbpp

nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142),
         (111, 243), (220, 4), (210, 113), (211, 233)]
n = len(nodes)
d = [[round(math.dist(nodes[i], nodes[j])) for j in range(n)] for i in range(n)]
x = qbpp.var("x", shape=(n, n))
length = 0
for k in range(n):
    for i in range(n):
        for j in range(n):
            length += d[i][j] * x[k][i] * x[(k + 1) % n][j]
f = (length
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
f.simplify_as_binary()
sol = qbpp.EasySolver(f).search(time_limit=2)
print("length =", sol(length), " tour =", qbpp.onehot_to_int(sol(x), axis=1))
```

動画での出力（EasySolver は実行ごとに結果が変わります）：

```
length = 959  tour = [3, 6, 7, 8, 5, 2, 4, 1, 0]
```

長さ 959 の最短の巡回路ですが、出発点は 3 です。実行するたびに、出発点や回る向きが変わることがあります。

詳しくは[巡回セールスマン問題](TSP)をご覧ください。

## 同じ巡回路の表し方

{% include video_seek.html t="9:50" %}

最初の 5 個の頂点だけで同じ式を作り、ExhaustiveSolver で最適解をすべて求めます（`best_energy_sols=0`）。
最適解は 10 個ありますが、どれも同じ巡回路です。出発点が 5 通り、回る向きが 2 通りあるからです。
$n$ 個の頂点なら、1 つの巡回路を表す行列は $2n$ 個あります。

```python
import math
import pyqbpp as qbpp

# 最初の 5 頂点の式 f（前のプログラムと同じ作り方）
nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142)]
n = len(nodes)
d = [[round(math.dist(nodes[i], nodes[j])) for j in range(n)] for i in range(n)]
x = qbpp.var("x", shape=(n, n))
length = 0
for k in range(n):
    for i in range(n):
        for j in range(n):
            length += d[i][j] * x[k][i] * x[(k + 1) % n][j]
f = (length
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
f.simplify_as_binary()

sol = qbpp.ExhaustiveSolver(f).search(best_energy_sols=0)
print(len(sol.sols), "optimal solutions")
for s in sol.sols:
    print(s.energy, qbpp.onehot_to_int(s(x), axis=1))
```

出力：

```
10 optimal solutions
589 [3, 4, 2, 1, 0]
589 [1, 2, 4, 3, 0]
589 [2, 4, 3, 0, 1]
589 [0, 3, 4, 2, 1]
589 [4, 3, 0, 1, 2]
589 [1, 0, 3, 4, 2]
589 [4, 2, 1, 0, 3]
589 [0, 1, 2, 4, 3]
589 [3, 0, 1, 2, 4]
589 [2, 1, 0, 3, 4]
```

詳しくは[置換行列の生成](PERMUTATION)をご覧ください。

## replace で固定

{% include video_seek.html t="11:36" %}

出発点を頂点 0 に決めるため、$x[0][0]$ を 1、0 列目と 0 行目の残りを 0 にします。
固定する変数と値を辞書 `ml` にまとめ（9 項目）、`qbpp.replace(f, ml)` に渡すと、変数を値に置き換えた新しい式が返ります。元の式 `f` は変わりません。
`g` に残る変数は 1〜4 行目・1〜4 列目の 16 個で、25 個から減ります。

```python
import math
import pyqbpp as qbpp

# 最初の 5 頂点の式 f（前と同じ作り方）
nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142)]
n = len(nodes)
d = [[round(math.dist(nodes[i], nodes[j])) for j in range(n)] for i in range(n)]
x = qbpp.var("x", shape=(n, n))
length = 0
for k in range(n):
    for i in range(n):
        for j in range(n):
            length += d[i][j] * x[k][i] * x[(k + 1) % n][j]
f = (length
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
f.simplify_as_binary()

ml = {x[0][0]: 1}
ml.update({x[k][0]: 0 for k in range(1, n)})
ml.update({x[0][i]: 0 for i in range(1, n)})
g = qbpp.replace(f, ml)
g.simplify_as_binary()
```

詳しくは[置換関数](REPLACE)をご覧ください。

## 解の復元

### 固定した式の解を読むとエラー

{% include video_seek.html t="13:38" %}

固定した式 `g` を ExhaustiveSolver で解くと、最適解は 2 個（同じ巡回路の逆回り）になります。
ところが、`g` の解 `s` は `g` に残った 16 個の変数の値しか持たないので、`s(x)` で `x[0][0]` を読もうとすると RuntimeError になります（意図したエラーの例）。
メッセージは、`Sol(f).set(sol, ml)` で元の式の解に戻すよう案内しています。

```python
import math
import pyqbpp as qbpp

# 最初の 5 頂点の式 f（前と同じ作り方）
nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142)]
n = len(nodes)
d = [[round(math.dist(nodes[i], nodes[j])) for j in range(n)] for i in range(n)]
x = qbpp.var("x", shape=(n, n))
length = 0
for k in range(n):
    for i in range(n):
        for j in range(n):
            length += d[i][j] * x[k][i] * x[(k + 1) % n][j]
f = (length
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
f.simplify_as_binary()

ml = {x[0][0]: 1}
ml.update({x[k][0]: 0 for k in range(1, n)})
ml.update({x[0][i]: 0 for i in range(1, n)})
g = qbpp.replace(f, ml)
g.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(g).search(best_energy_sols=0)
print(len(sol.sols), "optimal solutions")
for s in sol.sols:
    print(s.energy, qbpp.onehot_to_int(s(x), axis=1))
```

出力（トレースバックは省略）：

```
2 optimal solutions
Traceback (most recent call last):
  …
RuntimeError: Sol: variable x[0][0] is not in the model of this solution (it was fixed with replace, is not used in the expression, or cancelled out in simplify); to read variables fixed with replace, restore the full solution with Sol(f).set(sol, ml)
```

### Sol(f).set(sol, ml) で元の式の解に戻す

{% include video_seek.html t="15:50" %}

`qbpp.Sol(f)` は元の式 `f` の 25 個の変数を持つ解（はじめはすべて 0）です。
その `set` に `g` の解と `ml` を渡すと、`g` の解の 16 個の値と `ml` の 9 個の値が入り、元の式の解になります。

```python
import math
import pyqbpp as qbpp

# 最初の 5 頂点の式 f（前と同じ作り方）
nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142)]
n = len(nodes)
d = [[round(math.dist(nodes[i], nodes[j])) for j in range(n)] for i in range(n)]
x = qbpp.var("x", shape=(n, n))
length = 0
for k in range(n):
    for i in range(n):
        for j in range(n):
            length += d[i][j] * x[k][i] * x[(k + 1) % n][j]
f = (length
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
f.simplify_as_binary()

ml = {x[0][0]: 1}
ml.update({x[k][0]: 0 for k in range(1, n)})
ml.update({x[0][i]: 0 for i in range(1, n)})
g = qbpp.replace(f, ml)
g.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(g).search(best_energy_sols=0)
for s in sol.sols:
    full_sol = qbpp.Sol(f).set(s, ml)
    print(f(full_sol), qbpp.onehot_to_int(full_sol(x), axis=1))
```

出力：

```
589 [0, 3, 4, 2, 1]
589 [0, 1, 2, 4, 3]
```

詳しくは[クイックリファレンス: 解](QR_SOLUTION)をご覧ください。

### 9 頂点で固定して解く

{% include video_seek.html t="17:48" %}

9 頂点でも同じように固定すると、変数は 81 個から 64 個に減り、1 つの巡回路を表す行列は 18 個から 2 個になります。
元の式の解に戻すと、巡回路は必ず頂点 0 から始まります。

```python
import math
import pyqbpp as qbpp

nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142),
         (111, 243), (220, 4), (210, 113), (211, 233)]
n = len(nodes)
d = [[round(math.dist(nodes[i], nodes[j])) for j in range(n)] for i in range(n)]
x = qbpp.var("x", shape=(n, n))
length = 0
for k in range(n):
    for i in range(n):
        for j in range(n):
            length += d[i][j] * x[k][i] * x[(k + 1) % n][j]
f = (length
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
f.simplify_as_binary()
ml = {x[0][0]: 1}
ml.update({x[k][0]: 0 for k in range(1, n)})
ml.update({x[0][i]: 0 for i in range(1, n)})
g = qbpp.replace(f, ml)
g.simplify_as_binary()
sol = qbpp.EasySolver(g).search(time_limit=2)
full_sol = qbpp.Sol(f).set(sol, ml)
print("length =", full_sol(length), " tour =", qbpp.onehot_to_int(full_sol(x), axis=1))
```

動画での出力（EasySolver は実行ごとに結果が変わります）：

```
length = 959  tour = [0, 1, 4, 2, 5, 8, 7, 6, 3]
```

頂点 0 から始まる順番（8! 通り）をすべて調べると、最短の長さは 959 です。

## 解の操作

### set で値を書き換える

{% include video_seek.html t="19:50" %}

`full_sol.set` に辞書を渡すと、変数の値をまとめて書き換えます。辞書のキーが変数、値が新しい値です。
ここでは置換行列の 2 行目と 3 行目を入れ替えて、2 番目と 3 番目に訪れる頂点を入れ替えます。
巡回路は 0, 3, 2, 4, 1 に変わり、長さは 589 から 672 になります。

```python
import math
import pyqbpp as qbpp

# 最初の 5 頂点の式 f（前と同じ作り方）
nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142)]
n = len(nodes)
d = [[round(math.dist(nodes[i], nodes[j])) for j in range(n)] for i in range(n)]
x = qbpp.var("x", shape=(n, n))
length = 0
for k in range(n):
    for i in range(n):
        for j in range(n):
            length += d[i][j] * x[k][i] * x[(k + 1) % n][j]
f = (length
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
f.simplify_as_binary()

# full_sol は、5 頂点の復元した解（前の章と同じ）
ml = {x[0][0]: 1}
ml.update({x[k][0]: 0 for k in range(1, n)})
ml.update({x[0][i]: 0 for i in range(1, n)})
g = qbpp.replace(f, ml)
g.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(g).search()
full_sol = qbpp.Sol(f).set(sol, ml)

a = qbpp.onehot_to_int(full_sol(x), axis=1)
print(a, f(full_sol))
full_sol.set({x[2][a[2]]: 0, x[2][a[3]]: 1, x[3][a[3]]: 0, x[3][a[2]]: 1})
print(qbpp.onehot_to_int(full_sol(x), axis=1), f(full_sol))
```

出力：

```
[0, 3, 4, 2, 1] 589
[0, 3, 2, 4, 1] 672
```

### 値を変えたら comp_energy() で計算し直す

{% include video_seek.html t="22:30" %}

解は見つかったときのエネルギーを覚えていて、`energy` で読めます。
値を書き換えると覚えていたエネルギーは今の値と合わなくなるので、書き換えたあとに `full_sol.energy` を読むと RuntimeError になります（意図したエラーの例）。
`qbpp.Sol(f).set` で作った解も、作った直後は同じです。

```python
import math
import pyqbpp as qbpp

# 最初の 5 頂点の式 f（前と同じ作り方）
nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142)]
n = len(nodes)
d = [[round(math.dist(nodes[i], nodes[j])) for j in range(n)] for i in range(n)]
x = qbpp.var("x", shape=(n, n))
length = 0
for k in range(n):
    for i in range(n):
        for j in range(n):
            length += d[i][j] * x[k][i] * x[(k + 1) % n][j]
f = (length
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
f.simplify_as_binary()

# full_sol は、5 頂点の復元した解（前の章と同じ）
ml = {x[0][0]: 1}
ml.update({x[k][0]: 0 for k in range(1, n)})
ml.update({x[0][i]: 0 for i in range(1, n)})
g = qbpp.replace(f, ml)
g.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(g).search()
full_sol = qbpp.Sol(f).set(sol, ml)

# 前の set で入れ替えたあと
a = qbpp.onehot_to_int(full_sol(x), axis=1)
full_sol.set({x[2][a[2]]: 0, x[2][a[3]]: 1, x[3][a[3]]: 0, x[3][a[2]]: 1})
print(full_sol.energy)
```

出力（トレースバックは省略）：

```
Traceback (most recent call last):
  …
RuntimeError: Sol.energy: energy is invalid (variable changed after last computation). Call comp_energy() first.
```

`comp_energy()` は今の値でエネルギーを計算し直して返し、解に覚えさせます。そのあとは `energy` も読めます。
元の式に解を渡す `f(full_sol)` は、その場で計算するので、いつでも使えます。

```python
import math
import pyqbpp as qbpp

# 最初の 5 頂点の式 f（前と同じ作り方）
nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142)]
n = len(nodes)
d = [[round(math.dist(nodes[i], nodes[j])) for j in range(n)] for i in range(n)]
x = qbpp.var("x", shape=(n, n))
length = 0
for k in range(n):
    for i in range(n):
        for j in range(n):
            length += d[i][j] * x[k][i] * x[(k + 1) % n][j]
f = (length
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
f.simplify_as_binary()

# full_sol は、5 頂点の復元した解（前の章と同じ）
ml = {x[0][0]: 1}
ml.update({x[k][0]: 0 for k in range(1, n)})
ml.update({x[0][i]: 0 for i in range(1, n)})
g = qbpp.replace(f, ml)
g.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(g).search()
full_sol = qbpp.Sol(f).set(sol, ml)

# 前の set で入れ替えたあと
a = qbpp.onehot_to_int(full_sol(x), axis=1)
full_sol.set({x[2][a[2]]: 0, x[2][a[3]]: 1, x[3][a[3]]: 0, x[3][a[2]]: 1})
print(full_sol.comp_energy())
print(full_sol.energy)
```

出力：

```
672
672
```

### flip で 0 と 1 を入れ替える

{% include video_seek.html t="24:45" %}

`flip` に変数を渡すと、その変数の値が 0 なら 1 に、1 なら 0 になります。
`x[0][0]` を 0 にすると、0 行目にも 0 列目にも 1 がなくなり、`qbpp.onehot_to_int` はその行を -1 と表示します。
エネルギー 2446 は、頂点 0 を通らない道のり 3→2→4→1 の 446 と、破った 2 本の制約のペナルティ 2000 の和です。
`f.cons(full_sol)` は破っている制約の本数です。もう一度 `flip` すると元に戻ります。

```python
import math
import pyqbpp as qbpp

# 最初の 5 頂点の式 f（前と同じ作り方）
nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142)]
n = len(nodes)
d = [[round(math.dist(nodes[i], nodes[j])) for j in range(n)] for i in range(n)]
x = qbpp.var("x", shape=(n, n))
length = 0
for k in range(n):
    for i in range(n):
        for j in range(n):
            length += d[i][j] * x[k][i] * x[(k + 1) % n][j]
f = (length
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
f.simplify_as_binary()

# full_sol は、5 頂点の復元した解（前の章と同じ）
ml = {x[0][0]: 1}
ml.update({x[k][0]: 0 for k in range(1, n)})
ml.update({x[0][i]: 0 for i in range(1, n)})
g = qbpp.replace(f, ml)
g.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(g).search()
full_sol = qbpp.Sol(f).set(sol, ml)

# 前の set で入れ替えたあと
a = qbpp.onehot_to_int(full_sol(x), axis=1)
full_sol.set({x[2][a[2]]: 0, x[2][a[3]]: 1, x[3][a[3]]: 0, x[3][a[2]]: 1})
full_sol.flip(x[0][0])
print(qbpp.onehot_to_int(full_sol(x), axis=1), full_sol.comp_energy(), f.cons(full_sol))
full_sol.flip(x[0][0])
print(qbpp.onehot_to_int(full_sol(x), axis=1), full_sol.comp_energy(), f.cons(full_sol))
```

出力：

```
[-1, 3, 2, 4, 1] 2446 2
[0, 3, 2, 4, 1] 672 0
```

詳しくは[クイックリファレンス: 解](QR_SOLUTION)をご覧ください。

## cons で固定しない

{% include video_seek.html t="27:09" %}

`x[0][0]` が 1 という制約を `qbpp.cons` で足しても、最適解は 2 個になり、固定できているように見えます。
しかし、変数は 25 個のままです。

```python
import math
import pyqbpp as qbpp

# 5 頂点の式 f
nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142)]
n = len(nodes)
d = [[round(math.dist(nodes[i], nodes[j])) for j in range(n)] for i in range(n)]
x = qbpp.var("x", shape=(n, n))
length = 0
for k in range(n):
    for i in range(n):
        for j in range(n):
            length += d[i][j] * x[k][i] * x[(k + 1) % n][j]
f = (length
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
f.simplify_as_binary()

h = f + 1000 * qbpp.cons(x[0][0] == 1)
h.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(h).search(best_energy_sols=0)
print(len(sol.sols), "optimal solutions,", sol.info["var_count"], "variables")
```

出力：

```
2 optimal solutions, 25 variables
```

| | `cons` で固定 | `replace` で固定 |
|---|---|---|
| 変数 | 25 個のまま | 16 個に減る |
| 全探索で調べる数 | $2^{25}$ 通り | $2^{16}$ 通り（512 分の 1） |
| 固定の仕方 | 重み付きのペナルティ：0 と 1 を行き来する | 定数に置き換わる：厳密 |

値を固定したいときは、制約ではなく `qbpp.replace` で置き換えます。

## 整数変数の例

### x × y = z

{% include video_seek.html t="29:31" %}

$x$ と $y$ は 2〜99、$z$ は 4〜9801 の整数変数で、制約 `x * y - z == 0` を満たせばエネルギーは 0 です。
整数変数だけの式なので、`simplify_as_binary` ではなく `simplify` で整理します。
$x$ と $y$ を固定すれば掛け算、$x$ と $z$ を固定すれば割り算、$z$ だけを固定すれば因数分解になります。

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(2, 99))
y = qbpp.var("y", integer=(2, 99))
z = qbpp.var("z", integer=(4, 9801))
f = qbpp.cons(x * y - z == 0)
f.simplify()
```

### 3 通りに固定して解く

{% include video_seek.html t="31:36" %}

同じ式 `f` を 3 つの `ml` で固定して解きます。元の式 `f` は変わらないので、次の `ml` でも同じ `f` から固定できます。
`target_energy=0` なので、制約を満たす解が見つかれば探索が止まります。
`g` を表示すると、固定したあとに残った問題が分かります。

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(2, 99))
y = qbpp.var("y", integer=(2, 99))
z = qbpp.var("z", integer=(4, 9801))
f = qbpp.cons(x * y - z == 0)
f.simplify()
for ml in ({x: 37, y: 53}, {x: 37, z: 1961}, {z: 1961}):
    g = qbpp.replace(f, ml)
    g.simplify()
    sol = qbpp.EasySolver(g).search(target_energy=0)
    full_sol = qbpp.Sol(f).set(sol, ml)
    print("g =", g, "  ->", f"x = {full_sol(x)}, y = {full_sol(y)}, z = {full_sol(z)}")
```

動画での出力（EasySolver は実行ごとに結果が変わります）：

```
g = cons(1961 -z == 0)   -> x = 37, y = 53, z = 1961
g = cons(-1961 +37*y == 0)   -> x = 37, y = 53, z = 1961
g = cons(-1961 +x*y == 0)   -> x = 53, y = 37, z = 1961
```

因数分解では、実行によって $x$ と $y$ が入れ替わって見つかることもあります。

詳しくは[整数変数による因数分解](FACTORIZATION)をご覧ください。

## 式で置き換える

### 制約付きの最大カット

{% include video_seek.html t="33:50" %}

グラフの頂点を 2 つのグループに分け、グループをまたぐ辺の数（カット）を最大にします。
ピーターセングラフ（頂点 10 個・辺 15 本）で、頂点 0 と 1、5 と 8 は同じグループ、2 と 7、3 と 6 は別のグループにします。
$x[i]$ は頂点 $i$ のグループを表し、辺 $(i, j)$ のカットは `x[i] * ~x[j] + ~x[i] * x[j]` です。
カットの最大は、制約がなければ 12、制約があると 11 で、最適なグループ分けは 2 つ（色の入れ替え）あります。

### ml の値に式を書く

{% include video_seek.html t="36:18" %}

同じグループのペアでは `x[j]` を `x[i]` で、別のグループのペアでは `x[j]` を `~x[i]` で置き換えます。
`ml` の書き方には決まりが 2 つあります。

- `~x[j]` もキーに書く：`qbpp.replace` は `x[j]` と `~x[j]` を別のキーとして扱います。
- 置き換える変数を値の側に書かない：置き換えは同時に行われ、置き換えた結果をもう一度は置き換えません。

`g` の変数は 6 個です。`qbpp.Sol(f).set(sol, ml)` では、`ml` の値の式を `sol` の値で計算して、置き換えた変数の値を求めます。

```python
import pyqbpp as qbpp

edges = [(0, 1), (1, 2), (2, 3), (3, 4), (4, 0), (0, 5), (1, 6), (2, 7),
         (3, 8), (4, 9), (5, 7), (7, 9), (9, 6), (6, 8), (8, 5)]
same = [(0, 1), (5, 8)]   # 同じグループ
diff = [(2, 7), (3, 6)]   # 別のグループ
x = qbpp.var("x", shape=10)
f = 0
for i, j in edges:
    f -= x[i] * ~x[j] + ~x[i] * x[j]   # カットされた辺ごとに -1
ml = {}
for i, j in same:
    ml[x[j]], ml[~x[j]] = x[i], ~x[i]
for i, j in diff:
    ml[x[j]], ml[~x[j]] = ~x[i], x[i]
g = qbpp.replace(f, ml)
g.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(g).search(best_energy_sols=0)
print("variables =", sol.info["var_count"], "energy =", sol.energy,
      "optimal =", len(sol.sols))
full_sol = qbpp.Sol(f).set(sol, ml)
print("cut =", -full_sol(f),
      "same:", [full_sol(x[i]) == full_sol(x[j]) for i, j in same],
      "diff:", [full_sol(x[i]) != full_sol(x[j]) for i, j in diff])
```

出力：

```
variables = 6 energy = -11 optimal = 2
cut = 11 same: [True, True] diff: [True, True]
```

詳しくは[置換関数](REPLACE)、[最大カット問題](MAXCUT)をご覧ください。

### cons() と比べる

{% include video_seek.html t="40:54" %}

同じ制約を `qbpp.cons` で書くと、答えは同じですが、変数は 10 個のまま減りません（全探索で 64 通りが 1024 通りになります）。
制約の重みも決める必要があります。一方、解 `sol` は 10 個の変数をすべて持つので、そのまま使えます。

```python
import pyqbpp as qbpp

edges = [(0, 1), (1, 2), (2, 3), (3, 4), (4, 0), (0, 5), (1, 6), (2, 7),
         (3, 8), (4, 9), (5, 7), (7, 9), (9, 6), (6, 8), (8, 5)]
same = [(0, 1), (5, 8)]   # 同じグループ
diff = [(2, 7), (3, 6)]   # 別のグループ
x = qbpp.var("x", shape=10)
f = 0
for i, j in edges:
    f -= x[i] * ~x[j] + ~x[i] * x[j]   # カットされた辺ごとに -1
for i, j in same:
    f += 100 * qbpp.cons(x[i] - x[j] == 0)
for i, j in diff:
    f += 100 * qbpp.cons(x[i] + x[j] == 1)
f.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(f).search(best_energy_sols=0)
print("variables =", sol.info["var_count"], "energy =", sol.energy,
      "optimal =", len(sol.sols))
print("cut =", -sol(f),
      "same:", [sol(x[i]) == sol(x[j]) for i, j in same],
      "diff:", [sol(x[i]) != sol(x[j]) for i, j in diff])
```

出力：

```
variables = 10 energy = -11 optimal = 2
cut = 11 same: [True, True] diff: [True, True]
```

変数の値で決まる制約を `qbpp.cons` で書くのは悪手です。`ml` で置き換えて、`qbpp.replace` で変数を減らします。

## まとめ

{% include video_seek.html t="44:04" %}

- 変数の値を固定するには、固定する変数と値を辞書 `ml` に書き、`qbpp.replace(f, ml)` を使います。変数を値に置き換えた新しい式が返り、元の式 `f` は変わりません。
- 置き換えたあとは式を整理します。バイナリ変数を含む式には `simplify_as_binary`、整数変数だけの式には `simplify` を使います。
- 固定した変数は式から消えるので、探す範囲が狭くなります。巡回セールスマン問題では、最適解も 10 個から 2 個に減りました。整数変数の例では、固定する変数を変えるだけで、掛け算・割り算・因数分解を解きました。
- 固定した式 `g` の解は、`qbpp.Sol(f).set(sol, ml)` で元の式 `f` の解に戻します。`ml` の値には、数だけでなく別の変数や否定リテラルも書けます。そのときは `~x[j]` もキーに書きます。
- 解の値は、`set` に辞書を渡して書き換えられます。`flip` は変数の 0 と 1 を入れ替えます。値を変えると解の `energy` は無効になるので、`comp_energy()` で計算し直します。
- `qbpp.cons` で値を固定するのは避けます。変数が式に残るので、探す範囲が狭くなりません。
