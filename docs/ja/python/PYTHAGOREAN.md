---
layout: default
nav_exclude: true
title: "ピタゴラスの三つ組"
nav_order: 40
lang: ja
hreflang_alt: "en/python/PYTHAGOREAN"
hreflang_lang: "en"
---

# ピタゴラス数

3つの整数 $x$、$y$、$z$ が以下を満たすとき、**ピタゴラス数**と呼ばれます:

$$
\begin{aligned}
x^2+y^2&=z^2
\end{aligned}
$$

重複を避けるため、$x<y$ と仮定します。

## ピタゴラス数を列挙する PyQBPP プログラム
以下のプログラムは、$x\leq 16$、$y\leq 16$、$z\leq 16$ のピタゴラス数を列挙します:
```python
import pyqbpp as qbpp

x = qbpp.var("x", between=(1, 16))
y = qbpp.var("y", between=(1, 16))
z = qbpp.var("z", between=(1, 16))
f = (x * x + y * y - z * z == 0)
c = (y - x >= 1)
g = f + c
g.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(g)
result = solver.search(best_energy_sols=0)

seen = set()
for sol in result.sols:
    key = (sol(x), sol(y), sol(z))
    if key not in seen:
        seen.add(key)
        print(f"x={key[0]}, y={key[1]}, z={key[2]}, f={sol(f.body)}, c={sol(c.body)}")
```
このプログラムでは、範囲 1 から 16 の整数変数 `x`、`y`、`z` を定義します。
次に、2つの制約式を作成します:
- `f`: $x^2+y^2-z^2=0$ の制約、
- `c`: $x+1\leq y$ の制約。

これらを `g` にまとめます。
式 `g` はすべての制約が満たされたときに最小値 0 を達成します。

`g` に対して全探索ソルバーオブジェクト `solver` を作成します。
`search(best_energy_sols=0)` を呼ぶと、最良エネルギー（最適）解がすべて保持され、`result.sols` から読み取れます。

整数変数は複数のバイナリ変数でエンコードされるため、同じ $(x,y,z)$ の割り当てが複数回出現する可能性があります。
そのため、出力前に `set` を使って重複を除去しています。

このプログラムは以下の出力を生成します:
```
x=3, y=4, z=5, f=0, c=1
x=5, y=12, z=13, f=0, c=7
x=6, y=8, z=10, f=0, c=2
x=9, y=12, z=15, f=0, c=3
```

## `qbpp.cons()` を使ってより大きな範囲を探索する

等式 $x^2+y^2-z^2=0$ と不等式 $x+1\leq y$ は、`qbpp.cons()` で囲むことで
**制約**として記述できます。バンドルされたソルバーは、目的関数を最適化しつつ
制約を満たす割り当てを探索するため、はるかに大きな範囲を実用的に探索できます。
以下のプログラムでは範囲を `1..1000` に広げ、目的関数 `-z` を加えることで、
斜辺ができるだけ大きい三つ組をソルバーが返すようにしています:
```python
import pyqbpp as qbpp

x = qbpp.var("x", between=(1, 1000))
y = qbpp.var("y", between=(1, 1000))
z = qbpp.var("z", between=(1, 1000))
f = (-z  # 斜辺 z を最大化
     + 2000 * qbpp.cons(x * x + y * y - z * z == 0)
     + 2000 * qbpp.cons(y - x >= 1))
f.simplify_as_binary()
sol = qbpp.EasySolver(f).search(time_limit=15.0)
print(f"x={sol(x)}, y={sol(y)}, z={sol(z)}, violations={f.cons(sol)}")
```
ここで `f.cons(sol)` は違反した制約の本数を返します。`0` は、返された三つ組が
`y > x` を満たす正しいピタゴラス数であることを意味します。典型的な出力は次の
とおりです:
```
x=352, y=936, z=1000, violations=0
```

## `c64e128` で大きな整数を扱う

大きな整数範囲では、ソルバーが扱う途中の値が64ビット整数の範囲を超えることが
あります。その場合は、`import pyqbpp.c64e128 as qbpp` で `c64e128` データ型
（64ビット係数・128ビットエネルギー）をインポートします。以下は範囲を
`1..10000` にした版です:
```python
import pyqbpp.c64e128 as qbpp

x = qbpp.var("x", between=(1, 10000))
y = qbpp.var("y", between=(1, 10000))
z = qbpp.var("z", between=(1, 10000))
f = (-z  # 斜辺 z を最大化
     + 20000 * qbpp.cons(x * x + y * y - z * z == 0)
     + 20000 * qbpp.cons(y - x >= 1))
f.simplify_as_binary()
sol = qbpp.EasySolver(f).search(time_limit=20.0)
print(f"x={sol(x)}, y={sol(y)}, z={sol(z)}, violations={f.cons(sol)}")
```
典型的な出力は次のとおりです:
```
x=5376, y=8432, z=10000, violations=0
```
利用可能なデータ型は[データ型](VAREXPR)に一覧があります。
