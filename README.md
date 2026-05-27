# お絵かき上達クラブ / Drawing Practice Club

> **[→ アプリを開く / Open App](https://dikmri.github.io/oekaki-jotatsu-club/)**

---

## 日本語

世界の美術館が公開しているパブリックドメインの素描・デッサンをお手本にして、模写練習ができる Web アプリです。

### 特徴

- Met 美術館・シカゴ美術館・クリーブランド美術館の API から CC0 作品を取得
- 左にお手本、右に描画キャンバスを並べてビューポート内に収まるレイアウト
- 完了後に線を重ね合わせ、ズレ・描き漏れを色分け表示
- 100 点満点の採点（AI ではなく画像処理による線の一致度判定）
- 難易度 3 段階（初心者グリッド / 中級者デッサンスケール / 上級者補助なし）
- 日本語 / English 切替対応

### 技術スタック

- SvelteKit + TypeScript + Vite
- HTML Canvas（マルチレイヤー描画）
- カスタム画像処理（Canny エッジ検出・BFS 距離マップ・採点）
- GitHub Pages（adapter-static）

### 注意

本アプリは AI 採点ではなく、画像処理による線の一致度判定を使います。  
スコアはお手本との線の一致度を元にした練習用の目安であり、絵の上手さや芸術性を評価するものではありません。  
作品画像は各美術館 API および Open Access ポリシー（CC0）に基づいて取得します。

---

## English

A web application for tracing practice using public domain drawings and sketches from world-class museums.

### Features

- Fetches CC0 artworks from the Met, Art Institute of Chicago, and Cleveland Museum of Art APIs
- Side-by-side reference and drawing canvases, fully contained within the viewport (no scrolling while drawing)
- Overlay animation after submission: line matching shown in color (match / off / missing)
- 100-point scoring based on image processing (not AI)
- Three difficulty levels: Beginner (grid) / Intermediate (drawing scale) / Advanced (no guides)
- Japanese / English language toggle

### Tech Stack

- SvelteKit + TypeScript + Vite
- HTML Canvas (multi-layer rendering)
- Custom image processing (Canny edge detection · BFS distance map · scoring)
- GitHub Pages (adapter-static)

### Notice

Scoring is based on image processing (line matching), not AI.  
The score is a practice guide, not an evaluation of artistic skill or creativity.  
Artwork images are sourced under CC0 / Open Access policies from each museum's API.

---

## Development

```sh
bun install
bun run dev
bun run build
```
