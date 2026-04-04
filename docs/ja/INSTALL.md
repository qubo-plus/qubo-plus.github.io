---
layout: default
title: "Installation"
nav_order: 3
lang: ja
hreflang_alt: "en/INSTALL"
hreflang_lang: "en"
---

# インストール

## 対応環境

QUBO++ は以下の CPU を搭載した Linux ベースのシステムで動作します：
* **amd64**: 64ビット Intel および AMD プロセッサ
* **arm64**: 64ビット ARM プロセッサ

Ubuntu 20.04 以降を推奨します。
Windows ユーザーは [WSL (Windows Subsystem for Linux)](WSL) を通じて QUBO++ を使用できます。

## インストール

QUBO++ のインストール方法は2つあります：
- **方法1: apt（推奨）** — パスの自動設定を含むシンプルなインストール。sudo 権限が必要です。
- **方法2: tar.gz** — apt リポジトリの設定が不要な手動インストール。sudo 権限は不要です。

## 方法1: apt によるインストール（推奨）

### ステップ1: QUBO++ リポジトリの追加

署名鍵をダウンロードし、リポジトリを追加します：
```bash
curl -fsSL https://qubo-plus.github.io/qbpp-apt/qbpp.gpg \
  | sudo tee /usr/share/keyrings/qbpp.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/qbpp.gpg] https://qubo-plus.github.io/qbpp-apt stable main" \
  | sudo tee /etc/apt/sources.list.d/qbpp.list > /dev/null
```

### ステップ2: QUBO++ のインストール
```bash
sudo apt update
sudo apt install qbpp
```

これにより、ヘッダファイルが `/usr/local/include/qbpp/` に、共有ライブラリが `/usr/local/lib/` に、`qbpp-license` コマンドが `/usr/local/bin/` に自動的にインストールされます。
環境変数の設定は不要です。

### アップグレード
```bash
sudo apt update
sudo apt install --only-upgrade qbpp
```

### アンインストール
```bash
sudo apt remove qbpp
```

## 方法2: tar.gz によるインストール

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

## ライセンスのアクティベーション

インストール後、ライセンスをアクティベートして QUBO++ の使用を開始します：

```bash
qbpp-license -k XXXXXX-XXXXXX-XXXXXX-XXXXXX -a
```

ライセンスキーが設定されていない場合、**Anonymous Trial**（7日間、1,000変数）がアクティベートされます。

ライセンスの種類、ディアクティベーション、トラブルシューティングなどの詳細は **[ライセンス管理](LICENSE_MANAGEMENT)** をご覧ください。
