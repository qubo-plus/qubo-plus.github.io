---
last_modified: 2026-10-16
layout: default
nav_exclude: true
title: "番兵と変数の固定"
nav_order: 19
lang: ja
hreflang_alt: "en/SENTINEL"
hreflang_lang: "en"
---

# 番兵と変数の固定

隣り合う要素の組を見る式では、配列の端の要素には片側にしか相手がありません。
配列の外側に値の決まった要素（**番兵**）を置くと、端の要素も内側と同じ式で扱えます。
QUBO++ で番兵を置く方法は 2 通りあります:

- **方法 A**: 番兵を含む式の配列を `qbpp::concat` で作る
- **方法 B**: 番兵の分も変数を用意し、`qbpp::replace` で番兵の値に固定する

配列の内側の変数を 0 や 1 に固定するときも、同じ 2 通りの書き方があります。
このページでは、01 の並びを数える式を例に、2 つの方法を比べます。

## 01 の並びを数える式

$n$ 個の二値変数 $x_0, x_1, \ldots, x_{n-1}$ の左に番兵 $0$ を置いた列を $y$ とします:

$$
(y_0, y_1, \ldots, y_n) = (0, x_0, \ldots, x_{n-1})
$$

この $y$ に対して

$$
t = \sum_{i=0}^{n-1} \overline{y_i}\, y_{i+1}
$$

とすると、各項は $y_i = 0$ かつ $y_{i+1} = 1$ のときだけ $1$ になるので、$t$ は 01 の並びの数です。
左の番兵が $0$ なので、$x_0 = 1$ のときも先頭に 01 が 1 つでき、$t$ は 1 の塊の数に等しくなります。
たとえば $x = 01101$ なら $y = 001101$ で、01 の並びも 1 の塊も 2 つです。
番兵がなければ、$x_0$ から始まる塊は数えられません。
右端の外側に 01 の並びはできないので、右端に番兵は要りません。

## 方法 A: 番兵を含む式の配列を作る

次のプログラムは、`qbpp::concat` で番兵を含む式の配列を作り、$t$ を求めます:

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  const size_t n = 5;
  auto x = qbpp::var("x", n);
  auto y = qbpp::concat(0, x);
  auto ny = qbpp::concat(1, ~x);
  std::cout << "y = " << y << std::endl;
  std::cout << "ny = " << ny << std::endl;

  qbpp::Expr t = 0;
  for (size_t i = 0; i < n; ++i) t += ny[i] * y[i + 1];
  t.simplify_as_binary();
  std::cout << "t = " << t << std::endl;
}
```
{% endraw %}

`qbpp::concat(0, x)` は、変数の配列 `x` の先頭に定数 `0` を連結した式の配列です。
否定リテラル `~` は変数にしか付けられないので、$\overline{y_i}$ の配列 `ny` は、`~x` の先頭に番兵の否定 `1` を連結して別に作ります。

このプログラムの出力は次のとおりです:

{% raw %}
```
y = {0,x[0],x[1],x[2],x[3],x[4]}
ny = {1,~x[0],~x[1],~x[2],~x[3],~x[4]}
t = x[0] +x[1] +x[2] +x[3] +x[4] -x[0]*x[1] -x[1]*x[2] -x[2]*x[3] -x[3]*x[4]
```
{% endraw %}

番兵の項 `ny[0] * y[1]` は、式を作る時点で `x[0]` になっています。

## 方法 B: 番兵の分も変数を用意して replace で固定する

方法 B では、番兵を含む長さ $n+1$ の変数の配列 `z` で式を作り、番兵 `z[0]` を `qbpp::replace` で $0$ に固定します。
`z[i + 1]` が $x_i$ にあたります:

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  const size_t n = 5;
  auto z = qbpp::var("z", n + 1);
  qbpp::Expr t = 0;
  for (size_t i = 0; i < n; ++i) t += ~z[i] * z[i + 1];
  std::cout << "t = " << t << std::endl;

  qbpp::MapList ml({{z[0], 0}, {~z[0], 1}});
  auto g = qbpp::replace(t, ml);
  g.simplify_as_binary();
  std::cout << "g = " << g << std::endl;
}
```
{% endraw %}

このプログラムの出力は次のとおりです:

{% raw %}
```
t = ~z[0]*z[1] +~z[1]*z[2] +~z[2]*z[3] +~z[3]*z[4] +~z[4]*z[5]
g = z[1] +z[2] +z[3] +z[4] +z[5] -z[1]*z[2] -z[2]*z[3] -z[3]*z[4] -z[4]*z[5]
```
{% endraw %}

変数の名前が `x[i]` から `z[i+1]` に変わっただけで、方法 A と同じ式になっています。

`t` には否定リテラル `~z[0]` がそのまま現れます。
`qbpp::replace` は `z[0]` と `~z[0]` を別のキーとして扱うので、両方を指定します（[置換関数](REPLACE)）。
`~z[0]` を書き忘れて `ml` を {% raw %}`{{z[0], 0}}`{% endraw %} だけにすると、エラーにはならず、
`g = z[1] +z[2] +z[3] +z[4] +z[5] -z[0]*z[1] -z[1]*z[2] -z[2]*z[3] -z[3]*z[4] -z[4]*z[5]` のように、番兵の `z[0]` が自由な変数として残ってしまいます。

`replace` の前に `t.simplify_as_binary()` を呼ぶと、2 次以下の項の `~z[0]` は `1 - z[0]` に展開されるので、キーは `z[0]` だけでも正しく置き換わります。
ただし、簡約が 1 回増える分だけ時間がかかります。また、3 次以上の項の否定リテラルは展開されずに残るので、否定リテラルもキーに入れておくのが確実です。

## 内側の変数も固定する

次に、番兵に加えて $x_1 = x_3 = 1$ と固定し、$t$（1 の塊の数）を最小にする解を求めます。

### 方法 A

方法 A では、式の配列 `y` と `ny` の要素に固定する値を代入します:

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  const size_t n = 5;
  auto x = qbpp::var("x", n);
  auto y = qbpp::concat(0, x);
  auto ny = qbpp::concat(1, ~x);
  y[2] = 1;
  ny[2] = 0;
  y[4] = 1;
  ny[4] = 0;
  std::cout << "y = " << y << std::endl;
  std::cout << "ny = " << ny << std::endl;

  qbpp::Expr t = 0;
  for (size_t i = 0; i < n; ++i) t += ny[i] * y[i + 1];
  t.simplify_as_binary();
  std::cout << "t = " << t << std::endl;

  auto sol = qbpp::ExhaustiveSolver(t).search();
  std::cout << "sol = " << sol << std::endl;
}
```
{% endraw %}

このプログラムの出力は次のとおりです:

{% raw %}
```
y = {0,x[0],1,x[2],1,x[4]}
ny = {1,~x[0],0,~x[2],0,~x[4]}
t = 2 -x[2]
sol = 1:{{x[2],1}}
```
{% endraw %}

$x_1$ と $x_3$ の 2 つの塊は、$x_2 = 1$ にすると 1 つにつながるので、$t = 2 - x_2$ です。
$x_0$ と $x_4$ は $t$ から消えています。
$x_0$ は番兵の項 $x_0$ と次の項 $\overline{x_0} \cdot 1$ の和が $1$ になって打ち消し合い、$x_4$ は $\overline{x_3}$ が $0$ なので項ごと消えるためです。
どちらも、塊の数を変えない変数です。

固定する値は `y` と `ny` の両方に代入する必要があります。
`ny` への代入を忘れると、エラーにはならず、`t = 2 +x[4] -x[1]*x[2] -x[3]*x[4]` のように、固定したはずの `x[1]` と `x[3]` が残ってしまいます。

解 `sol` に含まれるのは `t` に現れる `x[2]` だけです。
`sol(x)` で配列全体を読もうとすると、解にない `x[0]` などを読むことになるのでエラーになります（[解](QR_SOLUTION)）。
方法 A には固定の対応表がないので、解に含まれない変数の値は自分で決める必要があります。

### 方法 B

方法 B では、固定する変数を対応表 `ml` に加えるだけです:

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  const size_t n = 5;
  auto z = qbpp::var("z", n + 1);
  qbpp::Expr t = 0;
  for (size_t i = 0; i < n; ++i) t += ~z[i] * z[i + 1];

  qbpp::MapList ml({{z[0], 0}, {~z[0], 1},
                    {z[2], 1}, {~z[2], 0},
                    {z[4], 1}, {~z[4], 0}});
  auto g = qbpp::replace(t, ml);
  g.simplify_as_binary();
  std::cout << "g = " << g << std::endl;

  auto sol = qbpp::ExhaustiveSolver(g).search();
  std::cout << "sol = " << sol << std::endl;
  auto full_sol = qbpp::Sol(t).set(sol, ml);
  std::cout << "full_sol = " << full_sol << std::endl;
  std::cout << "x = " << full_sol(z(qbpp::slice(1, n + 1))) << std::endl;
}
```
{% endraw %}

このプログラムの出力は次のとおりです:

{% raw %}
```
g = 2 -z[3]
sol = 1:{{z[3],1}}
full_sol = 1:{{z[0],0},{z[1],0},{z[2],1},{z[3],1},{z[4],1},{z[5],0}}
x = {0,1,1,1,0}
```
{% endraw %}

`qbpp::Sol(t).set(sol, ml)` は、元の式 `t` のすべての変数を持つ解を作り、`sol` の値と `ml` の固定値を設定します。
`g` から消えた `z[1]` と `z[5]` は $0$ になります。
番兵は問題の変数ではないので、内側を `z(qbpp::slice(1, n + 1))` で取り出して $x$ として読みます。
番兵の `z[0]` は `sol` に含まれないので、`sol(z)` はエラーになります。

## 2 つの方法の比較

| | 方法 A: 式の配列 | 方法 B: 変数の配列と replace |
|:---|:---|:---|
| 固定の書き方 | 式の配列の要素に値を代入する | 対応表に変数と値を加える |
| 否定リテラル | 否定側の式の配列を別に作り、両方に代入する | 変数と否定リテラルの両方をキーにする |
| 変数の添字 | 問題の変数 `x` の添字のまま | 番兵の分だけずれる |
| 解の読み出し | 番兵だけなら `sol(x)` でそのまま読める。内側を固定すると、解に含まれる変数だけを読む | `qbpp::Sol(t).set(sol, ml)` で全体の解に戻し、内側を取り出して読む |

どちらの方法でも、否定リテラルの側を書き忘れるとエラーにはならず、固定したはずの変数が残った式ができます。

式を作る速さとメモリは、固定する変数の数で変わります:

- **番兵だけ、または固定する変数が少ないとき**は、方法 B のほうが速く、メモリも少なくて済みます。
  方法 A は `qbpp::concat` による配列のコピーがあり、式の配列の要素どうしの積も、変数どうしの積より時間がかかるためです。
- **多くの変数を固定するとき**は、方法 A のほうが速く、メモリも少なくて済みます。
  方法 A では固定した部分が式を作る時点で定数になって消えますが、方法 B はすべての変数で式を作ってから置き換えるためです。

[ハーフトーニング](HALFTONING)の配列演算版では、2 次元の画像の周囲に方法 A でゼロの番兵を置いています。
