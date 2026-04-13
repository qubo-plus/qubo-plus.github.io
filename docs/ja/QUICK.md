---
layout: default
title: "Quick Start"
nav_order: 4
lang: ja
hreflang_alt: "en/QUICK"
hreflang_lang: "en"
---

# クイックスタート

> **インストール不要で試す:** [**Playground**](PLAYGROUND) を使えば、ブラウザ上ですぐに QUBO++ を試すことができます。

このページでは、クイックスタートの手順の概要を説明します。
Windows 11 の WSL 上に QUBO++ をインストールするより詳細な手順は [Windows (WSL) でのクイックスタート](WSL) をご覧ください。

## インストール

[**インストール**](INSTALL) の手順に従って QUBO++ をインストールしてください。
Windows ユーザーは [**Windows (WSL) でのクイックスタート**](WSL) をご覧ください。

## サンプルプログラムのコンパイルと実行
### QUBO++ サンプルプログラムの作成
以下の QUBO++ サンプルプログラムを作成し、ファイル **`test.cpp`** として保存してください：
{% raw %}
```cpp
#include <qbpp/easy_solver.hpp>
#include <qbpp/qbpp.hpp>

int main() {
  auto a = qbpp::var("a");
  auto b = qbpp::var("b");
  auto c = qbpp::var("c");
  auto f = qbpp::sqr(a + 2 * b + 3 * c - 4);
  f.simplify_as_binary();

  std::cout << "f = " << f << std::endl;

  auto solver = qbpp::EasySolver(f);
  auto sol = solver.search({{"time_limit", 10}, {"target_energy", 0}});
  std::cout << "sol = " << sol << std::endl;
}
```
{% endraw %}
このプログラムでは，次の式$f$を展開整理して得られたQUBO式をEasySolverで解を求めます．

$$
\begin{aligned}
f &= (a+2b+3c-4)^2
\end{aligned}
$$

### プログラムのコンパイル
**`test.cpp`** をコンパイルして実行ファイル **`test`** を生成します：
```bash
g++ test.cpp -o test -std=c++17 -ldl -pthread
```
このコマンドにより、test という名前の実行ファイルが作成されます。
コンパイラオプションの意味は以下の通りです：
- **`-std=c++17`**: C++17 標準を使用します。
- **`-ldl`**: 動的ローダライブラリをリンクします（QUBO++ は実行時に `dlopen` で .so をロードします）。
- **`-pthread`**: POSIX スレッドを有効にします（QUBO++ ソルバーが使用）。

### プログラムの実行
`test` を以下のように実行すると，$f$を展開して得られた式と解を表示します：
{% raw %}
```bash
./test
f = 16 -7*a -12*b -15*c +4*a*b +6*a*c +12*b*c
sol = 0:{{a,1},{b,0},{c,1}}
```
{% endraw %}

## 次のステップ
1. ライセンスをアクティベートしてください。詳細は [**ライセンス管理**](LICENSE_MANAGEMENT) をご覧ください。
2. QUBO++ の基本を学びましょう。[**QUBO++ (C++)**](DOCUMENT) の **基礎** から始めてください。
3. [**ケーススタディ**](CASE_STUDIES) で QUBO++ プログラムの例を探索してください。
