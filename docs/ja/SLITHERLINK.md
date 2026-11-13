---
last_modified: 2026-11-01
layout: default
nav_exclude: true
title: "スリザーリンク"
nav_order: 71
lang: ja
hreflang_alt: "en/SLITHERLINK"
hreflang_lang: "en"
---

# スリザーリンク

**スリザーリンク**は、点を格子状に並べた盤面で、隣り合う点を結ぶ線を引いて 1 本のループ（閉じた線）を作るパズルです。
次の条件をすべて満たすように線を引きます:

- 線は全体で 1 本のループになる。ループは枝分かれせず、交差もしない。
- 数字の書かれたマスでは、そのマスを囲む 4 辺のうち線を引く辺の本数が数字に等しい。
- 数字のないマスの辺には条件がない。

ここでは $10\times 10$ マスの次の問題を解きます。
`+` が格子点、数字が手がかりです:

```
+   +   +   +   +   +   +   +   +   +   +
      1   1           0       0       0
+   +   +   +   +   +   +   +   +   +   +
      2                       2
+   +   +   +   +   +   +   +   +   +   +
      2   2   1       0
+   +   +   +   +   +   +   +   +   +   +
          3                           1
+   +   +   +   +   +   +   +   +   +   +
  3               1   2   1   1   2
+   +   +   +   +   +   +   +   +   +   +
      0       1               1   1   1
+   +   +   +   +   +   +   +   +   +   +
  1                   1       2
+   +   +   +   +   +   +   +   +   +   +
  1               0           2       2
+   +   +   +   +   +   +   +   +   +   +
  1       0                           1
+   +   +   +   +   +   +   +   +   +   +
  2           1   1           1   1
+   +   +   +   +   +   +   +   +   +   +
```

この問題は QUBO++ のために作ったもので、解がただ 1 つであることを確かめてあります。

このページの解き方は、次の論文の反復法に基づいています。

> **参考文献**:
> Nakahara, Y., Nakano, K., Ito, Y., Ii, K., & Teranishi, K. (2026). **Solving Slitherlink via Iterative Elimination of Multi-Loop Solutions in HUBO and QUBO Formulations**. Proceedings of the International Symposium on Computing and Networking (CANDAR 2026), to appear.

## 定式化

盤面のマスを $R$ 行 $C$ 列とし（ここでは $R=C=10$）、格子点を $(i, j)$（$0\leq i\leq R$, $0\leq j\leq C$）で表します。
隣り合う格子点を結ぶ辺ごとにバイナリ変数を置き、値 1 をその辺に線を引くことと解釈します:

- 横の辺 $h_{i,j}$: 格子点 $(i,j)$ と $(i,j+1)$ を結ぶ（$0\leq i\leq R$, $0\leq j\leq C-1$）。
- 縦の辺 $v_{i,j}$: 格子点 $(i,j)$ と $(i+1,j)$ を結ぶ（$0\leq i\leq R-1$, $0\leq j\leq C$）。

変数は $(R+1)C + R(C+1) = 220$ 個です。

**手がかり**: マス $(i,j)$ に数字 $n_{i,j}$ があれば、そのマスを囲む 4 辺のうち線を引く辺の本数は $n_{i,j}$ です:

$$
h_{i,j} + h_{i+1,j} + v_{i,j} + v_{i,j+1} = n_{i,j}
$$

**格子点の次数**: 格子点 $p$ につながる辺のうち線を引く辺の本数を $\deg(p)$ と書きます。
ループは枝分かれしないので、ループが通る格子点では 2、通らない格子点では 0 です:

$$
\deg(p) \in \lbrace 0, 2\rbrace \qquad (\text{すべての格子点 } p)
$$

[最短路問題](SHORTEST_PATH)と同じく、この条件は `qbpp::cons()` と[許容値の集合](CONSTRAINTS#離散許容値集合) `qbpp::equal{0, 2}` でそのまま書けます。

どの格子点でも次数が 0 か 2 なので、線を引いた辺は交わらないいくつかのループに分かれます。
しかし、ループが 1 本だけになるとは限りません。
上の 2 つの制約だけでは、手がかりを満たすようにループを何本かに分けた**多重ループ**の解もエネルギー 0 になります。
「ループが 1 本」という条件は盤面全体にかかわる条件で、マスや格子点ごとの式では直接書けません。

## 多重ループの消去

そこで、論文の反復法に従って次のように解きます:

1. 手がかりと次数の制約だけで解く。
2. 解をループに分ける。ループ 1 本だけで手がかりをすべて満たせば、それが答え。
3. そうでなければ、解に現れたループをそれぞれ禁止する制約を加えて、1 に戻る。

ループ $L$ を禁止する制約は、$L$ の辺を全部は選ばないという不等式です:

$$
\sum_{e\in L} x_e \leq |L|-1
$$

ここで $x_e$ は辺 $e$ の変数、$|L|$ はループ $L$ の辺の本数です。
$L$ の辺を全部選んだときだけ違反し、違反量は 1 なので、エネルギーが 1 増えます。

この制約を加えても、答えのループはエネルギー 0 のままです。
答えのループが $L$ の辺を全部含むとすると、$L$ は答えのループの一部分でできたループになります。
1 本のループの一部分の辺だけではループはできないので、それは $L$ が答えのループそのものである場合に限られます。
答えのループを消してしまうことは、手順 2 で防いでいます。

手順 2 では、ループ 1 本だけで手がかりをすべて満たすかを調べます。
解全体も手がかりをすべて満たしているので、ループ $L$ だけで手がかりを満たすなら、他のループは数字のあるマスの辺を通りません。
このとき、他のループを取り除いた $L$ はパズルの条件をすべて満たします。

## QUBO++ プログラム

以下のプログラムは、この反復法でスリザーリンクを解きます:

{% raw %}
```cpp
#include <qbpp/abs3_solver.hpp>
#include <qbpp/qbpp.hpp>

#include <iostream>
#include <string>
#include <vector>

// 盤面: 数字は手がかり、'.' は手がかりのないマス。
const std::vector<std::string> BOARD = {
    ".11..0.0.0", ".2.....2..", ".221.0....", "..3......1", "3...12112.",
    ".0.1...111", "1....1.2..", "1...0..2.2", "1.0......1", "2..11..11.",
};
const int R = static_cast<int>(BOARD.size());
const int C = static_cast<int>(BOARD[0].size());

// 辺: 変数と両端の格子点。格子点 (i, j) の番号は i * (C + 1) + j。
struct Edge {
  qbpp::Var x;
  int a, b;
};

// 横の辺 h[i][j] と縦の辺 v[i][j] の、edges の中での番号。
int h_index(int i, int j) { return i * C + j; }
int v_index(int i, int j) { return (R + 1) * C + i * (C + 1) + j; }

// 選んだ辺を盤面に描く。
void print_board(const std::vector<bool>& selected) {
  for (int i = 0; i <= R; ++i) {
    std::string line;
    for (int j = 0; j < C; ++j)
      line += selected[h_index(i, j)] ? "+---" : "+   ";
    std::cout << line << "+" << std::endl;
    if (i == R) break;
    line = "";
    for (int j = 0; j <= C; ++j) {
      line += selected[v_index(i, j)] ? "|" : " ";
      if (j < C) {
        line += ' ';
        line += (BOARD[i][j] == '.') ? ' ' : BOARD[i][j];
        line += ' ';
      }
    }
    while (!line.empty() && line.back() == ' ') line.pop_back();
    std::cout << line << std::endl;
  }
}

// 解の選んだ辺をループに分ける。各ループは辺の番号の列。
std::vector<std::vector<int>> find_loops(const std::vector<bool>& selected,
                                         const std::vector<Edge>& edges) {
  const int M = static_cast<int>(edges.size());
  std::vector<bool> used(M, false);
  std::vector<std::vector<int>> loops;
  for (int s = 0; s < M; ++s) {
    if (!selected[s] || used[s]) continue;
    std::vector<int> loop;
    int k = s, p = edges[s].b;  // 辺 s から始めて、格子点 p の側へたどる
    while (!used[k]) {
      used[k] = true;
      loop.push_back(k);
      for (int k2 = 0; k2 < M; ++k2) {
        if (selected[k2] && !used[k2] &&
            (edges[k2].a == p || edges[k2].b == p)) {
          p = (edges[k2].a == p) ? edges[k2].b : edges[k2].a;
          k = k2;
          break;
        }
      }
    }
    loops.push_back(loop);
  }
  return loops;
}

// ループ 1 つだけで、すべての手がかりを満たすか。
bool satisfies_clues(const std::vector<int>& loop, int M) {
  std::vector<bool> in_loop(M, false);
  for (int k : loop) in_loop[k] = true;
  for (int i = 0; i < R; ++i)
    for (int j = 0; j < C; ++j) {
      if (BOARD[i][j] == '.') continue;
      int count = in_loop[h_index(i, j)] + in_loop[h_index(i + 1, j)] +
                  in_loop[v_index(i, j)] + in_loop[v_index(i, j + 1)];
      if (count != BOARD[i][j] - '0') return false;
    }
  return true;
}

int main() {
  auto h = qbpp::var("h", R + 1, C);  // 横の辺
  auto v = qbpp::var("v", R, C + 1);  // 縦の辺
  std::vector<Edge> edges;
  for (int i = 0; i <= R; ++i)
    for (int j = 0; j < C; ++j)
      edges.push_back({h[i][j], i * (C + 1) + j, i * (C + 1) + j + 1});
  for (int i = 0; i < R; ++i)
    for (int j = 0; j <= C; ++j)
      edges.push_back({v[i][j], i * (C + 1) + j, (i + 1) * (C + 1) + j});
  const int M = static_cast<int>(edges.size());

  // 手がかり: マスを囲む 4 辺のうち、選ぶ辺の本数が数字に等しい。
  auto f = qbpp::toExpr(0);
  for (int i = 0; i < R; ++i)
    for (int j = 0; j < C; ++j)
      if (BOARD[i][j] != '.')
        f += qbpp::cons(h[i][j] + h[i + 1][j] + v[i][j] + v[i][j + 1] ==
                        BOARD[i][j] - '0');

  // 各格子点につながる、選んだ辺の本数（次数）は 0 か 2。
  for (int p = 0; p < (R + 1) * (C + 1); ++p) {
    auto deg = qbpp::toExpr(0);
    for (const auto& e : edges)
      if (e.a == p || e.b == p) deg += e.x;
    f += qbpp::cons(deg == qbpp::equal{0, 2});
  }

  qbpp::Sol sol(f);
  for (int iteration = 1;; ++iteration) {
    f.simplify_as_binary();
    auto solver = qbpp::ABS3Solver(f);
    qbpp::Params params({{"target_energy", 0}});
    if (iteration > 1) params.hint(sol);  // 前回の解から探索を始める
    sol = solver.search(params);

    std::vector<bool> selected(M);
    for (int k = 0; k < M; ++k) selected[k] = sol(edges[k].x) == 1;
    auto loops = find_loops(selected, edges);
    std::cout << "iteration " << iteration << ": energy = " << sol.energy()
              << ", loops =";
    for (const auto& loop : loops) std::cout << " " << loop.size();
    std::cout << std::endl;
    if (iteration == 1) print_board(selected);
    if (sol.energy() != 0) continue;

    for (const auto& loop : loops) {
      if (satisfies_clues(loop, M)) {
        std::vector<bool> answer(M, false);
        for (int k : loop) answer[k] = true;
        print_board(answer);
        return 0;
      }
    }
    // どのループも単独では手がかりを満たさない: 見つかったループを禁止する。
    for (const auto& loop : loops) {
      auto sum = qbpp::toExpr(0);
      for (int k : loop) sum += edges[k].x;
      f += qbpp::cons(sum <= static_cast<int>(loop.size()) - 1);
    }
  }
}
```
{% endraw %}

`qbpp::var("h", R + 1, C)` と `qbpp::var("v", R, C + 1)` で横の辺と縦の辺の変数の配列を作り、
すべての辺を（変数、両端の格子点）の組として `edges` に並べます。
格子点 $(i,j)$ には番号 $i(C+1)+j$ を付けています。

手がかりの制約は、マス $(i,j)$ を囲む 4 辺の変数の和に `==` を適用して `qbpp::cons()` で宣言します。
次数の制約は、格子点 `p` ごとに `p` を端点とする辺の変数を足して次数 `deg` を作り、
`qbpp::cons(deg == qbpp::equal{0, 2})` で宣言します。

反復のループでは、毎回 `f` から ABS3 Solver を作り直します。
制約をすべて満たすとエネルギーが 0 になるので、
{% raw %}`qbpp::Params params({{"target_energy", 0}})`{% endraw %} で目標エネルギー 0 に到達した時点で探索を打ち切ります。
2 回目からは `params.hint(sol)` で前回の解を[ヒント解](ABS3#solution-hint)として渡します。
新しく加えた制約に違反するのは前回の解のループの部分だけなので、前回の解から探索を始めると、新しい解が速く見つかります。

`find_loops()` は選んだ辺をたどって、解をループに分けます。
どの格子点でも次数が 0 か 2 なので、ある辺から始めて、まだたどっていない隣の辺へ進むことを繰り返すと、出発した辺に戻ってループが 1 本得られます。
`satisfies_clues()` は、ループ 1 本の辺だけで手がかりをすべて満たすかを調べます。
どのループも手がかりを満たさなければ、解に現れたループごとに `qbpp::cons(sum <= loop.size() - 1)` を加えます。

## 実行結果

プログラムは、反復ごとにエネルギーと、解に現れたループの辺の本数を出力します。
最初の解と最後の答えは盤面に描きます。
出力の例は以下のとおりです:

```
iteration 1: energy = 0, loops = 14 4 4 56 4 4
+---+---+---+---+   +   +   +   +   +   +
|     1   1     |     0       0       0
+---+   +   +   +---+   +---+   +---+   +
    | 2             |   |   | 2 |   |
+   +---+---+---+---+   +---+   +---+   +
      2   2   1       0
+---+---+---+   +---+   +   +---+---+   +
|         3 |   |   |       |       | 1
+---+   +---+   +   +---+---+   +---+   +
  3 |   |       | 1   2   1   1 | 2
+---+   +---+---+   +---+   +   +   +   +
|     0       1     |   |     1 | 1   1
+   +   +---+   +   +---+   +   +   +---+
| 1     |   |         1       2 |   |   |
+   +   +---+   +   +   +---+---+   +   +
| 1               0     |     2     | 2 |
+   +   +   +   +   +   +   +---+---+   +
| 1       0             |   |         1 |
+   +   +   +   +   +   +---+   +   +   +
| 2           1   1           1   1     |
+---+---+---+---+---+---+---+---+---+---+
iteration 2: energy = 0, loops = 4 48 4 8 6 4 4
iteration 3: energy = 0, loops = 6 52 10 12
iteration 4: energy = 0, loops = 12 52 10
iteration 5: energy = 0, loops = 8 62 4 8
iteration 6: energy = 0, loops = 62 8 6
iteration 7: energy = 0, loops = 12 60 4
iteration 8: energy = 0, loops = 66 6
iteration 9: energy = 0, loops = 60 6
iteration 10: energy = 0, loops = 64 4
iteration 11: energy = 0, loops = 64 6
+   +   +   +   +   +   +   +   +   +   +
      1   1           0       0       0
+   +---+---+   +   +   +   +   +---+   +
    | 2     |                 2 |   |
+   +   +---+   +   +   +   +---+   +   +
    | 2 | 2   1       0     |       |
+---+   +   +---+---+   +---+   +   +   +
|       | 3 |       |   |           | 1
+---+   +---+   +   +---+   +   +   +   +
  3 |             1   2   1   1   2 |
+---+   +   +   +---+---+---+---+---+   +
|     0       1 |             1   1   1
+   +   +   +   +---+---+---+   +   +---+
| 1                   1     | 2     |   |
+   +   +   +   +   +   +   +---+   +   +
| 1               0           2 |   | 2 |
+   +   +   +   +   +   +   +   +---+   +
| 1       0                           1 |
+   +   +   +   +   +   +   +   +   +   +
| 2           1   1           1   1     |
+---+---+---+---+---+---+---+---+---+---+
```

最初の解はエネルギー 0 で、手がかりと次数の制約をすべて満たしていますが、6 本のループに分かれています。
辺 4 本の小さなループは、数字のないマスを囲んでいます。
反復ごとに見つかったループが禁止され、11 回目の解では辺 64 本のループが 1 本だけで手がかりをすべて満たしたので、それを答えとして描いています。
11 回目の解に残っていた辺 6 本のループは、数字のあるマスの辺を通らないので、取り除いても手がかりは満たされたままです。

ソルバーの探索は乱数を使うので、途中の解と反復の回数は実行ごとに変わります。
この問題では、6〜14 回の反復で答えが得られ、全体の時間は GPU のある環境で数秒、GPU のない環境で数秒〜数十秒でした。
解がただ 1 つなので、答えのループは毎回同じです。

## HUBO による表し方

ループ $L$ を禁止する制約 $\sum_{e\in L} x_e \leq |L|-1$ は、$L$ の辺を全部選んだときだけエネルギーを 1 増やします。
これは、$L$ の辺の変数の積と同じ値です:

$$
\prod_{e\in L} x_e
$$

論文では、この積の項を加える形（HUBO）でループを禁止しています。
プログラムで `qbpp::cons(sum <= loop.size() - 1)` の代わりにループの辺の変数の積を `f` に加えても、エネルギー関数は変わりません。
積の項の次数はループの辺の本数（この問題では 60 を超えることもあります）ですが、QUBO++ のソルバーは高次の項をそのまま扱えます。

## QUBO による表し方

外部の QUBO ソルバーで解くには、2 次までの式に書き直す必要があります。
論文では、格子点の次数の制約 $\deg(p)\in\lbrace 0,2\rbrace$ を補助のバイナリ変数 $y_p$ を使って $(\deg(p)-2y_p)^2$ と書き、
ループを禁止する不等式も補助変数（スラック変数）を使ったペナルティ式で書いています。
`qbpp::cons()` で宣言すると、補助変数を使わずに制約をそのままソルバーへ渡せます。
