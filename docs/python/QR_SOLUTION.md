---
layout: default
nav_exclude: true
title: "QR: Solutions"
nav_order: 32
alt_lang: "C++ version"
alt_lang_url: "QR_SOLUTION"
---

<div class="lang-en" markdown="1">
# Quick Reference: Solutions

The `Sol` class represents a solution to a QUBO problem.
It stores variable assignments along with the energy value and time-to-solution.

## Creating a Sol

| Expression | Description |
|------------|-------------|
| `Sol(expr)` | Create an all-zero solution for expression `expr` |

## Getting Variable Values

| Expression | Return Type | Description |
|------------|-------------|-------------|
| `sol(x)` | `int` | Evaluate `Var` `x` (returns 0 or 1) |
| `sol(t)` | `int` | Evaluate `Term` `t` |
| `sol(f)` | `int` | Evaluate `Expr` `f` |

For arrays, use element-wise access:
```python
for i in range(n):
    print(sol(x[i]))
```

## Setting Variable Values

| Expression | Description |
|------------|-------------|
| `sol.set(x, value)` | Set variable `x` to `value` (0 or 1) |
| `sol.set(other_sol)` | Copy all variable values from another `Sol` |
| `sol.set([(x, val), ...])` | Set variable values from a list of pairs |
| `sol.set([other_sol, [(x, val), ...]])` | Copy from `Sol`, then apply pair list |

```python
sol.set([(x[0], 1), (x[1], 0), (vi, 5)])
```

The `set` method returns `self`, allowing chaining:
```python
full_sol = Sol(f).set([sol, [(x[0], 1)]])
```

## Energy and Evaluation

| Expression | Return Type | Description |
|------------|-------------|-------------|
| `sol.energy` | `int` | Return the stored energy value |
| `sol.comp_energy()` | `int` | Recompute energy from current variable values and store it |
| `sol.tts` | `float` | Time-to-solution (seconds) |

`sol.energy` is a property that returns the energy value stored when the solver found the solution.
It does **not** recompute the energy.
After calling `sol.set()` to modify variable values, the stored energy becomes **invalid**.
Accessing `sol.energy` in this state raises an error.
Call `sol.comp_energy()` to recompute and update the energy before accessing it.

## Extracting Integers from Solutions

### `onehot_to_int()` — One-Hot Decoding

| Expression | Return Type | Description |
|------------|-------------|-------------|
| `qbpp.onehot_to_int(sol(x))` | `Array` | Decode one-hot along last axis (default) |
| `qbpp.onehot_to_int(sol(x), k)` | `Array` | Decode one-hot along axis $k$ |

Decodes along the specified axis and returns an array with one fewer dimension.
The output shape is the input shape with axis $k$ removed, and each element is the index of the 1 along that axis.
Negative indices are supported (e.g., `-1` = last axis).
Returns $-1$ for slices that are not valid one-hot vectors.

For more details and examples, see **[One-Hot to Integer Conversion](ONEHOT)**.

## Solver Info

The solver result classes (`EasySolverSol`, `ExhaustiveSolverSol`, `ABS3SolverSol`) inherit from `Sol`
and provide additional information via **`info`**.

| Expression | Return Type | Description |
|------------|-------------|-------------|
| `sol.info` | `dict` | Key-value pairs of solver information |
| `sol.sols()` | `list[Sol]` | All collected solutions |
| `sol.size()` | `int` | Number of collected solutions |
| `sol[i]` | `Sol` | Access the $i$-th solution |

The `info` dictionary contains solver metadata as string key-value pairs.
Representative keys include:

| Key | Description |
|-----|-------------|
| `"flip_count"` | Total number of variable flips performed |
| `"var_count"` | Number of variables in the model |
| `"term_count"` | Number of terms in the model |
| `"version"` | QUBO++ version |
| `"cpu_name"` | CPU model name |
| `"hostname"` | Machine hostname |

```python
for k, v in sol.info.items():
    print(f"{k} = {v}")
```

## Printing

```python
print(sol)
```

</div>

<div class="lang-ja" markdown="1">
# クイックリファレンス: 解

`Sol` クラスは QUBO 問題の解を表します。
変数の割り当てとエネルギー値、求解時間を格納します。

## Sol の作成

| 式 | 説明 |
|------------|-------------|
| `Sol(expr)` | 式 `expr` に対するすべてゼロの解を作成 |

## 変数値の取得

| 式 | 戻り値の型 | 説明 |
|------------|-------------|-------------|
| `sol(x)` | `int` | `Var` `x` を評価（0 または 1 を返す） |
| `sol(t)` | `int` | `Term` `t` を評価 |
| `sol(f)` | `int` | `Expr` `f` を評価 |

配列の場合は要素ごとにアクセスします:
```python
for i in range(n):
    print(sol(x[i]))
```

## 変数値の設定

| 式 | 説明 |
|------------|-------------|
| `sol.set(x, value)` | 変数 `x` を `value`（0 または 1）に設定 |
| `sol.set(other_sol)` | 別の `Sol` からすべての変数値をコピー |
| `sol.set([(x, val), ...])` | ペアのリストから変数値を設定 |
| `sol.set([other_sol, [(x, val), ...]])` | `Sol` からコピーし、ペアリストを適用 |

```python
sol.set([(x[0], 1), (x[1], 0), (vi, 5)])
```

`set` メソッドは `self` を返すため、チェーンが可能です:
```python
full_sol = Sol(f).set([sol, [(x[0], 1)]])
```

## エネルギーと評価

| 式 | 戻り値の型 | 説明 |
|------------|-------------|-------------|
| `sol.energy` | `int` | 格納されたエネルギー値を返す |
| `sol.comp_energy()` | `int` | 現在の変数値からエネルギーを再計算して格納 |
| `sol.tts` | `float` | 求解時間（秒） |

`sol.energy` はソルバーが解を見つけた時点で格納されたエネルギー値を返すプロパティです。
エネルギーの再計算は**行いません**。
`sol.set()` で変数値を変更した後は、格納されたエネルギーは**無効**になります。
この状態で `sol.energy` にアクセスするとエラーが発生します。
`sol.comp_energy()` を呼んでエネルギーを再計算・更新してからアクセスしてください。

## 解からの整数の抽出

### `onehot_to_int()` — ワンホットデコード

| 式 | 戻り値の型 | 説明 |
|------------|-------------|-------------|
| `qbpp.onehot_to_int(sol(x))` | `Array` | 最後の軸に沿ってワンホットをデコード（デフォルト） |
| `qbpp.onehot_to_int(sol(x), k)` | `Array` | 軸 $k$ に沿ってワンホットをデコード |

指定された軸に沿ってデコードし、次元が1つ少ない配列を返します。
出力形状は入力形状から軸 $k$ を除いたもので、各要素はその軸に沿った1のインデックスです。
負のインデックスもサポートされています（例: `-1` = 最後の軸）。
有効なワンホットベクトルでないスライスに対しては $-1$ を返します。

詳細と例については **[ワンホットから整数への変換](ONEHOT)** を参照してください。

## ソルバー情報

ソルバーの結果クラス（`EasySolverSol`、`ExhaustiveSolverSol`、`ABS3SolverSol`）は `Sol` を継承し、
**`info`** で追加情報を提供します。

| 式 | 戻り値の型 | 説明 |
|------------|-------------|-------------|
| `sol.info` | `dict` | ソルバー情報のキーバリューペア |
| `sol.sols()` | `list[Sol]` | 収集された全解 |
| `sol.size()` | `int` | 収集された解の数 |
| `sol[i]` | `Sol` | $i$ 番目の解にアクセス |

`info` 辞書はソルバーのメタデータを文字列のキーバリューペアとして格納しています。
代表的なキー:

| キー | 説明 |
|-----|-------------|
| `"flip_count"` | 実行された変数フリップの総数 |
| `"var_count"` | モデルの変数数 |
| `"term_count"` | モデルの項数 |
| `"version"` | QUBO++ のバージョン |
| `"cpu_name"` | CPU モデル名 |
| `"hostname"` | マシンのホスト名 |

```python
for k, v in sol.info.items():
    print(f"{k} = {v}")
```

## 出力

```python
print(sol)
```

</div>
