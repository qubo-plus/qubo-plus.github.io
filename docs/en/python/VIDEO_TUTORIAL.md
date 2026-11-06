---
last_modified: 2026-10-30
layout: default
nav_exclude: true
title: "Video: QUBO++ Tutorial"
description: "The points of each chapter of the video \"QUBO++ Tutorial (Python)\", with the programs shown in it and their output."
lang: en
hreflang_alt: "ja/python/VIDEO_TUTORIAL"
hreflang_lang: "ja"
video: tutorial
---

# Video: QUBO++ Tutorial (Python)

A companion to the video "QUBO++ Tutorial (Python)".
For each chapter it gives the main points, the programs shown in the video with their output, and links to the pages that explain more.
Click "▶ Play the video from …" to play from that scene.
Programs that the video shows in part are given here in full, ready to run.

{% include video_embed.html slug="tutorial" %}

What the video covers:

- Combinatorial optimization and QUBO, and how QUBO++ solves an expression written as math
- Variables and expressions, tidying up with `simplify_as_binary`, solving with a solver and reading the solution
- Arrays of variables (`qbpp.sum`, one-hot, negated literals `~x`, array operations) and the partition problem
- Writing constraints (penalty expressions and `qbpp.cons()`), integer variables and inequality constraints
- Choosing among the three solvers, nonlinear functions and higher-degree terms, and putting everything into one model

Back to the list of [Videos (Tutorials)](../VIDEOS)

## What is QUBO++

### Combinatorial optimization

{% include video_seek.html t="0:41" %}

A problem of choosing the best combination from many options is called a combinatorial optimization problem.
Each extra 0-or-1 variable doubles the number of combinations.
With just 100 variables there are about $10^{30}$ combinations, far too many to check them all.

### QUBO

{% include video_seek.html t="1:29" %}

QUBO minimizes a quadratic polynomial of variables that are 0 or 1.
For example, expanding $f = (a + 2b + 3c + 4d - 5)^2$ gives the following (for 0/1 variables, $a^2 = a$).

$$
f = 25 - 9a - 16b - 21c - 24d + 4ab + 6ac + 8ad + 12bc + 16bd + 24cd
$$

Putting the linear coefficients on the diagonal and the quadratic ones at their pair gives the matrix $Q$ (the constant 25 stays outside).

| | a | b | c | d |
|---|---:|---:|---:|---:|
| a | −9 | 4 | 6 | 8 |
| b | | −16 | 12 | 16 |
| c | | | −21 | 24 |
| d | | | | −24 |

In practice, constraints become penalty expressions, inequalities also need auxiliary variables, and all of it is expanded into a matrix. Doing this by hand is a lot of work.

See [QUBO Problem](QUBO) for more.

### QUBO++

{% include video_seek.html t="2:43" %}

In QUBO++, you write the expression itself instead of a matrix.
The $f$ above is one line: `f = qbpp.sqr(a + 2 * b + 3 * c + 4 * d - 5)` in Python,
and `auto f = qbpp::sqr(a + 2 * b + 3 * c + 4 * d - 5);` in C++.
QUBO++ expands it and builds the matrix automatically, and the expression goes straight to a built-in solver.

## Setup

{% include video_seek.html t="4:06" %}

To just try it, write and run a program on the spot in the Playground on the documentation site.
To use it on your own machine, install it with pip in a terminal (it runs on Linux; on Windows, use it in WSL).

```bash
pip install pyqbpp
```

A program starts with `import pyqbpp as qbpp`.

See [Installation](INSTALL) and [Playground](PLAYGROUND) for more.

## Variables and expressions

### Variables and expressions

{% include video_seek.html t="4:42" %}

`qbpp.var` creates a variable that takes the value 0 or 1. The name in the parentheses is used when printing.
Combining variables with plus, minus and times gives an expression, which is expanded automatically.

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
f = (a + b - 1) * (b + c - 1)
print("f =", f)
```

Output:

```
f = 1 -b -c -a -b +a*b +a*c +b*b +b*c
```

### Simplifying

{% include video_seek.html t="5:45" %}

`simplify()` merges like terms. `simplify_as_binary()` also uses $b^2 = b$ for 0/1 variables and gives the simplest form.
Always call `simplify_as_binary()` before passing an expression to a solver.
`f.simplify_as_binary()` rewrites f itself; `qbpp.simplify_as_binary(f)` returns a new expression.

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
f = (a + b - 1) * (b + c - 1)
print("f =", f)
print("f =", f.simplify())
print("f =", f.simplify_as_binary())
```

Output:

```
f = 1 -b -c -a -b +a*b +a*c +b*b +b*c
f = 1 -a -2*b -c +a*b +a*c +b*b +b*c
f = 1 -a -b -c +a*b +a*c +b*c
```

See [Variables and Expressions](VARIABLE) for more.

## Solving

### A problem as an expression

{% include video_seek.html t="6:42" %}

With 0/1 variables a, b, c, d, we look for combinations where $a + 2b + 3c + 4d = 5$.
$f = (a + 2b + 3c + 4d - 5)^2$ is never negative, and it is 0 only when the condition holds.
Of the 16 assignments, $f = 0$ for two: (a, b, c, d) = (0, 1, 1, 0) and (1, 0, 0, 1).
The values that minimize $f$ are the answer.

### Solving with EasySolver

{% include video_seek.html t="7:42" %}

`qbpp.EasySolver(f)` makes a solver, and `search` starts the search.
`time_limit` is the longest search time in seconds, and `target_energy=0` stops the search as soon as a solution with $f \le 0$ is found.

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
d = qbpp.var("d")
f = qbpp.sqr(a + 2 * b + 3 * c + 4 * d - 5)
f.simplify_as_binary()
solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=10, target_energy=0)
print(sol)
```

The output in the video (there are two optimal solutions, so a run may return the other one):

```
Sol(energy=0, {a: 0, b: 1, c: 1, d: 0})
```

### Reading the solution

{% include video_seek.html t="8:48" %}

`sol.energy` is the value of $f$ at the solution found, called the energy (`f(sol)` gives the same value).
Passing a variable to `sol`, as in `sol(a)`, gives its value.

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
d = qbpp.var("d")
f = qbpp.sqr(a + 2 * b + 3 * c + 4 * d - 5)
f.simplify_as_binary()
solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=10, target_energy=0)
print(sol)
print("energy =", sol.energy)
print("a, b, c, d =", sol(a), sol(b), sol(c), sol(d))
```

The output in the video (there are two optimal solutions, so a run may return the other one):

```
Sol(energy=0, {a: 0, b: 1, c: 1, d: 0})
energy = 0
a, b, c, d = 0 1 1 0
```

### All optimal solutions

{% include video_seek.html t="9:34" %}

`ExhaustiveSolver` checks all assignments and guarantees the optimum.
With `best_energy_sols=0` it collects all optimal solutions into `sol.sols`.

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
d = qbpp.var("d")
f = qbpp.sqr(a + 2 * b + 3 * c + 4 * d - 5)
f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search(best_energy_sols=0)
for s in sol.sols:
    print(s)
```

Output:

```
Sol(energy=0, {a: 0, b: 1, c: 1, d: 0})
Sol(energy=0, {a: 1, b: 0, c: 0, d: 1})
```

See [Solving Expressions](SOLVE) for more.

## Arrays of variables

### Creating an array

{% include video_seek.html t="10:35" %}

Giving `qbpp.var` a `shape` creates an array of variables. `x[i]` is the variable with index i (indices start at 0).

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=5)
print(x)
```

Output:

```
[x[0], x[1], x[2], x[3], x[4]]
```

See [Arrays](VECTOR) for more.

### Sums

{% include video_seek.html t="11:11" %}

Starting from 0 and adding with `+=` is common. `qbpp.sum` makes the same expression in one line.

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=5)
f = 0
for i in range(5):
    f += x[i]
print("f =", f.simplify_as_binary())
g = qbpp.sum(x)
print("g =", g.simplify_as_binary())
```

Output:

```
f = x[0] +x[1] +x[2] +x[3] +x[4]
g = x[0] +x[1] +x[2] +x[3] +x[4]
```

See [Sum Functions](SUM) for more.

### One-hot

{% include video_seek.html t="11:47" %}

The sum minus 1, squared, is 0 only when exactly one variable is 1. This condition is called one-hot.

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=5)
f = qbpp.sqr(qbpp.sum(x) - 1)
f.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(f)
sol = solver.search(best_energy_sols=0)
for s in sol.sols:
    print(s)
```

Output:

```
Sol(energy=0, {x[0]: 1, x[1]: 0, x[2]: 0, x[3]: 0, x[4]: 0})
Sol(energy=0, {x[0]: 0, x[1]: 1, x[2]: 0, x[3]: 0, x[4]: 0})
Sol(energy=0, {x[0]: 0, x[1]: 0, x[2]: 1, x[3]: 0, x[4]: 0})
Sol(energy=0, {x[0]: 0, x[1]: 0, x[2]: 0, x[3]: 1, x[4]: 0})
Sol(energy=0, {x[0]: 0, x[1]: 0, x[2]: 0, x[3]: 0, x[4]: 1})
```

## The partition problem

### The problem

{% include video_seek.html t="12:48" %}

Split the eight numbers 64, 27, 47, 74, 12, 83, 63, 40 into two groups P and Q, making the two sums as close as possible.
Each number gets a variable `x[i]`: 1 puts it in P, and 0 puts it in Q.
We minimize $f$, the square of the difference of the two sums.

### Negated literals

{% include video_seek.html t="13:31" %}

The negated literal `~x` is 1 when x is 0, and 0 when x is 1; its value is the same as $1 - x$.
The sum of Q is the sum of `w[i]` times `~x[i]` (in the loop, `q += w[i] * ~x[i]`).
When building an expression, QUBO++ keeps `~x` as it is, without expanding it to $1 - x$ (`simplify_as_binary()` expands `~x` in terms of degree 2 or less). For an array of variables `x`, `~x` gives the array of negations.

See [Negated Literals](NEGATIVE) for more.

### Writing it with a loop

{% include video_seek.html t="14:18" %}

There are 8 variables, so $2^8 = 256$ assignments: `ExhaustiveSolver` can check them all.

```python
import pyqbpp as qbpp

w = [64, 27, 47, 74, 12, 83, 63, 40]
x = qbpp.var("x", shape=len(w))
p = 0
q = 0
for i in range(len(w)):
    p += w[i] * x[i]
    q += w[i] * ~x[i]
f = qbpp.sqr(p - q)
f.simplify_as_binary()

sol = qbpp.ExhaustiveSolver(f).search()
print("f =", sol(f), " p =", sol(p), " q =", sol(q))
print("P:", [w[i] for i in range(len(w)) if sol(x[i]) == 1])
print("Q:", [w[i] for i in range(len(w)) if sol(x[i]) == 0])
```

Output:

```
f = 0  p = 205  q = 205
P: [47, 12, 83, 63]
Q: [64, 27, 74, 40]
```

### Array operations

{% include video_seek.html t="15:14" %}

`w * x` multiplies element by element. Adding up with `qbpp.sum` turns the five lines of the loop into two.

```python
import pyqbpp as qbpp

w = [64, 27, 47, 74, 12, 83, 63, 40]
x = qbpp.var("x", shape=len(w))
p = qbpp.sum(w * x)
q = qbpp.sum(w * ~x)
f = qbpp.sqr(p - q)
f.simplify_as_binary()

sol = qbpp.ExhaustiveSolver(f).search()
print("f =", sol(f), " p =", sol(p), " q =", sol(q))
print("P:", [w[i] for i in range(len(w)) if sol(x[i]) == 1])
print("Q:", [w[i] for i in range(len(w)) if sol(x[i]) == 0])
```

Output:

```
f = 0  p = 205  q = 205
P: [47, 12, 83, 63]
Q: [64, 27, 74, 40]
```

See [Array Operations](OPVECTOR) for more.

### Result

{% include video_seek.html t="15:54" %}

P gets 47, 12, 83, 63 and Q gets 64, 27, 74, 40; both sums are 205. The difference is 0, so no split can be better.
Flipping every variable just swaps P and Q, so it is the same split.

See [Partitioning Problem](PARTITION) for more.

## Constraints: an assignment problem

### The assignment problem

{% include video_seek.html t="16:25" %}

Four people get four jobs, one each, with the smallest total cost. The table gives the cost of person i doing job j.

| | Job 0 | Job 1 | Job 2 | Job 3 |
|---|---:|---:|---:|---:|
| Person 0 | 58 | 73 | 91 | 44 |
| Person 1 | 62 | 15 | 87 | 39 |
| Person 2 | 78 | 56 | 23 | 94 |
| Person 3 | 11 | 85 | 68 | 72 |

If the variable `x[i][j]` is 1, person i gets job j (16 variables).
The constraint: every row sum and every column sum is 1.

### Two-dimensional arrays

{% include video_seek.html t="17:16" %}

Giving `shape` the numbers of rows and columns creates a two-dimensional array.
`qbpp.vector_sum` gives the array of row sums with `axis=1`, and of column sums with `axis=0`.

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(2, 3))
print(x)
print(qbpp.vector_sum(x, axis=1))
print(qbpp.vector_sum(x, axis=0))
```

Output:

```
[[x[0][0], x[0][1], x[0][2]], [x[1][0], x[1][1], x[1][2]]]
[x[0][0] +x[0][1] +x[0][2], x[1][0] +x[1][1] +x[1][2]]
[x[0][0] +x[1][0], x[0][1] +x[1][1], x[0][2] +x[1][2]]
```

See [Multi-dimensional Variables](MULTIDIM) for more.

### Penalty expressions

{% include video_seek.html t="18:11" %}

The total cost $g$ is the cost table $c$ times the variables $x$, element by element, summed up.
The penalty of each row and column, its sum minus 1, squared, is 0 when the constraint holds and positive when it is broken.
The whole is $h = g + P \times (\text{the sum of the penalties of all rows and columns})$; with a large enough weight $P$, the minimum of $h$ meets the constraints.

### Solving with penalty expressions

{% include video_seek.html t="18:57" %}

With the weight $P$ at 1000 and at 10, all combinations of the 16 variables are checked.

```python
import pyqbpp as qbpp

c = qbpp.array([[58, 73, 91, 44],  # cost table (4x4)
                [62, 15, 87, 39],
                [78, 56, 23, 94],
                [11, 85, 68, 72]])
x = qbpp.var("x", shape=(4, 4))
g = qbpp.sum(c * x)
f = (qbpp.sum(qbpp.sqr(qbpp.vector_sum(x, axis=1) - 1)) +
     qbpp.sum(qbpp.sqr(qbpp.vector_sum(x, axis=0) - 1)))

for P in [1000, 10]:
    h = g + P * f
    h.simplify_as_binary()
    sol = qbpp.ExhaustiveSolver(h).search()
    print(f"P = {P}: g = {sol(g)}, f = {sol(f)}")
    print(sol(x))
```

Output:

```
P = 1000: g = 93, f = 0
[[0, 0, 0, 1], [0, 1, 0, 0], [0, 0, 1, 0], [1, 0, 0, 0]]
P = 10: g = 26, f = 4
[[0, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0], [1, 0, 0, 0]]
```

### The size of the weight

{% include video_seek.html t="19:55" %}

With weight 10, only two people get a job; four rows and columns are empty, so the penalty is $4 \times 10 = 40$.
The cost 26 plus 40 is only 66, less than 93 of the correct assignment, so the solver picks the one breaking the constraints.
The weight must be large enough that breaking a constraint is a loss. The same holds for `cons`, which comes next.

See [Comparison Constraints](COMPARISON) for more.

## Declaring constraints with cons()

### cons()

{% include video_seek.html t="20:39" %}

Wrapping the constraint part in `qbpp.cons()` declares it as a constraint.
Wrapping a comparison of arrays gives one constraint per row and per column: 8 constraints here.
Its value is weight × violation$^2$, the same as the penalty expression for an equation. The solver searches efficiently for solutions that meet the constraints.

```python
import pyqbpp as qbpp

c = qbpp.array([[58, 73, 91, 44],  # cost table (4x4)
                [62, 15, 87, 39],
                [78, 56, 23, 94],
                [11, 85, 68, 72]])
x = qbpp.var("x", shape=(4, 4))
g = qbpp.sum(c * x)
h = g + 1000 * (qbpp.cons(qbpp.vector_sum(x, axis=1) == 1) +
                qbpp.cons(qbpp.vector_sum(x, axis=0) == 1))
h.simplify_as_binary()

sol = qbpp.EasySolver(h).search(time_limit=1)
print("result =", qbpp.onehot_to_int(sol(x), axis=1))
print("cost =", sol(g))
print("violated constraints =", h.cons(sol))
```

### Checking the solution

{% include video_seek.html t="21:42" %}

The output in the video (EasySolver may give different results on each run):

```
result = [3, 1, 2, 0]
cost = 93
violated constraints = 0
```

The cost is 44 + 15 + 23 + 11 = 93. `h.cons(sol)` is the number of violated constraints; it is 0, so all constraints hold.
`qbpp.onehot_to_int(sol(x), axis=1)` lists the column that is 1 in each row: person 0 gets job 3, person 1 gets job 1, and so on.

See [One-Hot to Integer Conversion](ONEHOT) for more.

### Penalty expressions and cons()

{% include video_seek.html t="22:23" %}

| | Penalty expression | `cons()` |
|---|---|---|
| How to write | square with `sqr` | wrap the comparison in `cons()` |
| Value for an equation | violation$^2$ | violation$^2$ (the same) |
| Inequalities | need auxiliary variables | need none |
| Checking violations | | `h.cons(sol)` |

The solver treats the constraints in `cons()` specially, as constraints.

See [Nonlinear Functions and Native Constraints](CONSTRAINTS) for more.

## Integer variables

### integer= and between=

{% include video_seek.html t="22:53" %}

Giving `qbpp.var` a range with `integer=` creates an integer variable.
`a`, made with `between=`, is expanded into a weighted sum of 0/1 variables; `b`, made with `integer=`, is not expanded and stays an integer.
With the range 0 to 100, `a` becomes seven 0/1 variables but `b` stays one variable, so `integer=` suits quantities such as counts and times.

```python
import pyqbpp as qbpp

a = qbpp.var("a", between=(0, 10))
b = qbpp.var("b", integer=(0, 10))
print("a =", a)
print("b =", b)
```

Output:

```
a = a[0] +2*a[1] +4*a[2] +3*a[3]
b = b
```

### Simultaneous equations

{% include video_seek.html t="23:57" %}

We solve $x + 2y = 700$ and $x - y = 100$.
$f$, the sum of the squared differences of the two sides, is 0 only when both hold.
For integer variables, `simplify_as_binary` does not turn $x^2$ into $x$; the square stays.

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 1000))
y = qbpp.var("y", integer=(-1000, 1000))
f = qbpp.sqr(x + 2 * y - 700) + qbpp.sqr(x - y - 100)
f.simplify_as_binary()

sol = qbpp.EasySolver(f).search(time_limit=1, target_energy=0)
print(f"x = {sol(x)}, y = {sol(y)}, f = {sol.energy}")
```

The output in the video (EasySolver may give different results on each run):

```
x = 300, y = 200, f = 0
```

See [Integer Variables](INTEGER) for more.

## Inequality constraints

### Inequalities with cons()

{% include video_seek.html t="25:09" %}

Maximize $5x + 4y$ subject to $2x + 3y \le 24$ and $7x + 5y \le 54$.
The solver minimizes, so we start from $-f$ with the sign flipped. An inequality, too, is just a comparison wrapped in `qbpp.cons()`.

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 10))
y = qbpp.var("y", integer=(0, 10))
f = 5 * x + 4 * y
g = -f + 100 * (qbpp.cons(2 * x + 3 * y <= 24) +
                qbpp.cons(7 * x + 5 * y <= 54))
g.simplify_as_binary()

sol = qbpp.EasySolver(g).search(time_limit=1)
print(f"x = {sol(x)}, y = {sol(y)}, f = {sol(f)}")
print("violated constraints =", g.cons(sol))
```

The output in the video (EasySolver may give different results on each run):

```
x = 4, y = 5, f = 40
violated constraints = 0
```

See [Integer Linear Programming](ILP) for more.

### Compared with penalty expressions

{% include video_seek.html t="26:27" %}

The same problem, with x and y made with `between=` (four 0/1 variables each), is written both with penalty expressions (`qbpp.constrain`) and with `qbpp.cons`.
The penalty expressions add 9 auxiliary variables, giving 17 variables and 133 terms; with `cons`, there are still 8 variables and 8 terms.
The assignments grow from 256 to $2^{17} = 131072$, and the larger the search space, the harder good solutions are to find.

```python
import pyqbpp as qbpp

x = qbpp.var("x", between=(0, 10))  # four 0/1 variables
y = qbpp.var("y", between=(0, 10))  # four 0/1 variables
f = 5 * x + 4 * y

gp = -f + 100 * qbpp.constrain(2 * x + 3 * y, between=(0, 24))  # penalty expression
gp += 100 * qbpp.constrain(7 * x + 5 * y, between=(0, 54))
gp.simplify_as_binary()
sp = qbpp.EasySolver(gp).search(time_limit=1)

gc = -f + 100 * qbpp.cons(2 * x + 3 * y, between=(0, 24))       # declared constraint
gc += 100 * qbpp.cons(7 * x + 5 * y, between=(0, 54))
gc.simplify_as_binary()
sc = qbpp.EasySolver(gc).search(time_limit=1)

print(f"penalty: var_count = {sp.info['var_count']}, term_count = {sp.info['term_count']}, f = {sp(f)}")
print(f"cons:    var_count = {sc.info['var_count']}, term_count = {sc.info['term_count']}, f = {sc(f)}")
```

Output (f is found by EasySolver and may differ on each run):

```
penalty: var_count = 17, term_count = 133, f = 40
cons:    var_count = 8, term_count = 8, f = 40
```

## Choosing a solver

### Three solvers

{% include video_seek.html t="27:35" %}

| Solver | Description |
|---|---|
| `ExhaustiveSolver` | Checks all combinations and guarantees the optimum (small problems) |
| `EasySolver` | Searches on a multicore CPU; the one to try first |
| `ABS3Solver` | Searches in parallel on GPUs and CPUs |

For all three, pass $f$ to make a solver, as in `solver = qbpp.EasySolver(f)`, and search, as in `sol = solver.search(target_energy=0)`.
Change the class name, and the other solvers work the same way. Parameters such as `target_energy` are shared, too.

### A large problem

{% include video_seek.html t="28:16" %}

The partition problem with 200 numbers. There are $2^{200}$, about $10^{60}$, combinations, far too many to check them all.
`sol.tts` is the time until the returned solution was found.

```python
import random
import pyqbpp as qbpp

random.seed(1)
w = [random.randint(1, 100) for _ in range(200)]
x = qbpp.var("x", shape=len(w))
f = qbpp.sqr(qbpp.sum(w * x) - qbpp.sum(w * ~x))
f.simplify_as_binary()

solver = qbpp.EasySolver(f)     # or qbpp.ABS3Solver(f)
sol = solver.search(time_limit=10, target_energy=0)
print(f"f = {sol.energy}, TTS = {sol.tts:.3f} s")
```

The output in the video (the TTS differs on each run):

```
f = 0, TTS = 0.002 s
```

Changing it to `qbpp.ABS3Solver(f)` searches with GPUs too; in the video (RTX 3090 × 2) it gave `f = 0, TTS = 0.001 s`.
`EasySolver` and `ABS3Solver` find good solutions in a short time, but do not guarantee optimality.

See [Easy Solver](EASYSOLVER) and [ABS3 Solver](ABS3) for more.

### Several solutions

{% include video_seek.html t="29:34" %}

With `topk_sols=4`, you get four solutions in increasing order of energy. `s.energy` is the energy of a solution, and `s(x)` the values of x.
The two solutions with energy 0 are the same split with 0 and 1 swapped.

```python
import pyqbpp as qbpp

w = [64, 27, 47, 74, 12, 83, 63, 40]
x = qbpp.var("x", shape=len(w))
f = qbpp.sqr(qbpp.sum(w * x) - qbpp.sum(w * ~x))
f.simplify_as_binary()

sol = qbpp.ExhaustiveSolver(f).search(topk_sols=4)
for s in sol.sols:
    print(s.energy, s(x))
```

Output:

```
0 [0, 0, 1, 0, 1, 1, 1, 0]
0 [1, 1, 0, 1, 0, 0, 0, 1]
4 [0, 0, 1, 1, 0, 1, 0, 0]
4 [1, 0, 1, 0, 1, 1, 0, 0]
```

See [Search Parameters](PARAMS) for more.

### Which solver to use

{% include video_seek.html t="30:28" %}

| Solver | Runs on | Suited to | Optimality |
|---|---|---|---|
| `ExhaustiveSolver` | CPU (and GPU if there is one) | problems with few variables | guaranteed (checks all) |
| `EasySolver` | multicore CPU | trying first | not guaranteed |
| `ABS3Solver` | GPU + CPU (CPU only without a GPU) | hard problems | not guaranteed |

They work the same way: just change the class name to switch.

## Nonlinear functions

### abs and max

{% include video_seek.html t="31:10" %}

`qbpp.abs(f)` is the absolute value, `qbpp.relu(f)` is $\max(0, f)$, and `qbpp.max(f, g)` and `qbpp.min(f, g)` are the larger and the smaller.
The partition problem is solved again by minimizing the absolute difference, and by minimizing the larger sum. You do not need to write auxiliary variables or case analysis yourself.

```python
import pyqbpp as qbpp

w = [64, 27, 47, 74, 12, 83, 63, 40]
x = qbpp.var("x", shape=len(w))
p = qbpp.sum(w * x)
q = qbpp.sum(w * ~x)

f = qbpp.abs(p - q)    # absolute difference
f.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(f).search()
print(f"abs: f = {sol.energy}, p = {sol(p)}, q = {sol(q)}")

g = qbpp.max(p, q)     # the larger sum
g.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(g).search()
print(f"max: g = {sol.energy}, p = {sol(p)}, q = {sol(q)}")
```

Output:

```
abs: f = 0, p = 205, q = 205
max: g = 205, p = 205, q = 205
```

### relu

{% include video_seek.html t="32:20" %}

Maximize the profit $4x + 7y$ while charging a cost on the amount by which the workload $2x + 3y$ exceeds 36.
With 2 as the second argument, `relu` gives the square of the excess. The constraint $x + y \le 12$ is added with `cons`.

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 20))
y = qbpp.var("y", integer=(0, 20))
profit = 4 * x + 7 * y
overtime = qbpp.relu(2 * x + 3 * y - 36, 2)
f = -profit + overtime + 100 * qbpp.cons(x + y <= 12)
f.simplify_as_binary()

sol = qbpp.ExhaustiveSolver(f).search()
print(f"x = {sol(x)}, y = {sol(y)}")
print(f"profit = {sol(profit)}, overtime = {sol(overtime)}")
```

Output:

```
x = 0, y = 12
profit = 84, overtime = 0
```

The workload is exactly 36, not above the threshold.

See [Nonlinear Functions and Native Constraints](CONSTRAINTS) for more.

## Higher-degree terms

### Cubic terms

{% include video_seek.html t="33:16" %}

QUBO is quadratic, but QUBO++ lets you write terms of degree 3 and higher as they are, and the built-in solvers solve them directly.
To pass the expression to other solvers that take only quadratic expressions, `reduce` turns it into a quadratic one.

```python
import pyqbpp as qbpp

y = qbpp.var("y", shape=4)
f = 2 * y[0] * y[1] * y[2] - 3 * y[1] * y[2] * y[3] + y[1]
f.simplify_as_binary()
print("f =", f)
sol = qbpp.ExhaustiveSolver(f).search()
print(sol)
```

Output:

```
f = y[1] +2*y[0]*y[1]*y[2] -3*y[1]*y[2]*y[3]
Sol(energy=-2, {y[0]: 0, y[1]: 1, y[2]: 1, y[3]: 1})
```

See [Reducing HUBO to QUBO](REDUCE) for more.

### Products of negated literals

{% include video_seek.html t="34:07" %}

Negated literals can be used inside higher-degree terms, too.
Written with `~x`, the product is one term; expanded with $1 - x$, the number of terms doubles with each negation: 16 terms for four.

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=4)
neg = ~x[0] * ~x[1] * ~x[2] * ~x[3]
expanded = qbpp.simplify((1 - x[0]) * (1 - x[1]) * (1 - x[2]) * (1 - x[3]))
print("neg      =", neg)
print("expanded =", expanded)
```

Output:

```
neg      = ~x[0]*~x[1]*~x[2]*~x[3]
expanded = 1 -x[0] -x[1] -x[2] -x[3] +x[0]*x[1] +x[0]*x[2] +x[0]*x[3] +x[1]*x[2] +x[1]*x[3] +x[2]*x[3] -x[0]*x[1]*x[2] -x[0]*x[1]*x[3] -x[0]*x[2]*x[3] -x[1]*x[2]*x[3] +x[0]*x[1]*x[2]*x[3]
```

See [Negated Literals](NEGATIVE) for more.

## All in one model

### Three production lines

{% include video_seek.html t="34:54" %}

Three production lines make 20 items in total.

| Condition | How to write it |
|---|---|
| Whether line i is used (setup cost 5) | `use[i]`: a 0/1 variable |
| Output of line i (0 to 10 items) | `q[i]`: `integer=(0, 10)` |
| Twice the excess over 6 items | `2 * qbpp.relu(q[i] - 6)` |
| Imbalance between lines 0 and 1 | `qbpp.abs(q[0] - q[1])` |
| A stopped line makes nothing | `qbpp.cons(q[i] - 10 * use[i] <= 0)` |
| Exactly 20 items in total | `qbpp.cons(qbpp.sum(q) == 20)` |
| Stopping all three lines costs 50 | `50 * ~use[0] * ~use[1] * ~use[2]` |

### The program and the result

{% include video_seek.html t="35:47" %}

Every condition is written in the expression as it is. This model has no auxiliary variables at all.

```python
import pyqbpp as qbpp

use = qbpp.var("use", shape=3)                 # binary
q = qbpp.var("q", shape=3, integer=(0, 10))    # integer
f = 0
for i in range(3):
    f += 5 * use[i]
    f += 2 * qbpp.relu(q[i] - 6)
    f += 100 * qbpp.cons(q[i] - 10 * use[i] <= 0)
f += qbpp.abs(q[0] - q[1])
f += 50 * ~use[0] * ~use[1] * ~use[2]
f += 100 * qbpp.cons(qbpp.sum(q) == 20)
f.simplify_as_binary()

sol = qbpp.ExhaustiveSolver(f).search()
print("use =", sol(use))
print("q   =", sol(q))
print("energy =", sol.energy)
```

Output:

```
use = [1, 1, 1]
q   = [7, 7, 6]
energy = 19
```

All three lines are used, making 7, 7 and 6 items. The setup cost 15 plus the excess cost 2 + 2 = 4 (lines 0 and 1 each go one over) gives 19.

See [Expressive Power of PyQBPP](MODELING) for more.

## Case studies

{% include video_seek.html t="36:49" %}

The documentation has more than 40 examples solved with QUBO++, each with a program and an explanation.
N-Queens, traveling salesman, vehicle routing, machine scheduling, halftoning, shift scheduling, and more: all of them use the way of writing shown in this video.

See [Case Studies](CASE_STUDIES) for more.

## Summary

{% include video_seek.html t="37:24" %}

- Create variables with `qbpp.var`. `shape=` makes an array, and `integer=` an integer variable.
- Write expressions with plus, minus, times, `qbpp.sqr` and `qbpp.sum`, tidy them up with `simplify_as_binary`, and solve them with a solver.
- There are three solvers, `ExhaustiveSolver`, `EasySolver` and `ABS3Solver`, all used the same way.
- Read a variable with `sol(x)`; `sol.energy` is the value of $f$. `f.cons(sol)` counts the violated constraints.
- Write constraints with `cons`, integers with `integer=`, and absolute values and maxima with functions, as they are.
