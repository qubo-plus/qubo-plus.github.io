---
layout: default
nav_exclude: true
title: "Easy Solver"
nav_order: 19
alt_lang: "C++ version"
alt_lang_url: "EASYSOLVER"
---

<div class="lang-en" markdown="1">
# Easy Solver Usage
The **Easy Solver** is a heuristic solver for QUBO/HUBO expressions.

Solving a problem with the Easy Solver consists of the following two steps:
1. Create an **`EasySolver`** object.
2. Call the **`search()`** method with a parameter dict, which returns a **`Sol`** object.

## Creating Easy Solver object
To use the Easy Solver, an `EasySolver` object is constructed with an expression as follows:
- **`EasySolver(f)`**

Here, `f` is the expression to be solved.
It must be simplified as a binary expression in advance by calling `simplify_as_binary()`.

## Search Parameters
Parameters are passed as a dict to the **`search()`** method.

| Parameter | Description | Default |
|---|---|---|
| `"time_limit"` | Time limit in seconds (float). Set to 0 for no time limit. | 10.0 |
| `"target_energy"` | Target energy (int). The solver terminates when a solution with energy ≤ this value is found. | (none) |
| `"topk_sols"` | Number of top-k solutions to keep (int). | (disabled) |
| `"best_energy_sols"` | Keep solutions with the best energy (int). `0` for unlimited. | (disabled) |
| `"enable_default_callback"` | Print newly obtained best solutions (int, `1` to enable). | (disabled) |

Unknown parameter keys will cause a runtime error.

## Searching Solutions
The Easy Solver searches for solutions by calling **`search(params)`**, where `params` is a dict of search parameters. It returns a **`Sol`** object.

### Multiple Solutions
When `"topk_sols"` is set in the parameter dict, the solver collects up to `n` solutions with the best energies encountered during the search.
These can be retrieved by calling **`sol.sols()`** on the returned `Sol`, which returns a list of `Sol` objects sorted in increasing order of energy.

```python
solver = qbpp.EasySolver(f)
sol = solver.search({"topk_sols": 5})
for s in sol.sols():
    print(f"energy = {s.energy}")
```

## Program Example
The following program searches for a solution to the
**Low Autocorrelation Binary Sequences (LABS)** problem using the Easy Solver:
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

solver = qbpp.EasySolver(f)
sol = solver.search({"time_limit": 5.0, "target_energy": 900, "enable_default_callback": 1})
bits = "".join("-" if sol(x[i]) == 0 else "+" for i in range(size))
print(f"{sol.energy}: {bits}")
```
In this example, the following options are set:
- a 5.0-second time limit,
- a target energy of 900, and
- a default callback that prints the energy and TTS whenever a new best solution is found.

Therefore, the solver terminates either when the elapsed time reaches 5.0 seconds
or when a solution with energy 900 or less is found.

For example, this program produces the following output:
{% raw %}
```
TTS = 0.000s Energy = 300162
TTS = 0.000s Energy = 273350
...
TTS = 2.691s Energy = 898
898: ++-++-----+--+--++++++---++-+-+--++-------++-++-+-+-+-+-++-++++-++-+++++-+-+--++++++---+++--+++---++
```
{% endraw %}
</div>

<div class="lang-ja" markdown="1">
# Easy Solverの使い方
**Easy Solver**は、QUBO/HUBO式に対するヒューリスティックソルバーです。

Easy Solverで問題を解くには、以下の2つのステップで行います:
1. **`EasySolver`** オブジェクトを作成する。
2. パラメータ辞書を渡して **`search()`** メソッドを呼び出し、解を探索する。このメソッドは **`Sol`** オブジェクトを返す。

## Easy Solverオブジェクトの作成
Easy Solverを使用するには、以下のように式を引数として `EasySolver` オブジェクトを作成します:
- **`EasySolver(f)`**

ここで、`f` は解くべき式です。
事前に `simplify_as_binary()` を呼び出してバイナリ式として簡約化しておく必要があります。

## 探索パラメータ
パラメータは **`search()`** メソッドに辞書として渡します。**`callback()`** メソッドのみ、`search()` の前にソルバーオブジェクトに対して別途呼び出します。

| パラメータ | 説明 | デフォルト |
|---|---|---|
| `"time_limit"` | 制限時間（秒、float）。0で時間制限なし。 | 10.0 |
| `"target_energy"` | 目標エネルギー（int）。この値以下の解が見つかると探索を終了。 | （なし） |
| `"topk_sols"` | 保持するtop-k解の数（int）。 | （無効） |
| `"best_energy_sols"` | 最良エネルギーの解を保持（int）。`0` で無制限。 | （無効） |
| `"enable_default_callback"` | 新たに得られた最良解を出力（int、`1` で有効）。 | （無効） |

**`callback(func)`** メソッドは、新しい最良解が見つかったときに呼び出されるコールバック関数を設定します。`energy`（int）と `tts`（float）を受け取ります。

未知のパラメータキーを設定するとランタイムエラーが発生します。

## 解の探索
Easy Solverは **`search(params)`** を呼び出すことで解を探索します。`params` は探索パラメータの辞書です。このメソッドは **`Sol`** オブジェクトを返します。

### 複数解の取得
パラメータ辞書に `"topk_sols"` を設定した場合、ソルバーは探索中に見つかったエネルギーが最良の解を最大 `n` 個収集します。
返された `Sol` に対して **`sol.sols()`** を呼び出すことで、エネルギーの昇順にソートされた `Sol` オブジェクトのリストを取得できます。

```python
solver = qbpp.EasySolver(f)
sol = solver.search({"topk_sols": 5})
for s in sol.sols():
    print(f"energy = {s.energy}")
```

## プログラム例
以下のプログラムは、Easy Solverを使用して
**Low Autocorrelation Binary Sequences (LABS)** 問題の解を探索します:
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

solver = qbpp.EasySolver(f)
sol = solver.search({"time_limit": 5.0, "target_energy": 900, "enable_default_callback": 1})
bits = "".join("-" if sol(x[i]) == 0 else "+" for i in range(size))
print(f"{sol.energy}: {bits}")
```
この例では、以下のオプションが設定されています:
- 制限時間5.0秒、
- 目標エネルギー900、
- 新しい最良解が見つかるたびにエネルギーとTTSを表示するコールバック。

したがって、ソルバーは経過時間が5.0秒に達するか、
エネルギーが900以下の解が見つかると終了します。

例えば、このプログラムは以下のような出力を生成します:
{% raw %}
```
TTS = 0.000s Energy = 300162
TTS = 0.000s Energy = 273350
...
TTS = 2.691s Energy = 898
898: ++-++-----+--+--++++++---++-+-+--++-------++-++-+-+-+-+-++-++++-++-+++++-+-+--++++++---+++--+++---++
```
{% endraw %}
</div>
