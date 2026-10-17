---
last_modified: 2026-10-14
layout: default
nav_exclude: true
title: "整数変数"
nav_order: 7
lang: ja
hreflang_alt: "en/python/INTEGER"
hreflang_lang: "en"
---

# 整数変数と連立方程式の求解

PyQBPP では，バイナリ変数に加えて**整数変数**を使えます．
整数変数は値の範囲（下限と上限）を指定して宣言し，
QUBO++ にバンドルされているソルバー
（[Easy Solver](EASYSOLVER)・[Exhaustive Solver](EXHAUSTIVE)・[ABS3 Solver](ABS3)）が
整数値のまま直接探索します．

## 整数変数の宣言

**`qbpp.var("name", integer=(下限, 上限))`** で，
その範囲の整数値をとる変数が作られます．範囲の指定は必須です．
宣言した変数は，バイナリ変数と同じように式の中で使えます:

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 10))
f = x * x - 4 * x
f.simplify()
print("f =", f)

solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()
print("x =", sol(x))
print("f =", sol.energy)
```

`x` は 0 以上 10 以下の整数値をとる変数で，Exhaustive Solver が
$f = x^2 - 4x$ を最小にする `x` を求めます．
プログラムの出力は以下の通りです:

```
f = -4*x +x*x
x = 2
f = -4
```

`x * x` には，バイナリ変数の規則（$x \cdot x = x$）は適用されず，
整数の 2 乗としてそのまま扱われる点に注意してください．
このように整数変数だけの式は `simplify()` で簡約します．
バイナリ変数を含む式は，バイナリ変数の規則も使う `simplify_as_binary()` で簡約します．
整数変数だけの式にも `simplify_as_binary()` は使えますが，存在しないバイナリ変数の規則を適用しようとするので，効率が悪くなる可能性があります．

## 連立方程式を解く

整数変数を使って，次の連立方程式を解いてみます（解は $x=6$，$y=4$ です）:

$$
\begin{aligned}
x + y &= 10\\
2x+4y &= 28
\end{aligned}
$$

それぞれの方程式の左辺と右辺の差を 2 乗して足した式

$$
\begin{aligned}
f(x,y) &= (x+y-10)^2 + (2x+4y-28)^2
\end{aligned}
$$

は，2 つの方程式が同時に満たされるとき，かつそのときに限り最小値 0 をとります．
したがって，$f(x,y)$ を最小にする $x$ と $y$ が連立方程式の解です．
次のプログラムは，範囲 $[0,10]$ の整数変数 `x`，`y` で $f(x,y)$ を作り，Easy Solver で解きます:

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 10))
y = qbpp.var("y", integer=(0, 10))
f = qbpp.sqr(x + y - 10) + qbpp.sqr(2 * x + 4 * y - 28)
f.simplify()
print("f =", f)

solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=0)
print(f"x = {sol(x)}, y = {sol(y)}")
print("f =", sol.energy)
```

最小値が 0 であることが分かっているので，`target_energy` に 0 を指定し，
エネルギー 0 の解が見つかった時点で探索を終了させています．
プログラムの出力は以下の通りです:

```
f = 884 -132*x -244*y +5*x*x +18*x*y +17*y*y
x = 6, y = 4
f = 0
```

`f` は `x` と `y` の 2 次式のまま保持され，ソルバーは `x` と `y` の値を整数のまま探索します．

## 整数変数の配列

`qbpp.var()` に次元と `integer=` を同時に指定すると，
整数変数の配列が作れます．要素には `s[i]` でアクセスし，
`s.sum()` で総和の式が作れます:

```python
import pyqbpp as qbpp

s = qbpp.var("s", 3, integer=(0, 9))
t = s.sum()
f = qbpp.sqr(t - 6) + qbpp.sqr(s[0] - s[1] + 1) + qbpp.sqr(s[1] - s[2] + 1)
f.simplify()

solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()
print(f"s = {sol(s[0])}, {sol(s[1])}, {sol(s[2])}")
print(f"f = {sol.energy}")
```

プログラムの出力は以下の通りです:

```
s = 1, 2, 3
f = 0
```

配列全体の演算（`s + t`，`2 * s`，`qbpp.sqr(s)`，`s <= 5` のような
要素ごとの制約，スライス `s[1:3]`，`qbpp.vector_sum()`，`qbpp.einsum()`，
`qbpp.concat()`）は `Expr` の配列として扱われ，
`sol(s)` で全要素の値をまとめて取り出せます．

## 要素ごとに範囲が異なる配列

`integer=` の下限・上限には，スカラーの代わりにリストも指定できます．
リストを指定すると，要素ごとに個別の範囲を持つ整数変数の
配列が作られます（スカラー側の値は全要素で共有されます）．
下限と上限が等しい要素は，その値に固定された定数になります:

```python
import pyqbpp as qbpp

max_vals = [3, 7, 15, 5]
x = qbpp.var("x", shape=len(max_vals), integer=(0, max_vals))
f = qbpp.sqr(qbpp.sum(x) - 26) - x[0] - x[1] - x[2]
f.simplify()

solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()
print(f"x = {sol(x[0])}, {sol(x[1])}, {sol(x[2])}, {sol(x[3])}")
print(f"f = {sol.energy}")
```

プログラムの出力は以下の通りです:

```
x = 3, 7, 15, 1
f = -25
```

## 値の評価と置換

宣言した整数変数に値を与えて式の値を求めるには，バイナリ変数と同じく
[評価関数](EVAL) `f({x: 3})` を使います．
与える値は宣言した範囲内でなければなりません（範囲外の値の扱いは後述）．
[置換関数](REPLACE) `qbpp.replace(f, {x: e})` は，式 `f` に現れる `x` をすべて式 `e` に書き換えます．
`x * x` のような冪は出現ごとに置き換えられるので，`x` を `y + 1` で置換すると
$(y+1)^2 + (y+1)$ が展開されます:

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 10))
y = qbpp.var("y", integer=(0, 10))
f = x * x + x

print("f(3) =", f({x: 3}))

g = qbpp.replace(f, {x: 2})
g.simplify()
print("g =", g)

h = qbpp.replace(f, {x: y + 1})
h.simplify()
print("h =", h)
```

プログラムの出力は以下の通りです:

```
f(3) = 12
g = 6
h = 2 +3*y +y*y
```

置換は記号的な書き換えで，`x` の範囲は結果に引き継がれません．
`y + 1` が `x` の範囲に収まるべきだという制約が自動的に付くことはなく，範囲外の定数で置換しても例外にはなりません．
必要な制約は [`qbpp.cons()`](CONSTRAINTS) で明示してください．
結果の式が整数変数を含むかどうかは，置換に使った式に含まれる変数で決まります
（`y + 1` なら `y` の範囲と整数性がそのまま生きます）．
変数 `x` 自体の宣言は消えず，別の式で引き続き使えます．
なお，評価関数に範囲外の値を与えた場合は `ValueError` になります．

## 制約

整数変数を含む式の制約（$2x + 3y \leq 24$ など）は，`qbpp.cons()` で書けます．
[範囲制約と整数線形計画法の求解](RANGE)で説明します．

## 外部ソルバーとの連携

MIP ソルバーは整数変数をそのまま扱えるため，整数変数は
**整数の列として直接渡されます**．
目的関数が線形で制約を `qbpp.cons()` で書いたモデルは，
`qbpp.ScipSolver(f, ilp=True)` のように `ilp=True` を付ければ
MIP ソルバー（SCIP, HiGHS, CBC, GLPK）すべてで解けます．
`qbpp.OrToolsCpSatSolver` も同様に，整数変数と `qbpp.cons()` を
含むモデルを ILP 形式（整数変数と線形の制約行）で直接受け取ります．

一方，バイナリ変数しか扱えない外部の QUBO ソルバーに渡す場合は，
整数変数をバイナリ変数で表す必要があります．
その方法は[バイナリエンコードの整数変数](BINARY_INTEGER)で説明します．

## 整数変数と one-hot 表現の使い分け

- 個数・時刻・在庫量など**数量**を表す変数には，整数変数が適しています．
- 「どれを選ぶか」という**ラベル**（訪問順序・色など）には，
  整数変数よりも one-hot 表現
  （[置換行列](PERMUTATION)・[One-hot 制約](ONEHOT)）が適しています．

なお，ライセンスの変数数の上限では，整数変数 1 個は，
その範囲（上限 − 下限）を $r$ とすると，次の個数のバイナリ変数分として
カウントされます:

$$
\lceil \log_2 (r+1) \rceil
$$

詳細は[ライセンス管理](../LICENSE_MANAGEMENT)を参照してください．
