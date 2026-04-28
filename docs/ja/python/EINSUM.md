---
layout: default
nav_exclude: true
title: "Einsum Function"
nav_order: 19
lang: ja
hreflang_alt: "en/python/EINSUM"
hreflang_lang: "en"
---

# Einsum: numpy 風のテンソル縮約
PyQBPP は **`qbpp.einsum(subscript, *arrays)`** を提供します。
これは numpy の
[アインシュタイン縮約](https://en.wikipedia.org/wiki/Einstein_notation)
と同じ記法で、整数・変数・項・式の多次元配列を 1 行で縮約できる関数です。

出力配列の次元は subscript から自動的に推論されます。
C++ 版の `qbpp::einsum<OutDim>(...)` のようにテンプレート引数で次元を
指定する必要はなく、Python 版は subscript と入力配列のみを渡します。

## subscript の文法

```
"labels1,labels2,...->out_labels"
```

- 各 **label** は ASCII 1 文字（`,`・`-`・`>`・空白を除く）です。
- 各入力配列は次元数とちょうど同じ数のラベルを持つ必要があります。
- 入力に現れて出力に現れないラベルは **縮約（総和）** されます。
- 入力と出力の両方に現れるラベルは自由軸として残ります。
- **同一入力内に同じラベルが 2 度現れる** と、その 2 つの軸が結合されます
  （trace や対角抽出に使います）。
- 暗黙形式 `"ij,jk"`（`->` を省略）では、全入力中にちょうど 1 度だけ
  現れるラベルをアルファベット順に並べたものが出力になります（numpy と同じ仕様）。
- 右辺が空（`"i,i->"`）の場合は **スカラー出力** になります。

## 出力型

- **すべての入力が整数配列**の場合、結果も整数配列になります。
  出力次元が 0 のときは `int` のスカラーが返ります。
- それ以外（`Var`, `Term`, `Expr`, `VarInt` を 1 つでも含む）場合は
  `Expr` の配列が返ります。出力次元が 0 のときは `Expr` のスカラーです。

## 使用例

以下のプログラムは、`einsum` の代表的な使い方を示します。

```python
import pyqbpp as qbpp

# 1. 行列積: C[i,k] = Σ_j A[i,j] * B[j,k]
A = qbpp.array([[1, 2, 3], [4, 5, 6]])               # 2x3
B = qbpp.array([[7, 8], [9, 10], [11, 12]])          # 3x2
C = qbpp.einsum("ij,jk->ik", A, B)                   # 2x2
for i in range(2):
    for k in range(2):
        print(f"C[{i}][{k}] =", C[i][k])

# 2. 記号行列積: Var × Var → Expr
x = qbpp.var("x", 2, 3)
y = qbpp.var("y", 3, 2)
Z = qbpp.einsum("ij,jk->ik", x, y)
print("Z[0][0] =", Z[0][0])

# 3. 内積（スカラー出力）: s = Σ_i v[i] * w[i]
v = qbpp.array([1, 2, 3])
w = qbpp.array([4, 5, 6])
print("dot =", qbpp.einsum("i,i->", v, w))

# 4. トレース: tr = Σ_i M[i,i]
M = qbpp.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
print("trace =", qbpp.einsum("ii->", M))

# 5. 対角抽出: d[i] = M[i,i]
D = qbpp.array([[10, 0, 0], [0, 20, 0], [0, 0, 30]])
d = qbpp.einsum("ii->i", D)
print("d =", [d[0], d[1], d[2]])

# 6. 外積（縮約なし）
u = qbpp.array([1, 2])
t = qbpp.array([10, 20, 30])
Outer = qbpp.einsum("i,j->ij", u, t)
print("Outer[1][2] =", Outer[1][2])

# 7. 双線形形式: s = Σ_{i,j} x[i] * W[i,j] * y[j]
W = qbpp.array([[1, 2], [3, 4]])
xx = qbpp.var("u", 2)
yy = qbpp.var("w", 2)
print("bilinear =", qbpp.einsum("i,ij,j->", xx, W, yy))

# 8. 配列に対する各種総和
AA = qbpp.array([[1, 2, 3], [4, 5, 6]])
rowsum = qbpp.einsum("ij->i", AA)        # 各行の総和
colsum = qbpp.einsum("ij->j", AA)        # 各列の総和
total  = qbpp.einsum("ij->",  AA)        # 全要素総和
print("rowsum =", [rowsum[0], rowsum[1]])
print("total  =", total)
```

このプログラムは以下を出力します:
```
C[0][0] = 58
C[0][1] = 64
C[1][0] = 139
C[1][1] = 154
Z[0][0] = x[0][0]*y[0][0] +x[0][1]*y[1][0] +x[0][2]*y[2][0]
dot = 32
trace = 15
d = [10, 20, 30]
Outer[1][2] = 60
bilinear = u[0]*w[0] +2*u[0]*w[1] +3*u[1]*w[0] +4*u[1]*w[1]
rowsum = [6, 15]
total  = 21
```

## 3 つ以上の入力

`einsum` は任意個数の入力配列を受け取れます。組合せ最適化での代表例は
**二次割当問題（QAP）** 形の目的関数
$\sum_{a,k,l} f_a\, d_{kl}\, x_{a,k}\, x_{a,l}$ です:

```python
f = qbpp.array([1, 2, 3])                      # 施設の流量
d = qbpp.array([[0, 5], [7, 0]])               # 拠点間の距離
x = qbpp.var("x", 3, 2)                        # 割当行列
obj = qbpp.einsum("a,kl,ak,al->", f, d, x, x)
```

この 1 行が 4 重の for ループを置き換え、内部では複数の CPU スレッドで
並列に計算されます。

## どのような場面で使うか

目的関数や制約が「テンソル添字でインデックスされた積の総和」として書ける
場合は、`einsum` を使うのが最も簡潔です。明示的な多重ループに比べて、

- 数式構造を直接表現でき、
- 添字計算のミスを避けられ、
- 大規模配列では内部でマルチスレッド化されて高速です。

単純な全要素総和や軸ごとの総和には **`qbpp.sum()`** や
**`qbpp.vector_sum()`**（[Sum 関数](SUM)を参照）の方が直接的です。
複数の配列の積を取る、あるいはインデックス間の関係が複雑になった時点で
`einsum` への切り替えを検討してください。
