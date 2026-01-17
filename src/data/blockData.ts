import type { CrawlData, BlockSource } from '../types';

export async function loadCrawlData(): Promise<CrawlData> {
  // Viteのベースパスを考慮（GitHub Pages対応）
  const baseUrl = import.meta.env.BASE_URL || '/';
  const response = await fetch(`${baseUrl}data/sites/agile-studio.json`);
  if (!response.ok) {
    throw new Error(`Failed to load crawl data: ${response.status}`);
  }
  return response.json();
}

export function extractBlockSources(crawlData: CrawlData): Omit<BlockSource, 'loadedImages'> {
  const imageUrls: string[] = [];
  const imageBase64: string[] = [];
  const keywords: string[] = [];

  // 全ページを処理
  for (const page of crawlData.pages) {
    for (const element of page.elements) {
      // Base64画像を優先的に収集（imgタグのみ）
      if (element.tag === 'img') {
        // Base64画像がある場合はそちらを使用
        if (element.sampleImageBase64) {
          for (const base64 of element.sampleImageBase64) {
            if (base64 && !imageBase64.includes(base64)) {
              imageBase64.push(base64);
            }
          }
        }
        // 元のURLも保持（フォールバック用）
        if (element.sampleImageUrls) {
          for (const url of element.sampleImageUrls) {
            if (url && !url.startsWith('data:') && !imageUrls.includes(url)) {
              if (!url.includes('favicon') && !url.includes('icon')) {
                imageUrls.push(url);
              }
            }
          }
        }
      }

      // h2/h3テキストをキーワードとして収集
      if ((element.tag === 'h2' || element.tag === 'h3') && element.sampleTexts) {
        for (const text of element.sampleTexts) {
          // 適切な長さのテキストのみ使用
          const trimmed = text.trim();
          if (trimmed.length >= 2 && trimmed.length <= 20 && !keywords.includes(trimmed)) {
            keywords.push(trimmed);
          }
        }
      }
    }
  }

  // 数量制限
  return {
    imageUrls: imageUrls.slice(0, 30),  // 最大30枚
    imageBase64: imageBase64.slice(0, 20),  // 最大20枚（Base64は大きいので制限）
    keywords: keywords.slice(0, 50),     // 最大50キーワード
  };
}

// ページURLとタイトルを抽出
export interface PageLink {
  url: string;
  title: string;
  path: string;
}

export function extractPageLinks(crawlData: CrawlData): PageLink[] {
  const links: PageLink[] = [];

  for (const page of crawlData.pages) {
    // トップページ、プライバシーポリシー、contactは除外
    if (page.path === '/' ||
        page.path === '/privacy-policy' ||
        page.path === '/contact') {
      continue;
    }

    links.push({
      url: crawlData.baseUrl + page.path,
      title: page.title.split('|')[0].trim(),  // 最初の部分だけ取得
      path: page.path,
    });
  }

  return links;
}

// 画像URLからアスペクト比を推測（ファイル名からサイズ情報を抽出）
export function estimateImageSize(url: string): { width: number; height: number } {
  // URLからサイズ情報を抽出する試み（例: s-617x617, s-1200x630）
  const sizeMatch = url.match(/s-(\d+)x(\d+)/);
  if (sizeMatch) {
    return {
      width: parseInt(sizeMatch[1], 10),
      height: parseInt(sizeMatch[2], 10),
    };
  }

  // デフォルトサイズ
  return { width: 200, height: 120 };
}
