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

## 設計メモ: 外部画像の取り扱い

### 問題: CORS制限

外部サイト（例: `storage.googleapis.com`）の画像をKaboomのスプライトとして使用する場合、CORS制限により以下の問題が発生する:

1. **Canvas汚染**: `crossOrigin='anonymous'`を設定してもCORSヘッダーがない画像は読み込めない
2. **スプライト登録失敗**: Kaboomの`loadSprite()`が外部URLを直接読み込めない

### 解決策: Base64エンコード

**ビルド時に画像をBase64に変換してJSONに埋め込む方式を採用。**

```
[クロール時]
外部画像URL → scripts/convertImagesToBase64.ts → data:image/webp;base64,... として保存

[実行時]
Base64データ → Image要素でサイズ取得 → Kaboomスプライトとして登録
```

### 実装のポイント

1. **Base64変換スクリプト** (`scripts/convertImagesToBase64.ts`)
   - Node.jsのhttps/httpモジュールで画像をフェッチ
   - `Buffer.toString('base64')`でエンコード
   - JSONの`sampleImageBase64`フィールドに保存

2. **画像サイズの取得** (`src/utils/imageLoader.ts`)
   - `new Image()`でBase64を読み込み
   - `naturalWidth`/`naturalHeight`で実際のサイズを取得
   - その後`k.loadSprite()`でKaboomに登録

3. **アスペクト比の維持**
   - 画像の実サイズをLoadedImageに保存
   - ブロック生成時にアスペクト比を考慮してスケーリング

### トレードオフ

| 項目 | Base64方式 | 外部URL方式 |
|------|-----------|------------|
| CORS | 問題なし | 制限あり |
| ファイルサイズ | 大きい（数MB） | 小さい |
| 初回ロード | JSONフェッチのみ | 画像ごとにフェッチ |
| オフライン | 動作する | 動作しない |
| 画像更新 | 再変換が必要 | 自動で反映 |

### 参考: 他のアプローチ

- **プロキシサーバー**: 開発時のみ有効、本番では使えない
- **DOM画像オーバーレイ**: Canvas外に画像を重ねる方式。位置同期が複雑で断念
- **サーバーサイドキャッシュ**: インフラが必要

## ライセンス

MIT
