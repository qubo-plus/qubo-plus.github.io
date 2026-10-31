---
last_modified: 2026-10-26
layout: default
nav_exclude: true
title: "動画：制約の書き方"
description: "動画「QUBO++ 制約の書き方（Python）」の章ごとの要点と、動画に出てくるプログラムと出力。"
lang: ja
hreflang_alt: "en/python/VIDEO_CONSTRAINTS"
hreflang_lang: "en"
video: constraints
---

# 動画：制約の書き方（Python）

動画「QUBO++ 制約の書き方（Python）」の手引きです。
章ごとに、要点と動画に出てくるプログラム・出力、詳しい説明のページへのリンクをまとめています。
「▶ 動画の … から再生」をクリックすると、その場面から再生します。
動画では一部を省略して見せているプログラムも、ここではそのまま実行できる形で載せています。

{% include video_embed.html slug="constraints" %}

この動画で扱うこと：

- 目的関数と制約を 1 つの式にまとめて解く（制約付き最適化の定石）
- 等式と不等式の制約をペナルティ式で書く（`==`・`<=`・`>=`、`qbpp.constrain`）と、重みの決め方
- QUBO++ 独自の `qbpp.cons()` で制約を宣言する方法と、ペナルティ式との違い
- 0/1 のナップサック問題と個数つきのナップサック問題を、2 つの書き方で解いて比べる

[動画（チュートリアル）](../VIDEOS)の一覧に戻る

## 制約付き最適化の定石

### 例題：4 個から 2 個を選ぶ

{% include video_seek.html t="2:41" %}

価値が 3, 5, 4, 2 の 4 個の品物 a, b, c, d から、ちょうど 2 個を選んで、価値の合計を最大にします。
選ぶか選ばないかを、バイナリ変数 a, b, c, d（1 = 選ぶ）で表します。

### 1 つの式にまとめる

{% include video_seek.html t="4:00" %}

ソルバーは式の値が最小になる解を探すので、最大化したい目的関数にはマイナスを付けます。
制約は「満たせば 0、破ると正の値」になる式で表し、重み $P$ を掛けて足します。

$$
f = -(\text{価値の合計}) + P \times (\text{選んだ個数} - 2)^2
$$

$P$ が十分大きければ、制約を破ることが損になるので、$f$ を最小にする解は制約を満たし、
しかも制約を満たす中で価値の合計が最大になります。

### プログラム

{% include video_seek.html t="5:55" %}

`qbpp.constrain(式, equal=2)` は、式が 2 に等しいという制約のペナルティ式です。

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
d = qbpp.var("d")
value = 3 * a + 5 * b + 4 * c + 2 * d
f = -value + 10 * qbpp.constrain(a + b + c + d, equal=2)
f.simplify_as_binary()
print("f =", f)

sol = qbpp.ExhaustiveSolver(f).search()
print(sol)
print("value =", sol(value))
```

出力：

```
f = 40 -33*a -35*b -34*c -32*d +20*a*b +20*a*c +20*a*d +20*b*c +20*b*d +20*c*d
Sol(energy=-9, {a: 0, b: 1, c: 1, d: 0})
value = 9
```

## 等式の制約

{% include video_seek.html t="8:39" %}

`qbpp.constrain(f, equal=n)`、`f == n`、`qbpp.sqr(f - n)` は、どれも同じ $(f-n)^2$ の式になります。

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
d = qbpp.var("d")
g = qbpp.constrain(a + b + c + d, equal=2)
h = a + b + c + d == 2
i = qbpp.sqr(a + b + c + d - 2)
print("g =", qbpp.simplify_as_binary(g))
print("h =", qbpp.simplify_as_binary(h))
print("i =", qbpp.simplify_as_binary(i))
```

出力：

```
g = 4 -3*a -3*b -3*c -3*d +2*a*b +2*a*c +2*a*d +2*b*c +2*b*d +2*c*d
h = 4 -3*a -3*b -3*c -3*d +2*a*b +2*a*c +2*a*d +2*b*c +2*b*d +2*c*d
i = 4 -3*a -3*b -3*c -3*d +2*a*b +2*a*c +2*a*d +2*b*c +2*b*d +2*c*d
```

詳しくは[比較制約](COMPARISON)をご覧ください。

## 重みの決め方

### 重みが小さすぎると

{% include video_seek.html t="11:03" %}

重み $P$ が 1 では、3 個を選んで制約を破る解が最小になります。$P = 10$ なら制約を満たします。

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
d = qbpp.var("d")
value = 3 * a + 5 * b + 4 * c + 2 * d
for P in [1, 10]:
    f = -value + P * (a + b + c + d == 2)
    f.simplify_as_binary()
    sol = qbpp.ExhaustiveSolver(f).search()
    print(f"P = {P}: {sol}, value = {sol(value)}")
```

出力：

```
P = 1: Sol(energy=-11, {a: 1, b: 1, c: 1, d: 0}), value = 12
P = 10: Sol(energy=-9, {a: 0, b: 1, c: 1, d: 0}), value = 9
```

### 重みの目安

{% include video_seek.html t="13:05" %}

- 制約を破って得をする量（目的関数がよくなる量）よりも、違反のコストが大きくなるように選びます。
  ナップサック問題なら、品物の価値の最大値以上にしておけば十分です。
- 大きすぎると、制約を満たす割り当ての間の違いが相対的に小さくなり、ソルバーがよい解を見つけにくくなります。

## 不等式の制約

### 書き方

{% include video_seek.html t="14:46" %}

| 条件 | 演算子で書く | `constrain` で書く |
|---|---|---|
| 上限 u | `f <= u` | `qbpp.constrain(f, between=(None, u))` |
| 下限 l | `f >= l` | `qbpp.constrain(f, between=(l, None))` |
| 範囲 l〜u | `(l <= f) & (qbpp.same <= u)` | `qbpp.constrain(f, between=(l, u))` |

Python では `l <= f <= u` が `(l <= f) and (f <= u)` として計算され、論理値しか返せないので、範囲は `qbpp.same` か `between=` で書きます。

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
g = qbpp.constrain(a + b + c, between=(1, 2))
h = (1 <= a + b + c) & (qbpp.same <= 2)
print("g =", qbpp.simplify_as_binary(g))
print("h =", qbpp.simplify_as_binary(h))
```

出力：

```
g = 2 -2*a -2*b -2*c +2*a*b +2*a*c +2*b*c
h = 2 -2*a -2*b -2*c +2*a*b +2*a*c +2*b*c
```

### 3 品目のナップサック問題

{% include video_seek.html t="17:10" %}

価値 4, 7, 8、重さ 4, 9, 11 の 3 品目から、重さの合計 14 以下で価値の合計を最大にします。
出力の `{s0}[0]` などは、不等式のペナルティ式に自動で入るスラック変数です。

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
value = 4 * a + 7 * b + 8 * c
weight = 4 * a + 9 * b + 11 * c
f = -value + 10 * qbpp.constrain(weight, between=(None, 14))
f.simplify_as_binary()

sol = qbpp.ExhaustiveSolver(f).search()
print(sol)
print("value =", sol(value), "weight =", sol(weight))
```

出力：

```
Sol(energy=-11, {a: 1, b: 1, c: 0, {s0}[0]: 1, {s0}[1]: 1, {s0}[2]: 1})
value = 11 weight = 13
```

### スラック変数を自分で用意する

{% include video_seek.html t="18:47" %}

整数変数 $s$（0〜13）を用意すると、`weight <= 14` は「weight が $s$ か $s+1$ に等しい」と書けます。
$(\text{weight}-s)(\text{weight}-(s+1))$ は、weight が $s$ か $s+1$ のとき 0、それ以外は正になります。

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
value = 4 * a + 7 * b + 8 * c
weight = 4 * a + 9 * b + 11 * c
s = qbpp.var("s", between=(0, 13))   # 0〜13 の整数
print("s =", s)
f = -value + 10 * (weight - s) * (weight - (s + 1))
f.simplify_as_binary()

sol = qbpp.ExhaustiveSolver(f).search()
print(sol)
print("value =", sol(value), "weight =", sol(weight), "s =", sol(s))
```

出力：

```
s = s[0] +2*s[1] +4*s[2] +6*s[3]
Sol(energy=-11, {a: 1, b: 1, c: 0, s[0]: 1, s[1]: 1, s[2]: 1, s[3]: 1})
value = 11 weight = 13 s = 13
```

### 自動で入るスラック変数

{% include video_seek.html t="20:48" %}

`<=` で書いたペナルティ式にも、同じ形でスラック変数 `{s0}` が入ります。展開すると 21 項になります。

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
g = 4 * a + 9 * b + 11 * c <= 14
g.simplify_as_binary()
print("g =", g)
```

出力：

```
g = 12*a +72*b +110*c +6*{s0}[0] +20*{s0}[1] +56*{s0}[2] +72*a*b +88*a*c -16*a*{s0}[0] -32*a*{s0}[1] -56*a*{s0}[2] +198*b*c -36*b*{s0}[0] -72*b*{s0}[1] -126*b*{s0}[2] -44*c*{s0}[0] -88*c*{s0}[1] -154*c*{s0}[2] +16*{s0}[0]*{s0}[1] +28*{s0}[0]*{s0}[2] +56*{s0}[1]*{s0}[2]
```

詳しくは[比較制約](COMPARISON)をご覧ください。

## cons() で制約を宣言

### 書き方

{% include video_seek.html t="22:24" %}

比較の式を `qbpp.cons()` で囲むと、その部分は制約として特別に扱われます。

| 条件 | ペナルティ式 | `cons` |
|---|---|---|
| 等式 | `f == n` | `qbpp.cons(f == n)` |
| 上限 | `f <= u` | `qbpp.cons(f <= u)` |
| 下限 | `f >= l` | `qbpp.cons(f >= l)` |
| 範囲 | `qbpp.constrain(f, between=(l, u))` | `qbpp.cons(f, between=(l, u))` |

### 式のまま保持される

{% include video_seek.html t="23:21" %}

`cons()` で囲んだ制約は展開されず、式のまま保持されます。スラック変数も入りません。

### 解き方はこれまでと同じ

{% include video_seek.html t="24:24" %}

`f.cons(sol)` は、解 `sol` が違反している制約の本数です。

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
value = 4 * a + 7 * b + 8 * c
weight = 4 * a + 9 * b + 11 * c
f = -value + 10 * qbpp.cons(weight <= 14)
f.simplify_as_binary()
print("f =", f)

sol = qbpp.ExhaustiveSolver(f).search()
print(sol)
print("value =", sol(value), "weight =", sol(weight))
print("violated =", f.cons(sol))
```

出力：

```
f = -4*a -7*b -8*c
+10*cons(4*a +9*b +11*c <= 14)
Sol(energy=-11, {a: 1, b: 1, c: 0})
value = 11 weight = 13
violated = 0
```

### cons() の値

{% include video_seek.html t="25:56" %}

`cons()` で囲んだ制約の値は、違反量の 2 乗です（満たしていれば 0）。
重み $P$ を掛けると $P \times$ 違反量$^2$ になり、式全体の値は目的関数と制約ごとの値の和です。
たとえば 3 品目の例で a と c を選ぶと、重さ 15 は上限 14 を 1 超えるので、制約の値は $10 \times 1^2 = 10$、
式全体の値は $-12 + 10 = -2$ です。

### 複数の制約

{% include video_seek.html t="27:31" %}

複数の制約は、重みを付けて足すだけです。
`f(m)`・`f.cons(m)` のように、辞書で割り当てを与えて値を確かめることもできます。

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
d = qbpp.var("d")
value = 3 * a + 5 * b + 4 * c + 2 * d
weight = 2 * a + 4 * b + 3 * c + 2 * d
f = (-value + 10 * qbpp.cons(a + b + c + d == 2)
     + 10 * qbpp.cons(weight <= 5))
f.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(f).search()
print(sol, "violated =", f.cons(sol))
m = {a: 0, b: 1, c: 1, d: 0}
print("f =", f(m), "violated =", f.cons(m))
```

出力：

```
Sol(energy=-7, {a: 1, b: 0, c: 1, d: 0}) violated = 0
f = 31 violated = 1
```

詳しくは[非線形関数とネイティブ制約](CONSTRAINTS)をご覧ください。

## constrain と cons の違い

### 制約の値の違い

{% include video_seek.html t="29:17" %}

等式では、どちらも違反量の 2 乗で、まったく同じ式です。
不等式では、`constrain`（スラック変数を最もよく選んだとき）は 違反量 ×（違反量 + 1）、`cons` は 違反量の 2 乗です。
3 品目の例の `weight <= 14` で比べると次のとおりです。

| 重さ | 違反量 | constrain | cons |
|---:|---:|---:|---:|
| 0, 4, 9, 11, 13 | 0 | 0 | 0 |
| 15 | 1 | 2 | 1 |
| 20 | 6 | 42 | 36 |
| 24 | 10 | 110 | 100 |

どちらも満たせば 0、破ると正なので、重みが十分大きければ、入れ替えても制約を満たす最適解は同じです。

### 式の大きさ

{% include video_seek.html t="30:48" %}

ペナルティ式はスラック変数が加わって変数 6 個・21 項、`cons` は変数 3 個・3 項です。
式が小さくスラック変数もないので、`cons` はソルバーにとって扱いやすく、多くの場合よりよい解が得られます。

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
value = 4 * a + 7 * b + 8 * c
weight = 4 * a + 9 * b + 11 * c
fp = -value + 10 * (weight <= 14)
fp.simplify_as_binary()
fc = -value + 10 * qbpp.cons(weight <= 14)
fc.simplify_as_binary()
for name, f in [("penalty", fp), ("cons", fc)]:
    sol = qbpp.ExhaustiveSolver(f).search()
    print(f"{name:8s} vars = {sol.info['var_count']}, terms = {f.term_count()}")
```

出力：

```
penalty  vars = 6, terms = 21
cons     vars = 3, terms = 3
```

## 例題：ナップサック問題

### 10 品目

{% include video_seek.html t="32:14" %}

10 品目から重さの合計 120 以下で価値の合計を最大にします。
重みは品物の価値の最大値（95）に合わせて 100 にし、ペナルティ式と `cons` の両方で EasySolver で解きます。

```python
import pyqbpp as qbpp

w = [27, 34, 11, 18, 31, 54, 41, 22, 39, 23]
v = [62, 73, 22, 39, 70, 95, 53, 28, 31, 48]
W = 120
x = qbpp.var("x", shape=10)
value = qbpp.sum(v * x)
weight = qbpp.sum(w * x)

fp = -value + 100 * (weight <= W)             # ペナルティ式
fp.simplify_as_binary()
fc = -value + 100 * qbpp.cons(weight <= W)    # cons
fc.simplify_as_binary()

for name, f in [("penalty", fp), ("cons", fc)]:
    sol = qbpp.EasySolver(f).search(time_limit=1)
    print(f"{name:8s} vars = {sol.info['var_count']:2}, terms = {f.term_count():3}, "
          f"value = {sol(value)}, weight = {sol(weight)}")
print(sol(x))
```

動画での出力（EasySolver の結果は実行ごとに変わることがあります）：

```
penalty  vars = 16, terms = 136, value = 253, weight = 115
cons     vars = 10, terms =  10, value = 253, weight = 115
[1, 1, 0, 0, 1, 0, 0, 0, 0, 1]
```

### cons の重み

{% include video_seek.html t="36:43" %}

`cons` でも、重みが小さいと制約が破られます。

```python
import pyqbpp as qbpp

w = [27, 34, 11, 18, 31, 54, 41, 22, 39, 23]
v = [62, 73, 22, 39, 70, 95, 53, 28, 31, 48]
x = qbpp.var("x", shape=10)
value = qbpp.sum(v * x)
weight = qbpp.sum(w * x)
for P in [1, 10, 100]:
    f = -value + P * qbpp.cons(weight <= 120)
    f.simplify_as_binary()
    sol = qbpp.ExhaustiveSolver(f).search()
    print(f"P = {P:3}: value = {sol(value)}, weight = {sol(weight)}, violated = {f.cons(sol)}")
```

出力：

```
P =   1: value = 266, weight = 121, violated = 1
P =  10: value = 266, weight = 121, violated = 1
P = 100: value = 253, weight = 115, violated = 0
```

### 60 品目

{% include video_seek.html t="38:42" %}

乱数で作った 60 品目で、それぞれ 3 回ずつ解き、動的計画法で求めた最適値と比べます。

```python
import random
import pyqbpp as qbpp

n = 60
random.seed(7)
w = [random.randint(10, 60) for i in range(n)]
v = [random.randint(10, 100) for i in range(n)]
W = sum(w) * 2 // 5

x = qbpp.var("x", shape=n)
value = qbpp.sum(v * x)
weight = qbpp.sum(w * x)
fp = -value + 100 * (weight <= W)
fp.simplify_as_binary()
fc = -value + 100 * qbpp.cons(weight <= W)
fc.simplify_as_binary()

for name, f in [("penalty", fp), ("cons", fc)]:
    for run in range(3):
        sol = qbpp.EasySolver(f).search(time_limit=1)
        print(f"{name:8s} value = {sol(value)}, weight = {sol(weight)}")

# 比較のため、動的計画法で最適値を求める
best = [0] * (W + 1)
for i in range(n):
    for c in range(W, w[i] - 1, -1):
        best[c] = max(best[c], best[c - w[i]] + v[i])
print("W =", W, "optimum =", best[W])
```

動画での出力（EasySolver の結果は実行ごとに変わります）：

```
penalty  value = 2380, weight = 742
penalty  value = 2364, weight = 742
penalty  value = 2347, weight = 741
cons     value = 2380, weight = 742
cons     value = 2380, weight = 741
cons     value = 2380, weight = 742
W = 742 optimum = 2380
```

`cons` は 3 回とも最適値 2380 に届き、ペナルティ式は届かないことがあります。

詳しくは[ナップサック](KNAPSACK)をご覧ください。

## 例題：個数つきナップサック

### プログラム

{% include video_seek.html t="40:39" %}

40 種類の品物を、それぞれ 0〜10 個まで選べます。変数を `integer=(0, 10)` の整数変数にするだけで、残りは 0/1 のときと同じです。

```python
import random
import pyqbpp as qbpp

n = 40
random.seed(11)
w = [random.randint(10, 60) for i in range(n)]
v = [random.randint(10, 100) for i in range(n)]
W = sum(w) * 10 // 4

x = qbpp.var("x", shape=n, integer=(0, 10))
value = qbpp.sum(v * x)
weight = qbpp.sum(w * x)
fp = -value + 100 * (weight <= W)
fp.simplify_as_binary()
fc = -value + 100 * qbpp.cons(weight <= W)
fc.simplify_as_binary()
print("terms: penalty =", fp.term_count(), ", cons =", fc.term_count())

for name, f in [("penalty", fp), ("cons", fc)]:
    for run in range(3):
        sol = qbpp.EasySolver(f).search(time_limit=1)
        print(f"{name:8s} binary vars = {sol.info['var_count']}, value = {sol(value)}, weight = {sol(weight)}")

# 比較のため、動的計画法で最適値を求める
best = [0] * (W + 1)
for i in range(n):
    for c in range(W, -1, -1):
        for k in range(1, 11):
            if k * w[i] > c:
                break
            best[c] = max(best[c], best[c - k * w[i]] + k * v[i])
print("W =", W, "optimum =", best[W])
```

### 結果

{% include video_seek.html t="42:29" %}

動画での出力（EasySolver の結果は実行ごとに変わります）：

```
terms: penalty = 1366 , cons = 40
penalty  binary vars = 11, value = 10201, weight = 3567
penalty  binary vars = 11, value = 10215, weight = 3565
penalty  binary vars = 11, value = 10262, weight = 3565
cons     binary vars = 0, value = 10352, weight = 3565
cons     binary vars = 0, value = 10348, weight = 3563
cons     binary vars = 0, value = 10355, weight = 3567
W = 3567 optimum = 10366
```

ペナルティ式は 1366 項でスラック変数（バイナリ変数 11 個）が入り、`cons` は 40 項で整数変数だけです。
`cons` のほうが最適値 10366 に近い解が得られます。

詳しくは[整数変数](INTEGER)をご覧ください。

## まとめ

{% include video_seek.html t="44:13" %}

- 制約のある問題は、目的関数と制約を 1 つの式にまとめて解きます。最大化したい目的関数にはマイナスを付け、制約の式には重みを掛けて足します。
- 重みは、制約を破って得をする量よりも違反のコストが大きくなるように選びます。小さすぎると制約が破られ、大きすぎるとよい解が見つけにくくなります。
- ペナルティ式は、比較演算子（`==`・`<=`・`>=`）や `qbpp.constrain` で作ります。範囲は `between=` か `qbpp.same` で書きます。不等式のペナルティ式には、スラック変数が自動で入ります。
- `qbpp.cons()` は比較の式を囲んで制約を宣言します。式のまま違反量を求め、スラック変数を使いません。`f.cons(sol)` で違反している制約の本数が分かります。
- どちらの書き方でも、満たせば 0、破ると違反量に応じた値になるので、重みが十分大きければ同じ答えになります。`cons` のほうがソルバーにとって扱いやすく、よりよい解が得られることが多くなります。
