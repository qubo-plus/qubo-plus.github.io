---
layout: default
nav_exclude: true
title: "Comparison Operators"
nav_order: 14
lang: ja
hreflang_alt: "en/python/COMPARISON"
hreflang_lang: "en"
---

# 制約演算子
PyQBPPは制約を作成するための2種類の演算子をサポートしています：

- **等価演算子**: `qbpp.constrain(f, equal=n)`。`f` は式、`n` は整数です。
- **範囲演算子**: `qbpp.constrain(f, between=(l, u))`。`f` は式、`l` と `u`（$l\leq u$）は整数です。

これらの演算子は、**対応する制約が満たされるときかつそのときに限り最小値0を取る** `ExprExpr` オブジェクトを返します。

## 等価演算子
等価演算子 `qbpp.constrain(f, equal=n)` は以下の式を作成します：

$$
(f-n)^2
$$

この式は、等式 $f=n$ が満たされるときかつそのときに限り最小値0を取ります。

以下のプログラムは、Exhaustive Solverを使って $a+2b+3c=3$ を満たすすべての解を探索します：
```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
f = qbpp.constrain(a + 2 * b + 3 * c, equal=3)
f.simplify_as_binary()
print("f =", f)
print("body =", f.body)

solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)
for sol in result.sols:
    print(f"a={sol(a)}, b={sol(b)}, c={sol(c)}, "
          f"f={sol(f)}, body={sol(f.body)}")
```
このプログラムでは、`f` は内部的に2つの式を保持しています：
- **`f`**: $(a+2b+3c-3)^2$。等式が満たされるとき最小値0を取ります。
- **`f.body`**: 等式の左辺、$a+2b+3c$。

このプログラムの出力は以下の通りです：
```
f = 9 -5*a -8*b -9*c +4*a*b +6*a*c +12*b*c
body = a +2*b +3*c
a=0, b=0, c=1, f=0, body=3
a=1, b=1, c=0, f=0, body=3
```

## サポートされる等価演算子の形式に関する注意
PyQBPPは等価演算子を以下の形式でのみサポートしています：
- **`qbpp.constrain(expression, equal=integer)`**

`expression1 == expression2` の形式は直接サポートされていません。代わりに、制約を以下のように書き換えることができます：
- **`qbpp.constrain(expression1 - expression2, equal=0)`**

## 範囲演算子
範囲演算子 `qbpp.constrain(f, between=(l, u))` は、制約 $l\leq f\leq u$ が満たされるときかつそのときに限り最小値0を取る式を作成します。

> **注意**
> C++版では `l <= f <= u` という構文を使いますが、PyQBPPでは式に対する範囲制約に `qbpp.constrain(f, between=(l, u))` 関数を使います。

以下のプログラムは範囲演算子の使用方法を示しています：
```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
f = qbpp.constrain(4 * a + 9 * b + 15 * c, between=(5, 14))
f.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)
for sol in result.sols:
    print(f"a={sol(a)}, b={sol(b)}, c={sol(c)}, "
          f"f={sol(f)}, body={sol(f.body)}")
```
このプログラムは制約 $5\leq 4a+9b+15c \leq 14$ を満たす解を探索し、以下の出力を生成します：
```
a=0, b=1, c=0, f=0, body=9
a=1, b=1, c=0, f=0, body=13
```
