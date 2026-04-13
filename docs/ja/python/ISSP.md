---
layout: default
nav_exclude: true
title: "Interval Subset Sum"
nav_order: 75
lang: ja
hreflang_alt: "en/python/ISSP"
hreflang_lang: "en"
---

# 区間部分和問題 (ISSP)
**区間部分和問題 (Interval Subset Sum Problem, ISSP)** は**部分和問題**の一般化です。
$n$ 個の整数**区間 $[l_i, u_i]$** $(0\leq i\leq n-1)$ と**上限 $T$** が与えられたとき、整数値

$$
\begin{aligned}
v_i &\in \lbrace 0\rbrace \cup [l_i, u_i] && (i = 0,1,\dots,n-1)
\end{aligned}
$$

を選び、制約

$$
\begin{aligned}
 \sum_{i=0}^{n-1} v_i \leq T
\end{aligned}
$$

を満たしつつ、目的関数

$$
\begin{aligned}
 \sum_{i=0}^{n-1} v_i
\end{aligned}
$$

を最大化することが目標です。

## ISSPのHUBO定式化
整数変数はバイナリ符号化を用いて複数のバイナリ変数で表現できます。
PyQBPPでは、`var(..., between=)` を使って整数変数を簡単に定義できます。

$v_i$ $(0\leq i\leq n-1)$ を $[l_i, u_i]$ の値をとる整数変数とします。
また、区間 $i$ が選択されるときかつそのときに限り $s_i=1$ となるバイナリ変数 $s_i$ $(0\leq i\leq n-1)$ を導入します。

ISSPをモデル化するために、選択された値として積 $s_i v_i$ を使用します：

$$
\begin{aligned}
s_iv_i &= 0 && \text{if } s_i= 0\\
       &\in [l_i,u_i] && \text{if } s_i= 1
\end{aligned}
$$

次を定義します：

$$
\begin{aligned}
\text{sum} &= \sum_{i=0}^{n-1} s_i v_i .
\end{aligned}
$$

PyQBPPでは、この不等式制約をペナルティ項で課します：

$$
\begin{aligned}
 \text{constraint} &= \sum_{i=0}^{n-1} \bigr(0\leq s_iv_i \leq T\bigl) \\
                &= (T-\sum_{i=0}^{n-1} s_iv_i)^2
\end{aligned}
$$

$s_i v_i$ はバイナリ変数の2次式であるため、$\text{sum}$ は2次、$\text{constraint}$ は4次になります。

ISSPは上限 $T$ のもとで和を最大化するため、負の和を最小化します：

$$
\begin{aligned}
 \text{objective} &= -\sum_{i=0}^{n-1} s_iv_i
\end{aligned}
$$

最後に、目的関数と制約ペナルティを単一のHUBO関数にまとめます：

$$
\begin{aligned}
f &= \text{objective} + P\times\text{constraint},
\end{aligned}
$$

ここで $P$ は実行可能性を優先するための十分大きな定数です。

## HUBO定式化のPyQBPPプログラム
以下のPyQBPPプログラムは、8個の区間を持つISSPインスタンスを解きます。
下限と上限 $[l_i,u_i]$ はリスト `lower` と `upper` に格納され、$T=100$ です。

```python
import pyqbpp as qbpp

lower = [18, 17, 21, 18, 20, 14, 14, 23]
upper = [19, 17, 22, 19, 20, 16, 15, 25]
T = 100
n = len(lower)

v = [qbpp.var(f"v{i}", between=(lower[i], upper[i])) for i in range(n)]
s = qbpp.var("s", n)

total = qbpp.sum(v * s)
constraint = qbpp.constrain(total, between=(0, T))
f = -total + 1000 * constraint
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=-T)
for i in range(n):
    if sol(s[i]) == 1:
        print(f"Interval {i}: val = {sol(v[i])}")
print(f"sum = {sol(total)}")
```

まず、各 `v[i]` が `[lower[i], upper[i]]` の整数値をとる整数変数のリスト `v` を定義します。
また、`s[i] = 1` が区間 `i` が選択されることを意味するバイナリ変数の配列 `s` を定義します。
式 `total` は $\sum_i v_i s_i$ を表します。

不等式制約 `between(total, 0, T)` は `constraint` に格納されます。PyQBPPでは、このような制約は内部的に非負のペナルティ項に変換され、制約が満たされると0になります。

最後に、HUBO目的関数 `f` を `f = -total + P * constraint`（この例では `P = 1000`）として構築します。
`f` を最小化することで、制約違反に大きなペナルティを課しつつ `total` を最大化します。

ターゲットエネルギーを `-T` に設定するのは、ソルバーが `total = T` の実行可能解を見つけた場合、ペナルティ項が0になり目的関数項が `-T` になる、すなわち大域最小値が `-T` に達するためです。

得られた解について、選択された区間とその値が表示されます。例えば：
```
Interval 0: val = 18
Interval 1: val = 17
Interval 2: val = 22
Interval 4: val = 20
Interval 7: val = 23
sum = 100
```
この出力は、最大可能な `sum` ($=T$) を達成する実行可能解が得られたことを確認しています。

## ISSPのQUBO定式化
上記のHUBO定式化は積 $s_i v_i$ を使用するため4次項を含みます。
補助整数変数を導入することで4次項を避けることができます。

$a_i$ $(0\leq i\leq n-1)$ を $[0,\, u_i-l_i]$ の値をとる整数変数とします。
また、区間 $i$ が選択されるときかつそのときに限り $s_i=1$ となるバイナリ変数 $s_i$ $(0\leq i\leq n-1)$ を使用します。

次を定義します：

$$
\begin{aligned}
  v_i &= l_is_i + a_i && (0\leq i\leq n-1) \\
\end{aligned}
$$

$s_i=0$ のときに $v_i$ が0になることを保証するため、否定リテラル $\overline{s_i}$ を用いた次のペナルティ項を追加します：

$$
\begin{aligned}
  \text{constraint1} &= \sum_{i=0}^{n-1}\sum_j \overline{s_i}\,a_i
\end{aligned}
$$

$a_i \ge 0$ かつ $\overline{s_i} \ge 0$ であるため、$\text{constraint1}\ge 0$ が成り立ちます。
さらに、$s_i=0$ のときに $a_i=0$ であるときかつそのときに限り $\text{constraint1}=0$ が成り立ちます。
したがって、選択された値 $v_i$ は次を満たします：

$$
\begin{aligned}
  v_i & = 0 && \text{if } s_i=0,\\
      & \in  [l_i,u_i] &&\text{if } s_i=1.
\end{aligned}
$$

$s_i=1$ のとき $v_i = l_i + a_i$ かつ $a_i \in [0,u_i-l_i]$ であるためです。

次を定義します：

$$
\begin{aligned}
\text{sum} &= \sum_{i=0}^{n-1} v_i.
\end{aligned}
$$

ISSPの制約は：

$$
\begin{aligned}
 \text{constraint2} &= \sum_{i=0}^{n-1} \bigr(0\leq v_i \leq T\bigl) \\
                &= (T-\sum_{i=0}^{n-1} v_i)^2
\end{aligned}
$$

最後に、ISSPは上限 $T$ のもとで $\text{sum}$ を最大化するため、次を最小化します：

$$
\begin{aligned}
 \text{objective} &= -\sum_{i=0}^{n-1} v_i
\end{aligned}
$$

目的関数とペナルティを組み合わせて、QUBO式を得ます：

$$
\begin{aligned}
f &= \text{objective} + P\times(\text{constraint1}+\text{constraint2}),
\end{aligned}
$$

ここで $P$ は実行可能性を優先するための十分大きな定数です。

## QUBO定式化のPyQBPPプログラム
以下のPyQBPPプログラムは、QUBO定式化を用いて同じISSPインスタンスを解きます：

```python
import pyqbpp as qbpp

lower = [18, 17, 21, 18, 20, 14, 14, 23]
upper = [19, 17, 22, 19, 20, 16, 15, 25]
T = 100
n = len(lower)

a = [qbpp.var(f"a{i}", between=(0, upper[i] - lower[i])) for i in range(n)]
s = qbpp.var("s", n)
v = [s[i] * lower[i] + a[i] for i in range(n)]

total = 0
for i in range(n):
    total += v[i]

constraint1 = 0
for i in range(n):
    constraint1 += ~s[i] * a[i]

constraint2 = qbpp.constrain(total, between=(0, T))
f = -total + 1000 * (constraint1 + constraint2)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=-T)
for i in range(n):
    if sol(s[i]) == 1:
        print(f"Interval {i}: val = {sol(v[i])}")
print(f"sum = {sol(total)}")
```

まず、各 `a[i]` が `[0, upper[i] - lower[i]]` の整数値をとる整数変数のリスト `a` を定義します。
また、バイナリ変数の配列 `s` を定義します。
`a` と `s` を用いて `v[i] = s[i] * lower[i] + a[i]` を構築し、これは $v_i = s_i l_i + a_i$ に対応します。
式 `constraint1 += ~s[i] * a[i]` は、`s[i] = 0` のときに `a[i] > 0` となる解にペナルティを課し、選択されていない区間に対して `v[i] = 0` を強制します。
不等式制約 `constraint2 = between(total, 0, T)` は、選択された合計が `T` を超えないことを保証します。

最後に、十分大きなペナルティ定数 `P` で `f = -total + P * (constraint1 + constraint2)` を最小化します。
前の例と同様に、`search()` に `target_energy=-T` を渡すことで、`total = T` を達成する実行可能解が見つかった場合にソルバーを早期停止させることができます（この場合、ペナルティ項は0になり目的関数項は `-T` になります）。

HUBO定式化と同じ結果が得られます。
