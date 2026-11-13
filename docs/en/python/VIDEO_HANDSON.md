---
last_modified: 2026-11-05
layout: default
title: "Videos (Hands-on)"
description: "QUBO++ hands-on videos on YouTube, Python version: a series for beginners that types a program into the Python Playground in the browser, runs it, and explains what happened from the result."
nav_order: 8.2
lang: en
hreflang_alt: "ja/python/VIDEO_HANDSON"
hreflang_lang: "ja"
---

# Videos (Hands-on)

The Python version of a series for beginners: type a program into the [Python Playground](../demos/python-playground/) in your browser, run it, look at the result, and then learn what happened.
Nothing has to be installed, so you can type along with the videos.
The same episodes in C++ are on the [C++ version of this page](../VIDEO_HANDSON).
They are published on the YouTube channel [QUBO++](https://www.youtube.com/@qubo-plus){:target="_blank" rel="noopener"} and collected, together with the C++ version, in the playlist [QUBO++ Hands-on (English)](https://www.youtube.com/playlist?list=PLFxGEM72waNw){:target="_blank" rel="noopener"}.
Click an image to play the video on this page.
Videos that explain QUBO++ systematically are on the [Videos (Tutorials)](../VIDEOS) page, and videos that solve concrete problems are on the [Videos (Case Studies)](../VIDEO_CASE_STUDIES) page.

<div class="video-list">
{%- assign handson = site.data.videos.episodes | where_exp: "ep", "ep.kind == 'handson' and ep.mode == 'python' and ep.hidden != true" -%}
{%- for ep in handson %}
{% include video_embed.html slug=ep.slug caption="full" %}
{%- endfor %}
</div>
