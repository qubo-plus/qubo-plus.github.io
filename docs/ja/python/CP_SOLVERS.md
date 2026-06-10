---
layout: default
nav_exclude: true
title: "CP ソルバー"
nav_order: 24
lang: ja
hreflang_alt: "en/python/CP_SOLVERS"
hreflang_lang: "en"
---

# CP ソルバー — Google OR-Tools CP-SAT

このページは **制約プログラミング (CP)** のバックエンドを扱います。これは
QUBO/HUBO を直接扱うサンプラ（[QUBO/HUBO ソルバー](QUBO_HUBO_SOLVERS)）でも
MILP ソルバー（[MILP ソルバー](MILP_SOLVERS)）でもありません。CP エンジンは
Boolean／整数変数を制約のもとで SAT 風のコアで探索し、**証明付きの最適解**
を返します。

> **⚠️ Experimental — PyQBPP のみ。** OR-Tools ライブラリ本体は実用に供されて
> いる製品ですが、**PyQBPP 連携は実験的** で、ラッパ API は予告なく変更される
> 可能性があります。OR-Tools は Python パッケージとしてのみ提供される
> (`pip install ortools`) ため、このソルバーに C++ エントリーポイントは
> ありません。ソルバー生成時に遅延 import されます。

## OrToolsCpSatSolver

[Google OR-Tools CP-SAT](https://developers.google.com/optimization/cp/cp_solver)
は SAT ベースの制約プログラミングエンジン。CP-SAT は二次目的関数を
ネイティブには受け付けないため、PyQBPP は各非線形単項
``ℓ_a ℓ_b ... ℓ_k``（各 ``ℓ`` は ``x_i`` または ``~x_i``）を新しい
Boolean ``z`` として `z = ℓ_a ∧ ... ∧ ℓ_k` で制約し、結果として線形
目的関数を最小化します。**HUBO は任意次数**で同じエンコーディングが
効き、**否定リテラルも CP-SAT の `BoolVar.Not()` でネイティブに**扱われます
（`all_positive` 展開は不要 — m 個の否定リテラルを含む単項を 2^m 倍に
膨らませずに済みます）：

```python
sol = qbpp.OrToolsCpSatSolver(e).search(time_limit=5.0)
```

これにより `OrToolsCpSatSolver` は、任意次数の HUBO **かつ** 否定リテラルを
ネイティブに受け付けながら証明付きの最適解を返せる、PyQBPP 唯一の外部
ソルバーになっています。

`search()` でよく使う kwargs:
`time_limit`（秒、`parameters.max_time_in_seconds`）、
`thread_count`（`num_search_workers`）、`log`（真偽値）。

## 戻り値の型

`OrToolsCpSatSolver` は PyQBPP 標準の `SolverSol`
(`EasySolverSol`/`ABS3SolverSol` と同じ型) を返すため、プログラムの後段は
ソルバー非依存に保てます:

```python
print(sol.energy)            # 最良目的関数値
print(sol.tts)               # time-to-best-solution (秒)
print(sol.info["solver"])    # "OrToolsCpSatSolver"
for s in sol.sols:           # 追加で得られた解
    print(s.energy, s.tts)
```
