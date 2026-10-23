---
last_modified: 2026-10-23
layout: default
nav_exclude: true
title: "Nonogram"
nav_order: 105
lang: en
hreflang_alt: "ja/python/NONOGRAM"
hreflang_lang: "ja"
---

# Nonogram

A **nonogram** is a puzzle in which you complete a picture by painting some of the cells of a grid black.
To the left of each row and above each column, the lengths of the blocks of consecutive black cells in that row (column) are listed from left to right (from top to bottom).
For example, "2 5 2" means that blocks of 2, 5 and 2 black cells appear in this order, with at least one white cell between consecutive blocks.
"0" means that the row (column) has no black cells.
The goal is to decide which cells to paint so that all the clues are satisfied.

Here we solve the following $15\times 15$ puzzle ($H=15$ rows and $W=15$ columns):

<p align="center">
  <img src="../../images/nonogram.svg" alt="A 15×15 nonogram puzzle" width="60%">
</p>

Below, we first formulate the rows; the columns are handled in the same way.

## Shifts of the Blocks

Let the clue of row $i$ be $(r_{i,0}, r_{i,1}, \ldots, r_{i,m_i-1})$,
where $r_{i,k}$ is the length of the $k$-th block of row $i$ and $m_i$ is the number of blocks.
The cells are numbered $j=0,1,\ldots,W-1$ from the left end.

If all the blocks of row $i$ are aligned to the left, block $k$ starts at position

$$
e_{i,k}=\sum_{l=0}^{k-1}(r_{i,l}+1)
$$

(for $k=0$, the sum is empty, so $e_{i,0}=0$).
Since $e_{i,k+1}=e_{i,k}+r_{i,k}+1$, the right end of block $k$ is at position $e_{i,k+1}-2$, followed by one white cell.
Using $e_{i,m_i}$, given by the same formula with $k=m_i$, the right end of the last block $m_i-1$ is at position $e_{i,m_i}-2$;
that is, the leftmost $e_{i,m_i}-1$ cells are used, so

$$
d_i=W-(e_{i,m_i}-1)=W-\sum_{l=0}^{m_i-1}r_{i,l}-(m_i-1)
$$

cells are left over on the right. We call $d_i$ the **free space**.

For example, a row with $W=10$ and clue $(2, 1, 2)$ has $m_i=3$, $r_{i,0}=2$, $r_{i,1}=1$ and $r_{i,2}=2$.
Aligning all the blocks to the left gives the following, with $e_{i,0}=0$, $e_{i,1}=3$ and $e_{i,2}=5$.
Since $e_{i,3}=8$, the free space is $d_i=10-(8-1)=3$, and the three cells on the right are left over:

```
j   0 1 2 3 4 5 6 7 8 9
    # # . # . # # . . .
```

The position of block $k$ can be expressed as $e_{i,k}+t_{i,k}$ using the value $t_{i,k}$,
which tells how far the block is shifted to the right from the configuration in which all the blocks are aligned to the left.
We call $t_{i,k}$ the **shift** of block $k$.
The shift $t_{i,k}$ takes a value from $0$ to $d_i$, and the shifts form a non-decreasing sequence, that is,

$$
0\leq t_{i,0}\leq t_{i,1}\leq\cdots\leq t_{i,m_i-1}\leq d_i
$$

Since block $k+1$ starts after block $k$ with at least one white cell in between, if block $k$ is shifted to the right, block $k+1$ is shifted at least as far.
Also, no block can be shifted further than the free space.
Conversely, every sequence of shifts satisfying this condition corresponds to exactly one painting of the row that matches the clue.

For the row above, the following shows the left-aligned placement, an example placement of the blocks, and the placement in which all the blocks are aligned to the right:

```
j   0 1 2 3 4 5 6 7 8 9
    # # . # . # # . . .    t = (0, 0, 0)
    # # . . . # . # # .    t = (0, 2, 2)
    . . . # # . # . # #    t = (3, 3, 3)
```

The first line is the left-aligned placement, where all the shifts are $0$.
The second line keeps block $0$ in place and shifts blocks $1$ and $2$ two cells to the right. Equal values such as $t_{i,1}=t_{i,2}=2$ are allowed.
The third line is the right-aligned placement, where every block is shifted by the whole free space: $t_{i,0}=t_{i,1}=t_{i,2}=d_i=3$.

## Representing an Integer with a Domain Wall

Each shift $t_{i,k}$ is an integer from $0$ to $d_i$, so it must be represented by binary variables.
Here we represent the shifts with domain walls.
As shown later, with domain walls, whether each position is covered by a block (that is, black) can be expressed by a simple linear expression of the variables.

We restrict $d$ binary variables $w_0, w_1, \ldots, w_{d-1}$ to the form $1\cdots 1\,0\cdots 0$, in which all the $1$s come before all the $0$s.
This form is called a **domain wall**, and the boundary between the $1$s and the $0$s is regarded as a "wall".
There are $d+1$ patterns of this form, and the position of the wall, that is, the number of $1$s before the wall,

$$
t=\sum_{p=0}^{d-1}w_p
$$

represents an integer $t$ from $0$ to $d$.
For example, with $d=3$, the wall of $110$ is between the second and third variables, and it represents $t=2$.

- The condition for this form is the inequality $w_p\geq w_{p+1}$ $(0\leq p\leq d-2)$ between neighbors, that is, "a $1$ never follows a $0$".
- Moving the wall by one (flipping one variable) increases or decreases the represented integer by $1$.
- Unlike representing an integer just by the number of $1$s regardless of their order (the unary encoding; with $d=3$, $101$ and $011$ also represent $2$),
  a domain wall represents each integer in exactly one way.
  Therefore, $w_p=1$ alone tells us that "$t$ is greater than $p$".

[Slice and Concat](SLICE_CONCAT) also has an example of a domain wall.

## Representing the Shifts with Domain Walls

We represent the shift $t_{i,k}$ of block $k$ of row $i$ by a domain wall of $d_i$ binary variables $y_{i,k,0}, y_{i,k,1}, \ldots, y_{i,k,d_i-1}$:

$$
t_{i,k}=\sum_{p=0}^{d_i-1}y_{i,k,p},\qquad y_{i,k,p}=1 \iff t_{i,k}>p
$$

For the second line of the example above ($t_{i,0}=0$, $t_{i,1}=2$, $t_{i,2}=2$ and $d_i=3$), the variables take the following values:

| $p$ | 0 | 1 | 2 |
|:--|:-:|:-:|:-:|
| $y_{i,0,p}$ ($t_{i,0}=0$) | 0 | 0 | 0 |
| $y_{i,1,p}$ ($t_{i,1}=2$) | 1 | 1 | 0 |
| $y_{i,2,p}$ ($t_{i,2}=2$) | 1 | 1 | 0 |

## Constraints of a Row

Arrange the variables $y_{i,k,p}$ of row $i$ in a table with block $k$ as the row and $p$ as the column, as in the table of the previous section.

- Each row (each block) is a domain wall $1\cdots 1\,0\cdots 0$.
- Since a later block has a larger (or equal) shift, each column read from the top is a reversed domain wall $0\cdots 0\,1\cdots 1$.
  This is because $t_{i,k}\leq t_{i,k+1}$ is the same as "if $y_{i,k,p}=1$, then $y_{i,k+1,p}=1$" for every $p$.
  In the table of the previous section, the columns read $0,1,1$, $0,1,1$ and $0,0,0$ from the top.

We therefore impose the following two kinds of conditions on row $i$ ($\overline{y}=1-y$ is the negation of $y$).

- Each row is a domain wall, that is, "a $1$ never follows a $0$":

$$
\begin{aligned}
\overline{y_{i,k,p}}\,y_{i,k,p+1}=0 && (0\leq k\leq m_i-1,\ 0\leq p\leq d_i-2)
\end{aligned}
$$

- Each column is a reversed domain wall, that is, "a $0$ never lies below a $1$":

$$
\begin{aligned}
y_{i,k,p}\,\overline{y_{i,k+1,p}}=0 && (0\leq k\leq m_i-2,\ 0\leq p\leq d_i-1)
\end{aligned}
$$

Each term is $1$ only where its condition is broken and $0$ elsewhere,
so it can be added to the expression directly as a penalty term without declaring it as a constraint.

Since a domain wall limits each shift to the range from $0$ to $d_i$, the conditions $0\leq t_{i,0}$ and $t_{i,m_i-1}\leq d_i$ are satisfied automatically.

## Colors Seen from a Row

For block $k$ of row $i$ and an integer $q$, let $Y_{i,k}(q)$ be the truth value of "the shift $t_{i,k}$ is greater than $q$":

$$
Y_{i,k}(q)=\begin{cases}
1 & (q<t_{i,k})\\
0 & (q\geq t_{i,k})
\end{cases}
$$

As $q$ increases, $Y_{i,k}(q)$ changes as $1,\ldots,1,0,\ldots,0$ and becomes $0$ for the first time at $q=t_{i,k}$.
For $0\leq q\leq d_i-1$, it is exactly the domain wall bit $y_{i,k,q}$.
Outside this range, its value is fixed because $t_{i,k}$ is between $0$ and $d_i$. In summary:

$$
Y_{i,k}(q)=\begin{cases}
1 & (q<0)\\
y_{i,k,q} & (0\leq q\leq d_i-1)\\
0 & (q\geq d_i)
\end{cases}
$$

Block $k$ covers positions $e_{i,k}+t_{i,k}$ through $e_{i,k}+t_{i,k}+r_{i,k}-1$, so the condition that block $k$ covers position $j$ can be rewritten as follows:

$$
\begin{aligned}
&e_{i,k}+t_{i,k}\leq j\leq e_{i,k}+t_{i,k}+r_{i,k}-1\\
\iff\ &j-e_{i,k}-r_{i,k}<t_{i,k}\leq j-e_{i,k}\\
\iff\ &Y_{i,k}(j-e_{i,k}-r_{i,k})=1\ \text{and}\ Y_{i,k}(j-e_{i,k})=0\\
\iff\ &Y_{i,k}(j-e_{i,k}-r_{i,k})-Y_{i,k}(j-e_{i,k})=1
\end{aligned}
$$

The last step holds because $Y_{i,k}(q)$ changes as $1,\ldots,1,0,\ldots,0$ in $q$:
its value at a smaller $q$ minus its value at a larger $q$ is $0$ or $1$, and it is $1$ only when the former is $1$ and the latter is $0$.

Therefore, the color of cell $(i,j)$ seen from row $i$ ($1$ for black, $0$ for white) is the sum, over the blocks, of whether each block covers the cell:

$$
R_{i,j}=\sum_{k=0}^{m_i-1}\bigl(Y_{i,k}(j-e_{i,k}-r_{i,k})-Y_{i,k}(j-e_{i,k})\bigr)
$$

If the two kinds of conditions above are satisfied, the blocks do not overlap, so $R_{i,j}$ is $0$ or $1$.

Let us check this with the second line of the example ($t_{i,0}=0$, $t_{i,1}=2$ and $t_{i,2}=2$).

- At position $5$, the term for block $1$ ($e_{i,1}=3$, $r_{i,1}=1$) is $Y_{i,1}(1)-Y_{i,1}(2)=y_{i,1,1}-y_{i,1,2}=1-0=1$; block $1$ covers the cell, so it is black.
- At position $6$, the term for block $2$ ($e_{i,2}=5$, $r_{i,2}=2$) is $Y_{i,2}(-1)-Y_{i,2}(1)=1-y_{i,2,1}=1-1=0$.
  Block $2$ starts at position $7$, so it does not cover position $6$ yet. The terms for the other blocks are also $0$, so the cell is white.

In this way, whether a cell is black is determined by the truth values of "the shift is greater than $q$".
With domain walls, these truth values are the variables themselves, so the color of a cell is a linear expression of the variables.
If the shifts were represented by [native integer variables](INTEGER), these truth values could not be written as expressions of the integers, and the colors of the cells could not be expressed this simply.

## Handling the Columns in the Same Way

The columns are handled in the same way.
Let the clue of column $j$ be $(c_{j,0}, c_{j,1}, \ldots, c_{j,n_j-1})$,
and represent the downward shifts from the top-aligned positions by domain walls $z_{j,k,p}$.
Replacing $y$ with $z$, $r$ with $c$, $W$ with $H$ and position $j$ with $i$ in the formulas for the rows
gives the constraints of the columns and the color $C_{i,j}$ of cell $(i,j)$ seen from column $j$.

## Matching the Colors of Rows and Columns

Finally, we require that, for every cell, the color seen from the row and the color seen from the column are equal:

$$
\begin{aligned}
R_{i,j}-C_{i,j}=0 && (0\leq i\leq H-1,\ 0\leq j\leq W-1)
\end{aligned}
$$

The conditions on the blocks are expressed by quadratic penalty terms and those on the colors of the cells by linear equality constraints, and no auxiliary variables are needed.

## PyQBPP Program

The following program declares the constraints above as
[native constraints](CONSTRAINTS) with `qbpp.cons()` and solves the puzzle with the Easy Solver:

```python
import pyqbpp as qbpp

# Clues: ROWS[i][k] is the length of the k-th block of row i,
# and COLS[j][k] is the length of the k-th block of column j.
ROWS = [[], [1, 1], [2, 2], [3, 3], [13], [13], [2, 5, 2], [2, 5, 2],
        [13], [6, 6], [5, 5], [11], [9], [5], []]
COLS = [[], [10], [10], [3, 5], [2, 5], [10], [6, 3], [5, 3],
        [6, 3], [10], [2, 5], [3, 5], [10], [10], []]
H, W = len(ROWS), len(COLS)


# Domain walls w[k, p] of a row (column) of length n: they represent the shift of block k.
def line_var(name, clue, n):
    d = n - sum(clue) - len(clue) + 1  # free space
    return qbpp.var(name, shape=(len(clue), d))


# Expression that is 1 if the shift of block k is greater than q.
def moved(w, k, q):
    if q < 0:
        return 1
    if q >= w.shape[1]:
        return 0
    return w[k, q]


# Expression that is 1 if position j is black.
def black(w, clue, j):
    b = []
    e = 0  # left-aligned (top-aligned) start position of block k
    for k in range(len(clue)):
        b.append(moved(w, k, j - e - clue[k]) - moved(w, k, j - e))
        e += clue[k] + 1
    return qbpp.sum(b)


# Constraints of one row (column).
def line_cons(w):
    m, d = w.shape
    g = 0
    for k in range(m):
        for p in range(d - 1):
            g += ~w[k, p] * w[k, p + 1]  # domain wall form (1 if a 1 follows a 0)
    for k in range(m - 1):
        for p in range(d):
            g += w[k, p] * ~w[k + 1, p]  # block order (1 if a 0 is below a 1)
    return g


y = [line_var(f"y{i}", ROWS[i], W) for i in range(H)]  # domain walls of row i
z = [line_var(f"z{j}", COLS[j], H) for j in range(W)]  # domain walls of column j

f = 0
for w in y + z:
    f += line_cons(w)
for i in range(H):
    for j in range(W):
        f += qbpp.cons(black(y[i], ROWS[i], j) - black(z[j], COLS[j], i) == 0)  # the colors of the row and the column match

f.simplify_as_binary()
sol = qbpp.EasySolver(f).search(target_energy=0)
for i in range(H):
    print("".join("#" if sol(black(y[i], ROWS[i], j)) else "." for j in range(W)))
```

The clues are given as a list of lists: `ROWS[i][k]` is $r_{i,k}$ and `COLS[j][k]` is $c_{j,k}$.
A row (column) with clue "0" is the empty list `[]`.

- `line_var(name, clue, n)` creates the domain walls of a row (column) of length `n` as a 2-dimensional array of binary variables of shape $(m, d)$.
  `w[k, :]` is the domain wall that represents the shift of block $k$.
  For a row (column) whose clue is the empty list, $m=0$, so the array has no elements.
- `moved(w, k, q)` returns $Y_{i,k}(q)$ (for a column, $Z_{j,k}(q)$, obtained by replacing $y$ with $z$), which is `1`, `0` or the variable `w[k, q]` depending on $q$.
- `black(w, clue, j)` returns the expression for the color of position `j`. Inside the loop, the variable `e` holds $e_{i,k}$.
  Since the terms of the blocks are collected in a list and added with `qbpp.sum()`, an expression is returned even at a position whose color is determined by the clue alone and all of whose terms are constants.
- `line_cons(w)` returns, for one row (column), the sum of the penalty terms for the two kinds of conditions:
  `~w[k, p] * w[k, p + 1]` (each row is a domain wall) and `w[k, p] * ~w[k + 1, p]` (each column is a reversed domain wall).

`y` is the list of the domain walls of the rows: `y[i]` is the 2-dimensional array of row $i$, and `y[i][k, p]` is $y_{i,k,p}$.
Since the number of blocks and the free space differ from row to row, the arrays do not have the same shape, so they are stored in a Python list.
`z` is the list of the domain walls of the columns in the same way.
`black(y[i], ROWS[i], j)` is the color $R_{i,j}$ seen from the row and `black(z[j], COLS[j], i)` is the color $C_{i,j}$ seen from the column,
and the final double loop declares the equality constraints that the two are equal.
There are 236 variables in $y$ and $z$.

Since terms containing `~w[k, p]` are added to the expression directly, the program simplifies the expression with `f.simplify_as_binary()` before solving
($\overline{y}$ is expanded into $1-y$ and identical terms are merged).

This puzzle has no objective function to minimize, and the energy becomes $0$ when all the penalty terms are $0$ and all the constraints are satisfied.
`search(target_energy=0)` stops the search as soon as a solution with energy $0$ is found.
Finally, using the value of the color `black(y[i], ROWS[i], j)` seen from the row, the program prints black cells as `#` and white cells as `.`.

Running the program produces the following output, and the face of a cat appears:

```
...............
.#...........#.
.##.........##.
.###.......###.
.#############.
.#############.
.##..#####..##.
.##..#####..##.
.#############.
.######.######.
.#####...#####.
..###########..
...#########...
.....#####.....
...............
```

This is the only solution of this puzzle.

## Solving as a QUBO

Constraints declared with `qbpp.cons()` can be expanded into the classic penalty form with [`qbpp.expand_cons()`](CONSTRAINTS#expanding-into-the-classic-penalty-form).
The equality constraint $R_{i,j}-C_{i,j}=0$ becomes the penalty term $(R_{i,j}-C_{i,j})^2$.
Since $R_{i,j}$ and $C_{i,j}$ are both linear expressions, this term is quadratic.
The conditions on the blocks are quadratic penalty terms from the start, so the expanded expression is a QUBO without auxiliary variables.
Every term is $0$ or more, and the energy is $0$ only when all the conditions are satisfied.
This form is used to pass the problem to other solvers that accept a QUBO.

Adding the following lines at the end of the program above, the program solves the QUBO obtained by expanding `f` and prints the numbers of variables and terms:

```python
g = qbpp.expand_cons(f)
g.simplify_as_binary()
sol = qbpp.EasySolver(g).search(target_energy=0)
print(f"var_count = {sol.info['var_count']}, term_count = {sol.info['term_count']}")
```

Since the expanded expression is not simplified, `g.simplify_as_binary()` is called before solving.
The output is as follows:

```
var_count = 236, term_count = 968
```

There are 236 variables, the same as before the expansion, and no auxiliary variables are added.
Expanding $(R_{i,j}-C_{i,j})^2$ produces products of the variables of the row domain walls and those of the column domain walls, and there are 968 terms.
At this size, a solution is found quickly also for the expanded QUBO.
