---
last_modified: 2026-10-27
layout: default
nav_exclude: true
title: "Fixing Variables and Sentinels"
nav_order: 19
lang: en
hreflang_alt: "ja/FIX_VARIABLES"
hreflang_lang: "ja"
---

# Fixing Variables and Sentinels

Some values in a variable array are often known in advance as part of the problem data.
QUBO++ offers two ways to fix such variables:

- **Method 1**: Build the expression from the variable array as it is, and replace the fixed variables with their values using `qbpp::replace`.
- **Method 2**: Copy the variable array into an expression array, assign constants to the fixed elements, and then build the expression.

This page first compares the two methods on a small puzzle.
It then compares the same two methods for placing fixed values outside an array (**sentinels**).

## A 0/1 Matrix with Given Row and Column Sums

The number of 1s in each row and each column of a $4 \times 4$ 0/1 matrix $x$ is given:

$$
\begin{aligned}
\sum_{j=0}^{3} x_{i,j} &= R_i \quad (i = 0, 1, 2, 3), & R &= (2, 3, 2, 2)\\
\sum_{i=0}^{3} x_{i,j} &= C_j \quad (j = 0, 1, 2, 3), & C &= (2, 3, 2, 2)
\end{aligned}
$$

These conditions alone allow 51 matrices, but if the values of three cells, $x_{0,1} = 0$, $x_{1,0} = 0$, and $x_{3,3} = 1$, are known, the matrix is unique:

$$
x = \begin{pmatrix}
1 & 0 & 1 & 0\\
0 & 1 & 1 & 1\\
1 & 1 & 0 & 0\\
0 & 1 & 0 & 1
\end{pmatrix}
$$

We fix the three known cells and find the remaining cells.

## Method 1: Fixing with replace

The following program builds the row and column sum constraints `f` from the variable array `x` as it is, and fixes the known cells using `qbpp::replace`.
It solves two problems with different known cells from the same `f`:

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto R = qbpp::array({2, 3, 2, 2});
  auto C = qbpp::array({2, 3, 2, 2});
  auto x = qbpp::var("x", 4, 4);
  auto f = qbpp::cons(qbpp::vector_sum(x, 1) == R) +
           qbpp::cons(qbpp::vector_sum(x, 0) == C);
  std::cout << "f =" << std::endl << f << std::endl;

  qbpp::MapList ml1({{x[0][1], 0}, {x[1][0], 0}, {x[3][3], 1}});
  qbpp::MapList ml2({{x[0][0], 0}, {x[0][1], 0}, {x[3][3], 1}});
  for (const auto& ml : {ml1, ml2}) {
    auto g = qbpp::replace(f, ml);
    g.simplify_as_binary();
    std::cout << "g =" << std::endl << g << std::endl;
    auto sol = qbpp::ExhaustiveSolver(g).search();
    auto full_sol = qbpp::Sol(f).set(sol, ml);
    std::cout << "x = " << full_sol(x) << std::endl;
  }
}
```
{% endraw %}

This program produces the following output:

{% raw %}
```
f =
cons(x[0][0] +x[0][1] +x[0][2] +x[0][3] == 2)
+cons(x[1][0] +x[1][1] +x[1][2] +x[1][3] == 3)
+cons(x[2][0] +x[2][1] +x[2][2] +x[2][3] == 2)
+cons(x[3][0] +x[3][1] +x[3][2] +x[3][3] == 2)
+cons(x[0][0] +x[1][0] +x[2][0] +x[3][0] == 2)
+cons(x[0][1] +x[1][1] +x[2][1] +x[3][1] == 3)
+cons(x[0][2] +x[1][2] +x[2][2] +x[3][2] == 2)
+cons(x[0][3] +x[1][3] +x[2][3] +x[3][3] == 2)
g =
cons(x[0][0] +x[0][2] +x[0][3] == 2)
+cons(x[1][1] +x[1][2] +x[1][3] == 3)
+cons(x[2][0] +x[2][1] +x[2][2] +x[2][3] == 2)
+cons(1 +x[3][0] +x[3][1] +x[3][2] == 2)
+cons(x[0][0] +x[2][0] +x[3][0] == 2)
+cons(x[1][1] +x[2][1] +x[3][1] == 3)
+cons(x[0][2] +x[1][2] +x[2][2] +x[3][2] == 2)
+cons(1 +x[0][3] +x[1][3] +x[2][3] == 2)
x = {{1,0,1,0},{0,1,1,1},{1,1,0,0},{0,1,0,1}}
g =
cons(x[0][2] +x[0][3] == 2)
+cons(x[1][0] +x[1][1] +x[1][2] +x[1][3] == 3)
+cons(x[2][0] +x[2][1] +x[2][2] +x[2][3] == 2)
+cons(1 +x[3][0] +x[3][1] +x[3][2] == 2)
+cons(x[1][0] +x[2][0] +x[3][0] == 2)
+cons(x[1][1] +x[2][1] +x[3][1] == 3)
+cons(x[0][2] +x[1][2] +x[2][2] +x[3][2] == 2)
+cons(1 +x[0][3] +x[1][3] +x[2][3] == 2)
x = {{0,0,1,1},{1,1,1,0},{1,1,0,0},{0,1,0,1}}
```
{% endraw %}

All 16 variables appear in `f`.
After `qbpp::replace`, the terms of the variables fixed to $0$ disappear, and `x[3][3]`, fixed to $1$, becomes the constant `1`.

The fixed variables do not appear in `g`, so the solver's solution `sol` does not contain them either.
`qbpp::Sol(f).set(sol, ml)` restores a solution that has all the variables of the original expression `f`, from which the whole matrix `x` is read (see [Replace Functions](REPLACE)).

The second problem is created just by replacing with the map list `ml2`, without rebuilding `f`.

## Method 2: Building from an Expression Array with Constants Assigned

In Method 2, the variable array `x` is copied into an expression array `y`, constants are assigned to the known cells, and the constraints are built from `y`:

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto R = qbpp::array({2, 3, 2, 2});
  auto C = qbpp::array({2, 3, 2, 2});
  auto x = qbpp::var("x", 4, 4);
  auto y = qbpp::expr(4, 4);
  y += x;
  y[0][1] = 0;
  y[1][0] = 0;
  y[3][3] = 1;
  std::cout << "y = " << y << std::endl;

  auto f = qbpp::cons(qbpp::vector_sum(y, 1) == R) +
           qbpp::cons(qbpp::vector_sum(y, 0) == C);
  f.simplify_as_binary();
  std::cout << "f =" << std::endl << f << std::endl;

  auto sol = qbpp::ExhaustiveSolver(f).search();
  std::cout << "x = " << sol(y) << std::endl;
}
```
{% endraw %}

`qbpp::expr(4, 4)` is an expression array whose elements are all $0$; adding `x` to it gives an expression array `y` whose elements are the same variables as `x`.

This program produces the following output:

{% raw %}
```
y = {{x[0][0],0,x[0][2],x[0][3]},{0,x[1][1],x[1][2],x[1][3]},{x[2][0],x[2][1],x[2][2],x[2][3]},{x[3][0],x[3][1],x[3][2],1}}
f =
cons(x[0][0] +x[0][2] +x[0][3] == 2)
+cons(x[1][1] +x[1][2] +x[1][3] == 3)
+cons(x[2][0] +x[2][1] +x[2][2] +x[2][3] == 2)
+cons(1 +x[3][0] +x[3][1] +x[3][2] == 2)
+cons(x[0][0] +x[2][0] +x[3][0] == 2)
+cons(x[1][1] +x[2][1] +x[3][1] == 3)
+cons(x[0][2] +x[1][2] +x[2][2] +x[3][2] == 2)
+cons(1 +x[0][3] +x[1][3] +x[2][3] == 2)
x = {{1,0,1,0},{0,1,1,1},{1,1,0,0},{0,1,0,1}}
```
{% endraw %}

`f` is the same expression as `g` after the replacement in Method 1.
The fixed parts are already constants when the expression is built.

Since `y` holds the fixed values as constants, `sol(y)` reads the whole matrix directly.
On the other hand, the fixed variables such as `x[0][1]` do not appear in `f`, so reading them with `sol(x)` causes an error (see [Solutions](QR_SOLUTION)).

## Comparing the Two Methods

| | Method 1: replace | Method 2: constants in an expression array |
|:---|:---|:---|
| Solving a problem with different fixed values | Keep `f` and replace with another map list | Rebuild the expression array and the expression |
| Size of the expression built | Build the expression with all variables, including the fixed ones, then shrink it | Build the small, fixed expression from the start |
| Reading the solution | Restore the full solution with `qbpp::Sol(f).set(sol, ml)` | Read directly with `sol(y)`, including the fixed values |

To solve many problems that differ only in the fixed values, Method 1 is convenient because the expression is built only once.

When many variables are fixed, Method 2 takes less time and memory to build the expression,
because Method 1 first builds a large expression that includes the fixed variables.

Note that if fixing makes some variables cancel out of the expression, `sol(y)` in Method 2 cannot read those elements and causes an error.
With `qbpp::Sol(f).set(sol, ml)` in Method 1, such variables are set to $0$.

### Expressions with Negated Literals

If the expression uses negated literals `~x[i]`, both methods need care:

- **Method 1**: `qbpp::replace` treats `x[i]` and `~x[i]` as different keys.
  If `simplify_as_binary()` is called before replacing, `~x[i]` in terms of degree 2 or less is expanded into `1 - x[i]`, so `x[i]` alone suffices as the key.
  Negated literals in terms of degree 3 or more remain unexpanded; in that case, add `~x[i]` to the keys as well.
- **Method 2**: `~` can only be applied to variables, so build the negated expression array separately from `~x` and assign the opposite value ($0$ for $1$) at the same positions.

In both methods, forgetting one of them causes no error; it silently leaves the variables that should have been fixed in the expression.

## Sentinels: Placing Constants Outside an Array

In an expression that looks at pairs of adjacent elements, the elements at the ends of the array have a neighbor on only one side.
Placing fixed values (sentinels) outside the array lets the end elements be handled by the same expression as the inner ones.
Sentinels are also fixed values, so they can be placed by the same two methods.

As an example, we solve the **maximum subarray problem**:
choose one contiguous interval of a sequence of integers $w_0, \ldots, w_{n-1}$ that maximizes the sum.
Let $x_i = 1$ mean that $w_i$ is chosen. For the sequence with sentinels $0$ at both ends,

$$
(y_0, y_1, \ldots, y_n, y_{n+1}) = (0, x_0, \ldots, x_{n-1}, 0),
$$

let

$$
t = \sum_{i=0}^{n} (y_i - y_{i+1})^2.
$$

Each term is $1$ only when two adjacent values differ, so $t$ is the number of boundaries between 0 and 1.
Since both ends are $0$, a single block of 1s has exactly two boundaries.
Therefore, it suffices to maximize $\sum_i w_i x_i$ under the constraint $t = 2$.
Without the sentinels, $x_0$ and $x_{n-1}$ would have to be added separately to count the boundaries of a block at an end.

For $w = (-2, 1, -3, 4, -1, 2, 1, -5, 4)$, the answer is the interval $(4, -1, 2, 1)$ with sum $6$.

### Method 1: Variables for the Sentinels Fixed with replace

In Method 1, a variable array `z` of length $n+2$ including the sentinels is prepared, and both ends `z[0]` and `z[n + 1]` are fixed to $0$:

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto w = qbpp::array({-2, 1, -3, 4, -1, 2, 1, -5, 4});
  const size_t n = w.size();
  auto z = qbpp::var("z", n + 2);
  auto x = z(qbpp::slice(1, n + 1));

  qbpp::Expr t = 0;
  for (size_t i = 0; i <= n; ++i) t += qbpp::sqr(z[i] - z[i + 1]);
  auto f = -qbpp::sum(w * x) + 10 * qbpp::cons(t == 2);

  qbpp::MapList ml({{z[0], 0}, {z[n + 1], 0}});
  auto g = qbpp::replace(f, ml);
  g.simplify_as_binary();

  auto sol = qbpp::ExhaustiveSolver(g).search();
  auto full_sol = qbpp::Sol(f).set(sol, ml);
  std::cout << "sum = " << -sol.energy() << std::endl;
  std::cout << "x = " << full_sol(x) << std::endl;
}
```
{% endraw %}

This program produces the following output:

{% raw %}
```
sum = 6
x = {0,0,0,1,1,1,1,0,0}
```
{% endraw %}

The variable for $x_i$ is `z[i + 1]`; the index is shifted by one.
To multiply by `w` of length $n$, the inner part `x = z(qbpp::slice(1, n + 1))` must be extracted.
The sentinels `z[0]` and `z[n + 1]` are not in the solution, so the full solution is restored with `qbpp::Sol(f).set(sol, ml)` before reading the inner part `x`.

### Method 2: An Expression Array Including the Sentinels

In Method 2, an expression array `y` is built by concatenating the constant `0` to both ends of the variable array `x`:

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto w = qbpp::array({-2, 1, -3, 4, -1, 2, 1, -5, 4});
  const size_t n = w.size();
  auto x = qbpp::var("x", n);
  auto y = qbpp::concat(0, qbpp::concat(x, 0));
  std::cout << "y = " << y << std::endl;

  qbpp::Expr t = 0;
  for (size_t i = 0; i <= n; ++i) t += qbpp::sqr(y[i] - y[i + 1]);
  auto f = -qbpp::sum(w * x) + 10 * qbpp::cons(t == 2);
  f.simplify_as_binary();

  auto sol = qbpp::ExhaustiveSolver(f).search();
  std::cout << "sum = " << -sol.energy() << std::endl;
  std::cout << "x = " << sol(x) << std::endl;
}
```
{% endraw %}

This program produces the following output:

{% raw %}
```
y = {0,x[0],x[1],x[2],x[3],x[4],x[5],x[6],x[7],x[8],0}
sum = 6
x = {0,0,0,1,1,1,1,0,0}
```
{% endraw %}

The indices of the variable array `x` are the same as those of $x_i$.
`w * x` can be written directly, and the solution is read with `sol(x)`.
The sentinels exist only in the expression array `y` and are treated as constants when the expression is built.

### Comparing the Two Methods for Sentinels

| | Method 1: replace | Method 2: expression array |
|:---|:---|:---|
| Variable indices | Shifted by the sentinels ($x_i$ is `z[i + 1]`) | Same as $x_i$ |
| Operations with data | Extract the inner part before multiplying | Write `w * x` directly |
| Reading the solution | Restore with `qbpp::Sol(f).set(sol, ml)` and read the inner part | Read directly with `sol(x)` |

Since the sentinels are only at the ends of the array, the size of the expression is almost the same in both methods.
For placing sentinels, Method 2 is easier to write because the indices do not shift and the data and the solution can be used as they are.

The [halftoning](HALFTONING) program places zero sentinels around a 2-D image using Method 2.
