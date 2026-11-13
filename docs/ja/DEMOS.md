---
last_modified: 2026-10-10
layout: default
title: "デモ・Playground"
description: "QUBO++ をブラウザで試せます。C++ 版と Python 版の Playground に加えて、N クイーン、巡回セールスマン問題、22 のグラフ問題、SAT、NAE-SAT、機械スケジューリング、シフトスケジューリングを QUBO/HUBO モデルとして解くデモがあります。"
nav_order: 7
lang: ja
hreflang_alt: "en/DEMOS"
hreflang_lang: "en"
mode_shared: true
---

# デモ・Playground

インストールなしで、QUBO++ をブラウザで試せます。
どのデモも新しいタブで開きます。デモごとにページがあるので、ブックマークや共有もできます。

> **注意:** これらのデモはリソースが限られた AWS Lambda 上で動作しています。
> パフォーマンスは通常の PC と比べて**数倍遅く**なります。
> 最新のデスクトップ PC では、QUBO++ はこれよりも大幅に高速に動作します。

## Playground

自分で書いた QUBO++ のプログラムを実行できます。

{% include demo_cards.html slugs="cpp-playground,python-playground" %}

## 問題のデモ

マウスで問題を作り、QUBO++ が解く様子を見られます。

{% include demo_cards.html slugs="n-queens,tsp,graph-problems,sat,nae-sat,machine-scheduling,shift-scheduling" %}
