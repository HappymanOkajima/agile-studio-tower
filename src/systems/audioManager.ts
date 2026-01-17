// Web Audio APIを使用したサウンド生成・再生
class AudioManager {
  private context: AudioContext | null = null;
  private initialized = false;
  private lastLandTime = 0;
  private readonly LAND_COOLDOWN = 300; // 着地音のクールダウン（ミリ秒）

  // 風の音用
  private windNoiseSource: AudioBufferSourceNode | null = null;
  private windGainNode: GainNode | null = null;
  private windFilterNode: BiquadFilterNode | null = null;
  private windPlaying = false;

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

  // 風の音を開始（ゲーム中BGMとして）
  startWind(): void {
    if (!this.context || this.windPlaying) return;

    // ノイズバッファを作成（長めのループ用）
    const bufferSize = this.context.sampleRate * 4; // 4秒のバッファ
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);

    // ピンクノイズ風のノイズ生成（ホワイトノイズをフィルタリングしたような音）
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    // ノイズソース
    this.windNoiseSource = this.context.createBufferSource();
    this.windNoiseSource.buffer = buffer;
    this.windNoiseSource.loop = true;

    // ローパスフィルター（風らしい音にする）
    this.windFilterNode = this.context.createBiquadFilter();
    this.windFilterNode.type = 'lowpass';
    this.windFilterNode.frequency.setValueAtTime(400, this.context.currentTime);
    this.windFilterNode.Q.setValueAtTime(1, this.context.currentTime);

    // ゲインノード
    this.windGainNode = this.context.createGain();
    this.windGainNode.gain.setValueAtTime(0, this.context.currentTime);

    // 接続
    this.windNoiseSource.connect(this.windFilterNode);
    this.windFilterNode.connect(this.windGainNode);
    this.windGainNode.connect(this.context.destination);

    this.windNoiseSource.start();
    this.windPlaying = true;
  }

  // 風の強さに応じて音を更新
  updateWind(windStrength: number): void {
    if (!this.context || !this.windGainNode || !this.windFilterNode) return;

    const absWind = Math.abs(windStrength);
    // 風の強さに応じて音量を調整（0〜0.08程度）
    const targetVolume = absWind * 0.08;
    this.windGainNode.gain.setTargetAtTime(targetVolume, this.context.currentTime, 0.1);

    // 風の強さに応じてフィルター周波数も変化（強い風ほど高い音も通す）
    const targetFreq = 300 + absWind * 400;
    this.windFilterNode.frequency.setTargetAtTime(targetFreq, this.context.currentTime, 0.1);
  }

  // 風の音を停止
  stopWind(): void {
    if (this.windNoiseSource) {
      this.windNoiseSource.stop();
      this.windNoiseSource.disconnect();
      this.windNoiseSource = null;
    }
    if (this.windFilterNode) {
      this.windFilterNode.disconnect();
      this.windFilterNode = null;
    }
    if (this.windGainNode) {
      this.windGainNode.disconnect();
      this.windGainNode = null;
    }
    this.windPlaying = false;
  }
}

export const audioManager = new AudioManager();
