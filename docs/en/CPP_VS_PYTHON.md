---
layout: default
title: "C++ vs Python"
nav_order: 3
lang: en
hreflang_alt: "ja/CPP_VS_PYTHON"
hreflang_lang: "ja"
mode_shared: true
---

# QUBO++ (C++) vs PyQBPP (Python)

QUBO++ is available in two languages: **C++ (QUBO++)** and **Python (PyQBPP)**.
Both provide the same core functionality for formulating and solving QUBO/HUBO problems.
This page summarizes the key differences between the two.

## Installation

| | C++ (QUBO++) | Python (PyQBPP) |
|---|---|---|
| **Command** | `sudo apt install qbpp` | `pip install pyqbpp` |
| **Platform** | Linux (amd64 / arm64) | Linux (amd64 / arm64) |
| **Details** | [Installation](INSTALL) | [Installation](python/INSTALL) |

## Coefficient and Energy Precision

In C++, the coefficient type (`coeff_t`) and energy type (`energy_t`) are fixed at compile time.
The default types are `int32_t` and `int64_t`, which may overflow for problems with large coefficients.
To use arbitrary-precision integers, define `INTEGER_TYPE_CPP_INT` before including the header:

```cpp
#define INTEGER_TYPE_CPP_INT
#include <qbpp/qbpp.hpp>
```

Alternatively, you can pass `-DINTEGER_TYPE_CPP_INT` as a compiler option.

In Python, **32-bit coefficients and 64-bit energy (`c32e64`) are used by default** (`import pyqbpp`).
For arbitrary precision, you can import the cppint submodule:

```python
import pyqbpp as qbpp              # Default: c32e64 (32-bit coeff, 64-bit energy)
import pyqbpp.cppint as qbpp       # Arbitrary precision (cpp_int)
```

Coefficients can also be **`double`**: in C++ define `DOUBLE_TYPE` (or `DOUBLE_TYPE_C128E128` for higher
precision); in Python `import pyqbpp.d` (or `pyqbpp.dc128e128`). The energy is then returned as a `double`.

| | C++ | Python |
|---|---|---|
| **Default coefficient** | `int32_t` (32-bit) | `int32_t` (32-bit) |
| **Default energy** | `int64_t` (64-bit) | `int64_t` (64-bit) |
| **Changing precision** | `#define INTEGER_TYPE_CPP_INT` etc. | `import pyqbpp.cppint` at import time |
| **Double coefficients** | `#define DOUBLE_TYPE` | `import pyqbpp.d` |
| **Details** | [C++ Data Types](VAREXPR) | [Python Data Types](python/VAREXPR) |

### Large Integer Constants

When working with problems involving large integer constants that exceed the range of `int64_t`,
the handling differs between C++ and Python.

**C++**: You must define `INTEGER_TYPE_CPP_INT` and write large constants as **strings**,
because C++ integer literals cannot exceed `int64_t`:

```cpp
#define INTEGER_TYPE_CPP_INT
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto f = x * qbpp::coeff_t("123456789012345678901234567890");
  std::cout << f << std::endl;
}
```

**Python**: For large integer constants beyond `int64_t`, import the `cppint` submodule
which uses `cpp_int` (arbitrary-precision integers):

```python
import pyqbpp.cppint as qbpp

x = qbpp.var("x")
f = x * 123456789012345678901234567890
print(f)
```

Both produce: `123456789012345678901234567890*x`

## Type Distinctions

In C++, there are distinct types for variables (`Var`), terms (`Term`), and expressions (`Expr`).
Although implicit conversions are provided (e.g., `Var` → `Term` → `Expr`),
understanding these types is important for reading and writing QUBO++ code.

In Python, **you do not need to be aware of these class distinctions**.
Dynamic typing handles conversions automatically, so you can mix variables, terms,
and expressions freely in arithmetic operations.

For example, in C++, writing `auto f = 2;` makes `f` an `int`, so `f += x;` causes a compile error.
You must explicitly create an `Expr`:

```cpp
auto x = qbpp::var("x");
auto f = qbpp::toExpr(2);  // Must be Expr, not int
f += x;                   // f is now Expr representing 2 + x
```

In Python, no such type awareness is needed:

```python
x = qbpp.var("x")
f = 2          # Just an int — no problem
f += x         # f automatically becomes an Expr representing 2 + x
```

## Object Copy and Aliasing

C++ uses **value semantics** by default, while Python uses **reference
semantics** for mutable types. This affects how `qbpp::Term`, `qbpp::Expr`,
and `qbpp::Sol` (the mutable types) behave when assigned to another variable.

### C++ — Independent Copy

```cpp
qbpp::Expr f = x;
qbpp::Expr g = f;   // independent copy
f += y;             // f only
std::cout << "f = " << f << std::endl;   // f = x +y
std::cout << "g = " << g << std::endl;   // g = x
```

`Expr g = f` deep-copies the data. Mutating `f` afterwards has no effect on `g`.

### Python — Alias by Default

```python
f = qbpp.expr() + x
g = f               # alias — same object
f += y              # mutates the shared object
print("f =", f)     # f = x +y
print("g =", g)     # g = x +y   (also changed)
```

`g = f` only binds the name `g` to the same object that `f` points to.
Mutating through one name is visible through both.

### Comparison Table

| Operation | C++ (QUBO++) | Python (PyQBPP) |
|---|---|---|
| `g = f` (new variable) | deep copy (independent) | alias (shared object) |
| `f += x` | in-place | in-place |
| `f = f + x` (lhs survives) | independent — same observable result as `f += x` | new Expr; **g (alias) unaffected** |
| Explicit copy | implicit (assignment copies) | `qbpp.Expr(other)` for deep copy |
| `Sol` copy | `qbpp::Sol s2 = s1;` (deep copy) | `qbpp.Sol(other_sol)` (deep copy) |
| Solver copy | **deleted** — compile error | not advised; copying breaks the resource handle |

### Practical Tip

In Python, treat any expression you want to keep around as **off-limits** to
compound assignment unless you intend every alias to see the change. In C++,
you can freely mix `f = f + x` and `f += x` interchangeably; the compiler
chooses the optimal path via rvalue overloads.

Solver objects (`EasySolver`, `ExhaustiveSolver`, `ABS3Solver`) own heavy
compute resources (GPU contexts, thread pools). In C++ they are **non-copyable**
by design — the copy constructor is deleted. In Python they should also not be
copied; create a new solver if needed.

## Syntax Differences

The following table shows the main syntax differences between C++ and Python.

| Feature | C++ (QUBO++) | Python (PyQBPP) |
|---|---|---|
| **Include / Import** | `#include <qbpp/qbpp.hpp>` | `import pyqbpp as qbpp` |
| **Solver include** | `#include <qbpp/easy_solver.hpp>` | Not required |
| **Variable** | `auto a = qbpp::var("a");` | `a = qbpp.var("a")` |
| **Variable array** | `auto x = qbpp::var("x", n);` | `x = qbpp.var("x", shape=n)` |
| **Integer variable** | `auto x = 0 <= qbpp::var_int("x") <= 10;` | `x = qbpp.var("x", between=(0, 10))` |
| **Explicit conversion to Expr** | `auto f = qbpp::toExpr(2);` | Not required |
| **Equality** | `auto f = (expr == 3);` | `f = qbpp.constrain(expr, equal=3)` |
| **Range constraint** | `auto f = (1 <= expr <= 5);` | `f = qbpp.constrain(expr, between=(1, 5))` |
| **Array slice** | `x(qbpp::slice(1, 3))`, `x(qbpp::all, j)` | `x[1:3]`, `x[:, j]` |
| **Array concat** | `qbpp::concat(a, b)` | `qbpp.concat([a, b])` |
| **Einsum (tensor contraction)** | `qbpp::einsum<2>("ij,jk->ik", A, B)` | `qbpp.einsum("ij,jk->ik", A, B)` |
| **Search with params** | `solver.search({% raw %}{{"time_limit", 10}, {"target_energy", 0}}{% endraw %})` | `solver.search(time_limit=10, target_energy=0)` |
| **Output** | `std::cout << sol << std::endl;` | `print(sol)` |

In C++, `einsum` requires the output dimension as a template argument (`<2>` in
the example above) because the result type `Array<Dim, T>` is parameterized by
`Dim` at compile time, while the subscript string is only inspected at runtime.
Python infers the output dimension automatically from the subscript. See
[Einsum Function](EINSUM) for details.

### Quick Start Example

The same problem solved in both languages (minimizing $f = (a + 2b + 3c - 4)^2$ with `EasySolver`):

**C++:**
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

**Python:**
```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
f = qbpp.sqr(a + 2 * b + 3 * c - 4)
f = qbpp.simplify_as_binary(f)
print("f =", f)

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=10, target_energy=0)
print("sol =", sol)
```

Output (C++):
{% raw %}
```
f = 16 -7*a -12*b -15*c +4*a*b +6*a*c +12*b*c
sol = 0:{{a,1},{b,0},{c,1}}
```
{% endraw %}

Output (Python):
```
f = 16 -7*a -12*b -15*c +4*a*b +6*a*c +12*b*c
sol = Sol(energy=0, {a: 1, b: 0, c: 1})
```

## Which Should I Use?

### C++ (QUBO++) — Strengths

- **Faster expression building**: Building large expressions with millions of terms is significantly faster in native C++. The solver execution time is the same in both languages, but the time to construct the model can differ substantially for large problems.
- **Mathematical range syntax**: Range constraints use the natural notation `l <= f <= u`, which reads like a mathematical formula.
- **Integration with existing C++ projects**: Can be embedded directly into existing C++ applications.

### Python (PyQBPP) — Strengths

- **No compilation**: Write and run immediately. Ideal for interactive exploration with Jupyter notebooks and the Python REPL.
- **Simpler syntax**: Less boilerplate — no `#include`, `#define`, `main()`, `auto`, or namespace qualifiers.
- **Easy installation**: `pip install pyqbpp` in a virtual environment, no `sudo` required.
- **Data science ecosystem**: Seamless integration with NumPy, pandas, matplotlib, and other Python libraries for data preparation and result analysis.
- **More external solver backends**: PyQBPP can dispatch a model to a much wider range of external solvers. In addition to Gurobi and the MILP solvers (SCIP, HiGHS, GLPK, CBC) that are also available from C++, PyQBPP adds Fixstars Amplify, D-Wave (Advantage / Native / Leap Hybrid / Neal / Tabu / Steepest Descent), OpenJij, TYTAN-SDK MIKAS, qubovert, Simulated Bifurcation, IBM CPLEX, IBM Qiskit Optimization, and Google OR-Tools CP-SAT — each behind the same `solver.search()` protocol. See [QUBO/HUBO Solvers](python/QUBO_HUBO_SOLVERS) and [CP Solvers](python/CP_SOLVERS).

### Summary

| | C++ (QUBO++) | Python (PyQBPP) |
|---|---|---|
| **Expression building speed** | Fast (native) | Slower (Python binding overhead) |
| **Solver speed** | Same | Same |
| **Ease of use** | Moderate | Easy |
| **Interactive use** | No | Yes (Jupyter, REPL) |
| **External solvers** | Gurobi + MILP (SCIP / HiGHS / GLPK / CBC) | All of C++'s, **plus** Amplify, D-Wave, OpenJij, TYTAN, qubovert, Simulated Bifurcation, CPLEX, Qiskit, OR-Tools CP-SAT |

**Recommendation**: Start with **PyQBPP (Python)** for prototyping and learning. Switch to **C++ (QUBO++)** if you need faster expression building for large-scale problems.
