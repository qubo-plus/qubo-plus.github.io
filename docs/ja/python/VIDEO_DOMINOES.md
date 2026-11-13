---
last_modified: 2026-11-13
layout: default
nav_exclude: true
title: "動画：チェス盤にドミノを置く"
description: "動画「QUBO++ ケーススタディ チェス盤にドミノを置く（Python）」の章ごとの要点と、動画に出てくるプログラムと出力。"
lang: ja
hreflang_alt: "en/python/VIDEO_DOMINOES"
hreflang_lang: "en"
video: dominoes
---

# 動画：チェス盤にドミノを置く（Python）

動画「QUBO++ ケーススタディ チェス盤にドミノを置く（Python）」の手引きです。
章ごとに、要点と動画に出てくるプログラム・出力、詳しい説明のページへのリンクをまとめています。
「▶ 動画の … から再生」をクリックすると、その場面から再生します。

{% include video_embed.html slug="dominoes" %}

この動画で扱うこと：

- 8×8 の盤にドミノをできるだけ多く置くこと（32 枚）
- 対角の 2 隅を切った盤を、マスを頂点、隣り合う 2 マスを辺とするグラフで表し、最大マッチングとして解くこと（30 枚）と、31 枚置けない理由
- 角を切らない 8×8 の盤に、もう置けなくなるまで、できるだけ少なくドミノを置くこと（最小極大マッチング、22 枚）
- 2 つの問題を、辺ごとの変数 $x$ とマスを覆うドミノの数 $N(v)$ で表し、目的関数の符号と制約だけを変えて解くこと

文章での説明は[最大マッチング](MAX_MATCHING#チェス盤にドミノを置く)と[最小極大マッチング](MINMAX_MATCHING#チェス盤にドミノを置く)のページにあります。[動画（ケーススタディ）](../VIDEO_CASE_STUDIES)の一覧に戻る

結果だけを見たい方は、[結果：22 枚](#結果22-枚)の章から再生してください。

## できるだけ多く置く

{% include video_seek.html t="0:44" %}

- ドミノ 1 枚は、縦か横に隣り合う 2 つのマスを覆います。ドミノどうしは重ねて置けません。
- 8×8 の盤では、各行に横向きに 4 枚ずつ並べると 32 枚で、64 個のマスがすべて覆われます。1 枚で 2 マスを覆うので 33 枚は置けず、最大は 32 枚です。

## 角を 2 つ切る

{% include video_seek.html t="1:14" %}

- 対角にある 2 つの隅のマスを切り取ると、残りは 62 マスです。31 枚置けるでしょうか。
- マスを頂点、隣り合う 2 つのマスを辺で結んだグラフを $G=(V,E)$ と書きます。$V$ は頂点の集合、$E$ は辺の集合で、62 マスの盤では辺は 108 本です。
- ドミノを 1 枚置くことは辺を 1 本選ぶことで、ドミノが重ならないことは、選んだ辺どうしが頂点を共有しないことです。頂点を共有しない辺の集まりを**マッチング**、辺の数が最大のマッチングを**最大マッチング**といいます。

## 最大マッチングの式

{% include video_seek.html t="2:11" %}

- 辺 $e$ ごとにバイナリ変数 $x_e$ を用意し、1 ならその辺にドミノを置きます。置いたドミノの枚数は $\sum_e x_e$ です。
- マス $v$ を覆うドミノの数を $N(v)=\sum_{(v,u)\in E} x_{vu}$ とします。$N(v)$ は新しい変数ではなく、$x$ の値から決まる数で、マスが空いていれば 0、覆われていれば 1、ドミノが重なっていれば 2 以上です。
- ドミノが重ならない条件は、すべてのマスで $N(v)\le 1$ です。QUBO++ は最小化するので符号を反転し、制約を `qbpp.cons()` で宣言して重み 2 を掛けます：

$$
f = -\sum_e x_e + 2\sum_v \text{cons}(N(v)\le 1)
$$

- 制約を破ると、違反量の 2 乗に重みを掛けた値がエネルギーに加わります。2 枚が重なったマスで 1 枚を取り除くと、$x$ の和が 1 減って $f$ は 1 増えますが、ペナルティは 2 以上減るので、重なりのある解は最小になりません。重みが 1 だと増減が釣り合い、重なった解も最小になりえます。

`qbpp.cons()` と重みについては[制約の書き方](CONSTRAINTS)のページをご覧ください。

## プログラム

{% include video_seek.html t="4:06" %}

```python
import pyqbpp as qbpp

# 8×8 の盤から対角の 2 隅を除いた 62 マス
cells = [(r, c) for r in range(8) for c in range(8)
         if (r, c) not in [(0, 0), (7, 7)]]
index = {cell: i for i, cell in enumerate(cells)}

# 隣り合う 2 マス（右隣と下隣）
edges = []
for r, c in cells:
    for cell in [(r, c + 1), (r + 1, c)]:
        if cell in index:
            edges.append((index[(r, c)], index[cell]))

x = qbpp.var("x", shape=len(edges))

# N[v]: マス v を覆うドミノの数
N = [0] * len(cells)
for i, (u, v) in enumerate(edges):
    N[u] += x[i]
    N[v] += x[i]

objective = qbpp.sum(x)

constraint = 0
for v in range(len(cells)):
    constraint += qbpp.cons(N[v] <= 1)

f = -objective + 2 * constraint
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=10)

print(f"dominoes = {sol(objective)}")
print(f"violated constraints = {f.cons(sol)}")
board = [[" "] * 8 for _ in range(8)]
for r, c in cells:
    board[r][c] = "."
for i, (u, v) in enumerate(edges):
    if sol(x[i]) == 1:
        (r1, c1), (r2, c2) = cells[u], cells[v]
        if r1 == r2:
            board[r1][c1], board[r2][c2] = "<", ">"
        else:
            board[r1][c1], board[r2][c2] = "^", "v"
for row in board:
    print(" ".join(row))
```

- `cells` は 62 マスの（行, 列）の一覧、`index` はマスの番号を引く辞書、`edges` は隣り合う 2 マスの番号の組です。右隣と下隣だけを加えると、左隣と上隣の組は相手のマスの右隣と下隣として加わります。
- `N` はマスごとの $N(v)$ のリストで、辺ごとに両端のマス `u` と `v` の `N` にその辺の `x` を足します。
- 変数の値の組み合わせは $2^{108}$ 通りあり、すべては調べられないので、[EasySolver](EASYSOLVER) で 10 秒探します。`sol(objective)` は置いたドミノの枚数、`f.cons(sol)` は破った制約の数です。
- 盤は、横のドミノを `<>`、縦のドミノを `^` と `v`、空いたマスを `.` で表示します。

## 結果：30 枚

{% include video_seek.html t="5:57" %}

動画での出力です（置き方は実行するたびに変わることがあります）：

```
dominoes = 30
violated constraints = 0
  ^ ^ ^ < > ^ ^
^ v v v < > v v
v ^ ^ ^ < > ^ ^
^ v v v < > v v
v . ^ . < > ^ ^
< > v ^ < > v v
^ ^ ^ v < > < >
v v v < > < >  
```

- ドミノは 30 枚で、破った制約は 0 です。空いたマスは 2 つだけで、隣り合っていないのでドミノは置けません。

## なぜ 31 枚置けないか

{% include video_seek.html t="6:17" %}

- チェス盤では、隣り合う 2 つのマスは必ず違う色なので、ドミノ 1 枚は白いマスと黒いマスを 1 つずつ覆います。
- 切り取った 2 つの隅はどちらも白いマスなので、白いマスは 30 個、黒いマスは 32 個です。31 枚置くには白いマスが 31 個必要なので、31 枚は置けません。結果の盤の空いた 2 つのマスも、どちらも黒いマスです。
- QUBO++ で求めた 30 枚が最大であることが分かりました。欠けたチェス盤の問題として知られているパズルです。

## もう置けなくなるまで置く

{% include video_seek.html t="7:12" %}

- ここから本題です。角を切らない 8×8 の盤に、もう 1 枚も置けなくなるまでドミノを置きます。置ける場所からランダムに選んで置いた例では、29 枚で止まりました。
- もう辺を加えられないマッチングを**極大マッチング**といいます。4 つのマスが横に並んだ盤では、真ん中に 1 枚置くと 1 枚で極大ですが、最大は 2 枚です。極大はもう置けないこと、最大はいちばん多いことで、意味が違います。
- できるだけ少ない枚数でもう置けない状態を作ること、つまり辺の数が最小の極大マッチング（**最小極大マッチング**）を求めます。

## もう置けない条件

{% include video_seek.html t="8:23" %}

- すべての辺 $uv$ で $1\le N(u)+N(v)\le 2$ という制約を使います。$N(u)+N(v)$ は $u$ と $v$ のまわりの辺の $x$ をすべて足したもので、真ん中の辺 $uv$ は 2 回数えます。
- 辺 $uv$ にドミノがあれば和は 2、一方のマスだけが別のドミノで覆われていれば 1、両方が別々のドミノで覆われていれば 2 です。どちらのマスも空いていれば和は 0 で、まだドミノを置けるので制約を破ります。ドミノが重なると、2 枚に覆われたマスと、それを覆うドミノのもう一方のマスで和は 3 以上です。
- よって、すべての辺で 1 以上 2 以下であることと、ドミノが重ならずにもう置けないことは同じです。

画面の隅に参考文献として示した論文：Y. Nakahara, S. Tsukiyama, K. Nakano, V. Parque, and Y. Ito, "A penalty-free QUBO formulation for the minimum maximal matching problem," International Journal of Parallel, Emergent and Distributed Systems, pp. 1-19, 2025.

## 最小極大マッチングの式

{% include video_seek.html t="9:48" %}

- 8×8 の盤では辺は 112 本なので、変数 $x$ は 112 個です。目的は $x$ の和の最小化なので、符号は反転しません：

$$
f = \sum_e x_e + 2\sum_{(u,v)\in E} \text{cons}(1\le N(u)+N(v)\le 2)
$$

- 空いたマスが隣り合う組が 1 つだけあると違反量は 1 です。重みが 1 だと、すき間を残した解と、そこにドミノを置いて埋めた解が同じエネルギーになります。重みを 2 にすると埋めた解のほうがエネルギーが小さくなるので、すき間を残した解は最小になりません。

## プログラムの変更

{% include video_seek.html t="10:44" %}

```python
import pyqbpp as qbpp

# 8×8 の盤の 64 マス
cells = [(r, c) for r in range(8) for c in range(8)]
index = {cell: i for i, cell in enumerate(cells)}

# 隣り合う 2 マス（右隣と下隣）
edges = []
for r, c in cells:
    for cell in [(r, c + 1), (r + 1, c)]:
        if cell in index:
            edges.append((index[(r, c)], index[cell]))

x = qbpp.var("x", shape=len(edges))

# N[v]: マス v を覆うドミノの数
N = [0] * len(cells)
for i, (u, v) in enumerate(edges):
    N[u] += x[i]
    N[v] += x[i]

objective = qbpp.sum(x)

constraint = 0
for u, v in edges:
    constraint += qbpp.cons(N[u] + N[v], between=(1, 2))

f = objective + 2 * constraint
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=10)

print(f"dominoes = {sol(objective)}")
print(f"violated constraints = {f.cons(sol)}")
board = [[" "] * 8 for _ in range(8)]
for r, c in cells:
    board[r][c] = "."
for i, (u, v) in enumerate(edges):
    if sol(x[i]) == 1:
        (r1, c1), (r2, c2) = cells[u], cells[v]
        if r1 == r2:
            board[r1][c1], board[r2][c2] = "<", ">"
        else:
            board[r1][c1], board[r2][c2] = "^", "v"
for row in board:
    print(" ".join(row))
```

- 前半のプログラムから変わるのは、`cells`（2 つの隅を除く条件を消して 64 マス）、制約（マスごとではなく辺ごとに、`qbpp.cons()` の `between` で $1\le N(u)+N(v)\le 2$）、`f`（最小化なのでマイナスを付けない）だけです。
- `edges` や `N` を作る部分と、解いて表示する部分は変わりません。ソルバーも同じ EasySolver です。

## 結果：22 枚

{% include video_seek.html t="11:37" %}

動画での出力です（置き方は実行するたびに変わることがあります）：

```
dominoes = 22
violated constraints = 0
. ^ < > . < > .
^ v . < > ^ . ^
v . < > . v ^ v
. < > . < > v .
< > . < > . < >
. < > ^ . < > .
< > . v ^ . < >
. < > . v < > .
```

- ドミノは 22 枚で、破った制約は 0 です。空いた 20 個のマスはどの 2 つも隣り合っていないので、もうドミノは置けません。32 枚置いた盤より 10 枚少ない枚数で、置けなくなっています。
- ランダムに置く方法を 10 万回試すと、すべて 25 枚から 32 枚の間で止まり、いちばん多かったのは 29 枚でした。22 枚から 24 枚で止まったことは 1 度もありません。
- 22 枚が最小であることは、別の方法でも確かめました。

## まとめ

{% include video_seek.html t="12:29" %}

- 8×8 の盤にできるだけ多く置くと 32 枚、角を 2 つ切った盤はマスごとに $N(v)\le 1$ という制約で 30 枚でした。
- 8×8 の盤をもう置けない状態にする最少の枚数は 22 枚で、辺ごとに $1\le N(u)+N(v)\le 2$ という制約で求めました。
- どちらも辺ごとの変数 $x$ とマスを覆うドミノの数 $N(v)$ で表し、目的関数の符号と制約を変えるだけで、別の問題が解けました。
