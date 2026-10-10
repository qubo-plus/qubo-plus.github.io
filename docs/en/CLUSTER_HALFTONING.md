---
last_modified: 2026-10-06
layout: default
nav_exclude: true
title: "Clustered-Dot Halftoning"
nav_order: 56
lang: en
hreflang_alt: "ja/CLUSTER_HALFTONING"
hreflang_lang: "ja"
---

# Clustered-Dot Halftoning

[Image halftoning](HALFTONING) found, with a QUBO, a black-and-white image that looks like the original image when blurred.
This page adds the condition "**every pixel belongs to a 2×2 block of its own color**".
No isolated white or black pixel and no line one pixel wide appears; both white and black are drawn in clusters of at least 2×2.

With the negated literal `~x`, this condition becomes one constraint per pixel, written as it is.
In addition, building a solution that satisfies the condition with a simple method first and passing it as a **hint** improves the search considerably.

## Why clustered dots

A halftone image is eventually printed on paper,
but printers and presses cannot always put a single-pixel dot on paper exactly as designed.

- **Dot gain**: ink and toner spread slightly on paper, so black dots come out larger than designed.
  An isolated white pixel inside a black area is **filled in** by the spreading black around it.
- **Dots too small to print**: conversely, an isolated black pixel inside a white area is too small
  for ink or toner to stay on the paper reliably, so it **disappears or prints only sometimes**.

Both shift the tones, and by amounts that depend on the printer and the paper.
Grouping both white and black into clusters of at least a certain size makes spreading and dropouts matter relatively less, so the tones are reproduced stably.
The halftone dots of newspaper and magazine printing are based on the same idea: dots are clustered, and their size represents the tone.

This page guarantees a minimum dot size of 2×2 pixels.

## QUBO formulation

### Objective

The objective is the same as in [image halftoning](HALFTONING): the sum of squared differences between the blurred binary image and the target
($x_{ij} = 1$ is white, $0$ is black, and $G$ is a $7 \times 7$ integer Gaussian whose coefficients sum to $255$):

$$E(x) = \sum_{i,j} \bigl( (G * x)_{ij} - T_{ij} \bigr)^2$$

### Constraint: every pixel belongs to a one-color 2×2 window

With the negated literal $\overline{x} = 1 - x$, the expression that is $1$ if the 2×2 window with top-left $(i, j)$ is one color (all four pixels white or all four black) and $0$ otherwise is:

$$m_{ij} = x_{i,j}\, x_{i,j+1}\, x_{i+1,j}\, x_{i+1,j+1} + \overline{x_{i,j}}\; \overline{x_{i,j+1}}\; \overline{x_{i+1,j}}\; \overline{x_{i+1,j+1}}$$

A pixel $p$ lies in up to $4$ windows (as their top-left, top-right, bottom-left, or bottom-right pixel).
The condition "$p$ belongs to a 2×2 block of its own color" says that one of them is one color
(a one-color window has the color of $p$, which lies in it):

$$\sum_{W \ni p} m_W \ge 1 \qquad (\text{every pixel } p)$$

Windows are taken inside the image only, so a corner pixel lies in a single window, and the 2×2 block at each corner is always one color.

### Keeping the negated literals

QUBO++'s `simplify_as_binary()` does not expand a negated literal `~x` in a term of degree 3 or more into $1 - x$; it keeps it.
The black window $\overline{x_{i,j}}\;\overline{x_{i,j+1}}\;\overline{x_{i+1,j}}\;\overline{x_{i+1,j+1}}$ therefore stays a single degree-4 term,
and the constraint of a pixel has at most $8$ terms ($4$ windows × $2$ terms for white and black).
Written as a product of $(1 - x)$, one black window expands into $16$ terms, and the constraints become about $6$ times larger in total.
EasySolver and ABS3Solver handle these degree-4 constraints wrapped in `qbpp::cons()` as they are.

## Searching from a 2×2 block solution as a hint

With this constraint the problem is hard for a solver.
Flipping a single pixel of an image that satisfies the condition almost always makes that pixel or a nearby one break it,
so changing the shape of a cluster requires passing through states that break the condition many times.

On the other hand, an image that satisfies the condition is easy to build:
split the image into 2×2 blocks and choose white or black per block (the variables form a grid of half the size); then every pixel lies in a one-color 2×2 block.
This is halftoning at half the resolution, an ordinary QUBO without constraints.

So we solve in two stages:

1. Solve halftoning in units of 2×2 blocks.
2. Pass that solution as a hint with `params.hint()` and solve the problem with per-pixel variables and the constraints.

The hint satisfies every constraint, so the solver starts from a good solution that meets the condition
and looks for solutions free of the block grid by shifting clusters and changing their shapes.
The energy of the returned solution is never worse than that of the hint.

## QUBO++ program

The following program converts the same $64\times 64$ synthetic image as in [image halftoning](HALFTONING) into a clustered-dot halftone in two stages:

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

#include <fstream>
#include <vector>

constexpr int M = 3;  // filter radius (7x7 filter)
constexpr int ROWS = 64, COLS = 64;
// integer Gaussian (sum = 255)
constexpr int G[2 * M + 1][2 * M + 1] = {{0, 0, 1, 1, 1, 0, 0},
                                         {0, 1, 5, 7, 5, 1, 0},
                                         {1, 5, 14, 21, 14, 5, 1},
                                         {1, 7, 21, 31, 21, 7, 1},
                                         {1, 5, 14, 21, 14, 5, 1},
                                         {0, 1, 5, 7, 5, 1, 0},
                                         {0, 0, 1, 1, 1, 0, 0}};

using Image = std::vector<std::vector<int>>;

// convolution with G (pixels outside the image are treated as 0)
Image blur(const Image& a) {
  Image out(ROWS, std::vector<int>(COLS, 0));
  for (int i = 0; i < ROWS; ++i)
    for (int j = 0; j < COLS; ++j)
      for (int k = 0; k <= 2 * M; ++k)
        for (int l = 0; l <= 2 * M; ++l)
          if (i + k - M >= 0 && i + k - M < ROWS && j + l - M >= 0 &&
              j + l - M < COLS)
            out[i][j] += G[k][l] * a[i + k - M][j + l - M];
  return out;
}

int main() {
  // input image: diagonal gradient + bright disk (synthetic)
  Image img(ROWS, std::vector<int>(COLS));
  for (int i = 0; i < ROWS; ++i)
    for (int j = 0; j < COLS; ++j)
      img[i][j] = (i - 20) * (i - 20) + (j - 44) * (j - 44) < 196
                      ? 235
                      : 255 * (i + j) / (ROWS + COLS - 2);

  // target T: the original image itself (scaled near the border by the reachable filter mass)
  Image mass = blur(Image(ROWS, std::vector<int>(COLS, 1)));
  Image target(ROWS, std::vector<int>(COLS));
  for (int i = 0; i < ROWS; ++i)
    for (int j = 0; j < COLS; ++j)
      target[i][j] = (img[i][j] * mass[i][j] + 127) / 255;

  // E = sum(((G * x) - T)^2); px(i, j) is the value of pixel (i, j) (1 = white)
  auto error = [&](auto px) {
    qbpp::Expr f = 0;
    for (int i = 0; i < ROWS; ++i)
      for (int j = 0; j < COLS; ++j) {
        qbpp::Expr e = -target[i][j];
        for (int k = 0; k <= 2 * M; ++k)
          for (int l = 0; l <= 2 * M; ++l) {
            int ii = i + k - M, jj = j + l - M;
            if (ii >= 0 && ii < ROWS && jj >= 0 && jj < COLS && G[k][l])
              e += G[k][l] * px(ii, jj);
          }
        f += qbpp::sqr(e);
      }
    return f;
  };

  // stage 1: paint in 2x2 blocks (variables on a grid of half the size)
  auto y = qbpp::var("y", ROWS / 2, COLS / 2);
  auto f1 = error([&](int i, int j) { return y[i / 2][j / 2]; });
  f1.simplify_as_binary();
  auto sol1 = qbpp::EasySolver(f1).search({{"time_limit", 5.0}});
  std::cout << "block:   energy = " << sol1.energy() << std::endl;

  // stage 2: pixel variables x and "every pixel lies in a one-color 2x2 window"
  auto x = qbpp::var("x", ROWS, COLS);
  auto f = error([&](int i, int j) { return x[i][j]; });
  // mono[i][j]: 1 if the 2x2 window with top-left (i, j) is one color (all white or all black)
  std::vector<std::vector<qbpp::Expr>> mono(ROWS - 1,
                                            std::vector<qbpp::Expr>(COLS - 1));
  for (int i = 0; i + 1 < ROWS; ++i)
    for (int j = 0; j + 1 < COLS; ++j)
      mono[i][j] = x[i][j] * x[i][j + 1] * x[i + 1][j] * x[i + 1][j + 1] +
                   ~x[i][j] * ~x[i][j + 1] * ~x[i + 1][j] * ~x[i + 1][j + 1];
  for (int i = 0; i < ROWS; ++i)
    for (int j = 0; j < COLS; ++j) {
      qbpp::Expr c = 0;  // the windows containing pixel (i, j) (up to 4)
      for (int s = i - 1; s <= i; ++s)
        for (int t = j - 1; t <= j; ++t)
          if (s >= 0 && s + 1 < ROWS && t >= 0 && t + 1 < COLS) c += mono[s][t];
      f += 140000 * qbpp::cons(c >= 1);
    }
  f.simplify_as_binary();

  // search from the stage-1 solution (it satisfies every constraint) as the hint
  qbpp::Sol hint(f);
  for (int i = 0; i < ROWS; ++i)
    for (int j = 0; j < COLS; ++j)
      hint.set(x[i][j], sol1.get(y[i / 2][j / 2]));
  qbpp::Params params({{"time_limit", 5.0}});
  params.hint(hint);
  auto sol = qbpp::EasySolver(f).search(params);
  std::cout << "cluster: energy = " << sol.energy()
            << "  violations = " << f.cons(sol) << std::endl;

  // save the solution as a binary image in PGM format
  auto bits = sol(x);
  std::ofstream ofs("cluster_halftone.pgm");
  ofs << "P2\n" << COLS << " " << ROWS << "\n255\n";
  for (int i = 0; i < ROWS; ++i) {
    for (int j = 0; j < COLS; ++j) ofs << 255 * int(bits[i][j]) << " ";
    ofs << "\n";
  }
}
```
{% endraw %}

- `error` takes a function `px` that returns the value of a pixel and builds the objective $E$.
  The first stage passes the block variable `y[i / 2][j / 2]`, the second stage the pixel variable `x[i][j]`.
- `mono[i][j]` is the one-color window $m_{ij}$; the black window is a product of negated literals `~x`.
- `qbpp::cons(c >= 1)` is the per-pixel constraint. The weight $140000$ is chosen larger than the largest error reduction of flipping one pixel ($2 \cdot 255 \cdot 255 + \sum G^2 \approx 134000$).
- `qbpp::Sol hint(f)` creates a solution over the variables of `f`; the program copies the first-stage solution into it and passes it with `params.hint(hint)`.
- `f.cons(sol)` is the number of constraints the solution breaks ($0$ means the condition holds everywhere).

### Output

```
block:   energy = 1861924
cluster: energy = 1589165  violations = 0
```

All constraints are satisfied, and the energy (error) of the second stage is smaller than that of the block solution of the first stage.
`EasySolver` is a randomized heuristic, so the values change from run to run.

The input image (left), the 2×2 block solution of the first stage (middle), and the clustered-dot halftone of the second stage (right):

<p align="center">
  <img src="../images/halftone_in.png" alt="Input grayscale image" width="30%">
  <img src="../images/cluster_ht_block.png" alt="2x2 block solution" width="30%">
  <img src="../images/cluster_ht_out.png" alt="Clustered-dot halftone" width="30%">
</p>

In the block solution (middle) every dot sits on the 2×2 grid; in the second stage (right) some dots move off the grid, which lowers the error.

## Applying it to a photo

With a photo as the input, the result looks as follows ($512 \times 512$ pixels, $262{,}144$ variables, `ABS3Solver` for 300 seconds per stage).
From left to right: the input photo, the 2×2 block solution, and the clustered-dot halftone:

<p align="center">
  <img src="../images/cluster_ht_photo_in.png" alt="Input photo" width="32%">
  <img src="../images/cluster_ht_photo_block.png" alt="2x2 block solution" width="32%">
  <img src="../images/cluster_ht_photo_out.png" alt="Clustered-dot halftone of the photo" width="32%">
</p>

A close-up shows that the ordinary halftone without the constraint (left) has many isolated white and black pixels,
while in the 2×2 block solution (middle) and the clustered-dot halftone (right) both white and black come in clusters of at least 2×2:

<p align="center">
  <img src="../images/cluster_ht_zoom.png" alt="Close-up: no constraint, 2x2 blocks, clustered dots" width="80%">
</p>

### Effect of the hint and of the negated literals

The same photo solved in different ways (`ABS3Solver`, 600 seconds in total). The error is the value of the objective $E(x)$:

| Method | Error |
|:---|---:|
| Halftone without the constraint (reference; 49% of the pixels break the condition) | 9,414,753 |
| Per-pixel variables with the constraints only (no hint) | 193,151,598 |
| 2×2 blocks only | 122,308,505 |
| **Constraints, starting from the block solution as the hint** | **118,891,447** |
| Same, with the black window written as a product of `(1 - x)` | 119,308,158 |

- **Without the hint the search does not get there**: the solutions of the constrained problem include every block solution, yet solving it without the hint finds only solutions much worse than the block solution.
  Starting from a solution that satisfies the condition, the error goes down further from the block solution.
- **Effect of the negated literals**: written with `~x`, the constraints have about $2.09$ million terms in total.
  Written as products of `(1 - x)`, they have about $12.8$ million terms (about $6$ times), and building the expression takes longer ($19$ s → $25$ s).
  In the same search time, the error reduction from the block solution was also larger with `~x` ($4.3\%$ against $3.8\%$).

The error is much larger than that of the halftone without the constraint because 2×2 clusters cannot draw single-pixel details; this is the price of the condition.
In print, this price buys an image that is robust to spreading and dropouts.

