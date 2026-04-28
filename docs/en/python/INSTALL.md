---
layout: default
title: "Installation"
nav_order: 3
lang: en
hreflang_alt: "ja/python/INSTALL"
hreflang_lang: "ja"
---

# Installation

## Supported Environment

PyQBPP runs on Linux-based systems with the following CPUs:
* **amd64**: 64-bit Intel and AMD processors
* **arm64**: 64-bit ARM processors (aarch64)

Requirements:
* Ubuntu 20.04 or later (glibc 2.31+ — manylinux_2_31 wheel)
* Python 3.8 or later
* `pip` 20.3 or later (for PEP 600 manylinux_2_31 wheel support)

For Windows users, PyQBPP can be used through [WSL (Windows Subsystem for Linux)](../WSL).

## Installation

There are two ways to install PyQBPP:
- **Method 1: PyPI (recommended)** — Install the published package directly from the Python Package Index.
- **Method 2: Local wheel** — Install a downloaded `.whl` file (useful for offline installs or pinning a specific build).

Neither method requires sudo privileges when installed inside a Python virtual environment (venv).

## Method 1: Install via PyPI (recommended)

PyQBPP is published on [PyPI](https://pypi.org/project/pyqbpp/).
For detailed package information, see the [PyQBPP PyPI page](https://pypi.org/project/pyqbpp/).

We recommend using a Python virtual environment (venv) to keep PyQBPP isolated from system packages:

```bash
python3 -m venv ~/qbpp-env
source ~/qbpp-env/bin/activate
pip install pyqbpp
```

### Upgrading

```bash
pip install --upgrade pyqbpp
```

### Uninstalling

```bash
pip uninstall pyqbpp
```

## Method 2: Install via local wheel

Download the `.whl` file of the latest PyQBPP release from the [**Latest Releases**](https://github.com/qubo-plus/qbpp/releases/latest) page, then install it with `pip`:

```bash
python3 -m venv ~/qbpp-env
source ~/qbpp-env/bin/activate
pip install pyqbpp-<VERSION>-py3-none-manylinux_2_31_x86_64.whl
```

Replace `<VERSION>` with the actual release version and choose the wheel that matches your CPU architecture (`x86_64` for amd64, `aarch64` for arm64).

No environment variable configuration is required.
The wheel bundles all shared libraries (`qbpp_*.so`, `easysolver_*.so`, `exhaustive_*.so`) and the `qbpp-license` command inside the package; `pip` installs them under your virtual environment automatically.

## Importing PyQBPP

PyQBPP provides multiple submodules that correspond to different coefficient / energy integer types. Pick the one that fits the size of your coefficients and energies:

```python
import pyqbpp as qbpp                # default: coeff=int32, energy=int64 (c32e64)
# import pyqbpp.c32e32 as qbpp       # coeff=int32, energy=int32
# import pyqbpp.c64e64 as qbpp       # coeff=int64, energy=int64
# import pyqbpp.c64e128 as qbpp      # coeff=int64, energy=int128
# import pyqbpp.c128e128 as qbpp     # coeff=int128, energy=int128
# import pyqbpp.cppint as qbpp       # coeff=cpp_int, energy=cpp_int (arbitrary precision)
```

The plain `import pyqbpp as qbpp` is equivalent to `import pyqbpp.c32e64 as qbpp` and is sufficient for most problems.
Use a larger type variant when your objective function can produce coefficients or energies that overflow 32- or 64-bit integers, and switch to `pyqbpp.cppint` when arbitrary-precision arithmetic is required.

Only one variant should be imported per Python process.

## License Activation

After installation, activate the license to start using PyQBPP:

```bash
qbpp-license -k XXXXXX-XXXXXX-XXXXXX-XXXXXX -a
```

The `qbpp-license` command is installed by the wheel into your virtual environment's `bin/` directory, so it is available on `PATH` as soon as the venv is activated.

If no license key is set, an **Anonymous Trial** (7 days, 1,000 variables) is activated automatically on first use.

### Using `QBPP_LICENSE_KEY` at runtime

As an alternative to `qbpp-license -a`, you can supply the license key through the `QBPP_LICENSE_KEY` environment variable. This is especially useful inside containers, CI jobs, and Lambda/serverless environments where activating and storing a license file is inconvenient:

```bash
export QBPP_LICENSE_KEY=XXXXXX-XXXXXX-XXXXXX-XXXXXX
python3 my_qbpp_program.py
```

When `QBPP_LICENSE_KEY` is set, PyQBPP uses it directly at runtime without writing any state to disk.

For details on license types, deactivation, troubleshooting, and more, see **[License Management](../LICENSE_MANAGEMENT)**.
