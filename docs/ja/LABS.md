---
last_modified: 2026-11-12
layout: default
nav_exclude: true
title: "LABS 問題"
nav_order: 32
lang: ja
hreflang_alt: "en/LABS"
hreflang_lang: "en"
---

# 低自己相関バイナリ列 (LABS) 問題

**低自己相関バイナリ列 (Low Autocorrelation Binary Sequence, LABS)** 問題は、自己相関を最小化するスピン列 $S=(s_i)$ ($s_i=\pm 1, 0\leq i\leq n-1$) を見つけることを目的とします。
アラインメント $d$ における $S$ の自己相関は次のように定義されます：

$$
\left(\sum_{i=0}^{n-d-1}s_is_{i+d}\right)^2
$$


LABSの目的関数は、すべてのアラインメントにわたるこれらの自己相関の和です：

$$
\begin{aligned}
\text{LABS}(S) &= \sum_{d=1}^{n-1}\left(\sum_{i=0}^{n-d-1}s_is_{i+d}\right)^2
\end{aligned}
$$

LABS問題は $\text{LABS}(S)$ を最小化する列 $S$ を見つける問題です。

## スピンからバイナリへの変換
QUBO++に同梱されているソルバーはスピン変数を直接サポートしていないため、以下の変換を用いてスピン変数をバイナリ変数に変換します：

$$
\begin{aligned}
 s_i &\leftarrow 2s_i - 1
\end{aligned}
$$

この変換の後、各 $s_i$ はバイナリ変数として扱うことができ、バイナリ変数用のHUBOソルバーを使用して $\text{LABS}(S)$ の解を求めることができます。

QUBO++ではこの変換を spin_to_binary() 関数を通じて提供しています。

## 対称性で探索範囲を 1/4 にする
$\text{LABS}(S)$ の値は、次の 2 つの変換で変わりません。

- **すべての符号を反転する**（$s_i \leftarrow -s_i$）：各積 $s_is_{i+d}$ は変わりません。
- **1 つおきに符号を反転する**（$s_i \leftarrow (-1)^i s_i$）：積 $s_is_{i+d}$ には $(-1)^{i}(-1)^{i+d}=(-1)^d$ が掛かります。この係数は $i$ によらないので、内側の和全体が $(-1)^d$ 倍になり、2 乗すると元と同じ値になります。

先頭の 2 つ $(s_0, s_1)$ は、これらの変換で次のように $(+1,+1)$ に移せます。

| 元の $(s_0, s_1)$ | 使う変換 |
|---|---|
| $(+1,+1)$ | なし |
| $(+1,-1)$ | 1 つおきに反転 |
| $(-1,-1)$ | すべて反転 |
| $(-1,+1)$ | すべて反転してから 1 つおきに反転 |

したがって、どの列も LABS の値を変えずに $s_0=s_1=+1$ の列に移せるので、最適解を探すときは $s_0=s_1=+1$ に固定しても一般性を失いません。
変数が 2 つ減り、調べる範囲は $1/4$ になります。
逆に、$s_0=s_1=+1$ の最適解のそれぞれに 3 つの変換（1 つおきの反転、すべての反転、その両方）を施すと、すべての最適解が得られます。

なお、列を前後逆にしても LABS の値は変わりませんが、この対称性は変数の値を固定する形では表せないので、ここでは使いません。

## $n=26$ のすべての最適解
以下のQUBO++プログラムは、$s_0=s_1=+1$ に固定して、Exhaustive Solver で $n=26$ の最適解をすべて求めます：
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  const int n = 26;

  auto s = qbpp::var("s", n);
  qbpp::Expr labs = 0;
  for (int d = 1; d < n; ++d) {
    qbpp::Expr temp = 0;
    for (int i = 0; i < n - d; ++i) {
      temp += s[i] * s[i + d];
    }
    labs += qbpp::sqr(temp);
  }
  labs.spin_to_binary();
  labs.simplify_as_binary();

  qbpp::MapList ml({{s[0], 1}, {s[1], 1}});
  auto f = qbpp::replace(labs, ml);
  f.simplify_as_binary();

  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search({{"best_energy_sols", 0}});
  size_t k = 0;
  for (const auto& t : sol.sols) {
    auto full_sol = qbpp::Sol(labs).set(t, ml);
    std::cout << k++ << ": LABS = " << labs(full_sol) << " : ";
    for (int i = 0; i < n; ++i) {
      std::cout << (full_sol(s[i]) ? "+" : "-");
    }
    std::cout << std::endl;
  }
}
```
{% endraw %}
このプログラムでは、`s` に `n` 個の変数のベクトルが格納されます。
式 `labs` はネストされたループを使用して構築され、LABSの目的関数の数学的定義に直接従っています。
その後、`labs` は `spin_to_binary()` 関数によりバイナリ変数上の式に変換され、`simplify_as_binary()` により簡略化されます。

変換後は $s_i=1$ がスピン $+1$ に対応するので、`qbpp::MapList` オブジェクト `ml` で `s[0]` と `s[1]` を 1 に固定します。
[`qbpp::replace()`](REPLACE) は `labs` の `s[0]` と `s[1]` を定数 1 に置き換えた式 `f` を返します。`f` は 24 変数の式です。

Exhaustive Solver は `best_energy_sols` を `0`（保持する解の個数の上限なし）に設定して実行されるので、`f` の最適解がすべて `sol.sols` に格納されます。
各解には `s[0]` と `s[1]` が含まれないので、`qbpp::Sol(labs).set(t, ml)` で固定した値を加えた `labs` の解 `full_sol` を作り、その LABS の値と列を表示します。
このプログラムの出力は以下のとおりです：
```
0: LABS = 45 : ++--+++------+-+-+--+--+--
1: LABS = 45 : ++-++-++-+-+-++++++---++--
2: LABS = 45 : +++--+++------+-+-+--+--+-
3: LABS = 45 : ++++++---++---+-+-+--+--+-
4: LABS = 45 : +++---+++++++-++--+--+-+-+
5: LABS = 45 : +++---+++++++-+-+--+--++-+
```
$s_0=s_1=+1$ の最適解は 6 個です。
それぞれに 3 つの変換を施すと 24 個の異なる列が得られ、これが $n=26$ のすべての最適解です。

## $n=30$ の探索
$n$ が大きくなると、すべての解を調べる Exhaustive Solver の実行時間は急速に増えます。
以下のQUBO++プログラムは、同じく $s_0=s_1=+1$ に固定した $n=30$ の式を Easy Solver で探索します：
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  const int n = 30;

  auto s = qbpp::var("s", n);
  qbpp::Expr labs = 0;
  for (int d = 1; d < n; ++d) {
    qbpp::Expr temp = 0;
    for (int i = 0; i < n - d; ++i) {
      temp += s[i] * s[i + d];
    }
    labs += qbpp::sqr(temp);
  }
  labs.spin_to_binary();
  labs.simplify_as_binary();

  qbpp::MapList ml({{s[0], 1}, {s[1], 1}});
  auto f = qbpp::replace(labs, ml);
  f.simplify_as_binary();

  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"time_limit", 10.0}, {"best_energy_sols", 0}});
  size_t k = 0;
  for (const auto& t : sol.sols) {
    auto full_sol = qbpp::Sol(labs).set(t, ml);
    std::cout << k++ << ": LABS = " << labs(full_sol) << " : ";
    for (int i = 0; i < n; ++i) {
      std::cout << (full_sol(s[i]) ? "+" : "-");
    }
    std::cout << std::endl;
  }
}
```
{% endraw %}
Easy Solver は時間制限10秒で実行されます。
`best_energy_sols` が `0` に設定されているため、探索中に見つかった最良エネルギーの解がすべて `sol.sols` に格納されます。
ただし、Exhaustive Solver と違い、最良エネルギーを達成する解をすべて列挙するとは限りません。

このプログラムの典型的な出力は以下のとおりです：
```
0: LABS = 59 : +++++-----+--+--+-+-+---++---+
1: LABS = 59 : ++-++--+-------+++---+-+-++-+-
2: LABS = 59 : ++-++--+-------+++---+-+--+-+-
3: LABS = 59 : ++++------+--+--+-+-+---++---+
```
この実行では、$s_0=s_1=+1$ の最適解 4 個がすべて見つかっています。
探索には乱数を使うので、得られる解とその個数は実行ごとに変わります。
