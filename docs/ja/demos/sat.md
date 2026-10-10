---
last_modified: 2026-10-08
layout: demo
title: "SAT（充足可能性問題）をブラウザで解く: HUBO デモ"
description: "CNF の論理式をブラウザで作るか、ランダムな k-SAT を生成して、QUBO++ で解くデモです。各節が 1 つの積の項になるので、論理式を HUBO モデルとしてそのまま解きます。全探索ソルバーとも比べられます。"
lang: ja
hreflang_alt: "en/demos/sat/"
hreflang_lang: "en"
permalink: /ja/demos/sat/
nav_exclude: true
math: true
image: /assets/demos/og/sat-ja.png
demo_id: sat
heading: "SAT（充足可能性問題）を HUBO で解く"
lead: "節を入力するかランダムな k-SAT を生成して、Solve を押します。各節が HUBO モデルの 1 つの積の項になり、QUBO++ がすべての節を満たす割当てを探します。"
app_name: "SAT ソルバー（QUBO++ デモ）"
docs_links:
  - label: "C++ 版（QUBO++）"
    url: /ja/SAT
  - label: "Python 版（PyQBPP）"
    url: /ja/python/SAT
---

## 使い方

- 表の行が節、列が変数（$x_0, x_1, \ldots$）です。
  セルをクリックするたびに、空 → **+**（リテラル $x_i$）→ **−**（リテラル $\lnot x_i$）→ 空 と切り替わります。
  **×** でその節を削除します。
- **+ Variable** / **− Variable** で変数の数（2〜24）を変え、**+ Clause** で空の節を加えます。
  **+ Random** / **− Random** は、指定した数のリテラルをランダムに加えたり削除したりします。
  **Random k-SAT** は、今ある節をそれぞれ異なる $k$ 個の変数（符号はランダム）で埋め直します。
  充足できない論理式になることもあります。
- **Solver**: **ABS3 (CPU)** は **Time** で指定した時間だけ発見的に探索します
  （公開版のデモでは最長 10 秒。すべての節を満たした時点で止まります）。
  **Exhaustive** は $2^n$ 通りの割当てをすべて調べます。
- 解くと、表に割当て（T/F）が表示され、各節に SAT か UNSAT の印が付きます。
  その下には、解いた HUBO の式と、否定リテラルを展開した式が表示されます。

このデモは資源の限られた AWS Lambda 上で動いています。
デスクトップ PC 上の QUBO++ は数倍速く動きます。

## 論理式を HUBO にする

このデモでは **True を 0、False を 1** で表します。
すると、正のリテラル $x$ が False になるのは $x=1$ のとき、
負のリテラル $\lnot x$ が False になるのは $\overline{x}=1$（$\overline{x}=1-x$）のときです。
$(x_0 \lor \lnot x_1 \lor x_2)$ のような節が満たされないのは、すべてのリテラルが False のときだけです。
つまり、次の積が 1 になるときだけです。

$$
x_0\,\overline{x_1}\,x_2
$$

すべての節についてこの積を足したものは、満たされない節の数になります。
したがって、値が 0 になる割当てが論理式を満たします。

$k$ 個のリテラルを持つ節は $k$ 次の項になるので、このモデルは QUBO ではなく
HUBO（Higher-order Unconstrained Binary Optimization、高次の制約なし二値最適化）です。
QUBO++ は、補助変数を使って QUBO に変換することなく、HUBO のまま解きます。
否定リテラル $\overline{x}$ もそのまま扱います。
デモの下にある 2 つめの式は、すべての $\overline{x}$ を $1-x$ に展開したものです。
否定リテラルを含む節は、展開すると複数の項に分かれます。

## プログラム

QUBO++ の Python 版である PyQBPP では、節をリテラルの積で書きます。否定リテラルは `~x` です。
次の 2 行は、[SAT のページ](/ja/python/SAT) のプログラムからの抜粋です。

```python
c0 = x[0] * x[1] * x[2]
c1 = ~x[0] * x[3] * x[4]
```

1 行目は節 $(x_0 \lor x_1 \lor x_2)$、2 行目は節 $(\lnot x_0 \lor x_3 \lor x_4)$ です。
プログラム全体と出力は [SAT のページ](/ja/python/SAT) にあります。
[C++ 版](/ja/SAT) もあります。

## 自分のコンピュータで動かす

PyQBPP は Linux（x86-64・ARM64）と、WSL 経由の Windows で動きます。

```bash
pip install pyqbpp
```

詳しくは [インストール](/ja/python/INSTALL) を見てください。
QUBO++ で解く問題は、[ほかのデモ](/ja/DEMOS) にもあります。
