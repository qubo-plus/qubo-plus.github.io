---
last_modified: 2026-11-17
layout: default
title: "QUBO++ の表現力"
nav_order: 2.5
lang: ja
hreflang_alt: "en/MODELING"
hreflang_lang: "en"
---

# QUBO++ の表現力

QUBO/HUBO ソルバーが最終的に受け取るのは，バイナリ変数の多項式です．
そのため従来は，解きたい問題を自分でそこまで**降ろす**必要がありました．
整数はバイナリ変数の列に展開し，不等式にはスラック変数を足し，
絶対値や最大値は補助変数と場合分けで表現し，順列や巡回路は one-hot 制約を組み合わせて表し，3 次以上の項は 2 次に落とす．
変換のたびに変数が増え，ペナルティの重みを調整する手間が生まれ，
元の問題の構造は見えなくなります．

QUBO++ はこの作業を要求しません．
**書いたモデルが，そのまま解かれるモデルです．**

| 従来の QUBO で必要な手作業 | QUBO++ での書き方 | 詳細 |
|---|---|---|
| 3 次以上の項を補助変数で 2 次に落とす | そのまま書く | [HUBO と QUBO](HUBO_QUBO) |
| $\bar{x}$ を $1-x$ に展開する（項数が爆発する） | `~x` と書く | [否定リテラル](NEGATIVE) |
| 整数をバイナリ変数の列に展開する | `qbpp::int_var()` で宣言する | [ネイティブ整数変数](INTEGER) |
| 絶対値・最大値を補助変数と場合分けで表す | `qbpp::abs()`・`qbpp::max()` と書く | [非線形関数とネイティブ制約](CONSTRAINTS) |
| 不等式にスラック変数を足し，重みを調整する | `qbpp::cons()` で囲む | [非線形関数とネイティブ制約](CONSTRAINTS) |
| 割当・巡回路・配送ルートを one-hot 制約の組合せで表し，重みを調整する | `qbpp::distinct()`・`qbpp::cycle()`・`qbpp::cycles()` と書く | [構造制約](STRUCTURAL) |
| 係数のオーバーフローを自分で管理する | 型を選ぶ | [変数と式のデータ型](VAREXPR) |

本ページはこれらの機能の**概観**です．
それぞれの詳しい説明は表の右端のリンク先を参照してください．

## 任意の次数の項

QUBO++ の式は 2 次に限定されません．
3 次以上の項をそのまま書くことができます．

```cpp
auto y = qbpp::var("y", 4);
auto cubic = 2 * y[0] * y[1] * y[2] - 3 * y[1] * y[2] * y[3];
std::cout << "cubic = " << cubic << std::endl;
```

このプログラムの出力は以下の通りです:

```
cubic = 2*y[0]*y[1]*y[2] -3*y[1]*y[2]*y[3]
```

QUBO++ にバンドルされているソルバーは HUBO をそのまま扱うため，
2 次化は必要ありません．
2 次のモデルしか受け取らない外部ソルバーに渡すときだけ，
[HUBO の QUBO への変換](REDUCE)で 2 次化してください．

## 否定リテラル

バイナリ変数 $x$ の否定 $\bar{x}$ は **`~x`** と書けます．
$\bar{x}$ を $1-x$ に置き換えて展開する必要はありません．

```cpp
auto x = qbpp::var("x", 4);
auto neg = ~x[0] * ~x[1] * ~x[2] * ~x[3];
auto expanded = qbpp::simplify((1 - x[0]) * (1 - x[1]) * (1 - x[2]) * (1 - x[3]));
std::cout << "neg      = " << neg << std::endl;
std::cout << "expanded = " << expanded << std::endl;
```

このプログラムの出力は以下の通りです:

```
neg      = ~x[0]*~x[1]*~x[2]*~x[3]
expanded = 1 -x[0] -x[1] -x[2] -x[3] +x[0]*x[1] +x[0]*x[2] +x[0]*x[3] +x[1]*x[2] +x[1]*x[3] +x[2]*x[3] -x[0]*x[1]*x[2] -x[0]*x[1]*x[3] -x[0]*x[2]*x[3] -x[1]*x[2]*x[3] +x[0]*x[1]*x[2]*x[3]
```

どちらも同じ値を持つ式ですが，項数は 1 対 16 です．
否定リテラルが 1 つ増えるたびに展開後の項数は 2 倍になるため，
この差は変数が増えるほど広がります．

## 整数変数 — 2 つの選択肢

QUBO++ には性格の異なる 2 種類の整数変数があります．

```cpp
auto a = 0 <= qbpp::var_int("a") <= 10;   // バイナリエンコーディング
auto b = 0 <= qbpp::int_var("b") <= 10;   // ネイティブ整数変数
std::cout << "a = " << a << std::endl;
std::cout << "b = " << b << std::endl;
```

このプログラムの出力は以下の通りです:

```
a = a[0] +2*a[1] +4*a[2] +3*a[3]
b = b
```

**`qbpp::var_int()`** で宣言した整数変数は，
その場でバイナリ変数の重み付き和に展開されます（[バイナリエンコードの整数変数](BINARY_INTEGER)）．
**`qbpp::int_var()`** で宣言した整数変数は展開されず，
整数値をそのまま保持します（[整数変数](INTEGER)）．
どちらも式の中では同じように扱えます．

| | `qbpp::var_int()` | `qbpp::int_var()` |
|---|---|---|
| 式の中での実体 | バイナリ変数の重み付き和 | 整数値そのもの |
| バンドルソルバー | バイナリ変数として探索 | 整数値のまま探索 |
| 範囲を広げたとき | 変数の個数が増える | 変数の個数は増えない |
| バイナリ専用の外部ソルバー | そのまま渡せる | `qbpp::binarize()` で変換 |
| MILP ソルバー | 通常モードではバイナリ変数として渡る．ILP モード（`qbpp::ilp`）では，モデルが線形で変数がひとまとまりで現れていれば整数変数に復元して渡る | ILP モード（`qbpp::ilp`）で整数変数のまま渡せる |

数量（個数・時刻・在庫量など）にはネイティブ整数変数が適しています．
どれを選ぶかという**ラベル**（色など）には，
整数変数よりも [one-hot 表現](ONEHOT)が適しています．
訪問順序や割当のように，項目どうしが互いに異なる値をとるものは，[構造制約](STRUCTURAL)（`distinct`・`cycle`）で表せます．

## 非線形関数

絶対値・ReLU・最大値・最小値を，式の中で直接使えます．
補助変数を導入したり場合分けを書いたりする必要はありません．

```cpp
auto q = 0 <= qbpp::int_var("q") <= 10;
auto r = 0 <= qbpp::int_var("r") <= 10;
auto over = 2 * qbpp::relu(q - 6);   // 6 を超えた分だけ増えるコスト
auto gap = qbpp::abs(q - 5);         // 5 からのずれ
auto peak = qbpp::max(q, r);         // 2 つの式の最大値
```

`qbpp::abs(f, 2)`・`qbpp::relu(f, 2)` と書くと 2 乗になります．
詳しくは[非線形関数とネイティブ制約](CONSTRAINTS)を参照してください．

## 制約の宣言

式の中の制約部分を **`qbpp::cons()`** で囲むと，
その部分は制約とみなされて特別に処理されます．
スラック変数を自分で足す必要はありません．

```cpp
auto w = qbpp::var("w", 3);
auto load = 3 * w[0] + 5 * w[1] + 7 * w[2];
auto obj = -qbpp::sum(w)                         // 目的関数
         + 100 * qbpp::cons(load <= 10)          // 不等式制約
         + 100 * qbpp::cons(qbpp::sum(w) == 2);  // 等式制約
```

等式・片側の不等式・両側の範囲を同じ書き方で宣言できます．
制約を満たす解が見つかったかどうかは，ソルバーが違反本数として報告します．
詳しくは[非線形関数とネイティブ制約](CONSTRAINTS)を参照してください．

## 構造制約

割当（順列）・巡回路・配送ルートのように，解が決まった**形**をしていなければならない問題では，
その形を 1 つの制約として宣言できます．

```cpp
auto x = qbpp::var("x", 5, 5);
auto tour = qbpp::cycle(x);                     // 5 地点をすべて回る巡回路
auto y = qbpp::var("y", 4, 6);
auto assign = qbpp::distinct(y);                // 4 つの仕事を 6 台の機械に重ならないように割り当てる
auto r = qbpp::var("r", 3, 5, 5);
auto routes = qbpp::cycles(r, qbpp::depot{0});  // 地点 0 から出る 3 台の車両のルート
```

目的関数や `cons()` と同じように式に足して使います．
`cons()` と違って重みはなく，Easy Solver と ABS3 Solver が返す解は必ずこの形になります．
one-hot 制約を組み合わせて同じ形を表すときのような，重みの調整は要りません．
`qbpp::cycle()` は辺のリストや必ず通る頂点（`qbpp::via`）も受け取れるので，
最短路のようにすべての頂点を通らない閉路も表せます．
詳しくは[構造制約](STRUCTURAL)を参照してください．

## 係数の型

係数とエネルギー値の型は，マクロ 1 つで切り替えられます．
`int32_t` から，128 ビット整数，桁数無制限の `qbpp::cpp_int`，
実数の `double` まで選べます．
式の書き方は型によらず同じです．
一覧は[変数と式のデータ型](VAREXPR)を参照してください．

## すべてを 1 つのモデルに

ここまでの機能は組み合わせて使えます．
次のプログラムは，3 本の生産ラインへの割当を求めます．

- ライン $i$ を使うかどうかをバイナリ変数 `use[i]` で表し，使うと段取り費 5 がかかる
- ライン $i$ の生産量をネイティブ整数変数 `q[i]`（0 以上 10 以下）で表す
- 生産量が 6 を超えた分には超過費が 2 倍でかかる（`relu`）
- ライン 0 と 1 の生産量の偏りをコストに加える（`abs`）
- 停止しているラインでは生産できない（不等式制約）
- 3 本の生産量の合計はちょうど 20（等式制約）
- 3 本すべてを止めた場合は違約金 50（3 次の否定リテラル項）

{% raw %}
```cpp
#include <qbpp/exhaustive_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto use = qbpp::var("use", 3);              // バイナリ変数
  auto q = 0 <= qbpp::int_var("q", 3) <= 10;   // ネイティブ整数変数

  auto f = qbpp::toExpr(0);
  for (int i = 0; i < 3; ++i) {
    f += 5 * use[i];                                 // 段取り費
    f += 2 * qbpp::relu(q[i] - 6);                   // 超過費
    f += 100 * qbpp::cons(q[i] - 10 * use[i] <= 0);  // 停止中は生産できない
  }
  f += qbpp::abs(q[0] - q[1]);                       // ライン間の偏り
  f += 50 * ~use[0] * ~use[1] * ~use[2];             // 全停止の違約金
  f += 100 * qbpp::cons(qbpp::sum(q) == 20);         // 需要をちょうど満たす

  f.simplify_as_binary();
  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search();
  for (int i = 0; i < 3; ++i)
    std::cout << "use[" << i << "] = " << sol(use[i])
              << ", q[" << i << "] = " << sol(q[i]) << std::endl;
  std::cout << "energy = " << sol.energy() << std::endl;
}
```
{% endraw %}

このプログラムの出力は以下の通りです:

```
use[0] = 1, q[0] = 7
use[1] = 1, q[1] = 7
use[2] = 1, q[2] = 6
energy = 19
```

段取り費 15，超過費 4（生産量 7 が 2 本），偏り 0，制約違反なしで合計 19 です．
このモデルには，補助変数もスラック変数も 1 つも現れていません．

## 構造制約を含むモデル

構造制約も，ほかの機能と組み合わせて使えます．
次のプログラムは，地点 0 から出て地点 0 に戻る巡回路のうち，長さが 72 以下で，訪れた地点の得点の和が最大のものを求めます．
すべての地点を回る必要はありません．

- 地点 $i$ から地点 $j$ へ進むかどうかをバイナリ変数 `x[i][j]` で表す
- 地点 $i$ を出る辺があれば地点 $i$ の得点が入る（`x[i][j]` に `score[i]` を掛けて足した `qbpp::einsum<0>("ij,i->", x, score)`．得点の和を最大にするので，式では符号を反転する）
- 巡回路の長さは 72 以下（不等式制約）
- 選んだ辺は地点 0 を通る 1 つの閉路になる（`qbpp::cycle(x, qbpp::via{0})`）

{% raw %}
```cpp
#include <qbpp/easy_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  const int n = 6;
  auto dist = qbpp::array({{0, 12, 18, 25, 16, 22},
                           {12, 0, 10, 20, 24, 30},
                           {18, 10, 0, 11, 19, 25},
                           {25, 20, 11, 0, 13, 17},
                           {16, 24, 19, 13, 0, 9},
                           {22, 30, 25, 17, 9, 0}});
  auto score = qbpp::array({0, 8, 6, 9, 5, 7});
  auto x = qbpp::var("x", n, n);  // x[i][j] = 1: 地点 i から地点 j へ進む

  auto length = qbpp::sum(dist * x);                        // 巡回路の長さ
  qbpp::Expr gain = qbpp::einsum<0>("ij,i->", x, score);    // 訪れた地点の得点の和
  auto f = -gain;
  f += 100 * qbpp::cons(length <= 72);  // 巡回路の長さは 72 以下
  f += qbpp::cycle(x, qbpp::via{0});    // 地点 0 を通る 1 つの閉路

  f.simplify_as_binary();
  qbpp::EasySolver solver(f);
  auto sol = solver.search({{"time_limit", 1.0}});
  std::cout << "visited:";
  for (int i = 0; i < n; ++i)
    for (int j = 0; j < n; ++j)
      if (sol(x[i][j]) == 1) std::cout << " " << i;
  std::cout << std::endl;
  std::cout << "length = " << length(sol) << std::endl;
  std::cout << "energy = " << sol.energy() << std::endl;
}
```
{% endraw %}

このプログラムの出力は以下の通りです:

```
visited: 0 1 2 3 5
length = 72
energy = -30
```

地点 1・2・3・5 を回る長さ 72 の巡回路で，得点の和は 30 です．
得点 5 の地点 4 も回ると長さが 75 になり，上限を超えます．
構造制約は Exhaustive Solver では使えないので，この例は Easy Solver で解いています．

## 従来の形式へ降ろす

外部のソルバーに渡すなど，従来の形式が必要になったときは，
モデルを明示的に降ろすことができます．

| 関数 | 変換 |
|---|---|
| `qbpp::binarize(f)` | ネイティブ整数変数をバイナリエンコーディングに |
| `qbpp::expand_cons(f)` | `qbpp::cons()` の宣言を従来のペナルティ式に |
| `qbpp::reduce(f)` | 3 次以上の項を 2 次に |

```cpp
auto n = 0 <= qbpp::int_var("n") <= 10;
auto bits = qbpp::binarize(n);
std::cout << "bits = " << bits << std::endl;
```

このプログラムの出力は以下の通りです:

```
bits = n#0 +2*n#1 +4*n#2 +3*n#3
```

MILP ソルバーへは，整数変数を整数のまま渡す
[ILP モード](MILP_SOLVERS)も利用できます．
構造制約は `qbpp::expand_cons()` で従来のペナルティ式に展開できません．
MILP ソルバーへの渡し方は[構造制約](STRUCTURAL)のページを参照してください．

## 次に読むページ

- [HUBO の QUBO への変換](REDUCE) — 3 次以上の項の 2 次化
- [否定リテラル](NEGATIVE) — 否定リテラルの扱い
- [整数変数と連立方程式の求解](INTEGER) — 整数値をそのまま保持する整数変数
- [バイナリエンコードの整数変数](BINARY_INTEGER) — バイナリ変数の重み付き和で表す整数変数
- [非線形関数とネイティブ制約](CONSTRAINTS) — `abs`・`relu`・`max`・`min` と `cons()`
- [構造制約](STRUCTURAL) — `distinct`・`cycle`・`cycles`
- [変数と式のデータ型](VAREXPR) — 係数とエネルギーの型
- [クイックスタート](QUICK) — 最初のプログラム
