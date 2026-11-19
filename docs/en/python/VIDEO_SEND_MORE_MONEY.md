---
last_modified: 2026-11-17
layout: default
nav_exclude: true
title: "Video: Cryptarithm SEND+MORE=MONEY"
description: "The chapters of the video \"QUBO++ Case Study: Cryptarithm SEND+MORE=MONEY (Python)\", with the programs and outputs shown in it."
lang: en
hreflang_alt: "ja/python/VIDEO_SEND_MORE_MONEY"
hreflang_lang: "ja"
video: send-more-money
---

# Video: Cryptarithm SEND+MORE=MONEY (Python)

A guide to the video "QUBO++ Case Study: Cryptarithm SEND+MORE=MONEY (Python)".
For each chapter it gives the main points, the programs and outputs shown in the video, and links to the pages with the details.
Click "▶ Play the video from …" to play from that scene.

{% include video_embed.html slug="send-more-money" %}

What the video covers:

- Writing the assignment of digits to letters as an 8×10 table of 0s and 1s
- Writing the conditions on the rows and columns of the table as one structural constraint, `qbpp.distinct()`
- Writing the digits of letters and the values of words as expressions, and making the equation of the sum a constraint with `qbpp.cons()`
- Removing leading zeros as choices with `qbpp.replace()`
- Making the program a function that also solves DONALD+GERALD=ROBERT and TWO+TWO=FOUR

The written explanation is on the [Math Puzzle: SEND MORE MONEY](SEND_MORE_MONEY) page. Back to the [Videos (case studies)](../VIDEO_CASE_STUDIES) list

To see only the result, play the [The Result](#the-result) chapter.

## Puzzle Rules

{% include video_seek.html t="0:39" %}

- A cryptarithm is a puzzle in which you find the digits hidden by letters in a calculation. SEND+MORE=MONEY was published by Dudeney in 1924.
- There are three rules: the same letter stands for the same digit, different letters stand for different digits, and the first letter of each word (S and M) is not 0.
- Eight letters are used, S, E, N, D, M, O, R, Y, and there are ten digits, 0 to 9.

## Variables: the 8×10 Table

{% include video_seek.html t="1:14" %}

- In an 8×10 table with the 8 letters in the rows and the 10 digits in the columns, each cell holds a variable that takes 0 or 1. If $x_{i,k}=1$, letter number $i$ gets digit $k$.
- The letters are numbered in the order SENDMORY: S is 0, and Y is 7. In the program, the string `LETTERS` and the function `I()`, which returns the number of a letter, connect them. For example, `I('S')` returns 0, and `I('E')` returns 1.
- `qbpp.var("x", shape=(len(LETTERS), 10))` makes the array `x` of 8 rows and 10 columns, 80 variables in all. Representing a value with exactly one 1 in a row is called one-hot.

## distinct: Rows and Columns

{% include video_seek.html t="2:11" %}

- For the table to be a valid assignment, two conditions are needed: each row has exactly one 1 (each letter gets one digit), and each column has at most one 1 (different letters get different digits). With 10 columns and 8 rows, two digits are left unused.
- `qbpp.distinct(x)` puts these two conditions together. It says that the rows of `x` take different values.
- `distinct` is a constraint with no weight, and a solution returned by a solver always satisfies it. You just add `qbpp.distinct(x)` to the expression.

For `distinct`, see the [Structural Constraints](STRUCTURAL) page.

## Digits of Letters and Values of Words

{% include video_seek.html t="2:55" %}

- `K` is the array of the digits 0 to 9. Multiplying a letter's row and `K` element by element leaves the digit only at the position of the 1, so the sum of the products is the digit of the letter:

$$
\text{digit}(\alpha) = \sum_{k=0}^{9} k\,x_{I(\alpha),k}
$$

- The function `digit()` returns the sum of the products of a letter's row and `K`. So `digit(c)` is an expression for the digit of letter `c`.
- The value of a word is the digits of its letters multiplied by the place weights (1000, 100, 10, and 1 for SEND) and added. MONEY has 5 digits, so the weight of its first letter M is 10000. `send`, `more`, and `money` are all linear expressions of the variables.

## The Equation of the Sum

{% include video_seek.html t="3:54" %}

- The sum holds when $\text{SEND}+\text{MORE}-\text{MONEY}=0$. This equation becomes a constraint with `qbpp.cons()`. Breaking the constraint adds the square of the value of its left side to the energy.
- Collected letter by letter, E is in the hundreds of SEND, the ones of MORE, and the tens of MONEY, so its coefficient is $100+1-10=91$. The coefficient of M is $1000-10000=-9000$:

$$
1000S+91E-90N+D-9000M-900O+10R-Y
$$

- The coefficient of variable $x_{i,k}$ is the coefficient of the letter times $k$. In the row of E, column 1 has 91, column 2 has 182, and column 9 has 819.

For `qbpp.cons()`, see the [Constraints](CONSTRAINTS) page.

## The Whole Expression

{% include video_seek.html t="5:04" %}

- We add the two parts to make the expression $f$:

$$
f = \text{distinct}(x) + \text{cons}(\text{SEND}+\text{MORE}-\text{MONEY}=0)
$$

- `distinct` is a constraint that fixes the shape of a solution and adds nothing to the energy. The energy is just the square of the left side of the sum, so a solution with energy 0 is the answer to the cryptarithm.
- `simplify_as_binary()` simplifies `f`.

## No Leading Zeros

{% include video_seek.html t="5:31" %}

- The expression so far does not say that the first letters are not 0. Without that condition there are 25 answers, and 24 of them have M equal to 0 (for example, 2817 + 0368 = 03185).
- `qbpp.replace()` replaces the column 0 variables in the rows of S and M by 0. Replacing a variable of `distinct` by 0 removes that choice, leaving 78 choices.
- After solving the replaced expression `g`, `qbpp.Sol(f).set(sol, ml)` turns the solution back into a solution of the original expression `f`. With the choices removed, there is only one answer.

For `qbpp.replace()`, see the [Replace Functions](REPLACE) page.

## The Program

{% include video_seek.html t="6:26" %}

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

- `ml` is the dictionary that replaces the column 0 variables of S and M by 0. `g` is the replaced expression, which is simplified too.
- An EasySolver made from `g` finds a solution with `search()`. With `target_energy=0`, it stops when it finds a solution with energy 0.
- `qbpp.onehot_to_int()` returns the position of the 1 in each row, that is, the digit of each letter, and the function `word()` returns a word with its letters replaced by their digits.

## The Result

{% include video_seek.html t="7:32" %}

The output in the video:

```
energy = 0
9567 + 1085 = 10652
```

- The energy is 0, so the sum holds. The table has one 1 in each row, 8 in all, and at most one 1 in each column. Columns 3 and 4 are not given to any letter.
- Checking by column addition: in the ones, 7 + 5 = 12, so write 2 and carry 1; the other places hold in the same way.
- This is the only answer in which S and M are not 0. It was also confirmed by another method.

## Other Cryptarithms

{% include video_seek.html t="8:10" %}

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

The output in the video (the second line may change each time the program runs):

```
526485 + 197485 = 723970
928 + 928 = 1856
```

- The function `solve()` takes a cryptarithm as a string and makes `LETTERS` from the letters in the order they appear. The value of a word is made from the left: multiply by 10 and add the digit of the next letter.
- The equation is the constraint that the sum of the values of the words on the left minus the value on the right is 0. The column 0 variable of the first letter of each word is replaced by 0.
- DONALD+GERALD=ROBERT has 10 letters, so the table is 10×10. With as many rows as columns, every digit goes to exactly one letter. TWO+TWO=FOUR has 7 answers, so a different answer may come out each time the program runs.

## Summary

{% include video_seek.html t="9:09" %}

- The assignment of digits to letters was written as a table of 0s and 1s, and the conditions on its rows and columns with `qbpp.distinct()`.
- The sum became an equality constraint on the digits of the letters added with place weights.
- Leading zeros were removed as choices with `qbpp.replace()`.
