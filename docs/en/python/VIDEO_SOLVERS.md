---
last_modified: 2026-10-26
layout: default
nav_exclude: true
title: "Video: Choosing a Solver"
description: "The points of each chapter of the video \"QUBO++ Choosing a Solver (Python)\", with the programs shown in it and their output."
lang: en
hreflang_alt: "ja/python/VIDEO_SOLVERS"
hreflang_lang: "ja"
video: solvers
---

# Video: Choosing a Solver (Python)

A companion to the video "QUBO++ Choosing a Solver (Python)".
For each chapter it gives the main points, the programs shown in the video with their output, and links to the pages that explain more.
Click "▶ Play the video from …" to play from that scene.
Programs that the video shows in part are given here in full, ready to run.

{% include video_embed.html slug="solvers" %}

What the video covers:

- How ExhaustiveSolver, EasySolver and ABS3Solver differ, and choosing among them by the number of variables and GPUs
- The example, LABS (low autocorrelation binary sequences), and its energy as an expression of degree 4
- The parameters of `search` (`time_limit`, `target_energy`, `enable_default_callback`, `best_energy_sols`, `topk_sols`), and reading the progress display
- Custom callbacks: your own function, called during the search
- Giving a good solution you know as a hint (`search(hint=…)`, and `s.hint(sol)` in a callback)

Back to the list of [Videos (Tutorials)](../VIDEOS)

## Three solvers

{% include video_seek.html t="2:16" %}

| | ExhaustiveSolver | EasySolver | ABS3Solver |
|---|---|---|---|
| How it searches | every assignment | good solutions in a set time | good solutions in a set time |
| Runs on | CPUs (and GPUs too, if there are any) | multi-core CPUs only | GPUs and CPUs (CPUs only, without a GPU) |
| Optimum guaranteed | yes | no | no |

All three are used the same way: `solver = qbpp.EasySolver(f)` makes a solver from the expression `f`, and `sol = solver.search(…)` runs the search with the parameters given.
Changing only the class name switches to another solver.

See [Solving Expressions](SOLVE) for more.

## Example: LABS

### Find a ±1 sequence unlike its own shifts

{% include video_seek.html t="3:33" %}

LABS is a problem about sequences $s_0, s_1, \ldots, s_{n-1}$ of length $n$ made of +1 and -1.
Shift the sequence by $d$ and add up the products where it overlaps itself: this is the autocorrelation $C_d$. The energy $E$ is the sum of their squares.

$$
C_d = \sum_{i=0}^{n-1-d} s_i s_{i+d}, \qquad E = \sum_{d=1}^{n-1} C_d^2
$$

We look for the sequence that minimizes $E$: a sequence unlike itself however it is shifted.
For example, for the length-7 sequence `+++--+-`, $C_1, \ldots, C_6$ are 0 and -1 by turns, and $E = 3$.
This sequence and the optimum of length 13 are Barker sequences.

### With 0/1 variables, the expression has degree 4

{% include video_seek.html t="5:28" %}

From 0/1 variables `x`, `y = 2 * x - 1` gives expressions of degree 1 for +1 or -1.
`y[:n - d] * y[d:]` is the array of products where the sequence overlaps its shift, and `qbpp.sum` adds them into the autocorrelation $C_d$ (degree 2).
`qbpp.sqr` squares it, so `f` has degree 4. The QUBO++ solvers take expressions with terms of degree 4 as they are.

```python
import pyqbpp as qbpp

n = 4
x = qbpp.var("x", shape=n)
y = 2 * x - 1
f = 0
for d in range(1, n):
    f += qbpp.sqr(qbpp.sum(y[:n - d] * y[d:]))
f.simplify_as_binary()
print(f)
print("max degree =", f.max_degree)
```

Output:

```
14 -12*x[0] -12*x[1] -12*x[2] -12*x[3] +16*x[0]*x[1] +24*x[0]*x[2] +16*x[0]*x[3] +16*x[1]*x[2] +24*x[1]*x[3] +16*x[2]*x[3] -32*x[0]*x[1]*x[2] -32*x[0]*x[1]*x[3] -32*x[0]*x[2]*x[3] -32*x[1]*x[2]*x[3] +64*x[0]*x[1]*x[2]*x[3]
max degree = 4
```

See [LABS Problem](LABS) for more.

## ExhaustiveSolver

### Length 13: all optimal solutions

{% include video_seek.html t="8:04" %}

ExhaustiveSolver checks all $2^{13} = 8192$ sequences.
With `best_energy_sols=0`, it collects all optimal solutions (1 or more sets the most to collect). The collected solutions are in `sol.sols`.

```python
import pyqbpp as qbpp

# f is the LABS expression of length n = 13 (built as for length 4)
n = 13
x = qbpp.var("x", shape=n)
y = 2 * x - 1
f = 0
for d in range(1, n):
    f += qbpp.sqr(qbpp.sum(y[:n - d] * y[d:]))
f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search(best_energy_sols=0)
for s in sol.sols:
    print(s.energy, "".join("+" if v == 1 else "-" for v in s(x)))
```

Output:

```
6 -+-+--++-----
6 -----++--+-+-
6 +++++--++-+-+
6 +-+-++--+++++
```

It found four sequences of energy 6. Line 3 is the Barker sequence; the other three are it reversed, with + and - swapped, or both.
Since every sequence was checked, these four are the only optimal ones.

### topk_sols: collect the lowest energies first

{% include video_seek.html t="10:21" %}

You can call `search` on one solver as many times as you like.
`topk_sols=6` collects 6 solutions, lowest energy first: the 4 optimal ones, then 2 of the 24 sequences of energy 14.

```python
import pyqbpp as qbpp

# f is the LABS expression of length n = 13 (built as for length 4)
n = 13
x = qbpp.var("x", shape=n)
y = 2 * x - 1
f = 0
for d in range(1, n):
    f += qbpp.sqr(qbpp.sum(y[:n - d] * y[d:]))
f.simplify_as_binary()
solver = qbpp.ExhaustiveSolver(f)
sol = solver.search(best_energy_sols=0)
for s in sol.sols:
    print(s.energy, "".join("+" if v == 1 else "-" for v in s(x)))
print("---")
sol = solver.search(topk_sols=6)
for s in sol.sols:
    print(s.energy, "".join("+" if v == 1 else "-" for v in s(x)))
```

Output:

```
6 -+-+--++-----
6 -----++--+-+-
6 +++++--++-+-+
6 +-+-++--+++++
---
6 -+-+--++-----
6 -----++--+-+-
6 +++++--++-+-+
6 +-+-++--+++++
14 ++++-+-+--++-
14 --++------+-+
```

See [Exhaustive Solver](EXHAUSTIVE) for more.

### One more variable doubles the work

{% include video_seek.html t="11:25" %}

| Variables | Assignments |
|---:|---|
| 13 | 8192 |
| 20 | about a million |
| 30 | about a billion |
| 40 | about a trillion |
| 100 | about $10^{30}$ |

Even checking in parallel on CPU cores and GPUs, ExhaustiveSolver is practical up to about 30 to 40 variables.
In return it finds every optimal solution, which helps to check that an expression is right on a small example.

## EasySolver

### Length 30: set the time limit and the target energy

{% include video_seek.html t="12:50" %}

The parameters of `search` are written as a name and a value joined by an equals sign. All of them can be left out.

- `time_limit`: the upper limit of the search time in seconds. Left out, it is 10 seconds too. With 0 the search never stops on time, so always give `target_energy` as well.
- `target_energy`: the target energy. The search stops when it finds a solution at or below it. Here it is 59, known to be the optimum for length 30.
- `enable_default_callback`: with 1, the time and the energy are printed each time a better solution is found (0 if left out).

```python
import pyqbpp as qbpp

# f is the LABS expression of length n = 30
n = 30
x = qbpp.var("x", shape=n)
y = 2 * x - 1
f = 0
for d in range(1, n):
    f += qbpp.sqr(qbpp.sum(y[:n - d] * y[d:]))
f.simplify_as_binary()
solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=10, target_energy=59, enable_default_callback=1)
print(sol.energy, "".join("+" if v == 1 else "-" for v in sol(x)))
```

### Progress display: a line for each better solution

{% include video_seek.html t="15:15" %}

`TTS` is when that solution was found (seconds from the start), and `Energy` is its energy.
It reached 59 on line 22 and stopped without waiting for the 10 seconds. The last line is from `print`.

The output in the video (EasySolver gives different results on each run):

```
TTS = 0.000s Energy = 6827
TTS = 0.000s Energy = 4819
TTS = 0.000s Energy = 4435
TTS = 0.000s Energy = 3115
TTS = 0.000s Energy = 2283
TTS = 0.000s Energy = 2123
TTS = 0.000s Energy = 1491
TTS = 0.000s Energy = 1403
TTS = 0.001s Energy = 1067
TTS = 0.001s Energy = 955
TTS = 0.001s Energy = 635
TTS = 0.001s Energy = 435
TTS = 0.001s Energy = 387
TTS = 0.001s Energy = 299
TTS = 0.001s Energy = 203
TTS = 0.001s Energy = 139
TTS = 0.001s Energy = 131
TTS = 0.001s Energy = 123
TTS = 0.001s Energy = 115
TTS = 0.001s Energy = 99
TTS = 0.002s Energy = 75
TTS = 0.002s Energy = 59
59 -+-+--+-+---+++-------+--++-++
```

Without a target energy, leave out `target_energy`, and the search runs until `time_limit`.
It returns the best solution found, with no guarantee that it is optimal.

See [Easy Solver](EASYSOLVER) and [Search Parameters](PARAMS) for more.

## Progress with constraints

{% include video_seek.html t="16:57" %}

With constraints declared by `qbpp.cons`, the progress display also shows `Obj` (the value of the objective, here the cost) and `Viol` (the broken constraints, out of all of them).
The energy is the cost plus the penalty for the broken constraints. When `Viol` is `0/7`, the penalty is 0 and the energy is just the cost.
The example is the transportation problem of the [arrays video](VIDEO_ARRAYS).

```python
import pyqbpp as qbpp

# The transportation problem of the previous video (3 factories × 4 stores, min cost 810)
supply = qbpp.array([30, 25, 45])
demand = qbpp.array([20, 30, 25, 25])
c = qbpp.array([[8, 6, 10, 9], [9, 12, 13, 7], [14, 9, 16, 5]])
x = qbpp.var("x", shape=(3, 4), integer=(0, 45))
cost = qbpp.sum(c * x)
f = (cost
     + 100 * qbpp.cons(qbpp.vector_sum(x, axis=1) == supply)
     + 100 * qbpp.cons(qbpp.vector_sum(x, axis=0) == demand))
f.simplify_as_binary()
sol = qbpp.EasySolver(f).search(time_limit=1, target_energy=810, enable_default_callback=1)
print("cost =", sol(cost), " violated =", f.cons(sol))
```

The output in the video (of the 81 progress lines, those in between are left out as …; EasySolver gives different results on each run):

```
TTS = 0.001s Energy = 480428 Obj = 1828 Viol = 4/7
TTS = 0.001s Energy = 466221 Obj = 1821 Viol = 4/7
TTS = 0.001s Energy = 453211 Obj = 1811 Viol = 4/7
…
TTS = 0.001s Energy = 27643 Obj = 1043 Viol = 3/7
TTS = 0.001s Energy = 1175 Obj = 975 Viol = 2/7
TTS = 0.001s Energy = 1093 Obj = 1093 Viol = 0/7
TTS = 0.001s Energy = 1008 Obj = 1008 Viol = 0/7
…
TTS = 0.037s Energy = 814 Obj = 814 Viol = 0/7
TTS = 0.041s Energy = 812 Obj = 812 Viol = 0/7
TTS = 0.052s Energy = 810 Obj = 810 Viol = 0/7
cost = 810  violated = 0
```

Of the energy 480428 on the first line, the cost is 1828 and the remaining 478600 is the penalty.
Where `Viol` drops from 2/7 to 0/7, the cost rose from 975 to 1093, but with no penalty left the energy fell from 1175 to 1093.

See [Nonlinear Functions and Native Constraints](CONSTRAINTS) for more.

## ABS3Solver

### Length 100: an unknown optimum, searched with GPUs too

{% include video_seek.html t="19:22" %}

Length 100 has $2^{100}$ (about $10^{30}$) assignments, and its optimum is not known.
The computer has GPUs, so we choose ABS3Solver, which uses them too. It is written as for EasySolver; only the class name changes.
There is no `target_energy`, so it searches until the `time_limit` of 10 seconds.

```python
import pyqbpp as qbpp

n = 100
x = qbpp.var("x", shape=n)
y = 2 * x - 1
f = 0
for d in range(1, n):
    f += qbpp.sqr(qbpp.sum(y[:n - d] * y[d:]))
f.simplify_as_binary()
solver = qbpp.ABS3Solver(f)
sol = solver.search(time_limit=10, enable_default_callback=1)
print(sol.energy, "".join("+" if v == 1 else "-" for v in sol(x)))
```

The output in the video (ABS3Solver gives different results on each run):

```
TTS = 0.010s Energy = 304578
TTS = 0.010s Energy = 277230
TTS = 0.010s Energy = 274510
TTS = 0.010s Energy = 253842
TTS = 0.024s Energy = 1206
TTS = 0.024s Energy = 1122
TTS = 0.049s Energy = 1106
TTS = 0.060s Energy = 1010
TTS = 0.140s Energy = 998
TTS = 0.142s Energy = 990
TTS = 0.144s Energy = 942
TTS = 0.162s Energy = 934
TTS = 0.195s Energy = 894
TTS = 0.495s Energy = 862
TTS = 0.746s Energy = 842
TTS = 1.975s Energy = 834
TTS = 2.142s Energy = 814
814 +---++++++++++-++++++--+++------+-+++++-+--+-+--+--+-+-+-+-++-----++-+-+--++-++--++-+--++--+++---++-
```

ABS3Solver returns the best solution it found, but there is no guarantee that 814 is optimal.

### Uses GPUs if there are any, and runs on CPUs without them

{% include video_seek.html t="21:29" %}

With GPUs, ABS3Solver searches on GPUs and CPUs at once. The second argument sets how many GPUs to use.

| Form | Meaning |
|---|---|
| `qbpp.ABS3Solver(f)` | Uses all available GPUs (CPUs only if none) |
| `qbpp.ABS3Solver(f, 0)` | Uses no GPU: searches on CPUs only |
| `qbpp.ABS3Solver(f, 2)` | Uses two GPUs |

On a computer without a GPU, the same program runs as it is, unchanged.

See [ABS3 Solver](ABS3) for more.

## Custom callbacks

{% include video_seek.html t="22:37" %}

The function registered with `solver.set_callback(on_event)` is called during the search, given the solver `s`.
`s.event()` is one of `Start` (once, when the search begins), `BestUpdated` (each time a better solution is found) and `Timer` (at the interval set with `s.timer`).
`s.best_sol()` is the best solution so far, and `s.terminate()` stops the search. Here, it stops when a second goes by with no better solution.

```python
import pyqbpp as qbpp

n = 30
x = qbpp.var("x", shape=n)
y = 2 * x - 1
f = 0
for d in range(1, n):
    f += qbpp.sqr(qbpp.sum(y[:n - d] * y[d:]))
f.simplify_as_binary()

last = None   # the energy at the previous Timer


def on_event(s):
    global last
    if s.event() == qbpp.CallbackEvent.Start:
        s.timer(1)                       # a Timer every second
    elif s.event() == qbpp.CallbackEvent.BestUpdated:
        print("best:", s.best_sol().energy)
    elif s.event() == qbpp.CallbackEvent.Timer:
        energy = s.best_sol().energy
        print("timer:", energy)
        if energy == last:               # no better for a second
            s.terminate()
        last = energy


solver = qbpp.EasySolver(f)
solver.set_callback(on_event)
sol = solver.search(time_limit=10)
print(sol.energy, "".join("+" if v == 1 else "-" for v in sol(x)))
```

The output in the video (EasySolver gives different results on each run):

```
best: 6427
best: 6283
best: 2235
best: 1475
best: 355
best: 155
best: 139
best: 131
best: 115
best: 99
best: 91
best: 83
best: 75
best: 59
timer: 59
timer: 59
59 -+-++-+-+---+++-------+--++-++
```

The second `Timer` also gives 59, the same as before, so the search stopped without waiting for the `time_limit` of 10 seconds.
Custom callbacks are written the same way for ABS3Solver. You can also override `callback()` in a subclass.

See "Custom Callbacks" in [Easy Solver](EASYSOLVER) for more.

## Giving a hint

### search(hint=…): start from a good solution

{% include video_seek.html t="25:02" %}

Pass a good solution you know to `hint=` of `search`, and the solver starts from it. The solution it returns is never worse than the hint.
The example is a multidimensional knapsack problem: from 3000 items, maximize the total value while keeping within 5 capacities, one for each kind of weight.
A greedy method records its solution in the dictionary `greedy`, and `qbpp.Sol(f).set(greedy)` makes it a solution of `f` (variables not in the dictionary stay 0).
ABS3Solver searches for 20 seconds with the hint and 20 seconds without it.

```python
import random
import pyqbpp as qbpp

n, m = 3000, 5      # 3000 items, 5 kinds of weight (5 capacities)
random.seed(11)
w = [[random.randint(1, 1000) for j in range(n)] for i in range(m)]
C = [sum(w[i]) // 4 for i in range(m)]
v = [sum(w[i][j] for i in range(m)) // m + random.randint(0, 500)
     for j in range(n)]
x = qbpp.var("x", shape=n)
value = qbpp.sum(v * x)
f = -value
for i in range(m):
    f += 100 * qbpp.cons(qbpp.sum(w[i] * x) <= C[i])
f.simplify_as_binary()

# a good solution known in advance (greedy method)
ratio = [v[j] / sum(w[i][j] / C[i] for i in range(m)) for j in range(n)]
load = [0] * m
greedy = {}
for j in sorted(range(n), key=lambda j: ratio[j], reverse=True):
    if all(load[i] + w[i][j] <= C[i] for i in range(m)):
        greedy[x[j]] = 1
        for i in range(m):
            load[i] += w[i][j]
hint = qbpp.Sol(f).set(greedy)
print("greedy: value =", hint(value))

solver = qbpp.ABS3Solver(f)
sol = solver.search(time_limit=20, hint=hint,
                    enable_default_callback=1)
print("with hint:    value =", sol(value))

solver = qbpp.ABS3Solver(f)
sol = solver.search(time_limit=20,
                    enable_default_callback=1)
print("without hint: value =", sol(value))
```

The output in the video (progress lines in between are left out as …; ABS3Solver gives different results on each run):

```
greedy: value = 715481
TTS = 0.002s Energy = -715481
TTS = 0.354s Energy = -717857
TTS = 0.364s Energy = -718779
…
TTS = 4.339s Energy = -722595
TTS = 5.423s Energy = -722617
with hint:    value = 722617
TTS = 0.000s Energy = -72974
TTS = 0.001s Energy = -148960
TTS = 0.001s Energy = -149105
…
TTS = 17.867s Energy = -717330
TTS = 18.247s Energy = -717360
without hint: value = 717360
```

The first progress line with the hint is the hint's own value, -715481. With the hint, it reached 722617 in 19 lines; without it, 717360 in 155 lines.
In this run the search with the hint returned the better solution, but a hint does not always make it faster.
`hint=` works in `search` for both EasySolver and ABS3Solver.

### s.hint(sol) in a callback: inject a solution during the search

{% include video_seek.html t="29:23" %}

Calling `s.hint(sol)` in a callback injects a solution into the running search. The solution returned is never worse than the one injected.
One use is running a MIP solver at the same time, the two exchanging their best solutions so far.
For simplicity, here the greedy solution is injected once, at a `Timer` after 2 seconds.

```python
import json
import random
import pyqbpp as qbpp

# f, x, value and the greedy hint: as in the hint= example
n, m = 3000, 5      # 3000 items, 5 kinds of weight (5 capacities)
random.seed(11)
w = [[random.randint(1, 1000) for j in range(n)] for i in range(m)]
C = [sum(w[i]) // 4 for i in range(m)]
v = [sum(w[i][j] for i in range(m)) // m + random.randint(0, 500)
     for j in range(n)]
x = qbpp.var("x", shape=n)
value = qbpp.sum(v * x)
f = -value
for i in range(m):
    f += 100 * qbpp.cons(qbpp.sum(w[i] * x) <= C[i])
f.simplify_as_binary()

ratio = [v[j] / sum(w[i][j] / C[i] for i in range(m)) for j in range(n)]
load = [0] * m
greedy = {}
for j in sorted(range(n), key=lambda j: ratio[j], reverse=True):
    if all(load[i] + w[i][j] <= C[i] for i in range(m)):
        greedy[x[j]] = 1
        for i in range(m):
            load[i] += w[i][j]
hint = qbpp.Sol(f).set(greedy)
print("greedy: value =", hint(value))

log = []   # a list of (time, value)


def on_event(s):
    if s.event() == qbpp.CallbackEvent.Start:
        s.timer(2)                          # Timer in 2 seconds
    elif s.event() == qbpp.CallbackEvent.Timer:
        print("before the hint: value =", s.best_sol()(value))
        s.hint(hint)                        # inject the hint
        s.timer(0)                          # this one Timer only
    elif s.event() == qbpp.CallbackEvent.BestUpdated:
        best = s.best_sol()
        if f.cons(best) == 0:               # capacities kept
            log.append((best.tts, best(value)))


solver = qbpp.ABS3Solver(f)
solver.set_callback(on_event)
sol = solver.search(time_limit=20)
print("value =", sol(value))

json.dump(log, open("h2_mip_hint.json", "w"))   # for the plot
```

The output in the video (ABS3Solver gives different results on each run):

```
greedy: value = 715481
before the hint: value = 713226
value = 722760
```

Just before the injection the best value was 713226; at the injection the value shot up past the greedy solution.
The final value, 722760, caught up with the search given the hint from the start (722617). Which comes out on top changes from run to run.
`s.hint` works with both EasySolver and ABS3Solver.

See "Solution Hint" in [ABS3 Solver](ABS3) and "Passing a hint solution" in [Easy Solver](EASYSOLVER) for more.

## Choosing a solver

{% include video_seek.html t="32:41" %}

Look at the number of variables, and whether a GPU can be used.

| Case | Solver | In this video |
|---|---|---|
| Few variables (up to 30–40) | ExhaustiveSolver: all optimal solutions (guaranteed) | 4 optimal solutions for length 13 |
| Try first | EasySolver: multi-core CPUs only | the target 59 for length 30 |
| A GPU can be used | ABS3Solver: GPUs and CPUs at once (CPUs only without a GPU) | 814 for length 100 |

- With a target energy, stop at it with `target_energy` (it need not be the optimum). Without one, search until `time_limit` and get the best solution.
- To handle the progress in your own way, use a custom callback.
- If you know a good solution, pass it with `hint=`; a good solution found during the search can be passed with `s.hint` in a callback. Callbacks and hints both work with EasySolver and ABS3Solver.

## Summary

{% include video_seek.html t="34:35" %}

- The three solvers are all used the same way. ExhaustiveSolver finds all optimal solutions when there are few variables; EasySolver and ABS3Solver look for good solutions within a set time.
- `time_limit` is the upper limit of the search time; the default is 10 seconds. With 0, the search never stops on time.
- `target_energy` stops the search once a solution is at or below it. With `enable_default_callback` set to 1, the progress is shown.
- `best_energy_sols` set to 0 collects all the lowest-energy solutions; set to 1 or more, it is the most solutions to collect. `topk_sols` collects that many solutions, lowest energy first.
- Pass a good solution you know as `hint`, and the search starts from it. With 0 as its second argument, ABS3Solver searches on CPUs only.
- `solver.set_callback` registers a function to call during the search. In it, `s.event()` tells what happened and `s.best_sol()` is the best solution so far. `s.timer()` sets the interval of calls, and `s.terminate()` stops the search.
- Calling `s.hint` in a callback injects a solution into the solver. Callbacks and hints both work with EasySolver and ABS3Solver.
- In the returned solution, `sol.energy` is the energy and `sol.tts` is when it was found. `sol.sols` holds the collected solutions.
