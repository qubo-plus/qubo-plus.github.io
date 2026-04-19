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

PyQBPPの配列はPython標準のスライス記法をサポートしています。スライスは新しい配列を返します:

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

Python のスライス構文で、指定した次元に沿って範囲スライスを行えます（次元数は保持されます）:

```python
x[1:3]         # axis 0 の 1-2 行
x[:3]          # axis 0 の先頭3つ
x[:, -2:]      # axis 1 の末尾2つ
```

## 連結 (concat)

`concat()` 関数は配列の連結やスカラーの追加を行います:

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=4)

# 1D: スカラーと配列を混在したリストを渡す
y = qbpp.concat([1, x, 0])
# y = [1, x[0], x[1], x[2], x[3], 0]

# 2D: axis パラメータ付き
z = qbpp.var("z", shape=(3, 4))
zg0 = qbpp.concat([1, z, 0], axis=0)   # 軸 0: ガード行 -> 5 x 4
zg1 = qbpp.concat([1, z, 0], axis=1)   # 軸 1: ガードビット -> 3 x 6
```

### `*`（アンパック演算子）によるPythonic な代替

Pythonのアンパック演算子 `*` を使えば、`Array()` コンストラクタ内で `concat()` を置き換えられます:

```python
# 1D: concat([1, x, 0]) と等価
y = qbpp.array([1, *x, 0])

# 2D axis=0: concat([1, z, 0], axis=0) と等価
ones = qbpp.array([1] * 4)
zeros = qbpp.array([0] * 4)
zg0 = qbpp.array([ones, *z, zeros])

# 2D axis=1: concat([1, z, 0], axis=1) と等価
zg1 = qbpp.array([qbpp.array([1, *row, 0]) for row in z])
```

最外次元ではアンパックの方が明快です。
内側の次元では `concat([...], axis=)` の方がネストを避けられます。

## ドメインウォール符号化

**ドメインウォール**とは、$1\cdots 1\, 0\cdots 0$ の形をしたバイナリパターンで、
すべての1がすべての0の前に現れます。
$n$ 個のバイナリ変数に対して、ドメインウォールパターンは正確に $n+1$ 個あり
（全1パターンと全0パターンを含む）、
$[0, n]$ の範囲の整数を表現できます。

`concat`、Pythonスライス（または `head`/`tail`）、`sqr` を使って、
最小エネルギー解がちょうどドメインウォールパターンとなるQUBO式を構築できます。

## PyQBPP プログラム

```python
import pyqbpp as qbpp

n = 8
x = qbpp.var("x", shape=n)

# y = (1, x[0], ..., x[n-1], 0)
y = qbpp.concat([1, x, 0])

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

### 仕組み

**ステップ 1: `concat` によるガードビット**

`concat(1, concat(x, 0))` で拡張ベクトルを構築します:

$$
y = (1,\; x_0,\; x_1,\; \ldots,\; x_{n-1},\; 0)
$$

先頭のガードビット 1 と末尾の 0 により、ドメインウォールパターンが境界で正しく制約されます。

**ステップ 2: Pythonスライスによる隣接差分**

`y[:n+1] - y[-(n+1):]` で連続する要素間の差分を計算します:

$$
\text{diff}_i = y_i - y_{i+1} \quad (0 \le i \le n)
$$

これは C++ の `head(y, n+1) - tail(y, n+1)` イディオムに対応する Python 記法です。

**ステップ 3: `sqr` と `sum` によるペナルティ**

`qbpp.sum(qbpp.sqr(diff))` は $\sum_{i=0}^{n} (y_i - y_{i+1})^2$ を計算します。
各 $y_i \in \{0, 1\}$ なので、各二乗差分は 0 または 1 です。
この和は $y$ における遷移（0 から 1 または 1 から 0 への変化）の回数を数えます。

ドメインウォールパターンは遷移が正確に**1回**（1 から 0 への変化）なので、
最小エネルギーは **1** であり、$n+1$ 個すべてのドメインウォールパターンがこの最小値を達成します。

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

9つの最適解はすべてドメインウォールパターンで、整数 0 から 8 を表現しています。

## Dual-Matrix Domain Wall

**Dual-Matrix Domain Wall** 法は、異なるサイズの2つのバイナリ行列を使用して $n \times n$ の置換行列を構築します:
`x`（$(n{-}1) \times n$、列方向ドメインウォール）と `y`（$n \times (n{-}1)$、行方向ドメインウォール）。
ガードビットを追加して隣接差分を取ると、それぞれ $n \times n$ のone-hot行列が得られます。
これらを一致させることで、各行・各列にちょうど1つの1を持つ置換行列になります。
詳細は [https://arxiv.org/abs/2308.01024](https://arxiv.org/abs/2308.01024) を参照してください。

```python
import pyqbpp as qbpp

n = 6
x = qbpp.var("x", shape=(n - 1, n))  # (n-1) x n
y = qbpp.var("y", shape=(n, n - 1))  # n x (n-1)

# x: axis=0 でガード行追加 -> (n+1) x n、差分 -> n x n（各列one-hot）
xg = qbpp.concat([1, x, 0], axis=0)
x_oh = xg[:n] - xg[-n:]
x_dw = qbpp.sum(qbpp.sqr(x_oh))

# y: axis=1 でガードビット追加 -> n x (n+1)、差分 -> n x n（各行one-hot）
yg = qbpp.concat([1, y, 0], axis=1)
y_oh = yg[:, :n] - yg[:, -n:]
y_dw = qbpp.sum(qbpp.sqr(y_oh))

# 一致制約: x_oh == y_oh（転置不要、両方 n x n）
match = qbpp.sum(qbpp.constrain(x_oh - y_oh, equal=0))

f = x_dw + y_dw + match
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=2 * n)

print("energy =", sol.energy)
print(f"x ({n-1}x{n})  x_oh ({n}x{n})")
for i in range(n):
    if i < n - 1:
        row_x = "".join(str(sol(x[i][j])) for j in range(n))
    else:
        row_x = " " * n
    row_oh = "".join(str(sol(x_oh[i][j])) for j in range(n))
    print(f"{row_x}  ->  {row_oh}")
print(f"y ({n}x{n-1})  y_oh ({n}x{n})")
for i in range(n):
    row_y = "".join(str(sol(y[i][j])) for j in range(n - 1))
    row_oh = "".join(str(sol(y_oh[i][j])) for j in range(n))
    print(f"{row_y}   ->  {row_oh}")
```

### 仕組み

1. **`x`** は $(n{-}1) \times n$。`concat(1, concat(x, 0, 0), 0)` で `dim=0` に沿ってガード行を追加すると $(n{+}1) \times n$ となり、各列がドメインウォール。`xg[:n] - xg[-n:]`（`dim=0` での `head - tail` に相当）で $n \times n$ の行列 `x_oh` を得て、各**列**がone-hotになります。

2. **`y`** は $n \times (n{-}1)$。`concat(1, concat(y, 0, 1), 1)` で `dim=1` に沿ってガードビットを追加すると $n \times (n{+}1)$ となり、各行がドメインウォール。`yg[:, :n] - yg[:, -n:]`（`dim=1` での `head - tail` に相当）で $n \times n$ の行列 `y_oh` を得て、各**行**がone-hotになります。

3. **`x_oh == y_oh`**: 両方 $n \times n$ なので、転置なしで直接比較できます。一致させると、各行・各列にちょうど1つの1がある**置換行列**になります。

### 主要な操作

- **`x[:n]` / `x[-n:]`**: Python スライスで先頭/末尾の要素を取得。
- **`x[:, :n]` / `x[:, -n:]`**: タプルインデックスで内側の次元をスライス。
- **`concat(1, x, 0)`**（`dim=0`）: 全1のガード行を上に追加。
- **`concat(1, x, 1)`**（`dim=1`）: 各行の先頭に1を追加。

### 出力

```
energy = 12
x (5x6)  x_oh (6x6)
111101  ->  000010
111100  ->  000001
110100  ->  001000
010100  ->  100000
010000  ->  000100
        ->  010000
y (6x5)  y_oh (6x6)
11110   ->  000010
11111   ->  000001
11000   ->  001000
00000   ->  100000
11100   ->  000100
10000   ->  010000
```

最適エネルギーは $2n = 12$ です。`x_oh` と `y_oh` は一致し、有効な $6 \times 6$ の置換行列を形成しています。

## 軸固定スライス（タプルインデックス）

多次元配列から特定の軸を**固定値**で指定してサブ配列を取得するには、Python のタプルインデックスを使います。整数インデックスはその軸を固定し（**次元が減少**）、スライス `:` はその軸を保持します:

```python
x = qbpp.var("x", shape=(3, 4))  # 3x4

row0 = x[0]         # axis 0 を 0 に固定 → (4,)
col2 = x[:, 2]      # axis 1 を 2 に固定 → (3,)
```

行同士の要素毎積:

```python
prod = x[0] * x[1]   # 1次元 Array of Term（4要素）
s = qbpp.sum(prod)    # Expr
```

複数の軸を同時に固定することもできます:

```python
z = qbpp.var("z", shape=(2, 3, 4))  # 2x3x4

s1 = z[1]            # axis 0 を 1 に固定 → 3x4
s2 = z[1, :, 3]      # axis 0=1, axis 2=3 に固定 → (3,)
v  = z[1, 2, 3]      # 全軸を固定 → Var（スカラー）
```

> **注釈**
> Python スライス（例 `x[1:3]`、`x[:n]`）は**範囲ベース**のスライスで次元数を保持するのに対し、
> 整数インデックス（例 `x[0]`、`z[1, :, 3]`）は**軸固定**スライスで次元数が減少します。
