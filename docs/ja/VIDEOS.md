---
last_modified: 2026-10-14
layout: default
title: "動画"
description: "QUBO++ の動画（YouTube）。入門として使い方を順に、活用事例として具体的な問題を解く例を、主に Python 版で紹介します。C++ 版の回もあります。"
nav_order: 8
lang: ja
hreflang_alt: "en/VIDEOS"
hreflang_lang: "en"
mode_shared: true
---

# 動画

QUBO++ の使い方と活用事例を動画で紹介しています。
動画は YouTube のチャンネル [QUBO++](https://www.youtube.com/@qubo-plus){:target="_blank" rel="noopener"} で公開しています。
画像をクリックすると、このページで再生できます。

## 入門 {#tutorials}

QUBO++ の使い方を順に説明します。
最初の「QUBO++ 入門（Python）」で全体をひととおり紹介し、そのあとの回で 1 つずつ詳しく説明します。
YouTube では再生リスト [QUBO++ 入門（日本語）](https://www.youtube.com/playlist?list=PLd4ZkJ2RrmHI){:target="_blank" rel="noopener"} にまとめています。

<div class="video-list">
{%- assign tutorials = site.data.videos.episodes | where_exp: "ep", "ep.kind != 'case'" -%}
{%- for ep in tutorials %}
{% include video_embed.html slug=ep.slug caption="full" %}
{%- endfor %}
</div>
{% assign cases = site.data.videos.episodes | where_exp: "ep", "ep.kind == 'case' and ep.hidden != true" -%}
{%- if cases.size > 0 %}
## 活用事例 {#case-studies}

具体的な問題を QUBO++ で解く例です。
1 本ごとに 1 つの問題を取り上げ、問題の定義、変数・制約・目的関数の決め方、プログラム、実行例を説明します。
文章での説明は活用事例のページ（[Python 版](python/CASE_STUDIES)・[C++ 版](CASE_STUDIES)）にあります。
YouTube では再生リスト [QUBO++ ケーススタディ（日本語）](https://www.youtube.com/playlist?list=PLPkWO7L7ZoQk){:target="_blank" rel="noopener"} にまとめています。

<div class="video-list">
{%- for ep in cases %}
{% include video_embed.html slug=ep.slug caption="full" %}
{%- endfor %}
</div>
{%- endif %}
