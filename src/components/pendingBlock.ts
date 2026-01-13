import type { KaboomCtx, GameObj, BlockConfig } from '../types';

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
}

// 待機中のブロック（上部で往復）を作成
export function createPendingBlock(
  k: KaboomCtx,
  config: BlockConfig,
  speed: number
): GameObj {
  const components: any[] = [
    k.pos(400, SPAWN_Y),
    k.anchor('center'),
    k.z(50),
    {
      pendingData: {
        direction: 1,
        speed,
        config,
      } as PendingBlockData,
    },
    'pendingBlock',
  ];

  // ブロックタイプに応じた見た目
  if (config.type === 'obstacle' && config.shape === 'circle') {
    components.unshift(k.circle(config.width / 2));
    components.push(k.color(200, 50, 50));
    components.push(k.outline(2, k.rgb(150, 30, 30)));
  } else if (config.type === 'obstacle' && config.shape === 'triangle') {
    // 三角形はポリゴンで表現
    const hw = config.width / 2;
    const hh = config.height / 2;
    components.unshift(k.polygon([
      k.vec2(0, -hh),
      k.vec2(hw, hh),
      k.vec2(-hw, hh),
    ]));
    components.push(k.color(200, 50, 50));
    components.push(k.outline(2, k.rgb(150, 30, 30)));
  } else if (config.type === 'image' && config.imageUrl) {
    // 画像ブロック（スプライトを使用）
    components.unshift(k.sprite(config.imageUrl, {
      width: config.width,
      height: config.height,
    }));
    components.push(k.outline(2, k.rgb(180, 80, 20)));
  } else {
    // キーワードブロックまたはフォールバック
    components.unshift(k.rect(config.width, config.height));
    components.push(k.color(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b));
    components.push(k.outline(2, k.rgb(180, 80, 20)));
  }

  const block = k.add(components);

  // テキストラベルを追加（キーワードブロックまたはお邪魔ブロック）
  const displayText = config.type === 'keyword' ? config.text :
                      config.type === 'obstacle' ? config.obstacleText : null;

  if (displayText) {
    const fontSize = calculateFontSize(displayText, config.width, config.height);
    k.add([
      k.text(displayText, { size: fontSize }),
      k.pos(0, 0),
      k.anchor('center'),
      k.color(255, 255, 255),
      k.z(51),
      {
        update(this: GameObj) {
          this.pos = block.pos.clone();
        },
      },
      'pendingBlockLabel',
    ]);
  }

  return block;
}

// ブロックの往復移動を更新
export function updatePendingBlock(block: GameObj, dt: number): void {
  const data = block.pendingData as PendingBlockData;

  block.pos.x += data.direction * data.speed * dt;

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
  const pendingData = pendingBlock.pendingData as PendingBlockData;

  // 待機中ブロックと関連ラベルを削除
  k.get('pendingBlockLabel').forEach((label) => k.destroy(label));
  k.destroy(pendingBlock);

  // 移動方向に基づいて回転速度を決定
  const rotationSpeed = pendingData.direction * (80 + Math.random() * 120); // 回転速度（度/秒）

  // 物理演算付きの落下ブロックを作成
  // blockSize: 高さ計算用（円の場合は直径、それ以外はconfig.height）
  const blockSize = config.shape === 'circle' ? config.width : config.height;

  const components: any[] = [
    k.pos(x, SPAWN_Y),
    k.anchor('center'),
    k.area(),
    k.body(),
    k.rotate(0),
    k.z(10),
    {
      rotSpeed: rotationSpeed,
      landed: false,
      blockWidth: config.width,
      blockHeight: blockSize,
    },
    'droppedBlock',
  ];

  // ブロックタイプに応じた見た目
  if (config.type === 'obstacle' && config.shape === 'circle') {
    components.unshift(k.circle(config.width / 2));
    components.push(k.color(200, 50, 50));
  } else if (config.type === 'obstacle' && config.shape === 'triangle') {
    const hw = config.width / 2;
    const hh = config.height / 2;
    components.unshift(k.polygon([
      k.vec2(0, -hh),
      k.vec2(hw, hh),
      k.vec2(-hw, hh),
    ]));
    components.push(k.color(200, 50, 50));
  } else if (config.type === 'image' && config.imageUrl) {
    // 画像ブロック（スプライトを使用）
    components.unshift(k.sprite(config.imageUrl, {
      width: config.width,
      height: config.height,
    }));
  } else {
    // キーワードブロックまたはフォールバック
    components.unshift(k.rect(config.width, config.height));
    components.push(k.color(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b));
  }

  const droppedBlock = k.add(components);

  // 落下中は回転、着地したら停止
  droppedBlock.onUpdate(() => {
    if (!droppedBlock.landed) {
      droppedBlock.angle += droppedBlock.rotSpeed * k.dt();
    }
  });

  // 着地検出
  droppedBlock.onCollide('ground', () => {
    droppedBlock.landed = true;
  });
  droppedBlock.onCollide('droppedBlock', () => {
    droppedBlock.landed = true;
  });

  // テキストラベルを追加
  const displayText = config.type === 'keyword' ? config.text :
                      config.type === 'obstacle' ? config.obstacleText : null;

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
