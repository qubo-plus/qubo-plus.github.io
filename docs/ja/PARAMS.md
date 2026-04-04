---
layout: default
nav_exclude: true
title: "Search Parameters"
nav_order: 18
lang: ja
hreflang_alt: "en/PARAMS"
hreflang_lang: "en"
---

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
