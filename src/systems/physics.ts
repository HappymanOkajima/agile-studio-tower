import type { KaboomCtx, GameObj } from 'kaboom';

export const PHYSICS_CONFIG = {
  gravity: 2000,           // 重力（px/s²）
  groundY: 750,            // 地面のY座標（画面高800に合わせて）
  groundWidth: 320,        // 地面の幅（シーソー用に少し広め）
  groundHeight: 16,        // 地面の高さ
  fallThreshold: 820,      // この高さを超えたらゲームオーバー
  leftBound: 0,            // 左端
  rightBound: 800,         // 右端
  // シーソー設定
  seesawSensitivity: 0.012, // 傾き感度（上げてトルクを効きやすく）
  maxTilt: 15,              // 最大傾斜角度（度）- 下げて崩壊を防ぐ
  tiltDamping: 0.85,        // 傾き変化の減衰（少し上げて反応良く）
  torqueDeadzone: 20,       // デッドゾーンを小さく（反対側の効果を感じやすく）
  restoreForce: 0.25,       // 復元力を上げてバランス回復しやすく
  leverMultiplier: 1.8,     // てこの倍率（距離の効果を強調）
  // 滑り設定
  slideSpeed: 15,           // ブロックの滑り速度係数
  slideThreshold: 14,       // この角度以上で滑り始める
};

// シーソーの状態
let seesawAngle = 0;        // 現在の傾き（度）
let seesawAngularVel = 0;   // 角速度
let groundObj: GameObj | null = null;

export function getGroundTilt(): number {
  return seesawAngle;
}

export function getTiltDirection(): number {
  return seesawAngle > 0 ? 1 : seesawAngle < 0 ? -1 : 0;
}

export function setupPhysics(k: KaboomCtx): void {
  k.setGravity(PHYSICS_CONFIG.gravity);
  seesawAngle = 0;
  seesawAngularVel = 0;
}

export function createGround(k: KaboomCtx): GameObj {
  // シーソー型の地面（中央支点）
  groundObj = k.add([
    k.rect(PHYSICS_CONFIG.groundWidth, PHYSICS_CONFIG.groundHeight),
    k.pos(400, PHYSICS_CONFIG.groundY),
    k.anchor('center'),
    k.rotate(0),
    k.area(),
    k.body({ isStatic: true }),
    k.color(60, 60, 60),
    k.outline(2, k.rgb(40, 40, 40)),
    'ground',
  ]);

  // 支点の三角形（視覚的な装飾）
  k.add([
    k.polygon([
      k.vec2(0, 0),
      k.vec2(-20, 30),
      k.vec2(20, 30),
    ]),
    k.pos(400, PHYSICS_CONFIG.groundY + 10),
    k.anchor('center'),
    k.color(80, 80, 80),
    k.z(5),
  ]);

  return groundObj;
}

// シーソーの傾きを更新（毎フレーム呼ぶ）
export function updateSeesaw(k: KaboomCtx): void {
  if (!groundObj) return;

  const blocks = k.get('droppedBlock');
  let totalTorque = 0;

  // 各ブロックのトルクを計算（てこの原理: 距離 × 重さ）
  for (const block of blocks) {
    if (!block.landed) continue;

    // 中心(400)からの距離
    const distFromCenter = block.pos.x - 400;

    // ブロックの重さ（面積に比例）
    const width = block.blockWidth ?? 50;
    const height = block.blockHeight ?? 50;
    const weight = (width * height) / 1000; // 正規化

    // てこの原理: 距離が遠いほど効果が大きい
    // 距離の絶対値に倍率をかけて、符号を戻す
    const leverEffect = Math.sign(distFromCenter) *
      Math.pow(Math.abs(distFromCenter), PHYSICS_CONFIG.leverMultiplier) /
      Math.pow(100, PHYSICS_CONFIG.leverMultiplier - 1); // 正規化（100px基準）

    // トルク = てこ効果 × 重さ
    totalTorque += leverEffect * weight;
  }

  // デッドゾーン: 小さなトルクは無視（バランスが取りやすく）
  if (Math.abs(totalTorque) < PHYSICS_CONFIG.torqueDeadzone) {
    totalTorque = 0;
  } else {
    // デッドゾーンを超えた分だけ適用
    totalTorque = totalTorque - Math.sign(totalTorque) * PHYSICS_CONFIG.torqueDeadzone;
  }

  // 角加速度を計算
  const angularAccel = totalTorque * PHYSICS_CONFIG.seesawSensitivity;

  // 復元力: 中央に戻ろうとする力（角度に比例）
  // これにより、反対側にブロックを置けばバランスを取り戻せる
  const restoreAccel = -seesawAngle * PHYSICS_CONFIG.restoreForce;

  // 角速度を更新（減衰付き）
  seesawAngularVel += (angularAccel + restoreAccel) * k.dt();
  seesawAngularVel *= PHYSICS_CONFIG.tiltDamping;

  // 角度を更新
  seesawAngle += seesawAngularVel;

  // 最大傾斜を制限
  seesawAngle = Math.max(-PHYSICS_CONFIG.maxTilt, Math.min(PHYSICS_CONFIG.maxTilt, seesawAngle));

  // 地面の角度を更新
  groundObj.angle = seesawAngle;
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
