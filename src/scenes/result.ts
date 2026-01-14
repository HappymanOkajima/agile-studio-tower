import type { KaboomCtx, ResultParams } from '../types';
import { getRankForScore } from '../data/rankings';
import { audioManager } from '../systems/audioManager';

const ACCENT_COLOR = { r: 239, g: 112, b: 33 }; // #ef7021

export function createResultScene(k: KaboomCtx): void {
  k.scene('result', (params: ResultParams) => {
    // 崩壊した場合はスコア0
    const finalScore = params.reason === 'blockFell' ? 0 : params.score;
    const rank = getRankForScore(finalScore);

    // 白背景
    k.add([
      k.rect(800, 800),
      k.pos(0, 0),
      k.color(255, 255, 255),
      k.z(0),
    ]);

    // 結果ヘッダー
    const headerText = params.reason === 'complete' ? 'COMPLETE!' : 'TOWER COLLAPSED...';
    const headerColor = params.reason === 'complete'
      ? k.rgb(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b)
      : k.rgb(180, 50, 50);

    k.add([
      k.text(headerText, { size: 36 }),
      k.pos(400, 150),
      k.anchor('center'),
      k.color(headerColor),
      k.z(10),
    ]);

    // Velocityラベル
    k.add([
      k.text('Total Velocity', { size: 20 }),
      k.pos(400, 230),
      k.anchor('center'),
      k.color(100, 100, 100),
      k.z(10),
    ]);

    // Velocity値（アニメーション付き）
    let displayScore = 0;
    const scoreText = k.add([
      k.text('0', { size: 80 }),
      k.pos(400, 300),
      k.anchor('center'),
      k.color(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b),
      k.z(10),
    ]);

    // スコアカウントアップアニメーション
    const targetScore = finalScore;
    const scoreInterval = setInterval(() => {
      displayScore += Math.ceil(targetScore / 30);
      if (displayScore >= targetScore) {
        displayScore = targetScore;
        clearInterval(scoreInterval);
      }
      scoreText.text = String(displayScore);
    }, 50);

    // pts表示
    k.add([
      k.text('pts', { size: 24 }),
      k.pos(400, 360),
      k.anchor('center'),
      k.color(100, 100, 100),
      k.z(10),
    ]);

    // ランク表示（遅延表示）
    k.wait(1.5, () => {
      // ランクレベル
      k.add([
        k.text(`Lv.${rank.level}`, { size: 28 }),
        k.pos(400, 430),
        k.anchor('center'),
        k.color(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b),
        k.z(10),
      ]);

      // ランク称号
      k.add([
        k.text(rank.titleJa, { size: 32 }),
        k.pos(400, 475),
        k.anchor('center'),
        k.color(60, 60, 60),
        k.z(10),
      ]);

      // ランク称号（英語）
      k.add([
        k.text(rank.title, { size: 16 }),
        k.pos(400, 510),
        k.anchor('center'),
        k.color(120, 120, 120),
        k.z(10),
      ]);
    });

    // 統計情報
    k.add([
      k.text(`Blocks Dropped: ${params.blocksDropped}`, { size: 16 }),
      k.pos(400, 580),
      k.anchor('center'),
      k.color(120, 120, 120),
      k.z(10),
    ]);

    // RETRYボタン
    const retryBtn = k.add([
      k.rect(200, 50, { radius: 8 }),
      k.pos(400, 660),
      k.anchor('center'),
      k.color(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b),
      k.area(),
      k.z(10),
      'retryBtn',
    ]);

    k.add([
      k.text('RETRY', { size: 24 }),
      k.pos(400, 660),
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
