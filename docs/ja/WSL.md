---
layout: default
nav_exclude: true
title: "Windows (WSL)"
nav_order: 1
lang: ja
hreflang_alt: "en/WSL"
hreflang_lang: "en"
---

# Windows (WSL) でのクイックスタート
Windows 11 では、**WSL (Windows Subsystem for Linux)** を通じて QUBO++ を使用できます。WSL により、Linux プログラムを Windows 上でネイティブに実行できます。

このドキュメントでは、WSL、必要なライブラリ、QUBO++ のインストール方法、およびサンプルプログラムのコンパイルと実行方法を説明します。

## WSL のインストール
Windows 11 では、**WSL** は Windows PowerShell からインストールできます。
PowerShell を管理者として開き、以下のコマンドを実行してください：
```
C:\WINDOWS\System32> wsl --install
Provisioning the new WSL instance Ubuntu
This might take a while...
Create a default Unix user account: [ユーザーアカウント名]
New password: [パスワード]
Retype new password: [パスワード]
passwd: password updated successfully
To run a command as administrator (user "root"), use "sudo <command>".
See "man sudo_root" for details.
```
プロンプトが表示されたら、**[ユーザーアカウント名]** と **[パスワード]** を入力してください。
これにより WSL 2 と Windows 上で動作する Ubuntu ベースの Linux システムがインストールされます。

インストールが完了したら、WSL 内でシステムソフトウェアを更新・アップグレードしてください：
```bash
sudo apt update
sudo apt upgrade -y
```

## C++ コンパイラのインストール
QUBO++ には **C++ コンパイラ** が必要です。

以下のコマンドでインストールしてください：
```bash
sudo apt install -y build-essential
```

## QUBO++ のインストール

[**インストール**](INSTALL) の手順に従って QUBO++ をインストールしてください。

**方法2（tar.gz）** を使用する場合は、以下の WSL 固有の注意点があります：

Windows PC のアーキテクチャに応じて、[**Latest Release**](https://github.com/qubo-plus/qbpp/releases/latest) ページから以下のファイルのいずれかをダウンロードしてください：
- **`qbpp_amd64_<version>.tar.gz`** : Intel または AMD ベースの Windows PC 用
- **`qbpp_arm64_<version>.tar.gz`** : ARM ベースの Windows PC 用（例：Copilot+ PC）

ファイルが Windows のダウンロードフォルダにダウンロードされた場合、以下のように展開します：
```bash
tar xf /mnt/c/Users/<ユーザー名>/Downloads/qbpp_<arch>_<version>.tar.gz
```

展開したディレクトリへのシンボリックリンクを作成することを推奨します：
```bash
ln -s qbpp_<arch>_<version> qbpp
```

アップグレードする場合は、新しいリリースをダウンロードしてシンボリックリンクを更新してください：
```bash
ln -sfn qbpp_<arch>_<new version> qbpp
```

## ABS3 GPU Solver の実行
システムに **CUDA 対応 GPU** がある場合、WSL から ABS3 GPU Solver を実行できます。

WSL で GPU アクセラレーションを有効にするには、以下のページから **NVIDIA GPU ドライバ（Windows 用）** をインストールしてください：

https://www.nvidia.com/Download/index.aspx

> **注意**
> WSL 内に Linux 用 GPU ドライバをインストールしないでください。
> WSL は統合レイヤーを通じて Windows の GPU ドライバを使用します。


ドライバをインストールしたら、以下のコマンドを実行して WSL で GPU が利用可能か確認してください：
```bash
nvidia-smi
```
ドライバが正しくインストールされていれば、インストールされた GPU の情報が表示されます。
その後、以下のようにして ABS3 GPU Solver を使用するサンプルプログラムを実行できます：
```bash
./labs_abs3
```
