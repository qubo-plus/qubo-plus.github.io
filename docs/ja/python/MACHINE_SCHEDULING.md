---
last_modified: 2026-10-31
layout: default
nav_exclude: true
title: "納期付き機械スケジューリング"
nav_order: 97
lang: ja
hreflang_alt: "en/python/MACHINE_SCHEDULING"
hreflang_lang: "en"
---

# 納期付き機械スケジューリング

ある工場に 3 台の機械と 12 件の注文があります。
注文ごとに納期があり、処理時間は機械によって違います。処理できない機械もあります。
各注文は 1 台の機械で処理し、どの注文も納期までに終えなければなりません。
機械は一度に 1 件ずつ、休みなく処理します。
このページでは、そのようなスケジュールのうち、まず**処理時間の合計**が最小のものを、
次に**メイクスパン**（最後の注文が終わる時刻）が最小のものを求めます。
同じ問題は、ブラウザ上の [機械スケジューリングのデモ](../demos/machine-scheduling/) でも試せます。

{% include video_embed.html slug="machine-scheduling" %}

動画では同じ 12 件の注文で、処理時間の合計とメイクスパンを求めます。動画のプログラムと章ごとの説明は[動画：納期付き機械スケジューリング](VIDEO_MACHINE_SCHEDULING)のページにあります。

注文は次のとおりです。番号は納期の早い順に付けてあります（時間の単位は分。– はその機械では処理できないことを表します）。

| 注文 | 納期 | 機械 1 | 機械 2 | 機械 3 |
|---:|---:|---:|---:|---:|
| 1 | 100 | 100 | 100 | – |
| 2 | 170 | 95 | – | 160 |
| 3 | 190 | 95 | 155 | 155 |
| 4 | 225 | 85 | 120 | 135 |
| 5 | 250 | – | 75 | – |
| 6 | 300 | 110 | 135 | 175 |
| 7 | 320 | 90 | – | 140 |
| 8 | 355 | 85 | 95 | – |
| 9 | 360 | 40 | 60 | 80 |
| 10 | 405 | 65 | – | – |
| 11 | 480 | 80 | 130 | 145 |
| 12 | 500 | 90 | 150 | – |

速い機械を使えば時間は短くなりますが、すべての注文を最も速い機械に置くと機械 1 に注文が集中します。
機械 1 と機械 2 で同じ速さの注文 1 も機械 1 に置き、各機械で番号順（納期の早い順）に処理すると、
12 件中 10 件が納期に間に合いません。

## 定式化

注文 $j$ を機械 $m$ で処理するとき 1 になるバイナリ変数 $y_{j,m}$ を使います。
機械 $m$ が注文 $j$ を処理できない組では $y_{j,m} = 0$ です。

機械が注文を処理する順序を変えても、処理時間の合計は変わりません。
また、ある機械の注文をどう並べればすべての納期に間に合うなら、納期の早い順でも間に合います。
そこで、各機械は注文を納期の早い順、つまり番号順に処理することにし、決めるのは割当てだけにします。
すると、注文 $j$ が機械 $m$ で終わる時刻は次のとおりです。

$$
C_{j,m} = \sum_{i \le j} p_{i,m}\, y_{i,m}
$$

ここで $p_{i,m}$ は注文 $i$ の機械 $m$ での処理時間です。
モデルは次のとおりです。

$$
\begin{aligned}
\text{最小化}\quad & \sum_{j,m} p_{j,m}\, y_{j,m} \\
\text{制約}\quad & \sum_{m} y_{j,m} = 1 && \text{（すべての注文 } j\text{）}\\
& C_{j,m} \le d_j && \text{（すべての機械 } m \text{ と注文 } j\text{）}
\end{aligned}
$$

$d_j$ は注文 $j$ の納期です。
2 つ目の制約は、注文 $j$ が機械 $m$ にないときにも正しく働きます。
そのとき $C_{j,m}$ は、機械 $m$ でそれより前に処理する最後の注文の終了時刻で、その注文の納期は $d_j$ 以前だからです。

それぞれの制約は `qbpp.cons()` で書き、処理時間の合計よりずっと大きい重み 100000 を付けます。
QUBO++ はこれらの制約を直接扱うので、不等式制約にスラック変数は要りません。

## プログラム

```python
import pyqbpp as qbpp

# 納期と、機械 1, 2, 3 での処理時間（分。0 はその機械では処理できない）
# 注文は納期の早い順に並べてある
due = [100, 170, 190, 225, 250, 300, 320, 355, 360, 405, 480, 500]
time = [[100, 100, 0], [95, 0, 160], [95, 155, 155], [85, 120, 135],
        [0, 75, 0], [110, 135, 175], [90, 0, 140], [85, 95, 0],
        [40, 60, 80], [65, 0, 0], [80, 130, 145], [90, 150, 0]]
n = len(due)
machines = 3

y = qbpp.var("y", shape=(n, machines))
work = qbpp.array(time) * y
f = qbpp.sum(work)

# 各注文をちょうど 1 台の機械で処理する
f += 100000 * qbpp.cons(qbpp.vector_sum(y, axis=1) == 1)

# 各注文は納期までに終わる
for m in range(machines):
    finish = 0
    for j in range(n):
        finish += work[j][m]
        f += 100000 * qbpp.cons(finish <= due[j])

# 処理できない組は 0 に、処理できる機械が 1 台だけの注文は 1 に固定する
ml = {}
for j in range(n):
    for m in range(machines):
        if time[j][m] == 0:
            ml[y[j][m]] = 0
        elif time[j].count(0) == machines - 1:
            ml[y[j][m]] = 1
g = qbpp.replace(f, ml)
g.simplify_as_binary()

solver = qbpp.EasySolver(g)
sol = solver.search(time_limit=1.0)
full_sol = qbpp.Sol(f).set(sol, ml)

total = 0
for m in range(machines):
    print(f"Machine {m + 1}:", end="")
    t = 0
    for j in range(n):
        if full_sol(y[j][m]) == 1:
            print(f" #{j + 1}({t}-{t + time[j][m]})", end="")
            t += time[j][m]
            total += time[j][m]
    print()
print("Total processing time:", total)
```

このプログラムは、各機械で処理する注文を開始時刻と終了時刻とともに出力します。

```
Machine 1: #2(0-95) #3(95-190) #6(190-300) #9(300-340) #10(340-405) #12(405-495)
Machine 2: #1(0-100) #5(100-175) #8(175-270) #11(270-400)
Machine 3: #4(0-135) #7(135-275)
Total processing time: 1170
```

- `y` は変数の配列です。Python の添字は 0 から始まるので、$y_{j,m}$ はプログラムでは `y[j-1][m-1]` です（$y_{1,1}$ は `y[0][0]`）。出力では添字に 1 を足して、注文と機械の番号にしています。
- `work` は処理時間と変数の要素ごとの積の配列で（[配列演算](OPVECTOR)）、`work[j][m]` は機械 `m` が注文 `j` に使う時間（処理しないときは 0）です。`qbpp.sum(work)` が処理時間の合計です。
- `qbpp.vector_sum(y, axis=1)` は各行の和、つまり注文ごとの変数の和の配列で（[総和関数](SUM)）、`== 1` で注文ごとの制約になります。
- `finish` は、機械 `m` が番号順に処理したときの、その注文の終了時刻（式の $C_{j,m}$）なので、`finish <= due[j]` がその納期の制約です。
- `ml` は固定する変数とその値です。処理できない組は 0、処理できる機械が 1 台だけの注文（注文 5 と 10）はその機械で処理するしかないので 1 です。`qbpp.replace()` で固定した式 `g` を作ると（[置換関数](REPLACE)）、ソルバーが探す変数は 36 個から 25 個に減ります。
- `EasySolver` で `g` を 1 秒間探索します。固定した変数は `g` にないので `sol` からは読めません。`qbpp.Sol(f).set(sol, ml)` で元の式 `f` のすべての変数を持つ解 `full_sol` に戻してから読みます（[変数の固定と番兵](FIX_VARIABLES)）。

すべての注文が納期に間に合い、処理時間の合計は 1170 分です。
すべての割当てを調べると、これがこの注文での最小値であることを確かめられます。

## メイクスパンの最小化

上のスケジュールでは、機械 1 は 495 分まで動きますが、機械 3 は 275 分で終わります。
メイクスパンを最小にするには、メイクスパンを表す[ネイティブ整数変数](INTEGER) $z$ を加え、
どの機械も $z$ までに終わるという制約を課し、目的関数に $100z$ を加えます。

$$
\begin{aligned}
\text{最小化}\quad & 100z + \sum_{j,m} p_{j,m}\, y_{j,m} \\
\text{制約}\quad & \text{上の制約}\\
& L_m \le z && \text{（すべての機械 } m\text{）}
\end{aligned}
$$

$L_m = \sum_j p_{j,m}\, y_{j,m}$ は機械 $m$ が動いている時間です。
時間はすべて 5 分の倍数なので、メイクスパンは 5 分単位で変わり、その重みは 500 です。
一方、この注文の処理時間の合計は、最大でも 465 分（各注文の最も遅い処理時間と最も速い処理時間の差の和）しか変わりません。
そのため、まずメイクスパンが最小になり、メイクスパンが同じスケジュールの中で処理時間の合計が最小になります。

プログラムでは、`qbpp.var("z", integer=(0, 600))` で $z$ を宣言し、納期の制約の後に新しい項を加えます。
`qbpp.vector_sum(work, axis=0)` は列の和、つまり各機械が動いている時間 $L_m$ の配列です。

```python
import pyqbpp as qbpp

# 納期と、機械 1, 2, 3 での処理時間（分。0 はその機械では処理できない）
# 注文は納期の早い順に並べてある
due = [100, 170, 190, 225, 250, 300, 320, 355, 360, 405, 480, 500]
time = [[100, 100, 0], [95, 0, 160], [95, 155, 155], [85, 120, 135],
        [0, 75, 0], [110, 135, 175], [90, 0, 140], [85, 95, 0],
        [40, 60, 80], [65, 0, 0], [80, 130, 145], [90, 150, 0]]
n = len(due)
machines = 3

y = qbpp.var("y", shape=(n, machines))
work = qbpp.array(time) * y
f = qbpp.sum(work)

# 各注文をちょうど 1 台の機械で処理する
f += 100000 * qbpp.cons(qbpp.vector_sum(y, axis=1) == 1)

# 各注文は納期までに終わる
for m in range(machines):
    finish = 0
    for j in range(n):
        finish += work[j][m]
        f += 100000 * qbpp.cons(finish <= due[j])

# メイクスパン z: どの機械も z までに終わる
z = qbpp.var("z", integer=(0, 600))
f += 100 * z
f += 100000 * qbpp.cons(qbpp.vector_sum(work, axis=0) - z <= 0)

# 処理できない組は 0 に、処理できる機械が 1 台だけの注文は 1 に固定する
ml = {}
for j in range(n):
    for m in range(machines):
        if time[j][m] == 0:
            ml[y[j][m]] = 0
        elif time[j].count(0) == machines - 1:
            ml[y[j][m]] = 1
g = qbpp.replace(f, ml)
g.simplify_as_binary()

solver = qbpp.EasySolver(g)
sol = solver.search(time_limit=1.0)
full_sol = qbpp.Sol(f).set(sol, ml)

total = 0
for m in range(machines):
    print(f"Machine {m + 1}:", end="")
    t = 0
    for j in range(n):
        if full_sol(y[j][m]) == 1:
            print(f" #{j + 1}({t}-{t + time[j][m]})", end="")
            t += time[j][m]
            total += time[j][m]
    print()
print("Makespan:", full_sol(z))
print("Total processing time:", total)
```

このプログラムの出力は次のとおりです。

```
Machine 1: #2(0-95) #3(95-190) #6(190-300) #9(300-340) #10(340-405)
Machine 2: #1(0-100) #5(100-175) #8(175-270) #12(270-420)
Machine 3: #4(0-135) #7(135-275) #11(275-420)
Makespan: 420
Total processing time: 1245
```

メイクスパンは 495 分から 420 分に短くなり、その代わりに処理時間の合計は 1170 分から 1245 分に増えます。

## ブラウザで試す

[機械スケジューリングのデモ](../demos/machine-scheduling/) では、注文の編集、チャート上での移動、目的の選択ができ、
サーバー上でモデルを解けます。
すべての納期を守れない注文も受け付け、そのときは `relu()` で書いた遅れの合計をまず最小にします。
