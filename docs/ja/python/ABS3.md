---
layout: default
nav_exclude: true
title: "ABS3 Solver"
nav_order: 21
lang: ja
hreflang_alt: "en/python/ABS3"
hreflang_lang: "en"
---

# ABS3 Solverの使い方
ABS3 Solverを使用して式 `f` を解くには、以下の2つのステップで行います:
1. 式 `f` に対して **`ABS3Solver`** オブジェクトを作成する。
2. キーワード引数を指定して **`search()`** メソッドを呼び出し、得られた解を取得する。

## ABS3 Solverを使用したLABS問題の求解
以下のプログラムは、ABS3 Solverを使用して **Low Autocorrelation Binary Sequence (LABS)** 問題を解きます:
```python
import pyqbpp as qbpp

size = 100
x = qbpp.var("x", shape=size)
f = qbpp.expr()
for d in range(1, size):
    temp = qbpp.expr()
    for i in range(size - d):
        temp += (2 * x[i] - 1) * (2 * x[i + d] - 1)
    f += qbpp.sqr(temp)
f.simplify_as_binary()

solver = qbpp.ABS3Solver(f)
sol = solver.search(time_limit=10.0, enable_default_callback=1)
bits = "".join("-" if sol(x[i]) == 0 else "+" for i in range(size))
print(f"{sol.energy}: {bits}")
```
このプログラムでは、まず式 `f` に対して `ABS3Solver` オブジェクト `solver` を作成します。
次に、`search()` メソッドにパラメータをキーワード引数として渡して呼び出します。
`time_limit` は最大探索時間を秒単位で指定し、`enable_default_callback=1` は探索中に新たに見つかった最良解のエネルギーとTTSを出力する組み込みコールバックを有効にします。
このメソッドは指定された制限時間内に見つかった最良解を返し、`sol` に格納されます。

プログラムは解のエネルギーと対応するバイナリ列を出力します。"+"は1を、"-"は0を表します。

このプログラムは以下のような出力を生成します:
{% raw %}
```
TTS = 0.002s Energy = 1218
TTS = 0.002s Energy = 1170
TTS = 0.002s Energy = 994
TTS = 0.015s Energy = 958
TTS = 0.018s Energy = 922
TTS = 0.034s Energy = 874
TTS = 4.364s Energy = 834
834: -+--+---++-++-+---++-++--+++--+-+-+++++----+++-+-+---++-+--+-----+--+----++----+-+--++++++---+------
```
{% endraw %}

## ABS3 Solverオブジェクト
`ABS3Solver` オブジェクトは、与えられた式に対して作成されます。
コンストラクタは式を内部データフォーマットに変換してホストメモリにロードし、GPUが利用可能な場合はデバイスメモリにも転送します。
以降 `search()` を複数回呼び出してもこのロードは1度きりなので、同じ式に対して繰り返し探索する際のオーバーヘッドがありません。

省略可能な第2引数 `gpu` でGPUの使用を制御します:
- **`ABS3Solver(f)`**: 利用可能なすべてのGPUを自動的に使用します。GPUが利用できない場合はCPUのみモードにフォールバックします。
- **`ABS3Solver(f, 0)`**: CPUのみモードを強制します（GPUは使用されません）。
- **`ABS3Solver(f, n)`**: `n` 個のGPUを使用します。式は `n` 個のGPUすべてにロードされます。

探索パラメータは `search()` にキーワード引数として直接渡します。
上記の例では:
- **`time_limit=10.0`**: 制限時間を10.0秒に設定します。
- **`enable_default_callback=1`**: 新たに得られた解のエネルギーとTTSを出力する組み込みコールバック関数を有効にします。

## ABS3パラメータ
パラメータは `search()` メソッドにキーワード引数として直接渡します。
上記のプログラムでは、`time_limit=10.0` で制限時間を10.0秒に設定し、`enable_default_callback=1` で新たに得られた解のエネルギーを出力する組み込みコールバック関数を有効にしています。

戻り値は解で、`sol.energy`（エネルギー値）、`sol(x)`（変数値の取得）、`sol.info`（ソルバー情報の辞書）などを提供します。詳細は [QR_SOLUTION](QR_SOLUTION) を参照してください。

### 基本オプション

| キー | 型 | 説明 |
|----|----|----|
| **`time_limit`** | float | 制限時間（秒）。制限時間に達すると探索を終了します |
| **`target_energy`** | int | ターゲットエネルギーが達成されると探索を終了します |

### 詳細オプション

| キー | 型 | 説明 |
|----|----|----|
| **`enable_default_callback`** | int (0 または 1) | エネルギーとTTSを出力する組み込みコールバックを有効にします |
| **`cpu_enable`** | int (0 または 1) | GPUと並行して動作するCPUソルバーの有効/無効（デフォルト: 1） |
| **`cpu_thread_count`** | int | CPUソルバーのスレッド数（デフォルト: 自動） |
| **`block_count`** | int | GPU当たりのCUDAブロック数 |
| **`thread_count`** | int | CUDAブロック当たりのスレッド数 |
| **`topk_sols`** | int | 最良エネルギーのtop-K解を返します |
| **`best_energy_sols`** | int | 最大数（`0` = 無制限）。見つかった最良エネルギーを持つすべての解を返します |

## 複数解の収集

ABS3 Solverは探索中に複数の解を収集できます。
2つのモードが利用可能です:

### Top-K解 (`topk_sols`)

`topk_sols` パラメータはエネルギーの昇順にソートされたtop-K解を収集します。

```python
sol = solver.search(topk_sols=10)  # 最大10個の最良解を収集
```

### 最良エネルギー解 (`best_energy_sols`)

`best_energy_sols` パラメータは見つかった最良エネルギーを共有するすべての解を収集します。
より良いエネルギーが発見されると、プールがクリアされ、新しい最良エネルギーの解のみが保持されます。

```python
sol = solver.search(best_energy_sols=0)  # すべての最良エネルギー解を収集（無制限）
```

または、`best_energy_sols` を最大数付きで設定することもできます:
```python
sol = solver.search(best_energy_sols=100)  # 最大100個を収集
```

`topk_sols` と `best_energy_sols` は同じ内部プールを共有することに注意してください。
両方が指定された場合、最後に指定されたものが有効になります。

### 収集された解へのアクセス

`search()` の戻り値は解で、`sol.sols` プロパティを介して収集された解のリストにアクセスできます:

```python
sol = solver.search(topk_sols=5)

print(f"Best energy: {sol.energy}")
print(f"Number of solutions: {len(sol.sols)}")

for s in sol.sols:
    print(f"energy = {s.energy}  TTS = {s.tts}s")
```

戻り値オブジェクトは以下をサポートします:
- **`sol.energy`** — 最良解のエネルギー
- **`sol.tts`** — 最良解が見つかるまでの時間（秒）
- **`sol.sols`** — 収集された解のリスト（エネルギーの昇順）
- **`sol.sols[i]`** — i番目の解へのアクセス
- **`len(sol.sols)`** — 収集された解の数
- **`sol.info`** — ソルバー情報の辞書

## カスタムコールバック

組み込みコールバック（`enable_default_callback=1` で有効化）は、新しい最良解が見つかるたびにエネルギーとTTSを出力するだけです。
より細かい制御が必要な場合は、**`ABS3Solver` をサブクラス化**して `callback()` メソッド（引数なし）をオーバーライドします。

コールバックは以下のイベントのいずれかで呼び出されます:

| イベント値 | 名前 | 説明 |
|:-:|----|----|
| `0` | `Start` | `search()` の開始時に1回呼び出されます |
| `1` | `BestUpdated` | 新しい最良解が見つかるたびに呼び出されます |
| `2` | `Timer` | 設定可能な間隔で定期的に呼び出されます |

`callback()` 内では、以下のメソッドが利用可能です:
- **`self.event()`** — コールバックを発火したイベント（int: 0=Start, 1=BestUpdated, 2=Timer）
- **`self.best_sol()`** — 現在の最良解を返します。`.energy`, `.tts`, `.get(var)` などが使用できます
- **`self.timer(seconds)`** — 定期的な `Timer` コールバックの間隔を秒単位で設定。`0` でタイマーを無効化（下記参照）
- **`self.hint(sol)`** — 探索中にソルバーにヒント解を提供（[Solution Hint](#solution-hint) を参照）

### タイマー制御

`Timer` イベントはデフォルトでは有効になっていません。
定期的なタイマーコールバックを有効にするには、`callback()` メソッド内で `self.timer(seconds)` を呼び出します:
- **`self.timer(1.0)`** — 1秒ごとに `Timer` コールバックを発火します
- **`self.timer(0)`** — タイマーを無効にします
- `self.timer()` が呼ばれない場合、タイマー間隔は変更されません

通常、`self.timer()` は `Start` コールバック中に1回呼び出されて間隔を設定します。
`BestUpdated` や `Timer` コールバック中にも呼び出して、タイマーを動的に調整または無効にすることができます。

### 例: カスタムコールバック

```python
import pyqbpp as qbpp

class MySolver(qbpp.ABS3Solver):
    def callback(self):
        if self.event() == 0:        # Start
            self.timer(1.0)          # 1秒ごとのタイマーコールバックを有効化
        if self.event() == 1:        # BestUpdated
            sol = self.best_sol()
            print(f"New best: energy={sol.energy} TTS={sol.tts:.3f}s")

x = qbpp.var("x", shape=8)
f = qbpp.sqr(qbpp.sum(x) - 4)
f.simplify_as_binary()

solver = MySolver(f)
sol = solver.search(time_limit=5, target_energy=0)
print(f"energy={sol.energy}")
```

## Solution Hint

ヒント解を使用すると、以前に見つかった解で探索をウォームスタートできます。

最も簡単な方法は、`search()` の前に `solver.hint(sol)` を呼び出すことです:
```python
solver.hint(prev_sol)            # 探索にヒント解を提供
sol = solver.search(time_limit=10)
```
解は探索開始前にソルバーの内部データ構造に直接書き込まれます。

外部ソルバーを並行して実行するような高度なユースケースでは、コールバック内で `self.hint(sol)` を呼び出して動的に解を供給することもできます。
このシナリオでは、コールバックが定期的に呼び出されて新しい外部解をチェックできるように、定期的なタイマー（例: `self.timer(1.0)`）を設定することを推奨します。

### 例: ヒント解の提供

以下の例は素因数分解問題を2回解きます。
1回目の実行では通常通り最適解を見つけます。
2回目の実行では `solver.hint(sol1)` を介して最初の解をヒントとして提供し、ソルバーの収束を大幅に高速化します。

```python
import pyqbpp as qbpp

p = qbpp.var("p", between=(2, 1000))
q = qbpp.var("q", between=(2, 1000))
f = qbpp.sqr(p * q - 899 * 997)
f.simplify_as_binary()

solver = qbpp.ABS3Solver(f)

# 実行1: 通常の探索
sol1 = solver.search(target_energy=0, time_limit=10, enable_default_callback=1)
print(f"Run 1: p={sol1(p)} q={sol1(q)} energy={sol1.energy} TTS={sol1.tts:.3f}s")

# 実行2: 前回の解をヒントとして提供
solver.hint(sol1)
sol2 = solver.search(target_energy=0, time_limit=10, enable_default_callback=1)
print(f"Run 2: p={sol2(p)} q={sol2(q)} energy={sol2.energy} TTS={sol2.tts:.3f}s")
```

ヒント解は探索開始前にソルバーの内部データ構造に直接書き込まれます。
ソルバーはそのエネルギーを評価し、初期状態として使用した上で、より良い解の探索を続けます。
