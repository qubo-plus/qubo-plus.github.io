---
last_modified: 2026-10-07
layout: default
nav_exclude: true
title: "FMQA によるブラックボックス最適化"
nav_order: 57
lang: ja
hreflang_alt: "en/FMQA"
hreflang_lang: "en"
---

# FMQA によるブラックボックス最適化

FMQA（Factorization Machine with Quantum Annealing）は、評価に時間や費用のかかる関数を、少ない評価回数で最小化する方法です。
評価した結果から関数の近似モデルを学習し、そのモデルを最小にする点を QUBO ソルバーで求めて次に評価する、という手順を繰り返します。
名前の QA は量子アニーリングのことですが、QUBO を解く部分にはどの QUBO ソルバーも使えます。このページでは `EasySolver` を使います。

## 前提: 評価が高価なブラックボックス関数

$n$ 個のバイナリ変数 $x = (x_1, \ldots, x_n)$ の関数 $f(x)$ を最小化したいとします。
ただし $f$ の式は分からず、$x$ を与えると値が返ってくるだけです（ブラックボックス関数）。
しかも 1 回の評価に実験や時間のかかるシミュレーションが必要で、評価できる回数は限られています。
たとえば、20 種類の材料それぞれを使うか使わないかを決めて試作品を作り、その性能を測る、といった状況です。

$n = 20$ でも $x$ は $2^{20}$（約 100 万）通りあり、すべてを試すことはできません。
このページでは、評価できる回数を $300$ 回として、その中でできるだけ小さい $f(x)$ を見つけます。

## FMQA の手順

1. ランダムに選んだ点をいくつか評価する。
2. それまでに評価したすべての点 $(x, f(x))$ に、Factorization Machine（FM）という 2 次のモデルを当てはめる（学習）。
3. 学習した FM の予測式は $x$ の 2 次式、つまり QUBO なので、QUBO ソルバーで予測値を最小にする $x$ を求める。
4. その $x$ を評価してデータに加え、2. に戻る。

モデルが小さいと予測した点を実際に評価し、予測が外れていれば、その結果が次の学習に入ってモデルが直ります。
この「予測、確認、修正」を繰り返して、少ない評価回数で最小値に近づきます。
QUBO ソルバーは $2^n$ 通り全体の中からモデルの最小点を選ぶので、何ビットも同時に変えた点へ一度に移れます。

## この例のブラックボックス関数

このページでは、高価な評価の代わりに次の式を使います（$n = 20$）:

$$f(x) = 100 \sum_{k=1}^{3} \sin\Bigl(\sum_{i=1}^{20} a_{ki}\, x_i\Bigr)$$

係数 $a_{ki}$ は $-1$ から $1$ までの数で、プログラムの中に表として書いてあります。
この式は評価の代わりと答え合わせにだけ使い、FMQA の部分は式の中身を使いません。

- $f(x)$ は $-300$ 以上 $300$ 以下で、3 つの和 $\sum_i a_{ki} x_i$ がそろって $\sin$ の谷（$-\pi/2 + 2\pi m$）の近くにあるとき、$-300$ に近くなります。
  全 $2^{20}$ 通りを調べると、最小値は $-299.92$ です。
- $\sin$ の和なので、$x$ の 2 次式（QUBO）ではありません。FMQA はこれを 2 次式で近似しながら探します。
- 良い解はまれです。最小値の 99% 以内（$-296.92$ 以下）に入る $x$ は $51$ 個（全体の約 $0.005\%$）しかなく、
  ランダムに 300 個選んでも、その中に入っている確率は $1.4\%$ です。

## Factorization Machine

FM は、$f(x)$ を次の 2 次式で予測するモデルです:

$$\hat{y}(x) = w_0 + \sum_{i} w_i x_i + \sum_{i<j} \langle v_i, v_j\rangle\, x_i x_j$$

$w_0$ と $w_i$ は実数、$v_i$ は変数 $x_i$ ごとの $D$ 次元の実数ベクトルで、$\langle v_i, v_j\rangle$ はその内積です。

- **2 次の係数を内積で表す**: 2 次の係数を 1 つずつ推定すると、$n = 20$ では $190$ 個あります。
  FM ではベクトル $v_i$ の成分だけを推定するので、$D = 3$ なら $60$ 個です。
  $w_0$ と $w_i$ を合わせても $81$ 個なので、評価した点が少ないうちから学習できます。
- **$D = 3$ にした理由**: この例の $f$ は、3 つの 1 次式 $\sum_i a_{ki} x_i$ を通してだけ $x$ に依存します。
  それぞれの $\sin$ を谷の近くで放物線 $\gamma_k \bigl(\sum_i a_{ki} x_i - c_k\bigr)^2$（$\gamma_k > 0$）で近似すると、
  $x_i x_j$ の係数は $2 \sum_k \gamma_k a_{ki} a_{kj}$ となり、3 次元のベクトルの内積でちょうど表せます。
  実際の問題ではこのような構造は分からないので、$D$ はいくつか試して決めます。
また、$x_i^2 = x_i$ を使うと、2 次の項は次のように書き換えられます（$v_{id}$ は $v_i$ の第 $d$ 成分）:

$$\sum_{i<j} \langle v_i, v_j\rangle\, x_i x_j = \frac{1}{2} \sum_{d=1}^{D} \Bigl[ \Bigl(\sum_i v_{id}\, x_i\Bigr)^2 - \sum_i v_{id}^2\, x_i \Bigr]$$

学習でも QUBO の式を作るときも、この形を使います。

### 学習

評価した点の $f$ の値を平均 $0$、標準偏差 $1$ にそろえたものを $y$ とします。
予測値と $y$ の二乗誤差の平均に、正則化項 $\lambda \bigl(\sum_i w_i^2 + \sum_{i,d} v_{id}^2\bigr)$（$\lambda = 10^{-4}$）を加えたものを、
Adam という勾配法で最小化します（$1000$ 回の更新）。
勾配は予測式を微分したもので、たとえば $\partial \hat{y} / \partial v_{id} = x_i \bigl(\sum_j v_{jd}\, x_j - v_{id}\bigr)$ です。
FM は評価のたびに、$v_{id}$ を乱数で初期化し直して最初から学習します。

## QUBO++ プログラム

以下のプログラムは、評価回数 300 回で FMQA を実行し、最後に答え合わせとして全 $2^{20}$ 通りの中の最小値を表示します:

{% raw %}
```cpp
#define DOUBLE_TYPE
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

#include <algorithm>
#include <cmath>
#include <iomanip>
#include <random>
#include <set>
#include <vector>

constexpr int N = 20;       // ビット数
constexpr int K = 3;        // 黒箱の中の sin の数
constexpr int D = 3;        // FM のベクトルの次元
constexpr int INIT = 20;    // 最初にランダムに選んで評価する点の数
constexpr int EVALS = 300;  // 黒箱を評価できる回数

// 黒箱の係数 a_ki
constexpr double A[K][N] = {
    {0.02, 0.90, -0.71, 0.90, -0.38, -0.15, 0.66, -0.18, 0.10, -0.94,
     0.51, 0.08, -0.34, 0.58, -0.39, -0.09, -0.73, -0.19, -0.59, -0.48},
    {0.50, -0.44, -0.03, 0.96, 0.92, 0.45, 0.08, -0.45, -0.68, 0.94,
     0.03, -0.77, 0.25, 0.55, 0.23, 0.83, -0.92, 0.06, -0.08, -0.88},
    {0.28, 0.71, 0.19, -0.48, 0.68, 0.02, 0.02, 0.51, -0.70, 0.64,
     0.37, 0.57, -0.62, 0.60, -0.62, -0.84, 0.71, 0.72, 0.75, -0.06}};

using Bits = std::vector<int>;

// 黒箱 f(x) = 100 * Σ_k sin(Σ_i a_ki x_i)
// 本当は高価な測定やシミュレーションで、ここでは式で代用する
double blackbox(const Bits& x) {
  double f = 0;
  for (int k = 0; k < K; ++k) {
    double s = 0;
    for (int i = 0; i < N; ++i) s += A[k][i] * x[i];
    f += 100 * std::sin(s);
  }
  return f;
}

// FM のパラメータ w0, w_i, v_id を 1 本のベクトル p に並べる
constexpr int P = 1 + N + N * D;
int W(int i) { return 1 + i; }                     // p[W(i)] = w_i
int V(int i, int d) { return 1 + N + i * D + d; }  // p[V(i, d)] = v_id

// FM の予測値 w0 + Σ_i w_i x_i + (1/2) Σ_d [(Σ_i v_id x_i)^2 - Σ_i v_id^2 x_i]
// s[d] = Σ_i v_id x_i も返す（勾配の計算に使う）
double predict(const std::vector<double>& p, const Bits& x,
               std::vector<double>& s) {
  double y = p[0];
  s.assign(D, 0.0);
  for (int i = 0; i < N; ++i)
    if (x[i]) {
      y += p[W(i)];
      for (int d = 0; d < D; ++d) {
        s[d] += p[V(i, d)];
        y -= 0.5 * p[V(i, d)] * p[V(i, d)];
      }
    }
  for (int d = 0; d < D; ++d) y += 0.5 * s[d] * s[d];
  return y;
}

// 予測値と y の二乗誤差の平均 + 正則化項 を Adam で最小化して FM を学習する
std::vector<double> train(const std::vector<Bits>& X,
                          const std::vector<double>& y, std::mt19937& rng) {
  std::vector<double> p(P, 0.0), m(P, 0.0), u(P, 0.0), g(P), s;
  std::normal_distribution<double> init(0.0, 0.1);
  for (int i = 0; i < N; ++i)
    for (int d = 0; d < D; ++d) p[V(i, d)] = init(rng);
  const double lr = 0.05, b1 = 0.9, b2 = 0.999, l2 = 1e-4;
  for (int t = 1; t <= 1000; ++t) {
    // 勾配
    std::fill(g.begin(), g.end(), 0.0);
    for (size_t n = 0; n < X.size(); ++n) {
      double r = 2 * (predict(p, X[n], s) - y[n]) / X.size();
      g[0] += r;
      for (int i = 0; i < N; ++i)
        if (X[n][i]) {
          g[W(i)] += r;
          for (int d = 0; d < D; ++d) g[V(i, d)] += r * (s[d] - p[V(i, d)]);
        }
    }
    for (int j = 1; j < P; ++j) g[j] += 2 * l2 * p[j];  // 正則化項（w0 以外）
    // Adam による更新
    for (int j = 0; j < P; ++j) {
      m[j] = b1 * m[j] + (1 - b1) * g[j];
      u[j] = b2 * u[j] + (1 - b2) * g[j] * g[j];
      double mh = m[j] / (1 - std::pow(b1, t));
      double uh = u[j] / (1 - std::pow(b2, t));
      p[j] -= lr * mh / (std::sqrt(uh) + 1e-8);
    }
  }
  return p;
}

int main() {
  std::mt19937 rng(10);
  std::uniform_int_distribution<int> coin(0, 1), pos(0, N - 1);
  std::vector<Bits> X;    // 評価した点
  std::vector<double> y;  // その点の f の値
  std::set<Bits> seen;    // 評価済みの点
  auto evaluate = [&](const Bits& b) {
    X.push_back(b);
    y.push_back(blackbox(b));
    seen.insert(b);
  };
  std::cout << std::fixed << std::setprecision(2);

  // 1. ランダムに選んだ点を評価する
  while (X.size() < INIT) {
    Bits b(N);
    for (int i = 0; i < N; ++i) b[i] = coin(rng);
    if (!seen.count(b)) evaluate(b);
  }
  double best = *std::min_element(y.begin(), y.end());
  std::cout << "eval " << X.size() << ": f = " << best << std::endl;

  auto x = qbpp::var("x", N);
  while (X.size() < EVALS) {
    // 2. f の値を平均 0、標準偏差 1 にそろえて FM を学習する
    double mean = 0, variance = 0;
    for (double v : y) mean += v / y.size();
    for (double v : y) variance += (v - mean) * (v - mean) / y.size();
    std::vector<double> z;
    for (double v : y) z.push_back((v - mean) / std::sqrt(variance));
    auto p = train(X, z, rng);

    // 3. FM の予測式を QUBO++ の式にして、最小にする x を求める
    qbpp::Expr f = p[0];
    for (int i = 0; i < N; ++i) f += p[W(i)] * x[i];
    for (int d = 0; d < D; ++d) {
      qbpp::Expr s = 0, q = 0;
      for (int i = 0; i < N; ++i) {
        s += p[V(i, d)] * x[i];
        q += p[V(i, d)] * p[V(i, d)] * x[i];
      }
      f += 0.5 * (qbpp::sqr(s) - q);
    }
    f.simplify_as_binary();
    auto sol = qbpp::EasySolver(f).search({{"time_limit", 0.1}});
    Bits b(N);
    for (int i = 0; i < N; ++i) b[i] = int(sol.get(x[i]));

    // 4. 評価済みの点なら、ランダムなビットを反転してから評価する
    while (seen.count(b)) b[pos(rng)] ^= 1;
    evaluate(b);
    if (y.back() < best) {
      best = y.back();
      std::cout << "eval " << X.size() << ": f = " << best << std::endl;
    }
  }

  // 答え合わせ: 全 2^N 通りの中の最小値
  double fmin = INFINITY;
  for (int c = 0; c < (1 << N); ++c) {
    Bits b(N);
    for (int i = 0; i < N; ++i) b[i] = (c >> i) & 1;
    fmin = std::min(fmin, blackbox(b));
  }
  std::cout << "minimum over all 2^" << N << " points: " << fmin << std::endl;
}
```
{% endraw %}

- `#define DOUBLE_TYPE` で、式の係数を実数（`double`）にしています（[実数（double）係数](VAREXPR#実数double係数)）。
  学習した FM のパラメータは実数なので、そのまま QUBO++ の式の係数にできます。
- `blackbox` が評価の代わりの式です。FMQA の部分は `blackbox` が返す値だけを使います。
- FM のパラメータ $w_0, w_i, v_{id}$ は 1 本のベクトル `p` に並べ、`W(i)` と `V(i, d)` でその位置を求めます。
  `predict` が予測式、`train` が Adam による学習です。
- 手順 3 では、学習した予測式をそのまま QUBO++ の式 `f` に書き、`simplify_as_binary()` で $x_i^2 = x_i$ として整理してから `EasySolver` で解きます。
  変数は 20 個なので、求解は 0.1 秒で十分です。
- 学習が進むと、すでに評価した点が提案されることがよくあります。
  同じ点を評価し直しても情報は増えないので、手順 4 で、まだ評価していない点になるまでランダムなビットを反転します。
- 実行には 1 分ほどかかります。

### 出力結果

```
eval 20: f = -129.74
eval 28: f = -154.69
eval 32: f = -171.50
eval 47: f = -284.15
eval 73: f = -293.65
eval 163: f = -294.58
eval 165: f = -297.55
eval 185: f = -298.53
minimum over all 2^20 points: -299.92
```

最初にランダムに選んだ 20 点の最良値は $-129.74$ で、185 回目の評価で $-298.53$ に達しています（全 $2^{20}$ 通りの最小値は $-299.92$）。
学習の初期値などに乱数を使っているので、乱数の種を変えると結果も変わります。

## ランダム探索・山登り法との比較

乱数の種を変えて上のプログラムを 20 回実行し、評価回数ごとの最良値（中央値）を、次の 2 つの方法と比べました:

- **ランダム探索**: 各ビットを確率 $1/2$ で決めた $x$ を評価することを繰り返します（値は全 $2^{20}$ 通りの分布から計算）。
- **山登り法**: ランダムな $x$ から始め、ランダムな順に 1 ビットずつ反転して評価し、$f$ が小さくなればそこへ移ります。
  どのビットを反転しても小さくならない点（局所最適解）に着いたら、新しいランダムな $x$ からやり直します。
  評価済みの点は評価し直さず、500 回実行した中央値です。

| 評価回数 | FMQA | ランダム探索 | 山登り法 |
|---:|---:|---:|---:|
| 50 | $-280.80$ | $-209.88$ | $-290.96$ |
| 100 | $-292.53$ | $-235.38$ | $-294.11$ |
| 200 | $-298.10$ | $-255.48$ | $-296.06$ |
| 300 | $-298.52$ | $-264.01$ | $-296.67$ |
| 300 回以内に最小値の 99% 以内に入った割合 | $90\%$ | $1.4\%$ | $49\%$ |

- FMQA はランダム探索よりずっと小さい値に届きます。
- 山登り法は、評価回数が少ないうちは FMQA より良い値を出しますが、$-296$ 付近で止まりがちです。
  この $f$ には局所最適解が $357$ 個あり、その多くは $-290$ 前後の値です。
  そこから最小値の近くへ行くには、3 つの和を同時に谷底へ合わせる必要があり、何ビットも同時に変えなければなりません。
- FMQA は谷の形を FM で学習し、その最小点として何ビットも離れた点へ一度に移れるので、評価 100〜200 回で山登り法を追い越します。

この例の QUBO は変数が 20 個と小さく、ソルバーにとっては簡単な問題です。
結果を左右しているのは主に学習の部分です。
変数が数百以上に増えたり、$x$ に制約があったりすると、QUBO を正しく解く部分の役割が大きくなります。
