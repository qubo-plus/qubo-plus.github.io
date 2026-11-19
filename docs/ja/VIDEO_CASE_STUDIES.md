---
last_modified: 2026-10-23
layout: default
title: "動画（ケーススタディ）"
description: "QUBO++ のケーススタディ動画（YouTube）。具体的な問題を QUBO++ で解く例を、主に Python 版で紹介します。"
nav_order: 8.5
lang: ja
hreflang_alt: "en/VIDEO_CASE_STUDIES"
hreflang_lang: "en"
mode_shared: true
---

# 動画（ケーススタディ）

具体的な問題を QUBO++ で解く例を動画で紹介します。
1 本ごとに 1 つの問題を取り上げ、問題の定義、変数・制約・目的関数の決め方、プログラム、実行例を説明します。
文章での説明は活用事例のページ（[Python 版](python/CASE_STUDIES)・[C++ 版](CASE_STUDIES)）にあります。
動画は YouTube のチャンネル [QUBO++](https://www.youtube.com/@qubo-plus){:target="_blank" rel="noopener"} で公開していて、再生リスト [QUBO++ ケーススタディ（日本語）](https://www.youtube.com/playlist?list=PLPkWO7L7ZoQk){:target="_blank" rel="noopener"} にまとめています。
画像をクリックすると、このページで再生できます。
QUBO++ の使い方は[動画（チュートリアル）](VIDEOS)のページにあります。

<div class="video-list">
{%- assign cases = site.data.videos.episodes | where_exp: "ep", "ep.kind == 'case' and ep.hidden != true" -%}
{%- for ep in cases %}
{% include video_embed.html slug=ep.slug caption="full" %}
{%- endfor %}
</div>
