---
last_modified: 2026-10-19
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
事前に `simplify_as_binary()` を呼び出してバイナリ式として簡約化しておく必要があります（整数変数だけの式は `simplify()` で簡約します）。
この関数は与えられた式 `f` を解探索中に使用される内部フォーマットに変換します。
コンストラクタは式をホストメモリにロードします。以降 `search()` を複数回呼び出してもこのロードは1度きりなので、同じ式に対して繰り返し探索する際のオーバーヘッドがありません。

## 探索パラメータの設定
探索パラメータは `search()` メソッドにキーワード引数として直接渡します。
以下のパラメータが利用可能です:

| パラメータ | 型 | 説明 | デフォルト |
|---|---|---|---|
| `time_limit` | float | 制限時間（秒）。`0` で時間制限なし。 | `10.0` |
| `target_energy` | int | 目標エネルギー。この値以下の解が見つかると探索を終了します。`cons()` で制約を宣言したモデルでは、全制約の充足も停止の条件（[ソルバーごとの対応と意味論](CONSTRAINTS#ソルバーごとの対応と意味論)）。 | （なし） |
| `enable_default_callback` | int (0 または 1) | `1` に設定すると、新たに得られた最良解のエネルギーとTTSを自動的に出力します。 | `0` |
| `topk_sols` | int | 保持するtop-k解の数。 | （無効） |
| `best_energy_sols` | int | 最良エネルギーの解を保持。`0` で無制限。 | （無効） |
| `thread_count` | int | 探索に使う CPU スレッド数。 | （自動） |
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
f = 0
for d in range(1, size):
    temp = 0
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
f = 0
for d in range(1, size):
    temp = 0
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

## カスタムコールバック

組み込みコールバック（`enable_default_callback=1` で有効化）は、新しい最良解が見つかるたびにエネルギーとTTSを出力するだけです。
探索の途中で最良解を受け取って処理したい場合は、[ABS3 Solver](ABS3#カスタムコールバック) と同じ方法でカスタムコールバックを使えます。

1. **関数を登録する** — `solver.set_callback(fn)`。`fn` はソルバー自身を引数として `fn(solver)` の形で呼ばれます
2. **サブクラス化する** — `EasySolver` を継承して `callback()` メソッド（引数なし）をオーバーライドします

両方を指定した場合はオーバーライドが優先されます。両方を実行したい場合は、オーバーライドの中で `super().callback()` を呼んでください。

コールバックは以下のイベントのいずれかで呼び出されます:

| イベント値 | 名前 | 説明 |
|:-:|----|----|
| `0` | `Start` | `search()` の開始時に1回呼び出されます（`best_sol()` は探索の出発点の解） |
| `1` | `BestUpdated` | 新しい最良解が見つかるたびに呼び出されます |
| `2` | `Timer` | `timer()` で設定した間隔で、その時点の最良解とともに呼び出されます |

コールバックの中（および登録した関数が受け取ったソルバー `s` に対して）では、以下のメソッドが利用可能です:
- **`s.event()`** — コールバックを発火したイベント。`qbpp.CallbackEvent.Start` などと比較できます
- **`s.best_sol()`** — 最良解を返します。`.energy`, `.tts`, `.get(var)` などが使用できます
- **`s.timer(seconds)`** — `Timer` イベントの間隔を秒単位で設定します。`0` で無効になります。呼ばなければ間隔は変わりません
- **`s.hint(sol)`** — 解 `sol` をヒント解としてソルバーに渡します（下記[ヒント解を渡す](#ヒント解を渡す)を参照）。別のスレッドからも呼べます
- **`s.terminate()`** — 現在の探索を協調的に中断し、これまでの最良解で `search()` を終わらせます。別のスレッドからも呼べます。同じインスタンスで再び `search()` を呼ぶと、停止の指示は自動的に解除されます

以下のプログラムは、最良解が更新されるたびにエネルギーとTTSを表示し、1秒ごとにその時点の最良エネルギーを表示します。
エネルギーが 0 になったら `terminate()` で探索を終えます。

```python
import pyqbpp as qbpp

def on_event(s):
    if s.event() == qbpp.CallbackEvent.Start:
        s.timer(1.0)          # 1秒ごとのタイマーを有効化
    elif s.event() == qbpp.CallbackEvent.BestUpdated:
        sol = s.best_sol()
        print(f"New best: energy={sol.energy} TTS={sol.tts:.3f}s")
        if sol.energy == 0:
            s.terminate()
    elif s.event() == qbpp.CallbackEvent.Timer:
        print(f"Timer: energy={s.best_sol().energy}")

x = qbpp.var("x", shape=20)
f = qbpp.sqr(qbpp.sum(x) - 10)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
solver.set_callback(on_event)
sol = solver.search(time_limit=10)
print(f"energy={sol.energy}")
```

登録を解除するには `solver.set_callback(None)` を呼びます。
サブクラス化の例は [ABS3 Solver のページ](ABS3#方法2-サブクラス化する) を参照してください（`ABS3Solver` を `EasySolver` に読み替えます）。

### ヒント解を渡す

`hint(sol)` は、別の方法で求めた解などを、ヒント解としてソルバーに渡します。
`sol` には同じ式の解（`qbpp.Sol(f)` で作って値を設定した解や、コールバックの `best_sol()`）を渡します。

- **探索中**（コールバックの中、または別のスレッド）に呼ぶと、その解が実行中の探索に渡されます。探索はその解からも続けられ、`search()` は渡した解より悪い解を返しません。渡した解がそれまでの最良解より良ければ、`BestUpdated` イベントで最良解の更新が通知されます
- **探索の前**に呼ぶと、次の `search()` の出発点になります（使われるのは次の 1 回だけです）。`search()` の `hint=` 引数でヒント解を渡した場合は、そちらが優先されます

整数変数を含む式でも同じように使えます（整数変数の値も渡されます）。

以下のプログラムは 0-1 ナップサック問題を解きます。
貪欲法（価値/重さの大きい順に詰める）で求めた解を 0.5 秒ごとの `Timer` イベントで最良解と比べ、貪欲法の解のほうが良ければ `hint()` で探索に渡します。

```python
import pyqbpp as qbpp

# 0-1 ナップサック: 容量を超えない範囲で価値の合計を最大化する
n = 1000
w = [10 + i * 37 % 51 for i in range(n)]
v = [10 + i * 53 % 91 for i in range(n)]
cap = sum(w) // 4
x = qbpp.var("x", shape=n)
f = -qbpp.sum(qbpp.array(v) * x) + 100 * qbpp.cons(qbpp.sum(qbpp.array(w) * x) <= cap)
f.simplify_as_binary()

# 貪欲法: 価値/重さの大きい順に、入るものを詰める
greedy = qbpp.Sol(f)
rest = cap
for i in sorted(range(n), key=lambda i: -v[i] / w[i]):
    if w[i] <= rest:
        greedy.set(x[i], 1)
        rest -= w[i]
greedy_energy = f(greedy)
print(f"greedy: energy={greedy_energy}")


def on_event(s):
    if s.event() == qbpp.CallbackEvent.Start:
        s.timer(0.5)
    elif s.event() == qbpp.CallbackEvent.Timer:
        # 貪欲法の解のほうが良ければ探索に渡す
        if greedy_energy < s.best_sol().energy:
            s.hint(greedy)


solver = qbpp.EasySolver(f)
solver.set_callback(on_event)
sol = solver.search(time_limit=2)
print(f"no worse than greedy: {'yes' if sol.energy <= greedy_energy else 'no'}")
```

このプログラムの出力は次のとおりです。
```
greedy: energy=-26934
no worse than greedy: yes
```
