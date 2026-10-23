---
last_modified: 2026-10-19
layout: default
nav_exclude: true
title: "Easy Solver"
nav_order: 19
lang: ja
hreflang_alt: "en/EASYSOLVER"
hreflang_lang: "en"
---

# Easy Solverの使い方
**Easy Solver**はQUBO/HUBO式のためのヒューリスティックソルバーです。

Easy Solverを使って問題を解くには、以下の2つのステップで行います：
1. Easy Solver（`qbpp::EasySolver`）オブジェクトを作成します。
2. `search()` メンバ関数を呼び出して解を探索します。パラメータは初期化子リストとして渡します。`qbpp::EasySolverSol` オブジェクトが返されます。

## Easy Solverオブジェクトの作成
Easy Solverを使用するには、式（`qbpp::Expr`）オブジェクトを引数としてEasy Solverオブジェクト（`qbpp::EasySolver`）を以下のように構築します：
- **`qbpp::EasySolver(const qbpp::Expr& f)`**

ここで、`f` は解くべき式です。
事前に `simplify_as_binary()` 関数を呼び出してバイナリ式として簡約化しておく必要があります（整数変数だけの式は `simplify()` で簡約します）。
この関数は与えられた式 `f` を解探索中に使用される内部フォーマットに変換します。

## 探索パラメータの設定
探索パラメータは `search()` メンバ関数に初期化子リストとして直接渡します。
以下のパラメータが利用可能です：

| パラメータ | 説明 | デフォルト |
|---|---|---|
| `time_limit` | 制限時間（秒）。`0` で時間制限なし。 | `10.0` |
| `target_energy` | ターゲットエネルギー。この値以下の解が見つかると探索を終了。`cons()` で制約を宣言したモデルでは、全制約の充足も停止の条件（[ソルバーごとの対応と意味論](CONSTRAINTS#ソルバーごとの対応と意味論)）。 | （なし） |
| `enable_default_callback` | `1` で新たに得られた最良解を出力。 | `0` |
| `topk_sols` | 保持するtop-k解の数。 | （無効） |
| `best_energy_sols` | 最良エネルギーの解を保持。`0` で無制限。 | （無効） |
| `thread_count` | 探索に使う CPU スレッド数。 | （自動） |
| `seed` | 乱数シード。初期解や提案に使う乱数列を固定します。完全な実行再現は直列構成（例: `thread_count=1`）でのみ保証され、多スレッドではタイミングの非決定性が残ります。 | `0`（非決定） |

パラメータは `search()` に初期化子リストとして渡します：
{% raw %}
```cpp
auto sol = solver.search({{"time_limit", 5.0}, {"target_energy", 900}, {"enable_default_callback", 1}});
```
{% endraw %}

未知のパラメータキーを指定するとランタイムエラーが発生します。

## 解の探索
Easy Solverは、**`search()`** メンバ関数を呼び出すことで解を探索します。パラメータは初期化子リストとして渡すことができます。

## プログラム例
以下のプログラムは、Easy Solverを使用してLow Autocorrelation Binary Sequences (LABS)問題の解を探索します：
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  size_t size = 100;
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

  auto solver = qbpp::EasySolver(f);

  auto sol = solver.search({{"time_limit", 5.0}, {"target_energy", 900}, {"enable_default_callback", 1}});
  std::cout << sol.energy() << ": ";
  for (auto val : sol(x)) {
    std::cout << (val == 0 ? "-" : "+");
  }
  std::cout << std::endl;
}
```
{% endraw %}
この例では、以下のパラメータが `search()` に渡されています：
- 制限時間5.0秒、
- ターゲットエネルギー900、
- デフォルトコールバックが有効。

したがって、ソルバーは経過時間が5.0秒に達するか、エネルギーが900以下の解が見つかると終了します。

例えば、このプログラムは以下の出力を生成します：
```
TTS = 0.000s Energy = 300162
TTS = 0.000s Energy = 273350
TTS = 0.000s Energy = 248706
TTS = 0.000s Energy = 226086
TTS = 0.000s Energy = 205274
TTS = 0.000s Energy = 186142
TTS = 0.000s Energy = 168442
TTS = 0.000s Energy = 152134
TTS = 0.000s Energy = 137162
TTS = 0.000s Energy = 123374
TTS = 0.001s Energy = 110650
TTS = 0.001s Energy = 98990
TTS = 0.001s Energy = 88346
TTS = 0.001s Energy = 78678
TTS = 0.001s Energy = 69802
TTS = 0.001s Energy = 61798
TTS = 0.001s Energy = 54626
TTS = 0.001s Energy = 47982
TTS = 0.001s Energy = 42034
TTS = 0.001s Energy = 36598
TTS = 0.001s Energy = 31778
TTS = 0.001s Energy = 27446
TTS = 0.001s Energy = 23658
TTS = 0.002s Energy = 20286
TTS = 0.002s Energy = 17250
TTS = 0.002s Energy = 14614
TTS = 0.002s Energy = 12306
TTS = 0.002s Energy = 10350
TTS = 0.002s Energy = 8682
TTS = 0.002s Energy = 7214
TTS = 0.002s Energy = 5994
TTS = 0.002s Energy = 4990
TTS = 0.002s Energy = 4130
TTS = 0.002s Energy = 3478
TTS = 0.003s Energy = 2882
TTS = 0.003s Energy = 2414
TTS = 0.003s Energy = 2122
TTS = 0.003s Energy = 1822
TTS = 0.003s Energy = 1706
TTS = 0.003s Energy = 1574
TTS = 0.003s Energy = 1442
TTS = 0.003s Energy = 1350
TTS = 0.007s Energy = 1306
TTS = 0.008s Energy = 1274
TTS = 0.008s Energy = 1262
TTS = 0.008s Energy = 1202
TTS = 0.016s Energy = 1170
TTS = 0.018s Energy = 1166
TTS = 0.018s Energy = 994
TTS = 0.066s Energy = 986
TTS = 0.066s Energy = 982
TTS = 0.184s Energy = 954
TTS = 0.371s Energy = 942
TTS = 0.912s Energy = 930
TTS = 0.913s Energy = 902
TTS = 2.691s Energy = 898
898: ++-++-----+--+--++++++---++-+-+--++-------++-++-+-+-+-+-++-++++-++-+++++-+-+--++++++---+++--+++---++
```

## 高度な使い方

### 複数のtop-k解の保持
Easy Solverは探索中に見つかった**複数のtop-k解**を保持できます。
この機能を有効にするには、`topk_sols` パラメータを設定します。

このパラメータが設定されると、`search()` が返す `EasySolverSol` オブジェクトには保持されたtop-k解が含まれます。
返されたオブジェクト `sols` に対して、インデックスまたはイテレータで保持された解にアクセスできます：
- **`sols.sols[i]`**: `i` 番目の `qbpp::Sol` オブジェクトを返します（メンバ配列 `sols` へのインデックス）。
- **`sols.size()`**: 保持された解の数を返します。
- **`begin()`**, **`end()`**: 範囲ベースforループ（`for (const auto& sol : sols)`）で各解に順にアクセスできるイテレータです。

以下のプログラムは、Easy Solverを使用してLow Autocorrelation Binary Sequence (LABS)問題を解きます。
`topk_sols` を `20` に設定しているため、ソルバーは**最大20個のtop-k解**を保持します。
プログラムは範囲ベースforループを使用して各保持解を出力します。
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

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

  auto solver = qbpp::EasySolver(f);

  auto sols = solver.search({{"time_limit", 5.0}, {"topk_sols", 20}});
  for (const auto& sol : sols) {
    std::cout << sol.energy() << ": ";
    for (auto val : sol(x)) {
      std::cout << (val == 0 ? "-" : "+");
    }
    std::cout << std::endl;
  }
}
```
{% endraw %}
このプログラムは以下の出力を表示します：
```
26: -----+-+++-+--+++--+
26: +--+++--+-+++-+-----
26: -+-+----+----++-++--
26: --++-++----+----+-+-
26: -++---++-+---+-+++++
34: ---+++++-+++-++-+-++
34: +-+-+++++----++--++-
34: -+++++---+---+-+--+-
34: +++-----+---+--+-+--
34: --++--++-+--+-+-----
34: -+--+-+---+---+++++-
34: ---+++-+-+----+--+--
38: -++-++-+-+---++-----
38: --++++--+-+--+---+--
38: -+-+---++------++-++
38: ++++-++-+--+++-+---+
38: ----+--+-++---+-+++-
42: -+++++++--++-+-+-++-
42: -+-+----+++++-++--++
42: ++-----+---+--+-+--+
```

### 複数の最良エネルギー解の保持
Easy Solverは探索中に見つかった最良（最小）エネルギーを共有する複数の解を保持できます。
この機能を有効にするには、`best_energy_sols` パラメータを設定します。
値は保持する最大解数を指定します。`0` で無制限です。

使い方は `topk_sols` と同じです。
したがって、上記のQUBO++プログラムでこの機能を有効にするには、`topk_sols` を `best_energy_sols` に置き換えます：
{% raw %}
```cpp
  auto sols = solver.search({{"time_limit", 5.0}, {"best_energy_sols", 0}});  // 無制限
```
{% endraw %}
このパラメータが設定された場合、ソルバーは見つかった最良エネルギーと等しいエネルギーの解のみを保持します。
結果として得られるプログラムは、すべて最良エネルギー値26を持つ以下の解を生成します：
```
26: +++++-+---+-++---++-
26: ++--+--++++-++++-+-+
26: -+-+----+----++-++--
26: +-+-++++-++++--+--++
26: -++---++-+---+-+++++
26: --++-++----+----+-+-
```

## カスタムコールバック

組み込みコールバック（`enable_default_callback` で有効化）は、新しい最良解が見つかるたびにエネルギーとTTSを出力するだけです。
探索の途中で最良解を受け取って処理したい場合は、[ABS3 Solver](ABS3#カスタムコールバック) と同じ方法でカスタムコールバックを使えます。

1. **関数を登録する** — `solver.set_callback(fn)`。`fn` はソルバー自身を引数として `fn(solver)` の形で呼ばれます
2. **サブクラス化する** — `EasySolver` を継承して `callback()` 仮想メソッドをオーバーライドします

両方を指定した場合はオーバーライドが優先されます。両方を実行したい場合は、オーバーライドの中で `EasySolver::callback()` を呼んでください。

コールバックは以下のイベントのいずれかで呼び出されます：

| イベント | 説明 |
|-------|-------------|
| `CallbackEvent::Start` | `search()` の開始時に1回呼び出されます（`best_sol()` は探索の出発点の解） |
| `CallbackEvent::BestUpdated` | 新しい最良解が見つかるたびに呼び出されます |
| `CallbackEvent::Timer` | `timer()` で設定した間隔で、その時点の最良解とともに呼び出されます |

コールバック内では、以下のメソッドが利用可能です：
- **`best_sol()`** — 最良解への `const qbpp::Sol&` を返します。`.energy()`、`.tts()`、`.get(var)` などが使用できます
- **`event()`** — このコールバックをトリガーしたイベントを返します
- **`timer(seconds)`** — `Timer` イベントの間隔を秒単位で設定します。`0` で無効になります。呼ばなければ間隔は変わりません
- **`hint(sol)`** — 解 `sol` をヒント解としてソルバーに渡します（下記[ヒント解を渡す](#ヒント解を渡す)を参照）。別のスレッドからも呼べます
- **`terminate()`** — 現在の探索を協調的に中断し、これまでの最良解で `search()` を終わらせます。別のスレッドからも呼べます。同じインスタンスで再び `search()` を呼ぶと、停止の指示は自動的に解除されます

コールバックは探索のスレッドから呼ばれますが、同時に 2 つ以上呼ばれることはありません。

以下のプログラムは、最良解が更新されるたびにエネルギーとTTSを表示し、1秒ごとにその時点の最良エネルギーを表示します。
エネルギーが 0 になったら `terminate()` で探索を終えます。
{% raw %}
```cpp
#include <iostream>
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  auto x = qbpp::var("x", 20);
  auto f = qbpp::sqr(qbpp::sum(x) - 10);
  f.simplify_as_binary();

  qbpp::EasySolver solver(f);
  solver.set_callback([](const qbpp::EasySolver& s) {
    if (s.event() == qbpp::CallbackEvent::Start) {
      s.timer(1.0);  // 1秒ごとのタイマーを有効化
    } else if (s.event() == qbpp::CallbackEvent::BestUpdated) {
      std::cout << "New best: energy=" << s.best_sol().energy()
                << " TTS=" << s.best_sol().tts() << "s" << std::endl;
      if (s.best_sol().energy() == 0) s.terminate();
    } else if (s.event() == qbpp::CallbackEvent::Timer) {
      std::cout << "Timer: energy=" << s.best_sol().energy() << std::endl;
    }
  });

  auto sol = solver.search({{"time_limit", 10}});
  std::cout << "energy=" << sol.energy() << std::endl;
}
```
{% endraw %}

登録を解除するには `solver.set_callback(nullptr)` を呼びます。
サブクラス化の例は [ABS3 Solver のページ](ABS3#方法2-サブクラス化する) を参照してください（`ABS3Solver` を `EasySolver` に読み替えます）。

### ヒント解を渡す

`hint(sol)` は、別の方法で求めた解などを、ヒント解としてソルバーに渡します。
`sol` には同じ式の解（`qbpp::Sol(f)` で作って値を設定した解や、コールバックの `best_sol()`）を渡します。

- **探索中**（コールバックの中、または別のスレッド）に呼ぶと、その解が実行中の探索に渡されます。探索はその解からも続けられ、`search()` は渡した解より悪い解を返しません。渡した解がそれまでの最良解より良ければ、`BestUpdated` イベントで最良解の更新が通知されます
- **探索の前**に呼ぶと、次の `search()` の出発点になります（使われるのは次の 1 回だけです）。`search()` に渡すパラメータ（`qbpp::Params`）の `hint(sol)` でヒント解を指定した場合は、そちらが優先されます

整数変数を含む式でも同じように使えます（整数変数の値も渡されます）。

以下のプログラムは 0-1 ナップサック問題を解きます。
貪欲法（価値/重さの大きい順に詰める）で求めた解を 0.5 秒ごとの `Timer` イベントで最良解と比べ、貪欲法の解のほうが良ければ `hint()` で探索に渡します。
{% raw %}
```cpp
#include <algorithm>
#include <iostream>
#include <numeric>
#include <vector>
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  // 0-1 ナップサック: 容量を超えない範囲で価値の合計を最大化する
  const int n = 1000;
  std::vector<int> w(n), v(n);
  for (int i = 0; i < n; ++i) {
    w[i] = 10 + i * 37 % 51;
    v[i] = 10 + i * 53 % 91;
  }
  const int cap = std::accumulate(w.begin(), w.end(), 0) / 4;
  auto x = qbpp::var("x", n);
  auto f = -qbpp::sum(qbpp::array(v) * x) +
           100 * qbpp::cons(qbpp::sum(qbpp::array(w) * x) <= cap);
  f.simplify_as_binary();

  // 貪欲法: 価値/重さの大きい順に、入るものを詰める
  std::vector<int> order(n);
  std::iota(order.begin(), order.end(), 0);
  std::stable_sort(order.begin(), order.end(),
                   [&](int a, int b) { return v[a] * w[b] > v[b] * w[a]; });
  qbpp::Sol greedy(f);
  int rest = cap;
  for (int i : order) {
    if (w[i] <= rest) {
      greedy.set(x[i], true);
      rest -= w[i];
    }
  }
  const auto greedy_energy = f(greedy);
  std::cout << "greedy: energy=" << greedy_energy << std::endl;

  qbpp::EasySolver solver(f);
  solver.set_callback([&](const qbpp::EasySolver& s) {
    if (s.event() == qbpp::CallbackEvent::Start) {
      s.timer(0.5);
    } else if (s.event() == qbpp::CallbackEvent::Timer) {
      // 貪欲法の解のほうが良ければ探索に渡す
      if (greedy_energy < s.best_sol().energy()) s.hint(greedy);
    }
  });
  auto sol = solver.search({{"time_limit", 2}});
  std::cout << "no worse than greedy: "
            << (sol.energy() <= greedy_energy ? "yes" : "no") << std::endl;
}
```
{% endraw %}

このプログラムの出力は次のとおりです。
```
greedy: energy=-26934
no worse than greedy: yes
```
