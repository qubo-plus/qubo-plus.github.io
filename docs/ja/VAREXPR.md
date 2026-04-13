---
layout: default
nav_exclude: true
title: "Variable and Expression Classes"
nav_order: 10
lang: ja
hreflang_alt: "en/VAREXPR"
hreflang_lang: "en"
---

# 変数クラスと式クラス

## qbpp::Var、qbpp::Term、qbpp::Expr クラス

QUBO++は以下の基本クラスを提供します。
- **`qbpp::Var`**: 変数をシンボリックに表現し、表示用の文字列が関連付けられます。内部的には32ビット符号なし整数が識別子として使用されます。
- **`qbpp::Term`**: 整数係数と1つ以上の `qbpp::Var` オブジェクトからなる積の項を表現します。整数係数のデータ型は `COEFF_TYPE` マクロで定義され、デフォルト値は `int32_t` です。
各 `qbpp::Term` は変数を静的配列（インラインバッファ2要素）と動的確保の組み合わせで格納し、次数に上限なく任意の高次項を扱うことができます。
- **`qbpp::Expr`**: 整数定数項と0個以上の `qbpp::Term` オブジェクトからなる展開された式を表現します。整数定数項のデータ型は `ENERGY_TYPE` マクロで定義され、デフォルト値は `int64_t` です。

以下のプログラムでは、**`x`** と **`y`** は `qbpp::Var` オブジェクト、**`t`** は `qbpp::Term` オブジェクト、**`f`** は `qbpp::Expr` オブジェクトです。
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto y = qbpp::var("y");
  auto t = 2 * x * y;
  auto f = t - x + 1;

  std::cout << "x = " << x << std::endl;
  std::cout << "y = " << y << std::endl;
  std::cout << "t = " << t << std::endl;
  std::cout << "f = " << f << std::endl;
}
```
このプログラムは以下の出力を生成します。
```
x = x
y = y
t = 2*x*y
f = 1 -x +2*x*y
```
データ型を明示的に指定する場合、プログラムは以下のように書き直せます。
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  qbpp::Var x = qbpp::var("x");
  qbpp::Var y = qbpp::var("y");
  qbpp::Term t = 2 * x * y;
  qbpp::Expr f = t - x + 1;

  std::cout << "x = " << x << std::endl;
  std::cout << "y = " << y << std::endl;
  std::cout << "t = " << t << std::endl;
  std::cout << "f = " << f << std::endl;
}
```
`qbpp::Var` オブジェクトは **不変（immutable）** であり、作成後に更新できません。
一方、`qbpp::Term` と `qbpp::Expr` オブジェクトは **可変（mutable）** であり、代入によって更新できます。

例えば、以下のプログラムに示すように、複合代入演算子を使用して `qbpp::Term` と `qbpp::Expr` オブジェクトを更新できます。
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  qbpp::Var x = qbpp::var("x");
  qbpp::Var y = qbpp::var("y");
  qbpp::Term t = 2 * x * y;
  qbpp::Expr f = t - x + 1;

  std::cout << "t = " << t << std::endl;
  std::cout << "f = " << f << std::endl;

  t *= 3 * x;
  f += 2 * y;

  std::cout << "t = " << t << std::endl;
  std::cout << "f = " << f << std::endl;
}
```
このプログラムは以下の出力を生成します。
```
t = 2*x*y
f = 1 -x +2*x*y
t = 6*x*y*x
f = 1 -x +2*x*y +2*y
```
ほとんどの場合、`qbpp::Term` オブジェクトを明示的に使用する必要はありません。
最大限のパフォーマンス最適化が必要な場合にのみ使用すべきです。

ただし、`auto` 型推論により `qbpp::Term` オブジェクトが作成される場合があり、一般的な式を格納できないことに注意してください。
例えば、以下のプログラムは、式が `qbpp::Term` オブジェクトに代入されるため、コンパイルエラーになります。
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto y = qbpp::var("y");

  auto t = 2 * x * y;
  t = x + 1;
}
```
`qbpp::Expr` オブジェクトを意図する場合、以下に示すように **`qbpp::toExpr()`** を使用して明示的に構築できます。
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto y = qbpp::var("y");
  auto t = qbpp::toExpr(2 * x * y);
  auto f = qbpp::toExpr(1);

  t += x + 1;
  f += t;

  std::cout << "t = " << t << std::endl;
  std::cout << "f = " << f << std::endl;
}
```
このプログラムでは、**`t`** と **`f`** の両方が `qbpp::Expr` オブジェクトであり、一般的な式を格納できます。
特に、`f` は値 `1` の定数項のみを持ち、積の項を持たない `qbpp::Expr` オブジェクトとして作成されます。

## 整数の範囲：COEFF_TYPE と ENERGY_TYPE
マクロ **`COEFF_TYPE`** と **`ENERGY_TYPE`** は、式内の係数とエネルギー値に使用されるデータ型を定義します。
`ENERGY_TYPE` マクロは、`qbpp::Expr` オブジェクトの整数定数項のデータ型としても使用されます。
これらには次の型を指定することができます。

| 型 | 範囲 | 大きな定数の構文 |
|----|------|-----------------|
| `int32_t` | ±2.1×10⁹ | `12345`（整数リテラル） |
| `int64_t` | ±9.2×10¹⁸ | `1234567890123456789LL` |
| `qbpp::int128_t` | ±1.7×10³⁸ | `qbpp::int128_t("12345678901234567890")` |
| `qbpp::cpp_int` | 無制限 | `qbpp::cpp_int("...")` |

型 **`qbpp::cpp_int`** は任意桁数の整数を表します。


デフォルトでは `coeff_t` は `int32_t`、`energy_t` は `int64_t` です。
デフォルト以外の型を使用するには、ヘッダのインクルード前に以下のマクロの一つを定義します（またはコンパイラフラグ `-D...` で指定）：

| マクロ | `coeff_t` | `energy_t` |
|---|---|---|
| `INTEGER_TYPE_C32E32` | `int32_t` | `int32_t` |
| （デフォルト） | `int32_t` | `int64_t` |
| `INTEGER_TYPE_C64E64` | `int64_t` | `int64_t` |
| `INTEGER_TYPE_C64E128` | `int64_t` | `int128_t` |
| `INTEGER_TYPE_C128E128` | `int128_t` | `int128_t` |
| `INTEGER_TYPE_CPP_INT` | `cpp_int` | `cpp_int` |

### VarArray モード

`MAXDEG` マクロは、各項の変数の内部格納方式を制御します。
最大次数が事前に分かっている場合、固定長モードを使うとヒープ確保が不要になり性能が向上します：

| マクロ | 最大次数 | 説明 |
|---|---|---|
| `MAXDEG0`（デフォルト） | 無制限 | 可変長（3次以上でヒープ確保） |
| `MAXDEG2` | 2 | 固定長、QUBOのみ（ヒープ確保なし、最速） |
| `MAXDEG4` | 4 | 固定長、4次まで（ヒープ確保なし） |
| `MAXDEG6` | 6 | 固定長、6次まで（ヒープ確保なし） |

使用例 — 型と VarArray モードの両方を指定：
```cpp
#define INTEGER_TYPE_C32E32
#define MAXDEG2
#include <qbpp/qbpp.hpp>
```

指定されたマクロに基づいて適切なライブラリが実行時に自動的にロードされます。

### 文字列コンストラクタ
`qbpp::int128_t` および `qbpp::cpp_int` では、
64ビット整数の範囲を超える定数値を**文字列コンストラクタ**で指定できます。
文字列は実行時に10進数として解析されます。

> **Note**:
> 標準の整数リテラル（例: `12345`）や `LL` サフィックス付きの64ビットリテラルは、
> 暗黙の型変換によりどの型でもそのまま使用できます。
> 文字列コンストラクタが必要になるのは、値が `int64_t` の範囲（±9.2×10¹⁸）を超える場合のみです。

### qbpp::int128_t の例

以下のプログラムは、64ビット範囲を超える係数を持つ `qbpp::Expr` オブジェクトを作成します。
```cpp
#define INTEGER_TYPE_C128E128

#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto y = qbpp::var("y");
  auto f = qbpp::int128_t("12345678901234567890") * x +
           qbpp::int128_t("98765432109876543210") * y;
  std::cout << "f = " << f << std::endl;
}
```
このプログラムは以下の出力を生成します。
```
f = 12345678901234567890*x +98765432109876543210*y
```

### qbpp::cpp_int の例

以下のプログラムは、非常に大きな係数と定数項を持つ `qbpp::Expr` オブジェクトを作成します。
```cpp
#define INTEGER_TYPE_CPP_INT

#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto f = qbpp::cpp_int("123456789012345678901234567890") * x +
           qbpp::cpp_int("987654321098765432109876543210");
  std::cout << "f = " << f << std::endl;
}
```
このプログラムは以下の出力を生成します。
```
f = 987654321098765432109876543210 +123456789012345678901234567890*x
```
