---
last_modified: 2026-10-27
layout: default
title: "インストール"
nav_order: 3
lang: ja
hreflang_alt: "en/INSTALL"
hreflang_lang: "en"
---

# インストール

## 対応環境

QUBO++ は以下の CPU を搭載した Linux ベースのシステムで動作します：
* **amd64**: 64ビット Intel および AMD プロセッサ
* **arm64**: 64ビット ARM プロセッサ（NVIDIA DGX Spark などの GB10 搭載機、GB200 などの Grace 搭載機を含む。GPU ソルバーはこれらの機械の GPU も使います）

Ubuntu 20.04 以降を推奨します。
Windows ユーザーは [WSL (Windows Subsystem for Linux)](WSL) を通じて QUBO++ を使用できます。

## インストール

QUBO++ のインストール方法は3つあります：
- **方法1: apt（推奨）** — パスの自動設定を含むシンプルなインストール。sudo 権限が必要です。
- **方法2: .deb ファイル** — Releases ページからダウンロードした `.deb` ファイルを apt でインストールします。sudo 権限が必要です。
- **方法3: tar.gz** — apt リポジトリの設定が不要な手動インストール。sudo 権限は不要です。

## 方法1: apt によるインストール（推奨）

> **2026.10.06 以前の版を apt でインストールした方へ**: 2026.10.10 から、APT リポジトリの場所が GitHub Releases に変わりました。
> 古い設定のままでは、`apt update` をしてもエラーにならず、2026.10.06 から先の版に更新されません。
> 下の[アップグレード](#アップグレード)にある手順で、リポジトリの設定を一度だけ書き換えてください。

### ステップ1: QUBO++ リポジトリの追加

署名鍵をダウンロードし、リポジトリを追加します：
```bash
curl -fsSL https://qubo-plus.github.io/qbpp-apt/qbpp.gpg \
  | sudo tee /usr/share/keyrings/qbpp.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/qbpp.gpg] https://github.com/qubo-plus/qbpp-apt/releases/download/stable ./" \
  | sudo tee /etc/apt/sources.list.d/qbpp.list > /dev/null
```

### ステップ2: QUBO++ のインストール
```bash
sudo apt update
sudo apt install qbpp
```

これにより、ヘッダファイルが `/usr/include/qbpp/` に、共有ライブラリが `/usr/lib/qbpp/` に（`ldconfig` に登録）、`qbpp-license` コマンドが `/usr/bin/` に自動的にインストールされます。
環境変数の設定は不要です。

### アップグレード

2026.10.06 以前の版をインストールしていた場合は、先にリポジトリの設定を一度だけ書き換えてください（2026.10.10 から、APT リポジトリの場所が GitHub Releases に変わりました）：
```bash
echo "deb [signed-by=/usr/share/keyrings/qbpp.gpg] https://github.com/qubo-plus/qbpp-apt/releases/download/stable ./" \
  | sudo tee /etc/apt/sources.list.d/qbpp.list > /dev/null
```

続けて、次のようにアップグレードします：
```bash
sudo apt update
sudo apt install --only-upgrade qbpp
```

### アンインストール
```bash
sudo apt remove qbpp
```

## 方法2: .deb ファイルによるインストール

古い apt（Ubuntu 20.04 など）では、方法1が失敗することがあります。その場合はこの方法でインストールしてください。

[**Latest Releases**](https://github.com/qubo-plus/qbpp/releases/latest) ページから、CPU に合った `.deb` ファイル（`qbpp_<version>_amd64.deb` または `qbpp_<version>_arm64.deb`）をダウンロードし、apt でインストールします：
```bash
sudo apt install ./qbpp_<version>_<arch>.deb
```

## 方法3: tar.gz によるインストール

[**Latest Releases**](https://github.com/qubo-plus/qbpp/releases/latest) ページから最新の QUBO++ リリースの `.tar.gz` ファイルをダウンロードします。
以下のようにアーカイブを展開します：
```bash
tar xf qbpp_<arch>_<version>.tar.gz
```

### 環境変数の設定
QUBO++ プログラムをコンパイル・実行するには、以下の環境変数を設定します。
シェル起動時に自動的に設定されるよう、**`~/.bashrc`** の末尾に以下の行を追加してください：
```bash
export QBPP_PATH=[QUBO++ インストールディレクトリ]

export CPLUS_INCLUDE_PATH=$QBPP_PATH/include:$CPLUS_INCLUDE_PATH
export LIBRARY_PATH=$QBPP_PATH/lib:$LIBRARY_PATH
export LD_LIBRARY_PATH=$QBPP_PATH/lib:$LD_LIBRARY_PATH
export PATH=$QBPP_PATH/bin:$PATH

```

多倍長整数の変種（`INTEGER_TYPE_CPP_INT`）を使う場合は、Boost のヘッダも必要です（APT でインストールした場合は依存関係として自動で入ります）：
```bash
sudo apt install -y libboost-dev
```

## ライセンスのアクティベーション

インストール後、ライセンスをアクティベートして QUBO++ の使用を開始します：

```bash
qbpp-license -k XXXXXX-XXXXXX-XXXXXX-XXXXXX -a
```

無料の **Trial ライセンス**（30日間、10,000変数）は [QUBO++ User Portal](https://qubo-plus.github.io/portal/) で取得できます。`qbpp-license -s` を実行してサインアップコードを得て、portal で登録すると Trial キーが受け取れます。portal の **Start/Renew** ボタンを押すと Trial が始まり、30 日間有効になります（[Trial ライセンスの取得](LICENSE_MANAGEMENT#trial-ライセンスの取得)）。

ライセンスの種類、ディアクティベーション、トラブルシューティングなどの詳細は **[ライセンス管理](LICENSE_MANAGEMENT)** をご覧ください。
