import type { RankDefinition } from '../types';

export const RANKINGS: RankDefinition[] = [
  { level: 1, title: 'Trainee Engineer', titleJa: '見習いエンジニア', minScore: 0 },
  { level: 2, title: 'Certified Scrum Master', titleJa: '認定スクラムマスター', minScore: 100 },
  { level: 3, title: 'Agile Coach', titleJa: 'アジャイルコーチ', minScore: 250 },
  { level: 4, title: 'Evangelist', titleJa: 'エバンジェリスト', minScore: 400 },
];

export function getRankForScore(score: number): RankDefinition {
  let achievedRank = RANKINGS[0];

  for (const rank of RANKINGS) {
    if (score >= rank.minScore) {
      achievedRank = rank;
    }
  }

  return achievedRank;
}
