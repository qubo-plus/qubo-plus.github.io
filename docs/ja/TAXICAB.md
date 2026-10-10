---
last_modified: 2026-10-08
layout: default
nav_exclude: true
title: "タクシー数 1729"
nav_order: 58
lang: ja
hreflang_alt: "en/TAXICAB"
hreflang_lang: "en"
---

# タクシー数 1729

数学者ハーディが乗ったタクシーのナンバー 1729 を「つまらない数だ」と言ったところ、ラマヌジャンは「2 通りの方法で 2 つの立方数の和として表せる最小の数です」と答えた、という逸話があります:

$$
1729 = 1^3 + 12^3 = 9^3 + 10^3
$$

このページでは、1729 を 2 つの立方数の和に分解する問題を Exhaustive Solver の全探索で解きます。
同じ問題を次の 2 通りで書き、違いを比べます:
- 整数変数 `var_int` とペナルティ式
- ネイティブ整数変数 `int_var` と `qbpp::cons()`

最後に、1729 そのものを QUBO++ で見つけます。

## 問題

正の整数 $a \le b$ で

$$
a^3 + b^3 = 1729
$$

を満たすものをすべて求めます。
$12^3 = 1728$ なので、$1 \le a \le b \le 12$ の範囲を調べれば十分です。
$a \le b$ は、$a$ と $b$ を入れ替えただけの解を除くための条件です。

## `var_int` とペナルティ式で解く

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto a = 1 <= qbpp::var_int("a") <= 12;
  auto b = 1 <= qbpp::var_int("b") <= 12;
  auto n = a * a * a + b * b * b;
  auto f = (n == 1729) + (b - a >= 0);
  f.simplify_as_binary();
  std::cout << "a = " << a << std::endl;
  std::cout << "f: degree = " << f.max_degree() << ", terms = " << f.term_count()
            << std::endl;

  auto solver = qbpp::ExhaustiveSolver(f);
  auto sols = solver.search({{"best_energy_sols", 0}});
  for (const auto& sol : sols) {
    std::cout << sol(a) << "^3 + " << sol(b) << "^3 = " << n(sol)
              << ", energy = " << sol.energy() << std::endl;
  }
}
```
{% endraw %}

[整数変数](INTEGER) `var_int` で $a$、$b$ を 1〜12 の整数として定義し、等式 `n == 1729` と不等式 `b - a >= 0` を足して `f` を作ります。
`qbpp::cons()` で囲まない比較式は、条件を満たすとき 0、満たさないとき正の値になる**ペナルティ式**になります。
`search()` に `"best_energy_sols"` を `0` で渡すと、エネルギーが最小の解がすべて得られます。

このプログラムの出力は次のとおりです:
```
a = 1 +a[0] +2*a[1] +4*a[2] +4*a[3]
f: degree = 6, terms = 256
9^3 + 10^3 = 1729, energy = 0
1^3 + 12^3 = 1729, energy = 0
```

- 1 行目のとおり、`var_int` の整数変数は 4 個のバイナリ変数 `a[0]`〜`a[3]` の 1 次式です。
- 等式 `n == 1729` はペナルティ式 $(a^3+b^3-1729)^2$ になります。$a^3$ はバイナリ変数の 3 次式なので、2 乗を展開すると 6 次の多項式になります。
- 不等式 `b - a >= 0` のペナルティ式には補助変数が加わり、これもバイナリ変数で表されます（[制約](CONSTRAINTS)を参照）。
- その結果、`f` はバイナリ変数 11 個（$a$、$b$ に 4 個ずつ、補助変数に 3 個）の 6 次・256 項の多項式になります。`std::cout << f` で表示すると 256 項が並びます。
- Exhaustive Solver はバイナリ変数の割り当て $2^{11} = 2048$ 通りをすべて調べ、エネルギー 0 の解を 2 つ見つけます。

## `int_var` と `cons()` で解く

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto a = 1 <= qbpp::int_var("a") <= 12;
  auto b = 1 <= qbpp::int_var("b") <= 12;
  auto n = a * a * a + b * b * b;
  auto f = qbpp::cons(n == 1729) + qbpp::cons(b - a >= 0);
  f.simplify_as_binary();
  std::cout << "a = " << a << std::endl;
  std::cout << "f = " << f << std::endl;

  auto solver = qbpp::ExhaustiveSolver(f);
  auto sols = solver.search({{"best_energy_sols", 0}});
  for (const auto& sol : sols) {
    std::cout << sol(a) << "^3 + " << sol(b) << "^3 = " << n(sol)
              << ", energy = " << sol.energy() << ", violations = " << f.cons(sol)
              << std::endl;
  }
}
```
{% endraw %}

前のプログラムとの違いは、`var_int` を `int_var` に変えたことと、2 つの比較式を `qbpp::cons()` で囲んだことだけです。

このプログラムの出力は次のとおりです:
```
a = a
f = cons(a*a*a +b*b*b == 1729)
+cons(-a +b >= 0)
1^3 + 12^3 = 1729, energy = 0, violations = 0
9^3 + 10^3 = 1729, energy = 0, violations = 0
```

- [ネイティブ整数変数](NATIVE_INTEGER) `int_var` はバイナリ変数に展開されず、整数値をそのまま持ちます（1 行目）。`a * a * a` も整数の 3 乗として扱われます。
- `qbpp::cons()` で囲んだ比較式はペナルティ式に展開されず、**制約**としてそのまま `f` に入ります（2〜3 行目）。2 乗の展開も補助変数もありません。
- 制約を満たさない割り当てのエネルギーは、違反量の 2 乗です。`f.cons(sol)` は違反している制約の本数を返します。
- Exhaustive Solver は $a$、$b$ の値の組 $12 \times 12 = 144$ 通りをすべて調べます。

## 2 つの書き方の違い

| | `var_int` とペナルティ式 | `int_var` と `cons()` |
|---|---|---|
| 整数の表し方 | バイナリ変数の 1 次式（$a$、$b$ に 4 個ずつ） | 整数値そのもの |
| $a^3+b^3=1729$ | $(a^3+b^3-1729)^2$ を展開した 6 次の多項式 | 制約としてそのまま保持 |
| $a \le b$ | 補助変数を含むペナルティ式 | 制約としてそのまま保持 |
| `f` の大きさ | バイナリ変数 11 個、256 項 | 制約 2 本 |
| Exhaustive Solver が調べる数 | $2^{11} = 2048$ 通り | $12 \times 12 = 144$ 通り |
| 使えるソルバー | バイナリ変数の多項式なので、QUBO++ 以外の QUBO/HUBO ソルバーにも渡せる | QUBO++ に同梱のソルバー（EasySolver・ABS3・Exhaustive Solver） |

整数の範囲を広げると、`var_int` ではバイナリ変数が増え、ペナルティ式の項数も急に増えます。
`int_var` と `cons()` では、範囲を広げても `f` は制約 2 本のままです。

変数の種類と制約の書き方は別々に選べます。
`var_int` を `cons()` と組み合わせる例は[ピタゴラスの三つ組](PYTHAGOREAN)に、`int_var` をペナルティ式で使う例は[ネイティブ整数変数](NATIVE_INTEGER)にあります。

## 1729 を見つける

最後に、「2 通りの方法で 2 つの立方数の和として表せる最小の数」を QUBO++ で求めます。
$a^3 + b^3 = c^3 + d^3$ となる正の整数で、$n = a^3 + b^3$ が最小のものを探します:

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto a = 1 <= qbpp::int_var("a") <= 20;
  auto b = 1 <= qbpp::int_var("b") <= 20;
  auto c = 1 <= qbpp::int_var("c") <= 20;
  auto d = 1 <= qbpp::int_var("d") <= 20;
  auto n = a * a * a + b * b * b;
  auto m = c * c * c + d * d * d;
  auto f = n  // n を最小化
         + 20000 * qbpp::cons(n - m == 0)
         + 20000 * qbpp::cons(c - a >= 1)   // a < c
         + 20000 * qbpp::cons(d - c >= 0)   // c <= d
         + 20000 * qbpp::cons(b - d >= 1);  // d < b
  f.simplify_as_binary();

  auto solver = qbpp::ExhaustiveSolver(f);
  auto sols = solver.search({{"best_energy_sols", 0}});
  for (const auto& sol : sols) {
    std::cout << n(sol) << " = " << sol(a) << "^3 + " << sol(b) << "^3 = " << sol(c)
              << "^3 + " << sol(d) << "^3, violations = " << f.cons(sol) << std::endl;
  }
}
```
{% endraw %}

このプログラムの出力は次のとおりです:
```
1729 = 1^3 + 12^3 = 9^3 + 10^3, violations = 0
```

- 目的関数は $n = a^3 + b^3$ で、制約は $n = c^3 + d^3$ と $a < c \le d < b$ です。$a < c \le d < b$ は、同じ表し方や、順序を入れ替えただけの組を除くための条件です。
- 制約の重みは 20000 です。この範囲では $n \le 2 \cdot 20^3 = 16000$ なので、制約を 1 つでも満たさない割り当ては、制約を満たす割り当てよりエネルギーが大きくなります。
- 1729 より小さい数を 2 通りに表すとすれば、$a$、$b$、$c$、$d$ はどれも 12 以下なので、範囲 1〜20 に含まれます。Exhaustive Solver は $20^4 = 160000$ 通りをすべて調べるので、この結果から 1729 が求める最小の数だとわかります。
