---
layout: default
nav_exclude: true
title: "Factorization"
nav_order: 8
lang: ja
hreflang_alt: "en/python/FACTORIZATION"
hreflang_lang: "en"
---

# HUBO式による素因数分解

## 2つの素数の積の素因数分解のための HUBO
2つの素数の積である**整数の素因数分解**を考えます。
例えば、積 $pq = 35$ が与えられたとき、2つの素因数 $p=5$ と $q=7$ を求めることが目標です。

$\sqrt{35}=5.91$ かつ $35/2=17.5$ であるため、$p$ と $q$ の探索範囲を以下のように制限できます:

$$
\begin{aligned}
  2 \leq &p \leq 5 \\
  6 \leq &q \leq 17
\end{aligned}
$$

このような整数変数に対して、$35$ の素因数分解問題はペナルティ式を用いて以下のように定式化できます:

$$
\begin{aligned}
f(p,q) &= (pq-35)^2
\end{aligned}
$$

整数変数 $p$ と $q$ はバイナリ変数の線形式として実装されるため、その積 $pq$ は2次式となり、したがって $f(p,q)$ は4次式になります。
明らかに、$f(p,q)$ は $p$ と $q$ が 35 の正しい因数であるときに限り最小値 0 を達成します。

## 素因数分解の PyQBPP プログラム
以下のプログラムは HUBO 式 $f(p,q)$ を構築し、Easy Solver を用いて最適化問題を解きます:
```python
import pyqbpp as qbpp

p = qbpp.var("p", between=(2, 5))
q = qbpp.var("q", between=(6, 17))

f = qbpp.constrain(p * q, equal=35)
print("f =", f.simplify_as_binary())

solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=0)

print("sol =", sol)
print("p =", sol(p))
print("q =", sol(q))
```

このプログラムでは、式 `qbpp.constrain(p * q, equal=35)` は自動的に `sqr(p * q - 35)` に変換され、等式が満たされたときにエネルギー値 0 を達成します。
このプログラムの出力は以下の通りです:
```
f = 529 -240*p[0] -408*p[1] -88*q[0] -168*q[1] -304*q[2] -304*q[3] +144*p[0]*p[1] ...
sol = Sol(energy=0, {p[0]: 1, p[1]: 1, q[0]: 1, q[1]: 0, q[2]: 0, q[3]: 0})
p = 5
q = 7
```
出力から、式 `f` が4次の項を含むことが確認でき、これが HUBO 式であることがわかります。
ソルバーは素因数 $p=5$ と $q=7$ を正しく求めています。

> **注意**
> PyQBPP はすべての係数とエネルギーの計算に任意精度整数演算（Pythonネイティブの `int`）を使用します。
> C++版とは異なり、`COEFF_TYPE` や `ENERGY_TYPE` マクロを指定する必要はありません。
> 大きな合成数の素因数分解も、特別な設定なしにそのまま動作します。
