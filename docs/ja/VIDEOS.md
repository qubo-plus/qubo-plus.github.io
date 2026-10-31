---
last_modified: 2026-10-23
layout: default
title: "動画（チュートリアル）"
description: "QUBO++ のチュートリアル動画（YouTube）。使い方を主に Python 版で順に紹介します。C++ 版の回もあります。"
nav_order: 8
lang: ja
hreflang_alt: "en/VIDEOS"
hreflang_lang: "en"
mode_shared: true
---

# 動画（チュートリアル）

QUBO++ の使い方を動画で順に説明します。
最初の「QUBO++ 入門（Python）」で全体をひととおり紹介し、そのあとの回で 1 つずつ詳しく説明します。
動画は YouTube のチャンネル [QUBO++](https://www.youtube.com/@qubo-plus){:target="_blank" rel="noopener"} で公開していて、再生リスト [QUBO++ 入門（日本語）](https://www.youtube.com/playlist?list=PLd4ZkJ2RrmHI){:target="_blank" rel="noopener"} にまとめています。
画像をクリックすると、このページで再生できます。
具体的な問題を解く例は[動画（ケーススタディ）](VIDEO_CASE_STUDIES)のページにあります。

<div class="video-list">
{%- assign tutorials = site.data.videos.episodes | where_exp: "ep", "ep.kind != 'case' and ep.kind != 'intro'" -%}
{%- for ep in tutorials %}
{% include video_embed.html slug=ep.slug caption="full" %}
{%- endfor %}
</div>
