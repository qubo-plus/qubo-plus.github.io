---
last_modified: 2026-11-09
layout: default
nav_exclude: true
title: "Video: Most Airports Tour"
description: "The chapters of the video \"QUBO++ Case Study: Most Airports Tour (Python)\", with the programs and outputs shown in it."
lang: en
hreflang_alt: "ja/python/VIDEO_LONGEST_FLIGHT"
hreflang_lang: "ja"
video: most-airports
---

# Video: Most Airports Tour (Python)

A guide to the video "QUBO++ Case Study: Most Airports Tour (Python)".
For each chapter it gives the main points, the programs and outputs shown in the video, and links to the pages with the details.
Click "▶ Play the video from …" to play from that scene.

{% include video_embed.html slug="most-airports" %}

What the video covers:

- Representing nonstop domestic flights as a directed graph, which can express one-way flights
- A binary variable for each flight and four constraints written with `qbpp.cons()`
- An objective function, the sum of the flight values $M - d_{u,v}$, that puts more flights ahead of a shorter distance
- Iterations that remove each cycle not through Haneda with new constraints, passing the previous cycle through Haneda to ABS3Solver as a hint
- Adding one dummy airport to find a path with a free start and end

The written explanation is on the [Most Airports Tour](LONGEST_FLIGHT) page. Back to the [Videos (case studies)](../VIDEO_CASE_STUDIES) list

To see only the results, play the last chapter, [Following by Plane](#following-by-plane).

## Problem

{% include video_seek.html t="0:43" %}

- We use the nonstop domestic flights of the 2026 winter timetable that operate basically every day, including the helicopter flights between the Izu Islands.
- There are 85 airports and 458 flights. One direction counts as one flight (Haneda to Itami and Itami to Haneda are different flights).
- Changing flights, we visit as many airports as possible without visiting any airport twice; for the same number of airports, the total distance is as short as possible.
- We consider two cases: always leaving Haneda Airport and returning to Haneda Airport, and starting and ending at any two different airports.
- Connection times (whether the flights connect on the same day) are not considered. The distance is the great-circle distance between the two airports, rounded to an integer in kilometers.

The data is described on the [Most Airports Tour](LONGEST_FLIGHT#data) page.

## Directed Graph

{% include video_seek.html t="1:49" %}

- Most routes have flights in both directions, but Amami → Yoron and Naha → Amami have no flight in the opposite direction. So we use a directed graph $G=(V,E)$, whose edges have directions: $V$ is the set of airports, $E$ the set of flights, and the flight from airport $u$ to airport $v$ is the edge $(u,v)$.
- Each flight gets a binary variable $x_{u,v}$: 1 means taking the flight, 0 not taking it. There are 458 variables.
- $\text{in}(v)$ is the sum of the variables of the flights arriving at airport $v$, and $\text{out}(v)$ that of the flights leaving $v$: the numbers of arrivals at and departures from $v$.

## Constraints

{% include video_seek.html t="2:51" %}

With $r$ for Haneda, we impose four constraints:

$$
\begin{aligned}
\text{in}(v)&=\text{out}(v) && (v\in V)\\
\text{in}(v)&\leq 1 && (v\in V)\\
\text{in}(r)&=1\\
x_{u,v}+x_{v,u}&\leq 1 && ((u,v)\in E,\ (v,u)\in E)
\end{aligned}
$$

- The first says that we always leave an airport we land at, and the second that we land at each airport at most once. Under these two, the selected flights split into cycles (rings of flights that return to where they started) that share no airport.
- By the third, there is exactly one cycle through Haneda, and this cycle is the answer.
- A cycle of just the two flights of a round trip can be made on any route, so the fourth removes them all at once.
- The four constraints are written with `qbpp.cons()`. The solver treats constraints written with `qbpp.cons()` specially and searches efficiently for solutions that satisfy them. Breaking a constraint adds the weight times the squared violation as a penalty.

## Objective Function

{% include video_seek.html t="4:16" %}

- In a cycle, the number of airports visited equals the number of flights taken. So we maximize the number of flights and, among those, minimize the total distance.
- With $d_{u,v}$ the distance of flight $(u,v)$, the value of taking it is $w_{u,v} = M - d_{u,v}$, where $M$ is always larger than the total distance of a cycle.
- A cycle of $k$ flights with total distance $D$ has total value $kM - D$. A cycle with one more flight always has a larger total value, and for the same number of flights, a shorter cycle has a larger total value.
- $M$ is the sum, over the airports, of the longest distance of the flights arriving there, plus 1. For this data, $M = 69079$.
- Since we minimize, the sign of the total value is flipped, and the constraints are added with a large constant $P$ (the sum of all flight values plus 1). Breaking even one constraint costs at least $P$, so a solution that breaks a constraint is never the minimum.

$$
f = -\sum_{(u,v)\in E}w_{u,v}x_{u,v} + P\cdot(\text{constraints})
$$

## Cycles Not Through Haneda

{% include video_seek.html t="5:54" %}

- Solving this, the first solution had a cycle through Haneda of only 7 flights and 6 cycles not through Haneda. The cycles not through Haneda also satisfy all four constraints.
- The condition that the selected flights form a single cycle concerns the whole graph and cannot be written directly as a formula for each airport. So we add constraints that remove the cycles found.
- With $S$ the airport set of a cycle not through Haneda and $\text{enter}(S)$ the sum of the variables of the flights from outside $S$ to an airport in $S$, we add, for each airport $v$ in $S$,

$$
\text{enter}(S)\geq \text{in}(v)\quad (v\in S)
$$

- A solution with only $S$ lands at airports in $S$ without a flight into $S$, so it violates these constraints. The cycle through Haneda passes through Haneda, outside $S$, so if it lands at an airport in $S$, it enters $S$ from outside before that. The answer is never removed.

The details are on the [Most Airports Tour](LONGEST_FLIGHT#eliminating-cycles-not-through-haneda) page.

## Iterations and Hints

{% include video_seek.html t="7:12" %}

- Which cycles to remove is not known before solving. So we repeat: solve, split the solution into cycles, and if there are cycles not through Haneda, add constraints and solve again. When no cycle not through Haneda remains, the cycle through Haneda is the answer.
- The added constraints stay, so the same cycle never appears again.
- From the second round on, the previous cycle through Haneda is passed as a [solution hint](ABS3#solution-hint). It also satisfies the newly added constraints. ABS3Solver never returns a solution with higher energy than the hint, so the energy of each solution is at most that of the hint.

## Program

{% include video_seek.html t="8:07" %}

Put [domestic_flights.csv](../../images/domestic_flights.csv) in the directory where you run the program.

```python
import csv
import pyqbpp as qbpp

airports = []      # airport codes
flights = []       # flights (from, to, km), nonstop, one direction
flight_index = {}  # (from, to) -> flight number


def airport(code):
    if code not in airports:
        airports.append(code)
    return airports.index(code)


def add_flight(u, v, km):
    flight_index[(u, v)] = len(flights)
    flights.append((u, v, km))


# Find a cycle through root that does not visit any airport
# twice, with the most flights and, among those, the shortest total distance
def longest_trip(root):
    n, m = len(airports), len(flights)
    x = qbpp.var("x", shape=m)

    # Flight value M - km. M is larger than the total distance of any cycle
    max_in = [0] * n
    for u, v, km in flights:
        max_in[v] = max(max_in[v], km)
    M = sum(max_in) + 1
    obj = qbpp.sum([(M - km) * x[e] for e, (u, v, km) in enumerate(flights)])
    P = sum(M - km for u, v, km in flights) + 1  # constraint weight: sum of flight values + 1

    into = [0] * n
    out = [0] * n
    for e, (u, v, km) in enumerate(flights):
        into[v] += x[e]
        out[u] += x[e]
    c = 0
    for v in range(n):
        c += qbpp.cons(into[v] - out[v] == 0)  # leave every airport you land at
        c += qbpp.cons(into[v] <= 1)           # land at each airport at most once
    c += qbpp.cons(into[root] == 1)  # pass through root
    for e, (u, v, km) in enumerate(flights):  # do not fly a route both ways
        r = flight_index.get((v, u))
        if r is not None and e < r:
            c += qbpp.cons(x[e] + x[r] <= 1)
    f = -obj + P * c

    trip = []
    rnd = 0
    while True:
        rnd += 1
        f.simplify_as_binary()
        solver = qbpp.ABS3Solver(f)
        hint = None
        if rnd > 1:  # use the previous cycle through root as a hint
            hint = qbpp.Sol(f)
            for a, b in zip(trip, trip[1:]):
                hint.set(x[flight_index[(a, b)]], 1)
        sol = solver.search(time_limit=5, hint=hint)

        # Following the selected flights from root gives the cycle through root.
        # The other selected flights form cycles not through root
        nxt = [-1] * n
        for e, (u, v, km) in enumerate(flights):
            if sol(x[e]) == 1:
                nxt[u] = v
        done = [False] * n
        trip = [root]
        v = nxt[root]
        while v != root:
            trip.append(v)
            done[v] = True
            v = nxt[v]
        trip.append(root)
        cycles = []
        for s in range(n):
            if nxt[s] < 0 or s == root or done[s]:
                continue
            S = set()
            v = s
            while not done[v]:
                done[v] = True
                S.add(v)
                v = nxt[v]
            cycles.append(S)
        print(f"round {rnd}: flights = {len(trip) - 1}, other cycles = {len(cycles)}")
        if not cycles:
            return trip

        # For the airport set S of each cycle: to land at an airport in S,
        # take a flight into S from outside S
        for S in cycles:
            enter = qbpp.sum([x[e] for e, (u, v, km) in enumerate(flights)
                              if u not in S and v in S])
            for v in S:
                f += P * qbpp.cons(enter - into[v] >= 0)


def print_trip(trip):
    km = sum(flights[flight_index[(a, b)]][2] for a, b in zip(trip, trip[1:]))
    print(" ".join(airports[v] for v in trip))
    print(f"distance = {km} km")


with open("domestic_flights.csv") as file:
    for row in csv.DictReader(file):
        add_flight(airport(row["from"]), airport(row["to"]), int(row["km"]))
print(f"{len(airports)} airports, {len(flights)} flights")

print_trip(longest_trip(airport("HND")))

# Route with no fixed start and end: add a dummy airport DMY linked to every airport
# by flights of distance 0
dmy = airport("DMY")
for v in range(dmy):
    add_flight(dmy, v, 0)
    add_flight(v, dmy, 0)
print_trip(longest_trip(dmy))
```

- `airports` is the list of airport codes; the number of an airport is its position in this list. `flights` is the list of (departure, arrival, distance), and `flight_index` is a dictionary from a pair of airport numbers to the flight number. The end of the program reads the CSV file and adds the flights with `add_flight()`.
- `longest_trip(root)` finds the cycle through airport `root`. `x[e]` is 1 when flight `e` is taken. `obj` is the total value of the selected flights, an objective function that is better when larger.
- `into` and `out` collect, for each airport, the variables of the arriving and departing flights (`in` is a reserved word in Python, hence `into`). The constraints are written with `qbpp.cons()` and added to `c`, and `f = -obj + P * c` is minimized.
- In each round of the loop, `f` is simplified with `simplify_as_binary()`, an `ABS3Solver` is created, and it searches for 5 seconds with `time_limit=5`. From the second round on, the solution with only the flights of the previous cycle through `root` set to 1 is the hint.
- From the solution, `nxt` stores for each airport the arrival of the selected flight. Following it from `root` gives the cycle through `root`, and following it from the remaining airports gives the cycles not through `root` (`cycles`). If `cycles` is empty, the cycle through `root` is returned; otherwise `enter - into[v] >= 0` is added for each cycle.

## Result from Haneda

{% include video_seek.html t="10:45" %}

```
85 airports, 458 flights
round 1: flights = 7, other cycles = 6
round 2: flights = 29, other cycles = 1
round 3: flights = 29, other cycles = 1
round 4: flights = 29, other cycles = 1
round 5: flights = 29, other cycles = 1
round 6: flights = 29, other cycles = 1
round 7: flights = 29, other cycles = 1
round 8: flights = 29, other cycles = 1
round 9: flights = 29, other cycles = 1
round 10: flights = 7, other cycles = 1
round 11: flights = 7, other cycles = 1
round 12: flights = 33, other cycles = 0
HND GAJ CTS HKD OKD AXT NGO KCZ NRT KMJ AXJ FUK FUJ NGS KIX MMY ISG OGN OKA OKE TKN ASJ KKX KOJ MYJ ITM OKI IZO NKM KIJ UKB SDJ HIJ HND
distance = 12225 km
```

- `flights` is the number of flights of the cycle through Haneda, and `other cycles` the number of cycles not through Haneda.
- In rounds 2 to 9 the cycle through Haneda has 29 flights; in rounds 10 and 11 it goes back to 7, but the energy of the solution is at most that of the previous cycle through Haneda. In round 12 no cycle not through Haneda remains.
- The cycle found visits 33 airports with 33 flights and 12,225 km, and it is optimal (its optimality was confirmed by another method).
- The search uses random numbers, so the intermediate solutions and the number of rounds vary from run to run. The cycle may also be printed in the opposite direction.

## Path with Free Start and End

{% include video_seek.html t="12:07" %}

- Adding a dummy airport `DMY`, with flights of distance 0 in both directions between `DMY` and every airport, turns this into the same problem as from Haneda. Removing the two flights with `DMY` from a cycle through `DMY` leaves a path from some airport $s$ to $t$.
- A flight with `DMY` has value $M$, and every cycle through `DMY` takes exactly two of them, so they do not change which cycle is the best.
- The end of the program adds `DMY` and its flights and calls `longest_trip` again with `DMY` as `root`.

```
round 1: flights = 27, other cycles = 2
round 2: flights = 27, other cycles = 2
round 3: flights = 37, other cycles = 1
round 4: flights = 37, other cycles = 1
round 5: flights = 37, other cycles = 1
round 6: flights = 37, other cycles = 1
round 7: flights = 37, other cycles = 1
round 8: flights = 37, other cycles = 1
round 9: flights = 37, other cycles = 1
round 10: flights = 37, other cycles = 1
round 11: flights = 41, other cycles = 0
DMY RJAN RJTF OIM MYE HP_MIKURAJIMA HAC HND HIJ SDJ KIX NGS FUJ FUK AXJ KMJ NRT KCZ NGO AXT OKD HKD CTS MMJ UKB KIJ NKM IZO OKI ITM MYJ KOJ KKX ASJ TKN OKE OKA OGN ISG MMY TRA DMY
distance = 11853 km
```

- In round 11 no cycle not through `DMY` remains. `flights = 41` includes the two flights with `DMY`.
- The path from Niijima to Tarama visits 40 airports with 39 flights and 11,853 km, and it is optimal (its optimality was confirmed by another method). It visits 7 more airports than the cycle through Haneda, in less distance.
- From Oshima to Miyakejima, Mikurajima, and Hachijojima, the flights are helicopters.

## Following by Plane

{% include video_seek.html t="13:46" %}

- The two answers are followed by plane (by helicopter in the Izu Islands): first the cycle of 33 flights through Haneda, then the path of 39 flights from Niijima to Tarama.
- The flight numbers are examples of daily flights; connection times are not considered.

## Summary

{% include video_seek.html t="16:35" %}

- The most airports tour was formulated as a directed-graph problem. The four constraints were written with `qbpp.cons()`, and the number of flights and the distance were combined in one objective function.
- Each cycle not through Haneda was removed with new constraints as it was found.
- Adding a dummy airport gave the path with a free start and end, too.
