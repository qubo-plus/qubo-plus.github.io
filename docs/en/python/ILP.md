---
layout: default
nav_exclude: true
title: "Integer Linear Programming"
nav_order: 74
lang: en
hreflang_alt: "ja/python/ILP"
hreflang_lang: "en"
---

# Integer Linear Programming (ILP)
**Integer Linear Programming (ILP)** can be converted into a QUBO expression using PyQBPP.
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
The following PyQBPP program formulates this ILP as a QUBO expression and solves it using the Easy Solver:
{% raw %}
```python
import pyqbpp as qbpp

x = qbpp.var("x", shape=3, between=(0, 5))
objective = 2 * x[0] + 5 * x[1] + 5 * x[2]
c1 = qbpp.constrain(x[0] + 3 * x[1] + x[2], between=(0, 12))
c2 = qbpp.constrain(x[0] + 2 * x[2], between=(0, 5))
c3 = qbpp.constrain(x[1] + x[2], between=(0, 4))

f = -objective + 100 * (c1 + c2 + c3)
f.simplify_as_binary()
solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1.0)
print(f"x0 = {sol(x[0])}, x1 = {sol(x[1])}, x2 = {sol(x[2])}")
print(f"objective = {sol(objective)}")
print(f"c1 = {sol(c1.body)}, c2 = {sol(c2.body)}, c3 = {sol(c3.body)}")
```
{% endraw %}
In this program, `x` is a vector of three integer variables, each taking an integer value in the range $[0, 5]$.
The objective function and the three constraints are represented by `objective`, `c1`, `c2`, and `c3`, respectively.
They are combined into a single QUBO expression `f`, where the penalty constant `100` is used to enforce the constraints.

The Easy Solver searches for a low-energy solution of `f` and returns it as `sol`.
The obtained solution and the values of `objective`, `c1.body`, `c2.body`, and `c3.body` are printed as follows:
```
x0 = 2, x1 = 3, x2 = 1
objective = 24
c1 = 12, c2 = 4, c3 = 4
```
We observe that an obtained solution with the objective 24 satisfies all constraints.
