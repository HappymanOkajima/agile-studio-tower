import kaboom from 'kaboom';

async function main() {
  // Kaboom.js 初期化（game-area要素に描画）
  const gameArea = document.getElementById('game-area');
  const k = kaboom({
    width: 800,
    height: 600,
    background: [20, 20, 30],
    debug: true,  // F1でヒットボックス表示
    global: false,
    root: gameArea || undefined,
  });

  // タイトルシーン
  k.scene('title', () => {
    k.add([
      k.text('Agile Studio Tower', { size: 32 }),
      k.pos(k.width() / 2, k.height() / 2 - 50),
      k.anchor('center'),
      k.color(255, 255, 255),
    ]);

    k.add([
      k.text('Press Z to Start', { size: 20 }),
      k.pos(k.width() / 2, k.height() / 2 + 50),
      k.anchor('center'),
      k.color(200, 200, 200),
    ]);

    k.onKeyPress('z', () => {
      k.go('game');
    });
  });

  // ゲームシーン
  k.scene('game', () => {
    k.add([
      k.text('Game Scene', { size: 24 }),
      k.pos(k.width() / 2, k.height() / 2),
      k.anchor('center'),
    ]);

    k.onKeyPress('z', () => {
      k.go('title');
    });
  });

  // タイトル画面から開始
  k.go('title');
}

main();
