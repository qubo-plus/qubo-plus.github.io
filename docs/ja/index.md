---
layout: default
title: "Home"
nav_order: 1
lang: ja
hreflang_alt: "en/index"
hreflang_lang: "en"
---

# QUBO++: QUBO/HUBOによる組合せ最適化のためのモデリング・求解フレームワーク

**QUBO++** は、組合せ最適化問題をバイナリ変数の多項式（QUBO/HUBO）として定式化・求解するフレームワークです。

- **C++ と Python** — C++（[QUBO++](DOCUMENT)）でもPython（[PyQBPP](python/)）でも使えます。
- **シンボリックDSL** — 行列のインデックスではなく、数式を書くように最適化モデルを構築。自然なforループで制約を記述することも、ベクトル演算でループなしに記述することもできます。
- **簡単インストール** — C++は `sudo apt install qbpp`、Pythonは `pip install pyqbpp`。ソースからのビルドは不要です。
- **次数無制限のHUBO** — 二次だけでなく任意の次数の高次項をサポート。否定リテラル（`~x`）をネイティブにサポートし、$\overline{x}$ を $1-x$ に置き換えることによる項数爆発を回避します。
- **GPU加速** — 内蔵のABS3ソルバーがGPUリソースをフル活用して並列探索を実行。マルチGPUにも対応。Exhaustive SolverもCUDA GPUを自動的に使用します。
- **CPU並列加速** — すべてのソルバーがマルチコアCPU上でマルチスレッド並列実行されます。
- **任意精度の整数係数** — ビット数に上限のない整数係数を扱えます。16ビットから数千桁まで、オーバーフローの心配なく計算可能。
- **3つの内蔵ソルバー** — Easy Solver（高速ヒューリスティック）、Exhaustive Solver（最適性保証付き完全探索）、ABS3（GPU+CPUヒューリスティック）。
- **どこでも実行** — Raspberry PiからノートPC、GPUサーバー、スーパーコンピュータまで。amd64 (x86_64) および arm64 Linux で利用可能。

# QUBO++ ソルバー: Easy Solver, Exhaustive Solver, ABS3 Solver
## Easy Solver
* **QUBO/HUBO に最適化されたヒューリスティックソルバー**: マルチコア CPU 上で QUBO/HUBO モデルの解を探索します。
* **マルチスレッド加速**: マルチコアCPU上で並列探索。
* **任意精度の整数係数**: 任意の大きさの整数係数をサポート。

## Exhaustive Solver
* マルチコア CPU と CUDA GPU 上で QUBO/HUBO 定式化の**全解を列挙**します。
* **最適性保証**: 大域最適解が発見・証明されます。
* **マルチスレッド加速**: マルチコアCPU上で並列探索。
* **任意精度の整数係数**: 任意の大きさの整数係数をサポート。
* **GPU 加速**: CUDA GPU が利用可能な場合、GPU ワーカーが CPU スレッドと並行して探索に参加します。128ビット整数までの係数で GPU 加速が利用可能で、それ以上の係数は CPU のみで実行されます。

## ABS3 Solver
* **マルチコア CPU と CUDA GPU 上のヒューリスティックソルバー**: CPU スレッドと CUDA GPU の両方を使用して QUBO/HUBO インスタンスの解を探索します。
* **任意精度の整数係数**: 任意の大きさの整数係数をサポート。
* **マルチ GPU スケーリング**: Linux ホスト上の検出されたすべての GPU を使用。128ビット整数までの係数で GPU 加速が利用可能で、それ以上の係数は CPU のみで実行されます。

### **ABS3 対応 GPU アーキテクチャ**
  - **sm_80** : NVIDIA A100 (Ampere)
  - **sm_86** : NVIDIA RTX A6000, GeForce RTX 3090/3080/3070 (Ampere)
  - **sm_89** : NVIDIA RTX 6000 Ada, GeForce RTX 4090/4080/4070 (Ada)
  - **sm_90** : NVIDIA H100 / H200 / GH200 (Hopper)
  - **sm_100** : NVIDIA B200 / GB200 (Blackwell, データセンター)
  - **sm_120** : GeForce RTX 5090/5080/5070(Ti)/5060(Ti)/5050、RTX PRO 6000/5000/4500/4000/2000 Blackwell (ワークステーション)
  - **検証について**: 上記アーキテクチャの一部のみが実機で検証済みです。

### **性能に関する注意**
  - パフォーマンスを最大化するため、算術オーバーフローチェックは省略されています。

## ビルド環境
以下の環境を使用して QUBO++ をビルドしています。
**QUBO++ は Ubuntu 20.04 に限定されません**。Ubuntu 22.04/24.04 およびその他の Linux ディストリビューション（CentOS/RHEL系を含む）でもテスト済みです。
互換性を確保するため、以下のコンポーネントと同じかそれ以降のバージョンをお使いください。
- **オペレーティングシステム**: Ubuntu 20.04.6 LTS
- **C++ 標準**: C++17
- **glibc**: 2.31
- **コンパイラ**: g++ 9.4.0
- **Boost**: 1.81.0
- **CUDA**: 12.8

# QUBO++ ライセンス

QUBO++ はライセンスキーなしで使用できます。
ライセンスキーが設定されていない場合、**Anonymous Trial**（7日間、1,000変数）が自動的に有効になり、すぐに QUBO++ を試すことができます。

ライセンスの有効化、ライセンスの種類、条件の詳細は **[License Management](LICENSE_MANAGEMENT)** をご覧ください。

# サードパーティライブラリ

- **Boost C++ Libraries**
  - Boost Software License, Version 1.0 の下でライセンスされています。
  - 詳細は <https://www.boost.org/LICENSE_1_0.txt> をご覧ください。

- **xxHash**
  - BSD 2-Clause License の下でライセンスされています。
  - Copyright © Yann Collet.
  - 詳細は <https://opensource.org/license/bsd-2-clause/> をご覧ください。
