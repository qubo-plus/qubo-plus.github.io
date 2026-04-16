---
layout: default
nav_exclude: true
title: "Slice and Concat Functions"
nav_order: 19
lang: ja
hreflang_alt: "en/SLICE_CONCAT"
hreflang_lang: "en"
---

# スライス関数と連結関数

QUBO++ は、変数や式のベクトルを操作するためのスライス関数と連結関数を提供しています。
このページでは、実用的な例である**ドメインウォール符号化**を通じてこれらの関数を紹介します。

## ドメインウォール符号化

**ドメインウォール**とは、$1\cdots 1\, 0\cdots 0$ の形をしたバイナリパターンで、
すべての1がすべての0の前に現れます。
$n$ 個のバイナリ変数に対して、ドメインウォールパターンは正確に $n+1$ 個あり
（全1パターンと全0パターンを含む）、
$[0, n]$ の範囲の整数を表現できます。

`concat`、`head`、`tail`、`sqr` を使って、
最小エネルギー解がちょうどドメインウォールパターンとなるQUBO式を構築できます。

## QUBO++ プログラム

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  const size_t n = 8;
  auto x = qbpp::var("x", n);

  // y = (1, x[0], x[1], ..., x[n-1], 0)
  auto y = qbpp::concat(1, qbpp::concat(x, 0));

  // 隣接差分
  auto diff = qbpp::head(y, n + 1) - qbpp::tail(y, n + 1);

  // ペナルティ: ドメインウォールのとき最小値 1
  auto f = qbpp::sum(qbpp::sqr(diff));
  f.simplify_as_binary();

  std::cout << "f = " << f << std::endl;

  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search({{"best_energy_sols", 1}});

  std::cout << "energy = " << sol.energy() << std::endl;
  std::cout << "solutions = " << sol.sols().size() << std::endl;
  for (const auto& s : sol.sols()) {
    for (size_t i = 0; i < n; ++i) std::cout << s(x[i]);
    std::cout << "  (sum = " << s(qbpp::sum(x)) << ")" << std::endl;
  }
}
```
{% endraw %}

### 仕組み

**ステップ 1: `concat` によるガードビット**

`concat(1, concat(x, 0))` で拡張ベクトルを構築します:

$$
y = (1,\; x_0,\; x_1,\; \ldots,\; x_{n-1},\; 0)
$$

先頭のガードビット 1 と末尾の 0 により、ドメインウォールパターンが境界で正しく制約されます。

**ステップ 2: `head` と `tail` による隣接差分**

`head(y, n+1) - tail(y, n+1)` で連続する要素間の差分を計算します:

$$
\text{diff}_i = y_i - y_{i+1} \quad (0 \le i \le n)
$$

**ステップ 3: `sqr` と `sum` によるペナルティ**

`sum(sqr(diff))` は $\sum_{i=0}^{n} (y_i - y_{i+1})^2$ を計算します。
各 $y_i \in \{0, 1\}$ なので、各二乗差分は 0 または 1 です。
この和は $y$ における遷移（0 から 1 または 1 から 0 への変化）の回数を数えます。

ドメインウォールパターンは遷移が正確に**1回**（1 から 0 への変化）なので、
最小エネルギーは **1** であり、$n+1$ 個すべてのドメインウォールパターンがこの最小値を達成します。

### 出力

```
f = 1 +2*x[1] +2*x[2] +2*x[3] +2*x[4] +2*x[5] +2*x[6] +2*x[7] -2*x[0]*x[1] -2*x[1]*x[2] -2*x[2]*x[3] -2*x[3]*x[4] -2*x[4]*x[5] -2*x[5]*x[6] -2*x[6]*x[7]
energy = 1
solutions = 9
00000000  (sum = 0)
10000000  (sum = 1)
11000000  (sum = 2)
11100000  (sum = 3)
11110000  (sum = 4)
11111000  (sum = 5)
11111100  (sum = 6)
11111110  (sum = 7)
11111111  (sum = 8)
```

9つの最適解はすべてドメインウォールパターンで、整数 0 から 8 を表現しています。

## Dual-Matrix Domain Wall

**Dual-Matrix Domain Wall** 法は、異なるサイズの2つのバイナリ行列を使用して $n \times n$ の置換行列を構築します:
`x`（$(n{-}1) \times n$、列方向ドメインウォール）と `y`（$n \times (n{-}1)$、行方向ドメインウォール）。
ガードビットを追加して隣接差分を取ると、それぞれ $n \times n$ のone-hot行列が得られます。
これらを一致させることで、各行・各列にちょうど1つの1を持つ置換行列になります。
詳細は [https://arxiv.org/abs/2308.01024](https://arxiv.org/abs/2308.01024) を参照してください。

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  const size_t n = 6;
  auto x = qbpp::var("x", n - 1, n);  // (n-1) x n
  auto y = qbpp::var("y", n, n - 1);  // n x (n-1)

  // x: dim=0 でガード行追加 -> (n+1) x n、差分 -> n x n（各列one-hot）
  auto xg = qbpp::concat(1, qbpp::concat(x, 0, 0), 0);
  auto x_oh = qbpp::head(xg, n, 0) - qbpp::tail(xg, n, 0);
  auto x_dw = qbpp::sum(qbpp::sqr(x_oh));

  // y: dim=1 でガードビット追加 -> n x (n+1)、差分 -> n x n（各行one-hot）
  auto yg = qbpp::concat(1, qbpp::concat(y, 0, 1), 1);
  auto y_oh = qbpp::head(yg, n, 1) - qbpp::tail(yg, n, 1);
  auto y_dw = qbpp::sum(qbpp::sqr(y_oh));

  // 一致制約: x_oh == y_oh（転置不要、両方 n x n）
  auto match = qbpp::sum(x_oh - y_oh == 0);

  auto f = x_dw + y_dw + match;
  f.simplify_as_binary();

  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"target_energy", std::to_string(static_cast<int64_t>(2 * n))}});

  std::cout << "energy = " << sol.energy() << std::endl;
  std::cout << "x (" << n-1 << "x" << n << ")  x_oh (" << n << "x" << n << ")" << std::endl;
  for (size_t i = 0; i < n; ++i) {
    if (i < n - 1) {
      for (size_t j = 0; j < n; ++j) std::cout << sol(x[i][j]);
    } else {
      for (size_t j = 0; j < n; ++j) std::cout << " ";
    }
    std::cout << "  ->  ";
    for (size_t j = 0; j < n; ++j) std::cout << sol(x_oh[i][j]);
    std::cout << std::endl;
  }
  std::cout << "y (" << n << "x" << n-1 << ")  y_oh (" << n << "x" << n << ")" << std::endl;
  for (size_t i = 0; i < n; ++i) {
    for (size_t j = 0; j < n - 1; ++j) std::cout << sol(y[i][j]);
    std::cout << "   ->  ";
    for (size_t j = 0; j < n; ++j) std::cout << sol(y_oh[i][j]);
    std::cout << std::endl;
  }
}
```
{% endraw %}

### 仕組み

1. **`x`** は $(n{-}1) \times n$。`concat(1, concat(x, 0, 0), 0)` で `dim=0` に沿ってガード行を追加すると $(n{+}1) \times n$ となり、各列がドメインウォール。`head - tail` で $n \times n$ の行列 `x_oh` を得て、各**列**がone-hotになります。

2. **`y`** は $n \times (n{-}1)$。`concat(1, concat(y, 0, 1), 1)` で `dim=1` に沿ってガードビットを追加すると $n \times (n{+}1)$ となり、各行がドメインウォール。`head - tail` で $n \times n$ の行列 `y_oh` を得て、各**行**がone-hotになります。

3. **`x_oh == y_oh`**: 両方 $n \times n$ なので、転置なしで直接比較できます。一致させると、各行・各列にちょうど1つの1がある**置換行列**になります。

### 出力

```
energy = 12
x (5x6)  x_oh (6x6)
111101  ->  000010
111100  ->  000001
110100  ->  001000
010100  ->  100000
010000  ->  000100
        ->  010000
y (6x5)  y_oh (6x6)
11110   ->  000010
11111   ->  000001
11000   ->  001000
00000   ->  100000
11100   ->  000100
10000   ->  010000
```

最適エネルギーは $2n = 12$ です。`x_oh` と `y_oh` は一致し、有効な $6 \times 6$ の置換行列を形成しています。

## 軸固定スライス（`slice`, `row`, `col`）

多次元配列から特定の軸を固定してサブ配列を取得するには、`slice`、`row`、`col` を使います。

`row`、`col`、軸固定 `slice` はグローバル関数のみで、元の配列を**変更せず**新しいサブ配列を返します。

### `row(i)` と `col(j)`

`row(i)` は axis 0 を index `i` に固定、`col(j)` は axis 1 を index `j` に固定します:

```cpp
auto x = qbpp::var("x", 3, 4);  // 3×4

auto row0 = qbpp::row(x, 0);  // {x[0][0], x[0][1], x[0][2], x[0][3]}
auto col2 = qbpp::col(x, 2);  // {x[0][2], x[1][2], x[2][2]}
// row(), col() はグローバル関数のみ（メンバ関数版はありません）
```

行同士の要素毎積を取る例:

```cpp
auto prod = qbpp::row(x, 0) * qbpp::row(x, 1);  // Array<1, Term>(4要素)
auto s = qbpp::sum(prod);                         // Expr
```

### `slice`

`slice` は複数の軸を同時に固定できます:

{% raw %}
```cpp
auto z = qbpp::var("z", 2, 3, 4);  // 2×3×4

// グローバル（非破壊）
auto s1 = qbpp::slice(z, {{0, 1}});          // axis 0 を 1 に固定 → 3×4
auto s2 = qbpp::slice(z, {{0, 1}, {2, 3}});  // axis 0=1, axis 2=3 に固定 → 3要素

// 軸固定 slice() はグローバル関数のみ（メンバ関数版はありません）
```
{% endraw %}

範囲外のインデックスや重複する軸を指定した場合は実行時エラーになります。

> **NOTE**
> `operator[]` は全次元を指定してスカラー値を取得するためのもので、途中の次元で止めてサブ配列を取得することはできません。
> サブ配列が必要な場合は `qbpp::row()`、`qbpp::col()`、`qbpp::slice()` を使用してください。
