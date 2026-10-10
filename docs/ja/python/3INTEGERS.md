---
last_modified: 2026-10-10
layout: default
nav_exclude: true
title: "3整数探索"
nav_order: 44
lang: ja
hreflang_alt: "en/python/3INTEGERS"
hreflang_lang: "en"
---

# 数学問題：3つの整数を求める

以下の数学問題をPyQBPPを用いて解くことができます。

### 問題
以下を満たす整数 $x$、$y$、$z$ を求めてください：

$$
\begin{aligned}
\frac{1}{x}+\frac{1}{y}+\frac{1}{z} = 1\\
1 < x < y < z
\end{aligned}
$$



### PyQBPPプログラム

PyQBPPは多項式を扱えるため、まず制約を書き換えます。
最初の制約の両辺に $xyz$ を掛けると：

$$
xy+yz+zx - xyz = 0
$$

狭義の不等式 $x<y<z$ は以下のようにエンコードできます：

$$
\begin{aligned}
1 &\leq y-x \\
1 &\leq z-y
\end{aligned}
$$

以下のPyQBPPプログラムは、$x$、$y$、$z$ を[ネイティブ整数変数](NATIVE_INTEGER)とし、これらの式を [`qbpp.cons()`](CONSTRAINTS) で制約として定式化して、Exhaustive Solverで解きます：

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(1, 10))
y = qbpp.var("y", integer=(1, 10))
z = qbpp.var("z", integer=(1, 10))

c1 = qbpp.cons(x * y + y * z + z * x - x * y * z == 0)
c2 = qbpp.cons(y - x >= 1)
c3 = qbpp.cons(z - y >= 1)

f = c1 + c2 + c3
f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)

for sol in result.sols:
    print(f"(x,y,z) = ({sol(x)}, {sol(y)}, {sol(z)})")
```

3つの制約は `c1`、`c2`、`c3` として宣言され、単一の式 `f` にまとめられます。
`f` のエネルギーは各制約の違反量の2乗の和で、すべての制約が満たされるときにだけ0になります。
Exhaustive Solverは $x$、$y$、$z$ の $10^3$ 通りの組合せをすべて調べ、エネルギーが最小のすべての解を返します。

`x`、`y`、`z` は整数のまま扱われ、不等式にも補助変数が入らないので、同じ $(x,y,z)$ が重複して返されることはありません。

このプログラムの出力は以下の通りです：
```
(x,y,z) = (2, 3, 6)
```
これは、探索範囲内でこの問題がちょうど1つの解 $(x,y,z)=(2,3,6)$ を持つことを示しています。
