---
last_modified: 2026-10-17
layout: default
nav_exclude: true
title: "Windows (WSL)"
nav_order: 1
lang: en
hreflang_alt: "ja/WSL"
hreflang_lang: "ja"
mode_shared: true
---

# Quick Start for Windows (WSL)
On Windows 11, QUBO++ can be used through **WSL (Windows Subsystem for Linux)**, which allows Linux programs to run natively on Windows.

This document explains how to install WSL, required libraries, and QUBO++, and how to compile and run sample programs.

## Install WSL
On Windows 11, **WSL** can be installed from Windows PowerShell.
Open PowerShell as Administrator and execute the following command:
```
C:\WINDOWS\System32> wsl --install
Provisioning the new WSL instance Ubuntu
This might take a while...
Create a default Unix user account: [user account name]
New password: [your password]
Retype new password: [your password]
passwd: password updated successfully
To run a command as administrator (user "root"), use "sudo <command>".
See "man sudo_root" for details.
```
Enter your **[user account name]** and **[your password]** when prompted.
This installs WSL 2 and an Ubuntu-based Linux system running on Windows.

After the installation is complete, update and upgrade the system software inside WSL:
```bash
sudo apt update
sudo apt upgrade -y
```

## Install C++ compiler
QUBO++ requires a **C++ compiler**.

Install it using the following command:
```bash
sudo apt install -y build-essential
```

If you install QUBO++ with **Method 3 (tar.gz)** and use the arbitrary-precision integer variant (`INTEGER_TYPE_CPP_INT`), the Boost headers are also required (an APT installation pulls them in automatically):
```bash
sudo apt install -y libboost-dev
```

## Install QUBO++

Follow the instructions in [**Installation**](INSTALL) to install QUBO++.

When using **Method 3 (tar.gz)**, note the following WSL-specific details:

Download one of the following files from the [**Latest Release**](https://github.com/qubo-plus/qbpp/releases/latest) page, depending on your Windows PC architecture:
- **`qbpp_amd64_<version>.tar.gz`** : For Intel- or AMD-based Windows PCs
- **`qbpp_arm64_<version>.tar.gz`** : For ARM-based Windows PCs (e.g., Copilot+ PCs)

If the file is downloaded to your Windows Downloads folder, extract it as follows:
```bash
tar xf /mnt/c/Users/<user name>/Downloads/qbpp_<arch>_<version>.tar.gz
```

It is recommended to create a symbolic link to the extracted directory:
```bash
ln -s qbpp_<arch>_<version> qbpp
```

To upgrade, download the new release and update the symbolic link:
```bash
ln -sfn qbpp_<arch>_<new version> qbpp
```

## Execute ABS3 GPU Solver
If your system has a **CUDA-enabled GPU**, the ABS3 GPU Solver can be executed from WSL.

To enable GPU acceleration in WSL, install the **NVIDIA GPU driver for Windows** from the following page:

https://www.nvidia.com/Download/index.aspx

> **NOTE**
> Do not install a Linux GPU driver inside WSL.
> WSL uses the Windows GPU driver via its integration layer.


After installing the driver, verify that the GPU is available in WSL by executing:
```bash
nvidia-smi
```
If the driver is installed correctly, this command displays information about the installed GPU.
You can then save the LABS program on the [ABS3 Solver](ABS3) page as `labs_abs3.cpp`, and compile and run it as follows to run the ABS3 GPU Solver on the GPU:
```bash
g++ labs_abs3.cpp -o labs_abs3 -std=c++17 -Wfloat-conversion -ldl -pthread
./labs_abs3
```
