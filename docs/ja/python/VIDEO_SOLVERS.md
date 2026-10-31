---
last_modified: 2026-10-26
layout: default
nav_exclude: true
title: "動画：ソルバーの使い分け"
description: "動画「QUBO++ ソルバーの使い分け（Python）」の章ごとの要点と、動画に出てくるプログラムと出力。"
lang: ja
hreflang_alt: "en/python/VIDEO_SOLVERS"
hreflang_lang: "en"
video: solvers
---

# 動画：ソルバーの使い分け（Python）

動画「QUBO++ ソルバーの使い分け（Python）」の手引きです。
章ごとに、要点と動画に出てくるプログラム・出力、詳しい説明のページへのリンクをまとめています。
「▶ 動画の … から再生」をクリックすると、その場面から再生します。
動画では一部を省略して見せているプログラムも、ここではそのまま実行できる形で載せています。

{% include video_embed.html slug="solvers" %}

この動画で扱うこと：

- ExhaustiveSolver・EasySolver・ABS3Solver の違いと、変数の数と GPU による使い分け
- 例題の LABS（低自己相関列）と、そのエネルギーを表す 4 次の式
- `search` のパラメータ（`time_limit`・`target_energy`・`enable_default_callback`・`best_energy_sols`・`topk_sols`）と、進捗表示の読み方
- 探索の途中で自分の関数を呼んでもらう、カスタムコールバック
- 知っているよい解をヒントとして渡す方法（`search(hint=…)` と、コールバックの中の `s.hint(sol)`）

[動画（チュートリアル）](../VIDEOS)の一覧に戻る

## 3 つのソルバー

{% include video_seek.html t="2:50" %}

| | ExhaustiveSolver | EasySolver | ABS3Solver |
|---|---|---|---|
| 探し方 | すべての割り当てを調べる | 時間を決めて、よい解を探す | 時間を決めて、よい解を探す |
| 動くところ | CPU（GPU があれば GPU も一緒に使う） | マルチコア CPU だけ | GPU と CPU（GPU がなければ CPU だけ） |
| 最適の保証 | あり | なし | なし |

使い方は 3 つとも同じです。`solver = qbpp.EasySolver(f)` で式 `f` を渡してソルバーを作り、`sol = solver.search(…)` にパラメータを渡して探索します。
クラス名を変えるだけで、ほかのソルバーに切り替えられます。

詳しくは[式の求解](SOLVE)をご覧ください。

## 例題：LABS

### ずらしても自分と似ない ±1 の列を探す

{% include video_seek.html t="4:24" %}

LABS は、+1 と -1 を並べた長さ $n$ の列 $s_0, s_1, \ldots, s_{n-1}$ の問題です。
列を $d$ だけずらして重なる位置の積を足したものを自己相関 $C_d$ とし、その 2 乗の和をエネルギー $E$ とします。

$$
C_d = \sum_{i=0}^{n-1-d} s_i s_{i+d}, \qquad E = \sum_{d=1}^{n-1} C_d^2
$$

$E$ を最小にする列、つまり、どれだけずらしても自分と似ていない列を探します。
たとえば長さ 7 の列 `+++--+-` では、$C_1, \ldots, C_6$ が 0 と -1 を交互にとり、$E = 3$ です。
長さ 7 のこの列も、長さ 13 の最適解も、バーカー系列と呼ばれる列の 1 つです。

### 0/1 の変数で書くと、4 次の式になる

{% include video_seek.html t="6:40" %}

0 か 1 の変数 `x` から `y = 2 * x - 1` を作ると、+1 か -1 を表す 1 次の式になります。
`y[:n - d] * y[d:]` は重なる位置ごとの積の配列で、`qbpp.sum` で足すと自己相関 $C_d$（2 次の式）です。
それを `qbpp.sqr` で 2 乗して足すので、`f` は 4 次の式になります。QUBO++ のソルバーには、4 次の項を含む式もそのまま渡せます。

```python
import pyqbpp as qbpp

n = 4
x = qbpp.var("x", shape=n)
y = 2 * x - 1
f = 0
for d in range(1, n):
    f += qbpp.sqr(qbpp.sum(y[:n - d] * y[d:]))
f.simplify_as_binary()
print(f)
print("max degree =", f.max_degree)
```

出力：

```
14 -12*x[0] -12*x[1] -12*x[2] -12*x[3] +16*x[0]*x[1] +24*x[0]*x[2] +16*x[0]*x[3] +16*x[1]*x[2] +24*x[1]*x[3] +16*x[2]*x[3] -32*x[0]*x[1]*x[2] -32*x[0]*x[1]*x[3] -32*x[0]*x[2]*x[3] -32*x[1]*x[2]*x[3] +64*x[0]*x[1]*x[2]*x[3]
max degree = 4
```

詳しくは[LABS 問題](LABS)をご覧ください。

## ExhaustiveSolver

### 長さ 13：最適解をすべて求める

{% include video_seek.html t="9:46" %}

ExhaustiveSolver は、$2^{13} = 8192$ 通りの列をすべて調べます。
`best_energy_sols=0` にすると、最適解をすべて集めます（1 以上にすると、集める個数の上限）。集めた解は `sol.sols` に入っています。

```python
import pyqbpp as qbpp

# f は長さ n = 13 の LABS の式（作り方は長さ 4 と同じ）
n = 13
x = qbpp.var("x", shape=n)
y = 2 * x - 1
f = 0
for d in range(1, n):
    f += qbpp.sqr(qbpp.sum(y[:n - d] * y[d:]))
f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search(best_energy_sols=0)
for s in sol.sols:
    print(s.energy, "".join("+" if v == 1 else "-" for v in s(x)))
```

出力：

```
6 -+-+--++-----
6 -----++--+-+-
6 +++++--++-+-+
6 +-+-++--+++++
```

エネルギー 6 の列が 4 つ見つかりました。3 行目がバーカー系列で、残りの 3 つはそれを左右に反転したり、+ と - を入れ替えたりしたものです。
すべて調べたので、最適解はこの 4 つだけだと言い切れます。

### topk_sols：エネルギーの小さい順に集める

{% include video_seek.html t="12:30" %}

1 つのソルバーに対して、`search` は何度でも呼べます。
`topk_sols=6` は、エネルギーの小さい順に 6 個の解を集めます。最適な 4 つに続いて、エネルギー 14 の列（24 個ある）のうち 2 つが入ります。

```python
import pyqbpp as qbpp

# f は長さ n = 13 の LABS の式（作り方は長さ 4 と同じ）
n = 13
x = qbpp.var("x", shape=n)
y = 2 * x - 1
f = 0
for d in range(1, n):
    f += qbpp.sqr(qbpp.sum(y[:n - d] * y[d:]))
f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search(best_energy_sols=0)
for s in sol.sols:
    print(s.energy, "".join("+" if v == 1 else "-" for v in s(x)))
print("---")
sol = solver.search(topk_sols=6)
for s in sol.sols:
    print(s.energy, "".join("+" if v == 1 else "-" for v in s(x)))
```

出力：

```
6 -+-+--++-----
6 -----++--+-+-
6 +++++--++-+-+
6 +-+-++--+++++
---
6 -+-+--++-----
6 -----++--+-+-
6 +++++--++-+-+
6 +-+-++--+++++
14 ++++-+-+--++-
14 --++------+-+
```

詳しくは[Exhaustive Solver](EXHAUSTIVE)をご覧ください。

### 変数が 1 つ増えると、調べる数は 2 倍

{% include video_seek.html t="13:47" %}

| 変数の数 | 割り当ての数 |
|---:|---|
| 13 | 8192 |
| 20 | 約 100 万 |
| 30 | 約 10 億 |
| 40 | 約 1 兆 |
| 100 | 約 $10^{30}$ |

CPU のコアと GPU で並列に調べても、ExhaustiveSolver が使えるのは変数が 30〜40 個くらいまでです。
そのかわり最適解をすべて求められるので、小さな例で式が正しいかを確かめるのに役立ちます。

## EasySolver

### 長さ 30：探す時間と、目標のエネルギーを決める

{% include video_seek.html t="15:32" %}

`search` のパラメータは、名前と値をイコールでつないで書きます。どれも省略できます。

- `time_limit`：探す時間の上限（秒）。指定しないときも 10 秒です。0 にすると時間では止まらないので、`target_energy` も必ず指定します。
- `target_energy`：目標のエネルギー。この値以下の解が見つかると止まります。ここでは長さ 30 の最適値として知られている 59 です。
- `enable_default_callback`：1 にすると、よりよい解が見つかるたびに時刻とエネルギーを表示します（指定しないときは 0）。

```python
import pyqbpp as qbpp

# f は長さ n = 30 の LABS の式
n = 30
x = qbpp.var("x", shape=n)
y = 2 * x - 1
f = 0
for d in range(1, n):
    f += qbpp.sqr(qbpp.sum(y[:n - d] * y[d:]))
f.simplify_as_binary()
solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=10, target_energy=59, enable_default_callback=1)
print(sol.energy, "".join("+" if v == 1 else "-" for v in sol(x)))
```

### 進捗表示：よりよい解が見つかるたびに 1 行

{% include video_seek.html t="18:31" %}

`TTS` はその解が見つかった時刻（探索を始めてからの秒数）、`Energy` はその解のエネルギーです。
22 行目で 59 に届き、`time_limit` の 10 秒を待たずに止まりました。最後の行は `print` の表示です。

動画での出力（EasySolver の結果は実行ごとに変わります）：

```
TTS = 0.000s Energy = 6827
TTS = 0.000s Energy = 4819
TTS = 0.000s Energy = 4435
TTS = 0.000s Energy = 3115
TTS = 0.000s Energy = 2283
TTS = 0.000s Energy = 2123
TTS = 0.000s Energy = 1491
TTS = 0.000s Energy = 1403
TTS = 0.001s Energy = 1067
TTS = 0.001s Energy = 955
TTS = 0.001s Energy = 635
TTS = 0.001s Energy = 435
TTS = 0.001s Energy = 387
TTS = 0.001s Energy = 299
TTS = 0.001s Energy = 203
TTS = 0.001s Energy = 139
TTS = 0.001s Energy = 131
TTS = 0.001s Energy = 123
TTS = 0.001s Energy = 115
TTS = 0.001s Energy = 99
TTS = 0.002s Energy = 75
TTS = 0.002s Energy = 59
59 -+-+--+-+---+++-------+--++-++
```

目標のエネルギーを決めないときは、`target_energy` を書かずに `time_limit` まで探します。
見つかった中で最もよい解が返りますが、最適であることの保証はありません。

詳しくは[Easy Solver](EASYSOLVER)と[探索パラメータ](PARAMS)をご覧ください。

## 制約があるときの進捗表示

{% include video_seek.html t="20:26" %}

`qbpp.cons` で制約を宣言した式では、進捗表示に `Obj`（目的関数の値、ここでは費用）と `Viol`（破っている制約の数 / 制約の数）が加わります。
エネルギーは、費用に制約を破った分のペナルティを足したものです。`Viol` が `0/7` のときはペナルティが 0 で、エネルギーは費用そのものです。
例は、[配列の動画](VIDEO_ARRAYS)の輸送問題です。

```python
import pyqbpp as qbpp

# 前の動画の輸送問題（3 工場 × 4 店、費用の最小値は 810）
supply = qbpp.array([30, 25, 45])
demand = qbpp.array([20, 30, 25, 25])
c = qbpp.array([[8, 6, 10, 9], [9, 12, 13, 7], [14, 9, 16, 5]])
x = qbpp.var("x", shape=(3, 4), integer=(0, 45))
cost = qbpp.sum(c * x)
f = (cost
     + 100 * qbpp.cons(qbpp.vector_sum(x, axis=1) == supply)
     + 100 * qbpp.cons(qbpp.vector_sum(x, axis=0) == demand))
f.simplify_as_binary()
sol = qbpp.EasySolver(f).search(time_limit=1, target_energy=810, enable_default_callback=1)
print("cost =", sol(cost), " violated =", f.cons(sol))
```

動画での出力（81 行の進捗表示のうち、途中の行は … で省略しています。EasySolver の結果は実行ごとに変わります）：

```
TTS = 0.001s Energy = 480428 Obj = 1828 Viol = 4/7
TTS = 0.001s Energy = 466221 Obj = 1821 Viol = 4/7
TTS = 0.001s Energy = 453211 Obj = 1811 Viol = 4/7
…
TTS = 0.001s Energy = 27643 Obj = 1043 Viol = 3/7
TTS = 0.001s Energy = 1175 Obj = 975 Viol = 2/7
TTS = 0.001s Energy = 1093 Obj = 1093 Viol = 0/7
TTS = 0.001s Energy = 1008 Obj = 1008 Viol = 0/7
…
TTS = 0.037s Energy = 814 Obj = 814 Viol = 0/7
TTS = 0.041s Energy = 812 Obj = 812 Viol = 0/7
TTS = 0.052s Energy = 810 Obj = 810 Viol = 0/7
cost = 810  violated = 0
```

最初の行のエネルギー 480428 のうち、費用は 1828、残りの 478600 がペナルティです。
`Viol` が 2/7 から 0/7 になる行では、費用は 975 から 1093 に増えましたが、ペナルティがなくなりエネルギーは 1175 から 1093 に下がりました。

詳しくは[非線形関数とネイティブ制約](CONSTRAINTS)をご覧ください。

## ABS3Solver

### 長さ 100：最適値が知られていない問題を、GPU も使って探す

{% include video_seek.html t="23:09" %}

長さ 100 では割り当てが $2^{100}$（約 $10^{30}$）通りあり、最適値も知られていません。
GPU のあるコンピュータなので、GPU も使う ABS3Solver を選びます。書き方は EasySolver と同じで、クラス名が変わるだけです。
`target_energy` がないので、`time_limit` の 10 秒まで探し続けます。

```python
import pyqbpp as qbpp

n = 100
x = qbpp.var("x", shape=n)
y = 2 * x - 1
f = 0
for d in range(1, n):
    f += qbpp.sqr(qbpp.sum(y[:n - d] * y[d:]))
f.simplify_as_binary()
solver = qbpp.ABS3Solver(f)
sol = solver.search(time_limit=10, enable_default_callback=1)
print(sol.energy, "".join("+" if v == 1 else "-" for v in sol(x)))
```

動画での出力（ABS3Solver の結果は実行ごとに変わります）：

```
TTS = 0.010s Energy = 304578
TTS = 0.010s Energy = 277230
TTS = 0.010s Energy = 274510
TTS = 0.010s Energy = 253842
TTS = 0.024s Energy = 1206
TTS = 0.024s Energy = 1122
TTS = 0.049s Energy = 1106
TTS = 0.060s Energy = 1010
TTS = 0.140s Energy = 998
TTS = 0.142s Energy = 990
TTS = 0.144s Energy = 942
TTS = 0.162s Energy = 934
TTS = 0.195s Energy = 894
TTS = 0.495s Energy = 862
TTS = 0.746s Energy = 842
TTS = 1.975s Energy = 834
TTS = 2.142s Energy = 814
814 +---++++++++++-++++++--+++------+-+++++-+--+-+--+--+-+-+-+-++-----++-+-+--++-++--++-+--++--+++---++-
```

ABS3Solver は見つかった中で最もよい解を返しますが、814 が最適であるという保証はありません。

### GPU があれば GPU も使う：なくても CPU だけで動く

{% include video_seek.html t="25:37" %}

ABS3Solver は、GPU があれば GPU と CPU の両方で同時に解を探します。使う GPU の数は 2 つ目の引数で指定できます。

| 書き方 | 意味 |
|---|---|
| `qbpp.ABS3Solver(f)` | 使える GPU をすべて使う（GPU がなければ CPU だけ） |
| `qbpp.ABS3Solver(f, 0)` | GPU を使わず、CPU だけで探す |
| `qbpp.ABS3Solver(f, 2)` | GPU を 2 つ使う |

GPU がないコンピュータでも、同じプログラムを書き換えずにそのまま動かせます。

詳しくは[ABS3 Solver](ABS3)をご覧ください。

## カスタムコールバック

{% include video_seek.html t="27:01" %}

`solver.set_callback(on_event)` で登録した関数が、探索の途中でソルバー `s` を引数として呼ばれます。
`s.event()` は、`Start`（探索の始まりに 1 回）、`BestUpdated`（よりよい解が見つかるたび）、`Timer`（`s.timer` で決めた間隔ごと）のどれかです。
`s.best_sol()` はその時点で最もよい解、`s.terminate()` は探索を止めます。この例では、1 秒の間よくならなかったら止めます。

```python
import pyqbpp as qbpp

n = 30
x = qbpp.var("x", shape=n)
y = 2 * x - 1
f = 0
for d in range(1, n):
    f += qbpp.sqr(qbpp.sum(y[:n - d] * y[d:]))
f.simplify_as_binary()

last = None   # 前回の Timer のときのエネルギー


def on_event(s):
    global last
    if s.event() == qbpp.CallbackEvent.Start:
        s.timer(1)                       # 1 秒ごとに Timer
    elif s.event() == qbpp.CallbackEvent.BestUpdated:
        print("best:", s.best_sol().energy)
    elif s.event() == qbpp.CallbackEvent.Timer:
        energy = s.best_sol().energy
        print("timer:", energy)
        if energy == last:               # 1 秒の間よくならなかった
            s.terminate()
        last = energy


solver = qbpp.EasySolver(f)
solver.set_callback(on_event)
sol = solver.search(time_limit=10)
print(sol.energy, "".join("+" if v == 1 else "-" for v in sol(x)))
```

動画での出力（EasySolver の結果は実行ごとに変わります）：

```
best: 6427
best: 6283
best: 2235
best: 1475
best: 355
best: 155
best: 139
best: 131
best: 115
best: 99
best: 91
best: 83
best: 75
best: 59
timer: 59
timer: 59
59 -+-++-+-+---+++-------+--++-++
```

2 回目の `Timer` も 59 で前回と同じなので、`time_limit` の 10 秒を待たずに探索を止めました。
カスタムコールバックは、ABS3Solver でも同じ書き方で使えます。サブクラスで `callback()` を上書きする書き方もあります。

詳しくは[Easy Solver](EASYSOLVER)の「カスタムコールバック」をご覧ください。

## ヒントを与える

### search(hint=…)：知っているよい解から探す

{% include video_seek.html t="30:07" %}

知っているよい解を `search` の `hint=` に渡すと、ソルバーはその解から探し始めます。返る解は、ヒントより悪くなりません。
例は多次元ナップサック問題です。品物 3000 個から、重さの種類ごとの 5 つの容量をすべて守って、価値の合計を最大にします。
貪欲法で作った解を辞書 `greedy` に記録し、`qbpp.Sol(f).set(greedy)` で `f` の解にします（辞書にない変数は 0）。
ABS3Solver で、ヒントありとヒントなしの探索を 20 秒ずつ比べます。

```python
import random
import pyqbpp as qbpp

n, m = 3000, 5      # 品物 3000 個、重さ 5 種類（容量 5 つ）
random.seed(11)
w = [[random.randint(1, 1000) for j in range(n)] for i in range(m)]
C = [sum(w[i]) // 4 for i in range(m)]
v = [sum(w[i][j] for i in range(m)) // m + random.randint(0, 500)
     for j in range(n)]
x = qbpp.var("x", shape=n)
value = qbpp.sum(v * x)
f = -value
for i in range(m):
    f += 100 * qbpp.cons(qbpp.sum(w[i] * x) <= C[i])
f.simplify_as_binary()

# あらかじめ知っているよい解（貪欲法）
ratio = [v[j] / sum(w[i][j] / C[i] for i in range(m)) for j in range(n)]
load = [0] * m
greedy = {}
for j in sorted(range(n), key=lambda j: ratio[j], reverse=True):
    if all(load[i] + w[i][j] <= C[i] for i in range(m)):
        greedy[x[j]] = 1
        for i in range(m):
            load[i] += w[i][j]
hint = qbpp.Sol(f).set(greedy)
print("greedy: value =", hint(value))

solver = qbpp.ABS3Solver(f)
sol = solver.search(time_limit=20, hint=hint,
                    enable_default_callback=1)
print("with hint:    value =", sol(value))

solver = qbpp.ABS3Solver(f)
sol = solver.search(time_limit=20,
                    enable_default_callback=1)
print("without hint: value =", sol(value))
```

動画での出力（進捗表示の途中の行は … で省略しています。ABS3Solver の結果は実行ごとに変わります）：

```
greedy: value = 715481
TTS = 0.002s Energy = -715481
TTS = 0.354s Energy = -717857
TTS = 0.364s Energy = -718779
…
TTS = 4.339s Energy = -722595
TTS = 5.423s Energy = -722617
with hint:    value = 722617
TTS = 0.000s Energy = -72974
TTS = 0.001s Energy = -148960
TTS = 0.001s Energy = -149105
…
TTS = 17.867s Energy = -717330
TTS = 18.247s Energy = -717360
without hint: value = 717360
```

ヒントありの進捗表示の最初の行は、ヒントの値 -715481 です。ヒントありは 19 行で 722617、ヒントなしは 155 行で 717360 でした。
この実行ではヒントありのほうがよい解を返しましたが、ヒントがあればいつも速い、とは限りません。
`hint=` は、EasySolver と ABS3Solver の `search` で使えます。

### コールバックの中で s.hint(sol)：探索の途中で解を注入する

{% include video_seek.html t="35:09" %}

コールバックの中で `s.hint(sol)` を呼ぶと、実行中の探索に解を注入できます。返る解は、注入した解より悪くなりません。
使いどころの例は、MIP ソルバーを同時に動かして、その時点の最もよい解を交換する場合です。
ここでは簡単のために、2 秒後の `Timer` で貪欲法の解を 1 回だけ注入します。

```python
import json
import random
import pyqbpp as qbpp

# f, x, value と貪欲法の解 hint は、hint= の例と同じ
n, m = 3000, 5      # 品物 3000 個、重さ 5 種類（容量 5 つ）
random.seed(11)
w = [[random.randint(1, 1000) for j in range(n)] for i in range(m)]
C = [sum(w[i]) // 4 for i in range(m)]
v = [sum(w[i][j] for i in range(m)) // m + random.randint(0, 500)
     for j in range(n)]
x = qbpp.var("x", shape=n)
value = qbpp.sum(v * x)
f = -value
for i in range(m):
    f += 100 * qbpp.cons(qbpp.sum(w[i] * x) <= C[i])
f.simplify_as_binary()

ratio = [v[j] / sum(w[i][j] / C[i] for i in range(m)) for j in range(n)]
load = [0] * m
greedy = {}
for j in sorted(range(n), key=lambda j: ratio[j], reverse=True):
    if all(load[i] + w[i][j] <= C[i] for i in range(m)):
        greedy[x[j]] = 1
        for i in range(m):
            load[i] += w[i][j]
hint = qbpp.Sol(f).set(greedy)
print("greedy: value =", hint(value))

log = []   # (時刻, 価値) のリスト


def on_event(s):
    if s.event() == qbpp.CallbackEvent.Start:
        s.timer(2)                          # 2 秒後に Timer
    elif s.event() == qbpp.CallbackEvent.Timer:
        print("before the hint: value =", s.best_sol()(value))
        s.hint(hint)                        # 貪欲法の解を注入する
        s.timer(0)                          # Timer はこの 1 回だけ
    elif s.event() == qbpp.CallbackEvent.BestUpdated:
        best = s.best_sol()
        if f.cons(best) == 0:               # 容量をすべて守っている
            log.append((best.tts, best(value)))


solver = qbpp.ABS3Solver(f)
solver.set_callback(on_event)
sol = solver.search(time_limit=20)
print("value =", sol(value))

json.dump(log, open("h2_mip_hint.json", "w"))   # グラフ用
```

動画での出力（ABS3Solver の結果は実行ごとに変わります）：

```
greedy: value = 715481
before the hint: value = 713226
value = 722760
```

注入する直前の最もよい解は 713226 で、注入すると価値は一気に上がり、貪欲法の解を上回りました。
最後の価値は 722760 で、最初からヒントを与えた探索（722617）に追いつきました。どれが上になるかは、実行のたびに変わります。
`s.hint` は、EasySolver と ABS3Solver のどちらでも使えます。

詳しくは[ABS3 Solver](ABS3)の「Solution Hint」と[Easy Solver](EASYSOLVER)の「ヒント解を渡す」をご覧ください。

## 使い分け

{% include video_seek.html t="39:05" %}

選ぶときに見るのは、変数の数と、GPU が使えるかどうかです。

| 場合 | ソルバー | この動画の例 |
|---|---|---|
| 変数が少ない（30〜40 個まで） | ExhaustiveSolver：最適解をすべて求める（最適の保証） | 長さ 13 で最適解 4 つ |
| まず試す | EasySolver：マルチコア CPU だけで動く | 長さ 30 で目標の 59 |
| GPU が使える | ABS3Solver：GPU と CPU で同時に探す（GPU がなくても CPU だけで動く） | 長さ 100 で 814 |

- 目標のエネルギーがあれば `target_energy` で止めます（最適値でなくてもかまいません）。なければ `time_limit` まで探して、最もよい解を受け取ります。
- 途中の様子を自分で扱いたいときは、カスタムコールバックを使います。
- よい解を知っているときは `hint=` で渡し、探索の途中で得たよい解はコールバックの中で `s.hint` で渡せます。コールバックもヒントも、EasySolver と ABS3Solver の両方で使えます。

## まとめ

{% include video_seek.html t="41:22" %}

- 3 つのソルバーは、どれも同じ書き方で使えます。ExhaustiveSolver は変数が少ない問題の最適解をすべて求め、EasySolver と ABS3Solver は決めた時間の中でよい解を探します。
- `time_limit` は探す時間の上限で、指定しなければ 10 秒です。0 にすると、時間では止まりません。
- `target_energy` は、その値以下の解が見つかると止まります。`enable_default_callback` を 1 にすると、進捗が表示されます。
- `best_energy_sols` を 0 にすると、エネルギーが最小の解をすべて集めます。1 以上にすると、集める個数の上限になります。`topk_sols` は、エネルギーの小さい順に、指定した個数の解を集めます。
- `hint` に、あらかじめ知っているよい解を渡すと、その解から探します。ABS3Solver の 2 つ目の引数を 0 にすると、CPU だけで探します。
- `solver.set_callback` で、探索の途中で呼ぶ関数を登録します。関数の中では、`s.event()` で何が起きたかを調べ、`s.best_sol()` でその時点で最もよい解を得ます。`s.timer()` で呼び出しの間隔を決め、`s.terminate()` で探索を止めます。
- コールバックの中で `s.hint` を呼ぶと、解をソルバーに注入できます。コールバックもヒントも、EasySolver と ABS3Solver の両方で使えます。
- 返された解の `sol.energy` はエネルギー、`sol.tts` は見つかった時刻です。`sol.sols` には、集めた解が入っています。
