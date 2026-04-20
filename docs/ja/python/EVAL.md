---
layout: default
nav_exclude: true
title: "Evaluating Expressions"
nav_order: 16
lang: ja
hreflang_alt: "en/python/EVAL"
hreflang_lang: "en"
---

# 式の評価

## 辞書を使った評価
式の値は、すべての変数への値の割り当てを `{変数: 値}` の辞書として与えることで簡単に計算できます。
辞書は完全な割り当てを構成する
`(変数, 値)` のペアのリストを保持します。

以下のプログラムは、$(x,y,z)=(0,1,1)$ に対して関数 $f(x,y,z)$ を計算します:
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
f = qbpp.sqr(x + 2 * y + 3 * z - 3)

ml = {x: 0, y: 1, z: 1}

print("assignment =", ml)
print("f(0,1,1) =", f(ml))
```

このプログラムでは、辞書 `ml = {x: 0, y: 1, z: 1}` で $x=0$, $y=1$, $z=1$ の割り当てを定義し、
`f(ml)` が $f(0,1,1)$ の値を返します。
このプログラムの出力は以下の通りです:

{% raw %}
```
assignment = {x: 0, y: 1, z: 1}
f(0,1,1) = 4
```
{% endraw %}

あるいは、辞書リテラルとして直接、または `(変数, 値)` のタプルのリストとして
割り当てを与えることもできます:
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
f = qbpp.sqr(x + 2 * y + 3 * z - 3)

print("f(0,1,1) =", f({x: 0, y: 1, z: 1}))
print("f(0,1,1) =", f([(x, 0), (y, 1), (z, 1)]))
```
辞書形式とタプルのリスト形式は等価で、同じ結果を返します。

## Solを使った評価
解（**`Sol`**）を使って式の値を評価することもできます。
そのためには、まず与えられた式 `f` に関連付けた解 `sol` を構築します。
新しく作成された解は、すべてゼロの割り当てで初期化されます。

**`sol.set(x, value)`** メソッドで、個々の変数に値を割り当てられます。
そして、**`f(sol)`** と **`sol(f)`** のどちらも、`sol` に格納された割り当ての下での
式 `f` の値を返します。
さらに、**`comp_energy()`** メソッドも同じ値を計算して返します。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
f = qbpp.sqr(x + 2 * y + 3 * z - 3)
f.simplify_as_binary()

sol = qbpp.Sol(f)
sol.set(y, 1)
sol.set(z, 1)

print("f(0,1,1) =", f(sol))
print("f(0,1,1) =", sol(f))
print("f(0,1,1) =", sol.comp_energy())
```

解 `sol` のメソッド **`comp_energy()`** はエネルギー値を計算し、
解の内部にキャッシュすることに注意してください。
また、ソルバーが返す解は、既にエネルギー値が計算されキャッシュされています。
再計算せずにエネルギーを取得するには、以下に示すように **`energy`** プロパティを使用できます:
{% raw %}
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
f = qbpp.sqr(x + 2 * y + 3 * z - 4)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=0)

print("sol =", sol)
print("energy =", sol.energy)

sol.flip(z)
print("flipped sol =", sol)
print("flipped energy =", sol.energy)
```
{% endraw %}
このプログラムでは、`sol.energy` は正しく 0 を返します。
しかし、変数 `z` をフリップした後、キャッシュされたエネルギー値は無効になります。
エネルギーを再計算せずに `sol.energy` にアクセスすると、以下のように
**ランタイムエラー**が発生します:
{% raw %}
```
sol = 0:{{x,1},{y,0},{z,1}}
energy = 0
RuntimeError: energy is not up to date; call comp_energy() after modifying the solution
```
{% endraw %}
この問題を解決するには、解を変更した後に **`sol.comp_energy()`** を呼び出して
エネルギーを明示的に再計算する必要があります:
```python
print("sol =", sol)
print("energy =", sol.energy)

sol.flip(z)
print("sol.comp_energy() =", sol.comp_energy())
print("flipped sol =", sol)
print("flipped energy =", sol.energy)
```
このプログラムは以下の出力を生成します:
{% raw %}
```
sol = 0:{{x,1},{y,0},{z,1}}
energy = 0
sol.comp_energy() = 9
flipped sol = 9:{{x,1},{y,0},{z,0}}
flipped energy = 9
```
{% endraw %}
`comp_energy()` を呼び出した後は、`sol.energy` プロパティも正しい（再計算後の）
エネルギーを返します。
