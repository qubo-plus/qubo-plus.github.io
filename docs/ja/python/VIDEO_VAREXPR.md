---
last_modified: 2026-10-30
layout: default
nav_exclude: true
title: "動画：変数と式"
description: "動画「QUBO++ 変数と式（Python）」の章ごとの要点と、動画に出てくるプログラムと出力。"
lang: ja
hreflang_alt: "en/python/VIDEO_VAREXPR"
hreflang_lang: "en"
video: varexpr
---

# 動画：変数と式（Python）

動画「QUBO++ 変数と式（Python）」の手引きです。
章ごとに、要点と動画に出てくるプログラム・出力、詳しい説明のページへのリンクをまとめています。
「▶ 動画の … から再生」をクリックすると、その場面から再生します。
動画では一部を省略して見せているプログラムも、ここではそのまま実行できる形で載せています。

{% include video_embed.html slug="varexpr" %}

この動画で扱うこと：

- `qbpp.var` で作るバイナリ変数と、変数は値を持たない記号であること（代入や `if` での分岐の落とし穴）
- `integer=` で作るネイティブ整数変数と、`between=` で作るバイナリエンコードの整数変数
- `shape` で作る変数の配列と多次元の配列、行や列の取り出し
- 演算子で式を作り、`simplify`・`simplify_as_binary` で整理して、ソルバーで解く
- 例題として、行と列の数から絵を復元するパズルと、硬貨の支払いを解く

[動画（チュートリアル）](../VIDEOS)の一覧に戻る

## バイナリ変数

{% include video_seek.html t="1:10" %}

変数は `qbpp.var` で作ります。0 か 1 の値をとる変数で、バイナリ変数と呼びます。
かっこの中の文字列は変数の名前で、表示に使われます。Python の変数名と同じにしておくと読みやすくなります。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
print(x, y)
```

出力：

```
x y
```

詳しくは[変数と式](VARIABLE)をご覧ください。

## 変数は値を持たない

### 変数は記号

{% include video_seek.html t="2:13" %}

`qbpp.var` で作った変数は値を持たず、式を組み立てるための記号のようなものです。
`print` しても、値ではなく式が表示されます。変数の値を決めるのはソルバーです。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = x + y
print("f =", f)
```

出力：

```
f = x +y
```

### 値を決めて式を計算する

{% include video_seek.html t="2:59" %}

変数と値の組を辞書にして式に渡すと、式の値が計算できます。
すべての変数に値を決めたものを、割り当てと呼びます。割り当てを渡しても、変数そのものに値が入るわけではありません。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = x + y
print("f(1, 0) =", f({x: 1, y: 0}))
print("f(1, 1) =", f({x: 1, y: 1}))
```

出力：

```
f(1, 0) = 1
f(1, 1) = 2
```

詳しくは[式の評価](EVAL)をご覧ください。

## 代入と分岐の落とし穴

### 代入はできない

{% include video_seek.html t="3:41" %}

`x = 1` と書いても、変数に値が入るのではなく、Python の名前 `x` が整数の 1 を指すように付け替わるだけです。
その前に作った `f` は変数 `x` を使ったまま、あとで作った `g` では `x` はただの 1 です。
変数を入れた名前には、あとから別のものを入れないようにしましょう。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = x + y
x = 1
print(type(x), x)
g = x + y
print("f =", f)
print("g =", g)
```

出力：

```
<class 'int'> 1
f = x +y
g = 1 +y
```

### 同じ名前の変数

{% include video_seek.html t="4:42" %}

`qbpp.var` は呼ぶたびに新しい変数を作ります。名前が同じでも、別々の値をとれる別の変数になります。
`h` は `x +x` と表示されますが、`x` を 1、`x2` を 0 にすると 1 です。変数は 1 度だけ作って、Python の名前で使い回します。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
x2 = qbpp.var("x")
h = x + x2
print("h =", h)
print("h(1, 0) =", h({x: 1, x2: 0}))
```

出力：

```
h = x +x
h(1, 0) = 1
```

### 値で分岐はできない

{% include video_seek.html t="5:39" %}

モデルを作っている途中では、変数は値を持たないので、変数の値で処理を分けることはできません。
次のプログラムを実行すると TypeError になります。`if x == 1:` と書いても、RuntimeError でエラーになります（`==` は制約式を作るので、その真偽値は決まらない、というメッセージです）。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
if x:
    print("x is 1")
```

エラーのメッセージ（TypeError）：

```
TypeError: the truth value of a variable or expression is undefined: while the model is being built a variable has no value, so `if x:` / `x and y` cannot branch on it. To add a term only when x == 1 and y == 1, multiply them: x * y. To read a value from a solution, use sol(x).
```

`x` と `y` が両方 1 のときだけ足したいなら、積 `x * y` を使います（例：`f += 3 * x * y`）。
解の値で分岐したいときは、ソルバーで解いてから `sol(x)` で値を読み出して使います（例：`if sol(x) == 1:`）。

## 整数変数

### integer= で作る

{% include video_seek.html t="6:35" %}

`qbpp.var` に `integer=` で範囲を指定すると整数変数になります。これをネイティブ整数変数と呼びます。
式の中でも 1 つの整数変数のまま扱われ、ソルバーは整数の値を直接動かして探します。範囲にはマイナスの値も使えます。

```python
import pyqbpp as qbpp

n = qbpp.var("n", integer=(0, 10))
print("n =", n)
f = 3 * n + 1
print("f =", f)
print("f(4) =", f({n: 4}))
```

出力：

```
n = n
f = 1 +3*n
f(4) = 13
```

詳しくは[整数変数](INTEGER)をご覧ください。

### between= で作る

{% include video_seek.html t="7:48" %}

`between=` で範囲を指定すると、整数を 0 か 1 の変数の重み付きの和で表します（バイナリエンコード）。
0〜10 では重みが 1, 2, 4, 3 の 4 つのバイナリ変数になります。最後の重みが 8 でなく 3 なのは、最大をちょうど 10 にするためです。
下限が 0 でないときは、下限が定数として加わります。

```python
import pyqbpp as qbpp

m = qbpp.var("m", between=(0, 10))
print("m =", m)
k = qbpp.var("k", between=(-5, 5))
print("k =", k)
```

出力：

```
m = m[0] +2*m[1] +4*m[2] +3*m[3]
k = -5 +k[0] +2*k[1] +4*k[2] +3*k[3]
```

詳しくは[バイナリエンコードの整数変数](BINARY_INTEGER)をご覧ください。

### 2 種類の整数変数

{% include video_seek.html t="9:10" %}

| | `integer=(0, 10)` | `between=(0, 10)` |
|---|---|---|
| 表示 | `n` | `m[0] +2*m[1] +4*m[2] +3*m[3]` |
| 中身 | 整数変数 1 つ | バイナリ変数 4 つ |
| ソルバーは | 整数の値を直接動かす | 0/1 の変数を動かす |
| 範囲を広げると | 変数は増えない | 変数が増える（0〜1000 で 10 個） |
| 使いどころ | 個数や時刻などの量（ふだんはこちら） | 0/1 の変数だけの式が必要なとき |

## 変数の配列

{% include video_seek.html t="10:02" %}

`qbpp.var` に `shape` を指定すると変数の配列ができます。角かっこで番号を指定すると、1 つの変数を取り出せます。番号は 0 から始まります。

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=5)
print(x)
print(x[2])
```

出力：

```
[x[0], x[1], x[2], x[3], x[4]]
x[2]
```

詳しくは[配列](VECTOR)をご覧ください。

## 多次元の配列

### 2 次元の配列

{% include video_seek.html t="10:45" %}

`shape` にタプルで大きさを並べると多次元の配列になります。`x.shape` で配列の形が分かります。
$i$ 行 $j$ 列の変数は `x[i][j]` で取り出します。`x[i, j]` と書いても同じです。

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(3, 4))
print(x.shape)
print(x[1][2], x[1, 2])
```

出力：

```
(3, 4)
x[1][2] x[1][2]
```

### 行と列を取り出す

{% include video_seek.html t="11:36" %}

番号を 1 つだけ指定すると、その行の配列が取り出せます。列は `x[:, 2]` のように書きます。
`qbpp.sum` で、行や列の変数の合計の式が作れます。

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(3, 4))
print(x[1])
print(x[:, 2])
print(qbpp.sum(x[1]))
```

出力：

```
[x[1][0], x[1][1], x[1][2], x[1][3]]
[x[0][2], x[1][2], x[2][2]]
x[1][0] +x[1][1] +x[1][2] +x[1][3]
```

詳しくは[多次元変数](MULTIDIM)、[総和関数](SUM)をご覧ください。

### 3 次元以上の配列

{% include video_seek.html t="12:27" %}

`shape` を `(2, 3, 4)` にすると、変数は 24 個です。3 行 4 列の格子が `y[0]` と `y[1]` の 2 枚あると考えると分かりやすいです。
番号を途中まで指定すると、残りの軸の配列が取り出せます。
たとえば「$d$ 日目に $p$ さんが仕事 $k$ をするか」を `y[d][p][k]` という 1 つの変数で表せます。

```python
import pyqbpp as qbpp

y = qbpp.var("y", shape=(2, 3, 4))
print(y.shape)
print(y[1][2][3])
print(y[1][2])
```

出力：

```
(2, 3, 4)
y[1][2][3]
[y[1][2][0], y[1][2][1], y[1][2][2], y[1][2][3]]
```

### 整数変数の配列

{% include video_seek.html t="13:31" %}

`shape` と `integer=` を一緒に指定すると、整数変数の配列になります。`between=` でも同じです。
`between=` で作った要素はバイナリ変数の重み付きの和で、バイナリ変数の名前には `m[0][1]` のように番号が 1 つ増えて付きます。

```python
import pyqbpp as qbpp

n = qbpp.var("n", shape=3, integer=(0, 5))
print(n)
m = qbpp.var("m", shape=3, between=(0, 5))
print(m[0])
```

出力：

```
[n[0], n[1], n[2]]
m[0][0] +2*m[0][1] +2*m[0][2]
```

詳しくは[整数変数](INTEGER)をご覧ください。

## 式を作る

### 演算子で組み合わせる

{% include video_seek.html t="14:28" %}

変数を、たし算・ひき算・かけ算とかっこで組み合わせると式になります。整数の係数や定数も書けます。
式は作られたその場で展開されます。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
f = (x + 2 * y - 1) * (y - z)
print("f =", f)
```

出力：

```
f = -y +z +2*y*y -2*y*z +x*y -x*z
```

詳しくは[演算子と関数](OPERATOR)をご覧ください。

### 積和形

{% include video_seek.html t="15:30" %}

さきほどの `f` は 6 つの項の和です。項は、整数の係数と変数の積です。
項に含まれる変数の個数を次数といい、変数を含まない項は定数項です（この `f` にはありません）。
項の和で表したこの形を積和形といい、すべての式は内部でこの形で保持されます。

| 項 | 係数 | 変数の積 | 次数 |
|---|---:|---|---:|
| `-y` | −1 | `y` | 1 |
| `z` | 1 | `z` | 1 |
| `2*y*y` | 2 | `y*y` | 2 |
| `-2*y*z` | −2 | `y*z` | 2 |
| `x*y` | 1 | `x*y` | 2 |
| `-x*z` | −1 | `x*z` | 2 |

`y*y` のような同じ変数の積は、まだそのまま残っています。整理する方法は「式の整理」の章で紹介します。

## 複合代入とループ

### 複合代入

{% include video_seek.html t="16:27" %}

`+=`・`-=`・`*=` は、式をその場で書き換えます。0 から始めて `+=` で足し、`-=` で引いていく形はよく使われます。
`*=` で掛けた結果も、すぐに展開されます。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
g = 0
g += x
g -= 2 * y
print("g =", g)
g *= z + 1
print("g =", g)
```

出力：

```
g = x -2*y
g = x -2*y +x*z -2*y*z
```

### ループで式を組み立てる

{% include video_seek.html t="17:21" %}

数式のシグマ $f = \sum_{i=0}^{4} w_i x_i$ は、0 から始めてループで足していけば書けます。
係数には、Python のリストの値をそのまま使えます。係数が 1 の項は、係数を省いて表示されます。

```python
import pyqbpp as qbpp

w = [3, 1, 4, 1, 5]
x = qbpp.var("x", shape=5)
f = 0
for i in range(5):
    f += w[i] * x[i]
print("f =", f)
```

出力：

```
f = 3*x[0] +x[1] +4*x[2] +x[3] +5*x[4]
```

## 2 乗と多項式

### qbpp.sqr

{% include video_seek.html t="18:23" %}

2 乗は `qbpp.sqr` で書けます。同じ式を 2 回掛けたものと同じ多項式で、表示が違うのは展開のしかたが違うためです（整理すると同じになります）。
差を 2 乗した式は等しいときだけ 0、それ以外では正なので、ある式をある値にしたいときによく使います。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
h = qbpp.sqr(x + y - 1)
print("h =", h)
print("h =", (x + y - 1) * (x + y - 1))
```

出力：

```
h = 1 +x*x -2*x +2*x*y +y*y -2*y
h = 1 -x -y -x -y +x*x +x*y +y*x +y*y
```

### 一般の多項式

{% include video_seek.html t="19:27" %}

3 次以上の項もそのまま書けます。整数変数もバイナリ変数と同じように式の中で使え、
整数変数の 2 乗 `n*n` や、整数変数とバイナリ変数の積 `n*x` も項になります。定数項の 9 は $(-3)^2$ から来ています。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
t = 2 * x * y * z
print("t =", t)
n = qbpp.var("n", integer=(0, 10))
p = qbpp.sqr(n - 3) + 5 * n * x
print("p =", p)
```

出力：

```
t = 2*x*y*z
p = 9 +n*n -6*n +5*n*x
```

## 式の整理

### simplify

{% include video_seek.html t="20:28" %}

`-2*x*y` と `3*y*x` は、変数の順番が違うだけの同じ項です。
`qbpp.simplify` は、項の中の変数を並べ替え、同じ項をまとめ、係数が 0 になった項を消します。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = qbpp.sqr(x - y) + 3 * y * x
print("f =", f)
print("simplify()           :", qbpp.simplify(f))
```

出力：

```
f = x*x -2*x*y +y*y +3*y*x
simplify()           : x*x +x*y +y*y
```

### simplify_as_binary

{% include video_seek.html t="21:29" %}

0 か 1 の変数は 2 乗しても値が変わらないので、`x*x` は `x` と同じです。
`qbpp.simplify_as_binary` は、simplify の整理に加えてこの性質も使います。ソルバーに渡す前には、`simplify_as_binary` で式を整理しておきます。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = qbpp.sqr(x - y) + 3 * y * x
print("f =", f)
print("simplify()           :", qbpp.simplify(f))
print("simplify_as_binary() :", qbpp.simplify_as_binary(f))
```

出力：

```
f = x*x -2*x*y +y*y +3*y*x
simplify()           : x*x +x*y +y*y
simplify_as_binary() : x +y +x*y
```

詳しくは[変数と式](VARIABLE)をご覧ください。

### 整数変数を含む式

{% include video_seek.html t="22:23" %}

整数変数を含む式でも `simplify_as_binary` を使います。バイナリの規則はバイナリ変数にだけ使われるので、
`x*x` は `x` になりますが、整数変数の `n*n` はそのまま残ります（$n = 3$ なら 2 乗は 9 で、3 ではないからです）。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
n = qbpp.var("n", integer=(0, 10))
g = qbpp.sqr(n - x)
print("g =", g)
print("simplify_as_binary() :", qbpp.simplify_as_binary(g))
```

出力：

```
g = n*n -2*n*x +x*x
simplify_as_binary() : x -2*x*n +n*n
```

### 2 通りの呼び方

{% include video_seek.html t="23:12" %}

関数 `qbpp.simplify_as_binary(f)` は整理した新しい式を返し、`f` はそのままです。
メソッド `f.simplify_as_binary()` は `f` 自身を書き換えます。simplify も同じ 2 通りの呼び方ができます。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = qbpp.sqr(x - y) + 3 * y * x
g = qbpp.simplify_as_binary(f)
print("f =", f)
print("g =", g)
f.simplify_as_binary()
print("f =", f)
```

出力：

```
f = x*x -2*x*y +y*y +3*y*x
g = x +y +x*y
f = x +y +x*y
```

詳しくは[クイックリファレンス: 演算](QR_OPERATION)をご覧ください。

## ソルバーと解

### 式を最小にする割り当て

{% include video_seek.html t="24:15" %}

式の値は、変数への割り当てで決まります。この `f` は $x+y+z$ が 2 のときに小さくなり、$x$ と $y$ が両方 1 だと 1 増えます。
ソルバーは、式の値が最小になる割り当てを探します。式の値はエネルギーとも呼びます。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
f = qbpp.sqr(x + y + z - 2) + x * y
f.simplify_as_binary()
print("f =", f)
```

出力：

```
f = 4 -3*x -3*y -3*z +3*x*y +2*x*z +2*y*z
```

3 つの変数の割り当ては $2^3 = 8$ 通りです。$f$ が最小の 0 になるのは $(0, 1, 1)$ と $(1, 0, 1)$ の 2 通りです。

| x | y | z | f |
|---:|---:|---:|---:|
| 0 | 0 | 0 | 4 |
| 0 | 0 | 1 | 1 |
| 0 | 1 | 0 | 1 |
| 0 | 1 | 1 | 0 |
| 1 | 0 | 0 | 1 |
| 1 | 0 | 1 | 0 |
| 1 | 1 | 0 | 1 |
| 1 | 1 | 1 | 2 |

### EasySolver で解く

{% include video_seek.html t="25:25" %}

`qbpp.EasySolver(f)` でソルバーを作り、`search` で探索すると、見つかった解が返ります。
`time_limit` は探索する最長の時間（秒）です。解を `print` すると、エネルギーと各変数の値が表示されます。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
f = qbpp.sqr(x + y + z - 2) + x * y
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1)
print(sol)
```

動画での出力（最適解は 2 つあるので、実行ごとに結果が変わることがあります）：

```
Sol(energy=0, {x: 1, y: 0, z: 1})
```

詳しくは[式の求解](SOLVE)、[Easy Solver](EASYSOLVER)をご覧ください。

### 解から値を読む

{% include video_seek.html t="26:22" %}

`sol(x)` と `x(sol)` は、どちらも解での変数 `x` の値です。`sol.energy` は解のエネルギーです。
式に `sol` を渡すと、解での式の値が計算されます（`f(sol)` と `sol(f)` のどちらでもかまいません）。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
f = qbpp.sqr(x + y + z - 2) + x * y
f.simplify_as_binary()
solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1)

print("sol(x), x(sol) =", sol(x), x(sol))
print("x, y, z =", sol(x), sol(y), sol(z))
print("energy =", sol.energy)
print("f(sol), sol(f) =", f(sol), sol(f))
print("x + y + z =", sol(x + y + z))
```

動画での出力（最適解は 2 つあるので、もう一方の $(0, 1, 1)$ が返ることもあります）：

```
sol(x), x(sol) = 1 1
x, y, z = 1 0 1
energy = 0
f(sol), sol(f) = 0 0
x + y + z = 2
```

詳しくは[クイックリファレンス: 解](QR_SOLUTION)をご覧ください。

## 例題：絵を復元するパズル

### パズル

{% include video_seek.html t="27:36" %}

5 行 5 列のマス目のいくつかを塗ります。各行で塗るマスの数は上から 1, 3, 5, 1, 1、
各列で塗るマスの数は左から 1, 2, 5, 2, 1 です。どのマスを塗れば、すべての数を満たすでしょうか。

### 式で表す

{% include video_seek.html t="28:12" %}

マスごとにバイナリ変数 $x_{i,j}$ を用意し、1 なら $i$ 行 $j$ 列のマスを塗ることにします。
行 $i$ で塗るマスの数 $r_i$、列 $j$ で塗るマスの数 $c_j$ との差を 2 乗して、すべて足します。

$$
f = \sum_{i=0}^{4} \Bigl(\sum_{j=0}^{4} x_{i,j} - r_i\Bigr)^2 + \sum_{j=0}^{4} \Bigl(\sum_{i=0}^{4} x_{i,j} - c_j\Bigr)^2
$$

どの項も 0 以上なので、すべての数が合うときだけ $f$ は 0 になります。$f$ を最小にする割り当てが答えです。

### プログラム

{% include video_seek.html t="29:09" %}

`x[i]` で $i$ 行目、`x[:, j]` で $j$ 列目を取り出して合計します。`term_count()` は式の項の数（定数項を除く）です。
整理した `f` は 1 次の項 25 個と 2 次の項 100 個の 125 項で、定数の 72 は指定した数の 2 乗の和です（動画では `f` の先頭だけを見せています）。

```python
import pyqbpp as qbpp

row = [1, 3, 5, 1, 1]
col = [1, 2, 5, 2, 1]
x = qbpp.var("x", shape=(5, 5))
f = 0
for i in range(5):
    f += qbpp.sqr(qbpp.sum(x[i]) - row[i])
for j in range(5):
    f += qbpp.sqr(qbpp.sum(x[:, j]) - col[j])
f.simplify_as_binary()
print("terms =", f.term_count())
print("f =", f)
```

出力：

```
terms = 125
f = 72 -2*x[0][0] -4*x[0][1] -10*x[0][2] -4*x[0][3] -2*x[0][4] -6*x[1][0] -8*x[1][1] -14*x[1][2] -8*x[1][3] -6*x[1][4] -10*x[2][0] -12*x[2][1] -18*x[2][2] -12*x[2][3] -10*x[2][4] -2*x[3][0] -4*x[3][1] -10*x[3][2] -4*x[3][3] -2*x[3][4] -2*x[4][0] -4*x[4][1] -10*x[4][2] -4*x[4][3] -2*x[4][4] +2*x[0][0]*x[0][1] +2*x[0][0]*x[0][2] +2*x[0][0]*x[0][3] +2*x[0][0]*x[0][4] +2*x[0][0]*x[1][0] +2*x[0][0]*x[2][0] +2*x[0][0]*x[3][0] +2*x[0][0]*x[4][0] +2*x[0][1]*x[0][2] +2*x[0][1]*x[0][3] +2*x[0][1]*x[0][4] +2*x[0][1]*x[1][1] +2*x[0][1]*x[2][1] +2*x[0][1]*x[3][1] +2*x[0][1]*x[4][1] +2*x[0][2]*x[0][3] +2*x[0][2]*x[0][4] +2*x[0][2]*x[1][2] +2*x[0][2]*x[2][2] +2*x[0][2]*x[3][2] +2*x[0][2]*x[4][2] +2*x[0][3]*x[0][4] +2*x[0][3]*x[1][3] +2*x[0][3]*x[2][3] +2*x[0][3]*x[3][3] +2*x[0][3]*x[4][3] +2*x[0][4]*x[1][4] +2*x[0][4]*x[2][4] +2*x[0][4]*x[3][4] +2*x[0][4]*x[4][4] +2*x[1][0]*x[1][1] +2*x[1][0]*x[1][2] +2*x[1][0]*x[1][3] +2*x[1][0]*x[1][4] +2*x[1][0]*x[2][0] +2*x[1][0]*x[3][0] +2*x[1][0]*x[4][0] +2*x[1][1]*x[1][2] +2*x[1][1]*x[1][3] +2*x[1][1]*x[1][4] +2*x[1][1]*x[2][1] +2*x[1][1]*x[3][1] +2*x[1][1]*x[4][1] +2*x[1][2]*x[1][3] +2*x[1][2]*x[1][4] +2*x[1][2]*x[2][2] +2*x[1][2]*x[3][2] +2*x[1][2]*x[4][2] +2*x[1][3]*x[1][4] +2*x[1][3]*x[2][3] +2*x[1][3]*x[3][3] +2*x[1][3]*x[4][3] +2*x[1][4]*x[2][4] +2*x[1][4]*x[3][4] +2*x[1][4]*x[4][4] +2*x[2][0]*x[2][1] +2*x[2][0]*x[2][2] +2*x[2][0]*x[2][3] +2*x[2][0]*x[2][4] +2*x[2][0]*x[3][0] +2*x[2][0]*x[4][0] +2*x[2][1]*x[2][2] +2*x[2][1]*x[2][3] +2*x[2][1]*x[2][4] +2*x[2][1]*x[3][1] +2*x[2][1]*x[4][1] +2*x[2][2]*x[2][3] +2*x[2][2]*x[2][4] +2*x[2][2]*x[3][2] +2*x[2][2]*x[4][2] +2*x[2][3]*x[2][4] +2*x[2][3]*x[3][3] +2*x[2][3]*x[4][3] +2*x[2][4]*x[3][4] +2*x[2][4]*x[4][4] +2*x[3][0]*x[3][1] +2*x[3][0]*x[3][2] +2*x[3][0]*x[3][3] +2*x[3][0]*x[3][4] +2*x[3][0]*x[4][0] +2*x[3][1]*x[3][2] +2*x[3][1]*x[3][3] +2*x[3][1]*x[3][4] +2*x[3][1]*x[4][1] +2*x[3][2]*x[3][3] +2*x[3][2]*x[3][4] +2*x[3][2]*x[4][2] +2*x[3][3]*x[3][4] +2*x[3][3]*x[4][3] +2*x[3][4]*x[4][4] +2*x[4][0]*x[4][1] +2*x[4][0]*x[4][2] +2*x[4][0]*x[4][3] +2*x[4][0]*x[4][4] +2*x[4][1]*x[4][2] +2*x[4][1]*x[4][3] +2*x[4][1]*x[4][4] +2*x[4][2]*x[4][3] +2*x[4][2]*x[4][4] +2*x[4][3]*x[4][4]
```

### EasySolver で解く

{% include video_seek.html t="30:28" %}

`target_energy=0` を指定すると、エネルギー 0 の解が見つかった時点で探索を止めます。
`sol` に配列を渡すと、値が同じ形の配列で返ります。1 のマスを `#`、0 のマスを `.` にして表示すると、木の絵が現れます。

```python
import pyqbpp as qbpp

row = [1, 3, 5, 1, 1]
col = [1, 2, 5, 2, 1]
x = qbpp.var("x", shape=(5, 5))
f = 0
for i in range(5):
    f += qbpp.sqr(qbpp.sum(x[i]) - row[i])
for j in range(5):
    f += qbpp.sqr(qbpp.sum(x[:, j]) - col[j])
f.simplify_as_binary()

sol = qbpp.EasySolver(f).search(time_limit=10, target_energy=0)
print("energy =", sol.energy)
print(sol(x))
for i in range(5):
    print("".join("#" if sol(x[i][j]) == 1 else "." for j in range(5)))
```

動画での出力（EasySolver の結果は実行ごとに変わることがあります）：

```
energy = 0
[[0, 0, 1, 0, 0], [0, 1, 1, 1, 0], [1, 1, 1, 1, 1], [0, 0, 1, 0, 0], [0, 0, 1, 0, 0]]
..#..
.###.
#####
..#..
..#..
```

### 答えはほかにある？

{% include video_seek.html t="31:17" %}

`ExhaustiveSolver` は、すべての割り当て（変数 25 個で $2^{25}$、およそ 3400 万通り）を調べるソルバーです。
`best_energy_sols=0` を指定すると最適解をすべて集め、`sol.sols` に入ります。答えはこの木の絵の 1 つだけでした。

```python
import pyqbpp as qbpp

row = [1, 3, 5, 1, 1]
col = [1, 2, 5, 2, 1]
x = qbpp.var("x", shape=(5, 5))
f = 0
for i in range(5):
    f += qbpp.sqr(qbpp.sum(x[i]) - row[i])
for j in range(5):
    f += qbpp.sqr(qbpp.sum(x[:, j]) - col[j])
f.simplify_as_binary()

sol = qbpp.ExhaustiveSolver(f).search(best_energy_sols=0)
print("solutions =", len(sol.sols))
```

出力：

```
solutions = 1
```

詳しくは[Exhaustive Solver](EXHAUSTIVE)をご覧ください。

## 例題：硬貨の支払い

### 問題

{% include video_seek.html t="31:58" %}

財布に、500 円玉が 1 枚、100 円玉が 3 枚、50 円玉が 4 枚、10 円玉が 8 枚あります。
この財布から 780 円を、おつりが出ないようにちょうど払います。財布の小銭を減らしたいので、払う硬貨の枚数はできるだけ多くします。

### 払う枚数を整数変数にする

{% include video_seek.html t="32:44" %}

払う枚数を硬貨ごとに整数変数にします。範囲は 0 から財布に持っている枚数までです。
支払額の式を `pay`、払う枚数の式を `count` に入れておくと、あとの式で何度でも使い回せます。

```python
import pyqbpp as qbpp

n500 = qbpp.var("n500", integer=(0, 1))
n100 = qbpp.var("n100", integer=(0, 3))
n50 = qbpp.var("n50", integer=(0, 4))
n10 = qbpp.var("n10", integer=(0, 8))
pay = 500 * n500 + 100 * n100 + 50 * n50 + 10 * n10
count = n500 + n100 + n50 + n10
print("pay =", pay)
print("count =", count)
```

出力：

```
pay = 500*n500 +100*n100 +50*n50 +10*n10
count = n500 +n100 +n50 +n10
```

### 最小にする式

{% include video_seek.html t="33:38" %}

$f = (\text{pay} - 780)^2 - \text{count}$ です。1 つ目はちょうど 780 円のときだけ 0、2 つ目は枚数が多いほど小さくなります。
2 つ目に重みは付けていません。支払額は 10 円単位なので、ずれると 1 つ目は 100 以上になり、
枚数は多くても 16 枚なので 2 つ目で減るのは 16 までだからです。

```python
import pyqbpp as qbpp

n500 = qbpp.var("n500", integer=(0, 1))
n100 = qbpp.var("n100", integer=(0, 3))
n50 = qbpp.var("n50", integer=(0, 4))
n10 = qbpp.var("n10", integer=(0, 8))
pay = 500 * n500 + 100 * n100 + 50 * n50 + 10 * n10
count = n500 + n100 + n50 + n10

f = qbpp.sqr(pay - 780) - count
f.simplify_as_binary()
```

### 整理した式

{% include video_seek.html t="34:42" %}

定数の 608400 は 780 の 2 乗、`n500` の係数 −780001 は、2 乗から出る −780000 と `count` から出る −1 の和です。
整数変数の 2 乗（`n500*n500` など）はそのまま残ります。整数変数 4 個、項 14 個の小さな式です。

```python
import pyqbpp as qbpp

n500 = qbpp.var("n500", integer=(0, 1))
n100 = qbpp.var("n100", integer=(0, 3))
n50 = qbpp.var("n50", integer=(0, 4))
n10 = qbpp.var("n10", integer=(0, 8))
pay = 500 * n500 + 100 * n100 + 50 * n50 + 10 * n10
count = n500 + n100 + n50 + n10
f = qbpp.sqr(pay - 780) - count
f.simplify_as_binary()

print("terms =", f.term_count())
print("f =", f)
```

出力：

```
terms = 14
f = 608400 -780001*n500 -156001*n100 -78001*n50 -15601*n10 +250000*n500*n500 +100000*n500*n100 +50000*n500*n50 +10000*n500*n10 +10000*n100*n100 +10000*n100*n50 +2000*n100*n10 +2500*n50*n50 +1000*n50*n10 +100*n10*n10
```

### EasySolver で解く

{% include video_seek.html t="35:34" %}

500 円玉 1 枚、50 円玉 4 枚、10 円玉 8 枚の合わせて 13 枚で、100 円玉は使いません。
エネルギーの −13 は、1 つ目の部分が 0、2 つ目の部分が −13 だからです。

```python
import pyqbpp as qbpp

n500 = qbpp.var("n500", integer=(0, 1))
n100 = qbpp.var("n100", integer=(0, 3))
n50 = qbpp.var("n50", integer=(0, 4))
n10 = qbpp.var("n10", integer=(0, 8))
pay = 500 * n500 + 100 * n100 + 50 * n50 + 10 * n10
count = n500 + n100 + n50 + n10
f = qbpp.sqr(pay - 780) - count
f.simplify_as_binary()

sol = qbpp.EasySolver(f).search(time_limit=1)
print(sol)
print("pay =", sol(pay), "count =", sol(count))
```

動画での出力（EasySolver の結果は実行ごとに変わることがあります）：

```
Sol(energy=-13, {n500: 1, n100: 0, n50: 4, n10: 8})
pay = 780 count = 13
```

### between= で書くと

{% include video_seek.html t="36:25" %}

変数を作る 4 つの行を `between=` に書き換えると、バイナリ変数 10 個・項 55 個になります（`integer=` では整数変数 4 個・項 14 個）。
答えは同じで、解の表示にはバイナリ変数の値が並びます。`sol(n10)` のように整数変数を渡せば、整数の値が得られます。
整数の量を扱うときは、`integer=` のほうが式が小さく済みます。

```python
import pyqbpp as qbpp

n500 = qbpp.var("n500", between=(0, 1))
n100 = qbpp.var("n100", between=(0, 3))
n50 = qbpp.var("n50", between=(0, 4))
n10 = qbpp.var("n10", between=(0, 8))
pay = 500 * n500 + 100 * n100 + 50 * n50 + 10 * n10
count = n500 + n100 + n50 + n10
f = qbpp.sqr(pay - 780) - count
f.simplify_as_binary()
print("terms =", f.term_count())
print("n10 =", n10)

sol = qbpp.EasySolver(f).search(time_limit=1)
print(sol)
print("n10 =", sol(n10))
```

動画での出力（EasySolver の結果は実行ごとに変わることがあります）：

```
terms = 55
n10 = n10[0] +2*n10[1] +4*n10[2] +n10[3]
Sol(energy=-13, {n500: 1, n100[0]: 0, n100[1]: 0, n50[0]: 1, n50[1]: 1, n50[2]: 1, n10[0]: 1, n10[1]: 1, n10[2]: 1, n10[3]: 1})
n10 = 8
```

詳しくは[整数変数](INTEGER)をご覧ください。

## まとめ

{% include video_seek.html t="37:31" %}

- `qbpp.var` で作る変数は、値を持たない記号です。変数の値は、ソルバーが決めます。
- 整数変数は `integer=` か `between=` で、配列は `shape` で作ります。`between=` で作った変数は、バイナリ変数の重み付きの和です。
- 変数を演算子で組み合わせると、積和形の多項式になります。変数に値を与えて、式の値を計算することもできます。
- `simplify_as_binary` などで整理してソルバーに渡すと、式の値を最小にする割り当てが、解として返ります。
- 解は `sol` で読みます。変数と `sol` は、どちらの順で書いてもかまいません。
