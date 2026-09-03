---
last_modified: 2026-09-03
layout: default
nav_exclude: true
title: "ABS2 Solver (unofficial)"
nav_order: 54
lang: ja
hreflang_alt: "en/ABS2"
hreflang_lang: "en"
---

# ABS2 Solver (unofficial)

> **非公式機能です。** 予告なく変更・削除される可能性があり、公開を中断する
> こともあります。性能は保証しません。

ABS2 は ABS3 より前に開発された GPU 専用の QUBO ソルバーです。
**密な QUBO 問題では ABS3 を上回る場合があります**。

## インストール

ABS2 は QUBO++ 本体とは**別配布のプラグイン**です。QUBO++ を入れただけでは
使えません。本体（[インストール](INSTALL)）を先に導入してください。

### 方法1: APT（推奨）

QUBO++ 本体と同じリポジトリから入ります。C++ と Python のどちらからも
使えるようになります。

```bash
sudo apt update
sudo apt install qbpp-abs2
```

### 方法2: pip

PyQBPP を pip で導入している場合はこちらでも入ります（Python 専用）。

```bash
pip install pyqbpp-abs2
```

### 方法3: tar.gz

[**Latest Releases**](https://github.com/qubo-plus/qbpp/releases/latest) から
`qbpp-abs2_<arch>_<version>.tar.gz` をダウンロードし、展開して得られる
`lib/` の中身を **QUBO++ の共有ライブラリと同じディレクトリ**
（APT なら `/usr/lib/qbpp`、tar.gz なら `$QBPP_PATH/lib`）に置きます。

```bash
tar xf qbpp-abs2_<arch>_<version>.tar.gz
sudo cp abs2_plugin_<arch>/lib/*.so /usr/lib/qbpp/
sudo ldconfig
```

次の 3 種類が**同じディレクトリに揃っている**必要があります。

```
libabs2.so
libabs2c.so
qubo<n>_<w>_<d>.so
```

### 確認

導入できていれば、次のプログラムが解を表示します。

{% raw %}
```cpp
#include <qbpp/abs2_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 8);
  auto f = qbpp::simplify_as_binary(-x[0] - x[1] - x[2]);
  qbpp::ABS2Solver solver(f);
  std::cout << solver.search(qbpp::Params{{"time_limit", 1}}).energy()
            << std::endl;
}
```
{% endraw %}

未導入のまま使うと、その旨を伝えるエラーになります。

## 使い方

`qbpp::ABS2Solver` は `ABS3Solver` と同じ形で使います。

{% raw %}
```cpp
#include <qbpp/abs2_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 100);
  qbpp::Expr f;
  for (int i = 0; i < 100; ++i)
    for (int j = i + 1; j < 100; ++j)
      f += ((i * 7 + j * 13) % 21 - 10) * x[i] * x[j];
  f = qbpp::simplify_as_binary(f);

  qbpp::ABS2Solver solver(f);
  auto sol = solver.search(qbpp::Params{{"time_limit", 10}});
  std::cout << "energy = " << sol.energy() << std::endl;
}
```
{% endraw %}

コンパイルは他のソルバーと同じです。

```bash
g++ -O3 -std=c++17 -Wall -Wextra -Wfloat-conversion sample.cpp -o sample -ldl -pthread
```

## GPU の指定

コンストラクタの第 2 引数で使用する GPU の枚数を指定します
（既定は `-1` = 全 GPU）。ABS2 に CPU 経路はないため `0` は指定できません。

```cpp
qbpp::ABS2Solver solver(f, 2);  // GPU 2 枚を使う
```

ソルバーの構築時に GPU の初期化と行列の転送まで済ませ、`search()` は
探索だけを行います。同じソルバーに対して `search()` を繰り返し呼べます
（呼び出しごとに新しい探索になります）。

## 探索パラメータ

| パラメータ | 説明 |
|---|---|
| `time_limit` | 探索時間（秒） |
| `target_energy` | この値以下に到達したら終了する |

上記以外のパラメータを渡すとエラーになります。
GPU の枚数はコンストラクタで決まるため、`search()` では指定できません。

## 制限

ABS2 は QUBO 専用です。以下はいずれも明示的なエラーになります。

| 制限 | 対処 |
|---|---|
| QUBO のみ（3 次以上は不可） | `qbpp::reduce()` で 2 次化する |
| `qbpp::cons()` は使えない | `qbpp::expand_cons()` でペナルティ式に展開する |
| 整数変数（`qbpp::int_var()`）は使えない | バイナリ変数で表現する |
| 係数・エネルギーは 32 ビット整数の範囲 | 行列と演算の幅は係数から自動選択される |
| GPU が必須 | CPU で解く場合は `EasySolver` を使う |
| 変数数は **16384** まで（同梱しているカーネルの最大サイズ） | 超えると明示エラー |

また、乱数シードを指定できないため、実行するたびに結果が変わります。

## どの問題に向くか

ABS2 は現在の解とその差分をスレッドのレジスタに保持する構造のため、
**密な QUBO 問題**に強みがあります。一方、疎な問題や大規模な問題では
`EasySolver` や `ABS3Solver` の方が高速です。

たとえば N-Queens（密度が変数数に反比例する疎な問題）では、
変数数が増えるほど ABS3 との差が開きます。適用する問題の密度を目安に
選択してください。
