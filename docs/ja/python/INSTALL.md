---
layout: default
title: "Installation"
nav_order: 3
lang: ja
hreflang_alt: "en/python/INSTALL"
hreflang_lang: "en"
---

# インストール

## 対応環境
- Linux (Ubuntu 20.04以降)
- x86_64またはarm64 (aarch64) CPU
- Python 3.8以降

## インストール

PyQBPPは[PyPI](https://pypi.org/project/pyqbpp/)で公開されています。
パッケージの詳細については、[PyQBPP PyPIページ](https://pypi.org/project/pyqbpp/)を参照してください。

PyQBPPのインストールには、Python仮想環境(venv)の使用を推奨します。
sudo権限は不要です。

```bash
python3 -m venv ~/qbpp-env
source ~/qbpp-env/bin/activate
pip install pyqbpp
```

最新バージョンへのアップグレード:
```bash
pip install --upgrade pyqbpp
```

## ライセンスの有効化

インストール後、ライセンスを有効化してPyQBPPの使用を開始します:

```bash
qbpp-license -k XXXXXX-XXXXXX-XXXXXX-XXXXXX -a
```

ライセンスキーが設定されていない場合、**匿名トライアル**（7日間、1,000変数）が有効化されます。

ライセンスの種類、無効化、トラブルシューティングなどの詳細については、**[ライセンス管理](../LICENSE_MANAGEMENT)**を参照してください。
