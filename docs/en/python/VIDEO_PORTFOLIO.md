---
last_modified: 2026-11-07
layout: default
nav_exclude: true
title: "Video: Portfolio Optimization"
description: "The chapters of the video \"QUBO++ Case Study: Portfolio Optimization (Python)\", with the programs and outputs shown in it."
lang: en
hreflang_alt: "ja/python/VIDEO_PORTFOLIO"
hreflang_lang: "ja"
video: portfolio
---

# Video: Portfolio Optimization (Python)

A guide to the video "QUBO++ Case Study: Portfolio Optimization (Python)".
For each chapter it gives the main points, the programs and outputs shown in the video, and links to the pages with the details.
Click "▶ Play the video from …" to play from that scene.

{% include video_embed.html slug="portfolio" %}

What the video covers:

- Expected return, risk (standard deviation), and the risk premium, starting from a comparison of a time deposit and a stock
- The correlation coefficient and why combining stocks lowers the risk (it falls without correlation, and not at all with a correlation of 1)
- The formulas of the expected return $R$ and the squared risk $V$ (the variance), and the mean-variance model that minimizes $V - \lambda R$
- Writing the numbers of lots of 100 shares as integer variables and the budget range with `qbpp.cons()`, solved with the real-coefficient module `pyqbpp.d`
- Limiting the number of stocks to at most 4

The written explanation is on the [Portfolio Optimization](PORTFOLIO) page. Back to the [Videos (case studies)](../VIDEO_CASE_STUDIES) list

The stocks and data in this video are fictional and not for investment decisions.

## Deposit and Stock

{% include video_seek.html t="0:42" %}

- Suppose you keep 10 million yen for one year. A time deposit with interest of, for example, 2% gives 10.2 million yen after one year, almost certainly.
- Stock X is expected to gain 10% a year on average, with price gains and dividends. The expected average gain is the **expected value**, and the size of the yearly swings is the **standard deviation**, here 30%.
- If the gains spread in a bell shape (a normal distribution), about two thirds of the years fall between −20% and +40%, and 95% between −50% and +70%. You lose money in about 37% of the years, nearly 4 years out of 10.
- Unlike lotteries and betting, the expected value is positive. The 8% gap between the 10% and the deposit's 2% is the **risk premium**: in return for taking the swings, you get a higher expected value than a deposit.
- From here on, the standard deviation is called **risk**, and the expected value **expected return**.

## Two Uncorrelated Stocks

{% include video_seek.html t="2:25" %}

- Stock Y also has an expected return of 10% and a risk of 30%. How two stocks move together is measured by the **correlation coefficient** $\rho$: 1 if they always move together, 0 if they move independently, and negative if they tend to move oppositely.
- Buying 5 million yen each of X and Y with $\rho = 0$ keeps the expected return at 10% but lowers the risk from 30% to 21.2%: even if one falls sharply, the other does not necessarily fall too.
- The square of the risk is the **variance**. With the shares of money $w_1, w_2$ and the risks $\sigma_1, \sigma_2$ of X and Y, for $\rho = 0$ the squared total risk is the sum of the squares of the two swings $w_1\sigma_1$ and $w_2\sigma_2$.

$$
\sigma^2 = (w_1\sigma_1)^2 + (w_2\sigma_2)^2
$$

- With half of each, $w_1\sigma_1 = w_2\sigma_2 = 15\%$, so $\sigma^2 = 15^2 + 15^2 = 450$ and $\sigma = \sqrt{450} = 21.2\%$.
- Drawn as two arrows of length 15, the two swings meet at a right angle for $\rho = 0$, and the combined arrow is 21.2 long. 15 plus 15 does not make 30.

## Correlation and Risk

{% include video_seek.html t="4:25" %}

- Real stocks trade in the same market, so the correlation coefficient is usually positive. When $\rho$ is not 0, the squared risk gets one more term, larger as the stocks move together more.

$$
\sigma^2 = (w_1\sigma_1)^2 + (w_2\sigma_2)^2 + 2\rho \times w_1\sigma_1 \times w_2\sigma_2
$$

- The risk of buying half of each is as follows. In the arrow figure, the angle between the two arrows gets smaller as $\rho$ grows.

| $\rho$ | 0 | 0.1 | 0.2 | 0.3 | 0.6 | 0.9 | 1 |
|:---:|---:|---:|---:|---:|---:|---:|---:|
| Risk | 21.2% | 22.2% | 23.2% | 24.2% | 26.8% | 29.2% | 30% |

- At $\rho = 1$ the arrows line up, and the risk is 30%, the same as buying only one stock. With a correlation of 1, splitting the purchase is pointless; the smaller it is than 1, the more splitting lowers the risk.
- A combination of stocks is a **portfolio**, and splitting purchases is **diversification**.
- Buying equal amounts of stocks whose pairs all have $\rho = 0.2$, the risk is 30% with 1 stock, 23.2% with 2, 18.0% with 5, and 15.9% with 10, but it never goes below 13.4% however many are added. What remains is the whole market moving up and down together, and the risk premium pays for this swing.

## Mean-Variance Model

{% include video_seek.html t="6:17" %}

- Let $w_i$ be the share of money used for stock $i$, $\mu_i$ its expected return, $\sigma_i$ its risk, and $\rho_{ij}$ the correlation coefficient of stocks $i$ and $j$ ($\rho_{ii} = 1$).
- The expected return $R$ and the square of the whole portfolio's risk (the variance) $V$ are:

$$
R = \sum_i \mu_i w_i, \qquad V = \sum_i \sum_j \rho_{ij}\,\sigma_i \sigma_j\, w_i w_j
$$

- The terms of $V$ with $i = j$ are $(w_i\sigma_i)^2$. Pairs with $i \ne j$ appear twice, as $ij$ and $ji$, and make the terms $2\rho_{ij} \times w_i\sigma_i \times w_j\sigma_j$. With two stocks, this is the formula of the previous chapter. The risk is the square root of $V$, so a smaller $V$ means a smaller risk.
- $V$ is better when smaller and $R$ is better when larger. To combine them into one formula, we subtract $R$ times a coefficient $\lambda$ from $V$ and minimize $V - \lambda R$; the larger $\lambda$, the more weight $R$ gets. This is Markowitz's mean-variance model.

## The Problem

{% include video_seek.html t="8:07" %}

- We buy 10 fictional stocks (5 sectors × 2) with a budget of 10 million yen.

| Stock | Sector | Price (yen) | Expected return | Risk |
|:---:|:---:|---:|---:|---:|
| A | Electronics | 2,450 | 11.0% | 32% |
| B | Electronics | 6,180 | 10.0% | 28% |
| C | Autos | 1,870 | 8.0% | 26% |
| D | Autos | 3,320 | 9.0% | 30% |
| E | Banks | 1,240 | 7.0% | 24% |
| F | Banks | 4,060 | 6.5% | 22% |
| G | Food | 2,890 | 4.5% | 15% |
| H | Food | 5,510 | 5.0% | 17% |
| I | Telecom | 1,530 | 4.0% | 14% |
| J | Telecom | 3,970 | 5.5% | 18% |

- The correlation coefficient is 0.6 within a sector and 0.2 across sectors, because stocks in the same sector tend to move together.
- Shares are sold only in lots of 100 shares. At most 30% of the budget, 3 million yen, goes into any one stock.

## Lots and Budget

{% include video_seek.html t="9:02" %}

- With the number of lots $x_i$ of stock $i$ (an integer of 0 or more), the price of one lot $c_i$, and the budget $B$, the share of money is $w_i = c_i x_i / B$. For example, stock A costs 2,450 yen, so one lot is 245,000 yen.
- In terms of lots, $R$ is linear in $x_i$ and $V$ is quadratic. The values $\rho_{ij}\sigma_i\sigma_j$ in the formula of $V$ form a 10 × 10 table, and pairs in the same sector get the correlation 0.6.
- For the budget, the total must be between 9.8 and 10 million yen. Without the lower bound, buying nothing would be best when $\lambda = 0$. Money left unused has zero risk and zero expected return.
- The upper bound $u_i$ is the number of lots within 3 million yen (12 lots, 2.94 million yen, for stock A). Ignoring the budget, there are about 23.3 billion combinations of lots.

$$
\begin{aligned}
\text{minimize}\quad & V - \lambda R \\
\text{subject to}\quad & 9800 \le \sum_i c_i x_i \le 10000 \quad (\text{thousand yen}) \\
& 0 \le x_i \le u_i \quad (\text{every stock } i)
\end{aligned}
$$

See the [Portfolio Optimization](PORTFOLIO#formulation) page for details.

## Writing It in QUBO++

{% include video_seek.html t="10:20" %}

- **Real coefficients**: expected returns and risks are decimals, so the objective's coefficients are decimals too. `import pyqbpp.d as qbpp` uses the real-coefficient module; QUBO++ turns the coefficients into integers internally before solving.
- **Integer variables**: `qbpp.var("x", shape=n, integer=(0, cap))` makes the array of integer variables for the numbers of lots. Passing the upper bounds `cap` as a list gives each stock its own bound. Integer variables are searched as integers, not split into binary variables.
- **Range constraints**: the budget is written with `qbpp.cons(cost, between=(9800, budget))`. A violation adds a penalty of the weight times the violation squared, and even an inequality needs no auxiliary variables.
- A weight of 1 is enough. Amounts are whole thousands of yen, so a violation is at least 1 and so is the penalty, while the objective is below 0.1. So any solution outside the budget is worse than any inside it.

See the [real (double) coefficients](VAREXPR#real-double-coefficients), [integer variables](INTEGER), and [constraints](CONSTRAINTS) pages for details.

## Program

{% include video_seek.html t="11:37" %}

The program in the video (the same as on the written page, except that the comment in line 5 says "risk").

```python
import math

import pyqbpp.d as qbpp

# Stocks A-J: sector, price (yen), expected return, risk (annual)
sector = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4]
price = [2450, 6180, 1870, 3320, 1240, 4060, 2890, 5510, 1530, 3970]
mu = [0.11, 0.10, 0.08, 0.09, 0.07, 0.065, 0.045, 0.05, 0.04, 0.055]
sigma = [0.32, 0.28, 0.26, 0.30, 0.24, 0.22, 0.15, 0.17, 0.14, 0.18]
n = len(price)
budget = 10000  # thousand yen
lam = 0.5

# Cost of one lot (100 shares, thousand yen) and the lots within 30% of the budget
lot = [p // 10 for p in price]
cap = [3000 // c for c in lot]

x = qbpp.var("x", shape=n, integer=(0, cap))

risk = 0
ret = 0
cost = 0
for i in range(n):
    wi = lot[i] / budget
    for j in range(n):
        wj = lot[j] / budget
        rho = 1.0 if i == j else (0.6 if sector[i] == sector[j] else 0.2)
        risk += rho * sigma[i] * sigma[j] * wi * wj * x[i] * x[j]
    ret += mu[i] * wi * x[i]
    cost += lot[i] * x[i]
f = risk - lam * ret + qbpp.cons(cost, between=(9800, budget))
f.simplify()

sol = qbpp.EasySolver(f).search(time_limit=1.0)
for i in range(n):
    if sol(x[i]) > 0:
        print(f"{chr(ord('A') + i)}: {sol(x[i]):2.0f} lots ({lot[i] * sol(x[i]):4.0f} thousand yen)")
print(f"cost = {sol(cost):.0f} thousand yen, return = {100 * sol(ret):.2f}%, "
      f"risk = {100 * math.sqrt(sol(risk)):.2f}%")
```

- `lot` is the price of one lot (100 shares) in thousands of yen: the share price divided by 10. `cap` is the number of lots within 3 million yen.
- `risk`, `ret`, and `cost` are the expressions of $V$, $R$, and the total amount. `wi` and `wj` are the shares of the budget for one lot, and `rho` is the correlation coefficient (1 for the same stock, 0.6 within a sector, 0.2 otherwise); the double loop adds up the 100 terms of $V$.
- `f` is $V - \lambda R$ plus the budget constraint. It has only integer variables, so it is simplified with `simplify()`.
- `EasySolver` searches for a solution, with `time_limit` setting the search time to 1 second. `sol(x[i])` is the number of lots of stock `i` in the solution. The risk is the square root of the value of `risk`, and the expected return and risk are shown in percent.

## Result

{% include video_seek.html t="13:21" %}

```
A:  4 lots ( 980 thousand yen)
B:  2 lots (1236 thousand yen)
C:  5 lots ( 935 thousand yen)
D:  2 lots ( 664 thousand yen)
E:  7 lots ( 868 thousand yen)
F:  2 lots ( 812 thousand yen)
G:  4 lots (1156 thousand yen)
H:  2 lots (1102 thousand yen)
I:  4 lots ( 612 thousand yen)
J:  4 lots (1588 thousand yen)
cost = 9953 thousand yen, return = 6.98%, risk = 12.75%
```

- All 10 stocks are bought, a little of each; for example, stock A gets 4 lots, 980,000 yen. The total is 9,953,000 yen, within the budget range.
- The expected return is 6.98%, and the risk is 12.75%. A risk of 12.75% is lower than that of any single stock (the lowest is I, 14%): the effect of splitting the purchase is clear.

## Limiting the Number of Stocks

{% include video_seek.html t="13:59" %}

- We limit the stocks to buy to at most 4. Add binary variables $y_i$ that are 1 when stock $i$ is bought, with two constraints:

$$
x_i \le u_i\, y_i \quad (\text{every stock } i), \qquad \sum_i y_i \le 4
$$

- If $y_i = 0$, then $x_i \le 0$ and stock $i$ cannot be bought; if $y_i = 1$, then $x_i \le u_i$, the same as the original range.
- In the program, these lines follow the budget constraint. `x - qbpp.array(cap) * y` is an array of 10 expressions computed element by element; compared with 0 and wrapped in `qbpp.cons()`, it gives 10 constraints. With binary variables, the expression is simplified with `simplify_as_binary()`.

```python
# At most 4 stocks: y[i] = 1 when stock i is bought
y = qbpp.var("y", n)
f += qbpp.cons(x - qbpp.array(cap) * y <= 0)
f += qbpp.cons(qbpp.sum(y) <= 4)
f.simplify_as_binary()
```

```
B:  4 lots (2472 thousand yen)
C:  9 lots (1683 thousand yen)
G: 10 lots (2890 thousand yen)
J:  7 lots (2779 thousand yen)
cost = 9824 thousand yen, return = 6.65%, risk = 13.19%
```

- One stock each from electronics, autos, food, and telecom is selected, so that the sectors do not overlap. Limiting the stocks lowers the expected return to 6.65% and raises the risk to 13.19%.

## Summary

{% include video_seek.html t="15:21" %}

- Comparing a deposit and stocks, we explained expected return, risk, and the risk premium. Combining stocks with a correlation below 1 lowers the risk.
- The balance of expected return and risk is set by minimizing $V - \lambda R$.
- QUBO++ writes it directly with real coefficients, integer variables, and `qbpp.cons()`. Lots of 100 shares, the budget range, and a limit on the number of stocks are added as constraints.
