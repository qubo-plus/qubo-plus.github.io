---
last_modified: 2026-10-30
layout: default
nav_exclude: true
title: "Video: Variables and Expressions"
description: "The points of each chapter of the video \"QUBO++ Variables and Expressions (Python)\", with the programs shown in it and their output."
lang: en
hreflang_alt: "ja/python/VIDEO_VAREXPR"
hreflang_lang: "ja"
video: varexpr
---

# Video: Variables and Expressions (Python)

A companion to the video "QUBO++ Variables and Expressions (Python)".
For each chapter it gives the main points, the programs shown in the video with their output, and links to the pages that explain more.
Click "▶ Play the video from …" to play from that scene.
Programs that the video shows in part are given here in full, ready to run.

{% include video_embed.html slug="varexpr" %}

What the video covers:

- Binary variables made with `qbpp.var`, and that variables are symbols without values (pitfalls with assignment and `if`)
- Native integer variables made with `integer=`, and binary-encoded integer variables made with `between=`
- Arrays of variables and multidimensional arrays made with `shape`, and taking out rows and columns
- Building expressions with operators, simplifying them with `simplify` and `simplify_as_binary`, and solving them
- Two examples: rebuilding a picture from row and column counts, and paying with coins

Back to the list of [Videos (Tutorials)](../VIDEOS)

## Binary variables

{% include video_seek.html t="0:58" %}

Variables are made with `qbpp.var`. They take the value 0 or 1, and are called binary variables.
The string in parentheses is the name of the variable, used when it is printed. Using the same name as the Python variable keeps programs readable.

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
print(x, y)
```

Output:

```
x y
```

See [Variables and Expressions](VARIABLE) for more.

## Variables have no value

### Variables are symbols

{% include video_seek.html t="1:50" %}

A variable made with `qbpp.var` has no value; it is a symbol for building expressions.
Printing an expression shows the expression, not a value. The values of the variables are decided by a solver.

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = x + y
print("f =", f)
```

Output:

```
f = x +y
```

### Giving values and evaluating

{% include video_seek.html t="2:27" %}

Passing a dictionary of variables and values to an expression gives the value of the expression.
Values for all the variables are called an assignment. Passing an assignment does not put values into the variables themselves.

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = x + y
print("f(1, 0) =", f({x: 1, y: 0}))
print("f(1, 1) =", f({x: 1, y: 1}))
```

Output:

```
f(1, 0) = 1
f(1, 1) = 2
```

See [Evaluating Expressions](EVAL) for more.

## Pitfalls: assignment and branching

### No assignment

{% include video_seek.html t="3:02" %}

`x = 1` does not put a value into the variable; it only makes the Python name `x` refer to the integer 1.
`f`, made before, still uses the variable `x`; in `g`, made after, `x` is just 1.
Do not put anything else into a name that holds a variable.

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = x + y
x = 1
print(type(x), x)
g = x + y
print("f =", f)
print("g =", g)
```

Output:

```
<class 'int'> 1
f = x +y
g = 1 +y
```

### Variables with the same name

{% include video_seek.html t="3:45" %}

Each call of `qbpp.var` makes a new variable. Even with the same name, they are different variables that can take different values.
`h` is printed as `x +x`, but with `x` = 1 and `x2` = 0 it is 1. Make each variable once and reuse it through its Python name.

```python
import pyqbpp as qbpp

x = qbpp.var("x")
x2 = qbpp.var("x")
h = x + x2
print("h =", h)
print("h(1, 0) =", h({x: 1, x2: 0}))
```

Output:

```
h = x +x
h(1, 0) = 1
```

### No branching on values

{% include video_seek.html t="4:29" %}

While a model is being built, variables have no value, so you cannot branch on the value of a variable.
Running the following program raises a TypeError. Writing `if x == 1:` also fails, with a RuntimeError (the message says that `==` builds a constraint expression, whose truth value is ambiguous).

```python
import pyqbpp as qbpp

x = qbpp.var("x")
if x:
    print("x is 1")
```

The error message (TypeError):

```
TypeError: the truth value of a variable or expression is undefined: while the model is being built a variable has no value, so `if x:` / `x and y` cannot branch on it. To add a term only when x == 1 and y == 1, multiply them: x * y. To read a value from a solution, use sol(x).
```

To add something only when `x` and `y` are both 1, use the product `x * y` (for example `f += 3 * x * y`).
To branch on a value, solve first and use the value read with `sol(x)` (for example `if sol(x) == 1:`).

## Integer variables

### With integer=

{% include video_seek.html t="5:14" %}

Giving `qbpp.var` a range with `integer=` makes an integer variable, called a native integer variable.
It stays one integer variable inside expressions, and solvers search by moving its integer value directly. The range can include negative values.

```python
import pyqbpp as qbpp

n = qbpp.var("n", integer=(0, 10))
print("n =", n)
f = 3 * n + 1
print("f =", f)
print("f(4) =", f({n: 4}))
```

Output:

```
n = n
f = 1 +3*n
f(4) = 13
```

See [Integer Variables](INTEGER) for more.

### With between=

{% include video_seek.html t="6:11" %}

A range given with `between=` represents the integer as a weighted sum of 0/1 variables (binary encoding).
For 0 to 10 these are four binary variables with weights 1, 2, 4 and 3. The last weight is 3, not 8, so that the maximum is exactly 10.
When the lower bound is not 0, it is added as a constant.

```python
import pyqbpp as qbpp

m = qbpp.var("m", between=(0, 10))
print("m =", m)
k = qbpp.var("k", between=(-5, 5))
print("k =", k)
```

Output:

```
m = m[0] +2*m[1] +4*m[2] +3*m[3]
k = -5 +k[0] +2*k[1] +4*k[2] +3*k[3]
```

See [Binary-Encoded Integer Variables](BINARY_INTEGER) for more.

### Two kinds of integer variables

{% include video_seek.html t="7:15" %}

| | `integer=(0, 10)` | `between=(0, 10)` |
|---|---|---|
| Printed | `n` | `m[0] +2*m[1] +4*m[2] +3*m[3]` |
| Inside | one integer variable | four binary variables |
| Solvers | move the integer value directly | move the 0/1 variables |
| Wider range | no more variables | more variables (10 for 0 to 1000) |
| Use for | quantities such as counts and times (usually this one) | when you need an expression of 0/1 variables only |

## Arrays of variables

{% include video_seek.html t="8:02" %}

Giving `qbpp.var` a `shape` makes an array of variables. An index in square brackets takes out one variable. Indices start at 0.

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=5)
print(x)
print(x[2])
```

Output:

```
[x[0], x[1], x[2], x[3], x[4]]
x[2]
```

See [Arrays](VECTOR) for more.

## Multidimensional arrays

### Two-dimensional arrays

{% include video_seek.html t="8:38" %}

A tuple of sizes as the `shape` makes a multidimensional array. `x.shape` gives its shape.
The variable in row $i$, column $j$ is `x[i][j]`; `x[i, j]` is the same.

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(3, 4))
print(x.shape)
print(x[1][2], x[1, 2])
```

Output:

```
(3, 4)
x[1][2] x[1][2]
```

### Rows and columns

{% include video_seek.html t="9:18" %}

A single index takes out that row as an array. A column is written like `x[:, 2]`.
`qbpp.sum` makes the expression of the sum of the variables in a row or column.

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=(3, 4))
print(x[1])
print(x[:, 2])
print(qbpp.sum(x[1]))
```

Output:

```
[x[1][0], x[1][1], x[1][2], x[1][3]]
[x[0][2], x[1][2], x[2][2]]
x[1][0] +x[1][1] +x[1][2] +x[1][3]
```

See [Multi-dimensional Variables](MULTIDIM) and [Sum Functions](SUM) for more.

### Three or more dimensions

{% include video_seek.html t="9:56" %}

With the `shape` `(2, 3, 4)` there are 24 variables. Think of two 3-by-4 grids, `y[0]` and `y[1]`.
Giving only some of the indices takes out an array over the remaining axes.
For example, "person $p$ does job $k$ on day $d$" can be the single variable `y[d][p][k]`.

```python
import pyqbpp as qbpp

y = qbpp.var("y", shape=(2, 3, 4))
print(y.shape)
print(y[1][2][3])
print(y[1][2])
```

Output:

```
(2, 3, 4)
y[1][2][3]
[y[1][2][0], y[1][2][1], y[1][2][2], y[1][2][3]]
```

### Arrays of integer variables

{% include video_seek.html t="10:41" %}

`shape` together with `integer=` makes an array of integer variables; so does `between=`.
An element made with `between=` is a weighted sum of binary variables, whose names get one more index, like `m[0][1]`.

```python
import pyqbpp as qbpp

n = qbpp.var("n", shape=3, integer=(0, 5))
print(n)
m = qbpp.var("m", shape=3, between=(0, 5))
print(m[0])
```

Output:

```
[n[0], n[1], n[2]]
m[0][0] +2*m[0][1] +2*m[0][2]
```

See [Integer Variables](INTEGER) for more.

## Building expressions

### Combining with operators

{% include video_seek.html t="11:26" %}

Variables combined with addition, subtraction, multiplication and parentheses make an expression. Integer coefficients and constants can be written too.
An expression is expanded as soon as it is made.

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
f = (x + 2 * y - 1) * (y - z)
print("f =", f)
```

Output:

```
f = -y +z +2*y*y -2*y*z +x*y -x*z
```

See [Operators and Functions](OPERATOR) for more.

### Sum of products

{% include video_seek.html t="12:16" %}

The `f` from before is a sum of six terms. A term is an integer coefficient times a product of variables.
The number of variables in a term is its degree; a term with no variables is the constant term (this `f` has none).
This form, a sum of terms, is called a sum of products, and every expression is kept in this form internally.

| Term | Coefficient | Product | Degree |
|---|---:|---|---:|
| `-y` | −1 | `y` | 1 |
| `z` | 1 | `z` | 1 |
| `2*y*y` | 2 | `y*y` | 2 |
| `-2*y*z` | −2 | `y*z` | 2 |
| `x*y` | 1 | `x*y` | 2 |
| `-x*z` | −1 | `x*z` | 2 |

Products of the same variable, like `y*y`, are still there. The chapter "Simplifying" shows how to tidy them up.

## Compound assignment and loops

### Compound assignment

{% include video_seek.html t="13:05" %}

`+=`, `-=` and `*=` change an expression in place. Starting from 0, adding terms with `+=` and subtracting with `-=` is a common pattern.
A product made with `*=` is expanded right away.

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
g = 0
g += x
g -= 2 * y
print("g =", g)
g *= z + 1
print("g =", g)
```

Output:

```
g = x -2*y
g = x -2*y +x*z -2*y*z
```

### Building an expression in a loop

{% include video_seek.html t="13:49" %}

A sum $f = \sum_{i=0}^{4} w_i x_i$ is written by starting from 0 and adding in a loop.
The values of a Python list can be used as coefficients as they are. Terms with coefficient 1 are printed without it.

```python
import pyqbpp as qbpp

w = [3, 1, 4, 1, 5]
x = qbpp.var("x", shape=5)
f = 0
for i in range(5):
    f += w[i] * x[i]
print("f =", f)
```

Output:

```
f = 3*x[0] +x[1] +4*x[2] +x[3] +5*x[4]
```

## Squares and polynomials

### qbpp.sqr

{% include video_seek.html t="14:34" %}

A square is written with `qbpp.sqr`. It is the same polynomial as the expression multiplied by itself; they print differently because they are expanded differently (simplified, they are the same).
The square of a difference is 0 only when the two are equal and positive otherwise, so it is often used to make an expression take a given value.

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
h = qbpp.sqr(x + y - 1)
print("h =", h)
print("h =", (x + y - 1) * (x + y - 1))
```

Output:

```
h = 1 +x*x -2*x +2*x*y +y*y -2*y
h = 1 -x -y -x -y +x*x +x*y +y*x +y*y
```

### General polynomials

{% include video_seek.html t="15:27" %}

Terms of degree 3 or more can be written as they are. Integer variables can be used in expressions just like binary variables;
the square of an integer variable `n*n` and the product of an integer and a binary variable `n*x` are terms too. The constant 9 comes from $(-3)^2$.

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
t = 2 * x * y * z
print("t =", t)
n = qbpp.var("n", integer=(0, 10))
p = qbpp.sqr(n - 3) + 5 * n * x
print("p =", p)
```

Output:

```
t = 2*x*y*z
p = 9 +n*n -6*n +5*n*x
```

## Simplifying

### simplify

{% include video_seek.html t="16:16" %}

`-2*x*y` and `3*y*x` are like terms with the variables in a different order.
`qbpp.simplify` sorts the variables in each term, merges like terms, and removes terms whose coefficient became 0.

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = qbpp.sqr(x - y) + 3 * y * x
print("f =", f)
print("simplify()           :", qbpp.simplify(f))
```

Output:

```
f = x*x -2*x*y +y*y +3*y*x
simplify()           : x*x +x*y +y*y
```

### simplify_as_binary

{% include video_seek.html t="17:05" %}

Squaring a 0/1 variable does not change its value, so `x*x` equals `x`.
`qbpp.simplify_as_binary` does what simplify does and uses this rule too. Before solving, tidy up the expression with `simplify_as_binary`.

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = qbpp.sqr(x - y) + 3 * y * x
print("f =", f)
print("simplify()           :", qbpp.simplify(f))
print("simplify_as_binary() :", qbpp.simplify_as_binary(f))
```

Output:

```
f = x*x -2*x*y +y*y +3*y*x
simplify()           : x*x +x*y +y*y
simplify_as_binary() : x +y +x*y
```

See [Variables and Expressions](VARIABLE) for more.

### Expressions with integer variables

{% include video_seek.html t="17:51" %}

Expressions with integer variables are simplified with `simplify_as_binary` too. The binary rule applies only to binary variables:
`x*x` becomes `x`, but the integer `n*n` stays (for $n = 3$ the square is 9, not 3).

```python
import pyqbpp as qbpp

x = qbpp.var("x")
n = qbpp.var("n", integer=(0, 10))
g = qbpp.sqr(n - x)
print("g =", g)
print("simplify_as_binary() :", qbpp.simplify_as_binary(g))
```

Output:

```
g = n*n -2*n*x +x*x
simplify_as_binary() : x -2*x*n +n*n
```

### Two ways to call them

{% include video_seek.html t="18:27" %}

The function `qbpp.simplify_as_binary(f)` returns a new simplified expression and leaves `f` unchanged.
The method `f.simplify_as_binary()` changes `f` itself. simplify can be called in the same two ways.

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = qbpp.sqr(x - y) + 3 * y * x
g = qbpp.simplify_as_binary(f)
print("f =", f)
print("g =", g)
f.simplify_as_binary()
print("f =", f)
```

Output:

```
f = x*x -2*x*y +y*y +3*y*x
g = x +y +x*y
f = x +y +x*y
```

See [QR: Operations](QR_OPERATION) for more.

## Solvers and solutions

### The assignment that minimizes the expression

{% include video_seek.html t="19:18" %}

The value of an expression depends on the assignment. This `f` is small when $x+y+z$ is 2, and grows by 1 when $x$ and $y$ are both 1.
A solver looks for an assignment that minimizes the expression. The value of the expression is also called the energy.

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
f = qbpp.sqr(x + y + z - 2) + x * y
f.simplify_as_binary()
print("f =", f)
```

Output:

```
f = 4 -3*x -3*y -3*z +3*x*y +2*x*z +2*y*z
```

Three variables have $2^3 = 8$ assignments. $f$ takes its smallest value, 0, at $(0, 1, 1)$ and at $(1, 0, 1)$.

| x | y | z | f |
|---:|---:|---:|---:|
| 0 | 0 | 0 | 4 |
| 0 | 0 | 1 | 1 |
| 0 | 1 | 0 | 1 |
| 0 | 1 | 1 | 0 |
| 1 | 0 | 0 | 1 |
| 1 | 0 | 1 | 0 |
| 1 | 1 | 0 | 1 |
| 1 | 1 | 1 | 2 |

### Solving with EasySolver

{% include video_seek.html t="20:13" %}

`qbpp.EasySolver(f)` makes a solver, and `search` runs the search and returns the solution found.
`time_limit` is the longest search time in seconds. Printing the solution shows the energy and the value of each variable.

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
f = qbpp.sqr(x + y + z - 2) + x * y
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1)
print(sol)
```

The output in the video (there are two optimal solutions, so the result may differ on each run):

```
Sol(energy=0, {x: 1, y: 0, z: 1})
```

See [Solving Expressions](SOLVE) and [Easy Solver](EASYSOLVER) for more.

### Reading values from the solution

{% include video_seek.html t="21:00" %}

`sol(x)` and `x(sol)` are both the value of the variable `x` in the solution. `sol.energy` is the energy of the solution.
Passing `sol` to an expression gives its value in the solution (`f(sol)` or `sol(f)`, either way).

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
f = qbpp.sqr(x + y + z - 2) + x * y
f.simplify_as_binary()
solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1)

print("sol(x), x(sol) =", sol(x), x(sol))
print("x, y, z =", sol(x), sol(y), sol(z))
print("energy =", sol.energy)
print("f(sol), sol(f) =", f(sol), sol(f))
print("x + y + z =", sol(x + y + z))
```

The output in the video (there are two optimal solutions, so the other one, $(0, 1, 1)$, may be returned):

```
sol(x), x(sol) = 1 1
x, y, z = 1 0 1
energy = 0
f(sol), sol(f) = 0 0
x + y + z = 2
```

See [QR: Solutions](QR_SOLUTION) for more.

## Example: a picture puzzle

### The puzzle

{% include video_seek.html t="21:58" %}

Some cells of a 5-by-5 grid are painted. The numbers of painted cells in the rows are 1, 3, 5, 1, 1 from the top,
and in the columns 1, 2, 5, 2, 1 from the left. Which cells should be painted to match all the numbers?

### As an expression

{% include video_seek.html t="22:29" %}

Each cell gets a binary variable $x_{i,j}$; 1 means the cell in row $i$, column $j$ is painted.
The difference from the count $r_i$ of row $i$ and from the count $c_j$ of column $j$ is squared, and everything is added.

$$
f = \sum_{i=0}^{4} \Bigl(\sum_{j=0}^{4} x_{i,j} - r_i\Bigr)^2 + \sum_{j=0}^{4} \Bigl(\sum_{i=0}^{4} x_{i,j} - c_j\Bigr)^2
$$

Every term is 0 or more, so $f$ is 0 only when all the counts match. An assignment that minimizes $f$ is the answer.

### The program

{% include video_seek.html t="23:17" %}

`x[i]` takes out row $i$ and `x[:, j]` column $j$, to be summed. `term_count()` is the number of terms (without the constant).
The simplified `f` has 125 terms, 25 of degree 1 and 100 of degree 2; the constant 72 is the sum of the squares of the given counts (the video shows only the beginning of `f`).

```python
import pyqbpp as qbpp

row = [1, 3, 5, 1, 1]
col = [1, 2, 5, 2, 1]
x = qbpp.var("x", shape=(5, 5))
f = 0
for i in range(5):
    f += qbpp.sqr(qbpp.sum(x[i]) - row[i])
for j in range(5):
    f += qbpp.sqr(qbpp.sum(x[:, j]) - col[j])
f.simplify_as_binary()
print("terms =", f.term_count())
print("f =", f)
```

Output:

```
terms = 125
f = 72 -2*x[0][0] -4*x[0][1] -10*x[0][2] -4*x[0][3] -2*x[0][4] -6*x[1][0] -8*x[1][1] -14*x[1][2] -8*x[1][3] -6*x[1][4] -10*x[2][0] -12*x[2][1] -18*x[2][2] -12*x[2][3] -10*x[2][4] -2*x[3][0] -4*x[3][1] -10*x[3][2] -4*x[3][3] -2*x[3][4] -2*x[4][0] -4*x[4][1] -10*x[4][2] -4*x[4][3] -2*x[4][4] +2*x[0][0]*x[0][1] +2*x[0][0]*x[0][2] +2*x[0][0]*x[0][3] +2*x[0][0]*x[0][4] +2*x[0][0]*x[1][0] +2*x[0][0]*x[2][0] +2*x[0][0]*x[3][0] +2*x[0][0]*x[4][0] +2*x[0][1]*x[0][2] +2*x[0][1]*x[0][3] +2*x[0][1]*x[0][4] +2*x[0][1]*x[1][1] +2*x[0][1]*x[2][1] +2*x[0][1]*x[3][1] +2*x[0][1]*x[4][1] +2*x[0][2]*x[0][3] +2*x[0][2]*x[0][4] +2*x[0][2]*x[1][2] +2*x[0][2]*x[2][2] +2*x[0][2]*x[3][2] +2*x[0][2]*x[4][2] +2*x[0][3]*x[0][4] +2*x[0][3]*x[1][3] +2*x[0][3]*x[2][3] +2*x[0][3]*x[3][3] +2*x[0][3]*x[4][3] +2*x[0][4]*x[1][4] +2*x[0][4]*x[2][4] +2*x[0][4]*x[3][4] +2*x[0][4]*x[4][4] +2*x[1][0]*x[1][1] +2*x[1][0]*x[1][2] +2*x[1][0]*x[1][3] +2*x[1][0]*x[1][4] +2*x[1][0]*x[2][0] +2*x[1][0]*x[3][0] +2*x[1][0]*x[4][0] +2*x[1][1]*x[1][2] +2*x[1][1]*x[1][3] +2*x[1][1]*x[1][4] +2*x[1][1]*x[2][1] +2*x[1][1]*x[3][1] +2*x[1][1]*x[4][1] +2*x[1][2]*x[1][3] +2*x[1][2]*x[1][4] +2*x[1][2]*x[2][2] +2*x[1][2]*x[3][2] +2*x[1][2]*x[4][2] +2*x[1][3]*x[1][4] +2*x[1][3]*x[2][3] +2*x[1][3]*x[3][3] +2*x[1][3]*x[4][3] +2*x[1][4]*x[2][4] +2*x[1][4]*x[3][4] +2*x[1][4]*x[4][4] +2*x[2][0]*x[2][1] +2*x[2][0]*x[2][2] +2*x[2][0]*x[2][3] +2*x[2][0]*x[2][4] +2*x[2][0]*x[3][0] +2*x[2][0]*x[4][0] +2*x[2][1]*x[2][2] +2*x[2][1]*x[2][3] +2*x[2][1]*x[2][4] +2*x[2][1]*x[3][1] +2*x[2][1]*x[4][1] +2*x[2][2]*x[2][3] +2*x[2][2]*x[2][4] +2*x[2][2]*x[3][2] +2*x[2][2]*x[4][2] +2*x[2][3]*x[2][4] +2*x[2][3]*x[3][3] +2*x[2][3]*x[4][3] +2*x[2][4]*x[3][4] +2*x[2][4]*x[4][4] +2*x[3][0]*x[3][1] +2*x[3][0]*x[3][2] +2*x[3][0]*x[3][3] +2*x[3][0]*x[3][4] +2*x[3][0]*x[4][0] +2*x[3][1]*x[3][2] +2*x[3][1]*x[3][3] +2*x[3][1]*x[3][4] +2*x[3][1]*x[4][1] +2*x[3][2]*x[3][3] +2*x[3][2]*x[3][4] +2*x[3][2]*x[4][2] +2*x[3][3]*x[3][4] +2*x[3][3]*x[4][3] +2*x[3][4]*x[4][4] +2*x[4][0]*x[4][1] +2*x[4][0]*x[4][2] +2*x[4][0]*x[4][3] +2*x[4][0]*x[4][4] +2*x[4][1]*x[4][2] +2*x[4][1]*x[4][3] +2*x[4][1]*x[4][4] +2*x[4][2]*x[4][3] +2*x[4][2]*x[4][4] +2*x[4][3]*x[4][4]
```

### Solving with EasySolver

{% include video_seek.html t="24:23" %}

With `target_energy=0`, the search stops as soon as a solution with energy 0 is found.
Passing an array to `sol` returns the values as an array of the same shape. Printing the 1 cells as `#` and the 0 cells as `.` shows a tree.

```python
import pyqbpp as qbpp

row = [1, 3, 5, 1, 1]
col = [1, 2, 5, 2, 1]
x = qbpp.var("x", shape=(5, 5))
f = 0
for i in range(5):
    f += qbpp.sqr(qbpp.sum(x[i]) - row[i])
for j in range(5):
    f += qbpp.sqr(qbpp.sum(x[:, j]) - col[j])
f.simplify_as_binary()

sol = qbpp.EasySolver(f).search(time_limit=10, target_energy=0)
print("energy =", sol.energy)
print(sol(x))
for i in range(5):
    print("".join("#" if sol(x[i][j]) == 1 else "." for j in range(5)))
```

The output in the video (EasySolver may give different results on each run):

```
energy = 0
[[0, 0, 1, 0, 0], [0, 1, 1, 1, 0], [1, 1, 1, 1, 1], [0, 0, 1, 0, 0], [0, 0, 1, 0, 0]]
..#..
.###.
#####
..#..
..#..
```

### Any other answers?

{% include video_seek.html t="25:01" %}

`ExhaustiveSolver` checks every assignment (with 25 variables, $2^{25}$, about 34 million).
With `best_energy_sols=0` it collects all the optimal solutions into `sol.sols`. The tree is the only answer.

```python
import pyqbpp as qbpp

row = [1, 3, 5, 1, 1]
col = [1, 2, 5, 2, 1]
x = qbpp.var("x", shape=(5, 5))
f = 0
for i in range(5):
    f += qbpp.sqr(qbpp.sum(x[i]) - row[i])
for j in range(5):
    f += qbpp.sqr(qbpp.sum(x[:, j]) - col[j])
f.simplify_as_binary()

sol = qbpp.ExhaustiveSolver(f).search(best_energy_sols=0)
print("solutions =", len(sol.sols))
```

Output:

```
solutions = 1
```

See [Exhaustive Solver](EXHAUSTIVE) for more.

## Example: paying with coins

### The problem

{% include video_seek.html t="25:33" %}

A wallet holds one 500-yen coin, three 100-yen coins, four 50-yen coins and eight 10-yen coins.
From it, pay exactly 780 yen with no change. To get rid of small coins, pay with as many coins as possible.

### The numbers of coins as integer variables

{% include video_seek.html t="26:11" %}

The number of coins paid of each kind is an integer variable, from 0 up to the number in the wallet.
Keeping the amount paid in `pay` and the number of coins in `count` lets later expressions reuse them.

```python
import pyqbpp as qbpp

n500 = qbpp.var("n500", integer=(0, 1))
n100 = qbpp.var("n100", integer=(0, 3))
n50 = qbpp.var("n50", integer=(0, 4))
n10 = qbpp.var("n10", integer=(0, 8))
pay = 500 * n500 + 100 * n100 + 50 * n50 + 10 * n10
count = n500 + n100 + n50 + n10
print("pay =", pay)
print("count =", count)
```

Output:

```
pay = 500*n500 +100*n100 +50*n50 +10*n10
count = n500 +n100 +n50 +n10
```

### The expression to minimize

{% include video_seek.html t="26:57" %}

$f = (\text{pay} - 780)^2 - \text{count}$. The first part is 0 only for exactly 780 yen; the second is smaller for more coins.
The second part has no weight: payments move in 10-yen steps, so a wrong amount makes the first part at least 100,
while with at most 16 coins the second part saves at most 16.

```python
import pyqbpp as qbpp

n500 = qbpp.var("n500", integer=(0, 1))
n100 = qbpp.var("n100", integer=(0, 3))
n50 = qbpp.var("n50", integer=(0, 4))
n10 = qbpp.var("n10", integer=(0, 8))
pay = 500 * n500 + 100 * n100 + 50 * n50 + 10 * n10
count = n500 + n100 + n50 + n10

f = qbpp.sqr(pay - 780) - count
f.simplify_as_binary()
```

### The simplified expression

{% include video_seek.html t="27:47" %}

The constant 608400 is 780 squared; the coefficient −780001 of `n500` is −780000 from the square plus −1 from `count`.
Squares of integer variables, such as `n500*n500`, stay. It is a small expression: 4 integer variables and 14 terms.

```python
import pyqbpp as qbpp

n500 = qbpp.var("n500", integer=(0, 1))
n100 = qbpp.var("n100", integer=(0, 3))
n50 = qbpp.var("n50", integer=(0, 4))
n10 = qbpp.var("n10", integer=(0, 8))
pay = 500 * n500 + 100 * n100 + 50 * n50 + 10 * n10
count = n500 + n100 + n50 + n10
f = qbpp.sqr(pay - 780) - count
f.simplify_as_binary()

print("terms =", f.term_count())
print("f =", f)
```

Output:

```
terms = 14
f = 608400 -780001*n500 -156001*n100 -78001*n50 -15601*n10 +250000*n500*n500 +100000*n500*n100 +50000*n500*n50 +10000*n500*n10 +10000*n100*n100 +10000*n100*n50 +2000*n100*n10 +2500*n50*n50 +1000*n50*n10 +100*n10*n10
```

### Solving with EasySolver

{% include video_seek.html t="28:36" %}

One 500-yen coin, four 50-yen coins and eight 10-yen coins: 13 coins in all, and no 100-yen coins.
The energy −13 is 0 from the first part and −13 from the second.

```python
import pyqbpp as qbpp

n500 = qbpp.var("n500", integer=(0, 1))
n100 = qbpp.var("n100", integer=(0, 3))
n50 = qbpp.var("n50", integer=(0, 4))
n10 = qbpp.var("n10", integer=(0, 8))
pay = 500 * n500 + 100 * n100 + 50 * n50 + 10 * n10
count = n500 + n100 + n50 + n10
f = qbpp.sqr(pay - 780) - count
f.simplify_as_binary()

sol = qbpp.EasySolver(f).search(time_limit=1)
print(sol)
print("pay =", sol(pay), "count =", sol(count))
```

The output in the video (EasySolver may give different results on each run):

```
Sol(energy=-13, {n500: 1, n100: 0, n50: 4, n10: 8})
pay = 780 count = 13
```

### With between=

{% include video_seek.html t="29:19" %}

With the four lines making the variables changed to `between=`, there are 10 binary variables and 55 terms (with `integer=`, 4 integer variables and 14 terms).
The answer is the same, and the solution lists the binary variables. Passing an integer variable, as in `sol(n10)`, gives its integer value.
For integer quantities, `integer=` keeps the expression smaller.

```python
import pyqbpp as qbpp

n500 = qbpp.var("n500", between=(0, 1))
n100 = qbpp.var("n100", between=(0, 3))
n50 = qbpp.var("n50", between=(0, 4))
n10 = qbpp.var("n10", between=(0, 8))
pay = 500 * n500 + 100 * n100 + 50 * n50 + 10 * n10
count = n500 + n100 + n50 + n10
f = qbpp.sqr(pay - 780) - count
f.simplify_as_binary()
print("terms =", f.term_count())
print("n10 =", n10)

sol = qbpp.EasySolver(f).search(time_limit=1)
print(sol)
print("n10 =", sol(n10))
```

The output in the video (EasySolver may give different results on each run):

```
terms = 55
n10 = n10[0] +2*n10[1] +4*n10[2] +n10[3]
Sol(energy=-13, {n500: 1, n100[0]: 0, n100[1]: 0, n50[0]: 1, n50[1]: 1, n50[2]: 1, n10[0]: 1, n10[1]: 1, n10[2]: 1, n10[3]: 1})
n10 = 8
```

See [Integer Variables](INTEGER) for more.

## Summary

{% include video_seek.html t="30:10" %}

- Variables made with `qbpp.var` are symbols without values. A solver decides their values.
- Integer variables come from `integer=` or `between=`, and arrays from `shape`. A variable made with `between=` is a weighted sum of binary variables.
- Combining variables with operators gives a polynomial in sum-of-products form. You can also give values to the variables and evaluate an expression.
- Simplify the expression with `simplify_as_binary` or similar and pass it to a solver, and you get an assignment that minimizes the expression as the solution.
- Read the solution with `sol`; a variable and `sol` can go in either order.
