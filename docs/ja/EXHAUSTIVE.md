---
layout: default
nav_exclude: true
title: "Exhaustive Solver"
nav_order: 20
lang: ja
hreflang_alt: "en/EXHAUSTIVE"
hreflang_lang: "en"
---

# Exhaustive Solverの使い方
**Exhaustive Solver**はQUBO/HUBO式のための完全探索ソルバーです。
すべての可能な割り当てが検査されるため、解の最適性が保証されます。
探索はCPUスレッドを使用して並列化され、CUDA GPUが利用可能な場合は、探索をさらに高速化するためにGPUアクセラレーションが自動的に有効になります。

Exhaustive Solverを使って問題を解くには、以下の3つのステップで行います：
1. Exhaustive Solver（`qbpp::ExhaustiveSolver`）オブジェクトを作成します。
2. `search()` メンバ関数を呼び出します。パラメータは初期化子リストとして渡すことができます。


## Exhaustive Solverオブジェクトの作成
Exhaustive Solverを使用するには、式（`qbpp::Expr`）オブジェクトを引数としてExhaustive Solverオブジェクト（`qbpp::ExhaustiveSolver`）を以下のように構築します：
- **`qbpp::ExhaustiveSolver(const qbpp::Expr& f)`**:
ここで、`f` は解くべき式です。
事前に `simplify_as_binary()` 関数を呼び出してバイナリ式として簡約化しておく必要があります。
この関数は与えられた式 `f` を解探索中に使用される内部フォーマットに変換します。

## パラメータの設定
探索パラメータは `search()` に初期化子リストとして直接渡します。
以下のパラメータが利用可能です：

| パラメータ | 値 | 説明 |
|---|---|---|
| `target_energy` | エネルギー文字列 | 早期終了のためのターゲットエネルギー値を設定します。ソルバーがターゲット以下のエネルギーを持つ解を見つけると、探索は直ちに終了します。 |
| `verbose` | `"1"` or `"true"` | 探索の進捗をパーセンテージで表示します。総実行時間の推定に役立ちます。 |
| `enable_default_callback` | `"1"` or `"true"` | 新たに得られた最良解を出力するデフォルトコールバック関数を有効にします。 |
| `topk_sols` | 整数文字列 | 最小エネルギーのtop-k解を収集します。 |
| `best_energy_sols` | `"1"` | すべての最適解（最小エネルギーの解）を収集します。 |
| `all_sols` | `"1"` or `"true"` | すべての $2^n$ 個の解を収集します。 |

## 解の探索
- **`search()`**: 見つかった最良解を返します（パラメータなし）。CUDA GPUが利用可能な場合、CPUスレッドと並行してGPUを使用した探索の高速化が自動的に行われます。
- **`search(params)`**: `Sol` オブジェクトを返します。`topk_sols`、`best_energy_sols`、`all_sols` が設定されている場合、収集された解は `sol.sols` でエネルギーの昇順にアクセスできます。

# プログラム例
以下のプログラムは、Exhaustive Solverを使用して**Low Autocorrelation Binary Sequences (LABS)**問題の解を探索します：
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  size_t size = 20;
  auto x = qbpp::var("x", size);
  auto f = qbpp::toExpr(0);
  for (size_t d = 1; d < size; ++d) {
    auto temp = qbpp::toExpr(0);
    for (size_t i = 0; i < size - d; ++i) {
      temp += (2 * x[i] - 1) * (2 * x[i + d] - 1);
    }
    f += qbpp::sqr(temp);
  }
  f.simplify_as_binary();

  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search({{"enable_default_callback", 1}});
  std::cout << sol.energy() << ": ";
  for (auto val : sol(x)) {
    std::cout << (val == 0 ? "-" : "+");
  }
  std::cout << std::endl;
}
```
{% endraw %}
このプログラムの出力は以下のとおりです：
{% raw %}
```
TTS = 0.000s Energy = 1506
TTS = 0.000s Energy = 1030
TTS = 0.000s Energy = 502
TTS = 0.000s Energy = 446
TTS = 0.000s Energy = 234
TTS = 0.000s Energy = 110
TTS = 0.001s Energy = 106
TTS = 0.001s Energy = 74
TTS = 0.001s Energy = 66
TTS = 0.001s Energy = 42
TTS = 0.001s Energy = 34
TTS = 0.004s Energy = 26
26: --++-++----+----+-+-
```
{% endraw %}
すべての最適解は `best_energy_sols` を設定することで取得できます：
{% raw %}
```cpp
  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search({{"best_energy_sols", 1}});
  for (const auto& s : sol.sols) {
    std::cout << s.energy << ": ";
    for (auto val : s(x)) {
      std::cout << (val == 0 ? "-" : "+");
    }
    std::cout << std::endl;
  }
```
{% endraw %}
出力は以下のとおりです：
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
最小エネルギーのtop-k解は `topk_sols` を設定することで取得できます：
{% raw %}
```cpp
  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search({{"topk_sols", 10}});
  for (const auto& s : sol.sols) {
    std::cout << s.energy << ": ";
    for (auto val : s(x)) {
      std::cout << (val == 0 ? "-" : "+");
    }
    std::cout << std::endl;
  }
```
{% endraw %}
出力は以下のとおりです：
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
{% raw %}
```cpp
  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search({{"all_sols", 1}});
  for (const auto& s : sol.sols) {
    std::cout << s.energy << ": ";
    for (auto val : s(x)) {
      std::cout << (val == 0 ? "-" : "+");
    }
    std::cout << std::endl;
  }
```
{% endraw %}
以下に示すように、すべての $2^{20}$ 個の解がエネルギーの昇順で出力されます：
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
