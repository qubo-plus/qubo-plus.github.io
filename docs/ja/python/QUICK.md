---
layout: default
title: "Quick Start"
nav_order: 4
lang: ja
hreflang_alt: "en/python/QUICK"
hreflang_lang: "en"
---

# クイックスタート

> **インストール不要で試す:** [**PyQBPP Playground**](PLAYGROUND) を使えば、ブラウザ上ですぐに PyQBPP を試すことができます。

このページでは、PyQBPP のクイックスタート手順の概要を説明します。
Windows 11 の WSL 上に PyQBPP をインストールするより詳細な手順は [Windows (WSL) でのクイックスタート](../WSL) をご覧ください。

## インストール

[**インストール**](INSTALL) の手順に従って PyQBPP をインストールしてください。
Windows ユーザーは [**Windows (WSL) でのクイックスタート**](../WSL) をご覧ください。

PyQBPP は PyPI で配布されており，通常は以下のコマンドでインストールできます：
```bash
pip install pyqbpp
```
PyQBPP は `libqbpp*.so` 共有ライブラリを同梱しており，実行時に `ctypes` 経由でロードします。

## サンプルプログラムの作成と実行

### PyQBPP サンプルプログラムの作成
以下の PyQBPP サンプルプログラムを作成し、**`test.py`** として保存してください：
{% raw %}
```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
f = qbpp.sqr(a + 2 * b + 3 * c - 4)
f = qbpp.simplify_as_binary(f)
print("f =", f)

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=10, target_energy=0)
print("sol =", sol)
```
{% endraw %}

このプログラムでは，次の式 $f$ を展開整理して得られた QUBO 式を EasySolver で解を求めます．

$$
\begin{aligned}
f &= (a+2b+3c-4)^2
\end{aligned}
$$

このサンプルで使用している主な API は以下の通りです：
- **`qbpp.var(name)`**: 指定した名前のバイナリ変数を生成します。
- **`qbpp.sqr(expr)`**: 式を二乗して展開した結果を返します。
- **`qbpp.simplify_as_binary(expr)`**: バイナリ（0/1）ルール（`x*x = x`，`x*~x = 0` 等）を適用し，同類項をまとめます。
- **`qbpp.EasySolver(expr)`**: 指定した QUBO 式に対するソルバーを生成します。
- **`solver.search(**kwargs)`**: ソルバーを実行します。`time_limit`（秒）や `target_energy` などのパラメータはキーワード引数で渡します。

### プログラムの実行
`test.py` を以下のように実行すると，$f$ を展開して得られた式と解を表示します：
{% raw %}
```bash
python3 test.py
f = 16 -7*a -12*b -15*c +4*a*b +6*a*c +12*b*c
sol = Sol(energy=0, {a: 1, b: 0, c: 1})
```
{% endraw %}
出力の 1 行目は $f$ を展開した QUBO 式です。
2 行目はソルバーが見つけた解で，エネルギー値（この例では 0 となり `target_energy` に一致）と変数割り当て $(a, b, c) = (1, 0, 1)$ を示しています。

## 次のステップ
1. ライセンスを有効化してください。詳細は [**ライセンス管理**](../LICENSE_MANAGEMENT) を参照してください。
2. PyQBPP の基礎を学びましょう。[**PyQBPP (Python)**](./) の **基礎** から始めてください。
3. [**ケーススタディ**](CASE_STUDIES) で PyQBPP プログラムの例を探索してください。
