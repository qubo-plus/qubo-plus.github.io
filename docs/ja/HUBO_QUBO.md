---
layout: default
title: "HUBO and QUBO"
nav_order: 2
lang: ja
hreflang_alt: "en/HUBO_QUBO"
hreflang_lang: "en"
---

# HUBO と QUBO
**高次制約なしバイナリ最適化 (High-Order Unconstrained Binary Optimization, HUBO)** 問題は、バイナリ変数上の多項式によって定義されます。
目標は、多項式の値を最小化するようなバイナリ値 ${0,1}$ の割り当てを全変数に対して見つけることです。

以下の多項式は HUBO のインスタンスの例です：

$$
\begin{aligned}
f(a,b,c,d) &=1 -2a +45c +8d +4ab -13ac +2ad -10bc -12bd +2abc +5acd
\end{aligned}
$$

この多項式は $(a,b,c,d) = (0,1,0,1)$ のとき最小値 $-3$ を取ります。
このような割り当てを見つけることが、この多項式に対する HUBO 問題です。

**2次制約なしバイナリ最適化 (Quadratic Unconstrained Binary Optimization, QUBO)** 問題は、多項式の次数が2以下に制限された HUBO の特殊ケースです。

通常、最適化問題は目的関数と制約条件の集合で構成され、いずれも変数の関数として表現されます。
すべての制約条件を満たしつつ、目的関数を最小化（または最大化）する変数値の割り当てを見つけることが目的です。

一方、HUBO および QUBO 問題は目的関数のみで構成され、明示的な制約条件を持ちません。
このシンプルな問題構造により、ソルバーは高度に加速された SIMD スタイルの並列処理を活用して効率的に解を探索できます。
さらに、ペナルティ項を用いて制約条件を目的関数に組み込めるため、多くの制約付き最適化問題を等価な HUBO または QUBO 問題として再定式化できます。

## 否定リテラルを含む HUBO
否定リテラルを含む HUBO では、否定リテラルを含む項を持つことができます。
例えば、以下のような項を含めることができます：

$$
\overline{a}b\overline{c}\overline{d}
$$

従来の HUBO では、すべての変数 $x$ について関係式 $\overline{x}=1-x$ を用いて、否定リテラルを含まない項に変換する必要があります：

$$
\begin{aligned}
\overline{a}b\overline{c}\overline{d} &= (1-a)b(1-c)(1-d) \\
&=1 +b -ab -bc -bd +abc +abd +bcd -abcd
\end{aligned}
$$

この展開により項数は大幅に増加します。
一般に、$n$ 個の否定リテラルを含む項を展開すると、定数項を含む $2^n$ 個の項が生成されます。

QUBO++ は否定リテラルを含む HUBO 式を作成できます。
QUBO++ に同梱された3つのソルバーはすべて、正リテラルへの展開なしに否定リテラルをネイティブに処理できます。
これにより式の評価コストが大幅に削減され、探索性能が向上します。
