---
layout: default
nav_exclude: true
title: "Expression Classes"
nav_order: 15
lang: ja
hreflang_alt: "en/python/EXPRESSION"
hreflang_lang: "en"
---

# 式クラス
PyQBPPの最も重要な機能は、組合せ最適化問題を解くための式を作成する能力です。この目的のために以下の3つのクラスが使用されます。

| クラス | 内容 | 詳細 |
|------|-----|-----|
| `pyqbpp.Var` | 変数 | 32ビットIDと表示用文字列 |
| `pyqbpp.Term` | 積の項 | 0個以上の変数と整数係数 |
| `pyqbpp.Expr` | 式 | 0個以上の項と整数定数項 |

さらに、PyQBPP は `Expr` を基盤として構築された以下の2つの関連クラスを提供します:

| クラス | 内容 | 詳細 |
|------|-----|-----|
| `pyqbpp.VarInt` | 整数変数 | バイナリ変数でエンコードされた有界整数変数 |
| `pyqbpp.ExprExpr` | 制約式 | 比較制約や範囲演算子が生成する (penalty, body) のペア |

どちらも算術文脈では `Expr` として扱われるため、多くの場合はそのまま式として使えます。

C++版 (QUBO++) とは異なり、PyQBPP では**多くの場合これらのクラスの違いを意識する必要はありません**。Python の動的型付けが必要に応じて自動的に型変換を行います（例: `2 * x * y` は `Term` を生成、`+=` で `Expr` に昇格）。ただし、内部的にどのクラスが使われているかを理解しておくと、エラーメッセージの解釈や高速化のヒントになります。

## `pyqbpp.Var` クラス
このクラスのインスタンスは**変数をシンボリックに**表現します。多くの場合、2値変数を表現するために使用されます。ただし、このクラスは特定の変数属性に関連付けられておらず、そのインスタンスは任意の型の変数をシンボリックに表現するために使用できます。

各 `Var` インスタンスは単純に以下で構成されます。
- **一意の32ビットID**
- **表示用の文字列**

例えば、以下のプログラムは変数 **`x`** を作成します。自動生成されたIDが割り当てられ、表示には文字列 `"x"` が使用されます。
```python
import pyqbpp as qbpp

x = qbpp.var("x")
print(x)
```
これは単に `x` と出力します。変数シンボルと同じ文字列を使用することが推奨されますが、異なる表示文字列を使用することもできます。
```python
x = qbpp.var("symbol_x")
print(x)
```
これは `symbol_x` と出力します。

## `pyqbpp.Term` クラス
このクラスのインスタンスは以下を含む**積の項**を表現します。
- **整数係数**
- **0個以上の `Var` オブジェクト**

例えば、以下のプログラムは整数係数 `2` と変数 `x`、`y` を持つ積の項 **`t`** を作成します。
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
t = 2 * x * y
print(t)
```
このプログラムは以下を出力します。
```
2*x*y
```

## `pyqbpp.Expr` クラス
このクラスのインスタンスは以下を含む**式**を表現します。
- **整数定数項**
- **0個以上の `Term` オブジェクト**

例えば、以下のプログラムは定数項 `3` と項 `2*x*y` および `3*x` を持つ式 **`f`** を作成します。
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = 3 + 2 * x * y + 3 * x
print(f)
```
このプログラムは以下を出力します。
```
3 +2*x*y +3*x
```

式は **`+`**, **`-`**, **`*`** などの基本演算子と、括弧 **`(`** および **`)`** を使って記述できます。

式は自動的に展開され、`Expr` オブジェクトとして格納されます。例えば、以下のプログラムは展開された形を格納する式 **`f`** を作成します。
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = (x + y - 2) * (x - 2 * y + 3)
print(f)
```
このプログラムは以下を出力します。
```
-6 +x*x +y*x -2*x*y -2*y*y +3*x +3*y -2*x +4*y
```
これらの数学的操作は式を展開するだけであることに注意してください。式を簡約化するには、以下に示すように明示的に簡約化関数を呼び出す必要があります。
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = (x + y - 2) * (x - 2 * y + 3)
f.simplify()
print(f)
```
このプログラムは以下を出力します。
```
-6 +x +7*y +x*x -x*y -2*y*y
```
利用可能な簡約化関数と演算子の詳細については、[基本演算子と関数](OPERATOR)を参照してください。

## 式に関する重要な注意事項
`Term` クラスは `Expr` よりも単純なデータ構造を持つため、メモリ使用量が少なく、操作のオーバーヘッドも低くなります。ただし、`Term` オブジェクトは完全な式（複数項の和）を格納できません。

Python では型変換が自動的に行われるため、以下のコードは C++版と異なりエラーになりません — `t += 3 * x` の時点で `t` が `Term` から `Expr` に再束縛されます：
```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
t = 2 * x * y          # Term
t += 3 * x             # Expr に rebind（t は Term ではなくなる）
print(t)
```
このプログラムは以下を出力します：
```
2*x*y +3*x
```

C++ 版とは異なり、Python では `Expr` を明示的に構築する必要はありません — 算術演算子が必要に応じて `int` / `Var` / `Term` を自動的に `Expr` に昇格させます。例えば、以下のプログラムは素の `int` から始めて式をインクリメンタルに構築します。
```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=4)
f = -1
for i in range(len(x)):
    f += x[i]
print(f)
```
このプログラムは以下を出力します。
```
-1 +x[0] +x[1] +x[2] +x[3]
```

## `pyqbpp.VarInt` クラス
このクラスのインスタンスは**整数変数**を表現し、指定された整数範囲の値をとります。内部的には複数のバイナリ変数でエンコードされています。`VarInt` は `qbpp.var()` に `between=` 引数を渡して作成します:
```python
import pyqbpp as qbpp

x = qbpp.var("x", between=(0, 10))   # [0, 10] の範囲の整数変数
print(x)
```
基礎となる線形式（2のべき乗で重み付けされたバイナリ変数とオフセット）が出力されます:
```
x[0] +2*x[1] +4*x[2] +3*x[3]
```

`VarInt` は算術文脈で **`Expr` として扱われる**ため、式が期待される場所でそのまま使用できます:
```python
y = qbpp.var("y", between=(0, 10))
f = qbpp.sqr(x + y - 7)              # x + y - 7 は Expr に昇格
```
埋め込みの式に加えて、`VarInt` は `name`、`min_val`、`max_val`、および基礎となるバイナリ変数のメタデータを保持します。詳細と使用例は [整数変数](INTEGER) を参照してください。

## `pyqbpp.ExprExpr` クラス
このクラスのインスタンスは、式に比較制約や範囲演算子を適用した結果として得られる**制約式**を表現します。`ExprExpr` は2つの部分を保持します:
- **`penalty`**: 制約が満たされるとき 0 となり、そうでないとき正の値をとる `Expr`
- **`body`**: 元の式（解における実際の値を確認する際に便利）

通常は `qbpp.constrain()` で構築します:
```python
import pyqbpp as qbpp

x = qbpp.var("x", between=(0, 10))
c1 = qbpp.constrain(x, equal=3)              # penalty = (x - 3)^2
c2 = qbpp.constrain(x, between=(2, 5))       # penalty = 0 (2 <= x <= 5 のとき)
```

`VarInt` と同様、`ExprExpr` は算術文脈で **`Expr` (penalty 部分) として扱われ**ます:
```python
f = c1 + c2 + qbpp.sqr(x - 4)        # ExprExpr と Expr を自由に組み合わせられる
f.simplify_as_binary()
```
評価前の式にアクセスするには `c.body` を使います（例えば解を得たあとに `sol(c.body)` で実値を確認）。詳細と対応する比較構文の一覧は [比較制約](COMPARISON) を参照してください。
