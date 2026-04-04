---
layout: default
nav_exclude: true
title: "N-Queens"
nav_order: 41
lang: ja
hreflang_alt: "en/QUEENS"
hreflang_lang: "en"
---

# N-Queens 問題
**8-Queens 問題**は、どの2つのクイーンも互いに攻撃し合わないように、チェス盤上に8つのクイーンを配置することを目的とします。つまり、同じ行、同じ列、同じ対角線（どちらの方向も）を共有するクイーンがあってはなりません。
**N-Queens 問題**はこれを一般化したもので、同じ条件のもとで $N\times N$ のチェス盤上に $N$ 個のクイーンを配置します。

QUBO++ を用いてこの問題を定式化するために、$N\times N$ のバイナリ変数行列 $X=(x_{i,j})$ を使用します。
$x_{i,j}=1$ は行 $i$、列 $j$ にクイーンが配置されていることを表し、$x_{i,j}=0$ はそうでないことを表します。
以下の制約を課します：
- 各行にちょうど1つのクイーン：

$$
\begin{aligned}
\sum_{j=0}^{N-1} x_{i,j}&=1 && (0\leq i\leq N-1)
\end{aligned}
$$

- 各列にちょうど1つのクイーン：

$$
\begin{aligned}
\sum_{i=0}^{N-1} x_{i,j}&=1 && (0\leq j\leq N-1)
\end{aligned}
$$

- 各対角線（左上から右下）に最大1つのクイーン：
対角線は $i+j=k$ で特徴づけられます。
長さ2以上の対角線のみを考慮し、つまり $k=1,2,\ldots,2N−3$ について以下を要求します：

$$
\begin{aligned}
0\leq \sum_{\substack{0\le i,j \le N-1\\ i+j=k}}x_{i,j}\leq 1 &&(1\leq k\leq 2N-3)
\end{aligned}
$$

- $X$ の各反対角線の和が 0 または 1：
反対角線は $j−i=d$ で特徴づけられます。
長さ2以上の反対角線のみを考慮し、つまり $d=−(N−2),\ldots,(N−2)$ について以下を要求します：

$$
\begin{aligned}
0\leq \sum_{\substack{0\le i,j \le N-1\\ j-i=d}}x_{i,j}\leq 1 &&(-(N-2)\leq d\leq (N-2))
\end{aligned}
$$

## QUBO++ プログラム
以下の QUBO++ プログラムは、上記の制約を表す式を構築し、Easy Solver を用いて実行可能解を求めます：
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  const int n = 8;
  auto x = qbpp::var("x", n, n);

  auto f = qbpp::sum(qbpp::vector_sum(x, 0) == 1) +
           qbpp::sum(qbpp::vector_sum(x, 1) == 1);

  const int m = 2 * n - 3;
  auto a = qbpp::expr(m);
  auto b = qbpp::expr(m);

  for (int i = 0; i < m; ++i) {
    const int k = i + 1;
    for (int r = 0; r < n; ++r) {
      const int c = k - r;
      if (0 <= c && c < n) {
        a[static_cast<size_t>(i)] +=
            x[static_cast<size_t>(r)][static_cast<size_t>(c)];
      }
    }

    const int d = i - (n - 2);
    for (int r = 0; r < n; ++r) {
      const int c = r + d;
      if (0 <= c && c < n) {
        b[static_cast<size_t>(i)] +=
            x[static_cast<size_t>(r)][static_cast<size_t>(c)];
      }
    }
  }

  f += qbpp::sum(0 <= a <= 1);
  f += qbpp::sum(0 <= b <= 1);

  f.simplify_as_binary();

  auto solver = qbpp::easy_solver::EasySolver(f);
  auto sol = solver.search({{"target_energy", 0}});
  for (size_t i = 0; i < n; i++) {
    for (size_t j = 0; j < n; j++) {
      std::cout << (sol(x[i][j]) ? "Q" : ".");
    }
    std::cout << std::endl;
  }
}
```
{% endraw %}
`n`$\times$`n` のバイナリ変数行列 `x` を導入し、`x[i][j] = 1` は行 `i`、列 `j` にクイーンが配置されていることを示します。
列方向の和は `qbpp::vector_sum(x, 0)` で計算され、`n` 個の式のベクトル（列ごとに1つ）を返します。
`==` 演算子を要素ごとに適用すると、ペナルティ式のベクトルが生成されます。各式は、対応する列の和が 1 に等しい場合にのみ 0 になります。
同様に、`qbpp::vector_sum(x, 1)` を使って行方向のワンホット制約を強制できます。

対角線制約を強制するために、それぞれ長さ `m = 2*n - 3` の2つの式ベクトル a と b を構築します。
各インデックス `i` について、`a[i]` は `r + c` の値が固定された対角線（左上から右下）上の変数を累積し、長さ 1 の対角線は除外します。
同様に、`b[i]` は `c - r` の値が固定された反対角線（右上から左下）上の変数を累積し、こちらも長さ 1 の対角線は除外します。
連鎖範囲比較 `0 <= a <= 1`（b についても同様）は要素ごとに適用され、各対角線/反対角線に最大1つのクイーンが含まれる場合にのみ 0 になるペナルティを生成します。
これらのペナルティが `f` に加算されます。

`f.simplify_as_binary()` で式をバイナリ QUBO 形式に変換した後、Easy Solver が目標エネルギー 0 の解を探索します。
得られた割り当て sol は 8x8 のボードとして出力され、`Q` はクイーン、`.` は空きマスを表します。
例えば、プログラムは以下のような出力を生成する場合があります：
```
..Q.....
.....Q..
.......Q
.Q......
...Q....
Q.......
......Q.
....Q...
```
この出力は、どの2つのクイーンも同じ行、列、対角線、反対角線を共有していないため、8つのクイーンの有効な配置であることを確認できます。
