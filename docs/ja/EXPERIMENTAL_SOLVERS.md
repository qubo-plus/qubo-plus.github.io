---
layout: default
nav_exclude: true
title: "実験的なソルバー連携"
nav_order: 25
lang: ja
hreflang_alt: "en/EXPERIMENTAL_SOLVERS"
hreflang_lang: "en"
---

# 実験的なソルバー連携 — PyQBPP のみ対応

**Fixstars Amplify**, **D-Wave Advantage / Leap Hybrid**, **OpenJij**
への実験的な連携機能は **PyQBPP (Python) からのみ** 利用可能です。
C++ の QUBO++ ライブラリからは呼び出せません。

各バックエンド (Amplify SDK, D-Wave Ocean SDK, OpenJij) は Python
パッケージとしてのみ提供されているため、PyQBPP は Python 経由で
直接モデルを渡しています。C++ 側のエントリーポイントはありません。

→ PyQBPP ドキュメントを参照してください:
[**実験的なソルバー連携 (Amplify, D-Wave, OpenJij)**](python/EXPERIMENTAL_SOLVERS)

## C++ から利用できるソルバー

以下の組み込みソルバーは C++ と PyQBPP の両方から利用できます:

- [Easy Solver](EASYSOLVER) — ヒューリスティック、マルチコア CPU
- [Exhaustive Solver](EXHAUSTIVE) — 全数探索（CPU + GPU）
- [ABS3 Solver](ABS3) — 高速ヒューリスティック（CPU + GPU）
- [Gurobi Optimizer](GUROBI) — Gurobi による厳密解法（ライセンス要）
