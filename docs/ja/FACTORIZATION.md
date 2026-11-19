---
last_modified: 2026-10-14
layout: default
nav_exclude: true
title: "因数分解"
nav_order: 7
lang: ja
hreflang_alt: "en/FACTORIZATION"
hreflang_lang: "en"
---

# 整数変数による因数分解

## 2つの素数の積の因数分解
2つの素数の積である**整数の因数分解**を考えます。
例えば、積 $pq = 35$ が与えられたとき、2つの素因数 $p=5$ と $q=7$ を求めることが目標です。

$\sqrt{35}=5.91$ かつ $35/2=17.5$ であるため、$p$ と $q$ の探索範囲を以下のように制限できます:

$$
\begin{aligned}
  2 \leq &p \leq 5 \\
  6 \leq &q \leq 17
\end{aligned}
$$

このような[整数変数](INTEGER) $p$ と $q$ に対して、$35$ の因数分解問題は以下の式を用いて定式化できます:

$$
\begin{aligned}
f(p,q) &= (pq-35)^2
\end{aligned}
$$

$f(p,q)$ は $p$ と $q$ が35の正しい因数であるとき、かつそのときに限り最小値0をとります。

## 因数分解のためのQUBO++プログラム
以下のQUBO++プログラムは式 $f(p,q)$ を構築し、Easy Solverを使って最適化問題を解きます:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  auto p = 2 <= qbpp::int_var("p") <= 5;
  auto q = 6 <= qbpp::int_var("q") <= 17;
  auto f = qbpp::sqr(p * q - 35);
  f.simplify();
  std::cout << "f = " << f << std::endl;

  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"target_energy", 0}});
  std::cout << "p = " << sol(p) << ", q = " << sol(q) << std::endl;
  std::cout << "f = " << sol.energy() << std::endl;
}
```
{% endraw %}

このプログラムの出力は以下の通りです:

```
f = 1225 -70*p*q +p*p*q*q
p = 5, q = 7
f = 0
```

$f(p,q)$ を展開すると $p^2q^2 - 70pq + 1225$ となり，4 次の項 `p*p*q*q` を含みます．
QUBO++ のソルバーは，このような 3 次以上の項を含む式もそのまま解くことができます．
ソルバーは素因数 $p=5$ と $q=7$ を正しく求めています。

$p$ と $q$ を[バイナリエンコードの整数変数](BINARY_INTEGER)で表すと，
同じ式がバイナリ変数の 4 次式（HUBO 式）になり，項の数も大きく増えます．

## 大きな数の素因数分解のための無制限の大きな係数
QUBO++では、式の係数とエネルギー値のデータ型はデフォルトでそれぞれ `int32_t` と `int64_t` です。
これらの型は **`INTEGER_TYPE_*`** マクロ（`INTEGER_TYPE_C32E32`、`INTEGER_TYPE_C32E64`（デフォルト）、`INTEGER_TYPE_C64E64`、`INTEGER_TYPE_C64E128`、`INTEGER_TYPE_C128E128`、`INTEGER_TYPE_CPP_INT`）のいずれかを定義することで切り替えられます — 詳細は [VAREXPR](VAREXPR#整数の範囲coeff_t-と-energy_t) 参照。

さらに、QUBO++は任意の大きさの係数とエネルギー値を持つ式を **`INTEGER_TYPE_CPP_INT`** でサポートします。このマクロを定義すると `coeff_t` と `energy_t` の両方が **`qbpp::cpp_int`** になります。
以下のQUBO++プログラムは、2つの大きな素数の積を因数分解します:
{% raw %}
```cpp
#define INTEGER_TYPE_CPP_INT

#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  auto p = 2 <= qbpp::int_var("p") <= qbpp::integer("2000000");
  auto q = 2 <= qbpp::int_var("q") <= qbpp::integer("2000000");
  auto f = qbpp::sqr(p * q - qbpp::integer("1000039") * qbpp::integer("1000079"));
  f.simplify();
  std::cout << "f = " << f << std::endl;

  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"target_energy", 0}});
  std::cout << "p = " << sol(p) << ", q = " << sol(q) << std::endl;
  std::cout << "f = " << sol.energy() << std::endl;
}
```
{% endraw %}

`qbpp/qbpp.hpp` をインクルードする前に `INTEGER_TYPE_CPP_INT` を定義し、`coeff_t` と `energy_t` を任意精度整数 `cpp_int` に設定します。
定数整数は **`qbpp::integer()`** に10進文字列を渡して指定します（`int * int` の中間オーバーフローを避けるため、積は `qbpp::integer("1000039") * qbpp::integer("1000079")` と書いています）。

このプログラムは以下の結果を出力します（`p` と `q` の値は入れ替わって出力されることがあります）:
```
f = 1000236020086727125492561 -2000236006162*p*q +p*p*q*q
p = 1000079, q = 1000039
f = 0
```
定数項が `int64_t` の範囲（約 $9.2 \times 10^{18}$）を超える大きな値になっていますが，
大きな合成数の因数分解が正しく得られたことがわかります。

>**TIP**
> 任意精度整数を使用するには、ヘッダのインクルード前に **`INTEGER_TYPE_CPP_INT`** を定義します（あるいは `-DINTEGER_TYPE_CPP_INT` をコンパイラフラグで渡します）。他の型は **`INTEGER_TYPE_C32E32`**、**`INTEGER_TYPE_C32E64`（デフォルト）**、**`INTEGER_TYPE_C64E64`**、**`INTEGER_TYPE_C64E128`**、**`INTEGER_TYPE_C128E128`** で選択します — 全対応表は [VAREXPR](VAREXPR#整数の範囲coeff_t-と-energy_t) 参照。

素因数分解を最後まで（すべての素因数まで）行う例は、ケーススタディの[再帰による素因数分解](PRIME_FACTORIZATION)を参照してください。
