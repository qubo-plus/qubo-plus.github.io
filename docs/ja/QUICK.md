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
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto x = 0 <= qbpp::var_int("x") <= 10;
  auto y = 0 <= qbpp::var_int("y") <= 10;
  auto f = x + y == 10;
  auto g = 2 * x + 4 * y == 28;
  auto h = f + g;
  h.simplify_as_binary();
  std::cout << "h = " << h << std::endl;
  auto solver = qbpp::exhaustive_solver::ExhaustiveSolver(h);
  auto sol = solver.search();
  std::cout << "sol = " << sol << std::endl;
  std::cout << "x = " << sol(x) << ", y = " << sol(y) << std::endl;
}
```

### プログラムのコンパイル
**`test.cpp`** をコンパイルして実行ファイル **`test`** を生成します：
```bash
g++ test.cpp -o test -std=c++17 -lqbpp -ldl
```
このコマンドにより、test という名前の実行ファイルが作成されます。
コンパイラオプションの意味は以下の通りです：
- **`-std=c++17`**: C++17 標準を使用します。
- **`-lqbpp`**: QUBO++ 共有ライブラリをリンクします。
- **`-ldl`**: 動的ローダライブラリをリンクします（.so の遅延ロード用）。

### プログラムの実行
`test` を以下のように実行します：
{% raw %}
```bash
./test
h = -127*x[0] - 244*x[1] - 448*x[2] - 351*x[3] - 227*y[0] - 420*y[1] - 704*y[2] - 579*y[3] + 20*x[0]*x[1] + 40*x[0]*x[2] + 30*x[0]*x[3] + 18*x[0]*y[0] + 36*x[0]*y[1] + 72*x[0]*y[2] + 54*x[0]*y[3] + 80*x[1]*x[2] + 60*x[1]*x[3] + 36*x[1]*y[0] + 72*x[1]*y[1] + 144*x[1]*y[2] + 108*x[1]*y[3] + 120*x[2]*x[3] + 72*x[2]*y[0] + 144*x[2]*y[1] + 288*x[2]*y[2] + 216*x[2]*y[3] + 54*x[3]*y[0] + 108*x[3]*y[1] + 216*x[3]*y[2] + 162*x[3]*y[3] + 68*y[0]*y[1] + 136*y[0]*y[2] + 102*y[0]*y[3] + 272*y[1]*y[2] + 204*y[1]*y[3] + 408*y[2]*y[3] + 884
sol = 0:{{x[0],1},{x[1],1},{x[2],0},{x[3],1},{y[0],0},{y[1],0},{y[2],1},{y[3],0}}
x = 6, y = 4
```
{% endraw %}

## 次のステップ
1. ライセンスをアクティベートしてください。詳細は [**ライセンス管理**](LICENSE_MANAGEMENT) をご覧ください。
2. QUBO++ の基本を学びましょう。[**QUBO++ (C++)**](DOCUMENT) の **基礎** から始めてください。
3. [**ケーススタディ**](CASE_STUDIES) で QUBO++ プログラムの例を探索してください。
