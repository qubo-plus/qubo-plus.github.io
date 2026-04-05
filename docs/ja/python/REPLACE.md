---
layout: default
nav_exclude: true
title: "Replace Functions"
nav_order: 17
lang: ja
hreflang_alt: "en/python/REPLACE"
hreflang_lang: "en"
---

# 置換関数

PyQBPPは、式中の変数値を固定するために使用できる以下の置換関数を提供しています：
- **`replace(f, ml)`**: ペアのリスト `ml` に従って変数を置換した新しい式を返します。
- **`f.replace(ml)`**: 式 `f` の変数をその場で置換します。

ここで `ml` は `(変数, 式)` のペアのPythonリストです。式には整数値も指定できます（例: `[(x, 0), (y, ~z)]`）。

## 置換関数を使った変数値の固定
[分割問題](PARTITION)を用いて `replace()` 関数を説明します。
このプログラムは、リスト内の数を2つの部分集合 $P$ と $Q$ に分割し、それらの和の差を最小化します。

この問題を、64が $P$ に、27が $Q$ に属さなければならないように変更します：

```python
import pyqbpp as qbpp

w = [64, 27, 47, 74, 12, 83, 63, 40]
x = qbpp.var("x", len(w))
p = qbpp.sum([w[i] * x[i] for i in range(len(w))])
q = qbpp.sum([w[i] * ~x[i] for i in range(len(w))])
f = qbpp.sqr(p - q)
f.simplify_as_binary()

ml = [(x[0], 1), (x[1], 0)]
g = qbpp.replace(f, ml)
g.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(g)
sol = solver.search()

full_sol = qbpp.Sol(f).set([sol, ml])

print("energy =", full_sol.comp_energy())
P = [w[i] for i in range(len(w)) if full_sol(x[i]) == 1]
Q = [w[i] for i in range(len(w)) if full_sol(x[i]) == 0]
print("P:", P)
print("Q:", Q)
```
このプログラムでは、ペアのリスト **`ml`** が `x[0]=1`（64を $P$ に）と `x[1]=0`（27を $Q$ に）を固定します。
`replace()` 関数はこれらの値を `f` に代入し、Exhaustive Solverが残りの変数に対する最適な分割を求めます。

このプログラムの出力は以下の通りです：
```
energy = 4
P: [64, 47, 12, 83]
Q: [27, 74, 63, 40]
```

## 置換関数を使った変数の式への置換
`replace()` 関数は変数を式で置換することもできます。

例えば、64と27が異なる部分集合に配置されることを保証するために、
`x[0]` を `~x[1]` で置換して常に反対の値を取るようにします：

```python
ml = [(x[0], ~x[1])]
g = qbpp.replace(f, ml)
g.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(g)
sol = solver.search()

full_sol = qbpp.Sol(f).set([sol, ml])

print("energy =", full_sol.comp_energy())
P = [w[i] for i in range(len(w)) if full_sol(x[i]) == 1]
Q = [w[i] for i in range(len(w)) if full_sol(x[i]) == 0]
print("P:", P)
print("Q:", Q)
```
このプログラムの出力は以下の通りです：
```
energy = 4
P: [64, 47, 12, 83]
Q: [27, 74, 63, 40]
```

## 整数変数の置換関数
整数変数は `replace()` 関数を使って固定の整数値で置換できます。

ここでは、簡単な**乗算/素因数分解**の例を使ってこの機能を示します。
$p$, $q$, $r$ を整数変数とし、制約 $p\times q - r = 0$ を課します。

### 乗算
$p=5$ と $q=7$ を固定して $r=35$ を求めます：
```python
import pyqbpp as qbpp

p = qbpp.between(qbpp.var_int("p"), 2, 8)
q = qbpp.between(qbpp.var_int("q"), 2, 8)
r = qbpp.between(qbpp.var_int("r"), 2, 40)
f = p * q - r == 0
f.simplify_as_binary()

ml = [(p, 5), (q, 7)]
g = qbpp.replace(f, ml)
g.simplify_as_binary()

solver = qbpp.EasySolver(g)
sol = solver.search({"target_energy": 0})

full_sol = qbpp.Sol(f).set([sol, ml])
print(f"p={full_sol(p)}, q={full_sol(q)}, r={full_sol(r)}")
```
このプログラムの出力は以下の通りです：
```
p=5, q=7, r=35
```

### 素因数分解
$r=35$ を固定して $p$ と $q$ を求めます：
```python
ml = [(r, 35)]
g = qbpp.replace(f, ml)
g.simplify_as_binary()
# ... 同じソルバー設定 ...
```

### 除算
$p=5$ と $r=35$ を固定して $q=7$ を求めます：
```python
ml = [(p, 5), (r, 35)]
g = qbpp.replace(f, ml)
g.simplify_as_binary()
# ... 同じソルバー設定 ...
```

> **注意**
> - **`f.replace(ml)`** は式 `f` をその場で更新します。
> - **`replace(f, ml)`** は元の式を変更せずに新しい式を返します。

> **注意: Termに対する `replace()`**
> `replace(t, ml)` と `t.replace(ml)` の両方が `Term` オブジェクトに対して動作します。
> `Term` は `Expr` に昇格され、新しい `Expr` が返されます:
> ```python
> t = ~a * b * ~c * ~d  # Term
> e = t.replace([(~a, 1 - a), (~c, 1 - c), (d, 1 - d)])  # Exprを返す
> ```

> **注意: 否定リテラルと `replace()`**
> `replace()` 関数は `x` と `~x` を独立したキーとして扱います。
> リストに `(x, 0)` を指定しても、`~x` が自動的に `1` に置換されるわけではありません。
> 式に `~x` のような否定リテラルが含まれている場合、両方のマッピングを明示的に指定してください：
> ```python
> ml = [(x, 0), (~x, 1)]
> ```
