---
layout: default
nav_exclude: true
title: "Range Constraints"
nav_order: 8
lang: ja
hreflang_alt: "en/RANGE"
hreflang_lang: "en"
---

# 範囲制約と整数線形計画法の求解

## 範囲制約の多項式定式化
$f$ をバイナリ変数の多項式とします。
範囲制約は $l<u$ に対して **$l\leq f\leq u$** の形式を持ちます。
目標は、範囲制約が満たされる場合に限り最小値0をとる多項式を設計することです。

鍵となるアイデアは、範囲 $[l,u]$ の値をとる**補助整数変数** $a$ を導入することです。
以下の式を考えます:

$$
\begin{aligned}
g &= (f-a)^2
\end{aligned}
$$

この式 $g$ は $f=a$ のときに限り最小値0をとります。
$a$ は $[l,u]$ の任意の整数値をとれるため、式 $g$ は $f$ 自身が同じ範囲内の整数値をとる場合に限り0を達成します。

この補助変数の手法を用いて、QUBO++は範囲制約を実装しています。
$f$ が線形式の場合、$g$ はQUBO式になります。
$f$ が3次以上の場合、$g$ はHUBO式になります。

>**NOTE**
> QUBO++は内部的に軽量な改善を施しており、範囲制約をわずかに少ないバイナリ変数数で符号化できます。
> 詳細は[比較演算子](COMPARISON)に記載されています。


## 整数線形計画法の求解
**整数線形計画法**のインスタンスは、**目的関数**と複数の**線形制約**から構成されます。
例えば、以下の整数線形計画問題は2つの変数、1つの目的関数、2つの制約を持ちます:

$$
\begin{aligned}
\text{Maximize: } & & & 5x + 4y \\
\text{Subject to: } & && 2x + 3y \le 24 \\
                   & & & 7x + 5y \le 54
\end{aligned}
$$

この問題の最適解は $x=4$, $y=5$ であり、目的関数値は $40$ です。

以下のQUBO++プログラムは、Easy Solverを使用してこの最適解を求めます:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  auto x = 0 <= qbpp::var_int("x") <= 10;
  auto y = 0 <= qbpp::var_int("y") <= 10;
  auto f = 5 * x + 4 * y;
  auto c1 = 0 <= 2 * x + 3 * y <= 24;
  auto c2 = 0 <= 7 * x + 5 * y <= 54;
  auto g = -f + 100 * (c1 + c2);
  g.simplify_as_binary();
  auto solver = qbpp::EasySolver(g);
  auto sol = solver.search({{"time_limit", 1.0}});
  std::cout << "x = " << sol(x) << ", y = " << sol(y) << std::endl;
  std::cout << "f = " << sol(f) << std::endl;
  std::cout << "c1 = " << sol(c1) << ", c2 = " << sol(c2) << std::endl;
  std::cout << "c1.body(sol) = " << c1.body(sol) << ", c2.body(sol) = " << c2.body(sol) << std::endl;
}
```
{% endraw %}

このQUBO++プログラムでは、
- **`f`** は目的関数を表し、
- **`c1`** と **`c2`** は範囲制約を表し、
- **`g`** はこれらを1つの最適化式にまとめたものです。

目標が最大化であるため、目的関数は `-f` として符号を反転しています。
制約 `c1` と `c2` には重み100のペナルティを付け、高い優先度で制約が満たされるようにしています。

`g` に対してEasy Solverインスタンスを作成し、制限時間1.0秒で探索を実行します。
最適解 `sol` を取得した後、`x`、`y`、`f`、`c1`、`c2`、`c1.body(sol)`、`c2.body(sol)` の値を出力します。

プログラムの出力は以下の通りです:
```
x = 4, y = 5
f = 40
c1 = 0, c2 = 0
c1.body(sol) = 23, c2.body(sol) = 53
```
ここで、
- **`c1`** は制約 `0 <= 2 x + 3 y <= 24` のペナルティ式（制約が満たされると 0）であり、
- **`c1.body()`** は線形式 `2 x + 3 y` を返し、`c1.body(sol)` はその値を `sol` で評価します。

ソルバーが正しく最適解を見つけたことが確認できます。
