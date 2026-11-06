---
last_modified: 2026-10-11
layout: default
nav_exclude: true
title: "QR: Printing"
nav_order: 34
lang: en
hreflang_alt: "ja/python/QR_PRINT"
hreflang_lang: "ja"
---

# Quick Reference: Printing Objects

> **Note**
> The outputs on this page are shown for reference only. The output format may differ in the latest version.
> Printed text is meant for people to read and check, so do not use it in computations.
> When you need a value, get it with functions such as `sol(x)` or `f(sol)` (see [Quick Reference: Solutions](QR_SOLUTION)).

Most PyQBPP objects can be printed with `print()`.
```python
print(obj)
```

## Overview

| Object | Example of printed text |
|---|---|
| Variable `Var` | `x`, `~x`, `a[1]` |
| Term `Term` | `2*x*y` |
| Expression `Expr` | `-4 +3*x -2*y*z +~x` |
| Binary-encoded integer variable | `v[0] +2*v[1] +2*v[2]` |
| Native integer variable | `n` |
| Constraint expression made with a comparison operator | Polynomial of the penalty expression |
| Expression with `qbpp.cons()`, `qbpp.abs()`, `qbpp.relu()` | Objective polynomial followed by one item per line |
| List of constraints `f.cons()` | `100 * (x +y +z <= 2)` |
| `f.violations(sol)` | `[{'value': 2, 'lower': 1, 'upper': 1, 'violation': 1, 'weight': 1, 'satisfied': False}]` |
| Array | `[a[0], a[1], a[2]]` |
| Solution `Sol` (including solutions returned by solvers) | `Sol(energy=0, {x[0]: 0, x[1]: 0, x[2]: 1, n: 3})` |
| `qbpp.CallbackEvent` | `CallbackEvent.BestUpdated` |

## Variables, terms, and expressions

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
a = qbpp.var("a", 3)
u = qbpp.var()
print(x)
print(~x)
print(a[1])
print(u)
print(2 * x * y)
f = 3 * x - 2 * y * z + ~x - 4
print(f)
```
This program produces the following output:
```
x
~x
a[1]
{0}
2*x*y
-4 +3*x -2*y*z +~x
```
- A variable created without a name (`qbpp.var()`) is printed as `{0}`, `{1}`, ....
- An expression is printed with the constant term first, followed by the terms in the order they were created. Each term after the first is preceded by a space and its sign (`+` or `-`).
- A coefficient of 1 is omitted. A negated literal is printed as `~x`.

### Before and after simplification

An expression is printed in the form in which it was created; it is not simplified automatically.
To see it with like terms combined, simplify it with `qbpp.simplify()` or `qbpp.simplify_as_binary()` before printing.

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
g = x * x + x * y + y * x + 1
print(g)
print(qbpp.simplify(g))
print(qbpp.simplify_as_binary(g))
```
This program produces the following output:
```
1 +x*x +x*y +y*x
1 +x*x +2*x*y
1 +x +2*x*y
```
`qbpp.simplify()` combines like terms, and `qbpp.simplify_as_binary()` additionally uses the property of binary variables (`x*x` = `x`).

## Integer variables

```python
import pyqbpp as qbpp

x = qbpp.var("x")
v = qbpp.var("v", between=(0, 5))
n = qbpp.var("n", integer=(0, 5))
print(v)
print(n)
f = 2 * n + x
print(f)
print(qbpp.binarize(f))
```
This program produces the following output:
```
v[0] +2*v[1] +2*v[2]
n
2*n +x
2*n#0 +4*n#1 +4*n#2 +x
```
- A binary-encoded integer variable is printed as an expression of the binary variables (`v[0]`, `v[1]`, ...) that represent its value (see [Binary-Encoded Integer Variables](BINARY_INTEGER)).
- A native integer variable is printed by its name (see [Integer Variables and Solving Simultaneous Equations](INTEGER)).
- The binary variables that `qbpp.binarize()` substitutes for a native integer variable are printed as `n#0`, `n#1`, ....

## Auxiliary variables

Variables that PyQBPP adds when it transforms an expression are printed with names in braces.

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
print(qbpp.reduce(x * y * z))
print(qbpp.simplify_as_binary(x + y + z <= 2))
```
This program produces the following output:
```
{r0} +x*y +x*z -x*{r0} +y*z -y*{r0} -z*{r0}
2*{s1} +2*x*y +2*x*z -2*x*{s1} +2*y*z -2*y*{s1} -2*z*{s1}
```
- Names starting with `r`, such as `{r0}`: variables that `qbpp.reduce()` adds to lower the degree (see [Reducing HUBO to QUBO](REDUCE))
- Names starting with `s`, such as `{s1}`: slack variables added by constraint expressions made with comparison operators (see [Comparison Constraints](COMPARISON))

The numbers are serial numbers assigned in the order the variables are added.

## Constraints and nonlinear functions

### Constraint expressions made with comparison operators

A constraint expression made with a comparison operator (`==`, `<=`, `>=`) or with `qbpp.constrain()` is printed as the expanded polynomial of its penalty expression.
Because it is printed before simplification, `qbpp.simplify_as_binary()` makes it shorter.

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
print(x + y == 1)
print(qbpp.simplify_as_binary(x + y == 1))
```
This program produces the following output:
```
1 +x*x -2*x +2*x*y +y*y -2*y
1 -x -y +2*x*y
```

### Expressions with cons(), abs(), and relu()

An expression that contains `qbpp.cons()`, `qbpp.abs()`, or `qbpp.relu()` is printed as the objective polynomial followed by each of these items, one per line, in the form in which it was written.

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
f = 3 * x + 100 * qbpp.cons(x + y + z <= 2) + qbpp.cons(x + y == 1)
print(f)
print(qbpp.abs(x - y) + qbpp.relu(x + y - 1, 2))
print(qbpp.cons(x + y + z, equal=[0, 2]))
print(qbpp.cons(x + y + z, between=(1, 2)))
print(-5 * qbpp.cons(x + y == 1))
print(qbpp.max(x, y))
```
This program produces the following output:
```
3*x
+100*cons(x +y +z <= 2)
+cons(x +y == 1)
abs(x -y, 1)
+relu(-1 +x +y, 2)
cons(x +y +z == {0, 2})
cons(1 <= x +y +z <= 2)
-5*cons(x +y == 1)
y
+relu(x -y, 1)
```
- A weight of 1 is omitted, and a negative weight is shown by the sign at the start of the line. When the objective polynomial is 0, its line is not printed.
- The second number of `abs(f, k)` and `relu(f, k)` is the exponent (`qbpp.abs(f)` is printed as `abs(f, 1)` and `qbpp.abs(f, 2)` as `abs(f, 2)`).
- `qbpp.max()` and `qbpp.min()` are printed as equivalent expressions that use `relu()` or `abs()`.

For details, see [Nonlinear Functions and Native Constraints](CONSTRAINTS).

### List of constraints and violations

`f.cons()` returns the list of constraints in an expression, and `f.violations(sol)` returns the value and the amount of violation of each constraint for a solution `sol`. Both can be printed.

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
f = 3 * x + 100 * qbpp.cons(x + y + z <= 2) + qbpp.cons(x + y == 1)
print(f.cons())
sol = qbpp.Sol(f)
sol.set(x, 1)
sol.set(y, 1)
print(f.violations(sol))
```
This program produces the following output:
```
100 * (x +y +z <= 2)
(x +y == 1)
[{'value': 2, 'lower': 0, 'upper': 2, 'violation': 0, 'weight': 100, 'satisfied': True}, {'value': 2, 'lower': 1, 'upper': 1, 'violation': 1, 'weight': 1, 'satisfied': False}]
```

## Arrays

```python
import pyqbpp as qbpp

a = qbpp.var("a", 3)
b = qbpp.var("b", 2, 3)
c = qbpp.array([1, 2, 3])
print(a)
print(b)
print(b[1])
print(a + 1)
print(c)
print(qbpp.vector_sum(b))
```
This program produces the following output:
```
[a[0], a[1], a[2]]
[[b[0][0], b[0][1], b[0][2]], [b[1][0], b[1][1], b[1][2]]]
[b[1][0], b[1][1], b[1][2]]
[1 +a[0], 1 +a[1], 1 +a[2]]
[1, 2, 3]
[b[0][0] +b[0][1] +b[0][2], b[1][0] +b[1][1] +b[1][2]]
```
- An array is printed in the same format as a Python list. A multi-dimensional array is printed as nested lists.
- A subarray such as `b[1]` is printed in the same format.
- Lists and dicts that contain PyQBPP objects can also be printed, as in `print([x, 2 * x * y])` or `print({x: 1, y: 0})`.

## Solutions

```python
import pyqbpp as qbpp

x = qbpp.var("x", 3)
n = qbpp.var("n", integer=(0, 5))
f = qbpp.sqr(qbpp.sum(x) - 1) + 3 * x[0] + 2 * x[1] + qbpp.sqr(n - 3)
f.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(f).search()
print(sol)
print(sol(x))
print(sol(n))
s = qbpp.Sol(sol)
s.set(x[0], 1)
s.set(n, 5)
print(s)
```
This program produces the following output:
```
Sol(energy=0, {x[0]: 0, x[1]: 0, x[2]: 1, n: 3})
[0, 0, 1]
3
Sol(energy=8, {x[0]: 1, x[1]: 0, x[2]: 1, n: 5})
```
- A solution is printed in the form `Sol(energy=energy, {variable: value, ...})`. Native integer variables follow the binary variables.
- A solution whose values were changed with `sol.set()` is printed with the energy computed for that assignment.
- The solver information `sol.info` is printed as a dict whose values are strings (see [Quick Reference: Solutions](QR_SOLUTION)).

Multiple solutions collected by a solver (`sol.sols`) are printed as a list of solutions.

```python
import pyqbpp as qbpp

x = qbpp.var("x", 3)
f = qbpp.sqr(qbpp.sum(x) - 1) + 3 * x[0] + 2 * x[1]
f.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(f).search(topk_sols=3)
print(sol.sols)
```
This program produces the following output:
```
[Sol(energy=0, {x[0]: 0, x[1]: 0, x[2]: 1}), Sol(energy=1, {x[0]: 0, x[1]: 0, x[2]: 0}), Sol(energy=2, {x[0]: 0, x[1]: 1, x[2]: 0})]
```

## Real coefficients

With real (`float`) coefficients, enabled by `pyqbpp.d` and similar modules, each coefficient is printed as the shortest decimal number that represents the original value exactly.
If its decimal exponent is at least −4 and less than 16, positional notation is used (`2500`, `1.5`, `0.1`); otherwise, scientific notation is used (`1e+20`, `1e-07`).
Integer values are printed without a decimal point.

```python
import pyqbpp.d as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
z = qbpp.var("z")
f = 100 * x + 2500 * y + 1.5 * z
print(f)
g = 0.1 * x - 1e-7 * y + 1e20 * z
print(g)
```
This program produces the following output:
```
100*x +2500*y +1.5*z
0.1*x -1e-07*y +1e+20*z
```
To check the expression with integer coefficients that the solver actually solves, print the result of `qbpp.quantize()` (see [Data Types of Variables and Expressions](VAREXPR)).

## Callback events

`qbpp.CallbackEvent`, used in ABS3 Solver callbacks, can also be printed (see [ABS3 Solver Usage](ABS3)).

```python
import pyqbpp as qbpp

print(qbpp.CallbackEvent.BestUpdated)
```
This program produces the following output:
```
CallbackEvent.BestUpdated
```

## Objects without a printed format

- Solvers (`qbpp.EasySolver`, `qbpp.ExhaustiveSolver`, `qbpp.ABS3Solver`) have no printed format and are printed as `<... object at 0x...>`.

## Differences from the C++ version

C++ and Python differ in some formats, following the conventions of each language.

| Object | C++ | Python |
|---|---|---|
| Array | `{a[0],a[1],a[2]}` | `[a[0], a[1], a[2]]` |
{% raw %}| Solution | `0:{{x,0},{y,1}}` | `Sol(energy=0, {x: 0, y: 1})` |{% endraw %}
| Element of `violations()` | `{value: 2, ..., satisfied: false}` | dict `{'value': 2, ..., 'satisfied': False}` |
| `CallbackEvent` | `CallbackEvent::BestUpdated` | `CallbackEvent.BestUpdated` |
| Solver | Cannot be printed | `<... object at 0x...>` |
