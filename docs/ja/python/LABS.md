---
layout: default
nav_exclude: true
title: "LABS Problem"
nav_order: 72
lang: ja
hreflang_alt: "en/python/LABS"
hreflang_lang: "en"
---

# 低自己相関バイナリ列 (LABS) 問題

**低自己相関バイナリ列 (Low Autocorrelation Binary Sequence, LABS)** 問題は、自己相関を最小化するスピン列 $S=(s_i)$ ($s_i=\pm 1, 0\leq i\leq n-1$) を見つけることを目的とします。
アラインメント $d$ における $S$ の自己相関は次のように定義されます：

$$
\left(\sum_{i=0}^{n-d-1}s_is_{i+d}\right)^2
$$


LABSの目的関数は、すべてのアラインメントにわたるこれらの自己相関の和です：

$$
\begin{aligned}
\text{LABS}(S) &= \sum_{d=1}^{n-1}\left(\sum_{i=0}^{n-d-1}s_is_{i+d}\right)^2
\end{aligned}
$$

LABS問題は $\text{LABS}(S)$ を最小化する列 $S$ を見つける問題です。

## スピンからバイナリへの変換
PyQBPPに同梱されているソルバーはスピン変数を直接サポートしていないため、以下の変換を用いてスピン変数をバイナリ変数に変換します：

$$
\begin{aligned}
 s_i &\leftarrow 2s_i - 1
\end{aligned}
$$

この変換の後、各 $s_i$ はバイナリ変数として扱うことができ、バイナリ変数用のHUBOソルバーを使用して $\text{LABS}(S)$ の解を求めることができます。

PyQBPPではこの変換を `spin_to_binary()` 関数を通じて提供しています。

## LABSのPyQBPPプログラム
以下のPyQBPPプログラムはLABS問題を定式化し、求解します：
{% raw %}
```python
import pyqbpp as qbpp

n = 30

s = qbpp.var("s", shape=n)
labs = qbpp.expr()
for d in range(1, n):
    temp = qbpp.expr()
    for i in range(n - d):
        temp += s[i] * s[i + d]
    labs += qbpp.sqr(temp)

labs.spin_to_binary()
labs.simplify_as_binary()

solver = qbpp.ABS3Solver(labs)
result = solver.search(time_limit=10.0, best_energy_sols=0)
for i, sol in enumerate(result.sols):
    bits = "".join("+" if sol(s[j]) == 1 else "-" for j in range(n))
    print(f"{i}: LABS = {sol.energy} : {bits}")
```
{% endraw %}
このプログラムでは、`s` に `n` 個の変数のベクトルが格納されます。
式 `labs` はネストされたループを使用して構築され、LABSの目的関数の数学的定義に直接従っています。

その後、`labs` は `spin_to_binary()` 関数によりバイナリ変数上の式に変換され、`simplify_as_binary()` により簡略化されます。

次に、ABS3 Solver が時間制限10秒で実行されます。
`best_energy_sols` が `0`（最良エネルギーの解をすべて保持）に設定されているため、最小エネルギーを達成するすべての解が `result.sols` に格納されます。

`result.sols` に対する `for` ループを使用して、最良エネルギーのすべての解が表示されます。
このプログラムの典型的な出力は以下のとおりです：
```
0: LABS = 59 : -----+++++-++-++-+-+-+++--+++-
1: LABS = 59 : -+-++-+-+---+++-------+--++-++
2: LABS = 59 : -+-+--+-+---+++-------+--++-++
3: LABS = 59 : +-+-++-+-+++---+++++++-++--+--
4: LABS = 59 : --+--++-+++++++---+++-+-++-+-+
5: LABS = 59 : ----++++++-++-++-+-+-+++--+++-
6: LABS = 59 : +-+--+-+-+++---+++++++-++--+--
7: LABS = 59 : ++-++--+-------+++---+-+-++-+-
8: LABS = 59 : -+++--+++-+-+-++-++-++++++----
9: LABS = 59 : +---++---+-+-+--+--+-----+++++
```
この実行では、同じ最小LABS値を達成する複数の解が得られています。
