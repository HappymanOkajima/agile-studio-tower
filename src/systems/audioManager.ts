// Web Audio APIを使用したサウンド生成・再生
class AudioManager {
  private context: AudioContext | null = null;
  private initialized = false;
  private lastLandTime = 0;
  private readonly LAND_COOLDOWN = 300; // 着地音のクールダウン（ミリ秒）

  // 初期化（ユーザー操作後に呼び出す必要がある）
  init(): void {
    if (this.initialized) return;

    try {
      this.context = new AudioContext();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  // コンテキストを有効化（ユーザー操作時に呼び出す）
  resume(): void {
    if (this.context && this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  // ブロック落下音（下降トーン）
  playDrop(): void {
    if (!this.context) return;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(300, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.15, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.1);
  }

  // 着地音（短いインパクト）- クールダウン付き
  playLand(): void {
    if (!this.context) return;

    // クールダウン中は再生しない
    const now = Date.now();
    if (now - this.lastLandTime < this.LAND_COOLDOWN) {
      return;
    }
    this.lastLandTime = now;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(80, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(40, this.context.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0.1, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.05);

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.06);
  }

  // ゲームオーバー音（崩壊音）
  playCrash(): void {
    if (!this.context) return;

    // 複数の音を重ねて崩壊感を演出
    for (let i = 0; i < 5; i++) {
      const delay = i * 0.05;
      this.playNoiseHit(delay, 0.15 - i * 0.02);
    }
  }

  private playNoiseHit(delay: number, volume: number): void {
    if (!this.context) return;

    const bufferSize = this.context.sampleRate * 0.1;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);

    // ノイズ生成
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const source = this.context.createBufferSource();
    const gainNode = this.context.createGain();

    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(this.context.destination);

    gainNode.gain.setValueAtTime(volume, this.context.currentTime + delay);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + delay + 0.1);

    source.start(this.context.currentTime + delay);
  }

  // スプリント完了音（成功音）
  playComplete(): void {
    if (!this.context) return;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const oscillator = this.context!.createOscillator();
      const gainNode = this.context!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.context!.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, this.context!.currentTime + i * 0.1);

      gainNode.gain.setValueAtTime(0.2, this.context!.currentTime + i * 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context!.currentTime + i * 0.1 + 0.3);

      oscillator.start(this.context!.currentTime + i * 0.1);
      oscillator.stop(this.context!.currentTime + i * 0.1 + 0.3);
    });
  }
}

export const audioManager = new AudioManager();
