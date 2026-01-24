// 駅名標画像データ（Base64エンコード済み）
import stationImagesData from './stationImagesData.json';

export interface StationImageData {
  name: string;
  base64: string;
}

// 画像データを取得
export function getStationImages(): StationImageData[] {
  return stationImagesData.images;
}

// 画像名の一覧を取得
export function getStationImageNames(): string[] {
  return stationImagesData.images.map((img: StationImageData) => img.name);
}
