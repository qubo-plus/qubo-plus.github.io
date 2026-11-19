---
last_modified: 2026-11-17
layout: default
nav_exclude: true
title: "動画：覆面算 SEND+MORE=MONEY"
description: "動画「QUBO++ ケーススタディ 覆面算 SEND+MORE=MONEY（Python）」の章ごとの要点と、動画に出てくるプログラムと出力。"
lang: ja
hreflang_alt: "en/python/VIDEO_SEND_MORE_MONEY"
hreflang_lang: "en"
video: send-more-money
---

# 動画：覆面算 SEND+MORE=MONEY（Python）

動画「QUBO++ ケーススタディ 覆面算 SEND+MORE=MONEY（Python）」の手引きです。
章ごとに、要点と動画に出てくるプログラム・出力、詳しい説明のページへのリンクをまとめています。
「▶ 動画の … から再生」をクリックすると、その場面から再生します。

{% include video_embed.html slug="send-more-money" %}

この動画で扱うこと：

- 文字への数字の割り当てを、8×10 の 0 と 1 の表で表すこと
- 表の行と列の条件を、構造制約 `qbpp.distinct()` 1 つで書くこと
- 文字の数字と単語の値を式で表し、足し算の等式を `qbpp.cons()` で制約にすること
- 先頭の 0 を `qbpp.replace()` で選択肢から取り除くこと
- プログラムを関数にして、DONALD+GERALD=ROBERT と TWO+TWO=FOUR も解くこと

文章での説明は[数学パズル: SEND MORE MONEY](SEND_MORE_MONEY)のページにあります。[動画（ケーススタディ）](../VIDEO_CASE_STUDIES)の一覧に戻る

結果だけを見たい方は、[結果](#結果)の章から再生してください。

## パズルのルール

{% include video_seek.html t="0:40" %}

- 覆面算は、数字を文字で隠した計算式から、元の数字を当てるパズルです。SEND+MORE=MONEY は、1924 年にデュードニーが発表しました。
- ルールは 3 つです。同じ文字は同じ数字を表し、違う文字は違う数字を表し、各単語の先頭の文字（S と M）は 0 ではありません。
- 使われている文字は S, E, N, D, M, O, R, Y の 8 種類で、数字は 0 から 9 までの 10 個あります。

## 変数：8×10 の表

{% include video_seek.html t="1:24" %}

- 8 つの文字を行に、10 個の数字を列にした 8×10 の表の各マスに、0 か 1 をとる変数を置きます。$x_{i,k}=1$ なら、番号 $i$ の文字に数字 $k$ を当てます。
- 文字の番号は SENDMORY の順で、S が 0、Y が 7 です。プログラムでは文字列 `LETTERS` と、文字から番号を返す関数 `I()` で対応させます。たとえば `I('S')` は 0、`I('E')` は 1 を返します。
- `qbpp.var("x", shape=(len(LETTERS), 10))` で、8 行 10 列、全部で 80 個の変数の配列 `x` を作ります。各行の 1 がちょうど 1 つの表し方を、ワンホットといいます。

## distinct：行と列の条件

{% include video_seek.html t="2:32" %}

- 表が正しい割り当てを表すには、各行に 1 がちょうど 1 つ（各文字に数字が 1 つ）と、各列に 1 が高々 1 つ（違う文字に違う数字）の 2 つの条件が要ります。列は 10 本、行は 8 本なので、どの文字にも当てない数字が 2 つ残ります。
- この 2 つの条件をまとめたものが `qbpp.distinct(x)` です。`x` の各行が互いに異なる値をとることを表します。
- `distinct` は重みのない制約で、ソルバーが返す解は必ずこの制約を満たします。式には `qbpp.distinct(x)` を足すだけです。

`distinct` については[構造制約](STRUCTURAL)のページをご覧ください。

## 文字の数字と単語の値

{% include video_seek.html t="3:28" %}

- `K` は 0 から 9 までの数字の配列です。文字の行と `K` を要素ごとに掛けると、1 の位置だけにその数字が残るので、積の和が文字の数字になります：

$$
\text{digit}(\alpha) = \sum_{k=0}^{9} k\,x_{I(\alpha),k}
$$

- 関数 `digit()` は、文字の行と `K` の積の和を返します。したがって、`digit(c)` は文字 `c` を表す式になります。
- 単語の値は、文字の数字に桁の重み（SEND なら 1000、100、10、1）を掛けて足した式です。MONEY は 5 桁なので、先頭の M の重みは 10000 です。`send`・`more`・`money` はどれも変数の 1 次式です。

## 足し算の等式

{% include video_seek.html t="4:34" %}

- 足し算が成り立つ条件は、$\text{SEND}+\text{MORE}-\text{MONEY}=0$ です。この等式を `qbpp.cons()` で制約にします。制約を破ると、左辺の値の 2 乗がエネルギーに加わります。
- 左辺を文字ごとにまとめると、E は SEND の 100 の位、MORE の 1 の位、MONEY の 10 の位に現れるので、係数は $100+1-10=91$ です。M の係数は $1000-10000=-9000$ です：

$$
1000S+91E-90N+D-9000M-900O+10R-Y
$$

- 変数 $x_{i,k}$ の係数は、文字の係数と $k$ の積です。E の行では、1 の列が 91、2 の列が 182、9 の列が 819 です。

`qbpp.cons()` については[制約の書き方](CONSTRAINTS)のページをご覧ください。

## まとめた式

{% include video_seek.html t="5:55" %}

- 2 つの部分を足して、式 $f$ を作ります：

$$
f = \text{distinct}(x) + \text{cons}(\text{SEND}+\text{MORE}-\text{MONEY}=0)
$$

- `distinct` は解の形を決める制約で、エネルギーには加わりません。エネルギーは足し算の左辺の 2 乗だけなので、エネルギーが 0 の解が覆面算の答えです。
- `simplify_as_binary()` で `f` を整理します。

## 先頭を 0 にしない

{% include video_seek.html t="6:28" %}

- ここまでの式には、先頭の文字が 0 でないという条件がありません。この条件がないと答えは 25 通りあり、そのうち 24 通りは M が 0 の答えです（たとえば 2817 + 0368 = 03185）。
- `qbpp.replace()` で、S と M の行の 0 の列の変数を 0 に置き換えます。`distinct` の変数を 0 に置き換えると、その選択肢が取り除かれ、選択肢は 78 個になります。
- 置き換えた式 `g` を解いた後は、`qbpp.Sol(f).set(sol, ml)` で元の式 `f` の解に戻します。取り除くと、答えは 1 つだけになります。

`qbpp.replace()` については[置換関数](REPLACE)のページをご覧ください。

## プログラム

{% include video_seek.html t="7:29" %}

```python
import pyqbpp as qbpp

LETTERS = "SENDMORY"

def I(c):
    return LETTERS.index(c)

x = qbpp.var("x", shape=(len(LETTERS), 10))
K = qbpp.array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])

def digit(c):
    return qbpp.sum(x[I(c)] * K)

send = 1000 * digit('S') + 100 * digit('E') + 10 * digit('N') + digit('D')
more = 1000 * digit('M') + 100 * digit('O') + 10 * digit('R') + digit('E')
money = (10000 * digit('M') + 1000 * digit('O') + 100 * digit('N')
         + 10 * digit('E') + digit('Y'))

f = qbpp.distinct(x) + qbpp.cons(send + more - money == 0)
f.simplify_as_binary()

ml = {x[I('S')][0]: 0, x[I('M')][0]: 0}
g = qbpp.replace(f, ml)
g.simplify_as_binary()

sol = qbpp.EasySolver(g).search(target_energy=0)
print(f"energy = {sol.energy}")
full_sol = qbpp.Sol(f).set(sol, ml)

val = qbpp.onehot_to_int(full_sol(x))

def word(w):
    return "".join(str(val[I(c)]) for c in w)

print(word("SEND"), "+", word("MORE"), "=", word("MONEY"))
```

- `ml` は、S と M の 0 の列の変数を 0 に置き換える辞書です。`g` は置き換えた式で、これも整理します。
- `g` から EasySolver を作り、`search()` で解を探します。`target_energy=0` を指定すると、エネルギー 0 の解を見つけたら止まります。
- `qbpp.onehot_to_int()` は各行の 1 の位置、つまり各文字の数字を返し、関数 `word()` は単語の文字を数字に置き換えた文字列を返します。

## 結果

{% include video_seek.html t="8:46" %}

動画での出力です：

```
energy = 0
9567 + 1085 = 10652
```

- エネルギーは 0 で、足し算が成り立っています。表では各行に 1 が 1 つずつ、全部で 8 個あり、どの列も 1 は高々 1 つです。3 と 4 の列は、どの文字にも当てられていません。
- 筆算で確かめると、1 の位は 7 + 5 = 12 で 2 を書いて 1 繰り上がり、ほかの位も同じように足し算が成り立っています。
- S と M が 0 でない答えは、この 1 つだけです。別の方法でも確かめました。

## ほかの覆面算

{% include video_seek.html t="9:27" %}

```python
import pyqbpp as qbpp


def solve(puzzle):
    left, right = puzzle.split("=")
    words = left.split("+") + [right]

    LETTERS = ""
    for c in puzzle:
        if c.isalpha() and c not in LETTERS:
            LETTERS += c

    def I(c):
        return LETTERS.index(c)

    x = qbpp.var("x", shape=(len(LETTERS), 10))
    K = qbpp.array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])

    def digit(c):
        return qbpp.sum(x[I(c)] * K)

    def value(w):
        v = 0
        for c in w:
            v = 10 * v + digit(c)
        return v

    lhs = 0
    for w in words[:-1]:
        lhs += value(w)

    f = qbpp.distinct(x) + qbpp.cons(lhs - value(right) == 0)
    f.simplify_as_binary()

    ml = {x[I(w[0])][0]: 0 for w in words}
    g = qbpp.replace(f, ml)
    g.simplify_as_binary()

    sol = qbpp.EasySolver(g).search(target_energy=0)
    full_sol = qbpp.Sol(f).set(sol, ml)
    val = qbpp.onehot_to_int(full_sol(x))

    def word(w):
        return "".join(str(val[I(c)]) for c in w)

    print(" + ".join(word(w) for w in words[:-1]), "=", word(right))


solve("DONALD+GERALD=ROBERT")
solve("TWO+TWO=FOUR")
```

動画での出力です（2 行目は実行するたびに変わることがあります）：

```
526485 + 197485 = 723970
928 + 928 = 1856
```

- 関数 `solve()` は覆面算の式を文字列で受け取り、使われている文字を出てきた順に取り出して `LETTERS` を作ります。単語の値は、左から順に 10 倍して次の文字の数字を足して作ります。
- 等式は、左辺の単語の値の和から右辺の値を引いて 0 とする制約です。各単語の先頭の文字の 0 の列の変数を 0 に置き換えます。
- DONALD+GERALD=ROBERT は文字が 10 種類で、表は 10×10 です。行と列の数が等しいので、どの数字もちょうど 1 つの文字に当たります。TWO+TWO=FOUR は答えが 7 つあるので、実行するたびに違う答えが出ることがあります。

## まとめ

{% include video_seek.html t="10:30" %}

- 文字への数字の割り当てを 0 と 1 の表で表し、表の行と列の条件は `qbpp.distinct()` で書きました。
- 足し算は、文字の数字を桁の重みで足した式の、等式の制約にしました。
- 先頭の 0 は、`qbpp.replace()` で選択肢を取り除きました。
