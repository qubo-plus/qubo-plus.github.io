---
last_modified: 2026-10-10
layout: default
nav_exclude: true
title: "最大公約数"
nav_order: 43
lang: ja
hreflang_alt: "en/python/GCD"
hreflang_lang: "en"
---

# 最大公約数 (GCD)
$P$ と $Q$ を2つの正の整数とします。
**最大公約数 (GCD)** の計算は、制約付きの最適化問題として定式化できます。

$p$、$q$、$r$ を以下の制約を満たす正の整数とします:

$$
\begin{aligned}
  p\cdot r &= P \\
  q\cdot r &=Q
\end{aligned}
$$

明らかに、$r$ は $P$ と $Q$ の公約数です。
したがって、これらの制約を満たす $r$ の最大値が $P$ と $Q$ の GCD です。
そのような $r$ を求めるために、$-r$ を目的関数として使用します。

## PyQBPP プログラム
上記の考え方に基づき、以下の PyQBPP プログラムは2つの整数 `P = 858` と `Q = 693` の GCD を計算します:
```python
import pyqbpp as qbpp

P = 858
Q = 693
p = qbpp.var("p", integer=(1, 1000))
q = qbpp.var("q", integer=(1, 1000))
r = qbpp.var("r", integer=(1, 1000))

constraint = qbpp.cons(p * r == P) + qbpp.cons(q * r == Q)
f = -r + constraint * 1000

f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)

print(f"GCD = {sol(r)}")
print(f"{sol(p)} * {sol(r)} = {P}")
print(f"{sol(q)} * {sol(r)} = {Q}")
print(f"violated constraints = {f.cons(sol)}")
```
このプログラムでは、`p`、`q`、`r` は範囲 $[1,1000]$ の[ネイティブ整数変数](NATIVE_INTEGER)として定義されています。
2つの等式は [`qbpp.cons()`](CONSTRAINTS) で制約として宣言され、式 constraint は、両方の制約が満たされたときにゼロと評価されます。
ネイティブ整数変数と `qbpp.cons()` では等式を2乗して展開しないので、係数は大きくならず、既定の `pyqbpp` モジュールで足ります。

目的関数 `-r` は重み `1000` を掛けた制約項と組み合わされ、結果の式は `f` に格納されます。

EasySolver は `f` を最小化する解を探索します。
得られた `p`、`q`、`r` の値と、破った制約の本数 `f.cons(sol)` は以下のように出力されます:
```
GCD = 33
26 * 33 = 858
21 * 33 = 693
violated constraints = 0
```
この出力から、858 と 693 の GCD が 33 として正しく求められたことが確認できます。
