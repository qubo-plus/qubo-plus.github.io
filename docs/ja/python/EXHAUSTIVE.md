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
**Exhaustive Solver**はQUBO/HUBO式のための完全探索ソルバーです。
すべての可能な割り当てが検査されるため、解の最適性が保証されます。
探索はCPUスレッドを使用して並列化され、CUDA GPUが利用可能な場合は、探索をさらに高速化するためにGPUアクセラレーションが自動的に有効になります。

Exhaustive Solverを使って問題を解くには、以下の2つのステップで行います:
1. Exhaustive Solver（`qbpp.ExhaustiveSolver`）オブジェクトを作成します。
2. `search()` メソッドを呼び出します。パラメータはキーワード引数として渡すことができます。


## Exhaustive Solverオブジェクトの作成
Exhaustive Solverを使用するには、式を引数としてExhaustive Solverオブジェクト（`qbpp.ExhaustiveSolver`）を以下のように構築します:
- **`qbpp.ExhaustiveSolver(f)`**

ここで、`f` は解くべき式です。
事前に `simplify_as_binary()` メソッドを呼び出してバイナリ式として簡約化しておく必要があります。
コンストラクタは式をホストメモリにロードし、利用可能な GPU がある場合はデバイスメモリにも転送します。以降 `search()` を複数回呼び出してもこのロードは1度きりなので、同じ式に対して繰り返し探索する際のオーバーヘッドがありません。

## 探索パラメータの設定
探索パラメータは `search()` メソッドにキーワード引数として直接渡します。
以下のパラメータが利用可能です:

| パラメータ | 型 | 説明 | デフォルト |
|---|---|---|---|
| `target_energy` | int | 早期終了のためのターゲットエネルギー値を設定します。ソルバーがこの値以下のエネルギーを持つ解を見つけると、探索は直ちに終了します。 | (なし) |
| `verbose` | int (0 または 1) | `1` に設定すると、探索の進捗をパーセンテージで表示します。総実行時間の推定に役立ちます。 | `0` |
| `enable_default_callback` | int (0 または 1) | `1` に設定すると、新たに得られた最良解のエネルギーと TTS を表示するデフォルトコールバック関数を有効にします。 | `0` |
| `topk_sols` | int | 最小エネルギーの top-k 解を収集します。 | (無効) |
| `best_energy_sols` | int (0 または 1) | `1` に設定すると、すべての最適解（最小エネルギーの解）を収集します。 | (無効) |
| `all_sols` | int (0 または 1) | `1` に設定すると、すべての $2^n$ 個の解を収集します。メモリ使用量は変数数 `n` に対して指数的に増加するため、`n` が十分小さい場合にのみ使用してください。 | (無効) |

パラメータは `search()` にキーワード引数として渡します:
```
sol = solver.search(target_energy=0, enable_default_callback=1)
```

未知のパラメータキーを指定すると実行時エラーになります。

## 解の探索
Exhaustive Solver は **`search()`** メソッドを呼び出して解を探索します。パラメータはキーワード引数として渡せます。
このメソッドは見つかった最良解を返します。
CUDA GPU が利用可能な場合、CPU スレッドと並行して GPU を使用した探索の高速化が自動的に行われます。
返される解は `sol.energy`（エネルギー値）、`sol(x)`（変数値の取得）、`sol.info`（ソルバー情報の辞書）などを提供します。詳細は [QR_SOLUTION](QR_SOLUTION) を参照してください。

`topk_sols`、`best_energy_sols`、`all_sols` が設定されている場合、`search()` が返す解には収集された解も含まれます。
以下のプロパティと操作で取得できます:
- **`sol.sols`**: エネルギーの昇順にソートされた解のリスト。
- **`sol.sols`**: 格納されている解のリスト（エネルギーの昇順）。
- **`sol.sols[i]`**: `i` 番目の解を返します。
- **`len(sol.sols)`**: 格納されている解の個数。

## プログラム例
以下のプログラムは、Exhaustive Solverを使用して**Low Autocorrelation Binary Sequences (LABS)**問題の解を探索します:
```python
import pyqbpp as qbpp

size = 20
x = qbpp.var("x", shape=size)
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
このプログラムの出力は以下のとおりです:
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
すべての最適解は `best_energy_sols` を設定することで取得できます:
```python
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search(best_energy_sols=1)
for s in sol.sols:
    bits = "".join("-" if s(x[i]) == 0 else "+" for i in range(size))
    print(f"{s.energy}: {bits}")
```
出力は以下のとおりです:
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
最小エネルギーのtop-k解は `topk_sols` を設定することで取得できます:
```python
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search(topk_sols=10)
for s in sol.sols:
    bits = "".join("-" if s(x[i]) == 0 else "+" for i in range(size))
    print(f"{s.energy}: {bits}")
```
出力は以下のとおりです:
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
34: ++--++--+-++-+-+++++
34: +++---+-+-++++-++-++
```
{% endraw %}
さらに、非最適解を含むすべての解は `all_sols` を設定することで取得できます。
すべての $2^n$ 個の解をメモリに格納することに注意してください。ここで $n$ は変数の数です。
例えば、$n = 20$ の場合、100万個以上の解が格納され、メモリ使用量は $n$ に対して指数的に増加します。
$n$ が十分小さい場合にのみ使用してください。
```python
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search(all_sols=1)
for s in sol.sols:
    bits = "".join("-" if s(x[i]) == 0 else "+" for i in range(size))
    print(f"{s.energy}: {bits}")
```
以下に示すように、すべての $2^{20}$ 個の解がエネルギーの昇順で出力されます:
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
34: -----+-+--+-++--++--
34: ----+----++-++---+-+
34: ----+--+++--+-+++-+-
34: ---+++-+-+----+--+--
34: ---+++++-+++-++-+-++
34: --+--+----+-+-+++---
34: --+-+--+---+-----+++
34: --++--++-+--+-+-----
34: -+--+------+-+++---+
34: -+--+-+---+---+++++-
[omitted]
```
{% endraw %}
