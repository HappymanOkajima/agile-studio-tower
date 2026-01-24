/**
 * resources内の画像をリサイズするスクリプト
 * 使用方法: node scripts/resizeImages.cjs
 *
 * 必要: npm install sharp
 */

const fs = require('fs');
const path = require('path');

// sharpがインストールされているか確認
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('sharpがインストールされていません。インストールします...');
  console.log('npm install sharp を実行してください');
  process.exit(1);
}

const RESOURCES_DIR = path.join(__dirname, '..', 'public', 'resources');
const MAX_WIDTH = 800;  // 最大幅
const MAX_HEIGHT = 300; // 最大高さ

async function resizeImages() {
  const files = fs.readdirSync(RESOURCES_DIR).filter(f => f.endsWith('.png'));

  console.log(`Found ${files.length} PNG files`);

  for (const file of files) {
    const filePath = path.join(RESOURCES_DIR, file);
    const image = sharp(filePath);
    const metadata = await image.metadata();

    const { width, height } = metadata;
    console.log(`${file}: ${width}x${height}`);

    // リサイズが必要か判定
    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
      const scale = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
      const newWidth = Math.round(width * scale);
      const newHeight = Math.round(height * scale);

      console.log(`  → Resizing to ${newWidth}x${newHeight}`);

      // 一時ファイルに出力してから上書き
      const tempPath = filePath + '.tmp';
      await sharp(filePath)
        .resize(newWidth, newHeight, { fit: 'inside' })
        .png({ quality: 90 })
        .toFile(tempPath);

      // 元ファイルを置き換え
      fs.unlinkSync(filePath);
      fs.renameSync(tempPath, filePath);

      console.log(`  ✓ Resized`);
    } else {
      console.log(`  (OK, no resize needed)`);
    }
  }

  console.log('\nDone! Now run: node scripts/convertImages.cjs');
}

resizeImages().catch(console.error);
