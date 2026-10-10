---
last_modified: 2026-10-09
layout: default
nav_exclude: true
title: "Quantum Chemistry with FMQA"
nav_order: 98
lang: en
hreflang_alt: "ja/python/FMQA_CHEMISTRY"
hreflang_lang: "ja"
---

# Quantum Chemistry with FMQA

This page uses the procedure of [Black-Box Optimization with FMQA](FMQA) to find the molecular orbitals that minimize the energy of a molecule.
The shape of the molecular orbitals is described by angles, and the angles are searched with [native integer variables](NATIVE_INTEGER).
Instead of an FM, the model that predicts the energy (the surrogate model) is a polynomial in the integer variables.
QUBO++ minimizes this degree-4 polynomial in integer variables directly, without expanding the variables into binary variables.

The page covers two examples: one variable (HeH⁺) and two variables (a stretched H₂ molecule).

## Setting: an expensive energy calculation

In quantum chemistry, once the orbitals that hold the electrons (the molecular orbitals) are chosen, the energy of the molecule can be calculated.
Finding the molecular orbitals with the lowest energy is the core of the calculation.
For real molecules, a single energy calculation takes a long time.
Measuring the energy of a molecule on a quantum computer (the variational quantum eigensolver, VQE) also repeats the same loop: choose the angles of a circuit, then measure the energy.
We therefore treat the energy as a black-box function and look for its minimum with few evaluations.

The examples on this page are small molecules with two electrons, so the energy can be calculated by a short formula.
The formula is used only in place of the real calculation and to check the answer; the FMQA part does not look inside it.

## FMQA with integer variables

The procedure is the same as in [FMQA](FMQA):

1. Evaluate a few randomly chosen points.
2. Fit the surrogate model to all points evaluated so far (learning).
3. Write the surrogate model as a QUBO++ expression and find the point minimizing the prediction with `EasySolver`.
4. Evaluate the energy at that point, add it to the data, and go back to step 2.

What differs is the variables and the surrogate model:

- **Variables**: each angle of the molecular orbitals takes 65 values, represented by an integer.
  A native integer variable is not expanded into binary digits; the solver searches over its integer values directly.
  Moving to the next angle is a natural move: the integer goes up or down by 1.
- **Surrogate model**: an FM is a quadratic expression in binary variables, so it is a QUBO as is.
  On this page there are only one or two integer variables, so we use a degree-4 polynomial, which can represent more shapes.
  It has 5 coefficients for one variable and 15 for two.
  For native integer variables, `n * n` is the square of an integer, so a degree-4 polynomial is directly a QUBO++ expression.
- **Learning**: the prediction is linear in the coefficients, so regularized least squares (regularization coefficient $10^{-6}$) gives the coefficients by solving one system of linear equations.

## Example 1: the molecular orbital of HeH⁺

### The black-box function

The helium hydride ion HeH⁺ has two electrons.
We use the smallest basis (the STO-3G basis) and write the molecular orbital as a combination of two functions $\chi_1, \chi_2$, obtained by orthonormalizing the 1s orbitals of He and H.
When the two electrons occupy the same molecular orbital (the restricted Hartree-Fock method), the molecular orbital is given by a single angle $\theta$:

$$\phi(\theta) = \cos\theta\, \chi_1 + \sin\theta\, \chi_2$$

For any $\theta$, $\phi$ has length 1.
Since $\theta$ and $\theta + \pi$ give the same orbital up to sign, $-\pi/2 \le \theta \le \pi/2$ covers all molecular orbitals.
With $c = \cos\theta$ and $s = \sin\theta$, the energy is:

$$
\begin{aligned}
E(\theta) = E_\mathrm{nuc}
&+ 2\bigl(c^2 h_{11} + 2cs\, h_{12} + s^2 h_{22}\bigr) \\
&+ c^4 (11|11) + s^4 (22|22) + 2c^2 s^2 \bigl[(11|22) + 2\,(12|12)\bigr]
+ 4c^3 s\, (11|12) + 4cs^3\, (22|12)
\end{aligned}
$$

$h_{pq}$ are one-electron integrals (the kinetic energy of one electron and its attraction to the nuclei), $(pq|rs)$ are two-electron integrals (the repulsion between electrons), and $E_\mathrm{nuc}$ is the repulsion between the nuclei.
Their values at the bond length 1.4632 bohr are written in the program.

In a molecule made of two identical atoms, such as H₂, symmetry determines the molecular orbitals.
HeH⁺ is made of two different atoms, so how far the electrons lean toward He (the value of $\theta$) is not known until we calculate it.

### Integer variable and surrogate model

We represent $\theta$ by an integer $n \in \lbrace 0, \ldots, 64\rbrace$, 65 steps from $-\pi/2$ to $\pi/2$:

$$\theta(n) = -\frac{\pi}{2} + \frac{\pi n}{64}$$

The surrogate model is a degree-4 polynomial in $t = n/64$:

$$\hat{E}(n) = w_0 + w_1 t + w_2 t^2 + w_3 t^3 + w_4 t^4$$

We first evaluate 4 random points, and after that the $n$ found by QUBO++.
If the $n$ found by QUBO++ has already been evaluated, we evaluate a neighbor ($n \pm 1$) of the best point so far that has not been evaluated yet.
If both neighbors of the best point have been evaluated, the best point is confirmed to be lower than both neighbors, and we stop.

### QUBO++ program

```python
import numpy as np
import pyqbpp.d as qbpp

# integrals of HeH+ (STO-3G basis, bond length 1.4632 bohr, in Hartree)
# index 1 is He 1s and 2 is H 1s (orthonormalized basis)
H11, H22, H12 = -2.475236114935, -1.448259466847, -0.378724331272  # one-electron integrals
G1111, G2222, G1122 = 1.147471043048, 0.816258183162, 0.526201856993  # two-electron integrals
G1212, G1112, G2212 = 0.011345007430, -0.003104665462, -0.004941256971
E_NUC = 1.366867140514  # repulsion energy between the nuclei

L = 65    # number of angle steps
D = 4     # degree of the surrogate model
INIT = 4  # number of random points evaluated first


# black box: energy with two electrons in the orbital cos(θ) χ1 + sin(θ) χ2
# really a slow quantum chemistry calculation; a formula stands in here
def blackbox(theta):
    c, s = np.cos(theta), np.sin(theta)
    return (E_NUC + 2 * (c * c * H11 + 2 * c * s * H12 + s * s * H22)
            + c**4 * G1111 + s**4 * G2222
            + 2 * c * c * s * s * (G1122 + 2 * G1212)
            + 4 * c**3 * s * G1112 + 4 * c * s**3 * G2212)


# angle for the integer k (0 to L-1)
def theta(k):
    return -np.pi / 2 + np.pi * k / (L - 1)


rng = np.random.default_rng(0)
# 1. evaluate randomly chosen points
ks = [int(k) for k in rng.choice(L, INIT, replace=False)]  # evaluated points
es = [blackbox(theta(k)) for k in ks]                       # their energies
for i, k in enumerate(ks):
    print(f"eval {i + 1}: n = {k:2d}, E = {es[i]:.6f} Ha (random)")

n = qbpp.var("n", integer=(0, L - 1))
t = (1 / (L - 1)) * n  # coordinate from 0 to 1
while True:
    # 2. fit the surrogate model w0 + w1 t + ... + w4 t^4
    A = np.vander(np.array(ks) / (L - 1), D + 1, increasing=True)
    w = np.linalg.solve(A.T @ A + 1e-6 * np.eye(D + 1), A.T @ np.array(es))

    # 3. write the surrogate model in QUBO++ and find n minimizing it
    f = 0
    td = 1
    for d in range(D + 1):
        f += w[d] * td
        td = td * t
    f.simplify_as_binary()
    sol = qbpp.EasySolver(f).search(time_limit=0.2)
    k = int(sol(n))

    # if already evaluated, take an unevaluated neighbor of the best point
    if k in ks:
        b = ks[int(np.argmin(es))]
        k = next((m for m in (b - 1, b + 1) if 0 <= m < L and m not in ks),
                 None)
        if k is None:  # both neighbors of the best point are evaluated
            break

    # 4. evaluate the energy and add it to the data
    ks.append(k)
    es.append(blackbox(theta(k)))
    print(f"eval {len(ks)}: n = {k:2d}, E = {es[-1]:.6f} Ha")

b = ks[int(np.argmin(es))]
print(f"best: n = {b}, theta = {theta(b):.4f}, E = {min(es):.6f} Ha")
# check: the minimum over all L values
emin = min(blackbox(theta(k)) for k in range(L))
print(f"minimum over all {L} values: {emin:.6f} Ha")
```

- `import pyqbpp.d` makes the coefficients of expressions real numbers (`float`) (see [Real (double) coefficients](VAREXPR#real-double-coefficients)).
  The fitted coefficients $w_d$ can be used directly as coefficients of the QUBO++ expression.
- `qbpp.var("n", integer=(0, L - 1))` declares the integer variable $n$ with $0 \le n \le 64$.
  `t` is the expression $t = n/64$, and repeating `td = td * t` builds $t^d$.
- The fitting uses numpy (`pip install numpy`).
  `np.vander` builds the matrix whose rows are $1, t, t^2, t^3, t^4$ at the evaluated points, and `np.linalg.solve` solves the system of linear equations.
- `sol(n)` returns a real number, so it is converted to `int`.
- The program runs in a few seconds.

### Output

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

After the first 4 random points (`random`), 2 more evaluations reach $n = 41$ ($\theta = 0.4418$), the best of the 65 values.
Both neighbors of the best point ($n = 40$ and $n = 42$) have been evaluated, so the program stops there.
The last line is the answer obtained by evaluating all 65 values, and it agrees with the result of FMQA.

The molecular orbital found has $\cos\theta = 0.90$ and $\sin\theta = 0.43$: the electrons lean toward He.
The minimum over a continuous $\theta$ is $-2.841836$ Ha; the difference from the value found (0.43 mHa) comes from dividing $\theta$ into 65 steps.

Over 20 runs with different random seeds, all 20 runs reached the best of the 65 values.
Including the first 4 points, they used 6 to 10 evaluations (mostly 7 or 8), about 1/8 of evaluating all 65 values.

## Example 2: stretched H₂ and spin symmetry breaking

### The black-box function

Consider the two electrons of the hydrogen molecule H₂.
In the STO-3G basis, the 1s orbitals of the two H atoms give two molecular orbitals: the bonding orbital $\sigma_g$ and the antibonding orbital $\sigma_u$.
In the unrestricted Hartree-Fock method, the spin-up ($\alpha$) electron and the spin-down ($\beta$) electron may occupy different molecular orbitals.
We describe each of them by an angle, $\theta_\alpha$ and $\theta_\beta$:

$$
\phi_\alpha = \cos\theta_\alpha\, \sigma_g + \sin\theta_\alpha\, \sigma_u, \qquad
\phi_\beta = \cos\theta_\beta\, \sigma_g + \sin\theta_\beta\, \sigma_u
$$

With $c_x = \cos\theta_x$ and $s_x = \sin\theta_x$, the energy is:

$$
\begin{aligned}
E(\theta_\alpha, \theta_\beta) = E_\mathrm{nuc}
&+ (c_\alpha^2 + c_\beta^2)\, h_{gg} + (s_\alpha^2 + s_\beta^2)\, h_{uu} \\
&+ c_\alpha^2 c_\beta^2\, J_{gg} + s_\alpha^2 s_\beta^2\, J_{uu}
+ (c_\alpha^2 s_\beta^2 + s_\alpha^2 c_\beta^2)\, J_{gu}
+ 4\, c_\alpha s_\alpha c_\beta s_\beta\, K_{gu}
\end{aligned}
$$

$h_{gg}, h_{uu}$ are one-electron integrals, $J_{gg}, J_{uu}, J_{gu}$ are Coulomb integrals (the repulsion between electrons), and $K_{gu}$ is an exchange integral.
This page uses their values at the bond length 2.0 Å, with the bond stretched from its equilibrium length (0.74 Å).
The values are written in the program.

### The symmetric solution and the symmetry-broken solution

At $\theta_\alpha = \theta_\beta = 0$, both electrons occupy $\sigma_g$.
This is the solution of the restricted Hartree-Fock method, in which the two electrons share one orbital, and its energy is $E = -0.78379$ Ha.
Since $\sigma_g$ spreads evenly over both atoms, the $\alpha$ electron and the $\beta$ electron are each half on one atom and half on the other.

When the bond is stretched, the energy becomes lower if the $\alpha$ electron and the $\beta$ electron separate onto different atoms.
This is the solution $\theta_\alpha = -\theta_\beta \approx \pm 0.668$ with $E = -0.937213$ Ha, 153.4 mHa lower than the solution above.
The $\alpha$ electron is almost entirely on one atom and the $\beta$ electron on the other (spin density $\pm 0.98$ per atom).
The symmetry of the restricted Hartree-Fock solution, "the $\alpha$ electron and the $\beta$ electron have the same distribution", is lost, so this is called a spin-symmetry-broken solution.
The solution with $\alpha$ and $\beta$ exchanged (the signs of $\theta_\alpha$ and $\theta_\beta$ swapped) is a minimum with the same energy.

The usual calculation (an SCF calculation) started from a symmetric state with $\theta_\alpha = \theta_\beta$ does not leave the symmetric solution.
FMQA is told nothing about this symmetry.

Which solution is lower depends on the bond length.
The figure below shows, for each bond length $R$, the restricted Hartree-Fock energy ($\theta_\alpha = \theta_\beta = 0$), the minimum unrestricted Hartree-Fock energy (with $\theta_\alpha$ and $\theta_\beta$ both free), and the exact energy in the same basis.
The values in the figure were computed directly on fine grids, not with FMQA.

<p align="center">
  <img src="../../images/h2_curve_en.svg" alt="Dissociation curves of H₂: restricted and unrestricted Hartree-Fock and the exact energy" width="90%">
</p>

- For $R$ shorter than about 1.15 Å, the two Hartree-Fock energies coincide and the symmetry is not broken.
- For longer bonds, the symmetry-broken solution is lower.
  As $R$ grows, the unrestricted Hartree-Fock energy approaches the energy of two H atoms, while the restricted Hartree-Fock energy keeps rising.
  Because the two electrons are forced into the same orbital, the configuration with both electrons on one of the two separated atoms stays mixed in with half the weight.
- The difference from the exact energy (the electron correlation energy) is the part that neither Hartree-Fock method can capture.

The example on this page uses $R = 2.0$ Å, where the symmetry breaking is clear (the black dots in the figure).

### Integer variables and zooming

We represent the two angles by integers $n_\alpha, n_\beta \in \lbrace 0, \ldots, 64\rbrace$, 65 steps within a search range (the window).
The first window is $-\pi/2 \le \theta_\alpha, \theta_\beta \le \pi/2$, with an angle step of $\pi/64 \approx 0.049$ rad.
The surrogate model is a degree-4 polynomial in the two window coordinates $u = n/64 \in [0, 1]$:

$$\hat{E} = \sum_{i + j \le 4} w_{ij}\, u_\alpha^i\, u_\beta^j$$

When the best value has not improved 4 times in a row (or after QUBO++ has found 15 points in one window), we halve the width of the window around the best point (zooming).
Because the number of steps, 65, is odd, the window center $n = 32$ is a grid point, and the best point stays a grid point of the next window.
Six stages of zooming refine the angle step from about 0.049 rad to about 0.0015 rad.

- Each stage starts by evaluating random points in the window (6 in the first stage, 3 after that).
- Learning uses all points inside the current window, including those evaluated in earlier stages.
  The polynomial is a function of continuous coordinates, so points that are not on the current grid can be used as they are.
- If the point found by QUBO++ has already been evaluated, we evaluate, among the 8 points around it, the one with the lowest prediction that has not been evaluated yet.

### QUBO++ program

```python
import numpy as np
import pyqbpp.d as qbpp

# integrals of stretched H2 (STO-3G basis, bond length 2.0 Å, in Hartree)
# g is the bonding orbital σg and u the antibonding orbital σu
H_GG, H_UU = -0.778922064923, -0.670266674748                       # one-electron integrals
J_GG, J_UU, J_GU = 0.509462821477, 0.534664130913, 0.519201267361  # Coulomb integrals
K_GU = 0.259138467265                                               # exchange integral
E_NUC = 0.264588624497  # repulsion energy between the nuclei

L = 65        # number of angle steps in the window (odd)
D = 4         # degree of the surrogate model
STAGES = 6    # number of zoom stages
ITERS = 15    # max points found by QUBO++ per stage
PATIENCE = 4  # next stage after this many non-improving evals
POWERS = [(i, j) for i in range(D + 1) for j in range(D + 1 - i)]  # i + j <= D


# black box: energy with the α electron in cos(θa) σg + sin(θa) σu
#            and the β electron in cos(θb) σg + sin(θb) σu
# really a slow quantum chemistry calculation; a formula stands in here
def blackbox(ta, tb):
    ca, sa, cb, sb = np.cos(ta), np.sin(ta), np.cos(tb), np.sin(tb)
    return (E_NUC + (ca * ca + cb * cb) * H_GG + (sa * sa + sb * sb) * H_UU
            + ca * ca * cb * cb * J_GG + sa * sa * sb * sb * J_UU
            + (ca * ca * sb * sb + sa * sa * cb * cb) * J_GU
            + 4 * ca * sa * cb * sb * K_GU)


history = []  # evaluated (θa, θb, E)


# evaluate the energy at grid point k = (ka, kb) and add it to the data
# return True if the best value improves (below 1e-12 is rounding error)
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
ua = (1 / (L - 1)) * na  # coordinates in the window (0 to 1)
ub = (1 / (L - 1)) * nb
lo = np.array([-np.pi / 2, -np.pi / 2])  # lower-left corner of the window
step = np.pi / (L - 1)                   # grid spacing

for stage in range(STAGES):
    seen = set()  # grid points evaluated in this stage
    if stage > 0:
        seen.add((L // 2, L // 2))  # window center (best so far)
    # 1. evaluate random points (6 in the first stage, 3 after that)
    init = 6 if stage == 0 else 4
    while len(seen) < init:
        k = tuple(int(v) for v in rng.integers(0, L, 2))
        if k not in seen:
            evaluate(k)

    stall = 0
    for _ in range(ITERS):
        # 2. fit the surrogate model to the evaluated points in the window
        H = np.array(history)
        u = (H[:, :2] - lo) / (step * (L - 1))
        inside = np.all((u >= 0) & (u <= 1), axis=1)
        A = np.array([[a**i * b**j for i, j in POWERS] for a, b in u[inside]])
        w = np.linalg.solve(A.T @ A + 1e-6 * np.eye(len(POWERS)),
                            A.T @ H[inside, 2])

        # 3. write the surrogate model in QUBO++ and find (na, nb) minimizing it
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

        # if already evaluated, take the unevaluated point with the lowest
        # prediction among the 8 points around it
        if k in seen:
            around = [(k[0] + a, k[1] + b) for a in (-1, 0, 1) for b in (-1, 0, 1)]
            around = [m for m in around
                      if 0 <= m[0] < L and 0 <= m[1] < L and m not in seen]
            if not around:
                break
            k = min(around, key=lambda m: f({na: m[0], nb: m[1]}))

        # 4. evaluate the energy and add it to the data
        if evaluate(k):
            stall = 0
        else:
            stall += 1
            if stall >= PATIENCE:
                break

    # zoom: halve the window around the best point
    best = min(history, key=lambda h: h[2])
    step /= 2
    lo = np.array(best[:2]) - step * (L // 2)

print(f"best: E = {best[2]:.8f} Ha after {len(history)} evaluations "
      f"(theta_a = {best[0]:.4f}, theta_b = {best[1]:.4f})")
print(f"RHF (theta_a = theta_b = 0): E = {blackbox(0, 0):.8f} Ha")
```

- `POWERS` lists the exponents $(i, j)$ of the monomials $u_\alpha^i u_\beta^j$ of the surrogate model; there are 15 of them.
  `A` is the matrix of the monomial values at the evaluated points inside the window.
- Step 3 builds the expression `f` by multiplying monomials, as in `term = term * ua`.
  `f` is a degree-4 polynomial in $n_\alpha, n_\beta$ with 15 terms, including the constant.
- The predictions at the 8 surrounding points are obtained by substituting values into the expression `f` (`f({na: m[0], nb: m[1]})`, see [evaluation](EVAL)).
- `history` holds the angles and energies of all evaluated points, and `seen` holds the grid points evaluated in the current stage.
  `evaluate` returns `True` when the best value improves.
  Two symmetric points have exactly the same energy in theory, so a difference below $10^{-12}$ is treated as rounding error and not counted as an improvement.
- The program runs in about 15 seconds.

### Output

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

The 58th evaluation reaches $E = -0.93721235$ Ha (62 evaluations in total).
The difference from the minimum over continuous angles, $-0.93721282$ Ha, is 0.0005 mHa and comes from the grid spacing of the last stage.
The solution has $\theta_\alpha = -\theta_\beta$: it is the spin-symmetry-broken solution.
Depending on the random seed, the solution with $\alpha$ and $\beta$ exchanged ($\theta_\alpha < 0$) is found.

With the integrals at the equilibrium bond length 0.74 Å instead, the same program does not break the symmetry and converges to the solution $\theta_\alpha = \theta_\beta = 0$ ($E = -1.11676$ Ha).

### Comparison with random search and hill climbing

We ran the program above 20 times with different random seeds and compared the best value at each number of evaluations with two other methods:

- **Random search**: repeatedly evaluates $(\theta_\alpha, \theta_\beta)$ drawn uniformly from $-\pi/2$ to $\pi/2$.
- **Hill climbing**: starts from a random point, evaluates the 8 points around it at the current step size, and moves to the best one.
  If none of them is better, it halves the step size.
  The initial step size is $\pi/8$, the best of $\pi/2$ to $\pi/32$.

Each cell shows the mean difference from the minimum $-0.93721282$ Ha and the fraction of runs within 0.01 mHa of it.
FMQA stops after 51 to 62 evaluations; when it stops before 60, the value at the stop is used.

| Method | 20 evals | 40 evals | 60 evals |
|---|---:|---:|---:|
| FMQA | 0.42 mHa / 0% | 0.0020 mHa / 95% | **0.0005 mHa / 100%** |
| Random search | 26.5 mHa / 0% | 16.2 mHa / 0% | 10.1 mHa / 0% |
| Hill climbing | 23.4 mHa / 0% | 2.86 mHa / 0% | 0.47 mHa / 0% |

FMQA learns the shape of the energy from all evaluated points, so it approaches the minimum with fewer evaluations than hill climbing, which examines the surrounding points one by one.

## The role of QUBO++

The examples on this page have one or two variables, so minimizing the surrogate model is itself easy: it could be done by checking all 65 or $65^2 = 4225$ values.
Also, the symmetry-broken solution of H₂ is quickly obtained by an SCF calculation started from a state with broken symmetry.
The purpose of this page is to show how to run FMQA with integer variables, treating the energy of a quantum chemistry calculation as a black-box function.

For larger molecules, the number of angles $k$ grows and the number of grid points grows as $65^k$, so minimizing the surrogate model becomes a job for the QUBO++ solver.
The number of polynomial coefficients also grows, so a model with fewer coefficients, such as the FM in [FMQA](FMQA), would be used.
