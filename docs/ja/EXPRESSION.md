---
layout: default
nav_exclude: true
title: "Expression Classes"
nav_order: 15
lang: ja
hreflang_alt: "en/EXPRESSION"
hreflang_lang: "en"
---

# 式クラス
QUBO++の最も重要な機能は、組合せ最適化問題を解くための式を作成する能力です。
この目的のために以下の3つのクラスが使用されます。

| クラス | 内容 | 詳細 |
|------|-----|-----|
| `qbpp::Var` | 変数 | 32ビットIDと表示用文字列 |
| `qbpp::Term` | 積の項 | 0個以上の変数と整数係数 |
| `qbpp::Expr` | 式 | 0個以上の項と整数定数項 |

さらに、QUBO++ は `qbpp::Expr` を基盤として構築された以下の2つの関連クラスを提供します:

| クラス | 内容 | 詳細 |
|------|-----|-----|
| `qbpp::VarInt` | 整数変数 | バイナリ変数でエンコードされた有界整数変数 |
| `qbpp::ExprExpr` | 制約式 | 比較演算子や範囲演算子が生成する (penalty, body) のペア |

どちらも算術文脈では `qbpp::Expr` に暗黙変換されるため、通常の式と自由に組み合わせて使えます。

## `qbpp::Var` クラス
このクラスのインスタンスは **変数をシンボリックに** 表現します。
多くの場合、2値変数を表現するために使用されます。
ただし、このクラスは特定の変数属性に関連付けられておらず、そのインスタンスは任意の型の変数をシンボリックに表現するために使用できます。

各 qbpp::Var インスタンスは単純に以下で構成されます。
- **一意の32ビットID**
- **表示用の文字列**

例えば、以下のプログラムは `qbpp::Var` オブジェクト **`x`** を作成します。自動生成されたIDが割り当てられ、表示には文字列 `"x"` が使用されます。
```cpp
  auto x = qbpp::var("x");
  std::cout << x << std::endl;
```
これは単に `x` と出力します。
変数シンボルと同じ文字列を使用することが推奨されますが、異なる表示文字列を使用することもできます。
```cpp
  auto x = qbpp::var("symbol_x");
  std::cout << x << std::endl;
```
これは `symbol_x` と出力します。

## `qbpp::Term` クラス
このクラスのインスタンスは以下を含む **積の項** を表現します。
- **整数係数**
- **0個以上の `qbpp::Var` オブジェクト**

例えば、以下のプログラムは整数係数 `2` と変数 `x`、`y` を持つ `qbpp::Term` オブジェクト **`t`** を作成します。
```cpp
  auto x = qbpp::var("x");
  auto y = qbpp::var("y");
  auto t = 2 * x * y;
  std::cout << t << std::endl;
```
このプログラムは以下を出力します。
```
2*x*y`
```

## `qbpp::Expr` クラス
このクラスのインスタンスは以下を含む **式** を表現します。
- **整数定数項**
- **0個以上の `qbpp::Term` オブジェクト**

例えば、以下のプログラムは定数項 `3` と項 `2*x*y` および `3*x` を持つ **`qbpp::Expr`** オブジェクト **`f`** を作成します。
```cpp
  auto x = qbpp::var("x");
  auto y = qbpp::var("y");
  auto f = 3 + 2 * x * y + 3 * x;
  std::cout << f << std::endl;
```
このプログラムは以下を出力します。
```
3 +2*x*y +3*x
```

式は **`+`**、**`-`**、**`*`** などの基本演算子と、括弧 **`(`** および **`)`** を使って記述できます。

式は自動的に展開され、`qbpp::Expr` オブジェクトとして格納されます。
例えば、以下のプログラムは展開された式を格納する **`qbpp::Expr`** オブジェクト **`f`** を作成します。
```cpp
  auto x = qbpp::var("x");
  auto y = qbpp::var("y");
  auto f = (x + y - 2) * (x - 2 * y + 3);
  std::cout << f << std::endl;
```
このプログラムは以下を出力します。
```
-6 +x*x +y*x -2*x*y -2*y*y +3*x +3*y -2*x +4*y
```
これらの数学的操作は式を展開するだけであることに注意してください。
式を簡約化するには、以下に示すように明示的に簡約化関数を呼び出す必要があります。
```cpp
  auto x = qbpp::var("x");
  auto y = qbpp::var("y");
  auto f = (x + y - 2) * (x - 2 * y + 3);
  f.simplify();
  std::cout << f << std::endl;
```
このプログラムは以下を出力します。
```
-6 +x +7*y +x*x -x*y -2*y*y
```
利用可能な簡約化関数と演算子の詳細については、[基本演算子と関数](OPERATOR)を参照してください。

## 式に関する重要な注意事項
`qbpp::Term` クラスは `qbpp::Expr` よりも単純なデータ構造を持つため、メモリ使用量が少なく、操作のオーバーヘッドも低くなります。
ただし、`qbpp::Term` オブジェクトは完全な式を格納できません。

例えば、以下のQUBO++プログラムは `t` が `qbpp::Term` オブジェクトであるため、コンパイルエラーになります。
```cpp
  auto x = qbpp::var("x");
  auto y = qbpp::var("y");
  auto t = 2 * x * y;
  t += 3 * x;
  std::cout << t << std::endl;
```
式を格納・操作するには、以下に示すように **`qbpp::toExpr()`** 関数を使用して明示的に `qbpp::Expr` オブジェクトを作成する必要があります。
```cpp
  auto x = qbpp::var("x");
  auto y = qbpp::var("y");
  auto t = qbpp::toExpr(2 * x * y);
  t += 3 * x;
  std::cout << t << std::endl;
```
このプログラムは `qbpp::Expr` オブジェクト **`t`** を作成し、以下を出力します。
```cpp
2*x*y +3*x
```

オブジェクトが式を格納することを意図している場合、`qbpp::toExpr()` 関数を使用して整数、変数、または項から構築することが推奨されます。
```cpp
  auto x = qbpp::var("x");
  auto f = qbpp::toExpr(0);
  auto g = qbpp::toExpr(x);
  auto h = qbpp::toExpr(3 * x);
  std::cout << "f = " << f << std::endl;
  std::cout << "g = " << g << std::endl;
  std::cout << "h = " << h << std::endl;
```
このプログラムでは、`f`、`g`、`h` はすべて `qbpp::Expr` オブジェクトとして作成されます。
`qbpp::toExpr()` を使用しない場合、それぞれ `int`、`qbpp::Var`、`qbpp::Term` 型になります。

例えば、以下のプログラムは `qbpp::Expr` オブジェクト **`f`** を使用して式をインクリメンタルに構築します。
```cpp
  auto x = qbpp::var("x", 4);
  auto f = qbpp::toExpr(-1);
  for (size_t i = 0; i < x.size(); ++i) {
    f += x[i];
  }
  std::cout << f << std::endl;
```
このプログラムは以下を出力します。
```
-1 +x[0] +x[1] +x[2] +x[3]
```

ただし、`qbpp::toExpr()` を使用しない場合、`f` は `int` 変数となり、`+=` 演算子を適用する際にコンパイルエラーが発生します。

## `qbpp::VarInt` クラス
このクラスのインスタンスは**整数変数**を表現し、指定された整数範囲の値をとります。内部的には複数のバイナリ `qbpp::Var` でエンコードされています。
`VarInt` は範囲チェーン構文で作成します:
```cpp
auto x = 0 <= qbpp::var_int("x") <= 10;   // [0, 10] の範囲の整数変数
std::cout << x << std::endl;
```
基礎となる線形式（2のべき乗で重み付けされたバイナリ変数とオフセット）が出力されます:
```
x[0] +2*x[1] +4*x[2] +3*x[3]
```

`VarInt` は算術文脈で **`qbpp::Expr` に暗黙変換** されるため、式が期待される場所でそのまま使用できます:
```cpp
auto y = 0 <= qbpp::var_int("y") <= 10;
auto f = qbpp::sqr(x + y - 7);            // x + y - 7 は Expr に decay
```
埋め込みの式に加えて、`VarInt` は `name()`、`min_val()`、`max_val()`、および基礎となるバイナリ `Var` のメタデータを保持します。詳細と使用例は [整数変数](INTEGER) を参照してください。

## `qbpp::ExprExpr` クラス
このクラスのインスタンスは、式に比較演算子や範囲演算子を適用した結果として得られる**制約式**を表現します。`ExprExpr` は2つの部分を保持します:
- **penalty**: 制約が満たされるとき 0 となり、そうでないとき正の値をとる `Expr`
- **body**: 元の式（`*ee` で取得、解における実際の値を確認する際に便利）

典型的な構築方法:
```cpp
auto x = 0 <= qbpp::var_int("x") <= 10;
auto c1 = (x == 3);                    // penalty = sqr(x - 3), body = x
auto c2 = (2 <= x <= 5);               // penalty = 0 (2 <= x <= 5 のとき), body = x
```

`VarInt` と同様、`ExprExpr` は算術文脈で **`qbpp::Expr` (penalty 部分) に暗黙変換** されます:
```cpp
auto f = c1 + c2 + qbpp::sqr(x - 4);   // ExprExpr と Expr を自由に組み合わせられる
f.simplify_as_binary();
```
評価前の body にアクセスするには `*ee` を使います（例えば `sol(*ee)` で解における body の値を取得）。詳細と対応する比較構文の一覧は [比較演算子](COMPARISON) を参照してください。
