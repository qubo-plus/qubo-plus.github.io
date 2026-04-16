---
layout: default
nav_exclude: true
title: "Slice and Concat"
nav_order: 19
lang: ja
hreflang_alt: "en/python/SLICE_CONCAT"
hreflang_lang: "en"
---

# スライスと連結

PyQBPPはPythonスタイルのスライスと`concat()`関数による配列操作をサポートしています。
このページでは、**ドメインウォール符号化**と**Dual-Matrix Domain Wall**法を通じてこれらの操作を紹介します。

## スライス

PyQBPPの配列はPython標準のスライス記法をサポートしています。スライスは新しい`Array`を返します:

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=8)
print(x[:3])     # 先頭3つ:  [x[0], x[1], x[2]]
print(x[-3:])    # 末尾3つ:  [x[5], x[6], x[7]]
print(x[2:5])    # 範囲:     [x[2], x[3], x[4]]
```

多次元配列にはタプルインデックス（NumPyスタイル）を使います:

```python
x = qbpp.var("x", shape=(3, 5))
print(x[:, :3])    # 各行の先頭3列
print(x[:, -2:])   # 各行の末尾2列
print(x[1:3, 1:4]) # 1-2行, 1-3列

x = qbpp.var("x", shape=(2, 3, 4))
print(x[:, :, :2]) # 3次元目の先頭2要素
```

## 連結 (concat)

`concat()` 関数は配列の連結やスカラーの追加を行います:

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=4)

# 1D: スカラー + 配列、配列 + スカラー
y = qbpp.concat(1, qbpp.concat(x, 0))
# y = [1, x[0], x[1], x[2], x[3], 0]

# 2D: dimパラメータ付き
z = qbpp.var("z", shape=(3, 4))
zg0 = qbpp.concat(1, qbpp.concat(z, 0, 0), 0)  # dim=0: ガード行 -> 5 x 4
zg1 = qbpp.concat(1, qbpp.concat(z, 0, 1), 1)  # dim=1: ガードビット -> 3 x 6
```

### `*`（アンパック演算子）によるPythonic な代替

Pythonのアンパック演算子 `*` を使えば、`Array()` コンストラクタ内で `concat()` を置き換えられます:

```python
# 1D: concat(1, concat(x, 0)) と等価
y = qbpp.Array([1, *x, 0])

# 2D dim=0: concat(1, concat(z, 0, 0), 0) と等価
ones = qbpp.Array([1] * 4)
zeros = qbpp.Array([0] * 4)
zg0 = qbpp.Array([ones, *z, zeros])

# 2D dim=1: concat(1, concat(z, 0, 1), 1) と等価
zg1 = qbpp.Array([qbpp.Array([1, *row, 0]) for row in z])
```

最外次元ではアンパックの方が明快です。
内側の次元では `concat(scalar, x, dim)` の方がネストを避けられます。

## ドメインウォール符号化

**ドメインウォール**とは $1\cdots 1\, 0\cdots 0$ のバイナリパターンです。
$n$ 個の変数に対して $n+1$ 個のパターンがあり、整数 $0$ から $n$ を表現できます。

```python
import pyqbpp as qbpp

n = 8
x = qbpp.var("x", shape=n)

# y = (1, x[0], ..., x[n-1], 0)
y = qbpp.concat(1, qbpp.concat(x, 0))

# 隣接差分
diff = y[:n+1] - y[-(n+1):]

# ペナルティ: ドメインウォールのとき最小値 1
f = qbpp.sum(qbpp.sqr(diff))
f.simplify_as_binary()

print("f =", f)

solver = qbpp.ExhaustiveSolver(f)
sol = solver.search(best_energy_sols=0)

print("energy =", sol.energy)
print("solutions =", len(sol.all_solutions()))
for s in sol.all_solutions():
    bits = "".join(str(s(x[i])) for i in range(n))
    print(f"  {bits}  (sum = {s(qbpp.sum(x))})")
```

### 出力

```
f = 1 +2*x[1] +2*x[2] +2*x[3] +2*x[4] +2*x[5] +2*x[6] +2*x[7] -2*x[0]*x[1] -2*x[1]*x[2] -2*x[2]*x[3] -2*x[3]*x[4] -2*x[4]*x[5] -2*x[5]*x[6] -2*x[6]*x[7]
energy = 1
solutions = 9
  00000000  (sum = 0)
  10000000  (sum = 1)
  11000000  (sum = 2)
  11100000  (sum = 3)
  11110000  (sum = 4)
  11111000  (sum = 5)
  11111100  (sum = 6)
  11111110  (sum = 7)
  11111111  (sum = 8)
```

## Dual-Matrix Domain Wall

**Dual-Matrix Domain Wall** 法は、2つのバイナリ行列 `x`（$(n{-}1) \times n$）と `y`（$n \times (n{-}1)$）を使って $n \times n$ の置換行列を構築します。
ガードビットを追加して隣接差分を取ると、それぞれ $n \times n$ のone-hot行列が得られます。
これらを一致させることで、ループなしで置換行列を表現できます。
詳細は [https://arxiv.org/abs/2308.01024](https://arxiv.org/abs/2308.01024) を参照してください。

```python
import pyqbpp as qbpp

n = 6
x = qbpp.var("x", shape=(n - 1, n))  # (n-1) x n
y = qbpp.var("y", shape=(n, n - 1))  # n x (n-1)

# x: ガード行追加 (dim=0)、差分 -> n x n（各列one-hot）
xg = qbpp.concat(1, qbpp.concat(x, 0, 0), 0)
x_oh = xg[:n] - xg[-n:]
x_dw = qbpp.sum(qbpp.sqr(x_oh))

# y: ガードビット追加 (dim=1)、差分 -> n x n（各行one-hot）
yg = qbpp.concat(1, qbpp.concat(y, 0, 1), 1)
y_oh = yg[:, :n] - yg[:, -n:]
y_dw = qbpp.sum(qbpp.sqr(y_oh))

# 一致制約: x_oh == y_oh
match = qbpp.sum(qbpp.constrain(x_oh - y_oh, equal=0))

f = x_dw + y_dw + match
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=2 * n)

print("energy =", sol.energy)
print("permutation:")
for i in range(n):
    print(" ", "".join(str(sol(x_oh[i][j])) for j in range(n)))
```

### 主要な操作

- **`x[:n]` / `x[-n:]`**: Pythonスライスで C++ の `head()` / `tail()` に相当。
- **`x[:, :n]` / `x[:, -n:]`**: タプルインデックスで内側の次元をスライス。
- **`concat(1, x, 0)`**（`dim=0`）: 全1のガード行を上に追加。
- **`concat(1, x, 1)`**（`dim=1`）: 各行の先頭に1を追加。

### 出力

```
energy = 12
permutation:
  000001
  100000
  000100
  010000
  000010
  001000
```
