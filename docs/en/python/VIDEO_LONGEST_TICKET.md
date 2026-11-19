---
last_modified: 2026-11-12
layout: default
nav_exclude: true
title: "Video: Longest One-Way Ticket"
description: "The chapters of the video \"QUBO++ Case Study: Longest One-Way Ticket (Python)\", with the program and output shown in it."
lang: en
hreflang_alt: "ja/python/VIDEO_LONGEST_TICKET"
hreflang_lang: "ja"
video: longest-ticket
---

# Video: Longest One-Way Ticket (Python)

A guide to the video "QUBO++ Case Study: Longest One-Way Ticket (Python)".
For each chapter it gives the main points, the program and output shown in the video, and links to the pages with the details.
Click "▶ Play the video from …" to play from that scene.

{% include video_embed.html slug="longest-ticket" %}

What the video covers:

- Representing the JR railway network as a graph whose vertices are stations and whose edges are sections, and merging each chain of stations without branches into one section
- A binary variable $x$ for each section and variables $s, a, b$ for each station that write the degree of a station as $2s-a+b$, describing routes of types L and P together
- Iterations that remove cycles detached from the route with new constraints after each solve, passing the best route so far to ABS3Solver as a hint
- Following the resulting 10,509.1 km route on the map from the start

The written explanation is on the [Longest One-Way Ticket](LONGEST_TICKET) page. Back to the [Videos (case studies)](../VIDEO_CASE_STUDIES) list

To see only the result, play the [Results](#results) chapter.

## The Longest One-Way Ticket

{% include video_seek.html t="0:34" %}

- A JR one-way ticket cannot pass the same section or the same station twice. Only the last station may be one the route has already passed.
- So the route is a simple path that passes no station twice (**type L**), a loop that ends at the starting station (**type O**), or a route that ends at a station it passed on the way, a path followed by a loop (**type P**). The names of the types come from R. Miyashiro and T. Kasai, "Longest one-way ticket" (in Japanese), *Operations Research as a Management Science*, January 2004.
- The longest one-way ticket is the longest route that keeps these rules. The distance is the **operating distance** (営業キロ), the distance on which fares are based.

## Railway Graph

{% include video_seek.html t="1:18" %}

- The railway network is a graph whose vertices are stations and whose edges are sections between stations. We built the data ourselves in November 2026 from the Wikipedia articles of the lines (lines, stations, and operating distances) and the JR passenger tariff rules (the rules on routes). Only JR railway lines are used; BRT lines and third-sector lines are not included. Suspended sections are included.
- Hokkaido, Shikoku, and Kyushu are each connected to Honshu at only one station (Shin-Aomori, Chayamachi, and Moji). The same station cannot be passed twice, so a route that enters an island cannot return to Honshu, and an island can only be at an end of the route.
- Type O can be the longest only when the loop passes through every station: if even one station is next to the loop, the type P route extended to it is longer. The JR network has no loop through every station, so it suffices to consider types L and P.

See the [Longest One-Way Ticket](LONGEST_TICKET#data) page for the details of the data.

## Merging Sections

{% include video_seek.html t="2:24" %}

- A chain of stations without branches is merged into one section. A station where lines branch is a **branch station**. The example on screen is the Omura Line from Shin-Omura to Haiki (nine stations in between).
- The merged section alone cannot make a route that ends at Takematsu (a route that passes Shin-Omura elsewhere, enters the Omura Line at Haiki, and ends at Takematsu). It suffices to consider routes that end at the station just before the next branch station (Takematsu and Huis Ten Bosch), because going further is longer.
- So two sections are added, from Shin-Omura to Huis Ten Bosch and from Haiki to Takematsu. We call them **end sections**. The merged section and its two end sections pass the same stations, so the three form a **group**, and at most one section of a group is used.
- No end sections are added for dead-end lines (going on to the terminal is longer). A chain with only one station in the middle is not merged and stays as two sections.
- The graph then has 980 stations and 1,110 sections.

## Rules

{% include video_seek.html t="3:49" %}

- The Shinkansen and the parallel conventional line are usually regarded as the same line, and passing the same section on both is a duplication. When you change trains at a station inside the section, however, they are treated as different lines and the section can be passed on both (Article 16-2, Paragraph 2 of the tariff rules). This rule is part of the constraints.
- In fact, the route shown later passes between Shizuoka and Mishima twice: first through on the Shinkansen, then on the Minobu Line to Fuji and on the conventional line to Numazu (changing trains at Fuji and Numazu).
- Rules such as the sections with a specified route (Article 69) are constraints in the same way. In metropolitan areas too, the distance is the operating distance of the route actually traveled.

See the [Longest One-Way Ticket](LONGEST_TICKET#data) page for the meaning of the `規則` (rules) column of the data.

## Variables and Degrees

{% include video_seek.html t="4:36" %}

- Each section $e$ has a binary variable $x_e$; the section is used when it is 1.
- Each station $v$ has binary variables $s_v$ (the station is passed), $a_v$ (an end of the route), and $b_v$ (the station where a type P route returns, the **joint**), with $a_v+b_v\le s_v$ (leaf stations have none; see the next chapter).
- The number of sections used at a station, $\text{used}_v$, is the sum of $x$ over the sections connected to it: 0 for a station not passed, 2 in the middle of the route, 1 at an end, and 3 at the joint.
- Type L has two ends, type O has no end and no joint, and type P has one end and one joint.

## Formulas for the Route Types

{% include video_seek.html t="5:42" %}

- The degree of a station is written as $\deg_v=2s_v-a_v+b_v$, with the constraint $\text{used}_v=\deg_v$. Since $a_v+b_v\le s_v$, the degree is 0 (not passed), 2 (middle), 1 (end), or 3 (joint).
- The numbers of ends and joints are (2, 0) for type L and (1, 1) for type P. So "the number of ends plus the number of joints is 2" and "at most one joint" describe types L and P together.
- A **middle station**, connected to two sections, cannot be a joint, so $b_v=0$. A **leaf station**, connected to only one section (the terminal of a dead-end line or the last station of end sections), gets no variables: the $x$ of its section is its degree and is added directly to the number of ends.

The formulas are on the [Longest One-Way Ticket](LONGEST_TICKET#formulation) page.

## Objective Function

{% include video_seek.html t="6:55" %}

- The sum of the variables of a group is at most 1, and the tariff rules are also constraints on the section variables.
- The goal is to maximize the total operating distance of the used sections. QUBO++ minimizes, so the sign is reversed.
- The constraints are declared with `qbpp.cons()` and added with a weight $P$, the total operating distance of all sections plus 1. A solution that satisfies the constraints has energy at most 0, and breaking even one makes the energy positive, so a solution that breaks a constraint is never the minimum.

## Detached Cycles

{% include video_seek.html t="7:34" %}

- With these constraints alone, a solution may contain loops not connected to the route (**detached cycles**). The stations of a detached cycle also have degree 2, so they satisfy all the constraints.
- "The solution is one route" cannot be written as a formula per station. So we solve, split the sections of the solution into connected parts (**components**), and if there are two or more, add constraints that forbid the detached cycles and solve again. When there is only one component, it is the route.

## Constraints Against Cycles

{% include video_seek.html t="8:20" %}

- Let $C$ be a detached cycle, and let the **region** $S$ be the stations reachable from $C$ without passing stations of the other components (the example on screen is the 32 stations around a cycle in Hiroshima Prefecture). Let $w(S)$ be the total operating distance of the sections inside $S$.
- A route closed inside $S$ cannot be longer than $w(S)$. If $w(S)$ is at most the best, the constraint "if a station of $S$ is passed, a section leaving $S$ is used" forbids all choices of sections closed inside $S$ at once. A route that enters $S$ from outside and passes through satisfies it.
- If $w(S)$ is longer than the best, only the cycle $C$ is forbidden, so as not to remove the answer. With $\delta(C)$ the sections leaving the stations of $C$, the constraint is "if the same $C$ appears again, at least one section of $\delta(C)$ is used." The loop of a type P route uses a section leaving the joint, so it satisfies this constraint.

The formulas are on the [Longest One-Way Ticket](LONGEST_TICKET#removing-separate-cycles) page.

## Hints and When to Stop

{% include video_seek.html t="9:31" %}

- A component of the solution that has an end and satisfies the tariff rules is a route candidate by itself. The longest one is recorded as the best route and passed as a [solution hint](ABS3#solution-hint) in the next solve. ABS3Solver never returns a solution worse than the hint.
- The solver searches for a limited time, so even when the solution has one component, it is not necessarily the best route. We stop when the best does not grow five times in a row with one-component solutions.

## Program

{% include video_seek.html t="10:00" %}

Put [jr_network.csv](../../images/jr_network.csv) in the directory where you run the program.

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

- `station()` returns the number of a station from its name, and `rules_ok()` checks whether the used sections satisfy the tariff rules.
- The CSV file is read into `sections`, and `incident` holds the numbers of the sections connected to each station. `leaf` tells whether a station is a leaf station.
- `x`, `s`, `a`, and `b` are the variables. `used` is the number of sections used at a station, `distance` is the total operating distance of the used sections, and `visit` is the expression for passing a station.
- At a leaf station, `used` is added directly to the number of ends; at the other stations, the constraints between `used` and the degree and on the sum of `a` and `b` are added. Then the constraints on the numbers of ends and joints and the group and tariff constraints are added with `qbpp.cons()`.
- `f` is the distance with its sign reversed plus the constraints times the weight `P`. The `b` of middle stations is set to 0 with `replace()`.
- In the loop, `f` is simplified each time, an `ABS3Solver` is made, and it searches for 10 seconds (`time_limit=10`). If there is a best route, a solution that uses only its sections is the hint.
- The used sections of the solution are split into components in `parts`; a component that satisfies the constraints and is longer than the best is traced into a route. With one component, the program counts whether the best grew and goes to the next round.
- With two or more components, it looks for components whose stations all have degree 2 (detached cycles), grows the region $S$ from each cycle, and computes $w(S)$. If $w(S)$ is at most the best, the constraint for the region $S$ is added to `f`; otherwise the constraint for the cycle $C$.
- Finally, the best route is printed with the names of the lines and stations.

## Results

{% include video_seek.html t="11:35" %}

The output in the video (the middle of the route is omitted):

```
980 stations, 1110 sections
round 1: components = 21, best = 0.0 km
round 2: components = 19, best = 2286.1 km
round 3: components = 11, best = 3132.5 km
round 4: components = 7, best = 3132.5 km
round 5: components = 8, best = 3132.5 km
round 6: components = 8, best = 3132.5 km
round 7: components = 4, best = 3132.5 km
round 8: components = 9, best = 3132.5 km
round 9: components = 4, best = 3132.5 km
round 10: components = 3, best = 9800.9 km
round 11: components = 4, best = 10103.9 km
round 12: components = 1, best = 10509.1 km
round 13: components = 1, best = 10509.1 km
round 14: components = 1, best = 10509.1 km
round 15: components = 1, best = 10509.1 km
round 16: components = 1, best = 10509.1 km
round 17: components = 1, best = 10509.1 km
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
323 sections, 10509.1 km (fare 10796.5 km)
```

- `components` is the number of components of the solution, and `best` is the operating distance of the best route so far.
- The solution of round 1 has 21 components, small loops scattered all over Japan. Each round of constraints reduces the components; in round 12 there is one component, a route of 10,509.1 km. The best then did not grow five times in a row, so the program stopped. The number of rounds and the intermediate solutions change from run to run.
- The route starts at Takematsu in Nagasaki, goes around Kyushu, and enters Honshu at Moji through the Chikuho lines. In Chugoku it goes back and forth between the San'in and San'yo sides; it takes the Hokuriku Shinkansen to Toyama and the Takayama Line to Gifu, goes around the Kii Peninsula to Nagoya, takes the Chuo Line and the Iida Line, the Shinkansen from Shizuoka to Mishima, the Minobu Line to Fuji, the conventional line to Numazu, and the Gotemba Line to Kozu into the Tokyo area. After the Tokyo area, the Boso Peninsula, northern Kanto, Nagano, and Niigata, it heads north through Tohoku, going back and forth between the Pacific and Sea of Japan sides, and enters Hokkaido on the Hokkaido Shinkansen from Shin-Aomori. From Oshamambe it goes around Tomakomai, Kushiro, Abashiri, Asahikawa, and Sapporo and ends back at Oshamambe: a type P route.
- It does not visit Shikoku. A route that enters Shikoku cannot come back, so Shikoku would have to be an end of the route. There are only two ends, and making Kyushu and Hokkaido the ends is longer.
- That 10,509.1 km is the longest was confirmed by another method. Other routes of the same length exist, and a different route may be printed in another run.

## Summary

{% include video_seek.html t="13:51" %}

- We found the longest one-way ticket with QUBO++.
- Variables that choose sections and constraints on the degrees of stations describe routes of types L and P together.
- Detached cycles were removed by adding constraints after looking at each solution.
