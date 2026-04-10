---
layout: default
title: "C++ vs Python"
nav_order: 3
lang: en
hreflang_alt: "ja/CPP_VS_PYTHON"
hreflang_lang: "ja"
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

| | C++ | Python |
|---|---|---|
| **Default coefficient** | `int32_t` (32-bit) | `int32_t` (32-bit) |
| **Default energy** | `int64_t` (64-bit) | `int64_t` (64-bit) |
| **Changing precision** | `#define INTEGER_TYPE_CPP_INT` etc. | `import pyqbpp.cppint` at import time |
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
auto f = qbpp::Expr(2);  // Must be Expr, not int
f += x;                   // f is now Expr representing 2 + x
```

In Python, no such type awareness is needed:

```python
x = qbpp.var("x")
f = 2          # Just an int — no problem
f += x         # f automatically becomes an Expr representing 2 + x
```

## Syntax Differences

The following table shows the main syntax differences between C++ and Python.

| Feature | C++ (QUBO++) | Python (PyQBPP) |
|---|---|---|
| **Include / Import** | `#include <qbpp/qbpp.hpp>` | `import pyqbpp as qbpp` |
| **Variable** | `auto a = qbpp::var("a");` | `a = qbpp.var("a")` |
| **Variable vector** | `auto x = qbpp::var("x", n);` | `x = qbpp.var("x", n)` |
| **Negated literal** | `~x` | `~x` |
| **Integer variable** | `auto x = 0 <= qbpp::var_int("x") <= 10;` | `x = qbpp.between(qbpp.var_int("x"), 0, 10)` |
| **Equality** | `auto f = (expr == 3);` | `f = (expr == 3)` |
| **Range constraint** | `auto f = (1 <= expr <= 5);` | `f = qbpp.between(expr, 1, 5)` |
| **Body of ExprExpr** | `*f` | `f.body` |
| **Simplify** | `expr.simplify_as_binary();` | `expr.simplify_as_binary()` |
| **Easy Solver** | `qbpp::easy_solver::EasySolver(expr)` | `qbpp.EasySolver(expr)` |
| **Exhaustive Solver** | `qbpp::exhaustive_solver::ExhaustiveSolver(expr)` | `qbpp.ExhaustiveSolver(expr)` |
| **ABS3 Solver** | `qbpp::abs3_solver::ABS3Solver(expr)` | `qbpp.ABS3Solver(expr)` |
| **Search** | `auto sol = solver.search();` | `sol = solver.search()` |
| **Search with params** | `solver.search({% raw %}{{"time_limit", 10}, {"target_energy", 0}}{% endraw %})` | `solver.search({"time_limit": 10, "target_energy": 0})` |
| **Solution value** | `sol(x)` | `sol(x)` |
| **Output** | `std::cout << sol << std::endl;` | `print(sol)` |

### Quick Start Example

The same problem solved in both languages:

**C++:**
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto x = 0 <= qbpp::var_int("x") <= 10;
  auto y = 0 <= qbpp::var_int("y") <= 10;
  auto h = (x + y == 10) + (2 * x + 4 * y == 28);
  h.simplify_as_binary();
  auto sol = qbpp::exhaustive_solver::ExhaustiveSolver(h).search();
  std::cout << "x = " << sol(x) << ", y = " << sol(y) << std::endl;
}
```

**Python:**
```python
import pyqbpp as qbpp

x = qbpp.between(qbpp.var_int("x"), 0, 10)
y = qbpp.between(qbpp.var_int("y"), 0, 10)
h = (x + y == 10) + (2 * x + 4 * y == 28)
h.simplify_as_binary()
sol = qbpp.ExhaustiveSolver(h).search()
print(f"x = {sol(x)}, y = {sol(y)}")
```

Both output: `x = 6, y = 4`

## Which Should I Use?

### C++ (QUBO++) — Strengths

- **Faster expression building**: Building large expressions with millions of terms is significantly faster in native C++. The solver execution time is the same in both languages, but the time to construct the model can differ substantially for large problems.
- **Fine-grained type control**: You can choose smaller coefficient types (e.g., `int32_t`, `int64_t`) when arbitrary precision is not needed. Fixed-width integers are much faster than arbitrary-precision integers, which can make a noticeable difference in both expression building and solver performance. When overflow-free computation is needed, you can switch to `cpp_int` for arbitrary-precision integers at the cost of speed — giving you the flexibility to trade performance for correctness on a per-project basis.
- **Mathematical range syntax**: Range constraints use the natural notation `l <= f <= u`, which reads like a mathematical formula.

### Python (PyQBPP) — Strengths

- **No compilation**: Write and run immediately. Ideal for interactive exploration with Jupyter notebooks and the Python REPL.
- **Fixed-precision by default**: 32-bit coefficients and 64-bit energy (`c32e64`) are used by default for speed. For arbitrary precision, use `import pyqbpp.cppint`.
- **Simpler syntax**: Less boilerplate — no `#include`, `#define`, `main()`, `auto`, or namespace qualifiers.
- **Easy installation**: `pip install pyqbpp` in a virtual environment, no `sudo` required.
- **Data science ecosystem**: Seamless integration with NumPy, pandas, matplotlib, and other Python libraries for data preparation and result analysis.

### Summary

| | C++ (QUBO++) | Python (PyQBPP) |
|---|---|---|
| **Expression building speed** | Fast (native) | Slower (ctypes overhead) |
| **Solver speed** | Same | Same |
| **Type control** | Fine-grained (int16 ~ cpp_int) | Same (default: c32e64) |
| **Ease of use** | Moderate | Easy |
| **Interactive use** | No | Yes (Jupyter, REPL) |

**Recommendation**: Start with **PyQBPP (Python)** for prototyping and learning. Switch to **C++ (QUBO++)** if you need faster expression building for large-scale problems or fine-grained type control for performance.
