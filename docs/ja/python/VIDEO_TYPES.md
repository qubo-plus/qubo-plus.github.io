---
last_modified: 2026-10-26
layout: default
nav_exclude: true
title: "動画：係数とエネルギーの型"
description: "動画「QUBO++ 係数とエネルギーの型（Python）」の章ごとの要点と、動画に出てくるプログラムと出力。"
lang: ja
hreflang_alt: "en/python/VIDEO_TYPES"
hreflang_lang: "en"
video: types
---

# 動画：係数とエネルギーの型（Python）

動画「QUBO++ 係数とエネルギーの型（Python）」の手引きです。
章ごとに、要点と動画に出てくるプログラム・出力、詳しい説明のページへのリンクをまとめています。
「▶ 動画の … から再生」をクリックすると、その場面から再生します。
動画では一部を省略して見せているプログラムも、ここではそのまま実行できる形で載せています。

{% include video_embed.html slug="types" %}

この動画で扱うこと：

- インポートするモジュールで、係数とエネルギーの型を選ぶ
- 型に収まらない値が黙って折り返して、誤った答えになる例（オーバーフロー）と、書いた数の入力のチェック
- 桁数に制限のない型 `cppint` と、整数変数の範囲と型の関係
- 実数の係数（`pyqbpp.d`）と、ソルバーが解く整数の式を `qbpp.quantize` で確かめる方法
- 接尾辞 `m2`・`m4` で項の最大次数を決める方法と、型の選び方

[動画（チュートリアル）](../VIDEOS)の一覧に戻る

## 型を選ぶ

{% include video_seek.html t="2:40" %}

PyQBPP では、インポートするモジュールで整数の型が決まります。既定の `pyqbpp` は `c32e64`（係数が 32 ビット、エネルギーが 64 ビット）です。
係数は変数に掛かる数、エネルギーは式の値です。$f = 3xy + 5$ なら 3 が係数、5 は定数で、$x = y = 1$ のときのエネルギーは 8 です（定数もエネルギーの型で持ちます）。
1 つのプログラムでは、どれか 1 つだけをインポートします。2 つ目の型を使った時点で `ImportError` になります。

```python
import pyqbpp as qbpp           # 既定（c32e64）
# import pyqbpp.c64e64 as qbpp  # 64 ビット係数
# import pyqbpp.cppint as qbpp  # 制限なし
```

| モジュール | 係数 | エネルギー |
|---|---:|---:|
| `pyqbpp.c32e32` | 32 ビット | 32 ビット |
| `pyqbpp.c32e64`（既定の `pyqbpp`） | 32 ビット | 64 ビット |
| `pyqbpp.c64e64` | 64 ビット | 64 ビット |
| `pyqbpp.c64e128` | 64 ビット | 128 ビット |
| `pyqbpp.c128e128` | 128 ビット | 128 ビット |
| `pyqbpp.cppint` | 制限なし | 制限なし |

ビット数が小さいほど速く動きますが、値があふれやすくなります。型を変えるときは、インポートの行を書き換えるだけです。

詳しくは[変数と式](VAREXPR)をご覧ください。

## オーバーフロー

### 係数が黙って折り返す

{% include video_seek.html t="4:45" %}

$(100000x + 100000y - 150000)^2$ を展開すると、$x$ と $y$ の係数は $-2\times 10^{10}$、$xy$ の係数は $2\times 10^{10}$ になるはずです。
32 ビットの係数が表せるのはおよそ ±21 億までなので、値があふれて、エラーも警告も出ずに折り返されます（$-2\times 10^{10} + 5\times 2^{32} = 1474836480$）。
定数 225 億は 64 ビットのエネルギーの型に収まるので正しいままです。
ソルバーはこの誤った式を解き、どちらも 0 の解を返します。本当の最小値は 25 億で、最適解は 3 つあります。
225 億は (0, 0) の正しい値でもあるので、出力を見ただけでは誤りに気づきません。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = qbpp.sqr(100000 * x + 100000 * y - 150000)
f.simplify_as_binary()
print(f)
sol = qbpp.ExhaustiveSolver(f).search(best_energy_sols=0)
for s in sol.sols:
    print(s.energy, s(x), s(y))
```

出力：

```
22500000000 +1474836480*x +1474836480*y -1474836480*x*y
22500000000 0 0
```

### 型を変えて解き直す

{% include video_seek.html t="8:00" %}

インポートを `pyqbpp.c64e64`（係数も 64 ビット）に変えるだけで、係数は正しく $-2\times 10^{10}$ になり、最適解が 3 つ得られます。
計算の途中の値（展開・和・積、ソルバーの中）は、速さのためにチェックしません。
係数やエネルギーの大きさを見積もって、収まる型を選びます。

```python
import pyqbpp.c64e64 as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = qbpp.sqr(100000 * x + 100000 * y - 150000)
f.simplify_as_binary()
print(f)
sol = qbpp.ExhaustiveSolver(f).search(best_energy_sols=0)
for s in sol.sols:
    print(s.energy, s(x), s(y))
```

出力：

```
22500000000 -20000000000*x -20000000000*y +20000000000*x*y
2500000000 1 0
2500000000 0 1
2500000000 1 1
```

## 入力のチェック

{% include video_seek.html t="9:52" %}

プログラムに書いた数は、入力したときにチェックされます。どの型でチェックするかは、数の使い方で決まります。

- 変数に掛ける数と、整数の配列（`qbpp.array`）の値は、係数の型
- 定数と、制約の値は、エネルギーの型

既定の `c32e64` では、$2^{40}$ は定数や制約の値としては使えますが、$2^{31}$ を変数に掛けると係数の型（int32）に収まらず、$2^{63}$ を定数として足すとエネルギーの型（int64）にも収まりません。
収まらないときはオーバーフローのエラーになります（意図したエラーの例。`try` と `except` で受け止めて、メッセージを表示しています）。メッセージは、もっと広い型を案内します。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
print(x + 2**40)
print(qbpp.cons(x == 2**40))
try:
    print(2**31 * x)
except OverflowError as e:
    print("OverflowError:", e)
try:
    print(x + 2**63)
except OverflowError as e:
    print("OverflowError:", e)
```

出力：

```
1099511627776 +x
cons(x == 1099511627776)
OverflowError: coefficient 2147483648 is out of range for this variant (coeff_t = int32). Use a wider variant such as pyqbpp.c64e64 / pyqbpp.c128e128 / pyqbpp.cppint.
OverflowError: constant 9223372036854775808 is out of range for this variant (energy_t = int64). Use a wider variant such as pyqbpp.c64e128 / pyqbpp.c128e128 / pyqbpp.cppint.
```

チェックされるのは書いた数だけです。前のプログラムの $-2\times 10^{10}$ は展開の途中でできた値なので、チェックされませんでした。

## cppint

{% include video_seek.html t="12:54" %}

`pyqbpp.cppint` は、係数とエネルギーの桁数に制限のない型です。Python の整数と同じで、オーバーフローしません。
$(10^{30}x - 3\times 10^{29})^2$ を展開すると、定数 $9\times 10^{58}$（59 桁）と $x$ の係数 $4\times 10^{59}$（60 桁）が正確に計算されます。
ただし、固定長の型より遅く、GPU も使いません（ExhaustiveSolver と ABS3Solver も CPU だけで解きます）。
大きさを見積もれないときや、固定長の型で得た結果を確かめたいときに使います。

```python
import pyqbpp.cppint as qbpp

x = qbpp.var("x")
f = qbpp.sqr(10**30 * x - 3 * 10**29)
f.simplify_as_binary()
print(f)
```

出力：

```
90000000000000000000000000000000000000000000000000000000000 +400000000000000000000000000000000000000000000000000000000000*x
```

## 整数変数の範囲

{% include video_seek.html t="16:14" %}

`integer=` で作る整数変数は、範囲をエネルギーの型で持ちます。既定の `c32e64` でも、0〜$2^{40}$ のような広い範囲が使えます。
`between=` で作る整数変数はバイナリ変数の和で、係数 1, 2, 4, 3 は係数の型で持ちます。
`between=(0, 2**40)` では係数 $2^{31}$ が要り、32 ビットの係数に収まらないのでオーバーフローのエラーになります（意図したエラーの例）。メッセージは、広い型か `integer=` の整数変数を案内します。

```python
import pyqbpp as qbpp

n = qbpp.var("n", integer=(0, 2**40))
print(qbpp.cons(n <= 10**12))
v = qbpp.var("v", between=(0, 10))
print(v)
try:
    w = qbpp.var("w", between=(0, 2**40))
except OverflowError as e:
    print("OverflowError:", e)
```

出力：

```
cons(n <= 1000000000000)
v[0] +2*v[1] +4*v[2] +3*v[3]
OverflowError: between=(0, 1099511627776): the range needs the binary coefficient 2147483648, which is out of range for this variant (coeff_t = int32). Use a wider variant such as pyqbpp.c64e64 / pyqbpp.c128e128 / pyqbpp.cppint, or a native integer variable (integer=), whose range uses energy_t.
```

整数変数を制約に使うときは、エネルギーの大きさにも気をつけます。ペナルティは重み × 違反量の 2 乗なので、違反量が $2^{40}$ くらいなら $2^{80}$ くらいになり、64 ビットのエネルギーには入りません。
ソルバーの中の計算はチェックされないので、エネルギーが 128 ビットの `c64e128` などで余裕を持たせます。

詳しくは[整数変数と連立方程式の求解](INTEGER)をご覧ください。

## 実数の係数

### pyqbpp.d で小数のまま書く

{% include video_seek.html t="19:28" %}

`pyqbpp.d` では、係数もエネルギーも小数（Python の `float`）のまま書けます。
3 つの品物から、量（0.06, 0.05, 0.07）の合計が 0.1 以上になるように選び、コスト（0.3, 0.5, 0.4）を最小にします。

| 選ぶ品物 | 量の合計 | コスト |
|---|---:|---:|
| 0 番目と 1 番目 | 0.11 | 0.8 |
| 0 番目と 2 番目 | 0.13 | 0.7 |
| 1 番目と 2 番目 | 0.12 | 0.9 |
| 3 つとも | 0.18 | 1.2 |

品物を 1 つだけ選ぶと、量は 0.1 に届きません。最小は 0 番目と 2 番目の 0.7 です。

```python
import pyqbpp.d as qbpp

x = qbpp.var("x", 3)
f = 0.3 * x[0] + 0.5 * x[1] + 0.4 * x[2] + 1000 * qbpp.cons(
    0.06 * x[0] + 0.05 * x[1] + 0.07 * x[2] >= 0.1)
f.simplify_as_binary()
sol = qbpp.EasySolver(f).search()
print(sol)
```

動画での出力（EasySolver は実行ごとに結果が変わることがあります）：

```
Sol(energy=0.7, {x[0]: 1, x[1]: 0, x[2]: 1})
```

ソルバーは小数のままではなく、係数に倍率を掛けて整数に丸めてから解きます。この変換は自動です。

### quantize でソルバーが解く式を見る

{% include video_seek.html t="21:52" %}

`qbpp.quantize(f)` は、ソルバーが実際に解く整数の係数の式を返します。`g.scale` は目的関数に掛けた倍率です。
目的関数は $2^{58}$ 倍、制約は別の倍率 $2^{24}$ 倍して整数に丸めます。0.1 は $0.1\times 2^{24} = 1677721.6$ なので 1677722 になり、重み 1000 は 1024000 と表示されます。

```python
import math

import pyqbpp.d as qbpp

# f は前のプログラムと同じ
x = qbpp.var("x", 3)
f = 0.3 * x[0] + 0.5 * x[1] + 0.4 * x[2] + 1000 * qbpp.cons(
    0.06 * x[0] + 0.05 * x[1] + 0.07 * x[2] >= 0.1)
f.simplify_as_binary()
g = qbpp.quantize(f)
print(f"scale = 2^{math.log2(g.scale):g}")
print(g)
```

出力：

```
scale = 2^58
86469112845513520*x[0] +144115188075855872*x[1] +115292150460684704*x[2]
+1024000*cons(1006633*x[0] +838861*x[1] +1174405*x[2] >= 1677722)
```

詳しくは[クイックリファレンス: 変数と式](QR_VARIABLE)をご覧ください。

### モジュール名の意味

{% include video_seek.html t="23:22" %}

実数の係数のモジュール名は、`d` のあとに、量子化した後の整数の型の名前が続きます。
たとえば `dc64e128` は、小数で書いた式を、係数 64 ビット・エネルギー 128 ビットの整数の式に量子化して解きます。
どのモジュールも使い方は同じで、インポートの行（`import pyqbpp.dc64e128 as qbpp` など）を変えるだけです。

| モジュール | 量子化した後の型 | 使いどころ |
|---|---|---|
| `pyqbpp.d`（= `dc64e64`） | `c64e64` | 実数の係数の既定 |
| `pyqbpp.dc64e128` | `c64e128` | 係数の大小の開きが大きいとき。より正確で、探索の速さは `pyqbpp.d` とほぼ同じ |
| `pyqbpp.dc128e128` | `c128e128` | `dc64e128` でも精度が足りないときの最後の手段。探索は遅くなる |

### 元の式と量子化した式の判定

{% include video_seek.html t="25:50" %}

量子化すると小数は近い整数に丸められるので、制約の境界ちょうどの解では判定が分かれることがあります。
0 番目と 1 番目を選ぶと量の合計は 0.7 + 0.1 で、元の式 `f` では 0.7999999999999999（0.8 以下）なので満たし、`f.cons(sol)` は 0 です。
量子化した式 `g` では 5872026 + 838861 = 6710887 が範囲の 6710886 を 1 超えるので、`g.cons(sol)` は 1 です。
ソルバーが解くのは `g` なので、ソルバーと同じ判定が必要なときは `g` で評価します。
`tol` で許容誤差を指定すると、違反量が `tol` 以下なら満たしているとみなします（`g` の違反量は元の単位で $2^{-23}\approx 1.2\times 10^{-7}$）。`tol` は判定だけを変え、ソルバーが解く式は変わりません。

```python
import pyqbpp.d as qbpp

x = qbpp.var("x", 3)
f = -x[0] - x[1] - x[2] + 1000 * qbpp.cons(0.7 * x[0] + 0.1 * x[1] + 0.2 * x[2] <= 0.8)
f.simplify_as_binary()
g = qbpp.quantize(f)
print(g)
sol = qbpp.Sol(f).set({x[0]: 1, x[1]: 1, x[2]: 0})
print(f.cons(sol), g.cons(sol), g.cons(sol, tol=1e-6))
```

出力：

```
-72057594037927936*x[0] -72057594037927936*x[1] -72057594037927936*x[2]
+1024000*cons(5872026*x[0] +838861*x[1] +1677722*x[2] <= 6710886)
0 1 0
```

詳しくは[非線形関数とネイティブ制約](CONSTRAINTS)をご覧ください。

## 最大次数

{% include video_seek.html t="29:18" %}

型名の後ろに `m2` や `m4` を付けると、項の最大次数を固定できます。`m2` なら 2 次まで、`m4` なら 4 次までの項を作れます。
`pyqbpp.c32e64m2` で 3 次の項 `x[0] * x[1] * x[2]` を作ろうとするとエラーになります（意図したエラーの例。メッセージの最後の 2 が最大次数です）。
接尾辞を付けなければ、次数に制限はありません。最大次数が決まると式を速く作れますが、速くなるのは式の構築だけで、ソルバーの速さは変わりません。

```python
import pyqbpp.c32e64m2 as qbpp

x = qbpp.var("x", 3)
f = x[0] * x[1] + x[1] * x[2]
print(f)
try:
    g = x[0] * x[1] * x[2]
except RuntimeError as e:
    print("RuntimeError:", e)
```

出力：

```
x[0]*x[1] +x[1]*x[2]
RuntimeError: VarArray: degree exceeds MAXDEG capacity (2)
```

## 選び方

{% include video_seek.html t="31:30" %}

| 状況 | モジュール | 補足 |
|---|---|---|
| まずは | `pyqbpp` | 既定は `c32e64` |
| 係数が約 $\pm 2.1\times 10^{9}$ を超えそう | `pyqbpp.c64e64` | |
| エネルギーが約 $\pm 9.2\times 10^{18}$ を超えそう | `pyqbpp.c64e128` | 係数も広げるなら `c128e128` |
| 大きさを見積もれない・結果を確かめたい | `pyqbpp.cppint` | 遅い。GPU は使わない |
| 係数が小数 | `pyqbpp.d` | 倍率を掛けて整数に量子化 |
| 小数で、大小の開きが大きい | `pyqbpp.dc64e128` | 量子化した後の型が `c64e128` |
| 2 次まで（QUBO） | `pyqbpp.c32e64m2` | 式の構築が速い。4 次までなら `m4` |

迷ったら、まずは既定の型で始めて、足りなければ広い型に変えます。

## まとめ

{% include video_seek.html t="33:39" %}

- 係数とエネルギーの型は、pyqbpp のモジュールで選びます。たとえば `pyqbpp.c64e64` をインポートすると、係数もエネルギーも 64 ビットの整数になります。係数は変数に掛かる数、エネルギーは式の値です。
- 計算の途中の値は、速さのためにチェックしません。あふれると、エラーも警告も出ないまま、黙って誤った答えになります。出力を見ただけでは誤りに気づきにくいことがあります。
- 書いた数は、入力したときにチェックされ、収まらなければ `OverflowError` になります。変数に掛ける数は係数の型、定数と制約の値はエネルギーの型でチェックされます。
- 心配なときは、オーバーフローしない `cppint` で確かめます。遅く、GPU も使いませんが、桁数に制限がありません。
- 整数変数の範囲は、`integer=` ならエネルギーの型で持ちます。`between=` はバイナリ変数の和なので、係数の型で持ちます。
- 実数の係数は `pyqbpp.d` で書き、`qbpp.quantize` でソルバーが解く式を確かめられます。ソルバーが解くのは量子化した式 `g` です。元の式 `f` と `g` で制約の判定が分かれたときは `g` で判定し、わずかな違反は `tol` で許します。
- 接尾辞の `m2` と `m4` は、項の最大次数を固定します。式の構築が速くなりますが、ソルバーの速さは変わりません。
