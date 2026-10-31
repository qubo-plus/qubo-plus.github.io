---
last_modified: 2026-10-14
layout: default
nav_exclude: true
title: "範囲制約"
nav_order: 9
lang: ja
hreflang_alt: "en/python/RANGE"
hreflang_lang: "en"
---

# 範囲制約と整数線形計画法の求解

## 整数線形計画法の求解
**整数線形計画法**のインスタンスは、**目的関数**と複数の**線形制約**から構成されます。
例えば、以下の整数線形計画は2つの変数、1つの目的関数、2つの制約を持ちます：

$$
\begin{aligned}
\text{Maximize: } & & & 5x + 4y \\
\text{Subject to: } & && 2x + 3y \le 24 \\
                   & & & 7x + 5y \le 54
\end{aligned}
$$

この問題の最適解は $x=4$, $y=5$ で、目的関数の値は $40$ です。

以下のPyQBPPプログラムは、[整数変数](INTEGER) `x`，`y` を使い，Easy Solverでこの最適解を求めます：
```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 10))
y = qbpp.var("y", integer=(0, 10))
f = 5 * x + 4 * y
g = -f + 100 * qbpp.cons(2 * x + 3 * y <= 24) + 100 * qbpp.cons(7 * x + 5 * y <= 54)
g.simplify()
print("g =", g)

solver = qbpp.EasySolver(g)
sol = solver.search(time_limit=1.0)
print(f"x = {sol(x)}, y = {sol(y)}")
print(f"f = {sol(f)}")
print(f"violated constraints = {g.cons(sol)}")
```

このプログラムでは、
- **`f`** は目的関数を表し、
- **`qbpp.cons(2 * x + 3 * y <= 24)`** と **`qbpp.cons(7 * x + 5 * y <= 54)`** は2つの制約を表し、
- **`g`** はそれらを1つの最適化式にまとめたものです。

目標が最大化であるため、目的関数は `-f` として符号を反転しています。
`qbpp.cons()` で囲んだ比較式は**制約として特別に処理**され、
バンドルされたソルバーは制約を満たすように効率よく探索を行います。
制約に違反すると，違反量（この例では左辺が右辺を超えた量）の 2 乗に重み 100 を掛けたペナルティが加わります．
重みは，制約を破って目的関数を改善しても得にならないよう，十分大きな値にします．

`g` に対してEasy Solverのインスタンスを作成し、制限時間1.0秒を `search()` のパラメータとして渡して探索を実行します。
`g.cons(sol)` は解 `sol` で違反している制約の本数を返します（0 なら全制約を充足）。
プログラムの出力は以下の通りです：
```
g = -5*x -4*y
+100*cons(2*x +3*y <= 24)
+100*cons(7*x +5*y <= 54)
x = 4, y = 5
f = 40
violated constraints = 0
```

`g` を出力すると，目的関数の多項式に続いて，宣言した制約が 1 行ずつ表示されます．
ソルバーが正しく最適解を見つけていることが確認できます。

## 範囲制約
制約には，片側の不等式のほかに，**範囲制約** $l \leq f \leq u$ も書けます．
`qbpp.cons()` で書ける制約は次の 4 種類です:

| 書き方 | 意味 |
|---|---|
| `qbpp.cons(f <= u)` | $f \leq u$ |
| `qbpp.cons(f >= l)` | $f \geq l$ |
| `qbpp.cons(f, between=(l, u))` | $l \leq f \leq u$（範囲制約） |
| `qbpp.cons(f == v)` | $f = v$ |

範囲制約を `l <= f <= u` と続けて書くことは Python の言語仕様上できないため，
`between=(l, u)` で指定します（PyQBPP はこの形を検出してエラーにします）．

例えば，上の問題に「$x - y$ が 1 以上 3 以下」という範囲制約を加えると，最適解は $x=5$，$y=3$（目的関数値 $37$）に変わります:

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 10))
y = qbpp.var("y", integer=(0, 10))
f = 5 * x + 4 * y
g = -f + 100 * qbpp.cons(2 * x + 3 * y <= 24) + 100 * qbpp.cons(7 * x + 5 * y <= 54)
g += 100 * qbpp.cons(x - y, between=(1, 3))
g.simplify()

solver = qbpp.ExhaustiveSolver(g)
sol = solver.search()
print(f"x = {sol(x)}, y = {sol(y)}")
print(f"f = {sol(f)}")
print(f"violated constraints = {g.cons(sol)}")
```

ここでは Exhaustive Solver で全探索し，厳密な最適解を求めています．
プログラムの出力は以下の通りです:
```
x = 5, y = 3
f = 37
violated constraints = 0
```

`cons()` で宣言した制約は、バンドルされた 3 つのソルバー（Easy Solver・
Exhaustive Solver・ABS3 Solver）すべてで同じ意味を持ち、Exhaustive Solver は
このペナルティ込みエネルギーの**厳密な最小解**を返します。
MIP ソルバー（SCIP 等）では `ilp=True` を指定すると**ハード制約**
（必ず満たすべき制約）として扱われます。
詳細は[ネイティブ制約](CONSTRAINTS)をご覧ください。

## ペナルティ式による範囲制約
`qbpp.cons()` の代わりに `qbpp.constrain()` を使うと，QUBO・HUBO として表せる**ペナルティ式**（制約が満たされるとき，かつそのときに限り最小値 0 をとる式）が作られます．
引数の書き方は `qbpp.cons()` と同じで，範囲制約は `between=(l, u)`、等式制約は `equal=n` で指定します．
バイナリ変数しか扱えない外部の QUBO ソルバーに渡すときは，このペナルティ式を使います．

範囲制約 $l\leq f\leq u$ のペナルティ式は，範囲 $[l,u]$ の値をとる**補助整数変数** $a$ を導入して作ります:

$$
\begin{aligned}
g &= (f-a)^2
\end{aligned}
$$

この式 $g$ は $f=a$ のときちょうど最小値0を取ります。
$a$ は $[l,u]$ の任意の整数値を取れるため、
式 $g$ が0になるのは $f$ 自体が同じ範囲内の整数値を取るときかつそのときに限ります。
補助変数 $a$ は[バイナリエンコードの整数変数](BINARY_INTEGER)として導入されます．
$f$ が線形式の場合、$g$ はQUBO式になります。
$f$ が2次以上の場合、$g$ はHUBO式になります（$g$ の次数は $f$ の2倍になるため）。

ペナルティ式では範囲制約ごとにこの補助変数が必要ですが、
`qbpp.cons()` で宣言した場合は補助変数を導入しません。
モデルの変数数と項数がどれだけ変わるかは、
[ネイティブ制約](CONSTRAINTS)の「ペナルティ式との比較」で比べています。
`qbpp.cons()` で書いたモデルは，[`qbpp.expand_cons()`](CONSTRAINTS#従来のペナルティ式への展開) でペナルティ式に展開できます．

>**NOTE**
> PyQBPPは内部的に軽量な改善を施しており、範囲制約をわずかに少ないバイナリ変数数で符号化できます。
> 詳細は[比較演算子](COMPARISON)に記載されています。
