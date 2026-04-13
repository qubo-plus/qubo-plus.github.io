---
layout: default
nav_exclude: true
title: "Pythagorean Triples"
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
f = qbpp.constrain(x * x + y * y - z * z, equal=0)
c = qbpp.constrain(y - x, between=(1, +qbpp.inf))
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
`search_optimal_solutions()` の呼び出しは、すべての最適解のリストを返します。

整数変数は複数のバイナリ変数でエンコードされるため、同じ $(x,y,z)$ の割り当てが複数回出現する可能性があります。
そのため、出力前に `set` を使って重複を除去しています。

このプログラムは以下の出力を生成します:
```
x=3, y=4, z=5, f=0, c=1
x=5, y=12, z=13, f=0, c=7
x=6, y=8, z=10, f=0, c=2
x=9, y=12, z=15, f=0, c=3
```

### C++ QUBO++ との比較

<table>
<thead>
<tr><th>C++ QUBO++</th><th>PyQBPP</th></tr>
</thead>
<tbody>
<tr><td><code>1 &lt;= qbpp::var_int("x") &lt;= 16</code></td><td><code>qbpp.var("x", between=(1, 16))</code></td></tr>
<tr><td><code>1 &lt;= y - x &lt;= +qbpp::inf</code></td><td><code>qbpp.constrain(y - x, between=(1, +qbpp.inf))</code></td></tr>
<tr><td><code>sol(x)</code></td><td><code>sol(x)</code></td></tr>
<tr><td><code>sol(*f)</code></td><td><code>sol(f.body)</code></td></tr>
</tbody>
</table>
