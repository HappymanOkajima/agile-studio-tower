// ゲーム設定管理（URLパラメータで切り替え）

export type ImageMode = 'station' | 'legacy';
export type DifficultyMode = 'easy' | 'hard';

export interface GameConfig {
  imageMode: ImageMode;
  difficultyMode: DifficultyMode;
}

// グローバル設定（初期化時に設定）
let currentConfig: GameConfig = {
  imageMode: 'station',
  difficultyMode: 'easy',
};

// URLパラメータを解析してゲーム設定を決定
export function parseGameConfig(): GameConfig {
  const params = new URLSearchParams(window.location.search);
  currentConfig = {
    imageMode: params.get('images') === 'legacy' ? 'legacy' : 'station',
    difficultyMode: params.get('mode') === 'hard' ? 'hard' : 'easy',
  };
  return currentConfig;
}

// 現在の設定を取得
export function getGameConfig(): GameConfig {
  return currentConfig;
}

// 難易度プリセット
export interface DifficultyPreset {
  block: {
    minWidth: { start: number; end: number };
    maxWidth: { start: number; end: number };
    tallBlockChance: { start: number; end: number };
  };
  movement: {
    oscillationSpeed: { start: number; end: number };
  };
  wind: {
    maxStrength: number;
    cycleTime: number;
    fallingMultiplier: number;
    centerMultiplier: number;
  };
}

export const DIFFICULTY_PRESETS: Record<DifficultyMode, DifficultyPreset> = {
  easy: {
    block: {
      minWidth: { start: 80, end: 50 },
      maxWidth: { start: 130, end: 80 },
      tallBlockChance: { start: 0.2, end: 0.4 },
    },
    movement: {
      oscillationSpeed: { start: 120, end: 280 },
    },
    wind: {
      maxStrength: 50,
      cycleTime: 5,
      fallingMultiplier: 1.5,
      centerMultiplier: 1.3,
    },
  },
  hard: {
    block: {
      minWidth: { start: 70, end: 30 },
      maxWidth: { start: 120, end: 60 },
      tallBlockChance: { start: 0.3, end: 0.6 },
    },
    movement: {
      oscillationSpeed: { start: 180, end: 480 },
    },
    wind: {
      maxStrength: 80,
      cycleTime: 4,
      fallingMultiplier: 2,
      centerMultiplier: 1.5,
    },
  },
};

// 現在の難易度プリセットを取得
export function getCurrentDifficultyPreset(): DifficultyPreset {
  return DIFFICULTY_PRESETS[currentConfig.difficultyMode];
}

// 進行度(0-1)に応じた値を補間
export function interpolate(
  config: { start: number; end: number },
  progress: number
): number {
  return config.start + (config.end - config.start) * progress;
}
