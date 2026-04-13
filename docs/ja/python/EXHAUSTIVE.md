---
layout: default
nav_exclude: true
title: "Exhaustive Solver"
nav_order: 20
lang: ja
hreflang_alt: "en/python/EXHAUSTIVE"
hreflang_lang: "en"
---

# Exhaustive Solverの使い方
**Exhaustive Solver**は、QUBO/HUBO式に対する完全探索ソルバーです。
すべての可能な割り当てを調べるため、解の最適性が保証されます。
探索はCPUスレッドを使用して並列化され、CUDA GPUが利用可能な場合はGPUアクセラレーションが自動的に有効になり、探索がさらに高速化されます。

Exhaustive Solverで問題を解くには、以下の3つのステップで行います:
1. **`ExhaustiveSolver`** オブジェクトを作成する。
2. ソルバーオブジェクトのメソッドを呼び出して探索オプションを設定する。
3. 探索メソッドのいずれかを呼び出して解を探索する。


## Exhaustive Solverオブジェクトの作成
Exhaustive Solverを使用するには、以下のように式（`Expr`）オブジェクトを引数として **`ExhaustiveSolver`** オブジェクトを作成します:
- **`ExhaustiveSolver(f)`**:
ここで、`f` は解くべき式です。
事前に `simplify_as_binary()` メソッドを呼び出してバイナリ式として簡約化しておく必要があります。

## Exhaustive Solverオプションの設定
- **`verbose()`**:
探索の進捗をパーセンテージで表示します。総実行時間の見積もりに役立ちます。
- **`callback(func)`**:
新しい最良解が見つかったときに呼び出されるコールバック関数を設定します。
コールバックは2つの引数を受け取ります: `energy`（int）と `tts`（float、解発見までの時間（秒））。
- **`target_energy(energy)`**:
早期終了のための目標エネルギー値を設定します。
ソルバーが目標以下のエネルギーを持つ解を見つけると、探索は直ちに終了します。

## 解の探索
Exhaustive Solverは、**`search()`** メソッドにキーワード引数を渡すことで解を探索します。
複数の解を収集するには、適切なパラメータを設定します:
- **`best_energy_sols=0`**: すべての最適解（最小エネルギー）を収集。`sol.sols` で取得。
- **`topk_sols=k`**: エネルギーが最も低い top-k 解を収集。
- **`{"all_sols": 1}`**: すべての $2^n$ 個の解を収集（メモリ注意）。

# プログラム例
以下のプログラムは、Exhaustive Solverを使用して
**Low Autocorrelation Binary Sequences (LABS)** 問題の解を探索します:
```python
import pyqbpp as qbpp

size = 20
x = qbpp.var("x", size)
f = qbpp.expr()
for d in range(1, size):
    temp = qbpp.expr()
    for i in range(size - d):
        temp += (2 * x[i] - 1) * (2 * x[i + d] - 1)
    f += qbpp.sqr(temp)
f.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(f)
sol = solver.search(enable_default_callback=1)
bits = "".join("-" if sol(x[i]) == 0 else "+" for i in range(size))
print(f"{sol.energy}: {bits}")
```
このプログラムの出力は以下の通りです:
{% raw %}
```
TTS = 0.002s Energy = 1786
TTS = 0.003s Energy = 314
TTS = 0.003s Energy = 206
TTS = 0.003s Energy = 154
TTS = 0.003s Energy = 102
TTS = 0.003s Energy = 94
TTS = 0.003s Energy = 74
TTS = 0.003s Energy = 66
TTS = 0.003s Energy = 50
TTS = 0.006s Energy = 46
TTS = 0.011s Energy = 34
TTS = 0.014s Energy = 26
26: -++---++-+---+-+++++
```
{% endraw %}
すべての最適解は、`best_energy_sols` を `search()` に渡すことで取得できます:
```python
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search(best_energy_sols=0)
for s in sol.sols:
    bits = "".join("-" if s(x[i]) == 0 else "+" for i in range(size))
    print(f"{s.energy}: {bits}")
```
出力は以下の通りです:
{% raw %}
```
26: -----+-+++-+--+++--+
26: --++-++----+----+-+-
26: -+-+----+----++-++--
26: -++---++-+---+-+++++
26: +--+++--+-+++-+-----
26: +-+-++++-++++--+--++
26: ++--+--++++-++++-+-+
26: +++++-+---+-++---++-
```
{% endraw %}
エネルギーが最も低い top-k 解は、`topk_sols` を渡すことで取得できます:
```python
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search(topk_sols=10)
for s in sol.sols:
    bits = "".join("-" if s(x[i]) == 0 else "+" for i in range(size))
    print(f"{s.energy}: {bits}")
```
出力は以下の通りです:
{% raw %}
```
26: -----+-+++-+--+++--+
26: --++-++----+----+-+-
26: -+-+----+----++-++--
26: -++---++-+---+-+++++
26: +--+++--+-+++-+-----
26: +-+-++++-++++--+--++
26: ++--+--++++-++++-+-+
26: +++++-+---+-++---++-
34: ----+----++-++---+-+
34: +-++-+-+++-+++-----+
```
{% endraw %}
さらに、最適でない解を含むすべての解は、`all_sols` を渡すことで取得できます。
すべての $2^n$ 個の解がメモリに格納されることに注意してください（$n$ は変数の数）。
例えば、$n = 20$ の場合、100万以上の解が格納され、メモリ使用量は $n$ に対して指数的に増加します。
$n$ が十分に小さい場合のみ使用してください。
```python
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search(all_sols=1)
for s in sol.sols:
    bits = "".join("-" if s(x[i]) == 0 else "+" for i in range(size))
    print(f"{s.energy}: {bits}")
```
これにより、すべての $2^{20}$ 個の解がエネルギーの昇順に表示されます。
