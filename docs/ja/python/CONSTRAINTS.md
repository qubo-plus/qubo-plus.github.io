---
last_modified: 2026-09-01
layout: default
nav_exclude: true
title: "非線形関数とネイティブ制約"
nav_order: 27
lang: ja
hreflang_alt: "en/python/CONSTRAINTS"
hreflang_lang: "en"
---

# 非線形関数とネイティブ制約

PyQBPP では，次の**非線形関数**を式の中で直接使えます:

| 関数 | 値 | 典型的な用途 |
|---|---|---|
| `qbpp.abs(f)` / `qbpp.abs(f, 2)` | $\lvert f \rvert$ / $\lvert f \rvert^2$ | 誤差・ずれの最小化 |
| `qbpp.relu(f)` / `qbpp.relu(f, 2)` | $\max(0, f)$ / $\max(0, f)^2$ | しきい値超過へのペナルティ |
| `qbpp.max(f, g)` / `qbpp.min(f, g)` | 2 式の最大値 / 最小値 | 分割問題・メイクスパンの最小化など |
| `qbpp.cons(f, between=(l, u))` など | 違反量の 2 乗（充足なら 0） | **制約の宣言** |

これらの関数を含む式は，QUBO++ にバンドルされているソルバーが
関数値を直接扱って効率よく探索を行います．
補助変数やペナルティ多項式を手動で設計する必要はありません．
[ネイティブ整数変数](NATIVE_INTEGER)と組み合わせて使うこともできます．

`cons()` だけは値に加えて「制約」としての意味論を持ちます —
前半で `abs`・`relu`・`max`・`min` を，後半で `cons()` を説明します．

## 絶対値: abs

`qbpp.abs(f)` は $|f|$，`qbpp.abs(f, 2)` は $|f|^2$ を表します
（指数は 1 か 2）．次のプログラムは
$|x + y - 13| + |x - y - 3|$ を最小化します:

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 10))
y = qbpp.var("y", integer=(0, 10))
f = qbpp.abs(x + y - 13) + qbpp.abs(x - y - 3)
f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()
print(f"x = {sol(x)}, y = {sol(y)}")
print(f"f = {sol.energy}")
```

プログラムの出力は以下の通りです:

```
x = 8, y = 5
f = 0
```

もう 1 つの例として，次のプログラムは [分割問題](PARTITION)（8 個の数を
2 つの集合 $P$ と $Q$ に分割し，両集合の和ができるだけ近くなるように
する問題）の目的関数 $|P - Q|$ を `abs` でそのまま書いて解きます:

```python
import pyqbpp as qbpp

w = qbpp.array([64, 27, 47, 74, 12, 83, 63, 40])
x = qbpp.var("x", shape=len(w))
p = qbpp.sum(w * x)
q = qbpp.sum(w * ~x)
f = qbpp.abs(p - q)
f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()
print(f"|P - Q| = {sol.energy}")
print(f"P = {sol(p)}, Q = {sol(q)}")
```

プログラムの出力は以下の通りです:

```
|P - Q| = 0
P = 205, Q = 205
```

[分割問題](PARTITION)のページでは，同じ問題を 2 乗ペナルティ
$(P - Q)^2$ の最小化として定式化しています．`abs` を使うと目的関数
$|P - Q|$ をそのまま記述でき，最小値が差そのものになります．
3 通りの定式化（`sqr`・`abs`・`cons`）を並べて比較するケーススタディは
[分割問題の3通りの定式化](PARTITION_FORMULATIONS)を参照してください．

## ReLU: relu

`qbpp.relu(f)` は $\max(0, f)$，`qbpp.relu(f, 2)` は
$\max(0, f)^2$ を表し，しきい値の**超過分だけ**にペナルティを
かけたいときに便利です．次のプログラムは，利益 $4x + 7y$ を
最大化しつつ，作業量 $2x + 3y$ が 36 を超えた分に 2 乗ペナルティを
かけ，さらに制約 $x + y \le 12$ を `qbpp.cons()`（後半で説明）で
課しています:

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 20))
y = qbpp.var("y", integer=(0, 20))
profit = 4 * x + 7 * y
overtime = qbpp.relu(2 * x + 3 * y - 36, 2)
f = -profit + overtime + 100 * qbpp.cons(x + y <= 12)
f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()
print(f"x = {sol(x)}, y = {sol(y)}")
print(f"profit = {sol(profit)}")
```

プログラムの出力は以下の通りです:

```
x = 0, y = 12
profit = 84
```

## 最大値と最小値: max / min

`qbpp.max(f, g)`・`qbpp.min(f, g)` は 2 つの式の最大値・最小値を
表します．次のプログラムは，`abs` の例と同じ[分割問題](PARTITION)を
`max` を使って解きます．合計 $P + Q$ は分割によらず一定なので，
大きい方 $\max(P, Q)$ の最小化は差 $|P - Q|$ の最小化と等価です:

```python
import pyqbpp as qbpp

w = qbpp.array([64, 27, 47, 74, 12, 83, 63, 40])
x = qbpp.var("x", shape=len(w))
p = qbpp.sum(w * x)
q = qbpp.sum(w * ~x)
f = qbpp.max(p, q)
f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()
print(f"max(P, Q) = {sol.energy}")
print(f"P = {sol(p)}, Q = {sol(q)}")
```

プログラムの出力は以下の通りです:

```
max(P, Q) = 205
P = 205, Q = 205
```

`max` を使う定式化では，目的関数の最小値がそのまま大きい方の集合の
和になります．

## 制約の宣言: cons

式の中の制約部分を `qbpp.cons()` で囲むと，その部分は
**制約とみなされて特別に処理**されます．バンドルされている
ソルバーは，宣言された制約を満たすように効率よく探索を行います．

`qbpp.cons()` で宣言した制約は，変数割当のもとで**違反量の 2 乗**を
値として持ちます．制約本体の式を $f$ とすると，等式制約の値は

$$
\operatorname{cons}(f = k) = (f - k)^2
$$

範囲制約の値は

$$
\operatorname{cons}(l \le f \le u) =
\begin{cases}
(l - f)^2 & (f < l) \\
0 & (l \le f \le u) \\
(f - u)^2 & (u < f)
\end{cases}
$$

です（片側制約は該当する側だけが働きます）．つまり値の上では
`cons()` も非線形関数の仲間で，

$$
\operatorname{cons}(f = k) = \operatorname{abs}(f - k,\, 2), \qquad
\operatorname{cons}(l \le f \le u) =
\operatorname{relu}(l - f,\, 2) + \operatorname{relu}(f - u,\, 2)
$$

と同じ値を取ります（違反するのは高々片側なので，2 つの relu が
同時に正になることはありません）．重み $P$ を掛けた制約
$P \cdot \operatorname{cons}(\cdots)$ はこの値の $P$ 倍になり，
モデル全体の値は

$$
f(\mathrm{sol}) = \mathrm{objective} + \sum_{c} P_c \cdot \mathrm{viol}_c^2
$$

で，バンドルソルバーが報告する Energy と一致します．
全ての制約を満たす解では Energy = objective です．

`abs()`・`relu()` との違いは意味論です．`cons()` は式を
**制約として宣言**し，違反本数（Viol）の集計や実行可能性・
`target_energy` の判定に参加します．`abs()`・`relu()` は意味論を
持たない純粋な目的関数の項で，制約としては扱われません．
「満たすべき条件」には `cons()` を，「値そのものをコストにしたい量」
には `abs()`・`relu()` を使ってください．

## 整数線形計画法を `cons()` で解く

[範囲制約と整数線形計画法の求解](RANGE)では，次の整数線形計画問題を，
範囲制約を重み付きのペナルティ式として目的関数に加える方法で解きました:

$$
\begin{aligned}
\text{Maximize: } & & & 5x + 4y \\
\text{Subject to: } & && 2x + 3y \le 24 \\
                   & & & 7x + 5y \le 54
\end{aligned}
$$

同じ問題は，制約を `qbpp.cons()` で作成すると次のように書けます:

```python
import pyqbpp as qbpp

x = qbpp.var("x", between=(0, 10))
y = qbpp.var("y", between=(0, 10))
f = 5 * x + 4 * y
g = -f + 100 * qbpp.cons(2 * x + 3 * y, between=(0, 24))
g += 100 * qbpp.cons(7 * x + 5 * y, between=(0, 54))
g.simplify_as_binary()

solver = qbpp.EasySolver(g)
sol = solver.search(time_limit=1.0)

print(f"x = {sol(x)}, y = {sol(y)}")
print(f"f = {sol(f)}")
print(f"violated constraints = {g.cons(sol)}")
```

変更点は，`constrain()` で作っていたペナルティ式を `qbpp.cons()` に
置き換えただけです（引数の書き方は同じです）．
これだけで 2 つの範囲制約は単なるペナルティ式ではなく**制約として宣言**され，
ソルバーは制約を満たす解を効率よく探索します．
`g.cons(sol)` は解 `sol` で違反している制約の本数を返します（0 なら全制約を充足）．
プログラムの出力は以下の通りです:

```
x = 4, y = 5
f = 40
violated constraints = 0
```

## ペナルティ式との比較

同じ問題を，制約をペナルティ式として目的関数に加える書き方と，
`qbpp.cons()` で宣言する書き方の両方で解き，ソルバーに渡されるモデルの
大きさを比べてみます．`sol.info` の `var_count`・`term_count` が，
それぞれモデルの変数数と項数です:

```python
import pyqbpp as qbpp

x = qbpp.var("x", between=(0, 10))
y = qbpp.var("y", between=(0, 10))
f = 5 * x + 4 * y

gp = -f + 100 * qbpp.constrain(2 * x + 3 * y, between=(0, 24))  # penalty form
gp += 100 * qbpp.constrain(7 * x + 5 * y, between=(0, 54))
gp.simplify_as_binary()
sp = qbpp.EasySolver(gp).search(time_limit=1.0)

gc = -f + 100 * qbpp.cons(2 * x + 3 * y, between=(0, 24))  # declared
gc += 100 * qbpp.cons(7 * x + 5 * y, between=(0, 54))
gc.simplify_as_binary()
sc = qbpp.EasySolver(gc).search(time_limit=1.0)

print(f"penalty: var_count = {sp.info['var_count']}, term_count = {sp.info['term_count']}, f = {sp(f)}")
print(f"cons:    var_count = {sc.info['var_count']}, term_count = {sc.info['term_count']}, f = {sc(f)}")
```

プログラムの出力は以下の通りです:

```
penalty: var_count = 17, term_count = 133, f = 40
cons:    var_count = 8, term_count = 8, f = 40
```

どちらの書き方でも最適値 $f = 40$ に到達しますが，モデルの大きさは大きく
異なります．$x$・$y$ はそれぞれ 4 個のバイナリ変数で表現されるので，
目的関数と制約に現れる変数は 8 個です．ところが不等式制約をペナルティ式で
書く場合は，[範囲制約](RANGE)で説明したとおり，制約が満たされるときだけ
値が 0 になる多項式を作るために**補助変数（スラック変数）**が必要で，
この例では 9 個増えて 17 個になります．さらに 2 乗の展開によって項数も
8 から 133 に増えます．

補助変数が 9 個増えると探索空間は $2^9 = 512$ 倍に広がり，項が増えれば
解を 1 つ評価するコストも上がるため，ソルバーにとって解を見つけるのが
難しくなります．`qbpp.cons()` で宣言した場合は補助変数を導入しないので，
モデルには目的関数の項だけが残ります．変数の範囲が広い制約や，制約の
本数が多い問題ほど，この差は大きくなります．

## ナップサック問題の例

もう1つの例として，次のプログラムは簡単なナップサック問題
（容量制約と等式制約）を `cons()` で解きます:

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(6,))
value = [3, 5, 2, 7, 4, 6]
weight = [2, 4, 1, 5, 3, 4]

obj = 0
load = 0
for i in range(6):
    obj += -value[i] * x[i]
    load += weight[i] * x[i]

f = obj + 100 * qbpp.cons(load, between=(None, 8))  # capacity
f += 10 * qbpp.cons((x[0] + x[1]) == 1)             # equality
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1)
print("objective =", sol.energy)
```

多くの問題で，同じ制約を従来のペナルティ式のまま解くより大幅に良い解が
得られます．既存のペナルティ式で書かれたモデルを移行する方法は，後述の
「既存のペナルティ式からの移行と比較」を参照してください．
容量制約を従来のペナルティ式・`relu`・`cons()` の 3 通りで書いて
比較した例は[ナップサック問題](KNAPSACK)を参照してください．

## 制約の書き方

制約は `qbpp.cons(式 == 整数)`，または範囲を kwargs で直接指定する
`qbpp.cons(式, between=(下限, 上限))`（片側は `None`）で書きます．
重みは制約へのスカラー係数として書き，`+` で目的関数や他の制約と
自由に足し合わせられます．

```python
import pyqbpp as qbpp

a, b, c = qbpp.var("a"), qbpp.var("b"), qbpp.var("c")
u, v, w = qbpp.var("u"), qbpp.var("v"), qbpp.var("w")

cons = 1000 * qbpp.cons((a + b + c) == 2)                        # equality
cons += 1000 * qbpp.cons(10*u + 30*v - 10*w, between=(None, 35)) # one-sided
cons += 500 * qbpp.cons(a + b - c, between=(0, 1))               # two-sided
```

配列の比較を囲むと要素ごとに 1 本の制約になるので，行列の one-hot 行は
1 文で書けます．

```python
import pyqbpp as qbpp

y = qbpp.var("y", shape=(4, 4))
one_hot = 1000 * qbpp.cons(qbpp.vector_sum(y) == 1)  # one per row
```

本ドキュメントでは，重みは `qbpp.cons()` の外側にスカラー係数として書き，
1 つの `qbpp.cons()` には 1 つの比較式または `between=` の範囲（配列の
比較なら要素ごとに 1 本）だけを入れる書き方に統一しています．

両側の範囲を `l <= f <= u` と続けて書くことは Python の言語仕様上できません．
Python はこれを `(l <= f) and (f <= u)` と解釈するので，`l <= f` の側が
失われてしまいます．PyQBPP はこの形を検出してエラーにするので，
`qbpp.cons(f, between=(l, u))` か `qbpp.cons((l <= f) & (qbpp.same <= u))`
と書いてください（C++ では `qbpp::cons(l <= f && f <= u)` ではなく
`qbpp::cons(l <= f <= u)` がそのまま書けます）．

制約を蓄積した式に `*=` を使うと，蓄積済みの全制約の重みを一括で
スケールできます．

```python
import pyqbpp as qbpp

k0, k1, k2 = qbpp.var("k0"), qbpp.var("k1"), qbpp.var("k2")
cons4 = qbpp.cons((k0 + k1 + k2) == 2)
cons4 += qbpp.cons(k0 + k1 - k2, between=(None, 1))
cons4 *= 1000                       # scale ALL weights at once
```

式を `print` すると，**目的関数の多項式**に続けて宣言した制約が
`cons(...)` の形で 1 行ずつ表示されます（式が持つ情報がすべて出力されます）．
`f.cons()` は制約だけを取り出した**制約リスト**の文字列を返します
（重みが 1 のときは係数プレフィックスを省略，片側制約は片側表示）．

```python
import pyqbpp as qbpp

m0, m1, m2 = qbpp.var("m0"), qbpp.var("m1"), qbpp.var("m2")
printed = 1000 * qbpp.cons((m0 + m1 + m2) == 2)
printed += 500 * qbpp.cons(m0 + m1 - m2, between=(0, 1))
print(printed)
print(printed.cons())
```

出力は次のようになります．

```
1000*cons(m0 +m1 +m2 == 2)
+500*cons(0 <= m0 +m1 -m2 <= 1)
1000 * (m0 +m1 +m2 == 2)
500 * (0 <= m0 +m1 -m2 <= 1)
```

### 離散許容値集合

式の値が**とびとびの許容値のいずれか**に一致することを要求する制約は，
`equal=[...]` で書けます．`qbpp.cons(s, equal=[0, 2])` は `s` が 0 か 2 の
ときだけ充足されます．許容値は任意個・任意の整数を指定できます．

```python
e = qbpp.var("e", 5)
# 各頂点に接続する辺を 0 本か 2 本だけ選ぶ
deg = 100 * qbpp.cons(qbpp.sum(e), equal=[0, 2])
```

これはグラフの path や cycle を構成する辺を選ぶ問題（各頂点の次数が
0 か 2 のとき充足）などに便利です．許容値がとびとびのため，両側範囲
`between=(l, u)` では表現できません．制約リストには `== {0, 2}` と
表示されます．この制約は `EasySolver`・`ExhaustiveSolver`・`ABS3Solver`
で使えます（MIP ソルバーは非対応）．任意精度（`pyqbpp.cppint`）および
double 係数（`pyqbpp.d`）バリアントでは使えません．

### 非線形の制約本体

非線形（2 次以上）の式を `qbpp.cons()` に入れた場合も，**等式**（`x*y + z == 1`
など）・**範囲**（`qbpp.cons(x*y + z*w, between=(1, 2))` など）ともにそのまま
制約として扱われ，バンドルされたソルバー（`EasySolver` / `ExhaustiveSolver` /
`ABS3Solver`）が制約を満たすよう探索します．制約本体には否定リテラル `~x` を
含む項（`~x*~y*~z + w == 1` など）もそのまま書けます．外部の MIP／ILP ソルバーは
非線形の制約本体を受け付けないため，その場合は `expand_cons()`（後述）で従来の
ペナルティ式に展開してから渡してください．

## 式の演算規則

制約付きの式 `f` はモデルの完全な記述です．以下の規則は `cons()` の
制約に限らず，非線形関数 `abs`・`relu`・`max`・`min` を含む式にも
同様に適用されます．

- `sol(f)` はソルバーが報告する Energy と一致します．
- `f.cons(sol)` は違反している制約の**本数**を返します（0 なら全充足）．
- 目的関数の調整（`+`, `-`, 定数加算）と 0 以外のスカラー倍（重みの一括
  スケール），`simplify_as_binary()`，`qbpp.replace()` は制約を保ったまま
  使えます．
- `f.simplify_as_binary()` は目的関数と制約の両方に適用されます．
  ソルバーに渡す前に 1 回呼んでください — 特に `qbpp.replace()` で
  変数を置換した後に必要です．
- 重みは通常は正の値を使いますが，負の重みも指定できます（制約の減算・
  負号も同様に重みの符号反転として扱われます）．負の重みは違反を
  「優遇」する特殊な用途向けで，バンドルソルバー
  （`EasySolver`・`ExhaustiveSolver`・`ABS3Solver`）でのみ使えます —
  MIP ソルバー（ハード制約扱い）に渡すと `RuntimeError` になります．
- 制約の宣言を壊す演算 — `qbpp.sqr()`，式同士の乗算，0 倍（制約が黙って
  消えるため），`qbpp.reduce()` など — は `RuntimeError` になります．
- 非線形関数と `cons()` は**ネストできません** — 関数の本体や `cons()` の
  制約本体に，別の関数項や `cons()` を含めると `RuntimeError` になります
  （`max`・`min` の引数も同様）．関数項や制約は `+` で自由に
  足し合わせられるので，組み合わせは和として書いてください．

## ソルバーごとの対応と意味論

バンドルソルバーは同じ式 `f` を 1 引数で受け付けます．
非線形関数 `abs`・`relu`・`max`・`min` の対応は次の通りです:

- バンドルされているソルバー（[EasySolver](EASYSOLVER)・
  [ABS3 Solver](ABS3)・[Exhaustive Solver](EXHAUSTIVE)）は
  `abs`・`relu`（指数 1, 2）・`max`・`min` のすべてに対応します．
- MIP ラッパーは非線形関数に対応していません（C++ の ScipSolver
  Quadratic 方式のみ対応 — [C++ 版のページ](../CONSTRAINTS) を参照）．
- 非線形関数の係数には任意の定数を使えます．負の係数は関数値を
  最大化する向きに働きます．乗算に使えるのはスカラー定数のみで，
  変数や式との乗算，`qbpp.sqr()` は `RuntimeError` になります．また，
  `abs`・`relu`・`max`・`min` を含む式は `expand_cons()`・`reduce()`
  には対応していません．
- 解 `sol` に対する式の値 `f(sol)` は，ソルバーが返すエネルギーと
  常に一致します．

`cons()` で宣言した制約の意味論はソルバーにより異なります:

| ソルバー | 意味論 |
|---|---|
| `EasySolver`, `ABS3Solver` | **ソフト**: 制約違反には重みに応じたペナルティが加算され，制約を満たす良い解を効率よく探索する |
| `ExhaustiveSolver` | **ソフト**: `EasySolver`・`ABS3Solver` と同じペナルティ込みエネルギーで全割当を順位付けし，その**厳密な最小解**を返す（小規模インスタンスでの検証・デバッグ用） |
| 外部 MIP ソルバー（`ScipSolver` など，`ilp=True` 指定時） | **ハード**: 制約は MIP の線形制約として渡される（重みは無視。負の重みの制約が含まれる場合は `RuntimeError`） |

制約付きモデルを外部 MIP ソルバーに渡すには ILP モードを使います —
`ilp=True` を指定してください（例: `qbpp.ScipSolver(f, ilp=True)`．モデルは
線形である必要があります）．`ilp=True` なしで制約付きモデルを渡すと
エラーになります．

同一のモデル定義を厳密ソルバーで検証してからヒューリスティックソルバーで
スケールアップできます．

```python
import pyqbpp as qbpp

z = qbpp.var("z", shape=(4,))
obj = -3*z[0] - 5*z[1] - 2*z[2] - 7*z[3]
f = obj + 100 * qbpp.cons((z[0] + z[1] + z[2] + z[3]) == 2)
f.simplify_as_binary()

exact = qbpp.ExhaustiveSolver(f)                  # ground truth
print("exact optimum =", exact.search().energy)

heuristic = qbpp.EasySolver(f)                    # same model, scales up
print("heuristic     =", heuristic.search(time_limit=1).energy)
```

ネイティブ制約がある場合，`target_energy` は「エネルギーが target に達し，
**かつ全制約が充足**」のときだけ探索を停止します．

`EasySolver` のデフォルトコールバックはエネルギーと並べて充足の進捗を
表示します．`Energy` はペナルティ込みの合計，`Obj` は目的関数部分，
`Viol = k/m` は m 本の制約のうち k 本が違反中であることを示します．
全制約が充足されると `Energy` と `Obj` は一致します．

## 解の検証

`violations(sol)` は解に対して全制約を評価し，制約値・境界・違反距離・
重みの dict を制約ごとに返します．

```python
import pyqbpp as qbpp

s = qbpp.var("s", shape=(3,))
obj = -1*s[0] - 2*s[1] - 3*s[2]
f = obj + 10 * qbpp.cons((s[0] + s[1] + s[2]) == 1)
f.simplify_as_binary()

sol = qbpp.ExhaustiveSolver(f).search()
for t in f.violations(sol):
    print(t["lower"], "<=", t["value"], "<=", t["upper"],
          " violation =", t["violation"])
print("feasible" if f.is_feasible(sol) else "infeasible")
```

## 従来のペナルティ式への展開

`qbpp.expand_cons(f)` は，宣言された制約を**従来のペナルティ式**
（比較演算子や `qbpp.constrain` で書いた場合と同じ形）に展開した通常の
式を返します．ネイティブ制約に対応しない外部の QUBO/HUBO ツールに渡す
場合などに使います．`f` 自身を上書きする `f.expand_cons()` もあります．
展開結果は簡約されていないので，ソルバーに渡す前に
`simplify_as_binary()` を呼んでください．

```python
import pyqbpp as qbpp

n0, n1, n2 = qbpp.var("n0"), qbpp.var("n1"), qbpp.var("n2")
fe = n0 + 10 * qbpp.cons((n1 + n2) == 1)
ge = qbpp.expand_cons(fe)          # fe is unchanged; ge is a plain Expr
ge.simplify_as_binary()
```

## 既存のペナルティ式からの移行と比較

既存のモデルで，比較演算子や `qbpp.constrain()`を使って従来のペナルティ式として組み立てた
制約の和は，その式を `qbpp.cons()` で囲むだけでネイティブ制約に移行
できます．囲んだ式に含まれる各制約が，その重みのまま 1 本ずつ宣言されます．

```python
import pyqbpp as qbpp

s0, s1, s2 = qbpp.var("s0"), qbpp.var("s1"), qbpp.var("s2")
obj3 = -3 * s0 + 2 * s1 - 5 * s2
constraints = 100 * ((s0 + s1 + s2) == 2)                    # classic penalty form
constraints += 150 * qbpp.constrain(10*s0 + 30*s1 - 10*s2, between=(None, 35))
fp = obj3 + constraints             # penalty form
fc = obj3 + qbpp.cons(constraints)  # same constraints, declared
fp.simplify_as_binary()
fc.simplify_as_binary()
print(fc.cons())
```

出力は次のようになります．

```
100 * (s0 +s1 +s2 == 2)
150 * (10*s0 +30*s1 -10*s2 <= 35)
```

`fp` は従来のペナルティ式のモデル（`constraints` の多項式がそのまま目的
関数に加わる），`fc` は同じ制約を `cons()` で宣言したモデルです．複数の
制約を足してから `qbpp.cons()` で囲むこの書き方は，既存のペナルティ式を
移行する場合や，ペナルティ式のままのモデルとネイティブ制約のモデルを
比較する場合に限って使ってください．新しく制約を書くときは，前述のように
`qbpp.cons()` に制約を 1 つずつ入れ，重みを外側に書きます．多くの問題で，
`fc` のほうが `fp` より大幅に良い解が得られます．

**重みの意味の違いに注意**: 等式制約 `f == v` のペナルティはどちらの形でも
$(f-v)^2$ で同じですが，範囲制約（`l <= f <= u` と片側の `f <= u`，
`f >= l`）は，従来のペナルティ式では違反量 $v$ に対して $v(v+1)$
（[比較制約](COMPARISON) の `(f-l)(f-u)` 展開），`qbpp.cons()` では $v^2$ になります．
違反 1 のとき従来式は 2 倍大きいので，同じ重みのまま移行すると範囲制約の
違反コストは小さくなります．目的関数側に残したペナルティ式（特に
`x * (1 - y - z)` のように，制約が破れると負になり得る式）との釣り合いが
変わり，制約を破った解のほうがエネルギーが低くなることがあります．
移行後は `f.cons(sol)` や `violations(sol)` で制約を破った解が選ばれて
いないかを確認し，必要なら範囲制約の重みを見直すか，そうした式も
`qbpp.cons()` の線形制約として書き直してください．

## 自由記述ペナルティ

比較式でない式を `qbpp.cons()` に入れると，その式は**値が 0 のときだけ
充足される**自由記述ペナルティとして宣言されます．従来の QUBO ペナルティ
スタイルで書いた，**充足のときちょうど値が 0** になる式を，比較式の制約と
同じ形で並べられます．

```python
import pyqbpp as qbpp

d, e, f2 = qbpp.var("d"), qbpp.var("e"), qbpp.var("f2")
g, h, i = qbpp.var("g"), qbpp.var("h"), qbpp.var("i")
mixed = 100 * qbpp.cons((d + e + f2) == 2)   # tracked comparison
mixed += 200 * qbpp.cons(~g * ~h * ~i)       # penalty: not all of g,h,i are 0
```

比較で書いた制約は 1 本ずつ追跡されます．自由記述部分は，その値が 0 の
ときだけ充足と見なされます．デフォルトコールバックはこの部分を
`Pen = ...`（0 なら充足）として表示し，`violations()` は境界 `[0, 0]` の
最終エントリとして報告します．式が非負で最小値 0 になることの保証は
利用者の責任です．
