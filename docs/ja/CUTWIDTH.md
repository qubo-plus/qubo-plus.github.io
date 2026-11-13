---
last_modified: 2026-10-28
layout: default
nav_exclude: true
title: "カット幅"
nav_order: 69
lang: ja
hreflang_alt: "en/CUTWIDTH"
hreflang_lang: "en"
---

# カット幅問題
無向グラフ $G=(V,E)$ のノードを 1 列に並べ、辺をノードの上に配線することを考えます。
同じ高さ（レイヤー）に置いた辺どうしは重なってはいけません（端点のノードだけを共有するのはかまいません）。
**カット幅問題**は、必要なレイヤーの数が最小になるノードの並べ方を求める問題です。

{% include video_embed.html slug="cutwidth" %}

動画では 4 次元超立方体を例に、最大カット・二分割幅とあわせてカット幅を求めます。動画のプログラムと章ごとの説明は[動画：グラフの分割問題](python/VIDEO_CUTWIDTH)のページにあります。

以下の図は、[最大カット](MAXCUT)・[最小グラフ二分割](BISECTION)と同じ 16 ノードのグラフを 7 レイヤーで配線した例です。
下の数は、隣り合うノードの間（切れ目）を通る辺の本数です。

<p align="center">
  <img src="../images/cutwidth.svg" alt="16 ノードのグラフを 1 列に並べて 7 レイヤーで配線した例" width="100%">
</p>

どの切れ目でも、そこを通る辺はすべて別のレイヤーにあるので、レイヤーは切れ目を通る辺の本数の最大値以上必要です。
逆に、左端の位置の順に辺を空いている一番下のレイヤーに置いていくと、この最大値と同じ数のレイヤーで配線できます。
そこで、並べ方 $\pi$ を固定したとき、$n-1$ か所の切れ目それぞれを通る辺の本数の最大値を**並べ方 $\pi$ のカット幅**と呼び、すべての並べ方の中での最小値を**グラフ $G$ のカット幅**と呼びます。
上の図の並べ方のカット幅は 7 で、このグラフのカット幅も 7 です。

カット幅は、回路の素子を 1 列に並べたときの配線の段数や、グラフのレイアウトの複雑さの尺度として使われます。

## 定式化
ノードに $0,1,\ldots,n-1$ のラベルが付いているとします。
ノードを 1 列に並べることは、各ノードに左から数えた番号 $0,1,\ldots,n-1$ を、すべて異なるように割り当てることです。
$k$ 番目の切れ目（$k=0,1,\ldots,n-2$）は、番号 $k$ のノードと番号 $k+1$ のノードの間です。

### ドメインウォールで番号を表す
ノード $i$ の番号 $t_i$ を、$n-1$ 個のバイナリ変数 $x_{i,0}, x_{i,1}, \ldots, x_{i,n-2}$ の[ドメインウォール](NONOGRAM#ドメインウォールによる整数の表現)で表します:

$$
t_i=\sum_{k=0}^{n-2}x_{i,k},\qquad x_{i,k}=1 \iff t_i>k
$$

変数 $x$ は $n\times(n-1)$ の 2 次元配列で、行 $x_i$ がノード $i$ のドメインウォールです。
次の 2 つの制約を課します:

$$
\begin{aligned}
x_{i,k} &\ge x_{i,k+1} && (0\le i\le n-1,\ 0\le k\le n-3)\\
\sum_{i=0}^{n-1} x_{i,k} &= n-1-k && (0\le k\le n-2)
\end{aligned}
$$

1 つ目は、各行が $1\cdots 1\,0\cdots 0$ の形（ドメインウォール）であるための条件です。
2 つ目は、番号がすべて異なるための条件です。
番号がすべて異なれば $0,1,\ldots,n-1$ が 1 回ずつ使われるので、番号が $k$ より大きいノード（$x_{i,k}=1$ のノード）は $n-1-k$ 個です。
逆に、すべての $k$ でこの個数が $n-1-k$ なら、番号が $k-1$ より大きいノードは $n-k$ 個（$k=0$ のときは全部の $n$ 個）なので、番号がちょうど $k$ のノードは 1 個になり、番号はすべて異なります。

たとえば $n=4$ で並べ方が $2, 0, 3, 1$ のとき、番号は $t_0=1$, $t_1=3$, $t_2=0$, $t_3=2$ で、変数の値は次のとおりです:

| | $k=0$ | $k=1$ | $k=2$ | 番号 $t_i$ |
|---|---|---|---|---|
| ノード 0 | 1 | 0 | 0 | 1 |
| ノード 1 | 1 | 1 | 1 | 3 |
| ノード 2 | 0 | 0 | 0 | 0 |
| ノード 3 | 1 | 1 | 0 | 2 |

各列の 1 の個数は、左から 3, 2, 1 です。

### 列ごとのカット
列 $k$ は、ノードを番号が $k$ 以下のもの（$x_{i,k}=0$、$k$ 番目の切れ目の左）と $k$ より大きいもの（$x_{i,k}=1$、右）の 2 つに分けます。
両側に分かれた辺の本数は、[最大カット](MAXCUT)と同じ式で数えられます:

$$
\text{cut}_k = \sum_{(i,j)\in E}\Bigl(x_{i,k}\overline{x_{j,k}} + \overline{x_{i,k}}x_{j,k}\Bigr)
$$

これが $k$ 番目の切れ目を通る辺の本数です。
つまり $x$ の各列は、最大カットや[最小グラフ二分割](BISECTION)の変数と同じくノードの 2 分割を表し、カット幅ではこの 2 分割を $n-1$ 個使います。

### 最大のカットを最小にする
最大値 $\max_k \text{cut}_k$ を直接最小にする代わりに、整数変数 $w$（$0\le w\le m$、$m$ は辺の数）を導入して、次の制約を課し、$w$ を最小にします:

$$
\text{cut}_k \le w \qquad (0\le k\le n-2)
$$

$w$ はすべての切れ目のカットを上から押さえる「天井」で、$w$ を最小にすると $w=\max_k \text{cut}_k$ になります。
[機械スケジューリング](MACHINE_SCHEDULING)のメイクスパンと同じ書き方です。

### 式
3 種類の制約を [`qbpp::cons()`](CONSTRAINTS) で宣言し、重み $P$ を掛けて目的関数 $w$ に加えます:

$$
\begin{aligned}
f &= w + P\times\Bigl(\sum_{i,k}\text{cons}\bigl(x_{i,k+1}-x_{i,k}\le 0\bigr) + \sum_{k}\text{cons}\Bigl(\sum_i x_{i,k}=n-1-k\Bigr) + \sum_{k}\text{cons}\bigl(\text{cut}_k-w\le 0\bigr)\Bigr)
\end{aligned}
$$

制約を破ると、違反量の 2 乗に重みを掛けた値がエネルギーに加わります。
違反量は 1 以上の整数なので、制約を 1 つでも破るとエネルギーは $P$ 以上増えます。
一方、制約を破って得をできるのは、$w$ が最大 $m$ 小さくなる分だけです。
そこで $P=m+1$ とすれば、$f$ を最小にする割り当ては必ず制約を満たし、そのとき $f$ の値はカット幅に等しくなります。

`qbpp::cons()` は 2 次の本体 $\text{cut}_k-w$ をそのまま扱うので、補助変数は導入されません。
変数は $n(n-1)$ 個のバイナリ変数と 1 個の整数変数だけです。

## QUBO++ プログラム
以下の QUBO++ プログラムは、上の図のグラフのカット幅を求めます:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  const size_t N = 16;
  std::vector<std::pair<size_t, size_t>> edges = {
      {0, 1},   {0, 2},   {1, 3},   {1, 4},   {2, 5},   {2, 6},   {3, 7},
      {3, 13},  {4, 6},   {4, 7},   {4, 14},  {5, 8},   {6, 8},   {6, 12},
      {6, 14},  {7, 14},  {8, 9},   {9, 10},  {9, 12},  {10, 11}, {10, 12},
      {11, 13}, {11, 15}, {12, 14}, {12, 15}, {13, 15}, {14, 15}};
  const size_t M = edges.size();

  auto x = qbpp::var("x", N, N - 1);
  auto w = 0 <= qbpp::int_var("w") <= static_cast<int>(M);

  auto constraint = qbpp::toExpr(0);
  // 各行はドメインウォール
  for (size_t i = 0; i < N; ++i) {
    for (size_t k = 0; k + 1 < N - 1; ++k) {
      constraint += qbpp::cons(x[i][k + 1] - x[i][k] <= 0);
    }
  }
  // 番号がすべて異なる: 列 k の 1 は N-1-k 個
  for (size_t k = 0; k < N - 1; ++k) {
    auto count = qbpp::toExpr(0);
    for (size_t i = 0; i < N; ++i) {
      count += x[i][k];
    }
    constraint += qbpp::cons(count == static_cast<qbpp::energy_t>(N - 1 - k));
  }
  // k 番目の切れ目のカットは w 以下
  std::vector<qbpp::Expr> cut(N - 1);
  for (size_t k = 0; k < N - 1; ++k) {
    for (const auto& e : edges) {
      cut[k] += x[e.first][k] * ~x[e.second][k] + ~x[e.first][k] * x[e.second][k];
    }
    constraint += qbpp::cons(cut[k] - w <= 0);
  }

  auto f = w + static_cast<int>(M + 1) * constraint;
  f.simplify_as_binary();

  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"time_limit", 1.0}});

  std::cout << "cutwidth = " << sol(w) << std::endl;
  std::cout << "violated constraints = " << f.cons(sol) << std::endl;
  std::vector<size_t> order(N);
  for (size_t i = 0; i < N; ++i) {
    size_t t = 0;
    for (size_t k = 0; k < N - 1; ++k) {
      t += sol(x[i][k]);
    }
    order[t] = i;
  }
  std::cout << "order:";
  for (size_t i : order) {
    std::cout << " " << i;
  }
  std::cout << std::endl;
  std::cout << "cuts:";
  for (size_t k = 0; k < N - 1; ++k) {
    std::cout << " " << cut[k](sol);
  }
  std::cout << std::endl;
}
```
{% endraw %}
`qbpp::var("x", N, N - 1)` で $16\times 15$ の変数 $x_{i,k}$ を、`0 <= qbpp::int_var("w") <= static_cast<int>(M)` で整数変数 $w$ を作ります。
3 つのループで上の 3 種類の制約を `constraint` に加えます。
カットの式 `cut[k]` は、解からカットの大きさを読むために配列に残しておきます。

変数は 240 個あり、全探索は終わらないので、Easy Solver で 1 秒間探索します。
ノード $i$ の番号（並べ方での位置）は、行 $i$ の 1 の個数です。
カット幅 `sol(w)`、破った制約の本数 `f.cons(sol)`、並べ方、各切れ目のカットが出力されます。

このプログラムの出力の例は以下のとおりです:
```
cutwidth = 7
violated constraints = 0
order: 0 1 2 3 5 7 4 6 8 14 9 12 10 11 13 15
cuts: 2 3 4 5 5 6 6 7 6 5 6 5 4 5 4
```
冒頭の図はこの並べ方を描いたものです。
カット幅が 7 の並べ方はたくさんあるので、実行するたびに違う並べ方が出力されることがありますが、カット幅は 7 になります。
このグラフのカット幅が 7 であることは、ノードの部分集合についての動的計画法で厳密に求めて確かめています。

## 最大カット・最小二分割との関係
3 つの問題は、どれもノードを 2 つに分けて、両側に分かれた辺の本数（カット）を数えます。
違うのは、2 分割をいくつ使い、どんな条件を付け、何を最適化するかです:

| 問題 | 2 分割の数 | 条件 | 最適化 | このグラフ |
|---|---|---|---|---|
| [最大カット](MAXCUT) | 1 | なし | カットを最大にする | 22 |
| [最小グラフ二分割](BISECTION) | 1 | 両側が $n/2$ 個ずつ | カットを最小にする | 6 |
| カット幅 | $n-1$ | 各行がドメインウォール、列 $k$ の 1 は $n-1-k$ 個 | カットの最大値を最小にする | 7 |

カット幅の列 $n/2-1$（真ん中の切れ目）では両側が $n/2$ 個ずつなので、これは二分割の 1 つです。
したがって、どの並べ方でもカット幅は最小二分割のカット（bisection width）以上で、グラフのカット幅は bisection width 以上になります。
このグラフでは、二分割だけなら 6 本まで減らせますが、すべての切れ目を同時に小さくしなければならないカット幅は 7 です。

## 超立方体で確かめる
$d$ 次元超立方体 $Q_d$ は、$0$ から $2^d-1$ までの $2^d$ 個のノードを持ち、2 進表記で 1 ビットだけ違うノードどうしを辺で結んだグラフです。
$Q_d$ のカット幅は $\lfloor 2^{d+1}/3\rfloor$ で、ノードを番号順に並べるとこの値になることが知られています
（K. Nakano, Linear layouts of generalized hypercubes, WG 1993, LNCS 790, pp. 364–375, 1994）。
bisection width は $2^{d-1}$ なので、$d$ が大きくなるとカット幅は bisection width の約 $4/3$ 倍です。

上のプログラムで `N` と `edges` を次のように変えると、$Q_d$ のカット幅を求められます:
```cpp
  const size_t D = 9;
  const size_t N = 1 << D;
  std::vector<std::pair<size_t, size_t>> edges;
  for (size_t i = 0; i < N; ++i) {
    for (size_t b = 0; b < D; ++b) {
      size_t j = i ^ (1 << b);
      if (i < j) {
        edges.push_back({i, j});
      }
    }
  }
```
ソルバーは GPU を使う [ABS3 Solver](ABS3) にし、最適値を `target_energy` に与えて、最適解が見つかったら止めます:
{% raw %}
```cpp
  auto solver = qbpp::ABS3Solver(f);
  auto sol = solver.search({{"time_limit", 60.0}, {"target_energy", 341}});
  std::cout << "TTS = " << sol.tts() << "s" << std::endl;
```
{% endraw %}
`#include <qbpp/abs3_solver.hpp>` も必要です。
A100 GPU を 8 枚持つ計算機で試したところ、$d=9$（512 ノード、バイナリ変数 261,632 個）でも、ABS3 Solver は 10 秒以内にカット幅 341 の並べ方を見つけました:

| $d$ | ノード数 | 辺の数 | バイナリ変数の数 | カット幅 | 見つかるまでの時間 |
|---|---|---|---|---|---|
| 6 | 64 | 192 | 4,032 | 42 | 0.3 秒以内 |
| 7 | 128 | 448 | 16,256 | 85 | 0.2 秒以内 |
| 8 | 256 | 1,024 | 65,280 | 170 | 6 秒以内 |
| 9 | 512 | 2,304 | 261,632 | 341 | 10 秒以内 |
