---
last_modified: 2026-09-03
layout: default
nav_exclude: true
title: "ABS2 Solver (unofficial)"
nav_order: 54
lang: ja
hreflang_alt: "en/python/ABS2"
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

置かれるのは次の 1 ファイルだけです。

```
abs2_c32e32.so
```

### 確認

導入できていれば、次のプログラムが解を表示します。

```python
import pyqbpp.c32e64 as qbpp

x = qbpp.var("x", 8)
f = qbpp.simplify_as_binary(-x[0] - x[1] - x[2])
print(qbpp.ABS2Solver(f).search(time_limit=1).energy)
```

未導入のまま使うと、その旨を伝えるエラーになります。

## 使い方

`qbpp.ABS2Solver` は `ABS3Solver` と同じ形で使います。

```python
import pyqbpp.c32e64 as qbpp

x = qbpp.var("x", 100)
f = qbpp.expr()
for i in range(100):
    for j in range(i + 1, 100):
        f += ((i * 7 + j * 13) % 21 - 10) * x[i] * x[j]
f = qbpp.simplify_as_binary(f)

solver = qbpp.ABS2Solver(f)
sol = solver.search(time_limit=10)
print("energy =", sol.energy)
```

## GPU の指定

コンストラクタの `gpu` 引数で使用する GPU の枚数を指定します
（既定は `-1` = 全 GPU）。ABS2 に CPU 経路はないため `0` は指定できません。

```python
solver = qbpp.ABS2Solver(f, gpu=2)   # GPU 2 枚を使う
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

## カスタムコールバック

`ABS3Solver` と同じ 2 通りの方法が使えます。

1. **関数を登録する** — `solver.set_callback(fn)`。`fn` はソルバー自身を
   引数として呼ばれるので、継承は不要です
2. **サブクラス化する** — `ABS2Solver` を継承して `callback()` を
   オーバーライドします

両方を指定した場合はオーバーライドが優先されます。両方を実行したい場合は、
オーバーライドの中で `super().callback()` を呼んでください。

| イベント | 説明 |
|---|---|
| `CallbackEvent.Start` | `search()` の開始時に 1 回呼ばれる |
| `CallbackEvent.BestUpdated` | 最良解が更新されるたびに呼ばれる |
| `CallbackEvent.Timer` | `timer(seconds)` で設定した周期で呼ばれる |

コールバック内では `best_sol()`、`event()`、`timer(seconds)`、`hint(sol)`、
`terminate()` が使えます。`Timer` は既定では無効なので、通常は `Start` の
中で `timer()` を 1 回呼びます。

{% raw %}
```python
import pyqbpp.c32e64 as qbpp

x = qbpp.var("x", 8)
f = qbpp.simplify_as_binary(qbpp.sqr(qbpp.sum(x) - 4))

solver = qbpp.ABS2Solver(f)


def on_event(s):
    if s.event() == qbpp.CallbackEvent.BestUpdated:
        print("New best:", s.best_sol().energy)


solver.set_callback(on_event)
sol = solver.search(time_limit=5)
print("energy =", sol.energy)
```
{% endraw %}

## 制限

ABS2 は QUBO 専用です。以下はいずれも明示的なエラーになります。

| 制限 | 対処 |
|---|---|
| QUBO のみ（3 次以上は不可） | `qbpp.reduce()` で 2 次化する |
| `qbpp.cons()` は使えない | `qbpp.expand_cons()` でペナルティ式に展開する |
| 整数変数（`qbpp.int_var()`）は使えない | バイナリ変数で表現する |
| 係数は 64 ビット整数の範囲 | 行列と演算の幅は係数から自動選択される。範囲を超えるとエラー（`cpp_int` などの型から呼んだ場合） |
| GPU が必須 | CPU で解く場合は `EasySolver` を使う |
| 変数数は **65536** まで（同梱しているカーネルの最大サイズ） | 超えると明示エラー |

また、乱数シードを指定できないため、実行するたびに結果が変わります。

ABS2 は QUBO を**密行列**として GPU に載せるため、必要な GPU メモリは
変数数の 2 乗（1 GPU あたり n² × 4 バイト）で効きます。目安は次のとおりです。

| 変数数 | GPU メモリ |
|---|---|
| 8192 | 0.25 GB |
| 16384 | 1 GB |
| 32768 | 4 GB |
| 65536 | 16 GB |

問題の変数数以上で最小のカーネルが選ばれるので、小さい問題がこの代価を
払うことはありません。

## どの問題に向くか

ABS2 は現在の解とその差分をスレッドのレジスタに保持する構造のため、
**密な QUBO 問題**に強みがあります。一方、疎な問題や大規模な問題では
`EasySolver` や `ABS3Solver` の方が高速です。

たとえば N-Queens（密度が変数数に反比例する疎な問題）では、
変数数が増えるほど ABS3 との差が開きます。適用する問題の密度を目安に
選択してください。
