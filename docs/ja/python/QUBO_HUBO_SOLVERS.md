---
last_modified: 2026-08-29
layout: default
nav_exclude: true
title: "QUBO/HUBO ソルバー"
nav_order: 22
lang: ja
hreflang_alt: "en/python/QUBO_HUBO_SOLVERS"
hreflang_lang: "en"
---

# QUBO/HUBO ソルバー — OpenJij, dimod サンプラ, Qiskit, …

このページは、**QUBO/HUBO モデルを直接** 受け取る（線形化を行わない）外部
ソルバーを扱います。PyQBPP は多項式（あるいはその二次／Ising 形式）を
そのままバックエンドへ渡します。これらは 2 つのグループに分かれます:

1. **二次目的関数を直接受け取る厳密ソルバー**
   （[`DimodExactSolver`](#dimodexactsolver),
   [`QiskitOptimizationSolver`](#qiskitoptimizationsolver)）— 全数列挙などで
   **証明付きの最適解**を返します。Fortet 補助変数は導入せず、二次目的関数を
   そのままソルバーへ渡します。
2. **ヒューリスティックなサンプラ・アニーラ**
   （[D-Wave 系サンプラ](#dwavenealsolver)、
   [`OpenJijSolver`](#openjijsolver)、[`HobotanMikasSolver`](#hobotanmikassolver)、
   [`QubovertSolver`](#qubovertsolver)、
   [`SimulatedBifurcationSolver`](#simulatedbifurcationsolver)）— 物理着想／
   局所探索のヒューリスティックでサンプルを引き、最良解を返します。

> **他のソルバーの場所。** 二次目的関数を純 MILP に**線形化**してから渡す
> 必要があるソルバー（SCIP, HiGHS, GLPK, CBC）は [MILP ソルバー](MILP_SOLVERS)
> に、制約プログラミングエンジンの OR-Tools CP-SAT は
> [CP ソルバー](CP_SOLVERS) にまとめています。

> **実験的機能。** これらの統合は実験・ベンチマーク用途で提供され、ラッパ API は
> 予告なく変更される可能性があります。本ページの
> ソルバーには **C++ エントリーポイントがありません**。各バックエンドは Python
> パッケージとしてのみ提供され、ソルバー生成時に遅延 import されます。PyQBPP
> 自体はこれらに依存しません。

すべてのソルバーは PyQBPP 標準の解オブジェクトを返し、
[`qbpp.EasySolver`](EASYSOLVER) / [`qbpp.ABS3Solver`](ABS3) と同じ
`search()` プロトコルに従うため、プログラムの後段はソルバー非依存に保てます:

```python
solver = qbpp.OpenJijSolver(e)        # または DWaveNealSolver / QubovertSolver / ...
sol    = solver.search(num_reads=100)
print(sol.energy, sol.info)
```

## 一覧

| ソルバー | グループ | バックエンド | インストール | トークン | `time_limit` | HUBO | 否定リテラル |
|---|---|---|---|---|---|---|---|
| [`DimodExactSolver`](#dimodexactsolver) | 厳密 (列挙) | dimod 全数列挙（〜20 変数） | `pip install dimod` | 不要 | 非対応 | ❌ degree ≤ 2 | — |
| [`QiskitOptimizationSolver`](#qiskitoptimizationsolver) | 厳密 / 量子 | IBM Qiskit Optimization（古典 or QAOA / VQE） | `pip install qiskit qiskit-optimization qiskit-algorithms` | 不要 | 非対応 | ❌ degree ≤ 2 | — |
| [`DWaveNealSolver`](#dwavenealsolver) | サンプラ | D-Wave Neal — 古典 SA、**量子ソルバーではない** | `pip install dwave-samplers` | **不要** | **非対応** — `num_reads` を使う | ❌ degree ≤ 2 | — |
| [`DWaveTabuSolver`](#dwavetabusolver) | サンプラ | D-Wave samplers — 古典 Tabu サーチ | `pip install dwave-samplers` | **不要** | **非対応** — `timeout` (ms) を使う | ❌ degree ≤ 2 | — |
| [`DWaveSteepestDescentSolver`](#dwavesteepestdescentsolver) | サンプラ | D-Wave samplers — Greedy ローカル降下 | `pip install dwave-samplers` | **不要** | **非対応** — `num_reads` を使う | ❌ degree ≤ 2 | — |
| [`OpenJijSolver`](#openjijsolver) | サンプラ | OpenJij (ローカル SA / SQA、オープンソース) | `pip install openjij` | **不要** | **非対応** — `num_reads` を使う | ✅ `sample_hubo` 経由 (SASampler) | ❌ 要 `all_positive=True` |
| [`HobotanMikasSolver`](#hobotanmikassolver) | サンプラ | TYTAN-SDK MIKASAmpler — HUBO ネイティブ PyTorch SA | `pip install -U git+https://github.com/tytansdk/tytan` (+ `torch`) | **不要** | **非対応** — `shots` を使う | ✅ 密テンソル | ❌ 要 `all_positive=True` |
| [`QubovertSolver`](#qubovertsolver) | サンプラ | qubovert.sim.anneal_pubo — Pure Python HUBO SA | `pip install qubovert` | **不要** | **非対応** — `num_anneals` を使う | ✅ 疎 PUBO | ❌ 要 `all_positive=True` |
| [`SimulatedBifurcationSolver`](#simulatedbifurcationsolver) | サンプラ | Toshiba SB アルゴリズム (PyTorch CPU/GPU) | `pip install simulated-bifurcation` | **不要** | **非対応** — `timeout` / `max_steps` を使う | ❌ degree ≤ 2 | — |

---

# 厳密ソルバー（二次目的関数を直接受け取る）

これらのソルバーは元の二次目的関数に対して分枝限定／全数列挙を行い、
**証明付きの最適解**を返します。いずれも
**degree ≤ 2** (BQM) が必要です。HUBO は事前に QUBO へ低次化するか、
[`ABS3Solver`](ABS3) など HUBO 対応ソルバーを使ってください。



## DimodExactSolver

[`dimod.ExactSolver`](https://docs.ocean.dwavesys.com/projects/dimod/en/latest/reference/sampler_composites/samplers.html)
による全 `2**n` 列挙。`n <= 20` 程度の小問題向け。SampleSet にすべての
解がエネルギー順で入るので、**小さなモデルの検証**やヒューリスティックの
**ベンチマーク**に最適：

```python
sol = qbpp.DimodExactSolver(e).search()
print(sol.energy)
for s in sol.sols:
    print(s.energy)
```

BQM のみ。kwargs なし（全数列挙のため）。

## QiskitOptimizationSolver

[IBM Qiskit Optimization](https://qiskit-community.github.io/qiskit-optimization/)
を使用。`qiskit_optimization.QuadraticProgram` を構築し、設定可能な
`MinimumEigenOptimizer` で解きます。既定の eigensolver は **古典的な**
`NumPyMinimumEigensolver`（厳密解 — 小さなモデルの検証に有用）。
量子シミュレーション用に `QAOA` / `VQE` を注入できます：

```python
from qiskit_algorithms import QAOA
from qiskit_algorithms.optimizers import COBYLA
from qiskit.primitives import Sampler
sol = qbpp.QiskitOptimizationSolver(
    e, eigensolver=QAOA(Sampler(), COBYLA(), reps=2)).search()
```

BQM のみ — Qiskit の `QuadraticProgram` は二次までしか扱えません。
HUBO を QAOA/VQE で解くには Pauli ハミルトニアンを手動で構築する必要が
ありますが、その経路は現在ラップしていません。

---

# ヒューリスティックなサンプラ・アニーラ

> **⚠️ Experimental — PyQBPP のみ**
>
> サードパーティのソルバー本体（dwave-samplers,
> OpenJij, TYTAN-SDK, qubovert, Simulated Bifurcation）は
> いずれも実用に供されている製品です。ここで **実験的** なのは PyQBPP 側の
> 連携部分（ラッパクラス）で、今後の PyQBPP リリースで予告なく変更される
> 可能性があります。これらは **PyQBPP (Python) からのみ利用可能** で、C++ の
> QUBO++ ライブラリからは呼び出せません。各バックエンドは Python パッケージ
> としてのみ提供されているため、PyQBPP は Python 経由で直接モデルを渡します。
> 各ソルバーは対応するサードパーティ Python パッケージを別途インストール
> する必要があり、ソルバー生成時に遅延 import されます。

これらは QUBO/HUBO からサンプルを引き、見つかった最良の解を返します
（最適性の証明はありません）。

**否定リテラルについて。** PyQBPP の式 (`Expr`) は `~x` を degree 3 以上の項にそのまま保持できますが、上表で「❌ 要 `all_positive=True`」のソルバーはバックエンドが否定リテラルを表現できないため、**ユーザーが事前に `qbpp.simplify_as_binary(expr, all_positive=True)` を呼んで `~x` を展開**してから渡す必要があります。怠ると Solver 構築時に `RuntimeError` が送出されます。`—` のソルバーは degree ≤ 2 のみを受け付け、その範囲では Model 構築時に `~x` を含む式が自動的に拒否されるため、`all_positive=True` を意識する必要はありません。

D-Wave QPU、D-Wave Neal、OpenJij、TYTAN-SDK のサンプラはハードウェア／
アルゴリズムの仕組み上、壁時計の打ち切り (wall-clock time limit) という
概念がありません。PyQBPP はこれらのソルバーに `time_limit=...` が
渡されるとエラーで明示的に拒否します（dimod のサンプラは未知の kwargs を
黙って無視することが多く、気づかぬまま time_limit が効かないという事故を
防ぐためです）。

## 統一キーワード `num_reads`

各バックエンドが「独立サンプル数」に異なる native 名を使います — D-Wave
/ dimod / OpenJij は `num_reads`、TYTAN-SDK は `shots`、qubovert は
`num_anneals`、Simulated Bifurcation は `agents`。PyQBPP は統一キーワード
**`num_reads`** を 5 ソルバー全てで受け付け、内部で各 native 名へ
転送します：

| ソルバー | Native 名 | `num_reads` エイリアス |
|---|---|:---:|
| `DWaveNealSolver` / `DWaveTabuSolver` / `DWaveSteepestDescentSolver` / `OpenJijSolver` | `num_reads` | （そのまま） |
| `HobotanMikasSolver` | `shots` | ✅ |
| `QubovertSolver` | `num_anneals` | ✅ |
| `SimulatedBifurcationSolver` | `agents` | ✅（agent 1 つ＝サンプル 1 つ） |

native 名も引き続き受け付けます。両方指定されたら native 名が優先。
これでソルバー非依存のコードが 1 つのパラメータ名で書けます：

```python
for cls in [qbpp.DWaveNealSolver, qbpp.OpenJijSolver,
            qbpp.QubovertSolver, qbpp.HobotanMikasSolver]:
    sol = cls(e).search(num_reads=200)
    print(cls.__name__, sol.energy)
```

## 対応プラットフォーム

本グループの全ソルバーが **x86_64 と aarch64 (ARM) Linux の両方で動作します**。
PyPI のホイール提供状況は次の通り。リストにない Python バージョンを
使うと pip がソースビルドにフォールバックしますが、
`dimod` / `dwave-samplers` / `dwave-system` は小さな Cython 拡張なので
ビルド可能、`openjij`/`jij-cimod` は実用的にはほぼ不可能です。
プリビルドホイールがある Python バージョンを使ってください。

| パッケージ | Linux x86_64 | Linux aarch64 | 必要な Python |
|---|:---:|:---:|---|
| `openjij` + `jij-cimod` | ✅ | ✅ | aarch64 は **3.10〜3.12** |
| `dimod` | ✅ | ✅ | aarch64 は **3.10 以上** |
| `dwave-samplers` (Neal) | ✅ | ✅ | aarch64 は **3.10 以上** |
| `dwave-cloud-client`, `dwave-system` | ✅ pure Python | ✅ pure Python | 任意 |

実用上：

- **Ubuntu 22.04 / 24.04**（既定 Python 3.10 / 3.12）— x86_64・ARM どちらも
  普通に `pip install ...` するだけで動きます。
- **Ubuntu 20.04**（既定 Python 3.8）— ホイールが提供されていないので、
  [deadsnakes PPA](https://launchpad.net/~deadsnakes/+archive/ubuntu/ppa)
  から Python 3.10 以上を入れて venv を切るか、新しい Ubuntu に
  移ってください。


## DWaveNealSolver

`DWave` という名前ですが、**Neal は量子ソルバーではありません**。D-Wave が
[`dwave-samplers`](https://docs.ocean.dwavesys.com/en/stable/docs_samplers/)
パッケージ（旧 `dwave-neal`）で配布している、CPU ベースの古典 Simulated
Annealing 実装です。Leap トークンも、ネットワーク接続も、D-Wave アカウント
も不要です。

`OpenJijSolver` と並ぶ高速な古典ベースラインとして使えます。

```python
sol = qbpp.DWaveNealSolver(e).search(num_reads=1000)
```

`search()` でよく使う kwargs (そのまま `SimulatedAnnealingSampler.sample(bqm, **kwargs)`
に転送される): `num_reads`, `num_sweeps`, `beta_range`,
`beta_schedule_type`, `seed`。`time_limit` は非対応で
degree ≤ 2 が必要。

## DWaveTabuSolver

[`dwave-samplers`](https://docs.ocean.dwavesys.com/en/stable/docs_samplers/)
の Tabu サーチヒューリスティック。古典・ローカル、トークン／ネット不要。
SA 以外のベースラインとして `DWaveNealSolver` / `OpenJijSolver` と並べて
比較する用途に有用：

```python
sol = qbpp.DWaveTabuSolver(e).search(num_reads=10, timeout=2000)
```

`search()` でよく使う kwargs（`TabuSampler.sample()` に転送）:
`num_reads`, `timeout`（ミリ秒、リスタート毎）, `tenure`, `num_restarts`,
`seed`, `initial_states`。BQM のみ。`time_limit` は非対応。

## DWaveSteepestDescentSolver

`dwave-samplers` の Greedy ローカル降下。各初期状態から単調にローカル
最小へ降下する決定的なベースライン：

```python
sol = qbpp.DWaveSteepestDescentSolver(e).search(num_reads=100)
```

`search()` でよく使う kwargs: `num_reads`, `initial_states`, `seed`,
`large_sparse_opt`。BQM のみ。

## OpenJijSolver

[OpenJij](https://www.openjij.org/) (Jij Inc., オープンソース Ising/QUBO
サンプラ) を呼びます。既定のサンプラは `openjij.SASampler()` (Simulated
Annealing)。`SQASampler()` (Simulated Quantum Annealing)、`CSQASampler()`
(連続時間 SQA)、JijZept のクラウドサンプラなどを `sampler=` で注入できます。

**HUBO 対応**: モデルの `max_degree >= 3` のとき、`OpenJijSolver` は自動
的に `SASampler.sample_hubo()` にディスパッチします。次数下げ不要で、
任意次数の項を疎な dict のままサンプラへ渡します。否定リテラル `~x` は
`simplify_as_binary(e, all_positive=True)` で `1 - x` に展開されます
(OpenJij の dict 形式に否定の概念がないため)。

`sample_hubo()` は現状 `openjij.SASampler` のみ。`max_degree >= 3` の
問題に `SQASampler` / `CSQASampler` を注入すると明確なエラーになります。

```python
import pyqbpp as qbpp
import openjij as oj

# QUBO は SA で
x = qbpp.var("x", 4)
f = qbpp.sqr(x[0] + x[1] + x[2] + x[3] - 1)
f.simplify_as_binary()
sol = qbpp.OpenJijSolver(f).search(num_reads=1000)

# HUBO degree 3 — 自動的に sample_hubo() が使われる
e = x[0] * x[1] * x[2] - x[0]
e.simplify_as_binary()
sol = qbpp.OpenJijSolver(e).search(num_reads=200)

# SQA は QUBO のみ（HUBO の e を渡すとエラー）
sol = qbpp.OpenJijSolver(f, sampler=oj.SQASampler()).search(num_reads=100)
```

`search()` でよく使う kwargs (そのまま内部のサンプル呼び出しに転送される):
`num_reads`, `num_sweeps`, `beta_min`, `beta_max`, `schedule`, `seed`。
`time_limit` は非対応で、`num_reads` / `num_sweeps` で実行時間を制御します。

## HobotanMikasSolver

[TYTAN-SDK](https://github.com/tytansdk/tytan) の **MIKASAmpler** を
呼びます。PyTorch ベースの Simulated Annealing で **HUBO を直接** 扱える
（次数下げ不要）。"TYTAN" / "Hobotan" という名前ですがトークン／ライセンス
／ネットは不要 — ローカル CPU/GPU (CUDA / MPS) で動作します。

インストール（PyPI ではなく GitHub のみ）：

```bash
pip install -U git+https://github.com/tytansdk/tytan
pip install torch          # CPU build；CUDA / MPS は自動検出
```

使い方：

```python
import pyqbpp as qbpp
x = qbpp.var("x", 4)
e = x[0]*x[1]*x[2] + x[1]*x[2]*x[3] - x[0]
e.simplify_as_binary()
sol = qbpp.HobotanMikasSolver(e).search(shots=100)
```

`search()` でよく使う kwargs (`MIKASAmpler.run(hobo, **kwargs)` に転送):
`shots`, `mode` (`"CPU"` / `"GPU"`), `T_init`, `T_end`, `num_sweep`。
`time_limit` は非対応。`shots` / `num_sweep` で実行時間を制御します。

> **疎な HUBO は拒否されます。** TYTAN の HUBO 形式は形状 `(n,)*d` の
> **密テンソル**（`n` = 変数数、`d` = 最大次数）。PyQBPP は `n^d` が
> 10⁸ を超えると拒否します。疎な高次問題には `ABS3Solver`（組み込み、
> 疎、GPU 対応）を推奨します。

## QubovertSolver

[qubovert](https://github.com/jiosue/qubovert) は Pure Python の
QUBO/HUBO ツールキット。`QubovertSolver` は `qubovert.sim.anneal_pubo`
を呼び出し、疎な PUBO (Polynomial Unconstrained Binary Optimization)
表現上で **任意次数** の古典 SA を実行します（テンソル爆発なし）：

```python
sol = qbpp.QubovertSolver(e).search(num_anneals=100)
```

トークン不要、GPU 不要、ネイティブ依存なし — `pip install qubovert` のみ。
否定リテラルは `simplify_as_binary(e, all_positive=True)` で自動展開。

`search()` でよく使う kwargs（`anneal_pubo` に転送）:
`num_anneals`, `anneal_duration`, `initial_state`, `seed`,
`temperature_range`, `schedule`。`time_limit` は非対応。

## SimulatedBifurcationSolver

[simulated-bifurcation](https://github.com/bqth29/simulated-bifurcation-algorithm)
は東芝の **Simulated Bifurcation (SB)** アルゴリズムを実装。
QUBO/Ising 向けの高速古典ヒューリスティックで、密な二次問題では SA に
匹敵あるいは凌駕することも。PyTorch ベース（CPU/GPU 両対応）：

```python
sol = qbpp.SimulatedBifurcationSolver(e).search(agents=128, max_steps=10000)
```

`search()` でよく使う kwargs（`sb.minimize` に転送）:
`agents`, `max_steps`, `mode` (`"ballistic"` / `"discrete"`), `heated`,
`early_stopping`, `timeout`（秒、内部上限）。BQM のみ — HUBO は拒否
されます（高次は `OpenJijSolver` / `HobotanMikasSolver` /
`QubovertSolver` を使ってください）。`time_limit` は非対応。

---

## 戻り値の型

本ページの全ソルバーは、PyQBPP 標準の `SolverSol` を返します
(`EasySolverSol`/`ABS3SolverSol` と同じ型)。
そのため、ソルバーを切り替えてもプログラムの後段は変更不要です。

```python
print(sol.energy)            # 最良目的関数値
print(sol.tts)               # time-to-best-solution (秒)
print(sol.info["solver"])    # "OpenJijSolver" / "DWaveNealSolver" / ...
for s in sol.sols:           # 追加で得られた解
    print(s.energy, s.tts)
```

`sol.info` の中身はソルバーごとに異なります:

- `DWaveNealSolver` などの dimod 系: `dimod_<key>` として
  `SampleSet.info` の全エントリ
- `OpenJijSolver`: 同様に `dimod_<key>`
