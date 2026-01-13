import type { CrawlData, BlockSource } from '../types';

export async function loadCrawlData(): Promise<CrawlData> {
  const response = await fetch('/data/sites/agile-studio.json');
  if (!response.ok) {
    throw new Error(`Failed to load crawl data: ${response.status}`);
  }
  return response.json();
}

export function extractBlockSources(crawlData: CrawlData): Omit<BlockSource, 'loadedImages'> {
  const imageUrls: string[] = [];
  const keywords: string[] = [];

  // 全ページを処理
  for (const page of crawlData.pages) {
    for (const element of page.elements) {
      // 画像URLを収集（imgタグのみ）
      if (element.tag === 'img' && element.sampleImageUrls) {
        for (const url of element.sampleImageUrls) {
          // data URIと重複を除外
          if (url && !url.startsWith('data:') && !imageUrls.includes(url)) {
            // 小さすぎる画像やアイコンを除外
            if (!url.includes('favicon') && !url.includes('icon')) {
              imageUrls.push(url);
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
    keywords: keywords.slice(0, 50),     // 最大50キーワード
  };
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
