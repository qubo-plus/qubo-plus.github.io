---
layout: default
title: "PyQBPP (Python)"
nav_order: 5
lang: ja
hreflang_alt: "en/python/index"
hreflang_lang: "en"
---

# PyQBPP ドキュメント
PyQBPP（QUBO++のPythonバインディング）のドキュメントは現在作成中です。
一部のページには不完全または暫定的な情報が含まれている場合があります。

## はじめに
1. [HUBO と QUBO](../HUBO_QUBO)
2. [クイックスタート](QUICK)
3. [インストール](INSTALL)

## 基礎
このセクションでは、PyQBPPの段階的な入門を提供します。
ページを順番に読むことで、変数と式の定義方法、最適化問題のモデル化、
PyQBPPを使った求解方法を学ぶことができます。
このチュートリアルを完了すれば、一般的な用途でPyQBPPを使えるようになります。

1. [変数の定義と式の作成](VARIABLE)
2. [式の求解](SOLVE)
3. [変数の配列と配列関数](VECTOR)
4. [変数配列を用いた分割問題の求解](PARTITION)
5. [順列行列と割当問題の求解](PERMUTATION)
6. [整数変数と連立方程式の求解](INTEGER)
7. [HUBO式による因数分解](FACTORIZATION)
8. [範囲制約と整数線形計画法の求解](RANGE)

## トピック
このセクションでは、PyQBPPの特定の機能についてトピックごとに解説します。
各ページは特定のトピックに焦点を当て、設計上の判断、使用パターン、
および必要に応じて内部実装について、より深い知見を提供します。

1. [変数と式のデータ型](VAREXPR)
2. [基本演算子と関数](OPERATOR)
3. [配列用の基本演算子と関数](OPVECTOR)
4. [多次元変数と式](MULTIDIM)
5. [比較演算子](COMPARISON)
6. [式のクラス](EXPRESSION)
7. [式の評価](EVAL)
8. [置換関数](REPLACE)
9. [否定リテラル](NEGATIVE)
10. [多次元配列の和関数](SUM)
11. [スライスと連結](SLICE_CONCAT)
12. [ワンホットから整数への変換](ONEHOT)
13. [Easy Solverの使い方](EASYSOLVER)
14. [Exhaustive Solverの使い方](EXHAUSTIVE)
15. [ABS3 Solverの使い方](ABS3)
16. [探索パラメータ](PARAMS)
17. [高速化のための Tips](TIPS)

## ケーススタディ
このセクションでは、PyQBPPを使った最適化問題、数学問題、グラフ問題の解法例を提供します。
全リストは[ケーススタディ](CASE_STUDIES)ページを参照してください。

## クイックリファレンス
1. [変数と式](QR_VARIABLE)
2. [演算子と関数](QR_OPERATION)
3. [解](QR_SOLUTION)
