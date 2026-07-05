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
**Easy Solver**はQUBO/HUBO式のためのヒューリスティックソルバーです。

Easy Solverを使って問題を解くには、以下の2つのステップで行います:
1. 解きたい式に対して **`EasySolver`** オブジェクトを作成します。
2. キーワード引数を渡して **`search()`** メソッドを呼び出し、解を探索します。見つかった最良解が返されます。

## Easy Solverオブジェクトの作成
Easy Solverを使用するには、以下のように式を引数として `EasySolver` オブジェクトを構築します:
- **`EasySolver(f)`**

ここで、`f` は解くべき式です。
事前に `simplify_as_binary()` を呼び出してバイナリ式として簡約化しておく必要があります。
この関数は与えられた式 `f` を解探索中に使用される内部フォーマットに変換します。
コンストラクタは式をホストメモリにロードします。以降 `search()` を複数回呼び出してもこのロードは1度きりなので、同じ式に対して繰り返し探索する際のオーバーヘッドがありません。

## 探索パラメータの設定
探索パラメータは `search()` メソッドにキーワード引数として直接渡します。
以下のパラメータが利用可能です:

| パラメータ | 型 | 説明 | デフォルト |
|---|---|---|---|
| `time_limit` | float | 制限時間（秒）。`0` で時間制限なし。 | `10.0` |
| `target_energy` | int | 目標エネルギー。この値以下の解が見つかると探索を終了します。 | （なし） |
| `enable_default_callback` | int (0 または 1) | `1` に設定すると、新たに得られた最良解のエネルギーとTTSを自動的に出力します。 | `0` |
| `topk_sols` | int | 保持するtop-k解の数。 | （無効） |
| `best_energy_sols` | int | 最良エネルギーの解を保持。`0` で無制限。 | （無効） |
| `seed` | int | 乱数シード。初期解や提案に使う乱数列を固定します。完全な実行再現は直列構成（例: `thread_count=1`）でのみ保証され、多スレッドではタイミングの非決定性が残ります。 | `0`（非決定） |

パラメータは `search()` にキーワード引数として渡します:
```python
sol = solver.search(time_limit=5.0, target_energy=900, enable_default_callback=1)
```

未知のパラメータキーを指定するとランタイムエラーが発生します。

## 解の探索
Easy Solverは、**`search()`** メソッドを呼び出すことで解を探索します。必要に応じてパラメータをキーワード引数として渡すことができます。
このメソッドは、見つかった最良解を返します。返される解は `sol.energy`（エネルギー値）、`sol(x)`（変数値の取得）、`sol.info`（ソルバー情報の辞書）などを提供します。詳細は [QR_SOLUTION](QR_SOLUTION) を参照してください。

## プログラム例
以下のプログラムは、Easy Solverを使用してLow Autocorrelation Binary Sequences (LABS)問題の解を探索します:
```python
import pyqbpp as qbpp

size = 100
x = qbpp.var("x", shape=size)
f = qbpp.expr()
for d in range(1, size):
    temp = qbpp.expr()
    for i in range(size - d):
        temp += (2 * x[i] - 1) * (2 * x[i + d] - 1)
    f += qbpp.sqr(temp)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=5.0, target_energy=900, enable_default_callback=1)
bits = "".join("-" if v == 0 else "+" for v in sol(x))
print(f"{sol.energy}: {bits}")
```
この例では、以下のパラメータが `search()` に渡されています:
- 制限時間5.0秒、
- 目標エネルギー900、
- デフォルトコールバック有効。

したがって、ソルバーは経過時間が5.0秒に達するか、エネルギーが900以下の解が見つかると終了します。

例えば、このプログラムは以下のような出力を生成します:
{% raw %}
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
{% endraw %}

## 高度な使い方

### 複数のtop-k解の保持
Easy Solverは探索中に見つかった**複数のtop-k解**を保持できます。
この機能を有効にするには、`topk_sols` パラメータを設定します。

このパラメータが設定されると、`search()` が返す解は保持されたtop-k解も保持します。
これらは以下のプロパティや操作でアクセスできます:
- **`sol.sols`**: 保持されている解のリスト（エネルギーの昇順）。
- **`sol.sols[i]`**: `i` 番目の解を返します。
- **`len(sol.sols)`**: 保持されている解の数。

以下のプログラムは、Easy Solverを使用してLABS問題を解きます。
`topk_sols` を `20` に設定しているため、ソルバーは**最大20個のtop-k解**を保持します。
プログラムはrange-based forループを使用して各保持解を出力します。
```python
import pyqbpp as qbpp

size = 20
x = qbpp.var("x", shape=size)
f = qbpp.expr()
for d in range(1, size):
    temp = qbpp.expr()
    for i in range(size - d):
        temp += (2 * x[i] - 1) * (2 * x[i + d] - 1)
    f += qbpp.sqr(temp)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=5.0, topk_sols=20)
for s in sol.sols:
    bits = "".join("-" if v == 0 else "+" for v in s(x))
    print(f"{s.energy}: {bits}")
```
このプログラムは以下のような出力を表示します:
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
したがって、上記のプログラムでこの機能を有効にするには、`topk_sols` を `best_energy_sols` に置き換えます:
```python
sol = solver.search(time_limit=5.0, best_energy_sols=0)  # 無制限
```
このパラメータが設定された場合、ソルバーは見つかった最良エネルギーと等しいエネルギーの解のみを保持します。
結果として得られるプログラムは、すべて最良エネルギー値26を持つ以下の解を生成します:
```
26: +++++-+---+-++---++-
26: ++--+--++++-++++-+-+
26: -+-+----+----++-++--
26: +-+-++++-++++--+--++
26: -++---++-+---+-+++++
26: --++-++----+----+-+-
```
