---
last_modified: 2026-10-26
layout: default
nav_exclude: true
title: "動画：画像のハーフトーン化"
description: "動画「QUBO++ ケーススタディ 画像のハーフトーン化（Python）」の章ごとの要点と、動画に出てくるプログラムと結果。"
lang: ja
hreflang_alt: "en/python/VIDEO_HALFTONING"
hreflang_lang: "en"
video: halftoning
---

# 動画：画像のハーフトーン化（Python）

動画「QUBO++ ケーススタディ 画像のハーフトーン化（Python）」の手引きです。
章ごとに、要点と動画に出てくるプログラム・結果、詳しい説明のページへのリンクをまとめています。
「▶ 動画の … から再生」をクリックすると、その場面から再生します。
動画では一部を省略して見せているプログラムも、ここではそのまま実行できる形で載せています。

{% include video_embed.html slug="halftoning" %}

この動画で扱うこと：

- グレースケール画像を白と黒の点だけで表すハーフトーン化と、ガウスフィルタで表す「目で見た誤差」
- よく使われる 2 値化の方法 DBS（Direct Binary Search）
- 誤差の 2 乗の和を、補助変数も制約もない疎な QUBO として書くこと
- 256×256 の猫の写真を、DBS、ABS3 だけ、DBS の画像を hint にした ABS3 の 3 つで解いて、エネルギーと画像で比べる

[動画（ケーススタディ）](../VIDEO_CASE_STUDIES)の一覧に戻る

## ハーフトーンとは

{% include video_seek.html t="0:37" %}

ハーフトーン化は、グレースケールの画像を白と黒の点だけにする処理で、新聞の写真やモノクロの印刷など、白か黒しか出せない媒体で使われます。
画素の値は 0（黒）〜255（白）の明るさです。明るいところには白い点を多く、暗いところには少なく置きます。
細かい白黒の模様は、離れて見ると目の中で平均され、中間の明るさに見えます（8×8 のマスの 64 個のうち 32 個が白なら、中間の明るさ）。

## 目で見た誤差

{% include video_seek.html t="1:23" %}

目のぼけを、7×7 の整数のガウスフィルタ $G$ で表します。中心が 31 で外側ほど小さく、49 個の重みの和はちょうど 255 です。

$$
G = \begin{pmatrix}
0 & 0 & 1 & 1 & 1 & 0 & 0\\
0 & 1 & 5 & 7 & 5 & 1 & 0\\
1 & 5 & 14 & 21 & 14 & 5 & 1\\
1 & 7 & 21 & 31 & 21 & 7 & 1\\
1 & 5 & 14 & 21 & 14 & 5 & 1\\
0 & 1 & 5 & 7 & 5 & 1 & 0\\
0 & 0 & 1 & 1 & 1 & 0 & 0
\end{pmatrix}
$$

- 2 値画像をこのフィルタでぼかしたものを、網膜に映る像と考えます。画素 $(i, j)$ のぼけの値は、そこを中心とする 7×7 の窓の画素に重みを掛けて足したものです（白は 1、黒は 0）。
- 網膜に映る像と元の画像の差が、画素ごとの誤差です。
- 誤差の 2 乗の和が小さいほど、離れて見たときに元の画像に近く見えます。

## DBS

{% include video_seek.html t="2:38" %}

DBS（Direct Binary Search）は、網膜に映る像と元の画像の誤差の 2 乗の和を小さくする、視覚のモデルに基づく 2 値化の方法です。

1. ランダムなしきい値で白黒を決めた画像から始めます。
2. 左上から 1 画素ずつラスタ順に進み、各画素で白黒の反転と、色の違う隣の 8 画素との入れ替え（点を 1 画素ずらす）を試します。誤差の 2 乗の和が一番下がるものを、下がるときだけ実行します。
3. 画像全体の走査を、どこでも下がらなくなるまで繰り返します。

動画の猫の写真では、13 回の走査、約 0.8 秒で止まり、誤差の 2 乗の和は約 5000 万から約 420 万まで下がりました。
反転だけだと点をずらせず、700 万あまりで止まります。点をずらすには反転が 2 回要り、1 回目の反転で誤差が増えるからです。

詳しくは[ハーフトーン化](HALFTONING)をご覧ください。

## QUBO として表す

{% include video_seek.html t="3:56" %}

出力の各画素に、白なら 1、黒なら 0 のバイナリ変数 $x_{ij}$ を割り当てます。
ぼかした 2 値画像と目標 $T_{ij}$ の差の 2 乗を、全部の画素で足したものが $E(x)$ です。

$$
E(x) = \sum_{i,j} \bigl( (G * x)_{ij} - T_{ij} \bigr)^2,
\qquad (G * x)_{ij} = \sum_{k=0}^{6} \sum_{l=0}^{6} G_{kl}\, x_{i+k-3,\, j+l-3}
$$

- ぼけの値は変数の 1 次式なので、$E(x)$ は 2 次式、つまり補助変数も制約も使わない、そのままの QUBO です。QUBO のエネルギーが、そのまま誤差の 2 乗の和になります。
- DBS は下がる変更だけをするので、この QUBO の局所探索とみなせます。そこで、QUBO ソルバーでも同じ問題を解けます。
- 画像の端では窓がはみ出し、届く重みの和 $m_{ij}$ が 255 より小さくなるので、目標も $T_{ij} = \mathrm{round}(I_{ij}\, m_{ij} / 255)$ と縮めます（$I_{ij}$ は元の画像の画素の値）。
- 目標は元の画像をぼかさずにそのまま使います。ぼかした目標よりもエッジが強調されて、きれいに見えるからです。

## 変数と項

{% include video_seek.html t="5:08" %}

| 256×256 の画像 | 数 |
|---|---:|
| 変数（画素の数） | 65,536 |
| 内側の画素の、積になる相手 | 128 |
| 項 | 4,171,656（1 画素あたり約 64） |

2 乗を展開すると、同じ窓に入る 2 つの画素の変数の積が現れます。そのような相手は縦横 6 画素以内（13×13 の範囲）にあります。
項の数は画素の数に比例し、全部の組よりずっと少ない、疎な QUBO です。それでも白黒の並べ方は $2^{65536}$ 通りあり、全部は調べられません。

## プログラム

{% include video_seek.html t="6:01" %}

ABS3 で解く PyQBPP のプログラムです。動画で省略しているファイルの読み込みと DBS もここでは書き足しています。
入力の画像 [halftone_cat.pgm](../../images/halftone_cat.pgm)（PGM 形式、256×256 画素）を、実行するディレクトリに置いて実行します。

- `G` は目で見た誤差に使うフィルタ、`blur` は画像を `G` でぼかす関数（画像の外の画素は 0）、`target` は目標です。
- `qbpp.var` で 256×256 のバイナリ変数の配列 `x` を作り、`qbpp.concat` で上下左右に幅 3 の 0 をつないで `xp` を作ります。
  `xp` をずらした部分配列に重みを掛けて足すと、ぼけの値 `conv` になります。
- `conv` から `target` を引いて 2 乗し、`qbpp.sum` で全部足すと `f` です。`simplify_as_binary()` で整理して、ABS3Solver に渡します。
- 1 回目の `search` は制限時間 60 秒で、ABS3 だけで探します。2 回目は、DBS で得た 2 値画像 `dbs` から作った解を `hint` として渡し、DBS の解から探し始めます。

```python
import random

import pyqbpp as qbpp

M = 3
G = [[0, 0, 1, 1, 1, 0, 0],
     [0, 1, 5, 7, 5, 1, 0],
     [1, 5, 14, 21, 14, 5, 1],
     [1, 7, 21, 31, 21, 7, 1],
     [1, 5, 14, 21, 14, 5, 1],
     [0, 1, 5, 7, 5, 1, 0],
     [0, 0, 1, 1, 1, 0, 0]]                  # 整数ガウシアン（総和 255）
ROWS = COLS = 256

# img: 256 x 256 の 2 次元配列（画素値 0〜255）を PGM（P2 形式）のファイルから読む
with open("halftone_cat.pgm") as fp:
    tokens = fp.read().split()
img = [[int(v) for v in tokens[4 + i * COLS:4 + (i + 1) * COLS]] for i in range(ROWS)]


def blur(a):
    # G との畳み込み（画像の外側の画素は 0 とみなす）
    out = [[0] * COLS for _ in range(ROWS)]
    for i in range(ROWS):
        for j in range(COLS):
            for k in range(2 * M + 1):
                for l in range(2 * M + 1):
                    if 0 <= i + k - M < ROWS and 0 <= j + l - M < COLS:
                        out[i][j] += G[k][l] * a[i + k - M][j + l - M]
    return out


# 目標値 T: 元画像そのもの（境界は届くフィルタ質量に合わせて縮小）
mass = blur([[1] * COLS for _ in range(ROWS)])
target = [[round(img[i][j] * mass[i][j] / 255) for j in range(COLS)]
          for i in range(ROWS)]

x = qbpp.var("x", ROWS, COLS)
xp = qbpp.concat([0] * M + [x] + [0] * M, axis=1)
xp = qbpp.concat([0] * M + [xp] + [0] * M, axis=0)
conv = qbpp.expr(ROWS, COLS)                    # (G * x)
for k in range(2 * M + 1):
    for l in range(2 * M + 1):
        if G[k][l]:
            conv += G[k][l] * xp[k:k + ROWS, l:l + COLS]
f = qbpp.sum((conv - qbpp.array(target)).sqr())  # 誤差の 2 乗の和
f.simplify_as_binary()

solver = qbpp.ABS3Solver(f)
sol = solver.search(time_limit=60)              # ABS3 だけ
print("ABS3 energy =", sol.energy)


def inside(i, j):
    return 0 <= i < ROWS and 0 <= j < COLS


def overlap(i, j, i2, j2):
    # 画素 (i, j) と (i2, j2) のぼけが重なる量: 画像の中の q についての G(q - p) G(q - p2) の和
    s = 0
    for k in range(2 * M + 1):
        for l in range(2 * M + 1):
            k2, l2 = i + k - i2, j + l - j2
            if inside(i + k - M, j + l - M) and 0 <= k2 <= 2 * M and 0 <= l2 <= 2 * M:
                s += G[k][l] * G[k2][l2]
    return s


# ぼけが画像からはみ出さない画素どうしの overlap は位置の差だけで決まるので、先に求めておく
INNER = {(di, dj): overlap(2 * M, 2 * M, 2 * M + di, 2 * M + dj)
         for di in range(-2 * M, 2 * M + 1) for dj in range(-2 * M, 2 * M + 1)}


def ov(i, j, i2, j2):
    if M <= min(i, i2) and max(i, i2) < ROWS - M and M <= min(j, j2) and max(j, j2) < COLS - M:
        return INNER[(i2 - i, j2 - j)]
    return overlap(i, j, i2, j2)


def direct_binary_search(seed=1):
    # DBS: 反転と隣の 8 画素との入れ替えのうち、誤差の 2 乗の和が一番下がるものを選ぶ。
    # どの画素でも下がらなくなるまで、ラスタ順の走査を繰り返す
    rng = random.Random(seed)
    b = [[1 if img[i][j] > rng.randrange(255) else 0 for j in range(COLS)]
         for i in range(ROWS)]                       # ランダムなしきい値で始める
    blurred = blur(b)
    err = [[blurred[i][j] - target[i][j] for j in range(COLS)] for i in range(ROWS)]
    c = blur(err)                                    # c[i][j]: 画素 (i, j) のぼけと誤差の内積

    def delta(i, j):                                 # 画素 (i, j) を反転したときの E の変化
        return 2 * (1 - 2 * b[i][j]) * c[i][j] + ov(i, j, i, j)

    def flip(i, j):
        d = 1 - 2 * b[i][j]
        b[i][j] ^= 1
        for i2 in range(max(0, i - 2 * M), min(ROWS, i + 2 * M + 1)):
            for j2 in range(max(0, j - 2 * M), min(COLS, j + 2 * M + 1)):
                c[i2][j2] += d * ov(i, j, i2, j2)

    while True:
        changed = 0
        for i in range(ROWS):
            for j in range(COLS):
                d0 = delta(i, j)
                best, partner = d0, None             # 反転
                for i2 in range(i - 1, i + 2):       # 色の違う隣の画素との入れ替え
                    for j2 in range(j - 1, j + 2):
                        if inside(i2, j2) and b[i2][j2] != b[i][j]:
                            de = d0 + delta(i2, j2) - 2 * ov(i, j, i2, j2)
                            if de < best:
                                best, partner = de, (i2, j2)
                if best < 0:
                    flip(i, j)
                    if partner:
                        flip(*partner)
                    changed += 1
        if changed == 0:
            return b


# dbs: DBS で得た 2 値画像（0 / 1 の 2 次元配列）
dbs = direct_binary_search()
hint = qbpp.Sol(f).set({x[i][j]: dbs[i][j] for i in range(ROWS) for j in range(COLS)})
print("DBS energy =", f(hint))
sol = solver.search(time_limit=60, hint=hint)   # DBS の画像を hint に
print("ABS3 + hint energy =", sol.energy)
```

このプログラムの出力の例です（ABS3Solver の結果は実行ごとに変わります。NVIDIA GB10 での例）：

```
ABS3 energy = 3863459
DBS energy = 4206279
ABS3 + hint energy = 3882572
```

ここの DBS は動画の DBS と出発点の乱数が違うので、エネルギーも少し違います（動画では 4,207,803）。
探索を 2 回 60 秒ずつ行い、Python の DBS にも時間がかかるので、全体で 2 分あまりかかります。

詳しくは[ハーフトーン化](HALFTONING)、[スライスと連結](SLICE_CONCAT)、[ABS3 Solver](ABS3)をご覧ください。

## 3 つの比較

{% include video_seek.html t="7:27" %}

DBS だけ、ABS3 だけ、hint を与えた ABS3 の 3 つで、時間（対数の目盛り）とエネルギー（誤差の 2 乗の和、下ほど良い）の変化を比べました。
ABS3 は、GPU を 2 枚積んだ計算機でどちらも 60 秒探索しています。hint を与えた ABS3 は、DBS が終わったあとから探索を始めます。

<p align="center">
  <img src="../../images/halftone_compare_ja.svg" alt="時間と誤差の2乗の和の変化（DBS、ABS3 だけ、DBS の画像を hint にした ABS3）" width="90%">
</p>

動画での結果（DBS は乱数の出発点によって、ABS3 は実行ごとに結果が変わります）：

| | 止まった・追い抜いた時刻 | 最後のエネルギー |
|---|---|---:|
| DBS | 13 回の走査、約 0.8 秒で止まる | 4,207,803 |
| ABS3 だけ | 3 秒あまりで DBS を追い抜く | 3,904,736 |
| hint を与えた ABS3 | DBS の解から始まり、最初の数秒は ABS3 だけより良い | 3,903,575 |

60 秒後には ABS3 の 2 つはほぼ同じ値になり、DBS より約 7% 小さくなりました。
DBS は速く、ABS3 は時間をかけて、さらに低いエネルギーに届きます。

## 画像の比較

{% include video_seek.html t="8:44" %}

左から、元の画像、DBS、ABS3 だけ、hint を与えた ABS3 の 2 値画像です（動画の結果）。

<p align="center">
  <img src="../../images/halftone_cat_in.png" alt="元の画像" width="24%">
  <img src="../../images/halftone_cat_dbs.png" alt="DBS の2値画像" width="24%">
  <img src="../../images/halftone_cat_abs3.png" alt="ABS3 だけで探した2値画像" width="24%">
  <img src="../../images/halftone_cat_hint.png" alt="DBS の画像を hint にした ABS3 の2値画像" width="24%">
</p>

目のあたりを拡大すると、点の置き方は少しずつ違いますが、どれが元の画像に近いかは見た目では分かりません。

<p align="center">
  <img src="../../images/halftone_cat_in_eye.png" alt="元の画像の目の部分" width="24%">
  <img src="../../images/halftone_cat_dbs_eye.png" alt="DBS の2値画像の目の部分" width="24%">
  <img src="../../images/halftone_cat_abs3_eye.png" alt="ABS3 だけで探した2値画像の目の部分" width="24%">
  <img src="../../images/halftone_cat_hint_eye.png" alt="DBS の画像を hint にした ABS3 の2値画像の目の部分" width="24%">
</p>

| | エネルギー | 1 画素あたりの誤差 |
|---|---:|---:|
| DBS | 約 421 万 | 8.01 |
| ABS3 だけ・hint を与えた ABS3 | 約 390 万 | 7.72 |

1 画素あたりの誤差（$\sqrt{E / 65536}$）の違いは 4% ほどです。見た目のためなら、実際には DBS で十分です。違いがはっきり出るのは、エネルギーの数字のほうです。

## まとめ

{% include video_seek.html t="9:36" %}

- ハーフトーン化は、目で見た誤差を最小にする、疎な QUBO として書けます。誤差の 2 乗の和が、そのまま QUBO のエネルギーになります。
- DBS は、この QUBO の局所探索で、良い画像が速く得られます。
- QUBO ソルバーは、DBS の解よりもエネルギーの低い解を見つけます。
- 3 つの画像は見た目では区別できず、実際の用途には DBS で十分です。
- 画像を大きくすれば規模も変えられる、ちょうどよい大きさの QUBO で、QUBO ソルバーのベンチマークとして興味深い問題です。
