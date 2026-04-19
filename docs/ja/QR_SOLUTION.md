---
layout: default
nav_exclude: true
title: "QR: Solutions"
nav_order: 33
lang: ja
hreflang_alt: "en/QR_SOLUTION"
hreflang_lang: "en"
---

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
| `sol(vi)` | `vi(sol)` | `energy_t` | 整数変数 `vi` を評価（整数値） |
| `sol(t)` | `t(sol)` | `energy_t` | `Term` `t` を評価 |
| `sol(f)` | `f(sol)` | `energy_t` | `Expr` `f` を評価 |
| `sol(c)` | `c(sol)` | `energy_t` | 制約式 `c` のペナルティを評価 |
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

`MapList` は `(Var, 値)` または `(Expr, 値)` (この `Expr` は整数変数) のペアのリストです:
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
| `sol.sols` | `const std::vector<Sol>&` | 収集された全解 |
| `sol.size` | `size_t` | 収集された解の数 |
| `sol.sols[i]` | `const Sol&` | $i$ 番目の解にアクセス |

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
