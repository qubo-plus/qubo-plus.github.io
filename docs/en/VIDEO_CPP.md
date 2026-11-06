---
last_modified: 2026-10-26
layout: default
nav_exclude: true
title: "Video: QUBO++ in C++"
description: "The points of each chapter of the video \"QUBO++ in C++\", with the programs shown in it and their output."
lang: en
hreflang_alt: "ja/VIDEO_CPP"
hreflang_lang: "ja"
video: cpp
---

# Video: QUBO++ in C++

A companion to the video "QUBO++ in C++".
For each chapter it gives the main points, the programs shown in the video with their output, and links to the pages that explain more.
Click "▶ Play the video from …" to play from that scene.
Programs that the video shows in part are given here in full, ready to run.

{% include video_embed.html slug="cpp" %}

What the video covers:

- How the C++ and Python versions relate (the same library and the same solvers), and the same program side by side
- Compiling and running with `g++`, a table of common constructs, and choosing the coefficient and energy types with a macro
- The types of variables, terms, expressions and arrays, the `auto` pitfall, and mistakes that type checks catch at compile time
- The warning for decimal coefficients, and whether assignment copies
- How fast loops build expressions (plain loops and loops with branches), and which one to choose

Back to the list of [Videos (Tutorials)](VIDEOS)

## C++ and Python

### The same library and the same solvers

{% include video_seek.html t="2:00" %}

QUBO++ comes in two versions, C++ and Python.

| | C++ (QUBO++) | Python (PyQBPP) |
|---|---|---|
| Install | `sudo apt install qbpp` | `pip install pyqbpp` |
| Start | `#include <qbpp/qbpp.hpp>` | `import pyqbpp as qbpp` |
| Run | compile with `g++` → `./test` | `python3 test.py` |

Inside, both use the same library and the same solvers (EasySolver, ABS3Solver and so on), so solving is equally fast.
Both run on Linux computers, on amd64 and on arm64.
What differs is the speed of building expressions, and the code.

See [Installation](INSTALL) and [C++ vs Python](CPP_VS_PYTHON) for more.

### The same program side by side

{% include video_seek.html t="3:19" %}

With three variables a, b, c, the program builds the expression f = $(a+2b+3c-4)^2$ and looks for the solution that minimizes f with EasySolver.
In C++ you `#include` the header files and write the program inside the `main` function.
Variables are declared with `auto`, and statements end with a semicolon.
Solver parameters are passed as name-value pairs in braces.

{% raw %}
```cpp
#include <qbpp/easy_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto a = qbpp::var("a");
  auto b = qbpp::var("b");
  auto c = qbpp::var("c");
  auto f = qbpp::sqr(a + 2 * b + 3 * c - 4);
  f.simplify_as_binary();
  std::cout << "f = " << f << std::endl;
  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"time_limit", 10}, {"target_energy", 0}});
  std::cout << "sol = " << sol << std::endl;
}
```
{% endraw %}

Output:

{% raw %}
```
f = 16 -7*a -12*b -15*c +4*a*b +6*a*c +12*b*c
sol = 0:{{a,1},{b,0},{c,1}}
```
{% endraw %}

The same in Python:

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
f = qbpp.sqr(a + 2 * b + 3 * c - 4)
f.simplify_as_binary()
print("f =", f)
solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=10, target_energy=0)
print("sol =", sol)
```

Output:

```
f = 16 -7*a -12*b -15*c +4*a*b +6*a*c +12*b*c
sol = Sol(energy=0, {a: 1, b: 0, c: 1})
```

The expanded f is exactly the same.
The solutions are printed differently but are the same (a is 1, b is 0, c is 1, and the energy is 0).
C++ prints the energy first, then the pairs of variable and value in braces.

## Compiling and running

{% include video_seek.html t="5:46" %}

A C++ program is compiled with `g++` before it runs.
With the C++ program above saved as `test.cpp`:

```bash
g++ test.cpp -o test -std=c++17 -Wfloat-conversion -ldl -pthread
./test
```

Output:

{% raw %}
```
f = 16 -7*a -12*b -15*c +4*a*b +6*a*c +12*b*c
sol = 0:{{a,1},{b,0},{c,1}}
```
{% endraw %}

| Option | Meaning |
|---|---|
| `-o test` | the name of the executable |
| `-std=c++17` | compile with the C++17 standard |
| `-Wfloat-conversion` | warn when a decimal is truncated to an integer ([Decimal coefficients](#decimal-coefficients)) |
| `-ldl -pthread` | needed to load the QUBO++ library |

After every change to the program, compile it again.
If you run it without compiling again, the program before the change runs.
Python has no compile step, so you change it and run it right away.

See [Quick Start](QUICK) for more.

## How the code differs

### Common constructs

{% include video_seek.html t="7:40" %}

{% raw %}
| | C++ | Python |
|---|---|---|
| Array of variables | `auto x = qbpp::var("x", 3, 4);` | `x = qbpp.var("x", shape=(3, 4))` |
| Integer variable | `auto n = 0 <= qbpp::int_var("n") <= 10;` | `n = qbpp.var("n", integer=(0, 10))` |
| Range constraint | `qbpp::cons(1 <= f <= 5)` | `qbpp.cons(f, between=(1, 5))` |
| Row sums | `qbpp::vector_sum(x, 1)` | `qbpp.vector_sum(x, axis=1)` |
| Search | `solver.search({{"time_limit", 10}})` | `solver.search(time_limit=10)` |
| Printing | `std::cout << f << std::endl;` | `print(f)` |
| einsum | `qbpp::einsum<0>("i,i->", w, x)` | `qbpp.einsum("i,i->", w, x)` |
{% endraw %}

- In C++, a range constraint is written as math, as in `1 <= f <= 5`.
  In Python, `1 <= f <= 5` can only give a truth value (`True` or `False`), not an expression, so QUBO++ makes it an error on purpose. Python uses `between=`.
- The axis that `vector_sum` sums along is the second argument in C++ and `axis=` in Python.
- In C++, `einsum` takes the output dimension in angle brackets. Nothing after the arrow means 0 dimensions (one value), so it is `<0>`.

```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto w = qbpp::array({1, 2, 3});
  auto x = qbpp::var("x", 3);
  auto f = qbpp::einsum<0>("i,i->", w, x);
  std::cout << f << std::endl;
}
```

Output:

```
x[0] +2*x[1] +3*x[2]
```

Loops are fast enough in C++, so einsum is rarely needed.

See [C++ vs Python](CPP_VS_PYTHON), [Range Constraints](RANGE) and [Einsum Function](EINSUM) for more.

### Coefficient and energy types

{% include video_seek.html t="9:43" %}

The Python version chose the types with the module you import; the C++ version chooses them with a macro.
`#define` the macro before you `#include` the header. The header reads the macro to choose the types, so the order matters.
With `INTEGER_TYPE_C64E64` the coefficients are 64-bit too, so a coefficient beyond 32 bits can be written.

```cpp
#define INTEGER_TYPE_C64E64
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto f = 3000000000 * x;
  std::cout << f << std::endl;
}
```

Output:

```
3000000000*x
```

You can also give the macro with the `-D` option when compiling. This way you change the types without editing the source file.

```bash
g++ test.cpp -DINTEGER_TYPE_C64E64 -o test -std=c++17 -Wfloat-conversion -ldl -pthread
```

| C++ macro | Python import |
|---|---|
| `INTEGER_TYPE_C64E64` | `import pyqbpp.c64e64` |
| `INTEGER_TYPE_CPP_INT` | `import pyqbpp.cppint` |
| `DOUBLE_TYPE` | `import pyqbpp.d` |
| `MAXDEG2` | `import pyqbpp.c32e64m2` |

With no macro you get the default types: 32-bit coefficients and 64-bit energies, the same as the Python default.

With cppint, a constant beyond 64 bits is passed to `qbpp::coeff_t` as a string.
A C++ integer constant is usually at most 64 bits, so a 30-digit number cannot be written as digits.

```cpp
#define INTEGER_TYPE_CPP_INT
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto f = x * qbpp::coeff_t("123456789012345678901234567890");
  std::cout << f << std::endl;
}
```

Output:

```
123456789012345678901234567890*x
```

The types are fixed when compiling, so after you change the types, compile the program again.

See [Variable and Expression Classes](VAREXPR) for more.

## Types

### Variables, terms and expressions

{% include video_seek.html t="11:48" %}

In C++, variables, terms and expressions are separate types: `qbpp::Var`, `qbpp::Term` and `qbpp::Expr`.
With `auto`, the left side takes the type of the right side.

```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto a = qbpp::var("a");  // qbpp::Var (variable)
  auto t = 2 * a;           // qbpp::Term (term)
  auto g = t + 1;           // qbpp::Expr (expression)
  std::cout << "t = " << t << std::endl;
  std::cout << "g = " << g << std::endl;
}
```

Output:

```
t = 2*a
g = 1 +2*a
```

With `auto f = 0;`, the 0 on the right is an integer, so f becomes an `int`.
There is no operation that adds a `qbpp::Var` to an `int`, so the following program is a compile error.

```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto f = 0;
  f += x;
  std::cout << f << std::endl;
}
```

Compiler output (the first part):

```
c2_auto.cpp: In function ‘int main()’:
c2_auto.cpp:6:5: error: no match for ‘operator+=’ (operand types are ‘int’ and ‘qbpp::Var’)
    6 |   f += x;
      |   ~~^~~~
```

To add up an expression, write the type `qbpp::Expr` and start from 0.

```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  qbpp::Expr f = 0;
  f += x;
  f += 1;
  std::cout << f << std::endl;
}
```

Output:

```
1 +x
```

In Python you could add up from 0 without minding the type; in C++, start an expression you add up with the type `qbpp::Expr`.

See [Variable and Expression Classes](VAREXPR) for more.

### Array types

{% include video_seek.html t="13:25" %}

In C++, the type of an array is `qbpp::Array<dimension, element type>`.

| Expression | Type | |
|---|---|---|
| `qbpp::var("x", 3, 4)` | `qbpp::Array<2, qbpp::Var>` | 2-D array of variables |
| `x + 1` | `qbpp::Array<2, qbpp::Expr>` | 2-D array of expressions |
| `qbpp::vector_sum(x, 1)` | `qbpp::Array<1, qbpp::Expr>` | 1-D array of expressions |

```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 3, 4);    // qbpp::Array<2, qbpp::Var>
  auto e = x + 1;                   // qbpp::Array<2, qbpp::Expr>
  auto s = qbpp::vector_sum(x, 1);  // qbpp::Array<1, qbpp::Expr>
  std::cout << "e[0] = " << e[0] << std::endl;
  std::cout << "s = " << s << std::endl;
}
```

Output:

```
e[0] = {1 +x[0][0],1 +x[0][1],1 +x[0][2],1 +x[0][3]}
s = {x[0][0] +x[0][1] +x[0][2] +x[0][3],x[1][0] +x[1][1] +x[1][2] +x[1][3],x[2][0] +x[2][1] +x[2][2] +x[2][3]}
```

A different dimension or element type is a different type, and cannot be assigned.
Assigning the 1-D array of expressions s to the 2-D array of variables x is a compile error.

```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 3, 4);
  auto s = qbpp::vector_sum(x, 1);
  x = s;  // wrong: 1-D expressions into 2-D variables
  std::cout << x << std::endl;
}
```

Compiler output (the first part):

```
c3_assign.cpp: In function ‘int main()’:
c3_assign.cpp:6:7: error: no match for ‘operator=’ (operand types are ‘qbpp::Array<2, qbpp::Var>’ and ‘qbpp::Array<1, qbpp::Expr>’)
    6 |   x = s;  // wrong: 1-D expressions into 2-D variables
      |       ^
```

In Python, the same `x = s` is not an error. Assignment in Python rebinds the name, so the name x now refers to the array of 3 expressions.
In C++, each name has a type, and something of a different type does not fit.

See [Multi-dimensional Integers, Variables, and Expressions](MULTIDIM) for more.

## Type checks

### Python runs silently

{% include video_seek.html t="15:03" %}

The function `onehot` is meant to make the constraint that exactly one element of a 1-D array v is 1.
We meant to make one constraint for each row of the 3 × 4 array x, but passed the 2-D x by mistake. In Python this is not an error.
`qbpp.sum` adds all 12 elements, so we get one constraint: exactly one 1 among all 12.

```python
import pyqbpp as qbpp

# exactly one element of v is 1
def onehot(v):
    return qbpp.cons(qbpp.sum(v) == 1)

x = qbpp.var("x", shape=(3, 4))
f = onehot(x)  # wrong: x is 2-D
sol = qbpp.ExhaustiveSolver(f).search()
print(sol(x))
```

Output:

```
[[1, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]
```

Only the first row has a 1: a wrong answer. With no error and no warning, you notice only by looking closely at the answer.

### C++ catches it at compile time

{% include video_seek.html t="16:42" %}

In C++, the arguments of a function have types. The argument v is a 1-D array of variables (`const` and `&` take the array without copying it).
Passing the 2-D x as it is does not match the type, so it is a compile error, and no executable is made.

```cpp
#include <qbpp/qbpp.hpp>

// exactly one element of v is 1
qbpp::Expr onehot(const qbpp::Array<1, qbpp::Var>& v) {
  return qbpp::cons(qbpp::sum(v) == 1);
}

int main() {
  auto x = qbpp::var("x", 3, 4);
  qbpp::Expr f = 0;
  f += onehot(x);  // wrong: x is 2-D
  std::cout << f << std::endl;
}
```

Compiler output:

```
c3_onehot.cpp: In function ‘int main()’:
c3_onehot.cpp:11:15: error: invalid initialization of reference of type ‘const qbpp::Array<1, qbpp::Var>&’ from expression of type ‘qbpp::Array<2, qbpp::Var>’
   11 |   f += onehot(x);  // wrong: x is 2-D
      |               ^
c3_onehot.cpp:4:52: note: in passing argument 1 of ‘qbpp::Expr onehot(const qbpp::Array<1, qbpp::Var>&)’
    4 | qbpp::Expr onehot(const qbpp::Array<1, qbpp::Var>& v) {
      |                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^
```

The right way is to pass x one row at a time. `x[i]` is row i of x, a 1-D array of variables, so the types match.

{% raw %}
```cpp
#include <qbpp/exhaustive_solver.hpp>
#include <qbpp/qbpp.hpp>

// exactly one element of v is 1
qbpp::Expr onehot(const qbpp::Array<1, qbpp::Var>& v) {
  return qbpp::cons(qbpp::sum(v) == 1);
}

int main() {
  auto x = qbpp::var("x", 3, 4);
  qbpp::Expr f = 0;
  for (size_t i = 0; i < 3; ++i) f += onehot(x[i]);
  auto sol = qbpp::ExhaustiveSolver(f).search();
  std::cout << sol(x) << std::endl;
}
```
{% endraw %}

Output:

{% raw %}
```
{{1,0,0,0},{0,0,0,1},{1,0,0,0}}
```
{% endraw %}

Every row now has exactly one 1. In C++, type checks reveal obvious mistakes at compile time.

### Decimal coefficients

{% include video_seek.html t="18:16" %}

With integer coefficients, writing `3.5 * x` in C++ silently truncates 3.5 to 3.

```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto f = 3.5 * x;
  std::cout << f << std::endl;
}
```

Output:

```
3*x
```

Compiling with `-Wfloat-conversion` gives this warning. It is only a warning, so the executable is made and runs.
It shows where the decimal was written, so it is safe to always use it.

```
c4_float.cpp: In function ‘int main()’:
c4_float.cpp:5:12: warning: conversion from ‘double’ to ‘qbpp::coeff_t’ {aka ‘int’} changes value from ‘3.5e+0’ to ‘3’ [-Wfloat-conversion]
    5 |   auto f = 3.5 * x;
      |            ^~~
```

In Python, the same program stops at that line with a TypeError when it runs.

```python
import pyqbpp as qbpp

x = qbpp.var("x")
f = 3.5 * x
print(f)
```

Output:

```
Traceback (most recent call last):
  File "c4_float.py", line 4, in <module>
    f = 3.5 * x
        ~~~~^~~
TypeError: unsupported operand type(s) for *: 'float' and 'pyqbpp_nb._nb_c32e64m0.Var'
```

For decimal coefficients, use `DOUBLE_TYPE` in C++ and `pyqbpp.d` in Python.

See [Variable and Expression Classes](VAREXPR) for more.

## Copies

{% include video_seek.html t="19:44" %}

In C++, `g = f` copies the expression. Adding y to f afterwards does not change g.

```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto y = qbpp::var("y");
  qbpp::Expr f = x + 1;
  qbpp::Expr g = f;
  f += y;
  std::cout << "f = " << f << std::endl;
  std::cout << "g = " << g << std::endl;
}
```

Output:

```
f = 1 +x +y
g = 1 +x
```

In Python, after `g = f`, g and f refer to the same object (assignment rebinds the name). So adding y to f changes g too.

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = x + 1
g = f
f += y
print("f =", f)
print("g =", g)
```

Output:

```
f = 1 +x +y
g = 1 +x +y
```

To make a separate one in Python, copy it with `qbpp.Expr(f)`.

```python
import pyqbpp as qbpp

x = qbpp.var("x")
y = qbpp.var("y")
f = x + 1
g = qbpp.Expr(f)  # a copy
f += y
print("f =", f)
print("g =", g)
```

Output:

```
f = 1 +x +y
g = 1 +x
```

See [Variable and Expression Classes](VAREXPR) for more.

## Loop speed

### A plain loop

{% include video_seek.html t="20:57" %}

The tour length of the 9-node traveling salesman problem is built in a triple loop. The inner line runs $9^3 = 729$ times.
In Python this triple loop is slow, so it was rewritten as one line of `einsum`; in C++ you can keep the loop.

{% raw %}
```cpp
#include <cmath>
#include <qbpp/easy_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  // the coordinates of the 9 nodes
  std::vector<std::pair<int, int>> nodes = {
      {10, 12}, {33, 125}, {12, 226}, {121, 11}, {108, 142},
      {111, 243}, {220, 4}, {210, 113}, {211, 233}};
  int n = nodes.size();
  // d[i][j]: distance from node i to j
  std::vector<std::vector<int>> d(n, std::vector<int>(n));
  for (int i = 0; i < n; ++i)
    for (int j = 0; j < n; ++j)
      d[i][j] = std::lround(std::hypot(nodes[i].first - nodes[j].first,
                                       nodes[i].second - nodes[j].second));
  auto x = qbpp::var("x", n, n);
  qbpp::Expr length = 0;
  for (int k = 0; k < n; ++k)
    for (int i = 0; i < n; ++i)
      for (int j = 0; j < n; ++j)
        length += d[i][j] * x[k][i] * x[(k + 1) % n][j];
  auto f = length +
           1000 * qbpp::cons(qbpp::vector_sum(x, 1) == 1) +
           1000 * qbpp::cons(qbpp::vector_sum(x, 0) == 1);
  f.simplify_as_binary();
  auto sol = qbpp::EasySolver(f).search({{"target_energy", 959}});
  std::cout << "length = " << sol(length)
            << "  tour = " << qbpp::onehot_to_int(sol(x)) << std::endl;
}
```
{% endraw %}

The output in the video (the start and the direction of the tour change from run to run):

```
length = 959  tour = {1,4,2,5,8,7,6,3,0}
```

The tour is the order in which the nodes are visited. The length is always 959.

In a Python loop, each time the inner line runs, Python reads that line and calls the library, and this round trip repeats 729 times.
In a C++ loop the inner line also runs 729 times, but it is compiled into machine instructions and each run is light, so it builds expressions much faster.
With `einsum` there is one call and the repetition is inside the library, so for an expression over every pair like this, Python `einsum` is fast enough too.
For large problems, compiling with `-O2` makes it even faster.

See [TSP](TSP) for more.

### An expression with a branch

{% include video_seek.html t="22:41" %}

Each of 50 radio stations gets one of 4 frequencies. Two stations within distance R = 20 interfere if they use the same frequency.
The variable `x[i][c]` is 1 when station i gets frequency c.
Only for nearby pairs (the `if` inside the loop), a term that is 1 for the same frequency is added.
There are 111 nearby pairs, each giving one term per frequency, so there are $111 \times 4 = 444$ terms.

{% raw %}
```cpp
#include <cmath>
#include <qbpp/easy_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  int n = 50, K = 4;
  double R = 20;
  std::vector<double> px(n), py(n);  // station positions (in a 100 × 100 square)
  for (int i = 0; i < n; ++i) {
    px[i] = 100 * std::fmod(i * 0.7548776662, 1.0);
    py[i] = 100 * std::fmod(i * 0.5698402910, 1.0);
  }
  auto x = qbpp::var("x", n, K);  // x[i][c] = 1: station i, frequency c
  qbpp::Expr f = 0;
  for (int i = 0; i < n; ++i)
    for (int j = i + 1; j < n; ++j)
      if (std::hypot(px[i] - px[j], py[i] - py[j]) <= R)  // nearby only
        for (int c = 0; c < K; ++c) f += x[i][c] * x[j][c];
  f += 100 * qbpp::cons(qbpp::vector_sum(x, 1) == 1);
  f.simplify_as_binary();
  auto sol = qbpp::EasySolver(f).search({{"target_energy", 0}});
  std::cout << "terms = " << f.term_count() << "  conflicts = " << sol(f) << std::endl;
}
```
{% endraw %}

Output:

```
terms = 444  conflicts = 0
```

The constraint that each station gets exactly one frequency is added with `qbpp::cons`. Solved, there is no interference.

See [Graph Coloring](GRAPH_COLOR) for more.

### In Python

{% include video_seek.html t="24:10" %}

There are two ways to build the same expression in Python.
One is a loop of the same shape as in C++. But with 50 stations, Python checks all 1,225 pairs one by one, so with many stations it gets very slow.

```python
import math
import pyqbpp as qbpp

n, K, R = 50, 4, 20
px = [100 * ((i * 0.7548776662) % 1.0) for i in range(n)]  # station positions
py = [100 * ((i * 0.5698402910) % 1.0) for i in range(n)]
x = qbpp.var("x", shape=(n, K))  # x[i][c] = 1: station i, frequency c
f = 0
for i in range(n):
    for j in range(i + 1, n):
        if math.hypot(px[i] - px[j], py[i] - py[j]) <= R:  # nearby only
            for c in range(K):
                f += x[i][c] * x[j][c]
f += 100 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
f.simplify_as_binary()
sol = qbpp.EasySolver(f).search(target_energy=0)
print("terms =", f.term_count(), " conflicts =", sol(f))
```

Output:

```
terms = 444  conflicts = 0
```

The other is a trick with einsum: build with NumPy an n × n table A that is 1 only for nearby pairs, and multiply it with x by `einsum`.
The table has 50 × 50 = 2,500 cells and only the 111 nearby pairs are 1, but every cell is multiplied, even those that give no term, so with many stations it is slow as well.

```python
import numpy as np
import pyqbpp as qbpp

n, K, R = 50, 4, 20
i = np.arange(n)
px = 100 * ((i * 0.7548776662) % 1.0)  # station positions
py = 100 * ((i * 0.5698402910) % 1.0)
dist = np.hypot(px[:, None] - px[None, :], py[:, None] - py[None, :])
A = np.triu(dist <= R, k=1).astype(int)  # n × n table, 1 only for nearby pairs (i < j)
x = qbpp.var("x", shape=(n, K))
f = qbpp.einsum("ij,ic,jc->", qbpp.array(A.tolist()), x, x)
f += 100 * qbpp.cons(qbpp.vector_sum(x, axis=1) == 1)
f.simplify_as_binary()
sol = qbpp.EasySolver(f).search(target_energy=0)
print("terms =", f.term_count(), " conflicts =", sol(f))
```

Output:

```
terms = 444  conflicts = 0
```

Both build the same expression.
A C++ loop is compiled, so even checking the pairs is light, and it makes terms only for the 111 nearby pairs.
For an expression with branches, a plain C++ loop is faster than either of them.

See [Einsum Function](EINSUM) for more.

## Which to choose

### When each one fits

{% include video_seek.html t="25:43" %}

| C++ fits when | Python fits when |
|---|---|
| the problem is large and building the expression takes long (plain loops are fast as they are) | you want to try things as you go (interactively, e.g. in Jupyter) |
| the loops that build the expression contain branches (terms only for nearby pairs, chosen with `if`) | you handle data with NumPy, pandas and so on (from preparing data to analyzing solutions) |
| you want to build it into a C++ application | you also want external solvers used from Python (some work only from Python) |
| you want type checks to catch mistakes early (a compile error) | you want to start right away (`pip` install, no compiling) |

Both use the same library and solvers inside, so solving is equally fast. What differs is how fast expressions are built, and the code.

### Pros and cons of C++

{% include video_seek.html t="27:28" %}

| Pros | Cons |
|---|---|
| builds expressions fast with plain loops | every change needs compiling |
| fast even with branches | more boilerplate, such as `#include` and `main()` |
| type checks at compile time catch obvious mistakes | you must mind the types: variables, terms, expressions, dimensions |
| range constraints read like math: `1 <= f <= 5` | some external solvers available from Python are not available |
| fits into C++ programs | installing with `apt` needs `sudo` |

Both have good points. To begin with, pick whichever is easier for you to start with.

## Summary

{% include video_seek.html t="29:00" %}

- QUBO++ works from C++ and from Python, with the same solvers.
- In C++, you `#include` the header file and write the program inside the `main` function. You compile it with `g++` and run it, and after changing the program you compile it again.
- The coefficient and energy types are chosen with a macro: `#define` a macro such as `INTEGER_TYPE_C64E64` before the `#include`. With no macro, coefficients are 32-bit and energies 64-bit integers.
- A variable that collects terms is declared with the expression type, as in `qbpp::Expr f = 0;`. With `auto`, a variable starting from 0 becomes an `int`.
- The type of an array is set by its dimension and its element type, as in `qbpp::Array<1, qbpp::Var>`. A mismatch is a compile error, so obvious mistakes are found before running.
- In C++, plain loops, even with branches, build expressions fast. Unlike in Python, you do not need to rewrite loops into `einsum`.
- Choose by the size of the problem and how you use it.
