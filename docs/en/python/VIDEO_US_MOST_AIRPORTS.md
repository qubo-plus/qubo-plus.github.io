---
last_modified: 2026-11-19
layout: default
nav_exclude: true
title: "Video: Most Airports Tour of US Airlines"
description: "The points of each chapter of the video \"QUBO++ Case Study: Most Airports Tour of US Airlines (Python)\", with the programs shown in it and their output."
lang: en
hreflang_alt: "ja/python/VIDEO_US_MOST_AIRPORTS"
hreflang_lang: "ja"
video: us-most-airports
---

# Video: Most Airports Tour of US Airlines (Python)

A companion to the video "QUBO++ Case Study: Most Airports Tour of US Airlines (Python)".
For each chapter it gives the main points, the programs shown in the video with their output, and links to the pages that explain more.
Click "▶ Play the video from …" to play from that scene.

{% include video_embed.html slug="us-most-airports" %}

What the video covers:

- The daily nonstop flights of 7 US airlines
- Flights as arrows and the trip as one cycle through the starting airport, written as a single structural constraint `qbpp.cycle`
- An objective, the sum of the values $M - mi$ of the flights, that puts the number of flights before the distance
- The answers of the 7 airlines, and how they differ with the shape of the network (hub-and-spoke and point-to-point)

The same problem for domestic flights in Japan, solved with `qbpp.cons()`, is on the [Most Airports Tour](LONGEST_FLIGHT) page, and `qbpp.cycle` is explained on the [Structural Constraints](STRUCTURAL) page.
Back to the list of [Videos (Case Studies)](../VIDEO_CASE_STUDIES)

To see only the results, play from the chapter [Flying the Tours](#flying-the-tours).

## The Problem

{% include video_seek.html t="0:00" %}

- For each airline, we start from the airport of the city where it has its headquarters and come back to the same airport.
- We take only the nonstop flights the airline operates daily, and we may not pass through the same airport twice.
- We want the trip that visits as many airports as possible; among trips with the same number of airports, the shorter one.
- Connection times are not considered.

## Data

{% include video_seek.html t="1:10" %}

- We use the records of the domestic flights operated in August 2026, published by the US Bureau of Transportation Statistics (BTS). Flights of affiliated airlines are included.
- A pair of departure and arrival airports flown on 28 or more of the 31 days is called a daily flight. Distances are in miles.
- The data may differ from actual operations.

| Airline | Airports | Daily flights |
|---|---:|---:|
| United Airlines | 231 | 1,268 |
| American Airlines | 233 | 1,660 |
| Delta Air Lines | 209 | 1,364 |
| Southwest Airlines | 105 | 1,289 |
| Alaska Airlines / Hawaiian Airlines | 106 | 550 |
| JetBlue Airways | 67 | 324 |
| Frontier Airlines | 50 | 312 |

Each direction counts as one flight. Alaska Airlines and Hawaiian Airlines belong to the same group and are counted together in these data.

### The starting airports

{% include video_seek.html t="2:00" %}

The trip starts from the airport of the city where the airline has its headquarters.

| Airline | Starting airport |
|---|---|
| United Airlines | Chicago O'Hare (ORD) |
| American Airlines | Dallas/Fort Worth (DFW) |
| Delta Air Lines | Atlanta (ATL) |
| Southwest Airlines | Dallas Love Field (DAL) |
| Alaska Airlines / Hawaiian Airlines | Seattle (SEA) |
| JetBlue Airways | New York JFK (JFK) |
| Frontier Airlines | Denver (DEN) |

The flights of United Airlines gather at Chicago O'Hare, Denver, Houston and others. An airport where flights gather like this is called a hub airport.
Southwest Airlines has many flights that connect airports directly. This difference has a large effect on the answers.

## Variables and Constraints

{% include video_seek.html t="2:37" %}

- Airports are points and flights are arrows. Some flights are one-way, so the arrows have directions; a route with flights both ways is two arrows of opposite directions.
- Whether we take flight $k$ is a binary variable `x[k]`: 1 if we take it, 0 if not.
- A valid trip leaves the starting airport and comes back to it, has one arrow in and one arrow out at every airport it passes, and forms one loop (a cycle) as a whole. Two separate loops are not one trip.

### Writing it with cycle

{% include video_seek.html t="3:18" %}

- `arcs` is the list of arrows, each a (start, end, variable). `qbpp.cycle(arcs)` is the constraint that the arrows with value 1 form one cycle.
- `via` lists the vertices the cycle must pass. Here it is only the starting airport, `via=[hub]`; the other airports may or may not be visited.
- `length=(3, None)` makes the cycle have 3 or more arrows, to exclude a trip that just goes to another airport and back.
- `cycle` is a constraint with no weight: the solver searches while keeping the shape of a cycle, and the solution returned is always one cycle.

See [Structural Constraints](STRUCTURAL) for more.

## Objective Function

{% include video_seek.html t="4:00" %}

- In a cycle, the number of airports visited equals the number of flights taken. We first make the number of flights as large as possible, then the distance short.
- Each flight gets the value $M - mi$, where $mi$ is the flight's distance in miles. The value of a trip is the number of flights times $M$ minus the total distance.
- $M$ is larger than the total distance of any trip. Then a trip with one more flight has a larger value whatever the distances, and among trips with the same number of flights, the shorter one has the larger value.
- $M$ is 1 plus the sum, over the airports, of the longest flight arriving at each airport. Each airport is arrived at most once, so the total distance is smaller than this.
- We want the largest total value, so we minimize it with a minus sign.

## Program

{% include video_seek.html t="4:46" %}

The program takes the airline and the starting airport from the command line, and reads the departure and arrival airports and the distance (miles) of the flights from the CSV file `daily_<airline>.csv`.

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

- The airports get numbers `idx` from 0, and `M` is computed. There is one variable `x` per flight, and `w` is the array of the values $M - mi$ of the flights.
- `f` is the sum of minus the total value and `qbpp.cycle`. EasySolver searches for 10 seconds.
- From the flights that are 1 in the solution, `nxt` gives the next airport of each airport, and the trip is built by following it from the starting airport until it comes back.

The data of the 7 airlines (3 columns, `from,to,miles`):
[daily_UA.csv](../../images/us_flights/daily_UA.csv),
[daily_AA.csv](../../images/us_flights/daily_AA.csv),
[daily_DL.csv](../../images/us_flights/daily_DL.csv),
[daily_WN.csv](../../images/us_flights/daily_WN.csv),
[daily_AS.csv](../../images/us_flights/daily_AS.csv),
[daily_B6.csv](../../images/us_flights/daily_B6.csv),
[daily_F9.csv](../../images/us_flights/daily_F9.csv)

Save the program as `us_tour.py`, put the CSV files in the same directory, and run it as follows:

```bash
python3 us_tour.py UA ORD
python3 us_tour.py AA DFW
python3 us_tour.py DL ATL
python3 us_tour.py WN DAL
python3 us_tour.py AS SEA
python3 us_tour.py B6 JFK
python3 us_tour.py F9 DEN
```

## Answers of the 7 Airlines

The output in the video follows. Every answer equals the optimum confirmed by another method. The tour may be shown in the other direction, or another tour of the same distance may be shown.

### United Airlines

{% include video_seek.html t="5:37" %}

```
airports = 16  miles = 8364
ORD -> CID -> DEN -> ASE -> SFO -> MRY -> LAX -> PHX -> IAH -> FLL -> CLE -> MCO -> IAD -> RIC -> EWR -> DTW -> ORD
```

- Of the 231 airports with daily flights, 7% are visited.
- The flights gather at hubs such as Chicago O'Hare and Denver, and a cycle can pass each hub only once. Most regional airports are connected to only one or two hubs, so the trip goes from hub to hub with one regional airport in between.
- Starting from Denver gives the same cycle.

### American Airlines

{% include video_seek.html t="6:21" %}

```
airports = 25  miles = 8905
DFW -> LBB -> PHX -> LAS -> LAX -> DSM -> ORD -> CVG -> CLT -> GSO -> PHL -> MDT -> BOS -> ACK -> LGA -> MVY -> DCA -> ORF -> JFK -> PIT -> RDU -> BNA -> TPA -> MIA -> MSY -> DFW
```

- 11% of the 233 airports. Besides Dallas/Fort Worth and Chicago O'Hare, Charlotte, Philadelphia, Miami and others are hubs.
- On the East Coast, the trip also stops at the islands of Nantucket (ACK) and Martha's Vineyard (MVY).

### Delta Air Lines

{% include video_seek.html t="6:46" %}

```
airports = 28  miles = 11727
ATL -> BNA -> DCA -> MCO -> RDU -> TPA -> CVG -> EWR -> BOS -> ORF -> JFK -> MVY -> LGA -> CLE -> DTW -> GRR -> MSP -> GEG -> SEA -> BOI -> SLC -> SNA -> LAS -> SAN -> LAX -> PHX -> AUS -> MSY -> ATL
```

- 13% of the 209 airports. The trip passes hubs such as Detroit, Minneapolis and Salt Lake City, crosses the continent to the West Coast, and comes back to Atlanta.

### Southwest Airlines

{% include video_seek.html t="7:08" %}

```
airports = 50  miles = 22986
DAL -> OKC -> DEN -> COS -> LAS -> FAT -> SAN -> SBA -> SMF -> ONT -> SJC -> SNA -> OAK -> LIH -> OGG -> KOA -> HNL -> LGB -> RNO -> BUR -> SFO -> LAX -> TUS -> PHX -> ELP -> SAT -> HOU -> HRL -> AUS -> MSY -> TPA -> FLL -> MCO -> DJT -> ISP -> BWI -> PVD -> DCA -> CMH -> RSW -> IND -> MCI -> MKE -> STL -> OMA -> LGA -> MDW -> SDF -> BNA -> LIT -> DAL
```

- 48%, about half of the 105 airports. With many flights connecting airports directly, many airports are linked into one cycle without relying on hubs.
- The trip also visits 4 airports in Hawaii: from Oakland to Lihue, then Kahului and Kona, and from Honolulu back to Long Beach.
- Starting from Denver, one of the airports with the most flights, gives the same cycle.

### Alaska Airlines / Hawaiian Airlines

{% include video_seek.html t="7:45" %}

```
airports = 32  miles = 19487
SEA -> BLI -> PDX -> MFR -> LAX -> EUG -> BUR -> RDM -> SFO -> SNA -> GEG -> BOI -> SMF -> SAN -> SJC -> OGG -> KOA -> LIH -> HNL -> ONT -> STS -> LAS -> PAE -> PHX -> ANC -> CDV -> YAK -> JNU -> PSG -> WRG -> KTN -> SIT -> SEA
```

- 30% of the 106 airports. The trip flies from Phoenix to Anchorage, links small towns in Alaska one after another, and comes back to Seattle.
- It visits 8 airports in Alaska and 4 in Hawaii.

### JetBlue Airways

{% include video_seek.html t="8:14" %}

```
airports = 19  miles = 16913
JFK -> RSW -> HPN -> TPA -> FLL -> JAX -> SJU -> PHL -> BOS -> RIC -> MCO -> BUF -> LAX -> EWR -> DJT -> LGA -> ACK -> DCA -> MVY -> JFK
```

- 28% of the 67 airports. The trip visits many airports on the East Coast and also San Juan (SJU) in Puerto Rico. It crosses the continent from Buffalo to Los Angeles and comes back via Newark.

### Frontier Airlines

{% include video_seek.html t="8:36" %}

```
airports = 29  miles = 24502
DEN -> SLC -> PHX -> SAN -> SFO -> ONT -> SEA -> LAX -> ORD -> SJU -> MIA -> BWI -> IAH -> DTW -> DFW -> LGA -> CLT -> PHL -> RDU -> MCO -> MSY -> ATL -> CVG -> TPA -> CLE -> FLL -> IAD -> LAS -> ELP -> DEN
```

- 58% of the 50 airports, the highest ratio of the 7 airlines. Frontier Airlines also has many flights that connect airports directly.
- One leg flies from Chicago O'Hare to San Juan and back to Miami. The total distance is the longest of the 7 airlines.

## Comparison

{% include video_seek.html t="9:02" %}

| Airline | Starting airport | Airports visited | Total distance (miles) | Share of the airports |
|---|---|---:|---:|---:|
| United Airlines | ORD | 16 | 8,364 | 7% |
| American Airlines | DFW | 25 | 8,905 | 11% |
| Delta Air Lines | ATL | 28 | 11,727 | 13% |
| Southwest Airlines | DAL | 50 | 22,986 | 48% |
| Alaska Airlines / Hawaiian Airlines | SEA | 32 | 19,487 | 30% |
| JetBlue Airways | JFK | 19 | 16,913 | 28% |
| Frontier Airlines | DEN | 29 | 24,502 | 58% |

- The major airlines United, American and Delta visit only about 10% of their airports. When the flights gather at hubs (hub-and-spoke), each hub can be passed only once, which keeps the trip short.
- Southwest and Frontier visit about half. Their flights connect airports directly (point-to-point).
- Even with many airports, the number that can be visited changes greatly with how they are connected. A single cycle constraint shows this difference directly in the answers.

## Flying the Tours

{% include video_seek.html t="9:36" %}

The answers of the 7 airlines are followed by plane on the map. The flight number of each leg is the flight flown on the most days on that route. Connection times are not considered.

## Summary

{% include video_seek.html t="13:39" %}

- We found the most airports tour for 7 US airlines.
- Flights are arrows and the trip is a cycle, written with the structural constraint `qbpp.cycle`. The objective compares the number of flights first and the distance second.
- Solving once gave the optimal trip for every airline. The number of airports that can be visited changes greatly with the shape of the network.
