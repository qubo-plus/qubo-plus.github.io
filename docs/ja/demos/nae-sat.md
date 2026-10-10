---
last_modified: 2026-10-08
layout: demo
title: "NAE-SAT をブラウザで解く: HUBO デモ"
description: "NAE-SAT（Not-All-Equal 充足可能性問題）をブラウザで QUBO++ で解くデモです。どの節にも True と False の変数が両方含まれるようにします。True の数を揃えたり減らしたりする目的関数も選べます。HUBO モデルのまま解きます。"
lang: ja
hreflang_alt: "en/demos/nae-sat/"
hreflang_lang: "en"
permalink: /ja/demos/nae-sat/
nav_exclude: true
math: true
image: /assets/demos/og/nae-sat-ja.png
demo_id: naesat
heading: "NAE-SAT を HUBO で解く"
lead: "各節の変数にチェックを入れ、目的関数を選んで Solve を押します。節の変数がすべて同じ値でなければその節は満たされます。QUBO++ はこの HUBO モデルをそのまま解きます。"
app_name: "NAE-SAT ソルバー（QUBO++ デモ）"
docs_links:
  - label: "C++ 版（QUBO++）"
    url: /ja/NAESAT
  - label: "Python 版（PyQBPP）"
    url: /ja/python/NAESAT
---

## 使い方

- 表の行が節、列が変数（$x_0, x_1, \ldots$）です。
  各節に含める変数にチェックを入れます（1 つの節に 2 つ以上）。
  **×** でその節を削除します。
- **+ Variable** / **− Variable** で変数の数（3〜24）を変え、**+ Clause** で空の節を加えます。
  **+ Random** / **− Random** は、指定した数のセルをランダムにチェックしたり外したりします。
- **Objective** で、節の条件に加える目的を選びます。
  **Balance T≈F**（既定）は True と False の変数の数をできるだけ揃え、
  **Minimize T** / **Minimize F** は True / False の変数の数をできるだけ少なくします。
  **None** は節の条件だけを求めます。
- **Solver**: **ABS3 (CPU)** は **Time** で指定した時間だけ発見的に探索します（公開版のデモでは最長 10 秒）。
  **Exhaustive** は $2^n$ 通りの割当てをすべて調べます。
- 解くと、表に割当て（T/F）と、各節に含まれる True と False の変数の数が表示されます（満たされた節は緑）。
  その下には、解いた HUBO の式が表示されます。

このデモは資源の限られた AWS Lambda 上で動いています。
デスクトップ PC 上の QUBO++ は数倍速く動きます。

## NAE-SAT を HUBO にする

NAE-SAT（Not-All-Equal 充足可能性問題）では、どの節にも True の変数と False の変数が少なくとも 1 つずつ含まれなければなりません。
このデモでは True を $x_i=1$、False を $x_i=0$ で表し、$\overline{x_i}=1-x_i$ とします。
節 $C$ が満たされないのは、その変数がすべて True かすべて False のときだけで、次の式で判定できます。

$$
\prod_{i\in C} x_i \;+\; \prod_{i\in C} \overline{x_i}
$$

この式は、満たされない節では 1、それ以外では 0 になります。
デモでは次の式を最小にします。

$$
\text{目的関数} \;+\; (n^2+1)\sum_{C}\Big(\prod_{i\in C} x_i + \prod_{i\in C} \overline{x_i}\Big)
$$

目的関数は、Balance なら $\left(2\sum_i x_i - n\right)^2$、Minimize T なら $\sum_i x_i$、
Minimize F なら $n-\sum_i x_i$、None なら 0 です。
重み $n^2+1$ は目的関数のどの値よりも大きいので、節を破っても得になることはありません。
$k$ 個の変数を持つ節は $k$ 次の項になるので、このモデルは HUBO（高次の制約なし二値最適化）です。
QUBO++ は、QUBO に変換することなく HUBO のまま解きます。
Balance と None では、取りうる最良の値（0、Balance で $n$ が奇数なら 1）に達した時点で探索が止まります。

## プログラム

QUBO++ の Python 版である PyQBPP を使うと、Balance の目的関数を持つモデルは数行で書けます。

```python
import pyqbpp as qbpp

n = 5

# 節: 各節は変数インデックスの集合
clauses = [
    [0, 1, 2],
    [1, 2, 3],
    [2, 3, 4],
    [0, 3, 4],
]

# バイナリ変数の作成
x = qbpp.var("x", shape=n)

# NAE 制約: 全 True または全 False のときペナルティ
constraint = 0
for clause in clauses:
    all_true = 1
    all_false = 1
    for idx in clause:
        all_true *= x[idx]
        all_false *= ~x[idx]
    constraint += all_true + all_false

# 目的関数: True/False の数のバランス
s = qbpp.sum(x)
objective = (2 * s - n) * (2 * s - n)

# ペナルティ重み付き HUBO 式
penalty_weight = n * n + 1
f = (objective + penalty_weight * constraint).simplify_as_binary()

# 求解
solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=1)  # n=5 は奇数なので最良バランスで (2*s-n)^2 = 1

# 結果の出力
print(f"Energy = {sol.energy}")
print("Assignment:", " ".join(f"x[{i}]={sol(x[i])}" for i in range(n)))

print(f"constraint = {sol(constraint)}")
print(f"objective  = {sol(objective)}")

# 検証: 各節のチェック
all_satisfied = True
for k, clause in enumerate(clauses):
    sum_val = 0
    for idx in clause:
        sum_val += sol(x[idx])
    satisfied = 0 < sum_val < len(clause)
    print(f"Clause {k}: {'satisfied' if satisfied else 'VIOLATED'}")
    if not satisfied:
        all_satisfied = False
print(f"All clauses NAE-satisfied: {'Yes' if all_satisfied else 'No'}")
```

プログラムの説明と出力は [NAE-SAT のページ](/ja/python/NAESAT) にあります。
[C++ 版](/ja/NAESAT) もあります。

## 自分のコンピュータで動かす

PyQBPP は Linux（x86-64・ARM64）と、WSL 経由の Windows で動きます。

```bash
pip install pyqbpp
```

詳しくは [インストール](/ja/python/INSTALL) を見てください。
QUBO++ で解く問題は、[ほかのデモ](/ja/DEMOS) にもあります。
