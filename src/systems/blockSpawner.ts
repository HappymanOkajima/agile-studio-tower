import type { BlockType, BlockConfig, DifficultyConfig, LoadedImage } from '../types';
import { getCurrentDifficultyPreset, interpolate } from '../config/gameConfig';

// 難易度を時間経過に応じて計算（プリセットから取得）
export function getDifficultyForTime(timeElapsed: number): DifficultyConfig {
  const progress = Math.min(timeElapsed / 60, 1); // 0〜1（60秒で最大）
  const preset = getCurrentDifficultyPreset();

  return {
    minBlockWidth: interpolate(preset.block.minWidth, progress),
    maxBlockWidth: interpolate(preset.block.maxWidth, progress),
    oscillationSpeed: interpolate(preset.movement.oscillationSpeed, progress),
    tallBlockChance: interpolate(preset.block.tallBlockChance, progress),
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
  switch (type) {
    case 'image': {
      // 画像データが有効でサイズも正しい場合のみ画像ブロックとして使用
      if (imageData && imageData.success && imageData.width > 0 && imageData.height > 0) {
        // 画像のアスペクト比を維持してスケール
        const aspectRatio = imageData.height / imageData.width;

        // サイズにバリエーションを持たせる（小:中:大 = 30%:40%:30%）
        const sizeRoll = Math.random();
        let targetWidth: number;
        if (sizeRoll < 0.3) {
          // 小サイズ（80-110px幅）- 積みにくい
          targetWidth = 80 + Math.random() * 30;
        } else if (sizeRoll < 0.7) {
          // 中サイズ（110-150px幅）- 標準
          targetWidth = 110 + Math.random() * 40;
        } else {
          // 大サイズ（150-200px幅）- 安定しやすい
          targetWidth = 150 + Math.random() * 50;
        }

        // アスペクト比を維持して高さを計算
        let scaledWidth = targetWidth;
        let scaledHeight = scaledWidth * aspectRatio;

        // 高さの上限チェック（100px）
        const maxHeight = 100;
        if (scaledHeight > maxHeight) {
          scaledHeight = maxHeight;
          scaledWidth = scaledHeight / aspectRatio;
        }

        // 最小サイズチェック
        if (scaledWidth >= 30 && scaledHeight >= 10) {
          return {
            type: 'image',
            width: scaledWidth,
            height: scaledHeight,
            shape: 'rect',
            imageUrl: imageData.sprite,
            originalImageUrl: imageData.url,
          };
        }
      }
      // 画像データが無効な場合はキーワードブロックとして扱う
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
        // 縦長ブロック（不安定）- 縦長レイアウト用に縮小
        width = Math.max(minSizeForText, 30 + Math.random() * 25);
        height = 50 + Math.random() * 40;
      } else {
        // 横長ブロック（安定）- 縦長レイアウト用に縮小
        width = Math.max(minSizeForText, 50 + Math.random() * 50);
        height = 18 + Math.random() * 18;
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
