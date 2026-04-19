---
layout: default
nav_exclude: true
title: "Operators and Functions"
nav_order: 11
lang: ja
hreflang_alt: "en/OPERATOR"
hreflang_lang: "en"
---

# 基本演算子と関数

## 単項演算子と二項演算子
QUBO++は、式（すなわち`qbpp::Expr`オブジェクト）を構築するための以下の基本的な二項演算子をサポートしています:
- **`+`**: オペランドの和を返します。
- **`-`**: オペランドの差を返します。
- **`*`**: オペランドの積を返します。
- **`/`**: オペランドの商を返します。
除数は整数でなければならず、被除数の定数項とすべての係数は除数で割り切れる必要があります。
- 単項**`-`**: オペランドの符号を反転した値を返します。

これらの演算子の優先順位は、標準的なC++の演算子優先順位規則に従います。

以下のプログラムは、これらの演算子を使用して式を構築する方法を示しています:
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto y = qbpp::var("y");
  auto f = 6 * -(x + 1) * (y - 1);
  auto g = f / 3;

  std::cout << "f = " << f << std::endl;
  std::cout << "g = " << g << std::endl;
}

```
このプログラムの出力は次のとおりです:
```
f = 6 -6*x*y +6*x -6*y
g = 2 -2*x*y +2*x -2*y
```

## 複合演算子
qbpp::Exprオブジェクトを更新するための以下の複合演算子もサポートされています。
- **`+=`** : 右辺のオペランドを左辺に加算します。
- **`-=`** : 右辺のオペランドを左辺から減算します。
- **`*=`** : 右辺のオペランドを左辺に乗算します。
- **`/=`** : 左辺のオペランドを右辺で除算します。右辺のオペランドは整数でなければならず、左辺の定数項の整数値とすべての係数は割り切れる必要があります。

以下のプログラムは、これらの複合演算子を使用して式を構築する方法を示しています:
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto y = qbpp::var("y");
  auto f = 6 * x + 4;

  f += 3 * y;
  std::cout << "f = " << f << std::endl;

  f -= 12;
  std::cout << "f = " << f << std::endl;

  f *= 2 * y;
  std::cout << "f = " << f << std::endl;

  f /= 2;
  std::cout << "f = " << f << std::endl;
}
```
このプログラムの出力は次のとおりです:
```
f = 4 +6*x +3*y
f = -8 +6*x +3*y
f = 12*x*y +6*y*y -16*y
f = 6*x*y +3*y*y -8*y
```

## 二乗関数
QUBO++は、式の二乗を計算するためのグローバル関数**`qbpp::sqr()`**と`qbpp::Expr`クラスのメンバ関数**`sqr()`**の両方を提供しています。

以下のプログラムでは、`qbpp::Expr`オブジェクト`f`に対して、グローバル関数**`qbpp::sqr(f)`**は`f`の二乗を表す新しい`qbpp::Expr`オブジェクトを返し、
一方メンバ関数**`f.sqr()`**は`f`をその場でその二乗に置き換えて更新します。

```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto f = x + 1;

  std::cout << "f = " << qbpp::sqr(f) << std::endl;
  std::cout << "f = " << f << std::endl;

  f.sqr();
  std::cout << "f = " << f << std::endl;
}
```
このプログラムの出力は次のとおりです:
```
f = 1 +x*x +x +x
f = 1 +x
f = 1 +x*x +x +x
```

## 簡約化関数
`qbpp::Expr`オブジェクトに演算子や関数が適用された後、式は自動的に展開されます。
項をソートし、結果の式を簡約化するには、簡約化関数を明示的に呼び出す必要があります。

QUBO++は以下の3つの**グローバル簡約化関数**を提供しています:
- **`qbpp::simplify()`**:
同一の項の係数をマージして簡約化された式を返します。
- **`qbpp::simplify_as_binary()`**:
すべての変数がバイナリ値$0/1$を取ることを仮定して簡約化された式を返します。
すなわち、恒等式$x^2=x$が成り立つことを利用して、式を整理します。
- **`qbpp::simplify_as_spin()`**:
すべての変数がスピン値$-1/+1$を取ることを仮定して簡約化された式を返します。
すなわち、恒等式$x^2=1$が成り立つことを利用して、式を整理します。

以下のプログラムは、これらの簡約化関数の動作を示しています:
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto f = qbpp::sqr(x - 1);

  std::cout << "f = " << f << std::endl;
  std::cout << "simplified(f) = " << qbpp::simplify(f) << std::endl;
  std::cout << "simplified_as_binary(f) = " << qbpp::simplify_as_binary(f) << std::endl;
  std::cout << "simplified_as_spin(f) = " << qbpp::simplify_as_spin(f) << std::endl;
}
```
このプログラムの出力は次のとおりです:
```
f = 1 +x*x -x -x
simplified(f) = 1 -2*x +x*x
simplified_as_binary(f) = 1 -x
simplified_as_spin(f) = 2 -2*x
```

これらの簡約化関数の**メンバ関数**版も`qbpp::Expr`オブジェクトに対して提供されており、オブジェクトをその場で簡約化された結果に更新します。

例えば、以下のプログラムは**`simplify()`**を適用して`f`を更新します:
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto f = qbpp::sqr(x - 1);

  f.simplify();
  std::cout << "f = " << f << std::endl;
}
```
このプログラムの出力は次のとおりです:
```
f = 1 -2*x +x*x
```
