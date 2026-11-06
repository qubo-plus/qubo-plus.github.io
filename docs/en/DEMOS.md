---
last_modified: 2026-10-10
layout: default
title: "Demos & Playground"
description: "Try QUBO++ in your browser: C++ and Python Playgrounds, and demos that solve N-Queens, the traveling salesman problem, 22 graph problems, SAT, NAE-SAT, machine scheduling and shift scheduling as QUBO/HUBO models."
nav_order: 7
lang: en
hreflang_alt: "ja/DEMOS"
hreflang_lang: "ja"
mode_shared: true
---

# Demos & Playground

Try QUBO++ in your browser, with no installation.
Each demo opens in a new tab and has its own page that you can bookmark or share.

> **Note:** These demos run on AWS Lambda with limited resources.
> Performance is typically **several times slower** than a standard PC.
> On a modern desktop, QUBO++ runs significantly faster.

## Playgrounds

Write and run your own QUBO++ programs.

{% include demo_cards.html slugs="cpp-playground,python-playground" %}

## Problem demos

Set up a problem with the mouse and watch QUBO++ solve it.

{% include demo_cards.html slugs="n-queens,tsp,graph-problems,sat,nae-sat,machine-scheduling,shift-scheduling" %}
