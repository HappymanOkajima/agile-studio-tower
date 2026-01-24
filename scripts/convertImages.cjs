// resources内の画像をBase64エンコードしてJSONに変換
const fs = require('fs');
const path = require('path');

const resourcesDir = path.join(__dirname, '../public/resources');
const outputFile = path.join(__dirname, '../src/data/stationImagesData.json');

const images = [];

// resourcesフォルダ内のPNG画像を読み込み
const files = fs.readdirSync(resourcesDir).filter(f => f.endsWith('.png'));

for (const file of files) {
  const filePath = path.join(resourcesDir, file);
  const buffer = fs.readFileSync(filePath);
  const base64 = `data:image/png;base64,${buffer.toString('base64')}`;

  // ファイル名から駅名を抽出（"駅名標_XXX.png" → "XXX"）
  const match = file.match(/^駅名標_(.+)\.png$/);
  const name = match ? match[1] : file.replace('.png', '');

  images.push({
    name,
    base64,
  });

  console.log(`Converted: ${name}`);
}

// JSONとして保存
const output = {
  images,
  count: images.length,
  generatedAt: new Date().toISOString(),
};

fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
console.log(`\nSaved ${images.length} images to ${outputFile}`);
