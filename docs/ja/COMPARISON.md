---
layout: default
nav_exclude: true
title: "Comparison Operators"
nav_order: 14
lang: ja
hreflang_alt: "en/COMPARISON"
hreflang_lang: "en"
---

# 比較演算子
QUBO++は、制約を作成するための2種類の演算子をサポートしています:

- **等式演算子**: $f=n$、ここで $f$ は式、$n$ は整数。
- **範囲演算子**: $l\leq f\leq u$、ここで $f$ は式、$l$ と $u$ ($l\leq u$) は整数。

これらの演算子は、**対応する制約が満たされる場合に限り最小値0をとる**式を返します。

## 等式演算子
等式演算子 $f=n$ は以下の式を生成します:

$$
(f−n)^2
$$

この式は、等式 $f=n$ が満たされる場合に限り最小値0をとります。

以下のQUBO++プログラムは、Exhaustive Solverを使用して $a+2b+3c=3$ を満たす全ての解を探索します:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto a = qbpp::var("a");
  auto b = qbpp::var("b");
  auto c = qbpp::var("c");
  auto f = a + 2 * b + 3 * c == 3;
  f.simplify_as_binary();
  std::cout << "f = " << f << std::endl;
  std::cout << "f.body() = " << f.body() << std::endl;

  auto solver = qbpp::ExhaustiveSolver(f);
  auto sols = solver.search({{"best_energy_sols", 1}});
  for (const auto& sol : sols) {
    std::cout << "a = " << a(sol) << ", b = " << b(sol) << ", c = " << c(sol)
              << ", f = " << f(sol) << ", f.body() = " << f.body(sol) << std::endl;
  }
}
```
{% endraw %}
このプログラムでは、`f` は内部的に2つの qbpp::Expr オブジェクトを保持しています:
- **`f`**: $(a+2b+3c−3)^2$、等式 $a+2b+3c=3$ が満たされる場合に最小値0をとります。
- **`f.body()`**: 等式の左辺、$a+2b+3c$。

`f` に対して作成されたExhaustive Solverオブジェクトを使用し、全ての最適解が **`sols`** に格納されます。
`sols` を反復処理することで、全ての解と `f` および `f.body()` の値が以下のように出力されます:
```
f = 9 -5*a -8*b -9*c +4*a*b +6*a*c +12*b*c
f.body() = a +2*b +3*c
a = 0, b = 0, c = 1, f = 0, f.body() = 3
a = 1, b = 1, c = 0, f = 0, f.body() = 3
```
これらの結果から、2つの最適解が `f = 0` を達成し、`f.body() = 3` を満たしていることが確認できます。

## サポートされる等式の形式に関する注意
QUBO++は等式演算子を以下の形式でのみサポートしています:
- **`expression == integer`**

以下の形式はサポートされていません:
- **`integer == expression`**
- **`expression1 == expression2`**

`expression1 == expression2` の代わりに、以下のように書き換えることができます:
- **`expression1 - expression2 == 0`**

これは完全にサポートされています。


## 範囲演算子
$l\leq f \leq u$ ($l\leq u$) の形式の範囲演算子は、制約が満たされる場合に限り最小値0をとる式を生成します。

$l$ と $u$ の値に応じて、以下の場合分けを考えます。
- **場合1**: **$u=l$**
- **場合2**: **$u=l+1$**
- **場合3**: **$u=l+2$**
- **場合4**: **$u\geq l+3$**

### 場合1: $u=l$
$u=l$ の場合、範囲制約は等式制約 $f=l$ に帰着し、等式演算子を直接使用して実装できます。

### 場合2: $u=l+1$
$u=l+1$ の場合、以下の式が生成されます:

$$
 (f-l)(f-u)
$$

$l$ と $u$ の間に整数が存在しないため、この式は $f=l$ または $f=u$ の場合に限り最小値0をとります。

### 場合3: $u=l+2$
**補助バイナリ変数** $a \in \lbrace 0,1\rbrace$ を導入し、以下の式を使用します:

$$
\begin{aligned}
(f-l-a)(f-l-(a+1))
\end{aligned}
$$

この式は $f=l$, $l+1$, $l+2$ に対して以下のように評価されます:

$$
\begin{aligned}
(f-l-a)(f-l-(a+1)) &= (-a)(-(a+1)) && \text{if } f=l \\
                   &= (1-a)(-a) && \text{if } f=l+1 \\
                   &=(2-a)(1-a)  && \text{if } f=l+2
\end{aligned}
$$

全ての場合において、$a$ の適切な選択により最小値0が達成可能です。
したがって、$l\leq f\leq u$ が満たされる場合、この式は最小値0をとります。

$g = f-l-a$ とおくと、

$$
\begin{aligned}
(f-l-a)(f-l-(a+1)) &= g(g-1)
\end{aligned}
$$

となり、$g\leq -1$ または $g\geq 2$ の場合は常に正の値をとります。
したがって、この式は $l\leq f\leq u$ が満たされる場合に限り最小値0をとります。

### 場合4: $u\geq l+3$
範囲 $[l,u−1]$ の整数値をとる補助整数変数 $a$ を導入します。
このような整数変数は、[整数変数と連立方程式の求解](INTEGER)で説明されているように、複数のバイナリ変数を用いて定義できます。

この場合の式は:

$$
\begin{aligned}
(f-a)(f-(a+1))
\end{aligned}
$$

場合3と同様に、$f$ が $[l,u]$ に含まれない場合、この式は常に正の値をとることが示せます。

$f$ が範囲 $[l,u]$ の整数値をとると仮定します。
$a=f$ を選ぶと、

$$
\begin{aligned}
f-a &= 0 & {\rm if\,\,} f\in [l,u-1]\\
f-(a+1) &= 0& {\rm if\,\,} f\in [l+1,u]
\end{aligned}
$$

したがって、任意の $f\in[l,u]$ に対して $f−a=0$ または $f−(a+1)=0$ のいずれかが成り立ちます。
よって、$(f−a)(f−(a+1))$ は $l\leq f\leq u$ の場合に限り最小値0をとります。


### バイナリ変数数の削減
[整数変数と連立方程式の求解](INTEGER)では、整数変数 $a\in [l,u]$ は $n$ 個のバイナリ変数 $x_0, x_1, \ldots, x_{n-1}$ を用いて以下のように表現されます:

$$
\begin{aligned}
a & = l+2^0x_0+2^1x_1+\cdots +2^{n-2}x_{n-2}+dx_{n-1}
\end{aligned}
$$

この式は $l$ から $l+2^{n-1}+d-1$ までの全ての整数を表現できます。
したがって、以下を満たすように $n$ と $d$ を選ぶことができます:

$$
\begin{aligned}
u-1&=l+2^{n-1}+d-1.
\end{aligned}
$$


場合4では、QUBO++は代わりに $n-1$ 個のバイナリ変数 $x_1, \ldots, x_{n-1}$ を用いた以下の線形式を使用します:

$$
\begin{aligned}
a &= l+2^1x_1+\cdots +2^{n-2}x_{n-2}+dx_{n-1}
\end{aligned}
$$

この式は $l$ から $l+2^{n-1}+d-2$ までの整数を表現します。
それに応じて、以下を満たすように $n$ と $d$ を選びます:

$$
\begin{aligned}
u-1&=l+2^{n-1}+d-2.
\end{aligned}
$$

このような整数変数 $a$ を**ユニットギャップ整数変数**と呼びます。
$[l,u]$ 内の一部の値は $a$ で表現できませんが、表現できない任意の $k\in[l,u]$ に対して $k−1$ は表現可能です。
したがって、$a$ または $a+1$ は範囲 $[l,u]$ の任意の値をとることができ、範囲制約の適用には十分です。

### 4つの場合のQUBO++プログラム
以下のプログラムは、QUBO++における4つの場合の実装を示しています:
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto f = qbpp::toExpr(qbpp::var("f"));
  auto f1 = 1 <= f <= 1;
  auto f2 = 1 <= f <= 2;
  auto f3 = 1 <= f <= 3;
  auto f4 = 1 <= f <= 5;
  std::cout << "f1 = " << f1.simplify() << std::endl;
  std::cout << "f2 = " << f2.simplify() << std::endl;
  std::cout << "f3 = " << f3.simplify() << std::endl;
  std::cout << "f4 = " << f4.simplify() << std::endl;
}
```
このプログラムは以下の出力を生成します:
```
f1 = 1 -2*f +f*f
f2 = 2 -3*f +f*f
f3 = 2 -3*f +3*{0} +f*f -2*f*{0} +{0}*{0}
f4 = 2 -3*f +6*{1}[0] +3*{1}[1] +f*f -4*f*{1}[0] -2*f*{1}[1] +4*{1}[0]*{1}[0] +4*{1}[0]*{1}[1] +{1}[1]*{1}[1]
```
これらの出力は以下の式に対応します:

$$
\begin{aligned}
f_1 &= (f-1)^2\\
f_2 &= (f-1)(f-2)\\
f_3 &= (f-x_0)(f-(x_0+1))\\
f_4 &= (f-(2x_{1,0}+x_{1,1}+1))(f-(2x_{1,0}+x_{1,1}+2))
\end{aligned}
$$

### 範囲演算子を使用するQUBO++プログラム
以下のプログラムは、QUBO++における範囲演算子の使用方法を示しています:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto a = qbpp::var("a");
  auto b = qbpp::var("b");
  auto c = qbpp::var("c");
  auto f = 5 <= 4 * a + 9 * b + 15 * c <= 14;
  f.simplify_as_binary();
  auto solver = qbpp::ExhaustiveSolver(f);
  auto sols = solver.search({{"best_energy_sols", 1}});
  for (const auto& sol : sols) {
    std::cout << "a = " << a(sol) << ", b = " << b(sol) << ", c = " << c(sol)
              << ", f = " << f(sol) << ", f.body() = " << f.body(sol)
              << ", sol = " << sol << std::endl;
  }
}
```
{% endraw %}
3つのバイナリ変数 $a$, $b$, $c$ に対して、このプログラムは以下の制約を満たす解を探索します:

$$
\begin{aligned}
5\leq 4a+9b+15c \leq 15
\end{aligned}
$$

このプログラムは以下の出力を生成します:
{% raw %}
```
a = 0, b = 1, c = 0, f = 0, f.body() = 9, sol = 0:{{a,0},{b,1},{c,0},{{0}[0],0},{{0}[1],1},{{0}[2],0}}
a = 0, b = 1, c = 0, f = 0, f.body() = 9, sol = 0:{{a,0},{b,1},{c,0},{{0}[0],1},{{0}[1],0},{{0}[2],1}}
a = 1, b = 1, c = 0, f = 0, f.body() = 13, sol = 0:{{a,1},{b,1},{c,0},{{0}[0],1},{{0}[1],1},{{0}[2],1}}
```
{% endraw %}

## 下界・上界演算子
QUBO++は以下の**片側境界演算子**を直接サポートしていません:
- **下界演算子**: $l\leq f$
- **上界演算子**: $f\leq u$

代わりに、QUBO++は**無限大** ($\infty$) の記号表現を提供し、これらの制約は**範囲演算子**を使用して以下のように実装されます:
- **下界演算子**: $l\leq f\leq +\infty$
- **上界演算子**: $-\infty \leq f\leq u$

範囲演算子は内部的に補助変数を導入するため、真の無限大は明示的に表現できません。
そのため、QUBO++は式 $f$ の**有限の最大値と最小値**を推定し、それぞれ $+\infty$ と $-\infty$ の代わりに使用します。

例えば、以下の式を考えます:

$$
\begin{aligned}
f=4a + 9 b + 11 c
\end{aligned}
$$

ここで $a$, $b$, $c$ はバイナリ変数です。
$f$ の取りうる最小値と最大値はそれぞれ0と24です。
したがって、QUBO++は対応する範囲制約を構築する際に、$-\infty$ と $+\infty$ の代わりに0と24を使用します。

> **注意**
> QUBO++は不等式制約において下界と上界の両方を指定することを意図的に要求しています。
> これにより、**MIPスタイルの解釈**（例: $f\leq u$ が $0\leq f\leq u$ を意味する）と**QUBOスタイルの解釈**（例: $f\leq u$ が $-\infty\leq f\leq u$ を意味する）の間の曖昧さを回避し、微妙なモデリングエラーを防ぎます。

### 下界・上界演算子のQUBO++プログラム
QUBO++では、無限大の値は **`qbpp::inf`** で表現されます。

以下のプログラムは**下界演算子**を示しています:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto a = qbpp::var("a");
  auto b = qbpp::var("b");
  auto c = qbpp::var("c");
  auto f = 14 <= 4 * a + 9 * b + 11 * c <= +qbpp::inf;
  f.simplify_as_binary();
  auto solver = qbpp::ExhaustiveSolver(f);
  auto sols = solver.search({{"best_energy_sols", 1}});
  for (const auto& sol : sols) {
    std::cout << "a = " << a(sol) << ", b = " << b(sol) << ", c = " << c(sol)
              << ", f = " << f(sol) << ", f.body() = " << f.body(sol)
              << ", sol = " << sol << std::endl;
  }
}
```
{% endraw %}
このプログラムでは、**`+qbpp::inf`** は正の無限大を表し、自動的に24に置き換えられます。

このプログラムは以下の出力を生成します:
{% raw %}
```
a = 0, b = 1, c = 1, f = 0, f.body() = 20, sol = 0:{{a,0},{b,1},{c,1},{{0}[0],1},{{0}[1],0},{{0}[2],1}}
a = 0, b = 1, c = 1, f = 0, f.body() = 20, sol = 0:{{a,0},{b,1},{c,1},{{0}[0],1},{{0}[1],1},{{0}[2],0}}
a = 1, b = 0, c = 1, f = 0, f.body() = 15, sol = 0:{{a,1},{b,0},{c,1},{{0}[0],0},{{0}[1],0},{{0}[2],0}}
a = 1, b = 1, c = 1, f = 0, f.body() = 24, sol = 0:{{a,1},{b,1},{c,1},{{0}[0],1},{{0}[1],1},{{0}[2],1}}
```
{% endraw %}

以下のプログラムは**上界演算子**を示しています:
{% raw %}
```cpp
int main() {
  auto a = qbpp::var("a");
  auto b = qbpp::var("b");
  auto c = qbpp::var("c");
  auto f = -qbpp::inf <= 4 * a + 9 * b + 11 * c <= 14;
  f.simplify_as_binary();
  auto solver = qbpp::ExhaustiveSolver(f);
  auto sols = solver.search({{"best_energy_sols", 1}});
  for (const auto& sol : sols) {
    std::cout << "a = " << a(sol) << ", b = " << b(sol) << ", c = " << c(sol)
              << ", f = " << f(sol) << ", f.body() = " << f.body(sol)
              << ", sol = " << sol << std::endl;
  }
}
```
{% endraw %}
このプログラムでは、**`-qbpp::inf`** は負の無限大を表し、自動的に0に置き換えられます。

このプログラムは以下の出力を生成します:
{% raw %}
```
a = 0, b = 0, c = 0, f = 0, f.body() = 0, sol = 0:{{a,0},{b,0},{c,0},{{0}[0],0},{{0}[1],0},{{0}[2],0}}
a = 0, b = 0, c = 1, f = 0, f.body() = 11, sol = 0:{{a,0},{b,0},{c,1},{{0}[0],0},{{0}[1],1},{{0}[2],1}}
a = 0, b = 1, c = 0, f = 0, f.body() = 9, sol = 0:{{a,0},{b,1},{c,0},{{0}[0],1},{{0}[1],0},{{0}[2],1}}
a = 1, b = 0, c = 0, f = 0, f.body() = 4, sol = 0:{{a,1},{b,0},{c,0},{{0}[0],0},{{0}[1],1},{{0}[2],0}}
a = 1, b = 1, c = 0, f = 0, f.body() = 13, sol = 0:{{a,1},{b,1},{c,0},{{0}[0],1},{{0}[1],1},{{0}[2],1}}
```
{% endraw %}
