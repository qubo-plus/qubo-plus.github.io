---
last_modified: 2026-10-27
layout: default
title: "Installation"
nav_order: 3
lang: en
hreflang_alt: "ja/INSTALL"
hreflang_lang: "ja"
---

# Installation

## Supported Environment

QUBO++ runs on Linux-based systems with the following CPUs:
* **amd64**: 64-bit Intel and AMD processors
* **arm64**: 64-bit ARM processors (including GB10 systems such as NVIDIA DGX Spark and Grace systems such as GB200; the GPU solvers use the GPUs of these machines as well)

Ubuntu 20.04 or later is recommended.
For Windows users, QUBO++ can be used through [WSL (Windows Subsystem for Linux)](WSL).

## Installation

There are three ways to install QUBO++:
- **Method 1: apt (recommended)** — Simple installation with automatic path configuration. Requires sudo privileges.
- **Method 2: .deb file** — Install a `.deb` file downloaded from the Releases page with apt. Requires sudo privileges.
- **Method 3: tar.gz** — Manual installation without requiring apt repository setup. No sudo privileges needed.

## Method 1: Install via apt (recommended)

> **If you installed 2026.10.06 or earlier with apt**: since 2026.10.10, the APT repository is hosted on GitHub Releases.
> With the old setting, `apt update` reports no error, but QUBO++ is never updated past 2026.10.06.
> Rewrite the repository setting once, as shown in [Upgrading](#upgrading) below.

### Step 1: Add the QUBO++ repository

Download the signing key and add the repository:
```bash
curl -fsSL https://qubo-plus.github.io/qbpp-apt/qbpp.gpg \
  | sudo tee /usr/share/keyrings/qbpp.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/qbpp.gpg] https://github.com/qubo-plus/qbpp-apt/releases/download/stable ./" \
  | sudo tee /etc/apt/sources.list.d/qbpp.list > /dev/null
```

### Step 2: Install QUBO++
```bash
sudo apt update
sudo apt install qbpp
```

This automatically installs headers to `/usr/include/qbpp/`, shared libraries to `/usr/lib/qbpp/` (registered with `ldconfig`), and the `qbpp-license` command to `/usr/bin/`.
No environment variable configuration is needed.

### Upgrading

If you installed 2026.10.06 or earlier, first rewrite the repository setting once (since 2026.10.10, the APT repository is hosted on GitHub Releases):
```bash
echo "deb [signed-by=/usr/share/keyrings/qbpp.gpg] https://github.com/qubo-plus/qbpp-apt/releases/download/stable ./" \
  | sudo tee /etc/apt/sources.list.d/qbpp.list > /dev/null
```

Then upgrade:
```bash
sudo apt update
sudo apt install --only-upgrade qbpp
```

### Uninstalling
```bash
sudo apt remove qbpp
```

## Method 2: Install a .deb file

With an old apt (such as that of Ubuntu 20.04), Method 1 may fail. In that case, install QUBO++ this way.

From the [**Latest Releases**](https://github.com/qubo-plus/qbpp/releases/latest) page, download the `.deb` file for your CPU (`qbpp_<version>_amd64.deb` or `qbpp_<version>_arm64.deb`), and install it with apt:
```bash
sudo apt install ./qbpp_<version>_<arch>.deb
```

## Method 3: Install via tar.gz

Download the `.tar.gz` file of the latest QUBO++ release from the [**Latest Releases**](https://github.com/qubo-plus/qbpp/releases/latest) page.
Extract the archive as follows:
```bash
tar xf qbpp_<arch>_<version>.tar.gz
```

### Setting Environment Variables
To compile and run QUBO++ programs, set the following environment variables.
Add these lines to the end of your **`~/.bashrc`** so that they are automatically set when a shell starts:
```bash
export QBPP_PATH=[QUBO++ install directory]

export CPLUS_INCLUDE_PATH=$QBPP_PATH/include:$CPLUS_INCLUDE_PATH
export LIBRARY_PATH=$QBPP_PATH/lib:$LIBRARY_PATH
export LD_LIBRARY_PATH=$QBPP_PATH/lib:$LD_LIBRARY_PATH
export PATH=$QBPP_PATH/bin:$PATH

```

The arbitrary-precision integer variant (`INTEGER_TYPE_CPP_INT`) also requires the Boost headers (an APT installation pulls them in as a dependency):
```bash
sudo apt install -y libboost-dev
```

## License Activation

After installation, activate the license to start using QUBO++:

```bash
qbpp-license -k XXXXXX-XXXXXX-XXXXXX-XXXXXX -a
```

A free **Trial license** (30 days, 10,000 variables) is available via the [QUBO++ User Portal](https://qubo-plus.github.io/portal/). Run `qbpp-license -s` to obtain a sign-up code, register at the portal, and you'll receive a Trial key to activate. The Trial starts, and its 30 days begin, when you click **Start/Renew** in the portal (see [Obtaining a Trial License](LICENSE_MANAGEMENT#obtaining-a-trial-license)).

For details on license types, deactivation, troubleshooting, and more, see **[License Management](LICENSE_MANAGEMENT)**.
