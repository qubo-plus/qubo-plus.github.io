---
layout: default
nav_exclude: true
title: "Solving Expressions"
nav_order: 3
lang: en
hreflang_alt: "ja/python/SOLVE"
hreflang_lang: "en"
---

# Solving Expressions

PyQBPP provides three solvers for QUBO/HUBO expressions:

- **Easy Solver**
  - Runs a heuristic algorithm based on simulated annealing.
  - Runs in parallel on multicore CPUs.
  - Does not guarantee optimality.

- **Exhaustive Solver**
  - Explores all possible solutions.
  - Guarantees optimality of the returned solution.
  - Is computationally feasible only when the number of binary variables is about 30-40 or fewer.
  - If a CUDA GPU is available, GPU acceleration is automatically enabled alongside CPU threads.

- **ABS3 Solver**
  - A high-performance solver that uses CUDA GPUs and multicore CPUs.
  - Does not guarantee optimality, but is much more powerful than the Easy Solver.
  - If no GPU is available, falls back to CPU-only mode.

The Easy Solver and Exhaustive Solver are used in the following steps:
1. Create a solver object, **`qbpp.EasySolver`** or **`qbpp.ExhaustiveSolver`**.
2. Call the **`search()`** method on the solver object, optionally passing parameters as keyword arguments. It returns a solution that stores the obtained result.

## Easy Solver
To use the **Easy Solver**, use the class **`qbpp.EasySolver`** provided by PyQBPP.
Unlike the C++ version that requires including `qbpp/easy_solver.hpp`, PyQBPP exposes `EasySolver` directly as a top-level class, so a single `import pyqbpp as qbpp` is sufficient.

We use the following expression $f(a,b,c,d)$ as an example:

$$
\begin{aligned}
f(a,b,c,d) &= (a+2b+3c+4d-5)^2
\end{aligned}
$$

Clearly, this expression attains its minimum value $f=0$
when $a+2b+3c+4d=5$.
Therefore, it has two optimal solutions, $(a,b,c,d)=(0,1,1,0)$ and $(1,0,0,1)$.

In the following program, expression `f` is created using symbolic computation.
Note that the function **`qbpp.sqr()`** returns the square of the argument.
We then construct an instance of the class `qbpp.EasySolver`
by passing `f` to its constructor.
Before doing so, `f` must be simplified for binary variables by calling **`simplify_as_binary()`**.
The constructor returns an `EasySolver` object named **`solver`**.
Since we know that the optimal value is $f=0$, we pass `target_energy=0` as a keyword argument to `search()`. This tells the solver to stop as soon as it finds a solution with energy at most 0.
Calling the **`search()`** method on `solver` returns a solution named **`sol`**, which is printed using `print()`.

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
d = qbpp.var("d")
f = qbpp.sqr(a + 2 * b + 3 * c + 4 * d - 5)
print("f =", f.simplify_as_binary())

solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=0)
print(sol)
```

The output of this program is as follows:
```
f = 25 -9*a -16*b -21*c -24*d +4*a*b +6*a*c +8*a*d +12*b*c +16*b*d +24*c*d
Sol(energy=0, {a: 1, b: 0, c: 0, d: 1})
```
One of the optimal solutions is correctly output.

## Exhaustive Solver
To use the **Exhaustive Solver**, use the class **`qbpp.ExhaustiveSolver`** provided by PyQBPP.
As with `EasySolver`, no extra import is required beyond `import pyqbpp as qbpp`.

We construct an instance **`solver`** of the class **`qbpp.ExhaustiveSolver`**
by passing `f` to its constructor.
Calling the **`search()`** method on `solver` returns a solution named **`sol`**, which is printed using `print()`.
Since the Exhaustive Solver explores all possible assignments, it is guaranteed that `sol`
stores an optimal solution.

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
d = qbpp.var("d")
f = qbpp.sqr(a + 2 * b + 3 * c + 4 * d - 5)
f.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()
print(sol)
```
The output of this program is as follows:
```
Sol(energy=0, {a: 0, b: 1, c: 1, d: 0})
```
By default, `print(sol)` shows only the best solution found.
The complete list of collected solutions is available through the **`sol.sols`** attribute, which is a list of solutions sorted by energy (ascending).

All optimal solutions can be obtained by setting the `best_energy_sols` parameter as follows:
```python
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search(best_energy_sols=1)
for i, s in enumerate(sol.sols):
    print(f"({i}) {s}")
```
The output is as follows:
```
(0) Sol(energy=0, {a: 0, b: 1, c: 1, d: 0})
(1) Sol(energy=0, {a: 1, b: 0, c: 0, d: 1})
```
Furthermore, all solutions including non-optimal ones can be obtained by setting the `all_sols` parameter as follows:
```python
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search(all_sols=1)
for i, s in enumerate(sol.sols):
    print(f"({i}) {s}")
```
The output is as follows:
```
(0) Sol(energy=0, {a: 0, b: 1, c: 1, d: 0})
(1) Sol(energy=0, {a: 1, b: 0, c: 0, d: 1})
(2) Sol(energy=1, {a: 0, b: 0, c: 0, d: 1})
(3) Sol(energy=1, {a: 0, b: 1, c: 0, d: 1})
(4) Sol(energy=1, {a: 1, b: 0, c: 1, d: 0})
(5) Sol(energy=1, {a: 1, b: 1, c: 1, d: 0})
(6) Sol(energy=4, {a: 0, b: 0, c: 1, d: 0})
(7) Sol(energy=4, {a: 0, b: 0, c: 1, d: 1})
(8) Sol(energy=4, {a: 1, b: 1, c: 0, d: 0})
(9) Sol(energy=4, {a: 1, b: 1, c: 0, d: 1})
(10) Sol(energy=9, {a: 0, b: 1, c: 0, d: 0})
(11) Sol(energy=9, {a: 1, b: 0, c: 1, d: 1})
(12) Sol(energy=16, {a: 0, b: 1, c: 1, d: 1})
(13) Sol(energy=16, {a: 1, b: 0, c: 0, d: 0})
(14) Sol(energy=25, {a: 0, b: 0, c: 0, d: 0})
(15) Sol(energy=25, {a: 1, b: 1, c: 1, d: 1})
```
The Exhaustive Solver is very useful for analyzing small expressions and for debugging.

## ABS3 Solver
To use the **ABS3 Solver**, use the class **`qbpp.ABS3Solver`** provided by PyQBPP.
No additional import is required beyond `import pyqbpp as qbpp`.

The ABS3 Solver is a high-performance solver that uses CUDA GPUs and multicore CPUs.
If no GPU is available, it automatically falls back to CPU-only mode.

Usage involves two steps:
1. Create a **`qbpp.ABS3Solver`** object for the expression.
2. Call the **`search()`** method, passing parameters as keyword arguments. It returns the obtained solution.

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
d = qbpp.var("d")
f = qbpp.sqr(a + 2 * b + 3 * c + 4 * d - 5)
f.simplify_as_binary()

solver = qbpp.ABS3Solver(f)
sol = solver.search(time_limit=5.0, target_energy=0)
print(sol)
```
The output of this program is as follows:
```
Sol(energy=0, {a: 0, b: 1, c: 1, d: 0})
```

For details on parameters, callbacks, multiple solution collection, and solution hints, see **[Easy Solver](EASYSOLVER)**, **[Exhaustive Solver](EXHAUSTIVE)**, and **[ABS3 Solver](ABS3)**.
