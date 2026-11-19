---
last_modified: 2026-11-17
layout: default
nav_exclude: true
title: "SEND+MORE=MONEY"
nav_order: 82
lang: en
hreflang_alt: "ja/python/SEND_MORE_MONEY"
hreflang_lang: "ja"
---

# Math Puzzle: SEND MORE MONEY

**SEND + MORE = MONEY** is a well-known cryptarithm. Assign a decimal digit to each letter so that the following sum holds.
$$
\text{SEND}+\text{MORE}=\text{MONEY}
$$

There are three rules:
- The same letter stands for the same digit.
- Different letters stand for different digits.
- The first letter of each word (`S` and `M`) is not 0.

Eight letters are used, S, E, N, D, M, O, R, Y, and there are ten digits, 0 to 9.

{% include video_embed.html slug="send-more-money" %}

The video writes the assignment of digits to letters as a table of 0s and 1s, solves the puzzle with distinct and the constraint of the equation, and finally solves other cryptarithms too. The program in the video, chapter by chapter, is on the page [Video: Cryptarithm SEND+MORE=MONEY](VIDEO_SEND_MORE_MONEY).

## Formulation

### Variables: an 8×10 table
We number the letters as follows:

| number | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| letter | S | E | N | D | M | O | R | Y |

Let $I(\alpha)$ be the number of letter $\alpha$ ($\in \lbrace S,E,N,D,M,O,R,Y\rbrace$).
We write the assignment of digits to letters as an $8\times 10$ table of binary variables $X=(x_{i,k})$ $(0\leq i\leq 7, 0\leq k\leq 9)$, with the letters in the rows and the digits in the columns.
We set $x_{I(\alpha),k}=1$ if and only if letter $\alpha$ gets digit $k$.

### The conditions on the rows and columns: distinct
For the table to be a valid assignment, two conditions are needed:
- Each letter gets exactly one digit: each row has exactly one 1.
- Different letters get different digits: each column has at most one 1.

With 10 columns and 8 rows, two digits are left unused.
These two conditions are written as one [structural constraint](STRUCTURAL), `qbpp.distinct(x)`.
`qbpp.distinct(x)` has no weight, and a solution returned by a solver always satisfies it. It does not affect the energy.

### The digits of letters and the values of words
Only the position of the digit of letter $\alpha$ is 1 in its row. So the digit of letter $\alpha$ is the following expression:
$$
\text{digit}(\alpha) = \sum_{k=0}^{9} k\,x_{I(\alpha),k}
$$

The value of each word is the digits of its letters added with place weights:
$$
\begin{aligned}
\text{SEND}  &= 1000\,\text{digit}(S)+100\,\text{digit}(E)+10\,\text{digit}(N)+\text{digit}(D)\\
\text{MORE}  &= 1000\,\text{digit}(M)+100\,\text{digit}(O)+10\,\text{digit}(R)+\text{digit}(E)\\
\text{MONEY} &= 10000\,\text{digit}(M)+1000\,\text{digit}(O)+100\,\text{digit}(N)+10\,\text{digit}(E)+\text{digit}(Y)
\end{aligned}
$$
Each of them is a linear expression of the variables $x_{i,k}$.

### The equation of the sum
The sum holds when $\text{SEND}+\text{MORE}-\text{MONEY}=0$.
We make this equation a constraint with [`qbpp.cons()`](CONSTRAINTS). Breaking an equality constraint adds the square of the value of its left side to the energy.

Collected letter by letter, the left side is:
$$
\text{SEND}+\text{MORE}-\text{MONEY} = 1000\,\text{digit}(S)+91\,\text{digit}(E)-90\,\text{digit}(N)+\text{digit}(D)-9000\,\text{digit}(M)-900\,\text{digit}(O)+10\,\text{digit}(R)-\text{digit}(Y)
$$
For example, E is in the hundreds of SEND, the ones of MORE and the tens of MONEY, so its coefficient is $100+1-10=91$.
In terms of the variables, the coefficient of $x_{I(\alpha),k}$ is the coefficient of letter $\alpha$ times $k$ ($0, 91, 182, \ldots, 819$ in the row of E).

### The whole expression
We add the two parts to make the expression $f$:
$$
f = \text{distinct}(X) + \Bigl(\text{SEND}+\text{MORE}-\text{MONEY}=0\Bigr)
$$
distinct keeps the table valid, and the energy is just the square of the left side of the sum.
So a solution with energy 0 is the answer to the cryptarithm.

### No leading zeros
The expression so far does not say that the first letters are not 0.
Without that condition, there are 25 answers, and 24 of them have M equal to 0 (for example, 2817 + 0368 = 03185).

To keep 0 away from S and M, we replace the two cells $x_{I(S),0}$ and $x_{I(M),0}$ of the table by 0 with [`qbpp.replace()`](REPLACE):
$$
x_{I(S),0} = x_{I(M),0} = 0
$$
Replacing a variable of distinct by 0 removes that choice.

## PyQBPP Program for SEND+MORE=MONEY
The following PyQBPP program implements the formulation above and finds a solution with EasySolver:
```python
import pyqbpp as qbpp

LETTERS = "SENDMORY"

def I(c):
    return LETTERS.index(c)

x = qbpp.var("x", shape=(len(LETTERS), 10))
K = qbpp.array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])

def digit(c):
    return qbpp.sum(x[I(c)] * K)

send = 1000 * digit('S') + 100 * digit('E') + 10 * digit('N') + digit('D')
more = 1000 * digit('M') + 100 * digit('O') + 10 * digit('R') + digit('E')
money = (10000 * digit('M') + 1000 * digit('O') + 100 * digit('N')
         + 10 * digit('E') + digit('Y'))

f = qbpp.distinct(x) + qbpp.cons(send + more - money == 0)
f.simplify_as_binary()

ml = {x[I('S')][0]: 0, x[I('M')][0]: 0}
g = qbpp.replace(f, ml)
g.simplify_as_binary()

sol = qbpp.EasySolver(g).search(target_energy=0)
print(f"energy = {sol.energy}")
full_sol = qbpp.Sol(f).set(sol, ml)

val = qbpp.onehot_to_int(full_sol(x))

def word(w):
    return "".join(str(val[I(c)]) for c in w)

print(word("SEND"), "+", word("MORE"), "=", word("MONEY"))
```
In this program, `LETTERS` holds a string of the 8 letters, and the function `I()` returns the number of a letter. For example, `I('S')` returns 0, and `I('E')` returns 1.
`x` is the 8 by 10 array of binary variables, and `K` is the array of the digits 0 to 9.
The function `digit()` returns the sum of the element-wise product of a letter's row and `K`, that is, an expression for the digit of the letter, and `send`, `more` and `money` are expressions for the values of the words.
`f` is the sum of `qbpp.distinct(x)` and the constraint of the equation.

The dictionary `ml` says to replace `x[I('S')][0]` and `x[I('M')][0]` by 0, and `qbpp.replace(f, ml)` returns `g`, the new expression after the replacement.
We make an EasySolver from `g` and specify `target_energy=0`, so that it stops when it finds a solution with energy 0.
The solution `sol` is turned back into `full_sol`, a solution of the original expression `f`, with `qbpp.Sol(f).set(sol, ml)`.

Finally, `qbpp.onehot_to_int(full_sol(x))` returns the position of the 1 in each row, that is, the digit of each letter, and the function `word()` returns a word with its letters replaced by their digits.

This program produces the following output:
```
energy = 0
9567 + 1085 = 10652
```
The energy is 0, so the sum holds. This is the only answer in which S and M are not 0.

## Other Cryptarithms
Made into a function, the program solves other cryptarithms too.
The function `solve()` takes a cryptarithm as a string, and makes `LETTERS` from the letters in the order they appear:
```python
import pyqbpp as qbpp


def solve(puzzle):
    left, right = puzzle.split("=")
    words = left.split("+") + [right]

    LETTERS = ""
    for c in puzzle:
        if c.isalpha() and c not in LETTERS:
            LETTERS += c

    def I(c):
        return LETTERS.index(c)

    x = qbpp.var("x", shape=(len(LETTERS), 10))
    K = qbpp.array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])

    def digit(c):
        return qbpp.sum(x[I(c)] * K)

    def value(w):
        v = 0
        for c in w:
            v = 10 * v + digit(c)
        return v

    lhs = 0
    for w in words[:-1]:
        lhs += value(w)

    f = qbpp.distinct(x) + qbpp.cons(lhs - value(right) == 0)
    f.simplify_as_binary()

    ml = {x[I(w[0])][0]: 0 for w in words}
    g = qbpp.replace(f, ml)
    g.simplify_as_binary()

    sol = qbpp.EasySolver(g).search(target_energy=0)
    full_sol = qbpp.Sol(f).set(sol, ml)
    val = qbpp.onehot_to_int(full_sol(x))

    def word(w):
        return "".join(str(val[I(c)]) for c in w)

    print(" + ".join(word(w) for w in words[:-1]), "=", word(right))


solve("DONALD+GERALD=ROBERT")
solve("TWO+TWO=FOUR")
```
The function `value()` makes the value of a word from the left: it multiplies the value so far by 10 and adds the digit of the next letter.
The equation is the constraint that the sum of the values of the words on the left minus the value on the right is 0.
The column 0 variable of the first letter of each word is replaced by 0.

Here is an example of the output of this program:
```
526485 + 197485 = 723970
928 + 928 = 1856
```
DONALD + GERALD = ROBERT has 10 letters, so the table is 10×10. With as many rows as columns, every digit goes to exactly one letter.
TWO + TWO = FOUR has 7 answers, so the second line may show a different answer each time the program runs.
