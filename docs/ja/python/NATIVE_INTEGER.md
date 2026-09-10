---
last_modified: 2026-08-24
layout: default
nav_exclude: true
title: "ネイティブ整数変数"
nav_order: 52
lang: ja
hreflang_alt: "en/python/NATIVE_INTEGER"
hreflang_lang: "en"
---

# ネイティブ整数変数

[整数変数と連立方程式の求解](INTEGER)では，複数のバイナリ変数を組み合わせて
整数を表現する方法を説明しました．PyQBPP はこれに加えて，
**整数値をそのまま保持するネイティブ整数変数**をサポートしています．
`qbpp.var()` の `integer=` キーワードで宣言した変数はバイナリ変数に展開されず，
QUBO++ にバンドルされているソルバー
（[EasySolver](EASYSOLVER)・[ABS3 Solver](ABS3)・[Exhaustive Solver](EXHAUSTIVE)）が
整数値を直接扱って効率よく探索を行います．

## 宣言と基本的な使い方

ネイティブ整数変数は，`integer=(下限, 上限)` を指定して宣言します．
範囲の指定は必須です．宣言した変数は通常の変数と同じように式の中で使えます:

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 10))
f = x * x - 4 * x
f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()
print(f"x = {sol(x)}")
print(f"f = {sol.energy}")
```

プログラムの出力は以下の通りです:

```
x = 2
f = -4
```

`x * x` のような冪に，バイナリ変数の規則（$x \cdot x = x$）は適用されず，
整数の二乗としてそのまま扱われる点に注意してください．

## 連立方程式を解く例

次のプログラムは，連立方程式 $x + 2y = 700$，$x - y = 100$ を
2 乗誤差の最小化として解きます:

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 1000))
y = qbpp.var("y", integer=(-1000, 1000))
f = qbpp.sqr(x + 2 * y - 700) + qbpp.sqr(x - y - 100)
f.simplify_as_binary()
solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)
print(f"x = {sol(x)}, y = {sol(y)}")
print(f"f = {sol.energy}")
```

プログラムの出力は以下の通りです:

```
x = 300, y = 200
f = 0
```

## 整数変数の配列

`qbpp.var()` に次元と `integer=` を同時に指定すると，
ネイティブ整数変数の配列が作れます．要素には `s[i]` でアクセスし，
`s.sum()` で総和の式が作れます:

```python
import pyqbpp as qbpp

s = qbpp.var("s", 3, integer=(0, 9))
t = s.sum()
f = qbpp.sqr(t - 6) + qbpp.sqr(s[0] - s[1] + 1) + qbpp.sqr(s[1] - s[2] + 1)
f.simplify_as_binary()
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

## 要素ごとに範囲が異なる配列

`integer=` の下限・上限には，スカラーの代わりにリストも指定できます．
リストを指定すると，要素ごとに個別の範囲を持つネイティブ整数変数の
配列が作られます（スカラー側の値は全要素で共有されます）．
下限と上限が等しい要素は，その値に固定された定数になります:

```python
import pyqbpp as qbpp

max_vals = [3, 7, 15, 5]
x = qbpp.var("x", shape=len(max_vals), integer=(0, max_vals))
f = qbpp.sqr(qbpp.sum(x) - 26) - x[0] - x[1] - x[2]
f.simplify_as_binary()
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

## 制約との併用

[ネイティブ制約](CONSTRAINTS)の `qbpp.cons()` は，
ネイティブ整数変数を含む式にもそのまま使えます:

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 5))
y = qbpp.var("y", integer=(0, 5))
f = -(2 * x + 3 * y) + 50 * qbpp.cons(x + y == 8)
f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()
print(f"x = {sol(x)}, y = {sol(y)}")
```

プログラムの出力は以下の通りです:

```
x = 3, y = 5
```

## 外部ソルバーとの連携

MIP ソルバーは整数変数をそのまま扱えるため，ネイティブ整数変数は
**整数の列として直接渡されます**（バイナリ変数には展開されません）．
目的関数が線形で制約を `qbpp.cons()` で書いたモデルは，
`qbpp.ScipSolver(f, ilp=True)` のように `ilp=True` を付ければ
MIP ソルバー（SCIP, HiGHS, CBC, GLPK）すべてで解けます．

一方，バイナリ変数専用の外部 QUBO ソルバーに渡す場合は，
`qbpp.binarize()` で[従来のバイナリエンコーディング](INTEGER)に
変換してください:

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 10))
f = x * x - 4 * x
g = qbpp.binarize(f)
g.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(g)
sol = solver.search()
print(f"minimum = {sol.energy}")
```

プログラムの出力は以下の通りです:

```
minimum = -4
```

## 使い分けの指針

- 個数・時刻・在庫量など**数量**を表す変数には，ネイティブ整数変数が適しています．
- 外部のバイナリ専用ソルバーに渡すモデルは，
  [バイナリエンコーディングの整数変数](INTEGER)（`between=`）を使うか，
  `qbpp.binarize()` で変換してください．
- 「どれを選ぶか」という**ラベル**（訪問順序・色など）には，
  ネイティブ整数変数よりも one-hot 表現
  （[置換行列](PERMUTATION)・[One-hot 制約](ONEHOT)）が適しています．

なお，ライセンスの変数数の上限では，ネイティブ整数変数 1 個は，
その範囲（上限 − 下限）を $r$ とすると，次の個数のバイナリ変数分として
カウントされます:

$$
\lceil \log_2 (r+1) \rceil
$$

