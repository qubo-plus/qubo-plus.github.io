---
last_modified: 2026-10-30
layout: default
nav_exclude: true
title: "バイナリエンコードの整数変数"
nav_order: 52
lang: ja
hreflang_alt: "en/BINARY_INTEGER"
hreflang_lang: "en"
---

# バイナリエンコードの整数変数

[整数変数](INTEGER)（`qbpp::int_var()`）は，QUBO++ にバンドルされているソルバーが整数値のまま扱います．
一方，QUBO・HUBO の変数はすべてバイナリ変数でなければならないため，
バイナリ変数しか扱えない外部の QUBO ソルバーに渡すモデルでは，
整数を複数のバイナリ変数で表す必要があります．
このページでは，その表し方（バイナリエンコーディング）と，
QUBO++ での 2 つの方法を説明します:

- バイナリエンコードの整数変数 **`qbpp::var_int()`** で，はじめからバイナリ変数で表す
- 整数変数で書いたモデルを **`qbpp::binarize()`** でバイナリ変数のモデルに変換する

## バイナリエンコーディング
$n$個のバイナリ変数$x_0, x_1, \ldots, x_{n-1}$があるとします。
これらの変数は、以下の線形式を用いて$0$から$2^n-1$までのすべての整数を表現できます:

$$
\begin{aligned}
2^0x_0+2^1x_1+\cdots 2^{n-1}x_{n-1}
\end{aligned}
$$

定数オフセット$l$を導入し、$x_{n-1}$の係数を任意の値$d$に置き換えると、次のようになります:

$$
\begin{aligned}
l+2^0x_0+2^1x_1+\cdots +2^{n-2}x_{n-2}+dx_{n-1}
\end{aligned}
$$

この式は$l$から$l+2^{n-1}+d-1$までのすべての整数を表現できます。
このエンコーディングに基づき、整数範囲が$[l,u]$の変数は、以下を満たす適切な$n$と$d$（$1\leq d\leq 2^{n-1}$）を選ぶことで構成できます:

$$
\begin{aligned}
u &= l+2^{n-1}+d-1
\end{aligned}
$$

## `var_int` による宣言

以下のQUBO++プログラムは、バイナリエンコードの整数変数の定義方法を示しています:
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = 1 <= qbpp::var_int("x") <= 8;
  auto y = -10 <= qbpp::var_int("y") <= 10;
  std::cout << "x = " << x << " uses " << x.var_count() << " variables.\n";
  std::cout << "y = " << y << " uses " << y.var_count() << " variables.\n";
}
```

[整数変数](INTEGER)の `int_var` と同じく，**`qbpp::var_int("name")`** を範囲演算子 **`<= <=`** ではさんで宣言します．
作られるのは，指定された `name` のバイナリ変数でエンコードされた線形式を表す **`qbpp::Expr`** オブジェクトです．
プログラムの出力は次のとおりです:
```
x = 1 +x[0] +2*x[1] +4*x[2] uses 3 variables.
y = -10 +y[0] +2*y[1] +4*y[2] +8*y[3] +5*y[4] uses 5 variables.
```

> **WARNING**
> 整数変数に必要なバイナリ変数の数は、その範囲に対して対数的に増加します。
> $u−l$が大きい場合、QUBOのサイズが増大するため、広い整数範囲はできる限り避けるべきです。

## 連立方程式を解く

[整数変数と連立方程式の求解](INTEGER)と同じ連立方程式（解は $x=6$，$y=4$）を，
バイナリエンコードの整数変数で解いてみます:

$$
\begin{aligned}
x + y = 10\\
2x+4y = 28
\end{aligned}
$$

範囲$[0,10]$の整数変数$x$と$y$は、それぞれ4つのバイナリ変数でエンコードされます:

$$
\begin{aligned}
x = x_0 +2x_1 +4x_2 +3x_3\\
y = y_0 +2y_1 +4y_2 +3y_3
\end{aligned}
$$

以下の各ペナルティ式は、対応する方程式が満たされるとき、かつそのときに限り最小値0をとります:

$$
\begin{aligned}
f(x,y) &= (x+y-10)^2\\
&=(x_0 +2x_1 +4x_2 +3x_3+y_0 +2y_1 +4y_2 +3y_3-10)^2\\
g(x,y) &= (2x+4y -28)^2\\
 &= (2\cdot(x_0 +2x_1 +4x_2 +3x_3)+4\cdot( y_0 +2y_1 +4y_2 +3y_3)-28)^2
\end{aligned}
$$

したがって、結合式

$$
\begin{aligned}
h(x,y) &= f(x,y) +g(x,y)
\end{aligned}
$$

は、両方の方程式が同時に満たされるとき、正確にその最小値0を達成します。

以下のQUBO++プログラムはQUBO式$h(x,y)$を構築し、それを解き、結果の$x$と$y$の値をデコードします:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  auto x = 0 <= qbpp::var_int("x") <= 10;
  auto y = 0 <= qbpp::var_int("y") <= 10;

  auto f = x + y == 10;
  auto g = 2 * x + 4 * y == 28;
  auto h = f + g;
  h.simplify_as_binary();

  auto solver = qbpp::EasySolver(h);
  auto sol = solver.search({{"target_energy", 0}});

  std::cout << "sol = " << sol << std::endl;
  std::cout << "x = " << x << " = " << sol(x) << std::endl;
  std::cout << "y = " << y << " = " << sol(y) << std::endl;
  std::cout << "f = " << f << " = " << sol(f) << std::endl;
  std::cout << "g = " << g << " = " << sol(g) << std::endl;
  std::cout << "f.body() = " << f.body() << " = " << f.body(sol) << std::endl;
  std::cout << "g.body() = " << g.body() << " = " << g.body(sol) << std::endl;
}
```

{% endraw %}
まず、整数変数を表す`qbpp::Expr`オブジェクト**`x`**と**`y`**が範囲$[0,10]$で定義されます。
`qbpp::Expr`オブジェクト**`f`**は制約**`x + y == 10`**を表すために作成されます。
内部的には、これはQUBO式`qbpp::sqr(x + y -10)`と等価です。
同様に、**`g`**は制約**`2 * x + 4 * y == 28`**を表します。
結合式**`h = f + g`**は両方の方程式をエンコードします。
Easy Solverのインスタンスが`h`で作成され、最適解がすべての制約を満たすため、目標エネルギーが`0`に設定されます。
`search()`を呼び出すと、すべてのバイナリ変数の最適な割り当てを格納する`qbpp::Sol`オブジェクトsolが返されます。
最後に、プログラムは`sol`、`sol(x)`、`sol(y)`、`sol(f)`、`sol(g)`、`f.body(sol)`、`g.body(sol)`の値を出力します。
ここで、
- **`f`**: `x + y = 10`を強制するペナルティ式。したがって、方程式が満たされるとき、かつそのときに限り`sol(f) = 0`となります。
- **`f.body()`**: 線形式`x + y`。したがって`f.body(sol)`は`x + y`の実際の評価値を返します。

**`g`**と**`g.body()`**についても同様です。

プログラムの出力結果は次のとおりです:

{% raw %}
```
sol = 0:{{x[0],0},{x[1],1},{x[2],1},{x[3],0},{y[0],0},{y[1],0},{y[2],1},{y[3],0}}
x = x[0] +2*x[1] +4*x[2] +3*x[3] = 6
y = y[0] +2*y[1] +4*y[2] +3*y[3] = 4
f = 100 -19*x[0] -36*x[1] -64*x[2] -51*x[3] -19*y[0] -36*y[1] -64*y[2] -51*y[3] +4*x[0]*x[1] +8*x[0]*x[2] +6*x[0]*x[3] +2*x[0]*y[0] +4*x[0]*y[1] +8*x[0]*y[2] +6*x[0]*y[3] +16*x[1]*x[2] +12*x[1]*x[3] +4*x[1]*y[0] +8*x[1]*y[1] +16*x[1]*y[2] +12*x[1]*y[3] +24*x[2]*x[3] +8*x[2]*y[0] +16*x[2]*y[1] +32*x[2]*y[2] +24*x[2]*y[3] +6*x[3]*y[0] +12*x[3]*y[1] +24*x[3]*y[2] +18*x[3]*y[3] +4*y[0]*y[1] +8*y[0]*y[2] +6*y[0]*y[3] +16*y[1]*y[2] +12*y[1]*y[3] +24*y[2]*y[3] = 0
g = 784 -108*x[0] -208*x[1] -384*x[2] -300*x[3] -208*y[0] -384*y[1] -640*y[2] -528*y[3] +16*x[0]*x[1] +32*x[0]*x[2] +24*x[0]*x[3] +16*x[0]*y[0] +32*x[0]*y[1] +64*x[0]*y[2] +48*x[0]*y[3] +64*x[1]*x[2] +48*x[1]*x[3] +32*x[1]*y[0] +64*x[1]*y[1] +128*x[1]*y[2] +96*x[1]*y[3] +96*x[2]*x[3] +64*x[2]*y[0] +128*x[2]*y[1] +256*x[2]*y[2] +192*x[2]*y[3] +48*x[3]*y[0] +96*x[3]*y[1] +192*x[3]*y[2] +144*x[3]*y[3] +64*y[0]*y[1] +128*y[0]*y[2] +96*y[0]*y[3] +256*y[1]*y[2] +192*y[1]*y[3] +384*y[2]*y[3] = 0
f.body() = x[0] +2*x[1] +4*x[2] +3*x[3] +y[0] +2*y[1] +4*y[2] +3*y[3] = 10
g.body() = 2*x[0] +4*x[1] +8*x[2] +6*x[3] +4*y[0] +8*y[1] +16*y[2] +12*y[3] = 28
```
{% endraw %}

これにより、`x`、`y`、および制約式`f`、`g`、`f.body()`、`g.body()`の値が解と整合していることが確認できます。
[整数変数](INTEGER)で書いた場合の式 $5x^2+18xy+17y^2-132x-244y+884$（6 項）に比べ，
バイナリ変数のペナルティ式は項の数が大きく増えることも分かります．

> **WARNING**
> QUBO++は、左辺が式で右辺が整数の場合にのみ`==`演算子をサポートしています。
> 整数`==`式や式`==`式の形式の比較はサポートされていません。
> `a == b` のような変数どうしの比較は同じ変数かどうかを調べるもので、制約にはなりません（式の中で使うとコンパイル時に拒否されます）。
> 詳細は[**比較演算子**](COMPARISON)で説明しています。

## 積と HUBO 式

バイナリエンコードの整数変数どうしの積は，バイナリ変数の 2 次式になります．
たとえば[因数分解](FACTORIZATION)の式 $(pq-35)^2$ を `var_int` で書くと，
$pq$ が 2 次式なので，その 2 乗は 4 次式，つまり HUBO 式になります:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  auto p = 2 <= qbpp::var_int("p") <= 5;
  auto q = 6 <= qbpp::var_int("q") <= 17;

  auto f = p * q == 35;
  f.simplify_as_binary();
  std::cout << "f = " << f << std::endl;
  std::cout << "f.body() = " << f.body() << std::endl;

  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"target_energy", 0}});

  std::cout << "sol = " << sol << std::endl;
  std::cout << "p = " << sol(p) << std::endl;
  std::cout << "q = " << sol(q) << std::endl;
  std::cout << "f(sol) = " << f(sol) << std::endl;
  std::cout << "f.body(sol) = " << f.body(sol) << std::endl;
}
```
{% endraw %}

このプログラムでは、式 `p * q == 35` が自動的に `qbpp::sqr(p * q - 35)` に変換され、等式が満たされたときにエネルギー値0を達成します。`f` は制約式の `qbpp::Expr` で、展開後のペナルティ `qbpp::sqr(p * q - 35)` と元の式 `p * q` の両方を保持します。`f` 自身は式 `qbpp::sqr(p * q - 35)` を表し、`f.body()` は元の式 `p * q` を返します。`f.simplify_as_binary()` は `f` 自身（ペナルティ）と `f.body()`（元の式）の両方を同時に簡約します。

このプログラムの出力は以下の通りです:

{% raw %}
```
f = 529 -240*p[0] -408*p[1] -88*q[0] -168*q[1] -304*q[2] -304*q[3] +144*p[0]*p[1] -5*p[0]*q[0] +40*p[0]*q[2] +40*p[0]*q[3] +16*p[1]*q[0] +56*p[1]*q[1] +208*p[1]*q[2] +208*p[1]*q[3] +16*q[0]*q[1] +32*q[0]*q[2] +32*q[0]*q[3] +64*q[1]*q[2] +64*q[1]*q[3] +128*q[2]*q[3] +52*p[0]*p[1]*q[0] +112*p[0]*p[1]*q[1] +256*p[0]*p[1]*q[2] +256*p[0]*p[1]*q[3] +20*p[0]*q[0]*q[1] +40*p[0]*q[0]*q[2] +40*p[0]*q[0]*q[3] +80*p[0]*q[1]*q[2] +80*p[0]*q[1]*q[3] +160*p[0]*q[2]*q[3] +48*p[1]*q[0]*q[1] +96*p[1]*q[0]*q[2] +96*p[1]*q[0]*q[3] +192*p[1]*q[1]*q[2] +192*p[1]*q[1]*q[3] +384*p[1]*q[2]*q[3] +16*p[0]*p[1]*q[0]*q[1] +32*p[0]*p[1]*q[0]*q[2] +32*p[0]*p[1]*q[0]*q[3] +64*p[0]*p[1]*q[1]*q[2] +64*p[0]*p[1]*q[1]*q[3] +128*p[0]*p[1]*q[2]*q[3]
f.body() = 12 +6*p[0] +12*p[1] +2*q[0] +4*q[1] +8*q[2] +8*q[3] +p[0]*q[0] +2*p[0]*q[1] +4*p[0]*q[2] +4*p[0]*q[3] +2*p[1]*q[0] +4*p[1]*q[1] +8*p[1]*q[2] +8*p[1]*q[3]
sol = 0:{{p[0],1},{p[1],1},{q[0],1},{q[1],0},{q[2],0},{q[3],0}}
p = 5
q = 7
f(sol) = 0
f.body(sol) = 35
```
{% endraw %}
出力から、式 `f` が4次の項を含んでおり、HUBO式であることが確認できます。
外部の QUBO ソルバーに渡すには，さらに[HUBO の QUBO への変換](REDUCE)で 2 次式に変換します．

## `binarize()` による変換

[整数変数](INTEGER)（`int_var`）で書いたモデルは，
**`qbpp::binarize()`** でバイナリエンコードの整数変数のモデルに変換できます:

{% raw %}
```cpp
#include <qbpp/exhaustive_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto x = 0 <= qbpp::int_var("x") <= 10;
  auto f = x * x - 4 * x;
  auto g = qbpp::binarize(f);
  g.simplify_as_binary();
  auto solver = qbpp::ExhaustiveSolver(g);
  auto sol = solver.search();
  std::cout << "minimum = " << sol.energy() << std::endl;
  std::cout << "x = " << sol(x) << std::endl;
}
```
{% endraw %}

プログラムの出力は以下の通りです:

```
minimum = -4
x = 2
```

`binarize()` で変換したモデルの解からも，`sol(x)` で元の整数変数の値を
読み出せます（置き換えられたビットの値から復元されます）．
`qbpp::cons()` で書いた制約も外部の QUBO ソルバーに渡すには，
[`qbpp::expand_cons()`](CONSTRAINTS#従来のペナルティ式への展開) でペナルティ式に展開します．

## 使い分けの指針

- QUBO++ にバンドルされているソルバーや MIP ソルバーで解くモデルには，
  [整数変数](INTEGER)（`int_var`）を使ってください．
- バイナリ変数しか扱えない外部の QUBO ソルバーに渡すモデルは，
  `var_int` で書くか，`int_var` で書いて `qbpp::binarize()` で変換してください．
