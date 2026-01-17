import type { GameObj } from '../types';

// DOM画像オーバーレイを管理するクラス
// Kaboomキャンバスの上に画像を重ねて表示する（CORS回避）

interface ImageOverlay {
  element: HTMLImageElement;
  targetBlock: GameObj;
  offsetX: number;
  offsetY: number;
}

class DOMImageOverlayManager {
  private overlays: Map<string, ImageOverlay> = new Map();
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private nextId = 0;

  // 初期化（ゲーム開始時に呼ぶ）
  init(): void {
    // キャンバス要素を取得
    this.canvas = document.querySelector('canvas');
    if (!this.canvas) return;

    // コンテナを作成
    this.container = document.createElement('div');
    this.container.id = 'image-overlay-container';
    this.container.style.position = 'absolute';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.pointerEvents = 'none';
    this.container.style.overflow = 'hidden';

    // キャンバスの親要素に追加
    const parent = this.canvas.parentElement;
    if (parent) {
      parent.style.position = 'relative';
      parent.appendChild(this.container);
    }
  }

  // 画像オーバーレイを作成
  createOverlay(
    imageUrl: string,
    targetBlock: GameObj,
    width: number,
    height: number
  ): string | null {
    if (!this.container) return null;

    const id = `img-overlay-${this.nextId++}`;
    const img = document.createElement('img');

    img.src = imageUrl;
    img.style.position = 'absolute';
    img.style.width = `${width}px`;
    img.style.height = `${height}px`;
    img.style.objectFit = 'cover';
    img.style.borderRadius = '4px';
    img.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
    img.style.border = '2px solid rgba(180, 80, 20, 0.8)';
    img.style.transformOrigin = 'center center';
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.2s';

    // 読み込み成功時に表示
    img.onload = () => {
      img.style.opacity = '1';
    };

    // 読み込み失敗時は非表示のまま（Kaboomの矩形が見える）
    img.onerror = () => {
      this.removeOverlay(id);
    };

    this.container.appendChild(img);
    this.overlays.set(id, {
      element: img,
      targetBlock,
      offsetX: 0,
      offsetY: 0,
    });

    return id;
  }

  // オーバーレイを削除
  removeOverlay(id: string): void {
    const overlay = this.overlays.get(id);
    if (overlay) {
      overlay.element.remove();
      this.overlays.delete(id);
    }
  }

  // 特定のブロックに紐づくオーバーレイを削除
  removeOverlaysForBlock(block: GameObj): void {
    const toRemove: string[] = [];
    for (const [id, overlay] of this.overlays) {
      if (overlay.targetBlock === block) {
        toRemove.push(id);
      }
    }
    toRemove.forEach((id) => this.removeOverlay(id));
  }

  // 全てのオーバーレイの位置を更新（毎フレーム呼ぶ）
  update(): void {
    if (!this.canvas || !this.container) return;

    // Kaboomのゲームサイズ（800x600）に対するキャンバスの実際のサイズの比率
    const canvasWidth = this.canvas.clientWidth;
    const canvasHeight = this.canvas.clientHeight;
    const scaleX = canvasWidth / 800;
    const scaleY = canvasHeight / 600;

    for (const [id, overlay] of this.overlays) {
      const { element, targetBlock } = overlay;

      // ブロックが存在しなくなったら削除
      if (!targetBlock.exists()) {
        this.removeOverlay(id);
        continue;
      }

      // ブロックのワールド座標を取得
      const blockX = targetBlock.pos.x;
      const blockY = targetBlock.pos.y;
      const width = targetBlock.blockWidth || 100;
      const height = targetBlock.blockHeight || 60;

      // コンテナ内の相対座標に変換（anchorがcenterなので中心から計算）
      const posX = (blockX - width / 2) * scaleX;
      const posY = (blockY - height / 2) * scaleY;

      element.style.left = `${posX}px`;
      element.style.top = `${posY}px`;
      element.style.width = `${width * scaleX}px`;
      element.style.height = `${height * scaleY}px`;

      // 回転も適用
      const angle = targetBlock.angle ?? 0;
      element.style.transform = `rotate(${angle}deg)`;
    }
  }

  // シーン遷移時にクリーンアップ
  cleanup(): void {
    for (const [id] of this.overlays) {
      this.removeOverlay(id);
    }
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}

export const domImageOverlay = new DOMImageOverlayManager();
