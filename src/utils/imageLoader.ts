import type { KaboomCtx, LoadedImage } from '../types';

// URLをプロキシ経由に変換（開発環境のみ）
function toProxyUrl(url: string): string {
  // storage.googleapis.comの画像をプロキシ経由に変換
  if (url.startsWith('https://storage.googleapis.com/')) {
    return url.replace('https://storage.googleapis.com', '/gcs-proxy');
  }
  return url;
}

// 画像をスプライトとしてロード（CORS対応）
export async function loadImageAsSprite(
  k: KaboomCtx,
  url: string,
  spriteName: string
): Promise<LoadedImage> {
  return new Promise((resolve) => {
    const img = new Image();
    // プロキシ経由の場合はcrossOrigin不要
    const proxyUrl = toProxyUrl(url);
    const useProxy = proxyUrl !== url;

    if (!useProxy) {
      img.crossOrigin = 'anonymous';
    }

    const timeoutId = setTimeout(() => {
      // タイムアウト時はフォールバック
      resolve({
        url,
        sprite: '',
        width: 150,
        height: 90,
        success: false,
      });
    }, 8000);

    img.onload = async () => {
      clearTimeout(timeoutId);

      try {
        // Canvas経由でDataURLに変換
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');

          // Kaboomスプライトとして登録
          await k.loadSprite(spriteName, dataUrl);

          resolve({
            url,
            sprite: spriteName,
            width: img.width,
            height: img.height,
            success: true,
          });
        } else {
          throw new Error('Canvas context not available');
        }
      } catch {
        resolve({
          url,
          sprite: '',
          width: img.width,
          height: img.height,
          success: false,
        });
      }
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      resolve({
        url,
        sprite: '',
        width: 150,
        height: 90,
        success: false,
      });
    };

    img.src = proxyUrl;
  });
}

// 複数画像をプリロード
export async function preloadImages(
  k: KaboomCtx,
  urls: string[]
): Promise<Map<string, LoadedImage>> {
  const results = new Map<string, LoadedImage>();
  const uniqueUrls = [...new Set(urls)].slice(0, 20); // 最大20枚

  // 並列でロード
  const loadPromises = uniqueUrls.map(async (url, index) => {
    const spriteName = `block_img_${index}`;
    const result = await loadImageAsSprite(k, url, spriteName);
    results.set(url, result);
  });

  await Promise.all(loadPromises);

  return results;
}
