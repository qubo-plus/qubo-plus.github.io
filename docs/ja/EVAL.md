---
layout: default
nav_exclude: true
title: "Evaluating Expressions"
nav_order: 16
lang: ja
hreflang_alt: "en/EVAL"
hreflang_lang: "en"
---

# 式の評価

## qbpp::MapListを使用した評価
式の値は、変数とその値のペアのリストとして全要素への値の割り当てを提供することで簡単に計算できます。
リストは **`qbpp::MapList`** オブジェクトとして定義できます。
例えば、以下のプログラムは $(x,y,z)=(0,1,1)$ に対して関数 $f(x,y,z)$ を計算します。
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto y = qbpp::var("y");
  auto z = qbpp::var("z");
  auto f = qbpp::sqr(x + 2 * y + 3 * z - 3);

  qbpp::MapList ml;
  ml.push_back({x, 0});
  ml.push_back({y, 1});
  ml.push_back({z, 1});

  std::cout << ml << std::endl;
  std::cout << "f(0,1,1) = " << f(ml) << std::endl;
}
```

このプログラムでは、`qbpp::MapList` オブジェクト `ml` を定義し、割り当て `{x, 0}`、`{y, 1}`、`{z, 1}` を `ml` に追加しています。
そして `f(ml)` は $f(0,1,1)$ の値を返します。
このプログラムは以下の出力を表示します:

{% raw %}
```
{{x,0},{y,1},{z,1}}
f(0,1,1) = 4
```
{% endraw %}

あるいは、以下のように割り当てを直接指定することもできます:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto y = qbpp::var("y");
  auto z = qbpp::var("z");
  auto f = qbpp::sqr(x + 2 * y + 3 * z - 3);

  std::cout << "f(0,1,1) = " << f({{x, 0}, {y, 1}, {z, 1}}) << std::endl;
}
```
{% endraw %}


## qbpp::Solを使用した評価
解オブジェクト（**`qbpp::Sol`**）を使用して式（**`qbpp::Expr`**）の値を評価できます。
これを行うには、まず与えられた式 `f` に関連付けられた `qbpp::Sol` オブジェクト sol を構築します。
新しく作成された **`qbpp::Sol`** オブジェクトは全てゼロの割り当てで初期化されます。

`qbpp::Sol` の **`set()`** メンバ関数を使用して、個々の変数に値を割り当てることができます。
そして、**`f(sol)`** と **`sol(f)`** の両方が、sol に格納された割り当ての下での式 f の値を返します。
さらに、**`comp_energy()`** メンバ関数も同じ値を計算して返します。


```cpp
#include <qbpp/qbpp.hpp>

int main() {
  auto x = qbpp::var("x");
  auto y = qbpp::var("y");
  auto z = qbpp::var("z");
  auto f = qbpp::sqr(x + 2 * y + 3 * z - 3);

  qbpp::Sol sol(f);
  sol.set(y, 1);
  sol.set(z, 1);

  std::cout << "f(0,1,1) = " << f(sol) << std::endl;
  std::cout << "f(0,1,1) = " << sol(f) << std::endl;
  std::cout << "f(0,1,1) = " << sol.comp_energy() << std::endl;
}
```

解オブジェクト `sol` のメンバ関数 **`comp_energy()`** はエネルギー値を計算し、内部にキャッシュすることに注意してください。
また、ソルバーが返す解オブジェクトは、既にエネルギー値が計算されキャッシュされています。
再計算せずにエネルギーを取得するには、以下に示すようにメンバ関数 **`energy()`** を使用できます:
{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  auto x = qbpp::var("x");
  auto y = qbpp::var("y");
  auto z = qbpp::var("z");
  auto f = qbpp::sqr(x + 2 * y + 3 * z - 4);

  f.simplify_as_binary();
  auto solver = qbpp::easy_solver::EasySolver(f);
  auto sol = solver.search({{"target_energy", 0}});

  std::cout << "sol = " << sol << std::endl;
  std::cout << "energy = " << sol.energy() << std::endl;

  sol.flip(z);
  std::cout << "flipped sol = " << sol << std::endl;
  std::cout << "flipped energy = " << sol.energy() << std::endl;
}
```
{% endraw %}
このプログラムでは、`sol.energy()` は正しく0を返します。
しかし、変数 `z` をフリップした後、キャッシュされたエネルギー値は無効になります。
エネルギーを再計算せずに `sol.energy()` を呼び出すと、以下のように**ランタイムエラー**が発生します:
{% raw %}
```
sol = 0:{{x,1},{y,0},{z,1}}
energy = 0
terminate called after throwing an instance of 'std::runtime_error'
```
{% endraw %}
この問題を解決するには、解を変更した後に **`sol.comp_energy()`** を呼び出してエネルギーを明示的に再計算する必要があります:
```cpp
  std::cout << "sol = " << sol << std::endl;
  std::cout << "energy = " << sol.energy() << std::endl;

  sol.flip(z);
  std::cout << "sol.comp_energy() = " << sol.comp_energy() << std::endl;
  std::cout << "flipped sol = " << sol << std::endl;
  std::cout << "flipped energy = " << sol.energy() << std::endl;
```
このプログラムは以下の出力を生成します:
{% raw %}
```
sol = 0:{{x,1},{y,0},{z,1}}
energy = 0
sol.comp_energy() = 9
flipped sol = 9:{{x,1},{y,0},{z,0}}
flipped energy = 9
```
{% endraw %}
