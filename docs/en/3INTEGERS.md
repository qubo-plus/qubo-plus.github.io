---
last_modified: 2026-10-10
layout: default
nav_exclude: true
title: "Find Three Integers"
nav_order: 5
lang: en
hreflang_alt: "ja/3INTEGERS"
hreflang_lang: "ja"
---

# Math Problem: Find Three Integers

The following math problem can be solved using QUBO++.

### Problem
Find integers $x$, $y$, $z$ that satisfy:

$$
\begin{aligned}
\frac{1}{x}+\frac{1}{y}+\frac{1}{z} = 1\\
1 < x < y < z
\end{aligned}
$$



### QUBO++ program

Since QUBO++ can handle polynomial expressions, we first rewrite the constraints.
Multiplying both sides of the first constraint by $xyz$ yields:

$$
xy+yz+zx - xyz = 0
$$

The strict inequalities $x<y<z$ can be encoded as

$$
\begin{aligned}
1 &\leq y-x \\
1 &\leq z-y
\end{aligned}
$$

The following QUBO++ program makes $x$, $y$, and $z$ [native integer variables](NATIVE_INTEGER), declares these expressions as constraints with [`qbpp::cons()`](CONSTRAINTS), and solves the problem using the Exhaustive Solver:

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto x = 1 <= qbpp::int_var("x") <= 10;
  auto y = 1 <= qbpp::int_var("y") <= 10;
  auto z = 1 <= qbpp::int_var("z") <= 10;

  auto c1 = qbpp::cons(x * y + y * z + z * x - x * y * z == 0);
  auto c2 = qbpp::cons(y - x >= 1);
  auto c3 = qbpp::cons(z - y >= 1);

  auto f = c1 + c2 + c3;
  f.simplify_as_binary();
  auto solver = qbpp::ExhaustiveSolver(f);
  auto sols = solver.search({{"best_energy_sols", 0}});

  for (const auto& sol : sols) {
    std::cout << "(x,y,z) = (" << x(sol) << ", " << y(sol) << ", " << z(sol)
              << ")" << std::endl;
  }
}
```
{% endraw %}
The three constraints are declared as `c1`, `c2`, and `c3`, and combined into a single expression `f`.
The energy of `f` is the sum of the squared violations of the constraints, and it is 0 only when all the constraints are satisfied.
The Exhaustive Solver examines all $10^3$ combinations of $x$, $y$, and $z$, and returns all solutions with the minimum energy.

Because `x`, `y`, and `z` are handled as integers and the inequalities introduce no auxiliary variables, the same $(x,y,z)$ is never returned more than once.

This program produces the following output:
```
(x,y,z) = (2, 3, 6)
```
This indicates that the problem has exactly one solution in the searched range, namely $(x,y,z)=(2,3,6)$.
