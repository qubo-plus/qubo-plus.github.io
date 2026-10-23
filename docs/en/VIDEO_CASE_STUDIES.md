---
last_modified: 2026-10-23
layout: default
title: "Videos (Case Studies)"
description: "QUBO++ case-study videos on YouTube that solve concrete problems with QUBO++, mostly in Python."
nav_order: 8.5
lang: en
hreflang_alt: "ja/VIDEO_CASE_STUDIES"
hreflang_lang: "ja"
mode_shared: true
---

# Videos (Case Studies)

Videos that solve concrete problems with QUBO++.
Each video takes one problem and covers its definition, the choice of variables, constraints and objective, the program, and an example run.
Written explanations are on the Case Studies page ([Python](python/CASE_STUDIES) / [C++](CASE_STUDIES)).
They are published on the YouTube channel [QUBO++](https://www.youtube.com/@qubo-plus){:target="_blank" rel="noopener"} and collected in the playlist [QUBO++ Case Studies (English)](https://www.youtube.com/playlist?list=PLfqB5-ITJ0Yg){:target="_blank" rel="noopener"}.
Click an image to play the video on this page.
How to use QUBO++ is on the [Videos (Tutorials)](VIDEOS) page.

<div class="video-list">
{%- assign cases = site.data.videos.episodes | where_exp: "ep", "ep.kind == 'case' and ep.hidden != true" -%}
{%- for ep in cases %}
{% include video_embed.html slug=ep.slug caption="full" %}
{%- endfor %}
</div>
