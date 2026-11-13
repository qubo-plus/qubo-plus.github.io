---
last_modified: 2026-10-30
layout: default
nav_exclude: true
title: "Binary-Encoded Integer Variables"
nav_order: 52
lang: en
hreflang_alt: "ja/python/BINARY_INTEGER"
hreflang_lang: "ja"
---

# Binary-Encoded Integer Variables

[Integer variables](INTEGER) (`integer=`) are handled as integer values by the solvers bundled with QUBO++.
On the other hand, all variables of a QUBO or HUBO must be binary variables,
so a model passed to an external QUBO solver that only handles binary variables
must represent integers by multiple binary variables.
This page explains this representation (binary encoding) and
two ways to obtain it in PyQBPP:

- Represent integers by binary variables from the start, using binary-encoded integer variables **`qbpp.var("name", between=(lower, upper))`**
- Convert a model written with integer variables into a model of binary variables with **`qbpp.binarize()`**

## Binary encoding
Suppose that we have $n$ binary variables $x_0, x_1, \ldots, x_{n-1}$.
These variables can represent all integers from $0$ to $2^n-1$ using the following linear expression:

$$
\begin{aligned}
2^0x_0+2^1x_1+\cdots 2^{n-1}x_{n-1}
\end{aligned}
$$

We can introduce a constant offset $l$ and replace the coefficient of $x_{n-1}$ with an arbitrary value $d$ as follows:

$$
\begin{aligned}
l+2^0x_0+2^1x_1+\cdots +2^{n-2}x_{n-2}+dx_{n-1}
\end{aligned}
$$

This expression can represent all integers from $l$ to $l+2^{n-1}+d-1$.
Based on this encoding, a variable whose integer range is $[l,u]$ can be constructed by choosing appropriate values of $n$ and $d$ ($1\leq d\leq 2^{n-1}$) to satisfy

$$
\begin{aligned}
u &= l+2^{n-1}+d-1
\end{aligned}
$$


## Declaring with `between=`

The following program demonstrates how binary-encoded integer variables are defined:
```python
import pyqbpp as qbpp

x = qbpp.var("x", between=(1, 8))
y = qbpp.var("y", between=(-10, 10))
print(f"x = {x} uses {x.var_count} variables.")
print(f"y = {y} uses {y.var_count} variables.")
```

A binary-encoded integer variable is defined using the **`between=`** keyword argument instead of the `integer=` of [integer variables](INTEGER), which specifies the integer range that the variable can take.
The call **`qbpp.var("name", between=(min, max))`** creates an integer-variable **`Expr`** object with the given `name`, representing the linear expression encoded by binary variables.
The program outputs the following expressions:
```
x = 1 +x[0] +2*x[1] +4*x[2] uses 3 variables.
y = -10 +y[0] +2*y[1] +4*y[2] +8*y[3] +5*y[4] uses 5 variables.
```

> **WARNING**
> The number of binary variables required for an integer variable grows logarithmically with its range.
> When `max - min` is large, the QUBO size increases, so wide integer ranges should be avoided whenever possible.

## Solving simultaneous equations

We solve the same simultaneous equations as in [Integer Variables and Solving Simultaneous Equations](INTEGER)
(the solution is $x=6$, $y=4$), this time with binary-encoded integer variables:

$$
\begin{aligned}
x + y = 10\\
2x+4y = 28
\end{aligned}
$$

The integer variables $x$ and $y$ in the range $[0,10]$ are each encoded by four binary variables:

$$
\begin{aligned}
x = x_0 +2x_1 +4x_2 +3x_3\\
y = y_0 +2y_1 +4y_2 +3y_3
\end{aligned}
$$

Each of the following penalty expressions takes the minimum value 0 if and only if the corresponding equation is satisfied:

$$
\begin{aligned}
f(x,y) &= (x+y-10)^2\\
&=(x_0 +2x_1 +4x_2 +3x_3+y_0 +2y_1 +4y_2 +3y_3-10)^2\\
g(x,y) &= (2x+4y -28)^2\\
 &= (2\cdot(x_0 +2x_1 +4x_2 +3x_3)+4\cdot( y_0 +2y_1 +4y_2 +3y_3)-28)^2
\end{aligned}
$$

Thus, the combined expression

$$
\begin{aligned}
h(x,y) &= f(x,y) +g(x,y)
\end{aligned}
$$

achieves its minimum value 0 precisely when both equations are satisfied simultaneously.

The following program constructs the QUBO expression $h(x,y)$, solves it, and decodes the resulting values of $x$ and $y$:
{% raw %}
```python
import pyqbpp as qbpp

x = qbpp.var("x", between=(0, 10))
y = qbpp.var("y", between=(0, 10))

f = qbpp.constrain(x + y, equal=10)
g = qbpp.constrain(2 * x + 4 * y, equal=28)
h = f + g
h.simplify_as_binary()

solver = qbpp.EasySolver(h)
sol = solver.search(target_energy=0)

print("sol =", sol)
print("x =", x, "=", sol(x))
print("y =", y, "=", sol(y))
print("f =", f, "=", sol(f))
print("g =", g, "=", sol(g))
print("f.body =", f.body, "=", sol(f.body))
print("g.body =", g.body, "=", sol(g.body))
```

{% endraw %}
First, integer variables **`x`** and **`y`** are defined with the range $[0,10]$.
An expression **`f`** is created to represent the constraint **`qbpp.constrain(x + y, equal=10)`**.
Internally, this is equivalent to the QUBO expression `qbpp.sqr(x + y - 10)`.
Similarly, **`g`** represents the constraint **`qbpp.constrain(2 * x + 4 * y, equal=28)`**.
The combined expression **`h = f + g`** encodes both equations.
An Easy Solver instance is created with `h`, and the target energy is set to `0`, since the optimal solution satisfies all constraints.
Calling `search()` returns a solution object `sol` that stores the optimal assignment of all binary variables.
Finally, the program prints the values of `sol`, `sol(x)`, `sol(y)`, `sol(f)`, `sol(g)`, `sol(f.body)`, and `sol(g.body)`.
Here,
- **`f`**: The penalty expression enforcing `x + y = 10`. Thus `sol(f) = 0` if and only if the equation is satisfied.
- **`f.body`**: The linear expression `x + y`. Thus `sol(f.body)` returns the actual evaluated value of `x + y`.

The same applies to **`g`** and **`g.body`**.

The program outputs the following result:

{% raw %}
```
sol = Sol(energy=0, {x[0]: 0, x[1]: 1, x[2]: 1, x[3]: 0, y[0]: 0, y[1]: 0, y[2]: 1, y[3]: 0})
x = x[0] +2*x[1] +4*x[2] +3*x[3] = 6
y = y[0] +2*y[1] +4*y[2] +3*y[3] = 4
f = 100 -19*x[0] -36*x[1] -64*x[2] -51*x[3] -19*y[0] -36*y[1] -64*y[2] -51*y[3] +4*x[0]*x[1] +8*x[0]*x[2] +6*x[0]*x[3] +2*x[0]*y[0] +4*x[0]*y[1] +8*x[0]*y[2] +6*x[0]*y[3] +16*x[1]*x[2] +12*x[1]*x[3] +4*x[1]*y[0] +8*x[1]*y[1] +16*x[1]*y[2] +12*x[1]*y[3] +24*x[2]*x[3] +8*x[2]*y[0] +16*x[2]*y[1] +32*x[2]*y[2] +24*x[2]*y[3] +6*x[3]*y[0] +12*x[3]*y[1] +24*x[3]*y[2] +18*x[3]*y[3] +4*y[0]*y[1] +8*y[0]*y[2] +6*y[0]*y[3] +16*y[1]*y[2] +12*y[1]*y[3] +24*y[2]*y[3] = 0
g = 784 -108*x[0] -208*x[1] -384*x[2] -300*x[3] -208*y[0] -384*y[1] -640*y[2] -528*y[3] +16*x[0]*x[1] +32*x[0]*x[2] +24*x[0]*x[3] +16*x[0]*y[0] +32*x[0]*y[1] +64*x[0]*y[2] +48*x[0]*y[3] +64*x[1]*x[2] +48*x[1]*x[3] +32*x[1]*y[0] +64*x[1]*y[1] +128*x[1]*y[2] +96*x[1]*y[3] +96*x[2]*x[3] +64*x[2]*y[0] +128*x[2]*y[1] +256*x[2]*y[2] +192*x[2]*y[3] +48*x[3]*y[0] +96*x[3]*y[1] +192*x[3]*y[2] +144*x[3]*y[3] +64*y[0]*y[1] +128*y[0]*y[2] +96*y[0]*y[3] +256*y[1]*y[2] +192*y[1]*y[3] +384*y[2]*y[3] = 0
f.body = x[0] +2*x[1] +4*x[2] +3*x[3] +y[0] +2*y[1] +4*y[2] +3*y[3] = 10
g.body = 2*x[0] +4*x[1] +8*x[2] +6*x[3] +4*y[0] +8*y[1] +16*y[2] +12*y[3] = 28
```
{% endraw %}

Thus, we can confirm that the values of `x`, `y`, and the constraint expressions `f`, `g`, `f.body`, and `g.body` are consistent with the solution.
We can also see that, compared with the expression $5x^2+18xy+17y^2-132x-244y+884$ (6 terms) obtained with [integer variables](INTEGER),
the penalty expressions of binary variables have far more terms.

> **WARNING**
> In `qbpp.constrain(expr, equal=n)`, `n` must be an integer (passing an expression raises `TypeError`).
> The operator form `expression == expression` also raises `TypeError` (`x == y` between two variables tests whether they are the same variable; it is not a constraint). For equality between expressions,
> take the difference and write `qbpp.constrain(expr1 - expr2, equal=0)` (e.g. `qbpp.constrain(x + y - 2*z, equal=0)`).
> The penalty is `sqr(expr1 - expr2)` and the body is `expr1 - expr2`.
> Details are explained in [**Comparison Constraints**](COMPARISON).

## Products and HUBO expressions

The product of binary-encoded integer variables is a quadratic expression of binary variables.
For example, if the expression $(pq-35)^2$ of [Factorization](FACTORIZATION) is written with `between=`,
$pq$ is quadratic, so its square is quartic, that is, a HUBO expression:
```python
import pyqbpp as qbpp

p = qbpp.var("p", between=(2, 5))
q = qbpp.var("q", between=(6, 17))

f = (p * q == 35)
f.simplify_as_binary()
print("f =", f)
print("f.body =", f.body)

solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=0)

print("sol =", sol)
print("p =", sol(p))
print("q =", sol(q))
print("f(sol) =", f(sol))
print("f.body(sol) =", f.body(sol))
```

In this program, `qbpp.var("p", between=(2, 5))` creates an integer variable $p$ whose value ranges over $\lbrace2, 3, 4, 5\rbrace$, internally represented as a linear combination of binary variables `p[0]`, `p[1]`. Similarly, `q` ranging over $\lbrace6, 7, \dots, 17\rbrace$ is expanded into binary variables `q[0]`, `q[1]`, `q[2]`, `q[3]`. The expression `(p * q == 35)` is automatically converted into `sqr(p * q - 35)`, which achieves an energy value of 0 when the equality is satisfied. `f` is a constraint expression that holds both the expanded penalty `sqr(p * q - 35)` and the original expression `p * q`. `f` itself represents the expression `sqr(p * q - 35)`, while `f.body` returns the original expression `p * q`. `f.simplify_as_binary()` simplifies both `f` itself (the penalty) and `f.body` (the original expression) at the same time. Because the integer variables are linear in the underlying binary variables, their product $pq$ is quadratic and the squared penalty $f(p,q)$ is quartic.

The output of this program is as follows:
```
f = 529 -240*p[0] -408*p[1] -88*q[0] -168*q[1] -304*q[2] -304*q[3] +144*p[0]*p[1] -5*p[0]*q[0] +40*p[0]*q[2] +40*p[0]*q[3] +16*p[1]*q[0] +56*p[1]*q[1] +208*p[1]*q[2] +208*p[1]*q[3] +16*q[0]*q[1] +32*q[0]*q[2] +32*q[0]*q[3] +64*q[1]*q[2] +64*q[1]*q[3] +128*q[2]*q[3] +52*p[0]*p[1]*q[0] +112*p[0]*p[1]*q[1] +256*p[0]*p[1]*q[2] +256*p[0]*p[1]*q[3] +20*p[0]*q[0]*q[1] +40*p[0]*q[0]*q[2] +40*p[0]*q[0]*q[3] +80*p[0]*q[1]*q[2] +80*p[0]*q[1]*q[3] +160*p[0]*q[2]*q[3] +48*p[1]*q[0]*q[1] +96*p[1]*q[0]*q[2] +96*p[1]*q[0]*q[3] +192*p[1]*q[1]*q[2] +192*p[1]*q[1]*q[3] +384*p[1]*q[2]*q[3] +16*p[0]*p[1]*q[0]*q[1] +32*p[0]*p[1]*q[0]*q[2] +32*p[0]*p[1]*q[0]*q[3] +64*p[0]*p[1]*q[1]*q[2] +64*p[0]*p[1]*q[1]*q[3] +128*p[0]*p[1]*q[2]*q[3]
f.body = 12 +6*p[0] +12*p[1] +2*q[0] +4*q[1] +8*q[2] +8*q[3] +p[0]*q[0] +2*p[0]*q[1] +4*p[0]*q[2] +4*p[0]*q[3] +2*p[1]*q[0] +4*p[1]*q[1] +8*p[1]*q[2] +8*p[1]*q[3]
sol = Sol(energy=0, {p[0]: 1, p[1]: 1, q[0]: 1, q[1]: 0, q[2]: 0, q[3]: 0})
p = 5
q = 7
f(sol) = 0
f.body(sol) = 35
```
From the output, we can observe that the expression `f` contains quartic terms, confirming that it is a HUBO expression.
To pass it to an external QUBO solver, further convert it into a quadratic expression as described in [Reducing HUBO to QUBO](REDUCE).

## Converting with `binarize()`

A model written with [integer variables](INTEGER) (`integer=`) can be converted into
a model of binary-encoded integer variables with **`qbpp.binarize()`**:

```python
import pyqbpp as qbpp

x = qbpp.var("x", integer=(0, 10))
f = x * x - 4 * x
g = qbpp.binarize(f)
g.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(g)
sol = solver.search()
print(f"minimum = {sol.energy}")
print(f"x = {sol(x)}")
```

The output of the program is as follows:

```
minimum = -4
x = 2
```

The solution of a `binarize()`d model still answers `sol(x)` for the
original integer variable (the value is recovered from the bits that replaced it).
To pass constraints written with `qbpp.cons()` to an external QUBO solver as well,
expand them into penalty expressions with [`qbpp.expand_cons()`](CONSTRAINTS#expanding-into-the-classic-penalty-form).

## Which representation to choose

- For models solved by the solvers bundled with QUBO++ or by MIP solvers,
  use [integer variables](INTEGER) (`integer=`).
- For models passed to external QUBO solvers that only handle binary variables,
  write them with `between=`, or write them with `integer=` and convert them with `qbpp.binarize()`.
