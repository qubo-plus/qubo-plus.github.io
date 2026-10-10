---
last_modified: 2026-10-09
layout: default
nav_exclude: true
title: "再帰による素因数分解"
nav_order: 63
lang: ja
hreflang_alt: "en/PRIME_FACTORIZATION"
hreflang_lang: "en"
---

# 再帰による素因数分解

[HUBO 式による因数分解](FACTORIZATION)では、2 つの素数の積を 2 つの因数に分けました。
このページでは、これを繰り返して、整数を素因数に分解します。
1 回の分解では、ネイティブ整数変数 `int_var` と `qbpp::cons()` を使い、$xy = n$ となる $x$、$y$ を Easy Solver で探します。
分解できたら、$x$ と $y$ のそれぞれを同じように分解します。

## 1 回の分解

合成数 $n$ は、$2 \le x \le y$ を満たす 2 つの整数の積 $n = xy$ で表せます。
$x \le y$ なら $x^2 \le xy = n \le y^2$ なので、$x \le \sqrt{n} \le y$ です。
また $x \ge 2$ なので $y \le n/2$ です。
そこで、次の範囲で

$$
2 \le x \le \lfloor\sqrt{n}\rfloor, \qquad \lfloor\sqrt{n}\rfloor \le y \le \lfloor n/2 \rfloor
$$

制約

$$
xy = n
$$

を満たす $x$、$y$ を探します。
$x \le y$ は、$x$ と $y$ を入れ替えただけの解を除くための条件です。

## 素数判定

$n$ が素数のときは、この制約を満たす $x$、$y$ はありません。
ところが、ソルバーは「解がない」ことを示せません。
解が見つからないのが、$n$ が素数だからなのか、探しきれなかったからなのかを区別できず、制限時間いっぱいまで探し続けます。
そこで、素数かどうかは QUBO++ を使わずに Boost の `miller_rabin_test`（Miller–Rabin 法）で判定し、合成数だけをソルバーで分解します。
apt で QUBO++ をインストールすると、Boost も一緒にインストールされます。

## プログラム

{% raw %}
```cpp
#define INTEGER_TYPE_C64E128
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>
#include <boost/multiprecision/miller_rabin.hpp>

#include <algorithm>
#include <cmath>
#include <cstdint>
#include <iostream>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

// floor(sqrt(n))
int64_t isqrt(int64_t n) {
  auto r = static_cast<int64_t>(std::sqrt(static_cast<double>(n)));
  while (r * r > n) --r;
  while ((r + 1) * (r + 1) <= n) ++r;
  return r;
}

std::pair<int64_t, int64_t> split(int64_t n) {
  int64_t r = isqrt(n);
  auto x = 2 <= qbpp::int_var("x") <= r;
  auto y = r <= qbpp::int_var("y") <= n / 2;
  auto f = qbpp::cons(x * y == n);
  f.simplify_as_binary();
  auto sol = qbpp::EasySolver(f).search({{"time_limit", 10}, {"target_energy", 0}});
  return {static_cast<int64_t>(sol(x)), static_cast<int64_t>(sol(y))};
}

std::vector<int64_t> factorize(int64_t n) {
  if (boost::multiprecision::miller_rabin_test(static_cast<uint64_t>(n), 25)) return {n};
  if (n == 4) return {2, 2};  // x and y would both be the constant 2
  auto [x, y] = split(n);
  if (x * y != n)
    throw std::runtime_error("no factor of " + std::to_string(n) + " found within the time limit");
  std::cout << n << " = " << x << " * " << y << std::endl;
  auto fx = factorize(x);
  auto fy = factorize(y);
  fx.insert(fx.end(), fy.begin(), fy.end());
  return fx;
}

int main() {
  for (int64_t n : {4294967297LL, 999999999999LL}) {
    auto factors = factorize(n);
    std::sort(factors.begin(), factors.end());
    std::cout << n << " =";
    for (size_t i = 0; i < factors.size(); ++i) std::cout << (i == 0 ? " " : " * ") << factors[i];
    std::cout << std::endl;
  }
}
```
{% endraw %}

- `split(n)` は、上の範囲のネイティブ整数変数 `x`、`y` を作り、`qbpp::cons(x * y == n)` を Easy Solver で解きます。
  `target_energy` を 0 にしているので、制約を満たす解が見つかった時点で探索を止めます。
- `factorize(n)` は、`n` が素数ならそのまま返し、そうでなければ `split(n)` で 2 つに分けて、それぞれを再帰的に分解します。
  10 秒以内に分解が見つからなければ、例外を投げて止まります。
- `n` が 4 のときは、`x` と `y` の範囲がどちらも 2 だけになり、式に変数が残らないので、ソルバーに渡す前に扱います。
- 先頭の `INTEGER_TYPE_C64E128` は、係数を 64 ビット、エネルギーを 128 ビットの整数にする指定です（理由は後で説明します）。

このプログラムの出力は、たとえば次のとおりです:

```
4294967297 = 641 * 6700417
4294967297 = 641 * 6700417
999999999999 = 999999 * 1000001
999999 = 999 * 1001
999 = 9 * 111
9 = 3 * 3
111 = 3 * 37
1001 = 11 * 91
91 = 7 * 13
1000001 = 101 * 9901
999999999999 = 3 * 3 * 3 * 7 * 11 * 13 * 37 * 101 * 9901
```

$4294967297 = 2^{32}+1$ は、フェルマーが素数だと予想した数で、オイラーが 1732 年に $641$ で割り切れることを示しました。
Easy Solver は乱数を使うので、どの約数の組が見つかるかは実行するたびに変わり、途中の分け方は変わることがあります。
最後の素因数の並びは変わりません。

## 係数とエネルギーの型

$n$ は 64 ビットの整数に収まりますが、探索の途中ではもっと大きな値が現れます。
$x$ と $y$ がそれぞれの範囲の上限にあるとき、$xy$ は約 $n^{1.5}/2$ になり、制約の値（違反量の 2 乗）$(xy-n)^2$ は約 $n^3/4$ になります。
$n < 10^{12}$ ならこの値は約 $2.5\times10^{35}$ 以下で、128 ビットの整数（約 $1.7\times10^{38}$ まで）に収まります。
そこで、係数を 64 ビット、エネルギーを 128 ビットとする `INTEGER_TYPE_C64E128` を使います。
既定の型（係数 32 ビット、エネルギー 64 ビット）では足りません。
あふれても警告は出ないので、型は探索の途中に現れる最大の値で選びます。
$n$ が約 $9\times10^{12}$ を超えると 128 ビットにも収まらなくなるので、桁数に上限のない `INTEGER_TYPE_CPP_INT` が必要です（[整数の範囲：coeff_t と energy_t](VAREXPR#整数の範囲coeff_t-と-energy_t)を参照）。

## 時間がかかる数

この方法で速く分解できるかどうかは、小さいほうの因数 $x$ の位置で決まります。

- 因数が小さい（2 に近い）とき、または 2 つの因数が近い（$x$ が $\sqrt{n}$ に近い）ときは、範囲の端に答えがあるので、すぐに見つかります。
  12 桁のランダムな合成数 30 個は、どれも 0.15 秒以内に最初の分解が見つかりました。
- 小さいほうの因数が範囲の中ほどにあると、時間がかかります。
  4〜6 桁の素数ともう 1 つの素数の積で 12 桁になる数 30 個では、20 秒の制限で分解できたのは 20 個（中央値 6.6 秒）で、10 個は見つかりませんでした。
  たとえば $508069567969 = 7793 \times 65195633$ は、20 秒では分解できませんでした（20 コアの CPU で計測）。

$(xy-n)^2$ は、$x$ が因数に近づいても小さくなるとは限らず、どこに因数があるかの手がかりになりません。
そのため、ソルバーはほぼ手探りで $x$ を探すことになります。
これは QUBO で素因数分解するときの本質的な限界で、このページの方法は実用的な素因数分解の方法ではありません（試し割りや楕円曲線法などのほうがはるかに速く分解できます）。
