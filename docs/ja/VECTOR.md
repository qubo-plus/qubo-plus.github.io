---
layout: default
nav_exclude: true
title: "Arrays"
nav_order: 3
lang: ja
hreflang_alt: "en/VECTOR"
hreflang_lang: "en"
---

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

> **注意**
> **`qbpp::var(name, size)`** は `qbpp::Var` 型の `size` 個の要素を含む1次元の変数の配列を返します。
> 厳密な型は **`qbpp::Array<1, qbpp::Var>`** で、`1` は次元数、`qbpp::Var` は要素の型を表します。
> `auto` を使えばコンパイラがこの型を推論してくれるので、明示的に書く必要があるのは、配列を非 `static` なクラスのメンバ変数として保持する場合だけです（C++ では非 static メンバに `auto` が使えないため）。
> 配列の型は、要素に対する要素ごとの演算をサポートするオーバーロードされた演算子を提供します。

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
  auto solver = qbpp::ExhaustiveSolver(f);
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
