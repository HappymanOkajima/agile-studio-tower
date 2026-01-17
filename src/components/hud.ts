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
  windPole: GameObj;
  windFlagStrips: GameObj[]; // ドット絵風の三角形旗（複数の短冊）
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
    k.rect(6, 550),
    k.pos(390, 70),
    k.color(230, 230, 230),
    k.fixed(),
    k.z(99),
  ]);

  // 高さマーカー
  const heightMarker = k.add([
    k.rect(10, 4),
    k.pos(390, 618),
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
    k.pos(200, 8),
    k.anchor('center'),
    k.color(150, 150, 150),
    k.fixed(),
    k.z(100),
  ]);

  // 風のポール（固定）- 少し上に配置
  const windPole = k.add([
    k.rect(3, 24),
    k.pos(200, 18),
    k.anchor('top'),
    k.color(120, 120, 120),
    k.fixed(),
    k.z(100),
  ]);

  // 風の旗（ドット絵風三角形 - 5本の短冊で構成）
  // 各短冊は高さが異なり、三角形を形成
  const stripHeights = [10, 8, 6, 4, 2]; // 根元から先端へ（少し小さく）
  const stripWidth = 4;
  const flagBaseY = 22; // 旗の基準Y位置
  const windFlagStrips: GameObj[] = [];

  for (let i = 0; i < stripHeights.length; i++) {
    const strip = k.add([
      k.rect(stripWidth, stripHeights[i]),
      k.pos(200 + i * stripWidth, flagBaseY),
      k.anchor('left'),
      k.color(100, 180, 220),
      k.fixed(),
      k.z(101),
    ]);
    windFlagStrips.push(strip);
  }

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
    windPole,
    windFlagStrips,
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

  // 高さマーカー更新（0〜550の範囲を550pxにマッピング）
  const normalizedHeight = Math.min(state.velocity / 550, 1);
  const markerY = 618 - normalizedHeight * 548;
  hud.heightMarker.pos.y = markerY;

  // 風インジケーター更新（ドット絵風三角形旗）
  const wind = getWindStrength();
  const absWind = Math.abs(wind);

  const stripWidth = 4;
  const stripHeights = [10, 8, 6, 4, 2];
  const flagBaseY = 22;
  // 風の強さに応じて表示する短冊数（1〜5）
  const visibleStrips = absWind < 0.2 ? 1 : absWind < 0.4 ? 2 : absWind < 0.6 ? 3 : absWind < 0.8 ? 4 : 5;

  // 現在時刻（ゆらぎアニメーション用）
  const time = k.time();

  hud.windFlagStrips.forEach((strip, i) => {
    if (i < visibleStrips) {
      strip.hidden = false;
      strip.height = stripHeights[i];

      // 各短冊ごとに位相をずらしたゆらぎ（先端ほど大きく揺れる）
      const wavePhase = i * 0.8; // 位相のずれ
      const waveAmplitude = (i + 1) * 0.5 * absWind; // 振幅（先端ほど大きく、風が強いほど大きく）
      const wave = Math.sin(time * 8 + wavePhase) * waveAmplitude;

      if (absWind < 0.2) {
        // 微風：旗を垂れ下げる（ポール直下に小さく）
        strip.pos.x = 199;
        strip.pos.y = flagBaseY + i * 3;
        strip.width = 3;
        strip.height = 3;
        strip.color = k.rgb(150, 150, 150);
      } else if (wind < 0) {
        // 左向きの風：旗を左に伸ばす
        strip.pos.x = 199 - (i + 1) * stripWidth;
        strip.pos.y = flagBaseY + wave;
        strip.width = stripWidth;
        strip.color = k.rgb(100, 180, 220);
      } else {
        // 右向きの風：旗を右に伸ばす
        strip.pos.x = 201 + i * stripWidth;
        strip.pos.y = flagBaseY + wave;
        strip.width = stripWidth;
        strip.color = k.rgb(100, 180, 220);
      }
    } else {
      strip.hidden = true;
    }
  });
}
