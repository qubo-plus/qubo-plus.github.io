---
last_modified: 2026-11-09
layout: default
nav_exclude: true
title: "動画：最多空港めぐり"
description: "動画「QUBO++ ケーススタディ 最多空港めぐり（Python）」の章ごとの要点と、動画に出てくるプログラムと出力。"
lang: ja
hreflang_alt: "en/python/VIDEO_LONGEST_FLIGHT"
hreflang_lang: "en"
video: most-airports
---

# 動画：最多空港めぐり（Python）

動画「QUBO++ ケーススタディ 最多空港めぐり（Python）」の手引きです。
章ごとに、要点と動画に出てくるプログラム・出力、詳しい説明のページへのリンクをまとめています。
「▶ 動画の … から再生」をクリックすると、その場面から再生します。

{% include video_embed.html slug="most-airports" %}

この動画で扱うこと：

- 国内線の直行便を、片道だけの便も表せる有向グラフで表すこと
- 便ごとのバイナリ変数と、4 つの制約を `qbpp.cons()` で書くこと
- 便の価値 $M - d_{u,v}$ の和で、便の数を増やすことを距離より優先する目的関数
- 羽田を含まない閉路を、見つけるたびに制約を加えて除き、前回の羽田を含む閉路を ABS3Solver にヒントとして渡す反復
- ダミーの空港を 1 つ加えて、出発と到着を決めない経路を求めること

文章での説明は[最多空港めぐり](LONGEST_FLIGHT)のページにあります。[動画（ケーススタディ）](../VIDEO_CASE_STUDIES)の一覧に戻る

結果だけを見たい方は、最後の[飛行機でたどる](#飛行機でたどる)の章から再生してください。

## 問題

{% include video_seek.html t="0:50" %}

- 2026 年の冬ダイヤの、基本的に毎日運航する国内線の直行便を使います。伊豆諸島を結ぶヘリコプターの便も含みます。
- 空港は 85、便は 458 あります。便は 1 つの向きを 1 便と数えます（羽田から伊丹と、伊丹から羽田は別の便）。
- 便を乗り継いで、同じ空港を 2 度通らずに、できるだけ多くの空港を回ります。空港の数が同じなら、総距離をできるだけ短くします。
- 必ず羽田空港から出発して羽田空港に戻る場合と、出発空港と到着空港を異なる任意の空港にできる場合の 2 つを考えます。
- 乗り継ぎの時刻（同じ日に乗り継げるか）は考えません。距離は 2 つの空港を結ぶ大圏距離で、キロメートル単位の整数に丸めます。

データの詳細は[最多空港めぐり](LONGEST_FLIGHT#データ)のページをご覧ください。

## 有向グラフ

{% include video_seek.html t="2:09" %}

- ほとんどの路線は両方の向きに便がありますが、奄美 → 与論と那覇 → 奄美は、逆の向きの便がありません。そこで、辺に向きのある有向グラフ $G=(V,E)$ で考えます。$V$ は空港の集合、$E$ は便の集合で、空港 $u$ から空港 $v$ への便を辺 $(u,v)$ と書きます。
- 便ごとにバイナリ変数 $x_{u,v}$ を用意し、1 ならその便に乗り、0 なら乗りません。変数は 458 個です。
- 空港 $v$ に着く便の変数の和を $\text{in}(v)$、出る便の変数の和を $\text{out}(v)$ とします。$v$ に着く回数と、$v$ から出発する回数です。

## 制約

{% include video_seek.html t="3:23" %}

羽田を $r$ と書き、次の 4 つの制約を課します。

$$
\begin{aligned}
\text{in}(v)&=\text{out}(v) && (v\in V)\\
\text{in}(v)&\leq 1 && (v\in V)\\
\text{in}(r)&=1\\
x_{u,v}+x_{v,u}&\leq 1 && ((u,v)\in E,\ (v,u)\in E)
\end{aligned}
$$

- 1 つ目は「着いた空港からは必ず出発する」、2 つ目は「同じ空港には 1 度しか着かない」です。この 2 つを満たすと、乗る便は空港を共有しないいくつかの閉路（出発した空港に戻ってくる輪の形の便のつながり）に分かれます。
- 3 つ目で、羽田を含む閉路がちょうど 1 つでき、これが答えになります。
- 往復の 2 便だけの閉路はどの路線にも作れてしまうので、4 つ目でまとめて除きます。
- 4 つの制約は `qbpp.cons()` で書きます。`qbpp.cons()` で書いた制約は、ソルバーが特別に扱い、制約を満たすように効率よく探索します。制約を破ると、重み × 違反量の 2 乗がペナルティとして加わります。

## 目的関数

{% include video_seek.html t="5:06" %}

- 閉路では、回る空港の数と乗る便の数は同じです。そこで、乗る便の数を最大にし、その中で総距離を最短にします。
- 便 $(u,v)$ の距離を $d_{u,v}$ とし、便に乗ることの価値を $w_{u,v} = M - d_{u,v}$ とします。$M$ は閉路の総距離より必ず大きい数です。
- $k$ 便の閉路で総距離が $D$ なら、価値の和は $kM - D$ です。便が 1 つ多い閉路は価値の和が必ず大きく、便の数が同じなら総距離が短いほど価値の和が大きくなります。
- $M$ は、空港ごとに「その空港に着く便の距離の最大値」を足して 1 を加えた値です。このデータでは $M = 69079$ です。
- 最小化するので価値の和の符号を反転し、制約には大きな定数 $P$（便の価値の総和に 1 を加えた値）を掛けて加えます。制約を 1 つでも破ると $P$ 以上損をするので、制約を破った解が最小になることはありません。

$$
f = -\sum_{(u,v)\in E}w_{u,v}x_{u,v} + P\cdot(\text{制約})
$$

## 羽田を含まない閉路

{% include video_seek.html t="7:05" %}

- ここまでの式を解くと、1 回目の解は、羽田を含む閉路が 7 便だけで、羽田を含まない閉路が 6 つありました。羽田を含まない閉路も 4 つの制約をすべて満たしています。
- 「乗る便が 1 つの閉路になる」という条件はグラフ全体にかかわるので、空港ごとの式では直接書けません。そこで、見つかった閉路を除く制約を加えます。
- 羽田を含まない閉路の空港の集合を $S$、$S$ の外から $S$ の空港に着く便の変数の和を $\text{enter}(S)$ として、$S$ の各空港 $v$ について次の制約を加えます。

$$
\text{enter}(S)\geq \text{in}(v)\quad (v\in S)
$$

- $S$ だけに乗る解は、$S$ に入る便がないのに $S$ の空港に着くので、この制約に違反します。羽田を含む閉路は $S$ の外にある羽田を通るので、$S$ の空港に着くなら、その前に $S$ の外から $S$ に入ります。答えが除かれることはありません。

詳しくは[最多空港めぐり](LONGEST_FLIGHT#羽田を含まない閉路を除く)のページをご覧ください。

## 反復とヒント

{% include video_seek.html t="8:40" %}

- どの閉路を除けばよいかは、解いてみないと分かりません。そこで、解く → 解を閉路に分ける → 羽田を含まない閉路があれば制約を加えてもう一度解く、を繰り返します。羽田を含まない閉路がなくなれば、羽田を含む閉路が答えです。
- 加えた制約は残るので、同じ閉路は 2 度と現れません。
- 2 回目からは、前回の羽田を含む閉路を[ヒント解](ABS3#solution-hint)として渡します。この閉路は新しく加えた制約も満たします。ABS3Solver はヒントよりエネルギーの高い解を返さないので、解のエネルギーはヒントのエネルギー以下になります。

## プログラム

{% include video_seek.html t="9:46" %}

[domestic_flights.csv](../../images/domestic_flights.csv) を、実行するディレクトリに置いて実行します。

```python
import csv
import pyqbpp as qbpp

airports = []      # 空港コード
flights = []       # 便 (出発, 到着, 距離)。1 つの向きの直行便
flight_index = {}  # (出発, 到着) から便の番号


def airport(code):
    if code not in airports:
        airports.append(code)
    return airports.index(code)


def add_flight(u, v, km):
    flight_index[(u, v)] = len(flights)
    flights.append((u, v, km))


# root を含み、同じ空港を 2 度通らない閉路で、
# 便の数が最大で、その中で総距離が最短のものを求める
def longest_trip(root):
    n, m = len(airports), len(flights)
    x = qbpp.var("x", shape=m)

    # 便の価値 M - km。M は閉路の総距離より必ず大きい
    max_in = [0] * n
    for u, v, km in flights:
        max_in[v] = max(max_in[v], km)
    M = sum(max_in) + 1
    obj = qbpp.sum([(M - km) * x[e] for e, (u, v, km) in enumerate(flights)])
    P = sum(M - km for u, v, km in flights) + 1  # 制約の重み: 便の価値の総和 + 1

    into = [0] * n
    out = [0] * n
    for e, (u, v, km) in enumerate(flights):
        into[v] += x[e]
        out[u] += x[e]
    c = 0
    for v in range(n):
        c += qbpp.cons(into[v] - out[v] == 0)  # 着いた空港からは出発する
        c += qbpp.cons(into[v] <= 1)           # 同じ空港には 1 度だけ
    c += qbpp.cons(into[root] == 1)  # root を通る
    for e, (u, v, km) in enumerate(flights):  # 同じ路線を往復しない
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
        if rnd > 1:  # 前回の root を含む閉路をヒントにする
            hint = qbpp.Sol(f)
            for a, b in zip(trip, trip[1:]):
                hint.set(x[flight_index[(a, b)]], 1)
        sol = solver.search(time_limit=5, hint=hint)

        # root から選んだ便をたどると root を含む閉路。残りは root を含まない閉路
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

        # 閉路の空港の集合 S ごとに: S の空港に着くなら、S の外から S に入る便に乗る
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

# 出発空港と到着空港を決めない経路: どの空港とも距離 0 の便で結ばれたダミーの空港 DMY を加える
dmy = airport("DMY")
for v in range(dmy):
    add_flight(dmy, v, 0)
    add_flight(v, dmy, 0)
print_trip(longest_trip(dmy))
```

- `airports` は空港コードのリストで、空港の番号はこの中の位置です。`flights` は（出発空港、到着空港、距離）のリスト、`flight_index` は空港の番号の組から便の番号を引く辞書です。プログラムの終わりで CSV ファイルを読み、`add_flight()` で便を加えます。
- `longest_trip(root)` が、空港 `root` を含む閉路を求めます。`x[e]` が 1 のとき、番号 `e` の便に乗ります。`obj` は選んだ便の価値の合計で、大きいほどよい目的関数です。
- `into` と `out` には、空港ごとに着く便と出る便の変数を足していきます（`in` は Python の予約語なので `into` にしています）。制約は `qbpp.cons()` で書いて `c` に足し、`f = -obj + P * c` を最小化します。
- 反復のループでは、毎回 `f` を `simplify_as_binary()` で整理して `ABS3Solver` を作り、`time_limit=5` で 5 秒探索します。2 回目からは、前回の `root` を含む閉路の便だけを 1 にした解をヒントにします。
- 解から、空港ごとに選ばれた便の到着空港を `nxt` に入れ、`root` からたどって `root` を含む閉路を、残りの空港からたどって `root` を含まない閉路（`cycles`）を求めます。`cycles` が空なら `root` を含む閉路を返し、そうでなければ閉路ごとに `enter - into[v] >= 0` を加えます。

## 羽田発着の結果

{% include video_seek.html t="13:17" %}

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

- `flights` は羽田を含む閉路の便の数、`other cycles` は羽田を含まない閉路の数です。
- 2 回目から 9 回目は羽田を含む閉路が 29 便、10 回目と 11 回目は 7 便に戻りますが、解のエネルギーは前回の羽田を含む閉路のエネルギー以下です。12 回目に羽田を含まない閉路がなくなりました。
- 得られた閉路は 33 空港・33 便・12,225 km で、最適解です（最適であることは別の方法で確かめました）。
- 探索は乱数を使うので、途中の解と反復の回数は実行ごとに変わります。逆の向きの閉路が表示されることもあります。

## 出発と到着を決めない経路

{% include video_seek.html t="14:54" %}

- ダミーの空港 `DMY` を加え、`DMY` と各空港の間に両方の向きの便を距離 0 で加えると、羽田発着と同じ問題になります。`DMY` を含む閉路から `DMY` との 2 便を除くと、ある空港 $s$ から $t$ への経路になります。
- `DMY` との便の価値は $M$ で、どの閉路も `DMY` との便にちょうど 2 つ乗るので、どの閉路が最良かは変わりません。
- プログラムの最後で `DMY` と `DMY` との便を加え、`root` を `DMY` として `longest_trip` をもう一度呼びます。

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

- 11 回目に `DMY` を含まない閉路がなくなりました。`flights = 41` は `DMY` との 2 便を含みます。
- 経路は新島から多良間までの 40 空港・39 便・11,853 km で、最適解です（最適であることは別の方法で確かめました）。羽田を含む閉路より 7 空港多く、総距離は短くなりました。
- 大島から三宅島、御蔵島、八丈島へは、ヘリコプターの便です。

## 飛行機でたどる

{% include video_seek.html t="16:54" %}

- 2 つの答えを、飛行機（伊豆諸島ではヘリコプター）でたどります。羽田を含む 33 便の閉路のあと、新島から多良間までの 39 便の経路です。
- 便名は毎日運航する便の一例で、乗り継ぎの時刻は考えていません。

## まとめ

{% include video_seek.html t="19:48" %}

- 最多空港めぐりを、有向グラフの問題として式にしました。4 つの制約は `qbpp.cons()` で書き、便の数と距離は 1 つの目的関数にまとめました。
- 羽田を含まない閉路は、見つけるたびに制約を加えて除きました。
- ダミーの空港を加えて、出発と到着を決めない経路も求めました。
