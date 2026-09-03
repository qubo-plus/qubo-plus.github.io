---
last_modified: 2026-09-03
layout: default
nav_exclude: true
title: "ABS2 Solver (unofficial)"
nav_order: 54
lang: en
hreflang_alt: "ja/ABS2"
hreflang_lang: "ja"
---

# ABS2 Solver (unofficial)

> **This is an unofficial feature.** It may change or be removed without
> notice, and it may stop being published. No performance is guaranteed.

ABS2 is a GPU-only QUBO solver developed before ABS3.
**On dense QUBO problems it sometimes outperforms ABS3.**

## Installation

ABS2 is distributed as a **separate plugin**, not as part of QUBO++ itself.
Installing QUBO++ alone is not enough — install the core first
(see [Installation](INSTALL)).

### Option 1: APT (recommended)

It comes from the same repository as QUBO++ and works for both C++ and Python.

```bash
sudo apt update
sudo apt install qbpp-abs2
```

### Option 2: pip

If you installed PyQBPP with pip, use this instead (Python only).

```bash
pip install pyqbpp-abs2
```

### Option 3: tar.gz

Download `qbpp-abs2_<arch>_<version>.tar.gz` from
[**Latest Releases**](https://github.com/qubo-plus/qbpp/releases/latest),
unpack it, and put the contents of `lib/` into the **same directory as the
QUBO++ shared libraries** (`/usr/lib/qbpp` for APT, `$QBPP_PATH/lib` for
a tar.gz install).

```bash
tar xf qbpp-abs2_<arch>_<version>.tar.gz
sudo cp abs2_plugin_<arch>/lib/*.so /usr/lib/qbpp/
sudo ldconfig
```

All three kinds of file must sit in the same directory:

```
libabs2.so
libabs2c.so
qubo<n>_<w>_<d>.so
```

### Checking the installation

If the plugin is in place, this prints a solution.

{% raw %}
```cpp
#include <qbpp/abs2_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 8);
  auto f = qbpp::simplify_as_binary(-x[0] - x[1] - x[2]);
  qbpp::ABS2Solver solver(f);
  std::cout << solver.search(qbpp::Params{{"time_limit", 1}}).energy()
            << std::endl;
}
```
{% endraw %}

Using ABS2 without the plugin installed reports an explicit error.

## Usage

`qbpp::ABS2Solver` is used the same way as `ABS3Solver`.

{% raw %}
```cpp
#include <qbpp/abs2_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x", 100);
  qbpp::Expr f;
  for (int i = 0; i < 100; ++i)
    for (int j = i + 1; j < 100; ++j)
      f += ((i * 7 + j * 13) % 21 - 10) * x[i] * x[j];
  f = qbpp::simplify_as_binary(f);

  qbpp::ABS2Solver solver(f);
  auto sol = solver.search(qbpp::Params{{"time_limit", 10}});
  std::cout << "energy = " << sol.energy() << std::endl;
}
```
{% endraw %}

Compile it like any other solver program.

```bash
g++ -O3 -std=c++17 -Wall -Wextra -Wfloat-conversion sample.cpp -o sample -ldl -pthread
```

## Choosing GPUs

The second constructor argument selects how many GPUs to use
(default `-1` = all GPUs). ABS2 has no CPU path, so `0` is not allowed.

```cpp
qbpp::ABS2Solver solver(f, 2);  // use 2 GPUs
```

The constructor initializes the GPUs and uploads the matrix, so `search()`
only runs the search itself. You may call `search()` repeatedly on the same
solver; each call is a fresh search.

## Search parameters

| Parameter | Meaning |
|---|---|
| `time_limit` | Search time in seconds |
| `target_energy` | Stop once this energy is reached |

Passing any other parameter is an error.
The GPU count is fixed by the constructor, so it cannot be given to `search()`.

## Limitations

ABS2 solves QUBO only. Each of the following is reported as an explicit error.

| Limitation | What to do |
|---|---|
| QUBO only (no degree 3 or higher) | Use `qbpp::reduce()` to quadratize |
| `qbpp::cons()` is not supported | Use `qbpp::expand_cons()` to turn constraints into penalties |
| Integer variables (`qbpp::int_var()`) are not supported | Model them with binary variables |
| Coefficients and energies stay within 32-bit integers | The matrix and arithmetic widths are chosen automatically from the coefficients |
| A GPU is required | Use `EasySolver` to solve on the CPU |
| At most **16384 variables** (the largest bundled kernel) | Exceeding it is an explicit error |

There is also no random seed parameter, so results differ between runs.

## When to use it

ABS2 keeps the current solution and its deltas in thread registers, which
makes it strong on **dense QUBO problems**. For sparse or very large models,
`EasySolver` and `ABS3Solver` are faster.

For example, on N-Queens (a sparse problem whose density falls as the
variable count grows) the gap in favour of ABS3 widens with size. Use the
density of your problem as the guide.
