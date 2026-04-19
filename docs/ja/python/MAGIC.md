---
layout: default
nav_exclude: true
title: "Magic Square"
nav_order: 80
lang: ja
hreflang_alt: "en/python/MAGIC"
hreflang_lang: "en"
---

# 魔方陣
3x3の魔方陣とは、1から9までの各整数をちょうど1回ずつ含み、すべての行、列、および2つの対角線の和が15となる3x3の行列です。
以下に例を示します：
```
8 1 6
3 5 7
4 9 2
```

## 魔方陣を求めるための定式化
one-hotエンコーディングを用いて、3x3の魔方陣 $S=(s_{i,j})$（$0\leq i,j\leq 2$）を求める問題を定式化します。
バイナリ変数 $x_{i,j,k}$（$0\leq i,j\leq 2, 0\leq k\leq 8$）を導入します：

$$
\begin{aligned}
x_{i,j,k}=1 &\Longleftrightarrow & s_{i,j}=k+1
\end{aligned}
$$

したがって、$X=(x_{i,j,k})$ は $3\times 3\times 9$ のバイナリ配列です。
以下の4つの制約を課します。

1. one-hot制約（各セルに1つの値）：
各セル $(i,j)$ について、$x_{i,j,0}, x_{i,j,1}, \ldots,x _{i,j,8}$ のうちちょうど1つが1でなければなりません：

$$
\begin{aligned}
c_1(i,j): & \sum_{k=0}^8 x _{i,j,k}=1 & (0\leq i,j\leq 2)
\end{aligned}
$$

2. 各値 $k+1$ はちょうど1つのセルに現れなければなりません：

$$
\begin{aligned}
c_2(k): & \sum_{i=0}^2\sum_{j=0}^2x _{i,j,k}=1 & (0\leq k\leq 8)
\end{aligned}
$$

3. 各行と各列の和は15でなければなりません：
$$
\begin{aligned}
c_3(i): & \sum_{j=0}^2\sum_{k=0}^8  (k+1)x _{i,j,k} = 15  &(0\leq i\leq 2)\\
c_3(j): & \sum_{i=0}^2\sum_{k=0}^8 (k+1)x _{i,j,k} = 15 &(0\leq j\leq 2)
\end{aligned}
$$

4. 対角線と反対角線の和
2つの対角線の和も15でなければなりません：
$$
\begin{aligned}
c_4: &  \sum_{k=0}^8 (k+1) (x_{0,0,k}+x_{1,1,k}+x_{2,2,k}) = 15 \\
c_4:  & \sum_{k=0}^8 (k+1) (x_{0,2,k}+x_{1,1,k}+x_{2,0,k}) = 15
\end{aligned}
$$

すべての制約が満たされたとき、割り当て $X=(x_{i,j,k})$ は有効な3x3の魔方陣を表します。

## 魔方陣のPyQBPPプログラム
以下のPyQBPPプログラムはこれらの制約を実装し、魔方陣を求めます：
```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(3, 3, 9))

c1 = qbpp.sum(qbpp.constrain(qbpp.vector_sum(x), equal=1))

temp = qbpp.expr(shape=9)
for i in range(3):
    for j in range(3):
        for k in range(9):
            temp[k] += x[i][j][k]
c2 = qbpp.sum(qbpp.constrain(temp, equal=1))

row = qbpp.expr(shape=3)
column = qbpp.expr(shape=3)
for i in range(3):
    for j in range(3):
        for k in range(9):
            row[i] += (k + 1) * x[i][j][k]
            column[j] += (k + 1) * x[i][j][k]
c3 = qbpp.sum(qbpp.constrain(row, equal=15)) + qbpp.sum(qbpp.constrain(column, equal=15))

diag = 0
for k in range(9):
    diag += (k + 1) * (x[0][0][k] + x[1][1][k] + x[2][2][k])
anti_diag = 0
for k in range(9):
    anti_diag += (k + 1) * (x[0][2][k] + x[1][1][k] + x[2][0][k])
c4 = qbpp.constrain(diag, equal=15) + qbpp.constrain(anti_diag, equal=15)

f = c1 + c2 + c3 + c4
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=0)
for i in range(3):
    for j in range(3):
        val = next(k for k in range(9) if sol(x[i][j][k]) == 1)
        print(val + 1, end=" ")
    print()
```
このプログラムでは、$3\times 3\times9$ のバイナリ変数配列 `x` を定義します。
次に、4つの制約式 `c1`、`c2`、`c3`、`c4` を構築し、それらを `f` にまとめます。
式 `f` はすべての制約が満たされたとき最小エネルギー0を達成します。

`f` に対するEasy Solverオブジェクト `solver` を作成し、`search()` に `target_energy=0` を渡します。これにより、実行可能（最適）解が見つかり次第、探索が終了します。
得られたone-hotエンコーディングは、`sol(x[i][j][k]) == 1` となるインデックス `k` を見つけることでデコードされます。

このプログラムの出力は以下の通りです：
```
8 1 6
3 5 7
4 9 2
```

## 変数の部分的固定
左上のセルに値2を割り当てた解を求めたいとします。
one-hotエンコーディングでは、値2は $k=1$ に対応するため、以下を固定します：

$$
\begin{aligned}
 x_{0,0,k} &=1 & {\rm if\,\,} k=1\\
 x_{0,0,k} &=0 & {\rm if\,\,} k\neq 1
\end{aligned}
$$

さらに、制約 $c_2$ が各数 $k+1$ がちょうど1回現れることを強制するため、この固定は他のどのセルも値2を取れないことを直ちに意味します。
したがって、以下も固定できます：

$$
\begin{aligned}
 x_{i,j,1} &=0 & {\rm if\,\,} (i,j)\neq (0,0)\\
\end{aligned}
$$

これらの固定された割り当ては残りのバイナリ変数の数を減らし、局所探索ベースのソルバーにとって有益な場合が多いです。

## 変数を部分的に固定した魔方陣のPyQBPPプログラム
上記のプログラムを以下のように修正します：
```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(3, 3, 9))

c1 = qbpp.sum(qbpp.constrain(qbpp.vector_sum(x), equal=1))

temp = qbpp.expr(shape=9)
for i in range(3):
    for j in range(3):
        for k in range(9):
            temp[k] += x[i][j][k]
c2 = qbpp.sum(qbpp.constrain(temp, equal=1))

row = qbpp.expr(shape=3)
column = qbpp.expr(shape=3)
for i in range(3):
    for j in range(3):
        for k in range(9):
            row[i] += (k + 1) * x[i][j][k]
            column[j] += (k + 1) * x[i][j][k]
c3 = qbpp.sum(qbpp.constrain(row, equal=15)) + qbpp.sum(qbpp.constrain(column, equal=15))

diag = 0
for k in range(9):
    diag += (k + 1) * (x[0][0][k] + x[1][1][k] + x[2][2][k])
anti_diag = 0
for k in range(9):
    anti_diag += (k + 1) * (x[0][2][k] + x[1][1][k] + x[2][0][k])
c4 = qbpp.constrain(diag, equal=15) + qbpp.constrain(anti_diag, equal=15)

f = c1 + c2 + c3 + c4
f.simplify_as_binary()

ml = {x[0][0][k]: (1 if k == 1 else 0) for k in range(9)}
ml.update({x[i][j][1]: 0 for i in range(3) for j in range(3) if not (i == 0 and j == 0)})

g = qbpp.replace(f, ml)
g.simplify_as_binary()

solver = qbpp.EasySolver(g)
sol = solver.search(target_energy=0)
full_sol = qbpp.Sol(f).set(sol, ml)

for i in range(3):
    for j in range(3):
        val = next(k for k in range(9) if full_sol(x[i][j][k]) == 1)
        print(val + 1, end=" ")
    print()
```

このコードでは、固定された割り当てを含む辞書 `ml` を作成します。
次に、元の式 `f` に対する解オブジェクト `full_sol` を作成します。
`replace(f, ml)` を呼び出すと、固定された値が `f` に代入され、`ml` に含まれる変数は `g` から消えます。
その結果、ソルバーが返す解 `sol` にはそれらの固定された変数が含まれません。
最後に、`set()` を使って `sol` と `ml` を `full_sol` にマージすることで、完全な割り当てを再構築します。
再構築された解 `full_sol` は完全な魔方陣を表します。

このプログラムの出力は以下の通りです：
```
2 7 6
9 5 1
4 3 8
```
意図通り、左上のセルが2であることを確認できます。
