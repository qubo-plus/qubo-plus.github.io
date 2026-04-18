---
layout: default
nav_exclude: true
title: "N-Queens"
nav_order: 81
lang: ja
hreflang_alt: "en/python/QUEENS"
hreflang_lang: "en"
---

# N-Queens 問題
**8-Queens 問題**は、チェス盤上に8つのクイーンを、互いに攻撃し合わないように配置する問題です。すなわち、同じ行、同じ列、同じ対角線（どちらの方向も）を共有するクイーンが存在しないようにします。
**N-Queens 問題**はこれを一般化したもので、$N\times N$ のチェス盤上に同じ条件のもとで $N$ 個のクイーンを配置します。

この問題を PyQBPP で定式化するために、$N\times N$ のバイナリ変数の行列 $X=(x_{i,j})$ を用います。ここで、$x_{i,j}=1$ は行 $i$、列 $j$ にクイーンが配置されていることを表し、$x_{i,j}=0$ はそうでないことを表します。
以下の制約を課します：
- 各行にちょうど1つのクイーン：

$$
\begin{aligned}
\sum_{j=0}^{N-1} x_{i,j}&=1 && (0\leq i\leq N-1)
\end{aligned}
$$

- 各列にちょうど1つのクイーン：

$$
\begin{aligned}
\sum_{i=0}^{N-1} x_{i,j}&=1 && (0\leq j\leq N-1)
\end{aligned}
$$

- 各対角線（左上から右下）に最大1つのクイーン：
対角線は $i+j=k$ で特徴づけられます。
長さ2以上の対角線のみを考え、すなわち $k=1,2,\ldots,2N−3$ に対して以下を要求します：

$$
\begin{aligned}
0\leq \sum_{\substack{0\le i,j \le N-1\\ i+j=k}}x_{i,j}\leq 1 &&(1\leq k\leq 2N-3)
\end{aligned}
$$

- $X$ の各反対角線の和が0または1：
反対角線は $j−i=d$ で特徴づけられます。
長さ2以上の反対角線のみを考え、すなわち $d=−(N−2),\ldots,(N−2)$ に対して以下を要求します：

$$
\begin{aligned}
0\leq \sum_{\substack{0\le i,j \le N-1\\ j-i=d}}x_{i,j}\leq 1 &&(-(N-2)\leq d\leq (N-2))
\end{aligned}
$$

## PyQBPP プログラム
以下の PyQBPP プログラムは、上記の制約を表す式を構築し、Easy Solver を用いて実行可能解を求めます：
{% raw %}
```python
import pyqbpp as qbpp

n = 8
x = qbpp.var("x", shape=(n, n))

f = qbpp.sum(qbpp.constrain(qbpp.vector_sum(x, 0), equal=1)) + \
    qbpp.sum(qbpp.constrain(qbpp.vector_sum(x, 1), equal=1))

m = 2 * n - 3
a = qbpp.expr(shape=m)
b = qbpp.expr(shape=m)

for i in range(m):
    k = i + 1
    for r in range(n):
        c = k - r
        if 0 <= c < n:
            a[i] += x[r][c]

    d = i - (n - 2)
    for r in range(n):
        c = r + d
        if 0 <= c < n:
            b[i] += x[r][c]

f += qbpp.sum(qbpp.constrain(a, between=(0, 1)))
f += qbpp.sum(qbpp.constrain(b, between=(0, 1)))

f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=0)
for i in range(n):
    for j in range(n):
        print("Q" if sol(x[i][j]) == 1 else ".", end="")
    print()
```
{% endraw %}
`n`$\times$`n` のバイナリ変数の行列 `x` を導入し、`x[i][j] = 1` は行 `i`、列 `j` にクイーンが配置されていることを示します。
列方向の和は `qbpp.vector_sum(x, 0)` を用いて計算され、`n` 個の式のベクトル（各列に1つ）を返します。
`qbpp.constrain(..., equal=1)` を要素ごとに適用すると、ペナルティ式のベクトルが生成されます。各式は、対応する列の和が1に等しい場合にのみ0と評価されます。
同様に、`qbpp.vector_sum(x, 1)` を用いて行方向の one-hot 制約を課すことができます。
ペナルティ式のベクトルを `qbpp.sum(...)` で包むことで、各ベクトルは単一のスカラー式に集約され、`f` に組み込まれます。

対角線制約を課すために、長さ `m = 2*n - 3` の2つの式ベクトル `a` と `b` を `qbpp.expr(shape=m)` を用いて構築します。`qbpp.expr(shape=m)` はゼロ式からなる1次元配列を生成します。
各インデックス `i` について、`a[i]` は `r + c` の値が固定された対角線（左上から右下）上の変数を累積します（長さ1の対角線は除外）。
同様に、`b[i]` は `c - r` の値が固定された反対角線（右上から左下）上の変数を累積します（長さ1の対角線は除外）。
要素ごとの範囲制約 `qbpp.constrain(a, between=(0, 1))`（`b` も同様）は、各対角線/反対角線に最大1つのクイーンが含まれる場合にのみ0となるペナルティ式のベクトルを生成します。
これらのペナルティは `qbpp.sum(...)` で集約され、`f` に加算されます。

インプレース呼び出し `f.simplify_as_binary()` で式をバイナリ QUBO 形式に変換した後、`search()` にキーワード引数 `target_energy=0` を渡して Easy Solver が目標エネルギー 0 の解を探索します。
返されるオブジェクト `sol` は呼び出し構文 `sol(x[i][j])` をサポートし、バイナリ変数 `x[i][j]` に割り当てられた値（0 または 1）を返します。
得られた割り当て `sol` は 8x8 の盤面として出力され、`Q` はクイーン、`.` は空のマスを表します。
`sol(x[i][j])` は整数値を返すため、`1` と比較して `Q` または `.` を出力するかを判定します。
例えば、プログラムは以下のような出力を生成する場合があります：
```
..Q.....
.....Q..
.......Q
.Q......
...Q....
Q.......
......Q.
....Q...
```
この出力は、同じ行、列、対角線、反対角線を共有するクイーンが存在しないため、8つのクイーンの有効な配置であることを確認しています。
