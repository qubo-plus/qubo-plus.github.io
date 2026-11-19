---
last_modified: 2026-10-14
layout: default
nav_exclude: true
title: "因数分解"
nav_order: 8
lang: ja
hreflang_alt: "en/python/FACTORIZATION"
hreflang_lang: "en"
---

# 整数変数による因数分解

## 2つの素数の積の因数分解
2つの素数の積である**整数の因数分解**を考えます。
例えば、積 $pq = 35$ が与えられたとき、2つの素因数 $p=5$ と $q=7$ を求めることが目標です。

$\sqrt{35}=5.91$ かつ $35/2=17.5$ であるため、$p$ と $q$ の探索範囲を以下のように制限できます:

$$
\begin{aligned}
  2 \leq &p \leq 5 \\
  6 \leq &q \leq 17
\end{aligned}
$$

このような[整数変数](INTEGER) $p$ と $q$ に対して、$35$ の因数分解問題は以下の式を用いて定式化できます:

$$
\begin{aligned}
f(p,q) &= (pq-35)^2
\end{aligned}
$$

$f(p,q)$ は $p$ と $q$ が35の正しい因数であるとき、かつそのときに限り最小値0をとります。

## 因数分解の PyQBPP プログラム
以下のプログラムは式 $f(p,q)$ を構築し、Easy Solver を用いて最適化問題を解きます:
```python
import pyqbpp as qbpp

p = qbpp.var("p", integer=(2, 5))
q = qbpp.var("q", integer=(6, 17))
f = qbpp.sqr(p * q - 35)
f.simplify()
print("f =", f)

solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=0)
print(f"p = {sol(p)}, q = {sol(q)}")
print("f =", sol.energy)
```

このプログラムの出力は以下の通りです:
```
f = 1225 -70*p*q +p*p*q*q
p = 5, q = 7
f = 0
```

$f(p,q)$ を展開すると $p^2q^2 - 70pq + 1225$ となり，4 次の項 `p*p*q*q` を含みます．
QUBO++ のソルバーは，このような 3 次以上の項を含む式もそのまま解くことができます．
ソルバーは素因数 $p=5$ と $q=7$ を正しく求めています。

$p$ と $q$ を[バイナリエンコードの整数変数](BINARY_INTEGER)で表すと，
同じ式がバイナリ変数の 4 次式（HUBO 式）になり，項の数も大きく増えます．

## 大きな数の素因数分解のための無制限の大きな係数
PyQBPP のデフォルトモジュール `pyqbpp`（`pyqbpp.c32e64` の別名）は32ビット係数と64ビットエネルギー値を使用し、最も高速に動作します。
大きな合成数の素因数分解では式の係数が64ビットを超える可能性があるため、`pyqbpp.cppint` をインポートすることで任意精度整数演算（`coeff_t` と `energy_t` を両方 `cpp_int`）に切り替えられます。
PyQBPP では係数・エネルギー型の選択をインポートするサブモジュール名（`pyqbpp.c32e64`、`pyqbpp.cppint` など）で指定します。以降の `qbpp.var` や `qbpp.EasySolver` などの呼び出しは、選択した係数・エネルギー型を一貫して使用します。

以下のプログラムは2つの大きな素数の積を因数分解します:
```python
import pyqbpp.cppint as qbpp

p = qbpp.var("p", integer=(2, 2000000))
q = qbpp.var("q", integer=(2, 2000000))
f = qbpp.sqr(p * q - 1000039 * 1000079)
f.simplify()
print("f =", f)

solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=0)
print(f"p = {sol(p)}, q = {sol(q)}")
print("f =", sol.energy)
```

Python は任意精度整数をネイティブにサポートしているため、目標値 `1000039 * 1000079` は Python の `int` としてそのまま記述できます。`pyqbpp.cppint` をインポートすれば、PyQBPP は係数とエネルギー値をすべて Python の `int` として保持・操作します。

このプログラムは以下の結果を出力します（`p` と `q` の値は入れ替わって出力されることがあります）:
```
f = 1000236020086727125492561 -2000236006162*p*q +p*p*q*q
p = 1000079, q = 1000039
f = 0
```
定数項が64ビットの範囲（約 $9.2 \times 10^{18}$）を超える大きな値になっていますが，
大きな合成数の因数分解が正しく得られたことがわかります。

> **TIP**
> 任意精度整数を使用するには `import pyqbpp.cppint as qbpp` とします。他の整数型バリアントを使用する場合は、対応するサブモジュール（`pyqbpp.c64e64`、`pyqbpp.c128e128` など）をインポートします。

素因数分解を最後まで（すべての素因数まで）行う例は、ケーススタディの[再帰による素因数分解](PRIME_FACTORIZATION)を参照してください。
