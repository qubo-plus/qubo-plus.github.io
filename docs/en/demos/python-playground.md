---
last_modified: 2026-10-08
layout: demo
title: "PyQBPP Playground: Run Python QUBO Programs Online"
description: "Write and run PyQBPP (QUBO++ for Python) programs in your browser without installing anything. Start from templates such as N-Queens, knapsack, TSP, factorization and integer linear programming."
lang: en
hreflang_alt: "ja/demos/python-playground/"
hreflang_lang: "ja"
permalink: /en/demos/python-playground/
nav_exclude: true
math: true
image: /assets/demos/og/python-playground.png
demo_id: ide_pyqbpp
heading: "PyQBPP Playground (Python)"
lead: "Write a PyQBPP program in Python and run it in your browser, without installing anything. Load a template to get started."
app_name: "PyQBPP Playground (Python)"
docs_links:
  - label: "Quick start"
    url: /en/python/QUICK
  - label: "All documentation"
    url: /en/python/DOCUMENT
---

## How to use

- Choose a template and press **Load** to put its program in the editor.
  To use your own file, choose **Local File** and press **Load**; **Save** saves the program to a file.
- Press **Run** (Ctrl+R). The **args** field passes command-line arguments (`sys.argv`) to the program.
  The program's output appears in the lower panel;
  drag the bar between the editor and the output to resize them.
- **? Help** explains the Playground in English and Japanese, and ☼/☾ switches the theme.

## What you can use

- Python 3.12 with PyQBPP (`import pyqbpp as qbpp`), as in the [documentation](/en/python/DOCUMENT).
  The program must import `pyqbpp`.
- The solvers `EasySolver` and `ExhaustiveSolver`, running on the CPU.
  The ABS3 solver and the external MILP solvers are not available in the Playground.
- The coefficient types of PyQBPP: `import pyqbpp.c64e64 as qbpp`, `import pyqbpp.cppint as qbpp` (arbitrary precision) and so on,
  or `import pyqbpp.d as qbpp` for real coefficients.
- Up to 300 lines (50 KB) of source code. A run is limited to 60 seconds and the output to 5 MB.
  Modules for processes, networking and threads (such as `subprocess`, `socket` and `threading`),
  `exec`, `eval` and file-system operations are not allowed.

The Playground runs on AWS Lambda with limited resources;
PyQBPP on a desktop PC is several times faster.

## Templates

| Template | What it does |
|---|---|
| Simple | Finds binary $a,b,c$ with $a+2b+3c=3$, then lists all optimal solutions with the exhaustive solver |
| Partition Problem | Splits eight integers into two groups with sums as equal as possible |
| Knapsack | Chooses items with the largest total value within the capacity |
| N-Queens | Places $N$ queens so that no two attack each other (args: $N$) |
| Integer Linear Programming | Solves a small integer linear program with integer variables |
| Factorization | Factorizes $N=pq$ with arbitrary-precision integers (args: $N$, or $p$ $q$) |
| Cutting Stock | Finds a plan to cut bars into the required pieces (args: number of bars) |
| Maximum Matching | Finds the largest set of edges with no shared vertex in a 16-vertex graph |
| Traveling Salesman | Finds a short tour of nine cities with real (double) distances |
| Square Root | Computes $\sqrt{c}$ to 20 decimal places with arbitrary-precision integers (args: $c$) |

The [quick start](/en/python/QUICK) explains the basics of PyQBPP programs,
and the [case studies](/en/python/CASE_STUDIES) cover many more problems.

## Run it on your computer

PyQBPP runs on Linux (x86-64 and ARM64) and on Windows through WSL:

```bash
pip install pyqbpp
```

See [Installation](/en/python/INSTALL) for details.
The [C++ Playground](/en/demos/cpp-playground/) runs QUBO++ in C++,
and the [other demos](/en/DEMOS) solve various problems with QUBO++.
