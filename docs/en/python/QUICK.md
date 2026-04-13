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

## Installation

Install PyQBPP by following the instructions in [**Installation**](INSTALL).

## Create and run a sample program

### Create a PyQBPP sample program
Create a PyQBPP sample program below and save as file **`test.py`**:
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

This program expands and simplifies the following expression $f$ into a QUBO formula, then solves it using the EasySolver.

$$
\begin{aligned}
f &= (a+2b+3c-4)^2
\end{aligned}
$$

### Run the program
Run `test.py` as follows to display the expanded expression and the solution:
{% raw %}
```bash
python3 test.py
f = 16 -7*a -12*b -15*c +4*a*b +6*a*c +12*b*c
sol = Sol(energy=0, {a: 1, b: 0, c: 1})
```
{% endraw %}

## Next steps
1. Activate your license. See [**License Management**](../LICENSE_MANAGEMENT) for details.
2. Learn the basics of PyQBPP. Start with **Basics** in [**PyQBPP (Python)**](./).
