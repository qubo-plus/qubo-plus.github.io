---
last_modified: 2026-10-10
layout: default
nav_exclude: true
title: "日勤・夜勤の勤務表"
nav_order: 100
lang: ja
hreflang_alt: "en/python/SHIFT_ROSTER"
hreflang_lang: "en"
---

# 日勤・夜勤の勤務表

ある職場では、土日も含めて毎日、日勤と夜勤を行っています。
職員は 11 人で、管理職 3 人、熟練者 3 人、従業員 5 人です。
月曜から始まる 4 週間の勤務表を作ります。
職員からは休み希望が出ています。平日なら有給休暇、土日なら休日出勤をしない日の希望です。
勤務表は次のルールを満たさなければなりません。

1. 各人は各日、日勤・夜勤・休みのどれか 1 つです。
   休み希望の日は休みです。それ以外の日も、平日を含めて休みになることがあります。
2. 平日の日勤はちょうど 5 人、平日の夜勤と土日の各勤務はちょうど 3 人です。
3. 平日の日勤には管理職が必要です（顧客対応のため）。
   夜勤と土日の日勤には、管理職か熟練者が必要です。
4. 連勤は 6 日までです。
5. 日勤と夜勤を切り替えるときは、間に 1 日以上休みを挟みます。

ルールを満たす勤務表の中から、出勤日数・夜勤・休日出勤（土日の勤務）をできるだけ均等に分ける勤務表を求めます。
勤務が 1 種類だけの勤務表は、[シフトスケジューリング問題](SHIFT_SCHEDULING) で扱っています。
同じ問題は、ブラウザ上の [シフトスケジューリングのデモ](../demos/shift-scheduling/) でも試せます。

## 定式化

職員 $i$ が日 $t$ に日勤・夜勤をするとき 1 になるバイナリ変数 $d_{i,t}$・$n_{i,t}$ を使います。
管理職の集合を $M$、熟練者の集合を $S$ とし、日 $t$ の日勤の責任者になれる職員の集合を $L_t$ とします。
$L_t$ は、平日なら管理職、土日なら管理職と熟練者です。
休み希望の日 $(i,t)$ はルールとしては書かず、$d_{i,t} = n_{i,t} = 0$ に固定します。
5 つのルールは、すべての職員 $i$ と日 $t$ について次のようになります。

$$
\begin{aligned}
& d_{i,t} + n_{i,t} \le 1 && \text{ルール 1}\\
& \textstyle\sum_i d_{i,t} = 5\ (\text{平日}),\ 3\ (\text{土日}), \qquad \sum_i n_{i,t} = 3 && \text{ルール 2}\\
& \textstyle\sum_{i \in L_{t}} d_{i,t} \ge 1, \qquad \sum_{i \in M \cup S} n_{i,t} \ge 1 && \text{ルール 3}\\
& \textstyle\sum_{u=t}^{t+6} (d_{i,u} + n_{i,u}) \le 6 && \text{ルール 4}\\
& n_{i,t} + d_{i,t+1} \le 1, \qquad d_{i,t} + n_{i,t+1} \le 1 && \text{ルール 5}
\end{aligned}
$$

目的関数は次のとおりです。

$$
\text{最小化}\quad \sum_i \Big(\sum_t (d_{i,t} + n_{i,t})\Big)^2 + \sum_i \Big(\sum_t n_{i,t}\Big)^2 + \sum_i \Big(\sum_{t\ \text{が土日}} (d_{i,t} + n_{i,t})\Big)^2
$$

ルール 2 で各勤務の人数がちょうどに決まっているので、どの勤務表でも合計は同じです（出勤 208 日、夜勤 84 回、休日出勤 48 回）。
合計が同じなら、2 乗和は値がそろっているときに最小になります。夜勤 6 回ずつの 2 人なら $72$、4 回と 8 回なら $80$ です。

ルールはすべて線形の等式・不等式です。
それぞれを `qbpp.cons()` で書き、目的関数の取りうる最大値（$11 \times (28^2 + 28^2 + 8^2) = 17952$）より大きい重み 100000 を付けます。
こうすると、ルールを破る勤務表のエネルギーは、ルールを満たす勤務表のエネルギーより必ず大きくなります。
QUBO++ はこれらの制約を直接扱うので、1000 本を超える不等式にスラック変数は要りません。
モデルの変数は $d_{i,t}$ と $n_{i,t}$ だけで、休み希望の日を固定すると 598 個です。

## プログラム

休み希望は (職員, 日) の組で、どちらも 0 から数えます。日 0 は最初の月曜です。

```python
import pyqbpp as qbpp

# 職員の区分: M = 管理職、S = 熟練者、E = 従業員
kind = "MMMSSSEEEEE"
n = len(kind)
days = 28  # 月曜から始まる 4 週間
# 休み希望 (職員, 日): 平日なら有給休暇、
# 土日なら休日出勤不可
requests = [(1, 9), (4, 3), (6, 17), (9, 22), (10, 2), (3, 15), (0, 5), (5, 13), (8, 20)]
# 必要人数: need[土日][勤務]、勤務 0 = 日勤、1 = 夜勤
need = [[5, 3], [3, 3]]


def weekend(d):
    return d % 7 >= 5


off = [[False] * days for _ in range(n)]
for i, d in requests:
    off[i][d] = True

day = qbpp.var("day", shape=(n, days))
night = qbpp.var("night", shape=(n, days))
f = 0

# ルール 1: 1 日 1 勤務まで
for i in range(n):
    for d in range(days):
        f += 100000 * qbpp.cons(day[i][d] + night[i][d] <= 1)

# ルール 2・3: 各勤務をちょうど必要人数にし、責任者を入れる
for d in range(days):
    w = int(weekend(d))
    day_staff = 0
    night_staff = 0
    day_lead = 0
    night_lead = 0
    for i in range(n):
        day_staff += day[i][d]
        night_staff += night[i][d]
        if kind[i] == "M" or (kind[i] == "S" and w):
            day_lead += day[i][d]
        if kind[i] != "E":
            night_lead += night[i][d]
    f += 100000 * qbpp.cons(day_staff == need[w][0])
    f += 100000 * qbpp.cons(night_staff == need[w][1])
    f += 100000 * qbpp.cons(day_lead >= 1)
    f += 100000 * qbpp.cons(night_lead >= 1)

# ルール 4: 連勤は 6 日まで
for i in range(n):
    for d in range(days - 6):
        work = 0
        for t in range(d, d + 7):
            work += day[i][t] + night[i][t]
        f += 100000 * qbpp.cons(work <= 6)

# ルール 5: 日勤と夜勤の間には休みを挟む
for i in range(n):
    for d in range(days - 1):
        f += 100000 * qbpp.cons(night[i][d] + day[i][d + 1] <= 1)
        f += 100000 * qbpp.cons(day[i][d] + night[i][d + 1] <= 1)

# 目的: 出勤日数・夜勤・休日出勤を均等に配る
for i in range(n):
    work = 0
    nights = 0
    holiday = 0
    for d in range(days):
        work += day[i][d] + night[i][d]
        nights += night[i][d]
        if weekend(d):
            holiday += day[i][d] + night[i][d]
    f += qbpp.sqr(work) + qbpp.sqr(nights) + qbpp.sqr(holiday)
f.simplify_as_binary()

# 休み希望の日: 変数を 0 に固定する
ml = {}
for i, d in requests:
    ml[day[i][d]] = 0
    ml[night[i][d]] = 0
g = qbpp.replace(f, ml)
g.simplify_as_binary()

solver = qbpp.ABS3Solver(g)
sol = solver.search(time_limit=10.0)
full_sol = qbpp.Sol(f).set(sol).set(ml)

print("      MTWTFSSMTWTFSSMTWTFSSMTWTFSS  work nights holiday")
for i in range(n):
    row = ""
    work = 0
    nights = 0
    holiday = 0
    for d in range(days):
        if off[i][d]:
            c = "x" if weekend(d) else "L"
        elif full_sol(day[i][d]) == 1:
            c = "D"
        elif full_sol(night[i][d]) == 1:
            c = "N"
        else:
            c = "."
        if c in "DN":
            work += 1
        if c == "N":
            nights += 1
        if weekend(d) and c in "DN":
            holiday += 1
        row += c
    print(f"{kind[i]}{i + 1:2}    {row}{work:6}{nights:7}{holiday:8}")
print("Sum of squares:", f(full_sol))
```

このプログラムは、1 人 1 行で勤務表を出力します。
`D` は日勤、`N` は夜勤、`.` は休み、`L` は有給休暇、`x` は休日出勤をしない土日です。
出力は、例えば次のとおりです。

```
      MTWTFSSMTWTFSSMTWTFSSMTWTFSS  work nights holiday
M 1    .NNNNxN.DDDD.D.NN.D.DDD.DD.N    19      8       4
M 2    N.DDDD.DDLNN.NNN.DD.N.DDD.D.    19      7       4
M 3    DDDDD..NNN..N.DDDDD.N....NNN    18      8       4
S 4    NN.NNN...DDDD.NLNN.D.DDD.DDD    19      8       5
S 5    ..DLD.DDD.DD.DDDD.NN.NNNNNN.    19      8       4
S 6    D.N.DDDD.NNNNxDD.D.D.DD.NNN.    19      8       5
E 7    DDDDDD.NNNN..D..DLDD.NNNN..D    19      8       4
E 8    NNNNN.DDDD..D.DDDDD.D.NN..D.    19      7       4
E 9    DDDD.NNN.D.NNNN.DD.NxD.DDD..    19      8       5
E10    .D...N.DDDDDD.DD.NNNNNLDDD.N    19      7       5
E11    DDLD..N.N.DD.N.NNNN.DDDDDD.D    19      7       4
Sum of squares: 4790
```

- `day`・`night` は変数 $d_{i,t}$・$n_{i,t}$ です。
- `day_lead` は日勤の責任者になれる職員（集合 $L_t$）の日勤の人数、`night_lead` は管理職と熟練者の夜勤の人数です。
- `ml` には、休み希望の日の変数とその値 0 を集めます。
  `qbpp.replace(f, ml)` でこれらの変数を 0 に置き換えるので（[置換関数](REPLACE) を参照）、`g` には現れません。
- `ABS3Solver` で `g` を 10 秒間探索します。`sol` には `g` の変数の値しか入っていないので、
  `qbpp.Sol(f).set(sol).set(ml)` で固定した値も加えた `f` の解 `full_sol` を作ります。
  勤務表と `f(full_sol)` は `full_sol` から出力します。

すべてのルールを満たし、どの勤務もちょうど必要人数です。平日に要らない人は休みになっています。
出勤日数は 1 人 18 日か 19 日、夜勤は 7 回か 8 回、休日出勤は 4 回か 5 回です。
これは最良の結果です。合計 208 日・84 回・48 回を 11 人にできるだけ均等に配ると、2 乗和は
$10 \times 19^2 + 18^2 = 3934$、$7 \times 8^2 + 4 \times 7^2 = 644$、$4 \times 5^2 + 7 \times 4^2 = 212$ になり、
$3934 + 644 + 212 = 4790$ は出力された値そのものです。
探索には乱数を使うので、実行によっては少し大きい値になることがあります。

日勤と夜勤の切り替えには休みが要るので、夜勤は数日ずつまとまって入ります。
例えば 5 番の職員は、22 日目から 27 日目まで 6 日続けて夜勤です。

## ブラウザで試す

[シフトスケジューリングのデモ](../demos/shift-scheduling/) では、休み希望の入力、職員の追加や区分の変更、
必要人数と連勤の上限の変更ができ、サーバー上でモデルを解けます。
ルールを破るセルは赤で表示されます。
