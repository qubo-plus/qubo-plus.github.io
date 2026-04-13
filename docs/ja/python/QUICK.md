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

このページでは、PyQBPPのクイックスタート手順の概要を説明します。

## インストール

[**インストール**](INSTALL)の手順に従ってPyQBPPをインストールしてください。

## サンプルプログラムの作成と実行

### PyQBPP サンプルプログラムの作成
以下の PyQBPP サンプルプログラムを作成し、**`test.py`** として保存してください：
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

このプログラムでは，次の式 $f$ を展開整理して得られた QUBO 式を EasySolver で解を求めます．

$$
\begin{aligned}
f &= (a+2b+3c-4)^2
\end{aligned}
$$

### プログラムの実行
`test.py` を以下のように実行すると，$f$ を展開して得られた式と解を表示します：
{% raw %}
```bash
python3 test.py
f = 16 -7*a -12*b -15*c +4*a*b +6*a*c +12*b*c
sol = Sol(energy=0, {a: 1, b: 0, c: 1})
```
{% endraw %}

## 次のステップ
1. ライセンスを有効化してください。詳細は[**ライセンス管理**](../LICENSE_MANAGEMENT)を参照してください。
2. PyQBPPの基礎を学びましょう。[**PyQBPP (Python)**](./)の**基礎**から始めてください。
