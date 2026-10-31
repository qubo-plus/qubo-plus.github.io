---
last_modified: 2026-10-26
layout: default
nav_exclude: true
title: "動画：数独"
description: "動画「QUBO++ ケーススタディ 数独（Python）」の章ごとの要点と、動画に出てくるプログラムと出力。"
lang: ja
hreflang_alt: "en/python/VIDEO_SUDOKU"
hreflang_lang: "en"
video: sudoku
---

# 動画：数独（Python）

動画「QUBO++ ケーススタディ 数独（Python）」の手引きです。
章ごとに、要点と動画に出てくるプログラム・出力、詳しい説明のページへのリンクをまとめています。
「▶ 動画の … から再生」をクリックすると、その場面から再生します。
動画では一部を省略して見せているプログラムも、ここではそのまま実行できる形で載せています。

{% include video_embed.html slug="sudoku" %}

この動画で扱うこと：

- 数独のルールと、グラフの彩色との関係
- マスと数字の組ごとのバイナリ変数 `x[i][j][k]` を 3 次元の配列で作る
- マス・行・列の制約を `qbpp.vector_sum` の `axis` を変えて 1 行ずつ、ブロックの制約をスライスで書き、`qbpp.cons()` で宣言する
- ヒントから値が決まる変数を辞書に登録し、`qbpp.replace` で固定する（729 個 → 174 個）
- `qbpp.Sol(f).set(sol, sub)` で元の式の解に戻し、ヒントが 22 個の盤面も同じプログラムで解く

[動画（ケーススタディ）](../VIDEO_CASE_STUDIES)の一覧に戻る

## 問題

{% include video_seek.html t="0:37" %}

数独は、9×9 のマスに 1〜9 の数字を入れるパズルです。最初から入っている数字をヒントといいます。
残りのマスを、次の 3 つの条件を満たすように埋めます。

- どの行にも、1〜9 がちょうど 1 回ずつ入る
- どの列にも、1〜9 がちょうど 1 回ずつ入る
- 太い線で区切った 3×3 のブロックにも、1〜9 がちょうど 1 回ずつ入る

動画の盤面はヒントが 28 個で、答えは 1 つだけです。

## 数独とグラフの彩色

{% include video_seek.html t="1:37" %}

グラフの彩色は、辺で結ばれた 2 つの頂点が違う色になるように頂点を塗る問題です。
数独では、81 個のマスを頂点にし、同じ行・同じ列・同じブロックにある 2 つのマスを辺で結びます。
1 つのマスからは 20 本（同じ行に 8 本、同じ列に 8 本、ブロックの残りの 4 マスに 4 本）の辺が出て、辺は全部で $81 \times 20 / 2 = 810$ 本です。
数字を色と考えると、辺の両端が違う数字というのがルールで、ヒントは最初から色が決まっている頂点です。

## 変数と制約

### 変数 x[i][j][k]

{% include video_seek.html t="2:40" %}

バイナリ変数 $x_{i,j,k}$ は、マス $(i, j)$ の数字が $k+1$ なら 1、そうでなければ 0 です。
$i$ は行、$j$ は列、$k$ は数字を表し、どれも 0〜8 なので、変数は $9 \times 9 \times 9 = 729$ 個です。
数字ごとに 9×9 の盤面を 1 枚ずつ用意すると考えると、答えの盤面では、どのマスも 9 枚のうち 1 枚だけが 1 です。
たとえば、0 行 2 列のマスの数字が 3 なら、$k = 2$ の盤面だけそのマスが 1 です。
QUBO++ では、`x = qbpp.var("x", shape=(9, 9, 9))` で 3 次元の変数の配列として作ります。

### 4 種類の制約

{% include video_seek.html t="3:51" %}

制約は 4 種類あり、どれも「足すと 1」という形です。

| 制約 | 意味 | 足す向き | 本数 |
|---|---|---|---|
| マス | どのマスにも数字がちょうど 1 つ | 数字 $k$ | 81 |
| 行 | どの行にも各数字がちょうど 1 回 | 列 $j$ | 81 |
| 列 | どの列にも各数字がちょうど 1 回 | 行 $i$ | 81 |
| ブロック | どのブロックにも各数字がちょうど 1 回 | 3×3 の 9 マス | 81 |

全部で $81 \times 4 = 324$ 本です。目的関数はなく、制約だけの問題なので、すべての制約を満たして $f$ が 0 になる割り当てが答えです。

## QUBO++ で書く

{% include video_seek.html t="5:09" %}

`qbpp.vector_sum` は、配列を 1 つの軸の向きに足す関数で、`axis` は足す軸の番号（0 が $i$、1 が $j$、2 が $k$）です。
`axis=2` ならマスごとの和、`axis=1` なら行の和、`axis=0` なら列の和で、どれも 9×9 の 81 個の和の配列になります。
配列と `== 1` の比較は要素ごとに 81 本の制約になり、`qbpp.cons()` で囲むとまとめて制約として登録されます。
ブロックだけは、スライス `x[i:i+3, j:j+3, k]` で 3×3 の部分を切り出して足します。`i:i+3` は、$i$ から 3 つ分の番号という意味です。

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(9, 9, 9))
f = qbpp.cons(qbpp.vector_sum(x, axis=2) == 1)      # マス
f += qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)     # 行
f += qbpp.cons(qbpp.vector_sum(x, axis=0) == 1)     # 列
for i in range(0, 9, 3):
    for j in range(0, 9, 3):
        for k in range(9):
            f += qbpp.cons(qbpp.sum(x[i:i+3, j:j+3, k]) == 1)   # ブロック
```

詳しくは[総和関数](SUM)、[スライスと連結](SLICE_CONCAT)、[非線形関数とネイティブ制約](CONSTRAINTS)をご覧ください。

## ヒントで変数を固定

### 辞書 sub に登録する

{% include video_seek.html t="6:33" %}

ヒントを使って、変数の値を先に決めておきます。値が決まった変数は、ソルバーで探す必要がありません。
たとえば 0 行 2 列のヒント 3 は $k = 2$ の盤面なので、`x[0][2][2]` が 1、このマスのほかの 8 つの数字の変数は 0 です。
数字 3 の盤面で、同じ行の 8 マス、同じ列の 8 マス、同じブロックの残りの 4 マスも 0 になり、1 つのヒントで 29 個の変数の値が決まります。
これらを、変数をキー、0 か 1 を値とする辞書 `sub` に登録します。28 個のヒントすべてについて同じように登録します。

### プログラム

{% include video_seek.html t="7:30" %}

盤面は、空きマスを点にしたテキストファイル [main.txt](../../images/sudoku/main.txt) から読み込みます。
点は 0、数字は整数にして、9 行 9 列のリスト `puzzle` にします。

```
..3295...
4...67..9
......8..
57...4..6
.4.....2.
3..6...74
..8......
9..75...1
...9136..
```

ヒントのマスでは、`v` がマスの数字、`k` が `v - 1` です。
マスの 9 個の変数は代入で、同じ行・列・ブロックの変数は `setdefault` で登録します。
`setdefault` は、キーがまだ辞書にないときだけ登録します。たとえば同じ行のループで `t` が 2 のときのキー `x[0][2][2]` は、ヒントのマスで 1 を登録したキーと同じなので、代入で 0 を書くと 1 が上書きされてしまいます。
全部登録してから `qbpp.replace` を 1 回だけ呼ぶと、`f` の中の `sub` の変数が定数に置き換わり、変数は 729 個から 174 個に減ります。
main.txt を、実行するディレクトリに置いて実行します。

```python
import pyqbpp as qbpp

puzzle = [[int(c) if c != "." else 0 for c in line.strip()] for line in open("main.txt")]

x = qbpp.var("x", shape=(9, 9, 9))
f = qbpp.cons(qbpp.vector_sum(x, axis=2) == 1)      # マス
f += qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)     # 行
f += qbpp.cons(qbpp.vector_sum(x, axis=0) == 1)     # 列
for i in range(0, 9, 3):
    for j in range(0, 9, 3):
        for k in range(9):
            f += qbpp.cons(qbpp.sum(x[i:i+3, j:j+3, k]) == 1)   # ブロック

sub = {}
for i in range(9):
    for j in range(9):
        v = puzzle[i][j]
        if v > 0:
            k = v - 1
            for t in range(9):
                sub[x[i][j][t]] = 1 if t == k else 0     # マス (i, j) は v
            for t in range(9):
                sub.setdefault(x[i][t][k], 0)            # 同じ行
                sub.setdefault(x[t][j][k], 0)            # 同じ列
            for a in range(i // 3 * 3, i // 3 * 3 + 3):
                for b in range(j // 3 * 3, j // 3 * 3 + 3):
                    sub.setdefault(x[a][b][k], 0)        # 同じブロック
g = qbpp.replace(f, sub)
g.simplify_as_binary()

solver = qbpp.EasySolver(g)
print("variables =", solver.var_count)
sol = solver.search(target_energy=0)
full = qbpp.Sol(f).set(sol, sub)
print("f =", full(f), " violated =", f.cons(full))
for row in qbpp.onehot_to_int(full(x), axis=2):
    print(*(v + 1 for v in row))
```

詳しくは[置換関数](REPLACE)をご覧ください。

## 実行例

### 元の式の解に戻す

{% include video_seek.html t="8:51" %}

EasySolver で `target_energy=0` にして `g` を解きます。制約をすべて満たせば 0 なので、0 の解が見つかったところで止まります。
ソルバーの解 `sol` には残った 174 個の変数の値しか入っておらず、固定した変数の値は辞書 `sub` のほうにあります。
`qbpp.Sol(f)` は `f` の 729 個の変数がすべて 0 の解で、`set(sol, sub)` で両方の値が入った解 `full` になります。
`full(x)` は 9×9×9 の配列で、`qbpp.onehot_to_int(..., axis=2)` が数字の向きで 1 の位置（0〜8）を取り出すので、1 を足すとマスの数字になります。

詳しくは[クイックリファレンス: 解](QR_SOLUTION)、[ワンホットから整数への変換](ONEHOT)をご覧ください。

### 出力

{% include video_seek.html t="10:07" %}

出力：

```
variables = 174
f = 0  violated = 0
6 8 3 2 9 5 4 1 7
4 2 1 8 6 7 3 5 9
7 9 5 3 4 1 8 6 2
5 7 2 1 3 4 9 8 6
8 4 6 5 7 9 1 2 3
3 1 9 6 8 2 5 7 4
1 3 8 4 2 6 7 9 5
9 6 4 7 5 8 2 3 1
2 5 7 9 1 3 6 4 8
```

1 行目は、`qbpp.replace` のあとに残った変数の数です。
$f$ は 0 で、破った制約もありません。目的関数がなく制約だけなので、$f$ が 0 ならルールをすべて満たしています。
この盤面は答えが 1 つなので、何度実行しても同じ盤面になります。

### ヒントが 22 個の盤面

{% include video_seek.html t="10:52" %}

ヒントが 22 個しかない盤面 [hard.txt](../../images/sudoku/hard.txt) も、読み込むファイルの名前だけを変えた同じプログラムで解きます。

```
..92....4
...5..8..
.....13..
.1.7..5..
...6....9
.5.4.2...
..2.....3
......75.
...1.9.2.
```

ヒントが少ないので、値を固定できる変数も少なく、残る変数は 250 個です。
hard.txt を、実行するディレクトリに置いて実行します。

```python
import pyqbpp as qbpp

puzzle = [[int(c) if c != "." else 0 for c in line.strip()] for line in open("hard.txt")]

x = qbpp.var("x", shape=(9, 9, 9))
f = qbpp.cons(qbpp.vector_sum(x, axis=2) == 1)      # マス
f += qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)     # 行
f += qbpp.cons(qbpp.vector_sum(x, axis=0) == 1)     # 列
for i in range(0, 9, 3):
    for j in range(0, 9, 3):
        for k in range(9):
            f += qbpp.cons(qbpp.sum(x[i:i+3, j:j+3, k]) == 1)   # ブロック

sub = {}
for i in range(9):
    for j in range(9):
        v = puzzle[i][j]
        if v > 0:
            k = v - 1
            for t in range(9):
                sub[x[i][j][t]] = 1 if t == k else 0     # マス (i, j) は v
            for t in range(9):
                sub.setdefault(x[i][t][k], 0)            # 同じ行
                sub.setdefault(x[t][j][k], 0)            # 同じ列
            for a in range(i // 3 * 3, i // 3 * 3 + 3):
                for b in range(j // 3 * 3, j // 3 * 3 + 3):
                    sub.setdefault(x[a][b][k], 0)        # 同じブロック
g = qbpp.replace(f, sub)
g.simplify_as_binary()

solver = qbpp.EasySolver(g)
print("variables =", solver.var_count)
sol = solver.search(target_energy=0)
full = qbpp.Sol(f).set(sol, sub)
print("f =", full(f), " violated =", f.cons(full))
for row in qbpp.onehot_to_int(full(x), axis=2):
    print(*(v + 1 for v in row))
```

出力：

```
variables = 250
f = 0  violated = 0
5 3 9 2 8 7 6 1 4
7 4 1 5 6 3 8 9 2
6 2 8 9 4 1 3 7 5
2 1 3 7 9 8 5 4 6
4 8 7 6 1 5 2 3 9
9 5 6 4 3 2 1 8 7
1 7 2 8 5 4 9 6 3
8 9 4 3 2 6 7 5 1
3 6 5 1 7 9 4 2 8
```

$f$ は 0 で、破った制約もありません。この盤面も、答えは 1 つだけです。

詳しくは[数独](SUDOKU)をご覧ください。

## まとめ

{% include video_seek.html t="11:36" %}

- マスと数字の組ごとにバイナリ変数を用意し、3 次元の配列にしました。
- マス・行・列の制約は、`qbpp.vector_sum` の `axis` を変えるだけで書けます。
- ブロックはスライスで切り出し、どの制約も `qbpp.cons()` で書きました。
- ヒントで値が決まる変数は辞書 `sub` に登録し、`qbpp.replace` で固定して、変数を 729 個から 174 個に減らしました。
- 解は `qbpp.Sol(f).set(sol, sub)` で元の式の解に戻し、`qbpp.onehot_to_int` で数字にしました。
- 目的関数はなく、制約をすべて満たす、$f$ が 0 の解が答えです。
