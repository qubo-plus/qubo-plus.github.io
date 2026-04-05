---
layout: default
nav_exclude: true
title: "Solving Expressions"
nav_order: 3
lang: en
hreflang_alt: "ja/python/SOLVE"
hreflang_lang: "ja"
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

The Easy Solver and Exhaustive Solver are used in two steps:
1. Create a solver object, **`EasySolver`** or **`ExhaustiveSolver`**.
2. Call the **`search()`** method on the solver object. It returns a **`Sol`** object that stores the obtained solution.

## Easy Solver
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
The function **`sqr()`** returns the square of the argument.
We then construct an `EasySolver` instance by passing `f` to its constructor.
Before doing so, `f` must be simplified for binary variables by calling **`simplify_as_binary()`**.
Since we know that the optimal value is $f=0$, we pass `target_energy` as a parameter to the **`search()`** method.
Calling **`search()`** on `solver` returns a solution instance **`sol`** of class **`Sol`**.

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
d = qbpp.var("d")
f = qbpp.sqr(a + 2 * b + 3 * c + 4 * d - 5)
print("f =", f.simplify_as_binary())

solver = qbpp.EasySolver(f)
sol = solver.search({"target_energy": 0})
print(sol)
```

The output of this program is as follows:
```
f = 25 -9*a -16*b -21*c -24*d +4*a*b +6*a*c +8*a*d +12*b*c +16*b*d +24*c*d
Sol(energy=0, a=1, b=0, c=0, d=1)
```
One of the optimal solutions is correctly output.

## Exhaustive Solver
We construct an **`ExhaustiveSolver`** instance by passing `f` to its constructor.
Calling the **`search()`** method on `solver` returns a solution instance **`sol`** of
class **`Sol`**.
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
Sol(energy=0, a=0, b=1, c=1, d=0)
```
All optimal solutions can be obtained by passing `"best_energy_sols"` to `search()`:
```python
sol = solver.search({"best_energy_sols": 0})
for i, s in enumerate(sol.sols()):
    print(f"({i}) {s}")
```
The output is as follows:
```
(0) Sol(energy=0, a=0, b=1, c=1, d=0)
(1) Sol(energy=0, a=1, b=0, c=0, d=1)
```

The Exhaustive Solver is very useful for analyzing small expressions and for debugging.

## ABS3 Solver
The **ABS3 Solver** is a high-performance solver that uses CUDA GPUs and multicore CPUs.
If no GPU is available, it automatically falls back to CPU-only mode.

Usage involves two steps:
1. Create an **`ABS3Solver`** object for the expression.
2. Call the **`search()`** method with a parameter dict, which returns the obtained solution.

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
d = qbpp.var("d")
f = qbpp.sqr(a + 2 * b + 3 * c + 4 * d - 5)
f.simplify_as_binary()

solver = qbpp.ABS3Solver(f)
solver.callback(lambda energy, tts, event: print(f"TTS = {tts:.3f}s Energy = {energy}"))
sol = solver.search({"time_limit": 5.0, "target_energy": 0})
print(sol)
```
The output of this program is as follows:
```
TTS = 0.000s Energy = 0
Sol(energy=0, a=0, b=1, c=1, d=0)
```

For details on parameters, callbacks, and multiple solution collection, see **[ABS3 Solver](ABS3)**.
