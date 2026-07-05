---
layout: default
nav_exclude: true
title: "MILP Solvers (Experimental)"
nav_order: 23
lang: ja
hreflang_alt: "en/MILP_SOLVERS"
hreflang_lang: "en"
---

# 実験的 MILP ソルバー — SCIP, HiGHS, GLPK, CBC

QUBO++ は複数のサードパーティ製**厳密 MILP ソルバー**で QUBO 式を解くことが
できます。これらは共通インタフェースを持つヘッダオンリーのソルバーとして
ラップされており、**クラス名を変えるだけ**で互いに、また
`qbpp::ABS3Solver` とも切り替えられます。

これらは**線形**の目的関数を最小化するため、二次の QUBO は渡す前に
**線形化**する必要があります（後述）。これがこのページの判定基準です。
二次目的関数を**直接**受け取れるソルバー（Gurobi, IBM CPLEX — いずれも MIQP）は
ここには含まれず、[QUBO/HUBO ソルバー](QUBO_HUBO_SOLVERS) にまとめています。
制約プログラミングエンジンの OR-Tools CP-SAT は [CP ソルバー](CP_SOLVERS) を
参照してください。

> **実験的機能。** これらは実験・ベンチマーク用途で提供されます。API は予告なく
> 変更される可能性があり、各ソルバーは別途インストールが必要です（[セットアップ](#setup)参照）。
> 対応は **QUBO（次数 ≤ 2）のみ**です。HUBO は事前に QUBO へ削減するか、任意次数に
> 対応する `qbpp::ABS3Solver` / `qbpp::EasySolver` を使ってください。

内部では各二次項 `x·y` を補助変数＋線形リンク制約に置き換え（Fortet 線形化）、
QUBO を純粋な MILP としてソルバーに渡します。返される解のエネルギーは、ソルバーの
浮動小数点目的値とは独立に、元の QUBO から常に厳密に再計算されます。

| ソルバー | クラス | ライセンス | 備考 |
|----|----|----|----|
| [SCIP](https://www.scipopt.org)   | `qbpp::ScipSolver` | Apache-2.0 (OSS) | linearize / quadratic 定式化 |
| [HiGHS](https://highs.dev)        | `qbpp::HighsSolver` | MIT (OSS) | 高速な OSS MILP |
| [GLPK](https://www.gnu.org/software/glpk/) | `qbpp::GlpkSolver` | GPL (OSS) | 軽量 |
| [CBC](https://github.com/coin-or/Cbc) | `qbpp::CbcSolver` | EPL (OSS) | COIN-OR branch & cut |

二次目的関数を直接受け取れる商用の厳密ソルバー（Gurobi, IBM CPLEX）は
[QUBO/HUBO ソルバー](QUBO_HUBO_SOLVERS) を参照してください（Gurobi は C++・PyQBPP
両対応、CPLEX は PyQBPP のみ）。

## 使い方

4 つのソルバーはすべて同じインタフェースです。次のプログラムは SCIP で数分割問題を
解きます。`qbpp::ScipSolver` を `qbpp::HighsSolver` / `qbpp::GlpkSolver` /
`qbpp::CbcSolver` に置き換える（と対応ヘッダを include する）だけで別のソルバーを
使えます:

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/scip.hpp>     // または highs.hpp / glpk.hpp / cbc.hpp

int main() {
  std::vector<int> w = {64, 27, 47, 74, 12, 83, 63, 40};
  auto x = qbpp::var("x", w.size());
  auto p = qbpp::toExpr(0), q = qbpp::toExpr(0);
  for (size_t i = 0; i < w.size(); ++i) { p += w[i] * x[i]; q += w[i] * (1 - x[i]); }
  auto f = qbpp::sqr(p - q);
  f.simplify_as_binary();

  auto solver = qbpp::ScipSolver(f);   // <- クラス名を差し替えればソルバー切替
  auto sol = solver.search({{"time_limit", 10.0}});

  std::cout << "energy = " << sol.energy() << std::endl;
  std::cout << "bound  = " << sol.info("bound") << std::endl;
  std::cout << "status = " << sol.info("status") << std::endl;
}
```
{% endraw %}

エネルギーが下界 `sol.info("bound")` と一致すれば、その解は最適であることが
保証されます:

```
energy = 0
bound  = 0.000000
status = OPTIMAL
```

ソルバーオブジェクトは式から生成され、構築時に（simplify 済みの）QUBO がソルバー
内部の MILP モデルへ線形化されます。式が高次（HUBO）項を含む場合、コンストラクタは
例外を送出します。

## パラメータ

パラメータは `search()` にキー／値のペアの初期化子リストで渡します。すべての
ラッパーが解釈する共通キーは次の通りです:

| キー | 値 | 説明 |
|----|----|----|
| **`time_limit`** | 秒 | 制限時間に達したら停止 |
| **`target_energy`** | エネルギー | この値以下の解を見つけたら停止 |
| **`callback_timer_interval`** | 秒 | `Timer` イベントの初期間隔 |
| **`enable_default_callback`** | `1` | 新しい incumbent ごとにエネルギーと TTS を表示 |
| **`thread_count`** | スレッド数 | ワーカースレッド数（SCIP/HiGHS。GLPK/CBC は無視） |
| **`topk_sols`** | K | 最大 K 個の解を返す（ベストエフォート、下記参照） |
| **`gap_limit`** | gap | 相対 MIP gap による停止（SCIP/HiGHS） |
| **`output_flag`** | `1` | ソルバー自身のログを表示（SCIP/HiGHS） |

ソルバー固有の追加:

- **SCIP** — 未知のキーは SCIP にそのまま転送されます（例 `"limits/gap"`,
  `"lp/threads"`）。`formulation`（linearize / quadratic）は **コンストラクタ**の
  オプションであり、`search()` のキーではありません（下記参照）。
- **HiGHS** — 未知のキーは HiGHS の `setOptionValue` に転送されます
  （例 `"presolve"`, `"mip_rel_gap"`）。

> `topk_sols` はベストエフォートです。Gurobi の解プールと異なり、これらのソルバーは
> 内部ストレージに残る相異なる解（多くの場合 incumbent のみ）を返します。

## SCIP: linearize と quadratic 定式化

`qbpp::ScipSolver` は QUBO を 2 通りの方法で SCIP に渡せます:

- **`"linearize"`（既定）** — Fortet 線形化で純粋な MILP にする（他のソルバーと共通の
  変換）。SCIP に締まった LP 緩和を与えます。
- **`"quadratic"`** — SCIP の目的関数は線形のみのため、目的変数 `t` を 1 つ追加し、
  **2 次（非線形）制約** `t == const + Σ qᵢⱼ·xᵢ·xⱼ` を 1 本張って `t` を最小化します。
  二次項は SCIP の非線形制約ハンドラが内部で再定式化するため、Fortet 補助変数は
  追加されません。ただし項ごとの（McCormick）緩和は緩く、密なペナルティ QUBO では
  通常遅くなります。比較用に提供しています。

どちらの定式化でも同じ最適解に到達します。定式化は**構築時に固定**されます。
別の定式化を使うにはソルバーオブジェクトを作り直してください（`search()` の
パラメータではありません）:

{% raw %}
```cpp
qbpp::ScipSolver solver(f, qbpp::ScipSolver::Formulation::Quadratic);
auto sol = solver.search();
```
{% endraw %}

このオプションは SCIP 固有です。HiGHS・GLPK・CBC は常に線形化 MILP を使います。

## Solver Info

`sol.info()` はソルバーが生成した文字列を保持します:

| キー | 説明 |
|----|----|
| `status` | `OPTIMAL`, `TIME_LIMIT`, `INFEASIBLE`, …（綴りはソルバー依存） |
| `bound` | 最良の双対下界 |
| `mip_gap` | 最終的な相対 MIP gap（SCIP/HiGHS） |
| `node_count` | 分枝限定ノード数 |
| `solution_count` | 解が得られたら `1`、なければ `0` |
| `<solver>_version` | `scip_version` / `highs_version` / `glpk_version` |
| `run_time` | 実時間の求解時間（秒） |

## カスタムコールバック

コールバック API は `qbpp::ABS3Solver` / `qbpp::GurobiSolver` と同一です。ソルバーを
継承し `callback()` 仮想メソッドを override します:

| イベント | 説明 |
|-------|-------------|
| `CallbackEvent::Start` | `search()` の開始時に 1 度呼ばれる |
| `CallbackEvent::BestUpdated` | 新しい incumbent が見つかるたびに呼ばれる |
| `CallbackEvent::Timer` | `timer(seconds)` で設定した間隔で定期的に呼ばれる |

コールバック内では **`event()`**、**`best_sol()`**（現在の最良 `qbpp::Sol`）、
**`bound()`**（現在の双対下界）、**`timer(seconds)`**（タイマー設定/無効化）、
**`terminate()`**（次の安全点で探索を停止）が使えます。`hint(sol)` は SCIP と HiGHS を
ウォームスタートします（GLPK・CBC では何もしません）。

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/highs.hpp>

class MySolver : public qbpp::HighsSolver {
 public:
  using HighsSolver::HighsSolver;
  void callback() const override {
    if (event() == qbpp::CallbackEvent::BestUpdated) {
      std::cout << "New best: energy=" << best_sol().energy()
                << " TTS=" << best_sol().tts() << "s  bound=" << bound() << std::endl;
      if (best_sol().energy() == 0) terminate();  // 最適が見つかり次第停止
    }
  }
};

int main() {
  auto x = qbpp::var("x", 8);
  auto f = qbpp::sqr(qbpp::sum(x) - 4);
  f.simplify_as_binary();
  auto sol = MySolver(f).search({{"time_limit", 5}});
  std::cout << "energy=" << sol.energy() << std::endl;
}
```
{% endraw %}

## セットアップ {#setup}

各ソルバーは別途インストールが必要です。ヘッダは独立しています
（`<qbpp/scip.hpp>`, `<qbpp/highs.hpp>`, `<qbpp/glpk.hpp>`, `<qbpp/cbc.hpp>`）。
使うものだけ include してください。qbpp 本体は `dlopen` で読み込まれるため
`-lqbpp` は不要です。4 つすべてを手軽に入れるには
[conda-forge](https://conda-forge.org) が便利です:

```sh
conda install -c conda-forge scip highs glpk coincbc
```

ソルバー別のビルドフラグ（他の qbpp プログラム同様 `-ldl -pthread` を付与）:

| ソルバー | リンクフラグ | ヘッダパス（conda） |
|----|----|----|
| SCIP  | `-lscip` | （システム include か `-I$PREFIX/include`） |
| HiGHS | `-lhighs` | `-isystem $PREFIX/include/highs` |
| GLPK  | `-lglpk` | （システム include か `-I$PREFIX/include`） |
| CBC   | `-lCbc -lCbcSolver -lCgl -lOsiClp -lClp -lOsi -lCoinUtils` | `-isystem $PREFIX/include/coin` |

例（conda を `$CONDA_PREFIX` に導入した場合）:

```sh
g++ -std=c++17 your_program.cpp -o your_program \
    -isystem $CONDA_PREFIX/include/highs \
    -L$CONDA_PREFIX/lib -Wl,-rpath,$CONDA_PREFIX/lib -lhighs -ldl -pthread
```

SCIP は apt/deb（`SCIPOptSuite-*.deb`）で導入するとヘッダと `libscip.so` が既定の
パスに置かれるため、`-lscip` だけで済みます。
