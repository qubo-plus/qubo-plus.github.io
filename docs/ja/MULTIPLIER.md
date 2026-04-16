---
layout: default
nav_exclude: true
title: "Multiplier Simulation"
nav_order: 51
lang: ja
hreflang_alt: "en/MULTIPLIER"
hreflang_lang: "en"
---

# 乗算器シミュレーションと因数分解
2つの整数の乗算は加算を用いて実行できます。
このセクションでは、全加算器を使って2つの4ビット整数の乗算器を設計します。
以下の図は、2つの4ビット整数 $x_3x_2x_1x_0$ と $y_3y_2y_1y_0$ を乗算して8ビット整数 $z_7z_6z_5z_4z_3z_2z_1z_0$ を得る方法を示しています。
この図では、$p_{i,j}=x_iy_j$ ($0\leq i,j\leq 3$) であり、これらの部分積を加算して最終的な8ビットの結果を計算します。

<p align="center">
 <img src="../images/multiplication.svg" alt="4-bit multiplication" width="50%">
</p>

2つの4ビット整数 $a_3a_2a_1a_0$ と $b_3b_2b_1b_0$ の和を計算し、5ビットの和 $z_4z_3z_2z_1z_0$ を出力する4ビットリプルキャリー加算器を使用します。
これは、キャリーを伝搬する5ビットのキャリー線 $c_4c_3c_2c_1c_0$ で接続された4つの全加算器で構成されます。

<p align="center">
 <img src="../images/adder4.svg" alt="The 4-bit ripple carry adder" width="50%">
</p>

4ビット乗算器は3つの4ビット加算器を使って構築できます。
以下に示すように、中間の和ビットを伝搬するためにワイヤ $c_{i,j}$ ($0\leq i\leq 2, 0\leq j\leq 3$) で接続されています:
<p align="center">
 <img src="../images/multiplier.svg" alt="The 4-bit multiplier using three 4-bit adders" width="50%">
</p>

## 乗算器のQUBO定式化
`N`ビット乗算器をシミュレートするためのQUBO定式化を示します。
そのために、全加算器、加算器、乗算器を構築する関数を実装します。

### 全加算器
以下のQUBO式は、3つの入力ビット `a`、`b`、`i` と2つの出力ビット（キャリー出力 `o` と和 `s`）を持つ全加算器をシミュレートします:
```cpp
qbpp::Expr fa(const qbpp::Expr& a, const qbpp::Expr& b, const qbpp::Expr& i,
              const qbpp::Expr& o, const qbpp::Expr& s) {
  return (a + b + i) - (2 * o + s) == 0;
}
```
関数 `fa` は、全加算器の入力ビットと出力ビットの間の整合性を強制する式を返します。

### 加算器
配列 `a`、`b`、`s` が整数を表すとします。
`a` と `b` はそれぞれ `N` 個の要素を持ち `N` ビット整数を表し、`s` は `N + 1` 個の要素を持ち `(N + 1)` ビット整数を表すと仮定します。
以下の関数 `adder` は、`a + b == s` が成り立つとき、かつそのときに限り最小値0となるQUBO式を返します。
`a`、`b`、`s` は要素型が異なる配列（`qbpp::Var`、`qbpp::Expr`、`qbpp::int_array` による整数定数など）を受け取れるように、関数をテンプレートとして書きます:
{% raw %}
```cpp
template <typename A, typename B, typename S>
qbpp::Expr adder(const A& a, const B& b, const S& s) {
  auto N = a.size();
  auto c = qbpp::var("_c", N + 1);
  auto f = qbpp::expr();
  for (size_t j = 0; j < N; ++j) {
    f += fa(qbpp::Expr(a[j]), qbpp::Expr(b[j]), qbpp::Expr(c[j]), qbpp::Expr(c[j + 1]), qbpp::Expr(s[j]));
  }
  f.replace({{qbpp::Var(c[0]), 0}, {qbpp::Var(c[N]), qbpp::Expr(s[N])}});
  return f;
}
```
{% endraw %}
この関数では、`c` は `N + 1` 個の変数の配列であり、`fa` ブロックのキャリー出力信号とキャリー入力信号を接続して `N` ビットのリプルキャリー加算器を構成するために使用されます。

### 乗算器
配列 `x`、`y`、`z` が整数を表すとします。
`x` と `y` はそれぞれ `N` 個の要素を持ち、`z` は `2 * N` 個の要素を持つと仮定します。
以下の関数 `multiplier` は、`x * y == z` が成り立つとき、かつそのときに限り最小値0となるQUBO式を返します。
`adder` と同じ理由で、呼び出し側が `Array<1, qbpp::Var>` / `Array<1, qbpp::Expr>` / `Array<1, coeff_t>` を自由に組み合わせて渡せるように、テンプレートとして書きます:
```cpp
template <typename X, typename Y, typename Z>
qbpp::Expr multiplier(const X& x, const Y& y, const Z& z) {
  auto N = x.size();
  auto c = qbpp::var("c", N - 1, N + 1);

  auto f = qbpp::expr();

  for (size_t i = 0; i < N - 1; ++i) {
    auto b = qbpp::expr(N);
    for (size_t j = 0; j < N; ++j) {
      b[j] = qbpp::Expr(x[i + 1]) * qbpp::Expr(y[j]);
    }

    auto a = qbpp::expr(N);
    if (i == 0) {
      for (size_t j = 0; j < N - 1; ++j) {
        a[j] = qbpp::Expr(x[0]) * qbpp::Expr(y[j + 1]);
      }
      a[N - 1] = 0;
    } else {
      for (size_t j = 0; j < N; ++j) {
        a[j] = qbpp::Expr(c[i - 1][j + 1]);
      }
    }

    auto s = qbpp::expr(N + 1);
    for (size_t j = 0; j < N + 1; ++j) {
      s[j] = qbpp::Expr(c[i][j]);
    }
    f += adder(a, b, s);
  }
  f += qbpp::Expr(z[0]) - qbpp::Expr(x[0]) * qbpp::Expr(y[0]) == 0;

  qbpp::MapList ml;
  for (size_t i = 0; i < N - 2; ++i) {
    ml.push_back({qbpp::Var(c[i][0]), qbpp::Expr(z[i + 1])});
  }
  for (size_t i = 0; i < N + 1; ++i) {
    ml.push_back({qbpp::Var(c[N - 2][i]), qbpp::Expr(z[N + i - 1])});
  }
  return f.replace(ml).simplify_as_binary();
}
```
この関数は、`N-1` 個の `N` ビット加算器を接続するために `(N-1)x(N+1)` の `qbpp::Var` オブジェクトの行列 `c` を使用します。
`z` の各ビットは `c` の1つの要素に対応するため、その対応関係が `ml` に定義され、`replace()` を使って置換が実行されます。

## 因数分解のためのQUBO++プログラム
関数 `multiplier` を使用して、合成整数を2つの因数に分解できます。
以下のプログラムは4ビット乗算器を構築します:
- `x`: 4個のバイナリ変数、
- `y`: 4個のバイナリ変数、
- `z`: 定数配列 `{1, 1, 1, 1, 0, 0, 0, 1}`（8ビット整数 `10001111` すなわち `143` を表す）。結果の式を `f` に格納します:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

qbpp::Expr fa(const qbpp::Expr& a, const qbpp::Expr& b, const qbpp::Expr& i,
              const qbpp::Expr& o, const qbpp::Expr& s) {
  return (a + b + i) - (2 * o + s) == 0;
}

template <typename A, typename B, typename S>
qbpp::Expr adder(const A& a, const B& b, const S& s) {
  auto N = a.size();
  auto c = qbpp::var("_c", N + 1);
  auto f = qbpp::expr();
  for (size_t j = 0; j < N; ++j) {
    f += fa(qbpp::Expr(a[j]), qbpp::Expr(b[j]), qbpp::Expr(c[j]), qbpp::Expr(c[j + 1]), qbpp::Expr(s[j]));
  }
  return f.replace({{qbpp::Var(c[0]), 0}, {qbpp::Var(c[N]), qbpp::Expr(s[N])}});
}

template <typename X, typename Y, typename Z>
qbpp::Expr multiplier(const X& x, const Y& y, const Z& z) {
  auto N = x.size();
  auto c = qbpp::var("c", N - 1, N + 1);

  auto f = qbpp::expr();

  for (size_t i = 0; i < N - 1; ++i) {
    auto b = qbpp::expr(N);
    for (size_t j = 0; j < N; ++j) {
      b[j] = qbpp::Expr(x[i + 1]) * qbpp::Expr(y[j]);
    }

    auto a = qbpp::expr(N);
    if (i == 0) {
      for (size_t j = 0; j < N - 1; ++j) {
        a[j] = qbpp::Expr(x[0]) * qbpp::Expr(y[j + 1]);
      }
      a[N - 1] = 0;
    } else {
      for (size_t j = 0; j < N; ++j) {
        a[j] = qbpp::Expr(c[i - 1][j + 1]);
      }
    }

    auto s = qbpp::expr(N + 1);
    for (size_t j = 0; j < N + 1; ++j) {
      s[j] = qbpp::Expr(c[i][j]);
    }
    f += adder(a, b, s);
  }
  f += qbpp::Expr(z[0]) - qbpp::Expr(x[0]) * qbpp::Expr(y[0]) == 0;

  qbpp::MapList ml;
  for (size_t i = 0; i < N - 2; ++i) {
    ml.push_back({qbpp::Var(c[i][0]), qbpp::Expr(z[i + 1])});
  }
  for (size_t i = 0; i < N + 1; ++i) {
    ml.push_back({qbpp::Var(c[N - 2][i]), qbpp::Expr(z[N + i - 1])});
  }
  return f.replace(ml).simplify_as_binary();
}

int main() {
  auto x = qbpp::var("x", 4);
  auto y = qbpp::var("y", 4);
  auto z = qbpp::int_array({1, 1, 1, 1, 0, 0, 0, 1});
  auto f = multiplier(x, y, z).simplify_as_binary();

  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"target_energy", 0}});

  for (size_t i = x.size(); i > 0; --i) {
    std::cout << sol(x[i - 1]);
  }
  std::cout << " * ";
  for (size_t i = y.size(); i > 0; --i) {
    std::cout << sol(y[i - 1]);
  }
  std::cout << " = ";
  for (size_t i = z.size(); i > 0; --i) {
    std::cout << z[i - 1];
  }
  std::cout << std::endl;
}
```
{% endraw %}
Easy Solverが `f` に対して実行され、得られた解が `sol` に格納されます。
`x` と `y` の結果の値は以下のように出力されます:
```
1011 * 1101 = 10001111
```
この出力は $11\times 13 = 143$ を示しており、因数分解の結果を実証しています。
