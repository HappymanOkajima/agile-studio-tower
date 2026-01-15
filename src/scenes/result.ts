import type { KaboomCtx, ResultParams, MedalType } from '../types';
import { getRankForScore } from '../data/rankings';
import { audioManager } from '../systems/audioManager';
import { saveHighScore, getHighScore, addToRanking, GAME_CONFIG } from '../systems/scoreManager';

const ACCENT_COLOR = { r: 239, g: 112, b: 33 }; // #ef7021
const WIN_COLOR = { r: 50, g: 180, b: 50 };     // 緑（当選）
const LOSE_COLOR = { r: 180, g: 50, b: 50 };    // 赤（残念）

// メダル色
const MEDAL_COLORS = {
  gold: { r: 255, g: 215, b: 0 },
  silver: { r: 192, g: 192, b: 192 },
  bronze: { r: 205, g: 127, b: 50 },
};

// メダル判定
function determineMedal(isNewRecord: boolean, reason: 'complete' | 'blockFell' | 'timeout', passedWinLine: boolean): MedalType {
  // 金メダル: 10個積み切り + 最高記録更新
  if (reason === 'complete' && isNewRecord) return 'gold';
  // 銀メダル: 10個全て積み切り
  if (reason === 'complete') return 'silver';
  // 銅メダル: CLEAR LINE超え（崩れても/タイムアウトでも）
  if (passedWinLine) return 'bronze';
  // メダルなし
  return 'none';
}

export function createResultScene(k: KaboomCtx): void {
  k.scene('result', (params: ResultParams) => {
    // 崩壊/タイムアウトの場合でもpassedWinLineがあればスコア表示
    const finalScore = (params.reason === 'blockFell' || params.reason === 'timeout') ? 0 : params.score;
    // 表示用スコア（WIN LINE超えていたら記録する）
    const displayScore = params.passedWinLine ? params.score : finalScore;
    const rank = getRankForScore(displayScore);

    // 最高記録を更新チェック（WIN LINE超えていればスコアを記録）
    const previousHigh = getHighScore();
    const scoreToSave = params.passedWinLine ? params.score : finalScore;
    const isNewRecord = saveHighScore(scoreToSave);

    // ランキングに追加（メダル獲得時のみ）
    const medal = determineMedal(isNewRecord, params.reason, params.passedWinLine);
    if (medal !== 'none' && scoreToSave > 0) {
      addToRanking(scoreToSave);
    }

    // 白背景
    k.add([
      k.rect(800, 800),
      k.pos(0, 0),
      k.color(255, 255, 255),
      k.z(0),
    ]);

    // メインヘッダー（メダルベース）
    let headerText: string;
    let headerColor;
    let subHeaderText: string | null = null;

    if (medal === 'gold') {
      headerText = 'GOLD MEDAL!';
      headerColor = k.rgb(MEDAL_COLORS.gold.r, MEDAL_COLORS.gold.g, MEDAL_COLORS.gold.b);
      subHeaderText = 'NEW RECORD!';
    } else if (medal === 'silver') {
      headerText = 'SILVER MEDAL!';
      headerColor = k.rgb(MEDAL_COLORS.silver.r, MEDAL_COLORS.silver.g, MEDAL_COLORS.silver.b);
      subHeaderText = 'ALL BLOCKS STACKED!';
    } else if (medal === 'bronze') {
      headerText = 'BRONZE MEDAL!';
      headerColor = k.rgb(MEDAL_COLORS.bronze.r, MEDAL_COLORS.bronze.g, MEDAL_COLORS.bronze.b);
      subHeaderText = 'CLEAR LINE PASSED!';
    } else if (params.reason === 'blockFell') {
      headerText = 'TOWER COLLAPSED...';
      headerColor = k.rgb(LOSE_COLOR.r, LOSE_COLOR.g, LOSE_COLOR.b);
      const remaining = GAME_CONFIG.WIN_THRESHOLD - params.score;
      if (remaining > 0) {
        subHeaderText = `あと ${remaining} pt でクリア!`;
      }
    } else if (params.reason === 'timeout') {
      headerText = 'TIME UP!';
      headerColor = k.rgb(LOSE_COLOR.r, LOSE_COLOR.g, LOSE_COLOR.b);
      const remaining = GAME_CONFIG.WIN_THRESHOLD - params.score;
      if (remaining > 0) {
        subHeaderText = `あと ${remaining} pt でクリア!`;
      }
    } else {
      headerText = 'SO CLOSE...';
      headerColor = k.rgb(LOSE_COLOR.r, LOSE_COLOR.g, LOSE_COLOR.b);
      const remaining = GAME_CONFIG.WIN_THRESHOLD - displayScore;
      subHeaderText = `あと ${remaining} pt でクリア!`;
    }

    const header = k.add([
      k.text(headerText, { size: 48 }),
      k.pos(400, 130),
      k.anchor('center'),
      k.color(headerColor),
      k.scale(1),
      k.z(10),
    ]);

    // メダル取得時のパルスアニメーション
    if (medal !== 'none') {
      header.onUpdate(() => {
        const s = 1 + Math.sin(k.time() * 5) * 0.05;
        header.scale.x = s;
        header.scale.y = s;
      });
    }

    // サブヘッダー（メダル説明 または あと○pt）
    if (subHeaderText) {
      // メダル獲得時は明るい色、それ以外はグレー
      const subHeaderColor = medal !== 'none' ? k.rgb(255, 180, 0) : k.rgb(120, 120, 120);
      const subHeader = k.add([
        k.text(subHeaderText, { size: 24 }),
        k.pos(400, 180),
        k.anchor('center'),
        k.color(subHeaderColor),
        k.opacity(1),
        k.z(10),
      ]);

      // メダル獲得時のアニメーション
      if (medal !== 'none') {
        subHeader.onUpdate(() => {
          const alpha = 0.7 + Math.sin(k.time() * 8) * 0.3;
          subHeader.opacity = alpha;
        });
      }
    }

    // Velocityラベル
    k.add([
      k.text('Total Velocity', { size: 20 }),
      k.pos(400, 230),
      k.anchor('center'),
      k.color(100, 100, 100),
      k.z(10),
    ]);

    // Velocity値（アニメーション付き）
    let animatedScore = 0;
    const scoreText = k.add([
      k.text('0', { size: 80 }),
      k.pos(400, 300),
      k.anchor('center'),
      k.color(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b),
      k.z(10),
    ]);

    // スコアカウントアップアニメーション
    const targetScore = displayScore;
    const scoreInterval = setInterval(() => {
      animatedScore += Math.ceil(targetScore / 30);
      if (animatedScore >= targetScore) {
        animatedScore = targetScore;
        clearInterval(scoreInterval);
      }
      scoreText.text = String(animatedScore);
    }, 50);

    // pts表示
    k.add([
      k.text('pts', { size: 24 }),
      k.pos(400, 360),
      k.anchor('center'),
      k.color(100, 100, 100),
      k.z(10),
    ]);

    // クリアライン表示
    const hasMedal = medal !== 'none';
    k.add([
      k.text(`CLEAR LINE: ${GAME_CONFIG.WIN_THRESHOLD} pt`, { size: 14 }),
      k.pos(400, 395),
      k.anchor('center'),
      k.color(hasMedal ? WIN_COLOR.r : 150, hasMedal ? WIN_COLOR.g : 150, hasMedal ? WIN_COLOR.b : 150),
      k.z(10),
    ]);

    // ランク表示（遅延表示）
    k.wait(1.5, () => {
      // ランクレベル
      k.add([
        k.text(`Lv.${rank.level}`, { size: 28 }),
        k.pos(400, 450),
        k.anchor('center'),
        k.color(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b),
        k.z(10),
      ]);

      // ランク称号
      k.add([
        k.text(rank.titleJa, { size: 32 }),
        k.pos(400, 495),
        k.anchor('center'),
        k.color(60, 60, 60),
        k.z(10),
      ]);

      // ランク称号（英語）
      k.add([
        k.text(rank.title, { size: 16 }),
        k.pos(400, 530),
        k.anchor('center'),
        k.color(120, 120, 120),
        k.z(10),
      ]);
    });

    // 統計情報
    k.add([
      k.text(`Blocks Dropped: ${params.blocksDropped}`, { size: 14 }),
      k.pos(400, 580),
      k.anchor('center'),
      k.color(120, 120, 120),
      k.z(10),
    ]);

    // 最高記録表示
    k.add([
      k.text(`High Score: ${Math.max(previousHigh, finalScore)} pt`, { size: 14 }),
      k.pos(400, 605),
      k.anchor('center'),
      k.color(120, 120, 120),
      k.z(10),
    ]);

    // RETRYボタン
    const retryBtn = k.add([
      k.rect(200, 50, { radius: 8 }),
      k.pos(400, 680),
      k.anchor('center'),
      k.color(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b),
      k.area(),
      k.z(10),
      'retryBtn',
    ]);

    k.add([
      k.text('RETRY', { size: 24 }),
      k.pos(400, 680),
      k.anchor('center'),
      k.color(255, 255, 255),
      k.z(11),
    ]);

    // ホバーエフェクト
    retryBtn.onHover(() => {
      retryBtn.color = k.rgb(255, 140, 60);
    });

    retryBtn.onHoverEnd(() => {
      retryBtn.color = k.rgb(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b);
    });

    // リトライ
    const retry = () => {
      clearInterval(scoreInterval);
      audioManager.resume();
      k.go('title');
    };

    retryBtn.onClick(retry);
    k.onKeyPress('space', retry);
  });
}
