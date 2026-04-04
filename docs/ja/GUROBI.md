---
layout: default
nav_exclude: true
title: "Gurobi Solver"
nav_order: 22
lang: ja
hreflang_alt: "en/GUROBI"
hreflang_lang: "en"
---

# Gurobi Optimizerの使い方

QUBO++はGurobi Optimizerを使用してQUBO式を解くことができます。
Gurobi Optimizerを使用するには、有効なGurobiライセンスが必要です。

Gurobi Optimizerを使用して問題を解くには、以下の3つのステップで行います：
1. Gurobiモデルオブジェクト（**`qbpp::grb::QuboModel`**）を作成します。
2. Gurobiモデルオブジェクトのメンバ関数を呼び出してソルバーオプションを設定します。
3. **`optimize()`**メンバ関数を呼び出して解を探索します。解（`qbpp::Sol` オブジェクト）が返されます。

## Gurobiモデルオブジェクトの作成
Gurobi Optimizerを使用するには、式（`qbpp::Expr`）を引数としてGurobiモデルオブジェクト（**`qbpp::grb::QuboModel`**）を以下のように構築します：
- **`qbpp::grb::QuboModel(const qbpp::Expr& f)`**

ここで、`f` は解くべき式です。

## Gurobiオプションの設定
作成されたGurobiモデルオブジェクトに対して、以下のメンバ関数を使用してソルバーオプションを指定できます：
- **`set(key, val)`:**
keyで指定されたGurobiパラメータをvalに設定します。
keyとvalはどちらも文字列でなければなりません。
- **`time_limit(time_limit)`**:
制限時間を秒単位で設定します。
内部的には `set("TimeLimit", std::to_string(time_limit))` を呼び出します。

利用可能なパラメータの完全なリストについては、以下のGurobiドキュメントを参照してください：
https://docs.gurobi.com/projects/optimizer/en/current/reference/parameters.html

## 解の探索
Gurobi Optimizerは、Gurobiモデルオブジェクトの**`optimize()`**メンバ関数を呼び出すことで解を探索します。
`optimize()` 関数は `qbpp::Sol` の派生クラスである解オブジェクトを返します。
メンバ関数**`bound()`**は最適化中に得られた最良バウンドを返します。

## サンプルプログラム
以下のプログラムは、Gurobi Optimizerを使用して分割問題の解を探索します：
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/grb.hpp>

int main() {
  std::vector<uint32_t> w = {64, 27, 47, 74, 12, 83, 63, 40};
  auto x = qbpp::var("x", w.size());
  auto p = qbpp::expr();
  auto q = qbpp::expr();
  for (size_t i = 0; i < w.size(); ++i) {
    p += w[i] * x[i];
    q += w[i] * (1 - x[i]);
  }
  auto f = qbpp::sqr(p - q);
  f.simplify_as_binary();
  auto model = qbpp::grb::QuboModel(f);
  model.time_limit(10.0);
  auto sol = model.optimize();
  std::cout << "Solution: " << sol << std::endl;
  std::cout << "Bound = " << sol.bound() << std::endl;
  std::cout << "f(sol) = " << f(sol) << std::endl;
  std::cout << "p(sol) = " << p(sol) << std::endl;
  std::cout << "q(sol) = " << q(sol) << std::endl;
  std::cout << "P :";
  for (size_t i = 0; i < w.size(); ++i) {
    if (x[i](sol) == 1) {
      std::cout << " " << w[i];
    }
  }
  std::cout << std::endl;
  std::cout << "Q :";
  for (size_t i = 0; i < w.size(); ++i) {
    if (x[i](sol) == 0) {
      std::cout << " " << w[i];
    }
  }
  std::cout << std::endl;
}
```
まず、このプログラムは分割問題を表す式 `f` に対してGurobiモデルを作成します。
制限時間を10.0秒に設定し、`optimize()` を呼び出します。
得られた解は `sol` に格納されます。

このプログラムは以下の出力を生成します：
{% raw %}
```
Solution: 0:{{x[0],1},{x[1],1},{x[2],0},{x[3],1},{x[4],0},{x[5],0},{x[6],0},{x[7],1}}
Bound = 0
f(sol) = 0
p(sol) = 205
q(sol) = 205
P : 64 27 74 40
Q : 47 12 83 63
```
{% endraw %}
解の値とバウンドが同じエネルギー0であるため、得られた解が最適であることが保証されます。
