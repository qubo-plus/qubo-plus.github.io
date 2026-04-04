---
layout: default
nav_exclude: true
title: "One-Hot to Integer Conversion"
nav_order: 19
alt_lang: "C++ version"
alt_lang_url: "ONEHOT"
---

<div class="lang-en" markdown="1">
# One-Hot to Integer Conversion

A **one-hot vector** is a binary vector in which exactly one element is 1 and all others are 0.
The position of the 1 encodes an integer value.
For example, `[0, 0, 1, 0]` represents the integer 2.

The global function **`qbpp.onehot_to_int()`** decodes one-hot encoded rows in an integer array
and returns an array of integers indicating the positions of the 1s.

### Basic Usage (2D Array)

For a 2D array of size $n \times m$, `onehot_to_int()` decodes each row
and returns a 1D array of $n$ integers, each in the range $[0, m-1]$.
If a row is not a valid one-hot vector (i.e., it does not contain exactly one 1),
the function returns $-1$ for that row.

{% raw %}
```python
import pyqbpp as qbpp

n, m = 5, 5
x = qbpp.var("x", n, m)

# One-hot constraint: each row has exactly one 1
onehot = qbpp.sum(qbpp.vector_sum(x) == 1)
# All-different constraint: each column has exactly one 1
alldiff = qbpp.sum(qbpp.vector_sum(x, 0) == 1)

f = onehot + alldiff
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search({"target_energy": 0})

print("x =", sol(x))

result = qbpp.onehot_to_int(sol(x))
print("onehot_to_int =", result)
```
{% endraw %}

This program defines a $5 \times 5$ permutation matrix and decodes it into a permutation:

{% raw %}
```
x = {{0,0,0,1,0},{1,0,0,0,0},{0,0,1,0,0},{0,1,0,0,0},{0,0,0,0,1}}
onehot_to_int = {3,0,2,1,4}
```
{% endraw %}

### Specifying the Axis

By default, `onehot_to_int()` decodes along the last axis (`axis=-1`).
You can specify any axis using **`onehot_to_int(arr, axis)`**.
Negative indices are also supported: axis `-1` refers to the last axis, `-2` to the second-to-last, and so on.

For a 2D array of size $n \times m$:
- **`onehot_to_int(arr)`** or **`onehot_to_int(arr, 1)`**: decodes each row, returns $n$ integers in $[0, m-1]$.
- **`onehot_to_int(arr, 0)`**: decodes each column, returns $m$ integers in $[0, n-1]$.

```python
row_result = qbpp.onehot_to_int(sol(x))     # {3,0,2,1,4}
col_result = qbpp.onehot_to_int(sol(x), 0)  # {1,3,2,0,4}
```

When `x` is a permutation matrix, `onehot_to_int(sol(x))` gives the permutation $\sigma$,
and `onehot_to_int(sol(x), 0)` gives its inverse $\sigma^{-1}$.

### 1D Input

For a 1D array of size $m$, `onehot_to_int()` returns a single-element array containing the position of the 1,
or $-1$ if the input is not a valid one-hot vector.

```python
v = qbpp.var("v", 4)
# ... solve so that v = {0, 0, 1, 0} ...
idx = qbpp.onehot_to_int(sol(v))  # {2}
```

### Higher-Dimensional Arrays

For arrays with dimension $d \geq 3$, `onehot_to_int()` decodes along the specified axis
and returns an array with dimension $d - 1$.
For example, for a $2 \times 3 \times 4$ array:
- **`onehot_to_int(arr)`** or **`onehot_to_int(arr, 2)`**: decode along axis 2 (last), result shape $2 \times 3$.
- **`onehot_to_int(arr, 1)`**: decode along axis 1, result shape $2 \times 4$.
- **`onehot_to_int(arr, 0)`**: decode along axis 0, result shape $3 \times 4$.

### Summary

| Input Shape      | Axis | Output Shape | Value Range   |
|------------------|------|--------------|---------------|
| $(m)$            | —    | $(1)$        | $[0, m-1]$ or $-1$ |
| $(d_0 \times \cdots \times d_{n-1})$ | $k$ | all dims except $d_k$ | $[0, d_k-1]$ or $-1$ |

### Comparison with C++ QUBO++

| C++ QUBO++                              | PyQBPP                                  |
|------------------------------------------|-----------------------------------------|
| `qbpp::onehot_to_int(sol(x))`          | `qbpp.onehot_to_int(sol(x))`           |
| `qbpp::onehot_to_int(sol(x), k)`       | `qbpp.onehot_to_int(sol(x), k)`        |

</div>

<div class="lang-ja" markdown="1">
# ワンホットから整数への変換

**ワンホットベクトル** とは、ちょうど1つの要素が1で残りがすべて0のバイナリベクトルです。
1の位置が整数値を符号化します。
例えば、`[0, 0, 1, 0]` は整数2を表します。

グローバル関数 **`qbpp.onehot_to_int()`** は整数配列中のワンホット符号化された行をデコードし、
1の位置を示す整数配列を返します。

### 基本的な使い方（2次元配列）

サイズ $n \times m$ の2次元配列の場合、`onehot_to_int()` は各行をデコードし、
$[0, m-1]$ の範囲の $n$ 個の整数からなる1次元配列を返します。
行が有効なワンホットベクトルでない場合（つまり、ちょうど1つの1を含まない場合）、
その行に対して $-1$ を返します。

{% raw %}
```python
import pyqbpp as qbpp

n, m = 5, 5
x = qbpp.var("x", n, m)

# ワンホット制約: 各行にちょうど1つの1
onehot = qbpp.sum(qbpp.vector_sum(x) == 1)
# 全異なり制約: 各列にちょうど1つの1
alldiff = qbpp.sum(qbpp.vector_sum(x, 0) == 1)

f = onehot + alldiff
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search({"target_energy": 0})

print("x =", sol(x))

result = qbpp.onehot_to_int(sol(x))
print("onehot_to_int =", result)
```
{% endraw %}

このプログラムは $5 \times 5$ の置換行列を定義し、それを順列にデコードします:

{% raw %}
```
x = {{0,0,0,1,0},{1,0,0,0,0},{0,0,1,0,0},{0,1,0,0,0},{0,0,0,0,1}}
onehot_to_int = {3,0,2,1,4}
```
{% endraw %}

### 軸の指定

デフォルトでは、`onehot_to_int()` は最後の軸（`axis=-1`）に沿ってデコードします。
**`onehot_to_int(arr, axis)`** で任意の軸を指定できます。
負のインデックスもサポートされています: 軸 `-1` は最後の軸、`-2` は最後から2番目の軸を指します。

サイズ $n \times m$ の2次元配列の場合:
- **`onehot_to_int(arr)`** または **`onehot_to_int(arr, 1)`**: 各行をデコード、$[0, m-1]$ の $n$ 個の整数を返す。
- **`onehot_to_int(arr, 0)`**: 各列をデコード、$[0, n-1]$ の $m$ 個の整数を返す。

```python
row_result = qbpp.onehot_to_int(sol(x))     # {3,0,2,1,4}
col_result = qbpp.onehot_to_int(sol(x), 0)  # {1,3,2,0,4}
```

`x` が置換行列の場合、`onehot_to_int(sol(x))` は順列 $\sigma$ を、
`onehot_to_int(sol(x), 0)` はその逆順列 $\sigma^{-1}$ を返します。

### 1次元入力

サイズ $m$ の1次元配列の場合、`onehot_to_int()` は1の位置を含む単一要素配列を返します。
入力が有効なワンホットベクトルでない場合は $-1$ を返します。

```python
v = qbpp.var("v", 4)
# ... v = {0, 0, 1, 0} となるように求解 ...
idx = qbpp.onehot_to_int(sol(v))  # {2}
```

### 高次元配列

次元 $d \geq 3$ の配列の場合、`onehot_to_int()` は指定された軸に沿ってデコードし、
次元 $d - 1$ の配列を返します。
例えば、$2 \times 3 \times 4$ の配列の場合:
- **`onehot_to_int(arr)`** または **`onehot_to_int(arr, 2)`**: 軸2（最後）に沿ってデコード、結果の形状 $2 \times 3$。
- **`onehot_to_int(arr, 1)`**: 軸1に沿ってデコード、結果の形状 $2 \times 4$。
- **`onehot_to_int(arr, 0)`**: 軸0に沿ってデコード、結果の形状 $3 \times 4$。

### まとめ

| 入力形状      | 軸 | 出力形状 | 値の範囲   |
|------------------|------|--------------|---------------|
| $(m)$            | —    | $(1)$        | $[0, m-1]$ または $-1$ |
| $(d_0 \times \cdots \times d_{n-1})$ | $k$ | $d_k$ を除く全次元 | $[0, d_k-1]$ または $-1$ |

### C++ QUBO++ との比較

| C++ QUBO++                              | PyQBPP                                  |
|------------------------------------------|-----------------------------------------|
| `qbpp::onehot_to_int(sol(x))`          | `qbpp.onehot_to_int(sol(x))`           |
| `qbpp::onehot_to_int(sol(x), k)`       | `qbpp.onehot_to_int(sol(x), k)`        |

</div>
