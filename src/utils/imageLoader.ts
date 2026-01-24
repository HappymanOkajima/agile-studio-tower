import type { KaboomCtx, LoadedImage } from '../types';
import { getStationImages } from '../data/stationImages';

// Base64画像をスプライトとしてロード（レガシーモード用）
async function loadBase64AsSprite(
  k: KaboomCtx,
  base64: string,
  spriteName: string
): Promise<LoadedImage> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve({
        url: base64,
        sprite: '',
        width: 150,
        height: 90,
        success: false,
      });
    }, 5000);

    // まずImage要素で読み込んでサイズを取得
    const img = new Image();
    img.onload = async () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;

      // サイズが0または小さすぎる場合は失敗扱い
      if (width < 10 || height < 10) {
        clearTimeout(timeoutId);
        resolve({
          url: base64,
          sprite: '',
          width: 150,
          height: 90,
          success: false,
        });
        return;
      }

      try {
        // Kaboomスプライトとして登録
        await k.loadSprite(spriteName, base64);
        clearTimeout(timeoutId);
        resolve({
          url: base64,
          sprite: spriteName,
          width,
          height,
          success: true,
        });
      } catch {
        clearTimeout(timeoutId);
        resolve({
          url: base64,
          sprite: '',
          width,
          height,
          success: false,
        });
      }
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      resolve({
        url: base64,
        sprite: '',
        width: 150,
        height: 90,
        success: false,
      });
    };

    img.src = base64;
  });
}

// Base64画像をプリロード
export async function preloadBase64Images(
  k: KaboomCtx,
  base64Images: string[]
): Promise<Map<string, LoadedImage>> {
  const results = new Map<string, LoadedImage>();
  const uniqueImages = [...new Set(base64Images)].slice(0, 20); // 最大20枚

  // 並列でロード
  const loadPromises = uniqueImages.map(async (base64, index) => {
    const spriteName = `block_img_${index}`;
    const result = await loadBase64AsSprite(k, base64, spriteName);
    results.set(base64, result);
  });

  await Promise.all(loadPromises);

  return results;
}

// 単一の駅名標画像をロード
async function loadSingleStationImage(
  k: KaboomCtx,
  base64: string,
  spriteName: string
): Promise<LoadedImage> {
  // Image要素でサイズを取得
  const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = base64;
  });

  // Kaboomスプライトとして登録
  await k.loadSprite(spriteName, base64);

  return {
    url: base64,
    sprite: spriteName,
    width,
    height,
    success: true,
  };
}

// 駅名標画像をプリロード（Base64から、順次ロード、リトライ付き）
export async function preloadStationImages(
  k: KaboomCtx
): Promise<Map<string, LoadedImage>> {
  const results = new Map<string, LoadedImage>();
  const stationImages = getStationImages();

  console.log(`Loading ${stationImages.length} station images...`);

  // 順次ロード
  for (let index = 0; index < stationImages.length; index++) {
    const { name, base64 } = stationImages[index];
    const spriteName = `station_${index}`;

    try {
      const result = await loadSingleStationImage(k, base64, spriteName);
      results.set(name, result);
    } catch {
      // 失敗した場合はフォールバック値を設定
      results.set(name, {
        url: base64,
        sprite: '',
        width: 150,
        height: 90,
        success: false,
      });
    }
  }

  const successCount = Array.from(results.values()).filter(r => r.success).length;
  console.log(`Station images: ${successCount}/${stationImages.length} loaded`);

  return results;
}
