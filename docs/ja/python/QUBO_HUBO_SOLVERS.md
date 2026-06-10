---
layout: default
nav_exclude: true
title: "QUBO/HUBO ソルバー"
nav_order: 22
lang: ja
hreflang_alt: "en/python/QUBO_HUBO_SOLVERS"
hreflang_lang: "en"
---

# QUBO/HUBO ソルバー — Gurobi, D-Wave, Amplify, OpenJij, …

このページは、**QUBO/HUBO モデルを直接** 受け取る（線形化を行わない）外部
ソルバーを扱います。PyQBPP は多項式（あるいはその二次／Ising 形式）を
そのままバックエンドへ渡します。これらは 2 つのグループに分かれます:

1. **二次目的関数を直接受け取る厳密ソルバー**
   （[Gurobi](#gurobi), [`CplexSolver`](#cplexsolver),
   [`DimodExactSolver`](#dimodexactsolver),
   [`QiskitOptimizationSolver`](#qiskitoptimizationsolver)）— 分枝限定／全数
   列挙で**証明付きの最適解**（MIQP ソルバーは下界も）を返します。Fortet 補助
   変数は導入せず、二次目的関数をそのままソルバーへ渡します。
2. **ヒューリスティックなサンプラ・アニーラ**
   （[`AmplifySolver`](#amplifysolver)、[D-Wave 系](#dwavesolver)、
   [`OpenJijSolver`](#openjijsolver)、[`HobotanMikasSolver`](#hobotanmikassolver)、
   [`QubovertSolver`](#qubovertsolver)、
   [`SimulatedBifurcationSolver`](#simulatedbifurcationsolver)）— 物理着想／
   局所探索のヒューリスティックでサンプルを引き、最良解を返します。

> **他のソルバーの場所。** 二次目的関数を純 MILP に**線形化**してから渡す
> 必要があるソルバー（SCIP, HiGHS, GLPK, CBC）は [MILP ソルバー](MILP_SOLVERS)
> に、制約プログラミングエンジンの OR-Tools CP-SAT は
> [CP ソルバー](CP_SOLVERS) にまとめています。

> **実験的 — PyQBPP のみ。** Gurobi（C++ からも利用可）を除き、本ページの
> ソルバーには **C++ エントリーポイントがなく**、ラッパ API は予告なく変更
> される可能性があります。各バックエンドは Python パッケージとしてのみ提供
> され、ソルバー生成時に遅延 import されます。PyQBPP 自体はこれらに依存しません。

すべてのソルバーは PyQBPP 標準の解オブジェクトを返し、
[`qbpp.EasySolver`](EASYSOLVER) / [`qbpp.ABS3Solver`](ABS3) と同じ
`search()` プロトコルに従うため、プログラムの後段はソルバー非依存に保てます:

```python
solver = qbpp.GurobiSolver(e)         # または AmplifySolver / DWaveSolver / OpenJijSolver / ...
sol    = solver.search(...)
print(sol.energy, sol.info)
```

## 一覧

| ソルバー | グループ | バックエンド | インストール | トークン | `time_limit` | HUBO | 否定リテラル |
|---|---|---|---|---|---|---|---|
| [`GurobiSolver`](#gurobi) | 厳密 (MIQP) | Gurobi Optimizer (`libgurobi*.so`) | Gurobi 本体 | **ライセンス** | 対応 | ❌ degree ≤ 2 | — |
| [`CplexSolver`](#cplexsolver) | 厳密 (MIQP) | IBM CPLEX（商用） | `pip install cplex` | **ライセンス** | 対応 | ❌ degree ≤ 2 | — |
| [`DimodExactSolver`](#dimodexactsolver) | 厳密 (列挙) | dimod 全数列挙（〜20 変数） | `pip install dimod` | 不要 | 非対応 | ❌ degree ≤ 2 | — |
| [`QiskitOptimizationSolver`](#qiskitoptimizationsolver) | 厳密 / 量子 | IBM Qiskit Optimization（古典 or QAOA / VQE） | `pip install qiskit qiskit-optimization qiskit-algorithms` | 不要 | 非対応 | ❌ degree ≤ 2 | — |
| [`AmplifySolver`](#amplifysolver) | サンプラ | Fixstars Amplify SDK (クラウド: Fixstars AE, Fujitsu DA など) | `pip install amplify` | 必要（既定: Fixstars AE） | 対応 | ✅ (SDK が自動 quadratize) | ❌ 要 `all_positive=True` |
| [`DWaveSolver`](#dwavesolver) | サンプラ / 量子 | D-Wave QPU (Advantage, Ocean SDK 経由) | `pip install dwave-ocean-sdk` | 必要（D-Wave Leap） | **非対応** — `num_reads` を使う | ❌ degree ≤ 2 | — |
| [`DWaveNativeSolver`](#dwavenativesolver) | サンプラ / 量子 | D-Wave QPU — ネイティブトポロジー、**埋め込みなし** | `pip install dwave-ocean-sdk` | 必要（D-Wave Leap） | **非対応** — `num_reads` を使う | ❌ degree ≤ 2 | — |
| [`DWaveHybridSolver`](#dwavehybridsolver) | サンプラ / ハイブリッド | D-Wave Leap Hybrid Sampler | `pip install dwave-ocean-sdk` | 必要（D-Wave Leap） | 対応 | ❌ degree ≤ 2 | — |
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
**証明付きの最適解**を返します。MIQP ソルバー（Gurobi, CPLEX）では、解の
エネルギーが下界 `bound` と一致したとき最適性が保証されます。いずれも
**degree ≤ 2** (BQM) が必要です。HUBO は事前に QUBO へ低次化するか、
[`ABS3Solver`](ABS3) など HUBO 対応ソルバーを使ってください。

## Gurobi

PyQBPP は [Gurobi Optimizer](https://www.gurobi.com) を使用して QUBO 式を解くことができます。
PyQBPP は Gurobi の C ランタイム (`libgurobi*.so`) を直接呼び出します — **`gurobipy` 不要**。Python 3.11 以前 (ctypes バックエンド) では `ctypes.CDLL` 経由、Python 3.12+ (nanobind バックエンド) ではヘッダオンリーの C++ ラッパ `qbpp/gurobi.hpp` 経由で同じ `libgurobi*.so` を `dlopen` します。どちらの経路でも、実体はシステムにインストール済みの Gurobi です。有効な Gurobi ライセンスが必要です。

式 `f` を **`pyqbpp.GurobiSolver`** で解くには、以下の 2 ステップで行います:
1. 式 `f` に対して `GurobiSolver` オブジェクトを作成します。
2. **`search()`** メソッドをキーワード引数で呼び出します。解が返されます。

インタフェースは `pyqbpp.ABS3Solver` と同型なので、ほぼクラス名の変更のみでソルバー切替できます。

### Gurobi Solver による分割問題の解法
以下のプログラムは、数の分割問題を Gurobi Optimizer で解きます:
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

solver = qbpp.GurobiSolver(f)
sol = solver.search(time_limit=10.0, enable_default_callback=1)

print(f"energy = {sol.energy}")
print(f"bound  = {sol.info.get('bound')}")
print(f"status = {sol.info.get('status')}")
print("P:", [w[i] for i in range(len(w)) if sol(x[i]) == 1])
print("Q:", [w[i] for i in range(len(w)) if sol(x[i]) == 0])
```

このプログラムは、まず式 `f` に対して `GurobiSolver` オブジェクトを作成します。
次にパラメータをキーワード引数として `search()` メソッドに渡します。
`time_limit` は探索の最大秒数を、`enable_default_callback=1` は新しい最良解が見つかるたびにエネルギーと TTS を出力する組込みコールバックを有効化します。

得られた解のエネルギーが `sol.info['bound']` から得られる下界と一致したとき、その解は最適であることが保証されます:

```
energy = 0
bound  = 0.0
status = OPTIMAL
P: [64, 27, 74, 40]
Q: [47, 12, 83, 63]
```

### GurobiSolver オブジェクト
`GurobiSolver` オブジェクトは式から作成します。
構築時に式は Gurobi 内部のモデルに変換されます:
- **`GurobiSolver(f)`**: 式から Gurobi モデルを構築します。

`GurobiSolver` は **QUBO** (次数 ≤ 2) のみサポートします。HUBO (3 次以上) を含む式を渡すと例外が投げられます。
HUBO の場合は補助変数で QUBO に低次化するか、任意次数を扱える `pyqbpp.ABS3Solver` / `pyqbpp.EasySolver` を利用してください。

### Gurobi パラメータ
パラメータは `search()` のキーワード引数 (または辞書) で渡します。
pyqbpp ラッパが解釈するキーを以下に示します。**このリストにないキーはそのまま Gurobi に転送される**ので、[Gurobi の全パラメータ](https://docs.gurobi.com/projects/optimizer/en/current/reference/parameters.html) (`MIPFocus`, `Heuristics`, `Cuts`, `Seed`, `LogFile`, `OutputFlag` など) が利用可能です。

#### 基本オプション

| キー | 型 | 説明 |
|----|----|----|
| **`time_limit`** | float | 制限時間 (秒)。達したら探索を終了 |
| **`target_energy`** | int | 目標エネルギー以下の解を発見した時点で探索を終了 |
| **`thread_count`** | int | Gurobi のワーカースレッド数 |

#### 高度なオプション

| キー | 型 | 説明 |
|----|----|----|
| **`enable_default_callback`** | int (0/1) | 組込みコールバック (新最良解のエネルギーと TTS を出力) を有効化 |
| **`callback_timer_interval`** | float | `Timer` コールバックの初期間隔 (秒) |
| **`topk_sols`** | int | 上位 K 解を返す (`PoolSearchMode=2` と `PoolSolutions=K` を設定) |
| **`license_file`** | str | `$GRB_LICENSE_FILE` を上書き |

> 注: ABS3 の `best_energy_sols` は提供していません — Gurobi の solution pool には「同一ベストエネルギーのみ収集」モードが直接無く、別 API (例: `PoolGap=0`) が必要なためです。

その他の Gurobi ネイティブパラメータ (例: `MIPFocus=1`、`Heuristics=0.5`、`OutputFlag=1`) もキーワード引数で渡せ、そのまま Gurobi に転送されます。

返り値は `sol.energy`、`sol(x)`、`sol.info` などを提供する解オブジェクトです。詳細は [QR_SOLUTION](QR_SOLUTION) を参照してください。

### 複数解の取得

`topk_sols` を指定すると Gurobi の解プール機能が有効になり、エネルギー昇順に複数の異なる解を取得できます。

```python
sol = solver.search(topk_sols=5)

print(f"Best energy: {sol.energy}")
print(f"追加解数: {len(sol.sols)}")
for s in sol.sols:
    print(f"energy={s.energy} tts={s.tts:.3f}s")
```

返り値オブジェクトのプロパティ:
- **`sol.energy`** — 最良解のエネルギー
- **`sol.sols`** — 追加プール解のリスト (エネルギー昇順)
- **`len(sol.sols)`** — 追加解数
- **`sol.info`** — ソルバー情報の辞書

### ソルバー情報

`sol.info` は Gurobi が提供する以下の情報を文字列で持つ辞書です:

| キー | 説明 |
|----|----|
| `status` | `OPTIMAL`, `TIME_LIMIT`, `INFEASIBLE`, `INTERRUPTED`, ... |
| `bound` | Gurobi が見つけた最良目的下界 (LP リラクゼーション) |
| `mip_gap` | 最終的な MIP gap |
| `node_count` | 探索した分枝限定ノード数 |
| `iter_count` | シンプレックス反復回数 |
| `solution_count` | Gurobi が保持している解の数 |
| `gurobi_version` | Gurobi バージョン文字列 (例: `13.0.1`) |
| `run_time` | optimize 呼出のウォール時間 (秒) |

### カスタムコールバック

コールバック API は `pyqbpp.ABS3Solver` と完全一致です。**`GurobiSolver` をサブクラス化**して `callback()` メソッド (引数なし) をオーバライドします。

コールバックは以下のいずれかのイベントで呼ばれます:

| 値 | 定数 | 説明 |
|:-:|----|----|
| `0` | `EVENT_START` | `search()` の最初に 1 回呼ばれる |
| `1` | `EVENT_BEST_UPDATED` | Gurobi が新しい最良解を見つけたとき (`MIPSOL`) に呼ばれる |
| `2` | `EVENT_TIMER` | `self.timer(seconds)` で設定した間隔で定期的に呼ばれる |

`callback()` 内で利用可能なメソッド:
- **`self.event()`** — 現在のイベント (int: 0=Start, 1=BestUpdated, 2=Timer)
- **`self.best_sol()`** — 現時点での最良解。`.energy`, `.tts`, `.get(var)` などを利用。`BestUpdated` 中は確実に有効、`Timer` 中はキャッシュ値、`Start` 中は未定義
- **`self.bound()`** — Gurobi が現時点で把握している最良目的下界 (LP リラクゼーション、`float`)。各 Gurobi コールバック発火時に更新される。Gurobi がまだ下界を確定していない場合 (`Start` 中、root LP 実行前など) は `float("-inf")` を返す。`BestUpdated` は LP 実行前のヒューリスティックから発火することも多いため、その時点では `bound()` は `-inf` のことがある。LP 処理後に発火する `Timer` イベントで読み取ると意味のある下界が得られる
- **`self.timer(seconds)`** — Timer 間隔を設定/無効化 (次のコールバック境界で反映)
- **`self.hint(sol)`** — ヒント解を提供 (キューに保存され次の `MIPNODE` で Gurobi に注入)

#### 例: カスタムコールバック

```python
import pyqbpp as qbpp

class MySolver(qbpp.GurobiSolver):
    def callback(self):
        if self.event() == qbpp.GurobiSolver.EVENT_START:
            self.timer(1.0)          # 1 秒ごとに Timer イベントを発火
        if self.event() == qbpp.GurobiSolver.EVENT_BEST_UPDATED:
            sol = self.best_sol()
            print(f"新しい最良解: energy={sol.energy} TTS={sol.tts:.3f}s")

x = qbpp.var("x", shape=8)
f = qbpp.sqr(qbpp.sum(x) - 4)
f.simplify_as_binary()

solver = MySolver(f)
sol = solver.search(time_limit=5, target_energy=0)
print(f"energy={sol.energy}")
```

### 解のヒント

ヒント解を与えると、既知の解から探索を warm start できます。

最もシンプルな方法は `search()` 前に `solver.hint(prev_sol)` を呼ぶことです:
```python
solver.hint(prev_sol)
sol = solver.search(time_limit=10)
```

これは optimize 開始時にキューから取り出され Gurobi に届きます (可能であれば MIPSTART としても書込)。

外部ソルバーから定期的に解をフィードする等の高度な用途では、コールバック内から `self.hint(sol)` を呼ぶこともできます。コールバック中の hint はキューに入り、次の `MIPNODE` イベント発火時に Gurobi へ届きます (Gurobi 側の API 制約)。コールバックを定期的に走らせるため `self.timer()` の併用を推奨します。

### セットアップ

Gurobi 公式の Software Installation Guide に従ってください。tar.gz を展開した後、以下の標準環境変数を設定します (Linux x86_64 の場合):

```sh
export GUROBI_HOME="$HOME/gurobi1301/linux64"
export PATH="${PATH}:${GUROBI_HOME}/bin"
export LD_LIBRARY_PATH="${LD_LIBRARY_PATH}:${GUROBI_HOME}/lib"
```

ライセンスを `~/gurobi.lic` に配置するか、`GRB_LICENSE_FILE` を設定してください。**`pip install gurobipy` は不要**、`$GUROBI_HOME/src/build` での `make` も不要です。PyQBPP は C++ 側と同じ環境設定から `libgurobi<MAJOR><MINOR>.so` を遅延ロードします (ctypes バックエンドでは `ctypes.CDLL`、nanobind バックエンドでは C++ ラッパ経由の `dlopen`)。

ARM64 Linux では `linux64` を `armlinux64` に置き換えます。

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
from qiskit.primitives import Sampler
sol = qbpp.QiskitOptimizationSolver(
    e, eigensolver=QAOA(Sampler(), reps=2)).search()
```

BQM のみ — Qiskit の `QuadraticProgram` は二次までしか扱えません。
HUBO を QAOA/VQE で解くには Pauli ハミルトニアンを手動で構築する必要が
ありますが、その経路は現在ラップしていません。

---

# ヒューリスティックなサンプラ・アニーラ

> **⚠️ Experimental — PyQBPP のみ**
>
> サードパーティのソルバー本体（Fixstars Amplify, D-Wave Advantage /
> Leap Hybrid, OpenJij, TYTAN-SDK, qubovert, Simulated Bifurcation）は
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

本グループの全ソルバーが **x86_64 と aarch64 (ARM) Linux の両方で動作します**。
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

## DWaveNativeSolver

**QPU のネイティブトポロジー上に既に配置された問題**を、指定した
Advantage アニーラへ **minor embedding なし**で投入します。`DWaveSolver`
（minorminer が論理問題を任意の量子ビットに配置する）と異なり、各変数を
`qubit_map` で **特定の1物理量子ビット**に対応づけ、chain 長 1 の自明な
embedding で投入します。したがってインスタンスの相互作用グラフは対象 QPU
の working graph の部分グラフである必要があり、**既定では投入前に検証**します。

ハードウェアのカプラーグラフ上に直接生成したベンチマーク（例: Advantage の
Pegasus グラフ上のランダム Ising スピングラス）のように、変数インデックスが
既に物理量子ビットに対応していて再埋め込みが不要な場合に使います。

```python
import pyqbpp as qbpp

# Advantage のネイティブグラフ上に直接配置した Ising：各変数のインデックスが
# 物理量子ビット番号、J のキーは実在するカプラー。
s = qbpp.var("s", num_qubits)
E = qbpp.expr()
for (i, j), c in couplers.items():     # i, j は物理量子ビット番号
    E += c * s[i] * s[j]
for i, hi in fields.items():
    E += hi * s[i]
qubo = qbpp.spin_to_binary(E)          # spin -> binary QUBO（値は保存される）

# 各変数を物理量子ビットに対応づけ、埋め込みなしで投入。
qubit_map = {s[i]: i for i in qubits}
sol = qbpp.DWaveNativeSolver(qubo, qubit_map,
                             token="DEV-...", solver="Advantage_system4.1"
                             ).search(num_reads=1000, annealing_time=20)
print(sol.energy)
```

- **`qubit_map`** は各 qbpp 変数（または整数インデックス）を対象ソルバの
  物理量子ビット番号に対応づけます。例: `{s[i]: i for i in qubits}`。
- **`validate=True`**（既定）は投入前に、全ての対応量子ビットが QPU の
  `nodelist` に、全ての 2 次相互作用が `edgelist` に存在するか検証し、
  working graph に収まらない場合は欠落した量子ビット・カプラーを列挙した
  `RuntimeError` を送出します。`validate=False` で検証を省略できます。

QPU なしのオフライン検証には、structured なモックを子サンプラとして注入します:

```python
import dimod
from dwave.samplers import SimulatedAnnealingSampler
child = dimod.StructureComposite(SimulatedAnnealingSampler(), nodelist, edgelist)
sol = qbpp.DWaveNativeSolver(qubo, qubit_map, sampler=child).search(num_reads=100)
```

`DWaveSolver` と同様、degree ≤ 2 が必要で、`time_limit` は **非対応**
（`num_reads` / `annealing_time` を使う）です。

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

---

## 戻り値の型

本ページの全ソルバーは、PyQBPP 標準の `SolverSol` を返します
(`EasySolverSol`/`ABS3SolverSol`/`GurobiSolverSol` と同じ型)。
そのため、ソルバーを切り替えてもプログラムの後段は変更不要です。

```python
print(sol.energy)            # 最良目的関数値
print(sol.tts)               # time-to-best-solution (秒)
print(sol.info["solver"])    # "GurobiSolver" / "AmplifySolver" / "DWaveSolver" / ...
for s in sol.sols:           # 追加で得られた解
    print(s.energy, s.tts)
```

`sol.info` の中身はソルバーごとに異なります:

- `GurobiSolver` / `CplexSolver`: `status`, `bound`, `mip_gap`, `node_count` など
- `AmplifySolver`: `amplify_version`, `client`, `execution_time`,
  `response_time`, `total_time` など
- `DWaveSolver` / `DWaveHybridSolver`: `dimod_<key>` として
  `SampleSet.info` の全エントリ (timing, embedding context など)
- `OpenJijSolver`: 同様に `dimod_<key>`
