---
last_modified: 2026-10-26
layout: default
nav_exclude: true
title: "Video: Nonlinear Functions and Higher-Degree Terms"
description: "The points of each chapter of the video \"QUBO++ Nonlinear Functions and Higher-Degree Terms (Python)\", with the programs shown in it and their output."
lang: en
hreflang_alt: "ja/python/VIDEO_NONLINEAR"
hreflang_lang: "ja"
video: nonlinear
---

# Video: Nonlinear Functions and Higher-Degree Terms (Python)

A companion to the video "QUBO++ Nonlinear Functions and Higher-Degree Terms (Python)".
For each chapter it gives the main points, the programs shown in the video with their output, and links to the pages that explain more.
Click "▶ Play the video from …" to play from that scene.
Programs that the video shows in part are given here in full, ready to run.

{% include video_embed.html slug="nonlinear" %}

What the video covers:

- The four nonlinear functions you can use inside expressions, `qbpp.abs`, `qbpp.relu`, `qbpp.max` and `qbpp.min`, and what may multiply a function term
- Minimizing the deviation of a system of equations with `qbpp.abs`, and `qbpp.abs(f, 2)` versus `qbpp.sqr(f)`
- Paying only for going over a budget with `qbpp.relu`, and minimizing the load of machines with `qbpp.max` or an integer variable
- Why functions cannot be nested, and rewriting them as sums and differences
- Literals and higher-degree terms, and why `simplify_as_binary` expands the negated literal `~x` only in terms of degree 2 or less
- Making higher-degree terms quadratic with `qbpp.reduce`

Back to the list of [Videos (Tutorials)](../VIDEOS)

## Nonlinear functions

### The four functions

{% include video_seek.html t="2:15" %}

These four functions can be used as they are inside QUBO++ expressions.
For `abs` and `relu`, a second argument 2 squares the value.

| Function | Value | Use |
|---|---|---|
| `qbpp.abs(f)` | $\lvert f\rvert$ | deviation, error |
| `qbpp.abs(f, 2)` | $\lvert f\rvert^2$ | |
| `qbpp.relu(f)` | $\max(0, f)$ | the part above a threshold |
| `qbpp.relu(f, 2)` | $\max(0, f)^2$ | |
| `qbpp.max(f, g)` | $\max(f, g)$ | the larger |
| `qbpp.min(f, g)` | $\min(f, g)$ | the smaller |

A function term is not expanded into a polynomial: it goes to the solvers as it is.
For example, the square of $f = x[0] + x[1] - 1$ expands into six terms, but `qbpp.abs(f, 2)` stays one function term.
The solvers compute the value of the function directly, so no auxiliary variables are needed.

### Only constants may multiply

{% include video_seek.html t="3:37" %}

Only constants may multiply a function term, because a function term goes to the solvers as a constant times a function.
In the examples below, `f` and `g` are expressions like `f = x[0] + x[1] - 1`.

| Allowed | Meaning |
|---|---|
| `3 * qbpp.abs(f)` | a constant multiple |
| `-2 * qbpp.relu(f)` | a negative constant: pushes the value of the function up |
| `qbpp.abs(f) + x[0] * x[1]` | a sum with other terms |
| `qbpp.abs(f, 2)` | square it with the second argument |

| Not allowed | Meaning |
|---|---|
| `x[0] * qbpp.abs(f)` | times a variable |
| `(x[0] + 1) * qbpp.relu(f)` | times an expression |
| `qbpp.abs(f) * qbpp.abs(g)` | a function times a function |
| `qbpp.sqr(qbpp.abs(f))` | squaring |

The examples that are not allowed all raise `RuntimeError`.
The end of the message lists the operations allowed: `allowed operations: +, -, * by a nonzero constant, simplify*, and qbpp.replace`.

See [Nonlinear Functions and Native Constraints](CONSTRAINTS) for more.

## abs

### Minimizing the deviation of equations

{% include video_seek.html t="5:14" %}

Solve $x + y = 13$ and $x - y = 3$ with integer variables $x$, $y$ from 0 to 10.
The sum $f$ of the deviations of the two equations (the absolute values of the differences) is 0 or more; if its minimum is 0, both equations hold.

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 10))
y = qbpp.var("y", integer=(0, 10))
f = qbpp.abs(x + y - 13) + qbpp.abs(x - y - 3)
f.simplify_as_binary()
print(f)
sol = qbpp.ExhaustiveSolver(f).search()
print(f"x = {sol(x)}, y = {sol(y)}, f = {sol.energy}")
```

Output:

```
abs(-13 +x +y, 1)
+abs(-3 +x -y, 1)
x = 8, y = 5, f = 0
```

The function terms are not expanded: each is printed as `abs`, one per line.
In the parentheses come the expression (constant first) and, last, the exponent 1.

### abs(f, 2) and qbpp.sqr(f)

{% include video_seek.html t="6:59" %}

`g`, written with `qbpp.sqr`, is expanded into a polynomial, and the products of `x` and `y` cancel out.
`h`, written with the second argument of `abs`, keeps its function terms.
Expressions with functions can also be evaluated with a dictionary of values. At $x = 2$, $y = 7$, both are $(-4)^2 + (-8)^2 = 80$.

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 10))
y = qbpp.var("y", integer=(0, 10))
g = qbpp.sqr(x + y - 13) + qbpp.sqr(x - y - 3)
h = qbpp.abs(x + y - 13, 2) + qbpp.abs(x - y - 3, 2)
g.simplify_as_binary()
h.simplify_as_binary()
print("g =", g)
print("h =", h)
print(g({x: 2, y: 7}), h({x: 2, y: 7}))
```

Output:

```
g = 178 -32*x -20*y +2*x*x +2*y*y
h = abs(-13 +x +y, 2)
+abs(-3 +x -y, 2)
80 80
```

Squaring a sum of binary variables gives many terms when expanded:
a sum of $n$ gives $n(n+1)/2$ terms, so 3 give 6, 10 give 55, and 100 give 5050.
With the second argument of `abs`, it is one function term however many variables are summed.
On the other hand, a polynomial can also go to other solvers. An expression with function terms is solved by the QUBO++ solvers.

See [Nonlinear Functions and Native Constraints](CONSTRAINTS) for more.

## relu

{% include video_seek.html t="9:12" %}

From five items worth 8, 12, 11, 7 and 12 and costing 8, 5, 9, 5 and 2, choose items so that the total value is as large as possible.
In `f` the cost may go over the budget of 20, and `qbpp.relu` pays an extra cost of 2 for each unit over.
In `g` the budget is a constraint with `qbpp.cons`.

```python
import pyqbpp as qbpp

v = qbpp.array([8, 12, 11, 7, 12])
c = qbpp.array([8, 5, 9, 5, 2])
x = qbpp.var("x", shape=5)
value = qbpp.sum(v * x)
cost = qbpp.sum(c * x)
f = -value + 2 * qbpp.relu(cost - 20)
g = -value + 100 * qbpp.cons(cost <= 20)
for h in (f, g):
    h.simplify_as_binary()
    sol = qbpp.ExhaustiveSolver(h).search()
    print(sol(x), "value =", sol(value),
          "cost =", sol(cost), "cons =", h.cons(sol))
```

Output:

```
[0, 1, 1, 1, 1] value = 42 cost = 21 cons = 0
[1, 1, 0, 1, 1] value = 39 cost = 20 cons = 0
```

With `relu` (`f`), the best choice goes 1 over the budget with value 42. Even after the extra cost of 2 it is worth 40, more than any choice within the budget.
With `cons` (`g`), the choice has cost 20 and value 39.
A `relu` term is part of the objective, so it is not counted in `h.cons(sol)`, the number of violated constraints. That is why `f`'s choice, over the budget, also shows 0.

See [Nonlinear Functions and Native Constraints](CONSTRAINTS) for more.

## max and min

### Two machines

{% include video_seek.html t="11:09" %}

Split nine jobs with processing times 8, 7, 6, 5, 5, 4, 3, 3 and 1 (42 in total) between two machines.
A job with `x` equal to 1 runs on machine 1, and one with 0 on machine 2. The load of machine 2 is written with the negated literal `~x`.
All jobs are done when the busier machine is done, so `qbpp.max` of the two loads is minimized.

```python
import pyqbpp as qbpp

d = qbpp.array([8, 7, 6, 5, 5, 4, 3, 3, 1])
x = qbpp.var("x", shape=9)
p = qbpp.sum(d * x)
q = qbpp.sum(d * ~x)
f = qbpp.max(p, q)
f.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(f).search()
print(f"max = {sol.energy}, p = {sol(p)}, q = {sol(q)}")
```

Output:

```
max = 21, p = 21, q = 21
```

Both machines get 21, exactly half of 42.
`qbpp.max` and `qbpp.min` take two expressions.

### Three machines

{% include video_seek.html t="12:40" %}

Now split the same nine jobs among three machines. `x` is an array of 9 rows (jobs) and 3 columns (machines).
The maximum of three loads cannot be written by nesting `qbpp.max`, so an integer variable `z` from 0 to 42 is added,
with the constraints that every load is at most `z`, and `z` is minimized.
`z` moves down to the maximum of the three loads and stops there. A load cannot be below 14, a third of 42, so it is solved with `target_energy=14`.

```python
import pyqbpp as qbpp

d = qbpp.array([8, 7, 6, 5, 5, 4, 3, 3, 1])
x = qbpp.var("x", shape=(9, 3))
loads = [qbpp.sum(d * x[:, k]) for k in range(3)]
try:
    qbpp.max(qbpp.max(loads[0], loads[1]), loads[2])
except RuntimeError as e:
    print("RuntimeError:", e)
z = qbpp.var("z", integer=(0, 42))
f = z + 100 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
for load in loads:
    f += 100 * qbpp.cons(load - z <= 0)
f.simplify_as_binary()
sol = qbpp.EasySolver(f).search(target_energy=14)
print("z =", sol(z), "loads =", [sol(load) for load in loads],
      "cons =", f.cons(sol))
```

Output:

```
RuntimeError: qbpp.max(): the argument contains abs/relu/max/min; nonlinear functions cannot be nested (write the combination as a sum of separate terms)
z = 14 loads = [14, 14, 14] cons = 0
```

The first line is the message of the `RuntimeError` for the nested `qbpp.max`.
`z` is 14, and all three loads are 14. No constraint is broken.

See [Nonlinear Functions and Native Constraints](CONSTRAINTS) for more.

## Nesting

{% include video_seek.html t="15:17" %}

A function cannot be put inside another function.
The absolute value of an integer variable $r$ from $-6$ to 6, capped at 3, $\min(\lvert r\rvert, 3)$, cannot be written with `qbpp.abs` inside `qbpp.min`,
so it is rewritten as a sum and difference of functions: $\lvert r\rvert - \mathrm{relu}(r - 3) - \mathrm{relu}(-r - 3)$.
Above 3 it is $r - (r - 3) = 3$, and below $-3$ it is 3 too: both sides of the V become flat.

```python
import pyqbpp as qbpp

r = qbpp.var("r", integer=(-6, 6))
try:
    qbpp.min(qbpp.abs(r), 3)
except RuntimeError as e:
    print("RuntimeError:", e)
g = qbpp.abs(r) - qbpp.relu(r - 3) - qbpp.relu(-r - 3)
print([g({r: v}) for v in range(-6, 7)])
```

Output:

```
RuntimeError: qbpp.min(): the argument contains abs/relu/max/min; nonlinear functions cannot be nested (write the combination as a sum of separate terms)
[3, 3, 3, 3, 2, 1, 0, 1, 2, 3, 3, 3, 3]
```

The first line is the message of the `RuntimeError` for the nesting; it advises writing a sum of separate terms.
The second line lists the 13 values for $r = -6$ to 6: capped at 3 indeed.

See [Nonlinear Functions and Native Constraints](CONSTRAINTS) for more.

## Higher-degree terms

### Literals and higher-degree terms

{% include video_seek.html t="16:52" %}

A literal is a variable `x` itself or its negation `~x`. `~x` has the same values as $1 - x$.

| `x` | `~x` | $1 - x$ |
|---:|---:|---:|
| 0 | 1 | 1 |
| 1 | 0 | 0 |

A product of three or more literals is called a higher-degree term.
For example, `~x[0] * x[1] * ~x[2]` is a term of degree 3: it is 1 only when `x[0]`, `x[1]`, `x[2]` are 0, 1, 0.
QUBO++ lets you write higher-degree terms in expressions as they are, not made quadratic, and the solvers solve them as they are.
They are not function terms like `abs` and `relu`, but ordinary polynomial terms.

### Negated literals in terms of degree 2 or less

{% include video_seek.html t="18:09" %}

`simplify_as_binary` expands negated literals in terms of degree 1 and 2, replacing `~x` with $1 - x$.
The two terms of `f` expand into $x[1] - x[0]x[1]$ and $1 - x[0] - x[1] + x[0]x[1]$, and their sum leaves only $1 - x[0]$.
The term of degree 3 keeps its `~x`.

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=3)
f = ~x[0] * x[1] + ~x[0] * ~x[1]        # degree 2
g = x[0] + ~x[0] * x[1] * ~x[2]         # degree 3
f.simplify_as_binary()
g.simplify_as_binary()
print("f =", f)
print("g =", g)
```

Output:

```
f = 1 -x[0]
g = x[0] +~x[0]*x[1]*~x[2]
```

See [Negated Literals](NEGATIVE) for more.

### Expanding a quadratic term

{% include video_seek.html t="19:44" %}

`~x[0]*~x[1]` expands into four terms, $1 - x[0] - x[1] + x[0]x[1]$, but only one of them, $x[0]x[1]$, has degree 2.
What increases is the linear terms, but like terms are collected, so there are never more linear terms than variables, and they often cancel out.
Expanded, the expression is an ordinary QUBO without negations, so negated literals in terms of degree 2 or less are expanded.

### Terms of degree 3 and up are not expanded

{% include video_seek.html t="20:51" %}

Each negation expanded doubles the number of terms: a term with $k$ negations expands into $2^k$ terms (including the constant term).

| Negations $k$ | 3 | 4 | 10 |
|---|---:|---:|---:|
| Terms after expanding, $2^k$ | 8 | 16 | 1024 |

The number of terms explodes, so `simplify_as_binary` does not expand negations in terms of degree 3 and up.
The solvers handle higher-degree terms with negated literals as they are, so you can write `~x` as it is in terms of degree 3 and up.

See [Negated Literals](NEGATIVE) for more.

## reduce

{% include video_seek.html t="21:49" %}

`qbpp.reduce` adds auxiliary variables to make higher-degree terms quadratic.
The cubic term `f` becomes `g`, 7 terms with one auxiliary variable `{r0}`, and `-f` becomes `h`, 4 terms with one auxiliary variable `{r1}`.
A negative coefficient gives another, simpler form.

```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=3)
f = x[0] * x[1] * x[2]
g = qbpp.reduce(f)
h = qbpp.reduce(-f)
print("g =", g)
print("h =", h)
print("max degree:", f.max_degree, "->", g.max_degree, h.max_degree)
sol = qbpp.ExhaustiveSolver(h).search()
print(sol)
```

Output:

```
g = {r0} +x[0]*x[1] +x[0]*x[2] -x[0]*{r0} +x[1]*x[2] -x[1]*{r0} -x[2]*{r0}
h = 2*{r1} -x[0]*{r1} -x[1]*{r1} -x[2]*{r1}
max degree: 3 -> 2 2
Sol(energy=-1, {x[0]: 1, x[1]: 1, x[2]: 1, {r1}: 1})
```

Adding auxiliary variables does not change the minimum: for any assignment of the original variables, the right auxiliary variables give the value of the original expression.
Here are the values by the number of 1s in `x` (for the 8 assignments of `x`, the values depend only on that number):

| 1s in `x` | 0 | 1 | 2 | 3 |
|---|---:|---:|---:|---:|
| `f` | 0 | 0 | 0 | 1 |
| `g` (`{r0}` = 0) | 0 | 0 | 1 | 3 |
| `g` (`{r0}` = 1) | 1 | 0 | 0 | 1 |
| min of `g` | 0 | 0 | 0 | 1 |
| `h` (`{r1}` = 0) | 0 | 0 | 0 | 0 |
| `h` (`{r1}` = 1) | 2 | 1 | 0 | -1 |
| min of `h` | 0 | 0 | 0 | -1 |

Use `reduce` for solvers that take only a quadratic QUBO. The QUBO++ solvers solve terms of degree 3 and up directly, without `reduce`.
Expressions with functions such as `abs` cannot be reduced with `qbpp.reduce`; solve them with the QUBO++ solvers.

See [Reducing HUBO to QUBO](REDUCE) for more.

## Summary

{% include video_seek.html t="23:59" %}

- QUBO++ expressions can use four functions, `abs`, `relu`, `max` and `min`, as written. Function terms are not expanded: the solvers compute their values directly. Only constants may multiply a function term.
- `qbpp.abs` is the absolute value; a second argument 2 squares it.
- `qbpp.relu` is only the part above a threshold. A `relu` term is part of the objective, not a constraint violation.
- `qbpp.max` and `qbpp.min` are the larger and the smaller of two expressions. For three or more, use an integer variable and `qbpp.cons` constraints.
- Functions cannot be nested; nesting raises `RuntimeError`. To nest them, rewrite them as sums and differences.
- Terms of degree 3 and up, and products of `~x`, are written and solved as they are. `simplify_as_binary` expands `~x` into $1 - x$ in terms of degree 2 or less, and keeps `~x` in terms of degree 3 and up, where the number of terms would explode.
- When you need a quadratic expression, `qbpp.reduce` adds auxiliary variables to make higher-degree terms quadratic. Expressions with functions cannot be reduced, so solve them with the QUBO++ solvers.
