---
layout: default
nav_exclude: true
title: "Multi-dimensional Variables"
nav_order: 13
lang: ja
hreflang_alt: "en/python/MULTIDIM"
hreflang_lang: "en"
---

# 多次元変数と式

## 多次元変数の定義
PyQBPPは、関数 `var()` を使って、任意の深さの**多次元変数**および**多次元整数変数**をサポートしています。
基本的な使い方は以下の通りです。
- `var("name", shape=(s1, s2, ..., sd))`: 指定された `name` と形状 $s_1\times s_2\times \cdots\times s_d$ を持つ変数の配列を作成します。
- `var("name", shape=(s1, s2, ..., sd), between=(l, u))`: 指定された範囲と形状を持つ整数変数の配列を作成します。

以下のプログラムは $2\times 3\times 4$ の次元を持つバイナリ変数を作成します。
```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(2, 3, 4))
print("x =", x)
```
{% raw %}
**`x`** 内の各変数は **`x[i][j][k]`** としてアクセスできます。
{% endraw %}

## 定数・変数・式の配列

Python リストを **`qbpp.array(リスト)`** に渡すと、先頭要素の型から要素型が自動判別されて配列が作成されます（C++ の `qbpp::array()` に相当）:

| 呼び出し形式 | 結果 | 説明 |
|---|---|---|
| `qbpp.array([1, 2, 3])` | 1次元の整数定数の配列 | 整数定数の配列 |
| `qbpp.array([[1,2],[3,4]])` | 2次元の整数定数の配列 | 2次元の整数定数配列 |
| `qbpp.array([v1, v2])` | 1次元のバイナリ変数の配列 | バイナリ変数の配列 |
| `qbpp.array([e1, e2])` | 1次元の式の配列 | 式の配列 |

整数定数配列は変数配列との要素ごとの演算に使用できます。以下のプログラムは、$2\times 2$ の整数定数行列 `c` とバイナリ変数行列 `x` の要素ごとの積を合計します:
```python
import pyqbpp as qbpp

c = qbpp.array([[1, 2], [3, 4]])
x = qbpp.var("x", shape=(2, 2))
f = qbpp.sum(c * x)
print("f =", f)
```
`c * x` は要素ごとの積を返し、`qbpp.sum` がその全要素を合計して単一の式を返します。このプログラムの出力は以下の通りです:
```
f = x[0][0] +2*x[0][1] +3*x[1][0] +4*x[1][1]
```

## 個別の範囲を持つ整数変数配列の作成

多次元整数変数配列を定義する場合、`qbpp.var("name", shape=(...), between=(l, u))` で作成された全要素は同じ範囲 $[l, u]$ を共有します。
しかし実際の問題では、各要素に異なる範囲が必要な場合が多くあります。
これを実現するには3つの方法があります。

### 方法1: プレースホルダ配列

まず **`qbpp.var("name", shape=..., equal=val)`** で**プレースホルダ配列**を作成し、`qbpp.constrain()` で各要素に個別の範囲を割り当てます:

```python
import pyqbpp as qbpp

max_vals = [3, 7, 15, 5]
x = qbpp.var("x", shape=len(max_vals), equal=0)
for i in range(len(max_vals)):
    x[i] = qbpp.constrain(x[i], between=(0, max_vals[i]))
for i in range(len(max_vals)):
    print(f"x[{i}] = {x[i]}")
```
ここで、`qbpp.var("x", shape=4, equal=0)` は定数値0で初期化された整数変数プレースホルダ4個の可変配列を作成します。
各要素は `qbpp.constrain(x[i], between=(0, max_vals[i]))` で個別の範囲に再代入されます。
`qbpp.constrain()` はプレースホルダから名前を自動的に引き継ぐため、明示的な名前の指定は不要です。

> **注釈**
> `equal=` の値は0以外の任意の整数を指定できます。この構文はメモリ上に可変配列を確保し、各要素を個別に再代入できるようにします。

### 方法2: `between=` にリストを渡す

`between` の境界値にPythonリストを渡すことができます。
配列の各要素にリストの対応する範囲が割り当てられます:

```python
import pyqbpp as qbpp

max_vals = [3, 7, 15, 5]
x = qbpp.var("x", shape=len(max_vals), between=(0, max_vals))
for i in range(len(max_vals)):
    print(f"x[{i}] = {x[i]}")
```

これが最も簡潔な方法です。`shape=` で配列の次元を指定し、
`between=` がリストから要素ごとに個別の範囲を割り当てます。
C++ の `lower <= qbpp::var_int("x", n) <= upper` 構文に対応します。

### 方法3: リスト内包表記と array

Python のリスト内包表記を `qbpp.array()` で包む方法もあります:

```python
import pyqbpp as qbpp

max_vals = [3, 7, 15, 5]
x = qbpp.array([qbpp.var(f"x[{i}]", between=(0, max_vals[i]))
                  for i in range(len(max_vals))])
```

この方法ではプレースホルダなしに変数を直接作成します。
各変数に明示的な名前（例: `f"x[{i}]"`）を指定する必要があることと、
要素ごとの演算を使用するには結果を `qbpp.array()` で包む必要がある点に注意してください。

## 多次元式の定義
PyQBPPでは、関数 `expr()` を使って任意の深さの**多次元式**を定義できます。
- **`expr(shape=(s1, s2, ..., sd))`**: 形状 $s_1\times s_2\times \cdots\times s_d$ を持つ式の多次元配列を作成します。

以下のプログラムは、形状 $2\times 3\times 4$ の変数の3次元配列 **`x`** と、
サイズ $2\times 3$ の2次元配列 `f` を定義します。
次に、ネストされたループを使って、各 `f[i][j]` に `x[i][j][0]` から `x[i][j][3]` までの合計を蓄積します。
```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(2, 3, 4))
f = qbpp.expr(shape=(2, 3))
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
式の配列は、`expr()` を明示的に呼び出さなくても作成できます。
算術演算が配列形状の結果を生成する場合、同じ形状の式の配列が自動的に作成されます。

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(2, 3))
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

x = qbpp.var("x", shape=(2, 3))
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

## array と Python の `list`

PyQBPP の array は QUBO++ 共有ライブラリ（`.so`）に裏打ちされた不透明オブジェクトです。
Python の `list` とは異なり、QUBO++ の演算に最適化された専用のデータ構造です。

### Python リストから array の作成

`qbpp.array()` を使って Python リストを array に変換できます:

```python
w = qbpp.array([64, 27, 47, 74, 12, 83, 63, 40])
```

変換後の array は、要素ごとの算術演算（`+`, `-`, `*`, `/`, `~`）、`sum()`、`sqr()`、`simplify()` などの QUBO++ 関数を効率的にサポートします。

### `qbpp.array()` が不要な場合

Python リストが array との算術演算で使われる場合、自動的に変換されます。
例えば:

```python
w = [64, 27, 47, 74, 12, 83, 63, 40]
x = qbpp.var("x", shape=len(w))
f = w * x       # list * Array → 要素ごとの乗算
```

この場合、`w` を `qbpp.array()` でラップする必要はありません。
ただし、`w` が複数の演算で繰り返し使われる場合は、あらかじめ `qbpp.array()` でラップしておくことで、`list` から array への変換が毎回発生するのを避け、高速化が期待できます。

### 例: `list` と array の動作の違い

以下の例は、Python の `list` と array の違いを示しています:

```python
import pyqbpp as qbpp

x = qbpp.var("x")
u = [x+2, x+3, x+5, x+7]
w = qbpp.array([x+2, x+3, x+5, x+7])
print(f"2 * u = {2 * u}")
print(f"2 * w = {2 * w}")
```

出力:
```
2 * u = [2 +x, 3 +x, 5 +x, 7 +x, 2 +x, 3 +x, 5 +x, 7 +x]
2 * w = [4 +2*x, 6 +2*x, 10 +2*x, 14 +2*x]
```

Python の `list` である `u` では、`2 * u` は**リストの繰り返し**（8要素）になります。
array である `w` では、`2 * w` は**要素ごとの乗算**（各要素が2倍）になります。

### Python `list` との主な違い

| | array | Python `list` |
|---|---|---|
| **要素ごとの `+`** | 要素ごとの加算 | リストの連結 |
| **要素ごとの `*`** | 要素ごとの乗算 | リストの繰り返し |
| **`~x`** | 要素ごとの否定 | TypeError |
| **`sum()`** | 全要素の合計を式として返す | Python 組み込みの sum |
| **`sqr()`** | 要素ごとの二乗 | 利用不可 |
| **`append()`, `pop()`** | 利用不可 | 利用可能 |
| **スライス** | `slice()`, `head()`, `tail()` | `x[1:3]` |

> **注釈**
> array は固定サイズの不透明コンテナです。`append()`、`pop()`、`insert()`、スライス代入などの Python リスト操作は**サポートされていません**。
> 部分配列の抽出には QUBO++ の関数 `slice()`、`head()`、`tail()` を使用してください。
