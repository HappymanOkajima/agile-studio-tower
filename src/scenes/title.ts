import type { KaboomCtx } from '../types';
import { audioManager } from '../systems/audioManager';
import { getRanking } from '../systems/scoreManager';

const ACCENT_COLOR = { r: 239, g: 112, b: 33 }; // #ef7021

export function createTitleScene(k: KaboomCtx): void {
  k.scene('title', () => {
    // 白背景
    k.add([
      k.rect(400, 800),
      k.pos(0, 0),
      k.color(255, 255, 255),
      k.z(0),
    ]);

    // デモブロック（背景で落下）
    createDemoAnimation(k);

    // タイトル: Agile Practice Map
    k.add([
      k.text('Agile Practice Map', { size: 22 }),
      k.pos(200, 200),
      k.anchor('center'),
      k.color(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b),
      k.z(10),
    ]);

    // タイトル: TOWER
    k.add([
      k.text('TOWER', { size: 52 }),
      k.pos(200, 250),
      k.anchor('center'),
      k.color(60, 60, 60),
      k.z(10),
    ]);

    // サブタイトル
    k.add([
      k.text('~プラクティスを積み上げよう~', { size: 12 }),
      k.pos(200, 300),
      k.anchor('center'),
      k.color(120, 120, 120),
      k.z(10),
    ]);

    // スタートボタン背景
    const startBtn = k.add([
      k.rect(200, 50, { radius: 8 }),
      k.pos(200, 390),
      k.anchor('center'),
      k.color(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b),
      k.area(),
      k.z(10),
      'startBtn',
    ]);

    // スタートボタンテキスト
    k.add([
      k.text('SPRINT START', { size: 20 }),
      k.pos(200, 390),
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
    let gameStarted = false;
    const startGame = () => {
      if (gameStarted) return;
      gameStarted = true;
      audioManager.init();
      audioManager.resume();
      k.go('game');
    };

    startBtn.onClick(startGame);

    // タッチでも開始（iOS対応）- Kaboom経由
    k.onTouchStart(() => {
      // ボタン領域内のタッチかチェック
      const touch = k.mousePos();
      const btnPos = startBtn.pos;
      const hw = 100; // 幅の半分
      const hh = 25;  // 高さの半分
      if (touch.x >= btnPos.x - hw && touch.x <= btnPos.x + hw &&
          touch.y >= btnPos.y - hh && touch.y <= btnPos.y + hh) {
        startGame();
      }
    });

    // iOS Safari用: ネイティブDOMタッチイベントも登録
    const canvas = document.querySelector('#game-area canvas') as HTMLCanvasElement;
    if (canvas) {
      const handleNativeTouch = (e: TouchEvent) => {
        if (gameStarted) return;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        // キャンバス座標に変換（400x800のゲーム座標系）
        const scaleX = 400 / rect.width;
        const scaleY = 800 / rect.height;
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;

        // ボタン領域チェック
        const btnPos = startBtn.pos;
        const hw = 100;
        const hh = 25;
        if (x >= btnPos.x - hw && x <= btnPos.x + hw &&
            y >= btnPos.y - hh && y <= btnPos.y + hh) {
          e.preventDefault();
          startGame();
        }
      };
      canvas.addEventListener('touchstart', handleNativeTouch, { passive: false });
    }

    // スペースキーでも開始
    k.onKeyPress('space', startGame);

    // ランキング表示
    createRankingDisplay(k);
  });
}

// ランキング表示
function createRankingDisplay(k: KaboomCtx): void {
  const ranking = getRanking();
  if (ranking.length === 0) return;

  const startX = 200;
  const startY = 470;

  // ランキングタイトル
  k.add([
    k.text('RANKING', { size: 12 }),
    k.pos(startX, startY),
    k.anchor('center'),
    k.color(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b),
    k.z(10),
  ]);

  // 各エントリー（横並び表示、最大3つ）
  const displayRanking = ranking.slice(0, 3);
  displayRanking.forEach((entry, index) => {
    const y = startY + 25 + index * 24;

    // 順位
    const rankColors = [
      { r: 255, g: 215, b: 0 },   // 1位: 金
      { r: 192, g: 192, b: 192 }, // 2位: 銀
      { r: 205, g: 127, b: 50 },  // 3位: 銅
    ];
    const color = rankColors[index];

    k.add([
      k.text(`${index + 1}.`, { size: 11 }),
      k.pos(startX - 80, y),
      k.anchor('left'),
      k.color(color.r, color.g, color.b),
      k.z(10),
    ]);

    // スコア
    k.add([
      k.text(`${entry.score} pt`, { size: 11 }),
      k.pos(startX - 55, y),
      k.anchor('left'),
      k.color(80, 80, 80),
      k.z(10),
    ]);

    // 日付（MM/DD形式）
    const date = new Date(entry.date);
    const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
    k.add([
      k.text(dateStr, { size: 9 }),
      k.pos(startX + 40, y + 1),
      k.anchor('left'),
      k.color(140, 140, 140),
      k.z(10),
    ]);
  });
}

// デモ用の落下ブロックアニメーション
function createDemoAnimation(k: KaboomCtx): void {
  const spawnDemoBlock = () => {
    const x = 50 + Math.random() * 300;  // 400幅用に調整
    const width = 30 + Math.random() * 60;
    const height = 20 + Math.random() * 20;

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
