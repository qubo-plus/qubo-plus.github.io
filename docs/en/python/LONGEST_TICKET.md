---
last_modified: 2026-11-12
layout: default
nav_exclude: true
title: "Longest One-Way Ticket"
nav_order: 66
lang: en
hreflang_alt: "ja/python/LONGEST_TICKET"
hreflang_lang: "ja"
---

# Longest One-Way Ticket
The **longest one-way ticket** is the JR (Japan Railways) one-way ticket with the longest route.
A one-way ticket cannot use the same section twice and cannot pass the same station twice.
The only exception is the last station, which may be a station that the route has already passed.
Therefore, the route has one of the following three types:
- **Type L**: a simple path that passes no station twice
- **Type O**: a loop that ends at the starting station
- **Type P**: a route that ends at a station it passed on the way (a path followed by a loop)

Of these, type O cannot be the longest.
Type O can be the longest only when the loop passes through every station. If even one station is not on the loop, then, because the network is connected, some station that is not on the loop is next to a station of the loop. Extending the route by one section from the loop to that station gives a type P route that starts there and goes once around the loop, and it is longer than the type O route.
The JR network has no loop that passes through every station, so type O cannot be the longest. We therefore find the longest route of type L or P.

{% include video_embed.html slug="longest-ticket" %}

The video turns the railway network into a graph and merges sections, explains the variables, the constraints, and how detached cycles are removed, and follows the route found by the program on the map from the start. The program in the video, chapter by chapter, is on the page [Video: Longest One-Way Ticket](VIDEO_LONGEST_TICKET).

References:
- R. Miyashiro and T. Kasai, "Longest one-way ticket" (in Japanese), *Operations Research as a Management Science*, Vol. 49, No. 1, pp. 15–20, January 2004 (the names of types L, O, and P come from this article)
- Nue, "[最長片道切符の流儀とバリエーション](https://nue2004.info/railway/lop/)" (in Japanese)

## Data
[jr_network.csv](../images/jr_network.csv) is the JR railway network as a graph whose vertices are stations and whose edges are sections between stations.
We built it in November 2026 from the Wikipedia articles of the lines ([CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)) and the JR passenger tariff rules (旅客営業規則), which we obtained ourselves.
It has 980 stations and 1,110 sections, one section per line:
```
線名,駅1,駅2,営業キロ,運賃計算キロ,端,組,規則
関西本線,JR難波,今宮,1.3,1.30,0,,
可部線,あき亀山,横川 (広島県),15.6,17.16,0,,
常磐線,いわき,水戸,94.1,94.10,0,1,
常磐線,いわき,勝田,88.3,88.30,1,1,
常磐線,水戸,内郷,89.7,89.70,1,1,
東北新幹線,くりこま高原,古川,21.2,21.20,0,,-規16-2_2_(8)
...
```
The columns are the line name, the two stations, the operating distance (営業キロ, km), the fare distance (運賃計算キロ, km), the end flag, the group, and the rules.
The fare distance is the operating distance multiplied by 1.1 on local lines (without the official rounding).
We built the data as follows:
- Only JR railway lines are included. BRT lines and third-sector lines transferred from JR are excluded. Suspended sections are included.
- A chain of stations without branches is merged into one section (sections with rules are not merged). Kita-Fujioka station between Shinmachi and Kuragano is a station of the Hachiko Line only, so the Takasaki Line is not split there.
- A route may end at a station inside a section. For example, if the Omura Line between Shin-Omura and Haiki is merged into one section, a route that passes Shin-Omura elsewhere, enters the Omura Line at Haiki, and ends at Takematsu cannot be made. It suffices to consider routes that end at the station just before the next branch station (Takematsu and Huis Ten Bosch in this example), because going one station further is longer. So, for each merged section u−v, we add a section from u to the station just before v and a section from v to the station just before u. We call them **end sections**; their `端` column is 1, and the route ends at the second station.
- No end sections are added for dead-end lines (such as the Sakai Line between Yonago and Sakaiminato). The stations of such a line reach other lines only through its branch station, so a route ending inside the line is longer when it goes on to the terminal.
- A chain with only one station in the middle (such as Mishima, Kannami, and Atami on the Tokaido Line) is not merged and stays as two sections.
- A merged section and its two end sections pass the same stations, so at most one of them can be used. Sections with the same value in the `組` (group) column can be used at most once in total.
- The Shinkansen sections that Article 16-2, Paragraph 1 and Article 16-3 of the tariff rules regard as the same line as the conventional line are not included (we treat Tokyo–Atami in the same way). The Shinkansen sections of Article 16-2, Paragraph 2 are included with the following rule (we treat Shinagawa–Odawara in the same way).
- `+g` and `-g` in the `規則` (rules) column mean "if all `-g` sections are used, at least one `+g` section is used." Article 16-2, Paragraph 2 (if the whole Shinkansen section is used, a conventional section of the same interval is also used) and Article 69 (sections with a specified route) are written in this form. Special fare rules for metropolitan areas and around Tokyo (such as Article 70) are not considered; the distance is always the operating distance of the route actually traveled.

## Formulation
We introduce a binary variable $x_e$ for each section $e$, where $x_e=1$ means that the section is used.
Let $\text{used}_v=\sum_{e\ni v}x_e$ be the number of sections used at station $v$ ($e\ni v$ means that section $e$ is connected to station $v$).
On a one-way ticket route, the number of sections used at a station is 0 for a station not passed, 2 for a station in the middle, 1 for an end of the route, and 3 for the station where a type P route returns (the **joint**).
We call this number the **degree** $\deg_v$ of the station and express it with variables for each kind of station.
Stations fall into three kinds by the number of sections connected to them (the **connectivity**):
- **Branch station** (connectivity 3 or more): we introduce binary variables $s_v$ (the station is passed), $a_v$ (an end), and $b_v$ (the joint), and let $\deg_v=2s_v-a_v+b_v$.
- **Middle station** (connectivity 2): at most two sections are used and it cannot be a joint, so we fix $b_v=0$ and let $\deg_v=2s_v-a_v$.
- **Leaf station** (connectivity 1: the terminal of a dead-end line, or the last station of end sections): zero or one section is used, so it gets no variables, and $\deg_v=x_e$ ($e$ is its only section).

For every station except leaf stations we impose the following constraints (at a leaf station, $\text{used}_v=\deg_v=x_e$ always holds, so no constraint is needed):

$$
\text{used}_v=\deg_v,\qquad a_v+b_v\le s_v\qquad(\text{each station } v \text{ that is not a leaf})
$$

With $T$ the set of leaf stations, the number of ends of the route is $\sum_{v\notin T}a_v+\sum_{v\in T}\deg_v$ and the number of joints is $\sum_{v\notin T}b_v$.
The numbers of ends and joints are (2, 0) for type L and (1, 1) for type P, so the following constraints cover both types:

$$
\sum_{v\notin T}a_v+\sum_{v\in T}\deg_v+\sum_{v\notin T}b_v = 2,\qquad \sum_{v\notin T}b_v \le 1
$$

From the groups and the rules, we also impose:

$$
\sum_{e\in G}x_e \le 1\quad(\text{each group } G),\qquad
\sum_{e\in +g}x_e-\sum_{e\in -g}x_e \ge 1-k_g\quad(\text{each rule } g)
$$

$k_g$ is the number of `-g` sections.
If all `-g` sections are used, $\sum_{e\in -g}x_e=k_g$, so at least one `+g` section must be used.

The objective is to maximize the sum of the operating distances $d_e$ of the used sections, so we negate it and add the constraints with weight $P$:

$$
f = -\sum_e d_ex_e + P\cdot(\text{constraints})
$$

The constraints are declared with `qbpp.cons()`, and $P$ is the total operating distance of all sections plus 1.
A solution satisfying the constraints has energy 0 or less, and a solution violating a constraint has positive energy, so a violating solution never minimizes $f$.

## Removing Separate Cycles
With the constraints above, a solution may contain, besides the route, cycles that are not connected to it (**separate cycles**).
The stations of a separate cycle have degree 2, so they satisfy all the constraints.
As in [Most Airports Tour](LONGEST_FLIGHT), we repeatedly solve and add constraints based on the result:

1. Solve $f$ with the constraints added so far.
2. Split the sections of the solution into connected parts (components). If there is only one component, it is the route.
3. Otherwise, add a constraint for each separate cycle $C$ (a component whose stations all have degree 2) and go back to 1.

The constraint for a cycle $C$ is as follows.
Let $S$ be the set of stations reachable from $C$ without passing stations of the other components, and let $w(S)$ be the total operating distance of the sections with both ends in $S$.
If $w(S)$ is at most the distance of the best route found so far, we add, for each station $u$ in $S$:

$$
\text{visit}(u) \le \text{out}(S)\qquad(u\in S)
$$

$\text{visit}(u)$ is the expression for passing station $u$ ($s_u$, or $x_e$ for a leaf station), and $\text{out}(S)$ is the sum of the variables of the sections between $S$ and the outside of $S$.
This constraint means "if a station in $S$ is passed, a section leaving $S$ is used," and it removes every choice of sections closed inside $S$.
A route closed inside $S$ cannot be longer than $w(S)$, so it does not exceed the best route found so far, and the answer is never removed.
If $w(S)$ is larger than the best distance, $S$ may hold a route longer than the best, so forbidding everything closed inside $S$ could remove the answer. We therefore forbid only the cycle $C$.
With $\delta(C)$ the set of sections between the stations of $C$ and the outside (the sections leaving the stations of $C$) and $\lvert C\rvert$ the number of sections of $C$, we add the constraint "if the same cycle $C$ appears again, at least one section of $\delta(C)$ is used":

$$
\sum_{e\in C}x_e=\lvert C\rvert\ \Rightarrow\ \sum_{e\in\delta(C)}x_e\ge 1
$$

Written as one inequality, this is the following (it restricts nothing unless all sections of $C$ are used):

$$
\sum_{e\in C}x_e-\sum_{e\in\delta(C)}x_e\le \lvert C\rvert-1
$$

A detached cycle uses no leaving section, so it violates this constraint.
A route that uses $C$ as the loop of a type P route uses a leaving section at its joint, so it satisfies the constraint; the leaving sections are subtracted to keep such routes.

Each component of a solution that has an end (a station of degree 1) can be a type L or P route by itself.
So we take every component that has an end and satisfies the rules as a candidate and record the best route.
The best route is passed as a [solution hint](ABS3#solution-hint) to the next round.
Because the solver searches for a limited time, a solution with one component is not necessarily the best.
We stop when the best route does not improve for 5 consecutive solutions with one component.

## QUBO++ Program
Place [jr_network.csv](../images/jr_network.csv) in the directory where the program runs:
{% raw %}
```python
import csv
from collections import defaultdict
import pyqbpp as qbpp

stations = []  # 駅名
index = {}     # 駅名から駅の番号
sections = []  # 区間（辞書）
incident = []  # 駅に接する区間の番号
minus_count = defaultdict(int)  # 規則 g の -g の区間の本数


def station(name):
    if name not in index:
        index[name] = len(stations)
        stations.append(name)
        incident.append([])
    return index[name]


# 規則 "+g" / "-g": -g の区間を全部使うなら、+g の区間を 1 本以上使う
# used に入っている区間を使うとき、規則を満たすかどうか
def rules_ok(used):
    plus, minus = defaultdict(int), defaultdict(int)
    for e in used:
        for r in sections[e]["rules"]:
            (plus if r[0] == "+" else minus)[r[1:]] += 1
    return all(minus[g] < k or plus[g] > 0 for g, k in minus_count.items())


with open("jr_network.csv", encoding="utf-8") as file:
    for row in csv.DictReader(file):
        sec = {"line": row["線名"], "u": station(row["駅1"]), "v": station(row["駅2"]),
               "km": round(float(row["営業キロ"]) * 10),  # 0.1 km 単位
               "fare": float(row["運賃計算キロ"]), "tail": row["端"] == "1",
               "group": row["組"], "rules": row["規則"].split()}
        for r in sec["rules"]:
            if r[0] == "-":
                minus_count[r[1:]] += 1
        incident[sec["u"]].append(len(sections))
        incident[sec["v"]].append(len(sections))
        sections.append(sec)
n, m = len(stations), len(sections)
# 葉駅: 接続数が 1 の駅（行き止まりの線の終点と、端の区間の終わりの駅）
leaf = [len(incident[v]) == 1 for v in range(n)]
print(f"{n} stations, {m} sections")

x = qbpp.var("x", shape=m)
s = qbpp.var("s", shape=n)  # 駅を通る
a = qbpp.var("a", shape=n)  # 駅が経路の端
b = qbpp.var("b", shape=n)  # 駅が合流点
used = [0] * n  # 駅で使う区間の本数
for e, sec in enumerate(sections):
    used[sec["u"]] += x[e]
    used[sec["v"]] += x[e]
distance = qbpp.sum([sec["km"] * x[e] for e, sec in enumerate(sections)])
W = sum(sec["km"] for sec in sections)
c = 0
ends = 0
joins = 0
visit = [None] * n  # 駅を通る
for v in range(n):
    if leaf[v]:  # 葉駅の次数は、つながる 1 本の区間の変数
        visit[v] = used[v]
        ends += used[v]
        continue
    visit[v] = s[v]
    ends += a[v]
    joins += b[v]
    c += qbpp.cons(used[v] - (2 * s[v] - a[v] + b[v]) == 0)  # 次数 0, 2, 1（端）, 3（合流点）
    c += qbpp.cons(a[v] + b[v] - s[v] <= 0)
c += qbpp.cons(ends + joins == 2)  # L 型は (2, 0)、P 型は (1, 1)
c += qbpp.cons(joins <= 1)
group, plus, minus = defaultdict(int), defaultdict(int), defaultdict(int)
for e, sec in enumerate(sections):
    if sec["group"]:
        group[sec["group"]] += x[e]
    for r in sec["rules"]:
        (plus if r[0] == "+" else minus)[r[1:]] += x[e]
for g in group:
    c += qbpp.cons(group[g] <= 1)
for g, k in minus_count.items():
    c += qbpp.cons(plus[g] - minus[g] >= 1 - k)
P = W + 1
f = -distance + P * c
# 中間駅（接続数 2）は合流点にならない
f = qbpp.replace(f, {b[v]: 0 for v in range(n) if len(incident[v]) == 2})

best, best_route, best_sections = 0, [], []
stall = 0
rnd = 0
while stall < 5:
    rnd += 1
    f.simplify_as_binary()
    solver = qbpp.ABS3Solver(f)
    hint = None
    if best > 0:  # 最良の経路をヒントにする
        hint = qbpp.Sol(f)
        d = [0] * n
        for e in best_sections:
            hint.set(x[e], 1)
            d[sections[e]["u"]] += 1
            d[sections[e]["v"]] += 1
        for v in range(n):
            if not leaf[v]:
                hint.set(s[v], d[v] > 0)
                hint.set(a[v], d[v] == 1)
                if len(incident[v]) > 2:
                    hint.set(b[v], d[v] == 3)
    sol = solver.search(time_limit=10, hint=hint)

    # 使う区間を、つながった部分（成分）に分ける
    use = [sol(x[e]) == 1 for e in range(m)]
    comp = [-1] * n
    parts = []  # 成分ごとの区間
    for e0 in range(m):
        if not use[e0] or comp[sections[e0]["u"]] >= 0:
            continue
        stack, part = [sections[e0]["u"]], set()
        comp[stack[0]] = len(parts)
        while stack:
            v = stack.pop()
            for e in incident[v]:
                if not use[e]:
                    continue
                part.add(e)
                w = sections[e]["v"] if sections[e]["u"] == v else sections[e]["u"]
                if comp[w] < 0:
                    comp[w] = len(parts)
                    stack.append(w)
        parts.append(sorted(part))
    prev = best
    for part in parts:  # 端のある成分は、それだけで L 型か P 型の経路になりうる
        km = sum(sections[e]["km"] for e in part)
        if km <= best or not rules_ok(part):
            continue
        # 端（次数 1 の駅）から区間をたどって経路にする（端のない輪は O 型なので除く）
        d = defaultdict(int)
        for e in part:
            d[sections[e]["u"]] += 1
            d[sections[e]["v"]] += 1
        v = next((w for w in d if d[w] == 1), None)
        if v is None:
            continue
        left, route, order = set(part), [v], []  # 駅の列と区間の列
        while True:
            e = next((e for e in incident[v] if e in left), None)
            if e is None:
                break
            left.remove(e)
            v = sections[e]["v"] if sections[e]["u"] == v else sections[e]["u"]
            route.append(v)
            order.append(e)
        best, best_route, best_sections = km, route, order
    print(f"round {rnd}: components = {len(parts)}, best = {best / 10:.1f} km")
    if len(parts) == 1:  # 1 本の経路: 最良が 5 回続けて伸びなければ終わる
        stall = 0 if best > prev else stall + 1
        continue
    stall = 0

    # 離れた閉路 C（次数がすべて 2 の成分）ごとに制約を加える
    for p, part in enumerate(parts):
        d = defaultdict(int)
        for e in part:
            d[sections[e]["u"]] += 1
            d[sections[e]["v"]] += 1
        if any(dv != 2 for dv in d.values()):
            continue
        # 地域 S: 他の成分の駅を通らずに C から行ける駅
        S = set(d)
        stack = list(S)
        while stack:
            v = stack.pop()
            for e in incident[v]:
                for w in (sections[e]["u"], sections[e]["v"]):
                    if w not in S and comp[w] in (-1, p):
                        S.add(w)
                        stack.append(w)
        wS = sum(sec["km"] for sec in sections if sec["u"] in S and sec["v"] in S)
        if wS <= best:  # S の駅を通るなら、S の外とつながる区間を使う
            out = qbpp.sum([x[e] for e, sec in enumerate(sections) if (sec["u"] in S) != (sec["v"] in S)])
            for v in S:
                f += P * qbpp.cons(visit[v] - out <= 0)
        else:  # C の区間を全部使うなら、C の駅から外へ出る区間も使う
            used = qbpp.sum([x[e] for e in part])
            exits = qbpp.sum([x[e] for e, sec in enumerate(sections) if (sec["u"] in d) != (sec["v"] in d)])
            f += P * qbpp.cons(used - exits <= len(part) - 1)

fare = sum(sections[e]["fare"] for e in best_sections)
# 経路: 線名と、その線で着く駅を 1 行ずつ（同じ線が続く区間はまとめる）
print(stations[best_route[0]])
for i, e in enumerate(best_sections):
    line = sections[e]["line"]
    if i + 1 == len(best_sections) or sections[best_sections[i + 1]]["line"] != line:
        print(f"  -{line}- {stations[best_route[i + 1]]}")
print(f"{len(best_sections)} sections, {best / 10:.1f} km (fare {fare:.1f} km)")
```
{% endraw %}
`sections` is the list of sections (dictionaries), and `incident[v]` is the list of the sections incident to station `v`.
`leaf[v]` means that station `v` is a leaf station (connectivity 1).
`used[v]` is the number of sections used at station `v`, and `visit[v]` is the expression for passing station `v`. `b[v]` of a middle station (connectivity 2) is fixed to 0 with `replace()`.
For rule `g`, `plus[g]` and `minus[g]` hold the sums of the variables of the `+g` and `-g` sections, and `minus_count[g]` holds the number of `-g` sections.

In each round of the loop, `f` is simplified, an ABS3 Solver is created, and it searches for 10 seconds.
If there is a best route, a solution that uses its sections and no others is passed as `hint` of `search()`.
The used sections of the solution are split into connected parts and stored in `parts`.
`rules_ok()` checks the rules, and if a part is longer than the best, it is traced from an end station to make the station sequence `best_route` and the section sequence `best_sections`.
Finally, the route is printed as one line per run of the same line: the line name and the station reached on that line.

## Result
An example output is:
```
980 stations, 1110 sections
round 1: components = 21, best = 0.0 km
round 2: components = 18, best = 2614.5 km
round 3: components = 13, best = 2828.0 km
round 4: components = 7, best = 2828.0 km
round 5: components = 9, best = 2828.0 km
round 6: components = 6, best = 2828.0 km
round 7: components = 8, best = 2828.0 km
round 8: components = 5, best = 2828.0 km
round 9: components = 4, best = 2828.0 km
round 10: components = 5, best = 2828.0 km
round 11: components = 5, best = 8919.8 km
round 12: components = 2, best = 10103.9 km
round 13: components = 1, best = 10509.1 km
round 14: components = 2, best = 10509.1 km
round 15: components = 1, best = 10509.1 km
round 16: components = 1, best = 10509.1 km
round 17: components = 1, best = 10509.1 km
round 18: components = 1, best = 10509.1 km
round 19: components = 1, best = 10509.1 km
竹松
  -大村線- 早岐
  -佐世保線- 武雄温泉
  -西九州新幹線- 新大村
  -大村線- 諫早
  -長崎本線- 新鳥栖
  -九州新幹線- 博多
  -鹿児島本線- 新八代
  -九州新幹線・鹿児島本線- 鹿児島中央
  ...
  -室蘭本線- 沼ノ端
  -千歳線- 南千歳
  -石勝線- 追分 (北海道)
  -根室本線・石勝線- 東釧路
  -石北本線・釧網本線- 新旭川
  -宗谷本線- 旭川
  -富良野線・根室本線- 滝川
  -函館本線- 長万部
322 sections, 10509.1 km (fare 10796.5 km)
```
`components` is the number of components of the solution, and `best` is the operating distance of the best route so far.
The first solution has many components, but the number decreases as constraints are added, and the solution becomes one route in round 13.

The route is of type P, with an operating distance of 10,509.1 km (fare distance 10,796.5 km); this is the optimal value (we confirmed the optimality by another method).
It starts at Takematsu on the Omura Line in Nagasaki Prefecture, goes around Kyushu, and enters Honshu from Moji.
It goes around Honshu, enters Hokkaido from Shin-Aomori, goes from Oshamambe once around the loop through Sapporo, Asahikawa, Abashiri, Kushiro, and Tomakomai, and ends back at Oshamambe (the direction around the loop varies from run to run).
It does not visit Shikoku. Shikoku is connected to Honshu only at Chayamachi station, so a route entering Shikoku cannot come back, and Shikoku would have to be an end of the route. A route has only two ends, and making Kyushu and Hokkaido the ends is longer.

<p align="center">
  <img src="../images/longest_ticket_route_en.png" alt="Map of the 10,509.1 km longest one-way ticket route from Takematsu to Oshamambe" width="100%">
</p>

The references solve Hokkaido, Shikoku, Kyushu, and Honshu separately, whereas here the whole country is solved as one problem.
Because the solver uses random numbers, the intermediate solutions and the number of rounds vary from run to run.
There are other routes of 10,509.1 km, so a different route may be printed in each run.
