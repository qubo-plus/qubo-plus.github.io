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

## ペアのリストを使った評価
式の値は、すべての変数への値の割り当てを `(変数, 値)` のペアのリストとして与えることで計算できます。

以下のプログラムは、$(x,y,z)=(0,1,1)$ に対して関数 $f(x,y,z)$ を計算します：
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
f = qbpp.sqr(x + 2 * y + 3 * z - 3)

print("f(0,1,1) =", f([(x, 0), (y, 1), (z, 1)]))
```
このプログラムでは、ペアのリスト `[(x, 0), (y, 1), (z, 1)]` で $x=0$, $y=1$, $z=1$ の割り当てを定義しています。
そして `f(...)` が $f(0,1,1)$ の値を返します。
このプログラムの出力は以下の通りです：
```
f(0,1,1) = 4
```

## Solを使った評価
解オブジェクト（**`Sol`**）も式の値の評価に使用できます。
そのためには、まず与えられた式に関連付けた `Sol` オブジェクトを構築します。
新しく作成された `Sol` オブジェクトはすべてゼロの割り当てで初期化されます。

**`set()`** メソッドを使って、個々の変数に値を割り当てることができます。
そして **`sol(f)`** は `sol` に格納された割り当てのもとでの式 `f` の値を返します。

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

print("f(0,1,1) =", sol(f))
```

メソッド **`comp_energy()`** はエネルギー値を計算し、内部にキャッシュします。
ソルバーから返された解オブジェクトは、既にエネルギーがキャッシュされています。
キャッシュされたエネルギーを取得するには、**`energy`** プロパティを使います：
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
f = qbpp.sqr(x + 2 * y + 3 * z - 4)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search({"target_energy": 0})

print(sol)
print("energy =", sol.energy)
```
このプログラムの出力は以下の通りです：
```
Sol(energy=0, x=1, y=0, z=1)
energy = 0
```

解を変更した後（例えば `flip()` を使った後）、キャッシュされたエネルギーは無効になります。
**`comp_energy()`** を呼び出して明示的に再計算する必要があります：
```python
sol.flip(z)
print("comp_energy =", sol.comp_energy())
print("energy =", sol.energy)
```
