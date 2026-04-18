---
layout: default
nav_exclude: true
title: "SEND+MORE=MONEY"
nav_order: 82
lang: ja
hreflang_alt: "en/python/SEND_MORE_MONEY"
hreflang_lang: "en"
---

# 数学パズル: SEND MORE MONEY

**SEND + MORE = MONEY** は有名な覆面算パズルです。各文字に10進数の数字を割り当てて、以下の等式を成り立たせます。
$$
\text{SEND}+\text{MORE}=\text{MONEY}
$$

制約条件は以下の通りです:
- 各文字に割り当てられる数字はすべて異なる。
- `S` と `M` は 0 であってはならない。

## QUBO定式化

各文字に以下のように一意のインデックスを割り当てます:

| index | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| letter | S | E | N | D | M | O | R | Y |

$I(\alpha)$ を文字 $\alpha$ ($\in \lbrace S,E,N,D,M,O,R,Y\rbrace$) のインデックスとします。
$8\times 10$ のバイナリ行列 $X=(x_{i,j})$ $(0\leq i\leq 7, 0\leq j\leq 9)$ を用いて、各文字に割り当てられた数字を表現します。文字 $\alpha$ に数字 $j$ が割り当てられている場合に限り $x_{I(\alpha),j}=1$ とします。

### One-hot制約（各文字はちょうど1つの数字を取る）
$X$ の各行はone-hotでなければなりません:

$$
\begin{aligned}
\text{onehot} &=\sum_{i=0}^{7}\Bigl(\sum_{j=0}^{9}x_{i,j}=1\Bigr) \\
              &=\sum_{i=0}^{7}\Bigl(1-\sum_{j=0}^{9}x_{i,j}\Bigr)^2
\end{aligned}
$$

$\text{onehot}$ の値は、すべての行がone-hotである場合に限り最小値0になります。

### All-different制約（異なる文字は同じ数字を共有しない）
数字は文字間で異なる必要があります。つまり、2つの行が同じ列を選んではなりません:
$$
\begin{aligned}
\text{different} &=\sum_{0\leq i<j\leq 7}\sum_{k=0}^9x_{i,k}x_{j,k}
\end{aligned}
$$

### 単語の線形式による表現
$\text{SEND}$、$\text{MORE}$、$\text{MONEY}$ の値は以下のように表現されます:

$$
\begin{aligned}
\text{SEND} &= 1000\sum_{k=0}^9 kx_{I(S),k}+ 100\sum_{k=0}^9 kx_{I(E),k}+ 10\sum_{k=0}^9 kx_{I(N),k}+\sum_{k=0}^9 kx_{I(D),k}\\
       &= \sum_{k=0}^9k(1000x_{I(S),k}+100x_{I(E),k}+10x_{I(N),k}+x_{I(D),k})\\
\text{MORE} &= 1000\sum_{k=0}^9 kx_{I(M),k}+ 100\sum_{k=0}^9 kx_{I(O),k}+ 10\sum_{k=0}^9 kx_{I(R),k}+\sum_{k=0}^9 kx_{I(E),k}\\
       &= \sum_{k=0}^9k(1000x_{I(M),k}+100x_{I(O),k}+10x_{I(R),k}+x_{I(E),k})\\
\text{MONEY} &= 10000\sum_{k=0}^9 kx_{I(M),k}+1000\sum_{k=0}^9 kx_{I(O),k}+ 100\sum_{k=0}^9 kx_{I(N),k}+ 10\sum_{k=0}^9 kx_{I(E),k}+\sum_{k=0}^9 kx_{I(Y),k}\\
       &= \sum_{k=0}^9k(10000x_{I(M),k}+ 1000x_{I(O),k}+100x_{I(N),k}+10x_{I(E),k}+x_{I(Y),k})
\end{aligned}
$$

### 等式制約
残差にペナルティを課すことで等式を強制します:

$$
\begin{aligned}
\text{equal} &= \Bigl(\text{SEND}+\text{MORE} = \text{MONEY}\Bigr) \\
             &= \Bigl(\text{SEND}+\text{MORE} - \text{MONEY}\Bigr)^2
\end{aligned}
$$

### 統合目的関数
すべての制約を1つの目的関数にまとめます:

$$
\begin{aligned}
f & = P\cdot (\text{onehot}+\text{different})+\text{equal}
\end{aligned}
$$

ここで `P` は実行可能性（`onehot` と `different`）を優先するための十分に大きな定数です。
原理的には、すべての項が非負であり、各項がその制約が成り立つときにちょうど0になるならば、$f=0$ となる任意の解はすべての制約を満たします。
実際には、より大きな `P` を選ぶことがヒューリスティックソルバーに有効なことが多いです。

この場合、優先順位をつける必要はなく $P=1$ と設定できます。
なぜなら $\text{equal}\geq 0$ が常に成り立ち、$f$ は $\text{onehot}=\text{different}=\text{equal}=0$ のときにのみ最小値0を取るからです。
ただし、大きな定数 $P$ はソルバーが最適解を見つけるのに役立ちます。

最後に、$\text{S}$ と $\text{M}$ は 0 であってはならないため、バイナリ変数を以下のように固定します:
$$
x_{I(S),0} = x_{I(M),0}= 0
$$

## SEND+MORE=MONEY の PyQBPP プログラム
以下の PyQBPP プログラムは上記の QUBO 定式化を実装し、EasySolver を用いて解を求めます:
{% raw %}
```python
import pyqbpp as qbpp

LETTERS = "SENDMORY"
L = len(LETTERS)

def I(c):
    return LETTERS.index(c)

x = qbpp.var("x", shape=(L, 10))

onehot = qbpp.sum(qbpp.constrain(qbpp.vector_sum(x), equal=1))

different = 0
for i in range(L - 1):
    for j in range(i + 1, L):
        different += qbpp.sum(x[i] * x[j])

send = 0
more = 0
money = 0
for k in range(10):
    send += k * (1000 * x[I('S')][k] + 100 * x[I('E')][k] + 10 * x[I('N')][k] + x[I('D')][k])
    more += k * (1000 * x[I('M')][k] + 100 * x[I('O')][k] + 10 * x[I('R')][k] + x[I('E')][k])
    money += k * (10000 * x[I('M')][k] + 1000 * x[I('O')][k] + 100 * x[I('N')][k] + 10 * x[I('E')][k] + x[I('Y')][k])

equal = qbpp.constrain(send + more - money, equal=0)

P = 10000
f = P * (onehot + different) + equal
f.simplify_as_binary()

ml = {x[I('S')][0]: 0, x[I('M')][0]: 0}
g = qbpp.replace(f, ml)
g.simplify_as_binary()

solver = qbpp.EasySolver(g)
sol = solver.search(target_energy=0)

full_sol = qbpp.Sol(f).set([sol, ml])

print(f"onehot = {full_sol(onehot)}")
print(f"different = {full_sol(different)}")
print(f"equal = {full_sol(equal)}")

val = [next((k for k in range(10) if full_sol(x[i][k]) == 1), -1) for i in range(L)]

def digit_str(d):
    return "*" if d < 0 else str(d)

print("SEND + MORE = MONEY")
print(f"{digit_str(val[I('S')])}{digit_str(val[I('E')])}{digit_str(val[I('N')])}{digit_str(val[I('D')])} + "
      f"{digit_str(val[I('M')])}{digit_str(val[I('O')])}{digit_str(val[I('R')])}{digit_str(val[I('E')])} = "
      f"{digit_str(val[I('M')])}{digit_str(val[I('O')])}{digit_str(val[I('N')])}{digit_str(val[I('E')])}{digit_str(val[I('Y')])}")
```
{% endraw %}
このプログラムでは、`LETTERS` が `"SENDMORY"` の各文字に整数インデックスを割り当て、$I(\alpha)$ を実装しています。
`L`$\times$`10` のバイナリ変数行列 `x` を定義します（ここで $L=8$）。
式 `onehot`、`different`、`equal` は定式化に従って計算され、ペナルティ重み `P` とともに1つの目的関数 `f` にまとめられます。

辞書 `ml` を使って `x[I('S')][0]` と `x[I('M')][0]` を 0 に固定し、この置換を適用して縮約された式 `g` を作成します。
ソルバーは `g` に対して実行され、得られた割り当て `sol` は固定値 `ml` と `qbpp.Sol(f).set([sol, ml])` によって統合され、元の目的関数 `f` に対する `full_sol` が生成されます。

最後に、`full_sol(x)` の各one-hot行を走査して値が1となるインデックス `k` を抽出（見つからない場合は `-1`）して数字にデコードし、得られた解を出力します。

> **注意:** C++版とは異なり、Pythonは任意精度の整数を持つため、`INTEGER_TYPE_C128E128` を指定する必要はありません。

このプログラムは以下の出力を生成します:
```
onehot = 0
different = 0
equal = 0
SEND + MORE = MONEY
9567 + 1085 = 10652
```
すべての制約が満たされ、正しい解が得られたことが確認できます。
