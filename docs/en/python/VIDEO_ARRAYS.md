---
last_modified: 2026-10-26
layout: default
nav_exclude: true
title: "Video: Arrays"
description: "The points of each chapter of the video \"QUBO++ Arrays (Python)\", with the programs shown in it and their output."
lang: en
hreflang_alt: "ja/python/VIDEO_ARRAYS"
hreflang_lang: "ja"
video: arrays
---

# Video: Arrays (Python)

A companion to the video "QUBO++ Arrays (Python)".
For each chapter it gives the main points, the programs shown in the video with their output, and links to the pages that explain more.
Click "▶ Play the video from …" to play from that scene.
Programs that the video shows in part are given here in full, ready to run.

{% include video_embed.html slug="arrays" %}

What the video covers:

- Integer arrays made with `qbpp.array`, element-wise operations (such as `c * x`), and the shapes of arrays
- The sum functions `qbpp.sum` and `qbpp.vector_sum`, and what `axis` means (also for 3-D arrays)
- Writing row and column constraints at once by comparing arrays and using `qbpp.cons`
- Solving an assignment problem, a transportation problem and a duty roster with no loops
- Comparing how fast the expression is built with loops and with array functions

Back to the list of [Videos (Tutorials)](../VIDEOS)

## Arrays: a review

{% include video_seek.html t="2:28" %}

Give `qbpp.var` a shape, and you get an array of variables.
`x[i]` takes out row i and `x[:, j]` takes out column j, as arrays.

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(3, 4))
print(x.shape)
print(x[1])
print(x[:, 2])
```

Output:

```
(3, 4)
[x[1][0], x[1][1], x[1][2], x[1][3]]
[x[0][2], x[1][2], x[2][2]]
```

See [Multi-dimensional Variables](MULTIDIM) for more.

## Element-wise operations

### Make an integer array with qbpp.array

{% include video_seek.html t="3:38" %}

A table of integers, such as coefficients or constant terms, becomes an integer array with `qbpp.array`.
Nested lists give a 2-D array; each inner list becomes one row.

```python
import pyqbpp as qbpp

c = qbpp.array([[9, 2, 7, 8],
                [6, 4, 3, 7],
                [5, 8, 1, 8]])
print(c)
print(c.shape)
print(c[1][2])
```

Output:

```
[[9, 2, 7, 8], [6, 4, 3, 7], [5, 8, 1, 8]]
(3, 4)
3
```

### Computed element by element

{% include video_seek.html t="4:44" %}

`c * x` is an array of expressions: each coefficient times the variable at the same position.
An operation with a number, such as `2 * x + 1`, and the negation `~x` work on every element in the same way.

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(2, 3))
c = qbpp.array([[1, 2, 3], [4, 5, 6]])
print(c * x)
print(2 * x + 1)
print(~x)
```

Output:

```
[[x[0][0], 2*x[0][1], 3*x[0][2]], [4*x[1][0], 5*x[1][1], 6*x[1][2]]]
[[1 +2*x[0][0], 1 +2*x[0][1], 1 +2*x[0][2]], [1 +2*x[1][0], 1 +2*x[1][1], 1 +2*x[1][2]]]
[[~x[0][0], ~x[0][1], ~x[0][2]], [~x[1][0], ~x[1][1], ~x[1][2]]]
```

See [Array Operations](OPVECTOR) for more.

### Arrays must have the same shape

{% include video_seek.html t="6:08" %}

Two arrays are computed element by element, so they must have the same shape.
Multiplying the 2-by-2 `c` and the 2-by-3 `x` raises a ValueError.
An operation with a number works for an array of any shape.

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(2, 3))
c = qbpp.array([[1, 2],
                [3, 4]])
print(c * x)
```

Output (only the message line of the error is shown):

```
ValueError: Array *: shape mismatch (2, 2) vs (2, 3)
```

### Make constants QUBO++ arrays with qbpp.array

{% include video_seek.html t="7:13" %}

An array made with `qbpp.array` is converted just once, stays fast however many times it is used, and can be computed with as an array, as in `2 * c` or `c + 1`.
A plain list also works in an expression, but in Python, multiplying a list by a number repeats the list.
In the next program, `2 * c` has 4 rows and 3 columns, so `2 * c * x` raises a ValueError: the shapes differ.

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(2, 3))
c = [[1, 2, 3], [4, 5, 6]]
print(2 * c)
print(2 * c * x)
```

Output (only the message line of the error is shown):

```
[[1, 2, 3], [4, 5, 6], [1, 2, 3], [4, 5, 6]]
ValueError: Array *: shape mismatch (4, 3) vs (2, 3)
```

With `c = qbpp.array([[1, 2, 3], [4, 5, 6]])`, `2 * c` doubles every element and can be multiplied by `x`.
On the other hand, list operations such as `append` do not work on a `qbpp.array`.
`c == 9` means a constraint, not True or False. To change an element, write `c[i][j] = v`.

See "array and Python `list`" in [Multi-dimensional Variables](MULTIDIM) for more.

## Sum functions

### qbpp.sum and qbpp.vector_sum

{% include video_seek.html t="9:21" %}

`qbpp.sum` returns one expression: the sum of all the elements.
`qbpp.vector_sum` adds along an axis and returns an array of expressions: `axis=1` gives the sum of each row (3 of them), `axis=0` the sum of each column (4 of them).

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(3, 4))
print(qbpp.sum(x))
print(qbpp.vector_sum(x, axis=1))
print(qbpp.vector_sum(x, axis=0))
```

Output:

```
x[0][0] +x[0][1] +x[0][2] +x[0][3] +x[1][0] +x[1][1] +x[1][2] +x[1][3] +x[2][0] +x[2][1] +x[2][2] +x[2][3]
[x[0][0] +x[0][1] +x[0][2] +x[0][3], x[1][0] +x[1][1] +x[1][2] +x[1][3], x[2][0] +x[2][1] +x[2][2] +x[2][3]]
[x[0][0] +x[1][0] +x[2][0], x[0][1] +x[1][1] +x[2][1], x[0][2] +x[1][2] +x[2][2], x[0][3] +x[1][3] +x[2][3]]
```

### The axis is the index that moves

{% include video_seek.html t="10:36" %}

In an element `x[i][j]` of a 2-D array, the first index i is axis 0 and the second index j is axis 1.

- `axis=1`: j moves while adding, so it gives the sum of each row: three expressions, told apart by i.
- `axis=0`: i moves while adding, so it gives the sum of each column: four expressions, told apart by j.
- Without `axis`, it adds along the last axis (`axis=1` for a 2-D array).

### 3-D arrays and axis

{% include video_seek.html t="11:44" %}

For 3-D arrays, too, `axis` is the index that moves while adding. That axis disappears, leaving an array with one dimension fewer.
Without `axis`, it adds along the last axis (`axis=2`).

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(2, 3, 4))
print("x:", x.shape)
for k in range(3):
    print(f"axis={k}:", qbpp.vector_sum(x, axis=k).shape)
print(qbpp.vector_sum(x, axis=2)[1][2])
```

Output:

```
x: (2, 3, 4)
axis=0: (3, 4)
axis=1: (2, 4)
axis=2: (2, 3)
x[1][2][0] +x[1][2][1] +x[1][2][2] +x[1][2][3]
```

### Use qbpp.sum, not the built-in sum

{% include video_seek.html t="13:40" %}

We add 30,000 terms with the built-in `sum` and with `qbpp.sum`, and compare the time to build the expression. The two expressions are the same.

```python
import time
import pyqbpp as qbpp

x = qbpp.var("x", shape=30000)
terms = [(i % 7 + 1) * x[i] for i in range(30000)]

t = time.perf_counter()
f = sum(terms)         # the built-in sum
print(f"sum:      {time.perf_counter() - t:.2f} s")

t = time.perf_counter()
g = qbpp.sum(terms)
print(f"qbpp.sum: {time.perf_counter() - t:.2f} s")
```

In the run for the video, the built-in `sum` took about 3.4 seconds and `qbpp.sum` about 0.02 seconds: `qbpp.sum` was more than 100 times faster.
The built-in `sum` rebuilds the whole expression for each term, so in some environments its time grows with the square of the number of terms.
`qbpp.sum` adds all the terms at once. It also takes lists and generator expressions as they are.

See [Sum Functions](SUM) for more.

## Constraints on arrays

### Comparing an array gives a constraint for each element

{% include video_seek.html t="15:14" %}

Comparing an array with a number gives an array of constraints, one per element.
Wrapped in `qbpp.cons`, every element is declared as a constraint at once.

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(3, 4))
f = qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
print(f)
g = qbpp.cons(qbpp.vector_sum(x, axis=0) <= 1)
print(g)
```

Output:

```
cons(x[0][0] +x[0][1] +x[0][2] +x[0][3] == 1)
+cons(x[1][0] +x[1][1] +x[1][2] +x[1][3] == 1)
+cons(x[2][0] +x[2][1] +x[2][2] +x[2][3] == 1)
cons(x[0][0] +x[1][0] +x[2][0] <= 1)
+cons(x[0][1] +x[1][1] +x[2][1] <= 1)
+cons(x[0][2] +x[1][2] +x[2][2] <= 1)
+cons(x[0][3] +x[1][3] +x[2][3] <= 1)
```

### The forms from the previous video work for arrays

{% include video_seek.html t="16:23" %}

With `v = qbpp.vector_sum(x, axis=1)` (the three row sums), you can write:

| Form | Meaning |
|---|---|
| `qbpp.cons(v == 1)` | Every element is 1 |
| `qbpp.cons(v, equal=1)` | The same as above |
| `qbpp.cons(v == [30, 25, 45])` | A value per element (a list or an array) |
| `qbpp.cons(v <= 1)`　`qbpp.cons(v >= 1)` | Upper bound, lower bound |
| `qbpp.cons(v, between=(1, 2))` | Range |
| `100 * qbpp.cons(…)` | The weight multiplies every constraint |
| `qbpp.sum(qbpp.constrain(v, equal=1))` | Written as penalty expressions |

`qbpp.constrain` returns an array of penalties, one per element, so `qbpp.sum` combines them into one expression.

See [Nonlinear Functions and Native Constraints](CONSTRAINTS) for more.

## Example: the assignment problem

### The problem

{% include video_seek.html t="17:49" %}

Four people get four jobs, one job each, with the smallest total cost.
The table is the cost `c` when person i does job j (rows are people, columns are jobs).

| | Job 0 | Job 1 | Job 2 | Job 3 |
|---|---:|---:|---:|---:|
| Person 0 | 9 | 2 | 7 | 8 |
| Person 1 | 6 | 4 | 3 | 7 |
| Person 2 | 5 | 8 | 1 | 8 |
| Person 3 | 7 | 6 | 9 | 4 |

An assignment is a 4-by-4 array `x` of 0/1 variables; `x[i][j]` is 1 only when person i does job j.
The constraints: every row sum and every column sum is 1.
For example, picking the diagonal cells costs 9 + 4 + 1 + 4 = 18.

### The program

{% include video_seek.html t="19:05" %}

The objective is `qbpp.sum(c * x)`, and the constraints are the 8 row and column sums from `vector_sum` compared with 1, all written without loops.
ExhaustiveSolver checks all the assignments of the 16 variables.

```python
import pyqbpp as qbpp

c = qbpp.array([[9, 2, 7, 8], [6, 4, 3, 7],
                [5, 8, 1, 8], [7, 6, 9, 4]])
x = qbpp.var("x", shape=(4, 4))
cost = qbpp.sum(c * x)
f = (cost
     + 100 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
     + 100 * qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
f.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(f).search()
print("cost =", sol(cost), " violated =", f.cons(sol))
print(sol(x))
print(qbpp.onehot_to_int(sol(x), axis=1))
```

Output:

```
cost = 13  violated = 0
[[0, 1, 0, 0], [1, 0, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
[1, 0, 2, 3]
```

The total cost is 13, with no violated constraints.

### Read the answer with sol(x) and onehot_to_int

{% include video_seek.html t="20:26" %}

- `sol(x)` returns the values of the variables in an array of the same shape as `x` (output line 2).
- `qbpp.onehot_to_int(sol(x), axis=1)` returns where the 1 is in each row (output line 3).
  Person 0 does job 1, person 1 job 0, person 2 job 2 and person 3 job 3, at a cost of 2 + 6 + 1 + 4 = 13.
- A row without exactly one 1 (a row with two 1s, or with none) gives -1.

See [Permutation Matrix](PERMUTATION) and [One-Hot to Integer Conversion](ONEHOT) for more.

## Loops vs array functions

### The same expression, built two ways

{% include video_seek.html t="21:37" %}

We build the expression of an assignment problem with n people and n jobs in two ways, adding the terms one at a time with loops and building it at once with array functions, and compare the times.
The two programs build exactly the same expression.

```python
import random
import time
import pyqbpp as qbpp

for n in [100, 300, 1000]:
    random.seed(1)
    c = [[random.randint(1, 99) for j in range(n)] for i in range(n)]
    x = qbpp.var("x", shape=(n, n))

    # loops: add one term at a time
    t = time.perf_counter()
    f = 0
    for i in range(n):
        for j in range(n):
            f += c[i][j] * x[i][j]
    for i in range(n):
        s = 0
        for j in range(n):
            s += x[i][j]
        f += 100 * qbpp.cons(s == 1)
    for j in range(n):       # the columns in the same way
        s = 0
        for i in range(n):
            s += x[i][j]
        f += 100 * qbpp.cons(s == 1)
    t_loop = time.perf_counter() - t

    # array functions: build it at once
    t = time.perf_counter()
    g = (qbpp.sum(qbpp.array(c) * x)
         + 100 * qbpp.cons(
             qbpp.vector_sum(x, axis=1) == 1)
         + 100 * qbpp.cons(
             qbpp.vector_sum(x, axis=0) == 1))
    t_array = time.perf_counter() - t

    print(f"n = {n:4d}: loops {t_loop:.3f} s, arrays {t_array:.3f} s, "
          f"ratio {t_loop / t_array:.1f}")
```

### Results

{% include video_seek.html t="22:37" %}

The output in the video (the times change on each run and depend on the environment):

```
n =  100: loops 0.024 s, arrays 0.004 s, ratio 5.9
n =  300: loops 0.097 s, arrays 0.019 s, ratio 5.0
n = 1000: loops 1.063 s, arrays 0.222 s, ratio 4.8
```

At every size, array functions were about 5 times faster (for n = 1000 there are a million variables).
Array functions compute everything at once inside QUBO++, while a Python loop calls one operation each time it goes around.

See [Performance Tips](TIPS) for more.

## Example: the transportation problem

### The problem

{% include video_seek.html t="23:45" %}

We ship goods from three factories to four stores, with the smallest total shipping cost.
The numbers in the table are the cost of shipping one unit; the right column is what each factory ships (its supply), the bottom row what each store receives (its demand). Both add up to 100.

| | Store 0 | Store 1 | Store 2 | Store 3 | Supply |
|---|---:|---:|---:|---:|---:|
| Factory 0 | 8 | 6 | 10 | 9 | 30 |
| Factory 1 | 9 | 12 | 13 | 7 | 25 |
| Factory 2 | 14 | 9 | 16 | 5 | 45 |
| Demand | 20 | 30 | 25 | 25 | |

`x[i][j]` is the amount (an integer) shipped from factory i to store j.
A row sum equals the supply, and a column sum equals the demand.
So no road carries more than the smaller of its supply and its demand (at most 20 from factory 0 to store 0).

### The program

{% include video_seek.html t="25:29" %}

It differs from the assignment program in two places.
The variables are integers with `integer=(0, upper)` (a different upper bound per element), and the right-hand sides of the constraints are `supply` and `demand`.
Integers give too many combinations to try them all, so EasySolver searches for 1 second.

```python
import pyqbpp as qbpp

supply = qbpp.array([30, 25, 45])
demand = qbpp.array([20, 30, 25, 25])
c = qbpp.array([[8, 6, 10, 9], [9, 12, 13, 7], [14, 9, 16, 5]])
upper = [[min(s, d) for d in demand] for s in supply]
x = qbpp.var("x", shape=(3, 4), integer=(0, upper))
cost = qbpp.sum(c * x)
f = (cost
     + 100 * qbpp.cons(qbpp.vector_sum(x, axis=1) == supply)
     + 100 * qbpp.cons(qbpp.vector_sum(x, axis=0) == demand))
f.simplify_as_binary()
sol = qbpp.EasySolver(f).search(time_limit=1)
print("upper =", upper)
print("cost =", sol(cost), " violated =", f.cons(sol))
print(sol(x))
```

The output in the video (EasySolver may give different results on each run):

```
upper = [[20, 30, 25, 25], [20, 25, 25, 25], [20, 30, 25, 25]]
cost = 810  violated = 0
[[0, 10, 20, 0], [20, 0, 5, 0], [0, 20, 0, 25]]
```

Setting every upper bound to 45, the largest supply, with `integer=(0, 45)` gives the same answer.

See "Arrays with per-element ranges" in [Integer Variables](INTEGER) for more.

### The plan with cost 810

{% include video_seek.html t="27:46" %}

Goods flow along only 6 roads.
Every factory ships exactly its supply, and every store receives exactly its demand.

| | Store 0 | Store 1 | Store 2 | Store 3 | Total |
|---|---:|---:|---:|---:|---:|
| Factory 0 | 0 | 10 | 20 | 0 | 30 |
| Factory 1 | 20 | 0 | 5 | 0 | 25 |
| Factory 2 | 0 | 20 | 0 | 25 | 45 |
| Total | 20 | 30 | 25 | 25 | |

The cost is 6 × 10 + 10 × 20 + 9 × 20 + 13 × 5 + 9 × 20 + 5 × 25 = 810.
Checked another way, with linear programming, 810 is the optimum.

## Example: a duty roster (3-D array)

### The problem

{% include video_seek.html t="29:01" %}

We plan the duties of 4 people over 3 days. There are three kinds of duty: day shift, night shift and day off.

- Every day, each person has exactly one of the three.
- Each day needs 2 on the day shift, 1 on the night shift and 1 off.
- Over the 3 days, each person has at most 2 day shifts, and at most 1 night shift and 1 day off.

`x[i][j][k]` is 1 when, on day i, person j has duty of kind k. With `shape=(3, 4, 3)` there are 36 variables.
Axis 0 is the day, axis 1 the person, and axis 2 the kind of duty.

### Constraints from sums along the three axes

{% include video_seek.html t="30:28" %}

- The sum with `axis=2` (the kind moves) is 1: each person has one duty a day (12 constraints)
- The sum with `axis=1` (the person moves) equals `need`: the head count of each duty every day (9 constraints)
- The sum with `axis=0` (the day moves) is at most `limit`: each person's limits over 3 days (12 constraints)

```python
import pyqbpp as qbpp

# Kind k: 0 Day, 1 Night, 2 Off
x = qbpp.var("x", shape=(3, 4, 3))
need = qbpp.array([[2, 1, 1], [2, 1, 1], [2, 1, 1]])
limit = qbpp.array([[2, 1, 1], [2, 1, 1],
                    [2, 1, 1], [2, 1, 1]])
f = (qbpp.cons(qbpp.vector_sum(x, axis=2) == 1)
     + qbpp.cons(qbpp.vector_sum(x, axis=1) == need)
     + qbpp.cons(qbpp.vector_sum(x, axis=0) <= limit))
f.simplify_as_binary()
sol = qbpp.EasySolver(f).search(time_limit=1)
print("violated =", f.cons(sol))
print(qbpp.onehot_to_int(sol(x), axis=2))
```

The output in the video (many rosters meet the conditions, and EasySolver gives different results on each run):

```
violated = 0
[[0, 0, 2, 1], [1, 2, 0, 0], [2, 0, 1, 0]]
```

The result of `onehot_to_int` is the roster, with days as rows and people as columns.
On day 0, persons 0 and 1 are on the day shift, person 2 is off, and person 3 is on the night shift.

See [Multi-dimensional Variables](MULTIDIM) for more.

## Summary

{% include video_seek.html t="32:38" %}

- An array of variables is made by `qbpp.var` with `shape`. Coefficients and constants go into QUBO++ arrays with `qbpp.array`; a table used many times is faster when converted once.
- Operations between arrays work element by element, so the two arrays must have the same shape. An operation with a number applies to every element.
- `qbpp.sum` returns one expression, the sum of all the elements; `qbpp.vector_sum` returns sums along an axis. `axis` tells which index moves in the sum, in 3-D arrays too.
- For sums, use `qbpp.sum`, not Python's built-in `sum`, which can be very slow depending on the environment.
- Comparing arrays with numbers or arrays gives arrays of constraints. Wrapped in `qbpp.cons`, they are all declared at once.
- Given an array, `sol` returns the values in an array of the same shape. `qbpp.onehot_to_int` finds where the 1 is along an axis.
- Array functions make programs shorter and easier to read; in this video they also built expressions about 5 times faster than loops.
