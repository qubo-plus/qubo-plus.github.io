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
This program expands and simplifies the following expression $f$ into a QUBO formula, then solves it using the EasySolver.

$$
\begin{aligned}
f &= (a+2b+3c-4)^2
\end{aligned}
$$

### Compile the program
Compile **`test.cpp`** to generate the executable **`test`**:
```bash
g++ test.cpp -o test -std=c++17 -ldl -pthread
```
This command creates an executable file named test.
The compiler options mean the following:
- **`-std=c++17`**: Use the C++17 standard.
- **`-ldl`**: Link against the dynamic loader library (QUBO++ loads its .so at runtime via `dlopen`).
- **`-pthread`**: Enable POSIX threads (required by QUBO++ solvers).

### Execute the program
Run `test` as follows to display the expanded expression and the solution:
{% raw %}
```bash
./test
f = 16 -7*a -12*b -15*c +4*a*b +6*a*c +12*b*c
sol = 0:{{a,1},{b,0},{c,1}}
```
{% endraw %}

## Next steps
1. Activate your license. See [**License Management**](LICENSE_MANAGEMENT) for details.
2. Learn the basics of QUBO++. Start with **Basics** in [**QUBO++ (C++)**](DOCUMENT).
3. Explore example QUBO++ programs in the [**Case Studies**](CASE_STUDIES).
