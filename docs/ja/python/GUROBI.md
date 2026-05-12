---
layout: default
nav_exclude: true
title: "Gurobi Solver"
nav_order: 22
lang: ja
hreflang_alt: "en/python/GUROBI"
hreflang_lang: "en"
---

# Gurobi Optimizer の使い方
PyQBPP は [Gurobi Optimizer](https://www.gurobi.com) を使用して QUBO 式を解くことができます。
PyQBPP は Gurobi の C ランタイム (`libgurobi*.so`) を直接呼び出します — **`gurobipy` 不要**。Python 3.11 以前 (ctypes バックエンド) では `ctypes.CDLL` 経由、Python 3.12+ (nanobind バックエンド) ではヘッダオンリーの C++ ラッパ `qbpp/gurobi.hpp` 経由で同じ `libgurobi*.so` を `dlopen` します。どちらの経路でも、実体はシステムにインストール済みの Gurobi です。有効な Gurobi ライセンスが必要です。

式 `f` を **`pyqbpp.GurobiSolver`** で解くには、以下の 2 ステップで行います:
1. 式 `f` に対して `GurobiSolver` オブジェクトを作成します。
2. **`search()`** メソッドをキーワード引数で呼び出します。解が返されます。

インタフェースは `pyqbpp.ABS3Solver` と同型なので、ほぼクラス名の変更のみでソルバー切替できます。

## Gurobi Solver による分割問題の解法
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

## GurobiSolver オブジェクト
`GurobiSolver` オブジェクトは式から作成します。
構築時に式は Gurobi 内部のモデルに変換されます:
- **`GurobiSolver(f)`**: 式から Gurobi モデルを構築します。

`GurobiSolver` は **QUBO** (次数 ≤ 2) のみサポートします。HUBO (3 次以上) を含む式を渡すと例外が投げられます。
HUBO の場合は補助変数で QUBO に低次化するか、任意次数を扱える `pyqbpp.ABS3Solver` / `pyqbpp.EasySolver` を利用してください。

## Gurobi パラメータ
パラメータは `search()` のキーワード引数 (または辞書) で渡します。
pyqbpp ラッパが解釈するキーを以下に示します。**このリストにないキーはそのまま Gurobi に転送される**ので、[Gurobi の全パラメータ](https://docs.gurobi.com/projects/optimizer/en/current/reference/parameters.html) (`MIPFocus`, `Heuristics`, `Cuts`, `Seed`, `LogFile`, `OutputFlag` など) が利用可能です。

### 基本オプション

| キー | 型 | 説明 |
|----|----|----|
| **`time_limit`** | float | 制限時間 (秒)。達したら探索を終了 |
| **`target_energy`** | int | 目標エネルギー以下の解を発見した時点で探索を終了 |
| **`thread_count`** | int | Gurobi のワーカースレッド数 |

### 高度なオプション

| キー | 型 | 説明 |
|----|----|----|
| **`enable_default_callback`** | int (0/1) | 組込みコールバック (新最良解のエネルギーと TTS を出力) を有効化 |
| **`callback_timer_interval`** | float | `Timer` コールバックの初期間隔 (秒) |
| **`topk_sols`** | int | 上位 K 解を返す (`PoolSearchMode=2` と `PoolSolutions=K` を設定) |
| **`license_file`** | str | `$GRB_LICENSE_FILE` を上書き |

> 注: ABS3 の `best_energy_sols` は提供していません — Gurobi の solution pool には「同一ベストエネルギーのみ収集」モードが直接無く、別 API (例: `PoolGap=0`) が必要なためです。

その他の Gurobi ネイティブパラメータ (例: `MIPFocus=1`、`Heuristics=0.5`、`OutputFlag=1`) もキーワード引数で渡せ、そのまま Gurobi に転送されます。

返り値は `sol.energy`、`sol(x)`、`sol.info` などを提供する解オブジェクトです。詳細は [QR_SOLUTION](QR_SOLUTION) を参照してください。

## 複数解の取得

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

## ソルバー情報

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

## カスタムコールバック

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

### 例: カスタムコールバック

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

## 解のヒント

ヒント解を与えると、既知の解から探索を warm start できます。

最もシンプルな方法は `search()` 前に `solver.hint(prev_sol)` を呼ぶことです:
```python
solver.hint(prev_sol)
sol = solver.search(time_limit=10)
```

これは optimize 開始時にキューから取り出され Gurobi に届きます (可能であれば MIPSTART としても書込)。

外部ソルバーから定期的に解をフィードする等の高度な用途では、コールバック内から `self.hint(sol)` を呼ぶこともできます。コールバック中の hint はキューに入り、次の `MIPNODE` イベント発火時に Gurobi へ届きます (Gurobi 側の API 制約)。コールバックを定期的に走らせるため `self.timer()` の併用を推奨します。

## セットアップ

Gurobi 公式の Software Installation Guide に従ってください。tar.gz を展開した後、以下の標準環境変数を設定します (Linux x86_64 の場合):

```sh
export GUROBI_HOME="$HOME/gurobi1301/linux64"
export PATH="${PATH}:${GUROBI_HOME}/bin"
export LD_LIBRARY_PATH="${LD_LIBRARY_PATH}:${GUROBI_HOME}/lib"
```

ライセンスを `~/gurobi.lic` に配置するか、`GRB_LICENSE_FILE` を設定してください。**`pip install gurobipy` は不要**、`$GUROBI_HOME/src/build` での `make` も不要です。PyQBPP は C++ 側と同じ環境設定から `libgurobi<MAJOR><MINOR>.so` を遅延ロードします (ctypes バックエンドでは `ctypes.CDLL`、nanobind バックエンドでは C++ ラッパ経由の `dlopen`)。

ARM64 Linux では `linux64` を `armlinux64` に置き換えます。
