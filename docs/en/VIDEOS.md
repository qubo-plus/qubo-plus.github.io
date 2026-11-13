---
last_modified: 2026-11-05
layout: default
title: "Videos (Tutorials)"
description: "QUBO++ tutorial videos on YouTube that show how to use it, mostly in Python, plus an episode on C++."
nav_order: 8
lang: en
hreflang_alt: "ja/VIDEOS"
hreflang_lang: "ja"
mode_shared: true
---

# Videos (Tutorials)

Videos that show how to use QUBO++, step by step.
The first video, "QUBO++ Tutorial (Python)", covers everything in one go; the following videos each explain one topic in detail.
They are published on the YouTube channel [QUBO++](https://www.youtube.com/@qubo-plus){:target="_blank" rel="noopener"} and collected in the playlist [QUBO++ Tutorials (English)](https://www.youtube.com/playlist?list=PLZ7uOpZs0RBc){:target="_blank" rel="noopener"}.
Click an image to play the video on this page.
Beginners can type along in the Playground with the Videos (Hands-on) pages, in [C++](VIDEO_HANDSON) and in [Python](python/VIDEO_HANDSON); videos that solve concrete problems are on the [Videos (Case Studies)](VIDEO_CASE_STUDIES) page.

<div class="video-list">
{%- assign tutorials = site.data.videos.episodes | where_exp: "ep", "ep.kind != 'case' and ep.kind != 'intro' and ep.kind != 'handson'" -%}
{%- for ep in tutorials %}
{% include video_embed.html slug=ep.slug caption="full" %}
{%- endfor %}
</div>
