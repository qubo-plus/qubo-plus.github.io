---
layout: default
nav_exclude: true
title: "LABS Problem"
nav_order: 72
lang: en
hreflang_alt: "ja/python/LABS"
hreflang_lang: "ja"
---

# Low-Autocorrelation Binary Sequence (LABS) Problem

The **Low Autocorrelation Binary Sequence (LABS)** problem aims to find a spin sequence $S=(s_i)$ ($s_i=\pm 1, 0\leq i\leq n-1$)
that minimizes its autocorrelation.
The autocorrelation of $S$ with alignment $d$ is defined as

$$
\left(\sum_{i=0}^{n-d-1}s_is_{i+d}\right)^2
$$


The LABS objective function is the sum of these autocorrelations over all alignments:

$$
\begin{aligned}
\text{LABS}(S) &= \sum_{d=1}^{n-1}\left(\sum_{i=0}^{n-d-1}s_is_{i+d}\right)^2
\end{aligned}
$$

The LABS problem is to find a sequence $S$ that minimizes $\text{LABS}(S)$.

## Spin-to-binary conversion
Since the solvers bundled with PyQBPP do not support spin variables directly,
we convert the spin variables to binary variables using the following transformation:

$$
\begin{aligned}
 s_i &\leftarrow 2s_i - 1
\end{aligned}
$$

After this conversion, each $s_i$ can be treated as a binary variable,
and HUBO solvers for binary variables can be used to find a solution to $\text{LABS}(S)$.

PyQBPP provides this conversion through the `spin_to_binary()` function.

## PyQBPP program for the LABS
The following PyQBPP program formulates and solves the LABS problem:
{% raw %}
```python
import pyqbpp as qbpp

n = 30

s = qbpp.var("s", shape=n)
labs = qbpp.expr()
for d in range(1, n):
    temp = qbpp.expr()
    for i in range(n - d):
        temp += s[i] * s[i + d]
    labs += qbpp.sqr(temp)

labs.spin_to_binary()
labs.simplify_as_binary()

solver = qbpp.ABS3Solver(labs)
result = solver.search(time_limit=10.0, best_energy_sols=0)
for i, sol in enumerate(result.sols):
    bits = "".join("+" if sol(s[j]) == 1 else "-" for j in range(n))
    print(f"{i}: LABS = {sol.energy} : {bits}")
```
{% endraw %}
In this program, `s` stores a vector of `n` variables.
The expression `labs` is constructed using a nested loop,
directly following the mathematical definition of the LABS objective.

Afterward, `labs` is converted into an expression over binary variables
using the `spin_to_binary()` function and simplified by
`simplify_as_binary()`.

The ABS3 Solver is then executed with a time limit of 10 seconds.
Since `best_energy_sols` is set to `0` (meaning all best-energy solutions are kept), all solutions achieving
the minimum energy are stored in `result.sols`.

Using a `for` loop over `result.sols`, all best-energy solutions are printed.
A typical output of this program is:
```
0: LABS = 59 : -----+++++-++-++-+-+-+++--+++-
1: LABS = 59 : -+-++-+-+---+++-------+--++-++
2: LABS = 59 : -+-+--+-+---+++-------+--++-++
3: LABS = 59 : +-+-++-+-+++---+++++++-++--+--
4: LABS = 59 : --+--++-+++++++---+++-+-++-+-+
5: LABS = 59 : ----++++++-++-++-+-+-+++--+++-
6: LABS = 59 : +-+--+-+-+++---+++++++-++--+--
7: LABS = 59 : ++-++--+-------+++---+-+-++-+-
8: LABS = 59 : -+++--+++-+-+-++-++-++++++----
9: LABS = 59 : +---++---+-+-+--+--+-----+++++
```
In this run, multiple solutions achieving the same minimum LABS value are obtained.
