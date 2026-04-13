---
layout: default
nav_exclude: true
title: "Solving Expressions"
nav_order: 3
lang: ja
hreflang_alt: "en/python/SOLVE"
hreflang_lang: "en"
---

# 式の求解

PyQBPPはQUBO/HUBO式を解くための3つのソルバーを提供しています：

- **Easy Solver**
  - シミュレーテッドアニーリングに基づくヒューリスティックアルゴリズムを実行します。
  - マルチコアCPU上で並列実行されます。
  - 最適性は保証しません。

- **Exhaustive Solver**
  - すべての可能な解を探索します。
  - 返される解の最適性を保証します。
  - バイナリ変数の数が約30〜40個以下の場合にのみ計算が現実的です。
  - CUDA GPUが利用可能な場合、CPUスレッドと併せてGPU高速化が自動的に有効になります。

- **ABS3 Solver**
  - CUDA GPUとマルチコアCPUを活用する高性能ソルバーです。
  - 最適性は保証されませんが、Easy Solverよりはるかに強力です。
  - GPUが利用できない場合はCPUのみモードにフォールバックします。

Easy SolverとExhaustive Solverは2つのステップで使用します：
1. **`EasySolver`** または **`ExhaustiveSolver`** のソルバーオブジェクトを作成します。
2. ソルバーオブジェクトの **`search()`** メソッドを呼び出します。得られた解を格納する **`Sol`** オブジェクトが返されます。

## Easy Solver
以下の式 $f(a,b,c,d)$ を例として使用します：

$$
\begin{aligned}
f(a,b,c,d) &= (a+2b+3c+4d-5)^2
\end{aligned}
$$

この式は $a+2b+3c+4d=5$ のとき明らかに最小値 $f=0$ を取ります。
したがって、2つの最適解 $(a,b,c,d)=(0,1,1,0)$ と $(1,0,0,1)$ があります。

以下のプログラムでは、シンボリック計算を使って式 `f` を作成します。
関数 **`sqr()`** は引数の二乗を返します。
次に、`f` をコンストラクタに渡して `EasySolver` のインスタンスを構築します。
その前に、**`simplify_as_binary()`** を呼び出してバイナリ変数用に `f` を簡約化する必要があります。
最適値が $f=0$ であることがわかっているため、**`search()`** メソッドに `target_energy` をパラメータとして渡します。
**`search()`** を呼び出すと、**`Sol`** クラスの解インスタンス **`sol`** が返されます。

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
d = qbpp.var("d")
f = qbpp.sqr(a + 2 * b + 3 * c + 4 * d - 5)
print("f =", f.simplify_as_binary())

solver = qbpp.EasySolver(f)
sol = solver.search(target_energy=0)
print(sol)
```

このプログラムの出力は以下の通りです：
```
f = 25 -9*a -16*b -21*c -24*d +4*a*b +6*a*c +8*a*d +12*b*c +16*b*d +24*c*d
Sol(energy=0, {a: 1, b: 0, c: 0, d: 1})
```
最適解の1つが正しく出力されています。

## Exhaustive Solver
`f` をコンストラクタに渡して **`ExhaustiveSolver`** のインスタンスを構築します。
`solver` の **`search()`** メソッドを呼び出すと、**`Sol`** クラスの解インスタンス **`sol`** が返されます。
Exhaustive Solverはすべての可能な割り当てを探索するため、`sol` が最適解を格納していることが保証されます。

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
d = qbpp.var("d")
f = qbpp.sqr(a + 2 * b + 3 * c + 4 * d - 5)
f.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(f)
sol = solver.search()
print(sol)
```
このプログラムの出力は以下の通りです：
```
Sol(energy=0, {a: 0, b: 1, c: 1, d: 0})
```
`best_energy_sols` を `search()` に渡すと、すべての最適解を取得できます：
```python
sol = solver.search(best_energy_sols=0)
for i, s in enumerate(sol.sols):
    print(f"({i}) {s}")
```
出力は以下の通りです：
```
(0) Sol(energy=0, {a: 0, b: 1, c: 1, d: 0})
(1) Sol(energy=0, {a: 1, b: 0, c: 0, d: 1})
```

Exhaustive Solverは、小さな式の解析やデバッグに非常に有用です。

## ABS3 Solver
**ABS3 Solver**は、CUDA GPUとマルチコアCPUを活用する高性能ソルバーです。
GPUが利用できない場合は、自動的にCPUのみモードにフォールバックします。

使用方法は以下の2ステップです：
1. 式に対して**`ABS3Solver`**オブジェクトを作成します。
2. キーワード引数を渡して**`search()`**メソッドを呼び出します。得られた解が返されます。

```python
import pyqbpp as qbpp

a = qbpp.var("a")
b = qbpp.var("b")
c = qbpp.var("c")
d = qbpp.var("d")
f = qbpp.sqr(a + 2 * b + 3 * c + 4 * d - 5)
f.simplify_as_binary()

solver = qbpp.ABS3Solver(f)
solver.callback(lambda energy, tts, event: print(f"TTS = {tts:.3f}s Energy = {energy}"))
sol = solver.search(time_limit=5.0, target_energy=0)
print(sol)
```
このプログラムの出力は以下の通りです：
```
TTS = 0.000s Energy = 0
Sol(energy=0, {a: 0, b: 1, c: 1, d: 0})
```

パラメータ、コールバック、複数解の収集の詳細については**[ABS3 Solver](ABS3)**をご覧ください。
