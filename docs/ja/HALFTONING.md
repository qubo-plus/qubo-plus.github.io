---
last_modified: 2026-09-01
layout: default
nav_exclude: true
title: "ハーフトーン化"
nav_order: 53
lang: ja
hreflang_alt: "en/HALFTONING"
hreflang_lang: "en"
---

# 画像のハーフトーン化

**ハーフトーン化**（halftoning）は、グレースケール画像を白黒2値のドットパターン画像に変換する画像処理です。
新聞の写真やモノクロプリンタの印刷など、白か黒かの2値しか表現できない媒体で濃淡を表現するために使われています。
細かい白黒のパターンは、離れて見ると目の中で平均化され、中間調として知覚されます。

この「離れて見るとぼけて中間調に見える」という性質が定式化の鍵です。
人間の視覚系のぼけをローパスフィルタ（ガウシアンフィルタ）$G$ でモデル化すると、良いハーフトーン画像とは、

**ぼかした結果が元画像にできるだけ近い2値画像**

です。この差の二乗和を最小化する問題は、補助変数も制約も使わずにそのまま QUBO になります。

## QUBO 定式化

$n_r \times n_c$ 画素のグレースケール画像 $I$（画素値 $0 \le I_{ij} \le 255$）が与えられたとします。
出力画像の各画素にバイナリ変数 $x_{ij} \in \{0,1\}$ を割り当てます（$1$ が白、$0$ が黒）。
変数の個数は画素数と同じ $n_r n_c$ 個です。

視覚系のぼけは、$(2M{+}1)\times(2M{+}1)$ のフィルタ $G$ との畳み込みで表します
（以下の例では $M=3$、係数の総和が $255$ の $7\times 7$ 整数ガウシアンを使います）。
2値画像 $x$ のぼけは

$$(G * x)_{ij} = \sum_{k=0}^{2M} \sum_{l=0}^{2M} G_{kl}\, x_{i+k-M,\, j+l-M}$$

です（画像の外側の画素は $0$ とみなします）。$G$ の係数の総和が $255$ なので、画像の内部では $(G * x)$ の各要素は $0$〜$255$ の値をとります。目標値には元画像そのものを使います:

$$T_{ij} = \mathrm{round}\!\left(\frac{I_{ij}\, m_{ij}}{255}\right),
\qquad m_{ij} = (G * \mathbf{1})_{ij}$$

ここで $m_{ij}$ は画素 $(i,j)$ に届くフィルタ係数の合計（$\mathbf{1}$ は全画素が $1$ の画像）です。画像の内部では $m_{ij} = 255$、すなわち $T_{ij} = I_{ij}$（元画像そのまま）です。境界付近ではフィルタ窓が画像からはみ出して、その画素でぼけの値が到達できる最大値が $m_{ij}$ に下がるため、目標も同じ比率で縮めています。

元画像をぼかしたものを目標値にする定式化も考えられますが、元画像をぼかさずそのまま目標にする方がシャープなハーフトーン画像になり、人の目にはきれいに見えます。

最小化する目的関数は、ぼかした2値画像と目標値の差の二乗和です:

$$E(x) = \sum_{i,j} \bigl( (G * x)_{ij} - T_{ij} \bigr)^2$$

$(G * x)$ の各要素は変数の線形式なので、$E(x)$ は2次式、すなわち制約のない純粋な QUBO です。
二乗の展開で現れる2つの変数の積 $x_{ij}\, x_{kl}$ は、画素 $(i,j)$ と $(k,l)$ が同じフィルタ窓に入るもの、
つまり縦横の距離が $2M$ 以内のものに限られるため、QUBO は疎（バンド構造）になります。

## QUBO++ プログラム

以下のプログラムは、$64\times 64$ の合成グレースケール画像（対角グラデーション + 明るい円）を生成してハーフトーン化し、
結果を PGM 形式の画像ファイルとして保存します:

{% raw %}
```cpp
#include <qbpp/qbpp.hpp>
#include <qbpp/easy_solver.hpp>

#include <fstream>
#include <vector>

constexpr int M = 3;  // フィルタ半径（7x7 フィルタ）
constexpr int ROWS = 64, COLS = 64;
// 整数ガウシアン（総和 255）
constexpr int G[2 * M + 1][2 * M + 1] = {{0, 0, 1, 1, 1, 0, 0},
                                         {0, 1, 5, 7, 5, 1, 0},
                                         {1, 5, 14, 21, 14, 5, 1},
                                         {1, 7, 21, 31, 21, 7, 1},
                                         {1, 5, 14, 21, 14, 5, 1},
                                         {0, 1, 5, 7, 5, 1, 0},
                                         {0, 0, 1, 1, 1, 0, 0}};

using Image = std::vector<std::vector<int>>;

// G との畳み込み（画像の外側の画素は 0 とみなす）
Image blur(const Image& a) {
  Image out(ROWS, std::vector<int>(COLS, 0));
  for (int i = 0; i < ROWS; ++i)
    for (int j = 0; j < COLS; ++j)
      for (int k = 0; k <= 2 * M; ++k)
        for (int l = 0; l <= 2 * M; ++l)
          if (i + k - M >= 0 && i + k - M < ROWS && j + l - M >= 0 &&
              j + l - M < COLS)
            out[i][j] += G[k][l] * a[i + k - M][j + l - M];
  return out;
}

int main() {
  // 入力画像: 対角グラデーション + 明るい円（合成画像）
  Image img(ROWS, std::vector<int>(COLS));
  for (int i = 0; i < ROWS; ++i)
    for (int j = 0; j < COLS; ++j)
      img[i][j] = (i - 20) * (i - 20) + (j - 44) * (j - 44) < 196
                      ? 235
                      : 255 * (i + j) / (ROWS + COLS - 2);

  // 目標値 T: 元画像そのもの（境界は届くフィルタ質量に合わせて縮小）
  Image mass = blur(Image(ROWS, std::vector<int>(COLS, 1)));
  Image target(ROWS, std::vector<int>(COLS));
  for (int i = 0; i < ROWS; ++i)
    for (int j = 0; j < COLS; ++j)
      target[i][j] = (img[i][j] * mass[i][j] + 127) / 255;

  // E = sum(((G * x) - T)^2): 画素ごとに (G * x) - T を組み立てて二乗和
  auto x = qbpp::var("x", ROWS, COLS);
  auto f = qbpp::toExpr(0);
  for (int i = 0; i < ROWS; ++i)
    for (int j = 0; j < COLS; ++j) {
      auto e = qbpp::toExpr(0);
      for (int k = 0; k <= 2 * M; ++k)
        for (int l = 0; l <= 2 * M; ++l) {
          int ii = i + k - M, jj = j + l - M;
          if (ii >= 0 && ii < ROWS && jj >= 0 && jj < COLS && G[k][l])
            e += G[k][l] * x(ii, jj);
        }
      f += qbpp::sqr(e - target[i][j]);
    }
  f.simplify_as_binary();

  qbpp::EasySolver solver(f);
  auto sol = solver.search({{"time_limit", 5.0}});
  std::cout << "variables = " << sol.info().get("var_count")
            << "  terms = " << sol.info().get("term_count") << std::endl;
  std::cout << "energy = " << sol.energy() << std::endl;

  // 解を PGM 形式の2値画像として保存
  auto bits = sol(x);
  std::ofstream ofs("halftone.pgm");
  ofs << "P2\n" << COLS << " " << ROWS << "\n255\n";
  for (int i = 0; i < ROWS; ++i) {
    for (int j = 0; j < COLS; ++j) ofs << 255 * int(bits(i, j)) << " ";
    ofs << "\n";
  }
}
```
{% endraw %}

内側の二重ループが、各画素のぼけの値 $(G * x)$ から目標値を引いた式を組み立て、`qbpp::sqr` で二乗して `f` に足し込みます — 数式の定義をそのまま書き写した形です。
`simplify_as_binary()` が同類項をまとめ、バイナリ変数の規則 $x^2 = x$ で式を整理します。

### 出力結果

```
variables = 4096  terms = 244488
energy = 259867
```

$64\times 64$ で変数は $4096$ 個、simplify 後の QUBO は約 $24$ 万項（各変数が縦横 $\pm 2M$ の近傍としか結合しないバンド構造）になります。
`EasySolver` は乱択ヒューリスティックなので、energy の値は実行ごとに変わります。

入力画像（左）と出力されたハーフトーン画像（右）:

<p align="center">
  <img src="../images/halftone_in.png" alt="入力グレースケール画像" width="35%">
  <img src="../images/halftone_out.png" alt="出力ハーフトーン画像" width="35%">
</p>

グラデーションが白ドットの密度の変化として表現されていることがわかります。

### 配列演算によるベクトル化

`f` を構築している二重ループの部分は、QUBO++ の配列演算で**ベクトル化**できます（`x` はそのまま使います）:

```cpp
  // ゼロパディング: x の周囲に幅 M のゼロ定数を連結
  auto zc = qbpp::expr(ROWS, M);
  auto zr = qbpp::expr(M, COLS + 2 * M);
  auto xw = qbpp::concat(qbpp::concat(zc, x, 1), zc, 1);  // 左右
  auto xp = qbpp::concat(qbpp::concat(zr, xw, 0), zr, 0);  // 上下

  // (G * x): シフトしたスライスの重み付き和
  auto conv = qbpp::expr(ROWS, COLS);
  for (int k = 0; k <= 2 * M; ++k)
    for (int l = 0; l <= 2 * M; ++l)
      if (G[k][l])
        conv +=
            G[k][l] * xp(qbpp::slice(k, k + ROWS), qbpp::slice(l, l + COLS));

  // E = sum(((G * x) - T)^2)
  auto f = qbpp::toExpr(0);
  for (int i = 0; i < ROWS; ++i)
    f += qbpp::sum((conv(i) - qbpp::array(target[i])).sqr());
  f.simplify_as_binary();
```

1. `qbpp::concat` で `x` の上下左右に幅 $M$ のゼロ定数配列（`qbpp::expr(...)` はゼロで初期化された `Expr` 配列）を連結し、$(n_r{+}2M) \times (n_c{+}2M)$ のパディング済み配列 `xp` を作ります。
2. `xp` から縦横に $k, l$ だけシフトした $n_r \times n_c$ の部分配列 `xp(qbpp::slice(k, k + ROWS), qbpp::slice(l, l + COLS))` を係数 $G_{kl}$ 倍して `conv` に足し込みます。この二重ループが終わると、`conv` が線形式の配列 $(G * x)$ になります。
3. 目標値の行 `target[i]` を引いて要素ごとに `sqr()` で二乗し、`qbpp::sum` で合計すると目的関数 $E(x)$ が得られます。

どちらの書き方もまったく同じ QUBO を構築します（simplify 後の項数もエネルギーも完全に一致します）。
C++ ではループのオーバーヘッドが小さいため、構築時間もほぼ同等です（実測例、20 コア CPU のサーバー）:

| 画像サイズ | ループ版 | 配列演算版 |
|:---:|:---:|:---:|
| 64×64 | 0.4 秒 | 0.6 秒 |
| 128×128 | 1.9 秒 | 1.5 秒 |
| 256×256 | 5.0 秒 | 5.8 秒 |

なお、ループ版の蓄積は必ず `f += ...` と書いてください。`f = f + ...` と書くと `f` 全体のコピーが画素ごとに発生して二次的に遅くなります（64×64 の実測で約 80 倍）。

配列演算版の利点は、畳み込みのような規則的な構造を簡潔に書けることです。
一方 Python では小さな式操作の繰り返しが割高になるため、同じベクトル化で構築時間が約 2〜2.5 倍短くなります。

## 実画像への適用

入力画像を生成している部分をファイル読み込みに差し替えるだけで、実際の写真をハーフトーン化できます。
$256\times 256$ の写真では変数 $65{,}536$ 個・約 $417$ 万項の QUBO になりますが、
構築は数秒で終わり、`EasySolver` で数分探索すると次のような結果が得られます:

<p align="center">
  <img src="../images/halftone_photo_in.png" alt="入力写真" width="35%">
  <img src="../images/halftone_photo_out.png" alt="写真のハーフトーン画像" width="35%">
</p>
