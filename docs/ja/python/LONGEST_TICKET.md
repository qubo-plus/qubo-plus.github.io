---
last_modified: 2026-11-12
layout: default
nav_exclude: true
title: "最長片道切符"
nav_order: 66
lang: ja
hreflang_alt: "en/python/LONGEST_TICKET"
hreflang_lang: "en"
---

# 最長片道切符
**最長片道切符**は、JR の片道乗車券 1 枚で乗れる、最も長い経路の切符です。
片道乗車券では、同じ区間を 2 度通れず、同じ駅も 2 度通れません。
ただし、最後の駅だけは、それまでに通った駅でもかまいません。
そのため、経路の形は次の 3 つの型のどれかになります：
- **L 型**: 同じ駅を通らない一本道
- **O 型**: 出発した駅に戻って終わる環状の経路
- **P 型**: 途中で通った駅に戻って終わる経路（一本道の先に環状の部分が付いた形）

このうち O 型は、最長になりません。
O 型が最長になりうるのは、輪がすべての駅を通る場合だけです。輪の上にない駅が 1 つでもあれば、路線網はつながっているので、輪の駅と隣り合う、輪の上にない駅があります。輪の駅からその駅へ 1 区間延ばし、その駅から出発して輪を 1 周する P 型の経路は、O 型より長くなります。
JR の路線網には、すべての駅を通る輪はないので、O 型は最長になりません。そこで、L 型と P 型の中で最も長い経路を求めます。

{% include video_embed.html slug="longest-ticket" %}

動画では、路線網をグラフにして区間をまとめ、変数と制約、離れた閉路を除く方法を説明し、プログラムで解いた経路を地図で出発から順にたどります。動画のプログラムと章ごとの説明は[動画：最長片道切符](VIDEO_LONGEST_TICKET)のページにあります。

参考にしたもの：
- 宮代隆平・葛西隆也「最長片道切符」『オペレーションズ・リサーチ』2004 年 1 月号、49 巻 1 号、pp.15–20（L・O・P 型の名前はこの文献による）
- 鵺「[最長片道切符の流儀とバリエーション](https://nue2004.info/railway/lop/)」

## データ
[jr_network.csv](../images/jr_network.csv) は、JR の路線網を、駅を頂点、駅と駅を結ぶ区間を辺とするグラフにしたものです。
2026 年 11 月に、Wikipedia の各路線の記事（[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)）と JR の旅客営業規則を独自に取得して作りました。
980 駅と 1,110 区間があり、1 行が 1 つの区間です：
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
営業キロと運賃計算キロの単位は km で、運賃計算キロは地方交通線の営業キロを 1.1 倍した値です（端数の処理はしていません）。
次のように作りました：
- JR の鉄道の路線だけを含めます。BRT や、JR から移管された第三セクターの路線は含めません。運休中の区間は含めます。
- 途中で枝分かれしない駅の並びは、まとめて 1 つの区間にします（規則の付いた区間はまとめません）。高崎線の新町・倉賀野間の北藤岡駅は八高線だけの駅なので、高崎線はこの駅で分けません。
- 経路は、区間の途中の駅で終わることもあります。たとえば大村線の新大村・早岐間を 1 本の区間にまとめると、新大村を経路のほかのところで通り、早岐から大村線に入って竹松で終わる経路が作れません。途中の駅で終わる経路は、隣の分岐駅の手前の駅（この例では竹松とハウステンボス）で終わるものだけを考えれば十分です（その先の駅まで行く方が長いからです）。そこで、まとめた区間 u−v ごとに、u から v の手前の駅までの区間と、v から u の手前の駅までの区間を加えます。この区間を**端の区間**と呼び、`端` の列が 1 です。駅2 で経路が終わります。
- 行き止まりの線（米子・境港間の境線など）には、端の区間を加えません。この線の駅は分岐駅を通らないとほかの路線とつながらないので、途中の駅で終わる経路は、終点まで行くほうが長くなります。
- 途中の駅が 1 つだけの並び（東海道本線の三島・函南・熱海など）は、まとめずに 2 本の区間のままにします。
- まとめた区間と、その端の区間 2 本は、同じ区間の駅を通るので、同時には 1 本しか使えません。`組` の列が同じ区間は、高々 1 本しか使えないことを表します。
- 新幹線は、旅客営業規則の第 16 条の 2 第 1 項と第 16 条の 3 で在来線と同じ線路とみなす区間には含めません（東京・熱海間も同じ扱いとしました）。第 16 条の 2 第 2 項の区間では、新幹線を含め、次の規則を付けます（品川・小田原間も同じ扱いとしました）。
- `規則` の列の `+g` と `-g` は、「`-g` の区間を全部使うなら、`+g` の区間を 1 本以上使う」ことを表します。第 16 条の 2 第 2 項（新幹線の区間を全部使うなら、同じ区間の在来線にも乗る）と、第 69 条（経路特定区間）をこの形で表します。大都市近郊区間や東京付近の運賃計算の特例（第 70 条など）は考えず、どの区間でも、実際にたどる経路の営業キロで距離を計算します。

## 定式化
区間 $e$ ごとにバイナリ変数 $x_e$ を導入し、$x_e=1$ はその区間を使うことを表します。
駅 $v$ で使う区間の本数を $\text{used}_v=\sum_{e\ni v}x_e$ とします（$e\ni v$ は駅 $v$ につながる区間 $e$ です）。
片道切符の経路では、駅で使う区間の本数は、通らない駅で 0、途中の駅で 2、経路の端の駅で 1、P 型で戻ってくる駅（**合流点**）で 3 です。
この本数を駅の**次数** $\deg_v$ として、駅の種類ごとに変数で表します。
駅は、つながる区間の本数（**接続数**）で次の 3 種類に分かれます：
- **分岐駅**（接続数 3 以上）: バイナリ変数 $s_v$（駅を通る）、$a_v$（経路の端）、$b_v$（合流点）を導入し、$\deg_v=2s_v-a_v+b_v$ とします。
- **中間駅**（接続数 2）: 使う区間は 2 本以下で合流点にならないので、$b_v=0$ として $\deg_v=2s_v-a_v$ とします。
- **葉駅**（接続数 1。行き止まりの線の終点と、端の区間の終わりの駅）: 使う区間は 0 本か 1 本なので変数を置かず、$\deg_v=x_e$（$e$ はつながる 1 本の区間）とします。

葉駅以外の駅には、次の制約を課します（葉駅では $\text{used}_v=\deg_v=x_e$ が常に成り立つので、制約は要りません）：

$$
\text{used}_v=\deg_v,\qquad a_v+b_v\le s_v\qquad(\text{葉駅以外の駅 } v)
$$

葉駅の集合を $T$ とすると、経路の端の個数は $\sum_{v\notin T}a_v+\sum_{v\in T}\deg_v$、合流点の個数は $\sum_{v\notin T}b_v$ です。
端と合流点の個数は、L 型で (2, 0)、P 型で (1, 1) なので、次の制約で 2 つの型をまとめて表せます：

$$
\sum_{v\notin T}a_v+\sum_{v\in T}\deg_v+\sum_{v\notin T}b_v = 2,\qquad \sum_{v\notin T}b_v \le 1
$$

データの組と規則から、次の制約も課します：

$$
\sum_{e\in G}x_e \le 1\quad(\text{各組 } G),\qquad
\sum_{e\in +g}x_e-\sum_{e\in -g}x_e \ge 1-k_g\quad(\text{各規則 } g)
$$

$k_g$ は `-g` の区間の本数です。
`-g` の区間を全部使うと $\sum_{e\in -g}x_e=k_g$ なので、`+g` の区間を 1 本以上使う必要があります。

目的関数は、使う区間の営業キロ $d_e$ の和を最大にするので、符号を反転して制約を重み $P$ で加えます：

$$
f = -\sum_e d_ex_e + P\cdot(\text{制約})
$$

制約は `qbpp.cons()` で宣言し、$P$ は全区間の営業キロの和に 1 を加えた値にします。
制約を満たす解のエネルギーは 0 以下で、制約を破る解のエネルギーは正になるので、制約を破った解が $f$ の最小になることはありません。

## 離れた閉路を除く
上の制約だけでは、経路のほかに、経路とつながらない閉路（**離れた閉路**）が解に混ざることがあります。
離れた閉路の駅も次数が 2 なので、制約をすべて満たします。
[最多空港めぐり](LONGEST_FLIGHT)と同じように、解いた結果を見て制約を加えることを繰り返します：

1. 制約を加えた $f$ を解く。
2. 解の区間を、つながった部分（成分）に分ける。成分が 1 つなら、それが経路。
3. 成分が 2 つ以上なら、離れた閉路（次数がすべて 2 の成分）$C$ ごとに制約を加えて、1 に戻る。

閉路 $C$ に加える制約は次のとおりです。
他の成分の駅を通らずに $C$ から行ける駅の集合を $S$ とし、両端が $S$ の駅である区間の営業キロの和を $w(S)$ とします。
$w(S)$ がこれまでに見つかった最良の経路の距離以下なら、$S$ の駅 $u$ ごとに次の制約を加えます：

$$
\text{visit}(u) \le \text{out}(S)\qquad(u\in S)
$$

$\text{visit}(u)$ は駅 $u$ を通ることを表す式（$s_u$ か、葉駅なら $x_e$）、$\text{out}(S)$ は $S$ の駅と $S$ の外の駅を結ぶ区間の変数の和です。
この制約は、「$S$ の駅を通るなら、$S$ の外とつながる区間を使う」ことを表し、$S$ の中で閉じた区間の選び方をすべて除きます。
$S$ の中だけで閉じた経路は $w(S)$ より長くなれず、これまでの最良の経路を超えないので、答えを除いてしまうことはありません。
$w(S)$ が最良の経路の距離より大きいときは、$S$ の中に最良より長い経路があるかもしれないので、$S$ の中をまとめて禁じると答えを除くおそれがあります。そこで、閉路 $C$ だけを禁じます。
$C$ の駅と $C$ の外の駅を結ぶ区間（$C$ の駅から外へ出る区間）の集合を $\delta(C)$、$C$ の区間の数を $\lvert C\rvert$ として、「同じ閉路 $C$ がもう一度現れるなら、$\delta(C)$ の区間を 1 本以上使う」という制約を加えます：

$$
\sum_{e\in C}x_e=\lvert C\rvert\ \Rightarrow\ \sum_{e\in\delta(C)}x_e\ge 1
$$

これを 1 本の不等式で書いたものが次の式です（$C$ の区間を 1 本でも使わなければ、何も制限しません）：

$$
\sum_{e\in C}x_e-\sum_{e\in\delta(C)}x_e\le \lvert C\rvert-1
$$

離れた閉路は外へ出る区間を使わないので、この制約に違反します。
一方、$C$ を P 型の輪として使う経路は、合流点から外へ出る区間を使うので、この制約を満たします。外へ出る区間を引くのは、このような経路を残すためです。

解の成分のうち端（次数 1 の駅）のあるものは、それだけで L 型か P 型の経路になりえます。
そこで、毎回の解の成分のうち、端があり規則を満たすものを経路の候補とし、最良の経路を記録します。
最良の経路は、次の回の[ヒント解](ABS3#solution-hint)として渡します。
ソルバーは時間を区切って探索するので、成分が 1 つになっても最良とは限りません。
そこで、成分が 1 つの解で最良の経路が 5 回続けて伸びなくなったら終わります。

## QUBO++ プログラム
[jr_network.csv](../images/jr_network.csv) を、実行するディレクトリに置いて実行します：
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
`sections` は区間（辞書）の一覧で、`incident[v]` は駅 `v` に接する区間の番号の一覧です。
`leaf[v]` は、駅 `v` が葉駅（接続数 1）であることを表します。
`used[v]` が駅 `v` で使う区間の本数、`visit[v]` が駅 `v` を通ることを表す式です。中間駅（接続数 2）の `b[v]` は、`replace()` で 0 にします。
規則 `g` の `+g` の区間の変数の和を `plus[g]`、`-g` の区間の変数の和を `minus[g]`、`-g` の区間の本数を `minus_count[g]` に入れます。

反復のループでは、毎回 `f` を簡約して ABS3 Solver を作り直し、10 秒探索します。
最良の経路があれば、その区間を使い、それ以外の区間を使わない解を作って、`search()` の `hint` に渡します。
解から使う区間を集め、つながった部分ごとに `parts` に入れます。
`rules_ok()` で規則を満たすか調べ、最良より長ければ、端の駅から区間をたどって経路の駅の列 `best_route` と区間の列 `best_sections` を作ります。
最後に、経路を、駅と線名を交互に並べて出力します（同じ線が続く区間はまとめます）。

## 結果
出力の例は次のとおりです：
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
`components` は解の成分の数、`best` はそれまでの最良の経路の営業キロです。
最初の解は多くの成分に分かれていますが、制約を加えるたびに成分が減り、13 回目に 1 本の経路になりました。

得られた経路は営業キロ 10,509.1 km（運賃計算キロ 10,796.5 km）の P 型で、これが最適値です（最適であることは別の方法で確認しました）。
長崎県の大村線の竹松を出発し、九州を回って門司から本州に入ります。
本州を回って新青森から北海道に入り、長万部から、札幌・旭川・網走・釧路・苫小牧を通る輪を 1 周して長万部に戻って終わります（輪を回る向きは実行ごとに変わります）。
四国には寄りません。四国は本州と茶屋町の 1 駅だけでつながっていて、入ると戻れないので、寄るなら四国が経路の端になります。端は 2 つしかなく、九州と北海道を端にするほうが長くなります。

<p align="center">
  <img src="../images/longest_ticket_route_ja.png" alt="竹松から長万部までの 10,509.1 km の最長片道切符の経路の地図" width="100%">
</p>

参考にした文献とページでは、北海道・四国・九州と本州を分けて解いていますが、ここでは全国をまとめて 1 つの問題として解きました。
ソルバーの探索は乱数を使うので、途中の解と反復の回数は実行ごとに変わります。
10,509.1 km の経路はほかにもあり、実行ごとに違う経路が出力されることがあります。
