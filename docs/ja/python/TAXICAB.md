---
last_modified: 2026-10-08
layout: default
nav_exclude: true
title: "タクシー数 1729"
nav_order: 96
lang: ja
hreflang_alt: "en/python/TAXICAB"
hreflang_lang: "en"
---

# タクシー数 1729

数学者ハーディが乗ったタクシーのナンバー 1729 を「つまらない数だ」と言ったところ、ラマヌジャンは「2 通りの方法で 2 つの立方数の和として表せる最小の数です」と答えた、という逸話があります:

$$
1729 = 1^3 + 12^3 = 9^3 + 10^3
$$

このページでは、1729 を 2 つの立方数の和に分解する問題を Exhaustive Solver の全探索で解きます。
同じ問題を次の 2 通りで書き、違いを比べます:
- `between=` で宣言した整数変数とペナルティ式
- `integer=` で宣言したネイティブ整数変数と `qbpp.cons()`

最後に、1729 そのものを PyQBPP で見つけます。

## 問題

正の整数 $a \le b$ で

$$
a^3 + b^3 = 1729
$$

を満たすものをすべて求めます。
$12^3 = 1728$ なので、$1 \le a \le b \le 12$ の範囲を調べれば十分です。
$a \le b$ は、$a$ と $b$ を入れ替えただけの解を除くための条件です。

## `between=` とペナルティ式で解く

```python
import pyqbpp as qbpp

a = qbpp.var("a", between=(1, 12))
b = qbpp.var("b", between=(1, 12))
n = a * a * a + b * b * b
f = (n == 1729) + (b - a >= 0)
f.simplify_as_binary()
print(f"a = {a}")
print(f"f: degree = {f.max_degree}, terms = {f.term_count()}")

solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)
for sol in result.sols:
    print(f"{sol(a)}^3 + {sol(b)}^3 = {sol(n)}, energy = {sol.energy}")
```

`qbpp.var()` に `between=(1, 12)` を指定して、$a$、$b$ を 1〜12 の[整数変数](INTEGER)として定義し、等式 `n == 1729` と不等式 `b - a >= 0` を足して `f` を作ります。
`qbpp.cons()` で囲まない比較式は、条件を満たすとき 0、満たさないとき正の値になる**ペナルティ式**になります。
`search()` に `best_energy_sols=0` を渡すと、エネルギーが最小の解がすべて得られます。

このプログラムの出力は次のとおりです:
```
a = 1 +a[0] +2*a[1] +4*a[2] +4*a[3]
f: degree = 6, terms = 256
9^3 + 10^3 = 1729, energy = 0
1^3 + 12^3 = 1729, energy = 0
```

- 1 行目のとおり、`between=` で宣言した整数変数は 4 個のバイナリ変数 `a[0]`〜`a[3]` の 1 次式です。
- 等式 `n == 1729` はペナルティ式 $(a^3+b^3-1729)^2$ になります。$a^3$ はバイナリ変数の 3 次式なので、2 乗を展開すると 6 次の多項式になります。
- 不等式 `b - a >= 0` のペナルティ式には補助変数が加わり、これもバイナリ変数で表されます（[制約](CONSTRAINTS)を参照）。
- その結果、`f` はバイナリ変数 11 個（$a$、$b$ に 4 個ずつ、補助変数に 3 個）の 6 次・256 項の多項式になります。`print(f)` で表示すると 256 項が並びます。
- Exhaustive Solver はバイナリ変数の割り当て $2^{11} = 2048$ 通りをすべて調べ、エネルギー 0 の解を 2 つ見つけます。

## `integer=` と `cons()` で解く

```python
import pyqbpp as qbpp

a = qbpp.var("a", integer=(1, 12))
b = qbpp.var("b", integer=(1, 12))
n = a * a * a + b * b * b
f = qbpp.cons(n == 1729) + qbpp.cons(b - a >= 0)
f.simplify_as_binary()
print(f"a = {a}")
print(f"f = {f}")

solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)
for sol in result.sols:
    print(f"{sol(a)}^3 + {sol(b)}^3 = {sol(n)}, energy = {sol.energy}, violations = {f.cons(sol)}")
```

前のプログラムとの違いは、`between=` を `integer=` に変えたことと、2 つの比較式を `qbpp.cons()` で囲んだことだけです。

このプログラムの出力は次のとおりです:
```
a = a
f = cons(a*a*a +b*b*b == 1729)
+cons(-a +b >= 0)
1^3 + 12^3 = 1729, energy = 0, violations = 0
9^3 + 10^3 = 1729, energy = 0, violations = 0
```

- `integer=` で宣言した[ネイティブ整数変数](NATIVE_INTEGER)はバイナリ変数に展開されず、整数値をそのまま持ちます（1 行目）。`a * a * a` も整数の 3 乗として扱われます。
- `qbpp.cons()` で囲んだ比較式はペナルティ式に展開されず、**制約**としてそのまま `f` に入ります（2〜3 行目）。2 乗の展開も補助変数もありません。
- 制約を満たさない割り当てのエネルギーは、違反量の 2 乗です。`f.cons(sol)` は違反している制約の本数を返します。
- Exhaustive Solver は $a$、$b$ の値の組 $12 \times 12 = 144$ 通りをすべて調べます。

## 2 つの書き方の違い

| | `between=` とペナルティ式 | `integer=` と `cons()` |
|---|---|---|
| 整数の表し方 | バイナリ変数の 1 次式（$a$、$b$ に 4 個ずつ） | 整数値そのもの |
| $a^3+b^3=1729$ | $(a^3+b^3-1729)^2$ を展開した 6 次の多項式 | 制約としてそのまま保持 |
| $a \le b$ | 補助変数を含むペナルティ式 | 制約としてそのまま保持 |
| `f` の大きさ | バイナリ変数 11 個、256 項 | 制約 2 本 |
| Exhaustive Solver が調べる数 | $2^{11} = 2048$ 通り | $12 \times 12 = 144$ 通り |
| 使えるソルバー | バイナリ変数の多項式なので、QUBO++ 以外の QUBO/HUBO ソルバーにも渡せる | QUBO++ に同梱のソルバー（EasySolver・ABS3・Exhaustive Solver） |

整数の範囲を広げると、`between=` ではバイナリ変数が増え、ペナルティ式の項数も急に増えます。
`integer=` と `cons()` では、範囲を広げても `f` は制約 2 本のままです。

変数の種類と制約の書き方は別々に選べます。
`between=` の整数変数を `cons()` と組み合わせる例は[ピタゴラスの三つ組](PYTHAGOREAN)に、ネイティブ整数変数をペナルティ式で使う例は[ネイティブ整数変数](NATIVE_INTEGER)にあります。

## 1729 を見つける

最後に、「2 通りの方法で 2 つの立方数の和として表せる最小の数」を PyQBPP で求めます。
$a^3 + b^3 = c^3 + d^3$ となる正の整数で、$n = a^3 + b^3$ が最小のものを探します:

```python
import pyqbpp as qbpp

a = qbpp.var("a", integer=(1, 20))
b = qbpp.var("b", integer=(1, 20))
c = qbpp.var("c", integer=(1, 20))
d = qbpp.var("d", integer=(1, 20))
n = a * a * a + b * b * b
m = c * c * c + d * d * d
f = (n  # n を最小化
     + 20000 * qbpp.cons(n - m == 0)
     + 20000 * qbpp.cons(c - a >= 1)   # a < c
     + 20000 * qbpp.cons(d - c >= 0)   # c <= d
     + 20000 * qbpp.cons(b - d >= 1))  # d < b
f.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)
for sol in result.sols:
    print(f"{sol(n)} = {sol(a)}^3 + {sol(b)}^3 = {sol(c)}^3 + {sol(d)}^3, violations = {f.cons(sol)}")
```

このプログラムの出力は次のとおりです:
```
1729 = 1^3 + 12^3 = 9^3 + 10^3, violations = 0
```

- 目的関数は $n = a^3 + b^3$ で、制約は $n = c^3 + d^3$ と $a < c \le d < b$ です。$a < c \le d < b$ は、同じ表し方や、順序を入れ替えただけの組を除くための条件です。
- 制約の重みは 20000 です。この範囲では $n \le 2 \cdot 20^3 = 16000$ なので、制約を 1 つでも満たさない割り当ては、制約を満たす割り当てよりエネルギーが大きくなります。
- 1729 より小さい数を 2 通りに表すとすれば、$a$、$b$、$c$、$d$ はどれも 12 以下なので、範囲 1〜20 に含まれます。Exhaustive Solver は $20^4 = 160000$ 通りをすべて調べるので、この結果から 1729 が求める最小の数だとわかります。
