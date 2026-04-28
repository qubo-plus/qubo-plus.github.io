---
layout: default
nav_exclude: true
title: "QUBO Problem"
nav_order: 79
lang: ja
hreflang_alt: "en/python/QUBO"
hreflang_lang: "en"
---

# QUBO 問題

QUBO問題は，次の式 $f$ で定義されることが多いです．

$$
f(X) = \sum_{i=0}^{n-1}\sum_{j=0}^{n-1}w_{i,j}\, x_i x_j
$$

ここで $X = (x_0, x_1, \ldots, x_{n-1})$ は $n$ 個の二値変数，$W = (w_{i,j})$（$0 \leq i, j \leq n-1$）は係数を表す $n \times n$ の行列です．
つまり，行列 $W$ によって QUBO 式が定義されます．
このような形で QUBO 式が与えられた場合，PyQBPP では次のように簡単に式を構築し，解を探索できます．

```python
import pyqbpp as qbpp

w = [[1, -2, 1], [-4, 3, 2], [4, 2, -1]]
x = qbpp.var("x", shape=3)
f = qbpp.expr()
for i in range(3):
    for j in range(3):
        f += w[i][j] * x[i] * x[j]
f.simplify_as_binary()
print("f =", f)

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1)
print("sol =", sol)
```

このプログラムは $n = 3$ の例です．
$3 \times 3$ の Python リスト `w` を定義し，それをもとに式 `f` を構築しています．
`simplify_as_binary()` で二値変数のルール（$x_i^2 = x_i$）を適用して式を整理した後，EasySolver で解探索を行います．
このプログラムを実行すると，次の出力が得られます．

{% raw %}
```
f = x[0] +3*x[1] -x[2] -6*x[0]*x[1] +5*x[0]*x[2] +4*x[1]*x[2]
sol = Sol(energy=-2, {x[0]: 1, x[1]: 1, x[2]: 0})
```
{% endraw %}

## `einsum` を用いたより簡潔な書き方

上の二重 for ループは数式定義をそのまま書き下したものですが，同じ式は
[`qbpp.einsum`](EINSUM) の 1 行で書くこともできます．

```python
import pyqbpp as qbpp

W = qbpp.array([[1, -2, 1], [-4, 3, 2], [4, 2, -1]])
x = qbpp.var("x", shape=3)
f = qbpp.einsum("ij,i,j->", W, x, x)
f.simplify_as_binary()
print("f =", f)

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1)
print("sol =", sol)
```

ここでは `qbpp.array(...)` で $3 \times 3$ の整数配列 `W`（行列
$W = (w_{i,j})$ に対応）を作り，`qbpp.var("x", shape=3)` で二値変数ベクトル
$X = (x_0, x_1, x_2)$ を作成しています．

subscript `"ij,i,j->"` は数式 $\sum_{i,j} W_{ij}\, x_i\, x_j$ をそのまま
表しています．

- 第 1 入力 `W` はラベル `ij`（行列の行と列）．
- 第 2 入力 `x` はラベル `i`（`W` の行と対応）．
- 第 3 入力 `x` はラベル `j`（`W` の列と対応）．
- 右辺が空なので `i` と `j` は両方とも縮約（総和）され，結果は
  スカラー `Expr` になります．

得られる式 `f`，整理後の形，解はいずれも for ループ版とまったく同じです．
$n$ が大きい場合，`einsum` 版は処理が C++ バックエンド内で完結し
マルチスレッド化されるため，for ループ版で 1 反復ごとに発生する Python の
ctypes オーバーヘッドを回避でき，大幅に高速になります．
