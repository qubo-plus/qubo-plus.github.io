---
last_modified: 2026-10-10
layout: default
nav_exclude: true
title: "Integer Linear Programming"
nav_order: 74
lang: en
hreflang_alt: "ja/python/ILP"
hreflang_lang: "en"
---

# Integer Linear Programming (ILP)
With PyQBPP [native integer variables](NATIVE_INTEGER) and [`qbpp.cons()`](CONSTRAINTS), an **Integer Linear Programming (ILP)** problem can be written and solved as it is.
As an example, consider the following ILP:

$$
\begin{aligned}
\text{Maximize:} && 2x_0 +5x_1+5x_2\\
\text{Subject to:} && x_0 + 3 x_1 + x_2 &\leq 12 \\
                &&  x_0 + 2x_2 &\leq 5\\
                && x_1 + x_2 &\leq 4;
\end{aligned}
$$

## PyQBPP program
The following PyQBPP program formulates this ILP and solves it using the Easy Solver:
{% raw %}
```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=3, integer=(0, 5))
objective = 2 * x[0] + 5 * x[1] + 5 * x[2]
c1 = x[0] + 3 * x[1] + x[2]
c2 = x[0] + 2 * x[2]
c3 = x[1] + x[2]

f = (-objective + 100 * qbpp.cons(c1 <= 12)
     + 100 * qbpp.cons(c2 <= 5) + 100 * qbpp.cons(c3 <= 4))
f.simplify_as_binary()
solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)
print(f"x0 = {sol(x[0])}, x1 = {sol(x[1])}, x2 = {sol(x[2])}")
print(f"objective = {sol(objective)}")
print(f"c1 = {sol(c1)}, c2 = {sol(c2)}, c3 = {sol(c3)}")
print(f"violated constraints = {f.cons(sol)}")
```
{% endraw %}
In this program, `x` is an array of three native integer variables, each taking an integer value in the range $[0, 5]$.
`x` is not expanded into binary variables; the solver searches the integer values directly.
The objective function is `objective`, and the left-hand sides of the three constraints are `c1`, `c2`, and `c3`.
To maximize the objective, `f` negates `objective`.

Enclosing each constraint in `qbpp.cons()` makes the solver treat it as a constraint.
When a constraint is violated, the square of the violation multiplied by the weight `100` is added to the energy.
Choose the weight so that keeping the constraints pays off more than improving the objective by violating them.

The Easy Solver searches for a low-energy solution of `f` and returns it as `sol`.
`f.cons(sol)` is the number of constraints that `sol` violates.
The program prints the following output:
```
x0 = 2, x1 = 3, x2 = 1
objective = 24
c1 = 12, c2 = 4, c3 = 4
violated constraints = 0
```
We obtain a solution with the objective value 24 that satisfies all the constraints.

Because this model is linear, it can also be passed to an [MILP solver](MILP_SOLVERS) as an ILP, as in `qbpp.ScipSolver(f, ilp=True)`.
For the approach that represents integers with binary variables and writes the constraints as penalty expressions, see [Integer Variables](INTEGER).
