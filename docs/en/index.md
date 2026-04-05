---
layout: default
title: "Home"
nav_order: 1
lang: en
hreflang_alt: "ja/index"
hreflang_lang: "ja"
---

# QUBO++: A model-and-solve framework for combinatorial optimization via QUBO/HUBO

**QUBO++** is a framework for formulating and solving combinatorial optimization problems
as polynomials of binary variables (QUBO/HUBO).

- **C++ and Python** — Use QUBO++ from C++ ([QUBO++](DOCUMENT)) or Python ([PyQBPP](python/)).
- **Symbolic DSL** — Write optimization models as mathematical expressions, not matrix indices. Use natural for-loops to build constraints, or leverage vector operations for loop-free formulations.
- **Easy installation** — `sudo apt install qbpp` for C++, `pip install pyqbpp` for Python. No build from source required.
- **Unlimited-degree HUBO** — Supports high-order terms of any degree, not just quadratic. Native support for negated literals (`~x`) avoids the term explosion caused by replacing $\overline{x}$ with $1-x$.
- **GPU-accelerated solving** — The built-in ABS3 solver fully utilizes GPU resources for parallel search, with multi-GPU scaling. The Exhaustive Solver also automatically uses CUDA GPUs when available.
- **CPU parallel acceleration** — All solvers run multithreaded on multicore CPUs.
- **Arbitrary-precision integer coefficients** — Handles integer coefficients of unlimited bit width. No overflow worries, from 16-bit to thousands of digits.
- **Three built-in solvers** — Easy Solver (fast heuristic), Exhaustive Solver (complete search with optimality guarantee), and ABS3 (GPU+CPU heuristic).
- **Run anywhere** — From a laptop to GPU servers and supercomputers. Available for amd64 (x86_64) and arm64 Linux.

# QUBO++ Solvers: Easy Solver, Exhaustive Solver, ABS3 Solver
## Easy Solver
* **Heuristic solver optimized for QUBO/HUBO**: Searches for solutions to QUBO/HUBO models on multicore CPUs.
* **Multithreaded acceleration**: Parallel search on multicore CPUs.
* **Unlimited integer coefficients**: Supports integer coefficients of arbitrary magnitude.

## Exhaustive Solver
* **Enumerates all solutions** to QUBO/HUBO formulations on multicore CPUs and CUDA GPUs.
* **Optimality guaranteed**: the global optimum is found and certifiable.
* **Multithreaded acceleration**: Parallel search on multicore CPUs.
* **Unlimited integer coefficients**: Supports integer coefficients of arbitrary magnitude.
* **GPU acceleration**: If a CUDA GPU is available, GPU workers automatically join the search alongside CPU threads. GPU acceleration is available for coefficients up to 128-bit integers; larger coefficients fall back to CPU-only search.


## ABS3 Solver
* **Heuristic solver on multicore CPUs and CUDA GPUs**: Searches for solutions to QUBO/HUBO instances using both CPU threads and CUDA GPUs.
* **Unlimited integer coefficients**: Supports integer coefficients of arbitrary magnitude.
* **Multi-GPU scaling**: Uses all detected GPUs on a Linux host. GPU acceleration is available for coefficients up to 128-bit integers; larger coefficients fall back to CPU-only search.


### **ABS3 Supported GPU architectures**
  - **sm_80** : NVIDIA A100  (Ampere)
  - **sm_86** : NVIDIA RTX A6000, GeForce RTX 3090/3080/3070 (Ampere)
  - **sm_89** : NVIDIA RTX 6000 Ada, GeForce RTX 4090/4080/4070 (Ada)
  - **sm_90** : NVIDIA H100 / H200 / GH200 (Hopper)
  - **sm_100** : NVIDIA B200 / GB200 (Blackwell, data center)
  - **sm_120** : GeForce RTX 5090/5080/5070(Ti)/5060(Ti)/5050、RTX PRO 6000/5000/4500/4000/2000 Blackwell (workstation)
  - **Note on verification** : Only a subset of the architectures above has been verified on real hardware.


### **Performance note**
  - Arithmetic overflow checks are omitted to maximize performance.


## Build Environment
The following environment was used to build QUBO++.
**QUBO++ is not limited to Ubuntu 20.04**; it has also been tested on Ubuntu 22.04/24.04 and other Linux distributions (including CentOS/RHEL-based systems).
To ensure compatibility, please use the same or newer versions of the listed components.
- **Operating System**: Ubuntu 20.04.6 LTS
- **C++ Standard**: C++17
- **glibc**: 2.31
- **Compiler**: g++ 9.4.0
- **Boost**: 1.81.0
- **CUDA**: 12.8

# QUBO++ Licensing

QUBO++ can be used without a license key.
If no license key is set, an **Anonymous Trial** (7 days, 1,000 variables) is automatically activated, allowing you to try QUBO++ immediately.

For details on license activation, license types, and terms, see **[License Management](LICENSE_MANAGEMENT)**.

# Third-Party Libraries

- **Boost C++ Libraries**
  - Licensed under the Boost Software License, Version 1.0.
  - See <https://www.boost.org/LICENSE_1_0.txt> for details.

- **xxHash**
  - Licensed under the BSD 2-Clause License.
  - Copyright © Yann Collet.
  - See <https://opensource.org/license/bsd-2-clause/> for details.
