---
last_modified: 2026-11-05
layout: default
title: "動画（ハンズオン）"
description: "QUBO++ のハンズオン動画（YouTube）の Python 版。ブラウザの Python Playground にプログラムを入力して実行し、結果を見てから機能を説明する、初心者向けのシリーズです。"
nav_order: 8.2
lang: ja
hreflang_alt: "en/python/VIDEO_HANDSON"
hreflang_lang: "en"
---

# 動画（ハンズオン）

ブラウザで動く [Python Playground](../demos/python-playground/) にプログラムを入力して実行し、結果を見てから機能を説明する、初心者向けのシリーズの Python 版です。
何もインストールせずに、動画と一緒に入力しながら進められます。
同じ内容の C++ 版は、[C++ 版のページ](../VIDEO_HANDSON)にあります。
動画は YouTube のチャンネル [QUBO++](https://www.youtube.com/@qubo-plus){:target="_blank" rel="noopener"} で公開していて、再生リスト [QUBO++ ハンズオン（日本語）](https://www.youtube.com/playlist?list=PLWWqCtwzLHGo){:target="_blank" rel="noopener"} に C++ 版と一緒にまとめています。
画像をクリックすると、このページで再生できます。
QUBO++ の使い方を体系的に説明する動画は[動画（チュートリアル）](../VIDEOS)、具体的な問題を解く例は[動画（ケーススタディ）](../VIDEO_CASE_STUDIES)のページにあります。

<div class="video-list">
{%- assign handson = site.data.videos.episodes | where_exp: "ep", "ep.kind == 'handson' and ep.mode == 'python' and ep.hidden != true" -%}
{%- for ep in handson %}
{% include video_embed.html slug=ep.slug caption="full" %}
{%- endfor %}
</div>
