---
last_modified: 2026-10-10
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
- **Method 2: Install from downloaded files** — For machines without internet access.

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

### Downloading the shared libraries (first use only)

The wheel on PyPI contains only the Python code and the `qbpp-license` command.
The shared libraries (`qbpp_*.so`, `easysolver_*.so`, `exhaustive_*.so`, `abs3_*.so`, and so on; about 330 MB) are downloaded automatically from [GitHub Releases](https://github.com/qubo-plus/qbpp/releases) the first time you use PyQBPP, and are stored in `~/.cache/pyqbpp/`.
Later runs reuse them, so the download happens only once per version.
The downloaded file is checked against the checksum (SHA-256) recorded in the wheel before it is extracted.

- To store them elsewhere, set the environment variable `PYQBPP_CACHE_DIR` to a directory.
- To download them in advance (for example, while building a container image), run:

  ```bash
  python -m pyqbpp download
  ```

- When a new version is downloaded after an upgrade, old versions that have not been used for 14 days or more are removed.

### Upgrading

```bash
pip install --upgrade pyqbpp
```

### Uninstalling

```bash
pip uninstall pyqbpp
rm -rf ~/.cache/pyqbpp
```

The second line removes the downloaded shared libraries (or the directory given in `PYQBPP_CACHE_DIR`, if you set it).

## Method 2: Install from downloaded files

For a machine without internet access, download the following two files from the [**Latest Releases**](https://github.com/qubo-plus/qbpp/releases/latest) page on a connected machine and copy them over:

- the wheel: `pyqbpp-<VERSION>-py3-none-manylinux_2_31_<ARCH>.whl`
- the shared libraries: `pyqbpp-native-<VERSION>-linux-<ARCH>.tar.gz`

Choose `<ARCH>` for your CPU architecture (`x86_64` for amd64, `aarch64` for arm64).
Use the two files of the same release (in the wheel's file name, `<VERSION>` has its leading zeros removed, as in `2026.10.9`).

```bash
python3 -m venv ~/qbpp-env
source ~/qbpp-env/bin/activate
pip install pyqbpp-<VERSION>-py3-none-manylinux_2_31_x86_64.whl
python -m pyqbpp download pyqbpp-native-<VERSION>-linux-x86_64.tar.gz
```

The last line checks the shared libraries against the checksum and extracts them into `~/.cache/pyqbpp/`.

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

Only one variant can be used per Python process: importing a different variant after one is loaded raises `ImportError` (objects of different variants cannot be mixed). Importing the same variant under another name, such as `pyqbpp` and `pyqbpp.c32e64`, is fine. To switch variants, restart the interpreter or the Jupyter kernel.

## License Activation

After installation, activate the license to start using PyQBPP:

```bash
qbpp-license -k XXXXXX-XXXXXX-XXXXXX-XXXXXX -a
```

The `qbpp-license` command is installed by the wheel into your virtual environment's `bin/` directory, so it is available on `PATH` as soon as the venv is activated.

A free **Trial license** (30 days, 10,000 variables) is available via the [QUBO++ User Portal](https://qubo-plus.github.io/portal/). Run `qbpp-license -s` to obtain a sign-up code, register at the portal, and activate the resulting key with `qbpp-license -k <KEY> -a`.

### Using `QBPP_LICENSE_KEY` at runtime

As an alternative to `qbpp-license -a`, you can supply the license key through the `QBPP_LICENSE_KEY` environment variable. This is especially useful inside containers, CI jobs, and Lambda/serverless environments where activating and storing a license file is inconvenient:

```bash
export QBPP_LICENSE_KEY=XXXXXX-XXXXXX-XXXXXX-XXXXXX
python3 my_qbpp_program.py
```

When `QBPP_LICENSE_KEY` is set, PyQBPP uses it directly at runtime without writing any state to disk.

For details on license types, deactivation, troubleshooting, and more, see **[License Management](../LICENSE_MANAGEMENT)**.
