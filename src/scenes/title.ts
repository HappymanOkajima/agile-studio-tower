import type { KaboomCtx } from '../types';
import { audioManager } from '../systems/audioManager';

const ACCENT_COLOR = { r: 239, g: 112, b: 33 }; // #ef7021

export function createTitleScene(k: KaboomCtx): void {
  k.scene('title', () => {
    // 白背景
    k.add([
      k.rect(800, 800),
      k.pos(0, 0),
      k.color(255, 255, 255),
      k.z(0),
    ]);

    // デモブロック（背景で落下）
    createDemoAnimation(k);

    // タイトル: AGILE STUDIO
    k.add([
      k.text('AGILE STUDIO', { size: 42 }),
      k.pos(400, 280),
      k.anchor('center'),
      k.color(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b),
      k.z(10),
    ]);

    // タイトル: TOWER
    k.add([
      k.text('TOWER', { size: 72 }),
      k.pos(400, 350),
      k.anchor('center'),
      k.color(60, 60, 60),
      k.z(10),
    ]);

    // サブタイトル
    k.add([
      k.text('~積み上げろ！アジャイルの塔~', { size: 18 }),
      k.pos(400, 410),
      k.anchor('center'),
      k.color(120, 120, 120),
      k.z(10),
    ]);

    // スタートボタン背景
    const startBtn = k.add([
      k.rect(260, 60, { radius: 8 }),
      k.pos(400, 520),
      k.anchor('center'),
      k.color(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b),
      k.area(),
      k.z(10),
      'startBtn',
    ]);

    // スタートボタンテキスト
    k.add([
      k.text('SPRINT START', { size: 26 }),
      k.pos(400, 520),
      k.anchor('center'),
      k.color(255, 255, 255),
      k.z(11),
    ]);

    // ホバーエフェクト
    startBtn.onHover(() => {
      startBtn.color = k.rgb(255, 140, 60);
    });

    startBtn.onHoverEnd(() => {
      startBtn.color = k.rgb(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b);
    });

    // クリック/タップでゲーム開始
    const startGame = () => {
      audioManager.init();
      audioManager.resume();
      k.go('game');
    };

    startBtn.onClick(startGame);

    // スペースキーでも開始
    k.onKeyPress('space', startGame);

    // 操作説明
    k.add([
      k.text('Click or Tap to drop blocks', { size: 14 }),
      k.pos(400, 620),
      k.anchor('center'),
      k.color(150, 150, 150),
      k.z(10),
    ]);

    k.add([
      k.text('Stack 10 blocks as high as you can!', { size: 14 }),
      k.pos(400, 645),
      k.anchor('center'),
      k.color(150, 150, 150),
      k.z(10),
    ]);

    k.add([
      k.text('If a block falls off, game over!', { size: 14 }),
      k.pos(400, 670),
      k.anchor('center'),
      k.color(180, 100, 100),
      k.z(10),
    ]);
  });
}

// デモ用の落下ブロックアニメーション
function createDemoAnimation(k: KaboomCtx): void {
  const spawnDemoBlock = () => {
    const x = 100 + Math.random() * 600;
    const width = 40 + Math.random() * 80;
    const height = 25 + Math.random() * 25;

    const block = k.add([
      k.rect(width, height),
      k.pos(x, -50),
      k.anchor('center'),
      k.rotate(0),
      k.color(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b),
      k.opacity(0.15),
      k.z(1),
      'demoBlock',
    ]);

    block.onUpdate(() => {
      block.pos.y += 80 * k.dt();
      block.angle += 30 * k.dt();

      if (block.pos.y > 850) {
        k.destroy(block);
      }
    });
  };

  // 定期的にブロックをスポーン
  k.loop(1.2, spawnDemoBlock);

  // 初期ブロックをいくつか配置
  for (let i = 0; i < 5; i++) {
    k.wait(i * 0.2, spawnDemoBlock);
  }
}
