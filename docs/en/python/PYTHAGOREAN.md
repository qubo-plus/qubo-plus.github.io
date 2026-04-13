---
layout: default
nav_exclude: true
title: "Pythagorean Triples"
nav_order: 40
lang: en
hreflang_alt: "ja/python/PYTHAGOREAN"
hreflang_lang: "ja"
---

# Pythagorean Triples

Three integers $x$, $y$, and $z$ are **Pythagorean triples** if they satisfy

$$
\begin{aligned}
x^2+y^2&=z^2
\end{aligned}
$$

To avoid duplicates, we assume $x<y$.

## PyQBPP program for listing Pythagorean Triples
The following program lists Pythagorean triples with $x\leq 16$, $y\leq 16$, and $z\leq 16$:
```python
import pyqbpp as qbpp

x = qbpp.var("x", between=(1, 16))
y = qbpp.var("y", between=(1, 16))
z = qbpp.var("z", between=(1, 16))
f = qbpp.constrain(x * x + y * y - z * z, equal=0)
c = qbpp.constrain(y - x, between=(1, +qbpp.inf))
g = f + c
g.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(g)
result = solver.search(best_energy_sols=0)

seen = set()
for sol in result.sols:
    key = (sol(x), sol(y), sol(z))
    if key not in seen:
        seen.add(key)
        print(f"x={key[0]}, y={key[1]}, z={key[2]}, f={sol(f.body)}, c={sol(c.body)}")
```
In this program, we define integer variables `x`, `y`, and `z` with ranges from 1 to 16.
We then create two constraint expressions:
- `f` for $x^2+y^2-z^2=0$, and
- `c` for $x+1\leq y$.

They are combined into `g`.
The expression `g` attains its minimum value 0 when all constraints are satisfied.

An Exhaustive Solver object `solver` is created for `g`.
The call to `search_optimal_solutions()` returns a list of all optimal solutions.

Because integer variables are encoded by multiple binary variables, the same
$(x,y,z)$ assignment may appear multiple times.
Therefore, we use a `set` to remove duplicates before printing.

This program produces the following output:
```
x=3, y=4, z=5, f=0, c=1
x=5, y=12, z=13, f=0, c=7
x=6, y=8, z=10, f=0, c=2
x=9, y=12, z=15, f=0, c=3
```

### Comparison with C++ QUBO++

<table>
<thead>
<tr><th>C++ QUBO++</th><th>PyQBPP</th></tr>
</thead>
<tbody>
<tr><td><code>1 &lt;= qbpp::var_int("x") &lt;= 16</code></td><td><code>qbpp.var("x", between=(1, 16))</code></td></tr>
<tr><td><code>1 &lt;= y - x &lt;= +qbpp::inf</code></td><td><code>qbpp.constrain(y - x, between=(1, +qbpp.inf))</code></td></tr>
<tr><td><code>sol(x)</code></td><td><code>sol(x)</code></td></tr>
<tr><td><code>sol(*f)</code></td><td><code>sol(f.body)</code></td></tr>
</tbody>
</table>
