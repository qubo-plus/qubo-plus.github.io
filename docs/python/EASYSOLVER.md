---
layout: default
nav_exclude: true
title: "Easy Solver"
nav_order: 19
---
<div class="lang-en" markdown="1">
# Easy Solver Usage
The **Easy Solver** is a heuristic solver for QUBO/HUBO expressions.

Solving a problem with the Easy Solver consists of the following three steps:
1. Create an **`EasySolver`** object.
2. Set search parameters using convenience methods or **`set_param()`**.
3. Search for solutions by calling the **`search()`** method, which returns a **`Sol`** object.

## Creating Easy Solver object
To use the Easy Solver, an `EasySolver` object is constructed with an expression as follows:
- **`EasySolver(f)`**

Here, `f` is the expression to be solved.
It must be simplified as a binary expression in advance by calling `simplify_as_binary()`.

## Setting Search Parameters
Parameters can be set using convenience methods or the generic **`set_param(key, value)`** method:

| Method / Parameter | Description | Default |
|---|---|---|
| `time_limit(time)` / `"time_limit"` | Time limit in seconds. Set to 0 for no time limit. | 10.0 |
| `target_energy(energy)` / `"target_energy"` | Target energy. The solver terminates when a solution with energy ≤ this value is found. | (none) |
| `callback(func)` | Callback function called when a new best solution is found. Receives `energy` (int) and `tts` (float). | (none) |
| `set_param("topk_sols", n)` | Number of top-k solutions to keep. | (disabled) |
| `set_param("best_energy_sols", n)` | Keep solutions with the best energy. `"0"` for unlimited. | (disabled) |
| `set_param("enable_default_callback", "1")` | Print newly obtained best solutions. | (disabled) |

Unknown parameter keys will cause a runtime error.

## Searching Solutions
The Easy Solver searches for solutions by calling the **`search()`** method, which returns a **`Sol`** object.

### Multiple Solutions
When **`set_param("topk_sols", n)`** is set, the solver collects up to `n` solutions with the best energies encountered during the search.
These can be retrieved by calling **`sol.best_sols()`** on the returned `Sol`, which returns a list of `Sol` objects sorted in increasing order of energy.

```python
solver = qbpp.EasySolver(f)
solver.set_param("topk_sols", "5")
sol = solver.search()
for s in sol.best_sols():
    print(f"{s.energy()}: {s.bits}")
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
solver.set_param("time_limit", "5.0")
solver.set_param("target_energy", "900")
solver.callback(lambda energy, tts: print(f"TTS = {tts:.3f}s Energy = {energy}"))
sol = solver.search()
bits = "".join("-" if sol(i) == 0 else "+" for i in range(size))
print(f"{sol.energy()}: {bits}")
```
In this example, the following options are set:
- a 5.0-second time limit,
- a target energy of 900, and
- a callback that prints the energy and TTS whenever a new best solution is found.

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

Easy Solverで問題を解くには、以下の3つのステップで行います:
1. **`EasySolver`** オブジェクトを作成する。
2. 便利メソッドまたは **`set_param()`** で探索パラメータを設定する。
3. **`search()`** メソッドを呼び出して解を探索する。このメソッドは **`Sol`** オブジェクトを返す。

## Easy Solverオブジェクトの作成
Easy Solverを使用するには、以下のように式を引数として `EasySolver` オブジェクトを作成します:
- **`EasySolver(f)`**

ここで、`f` は解くべき式です。
事前に `simplify_as_binary()` を呼び出してバイナリ式として簡約化しておく必要があります。

## 探索パラメータの設定
パラメータは便利メソッドまたは汎用の **`set_param(key, value)`** メソッドで設定できます：

| メソッド / パラメータ | 説明 | デフォルト |
|---|---|---|
| `time_limit(time)` / `"time_limit"` | 制限時間（秒）。0で時間制限なし。 | 10.0 |
| `target_energy(energy)` / `"target_energy"` | 目標エネルギー。この値以下の解が見つかると探索を終了。 | （なし） |
| `callback(func)` | 新しい最良解が見つかったときに呼び出されるコールバック。`energy`（int）と `tts`（float）を受け取る。 | （なし） |
| `set_param("topk_sols", n)` | 保持するtop-k解の数。 | （無効） |
| `set_param("best_energy_sols", n)` | 最良エネルギーの解を保持。`"0"` で無制限。 | （無効） |
| `set_param("enable_default_callback", "1")` | 新たに得られた最良解を出力。 | （無効） |

未知のパラメータキーを設定するとランタイムエラーが発生します。

## 解の探索
Easy Solverは **`search()`** メソッドを呼び出すことで解を探索します。このメソッドは **`Sol`** オブジェクトを返します。

### 複数解の取得
**`set_param("topk_sols", n)`** を設定した場合、ソルバーは探索中に見つかったエネルギーが最良の解を最大 `n` 個収集します。
返された `Sol` に対して **`sol.best_sols()`** を呼び出すことで、エネルギーの昇順にソートされた `Sol` オブジェクトのリストを取得できます。

```python
solver = qbpp.EasySolver(f)
solver.set_param("topk_sols", "5")
sol = solver.search()
for s in sol.best_sols():
    print(f"{s.energy()}: {s.bits}")
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
solver.set_param("time_limit", "5.0")
solver.set_param("target_energy", "900")
solver.callback(lambda energy, tts: print(f"TTS = {tts:.3f}s Energy = {energy}"))
sol = solver.search()
bits = "".join("-" if sol(i) == 0 else "+" for i in range(size))
print(f"{sol.energy()}: {bits}")
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
