---
layout: default
nav_exclude: true
title: "MILP Solvers (Experimental)"
nav_order: 23
lang: ja
hreflang_alt: "en/python/MILP_SOLVERS"
hreflang_lang: "en"
---

# 実験的 MILP ソルバー — SCIP, HiGHS, GLPK, CBC

PyQBPP は複数のサードパーティ製**厳密 MILP ソルバー**で QUBO 式を解くことが
できます。これらは共通インタフェースを持ち、**クラス名を変えるだけ**で互いに、
また `pyqbpp.ABS3Solver` とも切り替えられます。

これらは**線形**の目的関数を最小化するため、二次の QUBO は渡す前に
**線形化**する必要があります（後述）。二次目的関数を**直接**受け取れる
ソルバー（Gurobi, IBM CPLEX — いずれも MIQP）はここには含まれず、
[QUBO/HUBO ソルバー](QUBO_HUBO_SOLVERS) にまとめています。制約プログラミング
エンジンの OR-Tools CP-SAT は [CP ソルバー](CP_SOLVERS) を参照してください。

> **実験的機能。** これらは実験・ベンチマーク用途で提供されます。API は予告なく
> 変更される可能性があり、各ソルバーの Python バインディングは別途インストールが
> 必要です（[セットアップ](#setup)参照）。対応は **QUBO（次数 ≤ 2）のみ**です。
> HUBO は事前に QUBO へ削減するか、任意次数に対応する `pyqbpp.ABS3Solver` /
> `pyqbpp.EasySolver` を使ってください。

内部では各二次項を補助変数＋線形リンク制約に置き換え（Fortet 線形化）、QUBO を
純粋な MILP としてソルバーに渡します。返される解のエネルギーは元の QUBO から常に
厳密に再計算されます。

| ソルバー | クラス | Python バインディング | ライセンス |
|----|----|----|----|
| [SCIP](https://www.scipopt.org)   | `pyqbpp.ScipSolver` | PySCIPOpt | Apache-2.0 |
| [HiGHS](https://highs.dev)        | `pyqbpp.HighsSolver` | highspy | MIT |
| [GLPK](https://www.gnu.org/software/glpk/) | `pyqbpp.GlpkSolver` | swiglpk | GPL |
| [CBC](https://github.com/coin-or/Cbc) | `pyqbpp.CbcSolver` | python-mip | EPL |

二次目的関数を直接受け取れる商用の厳密ソルバーは
[Gurobi と IBM CPLEX](QUBO_HUBO_SOLVERS) を参照してください。

## 使い方

4 つのソルバーはすべて同じインタフェースです。次のプログラムは SCIP で数分割問題を
解きます。`qbpp.ScipSolver` を `qbpp.HighsSolver` / `qbpp.GlpkSolver` /
`qbpp.CbcSolver` に置き換えるだけで別のソルバーを使えます:

```python
import pyqbpp as qbpp

w = qbpp.array([64, 27, 47, 74, 12, 83, 63, 40])
x = qbpp.var("x", shape=len(w))
p = qbpp.expr()
q = qbpp.expr()
for i in range(len(w)):
    p += w[i] * x[i]
    q += w[i] * (1 - x[i])
f = qbpp.sqr(p - q)
f.simplify_as_binary()

solver = qbpp.ScipSolver(f)            # クラス名を差し替えればソルバー切替
sol = solver.search(time_limit=10.0)

print(f"energy = {sol.energy}")
print(f"bound  = {sol.info.get('bound')}")
print(f"status = {sol.info.get('status')}")
print("P:", [w[i] for i in range(len(w)) if sol(x[i]) == 1])
print("Q:", [w[i] for i in range(len(w)) if sol(x[i]) == 0])
```

エネルギーが下界と一致すれば最適が保証されます。ソルバーオブジェクトは式から
生成され、構築時に QUBO がソルバー内部の MILP モデルへ線形化されます。高次（HUBO）
の式は例外を送出します。

## パラメータ

パラメータは `search()` にキーワード引数で渡します（dict も可）。すべてのラッパーが
解釈する共通キーは次の通りです:

| キー | 値 | 説明 |
|----|----|----|
| **`time_limit`** | 秒 | 制限時間に達したら停止 |
| **`target_energy`** | エネルギー | この値以下の解を見つけたら停止 |
| **`callback_timer_interval`** | 秒 | `Timer` イベントの初期間隔 |
| **`enable_default_callback`** | `1` | 新しい incumbent ごとにエネルギーと TTS を表示 |
| **`thread_count`** | スレッド数 | ワーカースレッド数（SCIP/HiGHS/CBC） |
| **`topk_sols`** | K | 最大 K 個の解を返す（ベストエフォート） |
| **`gap_limit`** | gap | 相対 MIP gap による停止（SCIP/HiGHS） |
| **`output_flag`** | `1` | ソルバー自身のログを表示（SCIP/HiGHS） |

ソルバー固有の追加:

- **SCIP** — 未知のキーは SCIP にそのまま転送されます（例
  `solver.search({"limits/gap": 0.0})`）。`formulation`（linearize / quadratic）は
  **コンストラクタ**の引数であり、`search()` のキーではありません（下記参照）。
- **HiGHS** — 未知のキーは HiGHS の `setOptionValue` に転送されます（例 `presolve="on"`）。

## SCIP: linearize と quadratic 定式化

`ScipSolver` は QUBO を 2 通りの方法で SCIP に渡せます:

- **`"linearize"`（既定）** — Fortet 線形化で純粋な MILP にする（他のソルバーと共通の
  変換）。SCIP に締まった LP 緩和を与えます。
- **`"quadratic"`** — SCIP の目的関数は線形のみのため、目的変数を 1 つ追加し、SCIP の
  非線形制約ハンドラが内部で再定式化する **2 次（非線形）制約**を 1 本張ります。
  Fortet 補助変数は追加されません。項ごとの緩和は緩いため、密なペナルティ QUBO では
  通常遅くなります。比較用に提供しています。

どちらも同じ最適解に到達します。定式化は**構築時に固定**されます。別の定式化を
使うにはソルバーオブジェクトを作り直してください（`search()` のキーワードでは
ありません）:

```python
solver = qbpp.ScipSolver(f, formulation="quadratic")
sol = solver.search()
```

このオプションは SCIP 固有です。HiGHS・GLPK・CBC は常に線形化 MILP を使います。

## Solver Info

`sol.info` はソルバーが生成した文字列を保持します: `status`, `bound`, `mip_gap`
（SCIP/HiGHS）, `node_count`, `solution_count`, `<solver>_version`
（`scip_version` / `highs_version` / `glpk_version`）, `run_time`。

## カスタムコールバック

ソルバーを継承し `callback()` を override します。内部では `self.event()`、
`self.best_sol()`（`pyqbpp.Sol`）、`self.bound()`、`self.timer(seconds)`、
`self.terminate()` が使えます。イベント定数はクラス属性
`EVENT_START` / `EVENT_BEST_UPDATED` / `EVENT_TIMER` です。

```python
import pyqbpp as qbpp

class MySolver(qbpp.HighsSolver):
    def callback(self):
        if self.event() == self.EVENT_BEST_UPDATED:
            s = self.best_sol()
            print(f"New best: energy={s.energy} TTS={s.tts}s bound={self.bound()}")
            if s.energy == 0:
                self.terminate()          # 最適が見つかり次第停止

x = qbpp.var("x", shape=8)
f = qbpp.sqr(qbpp.sum(x) - 4)
f.simplify_as_binary()
sol = MySolver(f).search(time_limit=5)
print(f"energy={sol.energy}")
```

> **ライブコールバックの対応はバインディング依存です。** `ScipSolver` と
> `HighsSolver` は求解中に `BestUpdated`/`Timer` を発火します。**`GlpkSolver` と
> `CbcSolver` は `EVENT_START` のみ**です（swiglpk は Python コールバックを設定でき
> ず、python-mip の incumbent コールバックも一般的なビルドでは呼ばれないため）。
> C++ の `qbpp::GlpkSolver` / `qbpp::CbcSolver` はライブイベントを発火します。
> `hint(sol)` は SCIP/HiGHS をウォームスタートします（GLPK/CBC では何もしません）。
> 求解時間は `time_limit` で制限してください。

## セットアップ {#setup}

使うバインディングだけ入れてください:

| ソルバー | インストール |
|----|----|
| SCIP  | `conda install -c conda-forge pyscipopt` |
| HiGHS | `pip install highspy`（または `conda install -c conda-forge highspy`） |
| GLPK  | `conda install -c conda-forge swiglpk` |
| CBC   | `pip install mip` |

バインディングは遅延 import されるため、未インストールでも `import pyqbpp` は成功
します。エラーはそのソルバーを生成した時点で初めて送出されます。
