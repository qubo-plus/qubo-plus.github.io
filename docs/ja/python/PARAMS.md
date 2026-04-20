---
layout: default
nav_exclude: true
title: "Search Parameters"
nav_order: 19
lang: ja
hreflang_alt: "en/python/PARAMS"
hreflang_lang: "en"
---

# 探索パラメータ

PyQBPP の3つのソルバー — **EasySolver**、**ExhaustiveSolver**、**ABS3Solver** — は、`search()` を通じて探索パラメータを受け取ります。
パラメータは **キーワード引数** で渡します。
値は文字列・整数・浮動小数点数のいずれでも指定可能で、バックエンドに渡す前に自動的に文字列に変換されます。

## パラメータの指定

`search()` にキーワード引数を直接渡します:
```python
sol = solver.search(time_limit=10, target_energy=0)
```
値は文字列・整数・浮動小数点数を混在させることができます:
```python
sol = solver.search(time_limit=2.5, target_energy="0")
```

プログラムで動的にパラメータを構築する場合は、辞書を作成して `**` で展開します:
```python
params = {}
params["time_limit"] = 10
params["target_energy"] = 0
sol = solver.search(**params)
```

特別な `Params` オブジェクトは不要です — キーワード引数だけで十分です。
内部的には、PyQBPP が各値を文字列に変換し、キーと値のペアをソルバーに渡します。

## 共通パラメータ

以下のパラメータは3つのソルバーすべてで共通です:

| パラメータ | 型 | 説明 |
|---|---|---|
| `target_energy` | int | エネルギーがこの値以下の解が見つかったら探索を停止する。 |
| `enable_default_callback` | int (`0`/`1`) | 新たに見つかった最良解を標準エラー出力に表示する。デフォルト: `0`。 |
| `topk_sols` | int | 探索中にエネルギー上位N個の解を保持する。 |
| `best_energy_sols` | int (`0`/`1`) | 最良エネルギーのすべての解を保持する。`0` = 上限なし。 |

## EasySolver のパラメータ

| パラメータ | 型 | 説明 | デフォルト |
|---|---|---|---|
| `time_limit` | float | 制限時間（秒）。`0` で無制限。 | `10.0` |
| `target_energy` | int | 目標エネルギー。 | (なし) |
| `enable_default_callback` | int (`0`/`1`) | 進捗を表示。 | `0` |
| `topk_sols` | int | 保持するトップk解の数。 | (無効) |
| `best_energy_sols` | int | 保持する最良エネルギー解の数。 | (無効) |

例:
```python
solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=5, target_energy=0)
```

## ExhaustiveSolver のパラメータ

ExhaustiveSolver は完全探索を行うため、`time_limit` パラメータはありません。

| パラメータ | 型 | 説明 | デフォルト |
|---|---|---|---|
| `target_energy` | int | 目標エネルギー（早期終了用）。 | (なし) |
| `verbose` | int (`0`/`1`) | 探索進捗率を表示する。 | `0` |
| `enable_default_callback` | int (`0`/`1`) | 進捗を表示。 | `0` |
| `topk_sols` | int | 保持するトップk解の数。 | (無効) |
| `best_energy_sols` | int (`0`/`1`) | すべての最適解を保持。 | (無効) |
| `all_sols` | int (`0`/`1`) | すべての実行可能解を保持。 | (無効) |

例:
```python
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search(target_energy=0)
```

パラメータを組み合わせて複数の解を収集できます:
```python
sol = solver.search(best_energy_sols=0, target_energy=0)
for s in sol.sols:
    print(s.energy)
```

## ABS3Solver のパラメータ

| パラメータ | 型 | 説明 | デフォルト |
|---|---|---|---|
| `time_limit` | float | 制限時間（秒）。 | `10.0` |
| `target_energy` | int | 目標エネルギー。 | (なし) |
| `enable_default_callback` | int (`0`/`1`) | 進捗を表示。 | `0` |
| `topk_sols` | int | 保持するトップk解の数。 | (無効) |
| `best_energy_sols` | int (`0`/`1`) | すべての最適解を保持。 | (無効) |
| `cpu_enable` | int (`0`/`1`) | CPUソルバーの有効/無効。 | `1` |
| `cpu_thread_count` | int | CPUスレッド数。 | (自動) |
| `block_count` | int | GPUブロック数。 | (自動) |
| `thread_count` | int | GPUブロックあたりのスレッド数。 | (自動) |

例:
```python
solver = qbpp.ABS3Solver(f)
sol = solver.search(time_limit=10, target_energy=0)
```

## エラー処理
不明なパラメータキーを指定すると、実行時にエラーが発生します。
