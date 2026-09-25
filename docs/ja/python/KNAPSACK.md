---
last_modified: 2026-09-01
layout: default
nav_exclude: true
title: "ナップサック"
nav_order: 70
lang: ja
hreflang_alt: "en/python/KNAPSACK"
hreflang_lang: "en"
---

# ナップサック問題
重さと価値を持つアイテムの集合と、重量制限のあるナップサックが与えられたとき、**ナップサック問題**は、総重量が容量以内に収まるようにしつつ、総価値を最大化するアイテムの部分集合を選択することを目的とします。

$w_i$ と $v_i$（$0\leq i\leq n-1$）をそれぞれアイテム $i$ の重さと価値とします。
$S\in \lbrace 0, 1, \ldots n-1\rbrace$ を選択されたアイテムの集合とします。

$$
\begin{aligned}
\text{Maximize:} & \sum_{i\in S} v_i \\
\text{Subject to:} & \sum_{i\in S} w_i \leq W
\end{aligned}
$$

ここで $W$ はナップサックの重量容量です。

## QUBO定式化
この問題をQUBOとして定式化するために、$n$ 個のバイナリ変数 $x_i\in\lbrace 0,1\rbrace$（$0\leq i\leq n-1$）の集合 $X$ を導入します。ここで、アイテム $i$ が選択されるのは $x_i=1$ のときかつそのときに限ります。

上記の定式化は次のように書き換えられます：

$$
\begin{aligned}
\text{Maximize:} & \sum_{i=0}^{n-1} v_ix_i \\
\text{Subject to:} & \sum_{i=0}^{n-1} w_ix_i \leq W
\end{aligned}
$$

PyQBPP では、この容量制約（**不等式制約**）を 3 通りの方法で表現できます:
比較演算子による従来の**ペナルティ式**、**非線形関数** `relu`、
**ネイティブ制約** `cons()` です。以下では同じインスタンスを 3 通りで解き、
ペナルティの値・モデルの大きさ・得られる情報の違いを比較します
（非線形関数とネイティブ制約そのものの説明は
[非線形関数とネイティブ制約](CONSTRAINTS)を参照してください）。

## PyQBPPプログラム
制約は PyQBPP が提供する**範囲演算子** `(lo <= expr) & (qbpp.same <= hi)` を用いて表現できます。
結果として得られるQUBO目的関数は次のように定義されます：

$$
\begin{aligned}
f(X) &= -\sum_{i=0}^{n-1} v_ix_i + P\times (0\leq \sum_{i=0}^{n-1} w_ix_i \leq W)
\end{aligned}
$$

QUBOソルバーは目的関数を最小化するため、元の最大化目的は符号を反転しています。
定数 $P$ は制約を強制するための十分大きなペナルティパラメータです。

以下のPyQBPPプログラムは、Exhaustive Solverを用いて10個のアイテムのナップサック問題を解きます：
```python
import pyqbpp as qbpp

w = qbpp.array([10, 20, 30, 5, 8, 15, 12, 7, 17, 18])
v = qbpp.array([60, 100, 120, 60, 80, 150, 110, 70, 150, 160])
capacity = 50

x = qbpp.var("x", shape=len(w))

constraint = (0 <= qbpp.sum(w * x)) & (qbpp.same <= capacity)
objective = qbpp.sum(v * x)

f = -objective + 1000 * constraint
f.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)
for idx, sol in enumerate(result.sols):
    print(f"[Solution {idx}]")
    print(f"Energy = {sol.energy}")
    print(f"Constraint = {sol(constraint.body)}")
    print(f"Objective = {sol(objective)}")
    for j in range(len(w)):
        if sol(x[j]) == 1:
            print(f"Item {j}: weight = {w[j]}, value = {v[j]}")
```

このプログラムでは、式 `constraint` と `objective` を別々に構築し、ペナルティ係数 `1000` を用いて最終的なQUBO式 `f` に結合しています。
次に、Exhaustive Solver を `f` に適用し、すべての最適解を列挙します。

以下の出力は、エネルギー、制約値、目的関数値を含む最適解を示しています：
```
[Solution 0]
Energy = -480
Constraint = 50
Objective = 480
Item 3: weight = 5, value = 60
Item 5: weight = 15, value = 150
Item 6: weight = 12, value = 110
Item 9: weight = 18, value = 160
[Solution 1]
Energy = -480
Constraint = 50
Objective = 480
Item 3: weight = 5, value = 60
Item 4: weight = 8, value = 80
Item 6: weight = 12, value = 110
Item 7: weight = 7, value = 70
Item 9: weight = 18, value = 160
```
このインスタンスには2つの最適解があり、いずれも総価値 `480` を達成しつつ、容量制約をちょうど満たしていることがわかります。

範囲式 `(0 <= qbpp.sum(w * x)) & (qbpp.same <= capacity)` は、
制約が満たされるときだけ最小値 0 になる多項式に展開されます
（[比較制約](COMPARISON)・[範囲制約](RANGE)参照）。この多項式を
作るために**スラック補助変数**が導入され、2 乗の展開も起きます。
展開後は通常の 2 次式なので、QUBO++ のすべてのソルバーはもちろん、
ネイティブ制約に対応しない外部の QUBO ツールでもそのまま扱える、
最も汎用的な形です。違反量 $v$ に対するペナルティの値は
$v(v+1)$ です。

## 非線形関数 relu で容量制約を表す

非線形関数 `qbpp.relu` を使うと、容量の**超過分だけ**への
2 乗ペナルティ $\max(0, \mathrm{load} - W)^2$ を直接書けます。
以下のプログラムでは総重量の式 `load` を定義し、容量制約を
`1000 * qbpp.relu(load - capacity, 2)` の 1 行で書いています:

```python
import pyqbpp as qbpp

w = qbpp.array([10, 20, 30, 5, 8, 15, 12, 7, 17, 18])
v = qbpp.array([60, 100, 120, 60, 80, 150, 110, 70, 150, 160])
capacity = 50

x = qbpp.var("x", shape=len(w))
load = qbpp.sum(w * x)
objective = qbpp.sum(v * x)

f = -objective + 1000 * qbpp.relu(load - capacity, 2)
f.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(f).search()
print(f"Energy = {sol.energy}")
print(f"value = {sol(objective)}, weight = {sol(load)}")
```

プログラムの出力は以下の通りです:

```
Energy = -480
value = 480, weight = 50
```

スラック変数は導入されず、2 乗の展開も起きません — 線形式
`load - capacity` は展開されないまま関数の本体として扱われます。
違反量 $v$ に対するペナルティの値は $v^2$ です。ただし
`relu` は意味論を持たない純粋な**目的関数の項**であり、
「制約」としては扱われません。超過を許容しつつコストとして
計上したい（ソフトな超過料金のような）場合にも使えます。

## `qbpp.cons()` で容量制約を表す

容量制約を**制約として宣言**するには、範囲式を `qbpp.cons()` で
囲みます。変更は制約を書く 1 行だけです:

```python
import pyqbpp as qbpp

w = qbpp.array([10, 20, 30, 5, 8, 15, 12, 7, 17, 18])
v = qbpp.array([60, 100, 120, 60, 80, 150, 110, 70, 150, 160])
capacity = 50

x = qbpp.var("x", shape=len(w))
load = qbpp.sum(w * x)
objective = qbpp.sum(v * x)

f = -objective + 1000 * qbpp.cons((0 <= load) & (qbpp.same <= capacity))
f.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(f).search()
print(f"Energy = {sol.energy}")
print(f"value = {sol(objective)}, weight = {sol(load)}")
print(f"violated constraints = {f.cons(sol)}")
```

プログラムの出力は以下の通りです:

```
Energy = -480
value = 480, weight = 50
violated constraints = 0
```

`cons()` で宣言した制約の値は違反量の 2 乗 $v^2$ で、`relu` と
**同じ値**です。違いは意味論です — 式は制約として宣言されている
ため、違反本数を返す `f.cons(sol)` や制約ごとの違反量を報告する
`violations()` が使え、`target_energy` は「エネルギーが target
以下**かつ全制約充足**」のときに探索を停止し、
[EasySolver](EASYSOLVER) のデフォルトコールバックは充足の進捗
（Viol）を表示します。バンドルされたソルバーは宣言された制約を
満たすように効率よく探索するため、より大きなナップサック問題も
扱いやすくなります。

## モデルの大きさの比較

3 通りの書き方でソルバーに渡されるモデルの大きさを比べてみます。
`sol.info` の `var_count`・`term_count` が、それぞれモデルの
変数数と目的関数の多項式の項数です:

```python
import pyqbpp as qbpp

w = qbpp.array([10, 20, 30, 5, 8, 15, 12, 7, 17, 18])
v = qbpp.array([60, 100, 120, 60, 80, 150, 110, 70, 150, 160])
capacity = 50

x = qbpp.var("x", shape=len(w))
load = qbpp.sum(w * x)
objective = qbpp.sum(v * x)

f1 = -objective + 1000 * ((0 <= load) & (qbpp.same <= capacity))
f1.simplify_as_binary()
s1 = qbpp.ExhaustiveSolver(f1).search()

f2 = -objective + 1000 * qbpp.relu(load - capacity, 2)
f2.simplify_as_binary()
s2 = qbpp.ExhaustiveSolver(f2).search()

f3 = -objective + 1000 * qbpp.cons((0 <= load) & (qbpp.same <= capacity))
f3.simplify_as_binary()
s3 = qbpp.ExhaustiveSolver(f3).search()

print(f"penalty: var_count = {s1.info['var_count']}, term_count = {s1.info['term_count']}")
print(f"relu   : var_count = {s2.info['var_count']}, term_count = {s2.info['term_count']}")
print(f"cons   : var_count = {s3.info['var_count']}, term_count = {s3.info['term_count']}")
```

プログラムの出力は以下の通りです:

```
penalty: var_count = 15, term_count = 120
relu   : var_count = 10, term_count = 10
cons   : var_count = 10, term_count = 10
```

ペナルティ式ではスラック変数が 5 個追加されて変数は 15 個に
なり、2 乗の展開で項数は 120 に増えます。スラック変数が
5 個増えると探索空間は $2^5 = 32$ 倍に広がり、項が増えれば
解を 1 つ評価するコストも上がります。`relu`・`cons` では
補助変数は導入されず、モデルに残るのは目的関数の 10 項
だけです — 容量制約の本体（10 項の線形式）は展開されずに
そのまま保持されます。変数の範囲が広い制約や制約の本数が
多い問題ほど、この差は大きくなります。

## 重みが小さいときの違い

ペナルティの値は、ペナルティ式では $v(v+1)$、
`relu(..., 2)`・`cons()` では $v^2$ と異なります。
重みが十分大きければ（上の例の 1000）どの書き方でも同じ
実行可能な最適解に到達しますが、重みが小さいとこの差が
結果に現れます。次のプログラムは同じ問題を重み 6 で解きます:

```python
import pyqbpp as qbpp

w = qbpp.array([10, 20, 30, 5, 8, 15, 12, 7, 17, 18])
v = qbpp.array([60, 100, 120, 60, 80, 150, 110, 70, 150, 160])
capacity = 50

x = qbpp.var("x", shape=len(w))
load = qbpp.sum(w * x)
objective = qbpp.sum(v * x)

f1 = -objective + 6 * ((0 <= load) & (qbpp.same <= capacity))
f1.simplify_as_binary()
s1 = qbpp.ExhaustiveSolver(f1).search()
print(f"penalty: value = {s1(objective)}, weight = {s1(load)}")

f2 = -objective + 6 * qbpp.relu(load - capacity, 2)
f2.simplify_as_binary()
s2 = qbpp.ExhaustiveSolver(f2).search()
print(f"relu   : value = {s2(objective)}, weight = {s2(load)}")

f3 = -objective + 6 * qbpp.cons((0 <= load) & (qbpp.same <= capacity))
f3.simplify_as_binary()
s3 = qbpp.ExhaustiveSolver(f3).search()
print(f"cons   : value = {s3(objective)}, weight = {s3(load)}, violated constraints = {f3.cons(s3)}")
```

プログラムの出力は以下の通りです:

```
penalty: value = 480, weight = 50
relu   : value = 510, weight = 52
cons   : value = 510, weight = 52, violated constraints = 1
```

容量を 2 超過して価値を 30 増やす解（value = 510,
weight = 52）のペナルティは、ペナルティ式では
$6 \times 2 \times 3 = 36 > 30$ なので割に合わず実行可能な
最適解が返りますが、`relu`・`cons` では
$6 \times 2^2 = 24 < 30$ なので違反解のほうがエネルギーが
低くなります。同じ重みでも、ペナルティの定義が違えば返る解が
変わるのです。既存のペナルティ式のモデルを `relu` や `cons()`
に移行するときは、この差を踏まえて重みを見直してください
（[非線形関数とネイティブ制約](CONSTRAINTS)の
「重みの意味の違いに注意」参照）。なお、このような違反が
起きたことを機械的に検出できるのは、制約として宣言した
`cons()` だけです（`violated constraints = 1`）。

## まとめ

| 定式化 | 違反 $v$ のペナルティ | モデル | 特徴 |
|---|---|---|---|
| `(0 <= load) & (qbpp.same <= capacity)` | $v(v+1)$ | スラック変数 + 2 乗展開 | 最も汎用的。外部の QUBO ツールでも扱える |
| `qbpp.relu(load - capacity, 2)` | $v^2$ | 展開なし | 超過分をコストとする目的関数の項 |
| `qbpp.cons((0 <= load) & (qbpp.same <= capacity))` | $v^2$ | 展開なし | 制約として宣言。違反の集計・`target_energy` に参加 |

重みが十分大きければ、3 通りのどれでも同じ最適解が得られます。
「満たすべき制約」には `cons()` を、超過を許容しつつコストとして
計上したい量には `relu` を、ネイティブ制約に対応しない外部の
QUBO ツールに渡す必要がある場合はペナルティ式が適しています。
対応ソルバーの一覧と詳細な演算規則は
[非線形関数とネイティブ制約](CONSTRAINTS)を参照してください。
等式制約と目的関数についての同様の比較は、
[分割問題の3通りの定式化](PARTITION_FORMULATIONS)を
参照してください。
