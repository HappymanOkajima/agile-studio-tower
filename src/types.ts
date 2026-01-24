import type { KAPLAYCtx, GameObj } from 'kaplay';

// ブロック種別
export type BlockType = 'image' | 'keyword';

// ブロック形状
export type BlockShape = 'rect' | 'circle' | 'triangle';

// ブロック設定
export interface BlockConfig {
  type: BlockType;
  width: number;
  height: number;
  shape: BlockShape;      // 形状（矩形・円・三角）
  imageUrl?: string;      // 画像ブロック用（スプライト名）
  originalImageUrl?: string;  // 画像の元URL（DOM表示用）
  text?: string;          // キーワードブロック用
}

// ゲーム状態
export interface GameState {
  velocity: number;       // スコア（最高到達点）
  blocksRemaining: number; // 残りブロック数
  blocksDropped: number;  // 落としたブロック数
  timeRemaining: number;  // 残り時間（秒）
  isGameOver: boolean;
  gameOverReason: 'complete' | 'blockFell' | 'timeout' | null;
}

// 難易度設定
export interface DifficultyConfig {
  minBlockWidth: number;
  maxBlockWidth: number;
  oscillationSpeed: number;    // 水平移動速度
  tallBlockChance: number;     // 縦長ブロックの確率 (0.0 to 1.0)
}

// ランク定義
export interface RankDefinition {
  level: number;
  title: string;
  titleJa: string;
  minScore: number;
}

// ロード済み画像情報
export interface LoadedImage {
  url: string;
  sprite: string;  // Kaplayスプライト名
  width: number;
  height: number;
  success: boolean;
}

// ブロックソース（クロールデータから抽出）
export interface BlockSource {
  imageUrls: string[];
  imageBase64: string[];  // Base64エンコード済み画像
  keywords: string[];
  loadedImages: Map<string, LoadedImage>;
  stationImages?: string[];  // 駅名標画像モード用
}

// クロールデータの要素
export interface CrawlElement {
  tag: string;
  count: number;
  sampleTexts?: string[];
  sampleImageUrls?: string[];
  sampleImageBase64?: string[];  // Base64エンコード済み画像
}

// クロールデータのページ
export interface CrawlPage {
  path: string;
  depth: number;
  title: string;
  elements: CrawlElement[];
  totalElementCount: number;
  links: string[];
  imageUrls: string[];
}

// サイトスタイル
export interface SiteStyle {
  backgroundColor: string;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  themeColor: string | null;
}

// クロールデータ全体
export interface CrawlData {
  siteId: string;
  siteName: string;
  baseUrl: string;
  metadata: {
    crawledAt: string;
    crawlerVersion: string;
    totalPages: number;
    totalElements: number;
    maxDepth: number;
    crawlDuration: number;
  };
  siteStyle: SiteStyle;
  pages: CrawlPage[];
  deepestPages: string[];
  rareElements: string[];
  commonLinks: string[];
}

// メダル種別
export type MedalType = 'gold' | 'silver' | 'bronze' | 'none';

// リザルト画面パラメータ
export interface ResultParams {
  score: number;
  blocksDropped: number;
  reason: 'complete' | 'blockFell' | 'timeout';
  passedWinLine: boolean;  // CLEAR LINEを超えたか（途中で崩れても記録）
}

// Kaplayコンテキスト型（互換性のためKaboomCtxエイリアスも提供）
export type KaboomCtx = KAPLAYCtx;
export type { KAPLAYCtx, GameObj };
