---
layout: default
nav_exclude: true
title: "ネイティブ制約"
nav_order: 27
lang: ja
hreflang_alt: "en/CONSTRAINTS"
hreflang_lang: "en"
---

# ネイティブ制約

QUBO++ では，式の中の制約部分を `qbpp::cons()` で囲むと，その部分は
**制約とみなされて特別に処理**されます．QUBO++ にバンドルされている
ソルバーは，宣言された制約を満たすように効率よく探索を行います．

{% raw %}
```cpp
#include <qbpp/easy_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 6);
  int value[] = {3, 5, 2, 7, 4, 6};
  int weight[] = {2, 4, 1, 5, 3, 4};

  qbpp::Expr obj, load;
  for (int i = 0; i < 6; ++i) {
    obj += -value[i] * x(i);
    load += weight[i] * x(i);
  }

  auto f = obj + 100 * qbpp::cons(load <= 8)        // capacity, weight 100
               + 10 * qbpp::cons(x(0) + x(1) == 1); // equality, weight 10
  f.simplify_as_binary();

  qbpp::EasySolver solver(f);
  auto sol = solver.search({{"time_limit", 1}});
  std::cout << "objective = " << sol.energy() << std::endl;
}
```
{% endraw %}

従来のペナルティ式からの移行は，制約部分を `qbpp::cons()` で囲むだけです —
`obj + 1000 * (rows + cols)` を `obj + 1000 * qbpp::cons(rows + cols)` に
書き換えます．多くの問題で，同じ制約をペナルティ式のまま解くより
大幅に良い解が得られます．

## 制約の書き方

制約は右辺が整数の比較，または連鎖した両側範囲を `qbpp::cons()` で囲んで
書きます．重みは制約へのスカラー係数として書き，`+` で目的関数や
他の制約と自由に足し合わせられます．

```cpp
auto a = qbpp::var("a"), b = qbpp::var("b"), c = qbpp::var("c");
auto u = qbpp::var("u"), v = qbpp::var("v"), w = qbpp::var("w");

auto cons = 1000 * qbpp::cons(a + b + c == 2)                  // equality
          + 1000 * qbpp::cons(10 * u + 30 * v - 10 * w <= 35)  // one-sided
          + 500 * qbpp::cons(0 <= a + b - c <= 1);             // two-sided
```

配列の比較を囲むと要素ごとに 1 本の制約になるので，行列の one-hot 行は
1 文で書けます．

```cpp
auto y = qbpp::var("y", 4, 4);
auto one_hot = 1000 * qbpp::cons(qbpp::vector_sum(y) == 1);  // one per row
```

制約の重み付き和をまとめて `qbpp::cons()` で囲むこともできます．次の例は
重み 100 と 150 の 2 本の制約を作ります．

```cpp
auto p = qbpp::var("p"), q = qbpp::var("q"), r = qbpp::var("r");
auto cons2 = qbpp::cons(100 * (p + q + r == 2) +
                        150 * (10 * p + 30 * q - 10 * r <= 35));
```

制約を蓄積した式に `*=` を使うと，蓄積済みの全制約の重みを一括で
スケールできます．

```cpp
auto k0 = qbpp::var("k0"), k1 = qbpp::var("k1"), k2 = qbpp::var("k2");
auto cons4 = qbpp::cons(k0 + k1 + k2 == 2);
cons4 += qbpp::cons(k0 + k1 - k2 <= 1);
cons4 *= 1000;                      // scale ALL weights at once
```

式を出力すると**目的関数の多項式**が，`f.cons()` を出力すると宣言された
**制約リスト**が表示されます（重みが 1 のときは係数プレフィックスを省略，
片側制約は片側表示）．

```cpp
auto m0 = qbpp::var("m0"), m1 = qbpp::var("m1"), m2 = qbpp::var("m2");
auto printed = 1000 * qbpp::cons(m0 + m1 + m2 == 2)
             + 500 * qbpp::cons(0 <= m0 + m1 - m2 <= 1);
std::cout << printed.cons() << std::endl;
```

出力は次のようになります．

```
1000 * (m0 +m1 +m2 == 2)
500 * (0 <= m0 +m1 -m2 <= 1)
```

### 離散許容値集合

式の値が**とびとびの許容値のいずれか**に一致することを要求する制約は，
`qbpp::equal{...}` で書けます．`qbpp::cons(s == qbpp::equal{0, 2})` は
`s` が 0 か 2 のときだけ充足されます（`qbpp::cons(s, qbpp::equal{0, 2})`
と書いても同じです）．許容値は任意個・任意の整数を指定できます．

```cpp
auto e = qbpp::var("e", 5);
// 各頂点に接続する辺を 0 本か 2 本だけ選ぶ
auto deg = 100 * qbpp::cons(qbpp::sum(e) == qbpp::equal{0, 2});
```

これはグラフの path や cycle を構成する辺を選ぶ問題（各頂点の次数が
0 か 2 のとき充足）などに便利です．許容値がとびとびのため，両側範囲
`l <= f <= u` では表現できません．制約リストには `== {0, 2}` と
表示されます．この制約は `EasySolver`・`ExhaustiveSolver`・`ABS3Solver`
で使えます（MIP ソルバーは非対応）．

## 式の演算規則

制約付きの式 `f` はモデルの完全な記述です．

- `f(sol)` はソルバーが報告する Energy と一致します．
- `f.cons(sol)` は違反している制約の**本数**を返します（0 なら全充足）．
- 目的関数の調整（`+`, `-`, 定数加算）と正のスカラー倍（重みの一括
  スケール），`simplify_as_binary()`，`qbpp::replace()` は制約を保ったまま
  使えます．
- `f.simplify_as_binary()` は目的関数と制約の両方に適用されます．
  ソルバーに渡す前に 1 回呼んでください — 特に `qbpp::replace()` で
  変数を置換した後に必要です．
- 制約の宣言を壊す演算 — `sqr()`，式同士の乗算，0 以下のスカラー倍，
  制約式を引く減算，`reduce()` など — は明示的にエラーになります．

## ソルバーごとの意味論

すべてのソルバーが同じ式 `f` を 1 引数で受け付けます．

| ソルバー | 意味論 |
|---|---|
| `EasySolver`, `ABS3Solver` | **ソフト**: 制約違反には重みに応じたペナルティが加算され，制約を満たす良い解を効率よく探索する |
| `ExhaustiveSolver` | **ハード**: 制約を満たす割当の中で目的関数を最小化（重みは無視）．実行可能解が存在しなければエラー |
| `GurobiSolver`, `ScipSolver`, `HighsSolver`, `CbcSolver`, `GlpkSolver` | **ハード**: 制約は MIP の線形制約として渡される（重みは無視） |

同一のモデル定義を厳密ソルバーで検証してからヒューリスティックソルバーで
スケールアップできます．

{% raw %}
```cpp
#include <qbpp/easy_solver.hpp>
#include <qbpp/exhaustive_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto z = qbpp::var("z", 4);
  qbpp::Expr obj = -3 * z(0) - 5 * z(1) - 2 * z(2) - 7 * z(3);
  auto f = obj + 100 * qbpp::cons(z(0) + z(1) + z(2) + z(3) == 2);
  f.simplify_as_binary();

  qbpp::ExhaustiveSolver exact(f);             // ground truth
  std::cout << "exact optimum = " << exact.search().energy() << std::endl;

  qbpp::EasySolver heuristic(f);               // same model, scales up
  auto sol = heuristic.search({{"time_limit", 1}});
  std::cout << "heuristic     = " << sol.energy() << std::endl;
}
```
{% endraw %}

ネイティブ制約がある場合，`target_energy` は「エネルギーが target に達し，
**かつ全制約が充足**」のときだけ探索を停止します．

`EasySolver` のデフォルトコールバックはエネルギーと並べて充足の進捗を
表示します．`Energy` はペナルティ込みの合計，`Obj` は目的関数部分，
`Viol = k/m` は m 本の制約のうち k 本が違反中であることを示します．
全制約が充足されると `Energy` と `Obj` は一致します．

## 解の検証

`violations()` は解に対して全制約を評価し，制約値・境界・違反距離・重みを
報告します．

```cpp
auto s = qbpp::var("s", 3);
qbpp::Expr obj2 = -1 * s(0) - 2 * s(1) - 3 * s(2);
auto f3 = obj2 + 10 * qbpp::cons(s(0) + s(1) + s(2) == 1);
f3.simplify_as_binary();

qbpp::ExhaustiveSolver solver3(f3);
auto sol3 = solver3.search();
for (const auto& t : f3.violations(sol3)) {
  std::cout << t.lower << " <= " << t.value << " <= " << t.upper
            << "  violation = " << t.violation << std::endl;
}
std::cout << (f3.is_feasible(sol3) ? "feasible" : "infeasible")
          << std::endl;
```

## 従来のペナルティ式への展開

`qbpp::expand_cons(f)` は，宣言された制約を**従来のペナルティ式**
（比較演算子や `constrain` で書いた場合と同じ形）に展開した通常の式を
返します．ネイティブ制約に対応しない外部の QUBO/HUBO ツールに渡す場合
などに使います．`f` 自身を上書きする `f.expand_cons()` もあります．
展開結果は簡約されていないので，ソルバーに渡す前に
`simplify_as_binary()` を呼んでください．

```cpp
auto n0 = qbpp::var("n0"), n1 = qbpp::var("n1"), n2 = qbpp::var("n2");
auto fe = n0 + 10 * qbpp::cons(n1 + n2 == 1);
auto ge = qbpp::expand_cons(fe);   // fe is unchanged; ge is a plain Expr
ge.simplify_as_binary();
```

## 自由記述ペナルティ

**充足のときちょうど値が 0** になる式であれば，従来の QUBO ペナルティ
スタイルの式をそのまま `qbpp::cons()` に混ぜられます．

```cpp
auto d = qbpp::var("d"), e = qbpp::var("e"), f = qbpp::var("f");
auto g = qbpp::var("g"), h = qbpp::var("h"), i = qbpp::var("i");
auto mixed = qbpp::cons(100 * (d + e + f == 2)      // tracked comparison
                        + 200 * (~g * ~h * ~i));    // penalty: not all 0
```

比較で書いた制約は 1 本ずつ追跡されます．自由記述部分は，その値が 0 の
ときだけ充足と見なされます．デフォルトコールバックはこの部分を
`Pen = ...`（0 なら充足）として表示し，`violations()` は境界 `[0, 0]` の
最終エントリとして報告します．式が非負で最小値 0 になることの保証は
利用者の責任です．

非線形（2 次以上）の式を `qbpp::cons()` に入れた場合も，**等式**（`x*y + z == 1`
など）・**範囲**（`1 <= x*y + z*w <= 2` など）ともにそのまま制約として扱われ，
バンドルされたソルバー（`EasySolver` / `ExhaustiveSolver` / `ABS3Solver`）が
制約を満たすよう探索します．外部の MIP／ILP ソルバーは非線形の制約本体を
受け付けないため，その場合は `expand_cons()`（後述）で従来のペナルティ式に
展開してから渡してください．
