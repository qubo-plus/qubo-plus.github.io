---
layout: default
nav_exclude: true
title: "Solving Expressions"
nav_order: 2
lang: ja
hreflang_alt: "en/SOLVE"
hreflang_lang: "en"
---

# 式の求解

QUBO++はQUBO/HUBO式を解くための3つのソルバーを提供しています：

- **Easy Solver**
  - シミュレーテッドアニーリングに基づくヒューリスティックアルゴリズムを実行します。
  - マルチコアCPU上で並列に動作します。
  - 最適性は保証されません。

- **Exhaustive Solver**
  - すべての可能な解を探索します。
  - 返される解の最適性が保証されます。
  - バイナリ変数の数が約30～40以下の場合にのみ計算が現実的です。
  - CUDA GPUが利用可能な場合、CPUスレッドと並行してGPUアクセラレーションが自動的に有効になります。

- **ABS3 Solver**
  - CUDA GPUとマルチコアCPUを活用する高性能ソルバーです。
  - 最適性は保証されませんが、Easy Solverよりはるかに強力です。
  - GPUが利用できない場合はCPUのみモードにフォールバックします。

Easy SolverとExhaustive Solverは以下のステップで使用します：
1. ソルバーオブジェクト（**`qbpp::easy_solver::EasySolver`**または**`qbpp::exhaustive_solver::ExhaustiveSolver`**）を作成します。
2. ソルバーオブジェクトの**`search()`**メンバ関数を呼び出します。パラメータは初期化子リストとして渡すことができます。得られた解を格納する**`qbpp::Sol`**オブジェクトが返されます。

## Easy Solver
**Easy Solver**を使用するには、ヘッダファイル**`qbpp/easy_solver.hpp`**をインクルードします。
名前空間**`qbpp::easy_solver`**で定義されています。

以下の式 $f(a,b,c,d)$ を例として使用します：

$$
\begin{aligned}
f(a,b,c,d,e) &= (a+2b+3c+4d-5)^2
\end{aligned}
$$

明らかに、$a+2b+3c+4d=5$ のとき、この式は最小値 $f=0$ を取ります。
したがって、$(a,b,c,d)=(0,1,1,0)$ と $(1,0,0,1)$ の2つの最適解があります。

以下のプログラムでは、シンボリック計算を使って式 `f` を作成します。
関数**`qbpp::sqr()`**は引数の2乗を返すことに注意してください。
次に、`f` をコンストラクタに渡してクラス `qbpp::easy_solver::EasySolver` のインスタンスを構築します。
その前に、**`simplify_as_binary()`**を呼び出して `f` をバイナリ変数用に簡約化する必要があります。
コンストラクタは**`solver`**という名前の `EasySolver` オブジェクトを返します。
最適値が $f=0$ であることがわかっているので、`search()` にターゲットエネルギーを初期化子リストとして渡します。
`solver` の**`search()`**メンバ関数を呼び出すと、クラス**`qbpp::Sol`**の解インスタンス**`sol`**が返され、`std::cout` で出力されます。

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  auto a = qbpp::var("a");
  auto b = qbpp::var("b");
  auto c = qbpp::var("c");
  auto d = qbpp::var("d");
  auto f = qbpp::sqr(a + 2 * b + 3 * c + 4 * d - 5);
  std::cout << "f = " << f.simplify_as_binary() << std::endl;
  auto solver = qbpp::easy_solver::EasySolver(f);
  auto sol = solver.search({{"target_energy", 0}});
  std::cout << sol << std::endl;
}
```
{% endraw %}

このプログラムの出力は以下のとおりです：
{% raw %}
```
f = 25 -9*a -16*b -21*c -24*d +4*a*b +6*a*c +8*a*d +12*b*c +16*b*d +24*c*d
0:{{a,1},{b,0},{c,0},{d,1}}
```
{% endraw %}
最適解の1つが正しく出力されています。

## Exhaustive Solver
**Exhaustive Solver**を使用するには、ヘッダファイル**`qbpp/exhaustive_solver.hpp`**をインクルードします。
名前空間**`qbpp::exhaustive_solver`**で定義されています。

`f` をコンストラクタに渡してクラス**`qbpp::exhaustive_solver::ExhaustiveSolver`**のインスタンス**`solver`**を構築します。
`solver` の**`search()`**メンバ関数を呼び出すと、クラス**`qbpp::Sol`**の解インスタンス**`sol`**が返され、`std::cout` で出力されます。
Exhaustive Solverはすべての可能な割り当てを探索するため、`sol` に最適解が格納されることが保証されます。

```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  auto a = qbpp::var("a");
  auto b = qbpp::var("b");
  auto c = qbpp::var("c");
  auto d = qbpp::var("d");
  auto f = qbpp::sqr(a + 2 * b + 3 * c + 4 * d - 5);
  f.simplify_as_binary();
  auto solver = qbpp::exhaustive_solver::ExhaustiveSolver(f);
  auto sol = solver.search();
  std::cout << sol << std::endl;
}
```
このプログラムの出力は以下のとおりです：
{% raw %}
```
0:{{a,0},{b,1},{c,1},{d,0}}
```
{% endraw %}
すべての最適解は `best_energy_sols` パラメータを設定することで以下のように取得できます：
{% raw %}
```cpp
  auto solver = qbpp::exhaustive_solver::ExhaustiveSolver(f);
  auto sol = solver.search({{"best_energy_sols", 1}});
```
{% endraw %}
出力は以下のとおりです：
{% raw %}
```
(0) 0:{{a,0},{b,1},{c,1},{d,0}}
(1) 0:{{a,1},{b,0},{c,0},{d,1}}
```
{% endraw %}
さらに、非最適解を含むすべての解は `all_sols` パラメータを設定することで以下のように取得できます：
{% raw %}
```cpp
  auto solver = qbpp::exhaustive_solver::ExhaustiveSolver(f);
  auto sol = solver.search({{"all_sols", 1}});
```
{% endraw %}
出力は以下のとおりです：
{% raw %}
```
(0) 0:{{a,0},{b,1},{c,1},{d,0}}
(1) 0:{{a,1},{b,0},{c,0},{d,1}}
(2) 1:{{a,0},{b,0},{c,0},{d,1}}
(3) 1:{{a,0},{b,1},{c,0},{d,1}}
(4) 1:{{a,1},{b,0},{c,1},{d,0}}
(5) 1:{{a,1},{b,1},{c,1},{d,0}}
(6) 4:{{a,0},{b,0},{c,1},{d,0}}
(7) 4:{{a,0},{b,0},{c,1},{d,1}}
(8) 4:{{a,1},{b,1},{c,0},{d,0}}
(9) 4:{{a,1},{b,1},{c,0},{d,1}}
(10) 9:{{a,0},{b,1},{c,0},{d,0}}
(11) 9:{{a,1},{b,0},{c,1},{d,1}}
(12) 16:{{a,0},{b,1},{c,1},{d,1}}
(13) 16:{{a,1},{b,0},{c,0},{d,0}}
(14) 25:{{a,0},{b,0},{c,0},{d,0}}
(15) 25:{{a,1},{b,1},{c,1},{d,1}}
```
{% endraw %}
Exhaustive Solverは、小さな式の解析やデバッグに非常に有用です。

## ABS3 Solver
**ABS3 Solver**を使用するには、ヘッダファイル**`qbpp/abs3_solver.hpp`**をインクルードします。
名前空間**`qbpp::abs3`**で定義されています。

ABS3 Solverは、CUDA GPUとマルチコアCPUを活用する高性能ソルバーです。
GPUが利用できない場合は、自動的にCPUのみモードにフォールバックします。

使用方法は以下の2ステップです：
1. 式に対して**`qbpp::abs3::ABS3Solver`**オブジェクトを作成します。
2. **`search()`**メンバ関数を呼び出します。パラメータは初期化子リストとして渡します。得られた解が返されます。

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/abs3_solver.hpp>

int main() {
  auto a = qbpp::var("a");
  auto b = qbpp::var("b");
  auto c = qbpp::var("c");
  auto d = qbpp::var("d");
  auto f = qbpp::sqr(a + 2 * b + 3 * c + 4 * d - 5);
  f.simplify_as_binary();

  auto solver = qbpp::abs3::ABS3Solver(f);
  auto sol = solver.search({{"time_limit", 5.0}, {"target_energy", 0}, {"enable_default_callback", 1}});
  std::cout << sol << std::endl;
}
```
{% endraw %}
このプログラムの出力は以下のとおりです：
{% raw %}
```
TTS = 0.000s Energy = 0
0:{{a,0},{b,1},{c,1},{d,0}}
```
{% endraw %}

パラメータ、コールバック、複数解の収集、ヒント解の詳細については**[ABS3 Solver](ABS3)**をご覧ください。
