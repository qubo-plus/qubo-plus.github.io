---
layout: default
nav_exclude: true
title: "QUBO Problem"
nav_order: 79
lang: en
hreflang_alt: "ja/python/QUBO"
hreflang_lang: "ja"
---

# QUBO Problem

A QUBO problem is often defined by the following expression $f$:

$$
f(X) = \sum_{i=0}^{n-1}\sum_{j=0}^{n-1}w_{i,j}\, x_i x_j
$$

Here, $X = (x_0, x_1, \ldots, x_{n-1})$ denotes $n$ binary variables, and $W = (w_{i,j})$ ($0 \leq i, j \leq n-1$) is an $n \times n$ matrix of coefficients.
In other words, the QUBO expression is defined by the matrix $W$.
When a QUBO expression is given in this form, PyQBPP can construct and solve it as follows:

```python
import pyqbpp as qbpp

w = [[1, -2, 1], [-4, 3, 2], [4, 2, -1]]
x = qbpp.var("x", shape=3)
f = qbpp.expr()
for i in range(3):
    for j in range(3):
        f += w[i][j] * x[i] * x[j]
f = qbpp.simplify_as_binary(f)
print("f =", f)

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=1)
print("sol =", sol)
```

This program demonstrates an example with $n = 3$.
A $3 \times 3$ list `w` is defined, and the expression `f` is constructed from it.
After applying `simplify_as_binary()` to simplify the expression using the binary variable rule ($x_i^2 = x_i$), the EasySolver searches for the optimal solution.
Running this program produces the following output:

{% raw %}
```
f = x[0] +3*x[1] -x[2] -6*x[0]*x[1] +5*x[0]*x[2] +4*x[1]*x[2]
sol = Sol(energy=-2, {x[0]: 1, x[1]: 1, x[2]: 0})
```
{% endraw %}
