---
last_modified: 2026-10-26
layout: default
nav_exclude: true
title: "動画：スライスと einsum"
description: "動画「QUBO++ スライスと einsum（Python）」の章ごとの要点と、動画に出てくるプログラムと出力。"
lang: ja
hreflang_alt: "en/python/VIDEO_EINSUM"
hreflang_lang: "en"
video: einsum
---

# 動画：スライスと einsum（Python）

動画「QUBO++ スライスと einsum（Python）」の手引きです。
章ごとに、要点と動画に出てくるプログラム・出力、詳しい説明のページへのリンクをまとめています。
「▶ 動画の … から再生」をクリックすると、その場面から再生します。
動画では一部を省略して見せているプログラムも、ここではそのまま実行できる形で載せています。

{% include video_embed.html slug="einsum" %}

この動画で扱うこと：

- Python の for ループの代わりに、スライス・`qbpp.concat`・`qbpp.einsum` で配列から式を速く作る理由
- `v[1:3]`・`v[:-1]`・`v[-1]`・`x[:, 2]` などのスライスと、`qbpp.concat` で 1 つずらした配列を作る方法
- `qbpp.einsum` の読み方（同じ文字の軸は掛ける、矢印の後ろにない文字は和を取る、後ろの文字は結果に残る）
- 巡回セールスマン問題の巡回路の長さを、3 重ループの代わりに einsum の 1 行で書く方法
- 魔方陣の制約を、対角線まですべて einsum で書いて解く方法

[動画（チュートリアル）](../VIDEOS)の一覧に戻る

## スライス

### 1 次元の配列のスライス

{% include video_seek.html t="4:21" %}

`v[a:b]` は、`a` 番目から `b - 1` 番目までを取り出します（`b` 番目は含みません）。
コロンの前を省くと先頭から、後ろを省くと最後までです。マイナスの番号は後ろから数え、`-1` は最後の要素です。
コロンのない番号は、配列ではなく要素を 1 つ取り出します。ここまでは Python のリストのスライスと同じです。
`qbpp.concat` は配列をつなげます。`v[1:]` と `v[:1]` をつなげると、先頭の `v[0]` が最後に回り込み、要素が 1 つずれた配列になります。

```python
import pyqbpp as qbpp

v = qbpp.var("v", shape=5)
print(v[1:3])
print(v[:-1])
print(v[1:])
print(v[-1])
print(qbpp.concat([v[1:], v[:1]]))
x = qbpp.var("x", shape=(3, 4))
print(x[:, 2])
```

出力：

```
[v[1], v[2]]
[v[0], v[1], v[2], v[3]]
[v[1], v[2], v[3], v[4]]
v[4]
[v[1], v[2], v[3], v[4], v[0]]
[x[0][2], x[1][2], x[2][2]]
```

### 2 次元の配列のスライス

{% include video_seek.html t="7:32" %}

2 次元の配列でも、軸ごとにスライスを書けます。コロンだけを書いた軸は、その軸のすべてです。
3 行 4 列の `x` の `x[:, 2]` は、すべての行の 2 列目で、出力の最後の行の 3 個の要素です。
`x[1:]` は 1 行目から最後の行まで、`x[:1]` は 0 行目だけです。
`qbpp.concat([x[1:], x[:1]])` は、1 行目と 2 行目が 1 段ずつ上がり、0 行目が一番下に回り込んだ、行が 1 つずれた配列になります。
$k$ 行目には、元の `x` の $k + 1$ 行目が入ります。この配列を、あとで巡回セールスマン問題に使います。

詳しくは[スライスと連結](SLICE_CONCAT)をご覧ください。

## einsum の読み方

### 3 つの規則

{% include video_seek.html t="9:21" %}

`qbpp.einsum` は、文字で軸を指定して、掛けて足す関数です。基本の書き方は NumPy の einsum と同じです。
`qbpp.einsum("ij,j->i", A, w)` では、カンマで区切った `ij` が 2 行 3 列の配列 `A` の軸（行が `i`、列が `j`）、`j` が 3 個の要素の配列 `w` の軸です。

1. 同じ文字の軸は、同じ添字で取り出して掛けます。
2. 矢印の後ろにない文字は、和を取ります。
3. 矢印の後ろの文字は、結果に残ります。

$A = [[1, 2, 3], [4, 5, 6]]$、$w = [1, 2, 3]$ なら、0 行目は $1 \times 1 + 2 \times 2 + 3 \times 3 = 14$、
1 行目は $4 \times 1 + 5 \times 2 + 6 \times 3 = 32$ で、結果は 14 と 32 の配列です。

$$
r_i = \sum_j A_{ij}\, w_j
$$

`"ij,j->i"` は、行列とベクトルの積です。どの文字で和を取るかは、矢印の後ろに書くかどうかで決まります。

### 数の配列で試す

{% include video_seek.html t="11:37" %}

`"i,i->"` は同じ番号の要素どうしを掛けてすべて足す内積（$4 + 10 + 18 = 32$）、
`"ij->i"` は行ごとの和、`"ij,j->i"` は行列とベクトルの積です。

```python
import pyqbpp as qbpp

w = qbpp.array([1, 2, 3])
u = qbpp.array([4, 5, 6])
A = qbpp.array([[1, 2, 3], [4, 5, 6]])
print(qbpp.einsum("i,i->", w, u))
print(qbpp.einsum("ij->i", A))
print(qbpp.einsum("ij,j->i", A, w))
```

出力：

```
32
[6, 15]
[14, 32]
```

詳しくは[Einsum関数](EINSUM)をご覧ください。

## einsum で式を作る

{% include video_seek.html t="13:23" %}

数の配列と変数の配列を一緒に渡せます。`"i,i->"` で `w` と `x` を渡すと、`w` を重みにした `x` の重み付きの和になります。
これは `qbpp.sum(w * x)` と同じ式です。
`"i,ij,j->"` で `y`、`W`、`y` を渡すと、$i$ と $j$ の組ごとに 3 つの要素を掛けた 4 つの積をすべて足した、2 次形式になります。
`simplify_as_binary` で整理すると、対角の積 $y_i^2$ は $y_i$ になり、$y[0]$ と $y[1]$ の 2 つの積は係数 2 と 3 がまとまって 5 になります。

```python
import pyqbpp as qbpp

w = qbpp.array([1, 2, 3])
x = qbpp.var("x", shape=3)
print(qbpp.einsum("i,i->", w, x))
W = qbpp.array([[1, 2], [3, 4]])
y = qbpp.var("y", shape=2)
q = qbpp.einsum("i,ij,j->", y, W, y)
q.simplify_as_binary()
print(q)
```

出力：

```
x[0] +2*x[1] +3*x[2]
y[0] +4*y[1] +5*y[0]*y[1]
```

詳しくは[Einsum関数](EINSUM)をご覧ください。

## 巡回セールスマン問題

### 問題と変数

{% include video_seek.html t="15:43" %}

9 個の頂点（0〜8）をすべてちょうど 1 回ずつ訪れて出発点に戻る巡回路のうち、長さが最小のものを探します。
`d[i][j]` は頂点 `i` と頂点 `j` の距離（座標から計算して整数に丸めたもの）です。
巡回路は 9 行 9 列の 0/1 の変数の配列 `x` で表し、`x[k][i]` は $k$ 番目に訪れる頂点が $i$ のとき 1 です。
どの行にも、どの列にも 1 がちょうど 1 つ並びます（行と列の one-hot の制約）。
最短の巡回路は 0 → 1 → 4 → 2 → 5 → 8 → 7 → 6 → 3 → 0 で、長さは 959 です。

### Σ の式と 3 重ループ

{% include video_seek.html t="17:55" %}

巡回路の長さ $L$ は、Σ を 3 つ使って次のように書けます。

$$
L = \sum_{k=0}^{n-1} \sum_{i=0}^{n-1} \sum_{j=0}^{n-1} d_{ij}\, x_{k,i}\, x_{(k+1) \bmod n,\, j}
$$

$x_{k,i}\, x_{(k+1) \bmod n,\, j}$ は、$k$ 番目が頂点 $i$ で、その次が頂点 $j$ のときだけ 1 で、そのときだけ距離 $d_{ij}$ が足されます。
たとえば 2 番目が頂点 4、3 番目が頂点 2 なら、頂点 4 から頂点 2 への辺の長さ 128 が足されます。
この Σ の式を計算するのが、次のプログラムの最後の 3 重ループです。

```python
import math
import pyqbpp as qbpp

nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142),
         (111, 243), (220, 4), (210, 113), (211, 233)]
n = len(nodes)
d = qbpp.array([[round(math.dist(nodes[i], nodes[j])) for j in range(n)] for i in range(n)])
x = qbpp.var("x", shape=(n, n))
length = 0
for k in range(n):
    for i in range(n):
        for j in range(n):
            length += d[i][j] * x[k][i] * x[(k + 1) % n][j]
```

中の 1 行は $n^3$ 回実行されます。9 頂点なら 729 回、$n = 100$ なら 100 万回です。
Python の生の for ループは 1 回ごとの処理に時間がかかるので、回数が多いと式を作るだけで時間がかかります。

### 1 つずらした配列 x_next

{% include video_seek.html t="20:08" %}

`x_next = qbpp.concat([x[1:], x[:1]])` は、`x` の行を 1 つずらした配列です。
`x` の 1 行目から 8 行目が 1 段ずつ上がり、0 行目が一番下に回り込みます。

$$
x^{\mathrm{next}}_{k,j} = x_{(k+1) \bmod n,\, j}
$$

同じ $k$ の行で見ると、`x` は $k$ 番目の頂点、`x_next` はその次の頂点を表します。
たとえば `x` の 2 行目は列 4、`x_next` の 2 行目は列 2 が 1 で、頂点 4 から頂点 2 への辺になります。
これで、Σ の式の $x_{(k+1) \bmod n,\, j}$ を $x^{\mathrm{next}}_{k,j}$ に置き換えられます。

### einsum の 1 行

{% include video_seek.html t="22:06" %}

置き換えた式は次のとおりです。

$$
L = \sum_{k} \sum_{i} \sum_{j} d_{ij}\, x_{k,i}\, x^{\mathrm{next}}_{k,j}
$$

3 つの因子の添字を、配列の軸の順番に書きます。

| 因子 | 配列 | 添字の文字 |
|---|---|---|
| $d_{ij}$ | `d` | `ij` |
| $x_{k,i}$ | `x` | `ki`（`x` は行が $k$、列が $i$ なので `ik` ではない） |
| $x^{\mathrm{next}}_{k,j}$ | `x_next` | `kj` |

$k$, $i$, $j$ のすべてについて和を取るので、矢印の後ろには何も書きません。結果は配列ではなく 1 つの式です。
こうして、3 重ループが `qbpp.einsum("ij,ki,kj->", d, x, x_next)` の 1 行になります。

### プログラム

{% include video_seek.html t="24:30" %}

行と列の one-hot の制約を付けて、最短の長さ 959 を `target_energy` にして EasySolver で解きます。

```python
import math
import pyqbpp as qbpp

nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142),
         (111, 243), (220, 4), (210, 113), (211, 233)]
n = len(nodes)
d = qbpp.array([[round(math.dist(nodes[i], nodes[j])) for j in range(n)] for i in range(n)])
x = qbpp.var("x", shape=(n, n))
x_next = qbpp.concat([x[1:], x[:1]])
length = qbpp.einsum("ij,ki,kj->", d, x, x_next)
f = (length
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
f.simplify_as_binary()
sol = qbpp.EasySolver(f).search(target_energy=959)
print("length =", sol(length), " tour =", qbpp.onehot_to_int(sol(x), axis=1))
```

動画での出力（EasySolver の結果は実行ごとに変わります）：

```
length = 959  tour = [0, 1, 4, 2, 5, 8, 7, 6, 3]
```

巡回路の出発点や回る向きは実行するたびに変わることがありますが、どれも同じ長さ 959 の巡回路です。

### ループの式と比べる

{% include video_seek.html t="26:24" %}

3 重ループで作った式 `loop` と、einsum で作った式 `ein` を比べます。
どちらも 648 項で、差は 0 になり、まったく同じ式です。
中の 1 行は $9^3 = 729$ 回実行されますが、$i = j$ の 81 回は同じ頂点どうしの距離 0 の項で消えるので、$729 - 81 = 648$ 項です。

```python
import math
import pyqbpp as qbpp

nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142),
         (111, 243), (220, 4), (210, 113), (211, 233)]
n = len(nodes)
d = qbpp.array([[round(math.dist(nodes[i], nodes[j])) for j in range(n)] for i in range(n)])
x = qbpp.var("x", shape=(n, n))
loop = 0
for k in range(n):
    for i in range(n):
        for j in range(n):
            loop += d[i][j] * x[k][i] * x[(k + 1) % n][j]
ein = qbpp.einsum("ij,ki,kj->", d, x, qbpp.concat([x[1:], x[:1]]))
loop.simplify_as_binary()
ein.simplify_as_binary()
diff = loop - ein
diff.simplify_as_binary()
print("terms:", loop.term_count(), ein.term_count(),
      " loop - ein =", diff)
```

出力：

```
terms: 648 648  loop - ein = 0
```

詳しくは[巡回セールスマン問題](TSP)をご覧ください。

## 魔方陣

### 変数とマスの数

{% include video_seek.html t="28:07" %}

3 × 3 のマスに 1〜9 を 1 回ずつ置いて、どの行・列・対角線も和を 15 にします。
変数 `x` は 3 × 3 × 9 の配列 `qbpp.var("x", shape=(3, 3, 9))` で、`x[i][j][k]` が 1 なら、マス $(i, j)$ の数は $k + 1$ です。
1 つのマスの 9 個の変数のうち、1 になるのは 1 つだけです。
1〜9 の配列 `v = qbpp.array([1, 2, 3, 4, 5, 6, 7, 8, 9])` を掛けて $k$ について和を取れば、マスの数が求まります。
einsum では `qbpp.einsum("k,ijk->ij", v, x)` で、マスごとの数が 3 × 3 の配列で求まります。
たとえば動画の魔方陣の 1 行 2 列のマスは、$k = 6$ の変数だけが 1 で、数は 7 です。

### 制約を einsum で書く

{% include video_seek.html t="29:56" %}

矢印の後ろに残す文字が「どれごとの」制約かを表し、残さない文字の軸は和を取って畳まれます。

| einsum | 和を取る文字 | 制約 |
|---|---|---|
| `qbpp.einsum("ijk->ij", x) == 1` | $k$ | どのマスにも数は 1 つ |
| `qbpp.einsum("ijk->k", x) == 1` | $i$, $j$ | どの数も 1 回だけ |
| `row = qbpp.einsum("k,ijk->i", v, x)` | $j$, $k$ | 行の和を 15 に |
| `col = qbpp.einsum("k,ijk->j", v, x)` | $i$, $k$ | 列の和を 15 に |

どれも 9 個や 3 個の和を並べた配列で、1 や 15 と比べると制約の配列になるので、`qbpp.cons` で全部を制約にします。

### 対角線と逆対角線

{% include video_seek.html t="31:17" %}

対角線には、1 つの配列に同じ文字を 2 回書きます。`"k,iik->"` では `x` の 1 つ目と 2 つ目の軸に同じ添字が入るので、対角線のマスだけが取り出されます。
逆対角線は、列を逆順にした配列 `x_flip` の対角線です。
`x[:, 2:3]` のように書くと軸が残ったまま列を取り出せるので、2 列目・1 列目・0 列目を取り出して、`axis=1` で列の向きにつなげます。
QUBO++ のスライスでは `x[:, ::-1]` のような逆順の刻みは使えないので、列を 1 本ずつ取り出してつなげます。

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(3, 3, 9))
v = qbpp.array([1, 2, 3, 4, 5, 6, 7, 8, 9])
diag = qbpp.einsum("k,iik->", v, x)
x_flip = qbpp.concat([x[:, 2:3], x[:, 1:2],
                      x[:, 0:1]], axis=1)
anti = qbpp.einsum("k,iik->", v, x_flip)
```

Σ で書くと、対角線は $\sum_i \sum_k v_k\, x_{i,i,k}$、逆対角線は $\sum_i \sum_k v_k\, x_{i,2-i,k}$ です。どちらも 15 にします。

### プログラム

{% include video_seek.html t="33:20" %}

6 種類の制約を、すべて einsum で書いて `qbpp.cons` で足します。目的関数はなく制約だけの式なので、すべて満たすとエネルギーは 0 です。
`target_energy=0` で魔方陣が見つかると探索が止まります。答えの `sol(x)` は 0 と 1 の配列なので、同じ einsum で `v` を掛けてマスの数に戻します。

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(3, 3, 9))
v = qbpp.array([1, 2, 3, 4, 5, 6, 7, 8, 9])
row = qbpp.einsum("k,ijk->i", v, x)
col = qbpp.einsum("k,ijk->j", v, x)
diag = qbpp.einsum("k,iik->", v, x)
x_flip = qbpp.concat([x[:, 2:3], x[:, 1:2], x[:, 0:1]], axis=1)
anti = qbpp.einsum("k,iik->", v, x_flip)
f = (qbpp.cons(qbpp.einsum("ijk->ij", x) == 1)
     + qbpp.cons(qbpp.einsum("ijk->k", x) == 1)
     + qbpp.cons(row == 15) + qbpp.cons(col == 15)
     + qbpp.cons(diag == 15) + qbpp.cons(anti == 15))
f.simplify_as_binary()
sol = qbpp.EasySolver(f).search(target_energy=0)
print(qbpp.einsum("k,ijk->ij", v, sol(x)))
```

動画での出力（EasySolver の結果は実行ごとに変わります）：

```
[[8, 1, 6], [3, 5, 7], [4, 9, 2]]
```

1〜9 を使った 3 × 3 の魔方陣は、回転と裏返しで移り合う 8 個です。どれが得られるかは、実行するたびに変わります。

詳しくは[魔方陣](MAGIC)をご覧ください。

## まとめ

{% include video_seek.html t="34:42" %}

- Python の生の for ループは、1 回ごとの処理に時間がかかります。3 重ループでは中の 1 行が $n^3$ 回実行されるので、大きな問題では式を作るのに時間がかかります。スライスと einsum は、ループを関数の呼び出しに置き換える道具です。
- スライスは配列の一部を取り出します。`v[a:b]` は `a` から `b - 1` まで（`b` は含まない）、`v[:-1]` は最後を除いた部分、`v[-1]` は最後の要素、`x[:, j]` は 2 次元の配列の列 `j` です。
- `qbpp.concat` は配列をつなげます。スライスした配列をつなげると、先頭の行が最後に回り込んだ、1 つずらした配列が作れます。
- `qbpp.einsum` では、文字が配列の軸を表します。同じ文字の軸は同じ添字で取り出して掛け、矢印の後ろにない文字について和を取り、後ろにある文字は結果に残ります。`"ij,j->i"` は行列とベクトルの積です。基本の書き方は NumPy の einsum と同じです。
- 巡回セールスマン問題の巡回路の長さは、`"ij,ki,kj->"` の 1 行で、ループを書かずに書けました。3 重ループで作った式とまったく同じ式で、速く作れます。
- 魔方陣では、残す文字を変えるだけで、マスごと（`"ijk->ij"`）・数ごと・行ごと（`"k,ijk->i"`）・列ごとの制約が書けました。1 つの配列に同じ文字を 2 回書く `"k,iik->"` は対角線のマスだけを取り出し、逆対角線は列を逆順につなげた `x_flip` の対角線で書きました。
