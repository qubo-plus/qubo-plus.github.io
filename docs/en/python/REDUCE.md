---
layout: default
nav_exclude: true
title: "Reducing HUBO to QUBO"
nav_order: 18
lang: en
hreflang_alt: "ja/python/REDUCE"
hreflang_lang: "ja"
---

# Reducing HUBO to QUBO

A **HUBO** (High-order Unconstrained Binary Optimization) expression may contain
terms of degree three or higher, whereas a **QUBO** (Quadratic Unconstrained
Binary Optimization) expression is restricted to degree at most two.

The native solvers bundled with PyQBPP (`EasySolver`, `ExhaustiveSolver`,
`ABS3Solver`) accept HUBO directly, so they need no conversion. However, many
external backends — physical annealers and QUBO-only optimizers such as Gurobi,
SCIP, and D-Wave — accept **only** quadratic models. For these, a HUBO must
first be rewritten as an equivalent QUBO.

The **`reduce()`** function performs this conversion: it rewrites every term of
degree greater than two as a degree-at-most-two expression by introducing fresh
**auxiliary binary variables**.

## The `reduce()` function

`reduce()` is available as a global function (non-destructive) and as an
in-place method:

- **`qbpp.reduce(f)`** returns a new degree-≤2 expression equivalent to `f`.
- **`f.reduce()`** updates `f` in place and returns it.
- **`qbpp.reduce(a)`** also accepts an array of expressions (element-wise).

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
f = a * b * c          # a cubic (degree-3) HUBO term
g = qbpp.reduce(f)     # an equivalent QUBO
print("f =", f)
print("g =", g)
print("max_degree =", g.max_degree)
```

This program produces:

```
f = a*b*c
g = {r0} +a*b +a*c -a*{r0} +b*c -b*{r0} -c*{r0}
max_degree = 2
```

The cubic term `a*b*c` becomes a quadratic expression. `{r0}` is a fresh
auxiliary binary variable; `reduce()` auto-names auxiliary variables with the
brace form `{r0}`, `{r1}`, … so they never clash with user variables.

## Equivalence guarantee

`reduce()` preserves the optimal value. For every assignment of the **original**
variables `x`, the minimum of the reduced expression over the **auxiliary**
variables equals the value of the original HUBO:

$$
f(x) = \min_{\text{aux}} g(x, \text{aux})
$$

Consequently, the global minimum of `g` (over the original and auxiliary
variables together) equals the global minimum of `f`, and a minimizer of `g`,
restricted to the original variables, is a minimizer of `f`. This is what makes
it safe to hand `reduce(f)` to a QUBO-only backend and read the answer back on
the original variables.

## How the reduction works

`reduce()` rewrites each high-degree term independently. Consider a single term
$c\,x_1 x_2 \cdots x_d$ of degree $d$, and let $S = x_1 + x_2 + \cdots + x_d$ be
the number of its variables that are 1.

### Positive coefficient ($c > 0$) — Ishikawa rule

An **auxiliary integer** $a \in [0, d-2]$ is introduced (represented internally
by about $\lceil \log_2 (d-1) \rceil$ binary variables) and the term is rewritten as

$$
c\,x_1 x_2 \cdots x_d \;=\; \frac{c\,(S-a)(S-a-1)}{2}.
$$

The quantity $\tfrac{(S-a)(S-a-1)}{2} = \binom{S-a}{2}$ is **0** when
$S-a \in \lbrace 0, 1\rbrace$ and strictly positive otherwise. Minimizing over
$a$ therefore reproduces the product:

- If every variable is 1 ($S = d$), the auxiliary integer can reach at most
  $a = d-2$, giving $S-a = 2$ and value $\binom{2}{2} = 1$ — equal to the product.
- If some variable is 0 ($S < d$), the auxiliary integer can take $a = S$ or
  $a = S-1$, giving $\binom{0}{2} = \binom{1}{2} = 0$ — equal to the product.

The upper bound $d-2$ (the auxiliary integer cannot reach $d-1$ or $d$) is
exactly what forces the value 1 when all variables are 1.

For the cubic example above ($d = 3$), the auxiliary integer is a single binary
variable `{r0}` (range $[0,1]$). Reading the reduced expression `g` printed
above, minimizing over `{r0}` reproduces $a\,b\,c$ for every assignment:

| number of 1s in $(a,b,c)$ | $a\,b\,c$ | $g$ at `{r0}`=0 | $g$ at `{r0}`=1 | $\min$ over `{r0}` |
|:---:|:---:|:---:|:---:|:---:|
| 0 | 0 | 0 | 1 | **0** |
| 1 | 0 | 0 | 0 | **0** |
| 2 | 0 | 1 | 0 | **0** |
| 3 | 1 | 3 | 1 | **1** |

The auxiliary variable is "free" to the optimizer: it settles to whichever value
minimizes the energy, and at that value the reduced term equals the original
product.

### Negative coefficient ($c < 0$) — Freedman rule

A negative term needs only a **single** auxiliary binary variable $w$:

$$
c\,x_1 x_2 \cdots x_d \;=\; c\,w\,\bigl(S - (d-1)\bigr).
$$

Since $c < 0$, minimizing means maximizing $|c|\,w\,(S-(d-1))$. When every
variable is 1, $S-(d-1) = 1$ and choosing $w = 1$ yields $c$ — equal to the
product. Otherwise $S-(d-1) \le 0$, so $w = 0$ yields 0 — again equal to the
product.

### Number of auxiliary variables

`reduce()` favours **few** auxiliary variables:

| term | rule | auxiliary binary variables |
|---|---|---|
| positive, degree $d$ | Ishikawa | $\approx \lceil \log_2 (d-1) \rceil$ (1 for $d=3,4$; 2 for $d=5\text{–}8$; 3 for $d=9\text{–}16$) |
| negative, any degree | Freedman | exactly 1 |

## Negated literals

`reduce()` handles negated literals automatically — the reduced QUBO contains
positive literals only. For example, the degree-4 term `~a*b*c*d` is reduced to a
quadratic expression over positive literals plus one auxiliary variable:

```python
p = (~a) * b * c * d
q = qbpp.reduce(p)   # positive literals + one auxiliary variable
```

## In-place and array forms

`f.reduce()` reduces `f` in place. For an array of expressions, `qbpp.reduce(arr)`
(or `arr.reduce()`) reduces every element.
