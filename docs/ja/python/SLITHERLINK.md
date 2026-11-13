---
last_modified: 2026-11-01
layout: default
nav_exclude: true
title: "スリザーリンク"
nav_order: 109
lang: ja
hreflang_alt: "en/python/SLITHERLINK"
hreflang_lang: "en"
---

# スリザーリンク

**スリザーリンク**は、点を格子状に並べた盤面で、隣り合う点を結ぶ線を引いて 1 本のループ（閉じた線）を作るパズルです。
次の条件をすべて満たすように線を引きます:

- 線は全体で 1 本のループになる。ループは枝分かれせず、交差もしない。
- 数字の書かれたマスでは、そのマスを囲む 4 辺のうち線を引く辺の本数が数字に等しい。
- 数字のないマスの辺には条件がない。

ここでは $10\times 10$ マスの次の問題を解きます。
`+` が格子点、数字が手がかりです:

```
+   +   +   +   +   +   +   +   +   +   +
      1   1           0       0       0
+   +   +   +   +   +   +   +   +   +   +
      2                       2
+   +   +   +   +   +   +   +   +   +   +
      2   2   1       0
+   +   +   +   +   +   +   +   +   +   +
          3                           1
+   +   +   +   +   +   +   +   +   +   +
  3               1   2   1   1   2
+   +   +   +   +   +   +   +   +   +   +
      0       1               1   1   1
+   +   +   +   +   +   +   +   +   +   +
  1                   1       2
+   +   +   +   +   +   +   +   +   +   +
  1               0           2       2
+   +   +   +   +   +   +   +   +   +   +
  1       0                           1
+   +   +   +   +   +   +   +   +   +   +
  2           1   1           1   1
+   +   +   +   +   +   +   +   +   +   +
```

この問題は QUBO++ のために作ったもので、解がただ 1 つであることを確かめてあります。

このページの解き方は、次の論文の反復法に基づいています。

> **参考文献**:
> Nakahara, Y., Nakano, K., Ito, Y., Ii, K., & Teranishi, K. (2026). **Solving Slitherlink via Iterative Elimination of Multi-Loop Solutions in HUBO and QUBO Formulations**. Proceedings of the International Symposium on Computing and Networking (CANDAR 2026), to appear.

## 定式化

盤面のマスを $R$ 行 $C$ 列とし（ここでは $R=C=10$）、格子点を $(i, j)$（$0\leq i\leq R$, $0\leq j\leq C$）で表します。
隣り合う格子点を結ぶ辺ごとにバイナリ変数を置き、値 1 をその辺に線を引くことと解釈します:

- 横の辺 $h_{i,j}$: 格子点 $(i,j)$ と $(i,j+1)$ を結ぶ（$0\leq i\leq R$, $0\leq j\leq C-1$）。
- 縦の辺 $v_{i,j}$: 格子点 $(i,j)$ と $(i+1,j)$ を結ぶ（$0\leq i\leq R-1$, $0\leq j\leq C$）。

変数は $(R+1)C + R(C+1) = 220$ 個です。

**手がかり**: マス $(i,j)$ に数字 $n_{i,j}$ があれば、そのマスを囲む 4 辺のうち線を引く辺の本数は $n_{i,j}$ です:

$$
h_{i,j} + h_{i+1,j} + v_{i,j} + v_{i,j+1} = n_{i,j}
$$

**格子点の次数**: 格子点 $p$ につながる辺のうち線を引く辺の本数を $\deg(p)$ と書きます。
ループは枝分かれしないので、ループが通る格子点では 2、通らない格子点では 0 です:

$$
\deg(p) \in \lbrace 0, 2\rbrace \qquad (\text{すべての格子点 } p)
$$

[最短路問題](SHORTEST_PATH)と同じく、この条件は `qbpp.cons()` と[許容値の集合](CONSTRAINTS#離散許容値集合) `equal=[0, 2]` でそのまま書けます。

どの格子点でも次数が 0 か 2 なので、線を引いた辺は交わらないいくつかのループに分かれます。
しかし、ループが 1 本だけになるとは限りません。
上の 2 つの制約だけでは、手がかりを満たすようにループを何本かに分けた**多重ループ**の解もエネルギー 0 になります。
「ループが 1 本」という条件は盤面全体にかかわる条件で、マスや格子点ごとの式では直接書けません。

## 多重ループの消去

そこで、論文の反復法に従って次のように解きます:

1. 手がかりと次数の制約だけで解く。
2. 解をループに分ける。ループ 1 本だけで手がかりをすべて満たせば、それが答え。
3. そうでなければ、解に現れたループをそれぞれ禁止する制約を加えて、1 に戻る。

ループ $L$ を禁止する制約は、$L$ の辺を全部は選ばないという不等式です:

$$
\sum_{e\in L} x_e \leq |L|-1
$$

ここで $x_e$ は辺 $e$ の変数、$|L|$ はループ $L$ の辺の本数です。
$L$ の辺を全部選んだときだけ違反し、違反量は 1 なので、エネルギーが 1 増えます。

この制約を加えても、答えのループはエネルギー 0 のままです。
答えのループが $L$ の辺を全部含むとすると、$L$ は答えのループの一部分でできたループになります。
1 本のループの一部分の辺だけではループはできないので、それは $L$ が答えのループそのものである場合に限られます。
答えのループを消してしまうことは、手順 2 で防いでいます。

手順 2 では、ループ 1 本だけで手がかりをすべて満たすかを調べます。
解全体も手がかりをすべて満たしているので、ループ $L$ だけで手がかりを満たすなら、他のループは数字のあるマスの辺を通りません。
このとき、他のループを取り除いた $L$ はパズルの条件をすべて満たします。

## PyQBPPプログラム

以下のPyQBPPプログラムは、この反復法でスリザーリンクを解きます:

```python
import pyqbpp as qbpp

# 盤面: 数字は手がかり、"." は手がかりのないマス。
BOARD = [".11..0.0.0", ".2.....2..", ".221.0....", "..3......1", "3...12112.",
         ".0.1...111", "1....1.2..", "1...0..2.2", "1.0......1", "2..11..11."]
R, C = len(BOARD), len(BOARD[0])


# 横の辺 h[i][j] と縦の辺 v[i][j] の、edges の中での番号。
def h_index(i, j):
    return i * C + j


def v_index(i, j):
    return (R + 1) * C + i * (C + 1) + j


# 選んだ辺を盤面に描く。
def print_board(selected):
    for i in range(R + 1):
        line = ""
        for j in range(C):
            line += "+---" if selected[h_index(i, j)] else "+   "
        print(line + "+")
        if i == R:
            break
        line = ""
        for j in range(C + 1):
            line += "|" if selected[v_index(i, j)] else " "
            if j < C:
                line += " " + (" " if BOARD[i][j] == "." else BOARD[i][j]) + " "
        print(line.rstrip())


# 解の選んだ辺をループに分ける。各ループは辺の番号のリスト。
def find_loops(selected, edges):
    used = [False] * len(edges)
    loops = []
    for s in range(len(edges)):
        if not selected[s] or used[s]:
            continue
        loop = []
        k, p = s, edges[s][2]  # 辺 s から始めて、格子点 p の側へたどる
        while not used[k]:
            used[k] = True
            loop.append(k)
            for k2, (_, a, b) in enumerate(edges):
                if selected[k2] and not used[k2] and p in (a, b):
                    p = b if a == p else a
                    k = k2
                    break
        loops.append(loop)
    return loops


# ループ 1 つだけで、すべての手がかりを満たすか。
def satisfies_clues(loop):
    in_loop = set(loop)
    for i in range(R):
        for j in range(C):
            if BOARD[i][j] == ".":
                continue
            sides = [h_index(i, j), h_index(i + 1, j), v_index(i, j), v_index(i, j + 1)]
            if sum(k in in_loop for k in sides) != int(BOARD[i][j]):
                return False
    return True


h = qbpp.var("h", shape=(R + 1, C))  # 横の辺
v = qbpp.var("v", shape=(R, C + 1))  # 縦の辺
# 辺: (変数, 端点, 端点)。格子点 (i, j) の番号は i * (C + 1) + j。
edges = []
for i in range(R + 1):
    for j in range(C):
        edges.append((h[i][j], i * (C + 1) + j, i * (C + 1) + j + 1))
for i in range(R):
    for j in range(C + 1):
        edges.append((v[i][j], i * (C + 1) + j, (i + 1) * (C + 1) + j))

# 手がかり: マスを囲む 4 辺のうち、選ぶ辺の本数が数字に等しい。
f = 0
for i in range(R):
    for j in range(C):
        if BOARD[i][j] != ".":
            n = int(BOARD[i][j])
            f += qbpp.cons(h[i][j] + h[i + 1][j] + v[i][j] + v[i][j + 1] == n)

# 各格子点につながる、選んだ辺の本数（次数）は 0 か 2。
for p in range((R + 1) * (C + 1)):
    deg = 0
    for x, a, b in edges:
        if p in (a, b):
            deg += x
    f += qbpp.cons(deg, equal=[0, 2])

hint = None
iteration = 0
while True:
    iteration += 1
    f.simplify_as_binary()
    solver = qbpp.ABS3Solver(f)
    sol = solver.search(target_energy=0, hint=hint)
    hint = sol  # 次の反復は今回の解から探索を始める

    selected = [sol(x) == 1 for x, _, _ in edges]
    loops = find_loops(selected, edges)
    sizes = [len(loop) for loop in loops]
    print(f"iteration {iteration}: energy = {sol.energy}, loops =", *sizes)
    if iteration == 1:
        print_board(selected)
    if sol.energy != 0:
        continue

    answer = [loop for loop in loops if satisfies_clues(loop)]
    if answer:
        print_board([k in answer[0] for k in range(len(edges))])
        break
    # どのループも単独では手がかりを満たさない: 見つかったループを禁止する。
    for loop in loops:
        f += qbpp.cons(qbpp.sum([edges[k][0] for k in loop]) <= len(loop) - 1)
```

`qbpp.var("h", shape=(R + 1, C))` と `qbpp.var("v", shape=(R, C + 1))` で横の辺と縦の辺の変数の配列を作り、
すべての辺を（変数、両端の格子点）の組として `edges` に並べます。
格子点 $(i,j)$ には番号 $i(C+1)+j$ を付けています。

手がかりの制約は、マス $(i,j)$ を囲む 4 辺の変数の和に `==` を適用して `qbpp.cons()` で宣言します。
次数の制約は、格子点 `p` ごとに `p` を端点とする辺の変数を足して次数 `deg` を作り、
`qbpp.cons(deg, equal=[0, 2])` で宣言します。

反復のループでは、毎回 `f` から ABS3 Solver を作り直します。
制約をすべて満たすとエネルギーが 0 になるので、
`target_energy=0` で目標エネルギー 0 に到達した時点で探索を打ち切ります。
`hint=hint` で前回の解を[ヒント解](ABS3#solution-hint)として渡します（1 回目は `None` でヒントなし）。
新しく加えた制約に違反するのは前回の解のループの部分だけなので、前回の解から探索を始めると、新しい解が速く見つかります。

`find_loops()` は選んだ辺をたどって、解をループに分けます。
どの格子点でも次数が 0 か 2 なので、ある辺から始めて、まだたどっていない隣の辺へ進むことを繰り返すと、出発した辺に戻ってループが 1 本得られます。
`satisfies_clues()` は、ループ 1 本の辺だけで手がかりをすべて満たすかを調べます。
どのループも手がかりを満たさなければ、解に現れたループごとに、ループの辺の変数の和が `len(loop) - 1` 以下という制約を `qbpp.cons()` で加えます。

## 実行結果

プログラムは、反復ごとにエネルギーと、解に現れたループの辺の本数を出力します。
最初の解と最後の答えは盤面に描きます。
出力の例は以下のとおりです:

```
iteration 1: energy = 0, loops = 10 4 4 58 4 4
+   +   +   +   +   +   +   +   +   +   +
      1   1           0       0       0
+---+---+---+---+   +   +---+   +---+   +
|     2         |       |   | 2 |   |
+---+---+---+---+   +   +---+   +---+   +
      2   2   1       0
+---+---+---+   +---+   +   +---+---+   +
|         3 |   |   |       |       | 1
+---+   +---+   +   +---+---+   +---+   +
  3 |   |       | 1   2   1   1 | 2
+---+   +---+---+   +---+   +   +   +   +
|     0       1     |   |     1 | 1   1
+   +   +---+   +   +---+   +   +   +---+
| 1     |   |         1       2 |   |   |
+   +   +---+   +   +   +---+---+   +   +
| 1               0     |     2     | 2 |
+   +   +   +   +   +---+   +---+---+   +
| 1       0         |       |         1 |
+   +   +   +   +   +---+---+   +   +   +
| 2           1   1           1   1     |
+---+---+---+---+---+---+---+---+---+---+
iteration 2: energy = 0, loops = 62 4 6
iteration 3: energy = 0, loops = 66 4
iteration 4: energy = 0, loops = 64 6
iteration 5: energy = 0, loops = 60 8
iteration 6: energy = 0, loops = 4 58 6
iteration 7: energy = 0, loops = 58 6 10
iteration 8: energy = 0, loops = 50 8 4 4
iteration 9: energy = 0, loops = 66 8
iteration 10: energy = 0, loops = 12 60
iteration 11: energy = 0, loops = 8 66
iteration 12: energy = 0, loops = 64 4
+   +   +   +   +   +   +   +   +   +   +
      1   1           0       0       0
+   +---+---+   +   +   +   +   +---+   +
    | 2     |                 2 |   |
+   +   +---+   +   +   +   +---+   +   +
    | 2 | 2   1       0     |       |
+---+   +   +---+---+   +---+   +   +   +
|       | 3 |       |   |           | 1
+---+   +---+   +   +---+   +   +   +   +
  3 |             1   2   1   1   2 |
+---+   +   +   +---+---+---+---+---+   +
|     0       1 |             1   1   1
+   +   +   +   +---+---+---+   +   +---+
| 1                   1     | 2     |   |
+   +   +   +   +   +   +   +---+   +   +
| 1               0           2 |   | 2 |
+   +   +   +   +   +   +   +   +---+   +
| 1       0                           1 |
+   +   +   +   +   +   +   +   +   +   +
| 2           1   1           1   1     |
+---+---+---+---+---+---+---+---+---+---+
```

最初の解はエネルギー 0 で、手がかりと次数の制約をすべて満たしていますが、6 本のループに分かれています。
辺 4 本の小さなループは、数字のないマスを囲んでいます。
反復ごとに見つかったループが禁止され、12 回目の解では辺 64 本のループが 1 本だけで手がかりをすべて満たしたので、それを答えとして描いています。
12 回目の解に残っていた辺 4 本のループは、数字のあるマスの辺を通らないので、取り除いても手がかりは満たされたままです。

ソルバーの探索は乱数を使うので、途中の解と反復の回数は実行ごとに変わります。
この問題では、2〜12 回の反復で答えが得られ、全体の時間は GPU のある環境で数秒でした。
解がただ 1 つなので、答えのループは毎回同じです。

## HUBO による表し方

ループ $L$ を禁止する制約 $\sum_{e\in L} x_e \leq |L|-1$ は、$L$ の辺を全部選んだときだけエネルギーを 1 増やします。
これは、$L$ の辺の変数の積と同じ値です:

$$
\prod_{e\in L} x_e
$$

論文では、この積の項を加える形（HUBO）でループを禁止しています。
プログラムでループを禁止する `qbpp.cons()` の代わりにループの辺の変数の積を `f` に加えても、エネルギー関数は変わりません。
積の項の次数はループの辺の本数（この問題では 60 を超えることもあります）ですが、QUBO++ のソルバーは高次の項をそのまま扱えます。

## QUBO による表し方

外部の QUBO ソルバーで解くには、2 次までの式に書き直す必要があります。
論文では、格子点の次数の制約 $\deg(p)\in\lbrace 0,2\rbrace$ を補助のバイナリ変数 $y_p$ を使って $(\deg(p)-2y_p)^2$ と書き、
ループを禁止する不等式も補助変数（スラック変数）を使ったペナルティ式で書いています。
`qbpp.cons()` で宣言すると、補助変数を使わずに制約をそのままソルバーへ渡せます。
