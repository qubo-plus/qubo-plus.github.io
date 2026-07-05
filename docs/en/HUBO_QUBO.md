---
layout: default
title: "HUBO and QUBO"
nav_order: 2
lang: en
hreflang_alt: "ja/HUBO_QUBO"
hreflang_lang: "ja"
mode_shared: true
---

# HUBO and QUBO
A **High-Order Unconstrained Binary Optimization (HUBO)** problem is defined by a polynomial over binary variables.
The goal is to find an assignment of binary values ${0,1}$ to all variables that minimizes the value of the polynomial.

The following polynomial is an example of a HUBO instance:

$$
\begin{aligned}
f(a,b,c,d) &=1 -2a +45c +8d +4ab -13ac +2ad -10bc -12bd +2abc +5acd
\end{aligned}
$$

This polynomial attains its minimum value of $-3$ when $(a,b,c,d) = (0,1,0,1)$.
Finding such an assignment constitutes the HUBO problem for this polynomial.

A **Quadratic Unconstrained Binary Optimization (QUBO)** problem is a special case of HUBO in which the polynomial is restricted to degree at most two.

Usually, optimization problems consist of an objective function and a set of constraints, both expressed as functions of variables.
They aim to find an assignment of variable values that minimizes (or maximizes) the objective function while satisfying all constraints.

In contrast, HUBO and QUBO problems consist only of an objective function and have no explicit constraints.
This simple problem structure enables solvers to efficiently explore solutions by leveraging highly accelerated SIMD-style parallelism.
Furthermore, because constraints can be encoded into the objective function using penalty terms, many constrained optimization problems can be reformulated as equivalent HUBO or QUBO problems.

## HUBO with negated literals (nHUBO)
A **HUBO with negated literals (nHUBO)** is a HUBO whose terms may also contain negated literals.
For example, it can have a term such as

$$
\overline{a}b\overline{c}\overline{d}
$$

In conventional HUBO, it must be converted to terms with no negated literals using the relation $\overline{x}=1-x$ for every variable $x$:

$$
\begin{aligned}
\overline{a}b\overline{c}\overline{d} &= (1-a)b(1-c)(1-d) \\
&=b -ab -bc -bd +abc +abd +bcd -abcd
\end{aligned}
$$

This expansion increases the number of terms significantly.
In general, if a term contains $n$ negated literals,
the expansion produces $2^n$ terms (including a constant term when the term consists of negated literals only).

QUBO++ can create nHUBO models, and all three solvers bundled with QUBO++ handle them natively, without converting them into ordinary HUBO models.
This significantly reduces the expression evaluation cost and can enhance search performance.

## Reducing a HUBO to an equivalent QUBO

Some external solvers (for example, certain physical annealers and QUBO-only
backends) accept only quadratic models. QUBO++ provides `reduce()` to convert a
HUBO expression into an **equivalent QUBO** by rewriting every term of degree
greater than two into degree-at-most-two terms, introducing fresh auxiliary
binary variables.

In C++ the free function `qbpp::reduce(f)` returns a new expression, and
`f.reduce()` reduces `f` in place. In Python, `qbpp.reduce(f)` returns a new
expression and `f.reduce()` reduces it in place.

The reduction preserves the optimal value: for every assignment of the original
variables, the minimum of the reduced QUBO over the auxiliary variables equals
the value of the original HUBO. Consequently a minimizer of the QUBO, restricted
to the original variables, is a minimizer of the HUBO. HUBO expressions with
negated literals are handled automatically; the reduced QUBO uses positive
literals only.

For example, the cubic term $abc$ is reduced to a quadratic expression over
$a$, $b$, $c$ and one or more auxiliary variables that, when minimized over the
auxiliaries, reproduces $abc$ for every assignment of $a$, $b$, $c$.