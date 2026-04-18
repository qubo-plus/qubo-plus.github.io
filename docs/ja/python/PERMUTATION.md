---
layout: default
nav_exclude: true
title: "Permutation Matrix"
nav_order: 6
lang: ja
hreflang_alt: "en/python/PERMUTATION"
hreflang_lang: "en"
---

# 置換行列の生成

多くの組合せ最適化問題は、最適な置換を見つけることが目的であるという意味で、置換に基づいています。
このような最適化問題を定式化するための基本的な手法として、QUBO定式化ではバイナリ変数の行列が使用されます。

## 置換行列
$X=(x_{i,j})$ ($0\leq i,j\leq n-1$) を $n\times n$ のバイナリ値の行列とします。
行列 $X$ が**置換行列**であるとは、以下に示すように、すべての行とすべての列にちょうど1つの1のエントリがある場合に限ります。

<p align="center">
  <img src="../../images/matrix.svg" alt="Permutation matrix" width="50%">
</p>

**置換行列**は $n$ 個の数 $(0,1,\ldots,n-1)$ の置換を表し、$x_{i,j} = 1$ であることと $i$ 番目の要素が $j$ であることが同値です。
例えば、上記の置換行列は置換 $(1,3,0,2)$ を表しています。

## 置換行列のQUBO定式化
バイナリ変数行列 $X=(x_{i,j})$ ($0\leq i,j\leq n-1$) が置換行列を格納しているのは、各行と各列の合計が1である場合に限ります。
したがって、以下のQUBO関数は $X$ が置換行列を格納している場合に限り最小値0をとります:

$$
\begin{aligned}
f(X) &= \sum_{i=0}^{n-1}\left(1-\sum_{j=0}^{n-1}x_{i,j}\right)^2+\sum_{j=0}^{n-1}\left(1-\sum_{i=0}^{n-1}x_{i,j}\right)^2
\end{aligned}
$$

## 置換行列を生成するPyQBPPプログラム
バイナリ変数の2次元配列は、`shape=` キーワード引数にタプルを渡して作成します。
例えば、**`qbpp.var("x", shape=(4, 4))`** は $4\times 4$ のバイナリ変数 array
を返し、各要素には `x[i][j]` でアクセスできます。
`shape=(2, 3, 4)` のようなタプルで高次元配列も同様に作成できます。
詳細は [多次元変数](MULTIDIM) を参照してください。

上記の式 $f(X)$ に基づいて、以下のようにPyQBPPプログラムを設計できます:
```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(4, 4))
f = qbpp.expr()

for i in range(4):
    s = qbpp.expr()
    for j in range(4):
        s += x[i][j]
    f += qbpp.sqr(1 - s)

for j in range(4):
    s = qbpp.expr()
    for i in range(4):
        s += x[i][j]
    f += qbpp.sqr(1 - s)

f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)
for k, sol in enumerate(result.sols):
    print(f"Solution {k} : {sol(x)}")
```

このプログラムでは、**`qbpp.var("x", shape=(4, 4))`** は **`x`** という名前の形状 $\{4, 4\}$ の array オブジェクトを返します。
`Expr` オブジェクト **`f`** に対して、2つの二重forループが $f(X)$ の式を追加します。
Exhaustive Solverを使用して、すべての最適解が計算され **`result.sols`** に格納されます。
`result.sols` 内のすべての解が1つずつ表示されます。
ここで、`sol(x)` は `sol` における `x` の値の行列 (array of int) を返します。
このプログラムは以下のように24個すべての置換を出力します:
```
Solution 0 : [[0, 0, 0, 1], [0, 0, 1, 0], [0, 1, 0, 0], [1, 0, 0, 0]]
Solution 1 : [[0, 0, 0, 1], [0, 0, 1, 0], [1, 0, 0, 0], [0, 1, 0, 0]]
Solution 2 : [[0, 0, 0, 1], [0, 1, 0, 0], [0, 0, 1, 0], [1, 0, 0, 0]]
Solution 3 : [[0, 0, 0, 1], [0, 1, 0, 0], [1, 0, 0, 0], [0, 0, 1, 0]]
Solution 4 : [[0, 0, 0, 1], [1, 0, 0, 0], [0, 0, 1, 0], [0, 1, 0, 0]]
Solution 5 : [[0, 0, 0, 1], [1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0]]
Solution 6 : [[0, 0, 1, 0], [0, 0, 0, 1], [0, 1, 0, 0], [1, 0, 0, 0]]
Solution 7 : [[0, 0, 1, 0], [0, 0, 0, 1], [1, 0, 0, 0], [0, 1, 0, 0]]
Solution 8 : [[0, 0, 1, 0], [0, 1, 0, 0], [0, 0, 0, 1], [1, 0, 0, 0]]
Solution 9 : [[0, 0, 1, 0], [0, 1, 0, 0], [1, 0, 0, 0], [0, 0, 0, 1]]
Solution 10 : [[0, 0, 1, 0], [1, 0, 0, 0], [0, 0, 0, 1], [0, 1, 0, 0]]
Solution 11 : [[0, 0, 1, 0], [1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1]]
Solution 12 : [[0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0], [1, 0, 0, 0]]
Solution 13 : [[0, 1, 0, 0], [0, 0, 0, 1], [1, 0, 0, 0], [0, 0, 1, 0]]
Solution 14 : [[0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1], [1, 0, 0, 0]]
Solution 15 : [[0, 1, 0, 0], [0, 0, 1, 0], [1, 0, 0, 0], [0, 0, 0, 1]]
Solution 16 : [[0, 1, 0, 0], [1, 0, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]]
Solution 17 : [[0, 1, 0, 0], [1, 0, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
Solution 18 : [[1, 0, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0], [0, 1, 0, 0]]
Solution 19 : [[1, 0, 0, 0], [0, 0, 0, 1], [0, 1, 0, 0], [0, 0, 1, 0]]
Solution 20 : [[1, 0, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1], [0, 1, 0, 0]]
Solution 21 : [[1, 0, 0, 0], [0, 0, 1, 0], [0, 1, 0, 0], [0, 0, 0, 1]]
Solution 22 : [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]]
Solution 23 : [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
```
> **注釈**
> バイナリ変数の行列は array クラスを使用した多次元配列として実装されています。
> 例えば、`qbpp.var("x", shape=(4, 4))` は形状 `(4, 4)` の array オブジェクトを返します。
> 各 `Var` オブジェクトは `x[i][j]` として表され、`sol` における `x[i][j]` の値は `sol(x[i][j])` または `x[i][j](sol)` のいずれかで取得できます。


## 配列関数と演算を使った置換行列のQUBO定式化
**`qbpp.vector_sum()`** を使用して、バイナリ変数の行列 `x` の行方向と列方向の和を計算できます:
- **`qbpp.vector_sum(x, 1)`**: `x` の各行の和を計算し、それらの和を含むサイズ `n` の配列を返します。
- **`qbpp.vector_sum(x, 0)`**: `x` の各列の和を計算し、それらの和を含むサイズ `n` の配列を返します。

> **注釈**:
> 多次元配列 `x` と軸 `k` に対して、`qbpp.vector_sum(x, k)` は軸 `k` に沿った和を計算し、次元が1つ減った多次元配列を返します。
> 2次元配列（行列）`x` の場合、軸 `1` は行方向に、軸 `0` は列方向に対応します。

スカラー-配列演算を使用して、各要素から1を引くことができます:
- **`qbpp.vector_sum(x, 1) - 1`**: 行方向の各和から1を引きます。
- **`qbpp.vector_sum(x, 0) - 1`**: 列方向の各和から1を引きます。

これら2つのサイズ `n` の配列に対して、`qbpp.sqr()` は各要素を2乗し、`qbpp.sum()` はすべての要素の和を計算します。

以下のPyQBPPプログラムは、これらの配列関数と演算を使用してQUBO定式化を実装しています:
```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(4, 4))
f = qbpp.sum(qbpp.sqr(qbpp.vector_sum(x, 1) - 1)) + \
    qbpp.sum(qbpp.sqr(qbpp.vector_sum(x, 0) - 1))
f.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)
for k, sol in enumerate(result.sols):
    row = qbpp.onehot_to_int(sol(x), 1)
    column = qbpp.onehot_to_int(sol(x), 0)
    print(f"Solution {k}: {row}, {column}")
```
このプログラムでは、`sol(x)` は `sol` における `x` に割り当てられた値の行列を返します。これは整数のサイズの行列です。
`qbpp.onehot_to_int()` は軸に沿ったone-hot配列を対応する整数に変換します。
- **`qbpp.onehot_to_int(sol(x), 1)`**: 各行に対応する整数を計算し、4つの整数の配列として返します。これが置換を表します。
- **`qbpp.onehot_to_int(sol(x), 0)`**: 各列に対応する整数を返し、4つの整数の配列として返します。これが置換の逆を表します。

このプログラムはすべての置換とその逆を整数ベクトルとして以下のように出力します:
```
Solution 0: [3, 2, 1, 0], [3, 2, 1, 0]
Solution 1: [3, 2, 0, 1], [2, 3, 1, 0]
Solution 2: [3, 1, 2, 0], [3, 1, 2, 0]
Solution 3: [3, 1, 0, 2], [2, 1, 3, 0]
Solution 4: [3, 0, 2, 1], [1, 3, 2, 0]
Solution 5: [3, 0, 1, 2], [1, 2, 3, 0]
Solution 6: [2, 3, 1, 0], [3, 2, 0, 1]
Solution 7: [2, 3, 0, 1], [2, 3, 0, 1]
Solution 8: [2, 1, 3, 0], [3, 1, 0, 2]
Solution 9: [2, 1, 0, 3], [2, 1, 0, 3]
Solution 10: [2, 0, 3, 1], [1, 3, 0, 2]
Solution 11: [2, 0, 1, 3], [1, 2, 0, 3]
Solution 12: [1, 3, 2, 0], [3, 0, 2, 1]
Solution 13: [1, 3, 0, 2], [2, 0, 3, 1]
Solution 14: [1, 2, 3, 0], [3, 0, 1, 2]
Solution 15: [1, 2, 0, 3], [2, 0, 1, 3]
Solution 16: [1, 0, 3, 2], [1, 0, 3, 2]
Solution 17: [1, 0, 2, 3], [1, 0, 2, 3]
Solution 18: [0, 3, 2, 1], [0, 3, 2, 1]
Solution 19: [0, 3, 1, 2], [0, 2, 3, 1]
Solution 20: [0, 2, 3, 1], [0, 3, 1, 2]
Solution 21: [0, 2, 1, 3], [0, 2, 1, 3]
Solution 22: [0, 1, 3, 2], [0, 1, 3, 2]
Solution 23: [0, 1, 2, 3], [0, 1, 2, 3]
```

## 割当問題とそのQUBO定式化
$C = (c_{i,j})$ をサイズ $n \times n$ のコスト行列とします。
$C$ に対する**割当問題**は、総コストを最小化する置換
$p:\lbrace 0,1,\ldots, n-1\rbrace \rightarrow \lbrace 0,1,\ldots, n-1\rbrace$
を見つける問題です:

$$
\begin{aligned}
 g(p) &= \sum_{i=0}^{n-1}c_{i,p(i)}
\end{aligned}
$$

この問題のQUBO定式化には、サイズ $n \times n$ の置換行列 $X = (x_{i,j})$ を使用し、以下のように定義します:

$$
\begin{aligned}
 g(X) &= \sum_{i=0}^{n-1}\sum_{j=0}^{n-1}c_{i,j}x_{i,j}
\end{aligned}
$$

明らかに、$X$ が置換 $p$ を表す場合にのみ $g(p) = g(X)$ が成り立ちます。

置換行列のQUBO定式化 $f(X)$ と総コスト $g(X)$ を組み合わせて、割当問題のQUBO定式化を得ます:

$$
\begin{aligned}
 h(X) &= P\cdot f(X)+g(X) \\
     &=P\left(\sum_{i=0}^{n-1}\left(1-\sum_{j=0}^{n-1}x_{i,j}\right)^2+\sum_{j=0}^{n-1}\left(1-\sum_{i=0}^{n-1}x_{i,j}\right)^2\right)+\sum_{i=0}^{n-1}\sum_{j=0}^{n-1}c_{i,j}x_{i,j}
\end{aligned}
$$

ここで、$P$ は $f(X)$ にエンコードされた置換制約を優先するための十分に大きな正の定数です。

## 割当問題のPyQBPPプログラム
これで割当問題のPyQBPPプログラムを設計する準備が整いました。
このプログラムでは、サイズ $4\times4$ の固定行列 $C$ が配列として与えられます。
`qbpp.array()` はネストされたPythonリストを自動的にネストされた配列オブジェクトに変換するため、多次元配列を簡潔に作成できます。
$f(X)$ と $g(X)$ の式は配列関数と演算を使用して定義されます。
ここで、`qbpp.constrain(qbpp.vector_sum(x, 1), equal=1)` は等式 `vector_sum(x, 1) == 1` が満たされた場合に最小値0を取るQUBO式の配列を返します。
実際には、`qbpp.sqr(qbpp.vector_sum(x, 1) - 1)` と同じQUBO式を返します。
また、`c * x` は `c` と `x` の要素ごとの積を計算して得られる行列を返すため、`qbpp.sum(c * x)` は `g(X)` を返します。

```python
import pyqbpp as qbpp

c = qbpp.array([[58, 73, 91, 44],
                [62, 15, 87, 39],
                [78, 56, 23, 94],
                [11, 85, 68, 72]])
x = qbpp.var("x", shape=(4, 4))
f = qbpp.sum(qbpp.constrain(qbpp.vector_sum(x, 1), equal=1)) + \
    qbpp.sum(qbpp.constrain(qbpp.vector_sum(x, 0), equal=1))
g = qbpp.sum(c * x)
h = 1000 * f + g
h.simplify_as_binary()

solver = qbpp.EasySolver(h)
sol = solver.search(time_limit=1.0)
print("sol =", sol)
result = qbpp.onehot_to_int(sol(x), 1)
print("Result :", result)
for i in range(len(result)):
    print(f"c[{i}][{result[i]}] = {c[i][result[i]]}")
```

Easy Solverを使用して `h` の解を求めます。
`h` に対するEasy Solverオブジェクト `solver` について、`search()` に `time_limit=1.0` を渡すことで解の探索の制限時間を1.0秒に設定しています。
得られた置換は `result` に格納され、選択された `c[i][j]` の値が順に出力されます。
このプログラムの出力は以下のとおりです:

```
sol = 93:{x[0][0]: 0, x[0][1]: 0, x[0][2]: 0, x[0][3]: 1, x[1][0]: 0, x[1][1]: 1, x[1][2]: 0, x[1][3]: 0, x[2][0]: 0, x[2][1]: 0, x[2][2]: 1, x[2][3]: 0, x[3][0]: 1, x[3][1]: 0, x[3][2]: 0, x[3][3]: 0}
Result : [3, 1, 2, 0]
c[0][3] = 44
c[1][1] = 15
c[2][2] = 23
c[3][0] = 11
```
> **注釈**
> 式 `f` と整数 `m` に対して、`qbpp.constrain(f, equal=m)` は式 `sqr(f - m)` を返します。
> これは等式 `f == m` が満たされる場合に限り最小値0をとります。
