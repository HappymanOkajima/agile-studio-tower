import kaboom from 'kaboom';
import type { BlockSource } from './types';
import { loadCrawlData, extractBlockSources } from './data/blockData';
import { preloadBase64Images } from './utils/imageLoader';
import { createTitleScene } from './scenes/title';
import { createGameScene } from './scenes/game';
import { createResultScene } from './scenes/result';
import { audioManager } from './systems/audioManager';

// モバイル向けスクロール防止
function preventMobileScroll(): void {
  // タッチ操作でのスクロール・ズームを防止
  document.addEventListener('touchmove', (e) => {
    e.preventDefault();
  }, { passive: false });

  // ダブルタップズーム防止
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });

  // ピンチズーム防止
  document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
  });
}

async function main() {
  // モバイル対応
  preventMobileScroll();
  // Kaboom.js 初期化
  const gameArea = document.getElementById('game-area');
  const k = kaboom({
    width: 800,
    height: 800,
    background: [255, 255, 255],
    debug: false,
    global: false,
    root: gameArea || undefined,
  });

  // ローディング表示
  k.add([
    k.rect(800, 800),
    k.pos(0, 0),
    k.color(255, 255, 255),
  ]);

  const loadingText = k.add([
    k.text('Loading...', { size: 28 }),
    k.pos(400, 380),
    k.anchor('center'),
    k.color(150, 150, 150),
  ]);

  const loadingSubText = k.add([
    k.text('Preparing blocks from agile-studio.jp', { size: 14 }),
    k.pos(400, 420),
    k.anchor('center'),
    k.color(180, 180, 180),
  ]);

  try {
    // クロールデータをロード
    loadingSubText.text = 'Loading site data...';
    const crawlData = await loadCrawlData();

    // ブロックソースを抽出
    loadingSubText.text = 'Extracting block data...';
    const sourcesWithoutImages = extractBlockSources(crawlData);

    // Base64画像をスプライトとしてロード
    loadingSubText.text = 'Loading images...';
    const loadedImages = await preloadBase64Images(k, sourcesWithoutImages.imageBase64);

    // ブロックソース完成
    const blockSources: BlockSource = {
      ...sourcesWithoutImages,
      loadedImages,
    };

    // ロード結果をログ出力
    const successCount = Array.from(loadedImages.values()).filter(img => img.success).length;
    console.log(`Images: ${successCount}/${blockSources.imageBase64.length} loaded successfully`);
    console.log(`Keywords: ${blockSources.keywords.length} available`);

    // オーディオマネージャー初期化
    audioManager.init();

    // シーン作成
    createTitleScene(k);
    createGameScene(k, blockSources);
    createResultScene(k);

    // ローディング表示を削除
    k.destroy(loadingText);
    k.destroy(loadingSubText);

    // タイトル画面へ
    k.go('title');

  } catch (error) {
    console.error('Failed to initialize game:', error);

    // エラー表示
    loadingText.text = 'Failed to load game data';
    loadingText.color = k.rgb(200, 50, 50);
    loadingSubText.text = 'Please refresh the page to try again';

    // フォールバック: 最小限のブロックソースで開始
    k.wait(2, () => {
      const fallbackSources: BlockSource = {
        imageUrls: [],
        imageBase64: [],
        keywords: ['アジャイル', 'スクラム', 'スプリント', 'バックログ', 'レトロ'],
        loadedImages: new Map(),
      };

      createTitleScene(k);
      createGameScene(k, fallbackSources);
      createResultScene(k);

      k.destroy(loadingText);
      k.destroy(loadingSubText);
      k.go('title');
    });
  }
}

main().catch(console.error);
