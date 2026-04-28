---
layout: default
nav_exclude: true
title: "Einsum Function"
nav_order: 19
lang: ja
hreflang_alt: "en/EINSUM"
hreflang_lang: "en"
---

# Einsum: numpy 風のテンソル縮約
QUBO++ は **`qbpp::einsum<OutDim>(subscript, arrays...)`** を提供します。
これは numpy の
[アインシュタイン縮約](https://en.wikipedia.org/wiki/Einstein_notation)
と同じ記法で、整数・変数・項・式の多次元配列を 1 行で縮約できる関数です。

テンプレート引数 `OutDim` は出力配列の次元数を指定し、
subscript の出力ラベル数と実行時に照合されます。

## C++ でなぜ `OutDim` が必要か

QUBO++ の多次元配列は **`Array<Dim, T>`** という型で表現されます。
ここで次元 `Dim` は**テンプレート引数（コンパイル時定数）**であり、
`Array<1, Expr>` と `Array<2, Expr>` は **まったく別の型** です。
`einsum` のコードを生成する時点で、コンパイラは戻り値の型を確定する
必要があります。

ところが、出力の次元は subscript 文字列（例: `"ij,jk->ik"` なら 2 次元、
`"i,i->"` ならスカラー）から決まります。subscript は `const char*` 引数として
**実行時にしか中身を見ることができない** ため、**C++ コンパイラには出力次元を
推論する手段がありません**。

そのため、呼び出し側がテンプレート引数として明示的に `OutDim` を指定する
必要があります:

```cpp
auto C  = qbpp::einsum<2>("ij,jk->ik", A, B);   // OutDim = 2 → Array<2, ...>
auto rs = qbpp::einsum<1>("ij->i",     A);      // OutDim = 1 → Array<1, ...>
qbpp::Expr s = qbpp::einsum<0>("i,i->", v, w);  // OutDim = 0 → スカラー
```

`OutDim` と subscript の実際の出力ラベル数が一致しているかは実行時に検査され、
不一致ならエラー終了します。誤ったテンプレート引数が「形の違う配列」として
黙って通ってしまうことはありません。

Python 版でこの引数が不要なのは、Python のオブジェクトが次元情報を実行時に
保持しているためです。Python バインディング側で subscript を解析して、
正しい次元の出力配列を自動的に組み立てています。

## subscript の文法

```
"labels1,labels2,...->out_labels"
```

- 各 **label** は ASCII 1 文字（`,`・`-`・`>`・空白を除く）です。
- 各入力配列は次元数とちょうど同じ数のラベルを持つ必要があります。
- 入力に現れて出力に現れないラベルは **縮約（総和）** されます。
- 入力と出力の両方に現れるラベルは自由軸として残ります。
- **同一入力内に同じラベルが 2 度現れる** と、その 2 つの軸が結合されます
  （trace や対角抽出に使います）。
- 暗黙形式 `"ij,jk"`（`->` を省略）では、全入力中にちょうど 1 度だけ
  現れるラベルをアルファベット順に並べたものが出力になります（numpy と同じ仕様）。
- 右辺が空（`"i,i->"`）の場合は **スカラー出力**（`OutDim == 0`）になります。

## 出力型

- **すべての入力が整数配列**（`Array<Dim, coeff_t>`）の場合、結果も
  整数配列 `Array<OutDim, coeff_t>` になります。`OutDim == 0` のときは
  `coeff_t` のスカラーが返ります。
- それ以外（`Var`, `Term`, `Expr`, `VarInt` を 1 つでも含む）場合は
  `Array<OutDim, Expr>` が返ります。`OutDim == 0` のときは `Expr` のスカラーです。

## 使用例

以下のプログラムは、`einsum` の代表的な使い方を示します。

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  // 1. 行列積: C[i,k] = Σ_j A[i,j] * B[j,k]
  auto A = qbpp::array({{1, 2, 3}, {4, 5, 6}});                // 2×3
  auto B = qbpp::array({{7, 8}, {9, 10}, {11, 12}});           // 3×2
  auto C = qbpp::einsum<2>("ij,jk->ik", A, B);                 // 2×2
  for (size_t i = 0; i < 2; ++i)
    for (size_t k = 0; k < 2; ++k)
      std::cout << "C[" << i << "][" << k << "] = " << C[i][k] << std::endl;

  // 2. 記号行列積: Array<Var> × Array<Var> → Array<Expr>
  auto x = qbpp::var("x", 2, 3);
  auto y = qbpp::var("y", 3, 2);
  auto Z = qbpp::einsum<2>("ij,jk->ik", x, y);
  std::cout << "Z[0][0] = " << Z[0][0] << std::endl;

  // 3. 内積（スカラー出力）: s = Σ_i v[i] * w[i]
  auto v = qbpp::array({1, 2, 3});
  auto w = qbpp::array({4, 5, 6});
  qbpp::coeff_t s = qbpp::einsum<0>("i,i->", v, w);
  std::cout << "dot = " << s << std::endl;

  // 4. トレース: tr = Σ_i M[i,i]
  auto M = qbpp::array({{1, 2, 3}, {4, 5, 6}, {7, 8, 9}});
  qbpp::coeff_t tr = qbpp::einsum<0>("ii->", M);
  std::cout << "trace = " << tr << std::endl;

  // 5. 対角抽出: d[i] = M[i,i]
  auto D = qbpp::array({{10, 0, 0}, {0, 20, 0}, {0, 0, 30}});
  auto d = qbpp::einsum<1>("ii->i", D);
  std::cout << "d = " << d[0] << " " << d[1] << " " << d[2] << std::endl;

  // 6. 外積（縮約なし）
  auto u = qbpp::array({1, 2});
  auto t = qbpp::array({10, 20, 30});
  auto Outer = qbpp::einsum<2>("i,j->ij", u, t);
  std::cout << "Outer[1][2] = " << Outer[1][2] << std::endl;

  // 7. 双線形形式: s = Σ_{i,j} x[i] * W[i,j] * y[j]
  auto W = qbpp::array({{1, 2}, {3, 4}});
  auto xx = qbpp::var("u", 2);
  auto yy = qbpp::var("w", 2);
  qbpp::Expr bil = qbpp::einsum<0>("i,ij,j->", xx, W, yy);
  std::cout << "bilinear = " << bil << std::endl;

  // 8. 配列に対する各種総和
  auto AA = qbpp::array({{1, 2, 3}, {4, 5, 6}});
  auto rowsum = qbpp::einsum<1>("ij->i", AA);   // 各行の総和
  auto colsum = qbpp::einsum<1>("ij->j", AA);   // 各列の総和
  qbpp::coeff_t total = qbpp::einsum<0>("ij->", AA);
  std::cout << "rowsum = " << rowsum[0] << " " << rowsum[1] << std::endl;
  std::cout << "total = " << total << std::endl;
}
```
{% endraw %}

このプログラムは以下を出力します:
```
C[0][0] = 58
C[0][1] = 64
C[1][0] = 139
C[1][1] = 154
Z[0][0] = x[0][0]*y[0][0] +x[0][1]*y[1][0] +x[0][2]*y[2][0]
dot = 32
trace = 15
d = 10 20 30
Outer[1][2] = 60
bilinear = u[0]*w[0] +2*u[0]*w[1] +3*u[1]*w[0] +4*u[1]*w[1]
rowsum = 6 15
total = 21
```

## 3 つ以上の入力

`einsum` は任意個数の入力配列を受け取れます。組合せ最適化での代表例は
**二次割当問題（QAP）** 形の目的関数
$\sum_{a,k,l} f_a\, d_{kl}\, x_{a,k}\, x_{a,l}$ です:

{% raw %}
```cpp
auto f = qbpp::array({1, 2, 3});                   // 施設の流量
auto d = qbpp::array({{0, 5}, {7, 0}});            // 拠点間の距離
auto x = qbpp::var("x", 3, 2);                     // 割当行列
qbpp::Expr obj = qbpp::einsum<0>("a,kl,ak,al->", f, d, x, x);
```
{% endraw %}

この 1 行が 4 重の for ループを置き換え、内部では複数の CPU スレッドで
並列に計算されます。

## どのような場面で使うか

目的関数や制約が「テンソル添字でインデックスされた積の総和」として書ける
場合は、`einsum` を使うのが最も簡潔です。明示的な多重ループに比べて、

- 数式構造を直接表現でき、
- 添字計算のミスを避けられ、
- 大規模配列では内部でマルチスレッド化されて高速です。

単純な全要素総和や軸ごとの総和には **`qbpp::sum()`** や
**`qbpp::vector_sum()`**（[Sum 関数](SUM)を参照）の方が直接的です。
複数の配列の積を取る、あるいはインデックス間の関係が複雑になった時点で
`einsum` への切り替えを検討してください。
