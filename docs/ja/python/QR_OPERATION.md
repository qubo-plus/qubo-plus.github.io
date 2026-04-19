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
以下の表は、式（`pyqbpp.Expr`）を対象とする演算子と関数をまとめたものです。
ここで「式」は [VAREXPR](VAREXPR) で説明した3つの概念（整数・変数・式）で構成される多項式を指します。
引数の型の `式` 列は、整数・変数・式のいずれでも受け付けられることを意味します。

## グローバル関数と In-place メソッドの規則
式に対する処理は、原則として次の2形式を対で提供します:

- **グローバル関数** `qbpp.func(f, ...)` — **非破壊**。`f` を変更せず、新しい結果オブジェクトを返します。
- **In-place メンバ** `f.func(...)` — `f` を**処理結果で上書き**し、`self` を返します（メソッドチェーンできます）。

「f をそのまま使い続けたい」ときはグローバル、「f を処理後の値に置き換えたい」ときはメンバを使います。
戻り値の型がグローバル側と異なる関数でも、メンバ版は「結果を self に書き戻す」設計に統一されています。
例: `qbpp.gcd(f)` は整数を返しますが、`f.gcd()` は `f` 自身を「その gcd の値を持つ定数式」に上書きします。

## 演算子・関数一覧

| 演算子/関数             | 構文                                              | 種別      | 戻り値の型       | 引数の型                |
|------------------------|---------------------------------------------------|----------|-----------------|------------------------|
| コピー                  | `qbpp.copy(f)`                                    | Global   | 式              | 整数・変数・式          |
| 二項演算子              | `f + g`, `f - g`, `f * g`                         | Global   | 式              | 式 ⊕ 式                |
| 複合代入                | `f += g`, `f -= g`, `f *= g`                      | In-place | 式              | 式                     |
| 除算                   | `f / n`                                           | Global   | 式              | 式, 整数               |
| 複合除算                | `f /= n`                                          | In-place | 式              | 整数                   |
| 単項演算子              | `+f`, `-f`                                        | Global   | 式              | 式                     |
| 等価制約                | `qbpp.constrain(f, equal=n)`                      | Global   | `ExprExpr`      | 式, 整数               |
| 範囲制約                | `qbpp.constrain(f, between=(l, u))`               | Global   | `ExprExpr`      | 式, 整数, 整数         |
| 二乗                   | `qbpp.sqr(f)`                                     | Global   | 式              | 式                     |
| 二乗                   | `f.sqr()`                                         | In-place | 式              | —                      |
| 最大公約数              | `qbpp.gcd(f)`                                     | Global   | 整数            | 式                     |
| 最大公約数              | `f.gcd()`                                         | In-place | 式（定数で上書き） | —                    |
| 簡約化                 | `qbpp.simplify(f)`                                | Global   | 式              | 式                     |
| 簡約化                 | `f.simplify()`                                    | In-place | 式              | —                      |
| バイナリ簡約化          | `qbpp.simplify_as_binary(f)`                      | Global   | 式              | 式                     |
| バイナリ簡約化          | `f.simplify_as_binary()`                          | In-place | 式              | —                      |
| スピン簡約化            | `qbpp.simplify_as_spin(f)`                        | Global   | 式              | 式                     |
| スピン簡約化            | `f.simplify_as_spin()`                            | In-place | 式              | —                      |
| 評価                   | `f(ml)`                                           | Global   | 整数            | 式, dict               |
| 置換                   | `qbpp.replace(f, ml)`                             | Global   | 式              | 式, dict               |
| 置換                   | `f.replace(ml)`                                   | In-place | 式              | dict                   |
| スピン → バイナリ変換    | `qbpp.spin_to_binary(f)`                          | Global   | 式              | 式                     |
| スピン → バイナリ変換    | `f.spin_to_binary()`                              | In-place | 式              | —                      |
| バイナリ → スピン変換    | `qbpp.binary_to_spin(f)`                          | Global   | 式              | 式                     |
| バイナリ → スピン変換    | `f.binary_to_spin()`                              | In-place | 式              | —                      |
| スライス                | `v[from:to]`, `v[:, from:to]`                     | Global   | array         | array                |
| 連結                   | `qbpp.concat([a, b, ...], axis=0)`                | Global   | array         | array/スカラーのリスト |

## 代入: `g = f` と `g = qbpp.copy(f)`
Python の `=` は**名前の束縛**であって値のコピーではありません。
つまり `g = f` は「新しい名前 `g` を `f` が指すのと同じオブジェクトに結びつける」だけで、
`f` と `g` は**同一の式オブジェクト**を共有します。
一方、`g = qbpp.copy(f)` は `f` と独立した新しい式を作ります。
この違いは、その後で **in-place な操作（複合代入や in-place メンバ）** を行ったときに顕在化します。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")

# --- g = f: 参照共有 ---
f = 2 * x + 3 * y
g = f                    # g と f は同じオブジェクト (g is f → True)
g += 100
print(f)                 # 100 +2*x +3*y  ← f も変わってしまう
print(g)                 # 100 +2*x +3*y

# --- g = qbpp.copy(f): 独立コピー ---
f = 2 * x + 3 * y
g = qbpp.copy(f)         # g は f の内容を持つ別オブジェクト (g is f → False)
g += 100
print(f)                 # 2*x +3*y       ← f は不変
print(g)                 # 100 +2*x +3*y
```

> **注釈**
> 右辺が `f + 1`, `2 * f`, `-f` などの**二項・単項演算**の場合は、
> 演算子がそのたびに新しい式を返すので、結果は自動的に `f` と独立したオブジェクトになります。
> 注意が必要なのは「`g = f` の後に `g` を in-place で書き換える」パターンだけです。
> 独立したコピーが欲しいときは **`qbpp.copy(f)`** を使ってください。

> **注釈**
> 右辺が **in-place メンバ呼び出しだけ** の場合にも同じ罠があります。
> In-place メンバは「`f` 自身を処理結果で上書きして `self` を返す」ので、
> `g = f.sqr()` は「新しい式を `g` に代入」ではなく「`f` を2乗して書き換え、その `f` を `g` にも別名として付ける」結果になります。
> 典型的には次の3通りで結果が異なります:
>
> | 書き方 | 効果 |
> |---|---|
> | `g = f.sqr()`          | `f` がその場で2乗され、`g` は `f` と同じオブジェクトを指す（`g is f` → True）|
> | `g = qbpp.sqr(f)`      | グローバル形（非破壊）。`f` は不変、`g` は独立した新しい式 |
> | `g = qbpp.copy(f.sqr())` | `f` は2乗された後、その独立コピーが `g` に入る（`f` 側の書き換えは残る）|
>
> 「`f` を保ったまま2乗結果を得たい」ときは **グローバル形 `qbpp.sqr(f)`** を使うのが最も自然です。
> 他の in-place メンバ（`simplify_as_binary`, `replace`, `spin_to_binary` など）にも同じルールが当てはまります。

> **注釈**
> `qbpp.copy()` は整数・変数に対しても安全に呼び出せます。
> これらは**イミュータブル**なので共有されても書き換えで影響を受けず、
> `copy()` は元のオブジェクトをそのまま返します。
> したがって型を気にせず `copy()` を使えます。

## 二項演算子: `+`, `-`, `*`
`+`, `-`, `*` は整数・変数・式を自由に組み合わせて受け付け、結果の式を返します。
オペランドの種類を意識せずに `2 * x * y - x + 1` のように自然に書けます。

## 複合代入演算子: `+=`, `-=`, `*=`
左辺は式でなければなりません。右辺には整数・変数・式のいずれも渡せ、
指定された演算が適用されて左辺の式がその場で更新されます。

## 除算 `/` と複合除算 `/=`
除算演算子 `/` は **被除数** として式を、**除数** として整数を取り、**商** を新しい式として返します。

被除数の式は除数で割り切れなければなりません。すなわち、
式の整数定数項とすべての整数係数が除数で割り切れる必要があります。

複合除算演算子 `/=` は式をその場で除算します。

### 例
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = 6 * x + 4 * y + 2
g = f / 2          # g = 3*x + 2*y + 1 (新しい Expr)
f /= 2             # f = 3*x + 2*y + 1 (in-place)
```

## 等価・範囲制約: `constrain()`
`constrain()` 関数は、式 `f` に対する制約をペナルティ式として表現します。
等価制約と範囲制約の両方を統一的に記述できます。

```python
g = qbpp.constrain(f, equal=n)           # f == n のペナルティ式
g = qbpp.constrain(f, between=(l, u))    # l <= f <= u のペナルティ式
g = qbpp.constrain(f, between=(l, None)) # l <= f のペナルティ式（上限なし）
g = qbpp.constrain(f, between=(None, u)) # f <= u のペナルティ式（下限なし）
```

ここで `f` は式、`n` / `l` / `u` は整数です。
いずれの形式も、制約が満たされたときに最小値 0 となる式を返します。

- **`equal=n`**: `sqr(f - n)` を返します。
- **`between=(l, u)`**: 範囲 `[l, u-1]` の値を取る単位間隔の補助整数変数 `a` が暗黙的に導入され、関数は `(f - a) * (f - (a + 1))` を返します。
- **`between=(l, None)`** / **`between=(None, u)`**: `l` / `u` の一方のみを制約する半開区間です。

### `pyqbpp.ExprExpr` クラス
`constrain()` が返すオブジェクト `g` は **`pyqbpp.ExprExpr`** 型で、`pyqbpp.Expr` の派生クラスです。

- **`g`** はペナルティ式そのもの（C++ の `*g` に対応）を表し、通常の式として評価・簡約化・ソルバー入力に使えます。
- **`g.body`** は制約を作る前の元の式 `f` を返します。

## 二乗関数: `sqr()`
式 `f` に対して:
- **`pyqbpp.sqr(f)`** (グローバル関数): `f * f` を計算して返します。
引数 `f` は整数・変数・式のいずれでも構いません。

配列 `v` に対して:
- **`pyqbpp.sqr(v)`**: 各要素を二乗した新しい配列を返します。

### 例
```python
import pyqbpp as qbpp

x = qbpp.var("x")
f = qbpp.sqr(x)       # x * x
```

## 最大公約数関数: `gcd()`
式 `f` のすべての整数係数と整数定数項の最大公約数（GCD）を計算します。
グローバル形と in-place 形の2種類があります。

- **`qbpp.gcd(f)`** (グローバル、非破壊):
  `f` を変更せず、GCD を**整数値**として返します。
- **`f.gcd()`** (メンバ、in-place):
  `f` 自身を「その GCD の値を持つ定数式」に**上書き**します（返り値は `self`）。

式を GCD で約分したい場合は、グローバル形と複合除算を組み合わせて `f /= qbpp.gcd(f)` と書きます。

### 例
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = 6 * x + 4 * y + 2

# グローバル: 値だけを取得、f は変更されない
print(qbpp.gcd(f))     # 2
print(f)               # 2 +6*x +4*y

# 約分: f を更新したい場合は /= と組み合わせる
g = qbpp.copy(f)
g /= qbpp.gcd(g)       # g = 1 +3*x +2*y
print(g)

# In-place: f を GCD の定数式で上書き
h = qbpp.copy(f)
h.gcd()                # h = 2 (定数式)
print(h)
```

## 簡約化関数: `simplify()`, `simplify_as_binary()`, `simplify_as_spin()`
式 `f` に対して、メンバ関数 **`f.simplify()`** は以下の操作をその場で行います。
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
f = x * x + x
f.simplify_as_binary()  # 2*x (since x^2 = x)

g = x * x + x
g.simplify_as_spin()    # 1 + x (since x^2 = 1)
```

## 評価関数: `f(ml)`
評価関数は `{変数: 値}` の辞書を受け取ります。各エントリは変数から整数値へのマッピングを定義します。

式 `f` と辞書 `ml` に対して、評価関数 `f(ml)` は `ml` で指定された変数の割り当ての下で `f` の値を評価し、結果の整数値を返します。

`f` に出現するすべての変数は、`ml` に対応するマッピングが定義されていなければなりません。

### 例
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = 3 * x + 2 * y + 1

print(f({x: 1, y: 0}))  # 4  (= 3*1 + 2*0 + 1)
```

## 置換関数: `replace()`
`replace()` 関数は `{変数: 式}` の辞書を受け取ります。値側には整数も指定できます。

式 `f` と辞書 `ml` に対して:
- **`pyqbpp.replace(f, ml)`** (グローバル関数):
`f` を変更せずに、`ml` のマッピングに従って `f` の変数を置換した新しい式を返します。
- **`f.replace(ml)`** (メンバ関数):
`ml` のマッピングに従って `f` の変数をその場で置換し、結果の式を返します。

### 辞書の作成
```python
import pyqbpp as qbpp

ml = {x: 0, y: 1}                    # {変数: 式} の辞書
ml = {x: 0, y: z}                    # 値には変数も指定可能
```

### 例
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = 2 * x + 3 * y + 1

ml = {x: 1, y: 0}
g = qbpp.replace(f, ml)   # g = 2*1 + 3*0 + 1 = 3 (new Expr)
f.replace(ml)         # f is modified in place
```

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
k = qbpp.binary_to_spin(h)   # 4 + 2*b  (replaced b with (b+1)/2, multiplied by 2)
```

## スライス関数: `v[from:to]`

Pythonのスライス記法で array から部分範囲を抽出します。スライスは新しい array を返します。

- **`v[from:to]`**: 最外次元の `[from, to)` の要素。
- **`v[:n]`**: 先頭 `n` 個。C++ の `head(v, n)` に相当。
- **`v[-n:]`**: 末尾 `n` 個。C++ の `tail(v, n)` に相当。

多次元配列にはタプルインデックスで内側の次元をスライス:

- **`v[:, from:to]`**: 各行をスライス（dim=1）。C++ の `slice(v, from, to, 1)` に相当。
- **`v[:, :, from:to]`**: dim=2 でスライス。任意の深さで動作。

### 例
```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(3, 5))
print(x[:, :3])     # 各行の先頭3列
print(x[1:3, 2:4])  # 1-2行, 2-3列
```

## 連結関数: `concat()`

`concat()` 関数は配列とスカラーのリストを指定した軸で連結します。

- **`qbpp.concat([a, b, c, ...], axis=0)`**: 軸 `axis` に沿ってリスト内の各要素を連結。
- リスト要素は array とスカラー（整数・変数・式）の混在が可能。スカラーは他の配列の形状に合わせて軸方向にブロードキャストされます。
- 要素型の異なる array 同士を連結する場合は自動的に式の array に昇格されます。

### 例
```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=4)
y = qbpp.concat([1, x, 0])
# y = [1, x[0], x[1], x[2], x[3], 0]

z = qbpp.var("z", shape=(3, 4))
zg = qbpp.concat([1, z, 0], axis=1)
# 各行: [1, z[i][0], ..., z[i][3], 0]
```

## 式のメンバ

以下のメンバは式 `f` の内部構造に読み取り専用でアクセスします。

| 式 | 戻り値の型 | 説明 |
|------------|-------------|-------------|
| `f.constant` | 整数 | 定数項を返す（プロパティ） |
| `f.max_degree` | 整数 | すべての項の最大次数を返す（プロパティ） |
| `f.term_count()` | 整数 | 項の数を返す（定数項を除く） |
| `f.term_count(d)` | 整数 | 次数 `d` の項の数を返す |
| `f.term(i)` | 単項の式 | `i` 番目の項を1項だけからなる式として返す |
| `f.has(v)` | `bool` | 変数 `v` が式 `f` に含まれていれば `True` を返す |

`f.term(i)` が返す「単項の式」 `t` には、さらに以下のアクセッサがあります:

| 式 | 戻り値の型 | 説明 |
|------------|-------------|-------------|
| `t.coeff` | 整数 | 係数を返す（プロパティ） |
| `t.degree` | 整数 | その項の次数（変数の数）を返す（プロパティ） |
| `t.var(i)` | `Var` | その項の `i` 番目の変数を返す |
| `t.has(v)` | `bool` | 変数 `v` がその項に含まれていれば `True` を返す |

### 例
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = qbpp.simplify(3 * x + 2 * x * y + 5)
# f = 5 + 3*x + 2*x*y

f.constant            # 5
f.term_count()        # 2
f.max_degree          # 2
f.has(x)              # True
f.has(y)              # True

t = f.term(1)         # 2*x*y (単項の式)
t.coeff               # 2
t.degree              # 2
t.var(0)              # x
t.var(1)              # y
t.has(x)              # True
```
