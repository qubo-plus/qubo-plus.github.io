---
layout: default
nav_exclude: true
title: "QR: Operations"
nav_order: 31
lang: ja
hreflang_alt: "en/python/QR_OPERATION"
hreflang_lang: "en"
---

# クイックリファレンス: 式の演算子と関数
以下の表は、`pyqbpp.Expr` オブジェクトで利用可能な演算子と関数をまとめたものです。

| 演算子/関数                    | 構文                                                  | Global/In-place | 戻り値の型         | 引数の型                   |
|-------------------------------|-------------------------------------------------------|-----------------|-------------------|--------------------------|
| 二項演算子                     | `f + g`, `f - g`, `f * g`                             | Global          | `Expr`            | `ExprType`-`ExprType`    |
| 複合代入                       | `f += g`, `f -= g`, `f *= g`                          | In-place        | `Expr`            | `ExprType` or `int`      |
| 除算                          | `f / n`                                               | Global          | `Expr`            | `ExprType`-`int`         |
| 複合除算                       | `f /= n`                                              | In-place        | `Expr`            | `int`                    |
| 単項演算子                     | `+f`, `-f`                                            | Global          | `Expr`            | `ExprType`               |
| 比較（等価）                    | `f == n`                                              | Global          | `ExprExpr`        | `ExprType`-`int`         |
| 比較（範囲）                    | `qbpp.between(f, l, u)`                                    | Global          | `ExprExpr`        | `ExprType`-`int`-`int`   |
| 二乗                          | `qbpp.sqr(f)`                                              | Global          | `Expr`            | `ExprType`               |
| 最大公約数                      | `qbpp.gcd(f)`                                              | Global          | `int`             | `ExprType`               |
| 簡約化                         | `qbpp.simplify_as_binary(f)` 等                             | Global          | `Expr`            | `ExprType`               |
| 簡約化                         | `f.simplify_as_binary()` 等                            | In-place        | `Expr`            | —                        |
| 評価                           | `f(ml)`                                               | Global          | `int`             | `Expr`-`list`            |
| 置換                           | `qbpp.replace(f, ml)`                                      | Global          | `Expr`            | `ExprType`-`list`        |
| 置換                           | `f.replace(ml)`                                       | In-place        | `Expr`            | `list`                   |
| バイナリ/スピン変換              | `qbpp.spin_to_binary(f)`, `qbpp.binary_to_spin(f)`              | Global          | `Expr`            | `ExprType`               |
| バイナリ/スピン変換              | `f.spin_to_binary()`, `f.binary_to_spin()`            | In-place        | `Expr`            | —                        |
| スライス                        | `v[from:to]`, `v[:, from:to]`                         | Global          | `Array`          | `Array`                 |
| 連結                            | `qbpp.concat(a, b)`, `qbpp.concat(a, b, dim)`                   | Global          | `Array`          | `Array`/`int`           |

## 式関連の型: **`ExprType`**
**`ExprType`** とは、`pyqbpp.Expr` オブジェクトに変換可能な型の総称です。
PyQBPPでは以下が含まれます。
- `int` — 整数定数
- `pyqbpp.Var` — バイナリ変数
- `pyqbpp.Term` — 多項式の項
- `pyqbpp.Expr` — 式

## グローバル関数と In-place メソッド
多くの操作は2つの形式で提供されています:
- **グローバル**: 引数を取り、入力を変更せずに新しいオブジェクトを返します。例: `qbpp.simplify_as_binary(f)` は簡約化されたコピーを返し、`f` は変更されません。
- **In-place**: オブジェクト自体を更新して返すメソッドです。例: `f.simplify_as_binary()` は `f` をその場で変更します。

## 代入
Pythonでは、`=` 演算子は変数名を新しいオブジェクトに再バインドします。
式をコピーするには、`Expr` コンストラクタを使用します。
```python
f = qbpp.Expr(g)  # f is a copy of g
```

## 二項演算子: `+`, `-`, `*`
これらの演算子は2つの `ExprType` オペランドを取り、結果を計算して返します。
少なくとも1つのオペランドが `pyqbpp.Expr` の場合、結果は常に `pyqbpp.Expr` になります。
どちらのオペランドも `pyqbpp.Expr` でない場合、結果は `pyqbpp.Term` になることがあります。

### 例
`pyqbpp.Var` 型の変数 `x` に対して:
- `2 + x`: `pyqbpp.Expr`
- `2 * x`: `pyqbpp.Term`

## 複合代入演算子: `+=`, `-=`, `*=`
左辺は `pyqbpp.Expr` でなければなりません。
右辺のオペランドを使って指定された演算が適用されます。
左辺の式はその場で更新されます。

> **NOTE**
> PyQBPPでは `*=` は `int` オペランドのみ受け付けます。

## 除算 `/` と複合除算 `/=`
除算演算子 `/` は **被除数** として `pyqbpp.Expr` を、**除数** として整数を取り、**商** を新しい `pyqbpp.Expr` として返します。

被除数の式は除数で割り切れなければなりません。すなわち、
式の整数定数項とすべての整数係数が除数で割り切れる必要があります。

複合除算演算子 `/=` は式をその場で除算します。

### 例
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = 6 * x + 4 * y + 2
g = f / 2          # g = 3*x + 2*y + 1
f = qbpp.Expr(f)
f /= 2             # f = 3*x + 2*y + 1
```

## 比較（等価）: `==`
等価比較演算子 `==` は以下を取ります。
- 左辺に `pyqbpp.Expr`（またはそれを作成する `ExprType`）
- 右辺に整数

等価制約が満たされたときに最小値 0 となる式を返します。
より具体的には、`pyqbpp.Expr` オブジェクト `f` と整数 `n` に対して、演算子は `sqr(f - n)` を返します。

返されたオブジェクト `g` に対して:
- **`g`** は制約式 `sqr(f - n)` を表し、
- **`g.body`** は基礎となる式 `f` を返します。

### `pyqbpp.ExprExpr` クラス
ここで `g` は **`pyqbpp.ExprExpr`** オブジェクトで、`pyqbpp.Expr` の派生クラスです。
`body` プロパティは関連する基礎的な `pyqbpp.Expr` オブジェクトを返します。

### C++ QUBO++ との比較
C++ QUBO++では、`*g`（間接参照演算子）を使って基礎となる式にアクセスします。
PyQBPPでは、代わりに `g.body` プロパティを使用します。

## 比較（範囲）: `between()`
C++ QUBO++では、範囲比較は `l <= f <= u` と記述します。
PyQBPPでは、代わりに `between()` 関数を使用します。
```python
g = qbpp.between(f, l, u)
```
ここで:
- `f` は非整数の `ExprType`
- `l` と `u` は整数

この関数は、範囲制約 `l <= f <= u` が満たされたときに最小値 0 となる式を返します。

より具体的には、範囲 `[l, u-1]` の値を取る単位間隔の補助整数変数 `a` が暗黙的に導入され、関数は以下を返します。
```python
(f - a) * (f - (a + 1))
```

返された `pyqbpp.ExprExpr` オブジェクト `g` に対して:
- **`g`** は制約式 `(f - a) * (f - (a + 1))` を表し、
- **`g.body`** は基礎となる式 `f` を返します。

### C++ QUBO++ との比較

| C++ QUBO++       | PyQBPP            |
|------------------|---------------------|
| `l <= f <= u`    | `qbpp.between(f, l, u)`  |
| `*g`             | `g.body`            |

## 二乗関数: `sqr()`
`pyqbpp.Expr` オブジェクト `f` に対して:
- **`pyqbpp.sqr(f)`** (グローバル関数): 式 `f * f` を返します。
引数 `f` は任意の `ExprType` オブジェクトです。

`pyqbpp.Array` オブジェクト `v` に対して:
- **`pyqbpp.sqr(v)`**: 各要素を二乗した新しい `pyqbpp.Array` を返します。

### 例
```python
import pyqbpp as qbpp

x = qbpp.var("x")
f = qbpp.sqr(x)       # x * x
```

## 最大公約数関数: `gcd()`
グローバル関数 **`pyqbpp.gcd()`** は `pyqbpp.Expr` オブジェクトを引数に取り、すべての整数係数と整数定数項の最大公約数（GCD）を返します。

与えられた式は結果のGCDで割り切れるため、GCDで割ることですべての整数係数と整数定数項を約分できます。

### 例
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = 6 * x + 4 * y + 2
print(qbpp.gcd(f))    # 2
g = f / qbpp.gcd(f)   # 3*x + 2*y + 1
```

## 簡約化関数: `simplify()`, `simplify_as_binary()`, `simplify_as_spin()`
`pyqbpp.Expr` オブジェクト `f` に対して、メンバー関数 **`f.simplify()`** は以下の操作をその場で行います。
- 各項内の変数を一意な変数IDに従ってソート
- 重複する項をマージ
- 項を以下のようにソート:
  - 低次の項が先に配置される
  - 同次の項は辞書順で並べられる

グローバル関数 **`pyqbpp.simplify(f)`** は `f` を変更せずに同じ操作を行います。

### バイナリとスピンの簡約化
簡約化関数の2つの特殊なバリアントが提供されています。
- **`simplify_as_binary()`**:
すべての変数がバイナリ値 $\lbrace 0,1\rbrace$ を取ることを前提として簡約化を行います。
すべての変数 $x$ に対して恒等式 $x^2=x$ が適用されます。
- **`simplify_as_spin()`**:
すべての変数がスピン値 $\lbrace -1,+1\rbrace$ を取ることを前提として簡約化を行います。
すべての変数 $x$ に対して恒等式 $x^2=1$ が適用されます。

両方のバリアントはメンバー関数とグローバル関数として利用可能です。
- メンバー関数（その場で更新）: `f.simplify_as_binary()`, `f.simplify_as_spin()`
- グローバル関数（非破壊的）: `qbpp.simplify_as_binary(f)`, `qbpp.simplify_as_spin(f)`

### 例
```python
import pyqbpp as qbpp

x = qbpp.var("x")
f = qbpp.Expr(x * x + x)
f.simplify_as_binary()  # 2*x (since x^2 = x)

g = qbpp.Expr(x * x + x)
g.simplify_as_spin()    # 1 + x (since x^2 = 1)
```

## 評価関数: `f(ml)`
評価関数は `(変数, 値)` のペアのリストを受け取ります。各ペアは変数から整数値へのマッピングを定義します。

`pyqbpp.Expr` オブジェクト `f` とペアのリスト `ml` に対して、評価関数 `f(ml)` は `ml` で指定された変数の割り当ての下で `f` の値を評価し、結果の整数値を返します。

`f` に出現するすべての変数は、`ml` に対応するマッピングが定義されていなければなりません。

### 例
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = 3 * x + 2 * y + 1

print(f([(x, 1), (y, 0)]))  # 4  (= 3*1 + 2*0 + 1)
```

## 置換関数: `replace()`
`replace()` 関数は `(変数, 式)` のペアのリストを受け取ります。式には整数値も指定できます。

`pyqbpp.Expr` オブジェクト `f` とペアのリスト `ml` に対して:
- **`pyqbpp.replace(f, ml)`** (グローバル関数):
`f` を変更せずに、`ml` のマッピングに従って `f` の変数を置換した新しい `pyqbpp.Expr` オブジェクトを返します。
- **`f.replace(ml)`** (メンバー関数):
`ml` のマッピングに従って `f` の変数をその場で置換し、結果の `pyqbpp.Expr` オブジェクトを返します。

### ペアのリストの作成
```python
import pyqbpp as qbpp

ml = [(x, 0), (y, 1)]                    # (変数, 式) のペアのリスト
ml = [(x, 0), (y, qbpp.Expr(z))]         # 式には整数値も指定可能
```

### 例
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = 2 * x + 3 * y + 1

ml = [(x, 1), (y, 0)]
g = qbpp.replace(f, ml)   # g = 2*1 + 3*0 + 1 = 3 (new Expr)
f.replace(ml)         # f is modified in place
```

### C++ QUBO++ との比較

| C++ QUBO++                    | PyQBPP                          |
|-------------------------------|-----------------------------------|
| `qbpp::MapList ml;`           | `ml = []`                         |
| `ml.push_back({x, 0});`      | `ml.append((x, 0))`              |
| `qbpp::replace(f, ml)`       | `qbpp.replace(f, ml)`                  |
| `f.replace(ml)`              | `f.replace(ml)`                   |

## バイナリ/スピン変換関数: `spin_to_binary()`, `binary_to_spin()`
`x` をバイナリ変数、`s` をスピン変数とします。
`x = 1` と `s = 1` が同値であると仮定します。
この仮定の下で、以下の関係が成り立ちます。

$$
\begin{aligned}
 s &= 2x-1 \\
 x &= (s+1)/2
\end{aligned}
$$

**`spin_to_binary()`** 関数は、すべてのスピン変数 `s` を `2 * s - 1` で置換することにより、スピン変数の式をバイナリ変数の式に変換します。

**`binary_to_spin()`** 関数は、すべてのバイナリ変数 `x` を `(x + 1) / 2` で置換することにより、バイナリ変数の式をスピン変数の式に変換します。
すべての係数が整数のままになるように、結果の式は $2^d$（$d$ は最大次数）で乗算されます。

両方の関数はメンバー関数（その場で更新）とグローバル関数（非破壊的）として利用可能です。

### 例
```python
import pyqbpp as qbpp

s = qbpp.var("s")
f = 3 * s + 1
g = qbpp.spin_to_binary(f)   # -2 + 6*s  (replaced s with 2*s-1)

b = qbpp.var("b")
h = 2 * b + 1
k = qbpp.binary_to_spin(h)   # 2 + 2*b  (replaced b with (b+1)/2, multiplied by 2)
```

### C++ QUBO++ との比較

<table>
<thead>
<tr><th>C++ QUBO++</th><th>PyQBPP</th></tr>
</thead>
<tbody>
<tr><td><code>qbpp::spin_to_binary(f)</code></td><td><code>qbpp.spin_to_binary(f)</code></td></tr>
<tr><td><code>f.spin_to_binary()</code></td><td><code>f.spin_to_binary()</code></td></tr>
<tr><td><code>qbpp::binary_to_spin(f)</code></td><td><code>qbpp.binary_to_spin(f)</code></td></tr>
<tr><td><code>f.binary_to_spin()</code></td><td><code>f.binary_to_spin()</code></td></tr>
</tbody>
</table>

## スライス関数: `v[from:to]`

Pythonのスライス記法で `Array` から部分範囲を抽出します。スライスは新しい `Array` を返します。

- **`v[from:to]`**: 最外次元の `[from, to)` の要素。
- **`v[:n]`**: 先頭 `n` 個。C++ の `head(v, n)` に相当。
- **`v[-n:]`**: 末尾 `n` 個。C++ の `tail(v, n)` に相当。

多次元配列にはタプルインデックスで内側の次元をスライス:

- **`v[:, from:to]`**: 各行をスライス（dim=1）。C++ の `slice(v, from, to, 1)` に相当。
- **`v[:, :, from:to]`**: dim=2 でスライス。任意の深さで動作。

### 例
```python
import pyqbpp as qbpp

x = qbpp.var("x", 3, 5)
print(x[:, :3])     # 各行の先頭3列
print(x[1:3, 2:4])  # 1-2行, 2-3列
```

## 連結関数: `concat()`

`concat()` 関数は配列の連結やスカラーの追加を行います。

- **`qbpp.concat(a, b)`**: 最外次元に沿って2つの配列を連結。
- **`concat(scalar, v)`**: 先頭にスカラーを追加（`Expr` に変換）。
- **`concat(v, scalar)`**: 末尾にスカラーを追加。
- **`concat(scalar, v, dim)`**: `dim=0` でスカラーで埋めた行を追加、`dim=1` で各行の先頭にスカラーを追加。
- **`concat(v, scalar, dim)`**: `dim=0` で行を追加、`dim=1` で各行の末尾に追加。

### 例
```python
import pyqbpp as qbpp

x = qbpp.var("x", 4)
y = qbpp.concat(1, qbpp.concat(x, 0))
# y = [1, x[0], x[1], x[2], x[3], 0]

z = qbpp.var("z", 3, 4)
zg = qbpp.concat(1, qbpp.concat(z, 0, 1), 1)
# 各行: [1, z[i][0], ..., z[i][3], 0]
```

### C++ QUBO++ との比較

<table>
<thead>
<tr><th>C++ QUBO++</th><th>PyQBPP</th></tr>
</thead>
<tbody>
<tr><td><code>qbpp::head(v, n)</code></td><td><code>v[:n]</code></td></tr>
<tr><td><code>qbpp::tail(v, n)</code></td><td><code>v[-n:]</code></td></tr>
<tr><td><code>qbpp::slice(v, from, to)</code></td><td><code>v[from:to]</code></td></tr>
<tr><td><code>qbpp::head(v, n, 1)</code></td><td><code>v[:, :n]</code></td></tr>
<tr><td><code>qbpp::tail(v, n, 1)</code></td><td><code>v[:, -n:]</code></td></tr>
<tr><td><code>qbpp::concat(1, v)</code></td><td><code>qbpp.concat(1, v)</code></td></tr>
<tr><td><code>qbpp::concat(1, v, 0)</code></td><td><code>qbpp.concat(1, v, 0)</code></td></tr>
<tr><td><code>qbpp::concat(1, v, 1)</code></td><td><code>qbpp.concat(1, v, 1)</code></td></tr>
</tbody>
</table>

## Term メンバ関数

以下の `pyqbpp.Term` のメンバ関数は、項の内部構造への読み取り専用アクセスを提供します。

| 式 | 戻り値の型 | 説明 |
|------------|-------------|-------------|
| `t.coeff()` | `int` | 係数を返す |
| `t.degree()` | `int` | 次数（変数の数）を返す |
| `t.var(i)` | `Var` | `i` 番目の変数を返す |
| `t.has(v)` | `bool` | `Var` `v` が項に含まれていれば `True` を返す |

### 例
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
t = 3 * x * y

t.coeff()    # 3
t.degree()   # 2
t.var(0)     # x
t.var(1)     # y
t.has(x)     # True
t.has(z)     # False
```

## Expr メンバ関数

以下の `pyqbpp.Expr` のメンバ関数は、式の内部構造への読み取り専用アクセスを提供します。

| 式 | 戻り値の型 | 説明 |
|------------|-------------|-------------|
| `f.constant()` | `int` | 定数項を返す |
| `f.term_count()` | `int` | 項の数を返す（定数項を除く） |
| `f.term_count(d)` | `int` | 次数 `d` の項の数を返す |
| `f.term(i)` | `Term` | `i` 番目の項のコピーを返す |
| `f.max_degree()` | `int` | すべての項の最大次数を返す |
| `f.has(v)` | `bool` | `Var` `v` が式に含まれていれば `True` を返す |

### 例
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = qbpp.simplify(3 * x + 2 * x * y + 5)
# f = 5 + 3*x + 2*x*y

f.constant()          # 5
f.term_count()        # 2
f.term(0)             # 3*x
f.term(1)             # 2*x*y
f.term(1).coeff()     # 2
f.term(1).var(0)      # x
f.term(1).var(1)      # y
f.max_degree()        # 2
f.has(x)              # True
f.has(y)              # True
```