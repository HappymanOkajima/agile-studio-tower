/**
 * クロールデータ内の画像URLをBase64に変換するスクリプト
 * 実行: npx ts-node scripts/convertImagesToBase64.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CrawlElement {
  tag: string;
  count: number;
  sampleTexts?: string[];
  sampleImageUrls?: string[];
  sampleImageBase64?: string[];  // Base64変換後の画像
}

interface CrawlPage {
  path: string;
  depth: number;
  title: string;
  elements: CrawlElement[];
  totalElementCount: number;
  links: string[];
  imageUrls: string[];
}

interface CrawlData {
  siteId: string;
  siteName: string;
  baseUrl: string;
  metadata: any;
  siteStyle: any;
  pages: CrawlPage[];
  deepestPages: string[];
  rareElements: string[];
  commonLinks: string[];
}

// 画像をBase64に変換
async function fetchImageAsBase64(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, { timeout: 10000 }, (response) => {
      // リダイレクト対応
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          fetchImageAsBase64(redirectUrl).then(resolve);
          return;
        }
      }

      if (response.statusCode !== 200) {
        console.error(`  Failed to fetch ${url}: ${response.statusCode}`);
        resolve(null);
        return;
      }

      const contentType = response.headers['content-type'] || 'image/webp';
      const chunks: Buffer[] = [];

      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const base64 = buffer.toString('base64');
        const dataUrl = `data:${contentType};base64,${base64}`;
        resolve(dataUrl);
      });
      response.on('error', () => {
        console.error(`  Error reading response for ${url}`);
        resolve(null);
      });
    });

    request.on('error', (err) => {
      console.error(`  Request error for ${url}: ${err.message}`);
      resolve(null);
    });

    request.on('timeout', () => {
      request.destroy();
      console.error(`  Timeout for ${url}`);
      resolve(null);
    });
  });
}

// メイン処理
async function main() {
  const inputPath = path.join(__dirname, '../public/data/sites/agile-studio.json');
  const outputPath = path.join(__dirname, '../public/data/sites/agile-studio.json');

  console.log('Loading crawl data...');
  const data: CrawlData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

  // 全ての画像URLを収集（重複除去）
  const allImageUrls = new Set<string>();
  for (const page of data.pages) {
    for (const element of page.elements) {
      if (element.sampleImageUrls) {
        element.sampleImageUrls.forEach(url => allImageUrls.add(url));
      }
    }
  }

  console.log(`Found ${allImageUrls.size} unique images to convert`);

  // URLとBase64のマッピング
  const base64Map = new Map<string, string>();
  let processed = 0;
  const maxImages = 20;  // 最大20枚に制限（ファイルサイズ対策）

  for (const url of allImageUrls) {
    if (processed >= maxImages) {
      console.log(`Reached max images limit (${maxImages})`);
      break;
    }

    console.log(`[${processed + 1}/${Math.min(allImageUrls.size, maxImages)}] Converting: ${url.substring(0, 60)}...`);
    const base64 = await fetchImageAsBase64(url);
    if (base64) {
      base64Map.set(url, base64);
      processed++;
    }
  }

  console.log(`\nSuccessfully converted ${base64Map.size} images`);

  // クロールデータを更新
  for (const page of data.pages) {
    for (const element of page.elements) {
      if (element.sampleImageUrls && element.sampleImageUrls.length > 0) {
        element.sampleImageBase64 = [];
        for (const url of element.sampleImageUrls) {
          const base64 = base64Map.get(url);
          if (base64) {
            element.sampleImageBase64.push(base64);
          }
        }
      }
    }
  }

  // ファイルに保存
  console.log('Saving updated crawl data...');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log('Done!');
}

main().catch(console.error);
