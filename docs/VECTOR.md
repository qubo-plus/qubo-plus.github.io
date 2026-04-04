---
layout: default
nav_exclude: true
title: "Arrays"
nav_order: 3
alt_lang: "Python version"
alt_lang_url: "python/VECTOR"
---


<div class="lang-en" markdown="1">

# Array of variables and array functions

QUBO++ supports arrays of variables and array operations.

## Defining an array of variables
An array of binary variables can be created using the **`qbpp::var()`** function.
- **`qbpp::var("name", size)`** returns an array of `size` variables with the given `name`.

The following program defines an array of 5 variables with the name **`x`**.
By printing `x` with `std::cout`, we can confirm that it contains the 5 variables **`x[0]`**, **`x[1]`**, **`x[2]`**, **`x[3]`**, and **`x[4]`**.
Next, using the **`qbpp::expr()`** function with type deduction, we create a **`qbpp::Expr`** object **`f`** whose initial value is `0`.
In the for-loop from `i = 0` to `4`, each variable `x[i]` is added to `f` using the compound operator **`+=`**.
Finally, `f` is simplified and printed using `std::cout`.
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 5);
  std::cout << x << std::endl;
  auto f = qbpp::expr();
  for (int i = 0; i < 5; ++i) {
    f += x[i];
  }
  std::cout << "f = " << f.simplify_as_binary() << std::endl;
}
```
The output of this program is as follows:
```
{x[0],x[1],x[2],x[3],x[4]}
f = x[0] +x[1] +x[2] +x[3] +x[4]
```

> **NOTE**
> **`qbpp::var(name, size)`** returns a **`qbpp::Array<1, qbpp::Var>`** object that contains `size` elements of type `qbpp::Var`.
> The **`qbpp::Array<Dim, T>`** class provides overloaded operators that support element-wise operations for elements of type `T`.

## Sum function
Using the array utility function **`qbpp::sum()`**, you can obtain the sum of an array of binary variables.
The following program uses `qbpp::sum()` to compute the sum of all variables in the array `x`:
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 5);
  std::cout << x << std::endl;
  auto f = qbpp::sum(x);
  std::cout << "f = " << f.simplify_as_binary() << std::endl;
}
```
The output of this program is exactly the same as that of the previous program.

## QUBO for one-hot constraint
An array of binary variables is **one-hot** if it has **exactly one entry equal to 1**, that is, the sum of its elements is equal to 1.
Let $X = (x_0, x_1, \ldots, x_{n-1})$ denote an array of $n$ binary variables.
The following expression $f(X)$ takes the minimum value of 0 if and only if $X$ is one-hot:

$$
\begin{align}
f(X) &= \left(1 - \sum_{i=0}^{n-1}x_i\right)^2
\end{align}
$$

The following program creates the expression $f$ and finds all optimal solutions:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto x = qbpp::var("x", 5);
  auto f = qbpp::sqr(qbpp::sum(x) - 1);
  std::cout << "f = " << f.simplify_as_binary() << std::endl;
  auto solver = qbpp::exhaustive_solver::ExhaustiveSolver(f);
  auto sol = solver.search({{"best_energy_sols", 1}});
  std::cout << sol << std::endl;
}
```
{% endraw %}
The function **`qbpp::sum()`** computes the sum of all variables in the array.
The function **`qbpp::sqr()`** computes the square of its argument.
The Exhaustive Solver finds all optimal solutions with energy value 0, which are printed using `std::cout` as follows:
{% raw %}
```
f = 1 -x[0] -x[1] -x[2] -x[3] -x[4] +2*x[0]*x[1] +2*x[0]*x[2] +2*x[0]*x[3] +2*x[0]*x[4] +2*x[1]*x[2] +2*x[1]*x[3] +2*x[1]*x[4] +2*x[2]*x[3] +2*x[2]*x[4] +2*x[3]*x[4]
(0) 0:{{x[0],0},{x[1],0},{x[2],0},{x[3],0},{x[4],1}}
(1) 0:{{x[0],0},{x[1],0},{x[2],0},{x[3],1},{x[4],0}}
(2) 0:{{x[0],0},{x[1],0},{x[2],1},{x[3],0},{x[4],0}}
(3) 0:{{x[0],0},{x[1],1},{x[2],0},{x[3],0},{x[4],0}}
(4) 0:{{x[0],1},{x[1],0},{x[2],0},{x[3],0},{x[4],0}}
```
{% endraw %}
All 5 optimal solutions are displayed.

</div>

<div class="lang-ja" markdown="1">

# 変数配列と配列関数

QUBO++は変数配列と配列演算をサポートしています。

## 変数配列の定義
2値変数の配列は **`qbpp::var()`** 関数を使って作成できます。
- **`qbpp::var("name", size)`** は、指定した `name` を持つ `size` 個の変数の配列を返します。

以下のプログラムは、名前 **`x`** を持つ5個の変数の配列を定義します。
`x` を `std::cout` で出力すると、5つの変数 **`x[0]`**、**`x[1]`**、**`x[2]`**、**`x[3]`**、**`x[4]`** が含まれていることを確認できます。
次に、**`qbpp::expr()`** 関数を型推論とともに使用して、初期値が `0` の **`qbpp::Expr`** オブジェクト **`f`** を作成します。
`i = 0` から `4` までのforループで、各変数 `x[i]` が複合演算子 **`+=`** を使って `f` に加算されます。
最後に、`f` が簡約化され、`std::cout` で出力されます。
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 5);
  std::cout << x << std::endl;
  auto f = qbpp::expr();
  for (int i = 0; i < 5; ++i) {
    f += x[i];
  }
  std::cout << "f = " << f.simplify_as_binary() << std::endl;
}
```
このプログラムの出力は以下の通りです。
```
{x[0],x[1],x[2],x[3],x[4]}
f = x[0] +x[1] +x[2] +x[3] +x[4]
```

> **NOTE**
> **`qbpp::var(name, size)`** は `qbpp::Var` 型の `size` 個の要素を含む **`qbpp::Array<1, qbpp::Var>`** オブジェクトを返します。
> **`qbpp::Array<Dim, T>`** クラスは型 `T` の要素に対する要素ごとの演算をサポートするオーバーロードされた演算子を提供します。

## sum 関数
配列ユーティリティ関数 **`qbpp::sum()`** を使用すると、2値変数の配列の合計を取得できます。
以下のプログラムは `qbpp::sum()` を使用して、配列 `x` のすべての変数の合計を計算します。
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 5);
  std::cout << x << std::endl;
  auto f = qbpp::sum(x);
  std::cout << "f = " << f.simplify_as_binary() << std::endl;
}
```
このプログラムの出力は、前のプログラムとまったく同じです。

## One-hot制約のQUBO
2値変数の配列が **one-hot** であるとは、**ちょうど1つの要素が1に等しい**、すなわち要素の合計が1に等しいことを意味します。
$X = (x_0, x_1, \ldots, x_{n-1})$ を $n$ 個の2値変数の配列とします。
以下の式 $f(X)$ は、$X$ がone-hotである場合にのみ最小値0をとります。

$$
\begin{align}
f(X) &= \left(1 - \sum_{i=0}^{n-1}x_i\right)^2
\end{align}
$$

以下のプログラムは式 $f$ を作成し、すべての最適解を見つけます。
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto x = qbpp::var("x", 5);
  auto f = qbpp::sqr(qbpp::sum(x) - 1);
  std::cout << "f = " << f.simplify_as_binary() << std::endl;
  auto solver = qbpp::exhaustive_solver::ExhaustiveSolver(f);
  auto sol = solver.search({{"best_energy_sols", 1}});
  std::cout << sol << std::endl;
}
```
{% endraw %}
関数 **`qbpp::sum()`** は配列内のすべての変数の合計を計算します。
関数 **`qbpp::sqr()`** は引数の2乗を計算します。
Exhaustive Solverはエネルギー値0のすべての最適解を見つけ、`std::cout` で以下のように出力されます。
{% raw %}
```
f = 1 -x[0] -x[1] -x[2] -x[3] -x[4] +2*x[0]*x[1] +2*x[0]*x[2] +2*x[0]*x[3] +2*x[0]*x[4] +2*x[1]*x[2] +2*x[1]*x[3] +2*x[1]*x[4] +2*x[2]*x[3] +2*x[2]*x[4] +2*x[3]*x[4]
(0) 0:{{x[0],0},{x[1],0},{x[2],0},{x[3],0},{x[4],1}}
(1) 0:{{x[0],0},{x[1],0},{x[2],0},{x[3],1},{x[4],0}}
(2) 0:{{x[0],0},{x[1],0},{x[2],1},{x[3],0},{x[4],0}}
(3) 0:{{x[0],0},{x[1],1},{x[2],0},{x[3],0},{x[4],0}}
(4) 0:{{x[0],1},{x[1],0},{x[2],0},{x[3],0},{x[4],0}}
```
{% endraw %}
5つの最適解がすべて表示されます。

</div>
