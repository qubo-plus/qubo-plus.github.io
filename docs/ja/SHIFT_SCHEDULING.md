---
layout: default
nav_exclude: true
title: "Shift Scheduling"
nav_order: 31
lang: ja
hreflang_alt: "en/SHIFT_SCHEDULING"
hreflang_lang: "en"
---

# シフトスケジューリング問題
以下の**シフトスケジューリング問題**を考えます。この問題は、総労働者コストを最小化するスケジュールを見つけることを目的とします。

- 6人の労働者と、1日目から31日目までの31日間の計画期間があります。簡単のため、すべての労働者は0日目と32日目は休みであると仮定します。
- 1日目から31日目まで、各日にちょうど4人の労働者をスケジュールする必要があります。
- 各労働者について以下の制約を満たす必要があります：
  - 20日間または21日間勤務する、
  - 連続勤務は6日以内、
  - 連続勤務は3日以上、
  - 孤立した休日がない（休日は連続でなければならない）。


## シフトスケジューリング問題のQUBO定式化
QUBO定式化では、$6\times 33$ のバイナリ変数行列 $X=(x_{i,j})$ ($0\leq i\leq 5, 0\leq j\leq 32$) を使用します。労働者 $i$ が $j$ 日目に勤務するのは $x_{i,j}=1$ のときかつそのときに限ります。

すべての労働者は0日目と32日目は休みであるため、次を固定します：

$$
\begin{aligned}
x_{i,0}=x_{i,32}=0 & &(0\leq i\leq 5).
\end{aligned}
$$

制約は以下のように定式化されます。

### 日次配置制約
各日にちょうど4人の労働者をスケジュールしなければなりません：

$$
\begin{aligned}
\sum_{i=0}^{5} x_{i,j} = 4& &(1\leq j\leq 31)
\end{aligned}
$$

### 総勤務日数制約
各労働者は20日間または21日間勤務しなければなりません：

$$
\begin{aligned}
20\leq \sum_{j=0}^{32} x_{i,j} \leq 21& &(0\leq i\leq 5)
\end{aligned}
$$

### 最大連続勤務日数制約
どの労働者も7日以上連続で勤務してはなりません：

$$
\begin{aligned}
 x_{i,j}x_{i,j+1}x_{i,j+2}x_{i,j+3}x_{i,j+4}x_{i,j+5}x_{i,j+6} = 0 & &(0\leq i\leq 5, 0\leq j\leq 26)\\
\end{aligned}
$$

### 最小連続勤務日数制約
各勤務期間は少なくとも3日連続の勤務日で構成されなければなりません：

$$
\begin{aligned}
 \bar{x}_{i,j}x_{i,j+1}x_{i,j+2}\bar{x}_{i,j+3} = 0 & &(0\leq i\leq 5, 0\leq j\leq 29)\\
\bar{x}_{i,j}x_{i,j+1}\bar{x}_{i,j+2} = 0 & & (0\leq i\leq 5, 0\leq j \leq 30)
\end{aligned}
$$

### 孤立休日禁止制約
どの労働者も2つの勤務日の間に1日だけの休日を持ってはなりません：

$$
\begin{aligned}
 x_{i,j}\bar{x}_{i,j+1}x_{i,j+2} = 0 & &(0\leq i\leq 5, 0\leq j\leq 30)\\
\end{aligned}
$$

### 総労働者コスト
$C=(c_i)$ をコストベクトルとし、$c_i$ は労働者 $i$ を配置する1日あたりのコストを表します。
総労働者コストは次のように定式化されます：

$$
\begin{aligned}
\sum_{i=0}^5\sum_{j=0}^{32} c_i x_{i,j}
\end{aligned}
$$

この目的関数を上記の制約のもとで最小化します。

## シフトスケジューリングのQUBO++プログラム
上で定義したシフトスケジューリング問題は、QUBO++を用いて以下のように定式化・求解できます：
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  const size_t days = 31;
  const auto worker_cost = qbpp::int_array({13, 13, 12, 12, 11, 10});
  const size_t workers = worker_cost.size();

  auto x = qbpp::var("x", workers, days + 2);

  auto workers_each_day = qbpp::vector_sum(x, 0);
  auto each_day_4_workers = qbpp::toExpr(0);
  for (size_t j = 1; j <= days; ++j) {
    each_day_4_workers += workers_each_day[j] == 4;
  }

  auto workers_working_days = qbpp::vector_sum(x);
  auto work_20_21_days = qbpp::sum(20 <= workers_working_days <= 21);

  auto no_more_than_6_consecutive_working_days = qbpp::toExpr(0);
  for (size_t w = 0; w < workers; ++w) {
    for (size_t j = 0; j <= days - 5; ++j) {
      no_more_than_6_consecutive_working_days +=
          x[w][j] * x[w][j + 1] * x[w][j + 2] * x[w][j + 3] * x[w][j + 4] *
          x[w][j + 5] * x[w][j + 6];
    }
  }
  auto no_less_than_3_consecutive_working_days = qbpp::toExpr(0);
  for (size_t w = 0; w < workers; ++w) {
    for (size_t j = 0; j < days - 1; ++j) {
      no_less_than_3_consecutive_working_days +=
          ~x[w][j] * x[w][j + 1] * x[w][j + 2] * ~x[w][j + 3];
    }
    for (size_t j = 0; j < days; ++j) {
      no_less_than_3_consecutive_working_days +=
          ~x[w][j] * x[w][j + 1] * ~x[w][j + 2];
    }
  }

  auto no_single_day_off = qbpp::toExpr(0);
  for (size_t w = 0; w < workers; ++w) {
    for (size_t j = 0; j <= days - 1; ++j) {
      no_single_day_off += x[w][j] * ~x[w][j + 1] * x[w][j + 2];
    }
  }

  auto total_worker_cost = qbpp::sum(worker_cost * workers_working_days);

  auto constraints = work_20_21_days + no_less_than_3_consecutive_working_days +
                     no_more_than_6_consecutive_working_days +
                     no_single_day_off + each_day_4_workers;
  auto f = total_worker_cost + 10000 * constraints;

  qbpp::MapList ml;
  for (size_t i = 0; i < workers; ++i) {
    ml.push_back({x[i][0], 0});
    ml.push_back({~x[i][0], 1});
    ml.push_back({x[i][days + 1], 0});
    ml.push_back({~x[i][days + 1], 1});
  }
  f.simplify_as_binary();

  auto g = qbpp::replace(f, ml);
  g.simplify_as_binary();
  workers_working_days.replace(ml);

  auto solver = qbpp::EasySolver(g);
  auto sol = solver.search({{"time_limit", 5.0}, {"target_energy", 0}});
  for (size_t i = 0; i < workers; ++i) {
    std::cout << "Worker " << i << ": " << sol(workers_working_days[i])
              << " days worked: ";
    for (size_t j = 1; j <= days; ++j) {
      std::cout << sol(x[i][j]);
    }
    std::cout << std::endl;
  }
  std::cout << "Workers each day        : ";
  for (size_t d = 1; d <= days; ++d) {
    std::cout << sol(workers_each_day[d]);
  }
  std::cout << std::endl;

  auto sol_f = qbpp::Sol(f).set(ml).set(sol);

  std::cout << "Total worker cost: " << sol_f(total_worker_cost) << std::endl;
  std::cout << "Constraints violations: " << sol_f(constraints) << std::endl;
}
```
{% endraw %}
このプログラムでは、変数と式は以下のように定義されています：
- `x`: $6\times 33$ のバイナリ変数行列。
- `workers_each_day`: `x` の列方向の和を含む配列で、各日に配置された労働者数を表します。
- `each_day_4_workers`: 各日にちょうど4人の労働者が配置されているときかつそのときに限り最小値0をとる制約式。
- `workers_working_days`: `x` の行方向の和の配列で、各労働者の総勤務日数を表します。
- `work_20_21_days`: 各労働者が20日間または21日間勤務しているときかつそのときに限り最小値0をとる制約式。
- `no_more_than_6_consecutive_working_days`: どの労働者も7日以上連続で勤務していないときかつそのときに限り最小値0をとる制約式。
- `no_less_than_3_consecutive_working_days`: すべての勤務期間が少なくとも3日連続の勤務日で構成されているときかつそのときに限り最小値0をとる制約式。
- `no_single_day_off`: どの労働者も2つの勤務日の間に1日だけの休日を持っていないときかつそのときに限り最小値0をとる制約式。
- `constraints`: すべての制約式の和。
- `total_worker_cost`: 総労働者コストを表す式。

### QUBO構築と求解
`total_worker_cost` と `constraints` をペナルティ係数10000で加算することにより、シフトスケジューリング問題のQUBO定式化を表す式 `f` を得ます。

`qbpp::MapList` オブジェクト `ml` は、0日目と32日目に対応する変数の値を固定するために使用されます。
`qbpp::replace()` 関数を `f` に `ml` を適用することで、新しい式 `g` が得られます。

次に、Easy Solver が `g` に適用され、得られた解が `sol` に格納されます。
得られた解は以下のとおりです：
```
Worker 0: 20 days worked: 0001111001110011111001111001111
Worker 1: 20 days worked: 1111001111110001111110011110000
Worker 2: 21 days worked: 0000111100111110011111100111111
Worker 3: 21 days worked: 1111110011111100111000111111000
Worker 4: 21 days worked: 1111100111001111000111000111111
Worker 5: 21 days worked: 1110011110001111100111111000111
Workers each day        : 4444444444444444444444444444444
Total worker cost: 1465
Constraints violations: 0
```
総労働者コスト `1465` の実行可能なシフトスケジュールが得られ、すべての制約が満たされていることがわかります。
