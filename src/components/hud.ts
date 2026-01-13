import type { KaboomCtx, GameObj, GameState } from '../types';

export interface HUDElements {
  blocksLabel: GameObj;
  blocksText: GameObj;
  velocityLabel: GameObj;
  velocityText: GameObj;
  heightBar: GameObj;
  heightMarker: GameObj;
}

const ACCENT_COLOR = { r: 239, g: 112, b: 33 }; // #ef7021

export function createHUD(k: KaboomCtx): HUDElements {
  // Blocks ラベル（左上）
  const blocksLabel = k.add([
    k.text('Blocks', { size: 14 }),
    k.pos(20, 15),
    k.color(100, 100, 100),
    k.fixed(),
    k.z(100),
  ]);

  // Blocks 値
  const blocksText = k.add([
    k.text('10', { size: 40 }),
    k.pos(20, 32),
    k.color(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b),
    k.fixed(),
    k.z(100),
  ]);

  // Velocity ラベル（右上）
  const velocityLabel = k.add([
    k.text('Velocity', { size: 14 }),
    k.pos(680, 15),
    k.color(100, 100, 100),
    k.fixed(),
    k.z(100),
  ]);

  // Velocity 値
  const velocityText = k.add([
    k.text('0', { size: 40 }),
    k.pos(680, 32),
    k.color(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b),
    k.fixed(),
    k.z(100),
  ]);

  // 高さインジケーター背景（右端）
  const heightBar = k.add([
    k.rect(8, 600),
    k.pos(785, 100),
    k.color(230, 230, 230),
    k.fixed(),
    k.z(99),
  ]);

  // 高さマーカー
  const heightMarker = k.add([
    k.rect(12, 4),
    k.pos(783, 698),
    k.anchor('center'),
    k.color(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b),
    k.fixed(),
    k.z(100),
  ]);

  return {
    blocksLabel,
    blocksText,
    velocityLabel,
    velocityText,
    heightBar,
    heightMarker,
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

  // Velocity更新
  hud.velocityText.text = String(state.velocity);

  // 高さマーカー更新（0〜600の範囲を600pxにマッピング）
  const normalizedHeight = Math.min(state.velocity / 600, 1);
  const markerY = 698 - normalizedHeight * 598;
  hud.heightMarker.pos.y = markerY;
}
