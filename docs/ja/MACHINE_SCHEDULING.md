---
last_modified: 2026-10-08
layout: default
nav_exclude: true
title: "納期付き機械スケジューリング"
nav_order: 59
lang: ja
hreflang_alt: "en/MACHINE_SCHEDULING"
hreflang_lang: "en"
---

# 納期付き機械スケジューリング

ある工場に 3 台の機械と 12 件の注文があります。
注文ごとに納期があり、処理時間は機械によって違います。処理できない機械もあります。
各注文は 1 台の機械で処理し、どの注文も納期までに終えなければなりません。
機械は一度に 1 件ずつ、休みなく処理します。
このページでは、そのようなスケジュールのうち、まず**処理時間の合計**が最小のものを、
次に**メイクスパン**（最後の注文が終わる時刻）が最小のものを求めます。
同じ問題は、ブラウザ上の [機械スケジューリングのデモ](demos/machine-scheduling/) でも試せます。

注文は次のとおりです（時間の単位は分。– はその機械では処理できないことを表します）。

| 注文 | 納期 | 機械 1 | 機械 2 | 機械 3 |
|---:|---:|---:|---:|---:|
| 1 | 250 | – | 75 | – |
| 2 | 170 | 95 | – | 160 |
| 3 | 320 | 90 | – | 140 |
| 4 | 405 | 65 | – | – |
| 5 | 190 | 95 | 155 | 155 |
| 6 | 355 | 85 | 95 | – |
| 7 | 360 | 40 | 60 | 80 |
| 8 | 225 | 85 | 120 | 135 |
| 9 | 480 | 80 | 130 | 145 |
| 10 | 100 | 100 | 100 | – |
| 11 | 300 | 110 | 135 | 175 |
| 12 | 500 | 90 | 150 | – |

速い機械を使えば時間は短くなりますが、すべての注文を最も速い機械に置くと機械 1 に注文が集中し、
12 件中 10 件が納期に間に合いません。

## 定式化

注文 $j$ を機械 $m$ で処理するとき 1 になるバイナリ変数 $y_{j,m}$ を使います。
変数は、機械 $m$ が注文 $j$ を処理できる組についてだけ作ります（この注文では 27 個）。

機械が注文を処理する順序を変えても、処理時間の合計は変わりません。
また、ある機械の注文をどう並べればすべての納期に間に合うなら、納期の早い順でも間に合います。
そこで、各機械は注文を納期の早い順に処理することにし、決めるのは割当てだけにします。
注文を納期の早い順に番号付けすると、注文 $j$ が機械 $m$ で終わる時刻は次のとおりです。

$$
C_{j,m} = \sum_{i \le j} p_{i,m}\, y_{i,m}
$$

ここで $p_{i,m}$ は注文 $i$ の機械 $m$ での処理時間です。
モデルは次のとおりです。

$$
\begin{aligned}
\text{最小化}\quad & \sum_{j,m} p_{j,m}\, y_{j,m} \\
\text{制約}\quad & \sum_{m} y_{j,m} = 1 && \text{（すべての注文 } j\text{）}\\
& C_{j,m} \le d_j && \text{（すべての機械 } m \text{ と注文 } j\text{）}
\end{aligned}
$$

$d_j$ は注文 $j$ の納期です。
2 つ目の制約は、注文 $j$ が機械 $m$ にないときにも正しく働きます。
そのとき $C_{j,m}$ は、機械 $m$ でそれより前に処理する最後の注文の終了時刻で、その注文の納期は $d_j$ 以前だからです。

それぞれの制約は `qbpp::cons()` で書き、処理時間の合計よりずっと大きい重み 100000 を付けます。
QUBO++ はこれらの制約を直接扱うので、不等式制約にスラック変数は要りません。

## プログラム

{% raw %}
```cpp
#include <algorithm>
#include <iostream>
#include <numeric>
#include <vector>

#include <qbpp/easy_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  // 納期と、機械 1, 2, 3 での処理時間（分。0 はその機械では処理できない）
  std::vector<int> due = {250, 170, 320, 405, 190, 355, 360, 225, 480, 100, 300, 500};
  std::vector<std::vector<int>> time = {
      {0, 75, 0},     {95, 0, 160},  {90, 0, 140},    {65, 0, 0},
      {95, 155, 155}, {85, 95, 0},   {40, 60, 80},    {85, 120, 135},
      {80, 130, 145}, {100, 100, 0}, {110, 135, 175}, {90, 150, 0}};
  int n = due.size();
  int machines = 3;

  // 納期の早い順に並べた注文
  std::vector<int> order(n);
  std::iota(order.begin(), order.end(), 0);
  std::stable_sort(order.begin(), order.end(),
                   [&](int a, int b) { return due[a] < due[b]; });

  auto y = qbpp::var("y", n, machines);
  qbpp::Expr f;
  for (int j = 0; j < n; ++j)
    for (int m = 0; m < machines; ++m)
      if (time[j][m] > 0) f += time[j][m] * y[j][m];

  // 各注文をちょうど 1 台の機械で処理する
  for (int j = 0; j < n; ++j) {
    qbpp::Expr row;
    for (int m = 0; m < machines; ++m)
      if (time[j][m] > 0) row += y[j][m];
    f += 100000 * qbpp::cons(row == 1);
  }

  // 各注文は納期までに終わる
  for (int m = 0; m < machines; ++m) {
    qbpp::Expr finish;
    for (int j : order) {
      if (time[j][m] == 0) continue;
      finish += time[j][m] * y[j][m];
      f += 100000 * qbpp::cons(finish <= due[j]);
    }
  }
  f.simplify_as_binary();

  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"time_limit", 1.0}});

  int total = 0;
  for (int m = 0; m < machines; ++m) {
    std::cout << "Machine " << m + 1 << ":";
    int t = 0;
    for (int j : order) {
      if (time[j][m] == 0 || sol(y[j][m]) == 0) continue;
      std::cout << " #" << j + 1 << "(" << t << "-" << t + time[j][m] << ")";
      t += time[j][m];
      total += time[j][m];
    }
    std::cout << std::endl;
  }
  std::cout << "Total processing time: " << total << std::endl;
}
```
{% endraw %}

このプログラムは、各機械で処理する注文を開始時刻と終了時刻とともに出力します。

```
Machine 1: #2(0-95) #5(95-190) #11(190-300) #7(300-340) #4(340-405) #12(405-495)
Machine 2: #10(0-100) #1(100-175) #6(175-270) #9(270-400)
Machine 3: #8(0-135) #3(135-275)
Total processing time: 1170
```

- `order` は納期の早い順に並べた注文、`y` は変数 $y_{j,m}$ です。
- `f` は処理時間の合計に制約を加えた式です。
  `finish` は機械 `m` での注文 `j` の終了時刻 $C_{j,m}$ なので、`finish <= due[j]` がその納期の制約です。
- `EasySolver` で 1 秒間探索します。

すべての注文が納期に間に合い、処理時間の合計は 1170 分です。
すべての割当てを調べると、これがこの注文での最小値であることを確かめられます。

## メイクスパンの最小化

上のスケジュールでは、機械 1 は 495 分まで動きますが、機械 3 は 275 分で終わります。
メイクスパンを最小にするには、メイクスパンを表す[ネイティブ整数変数](NATIVE_INTEGER) $z$ を加え、
どの機械も $z$ までに終わるという制約を課し、目的関数に $100z$ を加えます。

$$
\begin{aligned}
\text{最小化}\quad & 100z + \sum_{j,m} p_{j,m}\, y_{j,m} \\
\text{制約}\quad & \text{上の制約}\\
& L_m \le z && \text{（すべての機械 } m\text{）}
\end{aligned}
$$

$L_m = \sum_j p_{j,m}\, y_{j,m}$ は機械 $m$ が動いている時間です。
時間はすべて 5 分の倍数なので、メイクスパンは 5 分単位で変わり、その重みは 500 です。
一方、この注文の処理時間の合計は、最大でも 466 分（各注文の最も遅い処理時間と最も速い処理時間の差の和）しか変わりません。
そのため、まずメイクスパンが最小になり、メイクスパンが同じスケジュールの中で処理時間の合計が最小になります。

プログラムでは、`0 <= qbpp::int_var("z") <= 600` で $z$ を宣言し、納期の制約の後に新しい項を加えます。

{% raw %}
```cpp
#include <algorithm>
#include <iostream>
#include <numeric>
#include <vector>

#include <qbpp/easy_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  // 納期と、機械 1, 2, 3 での処理時間（分。0 はその機械では処理できない）
  std::vector<int> due = {250, 170, 320, 405, 190, 355, 360, 225, 480, 100, 300, 500};
  std::vector<std::vector<int>> time = {
      {0, 75, 0},     {95, 0, 160},  {90, 0, 140},    {65, 0, 0},
      {95, 155, 155}, {85, 95, 0},   {40, 60, 80},    {85, 120, 135},
      {80, 130, 145}, {100, 100, 0}, {110, 135, 175}, {90, 150, 0}};
  int n = due.size();
  int machines = 3;

  // 納期の早い順に並べた注文
  std::vector<int> order(n);
  std::iota(order.begin(), order.end(), 0);
  std::stable_sort(order.begin(), order.end(),
                   [&](int a, int b) { return due[a] < due[b]; });

  auto y = qbpp::var("y", n, machines);
  qbpp::Expr f;
  for (int j = 0; j < n; ++j)
    for (int m = 0; m < machines; ++m)
      if (time[j][m] > 0) f += time[j][m] * y[j][m];

  // 各注文をちょうど 1 台の機械で処理する
  for (int j = 0; j < n; ++j) {
    qbpp::Expr row;
    for (int m = 0; m < machines; ++m)
      if (time[j][m] > 0) row += y[j][m];
    f += 100000 * qbpp::cons(row == 1);
  }

  // 各注文は納期までに終わる
  for (int m = 0; m < machines; ++m) {
    qbpp::Expr finish;
    for (int j : order) {
      if (time[j][m] == 0) continue;
      finish += time[j][m] * y[j][m];
      f += 100000 * qbpp::cons(finish <= due[j]);
    }
  }

  // メイクスパン z: どの機械も z までに終わる
  auto z = 0 <= qbpp::int_var("z") <= 600;
  f += 100 * z;
  for (int m = 0; m < machines; ++m) {
    qbpp::Expr load;
    for (int j = 0; j < n; ++j)
      if (time[j][m] > 0) load += time[j][m] * y[j][m];
    f += 100000 * qbpp::cons(load - z <= 0);
  }
  f.simplify_as_binary();

  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"time_limit", 1.0}});

  int total = 0;
  for (int m = 0; m < machines; ++m) {
    std::cout << "Machine " << m + 1 << ":";
    int t = 0;
    for (int j : order) {
      if (time[j][m] == 0 || sol(y[j][m]) == 0) continue;
      std::cout << " #" << j + 1 << "(" << t << "-" << t + time[j][m] << ")";
      t += time[j][m];
      total += time[j][m];
    }
    std::cout << std::endl;
  }
  std::cout << "Makespan: " << sol(z) << std::endl;
  std::cout << "Total processing time: " << total << std::endl;
}
```
{% endraw %}

このプログラムの出力は次のとおりです。

```
Machine 1: #2(0-95) #5(95-190) #11(190-300) #7(300-340) #4(340-405)
Machine 2: #10(0-100) #1(100-175) #6(175-270) #12(270-420)
Machine 3: #8(0-135) #3(135-275) #9(275-420)
Makespan: 420
Total processing time: 1245
```

メイクスパンは 495 分から 420 分に短くなり、その代わりに処理時間の合計は 1170 分から 1245 分に増えます。

## ブラウザで試す

[機械スケジューリングのデモ](demos/machine-scheduling/) では、注文の編集、チャート上での移動、目的の選択ができ、
サーバー上でモデルを解けます。
すべての納期を守れない注文も受け付け、そのときは `relu()` で書いた遅れの合計をまず最小にします。
