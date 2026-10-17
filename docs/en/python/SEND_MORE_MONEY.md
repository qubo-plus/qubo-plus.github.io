---
last_modified: 2026-10-10
layout: default
nav_exclude: true
title: "SEND+MORE=MONEY"
nav_order: 82
lang: en
hreflang_alt: "ja/python/SEND_MORE_MONEY"
hreflang_lang: "ja"
---

# Math Puzzle: SEND MORE MONEY

**SEND + MORE = MONEY** is a famous alphametic puzzle: assign a decimal digit to each letter so that
$$
\text{SEND}+\text{MORE}=\text{MONEY}
$$

The constraints are:
- The digits assigned to letters are all distinct.
- `S` and `M` must not be 0.

## Formulation

We assign a unique index to each letter as follows:

| index | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| letter | S | E | N | D | M | O | R | Y |

Let $I(\alpha)$ denote the index of letter $\alpha$ ($\in \lbrace S,E,N,D,M,O,R,Y\rbrace$).
We use an $8\times 10$ binary matrix $X=(x_{i,j})$ $(0\leq i\leq 7, 0\leq j\leq 9)$ to represent the digit assigned to each letter:  $x_{I(\alpha),j}=1$ if and only if letter $\alpha$ is assigned digit $j$.

### One-hot constraints (each letter takes exactly one digit)
Each row of $X$ must be one-hot.
We declare this equality as a constraint with [`qbpp.cons()`](CONSTRAINTS). Since the energy of an equality constraint is the square of the violation, the value of $\text{onehot}$ is:

$$
\begin{aligned}
\text{onehot} &=\sum_{i=0}^{7}\Bigl(\sum_{j=0}^{9}x_{i,j}=1\Bigr) \\
              &=\sum_{i=0}^{7}\Bigl(1-\sum_{j=0}^{9}x_{i,j}\Bigr)^2
\end{aligned}
$$

The value of $\text{onehot}$ is minimized to 0 if and only if every row is one-hot.

### All-different constraints (no two letters share the same digit)
Digits must be distinct across letters, i.e., no two rows choose the same column:
$$
\begin{aligned}
\text{different} &=\sum_{0\leq i<j\leq 7}\sum_{k=0}^9x_{i,k}x_{j,k}
\end{aligned}
$$

### Encoding the words as linear expressions
The values of $\text{SEND}$, $\text{MORE}$, and $\text{MONEY}$ are represented
by:

$$
\begin{aligned}
\text{SEND} &= 1000\sum_{k=0}^9 kx_{I(S),k}+ 100\sum_{k=0}^9 kx_{I(E),k}+ 10\sum_{k=0}^9 kx_{I(N),k}+\sum_{k=0}^9 kx_{I(D),k}\\
       &= \sum_{k=0}^9k(1000x_{I(S),k}+100x_{I(E),k}+10x_{I(N),k}+x_{I(D),k})\\
\text{MORE} &= 1000\sum_{k=0}^9 kx_{I(M),k}+ 100\sum_{k=0}^9 kx_{I(O),k}+ 10\sum_{k=0}^9 kx_{I(R),k}+\sum_{k=0}^9 kx_{I(E),k}\\
       &= \sum_{k=0}^9k(1000x_{I(M),k}+100x_{I(O),k}+10x_{I(R),k}+x_{I(E),k})\\
\text{MONEY} &= 10000\sum_{k=0}^9 kx_{I(M),k}+1000\sum_{k=0}^9 kx_{I(O),k}+ 100\sum_{k=0}^9 kx_{I(N),k}+ 10\sum_{k=0}^9 kx_{I(E),k}+\sum_{k=0}^9 kx_{I(Y),k}\\
       &= \sum_{k=0}^9k(10000x_{I(M),k}+ 1000x_{I(O),k}+100x_{I(N),k}+10x_{I(E),k}+x_{I(Y),k})
\end{aligned}
$$

### Equality constraint
We declare the equation as a constraint with `qbpp.cons()`. Its energy is the square of the residual:

$$
\begin{aligned}
\text{equal} &= \Bigl(\text{SEND}+\text{MORE} = \text{MONEY}\Bigr) \\
             &= \Bigl(\text{SEND}+\text{MORE} - \text{MONEY}\Bigr)^2
\end{aligned}
$$

### Combined objective
All constraints are combined into a single objective:

$$
\begin{aligned}
f & = P\cdot (\text{onehot}+\text{different})+\text{equal}
\end{aligned}
$$

where
`P` is a weight that prioritizes feasibility (`onehot` and `different`).
All three terms are nonnegative, and each becomes 0 exactly when its constraint holds.
Therefore $f$ takes its minimum value of 0 only when $\text{onehot}=\text{different}=\text{equal}=0$, so even with $P=1$ that solution satisfies all constraints.
However, heuristic solvers often find the solution more easily when a large `P` gives priority to feasibility, so the program uses `P = 10000`.

Finally, since $\text{S}$ and $\text{M}$ must not be 0, we fix
the binary variables as follows:
$$
x_{I(S),0} = x_{I(M),0}= 0
$$

## PyQBPP program for SEND+MORE=MONEY
The following PyQBPP program implements the formulation above and finds a solution using EasySolver:
{% raw %}
```python
import pyqbpp as qbpp

LETTERS = "SENDMORY"
L = len(LETTERS)

def I(c):
    return LETTERS.index(c)

x = qbpp.var("x", shape=(L, 10))

onehot = qbpp.cons(qbpp.vector_sum(x) == 1)

different = 0
for i in range(L - 1):
    for j in range(i + 1, L):
        different += qbpp.sum(x[i] * x[j])

send = 0
more = 0
money = 0
for k in range(10):
    send += k * (1000 * x[I('S')][k] + 100 * x[I('E')][k] + 10 * x[I('N')][k] + x[I('D')][k])
    more += k * (1000 * x[I('M')][k] + 100 * x[I('O')][k] + 10 * x[I('R')][k] + x[I('E')][k])
    money += k * (10000 * x[I('M')][k] + 1000 * x[I('O')][k] + 100 * x[I('N')][k] + 10 * x[I('E')][k] + x[I('Y')][k])

equal = qbpp.cons(send + more - money == 0)

P = 10000
f = P * (onehot + different) + equal
f.simplify_as_binary()

ml = {x[I('S')][0]: 0, x[I('M')][0]: 0}
g = qbpp.replace(f, ml)
g.simplify_as_binary()

solver = qbpp.EasySolver(g)
sol = solver.search(target_energy=0)

full_sol = qbpp.Sol(f).set(sol, ml)

print(f"onehot = {full_sol(onehot)}")
print(f"different = {full_sol(different)}")
print(f"equal = {full_sol(equal)}")

val = [next((k for k in range(10) if full_sol(x[i][k]) == 1), -1) for i in range(L)]

def digit_str(d):
    return "*" if d < 0 else str(d)

print("SEND + MORE = MONEY")
print(f"{digit_str(val[I('S')])}{digit_str(val[I('E')])}{digit_str(val[I('N')])}{digit_str(val[I('D')])} + "
      f"{digit_str(val[I('M')])}{digit_str(val[I('O')])}{digit_str(val[I('R')])}{digit_str(val[I('E')])} = "
      f"{digit_str(val[I('M')])}{digit_str(val[I('O')])}{digit_str(val[I('N')])}{digit_str(val[I('E')])}{digit_str(val[I('Y')])}")
```
{% endraw %}
In this program, `LETTERS` assigns an integer index to each letter in `"SENDMORY"`, which is used to implement $I(\alpha)$.
We define an `L`$\times$`10` matrix `x` of binary variables (here $L=8$).
`onehot` and `equal` are constraints declared with `qbpp.cons()`, and `different` is a penalty expression; they are combined into a single expression `f` with a weight `P`.

We use a dict `ml` to fix `x[I('S')][0]` and `x[I('M')][0]` to 0, and create a reduced expression `g` by applying this replacement.
The solver is run on `g`, and the resulting assignment `sol` is merged with the fixed assignments `ml` via `qbpp.Sol(f).set(sol, ml)` to produce `full_sol` for the original objective `f`.

Finally, the one-hot rows of `full_sol(x)` are decoded into digits by scanning each row for the index `k` with value 1 (or `-1` if none is found), and the program prints the obtained solution.

This program produces the following output:
```
onehot = 0
different = 0
equal = 0
SEND + MORE = MONEY
9567 + 1085 = 10652
```
This confirms that all constraints are satisfied and the correct solution is obtained.
