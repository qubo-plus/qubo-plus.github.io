---
last_modified: 2026-10-26
layout: default
nav_exclude: true
title: "Video: Slicing and einsum"
description: "The points of each chapter of the video \"QUBO++ Slicing and einsum (Python)\", with the programs shown in it and their output."
lang: en
hreflang_alt: "ja/python/VIDEO_EINSUM"
hreflang_lang: "ja"
video: einsum
---

# Video: Slicing and einsum (Python)

A companion to the video "QUBO++ Slicing and einsum (Python)".
For each chapter it gives the main points, the programs shown in the video with their output, and links to the pages that explain more.
Click "▶ Play the video from …" to play from that scene.
Programs that the video shows in part are given here in full, ready to run.

{% include video_embed.html slug="einsum" %}

What the video covers:

- Why slicing, `qbpp.concat` and `qbpp.einsum` build expressions from arrays faster than Python for loops
- Slices such as `v[1:3]`, `v[:-1]`, `v[-1]` and `x[:, 2]`, and making an array shifted by one with `qbpp.concat`
- How to read `qbpp.einsum` (axes with the same letter are multiplied, letters not after the arrow are summed, letters after it stay in the result)
- Writing the tour length of the traveling salesman problem in one einsum line instead of a triple loop
- Writing every constraint of a magic square, diagonals included, with einsum, and solving it

Back to the list of [Videos (Tutorials)](../VIDEOS)

## Slicing

### Slicing a 1-D array

{% include video_seek.html t="3:29" %}

`v[a:b]` takes elements `a` to `b - 1` (element `b` is not included).
With nothing before the colon the slice starts at the front; with nothing after it, it runs to the end. Negative numbers count from the back: `-1` is the last element.
An index without a colon takes a single element, not an array. So far this is the same as slicing a Python list.
`qbpp.concat` joins arrays. Joining `v[1:]` and `v[:1]` moves the first element, `v[0]`, around to the end: the elements shifted by one.

```python
import pyqbpp as qbpp

v = qbpp.var("v", shape=5)
print(v[1:3])
print(v[:-1])
print(v[1:])
print(v[-1])
print(qbpp.concat([v[1:], v[:1]]))
x = qbpp.var("x", shape=(3, 4))
print(x[:, 2])
```

Output:

```
[v[1], v[2]]
[v[0], v[1], v[2], v[3]]
[v[1], v[2], v[3], v[4]]
v[4]
[v[1], v[2], v[3], v[4], v[0]]
[x[0][2], x[1][2], x[2][2]]
```

### Slicing a 2-D array

{% include video_seek.html t="6:06" %}

In a 2-D array, a slice is written for each axis. An axis written as just a colon means all of it.
`x[:, 2]` of the 3 by 4 array `x` is column 2 of every row: the three elements on the last line of the output.
`x[1:]` is the rows from row 1 to the last, and `x[:1]` is row 0 only.
`qbpp.concat([x[1:], x[:1]])` moves rows 1 and 2 up one step and row 0 around to the bottom: the rows shifted by one.
Row $k$ holds row $k + 1$ of the original `x`. This array is used later for the traveling salesman problem.

See [Slice and Concat](SLICE_CONCAT) for more.

## Reading einsum

### Three rules

{% include video_seek.html t="7:30" %}

`qbpp.einsum` multiplies and sums, with the axes named by letters. The basic notation is the same as NumPy's einsum.
In `qbpp.einsum("ij,j->i", A, w)`, the strings separated by the comma name the axes: `ij` for `A`, 2 rows (`i`) by 3 columns (`j`), and `j` for `w`, an array of 3 elements.

1. Axes with the same letter take the same index, and multiply.
2. Letters not after the arrow are summed.
3. Letters after the arrow stay in the result.

With $A = [[1, 2, 3], [4, 5, 6]]$ and $w = [1, 2, 3]$, row 0 gives $1 \times 1 + 2 \times 2 + 3 \times 3 = 14$
and row 1 gives $4 \times 1 + 5 \times 2 + 6 \times 3 = 32$: the result is the array of 14 and 32.

$$
r_i = \sum_j A_{ij}\, w_j
$$

`"ij,j->i"` is a matrix-vector product. Which letters are summed depends on what is written after the arrow.

### Trying arrays of numbers

{% include video_seek.html t="9:26" %}

`"i,i->"` multiplies the elements with the same number and adds them all: the inner product ($4 + 10 + 18 = 32$).
`"ij->i"` gives the sum of each row, and `"ij,j->i"` the matrix-vector product.

```python
import pyqbpp as qbpp

w = qbpp.array([1, 2, 3])
u = qbpp.array([4, 5, 6])
A = qbpp.array([[1, 2, 3], [4, 5, 6]])
print(qbpp.einsum("i,i->", w, u))
print(qbpp.einsum("ij->i", A))
print(qbpp.einsum("ij,j->i", A, w))
```

Output:

```
32
[6, 15]
[14, 32]
```

See [Einsum Function](EINSUM) for more.

## Expressions with einsum

{% include video_seek.html t="10:53" %}

Arrays of numbers and arrays of variables can be passed together. `"i,i->"` with `w` and `x` gives the weighted sum of `x` with the weights `w`,
the same expression as `qbpp.sum(w * x)`.
`"i,ij,j->"` with `y`, `W` and `y` multiplies three elements for each pair $i$, $j$ and adds the four products: a quadratic form.
`simplify_as_binary` turns the diagonal products $y_i^2$ into $y_i$, and adds the coefficients 2 and 3 of the two products of $y[0]$ and $y[1]$ into 5.

```python
import pyqbpp as qbpp

w = qbpp.array([1, 2, 3])
x = qbpp.var("x", shape=3)
print(qbpp.einsum("i,i->", w, x))
W = qbpp.array([[1, 2], [3, 4]])
y = qbpp.var("y", shape=2)
q = qbpp.einsum("i,ij,j->", y, W, y)
q.simplify_as_binary()
print(q)
```

Output:

```
x[0] +2*x[1] +3*x[2]
y[0] +4*y[1] +5*y[0]*y[1]
```

See [Einsum Function](EINSUM) for more.

## The traveling salesman problem

### The problem and the variables

{% include video_seek.html t="12:48" %}

Find the shortest tour that visits each of 9 nodes (0 to 8) exactly once and returns to the start.
`d[i][j]` is the distance between nodes `i` and `j` (computed from the coordinates and rounded to an integer).
A tour is a 9 by 9 array `x` of 0/1 variables: `x[k][i]` is 1 when the node visited at step $k$ is $i$.
Every row and every column has exactly one 1 (the one-hot constraints on the rows and the columns).
The shortest tour is 0 → 1 → 4 → 2 → 5 → 8 → 7 → 6 → 3 → 0, of length 959.

### The sum and the triple loop

{% include video_seek.html t="14:33" %}

The tour length $L$ can be written with three sums:

$$
L = \sum_{k=0}^{n-1} \sum_{i=0}^{n-1} \sum_{j=0}^{n-1} d_{ij}\, x_{k,i}\, x_{(k+1) \bmod n,\, j}
$$

$x_{k,i}\, x_{(k+1) \bmod n,\, j}$ is 1 only when step $k$ is node $i$ and the next is node $j$, and only then is the distance $d_{ij}$ added.
For example, if step 2 is node 4 and step 3 is node 2, the length of the edge from node 4 to node 2, 128, is added.
The triple loop at the end of this program computes the sum:

```python
import math
import pyqbpp as qbpp

nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142),
         (111, 243), (220, 4), (210, 113), (211, 233)]
n = len(nodes)
d = qbpp.array([[round(math.dist(nodes[i], nodes[j])) for j in range(n)] for i in range(n)])
x = qbpp.var("x", shape=(n, n))
length = 0
for k in range(n):
    for i in range(n):
        for j in range(n):
            length += d[i][j] * x[k][i] * x[(k + 1) % n][j]
```

The inner line runs $n^3$ times: 729 times for 9 nodes, and a million times for $n = 100$.
A plain Python for loop is slow at each step, so with this many steps just building the expression takes time.

### x_next, shifted by one row

{% include video_seek.html t="16:26" %}

`x_next = qbpp.concat([x[1:], x[:1]])` is `x` with its rows shifted by one.
Rows 1 to 8 of `x` each move up one step, and row 0 goes around to the bottom.

$$
x^{\mathrm{next}}_{k,j} = x_{(k+1) \bmod n,\, j}
$$

In the same row $k$, `x` gives the node at step $k$ and `x_next` the next node.
For example, row 2 of `x` has its 1 in column 4 and row 2 of `x_next` in column 2: the edge from node 4 to node 2.
Now $x_{(k+1) \bmod n,\, j}$ in the sum can be replaced by $x^{\mathrm{next}}_{k,j}$.

### One einsum line

{% include video_seek.html t="17:57" %}

The sum after the replacement:

$$
L = \sum_{k} \sum_{i} \sum_{j} d_{ij}\, x_{k,i}\, x^{\mathrm{next}}_{k,j}
$$

The subscripts of the three factors are written in the order of each array's axes:

| Factor | Array | Letters |
|---|---|---|
| $d_{ij}$ | `d` | `ij` |
| $x_{k,i}$ | `x` | `ki` (rows of `x` are $k$, columns $i$, so not `ik`) |
| $x^{\mathrm{next}}_{k,j}$ | `x_next` | `kj` |

All of $k$, $i$ and $j$ are summed, so nothing is written after the arrow, and the result is a single expression, not an array.
The triple loop becomes the one line `qbpp.einsum("ij,ki,kj->", d, x, x_next)`.

### The program

{% include video_seek.html t="19:56" %}

With the one-hot constraints on the rows and columns, EasySolver solves it with the shortest length, 959, as `target_energy`.

```python
import math
import pyqbpp as qbpp

nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142),
         (111, 243), (220, 4), (210, 113), (211, 233)]
n = len(nodes)
d = qbpp.array([[round(math.dist(nodes[i], nodes[j])) for j in range(n)] for i in range(n)])
x = qbpp.var("x", shape=(n, n))
x_next = qbpp.concat([x[1:], x[:1]])
length = qbpp.einsum("ij,ki,kj->", d, x, x_next)
f = (length
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
     + 1000 * qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
f.simplify_as_binary()
sol = qbpp.EasySolver(f).search(target_energy=959)
print("length =", sol(length), " tour =", qbpp.onehot_to_int(sol(x), axis=1))
```

The output in the video (EasySolver gives different results on each run):

```
length = 959  tour = [0, 1, 4, 2, 5, 8, 7, 6, 3]
```

The starting node and the direction may change from run to run, but it is always the same tour of length 959.

### Comparing with the loop

{% include video_seek.html t="21:33" %}

The expression `loop` built by the triple loop is compared with `ein` built by einsum.
Both have 648 terms, and their difference is 0: they are exactly the same expression.
The inner line runs $9^3 = 729$ times, but the 81 with $i = j$ have distance 0 (a node to itself) and vanish, leaving $729 - 81 = 648$ terms.

```python
import math
import pyqbpp as qbpp

nodes = [(10, 12), (33, 125), (12, 226), (121, 11), (108, 142),
         (111, 243), (220, 4), (210, 113), (211, 233)]
n = len(nodes)
d = qbpp.array([[round(math.dist(nodes[i], nodes[j])) for j in range(n)] for i in range(n)])
x = qbpp.var("x", shape=(n, n))
loop = 0
for k in range(n):
    for i in range(n):
        for j in range(n):
            loop += d[i][j] * x[k][i] * x[(k + 1) % n][j]
ein = qbpp.einsum("ij,ki,kj->", d, x, qbpp.concat([x[1:], x[:1]]))
loop.simplify_as_binary()
ein.simplify_as_binary()
diff = loop - ein
diff.simplify_as_binary()
print("terms:", loop.term_count(), ein.term_count(),
      " loop - ein =", diff)
```

Output:

```
terms: 648 648  loop - ein = 0
```

See [Traveling Salesman Problem](TSP) for more.

## The magic square

### The variables and the numbers of the cells

{% include video_seek.html t="22:55" %}

Place 1 to 9 once each in a 3 by 3 grid so that every row, column and diagonal sums to 15.
The variable `x` is a 3 by 3 by 9 array, `qbpp.var("x", shape=(3, 3, 9))`: if `x[i][j][k]` is 1, cell $(i, j)$ holds $k + 1$.
Of the 9 variables of one cell, only one is 1.
Multiplying by `v = qbpp.array([1, 2, 3, 4, 5, 6, 7, 8, 9])` and summing over $k$ gives the number in a cell.
With einsum, `qbpp.einsum("k,ijk->ij", v, x)` gives the numbers of all cells as a 3 by 3 array.
For example, in the magic square of the video, the cell in row 1, column 2 has a 1 only at $k = 6$: it holds 7.

### Constraints with einsum

{% include video_seek.html t="24:27" %}

The letters kept after the arrow say "for each what"; the axes of the other letters are summed and folded.

| einsum | Summed over | Constraint |
|---|---|---|
| `qbpp.einsum("ijk->ij", x) == 1` | $k$ | each cell holds one number |
| `qbpp.einsum("ijk->k", x) == 1` | $i$, $j$ | each number is used once |
| `row = qbpp.einsum("k,ijk->i", v, x)` | $j$, $k$ | row sums set to 15 |
| `col = qbpp.einsum("k,ijk->j", v, x)` | $i$, $k$ | column sums set to 15 |

Each is an array of 9 or 3 sums; compared with 1 or 15, it becomes an array of constraints, and `qbpp.cons` makes them all constraints.

### The diagonals

{% include video_seek.html t="25:38" %}

For a diagonal, write the same letter twice for one array. In `"k,iik->"` the first two axes of `x` get the same index, so only the cells on the diagonal are taken.
The anti-diagonal is the diagonal of `x_flip`, the array with the columns reversed.
Writing `x[:, 2:3]` takes a column and keeps the axis, so columns 2, 1 and 0 are taken and joined along the columns with `axis=1`.
Slicing in QUBO++ cannot take a reversed step like `x[:, ::-1]`, so the columns are taken one by one and joined.

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(3, 3, 9))
v = qbpp.array([1, 2, 3, 4, 5, 6, 7, 8, 9])
diag = qbpp.einsum("k,iik->", v, x)
x_flip = qbpp.concat([x[:, 2:3], x[:, 1:2],
                      x[:, 0:1]], axis=1)
anti = qbpp.einsum("k,iik->", v, x_flip)
```

As sums, the diagonal is $\sum_i \sum_k v_k\, x_{i,i,k}$ and the anti-diagonal $\sum_i \sum_k v_k\, x_{i,2-i,k}$. Both are set to 15.

### The program

{% include video_seek.html t="27:15" %}

The six kinds of constraints, all written with einsum, are added with `qbpp.cons`. There is no objective: when every constraint holds, the energy is 0.
With `target_energy=0`, the search stops when a magic square is found. The answer `sol(x)` is an array of 0 and 1, and the same einsum with `v` turns it into the numbers of the cells.

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(3, 3, 9))
v = qbpp.array([1, 2, 3, 4, 5, 6, 7, 8, 9])
row = qbpp.einsum("k,ijk->i", v, x)
col = qbpp.einsum("k,ijk->j", v, x)
diag = qbpp.einsum("k,iik->", v, x)
x_flip = qbpp.concat([x[:, 2:3], x[:, 1:2], x[:, 0:1]], axis=1)
anti = qbpp.einsum("k,iik->", v, x_flip)
f = (qbpp.cons(qbpp.einsum("ijk->ij", x) == 1)
     + qbpp.cons(qbpp.einsum("ijk->k", x) == 1)
     + qbpp.cons(row == 15) + qbpp.cons(col == 15)
     + qbpp.cons(diag == 15) + qbpp.cons(anti == 15))
f.simplify_as_binary()
sol = qbpp.EasySolver(f).search(target_energy=0)
print(qbpp.einsum("k,ijk->ij", v, sol(x)))
```

The output in the video (EasySolver gives different results on each run):

```
[[8, 1, 6], [3, 5, 7], [4, 9, 2]]
```

There are 8 magic squares of 1 to 9 on a 3 by 3 grid, turned into one another by rotations and reflections. Which one you get changes from run to run.

See [Magic Square](MAGIC) for more.

## Summary

{% include video_seek.html t="28:23" %}

- A plain Python for loop is slow at each step. In a triple loop the inner line runs $n^3$ times, so large expressions take long to build. Slicing and einsum replace the loop with a function call.
- Slicing takes part of an array: `v[a:b]` takes `a` up to `b - 1` (without `b`), `v[:-1]` drops the last element, `v[-1]` is the last element, and `x[:, j]` is column `j` of a 2-D array.
- `qbpp.concat` joins arrays. Joining slices gives an array shifted by one, with the first row wrapped around to the end.
- In `qbpp.einsum`, letters name the axes. Axes with the same letter are taken at the same index and multiplied, letters not after the arrow are summed, and letters after it stay in the result. `"ij,j->i"` is a matrix-vector product. The basic notation is the same as NumPy's einsum.
- The tour length of the traveling salesman problem was written in one line, `"ij,ki,kj->"`, with no loops. It is exactly the same expression as the triple loop builds, and it is built fast.
- For the magic square, changing only the letters kept gave constraints for each cell (`"ijk->ij"`), number, row (`"k,ijk->i"`) and column. Writing the same letter twice for one array, `"k,iik->"`, takes only the diagonal cells, and the anti-diagonal is the diagonal of `x_flip`, the columns reversed.
