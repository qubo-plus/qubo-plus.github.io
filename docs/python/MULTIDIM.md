---
layout: default
nav_exclude: true
title: "Multi-dimensional Variables"
nav_order: 13
alt_lang: "C++ version"
alt_lang_url: "MULTIDIM"
---

<div class="lang-en" markdown="1">
# Multi-dimensional Variables and Expressions

## Defining multi-dimensional variables
PyQBPP supports **multi-dimensional variables** and **multi-dimensional integer variables** of arbitrary depth using the functions `var()` and `var_int()`, respectively.
Their basic usage is as follows:
- `var("name", s1, s2, ..., sd)`: Creates an array of `Var` objects with the given `name` and shape $s_1\times s_2\times \cdots\times s_d$.
- `between(var_int("name", s1, s2, ..., sd), l, u)`: Creates an array of `VarInt` objects with the specified range and shape.

The following program creates a binary variable with dimension $2\times 3\times 4$:
```python
import pyqbpp as qbpp

x = qbpp.var("x", 2, 3, 4)
print("x =", x)
```
{% raw %}
Each `Var` object in **`x`** can be accessed as **`x[i][j][k]`**.
{% endraw %}

## Creating integer variable arrays with individual ranges

When defining a multi-dimensional array of integer variables, all elements created by `qbpp.between(qbpp.var_int("name", s1, s2, ...), l, u)` share the same range $[l, u]$.
In many practical problems, however, each element may need a different range.
There are three approaches to achieve this.

### Approach 1: Placeholder array

First create a **placeholder array** using **`qbpp.var_int("name", s1, s2, ...) == 0`**, then assign individual ranges to each element using `qbpp.between()`:

```python
import pyqbpp as qbpp

max_vals = [3, 7, 15, 5]
x = qbpp.var_int("x", len(max_vals)) == 0
for i in range(len(max_vals)):
    x[i] = qbpp.between(x[i], 0, max_vals[i])
for i in range(len(max_vals)):
    print(f"x[{i}] = {x[i]}")
```
Here, `qbpp.var_int("x", 4) == 0` creates an array of 4 constant-zero `VarInt` placeholders.
Each element is then reassigned with its own range using `qbpp.between(x[i], 0, max_vals[i])`.
The `qbpp.between()` function automatically inherits the name from the placeholder, so no explicit name is needed.

> **NOTE**
> The `== 0` syntax creates a `VarInt` with `min_val = max_val = 0` (i.e., a constant zero placeholder).
> It does **not** create an equality constraint.

### Approach 2: Passing lists to `between()`

You can pass Python lists as the `min_val` and `max_val` arguments to `qbpp.between()`.
Each element of the array will be assigned the corresponding range from the lists:

```python
import pyqbpp as qbpp

max_vals = [3, 7, 15, 5]
x = qbpp.between(qbpp.var_int("x", len(max_vals)), 0, max_vals)
for i in range(len(max_vals)):
    print(f"x[{i}] = {x[i]}")
```

This is the most concise approach. The `var_int("x", n)` creates a named array builder, and
`between()` assigns individual ranges from the lists element by element.
This is analogous to the C++ syntax `lower <= qbpp::var_int("x", n) <= upper`.

### Approach 3: List comprehension with `Array`

You can also use a Python list comprehension wrapped with `qbpp.Array()`:

```python
import pyqbpp as qbpp

max_vals = [3, 7, 15, 5]
x = qbpp.Array([qbpp.between(qbpp.var_int(f"x[{i}]"), 0, max_vals[i])
                  for i in range(len(max_vals))])
```

This approach creates the variables directly without placeholders.
Note that an explicit name (e.g., `f"x[{i}]"`) must be provided for each variable,
and the result must be wrapped with `qbpp.Array()` to enable element-wise operations.

## Defining multi-dimensional expressions
PyQBPP allows you to define **multi-dimensional expressions** with arbitrary depth using the function `expr()`:
- **`expr(s1, s2, ..., sd)`**: Creates a multi-dimensional array of `Expr` objects with shape $s_1\times s_2\times \cdots\times s_d$.

The following program defines a 3-dimensional array **`x`** of `Var` objects with shape $2\times 3\times 4$ and
a 2-dimensional array `f` of size $2\times 3$.
Then, using nested loops, each `f[i][j]` accumulates the sum of `x[i][j][0]` through `x[i][j][3]`:
```python
import pyqbpp as qbpp

x = qbpp.var("x", 2, 3, 4)
f = qbpp.expr(2, 3)
for i in range(2):
    for j in range(3):
        for k in range(4):
            f[i][j] += x[i][j][k]
f.simplify_as_binary()

for i in range(2):
    for j in range(3):
        print(f"f[{i}][{j}] =", f[i][j])
```
This program produces the following output:
```
f[0][0] = x[0][0][0] +x[0][0][1] +x[0][0][2] +x[0][0][3]
f[0][1] = x[0][1][0] +x[0][1][1] +x[0][1][2] +x[0][1][3]
f[0][2] = x[0][2][0] +x[0][2][1] +x[0][2][2] +x[0][2][3]
f[1][0] = x[1][0][0] +x[1][0][1] +x[1][0][2] +x[1][0][3]
f[1][1] = x[1][1][0] +x[1][1][1] +x[1][1][2] +x[1][1][3]
f[1][2] = x[1][2][0] +x[1][2][1] +x[1][2][2] +x[1][2][3]
```

## Creating an array of expressions by operations
An array of `Expr` objects can be created without explicitly calling `expr()`.
When an arithmetic operation yields an array-shaped result, an array of `Expr` objects with the same shape is created automatically.

```python
import pyqbpp as qbpp

x = qbpp.var("x", 2, 3)
f = x + 1
f += x - 2
f.simplify_as_binary()
for i in range(2):
    for j in range(3):
        print(f"f[{i}][{j}] =", f[i][j])
```
This program outputs:
```
f[0][0] = -1 +2*x[0][0]
f[0][1] = -1 +2*x[0][1]
f[0][2] = -1 +2*x[0][2]
f[1][0] = -1 +2*x[1][0]
f[1][1] = -1 +2*x[1][1]
f[1][2] = -1 +2*x[1][2]
```

## Iterating over multi-dimensional arrays
Since PyQBPP arrays support Python iteration, nested for loops can be used:
```python
import pyqbpp as qbpp

x = qbpp.var("x", 2, 3)
f = x + 1
f += x - 2
f.simplify_as_binary()
for row in f:
    for element in row:
        print(f"({element})", end="")
    print()
```
This program outputs:
```
(-1 +2*x[0][0])(-1 +2*x[0][1])(-1 +2*x[0][2])
(-1 +2*x[1][0])(-1 +2*x[1][1])(-1 +2*x[1][2])
```

## `Array` and Python `list`

PyQBPP's `Array` is an opaque object backed by the QUBO++ shared library (`.so`).
It is **not** a Python `list` — it is a specialized data structure optimized for QUBO++ operations.

### Creating an `Array` from a Python list

You can convert a Python list into an `Array` using `qbpp.Array()`:

```python
w = qbpp.Array([64, 27, 47, 74, 12, 83, 63, 40])
```

Once converted, the `Array` supports element-wise arithmetic (`+`, `-`, `*`, `/`, `~`), `sum()`, `sqr()`, `simplify()`, and other QUBO++ functions efficiently.

### When you don't need `qbpp.Array()`

When a Python list is used in an arithmetic operation with an `Array`, it is automatically converted.
For example:

```python
w = [64, 27, 47, 74, 12, 83, 63, 40]
x = qbpp.var("x", len(w))
f = w * x       # list * Array → element-wise multiplication
```

In this case, wrapping `w` with `qbpp.Array()` is not necessary.
However, if `w` is used repeatedly in multiple operations, wrapping it once with `qbpp.Array()` can improve performance by avoiding repeated conversions from `list` to `Array`.

### Example: `list` vs `Array` behavior

The following example illustrates the difference between a Python `list` and an `Array`:

```python
import pyqbpp as qbpp

x = qbpp.var("x")
u = [x+2, x+3, x+5, x+7]
w = qbpp.Array([x+2, x+3, x+5, x+7])
print(f"2 * u = {2 * u}")
print(f"2 * w = {2 * w}")
```

Output:
```
2 * u = [2 +x, 3 +x, 5 +x, 7 +x, 2 +x, 3 +x, 5 +x, 7 +x]
2 * w = [4 +2*x, 6 +2*x, 10 +2*x, 14 +2*x]
```

With the Python `list` `u`, `2 * u` produces a **repeated list** (8 elements).
With the `Array` `w`, `2 * w` produces an **element-wise multiplication** (each element multiplied by 2).

### Key differences from Python `list`

| | `Array` | Python `list` |
|---|---|---|
| **Element-wise `+`** | Element-wise addition | List concatenation |
| **Element-wise `*`** | Element-wise multiplication | List repetition |
| **`~x`** | Element-wise negation | TypeError |
| **`sum()`** | Sum of all elements as `Expr` | Python built-in sum |
| **`sqr()`** | Element-wise squaring | Not available |
| **`append()`, `pop()`** | Not available | Available |
| **Slicing** | `slice()`, `head()`, `tail()` | `x[1:3]` |

> **NOTE**
> An `Array` is a fixed-size, opaque container. Python list operations such as `append()`, `pop()`, `insert()`, and slice assignment are **not** supported.
> Use QUBO++ functions like `slice()`, `head()`, `tail()` for extracting sub-arrays.

</div>

<div class="lang-ja" markdown="1">
# 多次元変数と式

## 多次元変数の定義
PyQBPPは、関数 `var()` および `var_int()` を使って、任意の深さの**多次元変数**および**多次元整数変数**をサポートしています。
基本的な使い方は以下の通りです。
- `var("name", s1, s2, ..., sd)`: 指定された `name` と形状 $s_1\times s_2\times \cdots\times s_d$ を持つ `Var` オブジェクトの配列を作成します。
- `between(var_int("name", s1, s2, ..., sd), l, u)`: 指定された範囲と形状を持つ `VarInt` オブジェクトの配列を作成します。

以下のプログラムは $2\times 3\times 4$ の次元を持つバイナリ変数を作成します。
```python
import pyqbpp as qbpp

x = qbpp.var("x", 2, 3, 4)
print("x =", x)
```
{% raw %}
**`x`** 内の各 `Var` オブジェクトは **`x[i][j][k]`** としてアクセスできます。
{% endraw %}

## 個別の範囲を持つ整数変数配列の作成

多次元整数変数配列を定義する場合、`qbpp.between(qbpp.var_int("name", s1, s2, ...), l, u)` で作成された全要素は同じ範囲 $[l, u]$ を共有します。
しかし実際の問題では、各要素に異なる範囲が必要な場合が多くあります。
これを実現するには3つの方法があります。

### 方法1: プレースホルダ配列

まず **`qbpp.var_int("name", s1, s2, ...) == 0`** で**プレースホルダ配列**を作成し、`qbpp.between()` で各要素に個別の範囲を割り当てます:

```python
import pyqbpp as qbpp

max_vals = [3, 7, 15, 5]
x = qbpp.var_int("x", len(max_vals)) == 0
for i in range(len(max_vals)):
    x[i] = qbpp.between(x[i], 0, max_vals[i])
for i in range(len(max_vals)):
    print(f"x[{i}] = {x[i]}")
```
ここで、`qbpp.var_int("x", 4) == 0` は定数ゼロの `VarInt` プレースホルダ4個の配列を作成します。
各要素は `qbpp.between(x[i], 0, max_vals[i])` で個別の範囲に再代入されます。
`qbpp.between()` はプレースホルダから名前を自動的に引き継ぐため、明示的な名前の指定は不要です。

> **NOTE**
> `== 0` の構文は `min_val = max_val = 0`（定数ゼロのプレースホルダ）の `VarInt` を作成するものであり、等号制約を作成するものでは**ありません**。

### 方法2: `between()` にリストを渡す

`qbpp.between()` の `min_val` と `max_val` にPythonリストを渡すことができます。
配列の各要素にリストの対応する範囲が割り当てられます:

```python
import pyqbpp as qbpp

max_vals = [3, 7, 15, 5]
x = qbpp.between(qbpp.var_int("x", len(max_vals)), 0, max_vals)
for i in range(len(max_vals)):
    print(f"x[{i}] = {x[i]}")
```

これが最も簡潔な方法です。`var_int("x", n)` で名前付き配列ビルダーを作成し、
`between()` がリストから要素ごとに個別の範囲を割り当てます。
C++ の `lower <= qbpp::var_int("x", n) <= upper` 構文に対応します。

### 方法3: リスト内包表記と `Array`

Python のリスト内包表記を `qbpp.Array()` で包む方法もあります:

```python
import pyqbpp as qbpp

max_vals = [3, 7, 15, 5]
x = qbpp.Array([qbpp.between(qbpp.var_int(f"x[{i}]"), 0, max_vals[i])
                  for i in range(len(max_vals))])
```

この方法ではプレースホルダなしに変数を直接作成します。
各変数に明示的な名前（例: `f"x[{i}]"`）を指定する必要があることと、
要素ごとの演算を使用するには結果を `qbpp.Array()` で包む必要がある点に注意してください。

## 多次元式の定義
PyQBPPでは、関数 `expr()` を使って任意の深さの**多次元式**を定義できます。
- **`expr(s1, s2, ..., sd)`**: 形状 $s_1\times s_2\times \cdots\times s_d$ を持つ `Expr` オブジェクトの多次元配列を作成します。

以下のプログラムは、形状 $2\times 3\times 4$ の `Var` オブジェクトの3次元配列 **`x`** と、
サイズ $2\times 3$ の2次元配列 `f` を定義します。
次に、ネストされたループを使って、各 `f[i][j]` に `x[i][j][0]` から `x[i][j][3]` までの合計を蓄積します。
```python
import pyqbpp as qbpp

x = qbpp.var("x", 2, 3, 4)
f = qbpp.expr(2, 3)
for i in range(2):
    for j in range(3):
        for k in range(4):
            f[i][j] += x[i][j][k]
f.simplify_as_binary()

for i in range(2):
    for j in range(3):
        print(f"f[{i}][{j}] =", f[i][j])
```
このプログラムの出力は以下の通りです。
```
f[0][0] = x[0][0][0] +x[0][0][1] +x[0][0][2] +x[0][0][3]
f[0][1] = x[0][1][0] +x[0][1][1] +x[0][1][2] +x[0][1][3]
f[0][2] = x[0][2][0] +x[0][2][1] +x[0][2][2] +x[0][2][3]
f[1][0] = x[1][0][0] +x[1][0][1] +x[1][0][2] +x[1][0][3]
f[1][1] = x[1][1][0] +x[1][1][1] +x[1][1][2] +x[1][1][3]
f[1][2] = x[1][2][0] +x[1][2][1] +x[1][2][2] +x[1][2][3]
```

## 演算による式配列の作成
`Expr` オブジェクトの配列は、`expr()` を明示的に呼び出さなくても作成できます。
算術演算が配列形状の結果を生成する場合、同じ形状の `Expr` オブジェクトの配列が自動的に作成されます。

```python
import pyqbpp as qbpp

x = qbpp.var("x", 2, 3)
f = x + 1
f += x - 2
f.simplify_as_binary()
for i in range(2):
    for j in range(3):
        print(f"f[{i}][{j}] =", f[i][j])
```
このプログラムの出力は以下の通りです。
```
f[0][0] = -1 +2*x[0][0]
f[0][1] = -1 +2*x[0][1]
f[0][2] = -1 +2*x[0][2]
f[1][0] = -1 +2*x[1][0]
f[1][1] = -1 +2*x[1][1]
f[1][2] = -1 +2*x[1][2]
```

## 多次元配列のイテレーション
PyQBPPの配列はPythonのイテレーションをサポートしているため、ネストされた for ループが使用できます。
```python
import pyqbpp as qbpp

x = qbpp.var("x", 2, 3)
f = x + 1
f += x - 2
f.simplify_as_binary()
for row in f:
    for element in row:
        print(f"({element})", end="")
    print()
```
このプログラムの出力は以下の通りです。
```
(-1 +2*x[0][0])(-1 +2*x[0][1])(-1 +2*x[0][2])
(-1 +2*x[1][0])(-1 +2*x[1][1])(-1 +2*x[1][2])
```

## `Array` と Python の `list`

PyQBPP の `Array` は QUBO++ 共有ライブラリ（`.so`）に裏打ちされた不透明オブジェクトです。
Python の `list` とは異なり、QUBO++ の演算に最適化された専用のデータ構造です。

### Python リストから `Array` の作成

`qbpp.Array()` を使って Python リストを `Array` に変換できます:

```python
w = qbpp.Array([64, 27, 47, 74, 12, 83, 63, 40])
```

変換後の `Array` は、要素ごとの算術演算（`+`, `-`, `*`, `/`, `~`）、`sum()`、`sqr()`、`simplify()` などの QUBO++ 関数を効率的にサポートします。

### `qbpp.Array()` が不要な場合

Python リストが `Array` との算術演算で使われる場合、自動的に変換されます。
例えば:

```python
w = [64, 27, 47, 74, 12, 83, 63, 40]
x = qbpp.var("x", len(w))
f = w * x       # list * Array → 要素ごとの乗算
```

この場合、`w` を `qbpp.Array()` でラップする必要はありません。
ただし、`w` が複数の演算で繰り返し使われる場合は、あらかじめ `qbpp.Array()` でラップしておくことで、`list` から `Array` への変換が毎回発生するのを避け、高速化が期待できます。

### 例: `list` と `Array` の動作の違い

以下の例は、Python の `list` と `Array` の違いを示しています:

```python
import pyqbpp as qbpp

x = qbpp.var("x")
u = [x+2, x+3, x+5, x+7]
w = qbpp.Array([x+2, x+3, x+5, x+7])
print(f"2 * u = {2 * u}")
print(f"2 * w = {2 * w}")
```

出力:
```
2 * u = [2 +x, 3 +x, 5 +x, 7 +x, 2 +x, 3 +x, 5 +x, 7 +x]
2 * w = [4 +2*x, 6 +2*x, 10 +2*x, 14 +2*x]
```

Python の `list` である `u` では、`2 * u` は**リストの繰り返し**（8要素）になります。
`Array` である `w` では、`2 * w` は**要素ごとの乗算**（各要素が2倍）になります。

### Python `list` との主な違い

| | `Array` | Python `list` |
|---|---|---|
| **要素ごとの `+`** | 要素ごとの加算 | リストの連結 |
| **要素ごとの `*`** | 要素ごとの乗算 | リストの繰り返し |
| **`~x`** | 要素ごとの否定 | TypeError |
| **`sum()`** | 全要素の合計を `Expr` として返す | Python 組み込みの sum |
| **`sqr()`** | 要素ごとの二乗 | 利用不可 |
| **`append()`, `pop()`** | 利用不可 | 利用可能 |
| **スライス** | `slice()`, `head()`, `tail()` | `x[1:3]` |

> **NOTE**
> `Array` は固定サイズの不透明コンテナです。`append()`、`pop()`、`insert()`、スライス代入などの Python リスト操作は**サポートされていません**。
> 部分配列の抽出には QUBO++ の関数 `slice()`、`head()`、`tail()` を使用してください。

</div>
