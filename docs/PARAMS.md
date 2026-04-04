---
layout: default
nav_exclude: true
title: "Search Parameters"
nav_order: 18
alt_lang: "Python version"
alt_lang_url: "python/PARAMS"
---

<div class="lang-en" markdown="1">
# Search Parameters

All three solvers in QUBO++ — **Easy Solver**, **Exhaustive Solver**, and **ABS3 Solver** — accept search parameters through `search()`.
Parameters are key-value pairs.
Values can be strings, integers, or floating-point numbers — numeric values are automatically converted to strings internally.

## Passing Parameters

Pass an initializer list directly to `search()`:
{% raw %}
```cpp
auto sol = solver.search({{"time_limit", 10}, {"target_energy", 0}});
```
{% endraw %}
Values can be mixed — strings, integers, and floating-point numbers:
{% raw %}
```cpp
auto sol = solver.search({{"time_limit", 2.5}, {"target_energy", "0"}});
```
{% endraw %}

When you need to build parameters programmatically, create a `qbpp::Params` object and use `operator()`:
```cpp
qbpp::Params params;
params("time_limit", 10);
params("target_energy", 0);
auto sol = solver.search(params);
```

## Common Parameters

The following parameters are shared by all three solvers:

| Parameter | Type | Description |
|---|---|---|
| `target_energy` | integer | Stop when a solution with energy ≤ this value is found. |
| `enable_default_callback` | `0`/`1` | Print newly obtained best solutions to stderr. Default: `0`. |
| `topk_sols` | integer | Keep up to N top-k solutions during the search. |
| `best_energy_sols` | `0`/`1` | Keep all solutions with the best energy. `0` = unlimited count. |

## Easy Solver Parameters

| Parameter | Type | Description | Default |
|---|---|---|---|
| `time_limit` | float | Time limit in seconds. `0` for no limit. | `10.0` |
| `target_energy` | integer | Target energy. | (none) |
| `enable_default_callback` | `0`/`1` | Print progress. | `0` |
| `topk_sols` | integer | Top-k solutions to keep. | (disabled) |
| `best_energy_sols` | `0`/integer | Best-energy solutions to keep. | (disabled) |

Example:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

auto solver = qbpp::easy_solver::EasySolver(f);
auto sol = solver.search({{"time_limit", 5}, {"target_energy", 0}});
```
{% endraw %}

## Exhaustive Solver Parameters

The Exhaustive Solver does not have a `time_limit` parameter because it performs a complete search.

| Parameter | Type | Description | Default |
|---|---|---|---|
| `target_energy` | integer | Target energy (for early termination). | (none) |
| `verbose` | `0`/`1` | Display search progress percentage. | `0` |
| `enable_default_callback` | `0`/`1` | Print progress. | `0` |
| `topk_sols` | integer | Top-k solutions to keep. | (disabled) |
| `best_energy_sols` | `0`/`1` | Keep all optimal solutions. | (disabled) |
| `all_sols` | `0`/`1` | Keep all feasible solutions. | (disabled) |

Example:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

auto solver = qbpp::exhaustive_solver::ExhaustiveSolver(f);
auto sol = solver.search({{"target_energy", 0}});
```
{% endraw %}

## ABS3 Solver Parameters

| Parameter | Type | Description | Default |
|---|---|---|---|
| `time_limit` | float | Time limit in seconds. | `10.0` |
| `target_energy` | integer | Target energy. | (none) |
| `enable_default_callback` | `0`/`1` | Print progress. | `0` |
| `topk_sols` | integer | Top-k solutions to keep. | (disabled) |
| `best_energy_sols` | `0`/`1` | Keep all optimal solutions. | (disabled) |
| `cpu_enable` | `0`/`1` | Enable/disable CPU solver. | `1` |
| `cpu_thread_count` | integer | Number of CPU threads. | (auto) |
| `block_count` | integer | Number of GPU blocks. | (auto) |
| `thread_count` | integer | Number of GPU threads per block. | (auto) |

Example:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/abs3_solver.hpp>

auto solver = qbpp::abs3::ABS3Solver(f);
auto sol = solver.search({{"time_limit", 10}, {"target_energy", 0}});
```
{% endraw %}

## Error Handling
Unknown parameter keys will cause a `std::runtime_error` at runtime.

</div>

<div class="lang-ja" markdown="1">
# 探索パラメータ

QUBO++ の3つのソルバー — **Easy Solver**、**Exhaustive Solver**、**ABS3 Solver** — は、`search()` を通じて探索パラメータを受け取ります。
パラメータはキーと値のペアです。
値は文字列・整数・浮動小数点数のいずれでも指定可能で、数値は内部的に自動で文字列に変換されます。

## パラメータの指定

`search()` に初期化子リストを直接渡します:
{% raw %}
```cpp
auto sol = solver.search({{"time_limit", 10}, {"target_energy", 0}});
```
{% endraw %}
値は文字列・整数・浮動小数点数を混在させることができます:
{% raw %}
```cpp
auto sol = solver.search({{"time_limit", 2.5}, {"target_energy", "0"}});
```
{% endraw %}

プログラムで動的にパラメータを構築する場合は、`qbpp::Params` オブジェクトを作成し `operator()` で設定します:
```cpp
qbpp::Params params;
params("time_limit", 10);
params("target_energy", 0);
auto sol = solver.search(params);
```

## 共通パラメータ

以下のパラメータは3つのソルバーすべてで共通です:

| パラメータ | 型 | 説明 |
|---|---|---|
| `target_energy` | 整数 | エネルギーがこの値以下の解が見つかったら探索を停止する。 |
| `enable_default_callback` | `0`/`1` | 新たに見つかった最良解を標準エラー出力に表示する。デフォルト: `0`。 |
| `topk_sols` | 整数 | 探索中にエネルギー上位N個の解を保持する。 |
| `best_energy_sols` | `0`/`1` | 最良エネルギーのすべての解を保持する。`0` = 上限なし。 |

## Easy Solver のパラメータ

| パラメータ | 型 | 説明 | デフォルト |
|---|---|---|---|
| `time_limit` | 浮動小数点数 | 制限時間（秒）。`0` で無制限。 | `10.0` |
| `target_energy` | 整数 | 目標エネルギー。 | (なし) |
| `enable_default_callback` | `0`/`1` | 進捗を表示。 | `0` |
| `topk_sols` | 整数 | 保持するトップk解の数。 | (無効) |
| `best_energy_sols` | `0`/整数 | 保持する最良エネルギー解の数。 | (無効) |

例:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

auto solver = qbpp::easy_solver::EasySolver(f);
auto sol = solver.search({{"time_limit", 5}, {"target_energy", 0}});
```
{% endraw %}

## Exhaustive Solver のパラメータ

Exhaustive Solver は完全探索を行うため、`time_limit` パラメータはありません。

| パラメータ | 型 | 説明 | デフォルト |
|---|---|---|---|
| `target_energy` | 整数 | 目標エネルギー（早期終了用）。 | (なし) |
| `verbose` | `0`/`1` | 探索進捗率を表示する。 | `0` |
| `enable_default_callback` | `0`/`1` | 進捗を表示。 | `0` |
| `topk_sols` | 整数 | 保持するトップk解の数。 | (無効) |
| `best_energy_sols` | `0`/`1` | すべての最適解を保持。 | (無効) |
| `all_sols` | `0`/`1` | すべての実行可能解を保持。 | (無効) |

例:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

auto solver = qbpp::exhaustive_solver::ExhaustiveSolver(f);
auto sol = solver.search({{"target_energy", 0}});
```
{% endraw %}

## ABS3 Solver のパラメータ

| パラメータ | 型 | 説明 | デフォルト |
|---|---|---|---|
| `time_limit` | 浮動小数点数 | 制限時間（秒）。 | `10.0` |
| `target_energy` | 整数 | 目標エネルギー。 | (なし) |
| `enable_default_callback` | `0`/`1` | 進捗を表示。 | `0` |
| `topk_sols` | 整数 | 保持するトップk解の数。 | (無効) |
| `best_energy_sols` | `0`/`1` | すべての最適解を保持。 | (無効) |
| `cpu_enable` | `0`/`1` | CPUソルバーの有効/無効。 | `1` |
| `cpu_thread_count` | 整数 | CPUスレッド数。 | (自動) |
| `block_count` | 整数 | GPUブロック数。 | (自動) |
| `thread_count` | 整数 | GPUブロックあたりのスレッド数。 | (自動) |

例:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/abs3_solver.hpp>

auto solver = qbpp::abs3::ABS3Solver(f);
auto sol = solver.search({{"time_limit", 10}, {"target_energy", 0}});
```
{% endraw %}

## エラー処理
不明なパラメータキーを指定すると、実行時に `std::runtime_error` が発生します。

</div>
