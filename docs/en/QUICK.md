---
layout: default
title: "Quick Start"
nav_order: 4
lang: en
hreflang_alt: "ja/QUICK"
hreflang_lang: "ja"
---

# Quick Start

> **Try without installing:** You can try QUBO++ immediately in the browser using the [**Playground**](PLAYGROUND) — no installation required.

This page provides an overview of the Quick Start procedure.
More detailed instructions for installing QUBO++ on WSL on Windows 11 are available in [Quick Start for Windows (WSL)](WSL).

## Installation

Install QUBO++ by following the instructions in [**Installation**](INSTALL).
For Windows users, see [**Quick Start for Windows (WSL)**](WSL).

## Compile and execute a sample program
### Create a QUBO++ sample program
Create a QUBO++ sample program below and save as file **`test.cpp`**:
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto x = 0 <= qbpp::var_int("x") <= 10;
  auto y = 0 <= qbpp::var_int("y") <= 10;
  auto f = x + y == 10;
  auto g = 2 * x + 4 * y == 28;
  auto h = f + g;
  h.simplify_as_binary();
  std::cout << "h = " << h << std::endl;
  auto solver = qbpp::exhaustive_solver::ExhaustiveSolver(h);
  auto sol = solver.search();
  std::cout << "sol = " << sol << std::endl;
  std::cout << "x = " << sol(x) << ", y = " << sol(y) << std::endl;
}
```

### Compile the program
Compile **`test.cpp`** to generate the executable **`test`**:
```bash
g++ test.cpp -o test -std=c++17 -lqbpp -ldl
```
This command creates an executable file named test.
The compiler options mean the following:
- **`-std=c++17`**: Use the C++17 standard.
- **`-lqbpp`**: Link against the QUBO++ shared library.
- **`-ldl`**: Link against the dynamic loader library (for lazy .so loading).

### Execute the program
Run `test` as follows:
{% raw %}
```bash
./test
h = -127*x[0] - 244*x[1] - 448*x[2] - 351*x[3] - 227*y[0] - 420*y[1] - 704*y[2] - 579*y[3] + 20*x[0]*x[1] + 40*x[0]*x[2] + 30*x[0]*x[3] + 18*x[0]*y[0] + 36*x[0]*y[1] + 72*x[0]*y[2] + 54*x[0]*y[3] + 80*x[1]*x[2] + 60*x[1]*x[3] + 36*x[1]*y[0] + 72*x[1]*y[1] + 144*x[1]*y[2] + 108*x[1]*y[3] + 120*x[2]*x[3] + 72*x[2]*y[0] + 144*x[2]*y[1] + 288*x[2]*y[2] + 216*x[2]*y[3] + 54*x[3]*y[0] + 108*x[3]*y[1] + 216*x[3]*y[2] + 162*x[3]*y[3] + 68*y[0]*y[1] + 136*y[0]*y[2] + 102*y[0]*y[3] + 272*y[1]*y[2] + 204*y[1]*y[3] + 408*y[2]*y[3] + 884
sol = 0:{{x[0],1},{x[1],1},{x[2],0},{x[3],1},{y[0],0},{y[1],0},{y[2],1},{y[3],0}}
x = 6, y = 4
```
{% endraw %}

## Next steps
1. Activate your license. See [**License Management**](LICENSE_MANAGEMENT) for details.
2. Learn the basics of QUBO++. Start with **Basics** in [**QUBO++ (C++)**](DOCUMENT).
3. Explore example QUBO++ programs in the [**Case Studies**](CASE_STUDIES).
