---
layout: default
nav_exclude: true
title: "Magic Square"
nav_order: 40
lang: ja
hreflang_alt: "en/MAGIC"
hreflang_lang: "en"
---

# 魔方陣

3x3の魔方陣とは、1から9までの各整数をちょうど1回ずつ含む3x3の行列であり、すべての行、すべての列、および2つの対角線の和が15になるものです。
以下に例を示します:
```
8 1 6
3 5 7
4 9 2
```

## 魔方陣を求めるための定式化
3x3の魔方陣 $S=(s_{i,j})$ ($0\leq i,j\leq 2$) を求める問題を、ワンホット符号化を用いて定式化します。
バイナリ変数 $x_{i,j,k}$ ($0\leq i,j\leq 2, 0\leq k\leq 8$) を導入します。ここで:

$$
\begin{aligned}
x_{i,j,k}=1 &\Longleftrightarrow & s_{i,j}=k+1
\end{aligned}
$$

したがって、$X=(x_{i,j,k})$ は $3\times 3\times 9$ のバイナリ配列です。
以下の4つの制約を課します。

1. ワンホット制約（各セルに1つの値）:
各セル $(i,j)$ について、$x_{i,j,0}, x_{i,j,1}, \ldots,x _{i,j,8}$ のうちちょうど1つが1でなければなりません:

$$
\begin{aligned}
c_1(i,j): & \sum_{k=0}^8 x _{i,j,k}=1 & (0\leq i,j\leq 2)
\end{aligned}
$$

2. 各値 $k+1$ はちょうど1つのセルに現れなければなりません:

$$
\begin{aligned}
c_2(k): & \sum_{i=0}^2\sum_{j=0}^2x _{i,j,k}=1 & (0\leq k\leq 8)
\end{aligned}
$$

3. 各行および各列の和は15でなければなりません:
$$
\begin{aligned}
c_3(i): & \sum_{j=0}^2\sum_{k=0}^8  (k+1)x _{i,j,k} = 15  &(0\leq i\leq 2)\\
c_3(j): & \sum_{i=0}^2\sum_{k=0}^8 (k+1)x _{i,j,k} = 15 &(0\leq j\leq 2)
\end{aligned}
$$

4. 対角線と反対角線の和
2つの対角線の和も15でなければなりません:
$$
\begin{aligned}
c_4: &  \sum_{k=0}^8 (k+1) (x_{0,0,k}+x_{1,1,k}+x_{2,2,k}) = 15 \\
c_4:  & \sum_{k=0}^8 (k+1) (x_{0,2,k}+x_{1,1,k}+x_{2,0,k}) = 15
\end{aligned}
$$

すべての制約が満たされたとき、割り当て $X=(x_{i,j,k})$ は有効な3x3の魔方陣を表します。

## 魔方陣のためのQUBO++プログラム
以下のQUBO++プログラムは、これらの制約を実装し、魔方陣を求めます:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  auto x = qbpp::var("x", 3, 3, 9);

  auto c1 = qbpp::sum(qbpp::vector_sum(x) == 1);

  auto temp = qbpp::expr(9);
  for (size_t i = 0; i < 3; ++i)
    for (size_t j = 0; j < 3; ++j)
      for (size_t k = 0; k < 9; ++k) {
        temp[k] += x[i][j][k];
      }
  auto c2 = qbpp::sum(temp == 1);

  auto row = qbpp::expr(3);
  auto column = qbpp::expr(3);
  for (size_t i = 0; i < 3; ++i)
    for (size_t j = 0; j < 3; ++j)
      for (size_t k = 0; k < 9; ++k) {
        row[i] += (k + 1) * x[i][j][k];
        column[j] += (k + 1) * x[i][j][k];
      }
  auto c3 = qbpp::sum(row == 15) + qbpp::sum(column == 15);

  auto diag = qbpp::Expr(0);
  for (size_t k = 0; k < 9; ++k)
    diag += (k + 1) * (x[0][0][k] + x[1][1][k] + x[2][2][k]);
  auto anti_diag = qbpp::Expr(0);
  for (size_t k = 0; k < 9; ++k)
    anti_diag += (k + 1) * (x[0][2][k] + x[1][1][k] + x[2][0][k]);
  auto c4 = (diag == 15) + (anti_diag == 15);

  auto f = c1 + c2 + c3 + c4;
  f.simplify_as_binary();

  auto solver = qbpp::easy_solver::EasySolver(f);
  auto sol = solver.search({{"target_energy", 0}});
  auto result = qbpp::onehot_to_int(sol(x));
  for (size_t i = 0; i < 3; ++i) {
    for (size_t j = 0; j < 3; ++j) {
      std::cout << result[i][j] + 1 << " ";
    }
    std::cout << std::endl;
  }
}
```
{% endraw %}
このプログラムでは、$3\times 3\times9$ のバイナリ変数配列 `x` を定義しています。
次に、4つの制約式 `c1`、`c2`、`c3`、`c4` を構築し、それらを `f` にまとめます。
式 `f` は、すべての制約が満たされたときに最小エネルギー0を達成します。

`f` に対するEasy Solverオブジェクト solver を作成し、目標エネルギーを0に設定することで、実行可能（最適）解が見つかり次第、探索が終了します。
返された解は `sol` に格納されます。
最後に、`qbpp::onehot_to_int()` を使用してワンホット表現を整数に変換します。この関数は $\{0,1, \ldots, 8\}$ の整数からなる $3\times 3$ の配列を返します。各要素に $1$ を加えて結果の方陣を出力します。

このプログラムは以下の出力を生成します:
```
8 1 6
3 5 7
4 9 2
```

## 変数の部分固定
左上のセルに値2が割り当てられた解を求めたいとします。
ワンホット符号化では、値2は $k=1$ に対応するため、次のように固定します:

$$
\begin{aligned}
 x_{0,0,k} &=1 & {\rm if\,\,} k=1\\
 x_{0,0,k} &=0 & {\rm if\,\,} k\neq 1
\end{aligned}
$$

さらに、制約 $c_2$ により各数 $k+1$ はちょうど1回だけ出現するため、固定することで他のセルが値2を取れなくなります。
したがって、次のようにも固定できます:

$$
\begin{aligned}
 x_{i,j,1} &=0 & {\rm if\,\,} (i,j)\neq (0,0)\\
\end{aligned}
$$

これらの固定割り当てにより、残りのバイナリ変数の数が減少し、局所探索ベースのソルバーにとって有利になることが多いです。

## 変数の部分固定を用いた魔方陣のQUBO++プログラム
上記のプログラムを以下のように修正します:
{% raw %}
```cpp
  qbpp::MapList ml;
  for (size_t k = 0; k < 9; ++k) {
    if (k == 1)
      ml.push_back({x[0][0][k], 1});
    else
      ml.push_back({x[0][0][k], 0});
  }

  for (size_t i = 0; i < 3; ++i)
    for (size_t j = 0; j < 3; ++j) {
      if (!(i == 0 && j == 0)) {
        ml.push_back({x[i][j][1], 0});
      }
    }

  auto g = qbpp::replace(f, ml);
  g.simplify_as_binary();

  auto solver = qbpp::easy_solver::EasySolver(g);
  auto sol = solver.search({{"target_energy", 0}});

  auto full_sol = qbpp::Sol(f).set(sol).set(ml);
  auto result = qbpp::onehot_to_int(full_sol(x));
  for (size_t i = 0; i < 3; ++i) {
    for (size_t j = 0; j < 3; ++j) {
      std::cout << result[i][j] + 1 << " ";
    }
    std::cout << std::endl;
  }
```
{% endraw %}

このコードでは、`qbpp::MapList` オブジェクト `ml` を作成し、`push_back()` を使用して固定割り当てを追加しています。
次に、`qbpp::replace(f, ml)` を呼び出して固定値を代入し、元の `f` を変更せずに新しい式 `g` を生成します。
`ml` に含まれる変数は `g` から消えます。
Easy Solverを `g` に適用し、解 `sol` にはそれらの固定変数は含まれません。
最後に、ゼロ初期化された `qbpp::Sol(f)` に `set(sol)` と `set(ml)` をチェーンして完全な解を構築します。
得られた `full_sol` は完全な魔方陣を表します。

このプログラムは以下の出力を生成します:
```
2 7 6
9 5 1
4 3 8
```
左上のセルが意図通り2であることが確認できます。
