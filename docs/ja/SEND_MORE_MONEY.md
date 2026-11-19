---
last_modified: 2026-11-17
layout: default
nav_exclude: true
title: "SEND+MORE=MONEY"
nav_order: 42
lang: ja
hreflang_alt: "en/SEND_MORE_MONEY"
hreflang_lang: "en"
---

# 数学パズル: SEND MORE MONEY

**SEND + MORE = MONEY** は有名な覆面算パズルです。各文字に 10 進数の数字を割り当てて、次の足し算を成り立たせます。
$$
\text{SEND}+\text{MORE}=\text{MONEY}
$$

ルールは次の 3 つです:
- 同じ文字は、同じ数字を表す。
- 違う文字は、違う数字を表す。
- 各単語の先頭の文字（`S` と `M`）は 0 ではない。

使われている文字は S, E, N, D, M, O, R, Y の 8 種類で、数字は 0 から 9 までの 10 個です。

{% include video_embed.html slug="send-more-money" %}

動画では、文字への数字の割り当てを 0 と 1 の表で表し、distinct と足し算の等式の制約で解いて、最後にほかの覆面算も解きます。動画のプログラムと章ごとの説明は[動画：覆面算 SEND+MORE=MONEY](python/VIDEO_SEND_MORE_MONEY)のページにあります。

## 定式化

### 変数：8×10 の表
各文字に次のように番号を付けます:

| 番号 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 文字 | S | E | N | D | M | O | R | Y |

$I(\alpha)$ を文字 $\alpha$ ($\in \lbrace S,E,N,D,M,O,R,Y\rbrace$) の番号とします。
文字を行、数字を列にした $8\times 10$ のバイナリ変数の表 $X=(x_{i,k})$ $(0\leq i\leq 7, 0\leq k\leq 9)$ で、文字への数字の割り当てを表します。
文字 $\alpha$ に数字 $k$ を当てるとき、そしてそのときに限り $x_{I(\alpha),k}=1$ とします。

### 行と列の条件：distinct
表が正しい割り当てを表すには、次の 2 つの条件が要ります:
- 各文字に当てる数字はちょうど 1 つ：各行に 1 がちょうど 1 つある。
- 違う文字には違う数字を当てる：各列に 1 が高々 1 つある。

列は 10 本、行は 8 本なので、どの文字にも当てない数字が 2 つ残ります。
この 2 つの条件は、[構造制約](STRUCTURAL) `qbpp::distinct(x)` 1 つで書けます。
`qbpp::distinct(x)` は重みのない制約で、ソルバーが返す解は必ずこの制約を満たします。エネルギーには影響しません。

### 文字の数字と単語の値
文字 $\alpha$ の行は、その文字の数字の位置だけが 1 です。そのため、文字 $\alpha$ の数字は次の式で表せます:
$$
\text{digit}(\alpha) = \sum_{k=0}^{9} k\,x_{I(\alpha),k}
$$

各単語の値は、文字の数字に桁の重みを掛けて足した式です:
$$
\begin{aligned}
\text{SEND}  &= 1000\,\text{digit}(S)+100\,\text{digit}(E)+10\,\text{digit}(N)+\text{digit}(D)\\
\text{MORE}  &= 1000\,\text{digit}(M)+100\,\text{digit}(O)+10\,\text{digit}(R)+\text{digit}(E)\\
\text{MONEY} &= 10000\,\text{digit}(M)+1000\,\text{digit}(O)+100\,\text{digit}(N)+10\,\text{digit}(E)+\text{digit}(Y)
\end{aligned}
$$
どれも変数 $x_{i,k}$ の 1 次式です。

### 足し算の等式
足し算が成り立つ条件は $\text{SEND}+\text{MORE}-\text{MONEY}=0$ です。
この等式を [`qbpp::cons()`](CONSTRAINTS) で制約にします。等式制約を破ると、左辺の値の 2 乗がエネルギーに加わります。

左辺を文字ごとにまとめると、次のようになります:
$$
\text{SEND}+\text{MORE}-\text{MONEY} = 1000\,\text{digit}(S)+91\,\text{digit}(E)-90\,\text{digit}(N)+\text{digit}(D)-9000\,\text{digit}(M)-900\,\text{digit}(O)+10\,\text{digit}(R)-\text{digit}(Y)
$$
たとえば E は SEND の 100 の位、MORE の 1 の位、MONEY の 10 の位に現れるので、係数は $100+1-10=91$ です。
変数で見ると、$x_{I(\alpha),k}$ の係数は文字 $\alpha$ の係数と $k$ の積です（E の行なら $0, 91, 182, \ldots, 819$）。

### まとめた式
2 つの部分を足して、式 $f$ を作ります:
$$
f = \text{distinct}(X) + \Bigl(\text{SEND}+\text{MORE}-\text{MONEY}=0\Bigr)
$$
表の形は distinct が守り、エネルギーは足し算の左辺の 2 乗だけです。
そのため、エネルギーが 0 の解が覆面算の答えです。

### 先頭を 0 にしない
ここまでの式には、先頭の文字が 0 でないという条件がまだありません。
この条件がないと答えは 25 通りあり、そのうち 24 通りは M が 0 の答えです（たとえば 2817 + 0368 = 03185）。

S と M に 0 を当てないように、[`qbpp::replace()`](REPLACE) で表の 2 つのマス $x_{I(S),0}$ と $x_{I(M),0}$ を 0 に置き換えます:
$$
x_{I(S),0} = x_{I(M),0} = 0
$$
distinct の変数を 0 に置き換えると、その選択肢が取り除かれます。

## SEND+MORE=MONEY の QUBO++ プログラム
以下の QUBO++ プログラムは上記の定式化を実装し、EasySolver を用いて解を求めます:
{% raw %}
```cpp
#include <iostream>
#include <string>
#include <string_view>

#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

constexpr std::string_view LETTERS = "SENDMORY";

size_t I(char c) { return LETTERS.find(c); }

int main() {
  auto x = qbpp::var("x", LETTERS.size(), 10);
  auto K = qbpp::array({0, 1, 2, 3, 4, 5, 6, 7, 8, 9});

  auto digit = [&](char c) { return qbpp::sum(x[I(c)] * K); };

  auto send = 1000 * digit('S') + 100 * digit('E') + 10 * digit('N') + digit('D');
  auto more = 1000 * digit('M') + 100 * digit('O') + 10 * digit('R') + digit('E');
  auto money = 10000 * digit('M') + 1000 * digit('O') + 100 * digit('N') +
               10 * digit('E') + digit('Y');

  auto f = qbpp::distinct(x) + qbpp::cons(send + more - money == 0);
  f.simplify_as_binary();

  qbpp::MapList ml = {{x[I('S')][0], 0}, {x[I('M')][0], 0}};
  auto g = qbpp::replace(f, ml);
  g.simplify_as_binary();

  auto sol = qbpp::EasySolver(g).search({{"target_energy", 0}});
  std::cout << "energy = " << sol.energy() << std::endl;
  auto full_sol = qbpp::Sol(f).set(sol, ml);

  auto val = qbpp::onehot_to_int(full_sol(x));

  auto word = [&](std::string_view w) {
    std::string s;
    for (char c : w) s += std::to_string(val[I(c)]);
    return s;
  };

  std::cout << word("SEND") << " + " << word("MORE") << " = " << word("MONEY") << std::endl;
}
```
{% endraw %}
このプログラムでは、`LETTERS` に 8 つの文字を並べた文字列を入れ、関数 `I()` が文字の番号を返します。たとえば `I('S')` は 0、`I('E')` は 1 を返します。
`x` は 8 行 10 列のバイナリ変数の配列、`K` は 0 から 9 までの数字の配列です。
ラムダ式 `digit` は文字の行と `K` の要素ごとの積の和、つまり文字の数字を表す式を返し、`send`・`more`・`money` は各単語の値を表す式です。
`f` は `qbpp::distinct(x)` と足し算の等式の制約の和です。

`ml` は、`x[I('S')][0]` と `x[I('M')][0]` を 0 に置き換える指定です。`qbpp::replace(f, ml)` は置き換えた新しい式 `g` を返します。
`g` から EasySolver を作り、`target_energy` に 0 を指定して、エネルギー 0 の解を見つけたら止まるようにします。
得られた解 `sol` は、`qbpp::Sol(f).set(sol, ml)` で元の式 `f` の解 `full_sol` に戻します。

最後に、`qbpp::onehot_to_int(full_sol(x))` が各行の 1 の位置、つまり各文字の数字を返し、ラムダ式 `word` が単語の文字を数字に置き換えた文字列を返します。

このプログラムは以下の出力を生成します:
```
energy = 0
9567 + 1085 = 10652
```
エネルギーは 0 で、足し算が成り立っています。S と M が 0 でない答えは、この 1 つだけです。

## ほかの覆面算
プログラムを関数にすると、ほかの覆面算も解けます。
関数 `solve()` は覆面算の式を文字列で受け取り、使われている文字を出てきた順に取り出して `letters` を作ります:
{% raw %}
```cpp
#include <cctype>
#include <iostream>
#include <string>
#include <vector>

#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

void solve(const std::string& puzzle) {
  auto eq = puzzle.find('=');
  std::string left = puzzle.substr(0, eq), right = puzzle.substr(eq + 1);
  std::vector<std::string> words;
  size_t p = 0;
  for (size_t q; (q = left.find('+', p)) != std::string::npos; p = q + 1)
    words.push_back(left.substr(p, q - p));
  words.push_back(left.substr(p));
  words.push_back(right);

  std::string letters;
  for (char c : puzzle)
    if (std::isalpha(c) && letters.find(c) == std::string::npos) letters += c;
  auto I = [&](char c) { return letters.find(c); };

  auto x = qbpp::var("x", letters.size(), 10);
  auto K = qbpp::array({0, 1, 2, 3, 4, 5, 6, 7, 8, 9});

  auto digit = [&](char c) { return qbpp::sum(x[I(c)] * K); };
  auto value = [&](const std::string& w) {
    qbpp::Expr v = 0;
    for (char c : w) v = 10 * v + digit(c);
    return v;
  };

  qbpp::Expr lhs = 0;
  for (size_t i = 0; i + 1 < words.size(); ++i) lhs += value(words[i]);

  auto f = qbpp::distinct(x) + qbpp::cons(lhs - value(right) == 0);
  f.simplify_as_binary();

  std::string heads;
  for (const auto& w : words)
    if (heads.find(w[0]) == std::string::npos) heads += w[0];
  qbpp::MapList ml;
  for (char c : heads) ml.push_back({x[I(c)][0], 0});
  auto g = qbpp::replace(f, ml);
  g.simplify_as_binary();

  auto sol = qbpp::EasySolver(g).search({{"target_energy", 0}});
  auto full_sol = qbpp::Sol(f).set(sol, ml);
  auto val = qbpp::onehot_to_int(full_sol(x));

  auto word = [&](const std::string& w) {
    std::string s;
    for (char c : w) s += std::to_string(val[I(c)]);
    return s;
  };
  for (size_t i = 0; i + 1 < words.size(); ++i)
    std::cout << word(words[i]) << (i + 2 < words.size() ? " + " : " = ");
  std::cout << word(right) << std::endl;
}

int main() {
  solve("DONALD+GERALD=ROBERT");
  solve("TWO+TWO=FOUR");
}
```
{% endraw %}
`words` は左辺の単語と右辺の単語を並べたものです。
ラムダ式 `value` は、左から順に、それまでの値を 10 倍して次の文字の数字を足して単語の値を作ります。
等式は、左辺の単語の値の和 `lhs` から右辺の値を引いて 0 とする制約です。
`heads` は各単語の先頭の文字で、その文字の 0 の列の変数を 0 に置き換えます。

このプログラムの出力の一例です:
```
526485 + 197485 = 723970
928 + 928 = 1856
```
DONALD + GERALD = ROBERT は文字が 10 種類で、表は 10×10 になります。行と列の数が等しいので、どの数字もちょうど 1 つの文字に当たります。
TWO + TWO = FOUR は答えが 7 つあるので、実行するたびに 2 行目は違う答えになることがあります。
