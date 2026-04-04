---
layout: default
nav_exclude: true
title: "Array Operations"
nav_order: 12
alt_lang: "Python version"
alt_lang_url: "python/OPVECTOR"
---


<div class="lang-en" markdown="1">

# Basic Operators and Functions for Arrays
Basically, operators and functions for arrays operate element-wise.


## Basic operators for arrays
The basic operators **`+`**, **`-`**, **`*`**, and **`/`** work for arrays of variables and expressions.

In QUBO++, these operators are applied element-wise.

### Array-Scalar Operations
When you combine an array and a scalar, the scalar is applied to each element of the array.
For example, if `x` is an array of size 3, then:
- `2 * x` produces `{2*x[0], 2*x[1], 2*x[2]}`
- `x + 1` produces `{x[0] + 1, x[1] + 1, x[2] + 1}`

The following program illustrates this behavior:
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 3);
  auto f = 2 * x + 1;

  std::cout << "f = " << f << std::endl;
  for (size_t i = 0; i < f.size(); ++i) {
    std::cout << "f[" << i << "] = " << f[i] << std::endl;
  }
}
```
This program creates an array `x = {x[0], x[1], x[2]}` of binary variables.
Then `2 * x` multiplies each element by `2`, and `+ 1` adds `1` to each element, so `f` becomes:
`{1 + 2*x[0], 1 + 2*x[1], 1 + 2*x[2]}`.
This program produces the following output:
```
f = {1 +2*x[0],1 +2*x[1],1 +2*x[2]}
f[0] = 1 +2*x[0]
f[1] = 1 +2*x[1]
f[2] = 1 +2*x[2]
```

### Array-Array Operations
When you combine two arrays of the same size, the operation is performed element-wise at each index.

The following example uses two arrays `x` and `y`, both of size 3:
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 3);
  auto y = qbpp::var("y", 3);
  auto f = 2 * x + 3 * y + 1;

  std::cout << "f = " << f << std::endl;
  for (size_t i = 0; i < f.size(); ++i) {
    std::cout << "f[" << i << "] = " << f[i] << std::endl;
  }
}
```
Here:
- `2 * x` becomes `{2*x[0], 2*x[1], 2*x[2]}`
- `3 * y` becomes `{3*y[0], 3*y[1], 3*y[2]}`
- adding them is element-wise, so the `i`-th element is `2*x[i] + 3*y[i]`
- `+ 1` is again applied element-wise

Therefore, `f` becomes: `{1 + 2*x[0] + 3*y[0], 1 + 2*x[1] + 3*y[1], 1 + 2*x[2] + 3*y[2]}`
which matches the output:
```
f = {1 +2*x[0] +3*y[0],1 +2*x[1] +3*y[1],1 +2*x[2] +3*y[2]}
f[0] = 1 +2*x[0] +3*y[0]
f[1] = 1 +2*x[1] +3*y[1]
f[2] = 1 +2*x[2] +3*y[2]
```
Array-array operations require the same array size.

The next example demonstrates a more complex element-wise expression involving array-scalar operations, array-array operations, unary minus, and parentheses:

```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 3);
  auto y = qbpp::var("y", 3);
  auto f = 6 * -(x + 1) * (y - 1);
  auto g = f / 3;

  std::cout << "f = " << f << std::endl;
  for (size_t i = 0; i < x.size(); ++i) {
    std::cout << "f[" << i << "] = " << f[i] << std::endl;
  }

  std::cout << "g = " << g << std::endl;
  for (size_t i = 0; i < x.size(); ++i) {
    std::cout << "g[" << i << "] = " << g[i] << std::endl;
  }
}
```
In this example, all operations are still applied element-wise.

- First, `x + 1` and `y - 1` add/subtract the scalar to/from each element, producing two arrays
`{x[i]+1}` and `{y[i]−1}`.
- The unary minus -(x + 1) also works element-wise, so it becomes `{−(x[i]+1)}`.
- The multiplication `6 * -(x + 1) * (y - 1)` is then performed element-wise as well, so for each index `i`, `f[i]=6⋅(−(x[i]+1))⋅(y[i]−1)`.
Expanding this expression yields `f[i]=6−6x[i]y[i]+6x[i]−6y[i]`, which matches the printed form in the output.
- Finally, `g = f / 3` divides each element by 3, so `g[i]=f[i]/3=2−2x[i]y[i]+2x[i]−2y[i]`,
again matching the output.
```
f = {6 -6*x[0]*y[0] +6*x[0] -6*y[0],6 -6*x[1]*y[1] +6*x[1] -6*y[1],6 -6*x[2]*y[2] +6*x[2] -6*y[2]}
f[0] = 6 -6*x[0]*y[0] +6*x[0] -6*y[0]
f[1] = 6 -6*x[1]*y[1] +6*x[1] -6*y[1]
f[2] = 6 -6*x[2]*y[2] +6*x[2] -6*y[2]
g = {2 -2*x[0]*y[0] +2*x[0] -2*y[0],2 -2*x[1]*y[1] +2*x[1] -2*y[1],2 -2*x[2]*y[2] +2*x[2] -2*y[2]}
g[0] = 2 -2*x[0]*y[0] +2*x[0] -2*y[0]
g[1] = 2 -2*x[1]*y[1] +2*x[1] -2*y[1]
g[2] = 2 -2*x[2]*y[2] +2*x[2] -2*y[2]
```

## Compound operators for arrays
Similarly, the compound operators **`+=`**, **`-=`**, **`*=`**, and **`/=`** work for arrays of variables and expressions.
The following example demonstrates how these operators work for an array of size 3:
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 3);
  auto y = qbpp::var("y", 3);
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
This program produces the following output:
```
f = {4 +6*x[0] +3*y[0],4 +6*x[1] +3*y[1],4 +6*x[2] +3*y[2]}
f = {-8 +6*x[0] +3*y[0],-8 +6*x[1] +3*y[1],-8 +6*x[2] +3*y[2]}
f = {12*x[0]*y[0] +6*y[0]*y[0] -16*y[0],12*x[1]*y[1] +6*y[1]*y[1] -16*y[1],12*x[2]*y[2] +6*y[2]*y[2] -16*y[2]}
f = {6*x[0]*y[0] +3*y[0]*y[0] -8*y[0],6*x[1]*y[1] +3*y[1]*y[1] -8*y[1],6*x[2]*y[2] +3*y[2]*y[2] -8*y[2]}
```

## Square functions for arrays
Square functions also work for arrays, as demonstrated below:
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 3);
  auto f = x + 1;

  std::cout << "f = " << qbpp::sqr(f) << std::endl;
  std::cout << "f = " << f << std::endl;
  f.sqr();
  std::cout << "f = " << f << std::endl;
}
```
This program produces the following output:
```
f = {1 +x[0]*x[0] +x[0] +x[0],1 +x[1]*x[1] +x[1] +x[1],1 +x[2]*x[2] +x[2] +x[2]}
f = {1 +x[0],1 +x[1],1 +x[2]}
f = {1 +x[0]*x[0] +x[0] +x[0],1 +x[1]*x[1] +x[1] +x[1],1 +x[2]*x[2] +x[2] +x[2]}
```

## Simplify functions for arrays
Simplify functions also work for arrays, as demonstrated below:
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 3);
  auto f = qbpp::sqr(x - 1);
  std::cout << "f = " << f << std::endl;
  std::cout << "simplified(f) = " << qbpp::simplify(f) << std::endl;
  std::cout << "simplified_as_binary(f) = " << qbpp::simplify_as_binary(f) << std::endl;
  std::cout << "simplified_as_spin(f) = " << qbpp::simplify_as_spin(f) << std::endl;
}
```
This program produces the following output:
```
f = {1 +x[0]*x[0] -x[0] -x[0],1 +x[1]*x[1] -x[1] -x[1],1 +x[2]*x[2] -x[2] -x[2]}
simplified(f) = {1 -2*x[0] +x[0]*x[0],1 -2*x[1] +x[1]*x[1],1 -2*x[2] +x[2]*x[2]}
simplified_as_binary(f) = {1 -x[0],1 -x[1],1 -x[2]}
simplified_as_spin(f) = {2 -2*x[0],2 -2*x[1],2 -2*x[2]}
```

> **NOTE**
> These operators and functions also work for **multi-dimensional arrays**.


</div>

<div class="lang-ja" markdown="1">

# 配列の基本演算子と関数
基本的に、配列に対する演算子と関数は要素ごとに適用されます。


## 配列の基本演算子
基本演算子 **`+`**、**`-`**、**`*`**、**`/`** は変数や式の配列に対して使用できます。

QUBO++では、これらの演算子は要素ごとに適用されます。

### 配列とスカラーの演算
配列とスカラーを組み合わせると、スカラーが配列の各要素に適用されます。
例えば、`x` がサイズ3の配列の場合:
- `2 * x` は `{2*x[0], 2*x[1], 2*x[2]}` を生成
- `x + 1` は `{x[0] + 1, x[1] + 1, x[2] + 1}` を生成

以下のプログラムはこの動作を示しています。
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 3);
  auto f = 2 * x + 1;

  std::cout << "f = " << f << std::endl;
  for (size_t i = 0; i < f.size(); ++i) {
    std::cout << "f[" << i << "] = " << f[i] << std::endl;
  }
}
```
このプログラムは2値変数の配列 `x = {x[0], x[1], x[2]}` を作成します。
`2 * x` で各要素に `2` を掛け、`+ 1` で各要素に `1` を加えるため、`f` は `{1 + 2*x[0], 1 + 2*x[1], 1 + 2*x[2]}` になります。
このプログラムは以下の出力を生成します。
```
f = {1 +2*x[0],1 +2*x[1],1 +2*x[2]}
f[0] = 1 +2*x[0]
f[1] = 1 +2*x[1]
f[2] = 1 +2*x[2]
```

### 配列同士の演算
同じサイズの2つの配列を組み合わせると、各インデックスで要素ごとに演算が行われます。

以下の例では、どちらもサイズ3の2つの配列 `x` と `y` を使用しています。
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 3);
  auto y = qbpp::var("y", 3);
  auto f = 2 * x + 3 * y + 1;

  std::cout << "f = " << f << std::endl;
  for (size_t i = 0; i < f.size(); ++i) {
    std::cout << "f[" << i << "] = " << f[i] << std::endl;
  }
}
```
ここでは:
- `2 * x` は `{2*x[0], 2*x[1], 2*x[2]}` になる
- `3 * y` は `{3*y[0], 3*y[1], 3*y[2]}` になる
- 加算は要素ごとに行われるため、`i` 番目の要素は `2*x[i] + 3*y[i]`
- `+ 1` も要素ごとに適用される

したがって、`f` は `{1 + 2*x[0] + 3*y[0], 1 + 2*x[1] + 3*y[1], 1 + 2*x[2] + 3*y[2]}` となり、出力と一致します。
```
f = {1 +2*x[0] +3*y[0],1 +2*x[1] +3*y[1],1 +2*x[2] +3*y[2]}
f[0] = 1 +2*x[0] +3*y[0]
f[1] = 1 +2*x[1] +3*y[1]
f[2] = 1 +2*x[2] +3*y[2]
```
配列同士の演算は同じ配列サイズが必要です。

次の例は、配列とスカラーの演算、配列同士の演算、単項マイナス、括弧を含む、より複雑な要素ごとの式を示しています。

```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 3);
  auto y = qbpp::var("y", 3);
  auto f = 6 * -(x + 1) * (y - 1);
  auto g = f / 3;

  std::cout << "f = " << f << std::endl;
  for (size_t i = 0; i < x.size(); ++i) {
    std::cout << "f[" << i << "] = " << f[i] << std::endl;
  }

  std::cout << "g = " << g << std::endl;
  for (size_t i = 0; i < x.size(); ++i) {
    std::cout << "g[" << i << "] = " << g[i] << std::endl;
  }
}
```
この例でも、すべての演算は要素ごとに適用されます。

- まず、`x + 1` と `y - 1` は各要素にスカラーを加減算し、2つの配列 `{x[i]+1}` と `{y[i]-1}` を生成します。
- 単項マイナス -(x + 1) も要素ごとに適用され、`{-(x[i]+1)}` になります。
- 乗算 `6 * -(x + 1) * (y - 1)` も要素ごとに行われ、各インデックス `i` で `f[i]=6*(-(x[i]+1))*(y[i]-1)` となります。
この式を展開すると `f[i]=6-6x[i]y[i]+6x[i]-6y[i]` となり、出力と一致します。
- 最後に、`g = f / 3` は各要素を3で割るため、`g[i]=f[i]/3=2-2x[i]y[i]+2x[i]-2y[i]` となり、やはり出力と一致します。
```
f = {6 -6*x[0]*y[0] +6*x[0] -6*y[0],6 -6*x[1]*y[1] +6*x[1] -6*y[1],6 -6*x[2]*y[2] +6*x[2] -6*y[2]}
f[0] = 6 -6*x[0]*y[0] +6*x[0] -6*y[0]
f[1] = 6 -6*x[1]*y[1] +6*x[1] -6*y[1]
f[2] = 6 -6*x[2]*y[2] +6*x[2] -6*y[2]
g = {2 -2*x[0]*y[0] +2*x[0] -2*y[0],2 -2*x[1]*y[1] +2*x[1] -2*y[1],2 -2*x[2]*y[2] +2*x[2] -2*y[2]}
g[0] = 2 -2*x[0]*y[0] +2*x[0] -2*y[0]
g[1] = 2 -2*x[1]*y[1] +2*x[1] -2*y[1]
g[2] = 2 -2*x[2]*y[2] +2*x[2] -2*y[2]
```

## 配列の複合演算子
同様に、複合演算子 **`+=`**、**`-=`**、**`*=`**、**`/=`** も変数や式の配列に対して使用できます。
以下の例は、サイズ3の配列に対するこれらの演算子の動作を示しています。
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 3);
  auto y = qbpp::var("y", 3);
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
このプログラムは以下の出力を生成します。
```
f = {4 +6*x[0] +3*y[0],4 +6*x[1] +3*y[1],4 +6*x[2] +3*y[2]}
f = {-8 +6*x[0] +3*y[0],-8 +6*x[1] +3*y[1],-8 +6*x[2] +3*y[2]}
f = {12*x[0]*y[0] +6*y[0]*y[0] -16*y[0],12*x[1]*y[1] +6*y[1]*y[1] -16*y[1],12*x[2]*y[2] +6*y[2]*y[2] -16*y[2]}
f = {6*x[0]*y[0] +3*y[0]*y[0] -8*y[0],6*x[1]*y[1] +3*y[1]*y[1] -8*y[1],6*x[2]*y[2] +3*y[2]*y[2] -8*y[2]}
```

## 配列の2乗関数
2乗関数も配列に対して使用できます。以下に例を示します。
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 3);
  auto f = x + 1;

  std::cout << "f = " << qbpp::sqr(f) << std::endl;
  std::cout << "f = " << f << std::endl;
  f.sqr();
  std::cout << "f = " << f << std::endl;
}
```
このプログラムは以下の出力を生成します。
```
f = {1 +x[0]*x[0] +x[0] +x[0],1 +x[1]*x[1] +x[1] +x[1],1 +x[2]*x[2] +x[2] +x[2]}
f = {1 +x[0],1 +x[1],1 +x[2]}
f = {1 +x[0]*x[0] +x[0] +x[0],1 +x[1]*x[1] +x[1] +x[1],1 +x[2]*x[2] +x[2] +x[2]}
```

## 配列の簡約化関数
簡約化関数も配列に対して使用できます。以下に例を示します。
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 3);
  auto f = qbpp::sqr(x - 1);
  std::cout << "f = " << f << std::endl;
  std::cout << "simplified(f) = " << qbpp::simplify(f) << std::endl;
  std::cout << "simplified_as_binary(f) = " << qbpp::simplify_as_binary(f) << std::endl;
  std::cout << "simplified_as_spin(f) = " << qbpp::simplify_as_spin(f) << std::endl;
}
```
このプログラムは以下の出力を生成します。
```
f = {1 +x[0]*x[0] -x[0] -x[0],1 +x[1]*x[1] -x[1] -x[1],1 +x[2]*x[2] -x[2] -x[2]}
simplified(f) = {1 -2*x[0] +x[0]*x[0],1 -2*x[1] +x[1]*x[1],1 -2*x[2] +x[2]*x[2]}
simplified_as_binary(f) = {1 -x[0],1 -x[1],1 -x[2]}
simplified_as_spin(f) = {2 -2*x[0],2 -2*x[1],2 -2*x[2]}
```

> **NOTE**
> これらの演算子と関数は **多次元配列** に対しても使用できます。


</div>
