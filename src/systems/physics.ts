import type { KaboomCtx, GameObj } from 'kaboom';

export const PHYSICS_CONFIG = {
  gravity: 2000,           // 重力（px/s²）- やや弱めで揺れやすく
  groundY: 750,            // 地面のY座標（画面高800に合わせて）
  groundWidth: 180,        // 地面の幅（かなり狭くして不安定に）
  groundHeight: 20,        // 地面の高さ
  fallThreshold: 820,      // この高さを超えたらゲームオーバー
  leftBound: 0,            // 左端
  rightBound: 800,         // 右端
};

export function setupPhysics(k: KaboomCtx): void {
  k.setGravity(PHYSICS_CONFIG.gravity);
}

export function createGround(k: KaboomCtx): GameObj {
  // 中央に狭い土台を配置
  const groundX = (800 - PHYSICS_CONFIG.groundWidth) / 2;

  return k.add([
    k.rect(PHYSICS_CONFIG.groundWidth, PHYSICS_CONFIG.groundHeight),
    k.pos(groundX, PHYSICS_CONFIG.groundY),
    k.anchor('topleft'),
    k.area(),
    k.body({ isStatic: true }),
    k.color(60, 60, 60),
    k.outline(2, k.rgb(40, 40, 40)),
    'ground',
  ]);
}

export function checkFallenBlocks(k: KaboomCtx): boolean {
  const blocks = k.get('droppedBlock');
  for (const block of blocks) {
    // 画面下に落ちたか確認
    if (block.pos.y > PHYSICS_CONFIG.fallThreshold) {
      return true;
    }
    // 画面横に落ちたか確認
    if (block.pos.x < PHYSICS_CONFIG.leftBound - 100 ||
        block.pos.x > PHYSICS_CONFIG.rightBound + 100) {
      return true;
    }
  }
  return false;
}

// 回転を考慮したブロックの見かけ上の高さを計算
function getRotatedHeight(width: number, height: number, angleDeg: number): number {
  // 角度をラジアンに変換
  const angleRad = (angleDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(angleRad));
  const sin = Math.abs(Math.sin(angleRad));

  // 回転後のバウンディングボックスの高さ
  // 矩形を回転させた時のY方向サイズ
  return width * sin + height * cos;
}

// ブロックの現在の最高到達点を計算
export function calculateMaxHeight(k: KaboomCtx): number {
  const blocks = k.get('droppedBlock');
  let maxHeight = 0;

  for (const block of blocks) {
    // 着地していないブロックは無視（落下中のブロックをカウントしない）
    if (!block.landed) continue;

    const width = block.blockWidth ?? block.width ?? 50;
    const height = block.blockHeight ?? block.height ?? 50;
    const angle = block.angle ?? 0;

    // 回転を考慮した見かけ上の高さ
    const apparentHeight = getRotatedHeight(width, height, angle);

    // ブロックの上端Y = pos.y - apparentHeight/2（回転後の高さの半分）
    const blockTopY = block.pos.y - apparentHeight / 2;

    // このブロックが地面からどれだけ積み上がっているか
    const heightFromGround = PHYSICS_CONFIG.groundY - blockTopY;

    if (heightFromGround > maxHeight) {
      maxHeight = heightFromGround;
    }
  }

  return Math.max(0, Math.floor(maxHeight));
}
