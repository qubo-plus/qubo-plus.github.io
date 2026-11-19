---
last_modified: 2026-10-26
layout: default
nav_exclude: true
title: "動画：配列"
description: "動画「QUBO++ 配列（Python）」の章ごとの要点と、動画に出てくるプログラムと出力。"
lang: ja
hreflang_alt: "en/python/VIDEO_ARRAYS"
hreflang_lang: "en"
video: arrays
---

# 動画：配列（Python）

動画「QUBO++ 配列（Python）」の手引きです。
章ごとに、要点と動画に出てくるプログラム・出力、詳しい説明のページへのリンクをまとめています。
「▶ 動画の … から再生」をクリックすると、その場面から再生します。
動画では一部を省略して見せているプログラムも、ここではそのまま実行できる形で載せています。

{% include video_embed.html slug="arrays" %}

この動画で扱うこと：

- `qbpp.array` で作る整数の配列と、要素ごとの演算（`c * x` など）、配列の形
- 合計の関数 `qbpp.sum` と `qbpp.vector_sum`、`axis` の意味（3 次元の配列も）
- 配列の比較と `qbpp.cons` で、行ごとや列ごとの制約をまとめて書く方法
- 割当問題・輸送問題・勤務表を、ループを書かずに解く
- ループで書いた場合と、式を作る速さを比べる

[動画（チュートリアル）](../VIDEOS)の一覧に戻る

## 配列のおさらい

{% include video_seek.html t="2:57" %}

`qbpp.var` に `shape` を指定すると、変数の配列ができます。
`x[i]` で番号 i の行、`x[:, j]` で番号 j の列が、配列として取り出せます。

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(3, 4))
print(x.shape)
print(x[1])
print(x[:, 2])
```

出力：

```
(3, 4)
[x[1][0], x[1][1], x[1][2], x[1][3]]
[x[0][2], x[1][2], x[2][2]]
```

詳しくは[多次元変数](MULTIDIM)をご覧ください。

## 要素ごとの演算

### qbpp.array で整数の配列を作る

{% include video_seek.html t="4:35" %}

係数や定数項のような整数の表は、`qbpp.array` で整数の配列にします。
入れ子のリストを渡すと 2 次元の配列になり、内側のリストの 1 つ 1 つが 1 つの行になります。

```python
import pyqbpp as qbpp

c = qbpp.array([[9, 2, 7, 8],
                [6, 4, 3, 7],
                [5, 8, 1, 8]])
print(c)
print(c.shape)
print(c[1][2])
```

出力：

```
[[9, 2, 7, 8], [6, 4, 3, 7], [5, 8, 1, 8]]
(3, 4)
3
```

### 同じ位置の要素どうしで計算する

{% include video_seek.html t="5:59" %}

`c * x` は、同じ位置の係数と変数を掛けた、式の配列です。
`2 * x + 1` のような数との演算と、否定 `~x` は、すべての要素に同じように働きます。

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(2, 3))
c = qbpp.array([[1, 2, 3], [4, 5, 6]])
print(c * x)
print(2 * x + 1)
print(~x)
```

出力：

```
[[x[0][0], 2*x[0][1], 3*x[0][2]], [4*x[1][0], 5*x[1][1], 6*x[1][2]]]
[[1 +2*x[0][0], 1 +2*x[0][1], 1 +2*x[0][2]], [1 +2*x[1][0], 1 +2*x[1][1], 1 +2*x[1][2]]]
[[~x[0][0], ~x[0][1], ~x[0][2]], [~x[1][0], ~x[1][1], ~x[1][2]]]
```

詳しくは[配列演算](OPVECTOR)をご覧ください。

### 配列どうしの演算は、形が同じとき

{% include video_seek.html t="7:45" %}

配列どうしの演算は同じ位置の要素どうしで計算するので、2 つの配列の形がそろっている必要があります。
2 行 2 列の `c` と 2 行 3 列の `x` を掛けると、ValueError になります。
数との演算は、どんな形の配列にも使えます。

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(2, 3))
c = qbpp.array([[1, 2],
                [3, 4]])
print(c * x)
```

出力（エラーはメッセージの行だけを載せています）：

```
ValueError: Array *: shape mismatch (2, 2) vs (2, 3)
```

### 定数は qbpp.array で QUBO++ の配列にしておく

{% include video_seek.html t="9:09" %}

`qbpp.array` で作った配列は、一度だけ変換され、何度式に使っても速く、`2 * c` や `c + 1` のように配列のまま計算できます。
リストのままでも式には使えますが、Python ではリストに数を掛けるとリストの繰り返しになります。
次のプログラムでは、`2 * c` が 4 行 3 列になり、`2 * c * x` は形が合わず ValueError になります。

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(2, 3))
c = [[1, 2, 3], [4, 5, 6]]
print(2 * c)
print(2 * c * x)
```

出力（エラーはメッセージの行だけを載せています）：

```
[[1, 2, 3], [4, 5, 6], [1, 2, 3], [4, 5, 6]]
ValueError: Array *: shape mismatch (4, 3) vs (2, 3)
```

`c = qbpp.array([[1, 2, 3], [4, 5, 6]])` なら、`2 * c` は各要素が 2 倍になり、`x` と掛けられます。
一方、`qbpp.array` では、`append` などのリストの操作は使えません。
`c == 9` は制約の意味になり、真偽値にはなりません。要素の書き換えは `c[i][j] = v` の形で書きます。

詳しくは[多次元変数](MULTIDIM)の「array と Python の `list`」をご覧ください。

## 合計の関数

### qbpp.sum と qbpp.vector_sum

{% include video_seek.html t="11:39" %}

`qbpp.sum` は、配列のすべての要素を足した 1 つの式を返します。
`qbpp.vector_sum` は、軸に沿って足した式の配列を返します。`axis=1` は行ごとの合計（3 個）、`axis=0` は列ごとの合計（4 個）です。

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(3, 4))
print(qbpp.sum(x))
print(qbpp.vector_sum(x, axis=1))
print(qbpp.vector_sum(x, axis=0))
```

出力：

```
x[0][0] +x[0][1] +x[0][2] +x[0][3] +x[1][0] +x[1][1] +x[1][2] +x[1][3] +x[2][0] +x[2][1] +x[2][2] +x[2][3]
[x[0][0] +x[0][1] +x[0][2] +x[0][3], x[1][0] +x[1][1] +x[1][2] +x[1][3], x[2][0] +x[2][1] +x[2][2] +x[2][3]]
[x[0][0] +x[1][0] +x[2][0], x[0][1] +x[1][1] +x[2][1], x[0][2] +x[1][2] +x[2][2], x[0][3] +x[1][3] +x[2][3]]
```

### axis は、動かして足す番号

{% include video_seek.html t="13:09" %}

2 次元の配列の要素 `x[i][j]` では、1 つ目の番号 i が軸 0、2 つ目の番号 j が軸 1 です。

- `axis=1`：j を動かして足すので、行ごとの合計です。結果は i で区別される 3 個の式です。
- `axis=0`：i を動かして足すので、列ごとの合計です。結果は j で区別される 4 個の式です。
- `axis` を省略すると、最後の軸に沿って足します（2 次元なら `axis=1`）。

### 3 次元の配列と axis

{% include video_seek.html t="14:26" %}

3 次元の配列でも、`axis` は動かして足す番号です。指定した軸が消えて、1 次元少ない配列になります。
`axis` を省略すると、最後の軸（`axis=2`）に沿って足します。

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(2, 3, 4))
print("x:", x.shape)
for k in range(3):
    print(f"axis={k}:", qbpp.vector_sum(x, axis=k).shape)
print(qbpp.vector_sum(x, axis=2)[1][2])
```

出力：

```
x: (2, 3, 4)
axis=0: (3, 4)
axis=1: (2, 4)
axis=2: (2, 3)
x[1][2][0] +x[1][2][1] +x[1][2][2] +x[1][2][3]
```

### 組み込みの sum ではなく qbpp.sum

{% include video_seek.html t="16:45" %}

3 万個の項を、組み込みの `sum` と `qbpp.sum` で足して、式を作る時間を比べます。2 つの式は同じです。

```python
import time
import pyqbpp as qbpp

x = qbpp.var("x", shape=30000)
terms = [(i % 7 + 1) * x[i] for i in range(30000)]

t = time.perf_counter()
f = sum(terms)         # 組み込みの sum
print(f"sum:      {time.perf_counter() - t:.2f} s")

t = time.perf_counter()
g = qbpp.sum(terms)
print(f"qbpp.sum: {time.perf_counter() - t:.2f} s")
```

動画の実行では、組み込みの `sum` が約 3.4 秒、`qbpp.sum` が約 0.02 秒で、`qbpp.sum` のほうが 100 倍以上速くなりました。
組み込みの `sum` は 1 項足すたびに式全体を作り直すので、実行環境によっては項数の 2 乗に比例する時間がかかります。
`qbpp.sum` はすべての項を一度にまとめて足します。リストやジェネレータ式も、そのまま渡せます。

詳しくは[総和関数](SUM)をご覧ください。

## 配列で書く制約

### 配列の比較は、要素ごとの制約の配列

{% include video_seek.html t="18:37" %}

配列を数と比べると、要素ごとの制約の配列になります。
`qbpp.cons` で囲むと、すべての要素がまとめて制約として宣言されます。

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(3, 4))
f = qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
print(f)
g = qbpp.cons(qbpp.vector_sum(x, axis=0) <= 1)
print(g)
```

出力：

```
cons(x[0][0] +x[0][1] +x[0][2] +x[0][3] == 1)
+cons(x[1][0] +x[1][1] +x[1][2] +x[1][3] == 1)
+cons(x[2][0] +x[2][1] +x[2][2] +x[2][3] == 1)
cons(x[0][0] +x[1][0] +x[2][0] <= 1)
+cons(x[0][1] +x[1][1] +x[2][1] <= 1)
+cons(x[0][2] +x[1][2] +x[2][2] <= 1)
+cons(x[0][3] +x[1][3] +x[2][3] <= 1)
```

### 前の動画の書き方が、配列でもそのまま使える

{% include video_seek.html t="20:05" %}

`v = qbpp.vector_sum(x, axis=1)`（行ごとの合計 3 個）について、次のように書けます。

| 書き方 | 意味 |
|---|---|
| `qbpp.cons(v == 1)` | すべての要素が 1 |
| `qbpp.cons(v, equal=1)` | 上と同じ |
| `qbpp.cons(v == [30, 25, 45])` | 要素ごとに違う値（リストか整数の配列） |
| `qbpp.cons(v <= 1)`　`qbpp.cons(v >= 1)` | 上限・下限 |
| `qbpp.cons(v, between=(1, 2))` | 範囲 |
| `100 * qbpp.cons(…)` | 重みは、すべての制約に掛かる |
| `qbpp.sum(qbpp.constrain(v, equal=1))` | ペナルティ式で書く場合 |

`qbpp.constrain` は要素ごとのペナルティ式の配列を返すので、`qbpp.sum` で 1 つの式にまとめます。

詳しくは[非線形関数とネイティブ制約](CONSTRAINTS)をご覧ください。

## 例題：割当問題

### 問題

{% include video_seek.html t="21:46" %}

4 人に 4 つの仕事を、1 人に 1 つずつ割り当て、コストの合計を最小にします。
表は人 i が仕事 j をするときのコスト `c` です（行が人、列が仕事）。

| | 仕事 0 | 仕事 1 | 仕事 2 | 仕事 3 |
|---|---:|---:|---:|---:|
| 人 0 | 9 | 2 | 7 | 8 |
| 人 1 | 6 | 4 | 3 | 7 |
| 人 2 | 5 | 8 | 1 | 8 |
| 人 3 | 7 | 6 | 9 | 4 |

割り当ては 0/1 の変数の 4 × 4 の配列 `x` で表し、`x[i][j]` は人 i が仕事 j をするときだけ 1 にします。
制約は、行ごとの合計と列ごとの合計が、どれも 1 であることです。
たとえば対角のマスを選ぶと、コストの合計は 9 + 4 + 1 + 4 = 18 です。

### プログラム

{% include video_seek.html t="23:16" %}

目的関数は `qbpp.sum(c * x)`、制約は `vector_sum` の行ごと・列ごとの合計を 1 と比べた 8 本で、ループを使わずに書けます。
ExhaustiveSolver で 16 個の変数のすべての組合せを調べます。

```python
import pyqbpp as qbpp

c = qbpp.array([[9, 2, 7, 8], [6, 4, 3, 7],
                [5, 8, 1, 8], [7, 6, 9, 4]])
x = qbpp.var("x", shape=(4, 4))
cost = qbpp.sum(c * x)
f = (cost
     + 100 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
     + 100 * qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
f.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(f).search()
print("cost =", sol(cost), " violated =", f.cons(sol))
print(sol(x))
print(qbpp.onehot_to_int(sol(x), axis=1))
```

出力：

```
cost = 13  violated = 0
[[0, 1, 0, 0], [1, 0, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
[1, 0, 2, 3]
```

コストの合計は 13 で、違反している制約は 0 本です。

### sol(x) と onehot_to_int で答えを読む

{% include video_seek.html t="24:57" %}

- `sol(x)` は、変数の値を `x` と同じ形の配列で返します（出力の 2 行目）。
- `qbpp.onehot_to_int(sol(x), axis=1)` は、各行で 1 になっている位置を返します（出力の 3 行目）。
  人 0 は仕事 1、人 1 は仕事 0、人 2 は仕事 2、人 3 は仕事 3 をし、コストは 2 + 6 + 1 + 4 = 13 です。
- 1 がちょうど 1 つでない行（1 が 2 つある行や、1 つもない行）には、-1 が入ります。

詳しくは[置換行列](PERMUTATION)と[ワンホットから整数への変換](ONEHOT)をご覧ください。

## ループと配列関数の速さ

### 同じ式を 2 通りに作る

{% include video_seek.html t="26:24" %}

n 人 × n 個の仕事の割当問題の式を、ループで 1 項ずつ足すプログラムと、配列の関数でまとめて作るプログラムで作り、時間を比べます。
2 つのプログラムは、まったく同じ式を作ります。

```python
import random
import time
import pyqbpp as qbpp

for n in [100, 300, 1000]:
    random.seed(1)
    c = [[random.randint(1, 99) for j in range(n)] for i in range(n)]
    x = qbpp.var("x", shape=(n, n))

    # ループで 1 項ずつ足す
    t = time.perf_counter()
    f = 0
    for i in range(n):
        for j in range(n):
            f += c[i][j] * x[i][j]
    for i in range(n):
        s = 0
        for j in range(n):
            s += x[i][j]
        f += 100 * qbpp.cons(s == 1)
    for j in range(n):       # 列も同じように足す
        s = 0
        for i in range(n):
            s += x[i][j]
        f += 100 * qbpp.cons(s == 1)
    t_loop = time.perf_counter() - t

    # 配列の関数でまとめて作る
    t = time.perf_counter()
    g = (qbpp.sum(qbpp.array(c) * x)
         + 100 * qbpp.cons(
             qbpp.vector_sum(x, axis=1) == 1)
         + 100 * qbpp.cons(
             qbpp.vector_sum(x, axis=0) == 1))
    t_array = time.perf_counter() - t

    print(f"n = {n:4d}: loops {t_loop:.3f} s, arrays {t_array:.3f} s, "
          f"ratio {t_loop / t_array:.1f}")
```

### 結果

{% include video_seek.html t="27:35" %}

動画での出力（時間は実行ごと・実行環境ごとに変わります）：

```
n =  100: loops 0.024 s, arrays 0.004 s, ratio 5.9
n =  300: loops 0.097 s, arrays 0.019 s, ratio 5.0
n = 1000: loops 1.063 s, arrays 0.222 s, ratio 4.8
```

どの大きさでも、配列の関数のほうが約 5 倍速くなりました（n = 1000 では変数が 100 万個です）。
配列の関数は QUBO++ の中でまとめて計算し、Python のループは 1 回まわるごとに演算を 1 つずつ呼び出すからです。

詳しくは[高速化のためのTips](TIPS)をご覧ください。

## 例題：輸送問題

### 問題

{% include video_seek.html t="28:51" %}

3 つの工場から 4 つの店へ品物を運び、運ぶ費用の合計を最小にします。
表の数は 1 個運ぶ費用、右の列は工場が送り出す量、下の行は店が受け取る量です（どちらも合計 100 個）。

| | 店 0 | 店 1 | 店 2 | 店 3 | 送り出す量 |
|---|---:|---:|---:|---:|---:|
| 工場 0 | 8 | 6 | 10 | 9 | 30 |
| 工場 1 | 9 | 12 | 13 | 7 | 25 |
| 工場 2 | 14 | 9 | 16 | 5 | 45 |
| 受け取る量 | 20 | 30 | 25 | 25 | |

`x[i][j]` は工場 i から店 j へ運ぶ個数（整数）です。
行の合計は送り出す量と、列の合計は受け取る量と等しくなります。
そのため、1 本の道で運ぶ個数は、送り出す量と受け取る量の小さいほうを超えません（工場 0 から店 0 へは 20 個まで）。

### プログラム

{% include video_seek.html t="30:54" %}

割当問題のプログラムとの違いは 2 か所です。
変数を `integer=(0, upper)` の整数変数にし（要素ごとに上限が違う）、制約の右辺を `supply` と `demand` にします。
整数変数では組合せがとても多いので、EasySolver で 1 秒探します。

```python
import pyqbpp as qbpp

supply = qbpp.array([30, 25, 45])
demand = qbpp.array([20, 30, 25, 25])
c = qbpp.array([[8, 6, 10, 9], [9, 12, 13, 7], [14, 9, 16, 5]])
upper = [[min(s, d) for d in demand] for s in supply]
x = qbpp.var("x", shape=(3, 4), integer=(0, upper))
cost = qbpp.sum(c * x)
f = (cost
     + 100 * qbpp.cons(qbpp.vector_sum(x, axis=1) == supply)
     + 100 * qbpp.cons(qbpp.vector_sum(x, axis=0) == demand))
f.simplify_as_binary()
sol = qbpp.EasySolver(f).search(time_limit=1)
print("upper =", upper)
print("cost =", sol(cost), " violated =", f.cons(sol))
print(sol(x))
```

動画での出力（EasySolver の結果は実行ごとに変わることがあります）：

```
upper = [[20, 30, 25, 25], [20, 25, 25, 25], [20, 30, 25, 25]]
cost = 810  violated = 0
[[0, 10, 20, 0], [20, 0, 5, 0], [0, 20, 0, 25]]
```

上限を、送り出す量のいちばん大きい 45 にそろえて `integer=(0, 45)` としても、答えは同じです。

詳しくは[整数変数](INTEGER)の「要素ごとに範囲が異なる配列」をご覧ください。

### 費用 810 の運び方

{% include video_seek.html t="33:42" %}

品物が流れるのは 6 本の道だけです。
どの工場も送り出す量と、どの店も受け取る量と、ちょうど等しくなっています。

| | 店 0 | 店 1 | 店 2 | 店 3 | 合計 |
|---|---:|---:|---:|---:|---:|
| 工場 0 | 0 | 10 | 20 | 0 | 30 |
| 工場 1 | 20 | 0 | 5 | 0 | 25 |
| 工場 2 | 0 | 20 | 0 | 25 | 45 |
| 合計 | 20 | 30 | 25 | 25 | |

費用は 6 × 10 + 10 × 20 + 9 × 20 + 13 × 5 + 9 × 20 + 5 × 25 = 810 です。
線形計画法という別の方法で確かめると、810 は最適な値でした。

## 例題：勤務表（3 次元の配列）

### 問題

{% include video_seek.html t="35:08" %}

3 日間の、4 人の勤務を決めます。勤務の種類は、日勤・夜勤・休みの 3 つです。

- どの人も、毎日、3 つの種類のどれか 1 つになります。
- 毎日必要な人数は、日勤が 2 人、夜勤が 1 人、休みが 1 人です。
- 1 人の 3 日間の回数は、日勤が 2 回まで、夜勤と休みがそれぞれ 1 回までです。

`x[i][j][k]` が 1 なら、i 日目に人 j が種類 k の勤務をします。`shape=(3, 4, 3)` で、変数は 36 個です。
軸 0 が日、軸 1 が人、軸 2 が勤務の種類です。

### 3 つの軸の合計で制約を書く

{% include video_seek.html t="36:57" %}

- `axis=2` の合計（種類を動かす）が 1：1 人が 1 日に 1 つの勤務（12 本）
- `axis=1` の合計（人を動かす）が `need`：毎日の各勤務の人数（9 本）
- `axis=0` の合計（日を動かす）が `limit` 以下：1 人の 3 日間の回数の上限（12 本）

```python
import pyqbpp as qbpp

# 種類 k：0 日勤・1 夜勤・2 休み
x = qbpp.var("x", shape=(3, 4, 3))
need = qbpp.array([[2, 1, 1], [2, 1, 1], [2, 1, 1]])
limit = qbpp.array([[2, 1, 1], [2, 1, 1],
                    [2, 1, 1], [2, 1, 1]])
f = (qbpp.cons(qbpp.vector_sum(x, axis=2) == 1)
     + qbpp.cons(qbpp.vector_sum(x, axis=1) == need)
     + qbpp.cons(qbpp.vector_sum(x, axis=0) <= limit))
f.simplify_as_binary()
sol = qbpp.EasySolver(f).search(time_limit=1)
print("violated =", f.cons(sol))
print(qbpp.onehot_to_int(sol(x), axis=2))
```

動画での出力（条件を満たす勤務表は多数あり、EasySolver の結果は実行ごとに変わります）：

```
violated = 0
[[0, 0, 2, 1], [1, 2, 0, 0], [2, 0, 1, 0]]
```

`onehot_to_int` の結果は、行が日、列が人の勤務表です。
0 日目は、人 0 と人 1 が日勤、人 2 が休み、人 3 が夜勤です。

詳しくは[多次元変数](MULTIDIM)をご覧ください。

## まとめ

{% include video_seek.html t="39:49" %}

- 変数の配列は、`qbpp.var` に `shape` を指定して作ります。係数や定数の配列は、`qbpp.array` で QUBO++ の配列にしておきます。同じ表を何度も使うときは、一度変換しておくと速くなります。
- 配列どうしの演算は、同じ位置の要素どうしで計算するので、形をそろえます。数との演算は、すべての要素に同じように働きます。
- `qbpp.sum` はすべての要素を足した 1 つの式を、`qbpp.vector_sum` は軸に沿った合計を返します。`axis` はどの添字を動かして足すかを表し、3 次元の配列でも同じです。
- 合計には、Python の組み込みの `sum` ではなく `qbpp.sum` を使います。組み込みの `sum` は、実行環境によってはとても遅くなります。
- 配列を数や配列と比べると、要素ごとの制約の配列になります。`qbpp.cons` で囲むと、すべての要素の制約をまとめて宣言できます。
- `sol` に配列を渡すと、変数の値が同じ形の配列で返ります。`qbpp.onehot_to_int` は、軸に沿って 1 になっている位置を求めます。
- 配列の関数を使うと、プログラムが短く読みやすくなり、この動画の例では式を作る速さもループの約 5 倍になりました。
