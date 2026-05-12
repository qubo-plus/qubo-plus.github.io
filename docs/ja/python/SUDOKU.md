---
layout: default
nav_exclude: true
title: "数独"
nav_order: 83
lang: ja
hreflang_alt: "en/python/SUDOKU"
hreflang_lang: "en"
---

# 数独

**数独**は $9\times 9$ のマス目に 1 から 9 の数字を入れるパズルで、以下の条件をすべて満たす必要があります:

- 各行に 1 から 9 がちょうど 1 回ずつ現れる。
- 各列に 1 から 9 がちょうど 1 回ずつ現れる。
- 9 個の $3\times 3$ のブロックそれぞれに 1 から 9 がちょうど 1 回ずつ現れる。

問題には初期ヒント (clues) としていくつかのマスにあらかじめ数字が入っており、残りの空きマスを上記の制約を満たすように埋めます。

## 1-hot 符号化による QUBO 定式化

3 次元のバイナリ変数 $X=(x_{i,j,k})$ ($0\leq i, j, k \leq 8$) を用い、$x_{i,j,k}=1$ をマス $(i, j)$ に数字 $k+1$ が入ることを表す **1-hot 符号化**を採用します。
各マスは 1 つの数字を持つので、軸 $k$ 方向に常にちょうど 1 つだけ $1$ が立ちます。

以下の制約を課します:

- 各マスは 1 つの数字を持つ:

$$
\begin{aligned}
\sum_{k=0}^{8} x_{i,j,k}=1 && (0\leq i,j \leq 8)
\end{aligned}
$$

- 各行に各数字がちょうど 1 回ずつ:

$$
\begin{aligned}
\sum_{j=0}^{8} x_{i,j,k}=1 && (0\leq i,k \leq 8)
\end{aligned}
$$

- 各列に各数字がちょうど 1 回ずつ:

$$
\begin{aligned}
\sum_{i=0}^{8} x_{i,j,k}=1 && (0\leq j,k \leq 8)
\end{aligned}
$$

- 各 $3\times 3$ ブロックに各数字がちょうど 1 回ずつ:

$$
\begin{aligned}
\sum_{i=3b_r}^{3b_r+2}\sum_{j=3b_c}^{3b_c+2} x_{i,j,k}=1 && (0\leq b_r, b_c\leq 2,\ 0\leq k \leq 8)
\end{aligned}
$$

これらの等式制約を二乗ペナルティの和としてQUBO式 $f$ を構築します。$f=0$ を達成する変数割り当てが数独の解です。

## ヒントによる変数固定

初期ヒントは追加のペナルティとして与えるのではなく、変数を直接固定 (1 または 0 に置換) します。
ヒントによってマス $(i, j)$ が数字 $v$ と分かっている場合:

$$
\begin{aligned}
x_{i,j,v-1} &= 1 && \text{(マス $(i, j)$ は数字 $v$ である)}\\
x_{i,j,k} &= 0 &&\text{($k \ne v-1$、マス $(i, j)$ は数字 $v$ 以外ではない)}\\
x_{i,j',v-1} &= 0 &&\text{($j' \ne j$、同じ行のほかのマスは $v$ ではない)}\\
x_{i',j,v-1} &= 0 &&\text{($i' \ne i$、同じ列のほかのマスは $v$ ではない)}\\
x_{i',j',v-1} &= 0 &&\text{($(i', j')$ が同じ $3\times 3$ ブロック、ほかのマスは $v$ ではない)}
\end{aligned}
$$

これらの強制値を辞書 `{Var: 0 or 1}` に集めて `qbpp.replace` に渡すと、QUBO式から該当する変数が消え、ソルバが扱う変数の数が大幅に削減されます。

## PyQBPP プログラム

以下の PyQBPP プログラムは、上記の制約をもとにQUBO式を構築し、ヒントによる変数固定後に EasySolver で解きます:

{% raw %}
```python
import pyqbpp as qbpp

# 0 は空きマス。Hard レベルのパズル (Project Euler #1)。
PUZZLE = [
    [0, 0, 3, 0, 2, 0, 6, 0, 0],
    [9, 0, 0, 3, 0, 5, 0, 0, 1],
    [0, 0, 1, 8, 0, 6, 4, 0, 0],
    [0, 0, 8, 1, 0, 2, 9, 0, 0],
    [7, 0, 0, 0, 0, 0, 0, 0, 8],
    [0, 0, 6, 7, 0, 8, 2, 0, 0],
    [0, 0, 2, 6, 0, 9, 5, 0, 0],
    [8, 0, 0, 2, 0, 3, 0, 0, 9],
    [0, 0, 5, 0, 1, 0, 3, 0, 0],
]


def sudoku_expr(x):
    f = qbpp.expr()
    # 各マスは 1 つの数字を持つ。
    for i in range(9):
        for j in range(9):
            f += qbpp.sum(x[i, j, :]) == 1
    # 各行・各列に各数字がちょうど 1 回ずつ。
    for k in range(9):
        for i in range(9):
            f += qbpp.sum(x[i, :, k]) == 1
        for j in range(9):
            f += qbpp.sum(x[:, j, k]) == 1
    # 各 3x3 ブロックに各数字がちょうど 1 回ずつ。
    for br in range(3):
        for bc in range(3):
            for k in range(9):
                f += qbpp.sum(x[3*br:3*br+3, 3*bc:3*bc+3, k]) == 1
    return f


def fix_variables(x, puzzle):
    sub = {}
    for i in range(9):
        for j in range(9):
            v = puzzle[i][j]
            if v == 0:
                continue
            k_clue = v - 1
            for k in range(9):
                sub[x[i, j, k]] = 1 if k == k_clue else 0
            for jj in range(9):
                if jj != j:
                    sub.setdefault(x[i, jj, k_clue], 0)
            for ii in range(9):
                if ii != i:
                    sub.setdefault(x[ii, j, k_clue], 0)
            br, bc = i // 3, j // 3
            for ii in range(3 * br, 3 * br + 3):
                for jj in range(3 * bc, 3 * bc + 3):
                    if (ii, jj) != (i, j):
                        sub.setdefault(x[ii, jj, k_clue], 0)
    return sub


def print_sudoku(solution):
    for i in range(9):
        if i % 3 == 0 and i > 0:
            print("------+-------+------")
        row = []
        for j in range(9):
            v = solution[i][j]
            row.append(str(v + 1) if v >= 0 else ".")
            if j % 3 == 2 and j < 8:
                row.append("|")
        print(" ".join(row))


x = qbpp.var("x", 9, 9, 9)
f = sudoku_expr(x)
sub = fix_variables(x, PUZZLE)

initial_sol = qbpp.Sol(f).set(sub)
print("Puzzle:")
print_sudoku(qbpp.onehot_to_int(initial_sol(x)))

g = qbpp.replace(f, sub)
g.simplify_as_binary()

solver = qbpp.EasySolver(g)
sol = solver.search(target_energy=0)
full_sol = qbpp.Sol(f).set(sol).set(sub)

print("\nSolution:")
print_sudoku(qbpp.onehot_to_int(full_sol(x)))
```
{% endraw %}

`qbpp.var("x", 9, 9, 9)` は形状 $(9, 9, 9)$ のバイナリ変数の 3 次元配列 `x` を生成します。

`sudoku_expr` 関数は以下のスライス記法と `qbpp.sum`、`== 1` 構文を用いて 4 種類の等式制約に対応する二乗ペナルティを構築します:
- `x[i, j, :]` はマス $(i, j)$ の 9 個の変数からなる軸 $k$ 方向のベクトル。
- `x[i, :, k]` は行 $i$ で数字 $k+1$ に対応する 9 個の変数のベクトル。
- `x[:, j, k]` は列 $j$ で数字 $k+1$ に対応する 9 個の変数のベクトル。
- `x[3*br:3*br+3, 3*bc:3*bc+3, k]` は $3\times 3$ ブロックで数字 $k+1$ に対応する 9 個の変数の 2 次元配列。

これらに `qbpp.sum(...) == 1` を適用すると、対応する和が 1 のとき 0 となる二乗ペナルティ式が得られます。

`fix_variables` 関数は、ヒントに対して上記の固定値 (1 または 0) を辞書 `sub` に集めます。Python の辞書は同一キーへの再代入を自然に扱えるため、マス自身に対する値は `sub[...] = ...` で常に上書きし、行・列・ブロックの近傍に対する 0 は `sub.setdefault(...)` で既存値を上書きしないようにします。これにより、ヒントの「= 1」の値が他のヒントの近傍規則による「= 0」より優先されます。

`qbpp.replace(f, sub)` は、`sub` に含まれる各変数を対応する定数 (0 または 1) で置換した新しい式 `g` を返します。これにより `g` から固定された変数が消え、`g.simplify_as_binary()` で簡約することで `g` の変数の数と項数が大幅に減少します。

`qbpp.EasySolver(g)` で `g` をソルバに渡し、`solver.search(target_energy=0)` で目標エネルギー 0 を達成する解 `sol` を求めます。
`g` には空きマスに対応する変数しか含まれていないため、`sol` も空きマスの値のみを保持しています。
ヒントを含む完全な解は `qbpp.Sol(f).set(sol).set(sub)` で構築します。
これは、もとの式 `f` のすべての変数を含む新しい `Sol` を作り、まず `sol` の値をコピーし、続けて `sub` の固定値を反映するイディオムです。

最後に、`full_sol(x)` で 3 次元の 0/1 配列を得て、`qbpp.onehot_to_int` で軸 $k$ 方向の 1-hot を整数 $(0,\ldots,8)$ に復号し、`print_sudoku` で `+1` した値を出力します。

実行すると、ヒント (`.` が空きマス) と求めた解が以下のように表示されます:
```
Puzzle:
. . 3 | . 2 . | 6 . .
9 . . | 3 . 5 | . . 1
. . 1 | 8 . 6 | 4 . .
------+-------+------
. . 8 | 1 . 2 | 9 . .
7 . . | . . . | . . 8
. . 6 | 7 . 8 | 2 . .
------+-------+------
. . 2 | 6 . 9 | 5 . .
8 . . | 2 . 3 | . . 9
. . 5 | . 1 . | 3 . .

Solution:
4 8 3 | 9 2 1 | 6 5 7
9 6 7 | 3 4 5 | 8 2 1
2 5 1 | 8 7 6 | 4 9 3
------+-------+------
5 4 8 | 1 3 2 | 9 7 6
7 2 9 | 5 6 4 | 1 3 8
1 3 6 | 7 9 8 | 2 4 5
------+-------+------
3 7 2 | 6 8 9 | 5 1 4
8 1 4 | 2 5 3 | 7 6 9
6 9 5 | 4 1 7 | 3 8 2
```
