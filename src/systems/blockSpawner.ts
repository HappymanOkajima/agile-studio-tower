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
    // お邪魔ブロック確率: 25%→50%（大幅増加）
    obstacleChance: 0.25 + progress * 0.25,
  };
}

// ブロックタイプを選択
export function selectBlockType(
  difficulty: DifficultyConfig,
  availableImages: number,
  availableKeywords: number
): BlockType {
  const rand = Math.random();

  // お邪魔ブロック判定
  if (rand < difficulty.obstacleChance) {
    return 'obstacle';
  }

  // 画像とキーワードの重み付け
  // 序盤は画像（大きく安定）、終盤はキーワード（小さい）を優先
  const hasImages = availableImages > 0;
  const hasKeywords = availableKeywords > 0;

  if (!hasImages && !hasKeywords) {
    return 'obstacle';
  }

  if (!hasImages) return 'keyword';
  if (!hasKeywords) return 'image';

  // 進行度に応じてキーワードの確率を上げる
  const progress = (difficulty.oscillationSpeed - 80) / 220; // 0〜1
  const keywordChance = 0.2 + progress * 0.4; // 20%〜60%

  return Math.random() < keywordChance ? 'keyword' : 'image';
}

// ブロック設定を生成
export function generateBlockConfig(
  type: BlockType,
  difficulty: DifficultyConfig,
  imageData?: LoadedImage,
  keywordText?: string
): BlockConfig {
  const baseWidth = difficulty.minBlockWidth +
    Math.random() * (difficulty.maxBlockWidth - difficulty.minBlockWidth);

  switch (type) {
    case 'image': {
      if (imageData && imageData.success) {
        // 画像のアスペクト比を維持してスケール（小さめに）
        const aspectRatio = imageData.height / imageData.width;
        const scaledWidth = Math.min(baseWidth, 100);
        const scaledHeight = Math.min(scaledWidth * aspectRatio, 60);
        return {
          type: 'image',
          width: scaledWidth,
          height: scaledHeight,
          imageUrl: imageData.sprite,
        };
      }
      // 画像読み込み失敗時はフォールバック（縦長で不安定）
      const isTall = Math.random() < 0.6;
      return {
        type: 'image',
        width: isTall ? 30 + Math.random() * 25 : 70 + Math.random() * 50,
        height: isTall ? 45 + Math.random() * 35 : 20 + Math.random() * 15,
      };
    }

    case 'keyword': {
      const text = keywordText || 'BLOCK';
      // テキスト長に基づいて最小幅を計算（日本語は幅広）
      const isJapanese = /[^\x00-\x7F]/.test(text);
      const charWidth = isJapanese ? 12 : 8;
      const minWidthForText = text.length * charWidth + 16;

      // ランダムにタワー型（縦長）か板型（横長）を選択
      const isTall = Math.random() < 0.4; // 縦長の確率を下げる
      let width: number;
      let height: number;

      if (isTall) {
        // 縦長ブロック（不安定）- テキストが収まる幅を確保
        width = Math.max(minWidthForText, 40 + Math.random() * 30);
        height = 60 + Math.random() * 40;
      } else {
        // 横長ブロック - テキストが収まる幅を確保
        width = Math.max(minWidthForText, 70 + Math.random() * 50);
        height = 22 + Math.random() * 18;
      }
      return {
        type: 'keyword',
        width,
        height,
        text,
      };
    }

    case 'obstacle': {
      const shapes: Array<'circle' | 'triangle'> = ['circle', 'triangle'];
      const obstacleTexts = ['バグ', '仕様変更', '緊急MTG', 'レビュー', '障害', '炎上'];
      const obstacleText = obstacleTexts[Math.floor(Math.random() * obstacleTexts.length)];
      // テキストが収まるサイズを確保（日本語文字幅 × 文字数 + 余白）
      const minSize = obstacleText.length * 12 + 20;
      const size = Math.max(minSize, 50 + Math.random() * 30);
      return {
        type: 'obstacle',
        width: size,
        height: size,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        obstacleText,
      };
    }
  }
}
