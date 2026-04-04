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
2. パラメータのdictを指定して **`search()`** メソッドを呼び出し、得られた解を取得する。

## ABS3 Solverを使用したLABS問題の求解
以下のプログラムは、ABS3 Solverを使用して **Low Autocorrelation Binary Sequence (LABS)** 問題を解きます:
```python
import pyqbpp as qbpp

size = 100
x = qbpp.var("x", size)
f = qbpp.expr()
for d in range(1, size):
    temp = qbpp.expr()
    for i in range(size - d):
        temp += (2 * x[i] - 1) * (2 * x[i + d] - 1)
    f += qbpp.sqr(temp)
f.simplify_as_binary()

solver = qbpp.ABS3Solver(f)
solver.callback(lambda energy, tts, event: print(f"TTS = {tts:.3f}s Energy = {energy}"))
sol = solver.search({"time_limit": 10.0})
bits = "".join("-" if sol(x[i]) == 0 else "+" for i in range(size))
print(f"{sol.energy}: {bits}")
```
このプログラムでは、式 `f` に対して `ABS3Solver` オブジェクトを作成しています。
`callback()` で新しい最良解が見つかったときにエネルギーとTTSを表示する関数を設定し、`time_limit` などの探索パラメータは `search()` にdictとして渡しています。

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
省略可能な第2引数 `gpu` でGPUの使用を制御します:
- **`ABS3Solver(f)`**: 利用可能なすべてのGPUを自動的に使用します。GPUが利用できない場合は、CPUのみのモードにフォールバックします。
- **`ABS3Solver(f, 0)`**: CPUのみのモードを強制します（GPUは使用されません）。
- **`ABS3Solver(f, n)`**: `n` 個のGPUを使用します。

## 探索パラメータ
**`search(params)`** メソッドで探索を実行します。`params` dict には以下のキーを指定できます:

| キー | 型 | 説明 |
|----|----|----|
| **`time_limit`** | float | 制限時間（秒） |
| **`target_energy`** | int | 早期終了のための目標エネルギー |
| **`enable_default_callback`** | int（0 または 1） | 新しい最良解が見つかったときにエネルギーとTTSを表示 |
| **`cpu_enable`** | int（0 または 1） | GPUと並行してCPUソルバーを有効/無効にする（デフォルト: 1） |
| **`cpu_thread_count`** | int | CPUソルバーのスレッド数（デフォルト: 自動） |
| **`block_count`** | int | GPU当たりのCUDAブロック数 |
| **`thread_count`** | int | CUDAブロック当たりのスレッド数 |
| **`topk_sols`** | int | エネルギーが最良の top-K 解を収集 |
| **`best_energy_sols`** | int | すべての最適解を収集（`0` で無制限） |

## 複数解の取得
**`topk_sols`** または **`best_energy_sols`** を設定すると、複数の解が収集されます。
返された `Sol` に対して **`sol.sols()`** を呼び出すことで、エネルギーの昇順にソートされた `Sol` オブジェクトのリストを取得できます。

```python
solver = qbpp.ABS3Solver(f)
sol = solver.search({"topk_sols": 5})
for s in sol.sols():
    print(f"energy = {s.energy}")
```

## カスタムコールバック
組み込みコールバック（`enable_default_callback` で有効化）は、新しい最良解が見つかるたびにエネルギーとTTSを表示するだけです。
より細かい制御が必要な場合は、**`callback(func)`** メソッドでカスタムコールバック関数を設定します。

### `callback(func)` によるシンプルなコールバック
関数は3つの引数を受け取ります: `energy`（int）、`tts`（float）、`event`（string）。
`event` は以下のいずれかです:

| イベント | 説明 |
|---------|------|
| `"start"` | `search()` の開始時に1回呼び出される |
| `"best_updated"` | 新しい最良解が見つかるたびに呼び出される |
| `"timer"` | 設定可能な間隔で定期的に呼び出される |

```python
solver = qbpp.ABS3Solver(f)
solver.callback(lambda energy, tts, event: print(f"TTS = {tts:.3f}s Energy = {energy}"))
sol = solver.search({"time_limit": 10.0})
```

### サブクラスによる高度なコールバック
`timer()` や `hint()` にアクセスするには、`ABS3Solver` をサブクラス化して `callback()` メソッド（引数なし）をオーバーライドします。
`callback()` 内では以下が利用可能です:

- **`self.event`** — コールバックを発火したイベント（int: 0=Start, 1=BestUpdated, 2=Timer）
- **`self.best_sol`** — 現在の最良 `Sol` オブジェクト（energy, tts, get(var) が利用可能）
- **`self.timer(seconds)`** — 定期的な `Timer` コールバックの間隔を設定。`0` でタイマーを無効化。
- **`self.hint(sol)`** — ソルバーにヒント解を注入

```python
class MyCallback(qbpp.ABS3Solver):
    def callback(self):
        if self.event == 0:       # Start
            self.timer(1.0)       # 1秒ごとのタイマーを有効化
        if self.event == 1:       # BestUpdated
            sol = self.best_sol
            print(f"TTS = {sol.tts:.3f}s Energy = {sol.energy}")

solver = MyCallback(f)
sol = solver.search({"time_limit": 10.0})
```

## プロパティ
- **`is_gpu`**: ソルバーがGPUアクセラレーションを使用している場合に `True` を返します。

## プログラム例: CPUのみのモード
GPUなしでABS3 Solverを使用するには、第2引数に `0` を渡します:
```python
solver = qbpp.ABS3Solver(f, 0)
sol = solver.search({"time_limit": 5.0, "target_energy": 0})
print(sol)
```
