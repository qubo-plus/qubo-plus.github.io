---
last_modified: 2026-09-02
layout: default
nav_exclude: true
title: "スターバトル"
nav_order: 84
lang: ja
hreflang_alt: "en/python/STAR_BATTLE"
hreflang_lang: "en"
---

# スターバトル

**スターバトル**は、$N\times N$ の盤面が $N$ 個の領域に区切られたパズルです。
次の条件をすべて満たすように盤面に星を置きます:

- 各行にちょうど $k$ 個の星が入る。
- 各列にちょうど $k$ 個の星が入る。
- 各領域にちょうど $k$ 個の星が入る。
- 星どうしは、上下・左右・斜めのいずれでも隣接してはならない。

ここでは $N=10$、$k=2$ の問題を解きます。
同じ文字のマスが 1 つの領域を表します:

```
A A A A A B B B C C
A B B B B B B C C D
A E B F F C C C D D
E E B F F G C C C D
E E E F F G H I I D
E E E F F G H I I D
E F F F F G H H I D
E F J J J G H H I I
J J J J G G G H H G
J J J J J J G G G G
```

## QUBO 定式化

各マスにバイナリ変数 $x_{i,j}$ を割り当て、$x_{i,j}=1$ をマス $(i,j)$ に星を置くことと解釈します。
変数の個数は盤面のマス数と同じ $N^2$ 個です。

- 各行にちょうど $k$ 個:

$$
\begin{aligned}
\sum_{j=0}^{N-1} x_{i,j}=k && (0\leq i\leq N-1)
\end{aligned}
$$

- 各列にちょうど $k$ 個:

$$
\begin{aligned}
\sum_{i=0}^{N-1} x_{i,j}=k && (0\leq j\leq N-1)
\end{aligned}
$$

- 各領域 $R_r$ にちょうど $k$ 個:

$$
\begin{aligned}
\sum_{(i,j)\in R_r} x_{i,j}=k && (0\leq r\leq N-1)
\end{aligned}
$$

- 星どうしが隣接しない。

最後の条件は、隣接するマスの組を 1 つずつ数え上げる代わりに、
**$2\times 2$ の窓に入る星は高々 1 個**と書けます:

$$
\begin{aligned}
x_{i,j}+x_{i,j+1}+x_{i+1,j}+x_{i+1,j+1}\leq 1 && (0\leq i,j\leq N-2)
\end{aligned}
$$

隣接する 2 つのマスは必ずいずれかの $2\times 2$ の窓に同時に含まれ、
逆に $2\times 2$ の窓に星が 2 個あればその 2 個は必ず隣接しているので、
この $(N-1)^2$ 本の不等式は「星どうしが隣接しない」という条件と同値です。
上下・左右・斜めの区別も、窓を数え上げるだけで自動的に尽くされます。

## PyQBPP プログラム

以下のプログラムは、上記の制約を [ネイティブ制約](CONSTRAINTS) `qbpp.cons()` で宣言し、
Easy Solver でパズルを解きます:

```python
import pyqbpp as qbpp

N = 10  # 盤面の大きさ = 領域の個数
K = 2   # 各行・各列・各領域に置く星の個数

# 各マスが属する領域の番号 (0 から N-1)。
REGION = [
    [0, 0, 0, 0, 0, 1, 1, 1, 2, 2],
    [0, 1, 1, 1, 1, 1, 1, 2, 2, 3],
    [0, 4, 1, 5, 5, 2, 2, 2, 3, 3],
    [4, 4, 1, 5, 5, 6, 2, 2, 2, 3],
    [4, 4, 4, 5, 5, 6, 7, 8, 8, 3],
    [4, 4, 4, 5, 5, 6, 7, 8, 8, 3],
    [4, 5, 5, 5, 5, 6, 7, 7, 8, 3],
    [4, 5, 9, 9, 9, 6, 7, 7, 8, 8],
    [9, 9, 9, 9, 6, 6, 6, 7, 7, 6],
    [9, 9, 9, 9, 9, 9, 6, 6, 6, 6],
]

x = qbpp.var("x", shape=(N, N))

# 領域ごとの星の個数を表す式のリスト。
region = [0] * N
for i in range(N):
    for j in range(N):
        region[REGION[i][j]] += x[i, j]

f = 0
for i in range(N):
    f += qbpp.cons(qbpp.sum(x[i, :]) == K)  # 行 i
    f += qbpp.cons(qbpp.sum(x[:, i]) == K)  # 列 i
    f += qbpp.cons(region[i] == K)          # 領域 i

# 2x2 の窓に星は高々 1 個 = 星どうしは隣接しない。
for i in range(N - 1):
    for j in range(N - 1):
        f += 2 * qbpp.cons(qbpp.sum(x[i:i+2, j:j+2]) <= 1)

sol = qbpp.EasySolver(f).search(target_energy=0)

# 解の表示: 星が置かれたマスは領域の文字を括弧で囲む。
for i in range(N):
    line = [" "] * (2 * N + 1)
    for j in range(N):
        line[2 * j + 1] = chr(ord("A") + REGION[i][j])
        if sol(x[i, j]):
            line[2 * j] = "("
            line[2 * j + 2] = ")"
    print("".join(line).rstrip())
```

`qbpp.var("x", shape=(N, N))` は $N\times N$ のバイナリ変数の配列 `x` を生成します。

領域は行や列と違って形が不定なので、盤面を一度走査して
`region[r]` に領域 $r$ のマスの変数を足し込み、
領域ごとの星の個数を表す式のリストを作ります。

3 種類の等式制約と $2\times 2$ の窓の不等式制約は、いずれも `qbpp.cons()` で宣言します:
- `x[i, :]` は行 $i$ の $N$ 個の変数、`x[:, i]` は列 $i$ の $N$ 個の変数です。
- `x[i:i+2, j:j+2]` は左上が $(i,j)$ の $2\times 2$ の窓の 4 個の変数です。
- これらに `qbpp.sum` を適用した式に `== K` や `<= 1` を書くと制約になります。

`qbpp.cons()` で宣言した制約は、ペナルティ式に展開されずにソルバへ直接渡され、
ソルバは制約を満たすように探索します。
詳しくは [非線形関数とネイティブ制約](CONSTRAINTS) を参照してください。

このパズルには最小化したい目的関数がなく、すべての制約を満たす配置を 1 つ見つければ解けます。
制約をすべて満たすとエネルギーが $0$ になるので、
`search(target_energy=0)` で目標エネルギー $0$ に到達した時点で探索を打ち切ります。

実行すると解が出力されます。星が置かれたマスは `(A)` のように領域の文字が括弧で囲まれ、
それ以外のマスは領域の文字がそのまま表示されます
（星どうしは隣接しないので、括弧が隣のマスの文字と重なることはありません）:

```
(A)A A A(A)B B B C C
 A B(B)B B B B C C(D)
 A E B F F(C)C(C)D D
 E E(B)F F G C C C(D)
 E E E F(F)G(H)I I D
 E(E)E F F G H I(I)D
 E F F(F)F G(H)H I D
(E)F J J J G H H(I)I
 J J J(J)G(G)G H H G
 J(J)J J J J G(G)G G
```

各行・各列・各領域にちょうど 2 個ずつ星があり、
どの 2 つの星も上下・左右・斜めに隣接していないことが確認できます。

## 制約の重み

`qbpp.cons()` で宣言した制約は、スカラーを掛けることで重みを変えられます。
上のプログラムでは、$2\times 2$ の窓の制約だけを `2 *` と重くしています。

制約を満たす配置を探すという問題では、どの制約も等しく満たされなければなりませんが、
重みは探索中の「どの違反を先に直すか」という優先順位を決めるため、
解が見つかるまでの時間に影響します。
このパズルでは、行・列・領域の個数制約に対して隣接の制約を重くすると、
星の個数を保ったまま星を動かす探索になり、解に到達しやすくなります。
