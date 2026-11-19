---
last_modified: 2026-11-19
layout: default
nav_exclude: true
title: "動画：アメリカの航空会社で最多空港めぐり"
description: "動画「QUBO++ ケーススタディ アメリカの航空会社で最多空港めぐり（Python）」の章ごとの要点と、動画に出てくるプログラムと出力。"
lang: ja
hreflang_alt: "en/python/VIDEO_US_MOST_AIRPORTS"
hreflang_lang: "en"
video: us-most-airports
---

# 動画：アメリカの航空会社で最多空港めぐり（Python）

動画「QUBO++ ケーススタディ アメリカの航空会社で最多空港めぐり（Python）」の手引きです。
章ごとに、要点と動画に出てくるプログラム・出力、詳しい説明のページへのリンクをまとめています。
「▶ 動画の … から再生」をクリックすると、その場面から再生します。

{% include video_embed.html slug="us-most-airports" %}

この動画で扱うこと：

- アメリカの 7 つの航空会社の、毎日運航の直行便のデータ
- 便を矢印、旅を出発の空港を通る 1 つの閉路として、構造制約 `qbpp.cycle` 1 つで書くこと
- 便の価値 $M - mi$ の和で、便の数を距離より優先する目的関数
- 7 社の答えと、路線網の形（ハブ・アンド・スポークとポイント・トゥ・ポイント）による違い

日本の国内線で同じ問題を `qbpp.cons()` で解く例は[最多空港めぐり](LONGEST_FLIGHT)のページ、`qbpp.cycle` の説明は[構造制約](STRUCTURAL)のページにあります。
[動画（ケーススタディ）](../VIDEO_CASE_STUDIES)の一覧に戻る

結果だけを見たい方は、[飛行機でたどる](#飛行機でたどる)の章から再生してください。

## 問題

{% include video_seek.html t="0:00" %}

- 航空会社ごとに、本社のある都市の空港から出発し、同じ空港に戻ってくる旅を考えます。
- 乗るのは、その会社が毎日運航している直行便だけです。途中で、同じ空港を 2 度通ることはできません。
- できるだけ多くの空港を回る旅を求めます。空港の数が同じなら、移動距離の短い旅を選びます。
- 乗り継ぎの時刻は考えません。

## データ

{% include video_seek.html t="1:22" %}

- アメリカ運輸統計局（BTS）が公開している、2026 年 8 月に運航した国内線の便の記録を使います。系列航空会社の便も含めます。
- 出発と到着の空港の組で、31 日のうち 28 日以上飛んだものを、毎日運航の便とします。距離の単位はマイルです。
- データは、実際の運航と違うことがあります。

| 航空会社 | 空港の数 | 毎日運航の便の数 |
|---|---:|---:|
| ユナイテッド航空 | 231 | 1,268 |
| アメリカン航空 | 233 | 1,660 |
| デルタ航空 | 209 | 1,364 |
| サウスウエスト航空 | 105 | 1,289 |
| アラスカ航空・ハワイアン航空 | 106 | 550 |
| ジェットブルー航空 | 67 | 324 |
| フロンティア航空 | 50 | 312 |

便は 1 つの向きを 1 便と数えます。アラスカ航空とハワイアン航空は同じグループで、このデータではまとめて数えられています。

### 出発の空港

{% include video_seek.html t="2:28" %}

旅の出発点は、その会社の本社がある都市の空港です。

| 航空会社 | 出発の空港 |
|---|---|
| ユナイテッド航空 | Chicago O'Hare（ORD） |
| アメリカン航空 | Dallas/Fort Worth（DFW） |
| デルタ航空 | Atlanta（ATL） |
| サウスウエスト航空 | Dallas Love Field（DAL） |
| アラスカ航空・ハワイアン航空 | Seattle（SEA） |
| ジェットブルー航空 | New York JFK（JFK） |
| フロンティア航空 | Denver（DEN） |

ユナイテッド航空の便は、Chicago O'Hare・Denver・Houston などに集まっています。このように便が集まる空港をハブ空港と呼びます。
サウスウエスト航空では、空港どうしを直接結ぶ便が目立ちます。この違いが、答えに大きく効いてきます。

## 変数と制約

{% include video_seek.html t="3:13" %}

- 空港を点、便を矢印で表します。片道だけの便もあるので矢印には向きがあり、往復の便がある区間は向きの違う 2 本の矢印です。
- 便 $k$ に乗るかどうかを、バイナリ変数 `x[k]` で表します。乗るなら 1、乗らないなら 0 です。
- 正しい旅は、出発の空港を出て出発の空港に戻り、通る空港では入る矢印と出る矢印が 1 本ずつで、全体が 1 つの輪（閉路）になります。輪が 2 つに分かれていると、1 つの旅になりません。

### cycle で書く

{% include video_seek.html t="4:00" %}

- `arcs` は、（始点、終点、変数）を並べた矢印のリストです。`qbpp.cycle(arcs)` は、値が 1 の矢印が 1 つの閉路になるという制約です。
- `via` には、閉路が必ず通る頂点を並べます。ここでは出発の空港だけなので `via=[hub]` で、ほかの空港は通っても通らなくてもかまいません。
- `length=(3, None)` は、閉路の矢印の数を 3 本以上にします。出発の空港とほかの空港を往復するだけの旅を除くためです。
- `cycle` は重みのない制約で、ソルバーは閉路の形を保ったまま探します。返ってくる解は、必ず 1 つの閉路です。

詳しくは[構造制約](STRUCTURAL)をご覧ください。

## 目的関数

{% include video_seek.html t="4:55" %}

- 閉路では、回った空港の数と乗った便の数が同じです。まず便の数をできるだけ多くし、次に距離を短くします。
- 便ごとに価値 $M - mi$ を付けます。$mi$ はその便の距離（マイル）です。旅の価値は、便の数に $M$ を掛けて総距離を引いた値です。
- $M$ はどんな旅の総距離よりも大きい数にします。すると、便が 1 本多い旅は総距離によらず価値が大きく、便の数が同じなら総距離の短い旅ほど価値が大きくなります。
- $M$ は、空港ごとに着く便の距離の最大値を足して 1 を加えた値です。どの空港にも着くのは 1 回までなので、総距離はこれより小さくなります。
- 価値の合計を最大にしたいので、マイナスを付けて最小化します。

## プログラム

{% include video_seek.html t="5:53" %}

コマンドラインで航空会社と出発の空港を受け取り、CSV ファイル `daily_<航空会社>.csv` から、便の出発と到着の空港、距離（マイル）を読みます。

```python
import csv
import sys
import pyqbpp as qbpp

airline, hub = sys.argv[1], sys.argv[2]
legs = [(r["from"], r["to"], int(r["miles"])) for r in csv.DictReader(open(f"daily_{airline}.csv"))]
airports = sorted({a for u, v, _ in legs for a in (u, v)})
idx = {a: i for i, a in enumerate(airports)}
M = 1 + sum(max((mi for _, v, mi in legs if v == a), default=0) for a in airports)

x = qbpp.var("x", shape=len(legs))
w = M - qbpp.array([mi for _, _, mi in legs])
arcs = [(idx[u], idx[v], x[k]) for k, (u, v, _) in enumerate(legs)]
f = -qbpp.sum(w * x) + qbpp.cycle(arcs, via=[idx[hub]], length=(3, None))
f.simplify_as_binary()

solver = qbpp.EasySolver(f)
sol = solver.search(time_limit=10.0)
nxt = {u: (v, mi) for k, (u, v, mi) in enumerate(legs) if sol(x[k]) == 1}
tour, a, total = [hub], hub, 0
while True:
    a, mi = nxt[a]
    tour.append(a)
    total += mi
    if a == hub:
        break
print("airports =", len(tour) - 1, " miles =", total)
print(" -> ".join(tour))
```

- 空港に 0 から始まる番号 `idx` を付け、`M` を計算します。変数 `x` は便ごとに 1 つ、`w` は便ごとの価値 $M - mi$ の配列です。
- `f` は、価値の合計にマイナスを付けた式と `qbpp.cycle` の和です。EasySolver で 10 秒探します。
- 解で 1 になった便から、空港ごとの次の空港 `nxt` を調べ、出発の空港からたどって戻るまでの旅を作ります。

7 社のデータ（`from,to,miles` の 3 列）：
[daily_UA.csv](../../images/us_flights/daily_UA.csv)・
[daily_AA.csv](../../images/us_flights/daily_AA.csv)・
[daily_DL.csv](../../images/us_flights/daily_DL.csv)・
[daily_WN.csv](../../images/us_flights/daily_WN.csv)・
[daily_AS.csv](../../images/us_flights/daily_AS.csv)・
[daily_B6.csv](../../images/us_flights/daily_B6.csv)・
[daily_F9.csv](../../images/us_flights/daily_F9.csv)

プログラムを `us_tour.py` として保存し、CSV ファイルを同じディレクトリに置いて、次のように実行します：

```bash
python3 us_tour.py UA ORD
python3 us_tour.py AA DFW
python3 us_tour.py DL ATL
python3 us_tour.py WN DAL
python3 us_tour.py AS SEA
python3 us_tour.py B6 JFK
python3 us_tour.py F9 DEN
```

## 7 社の答え

以下は動画での出力です。どれも別の方法で確かめた最適値と同じです。旅の向きや、距離が同じ別の旅が表示されることがあります。

### ユナイテッド航空

{% include video_seek.html t="6:56" %}

```
airports = 16  miles = 8364
ORD -> CID -> DEN -> ASE -> SFO -> MRY -> LAX -> PHX -> IAH -> FLL -> CLE -> MCO -> IAD -> RIC -> EWR -> DTW -> ORD
```

- 毎日運航の便がある 231 空港のうち、回れたのは 7% です。
- 便は Chicago O'Hare や Denver などのハブに集まっていて、閉路ではどのハブも 1 回しか通れません。地方の空港の多くは 1 つか 2 つのハブとしか結ばれていないので、旅はハブとハブの間に地方の空港を 1 つはさんで進みます。
- Denver から出発しても、同じ閉路になります。

### アメリカン航空

{% include video_seek.html t="7:49" %}

```
airports = 25  miles = 8905
DFW -> LBB -> PHX -> LAS -> LAX -> DSM -> ORD -> CVG -> CLT -> GSO -> PHL -> MDT -> BOS -> ACK -> LGA -> MVY -> DCA -> ORF -> JFK -> PIT -> RDU -> BNA -> TPA -> MIA -> MSY -> DFW
```

- 233 空港のうち 11% です。Dallas/Fort Worth や Chicago O'Hare のほか、Charlotte・Philadelphia・Miami などもハブです。
- 東海岸では、Nantucket（ACK）や Martha's Vineyard（MVY）の島にも寄ります。

### デルタ航空

{% include video_seek.html t="8:17" %}

```
airports = 28  miles = 11727
ATL -> BNA -> DCA -> MCO -> RDU -> TPA -> CVG -> EWR -> BOS -> ORF -> JFK -> MVY -> LGA -> CLE -> DTW -> GRR -> MSP -> GEG -> SEA -> BOI -> SLC -> SNA -> LAS -> SAN -> LAX -> PHX -> AUS -> MSY -> ATL
```

- 209 空港のうち 13% です。Detroit・Minneapolis・Salt Lake City などのハブを通り、西海岸まで大陸を横断して Atlanta に戻ってきます。

### サウスウエスト航空

{% include video_seek.html t="8:40" %}

```
airports = 50  miles = 22986
DAL -> OKC -> DEN -> COS -> LAS -> FAT -> SAN -> SBA -> SMF -> ONT -> SJC -> SNA -> OAK -> LIH -> OGG -> KOA -> HNL -> LGB -> RNO -> BUR -> SFO -> LAX -> TUS -> PHX -> ELP -> SAT -> HOU -> HRL -> AUS -> MSY -> TPA -> FLL -> MCO -> DJT -> ISP -> BWI -> PVD -> DCA -> CMH -> RSW -> IND -> MCI -> MKE -> STL -> OMA -> LGA -> MDW -> SDF -> BNA -> LIT -> DAL
```

- 105 空港のうち、約半分の 48% を回れます。空港どうしを直接結ぶ便が多いので、ハブにたよらずに多くの空港を 1 つの閉路でつなげます。
- 途中でハワイの 4 つの空港も回ります。Oakland から Lihue に飛び、Kahului・Kona と進んで、Honolulu から Long Beach へ戻ります。
- 便がいちばん多い空港の 1 つ、Denver から出ても同じ閉路になります。

### アラスカ航空・ハワイアン航空

{% include video_seek.html t="9:23" %}

```
airports = 32  miles = 19487
SEA -> BLI -> PDX -> MFR -> LAX -> EUG -> BUR -> RDM -> SFO -> SNA -> GEG -> BOI -> SMF -> SAN -> SJC -> OGG -> KOA -> LIH -> HNL -> ONT -> STS -> LAS -> PAE -> PHX -> ANC -> CDV -> YAK -> JNU -> PSG -> WRG -> KTN -> SIT -> SEA
```

- 106 空港のうち 30% です。Phoenix から Anchorage へ飛び、アラスカの小さな町を順につないで Seattle へ戻ります。
- アラスカの空港を 8 つ、ハワイの空港を 4 つ回ります。

### ジェットブルー航空

{% include video_seek.html t="9:57" %}

```
airports = 19  miles = 16913
JFK -> RSW -> HPN -> TPA -> FLL -> JAX -> SJU -> PHL -> BOS -> RIC -> MCO -> BUF -> LAX -> EWR -> DJT -> LGA -> ACK -> DCA -> MVY -> JFK
```

- 67 空港のうち 28% です。東海岸の空港を多く回り、プエルトリコの San Juan（SJU）にも寄ります。Buffalo から Los Angeles へ大陸を横断し、Newark へ戻ります。

### フロンティア航空

{% include video_seek.html t="10:22" %}

```
airports = 29  miles = 24502
DEN -> SLC -> PHX -> SAN -> SFO -> ONT -> SEA -> LAX -> ORD -> SJU -> MIA -> BWI -> IAH -> DTW -> DFW -> LGA -> CLT -> PHL -> RDU -> MCO -> MSY -> ATL -> CVG -> TPA -> CLE -> FLL -> IAD -> LAS -> ELP -> DEN
```

- 50 空港のうち 58% を回れ、7 社の中でいちばん高い割合です。フロンティア航空も、空港どうしを直接結ぶ便が多い会社です。
- Chicago O'Hare から San Juan へ飛び、Miami へ戻る区間もあります。総距離は 7 社でいちばん長くなりました。

## くらべる

{% include video_seek.html t="10:52" %}

| 航空会社 | 出発の空港 | 回った空港 | 総距離（マイル） | 空港の数に対する割合 |
|---|---|---:|---:|---:|
| ユナイテッド航空 | ORD | 16 | 8,364 | 7% |
| アメリカン航空 | DFW | 25 | 8,905 | 11% |
| デルタ航空 | ATL | 28 | 11,727 | 13% |
| サウスウエスト航空 | DAL | 50 | 22,986 | 48% |
| アラスカ航空・ハワイアン航空 | SEA | 32 | 19,487 | 30% |
| ジェットブルー航空 | JFK | 19 | 16,913 | 28% |
| フロンティア航空 | DEN | 29 | 24,502 | 58% |

- 大手のユナイテッド・アメリカン・デルタは、1 割前後しか回れません。便がハブに集まる形（ハブ・アンド・スポーク）では、どのハブも 1 回しか通れないことが旅を短くします。
- サウスウエストとフロンティアは、半分前後を回れます。空港どうしを直接結ぶ形（ポイント・トゥ・ポイント）です。
- 空港の数が多くても、つながり方で回れる数は大きく変わります。閉路の制約 1 つで、この違いが答えにそのまま表れました。

## 飛行機でたどる

{% include video_seek.html t="11:37" %}

7 社の答えの旅を、地図の上で飛行機でたどります。便名は、その区間でいちばん多くの日に飛んだ便です。乗り継ぎの時刻は考えていません。

## まとめ

{% include video_seek.html t="15:44" %}

- アメリカの 7 つの航空会社で、最多空港めぐりの旅を求めました。
- 便を矢印、旅を閉路として、構造制約 `qbpp.cycle` で書きました。目的関数は、便の数を先に、距離を後にくらべる形にしました。
- 1 回解くだけで、どの会社でも最適な旅が得られました。回れる空港の数は、路線網の形で大きく変わりました。
