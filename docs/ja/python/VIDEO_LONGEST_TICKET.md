---
last_modified: 2026-11-12
layout: default
nav_exclude: true
title: "動画：最長片道切符"
description: "動画「QUBO++ ケーススタディ 最長片道切符（Python）」の章ごとの要点と、動画に出てくるプログラムと出力。"
lang: ja
hreflang_alt: "en/python/VIDEO_LONGEST_TICKET"
hreflang_lang: "en"
video: longest-ticket
---

# 動画：最長片道切符（Python）

動画「QUBO++ ケーススタディ 最長片道切符（Python）」の手引きです。
章ごとに、要点と動画に出てくるプログラム・出力、詳しい説明のページへのリンクをまとめています。
「▶ 動画の … から再生」をクリックすると、その場面から再生します。

{% include video_embed.html slug="longest-ticket" %}

この動画で扱うこと：

- JR の路線網を、駅を頂点、区間を辺とするグラフで表し、枝分かれしない駅の並びを 1 つの区間にまとめること
- 区間ごとのバイナリ変数 $x$ と、駅ごとの変数 $s, a, b$ で駅の次数を $2s-a+b$ と表し、L 型と P 型の経路をまとめて式にすること
- 経路とつながらない閉路（離れた閉路）を、解くたびに制約を加えて除き、それまでの最良の経路を ABS3Solver にヒントとして渡す反復
- 得られた 10,509.1 km の経路を、地図で出発から順にたどること

文章での説明は[最長片道切符](LONGEST_TICKET)のページにあります。[動画（ケーススタディ）](../VIDEO_CASE_STUDIES)の一覧に戻る

結果だけを見たい方は、[結果](#結果)の章から再生してください。

## 最長片道切符とは

{% include video_seek.html t="0:42" %}

- 片道乗車券では、同じ区間も同じ駅も 2 度通れません。ただし、最後の駅だけは、それまでに通った駅でもかまいません。
- そのため、経路の形は、同じ駅を通らない一本道の **L 型**、出発した駅に戻って終わる **O 型**、途中で通った駅に戻って終わる **P 型**（一本道の先に輪が付いた形）のどれかになります。型の名前は、宮代隆平・葛西隆也「最長片道切符」（『オペレーションズ・リサーチ』2004 年 1 月号）によります。
- 最長片道切符は、この決まりを守る経路のうち、最も長いものです。距離には、運賃の計算のもとになる**営業キロ**を使います。

## 路線のグラフ

{% include video_seek.html t="1:43" %}

- 路線を、駅を頂点、駅と駅を結ぶ区間を辺とするグラフで表します。データは 2026 年 11 月に、Wikipedia の各路線の記事（路線・駅・営業キロ）と JR の旅客営業規則（経路の決まり）から独自に作りました。JR の鉄道の路線だけを使い、BRT や第三セクターの路線は含めません。運休中の区間は含めています。
- 北海道・四国・九州は、それぞれ本州と 1 つの駅（新青森・茶屋町・門司）だけでつながっています。同じ駅は 2 度通れないので、島に入ると本州には戻れず、島は経路の端にしか置けません。
- O 型が最長になりうるのは、輪がすべての駅を通るときだけです。輪の隣に駅が 1 つでもあれば、そこへ延ばした P 型のほうが長くなります。JR の路線網にすべての駅を通る輪はないので、L 型と P 型だけを考えれば十分です。

データの詳細は[最長片道切符](LONGEST_TICKET#データ)のページをご覧ください。

## 区間をまとめる

{% include video_seek.html t="3:08" %}

- 途中で枝分かれしない駅の並びは、まとめて 1 つの区間にします。枝分かれする駅を**分岐駅**と呼びます。画面の例は、大村線の新大村から早岐まで（間に 9 駅）です。
- まとめた区間だけでは、竹松で終わる経路（新大村を経路のほかのところで通り、早岐から大村線に入って竹松で終わる経路）が作れません。途中の駅で終わる経路は、隣の分岐駅の手前の駅（竹松とハウステンボス）で終わるものだけを考えれば十分です（その先まで延ばすほうが長いからです）。
- そこで、新大村からハウステンボスまでと、早岐から竹松までの 2 本を加えます。この区間を**端の区間**と呼びます。まとめた区間と 2 本の端の区間は同じ駅を通るので、3 本を 1 つの**組**にして、組の区間は高々 1 本とします。
- 行き止まりの線には、端の区間を加えません（終点まで行くほうが長いからです）。途中の駅が 1 つだけの並びは、まとめずに 2 本の区間のままにします。
- こうして、グラフは 980 駅・1,110 区間になりました。

## 規則

{% include video_seek.html t="4:57" %}

- 新幹線と、並行する在来線は、ふつうは同じ線路とみなされ、同じ区間を新幹線と在来線で通ると重複になります。ただし、区間の中の駅で乗り換えるときは、別の線路として扱われ、重複して通れます（旅客営業規則の第 16 条の 2 第 2 項）。この決まりも制約に組み込みます。
- 実際、あとで示す解は静岡・三島間を 2 回通ります。1 回目は新幹線で通り抜け、2 回目は身延線で富士に来て、在来線で沼津まで進みます（富士と沼津で乗り換えています）。
- 経路特定区間（第 69 条）などの決まりも、同じように制約にします。大都市近郊区間でも、実際にたどる経路の営業キロで距離を計算します。

データの `規則` の列の意味は、[最長片道切符](LONGEST_TICKET#データ)のページをご覧ください。

## 変数と次数

{% include video_seek.html t="6:03" %}

- 区間 $e$ ごとにバイナリ変数 $x_e$ を用意し、1 ならその区間を使います。
- 駅 $v$ ごとにバイナリ変数 $s_v$（駅を通る）、$a_v$（経路の端）、$b_v$（P 型で戻ってくる駅 = **合流点**）を用意し、$a_v+b_v\le s_v$ とします（葉駅には用意しません。次の章）。
- 駅で使う区間の本数 $\text{used}_v$ は、駅につながる区間の $x$ の和です。通らない駅で 0、途中の駅で 2、端の駅で 1、合流点で 3 です。
- L 型には端が 2 つ、O 型には端も合流点もなく、P 型には端と合流点が 1 つずつあります。

## 経路の型の式

{% include video_seek.html t="7:21" %}

- 駅の次数を $\deg_v=2s_v-a_v+b_v$ と表し、$\text{used}_v=\deg_v$ という制約を課します。$a_v+b_v\le s_v$ なので、次数は 0（通らない）、2（途中）、1（端）、3（合流点）のどれかになります。
- 端と合流点の個数は、L 型で (2, 0)、P 型で (1, 1) です。そこで「端と合流点の個数の和は 2」「合流点は高々 1 つ」とすると、L 型と P 型をまとめて表せます。
- つながる区間が 2 本の**中間駅**は合流点にならないので $b_v=0$ とします。つながる区間が 1 本だけの**葉駅**（行き止まりの線の終点と、端の区間の終わりの駅）には変数を置かず、つながる区間の $x$ を次数とし、そのまま端の個数に加えます。

式は[最長片道切符](LONGEST_TICKET#定式化)のページにあります。

## 目的関数

{% include video_seek.html t="8:59" %}

- 組の区間の変数の和は 1 以下、営業規則の決まりも区間の変数についての制約にします。
- 目的は、使う区間の営業キロの和を最大にすることです。QUBO++ は最小化するので、符号を反転します。
- 制約は `qbpp.cons()` で宣言し、重み $P$ を掛けて加えます。$P$ は全区間の営業キロの和に 1 を足した値です。制約を満たす解のエネルギーは 0 以下、1 つでも破るとエネルギーは正になるので、制約を破った解が最小になることはありません。

## 離れた閉路

{% include video_seek.html t="9:47" %}

- ここまでの制約だけでは、経路とつながらない輪（**離れた閉路**）が解に混ざることがあります。離れた閉路の駅も次数が 2 なので、制約をすべて満たします。
- 「1 本の経路になる」という条件は、駅ごとの式では書けません。そこで、解いて、解の区間をつながった部分（**成分**）に分け、成分が 2 つ以上なら離れた閉路を禁じる制約を加えて解き直す、を繰り返します。成分が 1 つなら、それが経路です。

## 閉路を禁じる制約

{% include video_seek.html t="10:46" %}

- 離れた閉路を $C$ とし、ほかの成分の駅を通らずに $C$ から行ける駅を集めて**地域** $S$ とします（画面の例は、広島県の閉路の周りの 32 駅）。$S$ の中の区間の営業キロの和を $w(S)$ とします。
- $S$ の中だけで閉じた経路は $w(S)$ より長くなれません。$w(S)$ が最良以下なら、「$S$ の駅を通るなら、$S$ の外とつながる区間を使う」という制約で、$S$ の中で閉じる区間の選び方をまとめて禁じます。外から $S$ に入って通り抜ける経路は、この制約を満たします。
- $w(S)$ が最良より長いときは、答えを除かないように閉路 $C$ だけを禁じます。$C$ の駅から外へ出る区間の集まりを $\delta(C)$ として、「同じ $C$ がまた現れるなら $\delta(C)$ の区間を 1 本以上使う」とします。P 型の輪は合流点から外へ出る区間を使うので、この制約を満たします。

式は[最長片道切符](LONGEST_TICKET#離れた閉路を除く)のページにあります。

## ヒントと止める条件

{% include video_seek.html t="12:20" %}

- 解の成分のうち、端があって営業規則の制約を満たすものは、それだけで経路の候補です。最も長いものを最良の経路として記録し、次に解くときに[ヒント解](ABS3#solution-hint)として渡します。ABS3Solver はヒントより悪い解を返しません。
- ソルバーは時間を区切って探索するので、成分が 1 つになっても最良の経路とは限りません。成分が 1 つの解で、最良が 5 回続けて伸びなければ終わりにします。

## プログラム

{% include video_seek.html t="12:59" %}

[jr_network.csv](../../images/jr_network.csv) を、実行するディレクトリに置いて実行します。

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

- `station()` は駅名から駅の番号を返す関数、`rules_ok()` は使う区間が営業規則の制約を満たすかを調べる関数です。
- CSV ファイルを読んで区間を `sections` に入れ、`incident` に駅に接する区間の番号を入れます。`leaf` は駅が葉駅かどうかです。
- `x`、`s`、`a`、`b` が変数です。`used` は駅で使う区間の本数、`distance` は使う区間の営業キロの和、`visit` は駅を通ることを表す式です。
- 葉駅では `used` をそのまま端の個数に加え、ほかの駅では `used` と次数の制約と、`a` と `b` の和の制約を加えます。続いて、端と合流点の個数の制約、組と営業規則の制約を `qbpp.cons()` で加えます。
- `f` は、距離の符号を反転して、制約に重み `P` を掛けて加えた式です。中間駅の `b` は、`replace()` で 0 にします。
- ループの中で、毎回 `f` を整理して `ABS3Solver` を作り、`time_limit=10` で 10 秒探索します。最良の経路があれば、その区間だけを使う解を作ってヒントにします。
- 解で使う区間を成分に分けて `parts` に入れ、制約を満たして最良より長い成分があれば、区間をたどって経路にします。成分が 1 つなら、最良が伸びたかどうかを数えて次の回に進みます。
- 成分が 2 つ以上なら、次数がすべて 2 の成分（離れた閉路）を探し、閉路から地域 $S$ を広げて $w(S)$ を求めます。$w(S)$ が最良以下なら地域 $S$ の制約を、そうでなければ閉路 $C$ の制約を `f` に加えます。
- 最後に、最良の経路を、線の名前と駅の名前で表示します。

## 結果

{% include video_seek.html t="15:06" %}

動画の出力です（経路の途中は省略しています）：

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

- `components` は解の成分の数、`best` はそれまでの最良の経路の営業キロです。
- 1 回目の解は 21 個の成分に分かれ、日本中に小さな輪が散らばっています。制約を加えるたびに成分が減り、12 回目に成分が 1 つになって 10,509.1 km の経路になりました。その後 5 回続けて伸びなかったので終わりました。回数や途中の解は、実行するたびに変わります。
- 経路は、長崎県の竹松を出発して九州を回り、筑豊の路線を通って門司から本州に入ります。中国地方では山陰と山陽の間を何度も行き来し、北陸新幹線で富山、高山本線で岐阜、紀伊半島を回って名古屋、中央本線と飯田線、静岡から新幹線で三島、身延線で富士、在来線で沼津、御殿場線で国府津と進んで首都圏に入ります。首都圏・房総半島・北関東・長野・新潟を回り、東北で太平洋側と日本海側を行き来しながら北へ進み、新青森から北海道新幹線で北海道に入ります。長万部から苫小牧・釧路・網走・旭川・札幌を回って、長万部に戻って終わる P 型の経路です。
- 四国には寄りません。四国に入ると戻れないので、寄るなら四国が経路の端になります。端は 2 つしかなく、九州と北海道を端にするほうが長くなるからです。
- 10,509.1 km が最長であることは、別の方法で確かめました。同じ長さの経路はほかにもあり、実行ごとに違う経路が出力されることがあります。

## まとめ

{% include video_seek.html t="17:54" %}

- 最長片道切符を QUBO++ で求めました。
- 区間を選ぶ変数と駅の次数の制約で、L 型と P 型をまとめて表しました。
- 離れた閉路は、解いた結果を見て、制約を加えながら除きました。
