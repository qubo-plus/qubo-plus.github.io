---
layout: default
title: "Home"
nav_order: 1
lang: en
hreflang_alt: "ja/index"
hreflang_lang: "ja"
mode_shared: true
---

# QUBO++: A model-and-solve framework for combinatorial optimization via QUBO/HUBO

**QUBO++** is a framework for formulating and solving combinatorial optimization problems
as polynomials of binary variables (QUBO/HUBO).
Declaring constraints explicitly with `cons()` lets the bundled solvers search efficiently for solutions that satisfy them.

- **C++ and Python** — Use QUBO++ from C++ ([QUBO++](DOCUMENT)) or Python ([PyQBPP](python/DOCUMENT)).
- **Easy installation** — `sudo apt install qbpp` for C++, `pip install pyqbpp` for Python. No build from source required.
- **Symbolic DSL** — Write optimization models as mathematical expressions, not matrix indices. Use natural for-loops to build constraints, or leverage vector operations for loop-free formulations.
- **Native constraints** — Wrap a constraint in `cons()` to declare it: the constraint is treated specially, and the bundled solvers search efficiently for solutions that satisfy it. This reduces the burden of penalty-weight tuning, and the same declarations are treated as hard constraints by the exact and MIP solvers. See [Native Constraints](CONSTRAINTS) ([Python version](python/CONSTRAINTS)) for details.
- **Unlimited-degree HUBO** — Supports high-order terms of any degree, not just quadratic. Native support for negated literals (`~x`) avoids the term explosion caused by replacing $\overline{x}$ with $1-x$.
- **Massive variable capacity** — A single model can use up to **2,147,483,647** ($2^{31}-1$) binary variables.
- **Arbitrary-precision integer coefficients** — Handles integer coefficients of unlimited bit width. No overflow worries, from 32-bit to thousands of digits.
- **Real (double) coefficients** — Besides integers, coefficients can be `double`. Expressions are built in `double` and automatically quantized to the integer solver when solved, with the energy returned as a `double` — so you work entirely in real numbers without dealing with the integer backend.
- **Three built-in solvers** — Easy Solver (fast heuristic), Exhaustive Solver (complete search with optimality guarantee), and ABS3 (GPU+CPU heuristic).
- **GPU-accelerated solving** — The built-in ABS3 solver fully utilizes GPU resources for parallel search, with multi-GPU scaling. The Exhaustive Solver also automatically uses CUDA GPUs when available.
- **CPU parallel acceleration** — All solvers run multithreaded on multicore CPUs.
- **Experimental third-party solver support** — Call Gurobi, SCIP, HiGHS, GLPK, CBC, IBM CPLEX, IBM Qiskit Optimization, dimod ExactSolver, Fixstars Amplify, D-Wave Ocean (Advantage / native QPU / Leap Hybrid / Neal / Tabu / Steepest), OpenJij, TYTAN-SDK MIKAS, qubovert, Simulated Bifurcation, and Google OR-Tools CP-SAT through a unified `Solver.search()` protocol. Gurobi, SCIP, HiGHS, GLPK, and CBC are available from C++ (QUBO++) as well; the others are available from PyQBPP. See [QUBO/HUBO Solvers](QUBO_HUBO_SOLVERS), [MILP Solvers](MILP_SOLVERS), and [CP Solvers](CP_SOLVERS).
- **Run anywhere** — From a Raspberry Pi to a laptop, GPU servers, and supercomputers. Available for amd64 (x86_64) and arm64 Linux.

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

A free **Trial license** (30 days, 10,000 variables) is available via the [QUBO++ User Portal](https://qubo-plus.github.io/portal/).
After installing QUBO++, run `qbpp-license -s` to obtain today's sign-up code, then register at the portal to receive your Trial key.

For details on license activation, license types, and terms, see **[License Management](LICENSE_MANAGEMENT)**.

# Third-Party Libraries

The following libraries are linked into the QUBO++ shared objects (`qbpp_*.so`):

- **Boost C++ Libraries** — Boost Software License, Version 1.0. See <https://www.boost.org/LICENSE_1_0.txt>.
- **xxHash** — BSD 2-Clause License, Copyright © Yann Collet. See <https://opensource.org/license/bsd-2-clause/>.

# Optional Solver Backends

Besides the three built-in solvers, QUBO++ can hand a model to a number of
external solvers, grouped by the model form each one consumes:

- **[QUBO/HUBO Solvers](QUBO_HUBO_SOLVERS)** — the model is taken directly (Gurobi, D-Wave, Fixstars Amplify, OpenJij, IBM CPLEX, …).
- **[MILP Solvers](MILP_SOLVERS)** — the QUBO is linearized into a pure MILP first (SCIP, HiGHS, GLPK, CBC).
- **[CP Solvers](CP_SOLVERS)** — constraint programming (Google OR-Tools CP-SAT).

Each backend must be **installed separately** and ships under its own license
(some require a commercial or academic license). These integrations are
**experimental** — their APIs may change without notice. See each page above for
the full solver list, installation, and per-backend caveats.
