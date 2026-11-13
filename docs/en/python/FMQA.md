---
last_modified: 2026-10-07
layout: default
nav_exclude: true
title: "Black-Box Optimization with FMQA"
nav_order: 95
lang: en
hreflang_alt: "ja/python/FMQA"
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

```python
import numpy as np
import pyqbpp.d as qbpp

N = 20       # number of bits
K = 3        # number of sines in the black box
D = 3        # dimension of the FM vectors
INIT = 20    # number of random points evaluated first
EVALS = 300  # number of black-box evaluations allowed

# coefficients a_ki of the black box
A = np.array([
    [0.02, 0.90, -0.71, 0.90, -0.38, -0.15, 0.66, -0.18, 0.10, -0.94,
     0.51, 0.08, -0.34, 0.58, -0.39, -0.09, -0.73, -0.19, -0.59, -0.48],
    [0.50, -0.44, -0.03, 0.96, 0.92, 0.45, 0.08, -0.45, -0.68, 0.94,
     0.03, -0.77, 0.25, 0.55, 0.23, 0.83, -0.92, 0.06, -0.08, -0.88],
    [0.28, 0.71, 0.19, -0.48, 0.68, 0.02, 0.02, 0.51, -0.70, 0.64,
     0.37, 0.57, -0.62, 0.60, -0.62, -0.84, 0.71, 0.72, 0.75, -0.06]])


# black box f(x) = 100 * Σ_k sin(Σ_i a_ki x_i)
# in reality an expensive measurement or simulation; a formula stands in here
def blackbox(b):
    return 100 * np.sin(A @ b).sum()


# trains the FM by minimizing (mean squared error to y) + regularization with Adam
def train(X, y, rng):
    p = [np.zeros(1), np.zeros(N), rng.normal(0, 0.1, (N, D))]  # w0, w, v
    m = [np.zeros_like(a) for a in p]
    u = [np.zeros_like(a) for a in p]
    lr, b1, b2, l2 = 0.05, 0.9, 0.999, 1e-4
    for t in range(1, 1001):
        w0, w, v = p
        # prediction w0 + Σ_i w_i x_i + (1/2) Σ_d [(Σ_i v_id x_i)^2 - Σ_i v_id^2 x_i]
        s = X @ v  # s[n, d] = Σ_i v_id x_i
        pred = w0[0] + X @ w + 0.5 * ((s**2).sum(1) - X @ (v**2).sum(1))
        # gradient
        r = 2 * (pred - y) / len(y)
        g = [np.array([r.sum()]),
             X.T @ r + 2 * l2 * w,
             X.T @ (r[:, None] * s) - v * (X.T @ r)[:, None] + 2 * l2 * v]
        # Adam update
        for j in range(3):
            m[j] = b1 * m[j] + (1 - b1) * g[j]
            u[j] = b2 * u[j] + (1 - b2) * g[j]**2
            mh = m[j] / (1 - b1**t)
            uh = u[j] / (1 - b2**t)
            p[j] = p[j] - lr * mh / (np.sqrt(uh) + 1e-8)
    return p


rng = np.random.default_rng(7)
X = []      # evaluated points
y = []      # their f values
seen = set()  # points already evaluated


def evaluate(b):
    X.append(b)
    y.append(blackbox(b))
    seen.add(tuple(b))


# 1. evaluate randomly chosen points
while len(X) < INIT:
    b = rng.integers(0, 2, N)
    if tuple(b) not in seen:
        evaluate(b)
best = min(y)
print(f"eval {len(X)}: f = {best:.2f}")

x = qbpp.var("x", N)
while len(X) < EVALS:
    # 2. standardize the f values (mean 0, std 1) and train the FM
    z = (np.array(y) - np.mean(y)) / np.std(y)
    w0, w, v = train(np.array(X), z, rng)

    # 3. write the FM prediction as a QUBO++ expression and minimize it
    f = w0[0]
    for i in range(N):
        f += w[i] * x[i]
    for d in range(D):
        s = 0
        q = 0
        for i in range(N):
            s += v[i, d] * x[i]
            q += v[i, d] ** 2 * x[i]
        f += 0.5 * (qbpp.sqr(s) - q)
    f.simplify_as_binary()
    sol = qbpp.EasySolver(f).search(time_limit=0.1)
    b = np.array(sol(x), dtype=int)

    # 4. if already evaluated, flip random bits before evaluating
    while tuple(b) in seen:
        i = rng.integers(N)
        b[i] = 1 - b[i]
    evaluate(b)
    if y[-1] < best:
        best = y[-1]
        print(f"eval {len(X)}: f = {best:.2f}")

# check: the minimum over all 2^N points
B = (np.arange(2**N)[:, None] >> np.arange(N)) & 1
fmin = (100 * np.sin(B @ A.T).sum(axis=1)).min()
print(f"minimum over all 2^{N} points: {fmin:.2f}")
```

- `import pyqbpp.d` makes the coefficients of expressions real numbers (`float`) (see [Real (double) coefficients](VAREXPR#real-double-coefficients)).
  The trained FM parameters are real numbers, so they can be used directly as coefficients of a QUBO++ expression. The training uses numpy (`pip install numpy`).
- `blackbox` is the formula standing in for the evaluation. The FMQA part uses only the values returned by `blackbox`.
- The FM parameters are kept as `[w0, w, v]` (numpy arrays: `w0` of length 1, `w` of length `N`, and `v` of shape `N`×`D`).
  `train` computes the predictions and gradients for all evaluated points at once with matrix operations and updates them by Adam.
- In step 3, the trained prediction formula is written as the QUBO++ expression `f`, simplified with `simplify_as_binary()` (which uses $x_i^2 = x_i$), and solved by `EasySolver`.
  With 20 variables, 0.1 seconds is enough for the solver.
- As the training proceeds, points already evaluated are often proposed again.
  Evaluating the same point again gives no new information, so step 4 flips random bits until the point has not been evaluated yet.
- The program takes one to two minutes to run.

### Output

```
eval 20: f = -200.02
eval 28: f = -236.44
eval 32: f = -255.80
eval 37: f = -261.30
eval 41: f = -292.94
eval 89: f = -293.16
eval 113: f = -297.93
minimum over all 2^20 points: -299.92
```

The best of the first 20 random points is $-200.02$, and the 113th evaluation reaches $-297.93$ (the minimum over all $2^{20}$ points is $-299.92$).
Since random numbers are used, for example for the initial values of the training, the results change with the random seed.

## Comparison with random search and hill climbing

We ran the program above 20 times with different random seeds and compared the best value (median) after each number of evaluations with two other methods:

- **Random search**: repeatedly evaluates an $x$ whose bits are set to 0 or 1 with probability $1/2$ each (the values are computed from the distribution over all $2^{20}$ points).
- **Hill climbing**: starts from a random $x$, flips one bit at a time in random order, evaluates the result, and moves there if $f$ decreases.
  When no single-bit flip decreases $f$ (a local optimum), it restarts from a new random $x$.
  Points already evaluated are not evaluated again; the values are medians over 500 runs.

| Evaluations | FMQA | Random search | Hill climbing |
|---:|---:|---:|---:|
| 50 | $-285.32$ | $-209.88$ | $-290.96$ |
| 100 | $-293.61$ | $-235.38$ | $-294.11$ |
| 200 | $-297.93$ | $-255.48$ | $-296.06$ |
| 300 | $-298.55$ | $-264.01$ | $-296.67$ |
| Runs within 99% of the minimum after 300 evaluations | $90\%$ | $1.4\%$ | $49\%$ |

- FMQA reaches much smaller values than random search.
- Hill climbing is better than FMQA while the number of evaluations is small, but it tends to stop around $-296$.
  This $f$ has $357$ local optima, most of them around $-290$.
  To get from there close to the minimum, the three sums must be brought to the valley bottoms at the same time, which requires changing many bits at once.
- FMQA learns the shape of the valley with the FM and can move at once to its minimum, many bits away, so it overtakes hill climbing between 100 and 200 evaluations.

The QUBO in this example has only 20 variables and is easy for the solver.
What mainly decides the result here is the training.
With hundreds of variables or more, or with constraints on $x$, solving the QUBO correctly plays a larger role.
