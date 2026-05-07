---
layout: default
nav_exclude: true
title: "実験的なソルバー連携"
nav_order: 25
lang: ja
hreflang_alt: "en/python/EXPERIMENTAL_SOLVERS"
hreflang_lang: "en"
---

# 実験的なソルバー連携: Amplify, D-Wave, OpenJij

> **⚠️ Experimental — PyQBPP のみ**
>
> サードパーティのソルバー本体 (Fixstars Amplify, D-Wave Advantage /
> Leap Hybrid, OpenJij) はいずれも実用に供されている製品です。
> ここで **実験的** なのは PyQBPP 側の連携部分 — ラッパクラスである
> `AmplifySolver`, `DWaveSolver`, `DWaveHybridSolver`, `OpenJijSolver` の
> API です。今後の PyQBPP リリースで予告なく変更される可能性があります。
>
> これらは **PyQBPP (Python) からのみ利用可能** で、C++ の QUBO++
> ライブラリからは呼び出せません。各バックエンド (Amplify SDK, D-Wave
> Ocean SDK, OpenJij) は Python パッケージとしてのみ提供されているため、
> PyQBPP は Python 経由で直接モデルを渡しています。C++ 側のエントリーポイント
> はありません。
>
> 各ソルバーは対応するサードパーティ Python パッケージを別途インストール
> する必要があります。PyQBPP 自体はこれらのパッケージに依存しておらず、
> ソルバーを生成した時点で初めて遅延 import されます。

PyQBPP は問題定式化を変更せず、以下の外部ソルバーにモデルを送れます。
ソルバーのインターフェースは [`qbpp.EasySolver`](EASYSOLVER) や
[`qbpp.GurobiSolver`](GUROBI) と揃えてあります。

```python
solver = qbpp.AmplifySolver(e)        # または DWaveSolver / DWaveHybridSolver / OpenJijSolver
sol    = solver.search(...)
print(sol.energy, sol.info)
```

## 一覧

| ソルバー | バックエンド | インストール | トークン | `time_limit` | HUBO |
|---|---|---|---|---|---|
| [`AmplifySolver`](#amplifysolver) | Fixstars Amplify SDK (クラウド: Fixstars AE, Fujitsu DA など) | `pip install amplify` | 必要（既定: Fixstars AE） | 対応 | ✅ (SDK が自動 quadratize) |
| [`DWaveSolver`](#dwavesolver) | D-Wave QPU (Advantage, Ocean SDK 経由) | `pip install dwave-ocean-sdk` | 必要（D-Wave Leap） | **非対応** — `num_reads` を使う | ❌ degree ≤ 2 |
| [`DWaveHybridSolver`](#dwavehybridsolver) | D-Wave Leap Hybrid Sampler | `pip install dwave-ocean-sdk` | 必要（D-Wave Leap） | 対応 | ❌ degree ≤ 2 |
| [`DWaveNealSolver`](#dwavenealsolver) | D-Wave Neal — 古典 SA、**量子ソルバーではない** | `pip install dwave-samplers` | **不要** | **非対応** — `num_reads` を使う | ❌ degree ≤ 2 |
| [`DWaveTabuSolver`](#dwavetabusolver) | D-Wave samplers — 古典 Tabu サーチ | `pip install dwave-samplers` | **不要** | **非対応** — `timeout` (ms) を使う | ❌ degree ≤ 2 |
| [`DWaveSteepestDescentSolver`](#dwavesteepestdescentsolver) | D-Wave samplers — Greedy ローカル降下 | `pip install dwave-samplers` | **不要** | **非対応** — `num_reads` を使う | ❌ degree ≤ 2 |
| [`DimodExactSolver`](#dimodexactsolver) | dimod 全数列挙（〜20 変数まで） | `pip install dimod` | **不要** | **非対応** | ❌ degree ≤ 2 |
| [`OpenJijSolver`](#openjijsolver) | OpenJij (ローカル SA / SQA、オープンソース) | `pip install openjij` | **不要** | **非対応** — `num_reads` を使う | ✅ `sample_hubo` 経由 (SASampler) |
| [`HobotanMikasSolver`](#hobotanmikassolver) | TYTAN-SDK MIKASAmpler — HUBO ネイティブ PyTorch SA | `pip install -U git+https://github.com/tytansdk/tytan` (+ `torch`) | **不要** | **非対応** — `shots` を使う | ✅ 密テンソル |
| [`QubovertSolver`](#qubovertsolver) | qubovert.sim.anneal_pubo — Pure Python HUBO SA | `pip install qubovert` | **不要** | **非対応** — `num_anneals` を使う | ✅ 疎 PUBO |
| [`SimulatedBifurcationSolver`](#simulatedbifurcationsolver) | Toshiba SB アルゴリズム (PyTorch CPU/GPU) | `pip install simulated-bifurcation` | **不要** | **非対応** — `timeout` / `max_steps` を使う | ❌ degree ≤ 2 |
| [`CplexSolver`](#cplexsolver) | IBM CPLEX MIQP（商用） | `pip install cplex`（ライセンス必要） | **不要**（ライセンス） | 対応 | ❌ degree ≤ 2 |
| [`QiskitOptimizationSolver`](#qiskitoptimizationsolver) | IBM Qiskit Optimization（古典 or QAOA / VQE） | `pip install qiskit qiskit-optimization qiskit-algorithms` | **不要** | **非対応** — eigensolver 側で設定 | ❌ degree ≤ 2 |
| [`OrToolsCpSatSolver`](#ortoolscpsatsolver) | Google OR-Tools CP-SAT（HUBO は Boolean 変換） | `pip install ortools` | **不要** | 対応 | ✅ Boolean AND 経由 |

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
| `DWaveSolver` / `DWaveNealSolver` / `DWaveTabuSolver` / `DWaveSteepestDescentSolver` / `OpenJijSolver` | `num_reads` | （そのまま） |
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

本ページの全ソルバーが **x86_64 と aarch64 (ARM) Linux の両方で動作します**。
PyPI のホイール提供状況は次の通り。リストにない Python バージョンを
使うと pip がソースビルドにフォールバックしますが、
`dimod` / `dwave-samplers` / `dwave-system` は小さな Cython 拡張なので
ビルド可能、`amplify` と `openjij`/`jij-cimod` は実用的にはほぼ不可能です。
プリビルドホイールがある Python バージョンを使ってください。

| パッケージ | Linux x86_64 | Linux aarch64 | 必要な Python |
|---|:---:|:---:|---|
| `amplify` | ✅ | ✅ | **3.10 以上**（3.9 以下は aarch64 ホイール無し） |
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

## AmplifySolver

[Fixstars Amplify SDK](https://amplify.fixstars.com/) を呼び出します。
既定のバックエンドは Fixstars AE。`client=` で他の Amplify クライアント
(`FixstarsClient`, `FujitsuDA4Client`, `LeapHybridSamplerClient` ほか)
にも切り替えられます。

```python
import pyqbpp as qbpp

x = qbpp.var("x", 4)
e = qbpp.sqr(x[0] + 2*x[1] + 3*x[2] + 4*x[3] - 5)

# 既定: Fixstars AE
sol = qbpp.AmplifySolver(e).search(token="...", time_limit=1.0)

# Amplify クライアントを差し替え
from amplify import FujitsuDA4Client
sol = qbpp.AmplifySolver(e, client=FujitsuDA4Client(token="...")
                         ).search(time_limit=5.0)
```

`search()` で認識される kwargs:

| kwarg | 意味 |
|---|---|
| `time_limit` | 秒 (float)。`client.parameters.timeout` に設定されます。 |
| `token` | API トークン。`client.token` に設定。 |
| `proxy` / `url` | ネットワーク設定。 |
| その他 | `client.parameters.<name>` 属性が存在すればそこへ転送。 |

`AmplifySolver` は任意の次数の多項式を受け付けます。バックエンドが
QUBO のみ対応の場合、Amplify SDK が自動で次数下げを行います。

## DWaveSolver

D-Wave QPU (Advantage) を Ocean SDK 経由で直接呼びます。Minor embedding
は自動 (`EmbeddingComposite(DWaveSampler(...))`)。オフライン実験用には、
任意の dimod 互換サンプラを `sampler=` で注入できます。

```python
import pyqbpp as qbpp

# 実機 QPU
sol = qbpp.DWaveSolver(e, token="DEV-...", solver="Advantage_system6.4"
                       ).search(num_reads=1000, chain_strength=2.0)

# オフライン古典 SA を使う場合は DWaveNealSolver を使う方が明示的（後述）
from dwave.samplers import SimulatedAnnealingSampler
sol = qbpp.DWaveSolver(e, sampler=SimulatedAnnealingSampler()
                       ).search(num_reads=1000)
```

`DWaveSolver` はモデルが **degree ≤ 2** (BQM) であることを要求します。
高次項は事前に二次化が必要で、HUBO のまま `DWaveSolver` を構築すると
`RuntimeError` になります。

`time_limit` は **非対応** です。QPU の実行時間は
`num_reads` × `annealing_time` (μs) で決まります。
`time_limit=...` を渡すと `RuntimeError` で拒否されます
（壁時計予算が黙って無視される事故を防ぐためです）。

## DWaveHybridSolver

D-Wave [Leap Hybrid Sampler](https://docs.ocean.dwavesys.com/) を呼びます。
古典最適化と QPU 呼び出しを組み合わせるため、QPU 単体より遥かに大きな
問題（〜10⁶ 変数）を扱えます。`time_limit` (秒) で壁時計制御。

```python
sol = qbpp.DWaveHybridSolver(e, token="DEV-...").search(time_limit=5)
```

`DWaveSolver` と同じく、degree ≤ 2 が必要です。

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
`beta_schedule_type`。`DWaveSolver` と同様、`time_limit` は非対応で
degree ≤ 2 が必要。

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
sol = qbpp.OpenJijSolver(qbpp.sqr(x[0]+x[1]+x[2]+x[3]-1)).search(num_reads=1000)

# HUBO degree 3 — 自動的に sample_hubo() が使われる
e = qbpp.Expr(x[0]*x[1]*x[2]) - qbpp.Expr(x[0])
sol = qbpp.OpenJijSolver(e).search(num_reads=200)

# SQA は QUBO のみ。HUBO に渡すとエラー
sol = qbpp.OpenJijSolver(e_quad, sampler=oj.SQASampler()).search(num_reads=100)
```

`search()` でよく使う kwargs (そのまま内部のサンプル呼び出しに転送される):
`num_reads`, `num_sweeps`, `beta_min`, `beta_max`, `schedule`。
`time_limit` は非対応で、`num_reads` / `num_sweeps` で実行時間を制御します。

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

## HobotanMikasSolver

[TYTAN-SDK](https://github.com/tytansdk/tytan) の **MIKASAmpler** を
呼びます。PyTorch ベースの Simulated Annealing で **HUBO を直接** 扱える
（次数下げ不要）。"TYTAN" / "Hobotan" という名前ですがトークン／ライセンス
／ネットは不要 — ローカル CPU/GPU (CUDA / MPS) で動作します。

インストール（PyPI ではなく GitHub のみ）：

    pip install -U git+https://github.com/tytansdk/tytan
    pip install torch          # CPU build；CUDA / MPS は自動検出

使い方：

```python
import pyqbpp as qbpp
x = qbpp.var("x", 4)
e = qbpp.Expr(x[0]*x[1]*x[2]) + qbpp.Expr(x[1]*x[2]*x[3]) - qbpp.Expr(x[0])
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

## CplexSolver

[IBM CPLEX](https://www.ibm.com/products/ilog-cplex-optimization-studio)
の MIQP ソルバー。Gurobi の商用兄弟。実行時に有効な CPLEX ライセンスが
必要です（無料の Community Edition は ~1000 変数まで）。BQM のみ：

```python
sol = qbpp.CplexSolver(e).search(time_limit=10.0)
```

`search()` の認識される kwargs: `time_limit`（秒、`parameters.timelimit`
にマップ）、`thread_count`（`parameters.threads`）、`target_energy`。
それ以外は `cplex.parameters.<name>.set(value)` に転送（ドット表記の
ネスト指定もサポート）。

## QiskitOptimizationSolver

[IBM Qiskit Optimization](https://qiskit-community.github.io/qiskit-optimization/)
を使用。`qiskit_optimization.QuadraticProgram` を構築し、設定可能な
`MinimumEigenOptimizer` で解きます。既定の eigensolver は **古典的な**
`NumPyMinimumEigensolver`（厳密解 — 小さなモデルの検証に有用）。
量子シミュレーション用に `QAOA` / `VQE` を注入できます：

```python
from qiskit_algorithms import QAOA
from qiskit.primitives import Sampler
sol = qbpp.QiskitOptimizationSolver(
    e, eigensolver=QAOA(Sampler(), reps=2)).search()
```

BQM のみ — Qiskit の `QuadraticProgram` は二次までしか扱えません。
HUBO を QAOA/VQE で解くには Pauli ハミルトニアンを手動で構築する必要が
ありますが、その経路は現在ラップしていません。

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

`search()` でよく使う kwargs:
`time_limit`（秒、`parameters.max_time_in_seconds`）、
`thread_count`（`num_search_workers`）、`log`（真偽値）。

## 戻り値の型

14 のソルバーすべて、PyQBPP 標準の `SolverSol` を返します
(`EasySolverSol`/`ABS3SolverSol`/`GurobiSolverSol` と同じ型)。
そのため、ソルバーを切り替えてもプログラムの後段は変更不要です。

```python
print(sol.energy)            # 最良目的関数値
print(sol.tts)               # time-to-best-solution (秒)
print(sol.info["solver"])    # "AmplifySolver" / "DWaveSolver" / ...
for s in sol.sols:           # 追加で得られた解
    print(s.energy, s.tts)
```

`sol.info` の中身はソルバーごとに異なります:

- `AmplifySolver`: `amplify_version`, `client`, `execution_time`,
  `response_time`, `total_time` など
- `DWaveSolver` / `DWaveHybridSolver`: `dimod_<key>` として
  `SampleSet.info` の全エントリ (timing, embedding context など)
- `OpenJijSolver`: 同様に `dimod_<key>`
