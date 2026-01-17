import type { BlockType, BlockConfig, DifficultyConfig, LoadedImage } from '../types';

// 難易度を時間経過に応じて計算
export function getDifficultyForTime(timeElapsed: number): DifficultyConfig {
  const progress = Math.min(timeElapsed / 60, 1); // 0〜1（60秒で最大）

  return {
    // ブロックサイズ: 幅は狭め（不安定に）
    minBlockWidth: Math.max(30, 70 - progress * 30),
    maxBlockWidth: Math.max(60, 120 - progress * 50),
    // 移動速度: 最初から速め、さらに速く
    oscillationSpeed: 180 + progress * 300,
    // 縦長ブロックの確率: 進行するほど縦長（不安定）が増える
    tallBlockChance: 0.3 + progress * 0.3,
  };
}

// ブロックタイプを選択
export function selectBlockType(
  difficulty: DifficultyConfig,
  availableImages: number,
  availableKeywords: number
): BlockType {
  // 画像とキーワードの重み付け
  // 序盤は画像（大きく安定）、終盤はキーワード（小さい）を優先
  const hasImages = availableImages > 0;
  const hasKeywords = availableKeywords > 0;

  if (!hasImages && !hasKeywords) {
    return 'keyword'; // フォールバック
  }

  if (!hasImages) return 'keyword';
  if (!hasKeywords) return 'image';

  // 進行度に応じてキーワードの確率を上げる
  const progress = (difficulty.oscillationSpeed - 180) / 300; // 0〜1
  const keywordChance = 0.3 + progress * 0.4; // 30%〜70%

  return Math.random() < keywordChance ? 'keyword' : 'image';
}

// ブロック設定を生成（矩形のみ）
export function generateBlockConfig(
  type: BlockType,
  difficulty: DifficultyConfig,
  imageData?: LoadedImage,
  keywordText?: string,
): BlockConfig {
  const baseWidth = difficulty.minBlockWidth +
    Math.random() * (difficulty.maxBlockWidth - difficulty.minBlockWidth);

  switch (type) {
    case 'image': {
      if (imageData) {
        // 画像のアスペクト比を維持してスケール
        const aspectRatio = imageData.height / imageData.width;
        const maxWidth = 120;
        const maxHeight = 80;

        // 幅と高さの両方の上限を考慮してアスペクト比を保つ
        let scaledWidth = Math.min(baseWidth * 1.2, maxWidth);
        let scaledHeight = scaledWidth * aspectRatio;

        // 高さが上限を超える場合は、高さ基準で幅を縮小
        if (scaledHeight > maxHeight) {
          scaledHeight = maxHeight;
          scaledWidth = scaledHeight / aspectRatio;
        }

        return {
          type: 'image',
          width: scaledWidth,
          height: scaledHeight,
          shape: 'rect',
          imageUrl: imageData.success ? imageData.sprite : undefined,
          originalImageUrl: imageData.url,  // 元URLを保持（DOM表示用）
        };
      }
      // 画像データなしの場合はキーワードブロックとして扱う
      return generateBlockConfig('keyword', difficulty, undefined, keywordText || 'AGILE');
    }

    case 'keyword': {
      const text = keywordText || 'BLOCK';
      // テキスト長に基づいて最小サイズを計算（日本語は幅広）
      const isJapanese = /[^\x00-\x7F]/.test(text);
      const charWidth = isJapanese ? 12 : 8;
      const minSizeForText = text.length * charWidth + 20;

      // 難易度に応じて縦長（不安定）か横長（安定）を決定
      const isTall = Math.random() < difficulty.tallBlockChance;
      let width: number;
      let height: number;

      if (isTall) {
        // 縦長ブロック（不安定）
        width = Math.max(minSizeForText, 35 + Math.random() * 25);
        height = 55 + Math.random() * 45;
      } else {
        // 横長ブロック（安定）
        width = Math.max(minSizeForText, 60 + Math.random() * 60);
        height = 20 + Math.random() * 20;
      }

      return {
        type: 'keyword',
        width,
        height,
        shape: 'rect',
        text,
      };
    }
  }
}
