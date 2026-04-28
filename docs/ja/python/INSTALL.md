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

PyQBPP は以下の CPU を搭載した Linux ベースのシステムで動作します：
* **amd64**: 64ビット Intel および AMD プロセッサ
* **arm64**: 64ビット ARM プロセッサ (aarch64)

必要条件：
* Ubuntu 20.04 以降（glibc 2.31 以上、manylinux_2_31 wheel）
* Python 3.8 以降
* `pip` 20.3 以降（PEP 600 manylinux_2_31 wheel に対応するため）

Windows ユーザーは [WSL (Windows Subsystem for Linux)](../WSL) を通じて PyQBPP を使用できます。

## インストール

PyQBPP のインストール方法は2つあります：
- **方法1: PyPI（推奨）** — Python Package Index から公開パッケージを直接インストール。
- **方法2: ローカル wheel** — ダウンロードした `.whl` ファイルからインストール（オフライン環境や特定バージョンを固定したい場合に便利）。

どちらの方法も、Python 仮想環境（venv）内でインストールすれば sudo 権限は不要です。

## 方法1: PyPI によるインストール（推奨）

PyQBPP は [PyPI](https://pypi.org/project/pyqbpp/) で公開されています。
パッケージの詳細については、[PyQBPP PyPI ページ](https://pypi.org/project/pyqbpp/)を参照してください。

システムのパッケージと分離するため、Python 仮想環境（venv）の使用を推奨します：

```bash
python3 -m venv ~/qbpp-env
source ~/qbpp-env/bin/activate
pip install pyqbpp
```

### アップグレード

```bash
pip install --upgrade pyqbpp
```

### アンインストール

```bash
pip uninstall pyqbpp
```

## 方法2: ローカル wheel によるインストール

[**Latest Releases**](https://github.com/qubo-plus/qbpp/releases/latest) ページから最新の PyQBPP リリースの `.whl` ファイルをダウンロードし、`pip` でインストールします：

```bash
python3 -m venv ~/qbpp-env
source ~/qbpp-env/bin/activate
pip install pyqbpp-<VERSION>-py3-none-manylinux_2_31_x86_64.whl
```

`<VERSION>` は実際のリリースバージョンに置き換え、CPU アーキテクチャに応じて wheel を選択してください（amd64 なら `x86_64`、arm64 なら `aarch64`）。

環境変数の設定は不要です。
wheel には共有ライブラリ（`qbpp_*.so`、`easysolver_*.so`、`exhaustive_*.so`）と `qbpp-license` コマンドがすべて同梱されており、`pip` が仮想環境内に自動的に配置します。

## PyQBPP のインポート

PyQBPP は、係数型・エネルギー型の組み合わせごとに複数のサブモジュールを提供しています。扱う係数・エネルギーの大きさに応じて選択してください：

```python
import pyqbpp as qbpp                # デフォルト: coeff=int32, energy=int64 (c32e64)
# import pyqbpp.c32e32 as qbpp       # coeff=int32, energy=int32
# import pyqbpp.c64e64 as qbpp       # coeff=int64, energy=int64
# import pyqbpp.c64e128 as qbpp      # coeff=int64, energy=int128
# import pyqbpp.c128e128 as qbpp     # coeff=int128, energy=int128
# import pyqbpp.cppint as qbpp       # coeff=cpp_int, energy=cpp_int（任意精度）
```

`import pyqbpp as qbpp` は `import pyqbpp.c32e64 as qbpp` と等価であり、ほとんどの問題ではこれで十分です。
目的関数の係数やエネルギーが 32/64 ビット整数をオーバーフローし得る場合は、より大きい型のバリアントを使用してください。任意精度演算が必要な場合は `pyqbpp.cppint` を選びます。

1つの Python プロセスからは1つのバリアントのみをインポートしてください。

## ライセンスのアクティベーション

インストール後、ライセンスをアクティベートして PyQBPP の使用を開始します：

```bash
qbpp-license -k XXXXXX-XXXXXX-XXXXXX-XXXXXX -a
```

`qbpp-license` コマンドは wheel によって仮想環境の `bin/` ディレクトリにインストールされるため、venv をアクティベートすると自動的に `PATH` 上で利用可能になります。

ライセンスキーが設定されていない場合、初回使用時に **Anonymous Trial**（7日間、1,000変数）が自動的にアクティベートされます。

### 実行時に `QBPP_LICENSE_KEY` を使う

`qbpp-license -a` によるアクティベーションの代わりに、`QBPP_LICENSE_KEY` 環境変数でライセンスキーを渡すこともできます。コンテナ、CI ジョブ、Lambda／サーバレス環境など、ライセンスファイルを保存するのが難しい環境で特に便利です：

```bash
export QBPP_LICENSE_KEY=XXXXXX-XXXXXX-XXXXXX-XXXXXX
python3 my_qbpp_program.py
```

`QBPP_LICENSE_KEY` が設定されている場合、PyQBPP はディスクに状態を書き込まず、実行時にそのキーを直接使用します。

ライセンスの種類、ディアクティベーション、トラブルシューティングなどの詳細は **[ライセンス管理](../LICENSE_MANAGEMENT)** をご覧ください。
