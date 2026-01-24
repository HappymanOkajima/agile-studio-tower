import kaplay from 'kaplay';
import type { BlockSource } from './types';
import { loadCrawlData, extractBlockSources, extractPageLinks } from './data/blockData';
import { setPageLinks } from './systems/scoreManager';
import { preloadBase64Images, preloadStationImages } from './utils/imageLoader';
import { createTitleScene } from './scenes/title';
import { createGameScene } from './scenes/game';
import { createResultScene } from './scenes/result';
import { audioManager } from './systems/audioManager';
import { parseGameConfig } from './config/gameConfig';
import { updateWindConfig } from './systems/physics';
import { getStationImageNames } from './data/stationImages';

// モバイル向けスクロール防止（タッチイベントを妨げない）
function preventMobileScroll(): void {
  // ピンチズーム防止（iOS）- gestureイベントのみ
  document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
  });

  document.addEventListener('gesturechange', (e) => {
    e.preventDefault();
  });

  document.addEventListener('gestureend', (e) => {
    e.preventDefault();
  });
}

async function main() {
  // モバイル対応
  preventMobileScroll();

  // URLパラメータからゲーム設定を解析
  const gameConfig = parseGameConfig();
  console.log('Game config:', gameConfig);

  // 難易度プリセットに基づいて風設定を更新
  updateWindConfig();
  // Kaplay 初期化
  const gameArea = document.getElementById('game-area');
  const k = kaplay({
    width: 400,
    height: 800,
    background: [255, 255, 255],
    debug: false,
    global: false,
    root: gameArea || undefined,
  });

  // ローディング表示
  k.add([
    k.rect(400, 800),
    k.pos(0, 0),
    k.color(255, 255, 255),
  ]);

  const loadingText = k.add([
    k.text('Loading...', { size: 28 }),
    k.pos(200, 380),
    k.anchor('center'),
    k.color(150, 150, 150),
  ]);

  const loadingSubText = k.add([
    k.text('Loading...', { size: 12 }),
    k.pos(200, 420),
    k.anchor('center'),
    k.color(180, 180, 180),
  ]);

  try {
    let blockSources: BlockSource;

    if (gameConfig.imageMode === 'station') {
      // 駅名標画像モード（デフォルト）
      loadingSubText.text = 'Loading station images...';
      const loadedImages = await preloadStationImages(k);

      // ブロックソース（駅名標画像のみ）
      const stationImageNames = getStationImageNames();
      blockSources = {
        imageUrls: [],
        imageBase64: [],
        keywords: [],
        loadedImages,
        stationImages: stationImageNames,
      };

      // デフォルトのページリンクを設定
      const defaultLinks = [
        { url: 'https://www.agile-studio.jp/', title: 'Agile Studio', path: '/' },
        { url: 'https://www.agile-studio.jp/post/apm-about', title: 'Agile Practice Mapとは', path: '/post/apm-about' },
        { url: 'https://www.agile-studio.jp/post/apm-stationboard', title: '駅名標のご紹介', path: '/post/apm-stationboard' },
      ];
      setPageLinks(defaultLinks);

      const successCount = Array.from(loadedImages.values()).filter(img => img.success).length;
      console.log(`Station images: ${successCount}/${stationImageNames.length} loaded`);
    } else {
      // レガシーモード（agile-studio.jsonから）
      loadingSubText.text = 'Loading site data...';
      const crawlData = await loadCrawlData();

      loadingSubText.text = 'Extracting block data...';
      const sourcesWithoutImages = extractBlockSources(crawlData);

      // ページリンクを抽出して設定
      const pageLinks = extractPageLinks(crawlData);
      setPageLinks(pageLinks);
      console.log(`Page links: ${pageLinks.length} available`);

      loadingSubText.text = 'Loading images...';
      const loadedImages = await preloadBase64Images(k, sourcesWithoutImages.imageBase64);

      blockSources = {
        ...sourcesWithoutImages,
        loadedImages,
      };

      const successCount = Array.from(loadedImages.values()).filter(img => img.success).length;
      console.log(`Images: ${successCount}/${blockSources.imageBase64.length} loaded successfully`);
      console.log(`Keywords: ${blockSources.keywords.length} available`);
    }

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
