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
    const proxyUrl = toProxyUrl(url);

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

    // KaboomのloadSpriteを直接使用（プロキシ経由）
    // 開発環境ではプロキシが使えるのでCORS回避可能
    // 本番環境ではプロキシが使えないため失敗する可能性あり
    k.loadSprite(spriteName, proxyUrl)
      .then((spriteData) => {
        clearTimeout(timeoutId);
        // spriteDataから実際のサイズを取得
        const width = spriteData.tex?.width || 150;
        const height = spriteData.tex?.height || 90;
        resolve({
          url,
          sprite: spriteName,
          width,
          height,
          success: true,
        });
      })
      .catch(() => {
        clearTimeout(timeoutId);
        // 失敗時はフォールバック
        resolve({
          url,
          sprite: '',
          width: 150,
          height: 90,
          success: false,
        });
      });
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

// Base64画像をスプライトとしてロード
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
