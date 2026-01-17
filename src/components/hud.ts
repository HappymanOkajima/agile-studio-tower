import type { KaboomCtx, GameObj, GameState } from '../types';
import { GAME_CONFIG } from '../systems/scoreManager';
import { PHYSICS_CONFIG, getWindStrength } from '../systems/physics';

export interface HUDElements {
  blocksLabel: GameObj;
  blocksText: GameObj;
  timerLabel: GameObj;
  timerText: GameObj;
  velocityLabel: GameObj;
  velocityText: GameObj;
  heightBar: GameObj;
  heightMarker: GameObj;
  winLine: GameObj;
  winLineLabel: GameObj;
  windIndicator: GameObj;
  windArrow: GameObj;
}

const ACCENT_COLOR = { r: 239, g: 112, b: 33 }; // #ef7021

export function createHUD(k: KaboomCtx): HUDElements {
  // Blocks ラベル（左上）
  const blocksLabel = k.add([
    k.text('Blocks', { size: 12 }),
    k.pos(10, 12),
    k.color(100, 100, 100),
    k.fixed(),
    k.z(100),
  ]);

  // Blocks 値
  const blocksText = k.add([
    k.text('10', { size: 32 }),
    k.pos(10, 26),
    k.color(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b),
    k.fixed(),
    k.z(100),
  ]);

  // Timer ラベル（左上、Blocksの右）
  const timerLabel = k.add([
    k.text('Time', { size: 12 }),
    k.pos(80, 12),
    k.color(100, 100, 100),
    k.fixed(),
    k.z(100),
  ]);

  // Timer 値
  const timerText = k.add([
    k.text('30', { size: 32 }),
    k.pos(80, 26),
    k.color(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b),
    k.fixed(),
    k.z(100),
  ]);

  // Velocity ラベル（右上）
  const velocityLabel = k.add([
    k.text('Velocity', { size: 12 }),
    k.pos(300, 12),
    k.color(100, 100, 100),
    k.fixed(),
    k.z(100),
  ]);

  // Velocity 値
  const velocityText = k.add([
    k.text('0', { size: 32 }),
    k.pos(300, 26),
    k.color(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b),
    k.fixed(),
    k.z(100),
  ]);

  // 高さインジケーター背景（右端）
  const heightBar = k.add([
    k.rect(6, 600),
    k.pos(390, 100),
    k.color(230, 230, 230),
    k.fixed(),
    k.z(99),
  ]);

  // 高さマーカー
  const heightMarker = k.add([
    k.rect(10, 4),
    k.pos(390, 698),
    k.anchor('center'),
    k.color(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b),
    k.fixed(),
    k.z(100),
  ]);

  // クリアライン（実際のゲーム画面上の位置）
  // 地面Y座標からWIN_THRESHOLD分上の位置
  const gameWinLineY = PHYSICS_CONFIG.groundY - GAME_CONFIG.WIN_THRESHOLD;
  const winLine = k.add([
    k.rect(380, 2),
    k.pos(10, gameWinLineY),
    k.color(50, 180, 50),
    k.opacity(0.6),
    k.z(98),
  ]);

  // クリアラインラベル
  const winLineLabel = k.add([
    k.text('CLEAR', { size: 9 }),
    k.pos(350, gameWinLineY - 10),
    k.color(50, 180, 50),
    k.z(98),
  ]);

  // 風インジケーター（上部中央）
  const windIndicator = k.add([
    k.text('WIND', { size: 10 }),
    k.pos(200, 12),
    k.anchor('center'),
    k.color(150, 150, 150),
    k.fixed(),
    k.z(100),
  ]);

  // 風の矢印
  const windArrow = k.add([
    k.text('< >', { size: 16 }),
    k.pos(200, 32),
    k.anchor('center'),
    k.color(100, 180, 220),
    k.fixed(),
    k.z(100),
  ]);

  return {
    blocksLabel,
    blocksText,
    timerLabel,
    timerText,
    velocityLabel,
    velocityText,
    heightBar,
    heightMarker,
    winLine,
    winLineLabel,
    windIndicator,
    windArrow,
  };
}

export function updateHUD(k: KaboomCtx, hud: HUDElements, state: GameState): void {
  // 残りブロック数更新
  hud.blocksText.text = String(state.blocksRemaining);

  // 残り3個以下でオレンジ→赤に
  if (state.blocksRemaining <= 3) {
    hud.blocksText.color = k.rgb(255, 100, 50);
  } else {
    hud.blocksText.color = k.rgb(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b);
  }

  // タイマー更新
  const timeDisplay = Math.ceil(state.timeRemaining);
  hud.timerText.text = String(timeDisplay);

  // 残り10秒以下で赤く、5秒以下で点滅
  if (state.timeRemaining <= 5) {
    const blink = Math.sin(state.timeRemaining * 10) > 0;
    hud.timerText.color = blink ? k.rgb(255, 50, 50) : k.rgb(200, 50, 50);
  } else if (state.timeRemaining <= 10) {
    hud.timerText.color = k.rgb(255, 100, 50);
  } else {
    hud.timerText.color = k.rgb(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b);
  }

  // Velocity更新
  hud.velocityText.text = String(state.velocity);

  // 高さマーカー更新（0〜600の範囲を600pxにマッピング）
  const normalizedHeight = Math.min(state.velocity / 600, 1);
  const markerY = 698 - normalizedHeight * 598;
  hud.heightMarker.pos.y = markerY;

  // 風インジケーター更新
  const wind = getWindStrength();
  const absWind = Math.abs(wind);

  // 風の強さに応じて矢印を更新
  if (absWind < 0.2) {
    hud.windArrow.text = '- -';
    hud.windArrow.color = k.rgb(150, 150, 150);
  } else if (wind < 0) {
    // 左向きの風
    const arrows = absWind > 0.7 ? '<<<' : absWind > 0.4 ? '<<' : '<';
    hud.windArrow.text = arrows;
    hud.windArrow.color = k.rgb(100, 180, 220);
  } else {
    // 右向きの風
    const arrows = absWind > 0.7 ? '>>>' : absWind > 0.4 ? '>>' : '>';
    hud.windArrow.text = arrows;
    hud.windArrow.color = k.rgb(100, 180, 220);
  }
}
