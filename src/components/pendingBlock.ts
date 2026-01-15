import type { KaboomCtx, GameObj, BlockConfig } from '../types';
import { PHYSICS_CONFIG, getGroundTilt } from '../systems/physics';

const SPAWN_Y = 60;       // ブロックの初期Y位置
const LEFT_BOUND = 100;   // 左端の折り返し位置
const RIGHT_BOUND = 700;  // 右端の折り返し位置

const ACCENT_COLOR = { r: 239, g: 112, b: 33 }; // #ef7021

// ブロックサイズに収まるフォントサイズを計算
function calculateFontSize(text: string, blockWidth: number, blockHeight: number): number {
  // テキスト幅の目安: フォントサイズ × 文字数 × 比率（日本語は約0.9）
  const charWidthRatio = /[^\x00-\x7F]/.test(text) ? 0.9 : 0.6;
  const maxFontByWidth = (blockWidth * 0.85) / (text.length * charWidthRatio);
  const maxFontByHeight = blockHeight * 0.65;
  // 最小8px、最大14px
  return Math.max(8, Math.min(maxFontByWidth, maxFontByHeight, 14));
}

interface PendingBlockData {
  direction: number;
  speed: number;
  config: BlockConfig;
  rotSpeed: number;  // 回転速度
}

// 待機中のブロック（上部で往復）を作成
export function createPendingBlock(
  k: KaboomCtx,
  config: BlockConfig,
  speed: number
): GameObj {
  // ランダムな回転速度（方向もランダム）
  const rotSpeed = (Math.random() < 0.5 ? 1 : -1) * (60 + Math.random() * 80);

  const components: any[] = [
    k.pos(400, SPAWN_Y),
    k.anchor('center'),
    k.rotate(0),  // 回転コンポーネント追加
    k.z(50),
    {
      pendingData: {
        direction: 1,
        speed,
        config,
        rotSpeed,
      } as PendingBlockData,
    },
    'pendingBlock',
  ];

  // ブロックの見た目（矩形のみ）
  if (config.type === 'image' && config.imageUrl) {
    // 画像ブロック
    components.unshift(k.sprite(config.imageUrl, {
      width: config.width,
      height: config.height,
    }));
    components.push(k.outline(2, k.rgb(180, 80, 20)));
  } else {
    // キーワードブロック（矩形）
    components.unshift(k.rect(config.width, config.height));
    components.push(k.color(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b));
    components.push(k.outline(2, k.rgb(180, 80, 20)));
  }

  const block = k.add(components);

  // テキストラベルを追加（キーワードブロックのみ）
  const displayText = config.type === 'keyword' ? config.text : null;

  if (displayText) {
    const fontSize = calculateFontSize(displayText, config.width, config.height);
    k.add([
      k.text(displayText, { size: fontSize }),
      k.pos(0, 0),
      k.anchor('center'),
      k.rotate(0),
      k.color(255, 255, 255),
      k.z(51),
      {
        update(this: GameObj) {
          this.pos = block.pos.clone();
          this.angle = block.angle;  // 回転も追従
        },
      },
      'pendingBlockLabel',
    ]);
  }

  return block;
}

// ブロックの往復移動と回転を更新
export function updatePendingBlock(block: GameObj, dt: number): void {
  const data = block.pendingData as PendingBlockData;

  // 横移動
  block.pos.x += data.direction * data.speed * dt;

  // 回転（待機中は常に回転）
  block.angle += data.rotSpeed * dt;

  // 端で反転
  if (block.pos.x <= LEFT_BOUND) {
    block.pos.x = LEFT_BOUND;
    data.direction = 1;
  } else if (block.pos.x >= RIGHT_BOUND) {
    block.pos.x = RIGHT_BOUND;
    data.direction = -1;
  }
}

// ブロックを落下させる
export function dropPendingBlock(
  k: KaboomCtx,
  pendingBlock: GameObj,
  config: BlockConfig
): GameObj {
  const x = pendingBlock.pos.x;
  const currentAngle = pendingBlock.angle ?? 0;  // 現在の角度を保持

  // 待機中ブロックと関連ラベルを削除
  k.get('pendingBlockLabel').forEach((label) => k.destroy(label));
  k.destroy(pendingBlock);

  // 物理演算付きの落下ブロックを作成（矩形のみ）
  const components: any[] = [
    k.pos(x, SPAWN_Y),
    k.anchor('center'),
    k.body(),
    k.rotate(currentAngle),  // 落下時の角度を保持
    k.z(10),
    {
      landed: false,
      blockWidth: config.width,
      blockHeight: config.height,
    },
    'droppedBlock',
  ];

  // ブロックの見た目と当たり判定（矩形のみ）
  if (config.type === 'image' && config.imageUrl) {
    // 画像ブロック
    components.unshift(k.sprite(config.imageUrl, {
      width: config.width,
      height: config.height,
    }));
    components.push(k.area());
  } else {
    // キーワードブロック（矩形）
    components.unshift(k.rect(config.width, config.height));
    components.push(k.area());
    components.push(k.color(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b));
  }

  const droppedBlock = k.add(components);

  // 着地時の安定角度を記録するための変数
  let landedStableAngle: number | null = null;

  // 着地検出（着地時の角度を記録）
  const onLand = () => {
    if (droppedBlock.landed) return;
    droppedBlock.landed = true;

    // 着地時の角度から最も近い安定角度を計算して固定
    let angle = droppedBlock.angle % 360;
    if (angle < 0) angle += 360;
    landedStableAngle = Math.round(angle / 90) * 90;

    // 着地時にシーソーの傾きも考慮して初期角度を設定
    const groundTilt = getGroundTilt();
    droppedBlock.angle = landedStableAngle + groundTilt;
  };

  droppedBlock.onCollide('ground', onLand);
  droppedBlock.onCollide('droppedBlock', onLand);

  // 着地後の物理挙動（矩形のみ）
  droppedBlock.onUpdate(() => {
    if (!droppedBlock.landed || landedStableAngle === null) return;

    const groundTilt = getGroundTilt(); // シーソーの現在の傾き（度）
    const dt = k.dt();

    // 目標角度 = 着地時に決定した安定角度 + シーソーの傾き
    const targetAngle = landedStableAngle + groundTilt;

    // 現在の角度から目標角度への差分
    const diff = targetAngle - droppedBlock.angle;

    // スムーズに目標角度に追従（閾値: 0.5度）
    if (Math.abs(diff) > 0.5) {
      const rotateSpeed = 180; // 度/秒（追従速度を上げる）
      const rotateAmount = Math.sign(diff) * Math.min(Math.abs(diff), rotateSpeed * dt);
      droppedBlock.angle += rotateAmount;
    }

    // 傾きが大きい場合は滑る
    if (Math.abs(groundTilt) > PHYSICS_CONFIG.slideThreshold) {
      const slideDir = Math.sign(groundTilt);
      const tiltStrength = Math.abs(groundTilt) / PHYSICS_CONFIG.maxTilt;
      const slideSpeed = PHYSICS_CONFIG.slideSpeed * tiltStrength;
      droppedBlock.pos.x += slideDir * slideSpeed * dt;
    }
  });

  // テキストラベルを追加（キーワードブロックのみ）
  const displayText = config.type === 'keyword' ? config.text : null;

  if (displayText) {
    const fontSize = calculateFontSize(displayText, config.width, config.height);
    k.add([
      k.text(displayText, { size: fontSize }),
      k.pos(0, 0),
      k.anchor('center'),
      k.rotate(0),
      k.color(255, 255, 255),
      k.z(11),
      {
        update(this: GameObj) {
          this.pos = droppedBlock.pos.clone();
          if (droppedBlock.angle !== undefined) {
            this.angle = droppedBlock.angle;
          }
        },
      },
      'droppedBlockLabel',
    ]);
  }

  return droppedBlock;
}
