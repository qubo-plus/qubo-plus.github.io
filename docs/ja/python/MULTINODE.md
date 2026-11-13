---
last_modified: 2026-11-13
layout: default
nav_exclude: true
title: "複数ノードでの実行"
nav_order: 25
lang: ja
hreflang_alt: "en/python/MULTINODE"
hreflang_lang: "en"
---

# 複数ノードでの実行

> **実験的な機能です。** 使い方や `info` に入る項目は、今後の版で変わることがあります。

Easy Solver・ABS3 Solver・Exhaustive Solver は、**複数のノード（計算機）を使って探索できます**。
スーパーコンピュータの複数ノードのジョブのほか、ネットワークでつながった複数のサーバー（研究室の GPU サーバーなど）も使えます。
プログラムを書き換える必要はありません。1 台のマシンで動くプログラムを、起動の仕方だけを変えて実行します。

複数ノードでの実行には**クラスタライセンス**が必要です（[ライセンス](#ライセンス)）。

## 対応するソルバーとノードの使い方

| ソルバー | ノードの使い方 |
|---|---|
| Easy Solver | 各ノードが同じモデルを探索し、見つけた良い解をノード間で教え合います |
| ABS3 Solver | 同上。各ノードの GPU も使います |
| Exhaustive Solver | すべての割り当てをノードで分担して調べます |

- Easy Solver と ABS3 Solver は、どこかのノードが良い解を見つけると、ほかのノードもその解から探索を続けます。
  `target_energy` に達したノードがあれば、すべてのノードの探索が終わります。
- Exhaustive Solver は、調べる範囲を小さく分けて、空いたノードに順に割り当てます。
  最良解だけでなく、`best_energy_sols`・`topk_sols`・`all_sols` の結果も全ノードの分をまとめて、1 台で実行したときと同じ形で返します。
  分担するのは 25 個以上の 2 値変数を持つモデルです。それより小さいモデルと整数変数を含むモデルは、プログラムを実行したノードだけで解きます。
- 探索パラメータ（`time_limit` など）は、すべてのノードに同じものが使われます。
- Easy Solver と ABS3 Solver のコールバックはプログラムを実行したノードで呼ばれ、ほかのノードが見つけた良い解でも `BestUpdated` が発生します。
- MILP ソルバーなどの外部ソルバーは、プログラムを実行したノードだけを使います。

## プログラム

次のプログラムは、[LABS](LABS) の $n=28$ のすべての最適解を Exhaustive Solver で求めます。
1 台のマシンでもそのまま実行できます。

```python
import pyqbpp as qbpp

n = 28

s = qbpp.var("s", shape=n)
labs = 0
for d in range(1, n):
    temp = 0
    for i in range(n - d):
        temp += s[i] * s[i + d]
    labs += qbpp.sqr(temp)
labs.spin_to_binary()
labs.simplify_as_binary()

ml = {s[0]: 1, s[1]: 1}
f = qbpp.replace(labs, ml)
f.simplify_as_binary()

solver = qbpp.ExhaustiveSolver(f)
result = solver.search(best_energy_sols=0)
print(f"LABS = {result.energy}, optimal solutions = {len(result.sols)}")
```
出力:
```
LABS = 50, optimal solutions = 2
```

以下では、このプログラムを `labs.py` として保存しておきます。
出力はプログラムを実行したノードの 1 つだけで、表示される結果は全ノードの探索をまとめたものです。

## 起動の仕方

プログラムは同じで、起動の仕方だけが環境によって違います。

### PBS のスーパーコンピュータ

PBS 系（Altair PBS Professional・OpenPBS）のジョブスケジューラを使うスーパーコンピュータでは、複数のノードを使うジョブスクリプトからプログラムを実行するだけです。
QUBO++ が、ジョブに割り当てられたノードを調べ、ほかのノードで探索を担当するプログラム（`qbpp-node`）を自動で起動します。

ノード数・キュー・利用グループの指定の書き方はスーパーコンピュータごとに違います。
次の 2 つは例で、キューの名前などは各センターの案内で確認してください。

ABCI 3.0（産業技術総合研究所、H200 × 8 のノードを 4 つ）:

```bash
#!/bin/bash
#PBS -q rt_HF
#PBS -l select=4
#PBS -l walltime=01:00:00
#PBS -P <利用グループ>
cd $PBS_O_WORKDIR
export QBPP_LICENSE_KEY=C-XXXXXX-XXXXXX-XXXXXX-XXXXXX
python3 labs.py
```

不老・弐 Type II（名古屋大学、GB200 × 4 のノードを 4 つ）:

```bash
#!/bin/bash -l
#PBS -q t2-small
#PBS -l select=4:mpiprocs=1
#PBS -l walltime=01:00:00
cd $PBS_O_WORKDIR
export QBPP_LICENSE_KEY=C-XXXXXX-XXXXXX-XXXXXX-XXXXXX
python3 labs.py
```

不老・弐の計算ノードは ARM（aarch64）です。PyQBPP は、計算ノードで初めて使うときに aarch64 用のライブラリを取得します。
計算ノードはインターネットに直接つながりませんが、ライセンスサーバーへはログインノードのプロキシ経由で接続します（[プロキシ経由の接続](../LICENSE_MANAGEMENT#プロキシ経由の接続)）。

### Slurm などのジョブスケジューラ（未確認）

PBS 以外のジョブスケジューラでは、ノードの検出とワーカーの起動を自動では行いません。
ジョブスクリプトの中で、`srun` や `mpirun` を使ってすべてのノードに `qbpp-node --run` を 1 つずつ起動すると、複数ノードで探索できるはずです。
実際のスーパーコンピュータの Slurm では確認していません（Slurm 21.08 の試験環境と Open MPI の `mpirun` では動作しました）。

```bash
#!/bin/bash
#SBATCH -N 4
#SBATCH --ntasks-per-node=1
#SBATCH -c 64
#SBATCH -t 01:00:00
export QBPP_LICENSE_KEY=C-XXXXXX-XXXXXX-XXXXXX-XXXXXX
srun qbpp-node --run python3 labs.py
```

- 番号が 0 の 1 つ（`SLURM_PROCID` が 0）がプログラムを実行し、ほかはそのワーカーになります。
- ノードどうしは、ホームディレクトリの下の `~/.qbpp/cluster/<ジョブ番号>` で待ち合わせます。ホームディレクトリが共有されていない場合は、すべてのノードが読み書きできるディレクトリを `QBPP_CLUSTER_DIR` に指定してください。
- `qbpp-node` は、すべてのノードで同じ名前（またはパス）で起動できるようにしておきます。
- 各ノードのスレッド数は、`-c`（`SLURM_CPUS_PER_TASK`）に合わせます。

### ネットワークでつながったサーバー

ジョブスケジューラのない複数のサーバーでは、プログラムを実行するサーバーから、ほかのサーバーへ ssh でワーカーを起動します。
使うサーバーを環境変数 `QBPP_CLUSTER_HOSTS` にコンマ区切りで指定して、プログラムを実行します。

```bash
export QBPP_LICENSE_KEY=C-XXXXXX-XXXXXX-XXXXXX-XXXXXX
export QBPP_CLUSTER_HOSTS=server1,server2,server3
python3 labs.py
```

プログラムを実行したサーバーと、`server1`〜`server3` の 4 台で探索します。
ほかのサーバーにプログラムを置く必要はありません。

- 各サーバーへ、パスワードなしで ssh できるようにしておきます（`ssh server1` がパスワードを聞かずにつながること）。
- 各サーバーに、**同じ版の PyQBPP**（または QUBO++）をインストールしておきます。ファイルシステムは共有していなくても構いません。
  x86_64 と aarch64 のサーバーを混ぜても使えます。
- ワーカーは `ssh server1 qbpp-node …` で起動します（Python は使いません）。
  pip でインストールした PyQBPP では、`qbpp-node` は `~/.cache/pyqbpp/<版>-<x86_64 または aarch64>/` にあり、そのサーバーで一度 PyQBPP を使うか `python3 -m pyqbpp download` を実行すると置かれます。
  このように ssh のコマンドで `qbpp-node` が見つからない場合は、パスを環境変数 `QBPP_CLUSTER_NODE_CMD` に指定します（例：版が 2026.11.13 の x86_64 のサーバーなら `QBPP_CLUSTER_NODE_CMD='~/.cache/pyqbpp/2026.11.13-x86_64/qbpp-node'`）。
- ほかのサーバーは、プログラムを実行したサーバーへ TCP でつなぎに来ます（ポートは自動で選びます）。
  ファイアウォールなどで外からつなげない場合（Windows の WSL など）は、`QBPP_CLUSTER_SSH_TUNNEL=1` を指定すると、通信を ssh の接続の中に通します。

```bash
export QBPP_CLUSTER_SSH_TUNNEL=1
```

- 各サーバーは自分の GPU をすべて使います。Exclusive Process モードの GPU をほかの人が使っていると、そのサーバーのワーカーはエラーで止まります。

### 使ったノードの確認

複数のノードで探索すると、解の `info` に次の項目が入ります（1 台で実行したときは入りません）。
ノードごとの値はコンマ区切りで、`node_hosts` と同じ順（先頭がプログラムを実行したノード）です。

| キー | 内容 |
|---|---|
| `nodes` | 探索に使ったノードの数 |
| `node_hosts` | 使ったノードのホスト名 |
| `best_node` | 最良解を最初に見つけたノードの番号（0 はプログラムを実行したノード） |
| `node_flip_counts` | 各ノードのフリップの回数（仕事量の目安、下の説明） |
| `node_cpu_flip_counts` / `node_gpu_flip_counts` | 各ノードのフリップの回数の CPU と GPU の内訳 |
| `node_tasks` | 各ノードが担当した範囲の数（Exhaustive Solver） |

フリップは、1 つの変数の値を反転して、隣の割り当てへ 1 歩進むことです。
フリップの回数は、そのノードがどれだけ探索を進めたかという**仕事量の目安**になります。
ただし、1 回のフリップにかかる時間（CPU か GPU か、モデルの大きさ）や、1 回のフリップが良い解に近づく度合い（探索の手法）は同じではありません。
人にたとえると、同じ時間働いて片づけた仕事の件数のようなもので、1 件あたりの手間や出来は人によって違います。
回数の比は、計算の重さの比でも、良い解を見つけることへの貢献の比でもありません。最良解を最初に見つけたノードは `best_node` でわかります。

`flip_count`・`total_flip_count`・`cpu_flip_count`・`gpu_flip_count` は、全ノードの合計になります。
Exhaustive Solver では、すべてのノードが同じ種類の仕事を分担するので、各ノードのフリップの回数の比が、そのまま分担した割り当ての割合です。
Exhaustive Solver の `flip_count` は、すべての割り当てを 1 ビットずつ反転してたどる回数で、最後まで調べると $2^{\text{変数の数}}-1$ です。

```python
print("nodes =", result.info.get("nodes", "1"))
```

### 1 つのノードだけで解く

環境変数 `QBPP_CLUSTER` を `0` にすると、複数ノードのジョブの中や `QBPP_CLUSTER_HOSTS` を指定した環境でも、プログラムを実行したノードだけで解きます。

```bash
QBPP_CLUSTER=0 python3 labs.py
```

## 実行の前提

PBS のスーパーコンピュータでは：

- PyQBPP が、すべてのノードから同じパスで使えること（共有ファイルシステムの仮想環境にインストールするか、各ノードの同じ場所にインストールします）。
  `qbpp-node` は PyQBPP に含まれています。
- ホームディレクトリがすべてのノードで共有されていること。
  ノードどうしは、ホームディレクトリの下（`~/.qbpp/cluster/`）に置くファイルで待ち合わせます。
  ホームディレクトリが共有されていない場合は、すべてのノードが読み書きできるディレクトリを環境変数 `QBPP_CLUSTER_DIR` に指定してください。
- ノードどうしが TCP で通信できること。
- ジョブスケジューラの `pbsdsh` コマンドが使えること（PBS に含まれています）。

ネットワークでつながったサーバーでは、[上の説明](#ネットワークでつながったサーバー)のとおりです（ssh・同じ版の PyQBPP）。

複数ノードの実行の準備ができないとき（`qbpp-node` が見つからない、ほかのノードが時間内に参加しない、QUBO++ の版が違うなど）は、理由を示すエラーで止まります。
ほかのノードの出力は、`~/.qbpp/cluster/` の下のディレクトリの `node-<ホスト名>.log` に残ります。

## ライセンス

複数ノードでの実行には、`C-` で始まる**クラスタライセンス**のキーが必要です。

- 1 つのジョブ（1 回のプログラムの実行）が 1 席を使います。使うノードの数に制限はありません。
- ライセンスサーバーに接続するのは、プログラムを実行したノードだけです。ほかのノードはインターネットに接続できなくても構いません。
- フローティングライセンス・ノードロックライセンス・Trial ライセンスは、1 つのノードでの実行に使えます。
  これらのキーで複数ノードで実行すると、ソルバーを作る時点で次のようなエラーになります（フローティングライセンスの場合）。
  1 つのノードだけで解く場合は、`QBPP_CLUSTER=0` を設定してください。

```
ExhaustiveSolver: multi-node runs need a cluster license: a floating license (F-...) runs on one node; multi-node runs need a cluster license (C-...). To solve on this node only, set QBPP_CLUSTER=0.
```

詳しくは[ライセンス管理](../LICENSE_MANAGEMENT#クラスタライセンス)を参照してください。
