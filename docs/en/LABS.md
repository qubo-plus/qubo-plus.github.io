---
last_modified: 2026-11-12
layout: default
nav_exclude: true
title: "LABS Problem"
nav_order: 32
lang: en
hreflang_alt: "ja/LABS"
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
Since the solvers bundled with QUBO++ do not support spin variables directly,
we convert the spin variables to binary variables using the following transformation:

$$
\begin{aligned}
 s_i &\leftarrow 2s_i - 1
\end{aligned}
$$

After this conversion, each $s_i$ can be treated as a binary variable,
and HUBO solvers for binary variables can be used to find a solution to $\text{LABS}(S)$.

QUBO++ provides this conversion through the spin_to_binary() function.

## Reducing the search space to 1/4 by symmetry
The value of $\text{LABS}(S)$ does not change under the following two transformations:

- **Flipping every sign** ($s_i \leftarrow -s_i$): each product $s_is_{i+d}$ is unchanged.
- **Flipping every other sign** ($s_i \leftarrow (-1)^i s_i$): each product $s_is_{i+d}$ is multiplied by $(-1)^{i}(-1)^{i+d}=(-1)^d$. This factor does not depend on $i$, so the whole inner sum is multiplied by $(-1)^d$, and its square stays the same.

These transformations map the first two spins $(s_0, s_1)$ to $(+1,+1)$ as follows:

| Original $(s_0, s_1)$ | Transformation |
|---|---|
| $(+1,+1)$ | none |
| $(+1,-1)$ | flip every other sign |
| $(-1,-1)$ | flip every sign |
| $(-1,+1)$ | flip every sign, then every other sign |

Hence every sequence can be mapped to one with $s_0=s_1=+1$ without changing its LABS value, and we may fix $s_0=s_1=+1$ when searching for optimal solutions without loss of generality.
This removes two variables and reduces the search space to $1/4$.
Conversely, applying the three transformations (flipping every other sign, flipping every sign, and both) to each optimal solution with $s_0=s_1=+1$ gives all optimal solutions.

Reversing the sequence also keeps the LABS value, but this symmetry cannot be expressed by fixing variable values, so we do not use it here.

## All optimal solutions for $n=26$
The following QUBO++ program fixes $s_0=s_1=+1$ and finds all optimal solutions for $n=26$ with the Exhaustive Solver:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  const int n = 26;

  auto s = qbpp::var("s", n);
  qbpp::Expr labs = 0;
  for (int d = 1; d < n; ++d) {
    qbpp::Expr temp = 0;
    for (int i = 0; i < n - d; ++i) {
      temp += s[i] * s[i + d];
    }
    labs += qbpp::sqr(temp);
  }
  labs.spin_to_binary();
  labs.simplify_as_binary();

  qbpp::MapList ml({{s[0], 1}, {s[1], 1}});
  auto f = qbpp::replace(labs, ml);
  f.simplify_as_binary();

  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search({{"best_energy_sols", 0}});
  size_t k = 0;
  for (const auto& t : sol.sols) {
    auto full_sol = qbpp::Sol(labs).set(t, ml);
    std::cout << k++ << ": LABS = " << labs(full_sol) << " : ";
    for (int i = 0; i < n; ++i) {
      std::cout << (full_sol(s[i]) ? "+" : "-");
    }
    std::cout << std::endl;
  }
}
```
{% endraw %}
In this program, `s` stores a vector of `n` variables.
The expression `labs` is constructed using a nested loop, directly following the mathematical definition of the LABS objective.
Afterward, `labs` is converted into an expression over binary variables using the `spin_to_binary()` function and simplified by `simplify_as_binary()`.

After the conversion, $s_i=1$ corresponds to spin $+1$, so the `qbpp::MapList` object `ml` fixes `s[0]` and `s[1]` to 1.
[`qbpp::replace()`](REPLACE) returns the expression `f` in which `s[0]` and `s[1]` of `labs` are replaced by the constant 1; `f` has 24 variables.

The Exhaustive Solver is executed with `best_energy_sols` set to `0` (no limit on the number of kept solutions), so all optimal solutions of `f` are stored in `sol.sols`.
Since these solutions do not contain `s[0]` and `s[1]`, `qbpp::Sol(labs).set(t, ml)` creates the solution `full_sol` of `labs` that includes the fixed values, and its LABS value and sequence are printed.
The output of this program is:
```
0: LABS = 45 : ++--+++------+-+-+--+--+--
1: LABS = 45 : ++-++-++-+-+-++++++---++--
2: LABS = 45 : +++--+++------+-+-+--+--+-
3: LABS = 45 : ++++++---++---+-+-+--+--+-
4: LABS = 45 : +++---+++++++-++--+--+-+-+
5: LABS = 45 : +++---+++++++-+-+--+--++-+
```
There are 6 optimal solutions with $s_0=s_1=+1$.
Applying the three transformations to each of them gives 24 distinct sequences, which are all the optimal solutions for $n=26$.

## Searching for $n=30$
As $n$ grows, the running time of the Exhaustive Solver, which examines every assignment, increases rapidly.
The following QUBO++ program searches the expression for $n=30$, again with $s_0=s_1=+1$ fixed, using the Easy Solver:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  const int n = 30;

  auto s = qbpp::var("s", n);
  qbpp::Expr labs = 0;
  for (int d = 1; d < n; ++d) {
    qbpp::Expr temp = 0;
    for (int i = 0; i < n - d; ++i) {
      temp += s[i] * s[i + d];
    }
    labs += qbpp::sqr(temp);
  }
  labs.spin_to_binary();
  labs.simplify_as_binary();

  qbpp::MapList ml({{s[0], 1}, {s[1], 1}});
  auto f = qbpp::replace(labs, ml);
  f.simplify_as_binary();

  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"time_limit", 10.0}, {"best_energy_sols", 0}});
  size_t k = 0;
  for (const auto& t : sol.sols) {
    auto full_sol = qbpp::Sol(labs).set(t, ml);
    std::cout << k++ << ": LABS = " << labs(full_sol) << " : ";
    for (int i = 0; i < n; ++i) {
      std::cout << (full_sol(s[i]) ? "+" : "-");
    }
    std::cout << std::endl;
  }
}
```
{% endraw %}
The Easy Solver is executed with a time limit of 10 seconds.
Since `best_energy_sols` is set to `0`, all solutions with the best energy that the search finds are stored in `sol.sols`.
Unlike the Exhaustive Solver, however, they are not necessarily all the solutions that achieve this energy.

A typical output of this program is:
```
0: LABS = 59 : +++++-----+--+--+-+-+---++---+
1: LABS = 59 : ++-++--+-------+++---+-+-++-+-
2: LABS = 59 : ++-++--+-------+++---+-+--+-+-
3: LABS = 59 : ++++------+--+--+-+-+---++---+
```
In this run, all 4 optimal solutions with $s_0=s_1=+1$ are found.
The search is randomized, so the solutions and their number vary from run to run.
