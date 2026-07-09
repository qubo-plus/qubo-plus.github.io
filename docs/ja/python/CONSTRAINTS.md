---
layout: default
nav_exclude: true
title: "ネイティブ制約"
nav_order: 27
lang: ja
hreflang_alt: "en/python/CONSTRAINTS"
hreflang_lang: "en"
---

# ネイティブ制約

PyQBPP では，式の中の制約部分を `qbpp.cons()` で囲むと，その部分は
**制約とみなされて特別に処理**されます．QUBO++ にバンドルされている
ソルバーは，宣言された制約を満たすように効率よく探索を行います．

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(6,))
value = [3, 5, 2, 7, 4, 6]
weight = [2, 4, 1, 5, 3, 4]

obj = qbpp.Expr(0)
load = qbpp.Expr(0)
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

従来のペナルティ式からの移行は，制約部分を `qbpp.cons()` で囲むだけです —
`obj + 1000 * (rows + cols)` を `obj + 1000 * qbpp.cons(rows + cols)` に
書き換えます．多くの問題で，同じ制約をペナルティ式のまま解くより
大幅に良い解が得られます．

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

制約を蓄積した式に `*=` を使うと，蓄積済みの全制約の重みを一括で
スケールできます．

```python
import pyqbpp as qbpp

k0, k1, k2 = qbpp.var("k0"), qbpp.var("k1"), qbpp.var("k2")
cons4 = qbpp.cons((k0 + k1 + k2) == 2)
cons4 += qbpp.cons(k0 + k1 - k2, between=(None, 1))
cons4 *= 1000                       # scale ALL weights at once
```

式を `print` すると**目的関数の多項式**が表示され，`f.cons()` は宣言された
**制約リスト**の文字列を返します（重みが 1 のときは係数プレフィックスを
省略，片側制約は片側表示）．

```python
import pyqbpp as qbpp

m0, m1, m2 = qbpp.var("m0"), qbpp.var("m1"), qbpp.var("m2")
printed = 1000 * qbpp.cons((m0 + m1 + m2) == 2)
printed += 500 * qbpp.cons(m0 + m1 - m2, between=(0, 1))
print(printed.cons())
```

出力は次のようになります．

```
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
で使えます（MIP ソルバーは非対応）．

## 式の演算規則

制約付きの式 `f` はモデルの完全な記述です．

- `sol(f)` はソルバーが報告する Energy と一致します．
- `f.cons(sol)` は違反している制約の**本数**を返します（0 なら全充足）．
- 目的関数の調整（`+`, `-`, 定数加算）と正のスカラー倍（重みの一括
  スケール），`simplify_as_binary()`，`qbpp.replace()` は制約を保ったまま
  使えます．
- `f.simplify_as_binary()` は目的関数と制約の両方に適用されます．
  ソルバーに渡す前に 1 回呼んでください — 特に `qbpp.replace()` で
  変数を置換した後に必要です．
- 制約の宣言を壊す演算 — `qbpp.sqr()`，式同士の乗算，0 以下のスカラー倍，
  制約式を引く減算，`qbpp.reduce()` など — は `RuntimeError` になります．

## ソルバーごとの意味論

すべてのソルバーが同じ式 `f` を 1 引数で受け付けます．

| ソルバー | 意味論 |
|---|---|
| `EasySolver`, `ABS3Solver` | **ソフト**: 制約違反には重みに応じたペナルティが加算され，制約を満たす良い解を効率よく探索する |
| `ExhaustiveSolver` | **ハード**: 制約を満たす割当の中で目的関数を最小化（重みは無視）．実行可能解が存在しなければエラー |
| 外部 MIP ソルバー（`ScipSolver` など） | **ハード**: 制約は MIP の線形制約として渡される（重みは無視） |

同一のモデル定義を厳密ソルバーで検証してからヒューリスティックソルバーで
スケールアップできます．

```python
import pyqbpp as qbpp

z = qbpp.var("z", shape=(4,))
obj = -3*z[0] - 5*z[1] - 2*z[2] - 7*z[3] + qbpp.Expr(0)
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
obj = -1*s[0] - 2*s[1] - 3*s[2] + qbpp.Expr(0)
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

## 自由記述ペナルティ

**充足のときちょうど値が 0** になる式であれば，従来の QUBO ペナルティ
スタイルの式をそのまま `qbpp.cons()` に混ぜられます．

```python
import pyqbpp as qbpp

d, e, f2 = qbpp.var("d"), qbpp.var("e"), qbpp.var("f2")
g, h, i = qbpp.var("g"), qbpp.var("h"), qbpp.var("i")
mixed = qbpp.cons(100 * ((d + e + f2) == 2)   # tracked comparison
                  + 200 * (~g * ~h * ~i))     # penalty: not all of g,h,i are 0
```

比較で書いた制約は 1 本ずつ追跡されます．自由記述部分は，その値が 0 の
ときだけ充足と見なされます．デフォルトコールバックはこの部分を
`Pen = ...`（0 なら充足）として表示し，`violations()` は境界 `[0, 0]` の
最終エントリとして報告します．式が非負で最小値 0 になることの保証は
利用者の責任です．

非線形（2 次以上）の式を `qbpp.cons()` に入れた場合も，**等式**（`x*y + z == 1`
など）・**範囲**（`qbpp.cons(x*y + z*w, between=(1, 2))` など）ともにそのまま
制約として扱われ，バンドルされたソルバー（`EasySolver` / `ExhaustiveSolver` /
`ABS3Solver`）が制約を満たすよう探索します．外部の MIP／ILP ソルバーは非線形の
制約本体を受け付けないため，その場合は `expand_cons()`（後述）で従来の
ペナルティ式に展開してから渡してください．
