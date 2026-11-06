---
last_modified: 2026-10-26
layout: default
nav_exclude: true
title: "動画：量子アニーラーのシミュレーション"
description: "動画「QUBO++ ケーススタディ 量子アニーラーのシミュレーション（Python）」の章ごとの要点と、動画に出てくるプログラムと出力。"
lang: ja
hreflang_alt: "en/python/VIDEO_QUANTUM_ANNEALER"
hreflang_lang: "en"
video: quantum-annealer
---

# 動画：量子アニーラーのシミュレーション（Python）

動画「QUBO++ ケーススタディ 量子アニーラーのシミュレーション（Python）」の手引きです。
章ごとに、要点と動画に出てくるプログラム・出力、詳しい説明のページへのリンクをまとめています。
「▶ 動画の … から再生」をクリックすると、その場面から再生します。
動画では一部を省略して見せているプログラムも、ここではそのまま実行できる形で載せています。

{% include video_embed.html slug="quantum-annealer" %}

この動画で扱うこと：

- 量子アニーラーが解くイジングモデルのエネルギーと、2000Q の結合の形であるキメラグラフ
- スピン変数で書いた式を `spin_to_binary()` でバイナリ変数の式（QUBO）に変える
- 2×2 個のセル（32 量子ビット）の上で乱数で作った問題を、EasySolver で解く
- すべての結合を同時には満たせない理由と、ExhaustiveSolver の全探索で最適解だと確かめること
- 16×16 個のセルへの拡大、Advantage2 の Zephyr グラフ、キメラ・ペガサス・Zephyr の 3 つのトポロジー

[動画（ケーススタディ）](../VIDEO_CASE_STUDIES)の一覧に戻る

## 量子アニーラー

{% include video_seek.html t="0:39" %}

量子アニーラーは、結合の形が決まったグラフの上で、イジングモデルのエネルギーが小さいスピンの割り当てを探す装置です。
同じイジングモデルを QUBO++ で式にして解けば、量子アニーラーが返すはずの解が実機なしで得られます。
この動画でいうシミュレーションは、量子の動きをまねることではなく、このように解を求めることです。
実機に送る前の確かめや、実機が返した解と最適解との比較に使えます。

## イジングモデル

{% include video_seek.html t="1:39" %}

量子ビット $i$ はスピン $s_i \in \lbrace -1, +1 \rbrace$ を表します。エネルギーは外場の項と結合の項の和です。

$$
E(s) = \sum_{i} h_i s_i + \sum_{(i,j)} J_{ij}\, s_i s_j
$$

- $h_i$ が正なら下向き（$-1$）、負なら上向き（$+1$）のスピンでエネルギーが下がります。
- $J_{ij}$ が負の結合は 2 つのスピンをそろえようとし、正の結合は逆向きにしようとします。
- 2000Q では、$h_i$ は $-2$〜$2$、$J_{ij}$ は $-1$〜$1$ の範囲です。

3 つのスピンの小さな例（$h = (0.5, 0.5, -1)$、$J_{01} = -1$、$J_{12} = 0.5$）では、$s = (-1, -1, +1)$ で 5 つの項がすべて負になり、
合計 $-3.5$ が 8 通りの割り当ての中で最小です。

## キメラグラフ

{% include video_seek.html t="2:52" %}

2000Q の量子ビットは、8 量子ビットのセルを格子状に並べたキメラグラフの形に結合しています。

- セルの 8 量子ビットは、4 個ずつの 0 組目と 1 組目に分かれます。
- セルの中では、0 組目と 1 組目のすべての組が結合します（16 本）。
- 0 組目は下のセルの同じ位置の 0 組目と、1 組目は右のセルの同じ位置の 1 組目と結合します。

2×2 個のセルでは 32 量子ビット、80 個の結合です。2000Q は 16×16 個のセル（2048 量子ビット）でした。
$i$ 行 $j$ 列のセルの $u$ 組目の $k$ 番目の量子ビットの番号は $((i \cdot C + j) \cdot 2 + u) \cdot 4 + k$（$C$ はセルの列数）で、
たとえば 1 行 0 列のセルの 1 組目の 2 番目は 22 番です。この番号の付け方は、Ocean SDK が作るキメラグラフと同じです。

詳しくは[量子アニーラーのシミュレーション](QUANTUM_ANNEALER)をご覧ください。

## QUBO への変換

{% include video_seek.html t="4:05" %}

PyQBPP のソルバーは、値が 0 か 1 のバイナリ変数の式を解きます。
スピン $s_i$ をバイナリ変数 $x_i$ で $s_i = 2x_i - 1$ と表すと（$x_i = 1$ なら $+1$、$0$ なら $-1$）、$E(s)$ はバイナリ変数の式になります。
3 つのスピンの例では次の式になり、8 通りすべてで値が元の $E(s)$ と一致します。

$$
f(x) = 3x_0 + 2x_1 - 3x_2 - 4x_0x_1 + 2x_1x_2 - 0.5
$$

PyQBPP では、スピン変数で $E(s)$ を書いて `spin_to_binary()` を呼びます。
置き換えた式の値は元の $E(s)$ と同じなので、ソルバーが返すエネルギーはイジングモデルのエネルギーそのものです。

詳しくは[クイックリファレンス: 演算](QR_OPERATION)をご覧ください。

## プログラム

### キメラグラフを作る関数 chimera()

{% include video_seek.html t="4:55" %}

関数 `chimera(rows, cols)` は、`rows` 行 `cols` 列のセルのキメラグラフを作り、量子ビットの番号のリスト `nodes` と結合のリスト `edges` を返します。
中の関数 `q` が量子ビットの番号を計算し、セルの中の結合、下のセルとの縦の結合、右のセルとの横の結合の 3 種類を `edges` に入れます。
`ROWS` と `COLS` を 2 にすると、32 量子ビット、80 結合のグラフになります。

```python
import random
import pyqbpp.d as qbpp


def chimera(rows, cols):
    L = 4  # セルの各組の量子ビット数

    def q(i, j, u, k):
        return ((i * cols + j) * 2 + u) * L + k

    nodes = list(range(rows * cols * 2 * L))
    edges = []
    for i in range(rows):
        for j in range(cols):
            for k in range(L):
                for l in range(L):
                    edges.append((q(i, j, 0, k), q(i, j, 1, l)))
                if i + 1 < rows:
                    edges.append((q(i, j, 0, k), q(i + 1, j, 0, k)))
                if j + 1 < cols:
                    edges.append((q(i, j, 1, k), q(i, j + 1, 1, k)))
    return nodes, edges


ROWS, COLS = 2, 2  # セルの行数と列数
nodes, edges = chimera(ROWS, COLS)
```

### 乱数の h・J から式を作り、EasySolver で解く

{% include video_seek.html t="6:06" %}

- `import pyqbpp.d` で、式の係数を実数（`float`）にしています。
- 外場 `h` は $-2$〜$2$、結合 `J` は $-1$〜$1$ の一様乱数で、量子ビットごと・結合ごとの値を辞書で持ちます。乱数の種が 1 なので、毎回同じ問題になります。
- スピン変数 `s` で $E(s)$ を式 `f` にし、`spin_to_binary()` でバイナリ変数の式に変えて、`simplify_as_binary()` で簡約します。
- EasySolver で制限時間 1 秒として解き、`2 * sol(s[v]) - 1` でスピンに戻します。そのスピンで $E(s)$ を計算し直し、`sol.energy` と並べて表示します。

```python
import random
import pyqbpp.d as qbpp


def chimera(rows, cols):
    L = 4  # セルの各組の量子ビット数

    def q(i, j, u, k):
        return ((i * cols + j) * 2 + u) * L + k

    nodes = list(range(rows * cols * 2 * L))
    edges = []
    for i in range(rows):
        for j in range(cols):
            for k in range(L):
                for l in range(L):
                    edges.append((q(i, j, 0, k), q(i, j, 1, l)))
                if i + 1 < rows:
                    edges.append((q(i, j, 0, k), q(i + 1, j, 0, k)))
                if j + 1 < cols:
                    edges.append((q(i, j, 1, k), q(i, j + 1, 1, k)))
    return nodes, edges


ROWS, COLS = 2, 2  # セルの行数と列数
nodes, edges = chimera(ROWS, COLS)

random.seed(1)
h = {v: random.uniform(-2, 2) for v in nodes}
J = {e: random.uniform(-1, 1) for e in edges}

s = qbpp.var("s", shape=len(nodes))
f = 0
for v in nodes:
    f += h[v] * s[v]
for (a, b), w in J.items():
    f += w * s[a] * s[b]
f.spin_to_binary()
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1)

spin = {v: 2 * sol(s[v]) - 1 for v in nodes}
E = 0
for v in nodes:
    E += h[v] * spin[v]
for (a, b), w in J.items():
    E += w * spin[a] * spin[b]
print(f"energy = {sol.energy:.4f}")
print(f"E(s)   = {E:.4f}")
for i in range(ROWS):
    for j in range(COLS):
        v = (i * COLS + j) * 8
        left = " ".join(f"{spin[v + k]:+d}" for k in range(4))
        right = " ".join(f"{spin[v + k]:+d}" for k in range(4, 8))
        print(f"cell ({i},{j}): {left} | {right}")
```

詳しくは[量子アニーラーのシミュレーション](QUANTUM_ANNEALER)をご覧ください。

## 実行結果

### 出力

{% include video_seek.html t="7:22" %}

動画での出力（EasySolver の結果は実行ごとに変わることがあります）：

```
energy = -46.2007
E(s)   = -46.2007
cell (0,0): +1 -1 -1 -1 | +1 +1 +1 +1
cell (0,1): +1 +1 -1 +1 | +1 +1 -1 -1
cell (1,0): +1 -1 -1 +1 | +1 +1 -1 -1
cell (1,1): +1 +1 +1 +1 | -1 -1 +1 +1
```

`energy` と `E(s)` は一致していて、ソルバーのエネルギーはイジングモデルのエネルギーそのものです。
残りの 4 行はセルごとの 8 個の量子ビットのスピンで、`|` の左が 0 組目、右が 1 組目です。

### 問題と解の図

{% include video_seek.html t="8:08" %}

1 つ目の図は問題、2 つ目の図は解です。

<p align="center">
  <img src="../../images/chimera_instance.svg" alt="キメラグラフ上の乱数の係数 h と J" width="70%">
</p>

<p align="center">
  <img src="../../images/chimera_solution.svg" alt="キメラグラフ上のイジングモデルの解" width="60%">
</p>

- 問題の図：量子ビットの色は $h_i$ で、赤は正、青は負、濃いほど絶対値が大きくなります。緑の実線は引き合う結合（$J_{ij} < 0$）、紫の破線は反発する結合（$J_{ij} > 0$）で、太いほど $\lvert J_{ij} \rvert$ が大きくなります。
- 解の図：黒がスピン $+1$、白が $-1$ です。32 量子ビットのうち 23 個は $h_i$ が望む向き（赤なら白、青なら黒）ですが、量子ビット 7 と 12 は赤なのに黒で、結合に引っぱられて逆向きになっています。
- 橙の太線は満たされない結合で、その項だけならエネルギーを上げます。

### なぜすべての結合を満たせないのか

{% include video_seek.html t="9:18" %}

左上のセルの閉路 7 → 1 → 6 → 2 → 7 で、7 を $+1$ として結合ごとに望む関係でスピンを決めると、1 は $-1$、6 は $+1$、2 は $-1$ になります。
最後の 2 と 7 は引き合う結合なので 7 も $-1$ であってほしいのですが、7 は $+1$ から始めたので、1 周すると食い違います。
反発する結合が奇数本ある閉路では、どこか 1 本は満たせません。最適解では、この閉路でいちばん弱い 2 と 7 の結合だけを満たしません。
外場が望む向きと結合が望む向きがぶつかることもあり、最適解はこうした損の合計が最小の割り当てです。この例では、80 本の結合のうち 22 本が満たされていません。

## 全探索で確かめる

{% include video_seek.html t="10:25" %}

32 量子ビットの割り当ては $2^{32}$（約 43 億）通りなので、ExhaustiveSolver ですべて調べられます。
解く 2 行を `qbpp.ExhaustiveSolver(f)` と `search()` に変えるだけです。

```python
import random
import pyqbpp.d as qbpp


def chimera(rows, cols):
    L = 4  # セルの各組の量子ビット数

    def q(i, j, u, k):
        return ((i * cols + j) * 2 + u) * L + k

    nodes = list(range(rows * cols * 2 * L))
    edges = []
    for i in range(rows):
        for j in range(cols):
            for k in range(L):
                for l in range(L):
                    edges.append((q(i, j, 0, k), q(i, j, 1, l)))
                if i + 1 < rows:
                    edges.append((q(i, j, 0, k), q(i + 1, j, 0, k)))
                if j + 1 < cols:
                    edges.append((q(i, j, 1, k), q(i, j + 1, 1, k)))
    return nodes, edges


ROWS, COLS = 2, 2  # セルの行数と列数
nodes, edges = chimera(ROWS, COLS)

random.seed(1)
h = {v: random.uniform(-2, 2) for v in nodes}
J = {e: random.uniform(-1, 1) for e in edges}

s = qbpp.var("s", shape=len(nodes))
f = 0
for v in nodes:
    f += h[v] * s[v]
for (a, b), w in J.items():
    f += w * s[a] * s[b]
f.spin_to_binary()
f.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()

spin = {v: 2 * sol(s[v]) - 1 for v in nodes}
E = 0
for v in nodes:
    E += h[v] * spin[v]
for (a, b), w in J.items():
    E += w * spin[a] * spin[b]
print(f"energy = {sol.energy:.4f}")
print(f"E(s)   = {E:.4f}")
for i in range(ROWS):
    for j in range(COLS):
        v = (i * COLS + j) * 8
        left = " ".join(f"{spin[v + k]:+d}" for k in range(4))
        right = " ".join(f"{spin[v + k]:+d}" for k in range(4, 8))
        print(f"cell ({i},{j}): {left} | {right}")
```

出力：

```
energy = -46.2007
E(s)   = -46.2007
cell (0,0): +1 -1 -1 -1 | +1 +1 +1 +1
cell (0,1): +1 +1 -1 +1 | +1 +1 -1 -1
cell (1,0): +1 -1 -1 +1 | +1 +1 -1 -1
cell (1,1): +1 +1 +1 +1 | -1 -1 +1 +1
```

出力は EasySolver のときとまったく同じで、EasySolver の解はエネルギー最小の割り当て、つまり最適解です。
理想的な量子アニーラーが返すのも、この最適解です。
動画では、全探索の時間は GPU（A100）1 枚で約 2 秒、CPU 8 コアだけで約 30 秒でした。

詳しくは[Exhaustive Solver](EXHAUSTIVE)をご覧ください。

## 大きなキメラグラフと Advantage2

{% include video_seek.html t="11:11" %}

`ROWS` と `COLS` を 16 にすると、2000Q と同じ 2048 量子ビット、6016 本の結合になります。
全探索はできませんが、EasySolver でそのまま解けます。ただし、制限時間 1 秒では最適解に届かないことがあり、延ばすとよりエネルギーの小さい解が得られることがあります。

```python
import random
import pyqbpp.d as qbpp


def chimera(rows, cols):
    L = 4  # セルの各組の量子ビット数

    def q(i, j, u, k):
        return ((i * cols + j) * 2 + u) * L + k

    nodes = list(range(rows * cols * 2 * L))
    edges = []
    for i in range(rows):
        for j in range(cols):
            for k in range(L):
                for l in range(L):
                    edges.append((q(i, j, 0, k), q(i, j, 1, l)))
                if i + 1 < rows:
                    edges.append((q(i, j, 0, k), q(i + 1, j, 0, k)))
                if j + 1 < cols:
                    edges.append((q(i, j, 1, k), q(i, j + 1, 1, k)))
    return nodes, edges


ROWS, COLS = 16, 16  # セルの行数と列数
nodes, edges = chimera(ROWS, COLS)

random.seed(1)
h = {v: random.uniform(-2, 2) for v in nodes}
J = {e: random.uniform(-1, 1) for e in edges}

s = qbpp.var("s", shape=len(nodes))
f = 0
for v in nodes:
    f += h[v] * s[v]
for (a, b), w in J.items():
    f += w * s[a] * s[b]
f.spin_to_binary()
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1)

spin = {v: 2 * sol(s[v]) - 1 for v in nodes}
E = 0
for v in nodes:
    E += h[v] * spin[v]
for (a, b), w in J.items():
    E += w * spin[a] * spin[b]
print(f"energy = {sol.energy:.4f}")
print(f"E(s)   = {E:.4f}")
for i in range(ROWS):
    for j in range(COLS):
        v = (i * COLS + j) * 8
        left = " ".join(f"{spin[v + k]:+d}" for k in range(4))
        right = " ".join(f"{spin[v + k]:+d}" for k in range(4, 8))
        print(f"cell ({i},{j}): {left} | {right}")
```

動画での出力（EasySolver の結果は実行ごとに変わります）：

```
energy = -2883.4410
E(s)   = -2883.4410
cell (0,0): +1 -1 -1 +1 | -1 +1 -1 -1
...
```

Advantage2 は、キメラグラフより結合の多い Zephyr グラフで、$h_i$ と $J_{ij}$ の範囲も 2000Q とは異なります。

- 式を作って解く部分は、`nodes` と `edges`、係数 `h` と `J` しか使っていません。
- `chimera()` の代わりに Zephyr グラフの `nodes` と `edges` を使い、乱数の範囲も変えれば、同じプログラムで Advantage2 のシミュレーションになります。
- 実機の量子ビットと結合の一覧、係数の範囲は、Ocean SDK で取得できます。使えない量子ビットがあって番号が飛び飛びになるときは、`s` を「最大の番号 + 1」の大きさにします。使わない番号は解に影響しません。

詳しくは[量子アニーラーのシミュレーション](QUANTUM_ANNEALER)をご覧ください。

## 3 つのトポロジー

{% include video_seek.html t="12:20" %}

D-Wave の量子アニーラーの 3 世代のトポロジーで、1 つの量子ビットの結合の数を数えます（配置は Ocean SDK が描くものと同じです）。

| 量子アニーラー | トポロジー | 1 量子ビットの結合の最大数 |
|---|---|---:|
| 2000Q | キメラグラフ | 6 |
| Advantage | ペガサスグラフ | 15 |
| Advantage2 | Zephyr グラフ | 20 |

世代が進むほど、結合が密になっています。どのグラフでも、`nodes` と `edges` を渡せば同じプログラムで解けます。

## まとめ

{% include video_seek.html t="13:05" %}

- イジングモデルのエネルギーを、スピン変数でそのまま式に書きました。
- `spin_to_binary()` で、バイナリ変数の式に変えました。
- `pyqbpp.d` を使って、実数の係数を扱いました。
- EasySolver で解き、ExhaustiveSolver で最適解だと確かめました。
- 式は `nodes` と `edges` と係数だけで書いたので、グラフを替えても使えます。
- キメラ、ペガサス、Zephyr の 3 つのトポロジーも見比べました。
