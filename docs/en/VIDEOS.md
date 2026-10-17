---
last_modified: 2026-10-14
layout: default
title: "Videos"
description: "QUBO++ videos on YouTube: tutorials that show how to use it, and case studies that solve concrete problems, mostly in Python, plus an episode on C++."
nav_order: 8
lang: en
hreflang_alt: "ja/VIDEOS"
hreflang_lang: "ja"
mode_shared: true
---

# Videos

Videos that show how to use QUBO++ and how to apply it.
They are published on the YouTube channel [QUBO++](https://www.youtube.com/@qubo-plus){:target="_blank" rel="noopener"}.
Click an image to play the video on this page.

## Tutorials {#tutorials}

How to use QUBO++, step by step.
The first video, "QUBO++ Tutorial (Python)", covers everything in one go; the following videos each explain one topic in detail.
On YouTube they are in the playlist [QUBO++ Tutorials (English)](https://www.youtube.com/playlist?list=PLZ7uOpZs0RBc){:target="_blank" rel="noopener"}.

<div class="video-list">
{%- assign tutorials = site.data.videos.episodes | where_exp: "ep", "ep.kind != 'case'" -%}
{%- for ep in tutorials %}
{% include video_embed.html slug=ep.slug caption="full" %}
{%- endfor %}
</div>
{% assign cases = site.data.videos.episodes | where_exp: "ep", "ep.kind == 'case' and ep.hidden != true" -%}
{%- if cases.size > 0 %}
## Case Studies {#case-studies}

Concrete problems solved with QUBO++.
Each video takes one problem and covers its definition, the choice of variables, constraints and objective, the program, and an example run.
Written explanations are on the Case Studies page ([Python](python/CASE_STUDIES) / [C++](CASE_STUDIES)).
On YouTube they are in the playlist [QUBO++ Case Studies (English)](https://www.youtube.com/playlist?list=PLfqB5-ITJ0Yg){:target="_blank" rel="noopener"}.

<div class="video-list">
{%- for ep in cases %}
{% include video_embed.html slug=ep.slug caption="full" %}
{%- endfor %}
</div>
{%- endif %}
