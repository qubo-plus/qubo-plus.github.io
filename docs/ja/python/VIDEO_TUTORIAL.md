---
last_modified: 2026-10-30
layout: default
nav_exclude: true
title: "動画：QUBO++ 入門"
description: "動画「QUBO++ 入門（Python）」の章ごとの要点と、動画に出てくるプログラムと出力。"
lang: ja
hreflang_alt: "en/python/VIDEO_TUTORIAL"
hreflang_lang: "en"
video: tutorial
---

# 動画：QUBO++ 入門（Python）

動画「QUBO++ 入門（Python）」の手引きです。
章ごとに、要点と動画に出てくるプログラム・出力、詳しい説明のページへのリンクをまとめています。
「▶ 動画の … から再生」をクリックすると、その場面から再生します。
動画では一部を省略して見せているプログラムも、ここではそのまま実行できる形で載せています。

{% include video_embed.html slug="tutorial" %}

この動画で扱うこと：

- 組合せ最適化問題と QUBO、QUBO++ で数式をそのまま書いて解く流れ
- 変数と式、`simplify_as_binary` での整理、ソルバーで解いて解を読む方法
- 変数の配列（`qbpp.sum`、one-hot、否定リテラル `~x`、配列演算）と分割問題
- 制約の書き方（ペナルティ式と `qbpp.cons()`）、整数変数と不等式の制約
- 3 つのソルバーの使い分け、非線形関数と高次の項、すべてを 1 つのモデルにまとめる例

[動画（チュートリアル）](../VIDEOS)の一覧に戻る

## QUBO++ とは

### 組合せ最適化

{% include video_seek.html t="0:45" %}

たくさんの選択肢の中から、いちばんよい組合せを選ぶ問題を、組合せ最適化問題といいます。
0 か 1 を選ぶ変数が 1 つ増えるたびに、組合せの数は 2 倍になります。
変数が 100 個あるだけで、およそ $10^{30}$ 通りになり、すべてを調べることはできません。

### QUBO

{% include video_seek.html t="1:38" %}

QUBO は、0 か 1 の値をとる変数の 2 次の多項式を最小にする問題です。
たとえば $f = (a + 2b + 3c + 4d - 5)^2$ を展開すると、次の式になります（0/1 の変数では $a^2 = a$）。

$$
f = 25 - 9a - 16b - 21c - 24d + 4ab + 6ac + 8ad + 12bc + 16bd + 24cd
$$

1 次の係数は対角に、2 次の係数は変数の組の場所に並べると、行列 $Q$ になります（定数 25 は行列の外）。

| | a | b | c | d |
|---|---:|---:|---:|---:|
| a | −9 | 4 | 6 | 8 |
| b | | −16 | 12 | 16 |
| c | | | −21 | 24 |
| d | | | | −24 |

実際の問題では、制約をペナルティの式に直して展開し、不等式には補助の変数も加えて、行列を作ります。手でやるのは大変です。

詳しくは[QUBO問題](QUBO)をご覧ください。

### QUBO++

{% include video_seek.html t="3:03" %}

QUBO++ では、行列を作る代わりに、数式をそのまま書きます。
さきほどの $f$ は、Python では `f = qbpp.sqr(a + 2 * b + 3 * c + 4 * d - 5)`、
C++ では `auto f = qbpp::sqr(a + 2 * b + 3 * c + 4 * d - 5);` の 1 行です。
展開して行列を作る作業は QUBO++ が自動で行い、書いた式は内蔵のソルバーにそのまま渡して解けます。

## 準備

{% include video_seek.html t="4:45" %}

試すだけなら、ドキュメントのサイトの Playground で、プログラムを書いてその場で実行できます。
手元で使うときは、ターミナルで pip でインストールします（Linux、Windows では WSL の上で使います）。

```bash
pip install pyqbpp
```

プログラムは、`import pyqbpp as qbpp` で始めます。

詳しくは[インストール](INSTALL)と[Playground](PLAYGROUND)をご覧ください。

## 変数と式

### 変数と式

{% include video_seek.html t="5:26" %}

`qbpp.var` で、0 か 1 の値をとる変数を作ります。かっこの中の名前は、式を表示するときに使われます。
変数をたし算、ひき算、かけ算で組み合わせると式になり、式は自動的に展開されます。

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
f = (a + b - 1) * (b + c - 1)
print("f =", f)
```

出力：

```
f = 1 -b -c -a -b +a*b +a*c +b*b +b*c
```

### 式の整理

{% include video_seek.html t="6:42" %}

`simplify()` は同じ項をまとめます。`simplify_as_binary()` は、0/1 の変数では $b^2 = b$ になる性質も使って、いちばん簡単な形にします。
ソルバーに渡す前には、必ず `simplify_as_binary()` を呼んでおきます。
`f.simplify_as_binary()` は f 自身を書き換え、`qbpp.simplify_as_binary(f)` は新しい式を返します。

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
f = (a + b - 1) * (b + c - 1)
print("f =", f)
print("f =", f.simplify())
print("f =", f.simplify_as_binary())
```

出力：

```
f = 1 -b -c -a -b +a*b +a*c +b*b +b*c
f = 1 -a -2*b -c +a*b +a*c +b*b +b*c
f = 1 -a -b -c +a*b +a*c +b*c
```

詳しくは[変数と式](VARIABLE)をご覧ください。

## ソルバーで解く

### 問題を式にする

{% include video_seek.html t="7:52" %}

0/1 の変数 a, b, c, d で、$a + 2b + 3c + 4d = 5$ になる組合せを探します。
$f = (a + 2b + 3c + 4d - 5)^2$ は 0 以上で、条件を満たすときだけ 0 になります。
16 通りの割り当てのうち、$f = 0$ になるのは (a, b, c, d) = (0, 1, 1, 0) と (1, 0, 0, 1) の 2 通りです。
$f$ を最小にする値が答えです。

### EasySolver で解く

{% include video_seek.html t="9:01" %}

`qbpp.EasySolver(f)` でソルバーを作り、`search` で探索します。
`time_limit` は探索する最長の時間（秒）、`target_energy=0` は $f$ の値が 0 以下の解が見つかった時点で探索を止める指定です。

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
d = qbpp.var("d")
f = qbpp.sqr(a + 2 * b + 3 * c + 4 * d - 5)
f.simplify_as_binary()
solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=10, target_energy=0)
print(sol)
```

動画での出力（最適解は 2 つあるので、実行するたびにもう一方の解が返ることもあります）：

```
Sol(energy=0, {a: 0, b: 1, c: 1, d: 0})
```

### 解を読む

{% include video_seek.html t="10:18" %}

`sol.energy` は、見つかった解での $f$ の値で、エネルギーと呼びます（`f(sol)` も同じ値です）。
`sol(a)` のように変数を渡すと、その変数の値が分かります。

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
d = qbpp.var("d")
f = qbpp.sqr(a + 2 * b + 3 * c + 4 * d - 5)
f.simplify_as_binary()
solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=10, target_energy=0)
print(sol)
print("energy =", sol.energy)
print("a, b, c, d =", sol(a), sol(b), sol(c), sol(d))
```

動画での出力（最適解は 2 つあるので、実行するたびにもう一方の解が返ることもあります）：

```
Sol(energy=0, {a: 0, b: 1, c: 1, d: 0})
energy = 0
a, b, c, d = 0 1 1 0
```

### すべての最適解

{% include video_seek.html t="11:18" %}

`ExhaustiveSolver` は、すべての割り当てを調べて、最適解であることを保証します。
`best_energy_sols=0` にすると最適解をすべて集め、`sol.sols` に入ります。

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
d = qbpp.var("d")
f = qbpp.sqr(a + 2 * b + 3 * c + 4 * d - 5)
f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search(best_energy_sols=0)
for s in sol.sols:
    print(s)
```

出力：

```
Sol(energy=0, {a: 0, b: 1, c: 1, d: 0})
Sol(energy=0, {a: 1, b: 0, c: 0, d: 1})
```

詳しくは[式の求解](SOLVE)をご覧ください。

## 変数の配列

### 配列を作る

{% include video_seek.html t="12:28" %}

`qbpp.var` に `shape` を指定すると、変数の配列ができます。`x[i]` で i 番目の変数を取り出します（番号は 0 から）。

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=5)
print(x)
```

出力：

```
[x[0], x[1], x[2], x[3], x[4]]
```

詳しくは[配列](VECTOR)をご覧ください。

### 合計

{% include video_seek.html t="13:11" %}

0 から始めて `+=` で足していく形はよく使われます。`qbpp.sum` を使えば、同じ式を 1 行で作れます。

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=5)
f = 0
for i in range(5):
    f += x[i]
print("f =", f.simplify_as_binary())
g = qbpp.sum(x)
print("g =", g.simplify_as_binary())
```

出力：

```
f = x[0] +x[1] +x[2] +x[3] +x[4]
g = x[0] +x[1] +x[2] +x[3] +x[4]
```

詳しくは[総和関数](SUM)をご覧ください。

### one-hot

{% include video_seek.html t="13:53" %}

合計から 1 を引いて 2 乗した式は、ちょうど 1 つの変数が 1 のときだけ 0 になります。この条件を one-hot と呼びます。

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=5)
f = qbpp.sqr(qbpp.sum(x) - 1)
f.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(f)
sol = solver.search(best_energy_sols=0)
for s in sol.sols:
    print(s)
```

出力：

```
Sol(energy=0, {x[0]: 1, x[1]: 0, x[2]: 0, x[3]: 0, x[4]: 0})
Sol(energy=0, {x[0]: 0, x[1]: 1, x[2]: 0, x[3]: 0, x[4]: 0})
Sol(energy=0, {x[0]: 0, x[1]: 0, x[2]: 1, x[3]: 0, x[4]: 0})
Sol(energy=0, {x[0]: 0, x[1]: 0, x[2]: 0, x[3]: 1, x[4]: 0})
Sol(energy=0, {x[0]: 0, x[1]: 0, x[2]: 0, x[3]: 0, x[4]: 1})
```

## 分割問題

### 問題

{% include video_seek.html t="15:03" %}

8 個の数 64, 27, 47, 74, 12, 83, 63, 40 を、P と Q の 2 つのグループに分け、2 つの合計をできるだけ近づけます。
数ごとに変数 `x[i]` を用意し、1 なら P、0 なら Q に入れます。
2 つの合計の差を 2 乗した $f$ を最小にすればよいわけです。

### 否定リテラル

{% include video_seek.html t="15:52" %}

`~x` は、x が 0 のとき 1、x が 1 のとき 0 になる否定リテラルで、値は $1 - x$ と同じです。
Q の合計は、`w[i]` と `~x[i]` の積の和で書けます（ループの中では `q += w[i] * ~x[i]`）。
QUBO++ は式を作るとき `~x` を $1 - x$ に展開せず、そのまま扱います（`simplify_as_binary()` で簡約すると、2 次以下の項の `~x` は展開されます）。変数の配列 `x` も、`~x` と書くと否定の配列になります。

詳しくは[否定リテラル](NEGATIVE)をご覧ください。

### ループで書く

{% include video_seek.html t="16:49" %}

変数は 8 個で、割り当ては $2^8 = 256$ 通りなので、`ExhaustiveSolver` で全部調べられます。

```python
import pyqbpp as qbpp

w = [64, 27, 47, 74, 12, 83, 63, 40]
x = qbpp.var("x", shape=len(w))
p = 0
q = 0
for i in range(len(w)):
    p += w[i] * x[i]
    q += w[i] * ~x[i]
f = qbpp.sqr(p - q)
f.simplify_as_binary()

sol = qbpp.ExhaustiveSolver(f).search()
print("f =", sol(f), " p =", sol(p), " q =", sol(q))
print("P:", [w[i] for i in range(len(w)) if sol(x[i]) == 1])
print("Q:", [w[i] for i in range(len(w)) if sol(x[i]) == 0])
```

出力：

```
f = 0  p = 205  q = 205
P: [47, 12, 83, 63]
Q: [64, 27, 74, 40]
```

### 配列演算

{% include video_seek.html t="17:54" %}

`w * x` は要素ごとのかけ算です。`qbpp.sum` で足し合わせれば、ループの 5 行が 2 行になります。

```python
import pyqbpp as qbpp

w = [64, 27, 47, 74, 12, 83, 63, 40]
x = qbpp.var("x", shape=len(w))
p = qbpp.sum(w * x)
q = qbpp.sum(w * ~x)
f = qbpp.sqr(p - q)
f.simplify_as_binary()

sol = qbpp.ExhaustiveSolver(f).search()
print("f =", sol(f), " p =", sol(p), " q =", sol(q))
print("P:", [w[i] for i in range(len(w)) if sol(x[i]) == 1])
print("Q:", [w[i] for i in range(len(w)) if sol(x[i]) == 0])
```

出力：

```
f = 0  p = 205  q = 205
P: [47, 12, 83, 63]
Q: [64, 27, 74, 40]
```

詳しくは[配列演算](OPVECTOR)をご覧ください。

### 結果

{% include video_seek.html t="18:41" %}

P は 47, 12, 83, 63、Q は 64, 27, 74, 40 で、どちらの合計も 205 です。差は 0 なので、これ以上よい分け方はありません。
すべての変数を反転しても、P と Q が入れ替わるだけの同じ分け方です。

詳しくは[分割問題](PARTITION)をご覧ください。

## 制約：割当問題

### 割当問題

{% include video_seek.html t="19:18" %}

4 人に 4 つの仕事を 1 つずつ割り当て、コストの合計を最小にします。表の数は、人 i が仕事 j をしたときのコストです。

| | 仕事 0 | 仕事 1 | 仕事 2 | 仕事 3 |
|---|---:|---:|---:|---:|
| 人 0 | 58 | 73 | 91 | 44 |
| 人 1 | 62 | 15 | 87 | 39 |
| 人 2 | 78 | 56 | 23 | 94 |
| 人 3 | 11 | 85 | 68 | 72 |

変数 `x[i][j]` が 1 なら、人 i に仕事 j を割り当てます（16 個）。
制約は、各行と各列の和がどれも 1 になることです。

### 2 次元の配列

{% include video_seek.html t="20:17" %}

`shape` に行の数と列の数を並べると、2 次元の配列になります。
`qbpp.vector_sum` は、`axis=1` で各行の和、`axis=0` で各列の和を並べた配列を作ります。

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(2, 3))
print(x)
print(qbpp.vector_sum(x, axis=1))
print(qbpp.vector_sum(x, axis=0))
```

出力：

```
[[x[0][0], x[0][1], x[0][2]], [x[1][0], x[1][1], x[1][2]]]
[x[0][0] +x[0][1] +x[0][2], x[1][0] +x[1][1] +x[1][2]]
[x[0][0] +x[1][0], x[0][1] +x[1][1], x[0][2] +x[1][2]]
```

詳しくは[多次元変数](MULTIDIM)をご覧ください。

### ペナルティ式

{% include video_seek.html t="21:29" %}

コストの合計 $g$ は、コストの表 $c$ と変数 $x$ の要素ごとの積の和です。
各行・各列の和から 1 を引いて 2 乗したペナルティは、制約を満たすと 0、破ると正になります。
全体は $h = g + P \times (\text{すべての行と列のペナルティの和})$ で、重み $P$ が十分大きければ、制約を満たす解が $h$ の最小になります。

### ペナルティ式で解く

{% include video_seek.html t="22:21" %}

重み $P$ を 1000 と 10 にして、16 個の変数のすべての組合せを調べます。

```python
import pyqbpp as qbpp

c = qbpp.array([[58, 73, 91, 44],  # コストの表（4×4）
                [62, 15, 87, 39],
                [78, 56, 23, 94],
                [11, 85, 68, 72]])
x = qbpp.var("x", shape=(4, 4))
g = qbpp.sum(c * x)
f = (qbpp.sum(qbpp.sqr(qbpp.vector_sum(x, axis=1) - 1)) +
     qbpp.sum(qbpp.sqr(qbpp.vector_sum(x, axis=0) - 1)))

for P in [1000, 10]:
    h = g + P * f
    h.simplify_as_binary()
    sol = qbpp.ExhaustiveSolver(h).search()
    print(f"P = {P}: g = {sol(g)}, f = {sol(f)}")
    print(sol(x))
```

出力：

```
P = 1000: g = 93, f = 0
[[0, 0, 0, 1], [0, 1, 0, 0], [0, 0, 1, 0], [1, 0, 0, 0]]
P = 10: g = 26, f = 4
[[0, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0], [1, 0, 0, 0]]
```

### 重みの大きさ

{% include video_seek.html t="23:27" %}

重みが 10 のときは 2 人にしか仕事が割り当てられず、空いた行と列が 4 つあるので、ペナルティは $4 \times 10 = 40$ です。
コストの 26 と合わせても 66 で、正しい割り当ての 93 より小さいので、ソルバーは制約を破った解を選びます。
重みは、制約を破ると損になる大きさにする必要があります。次の `cons` でも同じです。

詳しくは[比較制約](COMPARISON)をご覧ください。

## cons() で制約を宣言

### cons()

{% include video_seek.html t="24:17" %}

制約の部分を `qbpp.cons()` で囲むと、制約として宣言されます。
配列の比較を囲むと、行ごと・列ごとに 1 本ずつ、この例では 8 本の制約になります。
値は 重み × 違反量$^2$ で、等式ではペナルティ式と同じです。ソルバーは、制約を満たす解を効率よく探します。

```python
import pyqbpp as qbpp

c = qbpp.array([[58, 73, 91, 44],  # コストの表（4×4）
                [62, 15, 87, 39],
                [78, 56, 23, 94],
                [11, 85, 68, 72]])
x = qbpp.var("x", shape=(4, 4))
g = qbpp.sum(c * x)
h = g + 1000 * (qbpp.cons(qbpp.vector_sum(x, axis=1) == 1) +
                qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
h.simplify_as_binary()

sol = qbpp.EasySolver(h).search(time_limit=1)
print("result =", qbpp.onehot_to_int(sol(x), axis=1))
print("cost =", sol(g))
print("violated constraints =", h.cons(sol))
```

### 解を確かめる

{% include video_seek.html t="25:34" %}

動画での出力（EasySolver の結果は実行ごとに変わることがあります）：

```
result = [3, 1, 2, 0]
cost = 93
violated constraints = 0
```

コストは 44 + 15 + 23 + 11 = 93 です。`h.cons(sol)` は違反している制約の本数で、0 なのですべての制約を満たしています。
`qbpp.onehot_to_int(sol(x), axis=1)` は、各行で 1 になっている列の番号を並べます。人 0 は仕事 3、人 1 は仕事 1 という割り当てです。

詳しくは[ワンホットから整数への変換](ONEHOT)をご覧ください。

### ペナルティ式と cons() の違い

{% include video_seek.html t="26:25" %}

| | ペナルティ式 | `cons()` |
|---|---|---|
| 書き方 | `sqr` で 2 乗する | 比較を `cons()` で囲む |
| 等式の値 | 違反量$^2$ | 違反量$^2$（同じ） |
| 不等式 | 補助の変数が必要 | 補助の変数は要らない |
| 違反の確認 | | `h.cons(sol)` |

ソルバーは、`cons()` の制約を制約として特別に扱います。

詳しくは[非線形関数とネイティブ制約](CONSTRAINTS)をご覧ください。

## 整数変数

### integer= と between=

{% include video_seek.html t="27:03" %}

`qbpp.var` に `integer=` で範囲を指定すると、整数の変数になります。
`between=` で作った `a` は 0/1 の変数の重み付きの和に展開され、`integer=` で作った `b` は展開されずに整数のまま扱われます。
範囲を 0〜100 に広げると `a` は 0/1 の変数 7 個になりますが、`b` は変数 1 つのままなので、個数や時刻などの量には `integer=` が向いています。

```python
import pyqbpp as qbpp

a = qbpp.var("a", between=(0, 10))
b = qbpp.var("b", integer=(0, 10))
print("a =", a)
print("b =", b)
```

出力：

```
a = a[0] +2*a[1] +4*a[2] +3*a[3]
b = b
```

### 連立方程式

{% include video_seek.html t="28:26" %}

$x + 2y = 700$ と $x - y = 100$ を解きます。
それぞれの左辺と右辺の差を 2 乗して足した $f$ は、両方が成り立つときだけ 0 になります。
整数の変数では、`simplify_as_binary` を呼んでも $x^2$ は $x$ にならず、2 乗のまま扱われます。

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 1000))
y = qbpp.var("y", integer=(-1000, 1000))
f = qbpp.sqr(x + 2 * y - 700) + qbpp.sqr(x - y - 100)
f.simplify_as_binary()

sol = qbpp.EasySolver(f).search(time_limit=1, target_energy=0)
print(f"x = {sol(x)}, y = {sol(y)}, f = {sol.energy}")
```

動画での出力（EasySolver の結果は実行ごとに変わることがあります）：

```
x = 300, y = 200, f = 0
```

詳しくは[整数変数](INTEGER)をご覧ください。

## 不等式の制約

### cons() で不等式

{% include video_seek.html t="30:00" %}

$2x + 3y \le 24$、$7x + 5y \le 54$ のもとで、$5x + 4y$ を最大にします。
ソルバーは最小化するので、符号を反転した $-f$ から始めます。不等式も、比較の式を `qbpp.cons()` で囲むだけです。

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 10))
y = qbpp.var("y", integer=(0, 10))
f = 5 * x + 4 * y
g = -f + 100 * (qbpp.cons(2 * x + 3 * y <= 24) +
                qbpp.cons(7 * x + 5 * y <= 54))
g.simplify_as_binary()

sol = qbpp.EasySolver(g).search(time_limit=1)
print(f"x = {sol(x)}, y = {sol(y)}, f = {sol(f)}")
print("violated constraints =", g.cons(sol))
```

動画での出力（EasySolver の結果は実行ごとに変わることがあります）：

```
x = 4, y = 5, f = 40
violated constraints = 0
```

詳しくは[整数線形計画](ILP)をご覧ください。

### ペナルティ式との比較

{% include video_seek.html t="31:35" %}

同じ問題を、`between=` で作った x, y（0/1 の変数 4 個ずつ）で、ペナルティ式（`qbpp.constrain`）と `qbpp.cons` の両方で書いて比べます。
ペナルティ式では補助の変数が 9 個増えて変数 17 個・133 項になり、`cons` では変数 8 個・8 項のままです。
組合せの数は 256 通りから $2^{17} = 131072$ 通りに増え、探索する範囲が広いほど、よい解を見つけにくくなります。

```python
import pyqbpp as qbpp

x = qbpp.var("x", between=(0, 10))  # 0/1 の変数 4 個
y = qbpp.var("y", between=(0, 10))  # 0/1 の変数 4 個
f = 5 * x + 4 * y

gp = -f + 100 * qbpp.constrain(2 * x + 3 * y, between=(0, 24))  # ペナルティ式
gp += 100 * qbpp.constrain(7 * x + 5 * y, between=(0, 54))
gp.simplify_as_binary()
sp = qbpp.EasySolver(gp).search(time_limit=1)

gc = -f + 100 * qbpp.cons(2 * x + 3 * y, between=(0, 24))       # 制約の宣言
gc += 100 * qbpp.cons(7 * x + 5 * y, between=(0, 54))
gc.simplify_as_binary()
sc = qbpp.EasySolver(gc).search(time_limit=1)

print(f"penalty: var_count = {sp.info['var_count']}, term_count = {sp.info['term_count']}, f = {sp(f)}")
print(f"cons:    var_count = {sc.info['var_count']}, term_count = {sc.info['term_count']}, f = {sc(f)}")
```

出力（f は EasySolver の結果で、実行ごとに変わることがあります）：

```
penalty: var_count = 17, term_count = 133, f = 40
cons:    var_count = 8, term_count = 8, f = 40
```

## ソルバーの使い分け

### 3 つのソルバー

{% include video_seek.html t="32:51" %}

| ソルバー | 説明 |
|---|---|
| `ExhaustiveSolver` | すべての組合せを調べ、最適解を保証（小規模向け） |
| `EasySolver` | マルチコアの CPU で探索。まず試す |
| `ABS3Solver` | GPU と CPU を使って並列に探索 |

3 つとも、`solver = qbpp.EasySolver(f)` のように $f$ を渡してソルバーを作り、`sol = solver.search(target_energy=0)` のように探索します。
クラス名を変えるだけで、ほかのソルバーも同じように使えます。`target_energy` などのパラメータも共通です。

### 大きな問題

{% include video_seek.html t="33:44" %}

200 個の数の分割問題です。組合せは $2^{200}$、およそ $10^{60}$ 通りで、すべてを調べることはできません。
`sol.tts` は、返された解が見つかるまでの時間です。

```python
import random
import pyqbpp as qbpp

random.seed(1)
w = [random.randint(1, 100) for _ in range(200)]
x = qbpp.var("x", shape=len(w))
f = qbpp.sqr(qbpp.sum(w * x) - qbpp.sum(w * ~x))
f.simplify_as_binary()

solver = qbpp.EasySolver(f)     # または qbpp.ABS3Solver(f)
sol = solver.search(time_limit=10, target_energy=0)
print(f"f = {sol.energy}, TTS = {sol.tts:.3f} s")
```

動画での出力（TTS は実行ごとに変わります）：

```
f = 0, TTS = 0.002 s
```

`qbpp.ABS3Solver(f)` に変えると GPU も使った探索になり、動画（RTX 3090 × 2）では `f = 0, TTS = 0.001 s` でした。
`EasySolver` と `ABS3Solver` は、よい解を短い時間で探しますが、最適であることの保証はありません。

詳しくは[Easy Solver](EASYSOLVER)と[ABS3 Solver](ABS3)をご覧ください。

### 複数の解

{% include video_seek.html t="35:16" %}

`topk_sols=4` にすると、エネルギーの小さい順に 4 つの解が得られます。`s.energy` は解のエネルギー、`s(x)` は x の値です。
エネルギー 0 の 2 つの解は、0 と 1 を入れ替えた同じ分け方です。

```python
import pyqbpp as qbpp

w = [64, 27, 47, 74, 12, 83, 63, 40]
x = qbpp.var("x", shape=len(w))
f = qbpp.sqr(qbpp.sum(w * x) - qbpp.sum(w * ~x))
f.simplify_as_binary()

sol = qbpp.ExhaustiveSolver(f).search(topk_sols=4)
for s in sol.sols:
    print(s.energy, s(x))
```

出力：

```
0 [0, 0, 1, 0, 1, 1, 1, 0]
0 [1, 1, 0, 1, 0, 0, 0, 1]
4 [0, 0, 1, 1, 0, 1, 0, 0]
4 [1, 0, 1, 0, 1, 1, 0, 0]
```

詳しくは[探索パラメータ](PARAMS)をご覧ください。

### ソルバーの選び方

{% include video_seek.html t="36:22" %}

| ソルバー | 動くところ | 向いている問題 | 最適の保証 |
|---|---|---|---|
| `ExhaustiveSolver` | CPU（GPU があれば GPU も） | 変数が少ない問題 | あり（すべて調べる） |
| `EasySolver` | マルチコア CPU | まず試す | なし |
| `ABS3Solver` | GPU + CPU（GPU がなければ CPU だけ） | 難しい問題 | なし |

使い方は同じなので、クラス名を変えるだけで切り替えられます。

## 非線形関数

### abs と max

{% include video_seek.html t="37:13" %}

`qbpp.abs(f)` は絶対値、`qbpp.relu(f)` は $\max(0, f)$、`qbpp.max(f, g)`・`qbpp.min(f, g)` は大きいほう・小さいほうです。
分割問題を、差の絶対値の最小化と、大きいほうの合計の最小化で解き直します。補助の変数や場合分けを、自分で書く必要はありません。

```python
import pyqbpp as qbpp

w = [64, 27, 47, 74, 12, 83, 63, 40]
x = qbpp.var("x", shape=len(w))
p = qbpp.sum(w * x)
q = qbpp.sum(w * ~x)

f = qbpp.abs(p - q)    # 差の絶対値
f.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(f).search()
print(f"abs: f = {sol.energy}, p = {sol(p)}, q = {sol(q)}")

g = qbpp.max(p, q)     # 大きいほうの合計
g.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(g).search()
print(f"max: g = {sol.energy}, p = {sol(p)}, q = {sol(q)}")
```

出力：

```
abs: f = 0, p = 205, q = 205
max: g = 205, p = 205, q = 205
```

### relu

{% include video_seek.html t="38:36" %}

利益 $4x + 7y$ を最大にしながら、作業量 $2x + 3y$ が 36 を超えた分にコストをかけます。
`relu` の 2 番目の引数を 2 にすると、超えた分の 2 乗になります。$x + y \le 12$ の制約は `cons` で加えます。

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 20))
y = qbpp.var("y", integer=(0, 20))
profit = 4 * x + 7 * y
overtime = qbpp.relu(2 * x + 3 * y - 36, 2)
f = -profit + overtime + 100 * qbpp.cons(x + y <= 12)
f.simplify_as_binary()

sol = qbpp.ExhaustiveSolver(f).search()
print(f"x = {sol(x)}, y = {sol(y)}")
print(f"profit = {sol(profit)}, overtime = {sol(overtime)}")
```

出力：

```
x = 0, y = 12
profit = 84, overtime = 0
```

作業量はちょうど 36 で、しきい値を超えていません。

詳しくは[非線形関数とネイティブ制約](CONSTRAINTS)をご覧ください。

## 高次の項

### 3 次の項

{% include video_seek.html t="39:44" %}

QUBO は 2 次の式ですが、QUBO++ では 3 次以上の項もそのまま書け、内蔵のソルバーはそのまま解きます。
2 次の式しか受け取らないほかのソルバーに渡すときは、`reduce` で 2 次の式に直せます。

```python
import pyqbpp as qbpp

y = qbpp.var("y", shape=4)
f = 2 * y[0] * y[1] * y[2] - 3 * y[1] * y[2] * y[3] + y[1]
f.simplify_as_binary()
print("f =", f)
sol = qbpp.ExhaustiveSolver(f).search()
print(sol)
```

出力：

```
f = y[1] +2*y[0]*y[1]*y[2] -3*y[1]*y[2]*y[3]
Sol(energy=-2, {y[0]: 0, y[1]: 1, y[2]: 1, y[3]: 1})
```

詳しくは[HUBO の QUBO への変換](REDUCE)をご覧ください。

### 否定リテラルの積

{% include video_seek.html t="40:46" %}

否定リテラルも、高次の項の中でそのまま使えます。
`~x` のまま書けば 1 項ですが、$1 - x$ の形で展開すると、否定が 1 つ増えるたびに項の数が 2 倍になり、4 つでは 16 項です。

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=4)
neg = ~x[0] * ~x[1] * ~x[2] * ~x[3]
expanded = qbpp.simplify((1 - x[0]) * (1 - x[1]) * (1 - x[2]) * (1 - x[3]))
print("neg      =", neg)
print("expanded =", expanded)
```

出力：

```
neg      = ~x[0]*~x[1]*~x[2]*~x[3]
expanded = 1 -x[0] -x[1] -x[2] -x[3] +x[0]*x[1] +x[0]*x[2] +x[0]*x[3] +x[1]*x[2] +x[1]*x[3] +x[2]*x[3] -x[0]*x[1]*x[2] -x[0]*x[1]*x[3] -x[0]*x[2]*x[3] -x[1]*x[2]*x[3] +x[0]*x[1]*x[2]*x[3]
```

詳しくは[否定リテラル](NEGATIVE)をご覧ください。

## すべてを 1 つのモデルに

### 3 本の生産ライン

{% include video_seek.html t="41:41" %}

3 本の生産ラインで、合計 20 個を作ります。

| 条件 | 書き方 |
|---|---|
| ライン i を使うか（使うと段取り費 5） | `use[i]`：0/1 の変数 |
| ライン i の生産量（0〜10 個） | `q[i]`：`integer=(0, 10)` |
| 6 個を超えた分に、2 倍の超過費 | `2 * qbpp.relu(q[i] - 6)` |
| ライン 0 と 1 の生産量の偏り | `qbpp.abs(q[0] - q[1])` |
| 止めたラインでは作れない | `qbpp.cons(q[i] - 10 * use[i] <= 0)` |
| 合計はちょうど 20 個 | `qbpp.cons(qbpp.sum(q) == 20)` |
| 3 本とも止めると違約金 50 | `50 * ~use[0] * ~use[1] * ~use[2]` |

### プログラムと結果

{% include video_seek.html t="42:42" %}

どの条件も、式の中にそのまま書いています。このモデルには、補助の変数が 1 つもありません。

```python
import pyqbpp as qbpp

use = qbpp.var("use", shape=3)                 # 0/1 の変数
q = qbpp.var("q", shape=3, integer=(0, 10))    # 整数の変数
f = 0
for i in range(3):
    f += 5 * use[i]
    f += 2 * qbpp.relu(q[i] - 6)
    f += 100 * qbpp.cons(q[i] - 10 * use[i] <= 0)
f += qbpp.abs(q[0] - q[1])
f += 50 * ~use[0] * ~use[1] * ~use[2]
f += 100 * qbpp.cons(qbpp.sum(q) == 20)
f.simplify_as_binary()

sol = qbpp.ExhaustiveSolver(f).search()
print("use =", sol(use))
print("q   =", sol(q))
print("energy =", sol.energy)
```

出力：

```
use = [1, 1, 1]
q   = [7, 7, 6]
energy = 19
```

3 本とも使って 7 個、7 個、6 個を作ります。段取り費 15 と、ライン 0 と 1 が 1 個ずつ超える超過費 2 + 2 = 4 で、合計 19 です。

詳しくは[PyQBPP の表現力](MODELING)をご覧ください。

## ケーススタディ

{% include video_seek.html t="43:58" %}

ドキュメントには、QUBO++ で解いた例が、プログラムと解説つきで 40 以上載っています。
N クイーン、巡回セールスマン、配送計画、機械スケジューリング、ハーフトーン、シフトスケジューリングなど、どれもこの動画で紹介した書き方で作られています。

詳しくは[活用事例](CASE_STUDIES)をご覧ください。

## まとめ

{% include video_seek.html t="44:34" %}

- `qbpp.var` で変数を作ります。`shape=` で配列に、`integer=` で整数の変数になります。
- たし算、ひき算、かけ算や `qbpp.sqr`、`qbpp.sum` で式を書き、`simplify_as_binary` で整理して、ソルバーで解きます。
- ソルバーは `ExhaustiveSolver`・`EasySolver`・`ABS3Solver` の 3 種類で、どれも使い方は同じです。
- 解は `sol(x)` で変数の値を読み、`sol.energy` で $f$ の値が分かります。`f.cons(sol)` で違反している制約の本数が分かります。
- 制約は `cons` で、整数は `integer=` で、絶対値や最大値は関数で、そのまま書けます。
