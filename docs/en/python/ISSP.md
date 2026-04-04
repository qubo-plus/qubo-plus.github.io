---
layout: default
nav_exclude: true
title: "Interval Subset Sum"
nav_order: 75
lang: en
hreflang_alt: "ja/python/ISSP"
hreflang_lang: "ja"
---

# Interval Subset Sum Problem (ISSP)
The **Interval Subset Sum Problem (ISSP)** is a generalization of the **Subset Sum Problem**.
Given $n$ integer **intervals $[l_i, u_i]$** $(0\leq i\leq n-1)$ and an **upper bound $T$**, the goal is to choose an integer value

$$
\begin{aligned}
v_i &\in \lbrace 0\rbrace \cup [l_i, u_i] && (i = 0,1,\dots,n-1),
\end{aligned}
$$

so as to satisfy the constraint

$$
\begin{aligned}
 \sum_{i=0}^{n-1} v_i \leq T,
\end{aligned}
$$

and maximize the objective:

$$
\begin{aligned}
 \sum_{i=0}^{n-1} v_i.
\end{aligned}
$$

## HUBO formulation of the ISSP
An integer variable can be represented by multiple binary variables using a binary encoding.
In PyQBPP, such integer variables can be defined easily using `var_int`.

Let $v_i$ $(0\leq i\leq n-1)$ be an integer variable that can take a value in $[l_i, u_i]$.
We also introduce a binary variable $s_i$  $(0\leq i\leq n-1)$ such that $s_i=1$ if and only if
interval $i$ is selected.

To model ISSP, we use the product $s_i v_i$ as the selected value:

$$
\begin{aligned}
s_iv_i &= 0 && \text{if } s_i= 0\\
       &\in [l_i,u_i] && \text{if } s_i= 1
\end{aligned}
$$

Let

$$
\begin{aligned}
\text{sum} &= \sum_{i=0}^{n-1} s_i v_i .
\end{aligned}
$$

In PyQBPP, we impose this inequality constraint via a penalty term:

$$
\begin{aligned}
 \text{constraint} &= \sum_{i=0}^{n-1} \bigr(0\leq s_iv_i \leq T\bigl) \\
                &= (T-\sum_{i=0}^{n-1} s_iv_i)^2
\end{aligned}
$$

Since $s_i v_i$ is quadratic in binary variables, $\text{sum}$ is quadratic and $\text{constraint}$ becomes quartic.

Because the ISSP maximizes the sum under the upper bound $T$, we minimize the negative sum:

$$
\begin{aligned}
 \text{objective} &= -\sum_{i=0}^{n-1} s_iv_i
\end{aligned}
$$

Finally, we combine the objective and the constraint penalty into a single HUBO function:

$$
\begin{aligned}
f &= \text{objective} + P\times\text{constraint},
\end{aligned}
$$

where $P$ is a sufficiently large constant to prioritize feasibility.

## PyQBPP program (HUBO formulation)
The following PyQBPP program solves an ISSP instance with 8 intervals.
The lower and upper bounds $[l_i,u_i]$ are stored in the lists `lower` and `upper`, and $T=100$.

```python
import pyqbpp as qbpp

lower = [18, 17, 21, 18, 20, 14, 14, 23]
upper = [19, 17, 22, 19, 20, 16, 15, 25]
T = 100
n = len(lower)

v = [qbpp.between(qbpp.var_int(f"v{i}"), lower[i], upper[i]) for i in range(n)]
s = qbpp.var("s", n)

total = qbpp.sum(v * s)
constraint = qbpp.between(total, 0, T)
f = -total + 1000 * constraint
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search({"target_energy": -T})
for i in range(n):
    if sol(s[i]) == 1:
        print(f"Interval {i}: val = {sol(v[i])}")
print(f"sum = {sol(total)}")
```

First, we define a list `v` of integer variables where each `v[i]` takes an integer value in
`[lower[i], upper[i]]`.
We also define an array `s` of binary variables, where `s[i] = 1` means
interval `i` is selected.
The expression `total` represents $\sum_i v_i s_i$.

The inequality constraint `between(total, 0, T)` is stored in `constraint`. In PyQBPP, such a constraint
is internally converted into a nonnegative penalty term that becomes zero when the constraint is satisfied.

Finally, we construct the HUBO objective function `f` as
`f = -total + P * constraint` (with `P = 1000` in this example).
Minimizing `f` therefore maximizes `total` while heavily penalizing any violation of the constraint.

We set the target energy to `-T` because if the solver finds a feasible solution with `total = T`,
then the penalty term is zero and the objective term becomes `-T`, i.e., the global minimum reaches `-T`.

For the obtained solution, the selected intervals and their values are printed. For example:
```
Interval 0: val = 18
Interval 1: val = 17
Interval 2: val = 22
Interval 4: val = 20
Interval 7: val = 23
sum = 100
```
This output confirms that a feasible solution achieving the maximum possible `sum` ($=T$) was obtained.

## QUBO formulation for the ISSP
The HUBO formulation above contains quartic terms because it uses products $s_i v_i$.
We can avoid quartic terms by introducing auxiliary integer variables.

Let $a_i$ $(0\leq i\leq n-1)$ be an integer variable that can take a value in
$[0,\, u_i-l_i]$.
We also use a binary variable $s_i$ $(0\leq i\leq n-1$) such that $s_i=1$ if and only if
interval $i$ is selected.

We define

$$
\begin{aligned}
  v_i &= l_is_i + a_i && (0\leq i\leq n-1) \\
\end{aligned}
$$

To ensure that $v_i$ becomes 0 when $s_i=0$, we add the following penalty term using the negated literal $\overline{s_i}$:

$$
\begin{aligned}
  \text{constraint1} &= \sum_{i=0}^{n-1}\sum_j \overline{s_i}\,a_i
\end{aligned}
$$

Since $a_i \ge 0$ and $\overline{s_i} \ge 0$, we have $\text{constraint1}\ge 0$.
Moreover, $\text{constraint1}=0$ holds if and only if $a_i=0$ whenever $s_i=0$.
Therefore, the selected value $v_i$ satisfies

$$
\begin{aligned}
  v_i & = 0 && \text{if } s_i=0,\\
      & \in  [l_i,u_i] &&\text{if } s_i=1.
\end{aligned}
$$

because $v_i = l_i + a_i$ and $a_i \in [0,u_i-l_i]$ when $s_i=1$.

Let

$$
\begin{aligned}
\text{sum} &= \sum_{i=0}^{n-1} v_i.
\end{aligned}
$$

The ISSP constraint is:

$$
\begin{aligned}
 \text{constraint2} &= \sum_{i=0}^{n-1} \bigr(0\leq v_i \leq T\bigl) \\
                &= (T-\sum_{i=0}^{n-1} v_i)^2
\end{aligned}
$$

Finally, since ISSP maximizes $\text{sum}$ under the upper bound $T$, we minimize

$$
\begin{aligned}
 \text{objective} &= -\sum_{i=0}^{n-1} v_i
\end{aligned}
$$

Combining the objective and the penalties, we obtain the QUBO expression:

$$
\begin{aligned}
f &= \text{objective} + P\times(\text{constraint1}+\text{constraint2}),
\end{aligned}
$$

where $P$ is a sufficiently large constant to prioritize feasibility.

## PyQBPP program (QUBO formulation)
The following PyQBPP program solves the same ISSP instance using the QUBO formulation:

```python
import pyqbpp as qbpp

lower = [18, 17, 21, 18, 20, 14, 14, 23]
upper = [19, 17, 22, 19, 20, 16, 15, 25]
T = 100
n = len(lower)

a = [qbpp.between(qbpp.var_int(f"a{i}"), 0, upper[i] - lower[i]) for i in range(n)]
s = qbpp.var("s", n)
v = [s[i] * lower[i] + a[i] for i in range(n)]

total = 0
for i in range(n):
    total += v[i]

constraint1 = 0
for i in range(n):
    constraint1 += ~s[i] * a[i]

constraint2 = qbpp.between(total, 0, T)
f = -total + 1000 * (constraint1 + constraint2)
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search({"target_energy": -T})
for i in range(n):
    if sol(s[i]) == 1:
        print(f"Interval {i}: val = {sol(v[i])}")
print(f"sum = {sol(total)}")
```

First, we define a list `a` of integer variables, where each `a[i]` takes an integer value in
`[0, upper[i] - lower[i]]`.
We also define an array `s` of binary variables.
Using `a` and `s`, we construct `v[i] = s[i] * lower[i] + a[i]`, which corresponds to
$v_i = s_i l_i + a_i$.
The expression `constraint1 += ~s[i] * a[i]` penalizes any solution with `a[i] > 0` when `s[i] = 0`,
thereby enforcing `v[i] = 0` for unselected intervals.
The inequality constraint `constraint2 = between(total, 0, T)`
ensures that the total selected sum does not exceed `T`.

Finally, we minimize `f = -total + P * (constraint1 + constraint2)` with a sufficiently large penalty constant `P`.
As in the previous example, passing `{"target_energy": -T}` to `search()` allows the solver to stop early if it finds a feasible solution achieving `total = T` (in which case the penalty terms are zero and the objective term becomes `-T`).

This produces the same result as the HUBO formulation.
