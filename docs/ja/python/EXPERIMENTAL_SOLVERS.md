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

| ソルバー | バックエンド | インストール | トークン | `time_limit` |
|---|---|---|---|---|
| [`AmplifySolver`](#amplifysolver) | Fixstars Amplify SDK (クラウド: Fixstars AE, Fujitsu DA など) | `pip install amplify` | 必要（既定: Fixstars AE） | 対応 |
| [`DWaveSolver`](#dwavesolver) | D-Wave QPU (Advantage, Ocean SDK 経由) | `pip install dwave-ocean-sdk` | 必要（D-Wave Leap） | **非対応** — `num_reads` を使う |
| [`DWaveHybridSolver`](#dwavehybridsolver) | D-Wave Leap Hybrid Sampler | `pip install dwave-ocean-sdk` | 必要（D-Wave Leap） | 対応 |
| [`OpenJijSolver`](#openjijsolver) | OpenJij (ローカル SA / SQA、オープンソース) | `pip install openjij` | 不要 | **非対応** — `num_reads` を使う |

D-Wave QPU と OpenJij のサンプラはハードウェア／アルゴリズムの仕組み上、
壁時計の打ち切り (wall-clock time limit) という概念がありません。
PyQBPP はこれらのソルバーに `time_limit=...` が渡されるとエラーで明示的に
拒否します（dimod のサンプラは未知の kwargs を黙って無視することが多く、
気づかぬまま time_limit が効かないという事故を防ぐためです）。

## 対応プラットフォーム

3 ソルバーとも **x86_64 と aarch64 (ARM) Linux の両方で動作します**。
PyPI のホイール提供状況は次の通り。リストにない Python バージョンを
使うと pip がソースビルドにフォールバックしますが、
`dimod`/`dwave-system` は小さな Cython 拡張なのでビルド可能、
`amplify` と `openjij`/`jij-cimod` は実用的にはほぼ不可能です。
プリビルドホイールがある Python バージョンを使ってください。

| パッケージ | Linux x86_64 | Linux aarch64 | 必要な Python |
|---|:---:|:---:|---|
| `amplify` | ✅ | ✅ | **3.10 以上**（3.9 以下は aarch64 ホイール無し） |
| `openjij` + `jij-cimod` | ✅ | ✅ | aarch64 は **3.10〜3.12** |
| `dimod` | ✅ | ✅ | aarch64 は **3.10 以上** |
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

# オフライン Simulated Annealing (トークン・ネット不要)
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

## OpenJijSolver

[OpenJij](https://www.openjij.org/) (Jij Inc., オープンソース Ising/QUBO
サンプラ) を呼びます。既定のサンプラは `openjij.SASampler()` (Simulated
Annealing)。`SQASampler()` (Simulated Quantum Annealing)、`CSQASampler()`
(連続時間 SQA)、JijZept のクラウドサンプラなどを `sampler=` で注入できます。

```python
import pyqbpp as qbpp
import openjij as oj

# 既定: ローカル Simulated Annealing
sol = qbpp.OpenJijSolver(e).search(num_reads=1000)

# SQA に差し替え
sol = qbpp.OpenJijSolver(e, sampler=oj.SQASampler()).search(num_reads=100)
```

`search()` でよく使う kwargs (そのまま `sampler.sample(bqm, **kwargs)`
に転送される): `num_reads`, `num_sweeps`, `beta_min`, `beta_max`,
`schedule`。`DWaveSolver` と同様、`time_limit` は非対応で degree ≤ 2 が必要。

## 戻り値の型

4 つのソルバーすべて、PyQBPP 標準の `SolverSol` を返します
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
