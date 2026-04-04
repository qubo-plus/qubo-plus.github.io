---
layout: default
nav_exclude: true
title: "QR: Solutions"
nav_order: 32
alt_lang: "Python version"
alt_lang_url: "python/QR_SOLUTION"
---

<div class="lang-en" markdown="1">
# Quick Reference: Solutions

The `qbpp::Sol` class represents a solution to a QUBO problem.
It stores variable assignments (as a packed bit array) along with the energy value and time-to-solution.

## Creating a Sol

| Expression | Description |
|------------|-------------|
| `Sol(expr)` | Create an all-zero solution for expression `expr` |

## Evaluating Variables, Terms, and Expressions

Given a solution `sol`, variable values and expression results can be obtained using two equivalent calling conventions:

| Expression | Equivalent | Return Type | Description |
|------------|------------|-------------|-------------|
| `sol(x)` | `x(sol)` | `energy_t` | Evaluate `Var` `x` (returns 0 or 1) |
| `sol(t)` | `t(sol)` | `energy_t` | Evaluate `Term` `t` |
| `sol(f)` | `f(sol)` | `energy_t` | Evaluate `Expr` `f` |
| `sol(arr)` | `arr(sol)` | `Array<coeff_t>` | Evaluate array of variables/expressions |

Both `sol(x)` and `x(sol)` produce the same result.
The `x(sol)` form is convenient for use in array contexts: for a `Var` array `x` of size $n \times m$,
`x(sol)` returns an `Array<coeff_t>` of size $n \times m$ containing the assigned values (0 or 1).

## Setting Variable Values

| Expression | Description |
|------------|-------------|
| `sol.set(x, value)` | Set variable `x` to `value` (0 or 1) |
| `sol.set(other)` | Copy all variable values from another `Sol` |
| `sol.set(ml)` | Set variable values from a `MapList` |
{% raw %}| `sol.set(other, ml)` | Copy from `other`, then apply `MapList` `ml` |{% endraw %}

A `MapList` is a list of `(Var, value)` or `(VarInt, value)` pairs:
{% raw %}
```cpp
qbpp::MapList ml = {{x[0], 1}, {x[1], 0}, {vi, 5}};
sol.set(ml);
```
{% endraw %}

The `set` methods return `Sol&`, allowing chaining:
```cpp
auto full_sol = qbpp::Sol(f).set(sol).set(ml);
```

## Energy and Evaluation

| Expression | Return Type | Description |
|------------|-------------|-------------|
| `sol.energy()` | `energy_t` | Return the stored energy value |
| `sol.comp_energy()` | `energy_t` | Recompute energy from current variable values and store it |
| `sol.tts()` | `double` | Time-to-solution (seconds) |

`sol.energy()` returns the energy value that was stored when the solver found the solution.
It does **not** recompute the energy.
After calling `sol.set()` to modify variable values, the stored energy becomes **invalid**.
Calling `sol.energy()` in this state throws an error.
Call `sol.comp_energy()` to recompute and update the energy before accessing it.

## Extracting Integers from Solutions

### `onehot_to_int()` — One-Hot Decoding

| Expression | Return Type | Description |
|------------|-------------|-------------|
| `onehot_to_int(sol(x))` | `Array<coeff_t>` | Decode one-hot along last axis (default) |
| `onehot_to_int(sol(x), k)` | `Array<coeff_t>` | Decode one-hot along axis $k$ |

Decodes along the specified axis and returns an array with one fewer dimension.
The output shape is the input shape with axis $k$ removed, and each element is the index of the 1 along that axis.
Negative indices are supported (e.g., `-1` = last axis).
Returns $-1$ for slices that are not valid one-hot vectors (i.e., do not contain exactly one 1).

For more details and examples, see **[Extracting Integers](ONEHOT)**.

## Solver Info

The solver result classes (`EasySolverSol`, `ExhaustiveSolverSol`, `ABS3SolverSol`) inherit from `Sol`
and provide additional information via **`info()`**.

| Expression | Return Type | Description |
|------------|-------------|-------------|
| `sol.info()` | `const KeyValueVector&` | Key-value pairs of solver information |
| `sol.sols()` | `const std::vector<Sol>&` | All collected solutions |
| `sol.size()` | `size_t` | Number of collected solutions |
| `sol[i]` | `const Sol&` | Access the $i$-th solution |

The `info()` object contains solver metadata as string key-value pairs.
Representative keys include:

| Key | Description |
|-----|-------------|
| `"flip_count"` | Total number of variable flips performed |
| `"var_count"` | Number of variables in the model |
| `"term_count"` | Number of terms in the model |
| `"version"` | QUBO++ version |
| `"cpu_name"` | CPU model name |
| `"hostname"` | Machine hostname |

You can iterate over all entries or access by key:
```cpp
for (const auto& kv : sol.info()) {
  std::cout << kv.key << " = " << kv.value << std::endl;
}
```

## Printing

`Sol` objects can be printed with `std::cout`:
```cpp
std::cout << sol << std::endl;
```
This outputs a human-readable representation of the solution including variable assignments.

</div>

<div class="lang-ja" markdown="1">
# クイックリファレンス: 解

`qbpp::Sol` クラスは QUBO 問題の解を表します。
変数の割り当て（パックされたビット配列）とエネルギー値、求解時間を格納します。

## Sol の作成

| 式 | 説明 |
|------------|-------------|
| `Sol(expr)` | 式 `expr` に対するすべてゼロの解を作成 |

## 変数・項・式の評価

解 `sol` が与えられたとき、変数値や式の結果は2つの等価な呼び出し方法で取得できます:

| 式 | 等価 | 戻り値の型 | 説明 |
|------------|------------|-------------|-------------|
| `sol(x)` | `x(sol)` | `energy_t` | `Var` `x` を評価（0 または 1 を返す） |
| `sol(t)` | `t(sol)` | `energy_t` | `Term` `t` を評価 |
| `sol(f)` | `f(sol)` | `energy_t` | `Expr` `f` を評価 |
| `sol(arr)` | `arr(sol)` | `Array<coeff_t>` | 変数/式の配列を評価 |

`sol(x)` と `x(sol)` は同じ結果を返します。
`x(sol)` 形式は配列で使いやすく、サイズ $n \times m$ の `Var` 配列 `x` の場合、
`x(sol)` はサイズ $n \times m$ の割り当て値（0 または 1）を含む `Array<coeff_t>` を返します。

## 変数値の設定

| 式 | 説明 |
|------------|-------------|
| `sol.set(x, value)` | 変数 `x` を `value`（0 または 1）に設定 |
| `sol.set(other)` | 別の `Sol` からすべての変数値をコピー |
| `sol.set(ml)` | `MapList` から変数値を設定 |
{% raw %}| `sol.set(other, ml)` | `other` からコピーし、`MapList` `ml` を適用 |{% endraw %}

`MapList` は `(Var, 値)` または `(VarInt, 値)` のペアのリストです:
{% raw %}
```cpp
qbpp::MapList ml = {{x[0], 1}, {x[1], 0}, {vi, 5}};
sol.set(ml);
```
{% endraw %}

`set` メソッドは `Sol&` を返すため、チェーンが可能です:
```cpp
auto full_sol = qbpp::Sol(f).set(sol).set(ml);
```

## エネルギーと評価

| 式 | 戻り値の型 | 説明 |
|------------|-------------|-------------|
| `sol.energy()` | `energy_t` | 格納されたエネルギー値を返す |
| `sol.comp_energy()` | `energy_t` | 現在の変数値からエネルギーを再計算して格納 |
| `sol.tts()` | `double` | 求解時間（秒） |

`sol.energy()` はソルバーが解を見つけた時点で格納されたエネルギー値を返します。
エネルギーの再計算は**行いません**。
`sol.set()` で変数値を変更した後は、格納されたエネルギーは**無効**になります。
この状態で `sol.energy()` を呼び出すとエラーが発生します。
`sol.comp_energy()` を呼んでエネルギーを再計算・更新してからアクセスしてください。

## 解からの整数の抽出

### `onehot_to_int()` — ワンホットデコード

| 式 | 戻り値の型 | 説明 |
|------------|-------------|-------------|
| `onehot_to_int(sol(x))` | `Array<coeff_t>` | 最後の軸に沿ってワンホットをデコード（デフォルト） |
| `onehot_to_int(sol(x), k)` | `Array<coeff_t>` | 軸 $k$ に沿ってワンホットをデコード |

指定された軸に沿ってデコードし、次元が1つ少ない配列を返します。
出力形状は入力形状から軸 $k$ を除いたもので、各要素はその軸に沿った1のインデックスです。
負のインデックスもサポートされています（例: `-1` = 最後の軸）。
有効なワンホットベクトルでないスライス（ちょうど1つの1を含まない）に対しては $-1$ を返します。

詳細と例については **[ワンホットから整数への変換](ONEHOT)** を参照してください。

## ソルバー情報

ソルバーの結果クラス（`EasySolverSol`、`ExhaustiveSolverSol`、`ABS3SolverSol`）は `Sol` を継承し、
**`info()`** で追加情報を提供します。

| 式 | 戻り値の型 | 説明 |
|------------|-------------|-------------|
| `sol.info()` | `const KeyValueVector&` | ソルバー情報のキーバリューペア |
| `sol.sols()` | `const std::vector<Sol>&` | 収集された全解 |
| `sol.size()` | `size_t` | 収集された解の数 |
| `sol[i]` | `const Sol&` | $i$ 番目の解にアクセス |

`info()` オブジェクトはソルバーのメタデータを文字列のキーバリューペアとして格納しています。
代表的なキー:

| キー | 説明 |
|-----|-------------|
| `"flip_count"` | 実行された変数フリップの総数 |
| `"var_count"` | モデルの変数数 |
| `"term_count"` | モデルの項数 |
| `"version"` | QUBO++ のバージョン |
| `"cpu_name"` | CPU モデル名 |
| `"hostname"` | マシンのホスト名 |

全エントリを反復処理するか、キーでアクセスできます:
```cpp
for (const auto& kv : sol.info()) {
  std::cout << kv.key << " = " << kv.value << std::endl;
}
```

## 出力

`Sol` オブジェクトは `std::cout` で出力できます:
```cpp
std::cout << sol << std::endl;
```
変数の割り当てを含む人間が読みやすい形式で出力されます。

</div>
