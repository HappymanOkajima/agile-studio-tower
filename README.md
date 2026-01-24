# Agile Practice Map TOWER

シーソーの上にブロックを積み上げる物理パズルゲーム。制限時間内に高さを競う。

## Play Now

**[https://happymanokajima.github.io/agile-studio-tower/](https://happymanokajima.github.io/agile-studio-tower/)**

スマホでプレイ:

![QR Code](https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://happymanokajima.github.io/agile-studio-tower/)

## ゲーム概要

- **目標**: 30秒以内に10個のブロックを積み上げ、CLEAR LINE（200pt）を超える
- **操作**: クリック / タップ / スペースキーでブロックを落下
- **スコア**: タワーの最高到達点（Velocity）がスコアになる

## URLパラメータ

| パラメータ | 説明 |
|-----------|------|
| `?mode=hard` | マニアックモード（難しい） |
| `?images=legacy` | レガシー画像モード（agile-studio.json使用） |

```
# デフォルト（キャンペーン用）
https://example.com/agile-studio-tower/
→ イージーモード + 駅名標画像

# マニアックモード
https://example.com/agile-studio-tower/?mode=hard
→ 難易度UP + 駅名標画像

# レガシーモード
https://example.com/agile-studio-tower/?images=legacy
→ イージーモード + agile-studio.json画像
```

## ゲームシステム

### シーソー物理
- 地面はシーソー型で、ブロックの重心位置によって傾く
- 傾くとブロックが滑り落ちる危険がある
- 左右のバランスを考えて積む必要がある

### 風システム
- 周期的に左右に風が変化
- 落下中のブロックは風の影響を受ける
- 中央付近は風の影響が大きい（中央安定戦略へのリスク）
- 風を利用してバランスを調整する上級テクニックも可能

### 難易度比較

| パラメータ | イージー | マニアック |
|-----------|---------|-----------|
| ブロック幅 | 80-200px | 50-130px |
| 移動速度 | 120-280 | 180-480 |
| 風の強さ | 弱め | 強め |

### メダル獲得条件
| メダル | 条件 |
|--------|------|
| 金 | 10個積み切り + 最高記録更新 |
| 銀 | 10個積み切り |
| 銅 | CLEAR LINE超え（崩れても有効） |

## 開発

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build
```

### 画像の更新

駅名標画像を更新する場合：

```bash
# 1. public/resources/ に画像を配置

# 2. 画像をリサイズ（800px幅以下に）
node scripts/resizeImages.cjs

# 3. Base64 JSONを生成
node scripts/convertImages.cjs
```

## 対応環境

- **PC**: Chrome, Firefox, Safari, Edge
- **スマホ**: iOS Safari, Android Chrome
- タップでブロック落下（スマホ）
- iOSのセーフエリア対応

## 技術スタック

- **Kaplay** - 2Dゲームエンジン（Kaboom.js後継、物理演算含む）
- **TypeScript** - 型安全な開発
- **Vite** - 高速な開発サーバーとビルド

## ファイル構成

```
src/
  main.ts                 # エントリーポイント
  types.ts                # 型定義
  config/
    gameConfig.ts         # URLパラメータ解析、難易度プリセット
  data/
    blockData.ts          # クロールデータからブロック素材を抽出
    stationImages.ts      # 駅名標画像データ
    stationImagesData.json # 駅名標画像（Base64）
    rankings.ts           # ランク定義（Lv1〜Lv4）
  scenes/
    title.ts              # タイトル画面
    game.ts               # メインゲーム画面
    result.ts             # リザルト画面
  systems/
    physics.ts            # 物理演算（シーソー、風）
    blockSpawner.ts       # ブロック生成
    audioManager.ts       # サウンドエフェクト（Web Audio API）
    scoreManager.ts       # スコア・ランキング管理
  components/
    pendingBlock.ts       # 上部で往復するブロック
    hud.ts                # UI表示（タイマー、Velocity、風向き）
  utils/
    imageLoader.ts        # 画像ロード
scripts/
  resizeImages.cjs        # 画像リサイズスクリプト
  convertImages.cjs       # Base64変換スクリプト
public/
  resources/              # 駅名標画像（PNG）
data/
  sites/
    agile-studio.json     # レガシーモード用クロールデータ
```

## 設計メモ: 画像の取り扱い

### 駅名標画像モード（デフォルト）

ビルド時に画像をBase64に変換してJSONに埋め込む。

```
[準備]
PNG画像 → resizeImages.cjs（800px幅にリサイズ）
       → convertImages.cjs（Base64変換）
       → stationImagesData.json

[実行時]
Base64データ → Image要素でサイズ取得 → Kaplayスプライトとして登録
```

### レガシーモード（?images=legacy）

Webサイトのクロールデータ（agile-studio.json）からBase64画像を使用。

## ライセンス

MIT
