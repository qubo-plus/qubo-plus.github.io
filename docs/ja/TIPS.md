---
layout: default
nav_exclude: true
title: "高速化のためのTips"
nav_order: 26
lang: ja
hreflang_alt: "en/TIPS"
hreflang_lang: "en"
---

# 高速化のための Tips

このページでは、効率的な QUBO++ プログラムを書くための一般的な注意点とベストプラクティスを紹介します。
QUBO++ は求解の前に式を記号的に構築するため、式の構築方法がパフォーマンスに大きく影響します。

## Tip 1: ループで式を構築する際は `= +` ではなく `+=` を使う

ループで項を累積する場合は、常に複合代入演算子 `+=` を使用してください：

```cpp
auto x = qbpp::var("x", n);
auto f = qbpp::Expr();

// ❌ 遅い: O(N²) — 毎回式全体をクローンする
for (int i = 0; i < n; ++i)
    f = f + x[i];

// ✅ 速い: O(N) — 既存の式にその場で追加する
for (int i = 0; i < n; ++i)
    f += x[i];
```

**理由：** `+` 演算子は、結果が別の変数に代入される可能性があるため（例：`g = f + x[i]`）、
新しい `Expr` オブジェクトを作成する必要があります。
そのため `f = f + x[i]` は毎回既存の全項をコピーし、合計で O(N²) のコストになります。
一方 `f += x[i]` はコピーなしで既存の式に直接追加します。

`-=` と `*=` についても同様です。

## Tip 2: `f * f` ではなく `sqr()` を使う

```cpp
auto f = x + y + z + 1;

// ❌ 遅い: f をクローンしてから汎用の乗算を行う
auto g = f * f;

// ✅ 速い: (c + t₁ + ... + tₙ)² をメモリ最適化された専用アルゴリズムで直接展開
auto g = qbpp::sqr(f);

// ✅ さらに速い: f をその場で二乗する（余分なコピーなし）
f.sqr();
```

**理由：** `sqr()` は必要なメモリ量を事前に正確に確保する専用の展開アルゴリズムを使用し、
中間的な再割り当てを一切行いません。

## Tip 3: `+=` の累積ではなく `sum()` を使う

```cpp
auto x = qbpp::var("x", n);

// ❌ 遅い: C++ 側から逐次的に式を構築する
auto f = qbpp::Expr();
for (int i = 0; i < n; ++i)
    f += x[i];

// ✅ 速い: 全要素の総和を .so 内の単一呼び出しで実行
auto f = qbpp::sum(x);
```

**理由：** `sum()` は共有ライブラリ内部で全要素を一括処理するため、
繰り返しの境界越え呼び出しのオーバーヘッドを回避できます。
さらに、サイズが大きい配列の場合、`sum()` は共有ライブラリ内部でマルチスレッド並列処理を
自動的に行うため、逐次ループでは得られない高速化が可能です。

## Tip 4: 要素ごとのループではなく Array 演算を使う

QUBO++ は Array 同士および Array とスカラーの演算をサポートしています。
要素ごとの明示的な `for` ループの代わりにこれらを使用してください：

```cpp
auto x = qbpp::var("x", n);
auto y = qbpp::var("y", n);

// ❌ 遅い: 要素ごとのループ、反復ごとに .so 呼び出し
auto diff = qbpp::expr(n);
for (int i = 0; i < n; ++i)
    diff[i] = x[i] - y[i];
auto penalty = qbpp::expr(n);
for (int i = 0; i < n; ++i)
    penalty[i] = qbpp::sqr(diff[i]);

// ✅ 速い: Array 演算、.so 内部で一括処理
auto diff = x - y;           // Array - Array
auto penalty = sqr(diff);    // sqr を Array 全体に適用
```

**理由：** Array 演算は共有ライブラリ内部で一括処理されるため、
要素ごとの境界越え呼び出しのオーバーヘッドを排除できます。
さらに、サイズが大きい配列の場合、これらの演算はマルチスレッド並列処理を
自動的に行うため、逐次ループに比べて大幅な高速化が可能です。

## Tip 5: `replace()` には全マッピングをまとめて渡す

```cpp
auto x = qbpp::var("x", n);
auto f = /* x を使った式 */;

// ❌ 遅い: O(N × M) — 全項を N 回走査し、各置換後に式が膨張する可能性がある
for (int i = 0; i < n; ++i)
    f.replace({% raw %}{{x[i], values[i]}}{% endraw %});

// ✅ 速い: O(M) — ハッシュマップで変数を検索し、全項を1回だけ走査
qbpp::MapList ml;
for (int i = 0; i < n; ++i)
    ml.push_back({x[i], values[i]});
f.replace(ml);
```

**理由：** `replace()` の各呼び出しは式の全項を走査し、新しい式を生成します。
1つのマッピングで N 回呼び出すと式が N 回走査され、さらに変数→式の置換後に式が膨張するため、
後の反復ほど処理が重くなります。
全マッピングをまとめて渡すと、ハッシュマップを使って1回の走査で全変数を同時に置換できます。

## Tip 6: `simplify()` は式の構築が完了してから呼ぶ

```cpp
// ❌ 非効率: 毎ステップで simplify する
for (int i = 0; i < n; ++i) {
    f += some_term;
    f.simplify_as_binary();  // 毎回 O(N log N) → 合計 O(N² log N)
}

// ✅ 効率的: 最後に1回だけ simplify する
for (int i = 0; i < n; ++i)
    f += some_term;
f.simplify_as_binary();  // O(N log N) を1回だけ
```

**理由：** `simplify()` は全項をソートして同類項をマージするため、O(N log N) のコストがかかります。
ループ内で呼び出すと合計で O(N² log N) の処理量になります。
simplify は通常、ソルバーに式を渡す直前に1回だけ必要です。

**例外：** `sqr()` や `*` のような重い演算が後に続く場合、
事前に simplify して項数を削減すると、全体の計算が劇的に速くなることがあります：

```cpp
auto x = qbpp::var("x");
auto f = qbpp::Expr();
for (size_t i = 1; i < 100; ++i)
    f += i * x;

// simplify なし: f は 99 項 (1*x + 2*x + ... + 99*x)
// sqr() は 99² ≈ 10000 項を展開する

f.simplify_as_binary();  // 同類項をマージして 1 項に: 4950*x

// simplify あり: sqr() は 1 項だけ展開 → 圧倒的に速い
f.sqr();
f.simplify_as_binary();
```

一般に、項数に依存するコストの高い演算（`sqr()`、乗算、`replace()` など）の前に
`simplify()` を呼ぶことで、同類項が多い場合に大幅な高速化が得られます。
