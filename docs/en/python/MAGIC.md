---
layout: default
nav_exclude: true
title: "Magic Square"
nav_order: 80
lang: en
hreflang_alt: "ja/python/MAGIC"
hreflang_lang: "ja"
---

# Magic Square
A 3-by-3 magic square is a 3-by-3 matrix that contains each integer from 1 to 9 exactly once, such that the sum of every row, every column, and the two diagonals is 15.
An example is shown below:
```
8 1 6
3 5 7
4 9 2
```

## A formulation for finding magic square
We formulate the problem of finding a 3-by-3 magic square
$S=(s_{i,j})$ ($0\leq i,j\leq 2$) using one-hot encoding.
We introduce binary variables $x_{i,j,k}$ ($0\leq i,j\leq 2, 0\leq k\leq 8$), where:

$$
\begin{aligned}
x_{i,j,k}=1 &\Longleftrightarrow & s_{i,j}=k+1
\end{aligned}
$$

Thus, $X=(x_{i,j,k})$ is a $3\times 3\times 9$ binary array.
We impose the following four constraints.

1. One-hot constraint (one value per cell):
For each cell $(i,j)$, exactly one of $x_{i,j,0}, x_{i,j,1}, \ldots,x _{i,j,8}$ must be 1:

$$
\begin{aligned}
c_1(i,j): & \sum_{k=0}^8 x _{i,j,k}=1 & (0\leq i,j\leq 2)
\end{aligned}
$$

2. Each value $k+1$ must appear in exactly one cell:

$$
\begin{aligned}
c_2(k): & \sum_{i=0}^2\sum_{j=0}^2x _{i,j,k}=1 & (0\leq k\leq 8)
\end{aligned}
$$

3. The sum of each row and each column must be 15:
$$
\begin{aligned}
c_3(i): & \sum_{j=0}^2\sum_{k=0}^8  (k+1)x _{i,j,k} = 15  &(0\leq i\leq 2)\\
c_3(j): & \sum_{i=0}^2\sum_{k=0}^8 (k+1)x _{i,j,k} = 15 &(0\leq j\leq 2)
\end{aligned}
$$

4. The sums of diagonal and anti-diagonal
The two diagonal sums must also be 15:
$$
\begin{aligned}
c_4: &  \sum_{k=0}^8 (k+1) (x_{0,0,k}+x_{1,1,k}+x_{2,2,k}) = 15 \\
c_4:  & \sum_{k=0}^8 (k+1) (x_{0,2,k}+x_{1,1,k}+x_{2,0,k}) = 15
\end{aligned}
$$

When all constraints are satisfied, the assignment $X=(x_{i,j,k})$ represents a valid 3-by-3 magic square.

## PyQBPP program for the magic square
The following PyQBPP program implements these constraints and finds a magic square:
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
In this program, we define a $3\times 3\times9$ array of binary variables `x`.
We then build four constraint expressions `c1`, `c2`, `c3`, and `c4`, and combine them into `f`.
The expression `f` achieves the minimum energy 0 when all constraints are satisfied.

We create an Easy Solver object `solver` for `f` and pass `target_energy=0` to `search()`, so the search terminates as soon as a feasible (optimal) solution is found.
The resulting one-hot encoding is decoded by finding the index `k` for which `sol(x[i][j][k]) == 1`.

This program produces the following output:
```
8 1 6
3 5 7
4 9 2
```

## Fixing variables partially
Suppose we want to find a solution in which the top-left cell is assigned the value 2.
In the one-hot encoding, the value 2 corresponds to $k=1$, so we fix

$$
\begin{aligned}
 x_{0,0,k} &=1 & {\rm if\,\,} k=1\\
 x_{0,0,k} &=0 & {\rm if\,\,} k\neq 1
\end{aligned}
$$

Moreover, since constraint $c_2$ enforces that each number $k+1$ appears exactly once, fixing
immediately implies that no other cell can take the value 2.
Therefore, we can also fix:

$$
\begin{aligned}
 x_{i,j,1} &=0 & {\rm if\,\,} (i,j)\neq (0,0)\\
\end{aligned}
$$

These fixed assignments reduce the number of remaining binary variables, which is often beneficial for local-search-based solvers.

## PyQBPP program for the magic square with fixing variables partially
We modify the program above as follows:
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

ml = {x[0][0][k]: 1 if k == 1 else 0 for k in range(9)}
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

In this code, we create a dict `ml` containing the fixed assignments.
We then create `full_sol`, a solution object for the original expression `f`.
Calling `replace(f, ml)` substitutes the fixed values into `f`, so the variables listed in `ml` disappear from `g`.
As a result, the solution `sol` returned by the solver does not include those fixed variables.
Finally, we reconstruct a complete assignment by merging `sol` and `ml` into `full_sol` via `set()`.
The reconstructed solution `full_sol` represents the full magic square.

This program produces the following output:
```
2 7 6
9 5 1
4 3 8
```
We can confirm that the top-left cell is 2, as intended.

## Concise constraint construction with `einsum`

Constraints `c2`, `c3`, and `c4` are built with triple for-loops in the
program above. Each of these is essentially a tensor contraction over the
$3 \times 3 \times 9$ binary array `x`, so they can be rewritten in a single
line each using [`qbpp.einsum`](EINSUM):

```python
vals = qbpp.array([1, 2, 3, 4, 5, 6, 7, 8, 9])

# c2: each value k appears exactly once.  temp[k] = Σ_{i,j} x[i,j,k]
c2 = qbpp.sum(qbpp.constrain(qbpp.einsum("ijk->k", x), equal=1))

# c3: row[i] = Σ_{j,k} (k+1) x[i,j,k], column[j] = Σ_{i,k} (k+1) x[i,j,k]
row    = qbpp.einsum("k,ijk->i", vals, x)
column = qbpp.einsum("k,ijk->j", vals, x)
c3 = qbpp.sum(qbpp.constrain(row,    equal=15)) + \
     qbpp.sum(qbpp.constrain(column, equal=15))

# c4: diagonal Σ_k (k+1) Σ_i x[i,i,k]  — "ii" ties axes 0 and 1
diag = qbpp.einsum("k,iik->", vals, x)

# anti-diagonal: same pattern but with axis 1 reversed.
# Use slicing + concat to flip x along axis 1.
x_flip = qbpp.concat([x[:, 2:3, :], x[:, 1:2, :], x[:, 0:1, :]], axis=1)
anti_diag = qbpp.einsum("k,iik->", vals, x_flip)
c4 = qbpp.constrain(diag, equal=15) + qbpp.constrain(anti_diag, equal=15)
```

Reading the subscripts:

- **`"ijk->k"`** (c2) — sum over `i` and `j`, keep `k`.
- **`"k,ijk->i"`** (row) — contract `j, k` between `vals` (axis `k`) and `x`
  (axes `i, j, k`), keep `i`.
- **`"k,ijk->j"`** (column) — same as row but keep `j`.
- **`"k,iik->"`** (diagonal) — `ii` repeated within `x` ties axes 0 and 1
  (`x[i,i,k]`); the result is a scalar, summed over both `k` and the diagonal
  `i`.

The anti-diagonal needs `x[i, n-1-i, k]`, which is not directly expressible as
einsum subscripts, so we reverse axis 1 of `x` first using Python slice syntax
(`x[:, 2:3, :]`, `x[:, 1:2, :]`, `x[:, 0:1, :]` — each single-element slice
keeps the axis) and `qbpp.concat(..., axis=1)`. After that, the same
`"k,iik->"` pattern yields the anti-diagonal sum.

The resulting QUBO expression is identical to the for-loop version, but each
constraint is expressed in one line that mirrors its mathematical definition.
For larger sizes the `einsum` formulation is also much faster, since it runs
entirely inside the C++ backend with multithreading — avoiding the
per-iteration Python `ctypes` overhead of the for-loop version.
