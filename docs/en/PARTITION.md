---
layout: default
nav_exclude: true
title: "Partitioning Problem"
nav_order: 4
lang: en
hreflang_alt: "ja/PARTITION"
hreflang_lang: "ja"
---

# Solving Partitioning Problem Using Array of variables

## Partitioning problem
Let $w=(w_0, w_1, \ldots, w_{n-1})$ be $n$ positive numbers.
The **partitioning problem** is to partition these numbers into two sets $P$ and $Q$ ($=\overline{P}$) such that the sums of the elements in the two sets are as close as possible.
More specifically, the problem is to find a subset $L \subseteq \lbrace 0,1,\ldots, n-1\rbrace$ that minimizes:

$$
\begin{aligned}
P(L) &= \sum_{i\in L}w_i \\
Q(L) &= \sum_{i\not\in L}w_i \\
f(L) &= \left| P(L)-Q(L) \right|
\end{aligned}
$$

This problem can be formulated as a QUBO problem.
Let $x=(x_0, x_1, \ldots, x_{n-1})$ be binary variables representing the set $L$,
that is, $i\in L$ if and only if $x_i=1$.
We can rewrite $P(L)$, $Q(L)$ and $f(L)$ using $x$ as follows:

$$
\begin{aligned}
P(x) &= \sum_{i=0}^{n-1} w_ix_i \\
Q(x) &= \sum_{i=0}^{n-1} w_i \overline{x_i} \\
f(x)    &= \left( P(x)-Q(x) \right)^2
\end{aligned}
$$

where $\overline{x_i}$ denotes the **negated literal** of $x_i$, which takes the value $1$ when $x_i=0$ and $0$ when $x_i=1$.
Mathematically, $\overline{x_i} = 1 - x_i$, but QUBO++ handles negated literals natively using the `~` operator (e.g., `~x[i]`), which avoids expanding $1 - x_i$ and is more efficient.
For more details, see **[Negated Literals](NEGATIVE)**.

Clearly, $f(x)=f(L)^2$ holds.
The function $f(x)$ is a quadratic expression of $x$, and an optimal solution that minimizes $f(x)$ also gives an optimal solution to the original partitioning problem.

## QUBO++ program for the partitioning problem
The following QUBO++ program creates the QUBO formulation of the partitioning problem for a fixed set of 8 numbers and finds a solution using the Exhaustive Solver.

```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  std::vector<uint32_t> w = {64, 27, 47, 74, 12, 83, 63, 40};

  auto x = qbpp::var("x", w.size());
  auto p = qbpp::toExpr(0);
  auto q = qbpp::toExpr(0);
  for (size_t i = 0; i < w.size(); ++i) {
    p += w[i] * x[i];
    q += w[i] * ~x[i];
  }
  auto f = qbpp::sqr(p - q);
  std::cout << "f = " << f.simplify_as_binary() << std::endl;

  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search();

  std::cout << "Solution: " << sol << std::endl;
  std::cout << "f(sol) = " << f(sol) << std::endl;
  std::cout << "p(sol) = " << p(sol) << std::endl;
  std::cout << "q(sol) = " << q(sol) << std::endl;

  std::cout << "P :";
  for (size_t i = 0; i < w.size(); ++i) {
    if (sol(x[i]) == 1) {
      std::cout << " " << w[i];
    }
  }
  std::cout << std::endl;

  std::cout << "Q :";
  for (size_t i = 0; i < w.size(); ++i) {
    if (sol(x[i]) == 0) {
      std::cout << " " << w[i];
    }
  }
  std::cout << std::endl;
}
```

In this program, **`w`** is defined as a `std::vector` object with 8 numbers.
An array **`x`** of `w.size()=8` binary variables is defined.
Two `qbpp::Expr` objects **`p`** and **`q`** are defined, and the expressions for $P(x)$ and $Q(x)$
are constructed in the for-loop.
Here, **`~x[i]`** denotes the negated literal $\overline{x_i}$ of `x[i]`.
A `qbpp::Expr` object **`f`** stores the expression for $f(x)$.

An Exhaustive Solver object **`solver`** for `f` is created
and the solution **`sol`** (a `qbpp::Sol` object) is obtained by calling its `search()` member function.

The values of $f(x)$, $P(x)$, and $Q(x)$ are evaluated by calling **`f(sol)`**, **`p(sol)`** and **`q(sol)`**, respectively.
The numbers in the sets $L$ and $\overline{L}$ are displayed using the for loops.
In these loops, **`sol(x[i])`** returns the value of `x[i]` in `sol`.

This program outputs:
{% raw %}
```
f = 168100 -88576*x[0] -41364*x[1] -68244*x[2] -99456*x[3] -19104*x[4] -108564*x[5] -87444*x[6] -59200*x[7] +13824*x[0]*x[1] +24064*x[0]*x[2] +37888*x[0]*x[3] +6144*x[0]*x[4] +42496*x[0]*x[5] +32256*x[0]*x[6] +20480*x[0]*x[7] +10152*x[1]*x[2] +15984*x[1]*x[3] +2592*x[1]*x[4] +17928*x[1]*x[5] +13608*x[1]*x[6] +8640*x[1]*x[7] +27824*x[2]*x[3] +4512*x[2]*x[4] +31208*x[2]*x[5] +23688*x[2]*x[6] +15040*x[2]*x[7] +7104*x[3]*x[4] +49136*x[3]*x[5] +37296*x[3]*x[6] +23680*x[3]*x[7] +7968*x[4]*x[5] +6048*x[4]*x[6] +3840*x[4]*x[7] +41832*x[5]*x[6] +26560*x[5]*x[7] +20160*x[6]*x[7]
Solution: 0:{{x[0],0},{x[1],0},{x[2],1},{x[3],0},{x[4],1},{x[5],1},{x[6],1},{x[7],0}}
f(sol) = 0
p(sol) = 205
q(sol) = 205
P : 47 12 83 63
Q : 64 27 74 40
```
{% endraw %}
> **NOTE**
> For a `qbpp::Expr` object `f` and a `qbpp::Sol` object `sol`, both **`f(sol)`** and **`sol(f)`** return the resulting value of `f` evaluated on `sol`.
> Likewise, for a `qbpp::Var` object `a`, both **`a(sol)`** and **`sol(a)`** return the value of `a` in the solution `sol`.
> The form **`f(sol)`** is natural from a **mathematical perspective**, as it corresponds to evaluating a function at a point.
> In contrast, **`sol(f)`** is natural from an **object-oriented programming perspective**, where the solution object evaluates an expression.
> You may use either form according to your preference.

## QUBO++ program using array operations
QUBO++ has rich array operations that can simplify the code.
In the following code, **`w`** is defined using **`qbpp::array()`**, and **`x`** is an array of binary variables created by `qbpp::var()`.
Since the overloaded operator `*` for arrays returns the element-wise product,
**`qbpp::sum(w * x)`** returns the `qbpp::Expr` object representing $P(L)$.
The `~` operator applied to an array of variables returns an array of their negated literals.
Thus, **`qbpp::sum(w * ~x)`** returns a `qbpp::Expr` object storing $Q(L)$.

```cpp
  auto w = qbpp::array({64, 27, 47, 74, 12, 83, 63, 40});
  auto x = qbpp::var("x", w.size());
  auto p = qbpp::sum(w * x);
  auto q = qbpp::sum(w * ~x);
  auto f = qbpp::sqr(p - q);
```

QUBO++ programs can be simplified by using these array operations.
In addition, since array operations for large arrays are parallelized by multithreading, they can accelerate the process of creating QUBO models.

> **NOTE**
> The operators `+`, `-`, and `*` are overloaded both for two array objects and for a scalar and an array object.
> For two array objects, the overloaded operators perform element-wise operations.
> For a scalar and an array object, the overloaded operators apply the scalar operation to each element of the array.
