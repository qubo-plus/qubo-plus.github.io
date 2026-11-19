---
last_modified: 2026-11-19
layout: default
nav_exclude: true
title: "構造制約: distinct・cycle・cycles"
nav_order: 27
lang: ja
hreflang_alt: "en/python/STRUCTURAL"
hreflang_lang: "en"
---

# 構造制約: distinct・cycle・cycles

割当（順列）・巡回路・配送ルートのように，解が決まった**形**をしていなければならない問題があります．
PyQBPP では，こうした形を 1 つの制約として宣言できます:

| 関数 | 変数 | 表す形 |
|---|---|---|
| `qbpp.distinct(x)` | $n \times m$ の配列（$n \le m$） | $n$ 個の項目が互いに異なる値をとる（$n = m$ なら順列） |
| `qbpp.cycle(...)` | 辺ごとに 1 つ | 選んだ辺がちょうど 1 つの閉路になる |
| `qbpp.cycles(x, depot=d)` | $K \times n \times n$ の配列 | $K$ 台の車両のルート |

これらは[`cons()`](CONSTRAINTS) と同じように式に足して使いますが，次の点が違います:

- **重みがありません．** `cons()` は違反量に応じた値をエネルギーに足す制約で，重みを小さくすると破られることがあります．
  構造制約は必ず守られる制約で，[Easy Solver](EASYSOLVER) と [ABS3 Solver](ABS3) が返す解は常に構造制約を満たします．
- **エネルギーに影響しません．** 構造制約を満たす解のエネルギーは，残りの式（目的関数と `cons()` など）の値です．

ワンホット制約を組み合わせて同じ形を表すこともできますが，構造制約で書くと，
重みの調整が不要になり，ソルバーは形の整った解だけを相手に探索します．

動画でも説明しています：[動画：構造制約](VIDEO_STRUCTURAL)（動画のプログラムと章ごとの説明）

## distinct: 互いに異なる値

`qbpp.distinct(x)` の `x` は $n \times m$ のバイナリ変数の配列で，`x[i][v] = 1` は「項目 $i$ が値 $v$ をとる」を表します．
各行にちょうど 1 つ，各列に高々 1 つの 1 がある，という制約です．

4 人に 4 つの仕事を 1 つずつ割り当てる問題を解きます．`cost[i][j]` は作業者 $i$ が仕事 $j$ を行うコストです:

```python
import pyqbpp as qbpp

cost = qbpp.array([[7, 3, 8, 6], [5, 9, 4, 7], [6, 8, 5, 3], [4, 6, 9, 5]])
x = qbpp.var("x", shape=(4, 4))
f = qbpp.sum(cost * x) + qbpp.distinct(x)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)
print("cost =", sol.energy)
print("job =", qbpp.onehot_to_int(sol(x)))
```

`qbpp.sum(cost * x)` が総コスト，`qbpp.distinct(x)` が「4 人が互いに異なる仕事をする」という制約です．
出力は次のようになります:

```
cost = 14
job = [1, 2, 3, 0]
```

作業者 0・1・2・3 がそれぞれ仕事 1・2・3・0 を行い，総コストは $3 + 4 + 3 + 4 = 14$ です．

### 選べる値を制限する

「作業者 0 は仕事 1 ができない」「作業者 1 は仕事 3 に決まっている」のような条件は，
[`qbpp.replace()`](REPLACE) で変数を定数に置き換えて表します:

- 変数を **0** に置き換える: その選択肢を取り除く
- 変数を **1** に置き換える: その選択に固定する

```python
import pyqbpp as qbpp

cost = qbpp.array([[7, 3, 8, 6], [5, 9, 4, 7], [6, 8, 5, 3], [4, 6, 9, 5]])
x = qbpp.var("x", shape=(4, 4))
f = qbpp.sum(cost * x) + qbpp.distinct(x)

ml = {x[0][1]: 0, x[3][0]: 0, x[1][3]: 1}
g = qbpp.replace(f, ml)
g.simplify_as_binary()
print(g)

solver = qbpp.EasySolver(g)
sol = solver.search(time_limit=1.0)
full = qbpp.Sol(f).set(sol, ml)
print("cost =", f(full))
print("job =", qbpp.onehot_to_int(full(x)))
```

作業者 0 の仕事 1 と作業者 3 の仕事 0 を取り除き，作業者 1 を仕事 3 に固定しています．
出力は次のようになります:

```
7 +7*x[0][0] +8*x[0][2] +6*x[2][0] +8*x[2][1] +5*x[2][2] +6*x[3][1] +9*x[3][2]
+distinct(4 rows, 4 values, 7 choices, 1 fixed)
cost = 25
job = [0, 3, 2, 1]
```

`g` の表示の 2 行目から，16 個の選択肢のうち 7 個が残り，1 つの行が固定されたことが分かります．
作業者 1 を仕事 3 に固定すると，作業者 1 のほかの仕事と，ほかの作業者の仕事 3 は選べなくなるので，
これらの変数も自動的に 0 に置き換えられ，1 行目の総コストの式からも消えています．
固定した選択のコスト 7 は定数になっています．
自動的に 0 にしたくないときは `qbpp.replace(f, ml, propagate=False)` とします．
この場合もソルバーはそれらの変数を 0 のままにして探索するので，答えは変わりません．
`g` の解 `sol` には置き換えた変数が含まれないので，`qbpp.Sol(f).set(sol, ml)` で元の式 `f` の解に戻してから読み出しています．

置き換えられるのは 0 と 1 だけです．1 つの行に 2 つの値を固定する，ある行の選択肢をすべて取り除く，
といった置き換えは `ValueError` になります．

## cycle: 1 つの閉路

`qbpp.cycle()` は，有向グラフの辺ごとに 1 つずつバイナリ変数を用意し，
「値が 1 の辺の全体がちょうど 1 つの閉路になる」ことを表します．

### すべての頂点を回る巡回路

`x` が $n \times n$ のバイナリ変数の配列のとき，`qbpp.cycle(x)` は
「`x[i][j] = 1` の辺 $i \to j$ が，すべての頂点を 1 回ずつ通る 1 つの巡回路になる」という制約です．
5 都市の巡回セールスマン問題を解きます．`dist[i][j]` は都市 $i$ から都市 $j$ への距離です:

```python
import pyqbpp as qbpp

dist = qbpp.array([[0, 25, 18, 12, 31],
                   [23, 0, 20, 16, 11],
                   [20, 18, 0, 24, 15],
                   [14, 14, 22, 0, 27],
                   [29, 13, 16, 25, 0]])
n = 5
x = qbpp.var("x", shape=(n, n))
f = qbpp.sum(dist * x) + qbpp.cycle(x)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)
print("length =", sol.energy)
tour, v = [0], 0
while True:
    v = next(j for j in range(n) if j != v and sol(x[v][j]) == 1)
    tour.append(v)
    if v == 0:
        break
print(" -> ".join(str(v) for v in tour))
```

出力は次のようになります:

```
length = 73
0 -> 3 -> 1 -> 4 -> 2 -> 0
```

対角の変数 `x[i][i]` は自分自身への辺で，解では常に 0 になります．
式の中で使ってもかまいません（たとえば `qbpp.sum(x)` は選んだ辺の数です）．
平面上の 9 都市の巡回路を求める例と，同じ問題を置換行列とペナルティ式で書く定式化は，[巡回セールスマン問題](TSP#構造制約-cycle-を使う定式化)のページにあります．

### 辺のリストと，通る頂点・長さの指定

辺が一部の頂点の組にしかないグラフでは，辺を `(始点, 終点, 変数)` のリストで渡します．
辺のリストでも配列でも，次の指定を追加できます:

| 指定 | 意味 |
|---|---|
| `via=[a, b, ...]` | 閉路が必ず通る頂点（`via=[]` は必ず通る頂点なし．指定しなければ，すべての頂点） |
| `length=(lo, hi)` | 閉路の辺の数の範囲（上限なしは `None`．指定しなければ 2 以上） |

辺のリストの「すべての頂点」は，辺のある頂点です．2 つの指定の組み合わせは次のとおりで，辺のリストと配列で同じです:

| 必ず通る頂点 | 辺の数 | 閉路 |
|---|---|---|
| 指定しない | 指定しない | すべての頂点を 1 回ずつ通る巡回路 |
| 指定しない | `length=(lo, hi)` | すべての頂点を通る巡回路（辺の数は頂点の数）．頂点の数が lo〜hi に入らなければ解がなく，ソルバーを作る時点で例外 |
| `via=[]` | 指定しない | どの頂点を通ってもよい閉路（辺は 2 本以上） |
| `via=[]` | `length=(lo, hi)` | どの頂点を通ってもよい閉路で，辺の数が lo〜hi |
| `via=[a, b, ...]` | 指定しない | a, b, ... を通る閉路．ほかの頂点は通らなくてもよい（辺は 2 本以上） |
| `via=[a, b, ...]` | `length=(lo, hi)` | a, b, ... を通り，辺の数が lo〜hi の閉路 |

必ず通る頂点を決めずに辺の数だけを制限するときは，`via=[]` を書きます（書かないと，すべての頂点を通る巡回路になります）．
`qbpp.cycle(x, via=[0])` は「頂点 0 を通る閉路．ほかの頂点は通らなくてもよい」という意味です．

例として，始点 $s$ から終点 $t$ への**最短経路**を求めます．
$t$ から $s$ へ戻る辺を 1 本足し，$s$ と $t$ を通る閉路を求めれば，閉路から戻りの辺を除いた残りが $s$ から $t$ への経路です:

```python
import pyqbpp as qbpp

# (始点, 終点, 長さ)
edges = [(0, 1, 7), (0, 2, 3), (1, 3, 2), (2, 1, 2), (2, 3, 8),
         (2, 4, 6), (3, 5, 4), (4, 3, 1), (4, 5, 9)]
s, t = 0, 5
m = len(edges)
x = qbpp.var("x", shape=m)  # x[k] = 1: 辺 k を経路に使う
r = qbpp.var("r")           # t から s へ戻る辺

arcs = [(u, v, x[k]) for k, (u, v, _) in enumerate(edges)] + [(t, s, r)]
f = qbpp.sum(w * x[k] for k, (_, _, w) in enumerate(edges))
f += qbpp.cycle(arcs, via=[s, t])
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)
print("length =", sol.energy)
path, v = [s], s
while v != t:
    v = next(b for k, (a, b, _) in enumerate(edges) if a == v and sol(x[k]) == 1)
    path.append(v)
print(" -> ".join(str(v) for v in path))
```

戻りの辺の変数 `r` には長さを付けていないので，エネルギーは経路の長さになります．
出力は次のようになります:

```
length = 11
0 -> 2 -> 1 -> 3 -> 5
```

このグラフには $s$ に入る辺と $t$ から出る辺がないので，$s$ と $t$ を通る閉路は必ず戻りの辺を使います．
そうした辺があるグラフでは，それらの辺をリストに入れないようにします．
無向グラフの最短路（辺の両向きを矢印にする）と，辺の本数の上限・必ず通る頂点を加える例は，[最短路問題](SHORTEST_PATH#構造制約-cycle-を使う定式化)のページにあります．

## cycles: 複数の車両のルート

`qbpp.cycles(x, depot=d)` の `x` は $K \times n \times n$ のバイナリ変数の配列で，
`x[k][i][j] = 1` は「車両 $k$ が頂点 $i$ から頂点 $j$ へ進む」を表します．制約の内容は次の通りです:

- 各車両の辺 `x[k]` は，デポ $d$ を通る 1 つの閉路であるか，1 本も選ばれていない（その車両は使わない）
- デポ以外の頂点は，ちょうど 1 台のルートに含まれる

車両の容量のような条件は，`x[k]` についての `cons()` で書きます．
デポ（頂点 0）と 5 つの配送先を，容量 11 と 8 の 2 台で回る問題を解きます:

```python
import pyqbpp as qbpp

dist = qbpp.array([[0, 9, 14, 11, 16, 8],
                   [10, 0, 7, 15, 21, 13],
                   [13, 8, 0, 10, 18, 17],
                   [12, 14, 11, 0, 9, 12],
                   [15, 22, 17, 10, 0, 10],
                   [9, 12, 18, 13, 11, 0]])
demand = qbpp.array([0, 4, 3, 5, 2, 4])
capacity = qbpp.array([11, 8])
n, K = 6, 2

x = qbpp.var("x", shape=(K, n, n))
length = qbpp.einsum("kij,ij->", x, dist)
load = qbpp.einsum("kij,j->k", x, demand)
f = length + 1000 * qbpp.cons(load <= capacity) + qbpp.cycles(x, depot=0)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)
print("total length =", sol.energy)
for k in range(K):
    route, v = [0], 0
    while True:
        v = next((j for j in range(n) if j != v and sol(x[k][v][j]) == 1), 0)
        route.append(v)
        if v == 0:
            break
    print(f"vehicle {k}:", " -> ".join(str(v) for v in route))
```

[`qbpp.einsum()`](EINSUM) で，総距離と積載量を配列の演算として書いています:

- `length` は，`x[k][i][j]` と `dist[i][j]` の積を，すべての $k, i, j$ について足したものです．
  添字 `"kij,ij->"` の `->` の右が空なので，すべての添字について和をとり，1 つの式になります．
- `load` は，添字 `"kij,j->k"` で，頂点 $j$ に入る辺 `x[k][i][j]` に $j$ の需要 `demand[j]` を掛けて，$i, j$ について足したものです．
  `->` の右に $k$ が残るので，車両ごとの値を並べた長さ $K$ の配列になります．
  配送先にはちょうど 1 本の辺が入るので，`load[k]` は車両 $k$ が訪れる配送先の需要の合計です（デポの需要は 0 です）．
- `load <= capacity` は車両ごとの容量の制約の配列で，`qbpp.cons()` で重み 1000 の制約としてまとめて足します．

自分自身への辺 `x[k][i][i]` も `length` と `load` に含まれますが，対角の変数は解では常に 0 なので，値には影響しません．
出力は次のようになります:

```
total length = 68
vehicle 0: 0 -> 3 -> 4 -> 5 -> 0
vehicle 1: 0 -> 1 -> 2 -> 0
```

車両 0 の積載量は $5 + 2 + 4 = 11$，車両 1 は $4 + 3 = 7$ で，どちらも容量以内です．
平面上の 15 箇所・3 台の例と，同じ問題をスロットとペナルティ式で書く定式化は，[容量制約付き配車計画問題](CVRP#構造制約-cycles-を使う定式化)のページにあります．

## 式の演算規則

- 構造制約は式に**足す**ことだけができます．定数倍（`3 * qbpp.cycle(x)`）・符号の反転・式や変数との積・`sqr()` はエラーになります．
- `qbpp.distinct()`・`qbpp.cycle()`・`qbpp.cycles()` に渡す配列や辺の変数は，`~x` ではなく変数そのものにします．目的関数や `qbpp.cons()` の中では，`~x[0][1]` のように否定した変数も使えます．1 つの変数を 2 つの辺に使うことはできません．
- 1 つの式に複数の構造制約を足すことも，`cons()` や[非線形関数](CONSTRAINTS)と組み合わせることもできます．
- `qbpp.replace()` で変数を定数に置き換えられます．`distinct` は 0（選択肢を取り除く）と 1（固定する），
  `cycle` は 0（辺を取り除く）と 1（その辺を必ず使う）に対応しています．
  `cycle` の辺 $i \to j$ を 1 にすると，頂点 $i$ と $j$ は必ず通る頂点になり，$i$ から出るほかの辺と $j$ に入るほかの辺は 0 になります．
  `cycles` も 0（その車両がその辺を使えない）と 1（その車両がその辺を必ず使う）に対応しています．
  たとえば，車両 $k$ が通れない道は，`x[k][i][j]` を 0 に置き換えて表せます．
- `expand_cons()` で従来のペナルティ式に展開することはできません．

## 解の検証

構造制約を満たしているかどうかは，`cons()` と同じく `f.is_feasible(sol)` で確かめられます．
構造制約を満たさない割当に対する式の値は定義されないので，`f(sol)` は値を返さずに例外になります（次の例では `except` で受けています）:

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(3, 3))
f = qbpp.sum(x) + qbpp.distinct(x)
f.simplify_as_binary()

sol = qbpp.Sol(f).set({x[0][0]: 1, x[1][1]: 1, x[2][2]: 1})
print(f.is_feasible(sol), f(sol))

sol = qbpp.Sol(f).set({x[0][0]: 1, x[1][1]: 1, x[2][1]: 1})
print(f.is_feasible(sol))
try:
    print(f(sol))
except RuntimeError:
    print("error")
```

2 つ目の割当では項目 1 と項目 2 がどちらも値 1 をとっているので，構造制約を満たしません:

```
True 3
False
error
```

## ソルバーごとの対応

| ソルバー | 対応 |
|---|---|
| [Easy Solver](EASYSOLVER) | 対応．返す解は常に構造制約を満たします |
| [ABS3 Solver](ABS3) | 対応．返す解は常に構造制約を満たします（構造制約の形によっては CPU だけで探索します） |
| [Exhaustive Solver](EXHAUSTIVE) | 非対応（エラーになります） |
| MIP ソルバー（HiGHS・SCIP・CBC・GLPK） | ILP モード（`qbpp.HighsSolver(f, ilp=True)` など）で対応．目的関数とほかの制約が線形の式に限ります．制約が `distinct` だけの式は通常モード（`qbpp.HighsSolver(f)` など）でも解け，目的関数は 2 次でもかまいません |
| OR-Tools CP-SAT（`qbpp.OrToolsCpSatSolver(f)`） | 対応．目的関数とほかの制約が線形の式に限ります．制約が `distinct` だけの式は，目的関数が 2 次以上でもかまいません |

構造制約を満たす割当が 1 つも作れない式（値の制限のために異なる値を割り当てられない `distinct`，閉路のないグラフの `cycle` など）は，
Easy Solver・ABS3 Solver を作る時点で `RuntimeError` になります．
必ず通る頂点が多く辺の少ないグラフでは，条件を満たす閉路が存在していても，探索の出発点にする閉路を作れずに同じエラーになることがあります．

MIP ソルバーには，構造制約は線形の制約に変換されて渡されます．
CP-SAT には，`cycle`・`cycles` は CP-SAT 自身が持つ閉路の制約として渡されます．
同じ式を Easy Solver や ABS3 Solver で解き，MIP ソルバーや CP-SAT で最適性を確かめる，という使い方ができます．
