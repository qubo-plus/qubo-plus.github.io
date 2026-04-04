---
layout: default
nav_exclude: true
title: "Reference Variables"
nav_order: 30
alt_lang: "Python version"
alt_lang_url: "python/QR_VARIABLE"
---


<div class="lang-en" markdown="1">
# Quick Reference: Variables and Expressions

## Data types used in `qbpp::Expr`
- **`coeff_t`**:
  The integer data type used for coefficients in `qbpp::Term` objects.
  The default type is `int32_t`.
  To change this type, define the `COEFF_TYPE` macro at compile time, for example:
```
-DCOEFF_TYPE=int16_t
```
- **`energy_t`**:
The integer data type used to compute energy values of `qbpp::Expr` objects,
as well as for integer constant terms in `qbpp::Expr`.
The default type is `int64_t`.
To change this type, define the `ENERGY_TYPE` macro at compile time, for example:
```
-DENERGY_TYPE=int32_t
```
The bit width of `energy_t` is guaranteed to be equal to or larger than that of `coeff_t`.

- **`vindex_t`**:
Defined as `uint32_t` and used to store a unique integer ID for each `qbpp::Var` object.
In most cases, it is not necessary to change this data type.

## Available integer data types
- **Standard integer types**:
`int16_t`, `int32_t`, `int64_t`

- **Multiprecision integer types** (implemented using the Boost.Multiprecision library):
`qbpp::int128_t`, `qbpp::cpp_int`

- **`qbpp::cpp_int`**:
An integer type with unlimited precision.

> **WARNING**
> To maximize performance, QUBO++ does not check for arithmetic overflow.
> During development and testing, it is recommended to use wider bit widths for
> `coeff_t` and `energy_t`.
> If the required bit widths are unclear, use `qbpp::cpp_int` to ensure correctness,
> and switch to fixed-width integer types after validation.

## Printing class objects
Most classes in QUBO++ can be printed using the `<<` operator with `std::ostream`,
which is useful for debugging.
For example, an object `obj` in QUBO++ can be printed to `std::cout` as follows:
```cpp
std::cout << obj << std::endl;
```
This invokes either `obj.str()` or `str(obj)`, which returns a std::string
containing a textual representation of obj.
This design allows easy inspection of internal states without relying on a debugger.


## Variable classes
- **`qbpp::Var`**:
  A class that holds a unique 32-bit integer ID.
  The variable name is stored in a global registry and can be retrieved via `x.str()`.


> **NOTE**
> A `qbpp::Var` object represents a variable symbolically.
> No specific data type is associated with it.
> It can be used to represent binary, spin, or other types of variables.

### Variable creation functions
The following functions are provided to create variables:

- **`qbpp::var("name")`**:
  Creates a `qbpp::Var` object with the given name `"name"`.

- **`qbpp::var("name", s1)`**:
  Creates a one-dimensional array of `qbpp::Var` objects with the base name `"name"`.
  Each element is represented as `name[i]`.
  The resulting type is `qbpp::Array<1, qbpp::Var>`.

- **`qbpp::var("name", s1, s2)`**:
  Creates a two-dimensional array (matrix) of `qbpp::Var` objects with the base name `"name"`.
  Each element is represented as `name[i][j]`.
  The resulting type is `qbpp::Array<2, qbpp::Var>`.

- **`qbpp::var("name", s1, s2, ...)`**:
  Creates a higher-dimensional array of `qbpp::Var` objects with the base name `"name"`.
  Each element is represented as `name[i][j]...`.
  The resulting type is `qbpp::Array<N, qbpp::Var>` where `N` is the number of dimensions.

> **NOTE**
> If `"name"` is omitted, numbered names such as `"{0}"`, `"{1}"`, ... are automatically assigned in creation order.

## `qbpp::Var` member functions
For a `qbpp::Var` instance `x`, the following member functions are available:

- **`std::string x.str()`**:
  Returns the name of `x`.

- **`vindex_t x.index()`**:
  Returns the unique integer ID of `x`.

Usually, there is no need to call these member functions explicitly in QUBO++ programs.

## Integer variable class
- **`qbpp::VarInt`**:
  A class derived from `qbpp::Expr` that represents an integer variable with a specified range.

### Integer variable creation functions
The following functions are provided to create integer variables:

- **`qbpp::var_int("name")`**:
  Returns an internally used helper object and does not create a `qbpp::VarInt` by itself.
  To define a `qbpp::VarInt`, the range must be specified using the `<=` operator, as shown below.

- **`l <= qbpp::var_int("name") <= u`**:
  Here, `l` and `u` must be integers.
  This expression creates a `qbpp::VarInt` object with the name `"name"`,
  which internally contains a `qbpp::Expr` object representing all integers in the range `[l, u]`.
  Internally, this also creates `qbpp::Var` objects used in the underlying expression.

- **`l <= qbpp::var_int("name", s1) <= u`**:
  Creates a one-dimensional array (vector) of `qbpp::VarInt` objects with the base name `"name"`
  and the same range `[l, u]`.
  Each element is represented as `name[i]`.
  The resulting type is `qbpp::Array<1, qbpp::VarInt>`.
  Higher-dimensional arrays (e.g., `qbpp::Array<2, qbpp::VarInt>`) can be created in the same way as `qbpp::Var` objects.

### Integer variable member functions
For a `qbpp::VarInt` instance `x`, the following member functions are available:

- **`std::string x.name()`**:
  Returns the name of `x`.

- **`std::string x.str()`**:
  Returns the string representation of the underlying expression.

- **`energy_t x.min_val()`**:
  Returns the minimum value `l` of `x`.

- **`energy_t x.max_val()`**:
  Returns the maximum value `u` of `x`.

- **`x.vars()`**:
  Returns the `qbpp::Var` object array used to represent the integer variable.

- **`x.coeffs()`**:
  Returns the integer coefficient array.

The following expression is equivalent to the expression stored in `x`:
```cpp
x.min_val() + qbpp::sum(x.coeffs() * x.vars())
```
</div>

<div class="lang-ja" markdown="1">
# クイックリファレンス: 変数と式

## `qbpp::Expr`で使用されるデータ型
- **`coeff_t`**:
  `qbpp::Term`オブジェクトの係数に使用される整数データ型。
  デフォルトの型は`int32_t`です。
  この型を変更するには、コンパイル時に`COEFF_TYPE`マクロを定義します。例:
```
-DCOEFF_TYPE=int16_t
```
- **`energy_t`**:
`qbpp::Expr`オブジェクトのエネルギー値の計算、および`qbpp::Expr`内の整数定数項に使用される整数データ型。
デフォルトの型は`int64_t`です。
この型を変更するには、コンパイル時に`ENERGY_TYPE`マクロを定義します。例:
```
-DENERGY_TYPE=int32_t
```
`energy_t`のビット幅は`coeff_t`のビット幅以上であることが保証されています。

- **`vindex_t`**:
`uint32_t`として定義され、各`qbpp::Var`オブジェクトの一意な整数IDを格納するために使用されます。
ほとんどの場合、このデータ型を変更する必要はありません。



## 使用可能な整数データ型
- **標準整数型**:
`int16_t`, `int32_t`, `int64_t`

- **多倍長整数型**（Boost.Multiprecisionライブラリを使用して実装）:
`qbpp::int128_t`, `qbpp::cpp_int`

- **`qbpp::cpp_int`**:
精度無制限の整数型。

> **WARNING**
> パフォーマンスを最大化するため、QUBO++は算術オーバーフローのチェックを行いません。
> 開発およびテスト中は、`coeff_t`と`energy_t`にはより広いビット幅を使用することを推奨します。
> 必要なビット幅が不明な場合は、`qbpp::cpp_int`を使用して正確性を確保し、
> 検証後に固定幅の整数型に切り替えてください。

## クラスオブジェクトの出力
QUBO++のほとんどのクラスは、`std::ostream`の`<<`演算子を使用して出力でき、
デバッグに便利です。
例えば、QUBO++のオブジェクト`obj`は次のように`std::cout`に出力できます:
```cpp
std::cout << obj << std::endl;
```
これは`obj.str()`または`str(obj)`を呼び出し、objのテキスト表現を含むstd::stringを返します。
この設計により、デバッガに頼ることなく内部状態を簡単に確認できます。


## 変数クラス
- **`qbpp::Var`**:
  一意な32ビット整数IDを保持するクラス。
  変数名はグローバルレジストリに格納され、`x.str()`で取得できます。


> **NOTE**
> `qbpp::Var`オブジェクトは変数をシンボリックに表現します。
> 特定のデータ型は関連付けられていません。
> バイナリ、スピン、その他の型の変数を表現するために使用できます。

### 変数作成関数
変数を作成するために以下の関数が提供されています:

- **`qbpp::var("name")`**:
  指定された名前`"name"`を持つ`qbpp::Var`オブジェクトを作成します。

- **`qbpp::var("name", s1)`**:
  ベース名`"name"`を持つ`qbpp::Var`オブジェクトの1次元配列を作成します。
  各要素は`name[i]`として表現されます。
  結果の型は`qbpp::Array<1, qbpp::Var>`です。

- **`qbpp::var("name", s1, s2)`**:
  ベース名`"name"`を持つ`qbpp::Var`オブジェクトの2次元配列（行列）を作成します。
  各要素は`name[i][j]`として表現されます。
  結果の型は`qbpp::Array<2, qbpp::Var>`です。

- **`qbpp::var("name", s1, s2, ...)`**:
  ベース名`"name"`を持つ`qbpp::Var`オブジェクトの高次元配列を作成します。
  各要素は`name[i][j]...`として表現されます。
  結果の型は`qbpp::Array<N, qbpp::Var>`です（`N`は次元数）。

> **NOTE**
> `"name"`が省略された場合、`"{0}"`、`"{1}"`、...のような番号付きの名前が作成順に自動的に割り当てられます。

## `qbpp::Var`メンバ関数
`qbpp::Var`のインスタンス`x`に対して、以下のメンバ関数が利用できます:

- **`std::string x.str()`**:
  `x`の名前を返します。

- **`vindex_t x.index()`**:
  `x`の一意な整数IDを返します。

通常、QUBO++プログラムでこれらのメンバ関数を明示的に呼び出す必要はありません。

## 整数変数クラス
- **`qbpp::VarInt`**:
  `qbpp::Expr`から派生したクラスで、指定された範囲を持つ整数変数を表現します。

### 整数変数作成関数
整数変数を作成するために以下の関数が提供されています:

- **`qbpp::var_int("name")`**:
  内部的に使用されるヘルパーオブジェクトを返し、単体では`qbpp::VarInt`を作成しません。
  `qbpp::VarInt`を定義するには、以下に示すように`<=`演算子を使用して範囲を指定する必要があります。

- **`l <= qbpp::var_int("name") <= u`**:
  ここで`l`と`u`は整数でなければなりません。
  この式は名前`"name"`を持つ`qbpp::VarInt`オブジェクトを作成し、
  内部的には範囲`[l, u]`のすべての整数を表現する`qbpp::Expr`オブジェクトを含みます。
  内部的には、基礎となる式で使用される`qbpp::Var`オブジェクトも作成されます。

- **`l <= qbpp::var_int("name", s1) <= u`**:
  ベース名`"name"`と同じ範囲`[l, u]`を持つ`qbpp::VarInt`オブジェクトの1次元配列を作成します。
  各要素は`name[i]`として表現されます。
  結果の型は`qbpp::Array<1, qbpp::VarInt>`です。
  `qbpp::VarInt`オブジェクトの高次元配列は`qbpp::Var`オブジェクトと同じ方法で作成できます。

### 整数変数メンバ関数
`qbpp::VarInt`のインスタンス`x`に対して、以下のメンバ関数が利用できます:

- **`std::string x.name()`**:
  `x`の名前を返します。

- **`std::string x.str()`**:
  基礎となる式の文字列表現を返します。

- **`energy_t x.min_val()`**:
  `x`の最小値`l`を返します。

- **`energy_t x.max_val()`**:
  `x`の最大値`u`を返します。

- **`x.vars()`**:
  整数変数を表現するために使用される`qbpp::Var`オブジェクト配列のconst参照を返します。

- **`x.coeffs()`**:
  整数係数配列を返します。

以下の式は`x`に格納されている式と等価です:
```cpp
x.min_val() + qbpp::sum(x.coeffs() * x.vars())
```
</div>
