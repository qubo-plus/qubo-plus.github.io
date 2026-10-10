---
last_modified: 2026-10-10
layout: demo
title: "日勤・夜勤の勤務表をブラウザで最適化: QUBO シフトスケジューリング デモ"
description: "職員の休み希望を入れて、4 週間の日勤・夜勤の勤務表を作るデモです。必要人数・責任者・連勤・勤務の切り替えのルールを QUBO++ の cons() で書き、出勤日数・夜勤・休日出勤ができるだけ均等になる勤務表を求めます。スラック変数は使いません。"
lang: ja
hreflang_alt: "en/demos/shift-scheduling/"
hreflang_lang: "en"
permalink: /ja/demos/shift-scheduling/
nav_exclude: true
math: true
image: /assets/demos/og/shift-scheduling-ja.png
demo_id: shift
heading: "日勤・夜勤の勤務表を QUBO で作る"
lead: "勤務表のセルをクリックして休み希望を入れ、Solve を押します。QUBO++ が、どの勤務もちょうど必要人数になり、出勤日数・夜勤・休日出勤ができるだけ均等になるように、4 週間の勤務表を作ります。"
app_name: "シフトスケジューリング（QUBO++ デモ）"
docs_links:
  - label: "ケーススタディ: C++ 版（QUBO++）"
    url: /ja/SHIFT_ROSTER
  - label: "Python 版（PyQBPP）"
    url: /ja/python/SHIFT_ROSTER
  - label: "cons(): C++ 版"
    url: /ja/CONSTRAINTS
  - label: "Python 版"
    url: /ja/python/CONSTRAINTS
---

## 使い方

- **Sample data** で 11 人の職員（管理職 3 人・熟練者 3 人・従業員 5 人）と 9 件の休み希望を読み込みます。
  **Random requests** は休み希望をランダムに入れ替えます。
  **+ Add staff** で職員を加えられ（40 人まで）、各行で名前と区分（**Manager**・**Skilled**・**Staff**）を変えたり、× で削除したりできます。
- 勤務表のセルをクリックすると、その日が休み希望になります。平日なら有給休暇、土日なら休日出勤をしない日です。
  もう一度クリックすると外れます。
- **Required staff** で各勤務の必要人数（ちょうどこの人数。0 ならその勤務は休業）を、
  **Max working days in a row** で連勤の上限を変えられます。
- **Time**（1〜10 秒）を選んで **Solve** を押します。
  探索中は、それまでに見つかった最良の勤務表が表示されます。**Clear schedule** は勤務表を消します（休み希望は残ります）。
- ルールに違反するセルは赤で表示されます。
  集計欄には、ルール違反の数、公平さ（2 乗和）とその下界、1 人あたりの出勤日数・夜勤・休日出勤の範囲が表示されます。
  下の **QUBO++ model** で、解いたモデルを見られます。

このデモは資源の限られた AWS Lambda 上で動いています。
デスクトップ PC 上の QUBO++ は数倍速く動きます。

## 勤務表を QUBO にする

職員 $i$ が日 $t$ に日勤・夜勤をするとき 1 になるバイナリ変数 $d_{i,t}$・$n_{i,t}$ を使います。
休み希望の日の変数は作りません（その日は休みに決まります）。
日 $t$ の日勤と夜勤の必要人数を $r^{\mathrm{D}}_t$・$r^{\mathrm{N}}_t$、連勤の上限を $K$ とします。
日勤の責任者になれる職員の集合 $L_t$ は、平日なら管理職、土日なら管理職と熟練者で、
夜勤の責任者になれる職員の集合 $L'$ は管理職と熟練者です。
ルールは、すべての職員 $i$ と日 $t$ について次のとおりです。

$$
\begin{aligned}
& d_{i,t} + n_{i,t} \le 1 && \text{1 日 1 勤務まで}\\
& \textstyle\sum_i d_{i,t} = r^{\mathrm{D}}_t, \qquad \sum_i n_{i,t} = r^{\mathrm{N}}_t && \text{必要人数}\\
& \textstyle\sum_{i \in L_t} d_{i,t} \ge 1, \qquad \sum_{i \in L'} n_{i,t} \ge 1 && \text{責任者}\\
& \textstyle\sum_{u=t}^{t+K} (d_{i,u} + n_{i,u}) \le K && \text{連勤}\\
& n_{i,t} + d_{i,t+1} \le 1, \qquad d_{i,t} + n_{i,t+1} \le 1 && \text{日勤と夜勤の切り替え}
\end{aligned}
$$

責任者のルールは、その勤務の必要人数が 0 の日には付けません。
目的関数は、出勤日数・夜勤・休日出勤（土日の勤務）の回数の 2 乗和です。

$$
\text{最小化}\quad \sum_i \Big(\sum_t (d_{i,t} + n_{i,t})\Big)^2 + \sum_i \Big(\sum_t n_{i,t}\Big)^2 + \sum_i \Big(\sum_{t\ \text{が土日}} (d_{i,t} + n_{i,t})\Big)^2
$$

必要人数がちょうどに決まっているので、3 つの回数の合計はどの勤務表でも同じです。
合計が同じなら、2 乗和は回数がそろっているときに小さくなります。

QUBO++ では、ルールをすべて `cons()` で書きます。
重みは目的関数の取りうる最大値より大きくしてあるので、ルールを破る勤務表は、ルールを満たす勤務表より必ずエネルギーが大きくなります。
ソルバーはこれらの制約を直接扱うので、1000 本を超える不等式にスラック変数は要りません。
モデルの変数は $d_{i,t}$ と $n_{i,t}$ だけです（サンプルでは 598 個）。
このモデルを、QUBO++ の ABS3 ソルバーが CPU 上で解きます。
3 つの回数の合計を全員にできるだけ均等に配ったときの 2 乗和が下界で、
探索がこの下界に達すると、その勤務表が最適であることが示されるので、その時点で止まります。

## 自分のコンピュータで動かす

QUBO++ の Python 版である PyQBPP は、Linux（x86-64・ARM64）と、WSL 経由の Windows で動きます。

```bash
pip install pyqbpp
```

[日勤・夜勤の勤務表のページ](/ja/python/SHIFT_ROSTER) では、このデモのサンプルと同じ問題を短いプログラムで解いています（[C++ 版](/ja/SHIFT_ROSTER) もあります）。
`cons()` は [制約のページ](/ja/python/CONSTRAINTS) で説明しています。
詳しくは [インストール](/ja/python/INSTALL) を見てください。
QUBO++ で解く問題は、[ほかのデモ](/ja/DEMOS) にもあります。
