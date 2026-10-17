---
last_modified: 2026-10-11
layout: default
nav_exclude: true
title: "クイックリファレンス: 表示"
nav_order: 34
lang: ja
hreflang_alt: "en/python/QR_PRINT"
hreflang_lang: "en"
---

# クイックリファレンス: 表示

> **注意**
> このページの出力例は参考として示すものです。最新版では出力の形式が異なっている可能性があります。
> 表示は人が読んで確かめるためのものなので、出力された文字列を計算処理に利用しないでください。
> 値が必要なときは `sol(x)` や `f(sol)` などの関数で取り出してください（[クイックリファレンス: 解](QR_SOLUTION)）。

PyQBPP のほとんどのオブジェクトは、`print()` で表示できます。
```python
print(obj)
```

## 一覧

| オブジェクト | 表示の例 |
|---|---|
| 変数 `Var` | `x`、`~x`、`a[1]` |
| 項 `Term` | `2*x*y` |
| 式 `Expr` | `-4 +3*x -2*y*z +~x` |
| バイナリエンコードの整数変数 | `v[0] +2*v[1] +2*v[2]` |
| ネイティブ整数変数 | `n` |
| 比較演算子で作った制約式 | ペナルティ式の多項式 |
| `qbpp.cons()`・`qbpp.abs()`・`qbpp.relu()` を含む式 | 目的関数の多項式に続けて 1 行に 1 つ |
| 制約の一覧 `f.cons()` | `100 * (x +y +z <= 2)` |
| `f.violations(sol)` | `[{'value': 2, 'lower': 1, 'upper': 1, 'violation': 1, 'weight': 1, 'satisfied': False}]` |
| 配列 | `[a[0], a[1], a[2]]` |
| 解 `Sol`（ソルバーが返す解を含む） | `Sol(energy=0, {x[0]: 0, x[1]: 0, x[2]: 1, n: 3})` |
| `qbpp.CallbackEvent` | `CallbackEvent.BestUpdated` |

## 変数・項・式

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
a = qbpp.var("a", 3)
u = qbpp.var()
print(x)
print(~x)
print(a[1])
print(u)
print(2 * x * y)
f = 3 * x - 2 * y * z + ~x - 4
print(f)
```
このプログラムの出力は次のとおりです。
```
x
~x
a[1]
{0}
2*x*y
-4 +3*x -2*y*z +~x
```
- 名前を省略した変数（`qbpp.var()`）は `{0}`、`{1}`、... と表示されます。
- 式は定数項を先頭にして、項を作った順に並べます。2 番目以降の項は、空白のあとに符号（`+` または `-`）を付けて続けます。
- 係数 1 は省略します。否定リテラルは `~x` と表示されます。

### 簡約前と簡約後

式は作ったときの形のまま表示され、自動では簡約されません。
同類項をまとめた形で見るには、`qbpp.simplify()` や `qbpp.simplify_as_binary()` で簡約してから表示します。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
g = x * x + x * y + y * x + 1
print(g)
print(qbpp.simplify(g))
print(qbpp.simplify_as_binary(g))
```
このプログラムの出力は次のとおりです。
```
1 +x*x +x*y +y*x
1 +x*x +2*x*y
1 +x +2*x*y
```
`qbpp.simplify()` は同類項をまとめ、`qbpp.simplify_as_binary()` はさらにバイナリ変数の性質（`x*x` = `x`）を使います。

## 整数変数

```python
import pyqbpp as qbpp

x = qbpp.var("x")
v = qbpp.var("v", between=(0, 5))
n = qbpp.var("n", integer=(0, 5))
print(v)
print(n)
f = 2 * n + x
print(f)
print(qbpp.binarize(f))
```
このプログラムの出力は次のとおりです。
```
v[0] +2*v[1] +2*v[2]
n
2*n +x
2*n#0 +4*n#1 +4*n#2 +x
```
- バイナリエンコードの整数変数は、値を表すバイナリ変数（`v[0]`、`v[1]`、...）の式として表示されます（[バイナリエンコードの整数変数](BINARY_INTEGER)）。
- ネイティブ整数変数は名前で表示されます（[整数変数と連立方程式の求解](INTEGER)）。
- `qbpp.binarize()` がネイティブ整数変数を置き換えたバイナリ変数は、`n#0`、`n#1`、... と表示されます。

## 補助変数

PyQBPP が式を変換するときに加える変数は、波括弧で囲んだ名前で表示されます。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
print(qbpp.reduce(x * y * z))
print(qbpp.simplify_as_binary(x + y + z <= 2))
```
このプログラムの出力は次のとおりです。
```
{r0} +x*y +x*z -x*{r0} +y*z -y*{r0} -z*{r0}
2*{s1} +2*x*y +2*x*z -2*x*{s1} +2*y*z -2*y*{s1} -2*z*{s1}
```
- `{r0}` のように `r` で始まる名前: `qbpp.reduce()` が次数を下げるために加えた変数（[HUBO の QUBO への変換](REDUCE)）
- `{s1}` のように `s` で始まる名前: 比較演算子の制約式が加えたスラック変数（[比較制約](COMPARISON)）

番号は、加えた順に振られる通し番号です。

## 制約と非線形関数

### 比較演算子で作った制約式

比較演算子（`==`、`<=`、`>=`）や `qbpp.constrain()` で作った制約式は、ペナルティ式を展開した多項式として表示されます。
簡約前の形なので、`qbpp.simplify_as_binary()` を使うと短くなります。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
print(x + y == 1)
print(qbpp.simplify_as_binary(x + y == 1))
```
このプログラムの出力は次のとおりです。
```
1 +x*x -2*x +2*x*y +y*y -2*y
1 -x -y +2*x*y
```

### cons()・abs()・relu() を含む式

`qbpp.cons()`、`qbpp.abs()`、`qbpp.relu()` を含む式は、目的関数の多項式に続けて、それぞれを書いたときの形で 1 行に 1 つずつ表示されます。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
f = 3 * x + 100 * qbpp.cons(x + y + z <= 2) + qbpp.cons(x + y == 1)
print(f)
print(qbpp.abs(x - y) + qbpp.relu(x + y - 1, 2))
print(qbpp.cons(x + y + z, equal=[0, 2]))
print(qbpp.cons(x + y + z, between=(1, 2)))
print(-5 * qbpp.cons(x + y == 1))
print(qbpp.max(x, y))
```
このプログラムの出力は次のとおりです。
```
3*x
+100*cons(x +y +z <= 2)
+cons(x +y == 1)
abs(x -y, 1)
+relu(-1 +x +y, 2)
cons(x +y +z == {0, 2})
cons(1 <= x +y +z <= 2)
-5*cons(x +y == 1)
y
+relu(x -y, 1)
```
- 重み 1 は省略し、負の重みは行頭の符号で表します。目的関数の多項式が 0 のときは、その行は表示されません。
- `abs(f, k)`・`relu(f, k)` の 2 番目の数は指数です（`qbpp.abs(f)` は `abs(f, 1)`、`qbpp.abs(f, 2)` は `abs(f, 2)` と表示されます）。
- `qbpp.max()`・`qbpp.min()` は、`relu()` や `abs()` を使った等しい式として表示されます。

詳しくは [非線形関数とネイティブ制約](CONSTRAINTS) を参照してください。

### 制約の一覧と違反

`f.cons()` は式に含まれる制約の一覧を、`f.violations(sol)` は解 `sol` での制約ごとの値と違反量を返します。どちらも表示できます。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
f = 3 * x + 100 * qbpp.cons(x + y + z <= 2) + qbpp.cons(x + y == 1)
print(f.cons())
sol = qbpp.Sol(f)
sol.set(x, 1)
sol.set(y, 1)
print(f.violations(sol))
```
このプログラムの出力は次のとおりです。
```
100 * (x +y +z <= 2)
(x +y == 1)
[{'value': 2, 'lower': 0, 'upper': 2, 'violation': 0, 'weight': 100, 'satisfied': True}, {'value': 2, 'lower': 1, 'upper': 1, 'violation': 1, 'weight': 1, 'satisfied': False}]
```

## 配列

```python
import pyqbpp as qbpp

a = qbpp.var("a", 3)
b = qbpp.var("b", 2, 3)
c = qbpp.array([1, 2, 3])
print(a)
print(b)
print(b[1])
print(a + 1)
print(c)
print(qbpp.vector_sum(b))
```
このプログラムの出力は次のとおりです。
```
[a[0], a[1], a[2]]
[[b[0][0], b[0][1], b[0][2]], [b[1][0], b[1][1], b[1][2]]]
[b[1][0], b[1][1], b[1][2]]
[1 +a[0], 1 +a[1], 1 +a[2]]
[1, 2, 3]
[b[0][0] +b[0][1] +b[0][2], b[1][0] +b[1][1] +b[1][2]]
```
- 配列は Python のリストと同じ形式で表示されます。多次元配列は入れ子になります。
- `b[1]` のような部分配列も同じ形式で表示されます。
- PyQBPP のオブジェクトを要素に持つリストや辞書も、`print([x, 2 * x * y])` や `print({x: 1, y: 0})` のように表示できます。

## 解

```python
import pyqbpp as qbpp

x = qbpp.var("x", 3)
n = qbpp.var("n", integer=(0, 5))
f = qbpp.sqr(qbpp.sum(x) - 1) + 3 * x[0] + 2 * x[1] + qbpp.sqr(n - 3)
f.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(f).search()
print(sol)
print(sol(x))
print(sol(n))
s = qbpp.Sol(sol)
s.set(x[0], 1)
s.set(n, 5)
print(s)
```
このプログラムの出力は次のとおりです。
```
Sol(energy=0, {x[0]: 0, x[1]: 0, x[2]: 1, n: 3})
[0, 0, 1]
3
Sol(energy=8, {x[0]: 1, x[1]: 0, x[2]: 1, n: 5})
```
- 解は `Sol(energy=エネルギー, {変数: 値, ...})` の形式で表示されます。バイナリ変数のあとに、ネイティブ整数変数が並びます。
- `sol.set()` で値を変えた解は、その割り当てのエネルギーを計算して表示します。
- ソルバー情報 `sol.info` は文字列の値を持つ辞書として表示されます（[クイックリファレンス: 解](QR_SOLUTION)）。

ソルバーが集めた複数の解（`sol.sols`）は、解のリストとして表示されます。

```python
import pyqbpp as qbpp

x = qbpp.var("x", 3)
f = qbpp.sqr(qbpp.sum(x) - 1) + 3 * x[0] + 2 * x[1]
f.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(f).search(topk_sols=3)
print(sol.sols)
```
このプログラムの出力は次のとおりです。
```
[Sol(energy=0, {x[0]: 0, x[1]: 0, x[2]: 1}), Sol(energy=1, {x[0]: 0, x[1]: 0, x[2]: 0}), Sol(energy=2, {x[0]: 0, x[1]: 1, x[2]: 0})]
```

## 実数係数

`pyqbpp.d` などで実数（`float`）係数を使うと、係数は元の値を正確に表せる最短の 10 進数で表示されます。
10 の指数が −4 以上 16 未満なら小数表記（`2500`、`1.5`、`0.1`）、それ以外は指数表記（`1e+20`、`1e-07`）です。
整数の値には小数点を付けません。

```python
import pyqbpp.d as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
f = 100 * x + 2500 * y + 1.5 * z
print(f)
g = 0.1 * x - 1e-7 * y + 1e20 * z
print(g)
```
このプログラムの出力は次のとおりです。
```
100*x +2500*y +1.5*z
0.1*x -1e-07*y +1e+20*z
```
ソルバーが実際に解く整数係数の式は、`qbpp.quantize()` の結果を表示すると確かめられます（[変数と式のデータ型](VAREXPR)）。

## コールバックのイベント

ABS3 Solver のコールバックで使う `qbpp.CallbackEvent` も表示できます（[ABS3 Solver の使い方](ABS3)）。

```python
import pyqbpp as qbpp

print(qbpp.CallbackEvent.BestUpdated)
```
このプログラムの出力は次のとおりです。
```
CallbackEvent.BestUpdated
```

## 表示の形式を持たないオブジェクト

- ソルバー（`qbpp.EasySolver`、`qbpp.ExhaustiveSolver`、`qbpp.ABS3Solver`）には表示の形式がなく、`<... object at 0x...>` と表示されます。

## C++ 版との違い

C++ と Python では、それぞれの言語の慣習に合わせて一部の書式が異なります。

| オブジェクト | C++ | Python |
|---|---|---|
| 配列 | `{a[0],a[1],a[2]}` | `[a[0], a[1], a[2]]` |
{% raw %}| 解 | `0:{{x,0},{y,1}}` | `Sol(energy=0, {x: 0, y: 1})` |{% endraw %}
| `violations()` の要素 | `{value: 2, ..., satisfied: false}` | 辞書 `{'value': 2, ..., 'satisfied': False}` |
| `CallbackEvent` | `CallbackEvent::BestUpdated` | `CallbackEvent.BestUpdated` |
| ソルバー | 出力できない | `<... object at 0x...>` |
