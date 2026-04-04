---
layout: default
nav_exclude: true
title: "Search Parameters"
nav_order: 19
alt_lang: "C++ version"
alt_lang_url: "PARAMS"
---

<div class="lang-en" markdown="1">
# Search Parameters

All three solvers in PyQBPP — **EasySolver**, **ExhaustiveSolver**, and **ABS3Solver** — accept search parameters through `search()`.
Parameters are passed as a standard Python **dict**.
Values can be strings, integers, or floats — they are automatically converted to strings before being passed to the C++ backend.

## Passing Parameters

Pass a dict directly to `search()`:
```python
sol = solver.search({"time_limit": 10, "target_energy": 0})
```
Values can be mixed — strings, integers, and floats:
```python
sol = solver.search({"time_limit": 2.5, "target_energy": "0"})
```

When you need to build parameters programmatically, create a dict and add entries:
```python
params = {}
params["time_limit"] = 10
params["target_energy"] = 0
sol = solver.search(params)
```

No special `Params` object is needed — a standard Python dict is all that is required.
Internally, PyQBPP converts each value to a string and passes the key-value pairs to the C++ solver.

## Common Parameters

The following parameters are shared by all three solvers:

| Parameter | Type | Description |
|---|---|---|
| `"target_energy"` | int | Stop when a solution with energy ≤ this value is found. |
| `"enable_default_callback"` | int (`0`/`1`) | Print newly obtained best solutions to stderr. Default: `0`. |
| `"topk_sols"` | int | Keep up to N top-k solutions during the search. |
| `"best_energy_sols"` | int (`0`/`1`) | Keep all solutions with the best energy. `0` = unlimited count. |

## EasySolver Parameters

| Parameter | Type | Description | Default |
|---|---|---|---|
| `"time_limit"` | float | Time limit in seconds. `0` for no limit. | `10.0` |
| `"target_energy"` | int | Target energy. | (none) |
| `"enable_default_callback"` | int (`0`/`1`) | Print progress. | `0` |
| `"topk_sols"` | int | Top-k solutions to keep. | (disabled) |
| `"best_energy_sols"` | int | Best-energy solutions to keep. | (disabled) |

Example:
```python
solver = qbpp.EasySolver(f)
sol = solver.search({"time_limit": 5, "target_energy": 0})
```

## ExhaustiveSolver Parameters

The ExhaustiveSolver does not have a `"time_limit"` parameter because it performs a complete search.

| Parameter | Type | Description | Default |
|---|---|---|---|
| `"target_energy"` | int | Target energy (for early termination). | (none) |
| `"verbose"` | int (`0`/`1`) | Display search progress percentage. | `0` |
| `"enable_default_callback"` | int (`0`/`1`) | Print progress. | `0` |
| `"topk_sols"` | int | Top-k solutions to keep. | (disabled) |
| `"best_energy_sols"` | int (`0`/`1`) | Keep all optimal solutions. | (disabled) |
| `"all_sols"` | int (`0`/`1`) | Keep all feasible solutions. | (disabled) |

Example:
```python
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search({"target_energy": 0})
```

Multiple solutions can be collected by combining parameters:
```python
sol = solver.search({"best_energy_sols": 0, "target_energy": 0})
for s in sol.sols():
    print(s.energy)
```

## ABS3Solver Parameters

| Parameter | Type | Description | Default |
|---|---|---|---|
| `"time_limit"` | float | Time limit in seconds. | `10.0` |
| `"target_energy"` | int | Target energy. | (none) |
| `"enable_default_callback"` | int (`0`/`1`) | Print progress. | `0` |
| `"topk_sols"` | int | Top-k solutions to keep. | (disabled) |
| `"best_energy_sols"` | int (`0`/`1`) | Keep all optimal solutions. | (disabled) |
| `"cpu_enable"` | int (`0`/`1`) | Enable/disable CPU solver. | `1` |
| `"cpu_thread_count"` | int | Number of CPU threads. | (auto) |
| `"block_count"` | int | Number of GPU blocks. | (auto) |
| `"thread_count"` | int | Number of GPU threads per block. | (auto) |

Example:
```python
solver = qbpp.ABS3Solver(f)
sol = solver.search({"time_limit": 10, "target_energy": 0})
```

## Error Handling
Unknown parameter keys will cause a runtime error.

</div>

<div class="lang-ja" markdown="1">
# 探索パラメータ

PyQBPP の3つのソルバー — **EasySolver**、**ExhaustiveSolver**、**ABS3Solver** — は、`search()` を通じて探索パラメータを受け取ります。
パラメータは標準的なPythonの **dict** で渡します。
値は文字列・整数・浮動小数点数のいずれでも指定可能で、C++バックエンドに渡す前に自動的に文字列に変換されます。

## パラメータの指定

`search()` に辞書を直接渡します:
```python
sol = solver.search({"time_limit": 10, "target_energy": 0})
```
値は文字列・整数・浮動小数点数を混在させることができます:
```python
sol = solver.search({"time_limit": 2.5, "target_energy": "0"})
```

プログラムで動的にパラメータを構築する場合は、辞書を作成してエントリを追加します:
```python
params = {}
params["time_limit"] = 10
params["target_energy"] = 0
sol = solver.search(params)
```

特別な `Params` オブジェクトは不要です — 標準的なPythonの辞書だけで十分です。
内部的には、PyQBPP が各値を文字列に変換し、キーと値のペアをC++ソルバーに渡します。

## 共通パラメータ

以下のパラメータは3つのソルバーすべてで共通です:

| パラメータ | 型 | 説明 |
|---|---|---|
| `"target_energy"` | int | エネルギーがこの値以下の解が見つかったら探索を停止する。 |
| `"enable_default_callback"` | int (`0`/`1`) | 新たに見つかった最良解を標準エラー出力に表示する。デフォルト: `0`。 |
| `"topk_sols"` | int | 探索中にエネルギー上位N個の解を保持する。 |
| `"best_energy_sols"` | int (`0`/`1`) | 最良エネルギーのすべての解を保持する。`0` = 上限なし。 |

## EasySolver のパラメータ

| パラメータ | 型 | 説明 | デフォルト |
|---|---|---|---|
| `"time_limit"` | float | 制限時間（秒）。`0` で無制限。 | `10.0` |
| `"target_energy"` | int | 目標エネルギー。 | (なし) |
| `"enable_default_callback"` | int (`0`/`1`) | 進捗を表示。 | `0` |
| `"topk_sols"` | int | 保持するトップk解の数。 | (無効) |
| `"best_energy_sols"` | int | 保持する最良エネルギー解の数。 | (無効) |

例:
```python
solver = qbpp.EasySolver(f)
sol = solver.search({"time_limit": 5, "target_energy": 0})
```

## ExhaustiveSolver のパラメータ

ExhaustiveSolver は完全探索を行うため、`"time_limit"` パラメータはありません。

| パラメータ | 型 | 説明 | デフォルト |
|---|---|---|---|
| `"target_energy"` | int | 目標エネルギー（早期終了用）。 | (なし) |
| `"verbose"` | int (`0`/`1`) | 探索進捗率を表示する。 | `0` |
| `"enable_default_callback"` | int (`0`/`1`) | 進捗を表示。 | `0` |
| `"topk_sols"` | int | 保持するトップk解の数。 | (無効) |
| `"best_energy_sols"` | int (`0`/`1`) | すべての最適解を保持。 | (無効) |
| `"all_sols"` | int (`0`/`1`) | すべての実行可能解を保持。 | (無効) |

例:
```python
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search({"target_energy": 0})
```

パラメータを組み合わせて複数の解を収集できます:
```python
sol = solver.search({"best_energy_sols": 0, "target_energy": 0})
for s in sol.sols():
    print(s.energy)
```

## ABS3Solver のパラメータ

| パラメータ | 型 | 説明 | デフォルト |
|---|---|---|---|
| `"time_limit"` | float | 制限時間（秒）。 | `10.0` |
| `"target_energy"` | int | 目標エネルギー。 | (なし) |
| `"enable_default_callback"` | int (`0`/`1`) | 進捗を表示。 | `0` |
| `"topk_sols"` | int | 保持するトップk解の数。 | (無効) |
| `"best_energy_sols"` | int (`0`/`1`) | すべての最適解を保持。 | (無効) |
| `"cpu_enable"` | int (`0`/`1`) | CPUソルバーの有効/無効。 | `1` |
| `"cpu_thread_count"` | int | CPUスレッド数。 | (自動) |
| `"block_count"` | int | GPUブロック数。 | (自動) |
| `"thread_count"` | int | GPUブロックあたりのスレッド数。 | (自動) |

例:
```python
solver = qbpp.ABS3Solver(f)
sol = solver.search({"time_limit": 10, "target_energy": 0})
```

## エラー処理
不明なパラメータキーを指定すると、実行時にエラーが発生します。

</div>
