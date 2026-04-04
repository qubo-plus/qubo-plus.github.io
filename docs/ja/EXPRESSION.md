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
