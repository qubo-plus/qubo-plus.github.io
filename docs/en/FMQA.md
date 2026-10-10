---
last_modified: 2026-10-07
layout: default
nav_exclude: true
title: "Black-Box Optimization with FMQA"
nav_order: 57
lang: en
hreflang_alt: "ja/FMQA"
hreflang_lang: "ja"
---

# Black-Box Optimization with FMQA

FMQA (Factorization Machine with Quantum Annealing) minimizes a function that is costly to evaluate, using as few evaluations as possible.
It learns an approximate model of the function from the points evaluated so far, finds the point minimizing the model with a QUBO solver, evaluates that point next, and repeats.
QA in the name stands for quantum annealing, but any QUBO solver can be used for the QUBO part. This page uses `EasySolver`.

## Setting: an expensive black-box function

Suppose we want to minimize a function $f(x)$ of $n$ binary variables $x = (x_1, \ldots, x_n)$.
The formula of $f$ is unknown: we can only give an $x$ and get its value back (a black-box function).
Moreover, each evaluation needs an experiment or a time-consuming simulation, so the number of evaluations is limited.
For example, we decide for each of 20 materials whether to use it, build a prototype, and measure its performance.

Even with $n = 20$ there are $2^{20}$ (about one million) possible $x$, far too many to try them all.
On this page, the number of evaluations is limited to $300$, and we look for an $x$ with $f(x)$ as small as possible within them.

## Steps of FMQA

1. Evaluate some randomly chosen points.
2. Fit a quadratic model called a Factorization Machine (FM) to all points $(x, f(x))$ evaluated so far (training).
3. The prediction formula of the trained FM is a quadratic function of $x$, that is, a QUBO. Find the $x$ minimizing the prediction with a QUBO solver.
4. Evaluate that $x$, add it to the data, and go back to 2.

A point the model predicts to be small is actually evaluated; if the prediction was wrong, the result enters the next training and the model is corrected.
Repeating this "predict, check, correct" cycle approaches the minimum with few evaluations.
Because the QUBO solver picks the minimum of the model among all $2^n$ points, FMQA can move at once to a point that differs in many bits.

## The black-box function of this example

On this page, the following formula stands in for the expensive evaluation ($n = 20$):

$$f(x) = 100 \sum_{k=1}^{3} \sin\Bigl(\sum_{i=1}^{20} a_{ki}\, x_i\Bigr)$$

The coefficients $a_{ki}$ are numbers between $-1$ and $1$, written as a table in the program.
The formula is used only in place of the evaluation and for checking the answer; the FMQA part never uses its contents.

- $f(x)$ lies between $-300$ and $300$, and it is close to $-300$ when the three sums $\sum_i a_{ki} x_i$ are all near a valley of $\sin$ ($-\pi/2 + 2\pi m$).
  Checking all $2^{20}$ points shows that the minimum is $-299.92$.
- As a sum of sines, $f$ is not a quadratic function (QUBO) of $x$. FMQA searches while approximating it by quadratic functions.
- Good solutions are rare. Only $51$ points (about $0.005\%$ of all) are within 99% of the minimum ($-296.92$ or less),
  and 300 randomly chosen points contain one of them with probability $1.4\%$.

## Factorization Machine

An FM predicts $f(x)$ by the quadratic function

$$\hat{y}(x) = w_0 + \sum_{i} w_i x_i + \sum_{i<j} \langle v_i, v_j\rangle\, x_i x_j,$$

where $w_0$ and $w_i$ are real numbers, $v_i$ is a $D$-dimensional real vector for each variable $x_i$, and $\langle v_i, v_j\rangle$ is their inner product.

- **Quadratic coefficients as inner products**: estimating every quadratic coefficient separately means $190$ coefficients for $n = 20$.
  An FM estimates only the components of the vectors $v_i$, which is $60$ numbers for $D = 3$.
  Together with $w_0$ and $w_i$ there are $81$ parameters, so the FM can be trained while only a few points have been evaluated.
- **Why $D = 3$**: $f$ in this example depends on $x$ only through the three linear functions $\sum_i a_{ki} x_i$.
  Approximating each $\sin$ near its valley by a parabola $\gamma_k \bigl(\sum_i a_{ki} x_i - c_k\bigr)^2$ ($\gamma_k > 0$)
  gives the coefficient $2 \sum_k \gamma_k a_{ki} a_{kj}$ of $x_i x_j$, which is exactly an inner product of 3-dimensional vectors.
  In real problems such a structure is unknown, so $D$ is chosen by trying a few values.
Using $x_i^2 = x_i$, the quadratic part can also be rewritten as follows ($v_{id}$ is the $d$-th component of $v_i$):

$$\sum_{i<j} \langle v_i, v_j\rangle\, x_i x_j = \frac{1}{2} \sum_{d=1}^{D} \Bigl[ \Bigl(\sum_i v_{id}\, x_i\Bigr)^2 - \sum_i v_{id}^2\, x_i \Bigr]$$

Both the training and the construction of the QUBO use this form.

### Training

Let $y$ be the $f$ values of the evaluated points, standardized to mean $0$ and standard deviation $1$.
The mean squared error between the predictions and $y$, plus the regularization term $\lambda \bigl(\sum_i w_i^2 + \sum_{i,d} v_{id}^2\bigr)$ ($\lambda = 10^{-4}$),
is minimized with a gradient method called Adam ($1000$ updates).
The gradient is obtained by differentiating the prediction formula; for example, $\partial \hat{y} / \partial v_{id} = x_i \bigl(\sum_j v_{jd}\, x_j - v_{id}\bigr)$.
After every evaluation, the FM is trained from scratch, with $v_{id}$ initialized again with random numbers.

## QUBO++ program

The following program runs FMQA with 300 evaluations and, to check the answer, finally prints the minimum over all $2^{20}$ points:

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

constexpr int N = 20;       // number of bits
constexpr int K = 3;        // number of sines in the black box
constexpr int D = 3;        // dimension of the FM vectors
constexpr int INIT = 20;    // number of random points evaluated first
constexpr int EVALS = 300;  // number of black-box evaluations allowed

// coefficients a_ki of the black box
constexpr double A[K][N] = {
    {0.02, 0.90, -0.71, 0.90, -0.38, -0.15, 0.66, -0.18, 0.10, -0.94,
     0.51, 0.08, -0.34, 0.58, -0.39, -0.09, -0.73, -0.19, -0.59, -0.48},
    {0.50, -0.44, -0.03, 0.96, 0.92, 0.45, 0.08, -0.45, -0.68, 0.94,
     0.03, -0.77, 0.25, 0.55, 0.23, 0.83, -0.92, 0.06, -0.08, -0.88},
    {0.28, 0.71, 0.19, -0.48, 0.68, 0.02, 0.02, 0.51, -0.70, 0.64,
     0.37, 0.57, -0.62, 0.60, -0.62, -0.84, 0.71, 0.72, 0.75, -0.06}};

using Bits = std::vector<int>;

// black box f(x) = 100 * Σ_k sin(Σ_i a_ki x_i)
// in reality an expensive measurement or simulation; a formula stands in here
double blackbox(const Bits& x) {
  double f = 0;
  for (int k = 0; k < K; ++k) {
    double s = 0;
    for (int i = 0; i < N; ++i) s += A[k][i] * x[i];
    f += 100 * std::sin(s);
  }
  return f;
}

// the FM parameters w0, w_i, v_id are stored in one vector p
constexpr int P = 1 + N + N * D;
int W(int i) { return 1 + i; }                     // p[W(i)] = w_i
int V(int i, int d) { return 1 + N + i * D + d; }  // p[V(i, d)] = v_id

// FM prediction w0 + Σ_i w_i x_i + (1/2) Σ_d [(Σ_i v_id x_i)^2 - Σ_i v_id^2 x_i]
// also returns s[d] = Σ_i v_id x_i (used for the gradient)
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

// trains the FM by minimizing (mean squared error to y) + regularization with Adam
std::vector<double> train(const std::vector<Bits>& X,
                          const std::vector<double>& y, std::mt19937& rng) {
  std::vector<double> p(P, 0.0), m(P, 0.0), u(P, 0.0), g(P), s;
  std::normal_distribution<double> init(0.0, 0.1);
  for (int i = 0; i < N; ++i)
    for (int d = 0; d < D; ++d) p[V(i, d)] = init(rng);
  const double lr = 0.05, b1 = 0.9, b2 = 0.999, l2 = 1e-4;
  for (int t = 1; t <= 1000; ++t) {
    // gradient
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
    for (int j = 1; j < P; ++j) g[j] += 2 * l2 * p[j];  // regularization (except w0)
    // Adam update
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
  std::vector<Bits> X;    // evaluated points
  std::vector<double> y;  // their f values
  std::set<Bits> seen;    // points already evaluated
  auto evaluate = [&](const Bits& b) {
    X.push_back(b);
    y.push_back(blackbox(b));
    seen.insert(b);
  };
  std::cout << std::fixed << std::setprecision(2);

  // 1. evaluate randomly chosen points
  while (X.size() < INIT) {
    Bits b(N);
    for (int i = 0; i < N; ++i) b[i] = coin(rng);
    if (!seen.count(b)) evaluate(b);
  }
  double best = *std::min_element(y.begin(), y.end());
  std::cout << "eval " << X.size() << ": f = " << best << std::endl;

  auto x = qbpp::var("x", N);
  while (X.size() < EVALS) {
    // 2. standardize the f values (mean 0, std 1) and train the FM
    double mean = 0, variance = 0;
    for (double v : y) mean += v / y.size();
    for (double v : y) variance += (v - mean) * (v - mean) / y.size();
    std::vector<double> z;
    for (double v : y) z.push_back((v - mean) / std::sqrt(variance));
    auto p = train(X, z, rng);

    // 3. write the FM prediction as a QUBO++ expression and minimize it
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

    // 4. if already evaluated, flip random bits before evaluating
    while (seen.count(b)) b[pos(rng)] ^= 1;
    evaluate(b);
    if (y.back() < best) {
      best = y.back();
      std::cout << "eval " << X.size() << ": f = " << best << std::endl;
    }
  }

  // check: the minimum over all 2^N points
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

- `#define DOUBLE_TYPE` makes the coefficients of expressions real numbers (`double`) (see [Real (double) coefficients](VAREXPR#real-double-coefficients)).
  The trained FM parameters are real numbers, so they can be used directly as coefficients of a QUBO++ expression.
- `blackbox` is the formula standing in for the evaluation. The FMQA part uses only the values returned by `blackbox`.
- The FM parameters $w_0, w_i, v_{id}$ are stored in one vector `p`, and `W(i)` and `V(i, d)` give their positions.
  `predict` is the prediction formula and `train` is the training by Adam.
- In step 3, the trained prediction formula is written as the QUBO++ expression `f`, simplified with `simplify_as_binary()` (which uses $x_i^2 = x_i$), and solved by `EasySolver`.
  With 20 variables, 0.1 seconds is enough for the solver.
- As the training proceeds, points already evaluated are often proposed again.
  Evaluating the same point again gives no new information, so step 4 flips random bits until the point has not been evaluated yet.
- The program takes about a minute to run.

### Output

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

The best of the first 20 random points is $-129.74$, and the 185th evaluation reaches $-298.53$ (the minimum over all $2^{20}$ points is $-299.92$).
Since random numbers are used, for example for the initial values of the training, the results change with the random seed.

## Comparison with random search and hill climbing

We ran the program above 20 times with different random seeds and compared the best value (median) after each number of evaluations with two other methods:

- **Random search**: repeatedly evaluates an $x$ whose bits are set to 0 or 1 with probability $1/2$ each (the values are computed from the distribution over all $2^{20}$ points).
- **Hill climbing**: starts from a random $x$, flips one bit at a time in random order, evaluates the result, and moves there if $f$ decreases.
  When no single-bit flip decreases $f$ (a local optimum), it restarts from a new random $x$.
  Points already evaluated are not evaluated again; the values are medians over 500 runs.

| Evaluations | FMQA | Random search | Hill climbing |
|---:|---:|---:|---:|
| 50 | $-280.80$ | $-209.88$ | $-290.96$ |
| 100 | $-292.53$ | $-235.38$ | $-294.11$ |
| 200 | $-298.10$ | $-255.48$ | $-296.06$ |
| 300 | $-298.52$ | $-264.01$ | $-296.67$ |
| Runs within 99% of the minimum after 300 evaluations | $90\%$ | $1.4\%$ | $49\%$ |

- FMQA reaches much smaller values than random search.
- Hill climbing is better than FMQA while the number of evaluations is small, but it tends to stop around $-296$.
  This $f$ has $357$ local optima, most of them around $-290$.
  To get from there close to the minimum, the three sums must be brought to the valley bottoms at the same time, which requires changing many bits at once.
- FMQA learns the shape of the valley with the FM and can move at once to its minimum, many bits away, so it overtakes hill climbing between 100 and 200 evaluations.

The QUBO in this example has only 20 variables and is easy for the solver.
What mainly decides the result here is the training.
With hundreds of variables or more, or with constraints on $x$, solving the QUBO correctly plays a larger role.
