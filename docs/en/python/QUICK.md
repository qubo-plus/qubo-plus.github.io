---
layout: default
title: "Quick Start"
nav_order: 4
lang: en
hreflang_alt: "ja/python/QUICK"
hreflang_lang: "ja"
---

# Quick Start

> **Try without installing:** You can try PyQBPP immediately in the browser using the [**PyQBPP Playground**](PLAYGROUND) — no installation required.

This page provides an overview of the Quick Start procedure for PyQBPP.
More detailed instructions for installing PyQBPP on WSL on Windows 11 are available in [Quick Start for Windows (WSL)](../WSL).

## Installation

Install PyQBPP by following the instructions in [**Installation**](INSTALL).
For Windows users, see [**Quick Start for Windows (WSL)**](../WSL).

PyQBPP is distributed on PyPI and can typically be installed with:
```bash
pip install pyqbpp
```
PyQBPP bundles the same `libqbpp*.so` shared libraries used by the C++ distribution and loads them at runtime via `ctypes`.

## Create and run a sample program

### Create a PyQBPP sample program
Create a PyQBPP sample program below and save as file **`test.py`**:
{% raw %}
```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
f = qbpp.sqr(a + 2 * b + 3 * c - 4)
f = qbpp.simplify_as_binary(f)
print("f =", f)

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=10, target_energy=0)
print("sol =", sol)
```
{% endraw %}

This program expands and simplifies the following expression $f$ into a QUBO formula, then solves it using the EasySolver.

$$
\begin{aligned}
f &= (a+2b+3c-4)^2
\end{aligned}
$$

The key API calls used in this example are:
- **`qbpp.var(name)`**: Creates a binary variable with the given name.
- **`qbpp.sqr(expr)`**: Returns the squared expression, expanded into a sum of terms.
- **`qbpp.simplify_as_binary(expr)`**: Applies binary (0/1) simplification rules such as `x*x = x` and `x*~x = 0`, and merges like terms.
- **`qbpp.EasySolver(expr)`**: Constructs a solver for the given QUBO expression.
- **`solver.search(**kwargs)`**: Runs the solver. Parameters such as `time_limit` (seconds) and `target_energy` are passed as keyword arguments.

### Run the program
Run `test.py` as follows to display the expanded expression and the solution:
{% raw %}
```bash
python3 test.py
f = 16 -7*a -12*b -15*c +4*a*b +6*a*c +12*b*c
sol = Sol(energy=0, {a: 1, b: 0, c: 1})
```
{% endraw %}
The first line of the output is the expanded QUBO form of $f$.
The second line shows the solution found by the solver: the energy value (0 in this case, which matches the `target_energy`) together with the variable assignment $(a, b, c) = (1, 0, 1)$.

## Next steps
1. Activate your license. See [**License Management**](../LICENSE_MANAGEMENT) for details.
2. Learn the basics of PyQBPP. Start with **Basics** in [**PyQBPP (Python)**](./).
3. Explore example PyQBPP programs in the [**Case Studies**](CASE_STUDIES).
