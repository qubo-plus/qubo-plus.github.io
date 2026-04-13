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

## Spin-to-binary conversion
Since the solvers bundled with PyQBPP do not support spin variables directly,
we convert the spin variables to binary variables using the following transformation:

$$
\begin{aligned}
 s_i &\leftarrow 2s_i - 1
\end{aligned}
$$

PyQBPP provides this conversion through the `spin_to_binary()` function.

## PyQBPP program for the LABS
```python
import pyqbpp as qbpp

n = 30

s = qbpp.var("s", n)
labs = qbpp.expr()
for d in range(1, n):
    temp = qbpp.expr()
    for i in range(n - d):
        temp += s[i] * s[i + d]
    labs += qbpp.sqr(temp)

labs.spin_to_binary()
labs.simplify_as_binary()

solver = qbpp.EasySolver(labs)
sol = solver.search(time_limit=10.0, enable_default_callback=1)
bits = "".join("+" if sol(s[j]) == 1 else "-" for j in range(n))
print(f"{sol.energy}: {bits}")
```
In this program, `s` stores a vector of `n` variables.
The `Expr` object `labs` is constructed using a nested loop,
directly following the mathematical definition of the LABS objective.

Afterward, `labs` is converted into an expression over binary variables
using the `spin_to_binary()` function and simplified by
`simplify_as_binary()`.

A typical output of this program is:
```
TTS = 0.000s Energy = 7742
...
59: -----+++++-++-++-+-+-+++--+++-
```
