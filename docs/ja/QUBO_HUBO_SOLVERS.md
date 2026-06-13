---
layout: default
nav_exclude: true
title: "QUBO/HUBO Solvers (Experimental)"
nav_order: 22
lang: ja
hreflang_alt: "en/QUBO_HUBO_SOLVERS"
hreflang_lang: "en"
---

# QUBO/HUBO ソルバー — Gurobi（実験的）

このページは、**QUBO/HUBO モデルを直接** 受け取る（線形化を行わない）外部
ソルバーを扱います。二次目的関数はそのままバックエンドへ渡されます。

**C++** から現在ラップされている QUBO/HUBO 外部ソルバーは
**[Gurobi Optimizer](https://www.gurobi.com)** のみです（二次目的関数を
直接受け取り、証明付きの最適解と下界を返す厳密な MIQP ソルバー）。
ヒューリスティックなサンプラ・アニーラの豊富なラインアップ（Fixstars
Amplify, D-Wave, OpenJij, TYTAN-SDK, qubovert, Simulated Bifurcation）や
その他の厳密バックエンド（IBM CPLEX, dimod, Qiskit）は **PyQBPP (Python)
からのみ** 利用できます — [PyQBPP の QUBO/HUBO ソルバーのページ](python/QUBO_HUBO_SOLVERS)
を参照してください。

> **他のソルバーの場所。** 二次目的関数を純 MILP に**線形化**してから渡す
> 必要があるソルバー（SCIP, HiGHS, GLPK, CBC）は [MILP ソルバー](MILP_SOLVERS)
> に、制約プログラミングエンジンの OR-Tools CP-SAT（PyQBPP のみ）は
> [CP ソルバー](CP_SOLVERS) にまとめています。

> **実験的機能。** この統合は実験・ベンチマーク用途で提供されます。ラッパ API は
> 予告なく変更される可能性があり、Gurobi は有効なライセンスとともに別途
> インストールが必要です（[セットアップ](#setup)参照）。対応は
> **QUBO（次数 ≤ 2）のみ**です。HUBO は事前に QUBO へ削減するか、任意次数に
> 対応する `qbpp::ABS3Solver` / `qbpp::EasySolver` を使ってください。

# Gurobi Optimizer の使い方
QUBO++ は [Gurobi Optimizer](https://www.gurobi.com) を使用して QUBO 式を解くことができます。
Gurobi の有効なライセンスが必要です。

式 `f` を **`qbpp::GurobiSolver`** で解くには、以下の 2 ステップで行います:
1. 式 `f` に対して Gurobi ソルバー (`qbpp::GurobiSolver`) オブジェクトを作成します。
2. パラメータを初期化リストとして渡しながら **`search()`** メンバ関数を呼び出します。解が返されます。

インタフェースは意図的に `qbpp::ABS3Solver` と揃えてあるため、ユーザーコードはほぼそのままソルバー切替が可能です。

## Gurobi Solver による分割問題の解法
以下のプログラムは、数の分割問題を Gurobi Optimizer で解きます:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/gurobi.hpp>

int main() {
  std::vector<int> w = {64, 27, 47, 74, 12, 83, 63, 40};
  auto x = qbpp::var("x", w.size());
  auto p = qbpp::toExpr(0);
  auto q = qbpp::toExpr(0);
  for (size_t i = 0; i < w.size(); ++i) {
    p += w[i] * x[i];
    q += w[i] * (1 - x[i]);
  }
  auto f = qbpp::sqr(p - q);
  f.simplify_as_binary();

  auto solver = qbpp::GurobiSolver(f);
  auto sol = solver.search({{"time_limit", 10.0}, {"enable_default_callback", 1}});

  std::cout << "energy = " << sol.energy() << std::endl;
  std::cout << "bound  = " << sol.info("bound") << std::endl;
  std::cout << "status = " << sol.info("status") << std::endl;
  std::cout << "P :"; for (size_t i = 0; i < w.size(); ++i) if (sol(x[i]) == 1) std::cout << " " << w[i];
  std::cout << std::endl;
  std::cout << "Q :"; for (size_t i = 0; i < w.size(); ++i) if (sol(x[i]) == 0) std::cout << " " << w[i];
  std::cout << std::endl;
}
```
{% endraw %}

このプログラムは、まず式 `f` に対して `GurobiSolver` オブジェクトを作成します。
次にパラメータを初期化リストとして `search()` メンバ関数に渡します。
`time_limit` は探索の最大秒数を、`enable_default_callback` は新しい最良解が見つかるたびにエネルギーと TTS を出力する組込みコールバックを有効化します。

得られた解のエネルギーが `sol.info("bound")` から得られる下界と一致したとき、その解は最適であることが保証されます:

```
energy = 0
bound  = 0.000000
status = OPTIMAL
P : 64 27 74 40
Q : 47 12 83 63
```

## GurobiSolver オブジェクト
`qbpp::GurobiSolver` オブジェクトは式から作成します。
構築時に式は Gurobi 内部のモデル (`GRBmodel`) に変換されます:
- **`qbpp::GurobiSolver(expression)`**: 式から Gurobi モデルを構築します。

`GurobiSolver` は **QUBO** (次数 ≤ 2) のみサポートします。HUBO (3 次以上) を含む式を渡すと例外が投げられます。
HUBO の場合は補助変数で QUBO に低次化するか、任意次数を扱える `qbpp::ABS3Solver` / `qbpp::EasySolver` を利用してください。

## Gurobi パラメータ
パラメータは `search()` の初期化リストで key-value のペアとして渡します。
qbpp ラッパが解釈するキーを以下に示します。**このリストにないキーはそのまま Gurobi に転送される**ので、[Gurobi の全パラメータ](https://docs.gurobi.com/projects/optimizer/en/current/reference/parameters.html) (`MIPFocus`, `Heuristics`, `Cuts`, `Seed`, `LogFile`, `OutputFlag` など) が利用可能です。

### 基本オプション

| キー | 値 | 説明 |
|----|----|----|
| **`time_limit`** | 秒数 | 制限時間に達した時点で探索を終了 |
| **`target_energy`** | 目標エネルギー | 目標エネルギー以下の解を発見した時点で探索を終了 |
| **`thread_count`** | スレッド数 | Gurobi のワーカースレッド数 |

### 高度なオプション

| キー | 値 | 説明 |
|----|----|----|
| **`enable_default_callback`** | `1` | 組込みコールバック (新最良解のエネルギーと TTS を出力) を有効化 |
| **`callback_timer_interval`** | 秒数 | `Timer` コールバックの初期間隔 |
| **`topk_sols`** | 解数 | 上位 K 解を返す (`PoolSearchMode=2` と `PoolSolutions=K` を設定) |
| **`license_file`** | パス | `$GRB_LICENSE_FILE` を上書き |

> 注: ABS3 の `best_energy_sols` は提供していません — Gurobi の solution pool には「同一ベストエネルギーのみ収集」モードが直接無く、別 API (例: `PoolGap=0`) が必要なためです。

その他の Gurobi ネイティブパラメータ (例: `"MIPFocus", 1`、`"Heuristics", 0.5`、`"OutputFlag", 1`) も同じ初期化リストに混ぜて渡せ、そのまま Gurobi に転送されます。

## 複数解の取得

`topk_sols` を指定すると Gurobi の解プール機能が有効になり、エネルギー昇順に複数の異なる解を取得できます。

{% raw %}
```cpp
auto result = solver.search({{"topk_sols", 5}});

std::cout << "Best energy: " << result.energy() << std::endl;
std::cout << "追加解数: " << result.size() << std::endl;
for (const auto& s : result.sols) {
  std::cout << "energy=" << s.energy() << " tts=" << s.tts() << "s" << std::endl;
}
```
{% endraw %}

返り値オブジェクトのメソッド:
- **`energy()`** — 最良解のエネルギー
- **`sols`** — 追加プール解のベクタ (エネルギー昇順)
- **`size()`** — 追加解数
- **`info(key)`** — ソルバー情報文字列 (下記参照)

## ソルバー情報

`sol.info()` には Gurobi が提供する以下の情報が文字列で格納されます:

| キー | 説明 |
|----|----|
| `status` | `OPTIMAL`, `TIME_LIMIT`, `INFEASIBLE`, `INTERRUPTED`, ... |
| `bound` | Gurobi が見つけた最良目的下界 (LP リラクゼーション) |
| `mip_gap` | 最終的な MIP gap |
| `node_count` | 探索した分枝限定ノード数 |
| `iter_count` | シンプレックス反復回数 |
| `solution_count` | Gurobi が保持している解の数 |
| `gurobi_version` | Gurobi バージョン文字列 (例: `13.0.1`) |
| `run_time` | optimize 呼出のウォール時間 (秒) |

## カスタムコールバック

コールバック API は `qbpp::ABS3Solver` と完全一致です。`qbpp::GurobiSolver` をサブクラス化して仮想メソッド `callback()` をオーバライドします:

| イベント | 説明 |
|---------|------|
| `CallbackEvent::Start` | `search()` の最初に 1 回呼ばれる |
| `CallbackEvent::BestUpdated` | Gurobi が新しい最良解を見つけたとき (`MIPSOL`) に呼ばれる |
| `CallbackEvent::Timer` | `timer(seconds)` で設定した間隔で定期的に呼ばれる |

コールバック内で利用可能なメソッド:
- **`event()`** — 現在のイベント
- **`best_sol()`** — 現時点での最良解 (`qbpp::Sol`)。`BestUpdated` 中は確実に有効、`Timer` 中はキャッシュ値、`Start` 中は未定義
- **`bound()`** — Gurobi が現時点で把握している最良目的下界 (LP リラクゼーション、`double`)。各 Gurobi コールバック発火時に更新される。Gurobi がまだ下界を確定していない場合 (`Start` 中、root LP 実行前など) は `-infinity` を返す。`BestUpdated` (= `MIPSOL`) は LP 実行前のヒューリスティックから発火することも多いため、その時点では `bound()` は `-infinity` のことがある。LP 処理後の `MIP` コンテキストから発火する `Timer` イベントで読み取ると意味のある下界が得られる
- **`timer(seconds)`** — Timer 間隔を設定/無効化 (次のコールバック境界で反映)
- **`hint(sol)`** — ヒント解を提供 (キューに保存され次の `MIPNODE` で Gurobi に注入)

### 例: カスタムコールバック
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/gurobi.hpp>

class MySolver : public qbpp::GurobiSolver {
 public:
  using GurobiSolver::GurobiSolver;

  void callback() const override {
    if (event() == qbpp::CallbackEvent::Start) {
      timer(1.0);  // 1 秒ごとに Timer イベントを発火
    }
    if (event() == qbpp::CallbackEvent::BestUpdated) {
      std::cout << "新しい最良解: energy=" << best_sol().energy()
                << " TTS=" << best_sol().tts() << "s" << std::endl;
    }
  }
};

int main() {
  auto x = qbpp::var("x", 8);
  auto f = qbpp::sqr(qbpp::sum(x) - 4);
  f.simplify_as_binary();

  auto solver = MySolver(f);
  auto sol = solver.search({{"time_limit", 5}, {"target_energy", 0}});
  std::cout << "energy=" << sol.energy() << std::endl;
}
```
{% endraw %}

## 解のヒント

ヒント解を与えると、既知の解から探索を warm start できます。

最もシンプルな方法は `search()` 前に **`params.hint(sol)`** を呼ぶことです:
{% raw %}
```cpp
qbpp::Params params({{"time_limit", 10.0}});
params.hint(prev_sol);
auto result = solver.search(params);
```
{% endraw %}

これは Gurobi の MIPSTART 属性 (`GRB_DBL_ATTR_START`) として書き込まれます。

外部ソルバーから定期的に解をフィードする等の高度な用途では、コールバック内から **`hint(sol)`** を呼ぶこともできます。コールバック中の hint はキューに入り、次の `MIPNODE` イベント発火時に Gurobi へ届きます (これは Gurobi 側の API 制約)。コールバックを定期的に走らせるため `timer()` の併用を推奨します。

## セットアップ

Gurobi のインストールとライセンス設定は Gurobi 公式の Software Installation Guide に従ってください。tar.gz を展開した後、以下の標準環境変数を設定します (Linux x86_64 の場合):

```sh
export GUROBI_HOME="$HOME/gurobi1301/linux64"
export PATH="${PATH}:${GUROBI_HOME}/bin"
export LD_LIBRARY_PATH="${LD_LIBRARY_PATH}:${GUROBI_HOME}/lib"
export CPLUS_INCLUDE_PATH="${CPLUS_INCLUDE_PATH}:${GUROBI_HOME}/include"
```

ビルド (qbpp の他のサンプルと同じく、リンクは `-ldl -pthread` のみ):
```sh
g++ -std=c++17 your_program.cpp -o your_program -ldl -pthread
```

`qbpp::GurobiSolver` は `libgurobi<MAJOR><MINOR>.so` を `dlopen` で遅延ロードするため、リンク時に `-lgurobi*` は不要です。**`$GUROBI_HOME/src/build` で `make` を実行する必要もありません** — Gurobi の C++ ラッパ層は使用しません。qbpp 自身も `dlopen` で `qbpp_*.so` をロードするため `-lqbpp` は不要です。

ARM64 Linux では `linux64` を `armlinux64` に置き換えます。
