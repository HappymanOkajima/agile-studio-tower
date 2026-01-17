# Agile Studio Tower

Webサイトのクロールデータを使った物理パズルゲーム。シーソーの上にブロックを積み上げ、制限時間内に高さを競う。

## Play Now

**[https://happymanokajima.github.io/agile-studio-tower/](https://happymanokajima.github.io/agile-studio-tower/)**

スマホでプレイ:

![QR Code](https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://happymanokajima.github.io/agile-studio-tower/)

## ゲーム概要

- **目標**: 30秒以内に10個のブロックを積み上げ、CLEAR LINE（200pt）を超える
- **操作**: クリック / タップ / スペースキーでブロックを落下
- **スコア**: タワーの最高到達点（Velocity）がスコアになる

## ゲームシステム

### シーソー物理
- 地面はシーソー型で、ブロックの重心位置によって傾く
- 傾くとブロックが滑り落ちる危険がある
- 左右のバランスを考えて積む必要がある

### 風システム
- 4秒周期で左右に風が変化
- 落下中のブロックは風の影響を受ける
- 中央付近は風の影響が1.5倍（中央安定戦略へのリスク）
- 風を利用してバランスを調整する上級テクニックも可能

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

## 対応環境

- **PC**: Chrome, Firefox, Safari, Edge
- **スマホ**: iOS Safari, Android Chrome
- タップでブロック落下（スマホ）
- iOSのセーフエリア対応

## 技術スタック

- **Kaboom.js** - 2Dゲームエンジン（物理演算含む）
- **TypeScript** - 型安全な開発
- **Vite** - 高速な開発サーバーとビルド

## ファイル構成

```
src/
  main.ts                 # エントリーポイント
  types.ts                # 型定義
  data/
    blockData.ts          # クロールデータからブロック素材を抽出
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
    imageLoader.ts        # 画像ロード（CORS対応）
data/
  sites/
    agile-studio.json     # クロールデータ（ブロック素材の元）
```

## ライセンス

MIT
