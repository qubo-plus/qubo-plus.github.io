---
layout: default
nav_exclude: true
title: "Comparison Constraints"
nav_order: 14
lang: en
hreflang_alt: "ja/python/COMPARISON"
hreflang_lang: "ja"
---

# Comparison Constraints
PyQBPP supports two types of constraints:

- **Equality constraint**: `qbpp.constrain(f, equal=n)`, where `f` is an expression and `n` is an integer.
- **Range constraint**: `qbpp.constrain(f, between=(l, u))`, where `f` is an expression and `l`, `u` ($l\leq u$) are integers.

Both return a constraint expression whose value **takes the minimum value 0 if and only if the corresponding constraint is satisfied**.

## Equality Constraint
The equality constraint `qbpp.constrain(f, equal=n)` creates the following expression:

$$
(f-n)^2
$$

This expression takes the minimum value 0 if and only if the equality $f=n$ is satisfied.

The following PyQBPP program searches for all solutions satisfying $a+2b+3c=3$ using the Exhaustive Solver:
{% raw %}
```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
f = qbpp.constrain(a + 2 * b + 3 * c, equal=3)
f.simplify_as_binary()
print("f =", f)
print("body =", f.body)

solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)
for sol in result.sols:
    print(f"a={sol(a)}, b={sol(b)}, c={sol(c)}, "
          f"f={sol(f)}, body={sol(f.body)}")
```
{% endraw %}
In this program, `f` internally holds two expressions:
- **`f`**: $(a+2b+3c-3)^2$, which attains the minimum value of 0 when the equality $a+2b+3c=3$ is satisfied.
- **`f.body`**: The left-hand side of the equality, $a+2b+3c$.

Using the Exhaustive Solver constructed for `f`, all optimal solutions are stored in **`result.sols`**.
By iterating over `result.sols`, all solutions and the values of `f` and `f.body` are printed as follows:
```
f = 9 -5*a -8*b -9*c +4*a*b +6*a*c +12*b*c
body = a +2*b +3*c
a=0, b=0, c=1, f=0, body=3
a=1, b=1, c=0, f=0, body=3
```
These results confirm that two optimal solutions attain `f = 0` and satisfy `body = 3`.

## Notes on Supported Equality Forms
PyQBPP supports the equality constraint only in the following form:
- **`qbpp.constrain(expression, equal=integer)`**

The form `expression1 == expression2` is not directly supported.
Instead of `expression1 == expression2`, you can rewrite the constraint as:
- **`qbpp.constrain(expression1 - expression2, equal=0)`**

which is fully supported.


## Range Constraint
The range constraint `qbpp.constrain(f, between=(l, u))` ($l\leq u$) creates an expression that attains the minimum value of 0 if and only if the constraint is satisfied.

We consider the following cases depending on the values of $l$ and $u$.
- **Case 1**: **$u=l$**
- **Case 2**: **$u=l+1$**
- **Case 3**: **$u=l+2$**
- **Case 4**: **$u\geq l+3$**

### Case 1: $u=l$
If $u=l$, the range constraint reduces to the equality constraint $f=l$,
which can be implemented directly using the equality constraint.

### Case 2: $u=l+1$
If $u=l+1$, the following expression is created:

$$
 (f-l)(f-u)
$$

Since there is no integer strictly between $l$ and $u$, this expression attains the minimum value of 0 if and only if
$f=l$ or $f=u$.

### Case 3: $u=l+2$
We introduce an **auxiliary binary variable** $a \in \lbrace 0,1\rbrace$
and use the following expression:

$$
\begin{aligned}
(f-l-a)(f-l-(a+1))
\end{aligned}
$$

This expression evaluates as follows for $f=l$, $l+1$, and $l+2$:

$$
\begin{aligned}
(f-l-a)(f-l-(a+1)) &= (-a)(-(a+1)) && \text{if } f=l \\
                   &= (1-a)(-a) && \text{if } f=l+1 \\
                   &=(2-a)(1-a)  && \text{if } f=l+2
\end{aligned}
$$

In all cases, the minimum value 0 is attainable by an appropriate choice of $a$.
Therefore, the expression takes the minimum value of 0 if $l\leq f\leq u$ is satisfied.

Let $g = f-l-a$.
Then we have,

$$
\begin{aligned}
(f-l-a)(f-l-(a+1)) &= g(g-1)
\end{aligned}
$$

which is always positive if $g\leq -1$ or $g\geq 2$.
Hence, the expression attains the minimum value of 0 if and only if $l\leq f\leq u$ is satisfied.

### Case 4: $u\geq l+3$
We introduce an auxiliary integer variable $a$ that takes integer values in the range $[l,u-1]$.
Such an integer variable can be defined using multiple binary variables, as described in [Integer Variables and Solving Simultaneous Equations](INTEGER).

The expression for this case is:

$$
\begin{aligned}
(f-a)(f-(a+1))
\end{aligned}
$$

Similarly to Case 3, we can show that this expression is always positive if $f$ is not in $[l,u]$.

Suppose that $f$ takes an integer value in the range $[l,u]$.
If we choose $a=f$, then

$$
\begin{aligned}
f-a &= 0 & {\rm if\,\,} f\in [l,u-1]\\
f-(a+1) &= 0& {\rm if\,\,} f\in [l+1,u]
\end{aligned}
$$

Thus, either $f-a=0$ or $f-(a+1)=0$ holds for any $f\in[l,u]$.
Therefore, $(f-a)(f-(a+1))$ attains the minimum value of 0
if and only if $l\leq f\leq u$.


### Reducing the Number of Binary Variables
In [Integer Variables and Solving Simultaneous Equations](INTEGER),
an integer variable $a\in [l,u]$ is represented using
$n$ binary variables $x_0, x_1, \ldots, x_{n-1}$ as follows:

$$
\begin{aligned}
a & = l+2^0x_0+2^1x_1+\cdots +2^{n-2}x_{n-2}+dx_{n-1}
\end{aligned}
$$

This expression can represent all integers from $l$ to $l+2^{n-1}+d-1$.
Thus, we can choose $n$ and $d$ such that

$$
\begin{aligned}
u-1&=l+2^{n-1}+d-1.
\end{aligned}
$$


For Case 4, PyQBPP instead uses the following linear expression with $n-1$ binary variables $x_1, \ldots, x_{n-1}$:

$$
\begin{aligned}
a &= l+2^1x_1+\cdots +2^{n-2}x_{n-2}+dx_{n-1}
\end{aligned}
$$

This expression represents integers from $l$ to $l+2^{n-1}+d-2$.
Accordingly, we select $n$ and $d$ so that

$$
\begin{aligned}
u-1&=l+2^{n-1}+d-2.
\end{aligned}
$$

We call such an integer variable $a$ a **unit-gap integer variable**.
Although some values in $[l,u]$ cannot be taken by $a$,
for any $k\in[l,u]$ that cannot be represented,
$k-1$ can be represented.
Therefore, either $a$ or $a+1$ can take any value in the range
$[l,u]$, which is sufficient for enforcing the range constraint.

### PyQBPP Program for the Four Cases
The following program demonstrates how the four cases are implemented in PyQBPP:
{% raw %}
```python
import pyqbpp as qbpp

f = qbpp.var("f")
f1 = qbpp.constrain(f, between=(1, 1))
f2 = qbpp.constrain(f, between=(1, 2))
f3 = qbpp.constrain(f, between=(1, 3))
f4 = qbpp.constrain(f, between=(1, 5))
f1.simplify()
f2.simplify()
f3.simplify()
f4.simplify()
print("f1 =", f1)
print("f2 =", f2)
print("f3 =", f3)
print("f4 =", f4)
```
{% endraw %}
This program produces the following output:
```
f1 = 1 -2*f +f*f
f2 = 2 -3*f +f*f
f3 = 2 -3*f +3*{s0} +f*f -2*f*{s0} +{s0}*{s0}
f4 = 2 -3*f +3*{s1}[0] +6*{s1}[1] +f*f -2*f*{s1}[0] -4*f*{s1}[1] +{s1}[0]*{s1}[0] +4*{s1}[0]*{s1}[1] +4*{s1}[1]*{s1}[1]
```
These outputs correspond to the following expressions:

$$
\begin{aligned}
f_1 &= (f-1)^2\\
f_2 &= (f-1)(f-2)\\
f_3 &= (f-x_0)(f-(x_0+1))\\
f_4 &= (f-(2x_{1,0}+x_{1,1}+1))(f-(2x_{1,0}+x_{1,1}+2))
\end{aligned}
$$

### PyQBPP Program Using the Range Constraint
The following program demonstrates the use of the range constraint in PyQBPP:
{% raw %}
```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
f = qbpp.constrain(4 * a + 9 * b + 15 * c, between=(5, 14))
f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)
for sol in result.sols:
    print(f"a={sol(a)}, b={sol(b)}, c={sol(c)}, "
          f"f={sol(f)}, body={sol(f.body)}, sol={sol}")
```
{% endraw %}
For three binary variables $a$, $b$, and $c$,
this program searches for solutions satisfying the constraint

$$
\begin{aligned}
5\leq 4a+9b+15c \leq 14
\end{aligned}
$$

This program produces output such as:
{% raw %}
```
a=0, b=1, c=0, f=0, body=9, sol=0:{{a,0},{b,1},{c,0},{{s0}[0],0},{{s0}[1],1},{{s0}[2],0}}
a=0, b=1, c=0, f=0, body=9, sol=0:{{a,0},{b,1},{c,0},{{s0}[0],1},{{s0}[1],0},{{s0}[2],1}}
a=1, b=1, c=0, f=0, body=13, sol=0:{{a,1},{b,1},{c,0},{{s0}[0],1},{{s0}[1],1},{{s0}[2],1}}
```
{% endraw %}

## Lower and Upper Bound Constraints
PyQBPP does not directly support the following **one-sided bound constraints** with standalone syntax.
Instead, PyQBPP supports them by setting one end of `between` to `None`:
- **Lower-bound constraint**: `between=(l, None)` → $l\leq f\leq +\infty$
- **Upper-bound constraint**: `between=(None, u)` → $-\infty \leq f\leq u$

Since the range constraint internally introduces auxiliary variables,
true infinite values cannot be represented explicitly.
Therefore, PyQBPP estimates **finite maximum and minimum values** of the expression
$f$ and substitutes them for $+\infty$ and $-\infty$, respectively.

For example, consider the expression

$$
\begin{aligned}
f=4a + 9 b + 11 c
\end{aligned}
$$

where $a$, $b$, and $c$ are binary variables.
The minimum and maximum possible values of $f$ are 0 and 24, respectively.
Thus, PyQBPP uses 0 and 24 as substitutes for $-\infty$ and $+\infty$
when constructing the corresponding range constraints.

> **NOTE**
> PyQBPP intentionally requires both lower and upper bounds to be specified in inequality constraints (using `None` explicitly for an unbounded side).
> This avoids ambiguity between **MIP-style interpretations** (e.g.,
> $f\leq u$ meaning $0\leq f\leq u$) and **QUBO-style interpretations** (e.g., $f\leq u$ meaning $-\infty\leq f\leq u$),
> which could otherwise lead to subtle modeling errors.

### PyQBPP Programs for Lower and Upper Bound Constraints
In PyQBPP, an infinite value is represented by `None` on the corresponding side of `between`.

The following program demonstrates **the lower-bound constraint**:
{% raw %}
```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
f = qbpp.constrain(4 * a + 9 * b + 11 * c, between=(14, None))
f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)
for sol in result.sols:
    print(f"a={sol(a)}, b={sol(b)}, c={sol(c)}, "
          f"f={sol(f)}, body={sol(f.body)}, sol={sol}")
```
{% endraw %}
In this program, the `None` in `between=(14, None)` represents a positive infinite value,
which is automatically replaced by 24.

This program produces output such as:
{% raw %}
```
a=0, b=1, c=1, f=0, body=20, sol=0:{{a,0},{b,1},{c,1},{{s0}[0],1},{{s0}[1],0},{{s0}[2],1}}
a=0, b=1, c=1, f=0, body=20, sol=0:{{a,0},{b,1},{c,1},{{s0}[0],1},{{s0}[1],1},{{s0}[2],0}}
a=1, b=0, c=1, f=0, body=15, sol=0:{{a,1},{b,0},{c,1},{{s0}[0],0},{{s0}[1],0},{{s0}[2],0}}
a=1, b=1, c=1, f=0, body=24, sol=0:{{a,1},{b,1},{c,1},{{s0}[0],1},{{s0}[1],1},{{s0}[2],1}}
```
{% endraw %}

The following program demonstrates **the upper-bound constraint**:
{% raw %}
```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
f = qbpp.constrain(4 * a + 9 * b + 11 * c, between=(None, 14))
f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)
for sol in result.sols:
    print(f"a={sol(a)}, b={sol(b)}, c={sol(c)}, "
          f"f={sol(f)}, body={sol(f.body)}, sol={sol}")
```
{% endraw %}
In this program, the `None` in `between=(None, 14)` represents a negative infinite value,
which is automatically replaced by 0.

This program produces output such as:
{% raw %}
```
a=0, b=0, c=0, f=0, body=0, sol=0:{{a,0},{b,0},{c,0},{{s0}[0],0},{{s0}[1],0},{{s0}[2],0}}
a=0, b=0, c=1, f=0, body=11, sol=0:{{a,0},{b,0},{c,1},{{s0}[0],0},{{s0}[1],1},{{s0}[2],1}}
a=0, b=1, c=0, f=0, body=9, sol=0:{{a,0},{b,1},{c,0},{{s0}[0],1},{{s0}[1],0},{{s0}[2],1}}
a=1, b=0, c=0, f=0, body=4, sol=0:{{a,1},{b,0},{c,0},{{s0}[0],0},{{s0}[1],1},{{s0}[2],0}}
a=1, b=1, c=0, f=0, body=13, sol=0:{{a,1},{b,1},{c,0},{{s0}[0],1},{{s0}[1],1},{{s0}[2],1}}
```
{% endraw %}
