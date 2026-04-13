---
layout: default
nav_exclude: true
title: "Easy Solver"
nav_order: 19
lang: ja
hreflang_alt: "en/python/EASYSOLVER"
hreflang_lang: "en"
---

# Easy Solverの使い方
**Easy Solver**は、QUBO/HUBO式に対するヒューリスティックソルバーです。

Easy Solverで問題を解くには、以下の2つのステップで行います:
1. **`EasySolver`** オブジェクトを作成する。
2. キーワード引数を渡して **`search()`** メソッドを呼び出し、解を探索する。このメソッドは **`Sol`** オブジェクトを返す。

## Easy Solverオブジェクトの作成
Easy Solverを使用するには、以下のように式を引数として `EasySolver` オブジェクトを作成します:
- **`EasySolver(f)`**

ここで、`f` は解くべき式です。
事前に `simplify_as_binary()` を呼び出してバイナリ式として簡約化しておく必要があります。

## 探索パラメータ
パラメータは **`search()`** メソッドにキーワード引数として渡します。**`callback()`** メソッドのみ、`search()` の前にソルバーオブジェクトに対して別途呼び出します。

| パラメータ | 説明 | デフォルト |
|---|---|---|
| `time_limit` | 制限時間（秒、float）。0で時間制限なし。 | 10.0 |
| `target_energy` | 目標エネルギー（int）。この値以下の解が見つかると探索を終了。 | （なし） |
| `topk_sols` | 保持するtop-k解の数（int）。 | （無効） |
| `best_energy_sols` | 最良エネルギーの解を保持（int）。`0` で無制限。 | （無効） |
| `enable_default_callback` | 新たに得られた最良解を出力（int、`1` で有効）。 | （無効） |

**`callback(func)`** メソッドは、新しい最良解が見つかったときに呼び出されるコールバック関数を設定します。`energy`（int）と `tts`（float）を受け取ります。

未知のパラメータキーを設定するとランタイムエラーが発生します。

## 解の探索
Easy Solverは **`search()`** にキーワード引数を渡すことで解を探索します。このメソッドは **`Sol`** オブジェクトを返します。

### 複数解の取得
`topk_sols` を指定した場合、ソルバーは探索中に見つかったエネルギーが最良の解を最大 `n` 個収集します。
返された `Sol` に対して **`sol.sols`** を呼び出すことで、エネルギーの昇順にソートされた `Sol` オブジェクトのリストを取得できます。

```python
solver = qbpp.EasySolver(f)
sol = solver.search(topk_sols=5)
for s in sol.sols:
    print(f"energy = {s.energy}")
```

## プログラム例
以下のプログラムは、Easy Solverを使用して
**Low Autocorrelation Binary Sequences (LABS)** 問題の解を探索します:
```python
import pyqbpp as qbpp

size = 100
x = qbpp.var("x", size)
f = qbpp.expr()
for d in range(1, size):
    temp = qbpp.expr()
    for i in range(size - d):
        temp += (2 * x[i] - 1) * (2 * x[i + d] - 1)
    f += qbpp.sqr(temp)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=5.0, target_energy=900, enable_default_callback=1)
bits = "".join("-" if sol(x[i]) == 0 else "+" for i in range(size))
print(f"{sol.energy}: {bits}")
```
この例では、以下のオプションが設定されています:
- 制限時間5.0秒、
- 目標エネルギー900、
- 新しい最良解が見つかるたびにエネルギーとTTSを表示するコールバック。

したがって、ソルバーは経過時間が5.0秒に達するか、
エネルギーが900以下の解が見つかると終了します。

例えば、このプログラムは以下のような出力を生成します:
{% raw %}
```
TTS = 0.000s Energy = 300162
TTS = 0.000s Energy = 273350
...
TTS = 2.691s Energy = 898
898: ++-++-----+--+--++++++---++-+-+--++-------++-++-+-+-+-+-++-++++-++-+++++-+-+--++++++---+++--+++---++
```
{% endraw %}
