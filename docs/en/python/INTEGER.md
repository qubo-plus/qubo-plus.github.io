---
layout: default
nav_exclude: true
title: "Integer Variables"
nav_order: 7
lang: en
hreflang_alt: "ja/python/INTEGER"
hreflang_lang: "ja"
---

# Integer Variables and Solving Simultaneous Equations

## Integer variables
PyQBPP supports **integer variables**, which are internally implemented using multiple binary variables.
A conventional binary encoding is used to represent integer values.
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

The following program demonstrates how integer variables are defined:
```python
import pyqbpp as qbpp

x = qbpp.var("x", between=(1, 8))
y = qbpp.var("y", between=(-10, 10))
print(f"x = {x} uses {x.var_count} variables.")
print(f"y = {y} uses {y.var_count} variables.")
```

An integer variable is defined using the **`between=`** keyword argument, which specifies the integer range that the variable can take.
The call **`qbpp.var("name", between=(min, max))`** creates a **`VarInt`** object with the given `name`, representing the linear expression encoded by binary variables.
The program outputs the following expressions:
```
x = 1 +x[0] +2*x[1] +4*x[2] uses 3 variables.
y = -10 +y[0] +2*y[1] +4*y[2] +8*y[3] +5*y[4] uses 5 variables.
```

> **WARNING**
> The number of binary variables required for an integer variable grows logarithmically with its range.
> When `max - min` is large, the QUBO size increases, so wide integer ranges should be avoided whenever possible.

## QUBO formulation for solving simultaneous equations
PyQBPP can solve systems of simultaneous equations by representing the variables as integer variables.
As an example, we construct a QUBO formulation for the following equations, whose solution is $x=4$ and $y=6$:

$$
\begin{aligned}
x + y = 10\\
2x+4y = 28
\end{aligned}
$$

To solve these equations, we define integer variables $x$ and $y$ in the range $[0,10]$, each encoded by four binary variables:

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

## PyQBPP program
The following program constructs the QUBO expression $h(x,y)$, solves it, and decodes the resulting values of
$x$ and $y$:
{% raw %}
```python
import pyqbpp as qbpp

x = qbpp.var("x", between=(0, 10))
y = qbpp.var("y", between=(0, 10))

f = qbpp.constrain(x + y, equal=10)
g = qbpp.constrain(2 * x + 4 * y, equal=28)
h = f + g                  # h is Expr (ExprExpr decays to penalty)
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

> **NOTE — `VarInt` and `ExprExpr` are immutable**
> `qbpp.var(..., between=...)` produces a
> `VarInt`, and any constraint expression like `qbpp.constrain(x + y, equal=10)`
> produces an `ExprExpr`. **Both types do not support in-place modification.**
> Operations such as `vi += 1`, `ee.replace(ml)`, `ee.sqr()` raise `TypeError`
> (only `ee.simplify_as_binary()` is supported in-place and is applied to both
> the penalty and the body).
>
> When you want to use a `VarInt` or `ExprExpr` in further arithmetic, mix it
> into a normal `Expr` expression — both types implicitly decay to `Expr`
> (the penalty for `ExprExpr`, the binary expansion for `VarInt`). The result
> is an `Expr` and can be mutated freely:
>
> ```python
> h = f + g                    # h is Expr (f, g are ExprExpr, both decay)
> h.simplify_as_binary()       # OK — Expr supports in-place
>
> e  = qbpp.sqr(vi - 3)                    # VarInt → Expr via subtraction → sqr
> e2 = qbpp.simplify_as_binary(ee)         # free-function form (returns a new Expr)
> e3 = qbpp.replace(f, {x: 1})             # ExprExpr replace via free function (returns a new Expr)
> ```
>
> The original `ExprExpr` constraints `f` and `g` are still intact so you can
> inspect them via `f.body` / `g.body` after solving.
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
sol = 0:{{x[0],0},{x[1],1},{x[2],1},{x[3],0},{y[0],0},{y[1],0},{y[2],1},{y[3],0}}
x = x[0] +2*x[1] +4*x[2] +3*x[3] = 6
y = y[0] +2*y[1] +4*y[2] +3*y[3] = 4
f = 100 -19*x[0] -36*x[1] -64*x[2] -51*x[3] -19*y[0] -36*y[1] -64*y[2] -51*y[3] +4*x[0]*x[1] +8*x[0]*x[2] +6*x[0]*x[3] +2*x[0]*y[0] +4*x[0]*y[1] +8*x[0]*y[2] +6*x[0]*y[3] +16*x[1]*x[2] +12*x[1]*x[3] +4*x[1]*y[0] +8*x[1]*y[1] +16*x[1]*y[2] +12*x[1]*y[3] +24*x[2]*x[3] +8*x[2]*y[0] +16*x[2]*y[1] +32*x[2]*y[2] +24*x[2]*y[3] +6*x[3]*y[0] +12*x[3]*y[1] +24*x[3]*y[2] +18*x[3]*y[3] +4*y[0]*y[1] +8*y[0]*y[2] +6*y[0]*y[3] +16*y[1]*y[2] +12*y[1]*y[3] +24*y[2]*y[3] = 0
g = 784 -108*x[0] -208*x[1] -384*x[2] -300*x[3] -208*y[0] -384*y[1] -640*y[2] -528*y[3] +16*x[0]*x[1] +32*x[0]*x[2] +24*x[0]*x[3] +16*x[0]*y[0] +32*x[0]*y[1] +64*x[0]*y[2] +48*x[0]*y[3] +64*x[1]*x[2] +48*x[1]*x[3] +32*x[1]*y[0] +64*x[1]*y[1] +128*x[1]*y[2] +96*x[1]*y[3] +96*x[2]*x[3] +64*x[2]*y[0] +128*x[2]*y[1] +256*x[2]*y[2] +192*x[2]*y[3] +48*x[3]*y[0] +96*x[3]*y[1] +192*x[3]*y[2] +144*x[3]*y[3] +64*y[0]*y[1] +128*y[0]*y[2] +96*y[0]*y[3] +256*y[1]*y[2] +192*y[1]*y[3] +384*y[2]*y[3] = 0
f.body = x[0] +2*x[1] +4*x[2] +3*x[3] +y[0] +2*y[1] +4*y[2] +3*y[3] = 10
g.body = 2*x[0] +4*x[1] +8*x[2] +6*x[3] +4*y[0] +8*y[1] +16*y[2] +12*y[3] = 28
```
{% endraw %}

Thus, we can confirm that the values of `x`, `y`, and the constraint expressions `f`, `g`, `f.body`, and `g.body` are consistent with the solution.

> **WARNING**
> PyQBPP supports the `qbpp.constrain(expr, equal=n)` form only when `expr` is an expression and `n` is an integer.
> Equality constraints of the form `expression == expression` are not supported directly; use `qbpp.constrain(expr1 - expr2, equal=0)` instead.
> Details are explained in [**Comparison Operators**](COMPARISON).
