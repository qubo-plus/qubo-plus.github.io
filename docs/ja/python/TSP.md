---
layout: default
nav_exclude: true
title: "TSP"
nav_order: 62
lang: ja
hreflang_alt: "en/python/TSP"
hreflang_lang: "en"
---

# 巡回セールスマン問題
巡回セールスマン問題（TSP）は、すべての頂点をちょうど1回ずつ訪問して出発点に戻る最短巡回路を求める問題です。
頂点は平面上に配置され、巡回路の長さはユークリッド距離で測られるものとします。

以下の図は、9頂点と最適巡回路の例を示しています:

<p align="center">
  <img src="../../images/tsp_solution.svg" alt="頂点とTSPの解の例" width="50%">
</p>


## TSPのQUBO定式化
巡回路は頂点の順列として表現できます。
そこで、TSPの解を符号化するために[置換行列](PERMUTATION)を使用します。

$X=(x_{i,j})$（$0\leq i,j\leq n-1$）を $n\times n$ のバイナリ値の行列とします。
行列 $X$ は**置換行列**であり、各行と各列にちょうど1つの1が含まれます。以下に例を示します。

<p align="center">
  <img src="../../images/matrix.svg" alt="4x4の置換行列" width="50%">
</p>

$x_{k,i}$ を「巡回路の $k$ 番目の位置が頂点 $i$ である」と解釈します。
したがって、$X$ のすべての行とすべての列はone-hotでなければなりません。すなわち以下の制約が成り立つ必要があります:

$$
\begin{aligned}
{\rm row}:& \sum_{j=0}^{n-1}x_{i,j}=1 & (0\leq i\leq n-1)\\
{\rm column}:& \sum_{i=0}^{n-1}x_{i,j}=1 & (0\leq j\leq n-1)
\end{aligned}
$$

$d_{i,j}$ を頂点 $i$ と $j$ の間の距離とします。
置換行列 $X$ に対する巡回路の長さは次のように書けます:

$$
\begin{aligned}
{\rm objective}: &\sum_{k=0}^{k-1} d_{i,j}x_{k,i}x_{(k+1)\bmod n,j}
\end{aligned}
$$

この式は、頂点 $i$ が位置 $k$ で訪問され、頂点 $j$ が次の位置（$(k+1)\bmod n$）で訪問されるときにちょうど $d_{i,j}$ を加算するので、巡回路の総距離に等しくなります。

## TSPのPyQBPPプログラム
上記の置換行列による定式化を用いて、TSPのPyQBPPプログラムを以下のように記述できます:
{% raw %}
```python
import math
import pyqbpp as qbpp

nodes = [(10, 12),  (33, 125),  (12, 226),
         (121, 11), (108, 142), (111, 243),
         (220, 4),  (210, 113), (211, 233)]

def dist(i, j):
    dx = nodes[i][0] - nodes[j][0]
    dy = nodes[i][1] - nodes[j][1]
    return round(math.sqrt(dx * dx + dy * dy))

n = len(nodes)
x = qbpp.var("x", shape=(n, n))

constraint = qbpp.sum(qbpp.constrain(qbpp.vector_sum(x, 1), equal=1)) + \
             qbpp.sum(qbpp.constrain(qbpp.vector_sum(x, 0), equal=1))

objective = qbpp.expr()
for i in range(n):
    next_i = (i + 1) % n
    for j in range(n):
        for k in range(n):
            if k != j:
                objective += dist(j, k) * x[i][j] * x[next_i][k]

f = objective + constraint * 1000
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)

# 置換行列から巡回路（頂点番号のリスト）を抽出
tour = []
for i in range(n):
    for j in range(n):
        if sol(x[i][j]) == 1:
            tour.append(j)
            break
print(f"Tour: {tour}")
```
{% endraw %}
このプログラムでは、頂点 `0` から `8` の座標がリスト `nodes` に格納されており、ヘルパー関数 `dist(i, j)` が2頂点間の丸めたユークリッド距離を計算します。
バイナリ変数の2次元配列 `x` を作成し、one-hot制約と巡回路長の目的関数を構成します。
これらの項は、制約にペナルティ重み（ここでは `1000`）を付けて加算することで、1つのQUBO式 `f` にまとめられます。実行可能性が優先されます。

次に、1.0秒の制限時間で `EasySolver` を使って `f` を解きます。
得られた割り当て `sol(x)` は置換行列を形成します。
この行列を、各行で値が1のエントリを探すことで整数のリスト（順列）`tour` に変換し、出力します。

このプログラムは以下の出力を生成します:
```
Tour: [7, 8, 5, 2, 4, 1, 0, 3, 6]
```

## 最初の頂点の固定
一般性を失うことなく、頂点0を巡回路の出発点と仮定できます。
TSPの巡回路は巡回シフトに対して不変であるため、出発位置を固定しても最適巡回路長は変わりません。

出発頂点を固定することで、QUBO式中のバイナリ変数の数を削減できます。
具体的には、置換行列において頂点0を位置0に割り当てることを強制します。
そのために、以下のバイナリ変数を固定します:

$$
\begin{aligned}
x_{0,0} &= 1\\
x_{i,0} &= 0& (i\geq 1)\\
x_{0,j} &= 0& (j\geq 1)
\end{aligned}
$$

これらの割り当てにより、頂点0は位置0にのみ現れ、他の頂点は位置0に割り当てられません。
結果として、実効的な問題サイズが削減され、局所探索ベースのソルバーにとってQUBOが解きやすくなります。

## 最初の頂点を固定するPyQBPPプログラム
PyQBPPでは、固定された変数の割り当てを、変数から値へのPython辞書を `qbpp.replace()` 関数に渡すことで適用できます:
{% raw %}
```python
ml = {x[0][0]: 1}
ml.update({x[i][0]: 0 for i in range(1, n)})
ml.update({x[0][i]: 0 for i in range(1, n)})

g = qbpp.replace(f, ml)
g.simplify_as_binary()

solver = qbpp.EasySolver(g)
sol = solver.search(time_limit=1.0)

full_sol = qbpp.Sol(f).set(sol, ml)

# 置換行列から巡回路（頂点番号のリスト）を抽出
tour = []
for i in range(n):
    for j in range(n):
        if full_sol(x[i][j]) == 1:
            tour.append(j)
            break
print(f"Tour: {tour}")
```
{% endraw %}
まず、変数の固定割り当てを格納するPython辞書 `ml` を作成します。
各キーはバイナリ変数、各値はその固定値（`0` または `1`）です。

次に、`qbpp.replace(f, ml)` を呼び出します。これは `ml` で指定された固定値を元のQUBO式 `f` に代入して得られる新しい式を返します。
結果の式は `g` に格納され、簡約化されます。

次に、`g` に対するソルバーを作成して解 `sol` を得ます。
`sol` は縮小された問題に対応するため、`f` に対する `qbpp.Sol` オブジェクトを作成し、ソルバーの出力 `sol` と固定割り当て `ml` の両方を `set(sol, ml)` で設定します。
結果の `full_sol` は `x` のすべての変数に対する完全な割り当てを格納します。

最後に、`full_sol(x)` で表される置換行列を各行の走査により順列に変換し、出力します。

このプログラムは頂点0から始まる以下の巡回路を生成します:
```
Tour: [0, 3, 6, 7, 8, 5, 2, 1, 4]
```

## matplotlibによる可視化
以下のコードはTSPの解を可視化します。各頂点はラベル付きの点として描画され、巡回路の各辺は赤い有向矢印として表示されます:
{% raw %}
```python
import matplotlib.pyplot as plt

plt.figure(figsize=(6, 6))
for i, (nx_, ny) in enumerate(nodes):
    plt.plot(nx_, ny, "ko", markersize=8)
    plt.annotate(str(i), (nx_, ny), textcoords="offset points", xytext=(5, 5))

for i in range(n):
    fr = tour[i]
    to = tour[(i + 1) % n]
    plt.annotate("", xy=(nodes[to][0], nodes[to][1]),
                 xytext=(nodes[fr][0], nodes[fr][1]),
                 arrowprops=dict(arrowstyle="->", color="#e74c3c", lw=2))
plt.title("TSP Tour")
plt.savefig("tsp.png", dpi=150, bbox_inches="tight")
plt.show()
```
{% endraw %}
巡回路は、訪問順に頂点を結ぶ赤い有向矢印で表示されます。
