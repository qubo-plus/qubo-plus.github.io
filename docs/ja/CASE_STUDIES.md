---
last_modified: 2026-10-28
layout: default
title: "活用事例"
nav_order: 6
lang: ja
hreflang_alt: "en/CASE_STUDIES"
hreflang_lang: "en"
---

# ケーススタディ
このセクションでは、QUBO++ を使用した最適化問題、数学問題、グラフ問題の求解例を提供します。
各問題の後の Easy / Medium / Hard は、ページの内容を理解する難しさの目安です。問題を理解するのに要る予備知識、定式化の発想、プログラムの構造の 3 点から決めています。

{% assign case_videos = site.data.videos.episodes | where_exp: "ep", "ep.kind == 'case' and ep.hidden != true" -%}
{%- if case_videos.size > 0 %}
活用事例の一部は動画でも紹介しています（[動画（ケーススタディ）](VIDEO_CASE_STUDIES)のページ）。
{%- endif %}

## 数学問題
1. [数学問題: 3つの整数を求める](3INTEGERS)（Easy）
2. [3桁の数学問題](3DIGIT_MATH)（Easy）
3. [3次方程式](CUBIC_EQUATION)（Easy）
4. [平方根](SQRT)（Easy）
5. [円周率に近い分数](PI_FRACTION)（Easy）
6. [最大公約数 (GCD)](GCD)（Easy）
7. [剰余問題](REMAINDER)（Easy）
8. [ピタゴラスの三つ組](PYTHAGOREAN)（Medium）
9. [タクシー数 1729](TAXICAB)（Medium）
10. [再帰による素因数分解](PRIME_FACTORIZATION)（Medium）

## パズル
1. [N クイーン問題](QUEENS)（Easy）
2. [スターバトル](STAR_BATTLE)（Easy）
3. [数独](SUDOKU)（Medium）
4. [ノノグラム](NONOGRAM)（Medium）
5. [魔方陣](MAGIC)（Medium）
6. [SEND + MORE = MONEY 問題](SEND_MORE_MONEY)（Medium）

## グラフ問題
### 頂点・集合の選択
1. [グラフ描画ライブラリと最大独立集合問題](GRAPH)（Easy）
2. [最大クリーク問題](MAX_CLIQUE)（Easy）
3. [最小頂点被覆問題](VERTEX_COVER)（Easy）
4. [最小支配集合問題](DOMINATING)（Medium）
5. [最小集合被覆問題](SETCOVER)（Medium）

### カット・分割
1. [最大カット問題](MAXCUT)（Easy）
2. [最小グラフ二分割問題](BISECTION)（Easy）
3. [カット幅問題](CUTWIDTH)（Medium）

### マッチング
1. [最大マッチング問題](MAX_MATCHING)（Easy）
2. [最小極大マッチング問題](MINMAX_MATCHING)（Medium）

### 彩色
1. [グラフ彩色問題](GRAPH_COLOR)（Easy）
2. [グラフ辺彩色問題](EDGE_COLOR)（Medium）

### 同型
1. [部分グラフ同型問題](SUBGRAPH_ISOMORPHISM)（Medium）

## 経路問題
1. [最短路問題](SHORTEST_PATH)（Medium）
2. [巡回セールスマン問題](TSP)（Medium）
3. [容量制約付き配送計画問題 (CVRP)](CVRP)（Hard）

## 組合せ最適化問題
1. [QUBO 問題](QUBO)（Easy）
2. [整数線形計画法](ILP)（Easy）
3. [LABS 問題](LABS)（Easy）
4. [ナップサック問題](KNAPSACK)（Medium）
5. [分割問題の3通りの定式化](PARTITION_FORMULATIONS)（Medium）
6. [区間部分和問題 (ISSP)](ISSP)（Medium）
7. [切出し問題](BAR_CUTTING)（Medium）
8. [ポートフォリオ最適化](PORTFOLIO)（Hard）

## スケジューリング
1. [シフトスケジューリング問題](SHIFT_SCHEDULING)（Medium）
2. [日勤・夜勤の勤務表](SHIFT_ROSTER)（Medium）
3. [納期付き機械スケジューリング](MACHINE_SCHEDULING)（Hard）

## 充足可能性
1. [充足可能性問題 (SAT)](SAT)（Medium）
2. [Not-All-Equal SAT (NAE-SAT)](NAESAT)（Medium）

## 回路シミュレーション
1. [加算器シミュレーション](ADDER)（Medium）
2. [乗算器シミュレーションと因数分解](MULTIPLIER)（Hard）

## 画像処理
1. [画像のハーフトーン化](HALFTONING)（Medium）
2. [画像のノイズ除去](DENOISING)（Medium）
3. [クラスタドット・ハーフトーン](CLUSTER_HALFTONING)（Hard）
4. [ASCII アートの生成](ASCII_ART)（Hard）

## ブラックボックス最適化
1. [FMQA によるブラックボックス最適化](FMQA)（Hard）
2. [FMQA による量子化学計算](FMQA_CHEMISTRY)（Hard）

## 量子アニーラー
1. [量子アニーラーのシミュレーション](QUANTUM_ANNEALER)（Medium）
