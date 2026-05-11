---
layout: default
nav_exclude: true
title: "Sudoku"
nav_order: 43
lang: ja
hreflang_alt: "en/SUDOKU"
hreflang_lang: "en"
---

# 数独

**数独**は $9\times 9$ のマス目に 1 から 9 の数字を入れるパズルで、以下の条件をすべて満たす必要があります:

- 各行に 1 から 9 がちょうど 1 回ずつ現れる。
- 各列に 1 から 9 がちょうど 1 回ずつ現れる。
- 9 個の $3\times 3$ のブロックそれぞれに 1 から 9 がちょうど 1 回ずつ現れる。

問題には初期ヒント (clues) としていくつかのマスにあらかじめ数字が入っており、残りの空きマスを上記の制約を満たすように埋めます。

## 1-hot 符号化による QUBO 定式化

3 次元のバイナリ変数 $X=(x_{i,j,k})$ ($0\leq i, j, k \leq 8$) を用い、$x_{i,j,k}=1$ をマス $(i, j)$ に数字 $k+1$ が入ることを表す **1-hot 符号化**を採用します。
各マスは 1 つの数字を持つので、軸 $k$ 方向に常にちょうど 1 つだけ $1$ が立ちます。

以下の制約を課します:

- 各マスは 1 つの数字を持つ:

$$
\begin{aligned}
\sum_{k=0}^{8} x_{i,j,k}=1 && (0\leq i,j \leq 8)
\end{aligned}
$$

- 各行に各数字がちょうど 1 回ずつ:

$$
\begin{aligned}
\sum_{j=0}^{8} x_{i,j,k}=1 && (0\leq i,k \leq 8)
\end{aligned}
$$

- 各列に各数字がちょうど 1 回ずつ:

$$
\begin{aligned}
\sum_{i=0}^{8} x_{i,j,k}=1 && (0\leq j,k \leq 8)
\end{aligned}
$$

- 各 $3\times 3$ ブロックに各数字がちょうど 1 回ずつ:

$$
\begin{aligned}
\sum_{i=3b_r}^{3b_r+2}\sum_{j=3b_c}^{3b_c+2} x_{i,j,k}=1 && (0\leq b_r, b_c\leq 2,\ 0\leq k \leq 8)
\end{aligned}
$$

これらの等式制約を二乗ペナルティの和としてエネルギー $f$ を構築します。$f=0$ を達成する変数割り当てが数独の解です。

## ヒントによる変数固定

初期ヒントは追加のペナルティとして与えるのではなく、変数を直接固定 (1 または 0 に置換) します。
ヒントによってマス $(i, j)$ が数字 $v$ と分かっている場合:

- $x_{i,j,v-1} = 1$ (マス $(i, j)$ は数字 $v$ である)
- $x_{i,j,k} = 0$ ($k \ne v-1$、マス $(i, j)$ は数字 $v$ 以外ではない)
- $x_{i,j',v-1} = 0$ ($j' \ne j$、同じ行のほかのマスは $v$ ではない)
- $x_{i',j,v-1} = 0$ ($i' \ne i$、同じ列のほかのマスは $v$ ではない)
- $x_{i',j',v-1} = 0$ ($(i', j')$ が同じ $3\times 3$ ブロック、ほかのマスは $v$ ではない)

これらの強制値を `qbpp::MapList` に集めて `qbpp::replace` に渡すと、エネルギー式から該当する変数が消え、ソルバが扱う変数の数が大幅に削減されます。

## QUBO++ プログラム

以下の QUBO++ プログラムは、上記の制約をもとにエネルギー式を構築し、ヒントによる変数固定後に EasySolver で解きます:

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

#include <iostream>
#include <unordered_set>

// 0 は空きマス。Hard レベルのパズル (Project Euler #1)。
static const int PUZZLE[9][9] = {
  {0, 0, 3, 0, 2, 0, 6, 0, 0},
  {9, 0, 0, 3, 0, 5, 0, 0, 1},
  {0, 0, 1, 8, 0, 6, 4, 0, 0},
  {0, 0, 8, 1, 0, 2, 9, 0, 0},
  {7, 0, 0, 0, 0, 0, 0, 0, 8},
  {0, 0, 6, 7, 0, 8, 2, 0, 0},
  {0, 0, 2, 6, 0, 9, 5, 0, 0},
  {8, 0, 0, 2, 0, 3, 0, 0, 9},
  {0, 0, 5, 0, 1, 0, 3, 0, 0},
};

qbpp::Expr sudoku_expr(const qbpp::Array<3, qbpp::Var>& x) {
  qbpp::Expr f;

  // 各マスは 1 つの数字を持つ。
  for (size_t i = 0; i < 9; ++i)
    for (size_t j = 0; j < 9; ++j)
      f += qbpp::sum(x(i, j, qbpp::all)) == 1;

  // 各行・各列に各数字がちょうど 1 回ずつ。
  for (size_t k = 0; k < 9; ++k) {
    for (size_t i = 0; i < 9; ++i)
      f += qbpp::sum(x(i, qbpp::all, k)) == 1;
    for (size_t j = 0; j < 9; ++j)
      f += qbpp::sum(x(qbpp::all, j, k)) == 1;
  }

  // 各 3x3 ブロックに各数字がちょうど 1 回ずつ。
  for (size_t br = 0; br < 3; ++br)
    for (size_t bc = 0; bc < 3; ++bc)
      for (size_t k = 0; k < 9; ++k)
        f += qbpp::sum(x(qbpp::slice(3 * br, 3 * br + 3),
                         qbpp::slice(3 * bc, 3 * bc + 3),
                         k)) == 1;
  return f;
}

qbpp::MapList fix_variables(const qbpp::Array<3, qbpp::Var>& x) {
  // ヒントから導かれる強制値 (0 または 1) を MapList に集める。
  // 同じ変数に対する重複は unordered_set で除去する (最初の書き込みを採用)。
  qbpp::MapList ml;
  std::unordered_set<qbpp::vindex_t> seen;
  auto add = [&](int i, int j, int k, int val) {
    qbpp::Var v(x[i][j][k]);
    if (seen.insert(v.index()).second) ml.emplace_back(v, val);
  };
  for (int i = 0; i < 9; ++i) {
    for (int j = 0; j < 9; ++j) {
      int v = PUZZLE[i][j];
      if (v == 0) continue;
      int k_clue = v - 1;
      // マス (i, j) は k_clue である / それ以外の数字ではない。
      for (int k = 0; k < 9; ++k) add(i, j, k, k == k_clue ? 1 : 0);
      // 同じ行・列・ブロックの他のマスは k_clue ではない。
      for (int jj = 0; jj < 9; ++jj)
        if (jj != j) add(i, jj, k_clue, 0);
      for (int ii = 0; ii < 9; ++ii)
        if (ii != i) add(ii, j, k_clue, 0);
      int br = i / 3, bc = j / 3;
      for (int ii = 3 * br; ii < 3 * br + 3; ++ii)
        for (int jj = 3 * bc; jj < 3 * bc + 3; ++jj)
          if (ii != i || jj != j) add(ii, jj, k_clue, 0);
    }
  }
  return ml;
}

void print_sudoku(const qbpp::Array<2, qbpp::coeff_t>& solution) {
  for (size_t i = 0; i < 9; ++i) {
    if (i > 0 && i % 3 == 0) std::cout << "------+-------+------\n";
    for (size_t j = 0; j < 9; ++j) {
      int v = static_cast<int>(solution[i][j]);
      std::cout << (v >= 0 ? std::to_string(v + 1) : ".");
      if (j == 2 || j == 5) std::cout << " | ";
      else if (j != 8) std::cout << ' ';
    }
    std::cout << '\n';
  }
}

int main() {
  auto x = qbpp::var("x", 9, 9, 9);
  auto f = sudoku_expr(x);
  auto sub = fix_variables(x);

  auto initial_sol = qbpp::Sol(f).set(sub);
  std::cout << "Puzzle:\n";
  print_sudoku(qbpp::onehot_to_int(initial_sol(x)));

  auto g = qbpp::replace(f, sub);
  g.simplify_as_binary();

  qbpp::EasySolver solver(g);
  auto sol = solver.search({{"target_energy", 0}});
  auto full_sol = qbpp::Sol(f).set(sol, sub);

  std::cout << "\nSolution:\n";
  print_sudoku(qbpp::onehot_to_int(full_sol(x)));
}
```
{% endraw %}

`qbpp::var("x", 9, 9, 9)` は形状 $(9, 9, 9)$ のバイナリ変数の 3 次元配列 `x` を生成します。

`sudoku_expr` 関数は以下のスライス記法と `qbpp::sum`、`== 1` 構文を用いて 4 種類の等式制約に対応する二乗ペナルティを構築します:
- `x(i, j, qbpp::all)` はマス $(i, j)$ の 9 個の変数からなる軸 $k$ 方向のベクトル。
- `x(i, qbpp::all, k)` は行 $i$ で数字 $k+1$ に対応する 9 個の変数のベクトル。
- `x(qbpp::all, j, k)` は列 $j$ で数字 $k+1$ に対応する 9 個の変数のベクトル。
- `x(qbpp::slice(3*br, 3*br+3), qbpp::slice(3*bc, 3*bc+3), k)` は $3\times 3$ ブロックで数字 $k+1$ に対応する 9 個の変数の 2 次元配列。

これらに `qbpp::sum(...) == 1` を適用すると、対応する和が 1 のとき 0 となる二乗ペナルティ式が得られます。

`fix_variables` 関数は、ヒントに対して上記の固定値 (1 または 0) を `qbpp::MapList` に集めます。
同じ変数に複数回書き込みが発生し得るため、`std::unordered_set<qbpp::vindex_t>` で既出をチェックし、最初の書き込みのみ `emplace_back` します。マス自身に対する書き込みを先に処理することで、ヒントの「= 1」の値が他のヒントの近傍規則による「= 0」より優先されます。

`qbpp::replace(f, sub)` は、`sub` に含まれる各変数を対応する定数 (0 または 1) で置換した新しい式 `g` を返します。これにより `g` から固定された変数が消え、`g.simplify_as_binary()` で簡約することで `g` の変数の数と項数が大幅に減少します。

`qbpp::EasySolver(g)` で `g` をソルバに渡し、{% raw %}`search({{"target_energy", 0}})`{% endraw %} で目標エネルギー 0 を達成する解 `sol` を求めます。
`g` には空きマスに対応する変数しか含まれていないため、`sol` も空きマスの値のみを保持しています。
ヒントを含む完全な解は `qbpp::Sol(f).set(sol, sub)` で構築します。
これは、もとの式 `f` のすべての変数を含む新しい `Sol` を作り、まず `sol` の値をコピーし、続けて `sub` の固定値を反映するイディオムです。

最後に、`full_sol(x)` で 3 次元の 0/1 配列を得て、`qbpp::onehot_to_int` で軸 $k$ 方向の 1-hot を整数 $(0,\ldots,8)$ に復号し、`print_sudoku` で `+1` した値を出力します。

実行すると、ヒント (`.` が空きマス) と求めた解が以下のように表示されます:
```
Puzzle:
. . 3 | . 2 . | 6 . .
9 . . | 3 . 5 | . . 1
. . 1 | 8 . 6 | 4 . .
------+-------+------
. . 8 | 1 . 2 | 9 . .
7 . . | . . . | . . 8
. . 6 | 7 . 8 | 2 . .
------+-------+------
. . 2 | 6 . 9 | 5 . .
8 . . | 2 . 3 | . . 9
. . 5 | . 1 . | 3 . .

Solution:
4 8 3 | 9 2 1 | 6 5 7
9 6 7 | 3 4 5 | 8 2 1
2 5 1 | 8 7 6 | 4 9 3
------+-------+------
5 4 8 | 1 3 2 | 9 7 6
7 2 9 | 5 6 4 | 1 3 8
1 3 6 | 7 9 8 | 2 4 5
------+-------+------
3 7 2 | 6 8 9 | 5 1 4
8 1 4 | 2 5 3 | 7 6 9
6 9 5 | 4 1 7 | 3 8 2
```
