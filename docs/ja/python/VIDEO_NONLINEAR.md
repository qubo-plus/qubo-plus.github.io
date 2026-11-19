---
last_modified: 2026-10-26
layout: default
nav_exclude: true
title: "動画：非線形関数と高次の項"
description: "動画「QUBO++ 非線形関数と高次の項（Python）」の章ごとの要点と、動画に出てくるプログラムと出力。"
lang: ja
hreflang_alt: "en/python/VIDEO_NONLINEAR"
hreflang_lang: "en"
video: nonlinear
---

# 動画：非線形関数と高次の項（Python）

動画「QUBO++ 非線形関数と高次の項（Python）」の手引きです。
章ごとに、要点と動画に出てくるプログラム・出力、詳しい説明のページへのリンクをまとめています。
「▶ 動画の … から再生」をクリックすると、その場面から再生します。
動画では一部を省略して見せているプログラムも、ここではそのまま実行できる形で載せています。

{% include video_embed.html slug="nonlinear" %}

この動画で扱うこと：

- 式の中で使える 4 つの非線形関数 `qbpp.abs`・`qbpp.relu`・`qbpp.max`・`qbpp.min` と、関数の項に掛けられるもの
- `qbpp.abs` で連立方程式のずれを最小にする例と、`qbpp.abs(f, 2)` と `qbpp.sqr(f)` の違い
- `qbpp.relu` で予算を超えた分だけ費用をかける例と、`qbpp.max` や整数変数で機械の負荷を最小にする例
- 関数の入れ子は書けないことと、足し引きでの書き換え
- リテラルと高次の項、`simplify_as_binary` が否定リテラル `~x` を展開するのは 2 次以下の項だけであること
- `qbpp.reduce` で高次の項を 2 次の式に直す方法

[動画（チュートリアル）](../VIDEOS)の一覧に戻る

## 非線形関数

### 4 つの関数

{% include video_seek.html t="2:30" %}

QUBO++ の式の中では、次の 4 つの関数をそのまま使えます。
`abs` と `relu` は、2 つ目の引数に 2 を書くと 2 乗になります。

| 関数 | 値 | 使いどころ |
|---|---|---|
| `qbpp.abs(f)` | $\lvert f\rvert$ | ずれ・誤差 |
| `qbpp.abs(f, 2)` | $\lvert f\rvert^2$ | |
| `qbpp.relu(f)` | $\max(0, f)$ | しきい値を超えた分 |
| `qbpp.relu(f, 2)` | $\max(0, f)^2$ | |
| `qbpp.max(f, g)` | $\max(f, g)$ | 大きいほう |
| `qbpp.min(f, g)` | $\min(f, g)$ | 小さいほう |

関数の項は多項式に展開されず、そのままの形でソルバーに渡されます。
たとえば $f = x[0] + x[1] - 1$ の 2 乗を展開すると 6 つの項に分かれますが、`qbpp.abs(f, 2)` は 1 つの関数の項のままです。
ソルバーが関数の値をそのまま計算するので、補助変数は要りません。

### 掛けられるのは定数だけ

{% include video_seek.html t="4:07" %}

関数の項に掛けられるのは定数だけです。関数の項は「定数 × 関数」の形のまま、ソルバーに渡されるからです。
次の例の `f`、`g` は、`f = x[0] + x[1] - 1` のような式です。

| 書ける | 意味 |
|---|---|
| `3 * qbpp.abs(f)` | 定数倍 |
| `-2 * qbpp.relu(f)` | 負の定数：関数の値を大きくする向きに働く |
| `qbpp.abs(f) + x[0] * x[1]` | ほかの項との和 |
| `qbpp.abs(f, 2)` | 2 乗は 2 つ目の引数で |

| 書けない | 意味 |
|---|---|
| `x[0] * qbpp.abs(f)` | 変数との積 |
| `(x[0] + 1) * qbpp.relu(f)` | 式との積 |
| `qbpp.abs(f) * qbpp.abs(g)` | 関数どうしの積 |
| `qbpp.sqr(qbpp.abs(f))` | 2 乗 |

書けない例は、どれも `RuntimeError` になります。
メッセージの後半には、許される演算 `allowed operations: +, -, * by a nonzero constant, simplify*, and qbpp.replace` が書かれています。

詳しくは[非線形関数とネイティブ制約](CONSTRAINTS)をご覧ください。

## abs

### 連立方程式のずれを最小にする

{% include video_seek.html t="6:00" %}

$x + y = 13$ と $x - y = 3$ を、0〜10 の整数変数 $x$, $y$ で解きます。
2 つの式のずれ（差の絶対値）を足した $f$ は 0 以上で、最小値が 0 なら、どちらの式も成り立っています。

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 10))
y = qbpp.var("y", integer=(0, 10))
f = qbpp.abs(x + y - 13) + qbpp.abs(x - y - 3)
f.simplify_as_binary()
print(f)
sol = qbpp.ExhaustiveSolver(f).search()
print(f"x = {sol(x)}, y = {sol(y)}, f = {sol.energy}")
```

出力：

```
abs(-13 +x +y, 1)
+abs(-3 +x -y, 1)
x = 8, y = 5, f = 0
```

関数の項は展開されず、1 つずつ `abs` の形のまま表示されます。
かっこの中の前半は絶対値を取る式（定数が先頭）、最後の 1 は指数です。

### abs(f, 2) と qbpp.sqr(f)

{% include video_seek.html t="7:58" %}

`qbpp.sqr` で書いた `g` は多項式に展開され、`x` と `y` の積の項は打ち消し合って消えます。
`abs` の 2 つ目の引数で書いた `h` は、関数の項のまま残ります。
関数を含む式も、辞書で変数の値を与えて計算できます。$x = 2$, $y = 7$ では、どちらも $(-4)^2 + (-8)^2 = 80$ です。

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 10))
y = qbpp.var("y", integer=(0, 10))
g = qbpp.sqr(x + y - 13) + qbpp.sqr(x - y - 3)
h = qbpp.abs(x + y - 13, 2) + qbpp.abs(x - y - 3, 2)
g.simplify_as_binary()
h.simplify_as_binary()
print("g =", g)
print("h =", h)
print(g({x: 2, y: 7}), h({x: 2, y: 7}))
```

出力：

```
g = 178 -32*x -20*y +2*x*x +2*y*y
h = abs(-13 +x +y, 2)
+abs(-3 +x -y, 2)
80 80
```

バイナリ変数の和を 2 乗して展開すると、項がたくさんできます。
$n$ 個の和なら $n(n+1)/2$ 項で、3 個で 6 項、10 個で 55 項、100 個で 5050 項です。
`abs` の 2 つ目の引数で書けば、何個の和でも関数の項は 1 つです。
一方、展開した多項式はほかのソルバーにも渡せます。関数の項を含む式は、QUBO++ のソルバーで解きます。

詳しくは[非線形関数とネイティブ制約](CONSTRAINTS)をご覧ください。

## relu

{% include video_seek.html t="10:32" %}

価値 8, 12, 11, 7, 12、費用 8, 5, 9, 5, 2 の 5 つの品物から選んで、価値の合計を最大にします。
`f` は、費用が予算 20 を超えてもよいことにして、超えた分 1 につき 2 の追加費用を `qbpp.relu` で払う式です。
`g` は、予算を `qbpp.cons` で制約にした式です。

```python
import pyqbpp as qbpp

v = qbpp.array([8, 12, 11, 7, 12])
c = qbpp.array([8, 5, 9, 5, 2])
x = qbpp.var("x", shape=5)
value = qbpp.sum(v * x)
cost = qbpp.sum(c * x)
f = -value + 2 * qbpp.relu(cost - 20)
g = -value + 100 * qbpp.cons(cost <= 20)
for h in (f, g):
    h.simplify_as_binary()
    sol = qbpp.ExhaustiveSolver(h).search()
    print(sol(x), "value =", sol(value),
          "cost =", sol(cost), "cons =", h.cons(sol))
```

出力：

```
[0, 1, 1, 1, 1] value = 42 cost = 21 cons = 0
[1, 1, 0, 1, 1] value = 39 cost = 20 cons = 0
```

`relu` の `f` では、予算を 1 超えて価値 42 の組が最適です。追加費用 2 を引いても 40 で、予算内のどの組よりも得です。
`cons` の `g` では、費用 20、価値 39 の組になります。
`relu` の項は目的関数の一部なので、違反している制約の数 `h.cons(sol)` には入りません。予算を超えた `f` の組でも 0 なのはそのためです。

詳しくは[非線形関数とネイティブ制約](CONSTRAINTS)をご覧ください。

## max・min

### 2 台の機械

{% include video_seek.html t="12:47" %}

処理時間 8, 7, 6, 5, 5, 4, 3, 3, 1（合計 42）の 9 個の仕事を、2 台の機械に分けます。
`x` が 1 の仕事は 1 台目、0 の仕事は 2 台目で処理します。2 台目の負荷は、否定リテラル `~x` で書けます。
全部の仕事が終わるのは遅いほうの機械が終わったときなので、2 つの負荷の大きいほうを `qbpp.max` で最小にします。

```python
import pyqbpp as qbpp

d = qbpp.array([8, 7, 6, 5, 5, 4, 3, 3, 1])
x = qbpp.var("x", shape=9)
p = qbpp.sum(d * x)
q = qbpp.sum(d * ~x)
f = qbpp.max(p, q)
f.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(f).search()
print(f"max = {sol.energy}, p = {sol(p)}, q = {sol(q)}")
```

出力：

```
max = 21, p = 21, q = 21
```

どちらの機械も 21 で、合計 42 のちょうど半分です。
`qbpp.max` と `qbpp.min` に書けるのは、2 つの式までです。

### 3 台の機械

{% include video_seek.html t="14:37" %}

同じ 9 個の仕事を 3 台の機械に分けます。`x` は 9 行 3 列の配列で、行が仕事、列が機械です。
`qbpp.max` を入れ子にして 3 つの負荷の最大値を書くことはできないので、0〜42 の整数変数 `z` を用意して、
どの機械の負荷も `z` 以下という制約を付け、`z` を最小にします。
`z` は 3 つの負荷の最大値まで下がり、そこで止まります。負荷は 42 の 3 分の 1 の 14 より小さくできないので、`target_energy=14` で解きます。

```python
import pyqbpp as qbpp

d = qbpp.array([8, 7, 6, 5, 5, 4, 3, 3, 1])
x = qbpp.var("x", shape=(9, 3))
loads = [qbpp.sum(d * x[:, k]) for k in range(3)]
try:
    qbpp.max(qbpp.max(loads[0], loads[1]), loads[2])
except RuntimeError as e:
    print("RuntimeError:", e)
z = qbpp.var("z", integer=(0, 42))
f = z + 100 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
for load in loads:
    f += 100 * qbpp.cons(load - z <= 0)
f.simplify_as_binary()
sol = qbpp.EasySolver(f).search(target_energy=14)
print("z =", sol(z), "loads =", [sol(load) for load in loads],
      "cons =", f.cons(sol))
```

出力：

```
RuntimeError: qbpp.max(): the argument contains abs/relu/max/min; nonlinear functions cannot be nested (write the combination as a sum of separate terms)
z = 14 loads = [14, 14, 14] cons = 0
```

出力の 1 行目は、`qbpp.max` の入れ子が `RuntimeError` になったときのメッセージです。
`z` は 14 で、3 台の負荷はどれも 14 になりました。破った制約はありません。

詳しくは[非線形関数とネイティブ制約](CONSTRAINTS)をご覧ください。

## ネスト

{% include video_seek.html t="17:56" %}

関数の中に、別の関数を入れることはできません。
$-6$〜6 の整数変数 $r$ の絶対値を 3 で頭打ちにする式 $\min(\lvert r\rvert, 3)$ は、`qbpp.min` の中に `qbpp.abs` を入れては書けないので、
$\lvert r\rvert - \mathrm{relu}(r - 3) - \mathrm{relu}(-r - 3)$ と、関数の足し引きで書き換えます。
$r$ が 3 を超えると $r - (r - 3) = 3$、$-3$ より小さいときも 3 になり、V 字の両側が平らになります。

```python
import pyqbpp as qbpp

r = qbpp.var("r", integer=(-6, 6))
try:
    qbpp.min(qbpp.abs(r), 3)
except RuntimeError as e:
    print("RuntimeError:", e)
g = qbpp.abs(r) - qbpp.relu(r - 3) - qbpp.relu(-r - 3)
print([g({r: v}) for v in range(-6, 7)])
```

出力：

```
RuntimeError: qbpp.min(): the argument contains abs/relu/max/min; nonlinear functions cannot be nested (write the combination as a sum of separate terms)
[3, 3, 3, 3, 2, 1, 0, 1, 2, 3, 3, 3, 3]
```

1 行目は入れ子にしたときの `RuntimeError` のメッセージで、別々の項の和として書くように勧めています。
2 行目は $r = -6$〜6 の 13 個の値で、確かに 3 で頭打ちになっています。

詳しくは[非線形関数とネイティブ制約](CONSTRAINTS)をご覧ください。

## 高次の項

### リテラルと高次の項

{% include video_seek.html t="19:51" %}

リテラルは、変数 `x` そのものか、その否定 `~x` のことです。`~x` は $1 - x$ と同じ値になります。

| `x` | `~x` | $1 - x$ |
|---:|---:|---:|
| 0 | 1 | 1 |
| 1 | 0 | 0 |

リテラルを 3 つ以上掛けた項を、高次の項と呼びます。
たとえば `~x[0] * x[1] * ~x[2]` は 3 次の項で、`x[0]`, `x[1]`, `x[2]` が 0, 1, 0 のときだけ 1 になります。
QUBO++ では、高次の項を 2 次に直さずに式にそのまま書けて、ソルバーもそのまま解けます。
高次の項は、`abs` や `relu` のような関数の項ではなく、ふつうの多項式の項です。

### 2 次以下の項の否定リテラル

{% include video_seek.html t="21:18" %}

`simplify_as_binary` は、1 次と 2 次の項の否定リテラルを、`~x` を $1 - x$ に置き換えて展開します。
`f` の 2 つの項を展開すると、$x[1] - x[0]x[1]$ と $1 - x[0] - x[1] + x[0]x[1]$ になり、足すと $1 - x[0]$ だけが残ります。
3 次の項は、`~x` を含んだまま残ります。

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=3)
f = ~x[0] * x[1] + ~x[0] * ~x[1]        # 2 次
g = x[0] + ~x[0] * x[1] * ~x[2]         # 3 次
f.simplify_as_binary()
g.simplify_as_binary()
print("f =", f)
print("g =", g)
```

出力：

```
f = 1 -x[0]
g = x[0] +~x[0]*x[1]*~x[2]
```

詳しくは[否定リテラル](NEGATIVE)をご覧ください。

### 2 次の項を展開しても

{% include video_seek.html t="23:12" %}

`~x[0]*~x[1]` を展開すると $1 - x[0] - x[1] + x[0]x[1]$ の 4 項ですが、2 次の項は $x[0]x[1]$ の 1 つだけです。
増えるのは 1 次の項ですが、同類項はまとまるので、1 次の項は変数の個数より多くはなりません。打ち消し合って消えることも多くあります。
展開すると否定を含まないふつうの QUBO の形になるので、2 次以下の項の否定リテラルは展開しておきます。

### 3 次以上の項は展開しない

{% include video_seek.html t="24:35" %}

否定を 1 つ展開するたびに項の数は 2 倍になり、否定を $k$ 個含む項は $2^k$ 個の項（定数の項を含む）になります。

| 否定の数 $k$ | 3 | 4 | 10 |
|---|---:|---:|---:|
| 展開した項の数 $2^k$ | 8 | 16 | 1024 |

項の数が爆発するので、`simplify_as_binary` は 3 次以上の項の否定は展開しません。
ソルバーは否定リテラルを含む高次の項をそのまま扱えるので、3 次以上の項でも `~x` をそのまま書いてかまいません。

詳しくは[否定リテラル](NEGATIVE)をご覧ください。

## reduce

{% include video_seek.html t="25:47" %}

`qbpp.reduce` は、補助変数を加えて、高次の項を 2 次の式に直します。
3 次の項 `f` を直した `g` は補助変数 `{r0}` 1 個の 7 項、`-f` を直した `h` は補助変数 `{r1}` 1 個の 4 項になります。
係数が負の項は、正の項とは別の、より簡単な式に直ります。

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=3)
f = x[0] * x[1] * x[2]
g = qbpp.reduce(f)
h = qbpp.reduce(-f)
print("g =", g)
print("h =", h)
print("max degree:", f.max_degree, "->", g.max_degree, h.max_degree)
sol = qbpp.ExhaustiveSolver(h).search()
print(sol)
```

出力：

```
g = {r0} +x[0]*x[1] +x[0]*x[2] -x[0]*{r0} +x[1]*x[2] -x[1]*{r0} -x[2]*{r0}
h = 2*{r1} -x[0]*{r1} -x[1]*{r1} -x[2]*{r1}
max degree: 3 -> 2 2
Sol(energy=-1, {x[0]: 1, x[1]: 1, x[2]: 1, {r1}: 1})
```

補助変数が加わっても、最小値は変わりません。元の変数のどの割り当てでも、補助変数をうまく選べば元の式と同じ値になるからです。
`x` のうち 1 の個数ごとに値を並べると、次のとおりです（`x` の 8 通りの割り当ての値は 1 の個数だけで決まります）。

| `x` の 1 の個数 | 0 | 1 | 2 | 3 |
|---|---:|---:|---:|---:|
| `f` | 0 | 0 | 0 | 1 |
| `g`（`{r0}` = 0） | 0 | 0 | 1 | 3 |
| `g`（`{r0}` = 1） | 1 | 0 | 0 | 1 |
| `g` の最小 | 0 | 0 | 0 | 1 |
| `h`（`{r1}` = 0） | 0 | 0 | 0 | 0 |
| `h`（`{r1}` = 1） | 2 | 1 | 0 | -1 |
| `h` の最小 | 0 | 0 | 0 | -1 |

`reduce` は、2 次の QUBO しか受け取らないソルバーに渡すときに使います。QUBO++ のソルバーは 3 次以上の項をそのまま解くので、`reduce` は要りません。
なお、`abs` などの関数を含む式は `qbpp.reduce` できません。QUBO++ のソルバーで解きます。

詳しくは[HUBO の QUBO への変換](REDUCE)をご覧ください。

## まとめ

{% include video_seek.html t="28:24" %}

- QUBO++ の式では、`abs`・`relu`・`max`・`min` の 4 つの関数をそのまま使えます。関数の項は展開されず、ソルバーが値をそのまま計算します。関数の項に掛けられるのは定数だけです。
- `qbpp.abs` は絶対値で、2 つ目の引数に 2 を書くと 2 乗になります。
- `qbpp.relu` は、しきい値を超えた分だけを表します。`relu` の項は目的関数の一部なので、制約の違反には数えません。
- `qbpp.max` と `qbpp.min` は、2 つの式の大きいほうと小さいほうです。3 つ以上の式は、整数変数と `qbpp.cons` の制約で書きます。
- 関数の入れ子は書けず、`RuntimeError` になります。入れ子にしたいときは、足し引きで書き換えます。
- 3 次以上の項や `~x` の積も、そのまま書いて解けます。`simplify_as_binary` は 2 次以下の項の `~x` を $1 - x$ に展開し、3 次以上の項の `~x` は項の数が爆発するので展開しません。
- 2 次の式が必要なときは、`qbpp.reduce` で補助変数を加えて、高次の項を 2 次の式に直します。関数を含む式は `reduce` できないので、QUBO++ のソルバーで解きます。
