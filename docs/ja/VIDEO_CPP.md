---
last_modified: 2026-10-26
layout: default
nav_exclude: true
title: "動画：C++ 版"
description: "動画「QUBO++ C++ 版」の章ごとの要点と、動画に出てくるプログラムと出力。"
lang: ja
hreflang_alt: "en/VIDEO_CPP"
hreflang_lang: "en"
video: cpp
---

# 動画：C++ 版

動画「QUBO++ C++ 版」の手引きです。
章ごとに、要点と動画に出てくるプログラム・出力、詳しい説明のページへのリンクをまとめています。
「▶ 動画の … から再生」をクリックすると、その場面から再生します。
動画では一部を省略して見せているプログラムも、ここではそのまま実行できる形で載せています。

{% include video_embed.html slug="cpp" %}

この動画で扱うこと：

- C++ 版と Python 版の関係（同じライブラリと同じソルバー）と、同じプログラムを並べた比較
- `g++` でのコンパイルと実行、よく使う書き方の対応、マクロで係数とエネルギーの型を選ぶ方法
- 変数・項・式と配列の型、`auto` の落とし穴、型の検査でコンパイルのときに見つかる間違い
- 小数の係数の警告と、代入がコピーかどうかの違い
- 式を作るループの速さ（単純なループと、分岐のあるループ）と、どちらを選ぶか

[動画（チュートリアル）](VIDEOS)の一覧に戻る

## C++ 版と Python 版

### 同じライブラリと同じソルバー

{% include video_seek.html t="2:32" %}

QUBO++ には C++ 版と Python 版があります。

| | C++（QUBO++） | Python（PyQBPP） |
|---|---|---|
| インストール | `sudo apt install qbpp` | `pip install pyqbpp` |
| 使い始め | `#include <qbpp/qbpp.hpp>` | `import pyqbpp as qbpp` |
| 実行 | `g++` でコンパイル → `./test` | `python3 test.py` |

どちらも中では同じライブラリと同じソルバー（EasySolver や ABS3Solver など）を使うので、解く速さは同じです。
どちらも Linux の amd64 と arm64 の計算機で動きます。
違うのは、式を作る部分の速さと、プログラムの書き方です。

詳しくは[インストール](INSTALL)と[C++ と Python](CPP_VS_PYTHON)をご覧ください。

### 同じプログラムを並べる

{% include video_seek.html t="4:05" %}

3 つの変数 a, b, c で $(a+2b+3c-4)^2$ の式 f を作り、EasySolver で f を最小にする解を探します。
C++ ではヘッダファイルを `#include` し、`main` 関数の中に書きます。
変数の宣言には `auto` を使い、文の終わりにはセミコロンを付けます。
ソルバーのパラメータは、名前と値の組を波かっこで並べて渡します。

{% raw %}
```cpp
#include <qbpp/easy_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto a = qbpp::var("a");
  auto b = qbpp::var("b");
  auto c = qbpp::var("c");
  auto f = qbpp::sqr(a + 2 * b + 3 * c - 4);
  f.simplify_as_binary();
  std::cout << "f = " << f << std::endl;
  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"time_limit", 10}, {"target_energy", 0}});
  std::cout << "sol = " << sol << std::endl;
}
```
{% endraw %}

出力：

{% raw %}
```
f = 16 -7*a -12*b -15*c +4*a*b +6*a*c +12*b*c
sol = 0:{{a,1},{b,0},{c,1}}
```
{% endraw %}

同じことを Python 版で書くと、次のとおりです。

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
f = qbpp.sqr(a + 2 * b + 3 * c - 4)
f.simplify_as_binary()
print("f =", f)
solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=10, target_energy=0)
print("sol =", sol)
```

出力：

```
f = 16 -7*a -12*b -15*c +4*a*b +6*a*c +12*b*c
sol = Sol(energy=0, {a: 1, b: 0, c: 1})
```

展開した f の式はまったく同じです。
解は表示の形が違いますが、中身は同じです（a が 1、b が 0、c が 1 で、エネルギーは 0）。
C++ では、エネルギーが先頭に、変数と値の組が波かっこで並びます。

## コンパイルと実行

{% include video_seek.html t="6:58" %}

C++ のプログラムは、`g++` でコンパイルしてから実行します。
上の C++ のプログラムを `test.cpp` という名前で保存したとすると、次のとおりです。

```bash
g++ test.cpp -o test -std=c++17 -Wfloat-conversion -ldl -pthread
./test
```

出力：

{% raw %}
```
f = 16 -7*a -12*b -15*c +4*a*b +6*a*c +12*b*c
sol = 0:{{a,1},{b,0},{c,1}}
```
{% endraw %}

| オプション | 意味 |
|---|---|
| `-o test` | できる実行ファイルの名前 |
| `-std=c++17` | C++17 の規格でコンパイル |
| `-Wfloat-conversion` | 小数が整数に切り捨てられるときに警告（[小数の係数](#小数の係数)） |
| `-ldl -pthread` | QUBO++ のライブラリを読み込むために必要 |

プログラムを書き換えたら、そのたびにコンパイルし直します。
コンパイルし直さずに実行すると、書き換える前のプログラムが動きます。
Python にはコンパイルの段がないので、書き換えたらすぐに実行できます。

詳しくは[クイックスタート](QUICK)をご覧ください。

## 書き方の違い

### よく使う書き方の対応

{% include video_seek.html t="9:23" %}

{% raw %}
| | C++ | Python |
|---|---|---|
| 変数の配列 | `auto x = qbpp::var("x", 3, 4);` | `x = qbpp.var("x", shape=(3, 4))` |
| 整数変数 | `auto n = 0 <= qbpp::int_var("n") <= 10;` | `n = qbpp.var("n", integer=(0, 10))` |
| 範囲の制約 | `qbpp::cons(1 <= f <= 5)` | `qbpp.cons(f, between=(1, 5))` |
| 行ごとの和 | `qbpp::vector_sum(x, 1)` | `qbpp.vector_sum(x, axis=1)` |
| 探索 | `solver.search({{"time_limit", 10}})` | `solver.search(time_limit=10)` |
| 表示 | `std::cout << f << std::endl;` | `print(f)` |
| einsum | `qbpp::einsum<0>("i,i->", w, x)` | `qbpp.einsum("i,i->", w, x)` |
{% endraw %}

- 範囲の制約は、C++ では `1 <= f <= 5` のように数式のまま書けます。
  Python では `1 <= f <= 5` が真理値（`True` か `False`）しか返せず、式を返せないので、QUBO++ はこの書き方をあえてエラーにしています。Python では `between=` を使います。
- `vector_sum` でどの軸の方向に足すかは、C++ では 2 番目の引数、Python では `axis=` で指定します。
- C++ の `einsum` は、出力の次元を山かっこの中に書きます。矢印の後ろに何もないときは出力が 0 次元（1 つの値）なので `<0>` です。

```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto w = qbpp::array({1, 2, 3});
  auto x = qbpp::var("x", 3);
  auto f = qbpp::einsum<0>("i,i->", w, x);
  std::cout << f << std::endl;
}
```

出力：

```
x[0] +2*x[1] +3*x[2]
```

C++ ではループで書いても十分速いので、`einsum` を使う場面は多くありません。

詳しくは[C++ と Python](CPP_VS_PYTHON)、[範囲制約](RANGE)、[Einsum関数](EINSUM)をご覧ください。

### 係数とエネルギーの型

{% include video_seek.html t="11:50" %}

Python 版ではインポートするモジュールで型を選びましたが、C++ 版ではマクロで選びます。
マクロは、ヘッダを `#include` する前に `#define` します。ヘッダの中でマクロを見て型を決めるので、順番が大事です。
`INTEGER_TYPE_C64E64` では係数も 64 ビットになるので、32 ビットに収まらない係数も書けます。

```cpp
#define INTEGER_TYPE_C64E64
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto f = 3000000000 * x;
  std::cout << f << std::endl;
}
```

出力：

```
3000000000*x
```

マクロは、コンパイルのときに `-D` オプションで指定することもできます。ソースファイルを書き換えずに型を変えられます。

```bash
g++ test.cpp -DINTEGER_TYPE_C64E64 -o test -std=c++17 -Wfloat-conversion -ldl -pthread
```

| C++ のマクロ | Python のインポート |
|---|---|
| `INTEGER_TYPE_C64E64` | `import pyqbpp.c64e64` |
| `INTEGER_TYPE_CPP_INT` | `import pyqbpp.cppint` |
| `DOUBLE_TYPE` | `import pyqbpp.d` |
| `MAXDEG2` | `import pyqbpp.c32e64m2` |

マクロを書かなければ既定の型で、係数は 32 ビット、エネルギーは 64 ビットです。Python 版の既定と同じです。

cppint では、64 ビットに収まらない大きな定数を、文字列で `qbpp::coeff_t` に渡します。
C++ の整数の定数はふつう 64 ビットまでなので、30 桁の数は数字のままでは書けません。

```cpp
#define INTEGER_TYPE_CPP_INT
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto f = x * qbpp::coeff_t("123456789012345678901234567890");
  std::cout << f << std::endl;
}
```

出力：

```
123456789012345678901234567890*x
```

型はコンパイルのときに決まるので、型を変えたらプログラムをコンパイルし直します。

詳しくは[変数・式クラス](VAREXPR)をご覧ください。

## 型

### 変数・項・式

{% include video_seek.html t="14:24" %}

C++ では、変数・項・式はそれぞれ別の型で、名前は `qbpp::Var`、`qbpp::Term`、`qbpp::Expr` です。
`auto` と書くと、右辺の型がそのまま左辺の型になります。

```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto a = qbpp::var("a");  // qbpp::Var（変数）
  auto t = 2 * a;           // qbpp::Term（項）
  auto g = t + 1;           // qbpp::Expr（式）
  std::cout << "t = " << t << std::endl;
  std::cout << "g = " << g << std::endl;
}
```

出力：

```
t = 2*a
g = 1 +2*a
```

`auto f = 0;` と書くと、右辺の 0 は整数なので f は `int` になります。
`int` に `qbpp::Var` を足す演算は用意されていないので、次のプログラムはコンパイルエラーになります。

```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto f = 0;
  f += x;
  std::cout << f << std::endl;
}
```

コンパイルの結果（最初の部分）：

```
c2_auto.cpp: In function ‘int main()’:
c2_auto.cpp:6:5: error: no match for ‘operator+=’ (operand types are ‘int’ and ‘qbpp::Var’)
    6 |   f += x;
      |   ~~^~~~
```

式を足していくときは、`qbpp::Expr` と型を書いて 0 から始めます。

```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  qbpp::Expr f = 0;
  f += x;
  f += 1;
  std::cout << f << std::endl;
}
```

出力：

```
1 +x
```

Python 版では型を気にせずに 0 から足していけましたが、C++ 版では、足していく式は `qbpp::Expr` 型で始めます。

詳しくは[変数・式クラス](VAREXPR)をご覧ください。

### 配列の型

{% include video_seek.html t="16:31" %}

C++ では、配列の型を `qbpp::Array<次元, 要素の型>` で表します。

| 式 | 型 | |
|---|---|---|
| `qbpp::var("x", 3, 4)` | `qbpp::Array<2, qbpp::Var>` | 変数の 2 次元配列 |
| `x + 1` | `qbpp::Array<2, qbpp::Expr>` | 式の 2 次元配列 |
| `qbpp::vector_sum(x, 1)` | `qbpp::Array<1, qbpp::Expr>` | 式の 1 次元配列 |

```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 3, 4);    // qbpp::Array<2, qbpp::Var>
  auto e = x + 1;                   // qbpp::Array<2, qbpp::Expr>
  auto s = qbpp::vector_sum(x, 1);  // qbpp::Array<1, qbpp::Expr>
  std::cout << "e[0] = " << e[0] << std::endl;
  std::cout << "s = " << s << std::endl;
}
```

出力：

```
e[0] = {1 +x[0][0],1 +x[0][1],1 +x[0][2],1 +x[0][3]}
s = {x[0][0] +x[0][1] +x[0][2] +x[0][3],x[1][0] +x[1][1] +x[1][2] +x[1][3],x[2][0] +x[2][1] +x[2][2] +x[2][3]}
```

次元か要素の型が違えば別の型で、代入できません。
変数の 2 次元配列 x に式の 1 次元配列 s を代入しようとすると、コンパイルエラーになります。

```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 3, 4);
  auto s = qbpp::vector_sum(x, 1);
  x = s;  // 間違い: 2 次元の変数の配列に、1 次元の式の配列
  std::cout << x << std::endl;
}
```

コンパイルの結果（最初の部分）：

```
c3_assign.cpp: In function ‘int main()’:
c3_assign.cpp:6:7: error: no match for ‘operator=’ (operand types are ‘qbpp::Array<2, qbpp::Var>’ and ‘qbpp::Array<1, qbpp::Expr>’)
    6 |   x = s;  // 間違い: 2 次元の変数の配列に、1 次元の式の配列
      |       ^
```

Python 版では、同じ `x = s` はエラーになりません。Python の代入は名前の付け替えなので、名前 x が 3 個の式の配列に付け替わります。
C++ 版では、名前ごとに型が決まっていて、違う型のものは入りません。

詳しくは[多次元整数・変数・式](MULTIDIM)をご覧ください。

## 型の検査

### Python は黙って動く

{% include video_seek.html t="18:37" %}

`onehot` 関数は、1 次元の配列 v の要素のうち、ちょうど 1 つが 1 という制約を作るつもりの関数です。
3 行 4 列の x の各行に制約を作るつもりで、うっかり 2 次元の x をそのまま渡しても、Python ではエラーになりません。
`qbpp.sum` が 12 個の要素を全部足すので、12 個全体で 1 つだけが 1 という制約が 1 本できます。

```python
import pyqbpp as qbpp

# v の要素のうち、ちょうど 1 つが 1
def onehot(v):
    return qbpp.cons(qbpp.sum(v) == 1)

x = qbpp.var("x", shape=(3, 4))
f = onehot(x)  # 間違い: x は 2 次元
sol = qbpp.ExhaustiveSolver(f).search()
print(sol(x))
```

出力：

```
[[1, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]
```

1 があるのは最初の行だけで、誤った答えです。エラーも警告も出ないので、答えをよく見ないと気づきません。

### C++ ではコンパイルのときに見つかる

{% include video_seek.html t="20:43" %}

C++ では、関数の引数に型を書きます。引数 v の型は変数の 1 次元配列です（`const` と `&` は、配列をコピーせずに受け取る書き方です）。
2 次元の x をそのまま渡すと、型が合わないのでコンパイルエラーになり、実行ファイルはできません。

```cpp
#include <qbpp/qbpp.hpp>

// v の要素のうち、ちょうど 1 つが 1
qbpp::Expr onehot(const qbpp::Array<1, qbpp::Var>& v) {
  return qbpp::cons(qbpp::sum(v) == 1);
}

int main() {
  auto x = qbpp::var("x", 3, 4);
  qbpp::Expr f = 0;
  f += onehot(x);  // 間違い: x は 2 次元
  std::cout << f << std::endl;
}
```

コンパイルの結果：

```
c3_onehot.cpp: In function ‘int main()’:
c3_onehot.cpp:11:15: error: invalid initialization of reference of type ‘const qbpp::Array<1, qbpp::Var>&’ from expression of type ‘qbpp::Array<2, qbpp::Var>’
   11 |   f += onehot(x);  // 間違い: x は 2 次元
      |               ^
c3_onehot.cpp:4:52: note: in passing argument 1 of ‘qbpp::Expr onehot(const qbpp::Array<1, qbpp::Var>&)’
    4 | qbpp::Expr onehot(const qbpp::Array<1, qbpp::Var>& v) {
      |                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^
```

正しくは、x の 1 行ずつを `onehot` 関数に渡します。`x[i]` は x の i 番目の行で、変数の 1 次元配列なので、型が合います。

{% raw %}
```cpp
#include <qbpp/exhaustive_solver.hpp>
#include <qbpp/qbpp.hpp>

// v の要素のうち、ちょうど 1 つが 1
qbpp::Expr onehot(const qbpp::Array<1, qbpp::Var>& v) {
  return qbpp::cons(qbpp::sum(v) == 1);
}

int main() {
  auto x = qbpp::var("x", 3, 4);
  qbpp::Expr f = 0;
  for (size_t i = 0; i < 3; ++i) f += onehot(x[i]);
  auto sol = qbpp::ExhaustiveSolver(f).search();
  std::cout << sol(x) << std::endl;
}
```
{% endraw %}

出力：

{% raw %}
```
{{1,0,0,0},{0,0,0,1},{1,0,0,0}}
```
{% endraw %}

どの行にも 1 がちょうど 1 つになりました。C++ では、型の検査のおかげで、明らかな間違いがコンパイルのときに分かります。

### 小数の係数

{% include video_seek.html t="22:40" %}

係数を整数として扱うときに `3.5 * x` と書くと、C++ では 3.5 が黙って 3 に切り捨てられます。

```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto f = 3.5 * x;
  std::cout << f << std::endl;
}
```

出力：

```
3*x
```

コンパイルのときに `-Wfloat-conversion` を付けておくと、次の警告が出ます。警告なので、実行ファイルはでき、実行もできます。
小数を書いた場所が分かるので、いつも付けておくと安心です。

```
c4_float.cpp: In function ‘int main()’:
c4_float.cpp:5:12: warning: conversion from ‘double’ to ‘qbpp::coeff_t’ {aka ‘int’} changes value from ‘3.5e+0’ to ‘3’ [-Wfloat-conversion]
    5 |   auto f = 3.5 * x;
      |            ^~~
```

Python では、同じプログラムは実行したときに TypeError になり、その行で止まります。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
f = 3.5 * x
print(f)
```

出力：

```
Traceback (most recent call last):
  File "c4_float.py", line 4, in <module>
    f = 3.5 * x
        ~~~~^~~
TypeError: unsupported operand type(s) for *: 'float' and 'pyqbpp_nb._nb_c32e64m0.Var'
```

小数の係数を使いたいときは、C++ は `DOUBLE_TYPE`、Python は `pyqbpp.d` を使います。

詳しくは[変数・式クラス](VAREXPR)をご覧ください。

## コピー

{% include video_seek.html t="24:30" %}

C++ では、`g = f` で式の中身がコピーされます。あとで f に y を足しても、g は変わりません。

```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto y = qbpp::var("y");
  qbpp::Expr f = x + 1;
  qbpp::Expr g = f;
  f += y;
  std::cout << "f = " << f << std::endl;
  std::cout << "g = " << g << std::endl;
}
```

出力：

```
f = 1 +x +y
g = 1 +x
```

Python では、`g = f` で g と f は同じものを指します（代入は名前の付け替えです）。そのため、f に y を足すと g も変わります。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = x + 1
g = f
f += y
print("f =", f)
print("g =", g)
```

出力：

```
f = 1 +x +y
g = 1 +x +y
```

Python で別のものにしたいときは、`qbpp.Expr(f)` でコピーを作ります。

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = x + 1
g = qbpp.Expr(f)  # コピー
f += y
print("f =", f)
print("g =", g)
```

出力：

```
f = 1 +x +y
g = 1 +x
```

詳しくは[変数・式クラス](VAREXPR)をご覧ください。

## ループの速さ

### 単純なループ

{% include video_seek.html t="26:08" %}

9 頂点の巡回セールスマン問題の巡回路の長さを、3 重のループで作ります。中の 1 行は $9^3 = 729$ 回実行されます。
Python ではこの 3 重のループが遅いので `einsum` の 1 行に書き換えましたが、C++ ではループのままで書けます。

{% raw %}
```cpp
#include <cmath>
#include <qbpp/easy_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  // 9 頂点の座標
  std::vector<std::pair<int, int>> nodes = {
      {10, 12}, {33, 125}, {12, 226}, {121, 11}, {108, 142},
      {111, 243}, {220, 4}, {210, 113}, {211, 233}};
  int n = nodes.size();
  // d[i][j] は頂点 i と j の距離
  std::vector<std::vector<int>> d(n, std::vector<int>(n));
  for (int i = 0; i < n; ++i)
    for (int j = 0; j < n; ++j)
      d[i][j] = std::lround(std::hypot(nodes[i].first - nodes[j].first,
                                       nodes[i].second - nodes[j].second));
  auto x = qbpp::var("x", n, n);
  qbpp::Expr length = 0;
  for (int k = 0; k < n; ++k)
    for (int i = 0; i < n; ++i)
      for (int j = 0; j < n; ++j)
        length += d[i][j] * x[k][i] * x[(k + 1) % n][j];
  auto f = length +
           1000 * qbpp::cons(qbpp::vector_sum(x, 1) == 1) +
           1000 * qbpp::cons(qbpp::vector_sum(x, 0) == 1);
  f.simplify_as_binary();
  auto sol = qbpp::EasySolver(f).search({{"target_energy", 959}});
  std::cout << "length = " << sol(length)
            << "  tour = " << qbpp::onehot_to_int(sol(x)) << std::endl;
}
```
{% endraw %}

動画での出力（巡回路の出発点と向きは実行ごとに変わります）：

```
length = 959  tour = {1,4,2,5,8,7,6,3,0}
```

tour は頂点を訪れる順番です。長さはいつも 959 です。

Python のループでは、中の 1 行を実行するたびに Python がその行を読んでライブラリを呼び出し、この往復が 729 回くり返されます。
C++ のループでも中の 1 行は 729 回実行されますが、コンパイルで機械の命令になっていて、1 回の処理が軽いので、ずっと速く式を作れます。
`einsum` では呼び出しは 1 回で、くり返しはライブラリの中なので、このようにすべての組を掛け合わせる式なら、Python の `einsum` も十分速く動きます。
大きな問題では、コンパイルのときに `-O2` を付けると、もっと速くなります。

詳しくは[TSP](TSP)をご覧ください。

### 分岐のある式

{% include video_seek.html t="28:14" %}

50 個の無線局に、4 つの周波数のどれか 1 つを割り当てます。距離が R = 20 以下の 2 つの局が同じ周波数だと混信します。
変数 `x[i][c]` は、局 i に周波数 c を割り当てるとき 1 です。
近い局の組だけ（ループの中の `if` 文）、同じ周波数なら 1 になる項を足します。
近い組は 111 組あり、1 組から周波数ごとに 1 つずつ項ができるので、項の数は $111 \times 4 = 444$ です。

{% raw %}
```cpp
#include <cmath>
#include <qbpp/easy_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  int n = 50, K = 4;
  double R = 20;
  std::vector<double> px(n), py(n);  // 局の位置（0〜100 の正方形）
  for (int i = 0; i < n; ++i) {
    px[i] = 100 * std::fmod(i * 0.7548776662, 1.0);
    py[i] = 100 * std::fmod(i * 0.5698402910, 1.0);
  }
  auto x = qbpp::var("x", n, K);  // x[i][c] = 1: 局 i に周波数 c
  qbpp::Expr f = 0;
  for (int i = 0; i < n; ++i)
    for (int j = i + 1; j < n; ++j)
      if (std::hypot(px[i] - px[j], py[i] - py[j]) <= R)  // 近い局だけ
        for (int c = 0; c < K; ++c) f += x[i][c] * x[j][c];
  f += 100 * qbpp::cons(qbpp::vector_sum(x, 1) == 1);
  f.simplify_as_binary();
  auto sol = qbpp::EasySolver(f).search({{"target_energy", 0}});
  std::cout << "terms = " << f.term_count() << "  conflicts = " << sol(f) << std::endl;
}
```
{% endraw %}

出力：

```
terms = 444  conflicts = 0
```

各局の周波数が 1 つになる制約は `qbpp::cons` で足しています。解くと混信は 0 になりました。

詳しくは[グラフ彩色](GRAPH_COLOR)をご覧ください。

### Python で書くと

{% include video_seek.html t="29:54" %}

同じ式を Python で作る方法は 2 つあります。
1 つは、C++ と同じ形のループで書く方法です。ただし、50 局なら 1225 組のすべてを Python が 1 つずつ調べるので、局の数が多いととても遅くなります。

```python
import math
import pyqbpp as qbpp

n, K, R = 50, 4, 20
px = [100 * ((i * 0.7548776662) % 1.0) for i in range(n)]  # 局の位置
py = [100 * ((i * 0.5698402910) % 1.0) for i in range(n)]
x = qbpp.var("x", shape=(n, K))  # x[i][c] = 1: 局 i に周波数 c
f = 0
for i in range(n):
    for j in range(i + 1, n):
        if math.hypot(px[i] - px[j], py[i] - py[j]) <= R:  # 近い局だけ
            for c in range(K):
                f += x[i][c] * x[j][c]
f += 100 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
f.simplify_as_binary()
sol = qbpp.EasySolver(f).search(target_energy=0)
print("terms =", f.term_count(), " conflicts =", sol(f))
```

出力：

```
terms = 444  conflicts = 0
```

もう 1 つは、近い組だけ 1 になる n × n の表 A を NumPy で作り、`einsum` で x と掛け合わせる工夫です。
表は 50 × 50 = 2500 マスで、1 のマスは近い組の 111 マスだけですが、項にならないマスまで全部掛け合わせるので、局の数が多いとやはり時間がかかります。

```python
import numpy as np
import pyqbpp as qbpp

n, K, R = 50, 4, 20
i = np.arange(n)
px = 100 * ((i * 0.7548776662) % 1.0)  # 局の位置
py = 100 * ((i * 0.5698402910) % 1.0)
dist = np.hypot(px[:, None] - px[None, :], py[:, None] - py[None, :])
A = np.triu(dist <= R, k=1).astype(int)  # 近い組（i < j）だけ 1 の n × n の表
x = qbpp.var("x", shape=(n, K))
f = qbpp.einsum("ij,ic,jc->", qbpp.array(A.tolist()), x, x)
f += 100 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
f.simplify_as_binary()
sol = qbpp.EasySolver(f).search(target_energy=0)
print("terms =", f.term_count(), " conflicts =", sol(f))
```

出力：

```
terms = 444  conflicts = 0
```

どちらも同じ式ができます。
C++ のループは、組を調べる処理もコンパイルされていて軽く、項を作るのも近い 111 組だけです。
分岐のある式では、C++ の単純なループの方が、どちらよりも速く作れます。

詳しくは[Einsum関数](EINSUM)をご覧ください。

## どちらを選ぶか

### 向いている場面

{% include video_seek.html t="31:42" %}

| C++ が向いている | Python が向いている |
|---|---|
| 問題が大きく、式を作る時間が問題になる（単純なループのままで速い） | 試しながら書きたい（Jupyter などで対話的に） |
| 式を作るループの中に、分岐などがある（近い組だけを `if` で選んで項を作る） | NumPy・pandas などでデータを扱いたい（データの準備から解の分析まで） |
| C++ のアプリケーションに組み込みたい | Python から使う外部のソルバーも試したい（一部は Python 版からだけ使える） |
| 型の検査で、間違いを早く見つけたい（コンパイルのときにエラーになる） | すぐに始めたい（`pip` でインストール、コンパイル不要） |

どちらも中のライブラリとソルバーは同じで、解く速さは同じです。違うのは、式を作る部分の速さと書き方です。

### C++ 版のメリットとデメリット

{% include video_seek.html t="33:51" %}

| メリット | デメリット |
|---|---|
| ループのままで、式を速く作れる | 書き換えるたびにコンパイルが要る |
| 分岐のある式でも速い | `#include` や `main()` など、決まった記述が多い |
| コンパイルのときの型の検査で、明らかな間違いが見つかる | 変数・項・式、配列の次元など、型を意識する必要がある |
| 範囲の制約を `1 <= f <= 5` と数式のまま書ける | Python から使える外部のソルバーの一部は使えない |
| C++ のプログラムに組み込める | `apt` で入れるときは `sudo` が要る |

どちらにも、よいところがあります。まずは、気軽に始められる方を選ぶのがよいでしょう。

## まとめ

{% include video_seek.html t="35:42" %}

- QUBO++ は C++ でも Python でも使えて、ソルバーは同じです。
- C++ では、ヘッダファイルを `#include` して、`main` 関数の中にプログラムを書きます。`g++` でコンパイルしてから実行し、プログラムを書き換えたらコンパイルし直します。
- 係数とエネルギーの型はマクロで選びます。`#include` の前に `INTEGER_TYPE_C64E64` のようなマクロを `#define` します。マクロがなければ、係数は 32 ビット、エネルギーは 64 ビットの整数です。
- 式を足していく変数は、`qbpp::Expr f = 0;` のように式の型で宣言します。`auto` と書くと、0 から始めた変数は `int` になります。
- 配列の型は、`qbpp::Array<1, qbpp::Var>` のように次元と要素の型で決まります。次元や要素の型が違うとコンパイルのときにエラーになるので、明らかな間違いを実行する前に見つけられます。
- C++ なら、ループのままでも、分岐のある式でも、速く式を作れます。Python 版のように、ループを `einsum` などに書き換えなくてもよいのです。
- どちらを選ぶかは、問題の大きさや使い方に合わせて決めます。
