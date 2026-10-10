---
last_modified: 2026-10-08
layout: default
nav_exclude: true
title: "Taxicab Number 1729"
nav_order: 96
lang: en
hreflang_alt: "ja/python/TAXICAB"
hreflang_lang: "ja"
---

# Taxicab Number 1729

The mathematician Hardy once remarked that the number of the taxi he had ridden in, 1729, seemed rather dull. Ramanujan replied that it is the smallest number expressible as the sum of two cubes in two different ways:

$$
1729 = 1^3 + 12^3 = 9^3 + 10^3
$$

On this page, we decompose 1729 into a sum of two cubes by exhaustive search with the Exhaustive Solver.
We write the same problem in two ways and compare them:
- integer variables declared with `between=`, with penalty expressions
- native integer variables declared with `integer=`, with `qbpp.cons()`

Finally, we let PyQBPP find 1729 itself.

## The problem

We find all positive integers $a \le b$ such that

$$
a^3 + b^3 = 1729.
$$

Since $12^3 = 1728$, it is enough to search $1 \le a \le b \le 12$.
The condition $a \le b$ excludes solutions that only swap $a$ and $b$.

## Solving with `between=` and penalty expressions

```python
import pyqbpp as qbpp

a = qbpp.var("a", between=(1, 12))
b = qbpp.var("b", between=(1, 12))
n = a * a * a + b * b * b
f = (n == 1729) + (b - a >= 0)
f.simplify_as_binary()
print(f"a = {a}")
print(f"f: degree = {f.max_degree}, terms = {f.term_count()}")

solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)
for sol in result.sols:
    print(f"{sol(a)}^3 + {sol(b)}^3 = {sol(n)}, energy = {sol.energy}")
```

We define $a$ and $b$ as [integer variables](INTEGER) taking values from 1 to 12 by passing `between=(1, 12)` to `qbpp.var()`, and build `f` by adding the equality `n == 1729` and the inequality `b - a >= 0`.
A comparison that is not wrapped in `qbpp.cons()` becomes a **penalty expression**: it is 0 when the condition holds and positive otherwise.
Passing `best_energy_sols=0` to `search()` returns all solutions with the minimum energy.

The output of this program is as follows:
```
a = 1 +a[0] +2*a[1] +4*a[2] +4*a[3]
f: degree = 6, terms = 256
9^3 + 10^3 = 1729, energy = 0
1^3 + 12^3 = 1729, energy = 0
```

- As the first line shows, an integer variable declared with `between=` is a linear expression of four binary variables `a[0]` to `a[3]`.
- The equality `n == 1729` becomes the penalty expression $(a^3+b^3-1729)^2$. Since $a^3$ is a cubic expression of binary variables, expanding the square gives a polynomial of degree 6.
- The penalty expression for the inequality `b - a >= 0` adds an auxiliary variable, which is also represented by binary variables (see [Constraints](CONSTRAINTS)).
- As a result, `f` is a polynomial of degree 6 with 256 terms over 11 binary variables (4 each for $a$ and $b$, and 3 for the auxiliary variable). Printing it with `print(f)` lists all 256 terms.
- The Exhaustive Solver examines all $2^{11} = 2048$ assignments of the binary variables and finds two solutions with energy 0.

## Solving with `integer=` and `cons()`

```python
import pyqbpp as qbpp

a = qbpp.var("a", integer=(1, 12))
b = qbpp.var("b", integer=(1, 12))
n = a * a * a + b * b * b
f = qbpp.cons(n == 1729) + qbpp.cons(b - a >= 0)
f.simplify_as_binary()
print(f"a = {a}")
print(f"f = {f}")

solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)
for sol in result.sols:
    print(f"{sol(a)}^3 + {sol(b)}^3 = {sol(n)}, energy = {sol.energy}, violations = {f.cons(sol)}")
```

The only differences from the previous program are that `between=` is replaced by `integer=` and that the two comparisons are wrapped in `qbpp.cons()`.

The output of this program is as follows:
```
a = a
f = cons(a*a*a +b*b*b == 1729)
+cons(-a +b >= 0)
1^3 + 12^3 = 1729, energy = 0, violations = 0
9^3 + 10^3 = 1729, energy = 0, violations = 0
```

- A [native integer variable](NATIVE_INTEGER) declared with `integer=` is not expanded into binary variables; it holds an integer value directly (line 1). `a * a * a` is also treated as the cube of an integer.
- A comparison wrapped in `qbpp.cons()` is not expanded into a penalty expression; it is kept in `f` as a **constraint** (lines 2 and 3). There is no expansion of a square and no auxiliary variable.
- The energy of an assignment that violates a constraint is the square of the violation. `f.cons(sol)` returns the number of violated constraints.
- The Exhaustive Solver examines all $12 \times 12 = 144$ combinations of the values of $a$ and $b$.

## Comparing the two formulations

| | `between=` with penalty expressions | `integer=` with `cons()` |
|---|---|---|
| Representation of an integer | Linear expression of binary variables (4 each for $a$ and $b$) | The integer value itself |
| $a^3+b^3=1729$ | Polynomial of degree 6 from expanding $(a^3+b^3-1729)^2$ | Kept as a constraint |
| $a \le b$ | Penalty expression with an auxiliary variable | Kept as a constraint |
| Size of `f` | 11 binary variables, 256 terms | 2 constraints |
| Cases examined by the Exhaustive Solver | $2^{11} = 2048$ | $12 \times 12 = 144$ |
| Solvers | A polynomial of binary variables, so it can also be passed to QUBO/HUBO solvers other than QUBO++ | Solvers bundled with QUBO++ (EasySolver, ABS3, and Exhaustive Solver) |

If the range of the integers is widened, `between=` needs more binary variables, and the number of terms in the penalty expressions grows rapidly.
With `integer=` and `cons()`, `f` stays two constraints however wide the range is.

The type of variable and the way of writing constraints can be chosen independently.
[Pythagorean Triples](PYTHAGOREAN) shows integer variables declared with `between=` combined with `cons()`, and [Native Integer Variables](NATIVE_INTEGER) shows native integer variables used in penalty expressions.

## Finding 1729

Finally, we let PyQBPP find the smallest number expressible as the sum of two cubes in two different ways.
We search for positive integers with $a^3 + b^3 = c^3 + d^3$ that minimize $n = a^3 + b^3$:

```python
import pyqbpp as qbpp

a = qbpp.var("a", integer=(1, 20))
b = qbpp.var("b", integer=(1, 20))
c = qbpp.var("c", integer=(1, 20))
d = qbpp.var("d", integer=(1, 20))
n = a * a * a + b * b * b
m = c * c * c + d * d * d
f = (n  # minimize n
     + 20000 * qbpp.cons(n - m == 0)
     + 20000 * qbpp.cons(c - a >= 1)   # a < c
     + 20000 * qbpp.cons(d - c >= 0)   # c <= d
     + 20000 * qbpp.cons(b - d >= 1))  # d < b
f.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)
for sol in result.sols:
    print(f"{sol(n)} = {sol(a)}^3 + {sol(b)}^3 = {sol(c)}^3 + {sol(d)}^3, violations = {f.cons(sol)}")
```

The output of this program is as follows:
```
1729 = 1^3 + 12^3 = 9^3 + 10^3, violations = 0
```

- The objective is $n = a^3 + b^3$, and the constraints are $n = c^3 + d^3$ and $a < c \le d < b$. The condition $a < c \le d < b$ excludes identical representations and combinations that only differ in order.
- The weight of the constraints is 20000. In this range $n \le 2 \cdot 20^3 = 16000$, so an assignment that violates any constraint has a higher energy than any assignment that satisfies all of them.
- If a number smaller than 1729 had two such representations, all of $a$, $b$, $c$, and $d$ would be at most 12 and thus within the range 1 to 20. Since the Exhaustive Solver examines all $20^4 = 160000$ cases, this result shows that 1729 is the smallest such number.
