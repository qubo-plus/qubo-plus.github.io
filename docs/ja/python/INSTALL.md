---
last_modified: 2026-10-10
layout: default
title: "インストール"
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
- **方法2: ダウンロードしたファイルからインストール** — インターネットに接続していないマシン向け。

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

### 共有ライブラリのダウンロード（初回のみ）

PyPI の wheel には Python のコードと `qbpp-license` コマンドだけが入っています。
共有ライブラリ（`qbpp_*.so`、`easysolver_*.so`、`exhaustive_*.so`、`abs3_*.so` など、約 330 MB）は、PyQBPP を初めて使うときに [GitHub Releases](https://github.com/qubo-plus/qbpp/releases) から自動でダウンロードされ、`~/.cache/pyqbpp/` に置かれます。
2回目以降はそれを使うので、ダウンロードはバージョンごとに1回だけです。
ダウンロードしたファイルは、wheel に記録されたチェックサム（SHA-256）で検査してから展開します。

- 保存先を変えるときは、環境変数 `PYQBPP_CACHE_DIR` にディレクトリを指定します。
- 前もってダウンロードしておくには（コンテナイメージを作るときなど）、次を実行します：

  ```bash
  python -m pyqbpp download
  ```

- アップグレード後に新しいバージョンをダウンロードしたとき、14日以上使われていない古いバージョンは削除されます。

### アップグレード

```bash
pip install --upgrade pyqbpp
```

### アンインストール

```bash
pip uninstall pyqbpp
rm -rf ~/.cache/pyqbpp
```

2行目は、ダウンロードした共有ライブラリを削除します（`PYQBPP_CACHE_DIR` を指定していた場合は、そのディレクトリ）。

## 方法2: ダウンロードしたファイルからのインストール

インターネットに接続していないマシンでは、接続できるマシンで [**Latest Releases**](https://github.com/qubo-plus/qbpp/releases/latest) ページから次の2つのファイルをダウンロードして持ち込みます：

- wheel：`pyqbpp-<VERSION>-py3-none-manylinux_2_31_<ARCH>.whl`
- 共有ライブラリ：`pyqbpp-native-<VERSION>-linux-<ARCH>.tar.gz`

`<ARCH>` は CPU アーキテクチャに応じて選びます（amd64 なら `x86_64`、arm64 なら `aarch64`）。
2つのファイルは同じリリースのものを使ってください（wheel のファイル名の `<VERSION>` は、`2026.10.9` のように先頭の 0 を除いた形になっています）。

```bash
python3 -m venv ~/qbpp-env
source ~/qbpp-env/bin/activate
pip install pyqbpp-<VERSION>-py3-none-manylinux_2_31_x86_64.whl
python -m pyqbpp download pyqbpp-native-<VERSION>-linux-x86_64.tar.gz
```

最後の行で、共有ライブラリをチェックサムで検査してから `~/.cache/pyqbpp/` に展開します。

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

1つの Python プロセスで使えるバリアントは1つだけです。あるバリアントを読み込んだ後に別のバリアントをインポートすると `ImportError` になります（異なるバリアントのオブジェクトは混在できません）。`pyqbpp` と `pyqbpp.c32e64` のように同じバリアントを別名でインポートするのは問題ありません。バリアントを切り替えるときは、インタプリタまたは Jupyter のカーネルを再起動してください。

## ライセンスのアクティベーション

インストール後、ライセンスをアクティベートして PyQBPP の使用を開始します：

```bash
qbpp-license -k XXXXXX-XXXXXX-XXXXXX-XXXXXX -a
```

`qbpp-license` コマンドは wheel によって仮想環境の `bin/` ディレクトリにインストールされるため、venv をアクティベートすると自動的に `PATH` 上で利用可能になります。

無料の **Trial ライセンス**（30日間、10,000変数）は [QUBO++ User Portal](https://qubo-plus.github.io/portal/) で取得できます。`qbpp-license -s` を実行してサインアップコードを得て、portal で登録、`qbpp-license -k <KEY> -a` で受け取ったキーをアクティベートしてください。

### 実行時に `QBPP_LICENSE_KEY` を使う

`qbpp-license -a` によるアクティベーションの代わりに、`QBPP_LICENSE_KEY` 環境変数でライセンスキーを渡すこともできます。コンテナ、CI ジョブ、Lambda／サーバレス環境など、ライセンスファイルを保存するのが難しい環境で特に便利です：

```bash
export QBPP_LICENSE_KEY=XXXXXX-XXXXXX-XXXXXX-XXXXXX
python3 my_qbpp_program.py
```

`QBPP_LICENSE_KEY` が設定されている場合、PyQBPP はディスクに状態を書き込まず、実行時にそのキーを直接使用します。

ライセンスの種類、ディアクティベーション、トラブルシューティングなどの詳細は **[ライセンス管理](../LICENSE_MANAGEMENT)** をご覧ください。
