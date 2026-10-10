---
last_modified: 2026-10-09
layout: default
nav_exclude: true
title: "FMQA による量子化学計算"
nav_order: 98
lang: ja
hreflang_alt: "en/python/FMQA_CHEMISTRY"
hreflang_lang: "en"
---

# FMQA による量子化学計算

[FMQA によるブラックボックス最適化](FMQA)の手順を使って、分子のエネルギーを最小にする分子軌道を探します。
分子軌道の形を角度で表し、その角度を[ネイティブ整数変数](NATIVE_INTEGER)で探索します。
エネルギーを予測するモデル（サロゲートモデル）には、FM の代わりに整数変数の多項式を使います。
QUBO++ は、整数変数の 4 次の多項式を、バイナリ変数に展開せずにそのまま最小化します。

このページでは、変数が 1 つの例（HeH⁺）と、2 つの例（結合を引き伸ばした H₂）を順に扱います。

## 前提: 評価が高価なエネルギー計算

量子化学計算では、電子が入る軌道（分子軌道）を決めると、そのときの分子のエネルギーが計算できます。
エネルギーが最も低くなる分子軌道を求めることが、計算の中心です。
実際の分子では、1 回のエネルギーの計算に時間がかかります。
量子コンピュータで分子のエネルギーを測る方法（変分量子固有値ソルバー、VQE）でも、回路の角度を決めてエネルギーを測ることを繰り返します。
そこで、エネルギーをブラックボックス関数とみなし、少ない評価回数で最小点を探します。

このページの例は電子が 2 個の小さな分子なので、エネルギーは短い式で計算できます。
この式は評価の代わりと答え合わせにだけ使い、FMQA の部分は式の中身を使いません。

## 整数変数を使った FMQA

手順は [FMQA](FMQA) と同じです。

1. ランダムに選んだ点をいくつか評価する。
2. それまでに評価したすべての点に、サロゲートモデルを当てはめる（学習）。
3. サロゲートモデルを QUBO++ の式にして、予測値を最小にする点を `EasySolver` で求める。
4. その点のエネルギーを評価してデータに加え、2. に戻る。

違うのは、変数とサロゲートモデルです。

- **変数**: 分子軌道の角度を、65 段階の整数で表します。
  ネイティブ整数変数は 2 進数のビットに展開されず、ソルバーは整数の値のまま探索します。
  隣の角度へ動くことは、整数を 1 増やす・減らすという自然な移動になります。
- **サロゲートモデル**: FM はバイナリ変数の 2 次式なので、そのまま QUBO になります。
  このページの変数は 1〜2 個の整数なので、より自由な形を表せる 4 次の多項式を使います。
  係数は、変数が 1 個なら 5 個、2 個なら 15 個です。
  ネイティブ整数変数の `n * n` は整数の 2 乗として扱われるので、4 次の多項式もそのまま QUBO++ の式になります。
- **学習**: 予測値は係数の 1 次式なので、正則化付き最小二乗法（正則化係数 $10^{-6}$）で、連立 1 次方程式を 1 回解けば係数が求まります。

## 例 1: HeH⁺ の分子軌道

### ブラックボックス関数

ヘリウム水素イオン HeH⁺ は、電子を 2 個持ちます。
ここでは最小限の基底（STO-3G 基底）を使い、He の 1s 軌道と H の 1s 軌道を直交化した 2 つの関数 $\chi_1, \chi_2$ の組み合わせで分子軌道を表します。
2 個の電子が同じ分子軌道に入るとき（制限 Hartree-Fock 法）、分子軌道は角度 $\theta$ 1 つで表せます:

$$\phi(\theta) = \cos\theta\, \chi_1 + \sin\theta\, \chi_2$$

どの $\theta$ でも $\phi$ の大きさは 1 です。
$\theta$ と $\theta + \pi$ は符号が違うだけの同じ軌道なので、$-\pi/2 \le \theta \le \pi/2$ ですべての分子軌道を表せます。
エネルギーは、$c = \cos\theta$、$s = \sin\theta$ として次の式で計算できます:

$$
\begin{aligned}
E(\theta) = E_\mathrm{nuc}
&+ 2\bigl(c^2 h_{11} + 2cs\, h_{12} + s^2 h_{22}\bigr) \\
&+ c^4 (11|11) + s^4 (22|22) + 2c^2 s^2 \bigl[(11|22) + 2\,(12|12)\bigr]
+ 4c^3 s\, (11|12) + 4cs^3\, (22|12)
\end{aligned}
$$

$h_{pq}$ は 1 電子積分（電子 1 個の運動エネルギーと、原子核からの引力）、$(pq|rs)$ は 2 電子積分（電子どうしの反発）、$E_\mathrm{nuc}$ は原子核どうしの反発です。
核間距離 1.4632 bohr での値は、プログラムの中に書いてあります。

H₂ のように同じ原子 2 つからなる分子では、対称性から分子軌道が決まります。
HeH⁺ は異なる原子からなるので、電子が He 側にどれだけ寄るか（$\theta$ の値）は、計算してみないと分かりません。

### 整数変数とサロゲートモデル

$\theta$ を、$-\pi/2$ から $\pi/2$ までの 65 段階の整数 $n \in \lbrace 0, \ldots, 64\rbrace$ で表します:

$$\theta(n) = -\frac{\pi}{2} + \frac{\pi n}{64}$$

サロゲートモデルは、$t = n/64$ の 4 次多項式です:

$$\hat{E}(n) = w_0 + w_1 t + w_2 t^2 + w_3 t^3 + w_4 t^4$$

最初にランダムな 4 点を評価し、あとは QUBO++ が求めた $n$ を評価します。
QUBO++ が求めた $n$ がすでに評価済みのときは、それまでの最良点の隣（$n \pm 1$）で、まだ評価していない点を評価します。
最良点の両隣がどちらも評価済みなら、最良点が両隣より低いことが確かめられたので、そこで終了します。

### QUBO++ プログラム

```python
import numpy as np
import pyqbpp.d as qbpp

# HeH+ の積分値（STO-3G 基底、核間距離 1.4632 bohr、単位 Hartree）
# 添字 1 は He の 1s、2 は H の 1s（直交化した基底）
H11, H22, H12 = -2.475236114935, -1.448259466847, -0.378724331272  # 1 電子積分
G1111, G2222, G1122 = 1.147471043048, 0.816258183162, 0.526201856993  # 2 電子積分
G1212, G1112, G2212 = 0.011345007430, -0.003104665462, -0.004941256971
E_NUC = 1.366867140514  # 原子核どうしの反発エネルギー

L = 65    # 角度の段階数
D = 4     # サロゲートモデルの次数
INIT = 4  # 最初にランダムに選んで評価する点の数


# 黒箱: 分子軌道 cos(θ) χ1 + sin(θ) χ2 に電子が 2 個入ったときのエネルギー
# 本当は時間のかかる量子化学計算で、ここでは式で代用する
def blackbox(theta):
    c, s = np.cos(theta), np.sin(theta)
    return (E_NUC + 2 * (c * c * H11 + 2 * c * s * H12 + s * s * H22)
            + c**4 * G1111 + s**4 * G2222
            + 2 * c * c * s * s * (G1122 + 2 * G1212)
            + 4 * c**3 * s * G1112 + 4 * c * s**3 * G2212)


# 整数 k（0 から L-1）に対応する角度
def theta(k):
    return -np.pi / 2 + np.pi * k / (L - 1)


rng = np.random.default_rng(0)
# 1. ランダムに選んだ点を評価する
ks = [int(k) for k in rng.choice(L, INIT, replace=False)]  # 評価した点
es = [blackbox(theta(k)) for k in ks]                       # そのエネルギー
for i, k in enumerate(ks):
    print(f"eval {i + 1}: n = {k:2d}, E = {es[i]:.6f} Ha (random)")

n = qbpp.var("n", integer=(0, L - 1))
t = (1 / (L - 1)) * n  # 0 から 1 までの座標
while True:
    # 2. サロゲートモデル w0 + w1 t + ... + w4 t^4 を当てはめる
    A = np.vander(np.array(ks) / (L - 1), D + 1, increasing=True)
    w = np.linalg.solve(A.T @ A + 1e-6 * np.eye(D + 1), A.T @ np.array(es))

    # 3. サロゲートモデルを QUBO++ の式にして、最小にする n を求める
    f = 0
    td = 1
    for d in range(D + 1):
        f += w[d] * td
        td = td * t
    f.simplify_as_binary()
    sol = qbpp.EasySolver(f).search(time_limit=0.2)
    k = int(sol(n))

    # 評価済みの点なら、最良点の隣のまだ評価していない点にする
    if k in ks:
        b = ks[int(np.argmin(es))]
        k = next((m for m in (b - 1, b + 1) if 0 <= m < L and m not in ks),
                 None)
        if k is None:  # 最良点の両隣を評価済み
            break

    # 4. エネルギーを評価してデータに加える
    ks.append(k)
    es.append(blackbox(theta(k)))
    print(f"eval {len(ks)}: n = {k:2d}, E = {es[-1]:.6f} Ha")

b = ks[int(np.argmin(es))]
print(f"best: n = {b}, theta = {theta(b):.4f}, E = {min(es):.6f} Ha")
# 答え合わせ: L 通りすべての中の最小値
emin = min(blackbox(theta(k)) for k in range(L))
print(f"minimum over all {L} values: {emin:.6f} Ha")
```

- `import pyqbpp.d` で、式の係数を実数（`float`）にしています（[実数（double）係数](VAREXPR#実数double係数)）。
  当てはめた多項式の係数 $w_d$ を、そのまま QUBO++ の式の係数にできます。
- `qbpp.var("n", integer=(0, L - 1))` が、$0$ 以上 $64$ 以下の整数変数 $n$ の宣言です。
  `t` は $t = n/64$ を表す式で、`td = td * t` を繰り返して $t^d$ を作ります。
- 当てはめには numpy を使います（`pip install numpy`）。
  `np.vander` で各点の $1, t, t^2, t^3, t^4$ を並べた行列を作り、`np.linalg.solve` で連立 1 次方程式を解きます。
- `sol(n)` は実数で返るので、`int` に変換しています。
- 実行には数秒かかります。

### 出力結果

```
eval 1: n = 17, E = -1.111970 Ha (random)
eval 2: n = 32, E = -2.436134 Ha (random)
eval 3: n = 52, E = -2.137789 Ha (random)
eval 4: n = 40, E = -2.832456 Ha (random)
eval 5: n = 42, E = -2.838619 Ha
eval 6: n = 41, E = -2.841406 Ha
best: n = 41, theta = 0.4418, E = -2.841406 Ha
minimum over all 65 values: -2.841406 Ha
```

最初のランダムな 4 点（`random`）のあと、2 回の評価で 65 通りの中の最良点 $n = 41$（$\theta = 0.4418$）に到達しました。
最良点の両隣（$n = 40$ と $n = 42$）がどちらも評価済みなので、そこで終了しています。
最後の行は、65 通りすべてを評価して確かめた答えで、FMQA の結果と一致しています。

得られた分子軌道は $\cos\theta = 0.90$、$\sin\theta = 0.43$ で、電子が He 側に寄っています。
$\theta$ を連続的に動かしたときの最小値は $-2.841836$ Ha で、得られた値との差（0.43 mHa）は、$\theta$ を 65 段階に区切ったことによるものです。

乱数の種を変えて 20 回実行すると、20 回とも 65 通りの中の最良点に到達しました。
最初の 4 点を含めた評価回数は 6〜10 回（多くは 7〜8 回）で、65 通りすべてを評価する場合の約 1/8 です。

## 例 2: 引き伸ばした H₂ とスピン対称性の破れ

### ブラックボックス関数

水素分子 H₂ の 2 個の電子を考えます。
STO-3G 基底では、2 つの H の 1s 軌道から、結合性軌道 $\sigma_g$ と反結合性軌道 $\sigma_u$ の 2 つの分子軌道ができます。
非制限 Hartree-Fock 法では、上向きスピン（$\alpha$）の電子と下向きスピン（$\beta$）の電子が、別々の分子軌道に入ることができます。
それぞれの分子軌道を、角度 $\theta_\alpha, \theta_\beta$ で表します:

$$
\phi_\alpha = \cos\theta_\alpha\, \sigma_g + \sin\theta_\alpha\, \sigma_u, \qquad
\phi_\beta = \cos\theta_\beta\, \sigma_g + \sin\theta_\beta\, \sigma_u
$$

エネルギーは、$c_x = \cos\theta_x$、$s_x = \sin\theta_x$ として次の式で計算できます:

$$
\begin{aligned}
E(\theta_\alpha, \theta_\beta) = E_\mathrm{nuc}
&+ (c_\alpha^2 + c_\beta^2)\, h_{gg} + (s_\alpha^2 + s_\beta^2)\, h_{uu} \\
&+ c_\alpha^2 c_\beta^2\, J_{gg} + s_\alpha^2 s_\beta^2\, J_{uu}
+ (c_\alpha^2 s_\beta^2 + s_\alpha^2 c_\beta^2)\, J_{gu}
+ 4\, c_\alpha s_\alpha c_\beta s_\beta\, K_{gu}
\end{aligned}
$$

$h_{gg}, h_{uu}$ は 1 電子積分、$J_{gg}, J_{uu}, J_{gu}$ はクーロン積分（電子どうしの反発）、$K_{gu}$ は交換積分です。
このページでは、結合を平衡の長さ（0.74 Å）から引き伸ばした、核間距離 2.0 Å での値を使います。
値はプログラムの中に書いてあります。

### 対称な解と、対称性の破れた解

$\theta_\alpha = \theta_\beta = 0$ では、2 個の電子がどちらも $\sigma_g$ に入ります。
これは 2 個の電子が同じ軌道に入る制限 Hartree-Fock 法の解で、$E = -0.78379$ Ha です。
$\sigma_g$ は 2 つの原子に均等に広がった軌道なので、$\alpha$ 電子も $\beta$ 電子も、両方の原子に半分ずつ存在します。

結合を引き伸ばすと、$\alpha$ 電子と $\beta$ 電子が別々の原子に分かれたほうが、エネルギーが低くなります。
これが $\theta_\alpha = -\theta_\beta \approx \pm 0.668$ の解で、$E = -0.937213$ Ha と、上の解より 153.4 mHa 低くなります。
$\alpha$ 電子はほぼ一方の原子に、$\beta$ 電子はほぼもう一方の原子にあります（原子ごとのスピン密度 $\pm 0.98$）。
制限 Hartree-Fock 法の解が持っていた「$\alpha$ 電子と $\beta$ 電子が同じ分布を持つ」という対称性が失われるので、スピン対称性の破れた解と呼ばれます。
$\alpha$ と $\beta$ を入れ替えた解（$\theta_\alpha$ と $\theta_\beta$ の符号を入れ替えた解）も、同じエネルギーの最小点です。

通常の計算（SCF 計算）は、$\theta_\alpha = \theta_\beta$ の対称な状態から始めると、対称な解から動きません。
FMQA には、このような対称性について何も教えません。

どちらの解が低くなるかは、結合の長さで決まります。
次の図は、核間距離 $R$ ごとに、制限 Hartree-Fock 法のエネルギー（$\theta_\alpha = \theta_\beta = 0$）、非制限 Hartree-Fock 法の最小エネルギー（$\theta_\alpha, \theta_\beta$ を自由に動かしたときの最小）、同じ基底での厳密なエネルギーを描いたものです。
図の値は、FMQA ではなく細かい格子で直接求めました。

<p align="center">
  <img src="../../images/h2_curve_ja.svg" alt="H₂ の解離曲線（制限・非制限 Hartree-Fock 法と厳密なエネルギー）" width="90%">
</p>

- $R$ が約 1.15 Å より短いと、2 つの Hartree-Fock 法のエネルギーは一致し、対称性は破れません。
- それより長いと、対称性の破れた解のほうが低くなります。
  $R$ を大きくすると、非制限 Hartree-Fock 法のエネルギーは水素原子 2 個のエネルギーに近づきますが、制限 Hartree-Fock 法のエネルギーは上がり続けます。
  2 個の電子が同じ軌道に入るという制限のため、離れた 2 つの原子の一方に電子が 2 個とも集まる配置が、半分の重みで混ざったまま残るからです。
- 厳密なエネルギーとの差（電子相関エネルギー）は、どちらの Hartree-Fock 法でも取り込めない部分です。

このページの例は、対称性の破れがはっきり現れる $R = 2.0$ Å です（図の黒い点）。

### 整数変数とズーム

2 つの角度を、探索範囲（窓）の中の 65 段階の整数 $n_\alpha, n_\beta \in \lbrace 0, \ldots, 64\rbrace$ で表します。
最初の窓は $-\pi/2 \le \theta_\alpha, \theta_\beta \le \pi/2$ で、角度の刻みは $\pi/64 \approx 0.049$ rad です。
サロゲートモデルは、窓の中の座標 $u = n/64 \in [0, 1]$ の、2 変数の 4 次多項式です:

$$\hat{E} = \sum_{i + j \le 4} w_{ij}\, u_\alpha^i\, u_\beta^j$$

最良値が 4 回続けて更新されなかったら（または 1 つの窓で QUBO++ に 15 回点を求めさせたら）、最良点を中心に窓の幅を半分にします（ズーム）。
段階数を奇数の 65 にしているので、窓の中心 $n = 32$ が格子点になり、最良点がそのまま次の窓の格子点になります。
6 段のズームで、角度の刻みは約 0.049 rad から約 0.0015 rad まで細かくなります。

- 各段の最初に、窓の中のランダムな点を評価します（最初の段は 6 点、以降は 3 点）。
- 学習には、それまでの段で評価した点も含め、いまの窓の中にある点をすべて使います。
  多項式は連続な座標の関数なので、いまの格子に乗っていない点もそのまま使えます。
- QUBO++ が求めた点が評価済みなら、その周りの 8 点のうち、まだ評価していない点で予測値が最小の点を評価します。

### QUBO++ プログラム

```python
import numpy as np
import pyqbpp.d as qbpp

# 引き伸ばした H2 の積分値（STO-3G 基底、核間距離 2.0 Å、単位 Hartree）
# g は結合性軌道 σg、u は反結合性軌道 σu
H_GG, H_UU = -0.778922064923, -0.670266674748                       # 1 電子積分
J_GG, J_UU, J_GU = 0.509462821477, 0.534664130913, 0.519201267361  # クーロン積分
K_GU = 0.259138467265                                               # 交換積分
E_NUC = 0.264588624497  # 原子核どうしの反発エネルギー

L = 65        # 窓の中の角度の段階数（奇数）
D = 4         # サロゲートモデルの次数
STAGES = 6    # ズームの段数
ITERS = 15    # 1 段で QUBO++ に点を求めさせる回数の上限
PATIENCE = 4  # この回数続けて改善がなければ次の段へ
POWERS = [(i, j) for i in range(D + 1) for j in range(D + 1 - i)]  # i + j <= D


# 黒箱: α 電子が cos(θa) σg + sin(θa) σu に、
#       β 電子が cos(θb) σg + sin(θb) σu に入ったときのエネルギー
# 本当は時間のかかる量子化学計算で、ここでは式で代用する
def blackbox(ta, tb):
    ca, sa, cb, sb = np.cos(ta), np.sin(ta), np.cos(tb), np.sin(tb)
    return (E_NUC + (ca * ca + cb * cb) * H_GG + (sa * sa + sb * sb) * H_UU
            + ca * ca * cb * cb * J_GG + sa * sa * sb * sb * J_UU
            + (ca * ca * sb * sb + sa * sa * cb * cb) * J_GU
            + 4 * ca * sa * cb * sb * K_GU)


history = []  # 評価した点の (θa, θb, E)


# 格子点 k = (ka, kb) のエネルギーを評価してデータに加える
# 最良値を更新したら True を返す（1e-12 未満の差は丸め誤差とみなす）
def evaluate(k):
    ta, tb = lo + step * np.array(k)
    e = blackbox(ta, tb)
    improved = not history or e < min(h[2] for h in history) - 1e-12
    if improved:
        print(f"eval {len(history) + 1:2d}: E = {e:.8f} Ha "
              f"(theta_a = {ta:.4f}, theta_b = {tb:.4f})")
    history.append((ta, tb, e))
    seen.add(k)
    return improved


rng = np.random.default_rng(1)
na = qbpp.var("na", integer=(0, L - 1))
nb = qbpp.var("nb", integer=(0, L - 1))
ua = (1 / (L - 1)) * na  # 窓の中の座標（0 から 1）
ub = (1 / (L - 1)) * nb
lo = np.array([-np.pi / 2, -np.pi / 2])  # 窓の左下の角度
step = np.pi / (L - 1)                   # 格子の間隔

for stage in range(STAGES):
    seen = set()  # この段で評価した格子点
    if stage > 0:
        seen.add((L // 2, L // 2))  # 窓の中心（それまでの最良点）
    # 1. ランダムに選んだ点を評価する（最初の段は 6 点、以降は 3 点）
    init = 6 if stage == 0 else 4
    while len(seen) < init:
        k = tuple(int(v) for v in rng.integers(0, L, 2))
        if k not in seen:
            evaluate(k)

    stall = 0
    for _ in range(ITERS):
        # 2. 窓の中にある評価済みの点に、サロゲートモデルを当てはめる
        H = np.array(history)
        u = (H[:, :2] - lo) / (step * (L - 1))
        inside = np.all((u >= 0) & (u <= 1), axis=1)
        A = np.array([[a**i * b**j for i, j in POWERS] for a, b in u[inside]])
        w = np.linalg.solve(A.T @ A + 1e-6 * np.eye(len(POWERS)),
                            A.T @ H[inside, 2])

        # 3. サロゲートモデルを QUBO++ の式にして、最小にする (na, nb) を求める
        f = 0
        for (i, j), c in zip(POWERS, w):
            term = c
            for _ in range(i):
                term = term * ua
            for _ in range(j):
                term = term * ub
            f += term
        f.simplify_as_binary()
        sol = qbpp.EasySolver(f).search(time_limit=0.2)
        k = (int(sol(na)), int(sol(nb)))

        # 評価済みの点なら、周りの 8 点のうち、まだ評価していない点で
        # 予測値が最小の点にする
        if k in seen:
            around = [(k[0] + a, k[1] + b) for a in (-1, 0, 1) for b in (-1, 0, 1)]
            around = [m for m in around
                      if 0 <= m[0] < L and 0 <= m[1] < L and m not in seen]
            if not around:
                break
            k = min(around, key=lambda m: f({na: m[0], nb: m[1]}))

        # 4. エネルギーを評価してデータに加える
        if evaluate(k):
            stall = 0
        else:
            stall += 1
            if stall >= PATIENCE:
                break

    # ズーム: 最良点を中心に、窓の幅を半分にする
    best = min(history, key=lambda h: h[2])
    step /= 2
    lo = np.array(best[:2]) - step * (L // 2)

print(f"best: E = {best[2]:.8f} Ha after {len(history)} evaluations "
      f"(theta_a = {best[0]:.4f}, theta_b = {best[1]:.4f})")
print(f"RHF (theta_a = theta_b = 0): E = {blackbox(0, 0):.8f} Ha")
```

- `POWERS` はサロゲートモデルの単項式 $u_\alpha^i u_\beta^j$ の指数 $(i, j)$ の一覧で、15 個あります。
  `A` は、窓の中にある各点での単項式の値を並べた行列です。
- 手順 3 では、`term = term * ua` のように単項式を掛け合わせて式 `f` を作ります。
  `f` は $n_\alpha, n_\beta$ の 4 次の多項式で、項は定数項を含めて 15 個です。
- 周りの 8 点の予測値は、式 `f` に値を代入して求めます（`f({na: m[0], nb: m[1]})`、[評価関数](EVAL)）。
- `history` は評価したすべての点の角度とエネルギー、`seen` はいまの段で評価した格子点です。
  `evaluate` は、最良値を更新したら `True` を返します。
  対称な位置にある 2 点のエネルギーは本来等しいので、$10^{-12}$ 未満の差は丸め誤差とみなして更新に数えません。
- 実行には 15 秒ほどかかります。

### 出力結果

```
eval  1: E = -0.78732535 Ha (theta_a = -0.0982, theta_b = 0.0491)
eval 10: E = -0.92120733 Ha (theta_a = 0.6381, theta_b = -0.4909)
eval 14: E = -0.93425496 Ha (theta_a = 0.7363, theta_b = -0.6381)
eval 16: E = -0.93652921 Ha (theta_a = 0.6872, theta_b = -0.6381)
eval 19: E = -0.93684475 Ha (theta_a = 0.6872, theta_b = -0.6872)
eval 25: E = -0.93700161 Ha (theta_a = 0.6627, theta_b = -0.6872)
eval 26: E = -0.93718516 Ha (theta_a = 0.6627, theta_b = -0.6627)
eval 41: E = -0.93721215 Ha (theta_a = 0.6688, theta_b = -0.6688)
eval 56: E = -0.93721219 Ha (theta_a = 0.6673, theta_b = -0.6688)
eval 58: E = -0.93721235 Ha (theta_a = 0.6673, theta_b = -0.6673)
best: E = -0.93721235 Ha after 62 evaluations (theta_a = 0.6673, theta_b = -0.6673)
RHF (theta_a = theta_b = 0): E = -0.78379268 Ha
```

58 回目の評価で $E = -0.93721235$ Ha に到達しました（全体の評価回数は 62 回）。
角度を連続的に動かしたときの最小値 $-0.93721282$ Ha との差は 0.0005 mHa で、最後の段の格子の細かさによるものです。
得られた解は $\theta_\alpha = -\theta_\beta$ で、スピン対称性の破れた解です。
乱数の種によっては、$\alpha$ と $\beta$ を入れ替えた解（$\theta_\alpha < 0$）が得られます。

なお、同じプログラムに平衡の核間距離 0.74 Å での積分値を入れると、対称性は破れず、$\theta_\alpha = \theta_\beta = 0$ の解（$E = -1.11676$ Ha）に収束します。

### ランダム探索・山登り法との比較

乱数の種を変えて上のプログラムを 20 回実行し、評価回数ごとの最良値を、次の 2 つの方法と比べました:

- **ランダム探索**: $-\pi/2$ から $\pi/2$ までの一様乱数で $(\theta_\alpha, \theta_\beta)$ を選んで評価することを繰り返します。
- **山登り法**: ランダムな点から始め、いまの刻み幅で周りの 8 点を評価して、最も良い点へ移ります。
  周りに良い点がなければ、刻み幅を半分にします。
  最初の刻み幅は、$\pi/2$ から $\pi/32$ までのうち最も成績の良かった $\pi/8$ です。

表の値は、最小値 $-0.93721282$ Ha との差の平均と、差が 0.01 mHa 以内に入った割合です。
FMQA は 51〜62 回の評価で終了し、60 回より前に終わった場合は終了時の値を使っています。

| 方法 | 20 回 | 40 回 | 60 回 |
|---|---:|---:|---:|
| FMQA | 0.42 mHa / 0% | 0.0020 mHa / 95% | **0.0005 mHa / 100%** |
| ランダム探索 | 26.5 mHa / 0% | 16.2 mHa / 0% | 10.1 mHa / 0% |
| 山登り法 | 23.4 mHa / 0% | 2.86 mHa / 0% | 0.47 mHa / 0% |

FMQA は、評価したすべての点からエネルギーの形を学習するので、周りの点を 1 つずつ調べる山登り法より少ない評価回数で最小点に近づきます。

## QUBO++ の役割

このページの例は変数が 1〜2 個なので、サロゲートモデルの最小化そのものは簡単で、65 通りや $65^2 = 4225$ 通りの値をすべて調べても求まります。
また、H₂ の対称性の破れた解は、対称性を破った状態から SCF 計算を始めればすぐに得られます。
このページの目的は、量子化学計算のエネルギーをブラックボックス関数とみなし、整数変数で FMQA を行う手順を示すことです。

分子が大きくなって角度の数 $k$ が増えると、格子点の数は $65^k$ で増え、サロゲートモデルの最小化は QUBO++ のソルバーの仕事になります。
そのときは多項式の係数の数も増えるので、[FMQA](FMQA) の FM のように、係数の数を抑えたモデルを使うことになります。
