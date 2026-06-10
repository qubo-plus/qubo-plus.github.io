---
layout: default
nav_exclude: true
title: "CP ソルバー"
nav_order: 24
lang: ja
hreflang_alt: "en/CP_SOLVERS"
hreflang_lang: "en"
---

# CP ソルバー — Google OR-Tools CP-SAT（PyQBPP のみ）

このページは **制約プログラミング (CP)** のバックエンドを扱います。これは
QUBO/HUBO を直接扱うサンプラ（[QUBO/HUBO ソルバー](QUBO_HUBO_SOLVERS)）でも
MILP ソルバー（[MILP ソルバー](MILP_SOLVERS)）でもありません。CP エンジンは
Boolean／整数変数を制約のもとで SAT 風のコアで探索し、**証明付きの最適解**
を返します。

現在の CP バックエンドは **Google OR-Tools CP-SAT** のみです。Python
パッケージとしてのみ提供されるため、**PyQBPP (Python) からのみ** 利用可能で、
C++ エントリーポイントはありません。

→ PyQBPP のドキュメントを参照してください:
[**CP ソルバー — Google OR-Tools CP-SAT**](python/CP_SOLVERS)

OR-Tools CP-SAT は各非線形単項を新しい Boolean AND としてエンコードするため、
**任意次数の HUBO** と **否定リテラル (`~x`) をネイティブに** 扱いながら証明
付きの最適解を返します — この組み合わせを満たす QUBO++ の外部ソルバーは
これだけです。
