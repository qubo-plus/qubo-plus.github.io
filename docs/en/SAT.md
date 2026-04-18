---
layout: default
nav_exclude: true
title: "SAT"
nav_order: 44
lang: en
hreflang_alt: "ja/SAT"
hreflang_lang: "ja"
---

# Boolean Satisfiability Problem (SAT)

The **Boolean satisfiability problem (SAT)** is to determine whether there exists an assignment of truth values to Boolean variables that makes a given Boolean formula in **conjunctive normal form (CNF)** evaluate to True.
A CNF formula is a conjunction (AND) of **clauses**, where each clause is a disjunction (OR) of **literals**.
A literal is either a variable $x_i$ (positive literal) or its negation $\lnot x_i$ (negative literal).

For example, the following is a 3-SAT instance with 5 variables $x_0,x_1,x_2,x_3,x_4$ and 6 clauses:

$$
(x_0 \lor x_1 \lor x_2) \land (\lnot x_0 \lor x_3 \lor x_4) \land (x_1 \lor \lnot x_2 \lor \lnot x_3) \land (\lnot x_1 \lor \lnot x_3 \lor x_4) \land (\lnot x_0 \lor \lnot x_1 \lor \lnot x_2) \land (x_0 \lor x_1 \lor \lnot x_4)
$$

A satisfying assignment must make every clause True, i.e., at least one literal in each clause must be True.

## HUBO Formulation

We use the convention **True = 0** and **False = 1** for binary variables.
Under this convention:
- A positive literal $x_i$ is **False** when $x_i = 1$.
- A negative literal $$\lnot x_i$$ is **False** when $$x_i = 0$$, i.e., when $$\tilde{x}_i = 1$$ (where $$\tilde{x}_i$$ denotes the negated literal in QUBO++).

A clause is violated (all its literals are False) exactly when the product of the "False indicator" for each literal equals 1.
For a clause $C_k$, we define the penalty:

$$
p_k = \prod_{\ell \in C_k} f(\ell)
$$

where $f(\ell) = x_i$ if $\ell$ is the positive literal $x_i$, and $f(\ell) = \tilde{x}_i$ if $\ell$ is the negative literal $\lnot x_i$.
This product equals 1 if and only if the clause is violated.

The total constraint expression is:

$$
\text{constraint} = \sum_{k} p_k
$$

This expression achieves the minimum value 0 if and only if all clauses are satisfied.
Note that the constraint is naturally a **HUBO** (higher-order unconstrained binary optimization) expression, since each clause with $m$ literals produces a term of degree $m$.

## QUBO++ Formulation

The following QUBO++ program solves the 3-SAT instance described above:

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

int main() {
  // 5 Boolean variables
  auto x = qbpp::var("x", 5);

  // Convention: True=0, False=1
  // Positive literal x_i: False when x_i=1 -> contribute x[i]
  // Negative literal ~x_j: False when x_j=0 -> contribute ~x[j]
  // Product = 1 iff all literals in the clause are False (violated)

  // Clause 0: (x0 OR x1 OR x2)
  //   violated when x0=False AND x1=False AND x2=False
  //   penalty = x[0] * x[1] * x[2]
  auto c0 = x[0] * x[1] * x[2];

  // Clause 1: (~x0 OR x3 OR x4)
  //   violated when x0=True AND x3=False AND x4=False
  //   penalty = ~x[0] * x[3] * x[4]
  auto c1 = ~x[0] * x[3] * x[4];

  // Clause 2: (x1 OR ~x2 OR ~x3)
  //   violated when x1=False AND x2=True AND x3=True
  //   penalty = x[1] * ~x[2] * ~x[3]
  auto c2 = x[1] * ~x[2] * ~x[3];

  // Clause 3: (~x1 OR ~x3 OR x4)
  //   violated when x1=True AND x3=True AND x4=False
  //   penalty = ~x[1] * ~x[3] * x[4]
  auto c3 = ~x[1] * ~x[3] * x[4];

  // Clause 4: (~x0 OR ~x1 OR ~x2)
  //   violated when x0=True AND x1=True AND x2=True
  //   penalty = ~x[0] * ~x[1] * ~x[2]
  auto c4 = ~x[0] * ~x[1] * ~x[2];

  // Clause 5: (x0 OR x1 OR ~x4)
  //   violated when x0=False AND x1=False AND x4=True
  //   penalty = x[0] * x[1] * ~x[4]
  auto c5 = x[0] * x[1] * ~x[4];

  // Total constraint: sum of clause penalties
  auto constraint = c0 + c1 + c2 + c3 + c4 + c5;

  constraint.simplify_as_binary();
  auto solver = qbpp::EasySolver(constraint);
  auto sol = solver.search({{"target_energy", 0}});

  // Print result
  std::cout << "Energy = " << sol.energy() << std::endl;
  std::cout << "Assignment (True=0, False=1):" << std::endl;
  for (size_t i = 0; i < 5; ++i) {
    std::cout << "  x[" << i << "] = " << sol(x[i])
              << " (" << (sol(x[i]) == 0 ? "True" : "False") << ")"
              << std::endl;
  }

  // Verify each clause
  std::cout << "Clause penalties:" << std::endl;
  std::cout << "  c0 = " << sol(c0) << std::endl;
  std::cout << "  c1 = " << sol(c1) << std::endl;
  std::cout << "  c2 = " << sol(c2) << std::endl;
  std::cout << "  c3 = " << sol(c3) << std::endl;
  std::cout << "  c4 = " << sol(c4) << std::endl;
  std::cout << "  c5 = " << sol(c5) << std::endl;
  std::cout << "Violated clauses = " << sol(constraint) << std::endl;
}
```
{% endraw %}

In this program, we define 5 binary variables and construct the penalty expression for each clause.
For a positive literal $x_i$, we use `x[i]`, which equals 1 when the literal is False.
For a negative literal $\lnot x_i$, we use `~x[i]`, which equals 1 when the literal is False (i.e., when $x_i$ is True, meaning $x_i = 0$).
QUBO++ natively supports negated literals `~x[i]`, so there is no need to manually replace them with `1 - x[i]`.

The product of these terms for a clause equals 1 only when all literals in the clause are False, i.e., when the clause is violated.
The total constraint is the sum of all clause penalties, and it achieves 0 if and only if all clauses are satisfied.

We call `simplify_as_binary()` to apply the idempotent rule $x_i^2 = x_i$ and simplify the expression, then solve with EasySolver targeting energy 0.

### Output
```
Energy = 0
Assignment (True=0, False=1):
  x[0] = 0 (True)
  x[1] = 1 (False)
  x[2] = 0 (True)
  x[3] = 1 (False)
  x[4] = 0 (True)
Clause penalties:
  c0 = 0
  c1 = 0
  c2 = 0
  c3 = 0
  c4 = 0
  c5 = 0
Violated clauses = 0
```

The solver finds a satisfying assignment with energy 0, meaning all clauses are satisfied.
Note that the actual assignment may vary across runs, as the solver is stochastic.
