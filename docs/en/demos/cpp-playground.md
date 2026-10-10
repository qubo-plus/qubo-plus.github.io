---
last_modified: 2026-10-08
layout: demo
title: "QUBO++ Playground: Run C++ QUBO Programs Online"
description: "Write, compile and run QUBO++ (C++) programs in your browser without installing anything. Start from templates such as N-Queens, knapsack, TSP, factorization and integer linear programming."
lang: en
hreflang_alt: "ja/demos/cpp-playground/"
hreflang_lang: "ja"
permalink: /en/demos/cpp-playground/
nav_exclude: true
math: true
image: /assets/demos/og/cpp-playground.png
demo_id: ide
heading: "QUBO++ Playground (C++)"
lead: "Write a QUBO++ program in C++, compile it and run it in your browser, without installing anything. Load a template to get started."
app_name: "QUBO++ Playground (C++)"
docs_links:
  - label: "Quick start"
    url: /en/QUICK
  - label: "All documentation"
    url: /en/DOCUMENT
---

## How to use

- Choose a template and press **Load** to put its program in the editor.
  To use your own file, choose **Local File** and press **Load**; **Save** saves the program to a file.
- Press **Compile** (Ctrl+B) and then **Run** (Ctrl+R).
  The **args** field passes command-line arguments to the program.
  Compiler messages and the program's output appear in the lower panel;
  drag the bar between the editor and the output to resize them.
- **? Help** explains the Playground in English and Japanese, and ☼/☾ switches the theme.

## What you can use

- C++17 with the QUBO++ library (`#include <qbpp/qbpp.hpp>`), as in the [documentation](/en/DOCUMENT).
- The solvers `EasySolver` and `ExhaustiveSolver`, running on the CPU.
  The ABS3 solver and the external MILP solvers are not available in the Playground.
- The coefficient types of QUBO++: define `INTEGER_TYPE_C64E64`, `INTEGER_TYPE_CPP_INT` (arbitrary precision) and so on,
  or `DOUBLE_TYPE` for real coefficients, before including the header.
- Up to 300 lines (50 KB) of source code.
  Compiling and running are each limited to 30 seconds, and the output to 5 MB.

The Playground runs on AWS Lambda with limited resources;
QUBO++ on a desktop PC is several times faster.

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

The [quick start](/en/QUICK) explains the basics of QUBO++ programs,
and the [case studies](/en/CASE_STUDIES) cover many more problems.

## Run it on your computer

QUBO++ installs with apt on Ubuntu (x86-64 and ARM64), and on Windows through WSL.
See [Installation](/en/INSTALL).
The [Python Playground](/en/demos/python-playground/) runs PyQBPP, the Python version of QUBO++,
and the [other demos](/en/DEMOS) solve various problems with QUBO++.
