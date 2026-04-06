---
layout: default
title: "Demos"
nav_order: 7
lang: en
hreflang_alt: "ja/DEMOS"
hreflang_lang: "ja"
---

# Demos

> **Note:** These demos run on AWS Lambda with limited resources.
> Performance is typically **several times slower** than a standard PC.
> On a modern desktop, QUBO++ runs significantly faster.

<style>
.demo-buttons { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0; }
.demo-btn {
  padding: 8px 16px; border: 2px solid #7253ed; border-radius: 6px;
  background: #fff; color: #7253ed; font-weight: 600; cursor: pointer;
  transition: all 0.15s;
}
.demo-btn:hover { background: #f0ecfd; }
.demo-btn.active { background: #7253ed; color: #fff; }
</style>

<div class="demo-buttons">
  <button class="demo-btn" onclick="switchDemo(this,'https://233dwj2zapcrsk6kvnlhwcc3gu0jydbw.lambda-url.ap-northeast-1.on.aws/')">C++ Playground</button>
  <button class="demo-btn" onclick="switchDemo(this,'https://3nsgxoub3dgwgfb3dk27oc7yqu0zmmog.lambda-url.ap-northeast-1.on.aws/')">Python Playground</button>
  <button class="demo-btn" onclick="switchDemo(this,'https://lsuxxbj2xmy5nrdnw7i53hxtiu0hazyg.lambda-url.ap-northeast-1.on.aws/')">N-Queens</button>
  <button class="demo-btn" onclick="switchDemo(this,'https://vk2x4g4ctfs3rpc2rhr6f5jnfy0meufu.lambda-url.ap-northeast-1.on.aws/')">TSP</button>
  <button class="demo-btn" onclick="switchDemo(this,'https://pwnweogwdi7ykfx2dzxwewa4li0kdslm.lambda-url.ap-northeast-1.on.aws/')">Graph</button>
  <button class="demo-btn" onclick="switchDemo(this,'https://zslnqahcvlwn4evozwbc5pyqyq0xyjzv.lambda-url.ap-northeast-1.on.aws/')">SAT</button>
  <button class="demo-btn" onclick="switchDemo(this,'https://lyooemld3a64tzvqeihjqz7pcq0pciyx.lambda-url.ap-northeast-1.on.aws/')">NAE-SAT</button>
</div>

<div id="demo-placeholder" style="width:100%; height:80vh; border:1px solid #ddd; border-radius:4px; display:flex; align-items:center; justify-content:center; color:#999; font-size:1.2rem;">
  Select a demo above to start
</div>

<iframe id="demo-frame" src="about:blank"
  style="width:100%; height:80vh; border:1px solid #ddd; border-radius:4px; display:none;">
</iframe>

<script>
function switchDemo(btn, url) {
  document.querySelectorAll('.demo-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('demo-placeholder').style.display = 'none';
  var frame = document.getElementById('demo-frame');
  frame.style.display = 'block';
  frame.src = url;
}
</script>
