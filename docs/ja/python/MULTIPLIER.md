---
layout: default
nav_exclude: true
title: "Multiplier Simulation"
nav_order: 91
lang: ja
hreflang_alt: "en/python/MULTIPLIER"
hreflang_lang: "en"
---

# 乗算器シミュレーションと素因数分解
2つの整数の乗算は加算を用いて実行できます。
この節では、全加算器を使って2つの4ビット整数の乗算器を設計します。
以下の図は、2つの4ビット整数 $x_3x_2x_1x_0$ と $y_3y_2y_1y_0$ を乗算して8ビット整数 $z_7z_6z_5z_4z_3z_2z_1z_0$ を得る方法を示しています。
この図では、$p_{i,j}=x_iy_j$ ($0\leq i,j\leq 3$) であり、これらの部分積を合計して最終的な8ビットの結果を計算します。

<p align="center">
 <img src="../images/multiplication.svg" alt="4-bit multiplication" width="50%">
</p>

2つの4ビット整数 $a_3a_2a_1a_0$ と $b_3b_2b_1b_0$ の和を計算して5ビットの和 $z_4z_3z_2z_1z_0$ を出力する4ビットリプルキャリー加算器を使用します。
これは、キャリーを伝搬する5ビットのキャリー線 $c_4c_3c_2c_1c_0$ で接続された4つの全加算器で構成されています。

<p align="center">
 <img src="../images/adder4.svg" alt="The 4-bit ripple carry adder" width="50%">
</p>

4ビット乗算器は3つの4ビット加算器を使って構築できます。
以下に示すように、中間の和ビットを伝搬するためにワイヤ $c_{i,j}$ ($0\leq i\leq 2, 0\leq j\leq 3$) で接続されています:
<p align="center">
 <img src="../images/multiplier.svg" alt="The 4-bit multiplier using three 4-bit adders" width="50%">
</p>

## 乗算器の QUBO 定式化
`N`ビット乗算器をシミュレートするための QUBO 定式化を示します。
そのために、全加算器、加算器、乗算器を構築する関数を実装します。

### 全加算器
以下の QUBO 式は、3つの入力ビット `a`、`b`、`i` と、2つの出力ビット: キャリーアウト `o` および和 `s` を持つ全加算器をシミュレートします:
```python
def fa(a, b, i, o, s):
    return (a + b + i) - (2 * o + s) == 0
```
関数 `fa` は、全加算器の入力ビットと出力ビットの間の整合性を強制する式を返します。

### 加算器
リスト `a`、`b`、`s` が整数を表すとします。
`a` と `b` はそれぞれ `N` 要素を持ち `N`ビット整数を表し、`s` は `N + 1` 要素を持ち `(N + 1)`ビット整数を表します。
以下の関数 `adder` は、`a + b == s` が成り立つ場合に限り最小値が 0 となる QUBO 式を返します:
```python
def adder(a, b, s):
    N = len(a)
    c = qbpp.var(N + 1)
    f = 0
    for j in range(N):
        f += fa(a[j], b[j], c[j], c[j + 1], s[j])
    ml = [(c[0], 0), (c[N], s[N])]
    return qbpp.replace(f, ml)
```
この関数では、`c` は `N + 1` 個の変数のベクトルで、`fa` ブロックのキャリーアウトとキャリーインの信号を接続し、`N`ビットのリプルキャリー加算器を形成します。

### 乗算器
リスト `x`、`y`、`z` が整数を表すとします。
`x` と `y` はそれぞれ `N` 要素を持ち、`z` は `2 * N` 要素を持つとします。
以下の関数 `multiplier` は、`x * y == z` が成り立つ場合に限り最小値が 0 となる QUBO 式を返します。
```python
def multiplier(x, y, z):
    N = len(x)
    c = qbpp.var("c", N - 1, N + 1)

    f = 0

    for i in range(N - 1):
        b_vec = [x[i + 1] * y[j] for j in range(N)]

        if i == 0:
            a_vec = [x[0] * y[j + 1] for j in range(N - 1)] + [0]
        else:
            a_vec = [c[i - 1][j + 1] for j in range(N)]

        s_vec = [c[i][j] for j in range(N + 1)]
        f += adder(a_vec, b_vec, s_vec)

    f += z[0] - x[0] * y[0] == 0

    ml = [(c[i][0], z[i + 1]) for i in range(N - 2)]
    ml += [(c[N - 2][i], z[N + i - 1]) for i in range(N + 1)]
    f = qbpp.replace(f, ml)
    f.simplify_as_binary()
    return f
```
この関数は `(N-1)x(N+1)` の変数行列 `c` を使って `N-1` 個の `N`ビット加算器を接続します。
`z` の各ビットは `c` の1つの要素に対応するため、その対応関係を `ml` で定義し、`replace()` を使って置換を実行します。

## 素因数分解の PyQBPP プログラム
関数 `multiplier` を使って、合成数を2つの因数に分解できます。
以下のプログラムは、`x` と `y` をそれぞれ4つのバイナリ変数、
`z` を定数リスト `[1, 1, 1, 1, 0, 0, 0, 1]`（8ビット整数 `10001111` (143) を表す）として4ビット乗算器を構築します:

```python
import pyqbpp as qbpp

def fa(a, b, i, o, s):
    return (a + b + i) - (2 * o + s) == 0

def adder(a, b, s):
    N = len(a)
    c = qbpp.var(N + 1)
    f = 0
    for j in range(N):
        f += fa(a[j], b[j], c[j], c[j + 1], s[j])
    ml = [(c[0], 0), (c[N], s[N])]
    return qbpp.replace(f, ml)

def multiplier(x, y, z):
    N = len(x)
    c = qbpp.var("c", N - 1, N + 1)

    f = 0

    for i in range(N - 1):
        b_vec = [x[i + 1] * y[j] for j in range(N)]

        if i == 0:
            a_vec = [x[0] * y[j + 1] for j in range(N - 1)] + [0]
        else:
            a_vec = [c[i - 1][j + 1] for j in range(N)]

        s_vec = [c[i][j] for j in range(N + 1)]
        f += adder(a_vec, b_vec, s_vec)

    f += z[0] - x[0] * y[0] == 0

    ml = [(c[i][0], z[i + 1]) for i in range(N - 2)]
    ml += [(c[N - 2][i], z[N + i - 1]) for i in range(N + 1)]
    f = qbpp.replace(f, ml)
    f.simplify_as_binary()
    return f

x = qbpp.var("x", 4)
y = qbpp.var("y", 4)
z = [1, 1, 1, 1, 0, 0, 0, 1]
f = multiplier(x, y, z)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search({"target_energy": 0})

x_bits = "".join(str(sol(x[j])) for j in reversed(range(4)))
y_bits = "".join(str(sol(y[j])) for j in reversed(range(4)))
z_bits = "".join(str(z[j]) for j in reversed(range(8)))
print(f"{x_bits} * {y_bits} = {z_bits}")
```
Easy Solver が `f` に対して実行され、得られた解が `sol` に格納されます。
`x` と `y` の結果の値は以下のように出力されます:
```
1011 * 1101 = 10001111
```
この出力は $11\times 13 = 143$ を示しており、素因数分解の結果を実証しています。
