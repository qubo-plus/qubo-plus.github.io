---
last_modified: 2026-11-13
layout: default
nav_exclude: true
title: "Running on Multiple Nodes"
nav_order: 25
lang: en
hreflang_alt: "ja/MULTINODE"
hreflang_lang: "ja"
---

# Running on Multiple Nodes

> **This is an experimental feature.** How to use it and the items in `info` may change in future versions.

Easy Solver, ABS3 Solver, and Exhaustive Solver **can search with multiple nodes (computers)**.
Besides multi-node jobs on supercomputers, servers connected by a network (such as the GPU servers of a laboratory) can be used as well.
No change to the program is needed: run the program that works on one machine, only started in a different way.

Running on multiple nodes requires a **cluster license** (see [License](#license)).

## Supported solvers and how they use the nodes

| Solver | How the nodes are used |
|---|---|
| Easy Solver | Every node searches the same model, and the nodes share the good solutions they find |
| ABS3 Solver | Same as above; the GPUs of every node are used too |
| Exhaustive Solver | The nodes divide all assignments among themselves |

- With Easy Solver and ABS3 Solver, when a node finds a good solution, the other nodes continue their search from it.
  When any node reaches `target_energy`, the search ends on all nodes.
- Exhaustive Solver splits the enumeration into small ranges and hands them out to the nodes as they become free.
  Not only the best solution but also the results of `best_energy_sols`, `topk_sols`, and `all_sols` are merged over all nodes and returned in the same form as a run on one machine.
  The enumeration is divided for models with 25 or more binary variables. Smaller models and models with integer variables are solved on the node that runs the program.
- The same search parameters (such as `time_limit`) are used on all nodes.
- The callbacks of Easy Solver and ABS3 Solver are called on the node that runs the program, and `BestUpdated` also occurs for good solutions found by the other nodes.
- External solvers such as the MILP solvers use only the node that runs the program.

## Program

The following program finds all optimal solutions of [LABS](LABS) for $n=28$ with Exhaustive Solver.
It also runs as is on a single machine.

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/exhaustive_solver.hpp>

int main() {
  const int n = 28;

  auto s = qbpp::var("s", n);
  qbpp::Expr labs = 0;
  for (int d = 1; d < n; ++d) {
    qbpp::Expr temp = 0;
    for (int i = 0; i < n - d; ++i) {
      temp += s[i] * s[i + d];
    }
    labs += qbpp::sqr(temp);
  }
  labs.spin_to_binary();
  labs.simplify_as_binary();

  qbpp::MapList ml({{s[0], 1}, {s[1], 1}});
  auto f = qbpp::replace(labs, ml);
  f.simplify_as_binary();

  auto solver = qbpp::ExhaustiveSolver(f);
  auto sol = solver.search({{"best_energy_sols", 0}});
  std::cout << "LABS = " << sol.energy() << ", optimal solutions = " << sol.sols.size()
            << std::endl;
}
```
{% endraw %}
Output:
```
LABS = 50, optimal solutions = 2
```

Below, this program is compiled as `labs`.
The output appears only once, on the node that runs the program, and the results shown are merged over the search of all nodes.

## How to start

The program is the same; only the way it is started depends on the environment.

### Supercomputers with PBS

On supercomputers with a PBS-family job scheduler (Altair PBS Professional and OpenPBS), just run the program from a job script that uses several nodes.
QUBO++ finds the nodes assigned to the job and automatically starts, on the other nodes, the program that searches there (`qbpp-node`).

How to specify the number of nodes, the queue, and the group differs from one supercomputer to another.
The two scripts below are examples; check the queue names and other details in the guide of each center.

ABCI 3.0 (AIST; 4 nodes with 8 H200 GPUs each):

```bash
#!/bin/bash
#PBS -q rt_HF
#PBS -l select=4
#PBS -l walltime=01:00:00
#PBS -P <group>
cd $PBS_O_WORKDIR
export QBPP_LICENSE_KEY=C-XXXXXX-XXXXXX-XXXXXX-XXXXXX
./labs
```

Flow 2.0 Type II (Nagoya University; 4 nodes with 4 GB200 GPUs each):

```bash
#!/bin/bash -l
#PBS -q t2-small
#PBS -l select=4:mpiprocs=1
#PBS -l walltime=01:00:00
cd $PBS_O_WORKDIR
export QBPP_LICENSE_KEY=C-XXXXXX-XXXXXX-XXXXXX-XXXXXX
./labs
```

The compute nodes of Flow 2.0 are ARM (aarch64), so compile the program with the aarch64 version of QUBO++.
The compute nodes have no direct Internet access; the license server is reached through the proxy of the login nodes (see [Connecting Through a Proxy](LICENSE_MANAGEMENT#connecting-through-a-proxy)).

### Slurm and other job schedulers (not verified)

With job schedulers other than PBS, the nodes are not found and the workers are not started automatically.
Starting `qbpp-node --run` once on every node with `srun` or `mpirun` in the job script should make the search use multiple nodes.
This has not been verified on the Slurm of an actual supercomputer (it worked on a Slurm 21.08 test setup and with the `mpirun` of Open MPI).

```bash
#!/bin/bash
#SBATCH -N 4
#SBATCH --ntasks-per-node=1
#SBATCH -c 64
#SBATCH -t 01:00:00
export QBPP_LICENSE_KEY=C-XXXXXX-XXXXXX-XXXXXX-XXXXXX
srun qbpp-node --run ./labs
```

- The one with number 0 (`SLURM_PROCID` is 0) runs the program, and the others become its workers.
- The nodes meet in `~/.qbpp/cluster/<job id>` under the home directory. If the home directory is not shared, set `QBPP_CLUSTER_DIR` to a directory that all nodes can read and write.
- Make `qbpp-node` startable by the same name (or path) on every node.
- The number of threads on each node follows `-c` (`SLURM_CPUS_PER_TASK`).

### Servers connected by a network

On servers without a job scheduler, the server that runs the program starts the workers on the other servers with ssh.
Set the environment variable `QBPP_CLUSTER_HOSTS` to the servers to use, separated by commas, and run the program.

```bash
export QBPP_LICENSE_KEY=C-XXXXXX-XXXXXX-XXXXXX-XXXXXX
export QBPP_CLUSTER_HOSTS=server1,server2,server3
./labs
```

The search uses 4 machines: the server that runs the program and `server1` to `server3`.
The program does not need to be on the other servers.

- Make sure ssh to each server works without a password (`ssh server1` connects without asking for one).
- Install **the same version of QUBO++** on every server. The file systems do not need to be shared.
  x86_64 and aarch64 servers can be mixed.
- The workers are started with `ssh server1 qbpp-node …`. With QUBO++ installed by APT, `qbpp-node` is in `/usr/bin`.
  If the ssh command cannot find `qbpp-node`, set its path in the environment variable `QBPP_CLUSTER_NODE_CMD` (for example, `QBPP_CLUSTER_NODE_CMD=/opt/qbpp/bin/qbpp-node`).
- The other servers connect back to the server that runs the program over TCP (the port is chosen automatically).
  If a firewall or similar prevents connections to it from outside (for example, WSL on Windows), set `QBPP_CLUSTER_SSH_TUNNEL=1` to pass the communication through the ssh connections.

```bash
export QBPP_CLUSTER_SSH_TUNNEL=1
```

- Each server uses all of its GPUs. If someone else is using a GPU in Exclusive Process mode, the worker on that server stops with an error.

### Checking the nodes used

When the search uses multiple nodes, the `info` of the solution has the following items (they are absent on a single machine).
The per-node values are comma separated, in the same order as `node_hosts` (the node that runs the program first).

| Key | Meaning |
|---|---|
| `nodes` | The number of nodes used for the search |
| `node_hosts` | The host names of the nodes used |
| `best_node` | The number of the node that first found the best solution (0 is the node that runs the program) |
| `node_flip_counts` | The number of flips of each node (a measure of the work done; see below) |
| `node_cpu_flip_counts` / `node_gpu_flip_counts` | The CPU and GPU parts of the number of flips of each node |
| `node_tasks` | The number of ranges each node enumerated (Exhaustive Solver) |

A flip changes the value of one variable, moving one step to a neighboring assignment.
The number of flips is **a measure of the work done**: how far that node has advanced the search.
However, the time one flip takes (CPU or GPU, the size of the model) and how much one flip brings the search closer to good solutions (the search method) are not the same everywhere.
In human terms, it is like the number of tasks each person finished while working the same hours: the effort and the quality per task differ from person to person.
So the ratio of the counts is neither the ratio of the computation nor the ratio of the contributions to finding good solutions. The node that first found the best solution is given by `best_node`.

`flip_count`, `total_flip_count`, `cpu_flip_count`, and `gpu_flip_count` are the sums over all nodes.
With Exhaustive Solver, all nodes share the same kind of work, so the ratio of the per-node flip counts is exactly the ratio of the assignments each node enumerated.
The `flip_count` of Exhaustive Solver is the number of flips to walk through all assignments one bit at a time, which is $2^{\text{number of variables}}-1$ for a complete search.

```cpp
if (const char* nodes = sol.info("nodes")) std::cout << "nodes = " << nodes << std::endl;
```

### Solving on one node only

Setting the environment variable `QBPP_CLUSTER` to `0` makes the program solve on the node that runs it only, even in a multi-node job or with `QBPP_CLUSTER_HOSTS` set.

```bash
QBPP_CLUSTER=0 ./labs
```

## Requirements

On supercomputers with PBS:

- QUBO++ is available at the same path on all nodes (install it on a shared file system, or at the same location on every node).
  `qbpp-node` is included in the QUBO++ package.
- The home directory is shared by all nodes.
  The nodes meet through a file placed under the home directory (`~/.qbpp/cluster/`).
  If the home directory is not shared, set the environment variable `QBPP_CLUSTER_DIR` to a directory that all nodes can read and write.
- The nodes can communicate with each other over TCP.
- The `pbsdsh` command of the job scheduler is available (it is part of PBS).

On servers connected by a network, the requirements are those [described above](#servers-connected-by-a-network) (ssh and the same version of QUBO++).

If the multi-node run cannot be set up (for example, `qbpp-node` is not found, the other nodes do not join in time, or the QUBO++ versions differ), the program stops with an error that states the reason.
The output of the other nodes is kept in `node-<host name>.log` in a directory under `~/.qbpp/cluster/`.

## License

Running on multiple nodes requires the key of a **cluster license**, which starts with `C-`.

- One job (one run of the program) uses one seat. There is no limit on the number of nodes used.
- Only the node that runs the program connects to the license server. The other nodes do not need an Internet connection.
- Floating licenses, node-locked licenses, and Trial licenses can be used for runs on one node.
  Running on multiple nodes with one of these keys gives an error like the following when the solver is created (for a floating license).
  To solve on one node only, set `QBPP_CLUSTER=0`.

```
ExhaustiveSolver: multi-node runs need a cluster license: a floating license (F-...) runs on one node; multi-node runs need a cluster license (C-...). To solve on this node only, set QBPP_CLUSTER=0.
```

For details, see [License Management](LICENSE_MANAGEMENT#cluster-license).
