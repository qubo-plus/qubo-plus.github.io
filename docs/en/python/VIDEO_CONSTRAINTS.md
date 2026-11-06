---
last_modified: 2026-10-26
layout: default
nav_exclude: true
title: "Video: Writing Constraints"
description: "The points of each chapter of the video \"QUBO++ Writing Constraints (Python)\", with the programs shown in it and their output."
lang: en
hreflang_alt: "ja/python/VIDEO_CONSTRAINTS"
hreflang_lang: "ja"
video: constraints
---

# Video: Writing Constraints (Python)

A companion to the video "QUBO++ Writing Constraints (Python)".
For each chapter it gives the main points, the programs shown in the video with their output, and links to the pages that explain more.
Click "▶ Play the video from …" to play from that scene.
Programs that the video shows in part are given here in full, ready to run.

{% include video_embed.html slug="constraints" %}

What the video covers:

- Putting the objective and the constraints into one expression (the standard approach to constrained optimization)
- Writing equality and inequality constraints as penalties (`==`, `<=`, `>=`, `qbpp.constrain`), and choosing the weight
- Declaring constraints with `qbpp.cons()`, unique to QUBO++, and how it differs from penalties
- Solving the 0/1 knapsack problem and the knapsack problem with counts both ways, and comparing them

Back to the list of [Videos (Tutorials)](../VIDEOS)

## The standard approach

### Example: choose 2 of 4

{% include video_seek.html t="2:15" %}

From four items a, b, c, d worth 3, 5, 4 and 2, choose exactly two so that the total value is as large as possible.
Whether each item is chosen is a binary variable a, b, c, d (1 = chosen).

### One expression

{% include video_seek.html t="3:18" %}

The solver looks for the solution that makes the expression smallest, so the objective to maximize gets a minus sign.
A constraint is written as an expression that is 0 when it is met and positive when it is broken, multiplied by a weight $P$ and added.

$$
f = -(\text{total value}) + P \times (\text{number chosen} - 2)^2
$$

With $P$ large enough, breaking the constraint does not pay, so the solution that minimizes $f$ meets the constraint
and, among those that meet it, has the largest total value.

### The program

{% include video_seek.html t="4:47" %}

`qbpp.constrain(expression, equal=2)` is the penalty for the constraint that the expression equals 2.

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
d = qbpp.var("d")
value = 3 * a + 5 * b + 4 * c + 2 * d
f = -value + 10 * qbpp.constrain(a + b + c + d, equal=2)
f.simplify_as_binary()
print("f =", f)

sol = qbpp.ExhaustiveSolver(f).search()
print(sol)
print("value =", sol(value))
```

Output:

```
f = 40 -33*a -35*b -34*c -32*d +20*a*b +20*a*c +20*a*d +20*b*c +20*b*d +20*c*d
Sol(energy=-9, {a: 0, b: 1, c: 1, d: 0})
value = 9
```

## Equality constraints

{% include video_seek.html t="7:00" %}

`qbpp.constrain(f, equal=n)`, `f == n` and `qbpp.sqr(f - n)` all give the same expression $(f-n)^2$.

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
d = qbpp.var("d")
g = qbpp.constrain(a + b + c + d, equal=2)
h = a + b + c + d == 2
i = qbpp.sqr(a + b + c + d - 2)
print("g =", qbpp.simplify_as_binary(g))
print("h =", qbpp.simplify_as_binary(h))
print("i =", qbpp.simplify_as_binary(i))
```

Output:

```
g = 4 -3*a -3*b -3*c -3*d +2*a*b +2*a*c +2*a*d +2*b*c +2*b*d +2*c*d
h = 4 -3*a -3*b -3*c -3*d +2*a*b +2*a*c +2*a*d +2*b*c +2*b*d +2*c*d
i = 4 -3*a -3*b -3*c -3*d +2*a*b +2*a*c +2*a*d +2*b*c +2*b*d +2*c*d
```

See [Comparison Constraints](COMPARISON) for more.

## Choosing the weight

### When the weight is too small

{% include video_seek.html t="8:55" %}

With the weight $P = 1$, choosing three items and breaking the constraint gives the smallest value. With $P = 10$ the constraint is met.

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
d = qbpp.var("d")
value = 3 * a + 5 * b + 4 * c + 2 * d
for P in [1, 10]:
    f = -value + P * (a + b + c + d == 2)
    f.simplify_as_binary()
    sol = qbpp.ExhaustiveSolver(f).search()
    print(f"P = {P}: {sol}, value = {sol(value)}")
```

Output:

```
P = 1: Sol(energy=-11, {a: 1, b: 1, c: 1, d: 0}), value = 12
P = 10: Sol(energy=-9, {a: 0, b: 1, c: 1, d: 0}), value = 9
```

### A rule of thumb

{% include video_seek.html t="10:34" %}

- Choose the weight so that the cost of a violation is larger than what breaking the constraint gains (how much the objective improves).
  For a knapsack problem, a weight at least the largest value of an item is enough.
- Too large a weight makes the differences among assignments that meet the constraint relatively small, and the solver finds good solutions less easily.

## Inequality constraints

### How to write them

{% include video_seek.html t="11:57" %}

| Condition | With an operator | With `constrain` |
|---|---|---|
| Upper bound u | `f <= u` | `qbpp.constrain(f, between=(None, u))` |
| Lower bound l | `f >= l` | `qbpp.constrain(f, between=(l, None))` |
| Range l to u | `(l <= f) & (qbpp.same <= u)` | `qbpp.constrain(f, between=(l, u))` |

Python evaluates `l <= f <= u` as `(l <= f) and (f <= u)`, which can only give a truth value, so a range is written with `qbpp.same` or `between=`.

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
g = qbpp.constrain(a + b + c, between=(1, 2))
h = (1 <= a + b + c) & (qbpp.same <= 2)
print("g =", qbpp.simplify_as_binary(g))
print("h =", qbpp.simplify_as_binary(h))
```

Output:

```
g = 2 -2*a -2*b -2*c +2*a*b +2*a*c +2*b*c
h = 2 -2*a -2*b -2*c +2*a*b +2*a*c +2*b*c
```

### A knapsack problem with three items

{% include video_seek.html t="13:49" %}

From three items worth 4, 7 and 8 and weighing 4, 9 and 11, choose items with a total weight of at most 14 so that the total value is as large as possible.
`{s0}[0]` and the like in the output are slack variables, which the penalty of an inequality gets automatically.

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
value = 4 * a + 7 * b + 8 * c
weight = 4 * a + 9 * b + 11 * c
f = -value + 10 * qbpp.constrain(weight, between=(None, 14))
f.simplify_as_binary()

sol = qbpp.ExhaustiveSolver(f).search()
print(sol)
print("value =", sol(value), "weight =", sol(weight))
```

Output:

```
Sol(energy=-11, {a: 1, b: 1, c: 0, {s0}[0]: 1, {s0}[1]: 1, {s0}[2]: 1})
value = 11 weight = 13
```

### A slack variable of your own

{% include video_seek.html t="15:05" %}

With an integer variable $s$ from 0 to 13, `weight <= 14` can be written as "weight equals $s$ or $s+1$".
$(\text{weight}-s)(\text{weight}-(s+1))$ is 0 when weight is $s$ or $s+1$, and positive otherwise.

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
value = 4 * a + 7 * b + 8 * c
weight = 4 * a + 9 * b + 11 * c
s = qbpp.var("s", between=(0, 13))   # an integer from 0 to 13
print("s =", s)
f = -value + 10 * (weight - s) * (weight - (s + 1))
f.simplify_as_binary()

sol = qbpp.ExhaustiveSolver(f).search()
print(sol)
print("value =", sol(value), "weight =", sol(weight), "s =", sol(s))
```

Output:

```
s = s[0] +2*s[1] +4*s[2] +6*s[3]
Sol(energy=-11, {a: 1, b: 1, c: 0, s[0]: 1, s[1]: 1, s[2]: 1, s[3]: 1})
value = 11 weight = 13 s = 13
```

### The slack variables added automatically

{% include video_seek.html t="16:49" %}

A penalty written with `<=` gets slack variables `{s0}` in the same way. Expanded, it has 21 terms.

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
g = 4 * a + 9 * b + 11 * c <= 14
g.simplify_as_binary()
print("g =", g)
```

Output:

```
g = 12*a +72*b +110*c +6*{s0}[0] +20*{s0}[1] +56*{s0}[2] +72*a*b +88*a*c -16*a*{s0}[0] -32*a*{s0}[1] -56*a*{s0}[2] +198*b*c -36*b*{s0}[0] -72*b*{s0}[1] -126*b*{s0}[2] -44*c*{s0}[0] -88*c*{s0}[1] -154*c*{s0}[2] +16*{s0}[0]*{s0}[1] +28*{s0}[0]*{s0}[2] +56*{s0}[1]*{s0}[2]
```

See [Comparison Constraints](COMPARISON) for more.

## Declaring with cons()

### How to write them

{% include video_seek.html t="18:08" %}

Wrapping a comparison in `qbpp.cons()` makes it a constraint that is handled specially.

| Condition | Penalty | `cons` |
|---|---|---|
| Equality | `f == n` | `qbpp.cons(f == n)` |
| Upper bound | `f <= u` | `qbpp.cons(f <= u)` |
| Lower bound | `f >= l` | `qbpp.cons(f >= l)` |
| Range | `qbpp.constrain(f, between=(l, u))` | `qbpp.cons(f, between=(l, u))` |

### Kept as written

{% include video_seek.html t="18:56" %}

A constraint wrapped in `cons()` is not expanded; it is kept as written, with no slack variables.

### Solved the same way

{% include video_seek.html t="19:48" %}

`f.cons(sol)` is the number of constraints that the solution `sol` violates.

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
value = 4 * a + 7 * b + 8 * c
weight = 4 * a + 9 * b + 11 * c
f = -value + 10 * qbpp.cons(weight <= 14)
f.simplify_as_binary()
print("f =", f)

sol = qbpp.ExhaustiveSolver(f).search()
print(sol)
print("value =", sol(value), "weight =", sol(weight))
print("violated =", f.cons(sol))
```

Output:

```
f = -4*a -7*b -8*c
+10*cons(4*a +9*b +11*c <= 14)
Sol(energy=-11, {a: 1, b: 1, c: 0})
value = 11 weight = 13
violated = 0
```

### The value of cons()

{% include video_seek.html t="21:05" %}

The value of a constraint wrapped in `cons()` is the square of the violation (0 when it is met).
With a weight $P$ it is $P \times \text{violation}^2$, and the value of the whole expression is the objective plus the value of each constraint.
For example, choosing a and c in the three-item example gives a weight of 15, one over the bound of 14, so the constraint is worth $10 \times 1^2 = 10$
and the whole expression $-12 + 10 = -2$.

### Several constraints

{% include video_seek.html t="22:21" %}

Several constraints are simply added, each with its weight.
`f(m)` and `f.cons(m)` give the values for an assignment given as a dictionary.

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
d = qbpp.var("d")
value = 3 * a + 5 * b + 4 * c + 2 * d
weight = 2 * a + 4 * b + 3 * c + 2 * d
f = (-value + 10 * qbpp.cons(a + b + c + d == 2)
     + 10 * qbpp.cons(weight <= 5))
f.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(f).search()
print(sol, "violated =", f.cons(sol))
m = {a: 0, b: 1, c: 1, d: 0}
print("f =", f(m), "violated =", f.cons(m))
```

Output:

```
Sol(energy=-7, {a: 1, b: 0, c: 1, d: 0}) violated = 0
f = 31 violated = 1
```

See [Nonlinear Functions and Native Constraints](CONSTRAINTS) for more.

## constrain vs cons

### The values of the constraints

{% include video_seek.html t="23:47" %}

For an equality both are the square of the violation: exactly the same expression.
For an inequality, `constrain` (with the slack variables chosen best) is violation × (violation + 1), and `cons` is the square of the violation.
For `weight <= 14` in the three-item example:

| Weight | Violation | constrain | cons |
|---:|---:|---:|---:|
| 0, 4, 9, 11, 13 | 0 | 0 | 0 |
| 15 | 1 | 2 | 1 |
| 20 | 6 | 42 | 36 |
| 24 | 10 | 110 | 100 |

Both are 0 when the constraint is met and positive when it is broken, so with a large enough weight either one gives the same optimal solution that meets the constraint.

### The size of the expression

{% include video_seek.html t="25:02" %}

The penalty has 6 variables and 21 terms, with the slack variables; `cons` has 3 variables and 3 terms.
Smaller and without slack variables, `cons` is easier for the solver, and in many cases gives better solutions.

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
value = 4 * a + 7 * b + 8 * c
weight = 4 * a + 9 * b + 11 * c
fp = -value + 10 * (weight <= 14)
fp.simplify_as_binary()
fc = -value + 10 * qbpp.cons(weight <= 14)
fc.simplify_as_binary()
for name, f in [("penalty", fp), ("cons", fc)]:
    sol = qbpp.ExhaustiveSolver(f).search()
    print(f"{name:8s} vars = {sol.info['var_count']}, terms = {f.term_count()}")
```

Output:

```
penalty  vars = 6, terms = 21
cons     vars = 3, terms = 3
```

## Example: the knapsack problem

### Ten items

{% include video_seek.html t="26:10" %}

From ten items, choose items with a total weight of at most 120 so that the total value is as large as possible.
The weight is 100, matched to the largest value of an item (95), and both the penalty and `cons` are solved with EasySolver.

```python
import pyqbpp as qbpp

w = [27, 34, 11, 18, 31, 54, 41, 22, 39, 23]
v = [62, 73, 22, 39, 70, 95, 53, 28, 31, 48]
W = 120
x = qbpp.var("x", shape=10)
value = qbpp.sum(v * x)
weight = qbpp.sum(w * x)

fp = -value + 100 * (weight <= W)             # penalty
fp.simplify_as_binary()
fc = -value + 100 * qbpp.cons(weight <= W)    # cons
fc.simplify_as_binary()

for name, f in [("penalty", fp), ("cons", fc)]:
    sol = qbpp.EasySolver(f).search(time_limit=1)
    print(f"{name:8s} vars = {sol.info['var_count']:2}, terms = {f.term_count():3}, "
          f"value = {sol(value)}, weight = {sol(weight)}")
print(sol(x))
```

The output in the video (EasySolver may give different results on each run):

```
penalty  vars = 16, terms = 136, value = 253, weight = 115
cons     vars = 10, terms =  10, value = 253, weight = 115
[1, 1, 0, 0, 1, 0, 0, 0, 0, 1]
```

### The weight of cons

{% include video_seek.html t="29:59" %}

With `cons` too, a small weight lets the constraint be broken.

```python
import pyqbpp as qbpp

w = [27, 34, 11, 18, 31, 54, 41, 22, 39, 23]
v = [62, 73, 22, 39, 70, 95, 53, 28, 31, 48]
x = qbpp.var("x", shape=10)
value = qbpp.sum(v * x)
weight = qbpp.sum(w * x)
for P in [1, 10, 100]:
    f = -value + P * qbpp.cons(weight <= 120)
    f.simplify_as_binary()
    sol = qbpp.ExhaustiveSolver(f).search()
    print(f"P = {P:3}: value = {sol(value)}, weight = {sol(weight)}, violated = {f.cons(sol)}")
```

Output:

```
P =   1: value = 266, weight = 121, violated = 1
P =  10: value = 266, weight = 121, violated = 1
P = 100: value = 253, weight = 115, violated = 0
```

### Sixty items

{% include video_seek.html t="31:29" %}

Sixty random items, each way solved three times and compared with the optimum found by dynamic programming.

```python
import random
import pyqbpp as qbpp

n = 60
random.seed(7)
w = [random.randint(10, 60) for i in range(n)]
v = [random.randint(10, 100) for i in range(n)]
W = sum(w) * 2 // 5

x = qbpp.var("x", shape=n)
value = qbpp.sum(v * x)
weight = qbpp.sum(w * x)
fp = -value + 100 * (weight <= W)
fp.simplify_as_binary()
fc = -value + 100 * qbpp.cons(weight <= W)
fc.simplify_as_binary()

for name, f in [("penalty", fp), ("cons", fc)]:
    for run in range(3):
        sol = qbpp.EasySolver(f).search(time_limit=1)
        print(f"{name:8s} value = {sol(value)}, weight = {sol(weight)}")

# the optimum by dynamic programming (for comparison)
best = [0] * (W + 1)
for i in range(n):
    for c in range(W, w[i] - 1, -1):
        best[c] = max(best[c], best[c - w[i]] + v[i])
print("W =", W, "optimum =", best[W])
```

The output in the video (EasySolver gives different results on each run):

```
penalty  value = 2380, weight = 742
penalty  value = 2364, weight = 742
penalty  value = 2347, weight = 741
cons     value = 2380, weight = 742
cons     value = 2380, weight = 741
cons     value = 2380, weight = 742
W = 742 optimum = 2380
```

`cons` reached the optimum 2380 all three times; the penalty sometimes does not.

See [Knapsack](KNAPSACK) for more.

## Example: knapsack with counts

### The program

{% include video_seek.html t="33:00" %}

Each of 40 kinds of items can be chosen from 0 to 10 times. Making the variables integer variables with `integer=(0, 10)` is the only change from the 0/1 case.

```python
import random
import pyqbpp as qbpp

n = 40
random.seed(11)
w = [random.randint(10, 60) for i in range(n)]
v = [random.randint(10, 100) for i in range(n)]
W = sum(w) * 10 // 4

x = qbpp.var("x", shape=n, integer=(0, 10))
value = qbpp.sum(v * x)
weight = qbpp.sum(w * x)
fp = -value + 100 * (weight <= W)
fp.simplify_as_binary()
fc = -value + 100 * qbpp.cons(weight <= W)
fc.simplify_as_binary()
print("terms: penalty =", fp.term_count(), ", cons =", fc.term_count())

for name, f in [("penalty", fp), ("cons", fc)]:
    for run in range(3):
        sol = qbpp.EasySolver(f).search(time_limit=1)
        print(f"{name:8s} binary vars = {sol.info['var_count']}, value = {sol(value)}, weight = {sol(weight)}")

# the optimum by dynamic programming (for comparison)
best = [0] * (W + 1)
for i in range(n):
    for c in range(W, -1, -1):
        for k in range(1, 11):
            if k * w[i] > c:
                break
            best[c] = max(best[c], best[c - k * w[i]] + k * v[i])
print("W =", W, "optimum =", best[W])
```

### Results

{% include video_seek.html t="34:33" %}

The output in the video (EasySolver gives different results on each run):

```
terms: penalty = 1366 , cons = 40
penalty  binary vars = 11, value = 10201, weight = 3567
penalty  binary vars = 11, value = 10215, weight = 3565
penalty  binary vars = 11, value = 10262, weight = 3565
cons     binary vars = 0, value = 10352, weight = 3565
cons     binary vars = 0, value = 10348, weight = 3563
cons     binary vars = 0, value = 10355, weight = 3567
W = 3567 optimum = 10366
```

The penalty has 1366 terms with slack variables (11 binary variables); `cons` has 40 terms and only the integer variables.
`cons` gets closer to the optimum 10366.

See [Integer Variables](INTEGER) for more.

## Summary

{% include video_seek.html t="36:08" %}

- A problem with constraints is solved by putting the objective and the constraints into one expression. The objective to maximize gets a minus sign, and each constraint is multiplied by a weight and added.
- Choose the weight so that the cost of a violation is larger than what breaking the constraint gains. Too small, and the constraint is broken; too large, and good solutions are hard to find.
- Penalties are made with comparison operators (`==`, `<=`, `>=`) or `qbpp.constrain`. A range is written with `between=` or `qbpp.same`. The penalty of an inequality gets slack variables automatically.
- `qbpp.cons()` wraps a comparison to declare it as a constraint. It computes the violation from the expression as written and uses no slack variables. `f.cons(sol)` gives the number of violated constraints.
- Either way, a constraint is 0 when met and grows with the violation when broken, so with a large enough weight both give the same answer. `cons` is easier for the solver and often gives better solutions.
