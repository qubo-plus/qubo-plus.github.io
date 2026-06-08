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

PyQBPP は多数のサードパーティソルバーを **実験的な連携** としてラップ
しており、これらは **PyQBPP (Python) からのみ** 利用可能です。C++ の
QUBO++ ライブラリからは呼び出せません。現在サポート中：

- **Fixstars Amplify**（クラウドメタ — Fixstars AE / Fujitsu DA / Toshiba SBM など）
- **D-Wave** — Advantage QPU、Leap Hybrid、Neal（古典 SA）、Tabu、Steepest Descent
- **dimod** — ExactSolver（全数列挙）
- **OpenJij**（ローカル SA / SQA、HUBO は `sample_hubo` 経由）
- **TYTAN-SDK** — MIKASAmpler（HUBO ネイティブ PyTorch SA）
- **qubovert**（Pure Python HUBO SA）
- **Simulated Bifurcation**（東芝 SB アルゴリズム、PyTorch CPU/GPU）
- **IBM CPLEX**（商用 MIQP）
- **IBM Qiskit Optimization**（古典厳密 / QAOA / VQE）
- **Google OR-Tools CP-SAT**（HUBO は Boolean エンコーディング）

各バックエンドは Python パッケージとしてのみ提供されているため、
PyQBPP は Python 経由で直接モデルを渡しています。C++ 側のエントリー
ポイントはありません。

→ PyQBPP ドキュメントを参照してください:
[**実験的なソルバー連携 (Amplify, D-Wave, OpenJij, TYTAN, qubovert ほか)**](python/EXPERIMENTAL_SOLVERS)

## C++ から利用できるソルバー

以下の組み込みソルバーは C++ と PyQBPP の両方から利用できます:

- [Easy Solver](EASYSOLVER) — ヒューリスティック、マルチコア CPU
- [Exhaustive Solver](EXHAUSTIVE) — 全数探索（CPU + GPU）
- [ABS3 Solver](ABS3) — 高速ヒューリスティック（CPU + GPU）
- [Gurobi Optimizer](GUROBI) — Gurobi による厳密解法（ライセンス要）
- [MILP Solvers (SCIP, HiGHS, GLPK, CBC)](MILP_SOLVERS) — 実験的な OSS 厳密ソルバー
