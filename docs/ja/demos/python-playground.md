---
last_modified: 2026-10-08
layout: demo
title: "PyQBPP Playground: Python の QUBO プログラムをブラウザで実行"
description: "PyQBPP（QUBO++ の Python 版）のプログラムを、インストールなしでブラウザ上で書いて実行できます。N クイーン、ナップサック、巡回セールスマン、素因数分解、整数線形計画などのテンプレートから始められます。"
lang: ja
hreflang_alt: "en/demos/python-playground/"
hreflang_lang: "en"
permalink: /ja/demos/python-playground/
nav_exclude: true
math: true
image: /assets/demos/og/python-playground-ja.png
demo_id: ide_pyqbpp
heading: "PyQBPP Playground（Python）"
lead: "PyQBPP のプログラムを Python で書き、インストールなしでブラウザ上で実行できます。テンプレートを読み込んで始めてください。"
app_name: "PyQBPP Playground（Python）"
docs_links:
  - label: "クイックスタート"
    url: /ja/python/QUICK
  - label: "ドキュメント一覧"
    url: /ja/python/DOCUMENT
---

## 使い方

- テンプレートを選んで **Load** を押すと、そのプログラムがエディタに入ります。
  自分のファイルを使うときは **Local File** を選んで **Load** を押します。**Save** でプログラムをファイルに保存できます。
- **Run**（Ctrl+R）を押すと実行します。**args** 欄の内容は、コマンドライン引数（`sys.argv`）としてプログラムに渡されます。
  プログラムの出力は下の欄に表示されます。
  エディタと出力欄の間の境界をドラッグすると、大きさを変えられます。
- **? Help** で Playground の使い方を日本語と英語で読めます。☼/☾ でテーマを切り替えます。

## 使えるもの

- Python 3.12 と PyQBPP（`import pyqbpp as qbpp`）。使い方は [ドキュメント](/ja/python/DOCUMENT) のとおりです。
  プログラムでは `pyqbpp` を import する必要があります。
- ソルバーは `EasySolver` と `ExhaustiveSolver`（CPU 上で動作）。
  ABS3 ソルバーと外部の MILP ソルバーは、Playground では使えません。
- PyQBPP の係数型: `import pyqbpp.c64e64 as qbpp` や `import pyqbpp.cppint as qbpp`（任意精度）など、
  実数の係数なら `import pyqbpp.d as qbpp` を使います。
- ソースコードは 300 行（50 KB）まで。実行は 60 秒まで、出力は 5 MB までです。
  プロセス・ネットワーク・スレッドのモジュール（`subprocess`、`socket`、`threading` など）、
  `exec`、`eval`、ファイルシステムの操作は使えません。

この Playground は資源の限られた AWS Lambda 上で動いています。
デスクトップ PC 上の PyQBPP は数倍速く動きます。

## テンプレート

| テンプレート | 内容 |
|---|---|
| Simple | $a+2b+3c=3$ を満たすバイナリ変数 $a,b,c$ を求め、全探索ソルバーで最適解をすべて列挙します |
| Partition Problem | 8 個の整数を、和ができるだけ等しい 2 つのグループに分けます |
| Knapsack | 容量の範囲で価値の合計が最大になる品物を選びます |
| N-Queens | どの 2 つも取り合わないように $N$ 個のクイーンを置きます（args: $N$） |
| Integer Linear Programming | 整数変数を使って小さな整数線形計画問題を解きます |
| Factorization | 任意精度の整数で $N=pq$ と素因数分解します（args: $N$、または $p$ $q$） |
| Cutting Stock | 棒材から必要な部品を切り出す計画を求めます（args: 棒材の本数） |
| Maximum Matching | 16 頂点のグラフで、頂点を共有しない辺の最大の集合を求めます |
| Traveling Salesman | 実数（double）の距離で、9 都市の短い巡回路を求めます |
| Square Root | 任意精度の整数で $\sqrt{c}$ を小数 20 桁まで求めます（args: $c$） |

PyQBPP のプログラムの基本は [クイックスタート](/ja/python/QUICK) で、
さらに多くの問題は [ケーススタディ](/ja/python/CASE_STUDIES) で説明しています。

## 自分のコンピュータで動かす

PyQBPP は Linux（x86-64・ARM64）と、WSL 経由の Windows で動きます。

```bash
pip install pyqbpp
```

詳しくは [インストール](/ja/python/INSTALL) を見てください。
C++ 版の QUBO++ は [C++ 版の Playground](/ja/demos/cpp-playground/) で試せます。
QUBO++ でさまざまな問題を解く [ほかのデモ](/ja/DEMOS) もあります。
