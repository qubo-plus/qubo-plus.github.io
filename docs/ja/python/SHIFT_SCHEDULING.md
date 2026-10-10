---
last_modified: 2026-10-10
layout: default
nav_exclude: true
title: "シフトスケジューリング"
nav_order: 71
lang: ja
hreflang_alt: "en/python/SHIFT_SCHEDULING"
hreflang_lang: "en"
---

# シフトスケジューリング問題
以下の**シフトスケジューリング問題**を考えます。この問題は、総労働者コストを最小化するスケジュールを求めることを目的とします。

- 6人の労働者がおり、計画期間は1日目から31日目までの31日間です。
簡単のため、すべての労働者は0日目と32日目は休みとします。
- 1日目から31日目までの各日に、ちょうど4人の労働者を配置する必要があります。
- 各労働者について以下の制約を満たす必要があります：
  - 20日または21日勤務する、
  - 連続勤務日数は6日以下、
  - 連続勤務日数は3日以上、
  - 孤立した休日がない（休日は連続でなければならない）。


## シフトスケジューリング問題の定式化
定式化では、$6\times 33$ のバイナリ変数行列 $X=(x_{i,j})$ ($0\leq i\leq 5, 0\leq j\leq 32$) を使用します。労働者 $i$ が $j$ 日目に勤務するのは $x_{i,j}=1$ のときかつそのときに限ります。

すべての労働者は0日目と32日目は休みであるため、次を固定します：

$$
\begin{aligned}
x_{i,0}=x_{i,32}=0 & &(0\leq i\leq 5).
\end{aligned}
$$

制約は以下のように定式化されます。最小連続勤務日数と孤立休日の制約は、禁止したい勤務パターンを表す積が0になるという形で書きます。

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
どの労働者も7日以上連続で勤務してはなりません。すなわち、連続する7日間の勤務日数は6日以下です：

$$
\begin{aligned}
 \sum_{k=j}^{j+6} x_{i,k} \leq 6 & &(0\leq i\leq 5, 0\leq j\leq 26)\\
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

## シフトスケジューリングのPyQBPPプログラム
上で定義したシフトスケジューリング問題は、PyQBPPを用いて以下のように定式化・求解できます：
```python
import pyqbpp as qbpp

days = 31
worker_cost = qbpp.array([13, 13, 12, 12, 11, 10])
workers = len(worker_cost)

x = qbpp.var("x", shape=(workers, days + 2))

workers_each_day = qbpp.vector_sum(x, axis=0)
each_day_4_workers = 0
for j in range(1, days + 1):
    each_day_4_workers += qbpp.cons(workers_each_day[j] == 4)

workers_working_days = qbpp.vector_sum(x)
work_20_21_days = qbpp.cons(workers_working_days, between=(20, 21))

no_more_than_6_consecutive_working_days = 0
for w in range(workers):
    for j in range(days - 4):
        work = qbpp.sum(x[w][j:j + 7])
        no_more_than_6_consecutive_working_days += qbpp.cons(work <= 6)

no_less_than_3_consecutive_working_days = 0
for w in range(workers):
    for j in range(days - 1):
        no_less_than_3_consecutive_working_days += qbpp.cons(
            ~x[w][j] * x[w][j+1] * x[w][j+2] * ~x[w][j+3])
    for j in range(days):
        no_less_than_3_consecutive_working_days += qbpp.cons(
            ~x[w][j] * x[w][j+1] * ~x[w][j+2])

no_single_day_off = 0
for w in range(workers):
    for j in range(days):
        no_single_day_off += qbpp.cons(x[w][j] * ~x[w][j+1] * x[w][j+2])

total_worker_cost = 0
for i in range(workers):
    total_worker_cost += worker_cost[i] * workers_working_days[i]

constraints = (work_20_21_days + no_less_than_3_consecutive_working_days +
               no_more_than_6_consecutive_working_days +
               no_single_day_off + each_day_4_workers)
f = total_worker_cost + 10000 * constraints

ml = {x[i][0]: 0 for i in range(workers)}
ml.update({~x[i][0]: 1 for i in range(workers)})
ml.update({x[i][days + 1]: 0 for i in range(workers)})
ml.update({~x[i][days + 1]: 1 for i in range(workers)})
f.simplify_as_binary()

g = qbpp.replace(f, ml)
g.simplify_as_binary()

solver = qbpp.EasySolver(g)
sol = solver.search(time_limit=5.0)

full_sol = qbpp.Sol(f).set(sol, ml)

for i in range(workers):
    wd = full_sol(workers_working_days[i])
    bits = "".join(str(full_sol(x[i][j])) for j in range(1, days + 1))
    print(f"Worker {i}: {wd} days worked: {bits}")

day_counts = "".join(str(full_sol(workers_each_day[d])) for d in range(1, days + 1))
print(f"Workers each day        : {day_counts}")
print(f"Total worker cost: {full_sol(total_worker_cost)}")
print(f"Violated constraints: {f.cons(full_sol)}")
```
このプログラムでは、変数と式は以下のように定義されています：
- `x`: $6\times 33$ のバイナリ変数行列。
- `workers_each_day`: `x` の列方向の和を含む配列で、各日に配置された労働者数を表します。
- `each_day_4_workers`: 各日にちょうど4人の労働者を配置するという制約。
- `workers_working_days`: `x` の行方向の和の配列で、各労働者の総勤務日数を表します。
- `work_20_21_days`: 各労働者が20日間または21日間勤務するという制約。
- `no_more_than_6_consecutive_working_days`: 連続する7日間の勤務日数が6日以下という制約。
- `no_less_than_3_consecutive_working_days`: すべての勤務期間が3日以上続くという制約。1日または2日だけの勤務を表す積が0になるようにします。
- `no_single_day_off`: 2つの勤務日の間に1日だけの休日を作らないという制約。1日だけの休日を表す積が0になるようにします。
- `constraints`: すべての制約の和。
- `total_worker_cost`: 総労働者コストを表す式。

### 求解
各制約は `qbpp.cons()` で宣言されているので、ソルバーはそれらを制約として扱います。
勤務パターンの制約は、積を `qbpp.cons()` で囲んでおり、積の値が0のときに満たされます。
`total_worker_cost` と `constraints` を重み10000で加算することにより、式 `f` を得ます。

Pythonの `dict` オブジェクト `ml` は、0日目と32日目に対応する変数の値を固定するために使用されます。
`qbpp.replace()` 関数を `f` に `ml` を適用することで、新しい式 `g` が得られます。

次に、Easy Solver が `g` に適用され、得られた解が `sol` に格納されます。
固定された変数を参照する元の式を評価するために、
`full_sol = qbpp.Sol(f).set(sol, ml)` を構築します。これは `ml` の固定値と `sol` の値を統合したものです。

得られた解は以下のとおりです：
```
Worker 0: 20 days worked: 1111001111110011100001111000111
Worker 1: 20 days worked: 0000111111000111110011111001111
Worker 2: 21 days worked: 1111110011111001111100111110000
Worker 3: 21 days worked: 1111110001111100111110011111000
Worker 4: 21 days worked: 0000111100111111001111100111111
Worker 5: 21 days worked: 1111001110001110011111000111111
Workers each day        : 4444444444444444444444444444444
Total worker cost: 1465
Violated constraints: 0
```
`f.cons(full_sol)` は破った制約の本数で、総労働者コスト `1465` の実行可能なシフトスケジュールが得られ、すべての制約が満たされていることがわかります。
延べ勤務日数は $4\times 31=124$ 日なので、6人がそれぞれ20日か21日働くと、4人が21日、2人が20日になります。
コストの安い4人を21日にすると $21\times(12+12+11+10)+20\times(13+13)=1465$ となり、これが総労働者コストの最小値です。
