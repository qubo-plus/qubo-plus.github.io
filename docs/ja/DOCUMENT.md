---
layout: default
title: "QUBO++ (C++)"
nav_order: 5
lang: ja
hreflang_alt: "en/DOCUMENT"
hreflang_lang: "en"
mode_counterpart: "/ja/python/DOCUMENT.html"
---

# QUBO++ (C++) ドキュメント

## はじめに
1. [HUBO と QUBO](HUBO_QUBO)
2. [クイックスタート](QUICK)
3. [インストールとライセンス管理](INSTALL)

## 基礎
このセクションでは、QUBO++ を段階的に紹介します。
ページを順番に読むことで、変数と式の定義方法、
最適化問題のモデリング方法、そして QUBO++ を使った求解方法を学べます。
このチュートリアルを完了すれば、一般的な用途で QUBO++ を使用できるようになります。

1. [変数の定義と式の作成](VARIABLE)
2. [式の求解](SOLVE)
3. [変数配列と配列関数](VECTOR)
4. [変数配列を用いた分割問題の求解](PARTITION)
5. [置換行列と割当問題の求解](PERMUTATION)
6. [整数変数と連立方程式の求解](INTEGER)
7. [HUBO 式による因数分解](FACTORIZATION)
8. [範囲制約と整数線形計画法の求解](RANGE)

## トピック
このセクションでは、QUBO++ の選択された機能についてトピックごとに説明します。
各ページは特定のトピックに焦点を当て、設計上の決定、
使用パターン、そして必要に応じて内部実装について深い洞察を提供します。
このセクションは網羅的なものではなく、チュートリアルとリファレンスの
セクションを補完して QUBO++ のより深い理解を提供することを目的としています。

1. [変数と式のデータ型](VAREXPR)
2. [基本的な演算子と関数](OPERATOR)
3. [ベクトル用の基本的な演算子と関数](OPVECTOR)
4. [多次元の整数、変数および式](MULTIDIM)
5. [比較演算子](COMPARISON)
6. [式クラス](EXPRESSION)
7. [式の評価](EVAL)
8. [置換関数](REPLACE)
9. [否定リテラル](NEGATIVE)
10. [HUBO の QUBO への変換](REDUCE)
11. [多次元配列用の Sum 関数](SUM)
12. [テンソル縮約のための Einsum 関数](EINSUM)
13. [スライス関数と連結関数](SLICE_CONCAT)
14. [ワンホットから整数への変換](ONEHOT)
15. [Easy Solver の使い方](EASYSOLVER)
16. [Exhaustive Solver の使い方](EXHAUSTIVE)
17. [ABS3 Solver の使い方](ABS3)
18. [探索パラメータ](PARAMS)
19. [高速化のための Tips](TIPS)



## ケーススタディ
このセクションでは、QUBO++ を使用した最適化問題、数学問題、グラフ問題の求解例を提供します。
全リストは[ケーススタディ](CASE_STUDIES)ページを参照してください。

## クイックリファレンス
1. [変数と式](QR_VARIABLE)
2. [式の演算子と関数](QR_OPERATION)
3. [整数変数と制約に関する演算と関数](QR_INTCONSTRAINT)
4. [解](QR_SOLUTION)

## 外部ソルバー連携
3 つの組み込みソルバーに加え、QUBO++ は外部ソルバーへモデルを渡せます。
各ソルバーが受け取るモデルの形でグループ分けしています:

- [QUBO/HUBO ソルバー](QUBO_HUBO_SOLVERS) — QUBO/HUBO モデルを**直接**受け取る（線形化不要）ソルバー。C++ では [Gurobi Optimizer](QUBO_HUBO_SOLVERS) のみ。PyQBPP は多数のヒューリスティックなサンプラ・アニーラやその他の厳密バックエンドを追加で提供します。
- [MILP ソルバー (SCIP, HiGHS, GLPK, CBC)](MILP_SOLVERS) — QUBO を純 MILP に**線形化**してから解く厳密ソルバー。
- [CP ソルバー (OR-Tools CP-SAT)](CP_SOLVERS) — 制約プログラミングエンジン（PyQBPP のみ）。

> これらの連携は各ソルバーを別途インストールする必要があり、API は予告なく
> 変更される可能性があります。
