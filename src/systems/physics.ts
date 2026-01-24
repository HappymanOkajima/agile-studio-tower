import type { KaboomCtx, GameObj } from '../types';
import { getCurrentDifficultyPreset } from '../config/gameConfig';

// 基本設定（風設定は動的に更新される）
export const PHYSICS_CONFIG = {
  gravity: 2000,           // 重力（px/s²）
  groundY: 650,            // 地面のY座標（下部に余裕を持たせる）
  groundWidth: 220,        // 地面の幅（狭めでハラハラ感UP）
  groundHeight: 16,        // 地面の高さ
  fallThreshold: 750,      // この高さを超えたらゲームオーバー
  leftBound: 0,            // 左端
  rightBound: 400,         // 右端（400幅）
  // シーソー設定
  seesawSensitivity: 0.008, // 傾き感度
  maxTilt: 15,              // 最大傾斜角度（度）
  tiltDamping: 0.85,        // 傾き変化の減衰
  torqueDeadzone: 0,        // デッドゾーン無し
  restoreForce: 0.15,       // 自然な復元力（弱め）
  counterBonus: 2.5,        // カウンター効果倍率（傾きと反対側のブロックは効果UP）
  // 滑り設定
  slideSpeed: 15,           // ブロックの滑り速度係数
  slideThreshold: 14,       // この角度以上で滑り始める
  // 風設定（難易度プリセットから動的に取得）
  windCycleTime: 4,         // 風が変わる周期（秒）
  windMaxStrength: 80,      // 風の最大強さ（px/s）
  windFallingMultiplier: 2, // 落下中ブロックへの風の倍率
  windCenterMultiplier: 1.5, // 中央付近への風の影響倍率
};

// 難易度プリセットから物理設定を更新
export function updatePhysicsConfig(): void {
  const preset = getCurrentDifficultyPreset();
  // 風設定
  PHYSICS_CONFIG.windCycleTime = preset.wind.cycleTime;
  PHYSICS_CONFIG.windMaxStrength = preset.wind.maxStrength;
  PHYSICS_CONFIG.windFallingMultiplier = preset.wind.fallingMultiplier;
  PHYSICS_CONFIG.windCenterMultiplier = preset.wind.centerMultiplier;
  // シーソー設定
  PHYSICS_CONFIG.seesawSensitivity = preset.seesaw.sensitivity;
  PHYSICS_CONFIG.slideSpeed = preset.seesaw.slideSpeed;
  PHYSICS_CONFIG.tiltDamping = preset.seesaw.tiltDamping;
}

// 後方互換性のためのエイリアス
export const updateWindConfig = updatePhysicsConfig;

// シーソーの状態
let seesawAngle = 0;        // 現在の傾き（度）
let seesawAngularVel = 0;   // 角速度
let groundObj: GameObj | null = null;

// 風の状態
let windTime = 0;           // 風の時間カウンター
let currentWind = 0;        // 現在の風の強さ（-1〜1、負=左、正=右）

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
  windTime = 0;
  currentWind = 0;
}

// 現在の風の強さを取得（-1〜1）
export function getWindStrength(): number {
  return currentWind;
}

// 風を更新（毎フレーム呼ぶ）
export function updateWind(k: KaboomCtx): void {
  const dt = k.dt();
  windTime += dt;

  // サイン波で風を変化させる（滑らかに左右に変わる）
  const cycle = (2 * Math.PI) / PHYSICS_CONFIG.windCycleTime;
  currentWind = Math.sin(windTime * cycle);
}

// 風をブロックに適用（落下中のブロックのみ）
export function applyWindToBlocks(k: KaboomCtx): void {
  const dt = k.dt();
  const windForce = currentWind * PHYSICS_CONFIG.windMaxStrength;

  // 落下中のブロックにのみ風の影響を与える
  const droppedBlocks = k.get('droppedBlock');
  for (const block of droppedBlocks) {
    if (block.landed) continue; // 着地済みは影響なし

    // 中央からの距離を計算（0〜1）
    const distFromCenter = Math.abs(block.pos.x - 200) / 100; // 100px離れると1
    // 中央ほど風の影響が大きい（端は安定）
    const centerFactor = 1 + (1 - Math.min(distFromCenter, 1)) * (PHYSICS_CONFIG.windCenterMultiplier - 1);

    // 落下中は風の影響を受ける
    const force = windForce * PHYSICS_CONFIG.windFallingMultiplier * centerFactor;
    block.pos.x += force * dt;
  }
}

export function createGround(k: KaboomCtx): GameObj {
  // シーソー型の地面（中央支点）
  groundObj = k.add([
    k.rect(PHYSICS_CONFIG.groundWidth, PHYSICS_CONFIG.groundHeight),
    k.pos(200, PHYSICS_CONFIG.groundY),
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
    k.pos(200, PHYSICS_CONFIG.groundY + 10),
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

    // 中心(200)からの距離
    const distFromCenter = block.pos.x - 200;

    // ブロックの重さ（面積に比例、上限あり）
    const width = block.blockWidth ?? 50;
    const height = block.blockHeight ?? 50;
    const rawWeight = (width * height) / 1000; // 正規化
    const weight = Math.min(rawWeight, 12); // 重量上限（大ブロックでも傾きすぎない）

    // シンプルなてこの原理: トルク = 距離 × 重さ
    let torque = distFromCenter * weight;

    // カウンターボーナス: 傾きが大きい時だけ、反対側のブロックは効果が増幅
    // 傾きが大きいほどボーナスが増える（グラデーション）
    const tiltAmount = Math.abs(seesawAngle);
    const isCounterWeight = (seesawAngle > 0 && distFromCenter < -20) ||
                            (seesawAngle < 0 && distFromCenter > 20);
    if (isCounterWeight && tiltAmount > 3) {
      // 傾きが3度以上の時だけボーナス発動、傾きに比例して効果UP
      const bonusStrength = Math.min((tiltAmount - 3) / 10, 1); // 3度〜13度で0〜1
      torque *= 1 + (PHYSICS_CONFIG.counterBonus - 1) * bonusStrength;
    }

    totalTorque += torque;
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
