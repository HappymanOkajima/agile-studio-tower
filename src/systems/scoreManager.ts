// スコア記録管理システム
import type { PageLink } from '../data/blockData';

const STORAGE_KEY = 'agile-tower-highscore';
const RANKING_KEY = 'agile-tower-ranking';
const MAX_RANKING_ENTRIES = 5;

// ページリンクのキャッシュ
let cachedPageLinks: PageLink[] = [];

export const GAME_CONFIG = {
  WIN_THRESHOLD: 200,  // クリアライン（この点数以上でクリア）
};

// ランキングエントリー
export interface RankingEntry {
  score: number;
  date: string;  // ISO 8601形式
}

// ランキングを取得
export function getRanking(): RankingEntry[] {
  try {
    const stored = localStorage.getItem(RANKING_KEY);
    if (stored) {
      const ranking = JSON.parse(stored) as RankingEntry[];
      return ranking.slice(0, MAX_RANKING_ENTRIES);
    }
  } catch {
    // LocalStorageが使えない環境またはパースエラー
  }
  return [];
}

// ランキングに追加（上位5件のみ保持）
export function addToRanking(score: number): number {
  const ranking = getRanking();
  const newEntry: RankingEntry = {
    score,
    date: new Date().toISOString(),
  };

  // ランキングに追加してソート
  ranking.push(newEntry);
  ranking.sort((a, b) => b.score - a.score);

  // 上位5件のみ保持
  const trimmed = ranking.slice(0, MAX_RANKING_ENTRIES);

  try {
    localStorage.setItem(RANKING_KEY, JSON.stringify(trimmed));
  } catch {
    // LocalStorageが使えない環境
  }

  // 新しいエントリーの順位を返す（-1 = ランク外）
  const rank = trimmed.findIndex(e => e === newEntry);
  return rank >= 0 ? rank + 1 : -1;
}

// スコアがランキング入りするか確認
export function wouldRank(score: number): boolean {
  const ranking = getRanking();
  if (ranking.length < MAX_RANKING_ENTRIES) return true;
  return score > ranking[ranking.length - 1].score;
}

// 最高記録を取得
export function getHighScore(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const score = parseInt(stored, 10);
      return isNaN(score) ? 0 : score;
    }
  } catch {
    // LocalStorageが使えない環境
  }
  return 0;
}

// 最高記録を保存
export function saveHighScore(score: number): boolean {
  const currentHigh = getHighScore();
  if (score > currentHigh) {
    try {
      localStorage.setItem(STORAGE_KEY, String(score));
      return true; // 新記録
    } catch {
      // LocalStorageが使えない環境
    }
  }
  return false;
}

// スコアが当選ラインを超えているか
export function isWinningScore(score: number): boolean {
  return score >= GAME_CONFIG.WIN_THRESHOLD;
}

// 最高記録をリセット（デバッグ用）
export function resetHighScore(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // LocalStorageが使えない環境
  }
}

// ページリンクを設定（ゲーム起動時にクロールデータから設定）
export function setPageLinks(links: PageLink[]): void {
  cachedPageLinks = links;
}

// ページリンクを取得
export function getPageLinks(): PageLink[] {
  return cachedPageLinks;
}
