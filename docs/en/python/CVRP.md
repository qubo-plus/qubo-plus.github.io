---
layout: default
nav_exclude: true
title: "CVRP"
nav_order: 61
lang: en
hreflang_alt: "ja/python/CVRP"
hreflang_lang: "ja"
---

# Capacitated Vehicle Routing Problem (CVRP)
The **Capacitated Vehicle Routing Problem (CVRP)** aims to find a set of routes for $V$ **vehicles** that start and end at a single **depot** and collectively serve all **customers**.
We index the **locations** by $i \in \lbrace 0,1,\ldots,N-1\rbrace$, where location 0 denotes the depot and locations $1,\ldots,N-1$ are customers.
Each customer $i\in \lbrace 1,\ldots,N-1\rbrace$ has a demand $d_i$ to be delivered (and we set $d_0=0$ for the depot).
Each vehicle $v \in \lbrace 0,\ldots,V-1\rbrace$ departs from the depot, visits a subset of customers, and returns to the depot, subject to the capacity constraint that the total delivered demand on its route does not exceed the vehicle capacity $q_v$.
The objective is to minimize the total travel cost over all vehicles.

We assume that locations are points in the two-dimensional plane and that the travel cost between two locations is the Euclidean distance.
Let $c_{i,j}$ denote the distance (cost) between locations $i$ and $j$.

## QUBO++ formulation: array of binary variables
We use a $V\times N\times N$ array $A=(a_{v,t,i})$ ($0\leq v\leq V, 0\leq t,i\leq N-1$) of binary variables to formulate the CVRP as a QUBO expression,
where $a_{v,t,i}$ is 1 if and only if the $t$-th visited location of vehicle $v$ is location $i$.

Below is an example assignment of $A=(a_{v,t,i})$ with $V=3$ and $N=10$ representing
a solution of the CVRP.
Each vehicle starts from the depot (location 0), visits some customers, and then returns to the depot.
After a vehicle returns to the depot, it stays at the depot for the remaining time steps.
Each customer $1, \ldots, 9$ is visited exactly once by exactly one vehicle, so this array represents a feasible CVRP solution.

### Vehicle $v=0$
Representing tour: $0\rightarrow 4\rightarrow 0$

| t \ i | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | onehot value |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 4 |
| 2 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 3 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 4 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 5 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 6 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 7 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 8 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 9 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |


### Vehicle $v=1$
Representing tour: $0\rightarrow 6\rightarrow 5\rightarrow 8\rightarrow  0$

| t \ i | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | onehot value |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 6 |
| 2 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 5 |
| 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 8 |
| 4 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 5 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 6 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 7 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 8 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 9 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

### Vehicle $v=2$

Representing tour: $0\rightarrow 7\rightarrow 9\rightarrow 1\rightarrow  3\rightarrow  2\rightarrow  0$

| t \ i | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | onehot value |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 7 |
| 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 9 |
| 3 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| 4 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 3 |
| 5 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 |
| 6 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 7 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 8 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 9 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |


## Constraints for QUB++ formulation

### Row constraint (one-hot at each time)
Each vehicle must be at exactly one location at each time $t$.
We impose the one-hot constraint:

$$
\begin{aligned}
\text{row}\_\text{constraint} & = \sum_{v=0}^{V-1}\sum_{t=0}^{N-1}\bigr(\sum_{i=0}^{N-1} a_{v,t,i} = 1\bigl)\\
 &= \sum_{v=0}^{V-1}\sum_{t=0}^{N-1}\bigr(1-\sum_{i=0}^{N-1} a_{v,t,i}\bigl)^2
\end{aligned}
$$

**row\_constraint** attains its minimum value $0$
if and only if every row is one-hot.

We also fix the first position to be the depot:

$$
\begin{aligned}
a_{v,0,0}& = 1 && (0\leq v\leq V-1) \\
a_{v,0,i}& = 0 && (0\leq v\leq V-1, 1\leq i\leq N-1)
\end{aligned}
$$

These can be enforced by fixing variables.

### Consecutive-depot constraint (no "leaving the depot again")
We disallow patterns where a vehicle returns to the depot and later visits customers again.
Using the depot-indicator variable $a_{v,t,0}$, we require that the sequence

$$
a_{v,1,0}, a_{v,2,0}, \ldots, a_{v,N-1,0}
$$

consists of consecutive 0's followed by consecutive 1's (i.e., once it becomes 1, it stays 1).
This is enforced by penalizing the forbidden transition $1\rightarrow 0$:

$$
\begin{aligned}
\text{consecutive}\_\text{constraint} &= \sum_{v=0}^{V-1}\sum_{t=1}^{N-2} (1-a_{v,t})a_{v,t+1}
\end{aligned}
$$

**consecutive\_constraint** attains 0 if and only if the depot indicators are monotone nondecreasing in
$t$ ($1\leq t\leq N-1$).

This constraint is redundant if the distance metric satisfies the triangle inequality (such "leave again" solutions cannot be optimal), but it often helps solvers avoid such non-optimal structures.

### Column constraint
Each customer must be visited exactly once by exactly one vehicle at exactly one time:

$$
\begin{aligned}
\text{column}\_\text{constraint}
& = \sum_{i=1}^{N-1}\bigr(\sum_{v=0}^{V-1}\sum_{t=0}^{N-1} a_{v,t,i} = 1\bigl)\\
 &= \sum_{i=1}^{N-1}\bigr(1-\sum_{v=0}^{V-1}\sum_{t=0}^{N-1} a_{v,t,i}\bigl)^2
\end{aligned}
$$

**column\_constraint** is 0 if and only if every customer $i = 1, \dots ,N−1$ is visited exactly once.

### Capacity constraint
For each vehicle $v$, the total delivered demand is

$$
\sum_{t=1}^{N-1}\sum_{i=1}^{N-1}d_ia_{v,t,i},
$$

which must be at most $q_v$.
Then the following constraint must be 0:

$$
\begin{aligned}
\text{capacity}\_\text{constraint} &= \sum_{v=0}^{V-1}\Bigr(0\leq \sum_{t=1}^{N-1}\sum_{i=1}^{N-1}d_ia_{v,t,i}\leq q_v\Bigl)
\end{aligned}
$$

**capacity\_constraint** is 0 if and only if all vehicles do not exceed their capacity.


## Objective for QUBO formulation

The total tour cost is computed from consecutive visited locations:

$$
\begin{aligned}
\text{objective} &= \sum_{v=0}^{V-1}\sum_{t=0}^{N-1}\sum_{i=0}^{N-1}\sum_{j=0}^{N-1}c_{i,j}a_{v,t,i}a_{v,(t+1)\bmod N, j}
\end{aligned}
$$

If vehicle $v$ visits location $i$ at time step $t$ and then moves to location $j$ at time step $(t+1)\bmod N$, we have $a_{v,t,i}=a_{v,(t+1)\bmod N, j}=1$.
In this case, the corresponding term contributes $c_{i,j}$ to the sum. Therefore, when all constraints are satisfied (so that each $(v,t)$ has exactly one active location),
$\text{objective}$ equals the total travel cost of all vehicles.

Under the Euclidean metric, we have $c_{i,i}=0$ for all $i$, so staying at the same location does not add extra cost.

## QUBO formulation for the CVRP

Combining the objective and constraints, we obtain the QUBO:

$$
\begin{aligned}
f &= \text{objective} + P\cdot (\text{row}\_\text{constraint}+\text{consecutive}\_\text{constraint}+\text{column}\_\text{constraint}+\text{capacity}\_\text{constraint}),
\end{aligned}
$$

where $P$ is a sufficiently large constant so that feasibility (constraints) is prioritized over cost minimization.

## PyQBPP program
The following PyQBPP program finds a solution to the CVRP instance with $N=10$ locations and $V=3$ vehicles.
The list `locations` stores triples `(x,y,d)`, where  `(x,y)` is the 2D coordinate of the location and  `d` is the customer demand (with demand 0 for the depot).
The list `vehicle_capacity` stores the capacities of the $V=3$ vehicles.
In this example, it is set to `[100, 200, 300]`, so vehicles 0, 1, and 2 have small, medium, and large capacities, respectively.

```python
import math
import pyqbpp as qbpp

locations = [
    (200, 200, 0),  (247, 296, 44), (31, 393, 57), (96, 398, 94),
    (391, 230, 91), (118, 95, 66),  (197, 99, 59), (224, 8, 10),
    (3, 10, 52),    (281, 379, 83)]
vehicle_capacity = [100, 200, 300]

N = len(locations)
V = len(vehicle_capacity)

a = qbpp.var("a", shape=(V, N, N))

row_constraint = qbpp.sum(qbpp.constrain(qbpp.vector_sum(a), equal=1))

column_sum = [0 for _ in range(N - 1)]
for v in range(V):
    for t in range(N):
        for i in range(1, N):
            column_sum[i - 1] += a[v][t][i]
column_constraint = 0
for i in range(N - 1):
    column_constraint += qbpp.constrain(column_sum[i], equal=1)

consecutive_constraint = 0
for v in range(V):
    for t in range(1, N - 1):
        consecutive_constraint += a[v][t][0] * (1 - a[v][t + 1][0])

vehicle_load = [0 for _ in range(V)]
capacity_constraint = 0
for v in range(V):
    for t in range(N):
        for i in range(1, N):
            vehicle_load[v] += a[v][t][i] * locations[i][2]
    capacity_constraint += qbpp.constrain(vehicle_load[v], between=(0, vehicle_capacity[v]))

objective = 0
for v in range(V):
    for t in range(N):
        next_t = (t + 1) % N
        for i in range(N):
            x1, y1 = locations[i][0], locations[i][1]
            for j in range(N):
                x2, y2 = locations[j][0], locations[j][1]
                dist = int(math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2))
                objective += dist * a[v][t][i] * a[v][next_t][j]

f = objective + 10000 * (row_constraint + column_constraint +
                          consecutive_constraint + capacity_constraint)

ml = {a[v][0][0]: 1 for v in range(V)}
ml.update({a[v][0][i]: 0 for v in range(V) for i in range(1, N)})

g = qbpp.replace(f, ml)
f.simplify_as_binary()
g.simplify_as_binary()
solver = qbpp.EasySolver(g)

sol = solver.search()

full_sol = qbpp.Sol(f).set(sol, ml)

print(f"row_constraint = {full_sol(row_constraint)}")
print(f"column_constraint = {full_sol(column_constraint)}")
print(f"consecutive_constraint = {full_sol(consecutive_constraint)}")
print(f"capacity_constraint = {full_sol(capacity_constraint)}")
print(f"objective = {full_sol(objective)}")

for v in range(V):
    load = full_sol(vehicle_load[v])
    route = f"Vehicle {v} : load = {load} / {vehicle_capacity[v]} : 0 "
    for t in range(1, N):
        for i in range(1, N):
            if full_sol(a[v][t][i]) == 1:
                route += f"-> {i}({locations[i][2]}) "
                break
    route += "-> 0"
    print(route)
```
This program defines a $V\times N\times N$ array `a` of binary variables.
It then defines the objective term `objective` and the constraint terms
`row_constraint`, `column_constraint`. `consecutive_constraint` and `capacity_constraint`
according to the formulation described above, and combines them into the penalized objective
`f = objective + 10000 * ( row_constraint + column_constraint + consecutive_constraint + capacity_constraint )`.

To fix the first visited location ($t=0$)
of every vehicle to the depot (location 0), the program constructs a dict `ml` and applies it to `f` using `qbpp.replace()`.
The resulting expression is stored in `g`.
The Easy Solver is then used to search for an assignment `sol` that minimizes `g`.

Since `g` does not contain the variables fixed by `ml`, the program merges `sol` and `ml` into `full_sol`, which assigns values to all variables in `a`.
Using `full_sol`, it prints the values of each `constraint` term and the `objective` value, and also prints the resulting tours of the $V=3$ vehicles.

For example, the program prints the following results:
```
row_constraint = 0
column_constraint = 0
consecutive_constraint = 0
capacity_constraint = 0
objective = 2142
Vehicle 0 : load = 91 / 100 : 0 -> 4(91) -> 0
Vehicle 1 : load = 177 / 200 : 0 -> 6(59) -> 5(66) -> 8(52) -> 0
Vehicle 2 : load = 288 / 300 : 0 -> 7(10) -> 9(83) -> 1(44) -> 3(94) -> 2(57) -> 0
```

## Visualization using matplotlib
The following code visualizes the CVRP solution:
```python
import matplotlib.pyplot as plt

vehicle_colors = ["#e74c3c", "#3498db", "#2ecc71"]
plt.figure(figsize=(6, 6))
for i, (lx, ly, q) in enumerate(locations):
    plt.plot(lx, ly, "ko", markersize=8)
    plt.annotate(f"{i}" + (f"({q})" if q > 0 else ""),
                 (lx, ly), textcoords="offset points", xytext=(5, 5))

for v in range(V):
    route_nodes = [0]
    for t in range(1, N):
        for i in range(1, N):
            if full_sol(a[v][t][i]) == 1:
                route_nodes.append(i)
                break
    route_nodes.append(0)
    for k in range(len(route_nodes) - 1):
        fr, to = route_nodes[k], route_nodes[k + 1]
        plt.annotate("", xy=(locations[to][0], locations[to][1]),
                     xytext=(locations[fr][0], locations[fr][1]),
                     arrowprops=dict(arrowstyle="->", color=vehicle_colors[v],
                                    lw=2))
plt.title("CVRP Solution")
plt.savefig("cvrp.png", dpi=150, bbox_inches="tight")
plt.show()
```

Each vehicle's route is shown in a different color, with arrows indicating the direction of travel.
