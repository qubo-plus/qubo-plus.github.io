---
layout: default
nav_exclude: true
title: "ABS3 Solver"
nav_order: 21
lang: ja
hreflang_alt: "en/ABS3"
hreflang_lang: "en"
---

# ABS3 Solverの使い方
ABS3 Solverを使用して式 `f` を解くには、以下の3つのステップで行います：
1. 式 `f` に対してABS3 Solver（**`qbpp::ABS3Solver`**）オブジェクトを作成します。
2. **`search()`**メンバ関数を呼び出します。パラメータは初期化子リストとして渡します。得られた解が返されます。

## ABS3 SolverによるLABS問題の求解
以下のQUBO++プログラムは、ABS3 Solverを使用して**Low Autocorrelation Binary Sequence (LABS)**問題を解きます：
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/abs3_solver.hpp>

int main() {
  const size_t size = 100;
  auto x = qbpp::var("x", size);
  auto f = qbpp::expr();
  for (size_t d = 1; d < size; ++d) {
    auto temp = qbpp::expr();
    for (size_t i = 0; i < size - d; ++i) {
      temp += (2 * x[i] - 1) * (2 * x[i + d] - 1);
    }
    f += qbpp::sqr(temp);
  }
  f.simplify_as_binary();

  auto solver = qbpp::ABS3Solver(f);

  auto sol = solver.search({{"time_limit", 10.0}, {"enable_default_callback", 1}});
  std::cout << sol.energy() << ": ";
  for (auto val : sol(x)) {
    std::cout << (val == 0 ? "-" : "+");
  }
  std::cout << std::endl;
}
```
{% endraw %}
このプログラムでは、まず式 `f` に対してABS3 Solverオブジェクト**`solver`**を作成します。
次に、**`search()`**メンバ関数にパラメータを初期化子リストとして渡して呼び出します。
`time_limit` オプションは最大探索時間を秒単位で指定し、`enable_default_callback` は探索中に新たに見つかった最良解のエネルギーとTTSを出力する組み込みコールバック関数を有効にします。
この関数は指定された制限時間内に見つかった最良解を返し、`sol` に格納されます。

プログラムは解のエネルギーと対応するバイナリ列を出力します。"+"は1を、"-"は0を表します。

このプログラムは以下の出力を生成します：
```
TTS = 0.002s Energy = 1218
TTS = 0.002s Energy = 1170
TTS = 0.002s Energy = 994
TTS = 0.015s Energy = 958
TTS = 0.018s Energy = 922
TTS = 0.034s Energy = 874
TTS = 4.364s Energy = 834
834: -+--+---++-++-+---++-++--+++--+-+-+++++----+++-+-+---++-+--+-----+--+----++----+-+--++++++---+------
```

## ABS3 Solverオブジェクト
ABS3 Solver（`qbpp::ABS3Solver`）オブジェクトは与えられた式に対して作成されます。
ソルバーオブジェクトが構築されると、式は内部データフォーマットに変換され、GPUメモリにロードされます。
オプションの第2引数 `gpu` でGPUの使用を制御します：
- **`qbpp::ABS3Solver(expression)`**: 利用可能なすべてのGPUを自動的に使用します。GPUが利用できない場合はCPUのみモードにフォールバックします。
- **`qbpp::ABS3Solver(expression, 0)`**: CPUのみモードを強制します（GPUは使用されません）。
- **`qbpp::ABS3Solver(expression, n)`**: `n` 個のGPUを使用します。

探索パラメータは `search()` に初期化子リストとして直接渡します。
上記の例では：
- **`"time_limit", 10.0`**: 制限時間を10.0秒に設定します。
- **`"enable_default_callback", 1`**: 新たに得られた解のエネルギーを出力する組み込みコールバック関数を有効にします。

## ABS3パラメータ
パラメータは `search()` メソッドに初期化子リストとして直接渡します。
上記のプログラムでは、`"time_limit", 10.0` で制限時間を10.0秒に設定し、`"enable_default_callback", 1` で新たに得られた解のエネルギーを出力する組み込みコールバック関数を有効にしています。

### 基本オプション

| キー | 値 | 説明 |
|----|----|----|
| **`time_limit`** | 制限時間（秒） | 制限時間に達すると探索を終了します |
| **`target_energy`** | ターゲットエネルギー値 | ターゲットエネルギーが達成されると探索を終了します |

### 詳細オプション

| キー | 値 | 説明 |
|----|----|----|
| **`enable_default_callback`** | "1" | エネルギーとTTSを出力する組み込みコールバックを有効にします |
| **`cpu_enable`** | "0" または "1" | GPUと並行して動作するCPUソルバーの有効/無効（デフォルト: "1"） |
| **`cpu_thread_count`** | CPUスレッド数 | CPUソルバーのスレッド数（デフォルト: 自動） |
| **`block_count`** | GPU当たりのCUDAブロック数 | ソルバーカーネルが起動するCUDAブロック数 |
| **`thread_count`** | CUDAブロック当たりのスレッド数 | CUDAブロック当たりのスレッド数 |
| **`topk_sols`** | 解の数 | 最良エネルギーのtop-K解を返します |
| **`best_energy_sols`** | 最大数（"0" = 無制限） | 見つかった最良エネルギーを持つすべての解を返します |

## 複数解の収集

ABS3 Solverは探索中に複数の解を収集できます。
2つのモードが利用可能です：

### Top-K解 (`topk_sols`)

`topk_sols` パラメータはエネルギーの昇順にソートされたtop-K解を収集します。

{% raw %}
```cpp
auto result = solver.search({{"topk_sols", 10}});  // 最大10個の最良解を収集
```
{% endraw %}

### 最良エネルギー解 (`best_energy_sols`)

`best_energy_sols` パラメータは見つかった最良エネルギーを共有するすべての解を収集します。
より良いエネルギーが発見されると、プールがクリアされ、新しい最良エネルギーの解のみが保持されます。

{% raw %}
```cpp
auto result = solver.search({{"best_energy_sols", 0}});  // すべての最良エネルギー解を収集（無制限）
```
{% endraw %}

または、`best_energy_sols` を最大数付きで設定することもできます：
{% raw %}
```cpp
auto result = solver.search({{"best_energy_sols", 100}});  // 最大100個を収集
```
{% endraw %}

`topk_sols` と `best_energy_sols` は同じ内部プールを共有することに注意してください。
両方が指定された場合、最後に指定されたものが有効になります。

### 収集された解へのアクセス

`search()` メソッドは `ABS3Sols` オブジェクトを返し、収集された解へのアクセスを提供します：

```cpp
auto result = solver.search(params);

std::cout << "Best energy: " << result.energy << std::endl;
std::cout << "Number of solutions: " << result.size() << std::endl;

for (const auto& sol : result.sols) {
  std::cout << "Energy = " << sol.energy() << " TTS = " << sol.tts() << "s" << std::endl;
}
```

`ABS3Sols` オブジェクトは以下をサポートします：
- **`size()`** — 収集された解の数
- **`sols`** — 解ベクトルへのアクセス
- **`operator[](i)`** — i番目の解へのアクセス
- 範囲ベースforループによるイテレーション

## カスタムコールバック

組み込みコールバック（`enable_default_callback` で有効化）は、新しい最良解が見つかるたびにエネルギーとTTSを出力するだけです。
より細かい制御が必要な場合は、`ABS3Solver` をサブクラス化して `callback()` 仮想メソッドをオーバーライドできます。

コールバックは以下のイベントのいずれかで呼び出されます：

| イベント | 説明 |
|-------|-------------|
| `CallbackEvent::Start` | `search()` の開始時に1回呼び出されます |
| `CallbackEvent::BestUpdated` | 新しい最良解が見つかるたびに呼び出されます |
| `CallbackEvent::Timer` | 設定可能な間隔で定期的に呼び出されます |

コールバック内では、以下のメソッドが利用可能です：
- **`best_sol()`** — 現在の最良解への `const qbpp::Sol&` を返します。`.energy`、`.tts`、`.get(var)` などが使用できます。
- **`event()`** — このコールバックをトリガーしたイベントを返します
- **`hint(sol)`** — 探索中にソルバーにヒント解を提供します（[Solution Hint](#solution-hint)を参照）

### タイマー制御

`Timer` イベントはデフォルトでは有効になっていません。
定期的なタイマーコールバックを有効にするには、`callback()` メソッド内で `timer(seconds)` を呼び出します：
- **`timer(1.0)`** — 1秒ごとに `Timer` コールバックを発火します
- **`timer(0)`** — タイマーを無効にします
- `timer()` が呼ばれない場合、タイマー間隔は変更されません。

通常、`timer()` は `Start` コールバック中に1回呼び出されて間隔を設定します。
`BestUpdated` や `Timer` コールバック中にも呼び出して、タイマーを動的に調整または無効にすることができます。

### 例: カスタムコールバック
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/abs3_solver.hpp>

class MySolver : public qbpp::ABS3Solver {
 public:
  using ABS3Solver::ABS3Solver;

  void callback() const override {
    if (event() == qbpp::CallbackEvent::Start) {
      timer(1.0);  // 1秒ごとのタイマーコールバックを有効化
    }
    if (event() == qbpp::CallbackEvent::BestUpdated) {
      std::cout << "New best: energy=" << best_sol().energy
                << " TTS=" << best_sol().tts << "s" << std::endl;
    }
  }
};

int main() {
  auto x = qbpp::var("x", 8);
  auto f = qbpp::sum(x) == 4;
  f.simplify_as_binary();

  auto solver = MySolver(f);
  auto sol = solver.search({{"time_limit", 5}, {"target_energy", 0}});
  std::cout << "energy=" << sol.energy() << std::endl;
}
```
{% endraw %}

## Solution Hint

ヒント解を使用すると、以前に見つかった解で探索をウォームスタートできます。

最も簡単な方法は、`search()` の前に**`params.hint(sol)`**を呼び出すことです：
```cpp
params.hint(sol);  // 探索にヒント解を提供
auto result = solver.search(params);
```
解は探索開始前にソルバーの内部データ構造に直接書き込まれます。

外部ソルバーを並行して実行するような高度なユースケースでは、コールバック中に**`hint(sol)`**を呼び出して動的に解を供給することもできます。
このシナリオでは、コールバックが定期的に呼び出されて新しい外部解をチェックできるように、定期的なタイマー（例：`timer(1.0)`）を設定することを推奨します。

### 例: ヒント解の提供

以下の例は素因数分解問題を2回解きます。
1回目の実行では通常通り最適解を見つけます。
2回目の実行では `params.hint(sol)` を介して最初の解をヒントとして提供し、ソルバーの収束を大幅に高速化します。

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/abs3_solver.hpp>

int main() {
  auto p = 2 <= qbpp::var_int("p") <= 1000;
  auto q = 2 <= qbpp::var_int("q") <= 1000;
  auto f = p * q == 899 * 997;
  f.simplify_as_binary();

  auto solver = qbpp::ABS3Solver(f);

  // 実行1: 通常の探索
  const auto sol1 = solver.search({{"target_energy", 0}, {"time_limit", 10}, {"enable_default_callback", 1}});
  std::cout << "Run 1: p=" << sol1(p) << " q=" << sol1(q)
            << " energy=" << sol1.energy << std::endl;

  // 実行2: 前回の解をヒントとして提供
  qbpp::abs3_solver::Params params2({{"target_energy", 0}, {"time_limit", 10}, {"enable_default_callback", 1}});
  params2.hint(sol1);
  const auto sol2 = solver.search(params2);
  std::cout << "Run 2: p=" << sol2(p) << " q=" << sol2(q)
            << " energy=" << sol2.energy
            << " TTS=" << sol2.tts << "s" << std::endl;
}
```
{% endraw %}

ヒント解は探索開始前にソルバーの内部データ構造に直接書き込まれます。
ソルバーはそのエネルギーを評価し、初期状態として使用した上で、より良い解の探索を続けます。
