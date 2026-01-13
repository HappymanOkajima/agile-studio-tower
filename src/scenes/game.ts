import type { KaboomCtx, GameState, BlockSource, BlockConfig, GameObj } from '../types';
import { setupPhysics, createGround, checkFallenBlocks, calculateMaxHeight } from '../systems/physics';
import { getDifficultyForTime, selectBlockType, generateBlockConfig } from '../systems/blockSpawner';
import { createHUD, updateHUD } from '../components/hud';
import { createPendingBlock, updatePendingBlock, dropPendingBlock } from '../components/pendingBlock';
import { audioManager } from '../systems/audioManager';

const TOTAL_BLOCKS = 10; // ブロック数

export function createGameScene(k: KaboomCtx, blockSources: BlockSource): void {
  k.scene('game', () => {
    // ゲーム状態初期化
    const state: GameState = {
      velocity: 0,
      blocksRemaining: TOTAL_BLOCKS,
      blocksDropped: 0,
      isGameOver: false,
      gameOverReason: null,
    };

    // 現在の待機ブロック
    let pendingBlock: GameObj | null = null;
    let pendingConfig: BlockConfig | null = null;
    let canDrop = true;

    // 落下中のブロック（着地待ち）
    let fallingBlock: GameObj | null = null;

    // 使用済みリソースのインデックス
    let usedImageIndex = 0;
    let usedKeywordIndex = 0;

    // 白背景
    k.add([
      k.rect(800, 800),
      k.pos(0, 0),
      k.color(255, 255, 255),
      k.z(0),
    ]);

    // 物理エンジンセットアップ
    setupPhysics(k);
    createGround(k);

    // HUD作成
    const hud = createHUD(k);

    // 次のブロックをスポーン
    function spawnNextBlock(): void {
      if (state.isGameOver) return;
      if (state.blocksRemaining <= 0) return;

      const difficulty = getDifficultyForTime(state.blocksDropped / TOTAL_BLOCKS * 60);

      // ブロックソースから利用可能なリソースを取得
      const availableImages = blockSources.imageUrls.length - usedImageIndex;
      const availableKeywords = blockSources.keywords.length - usedKeywordIndex;

      const type = selectBlockType(difficulty, availableImages, availableKeywords);

      // リソースを取得
      let imageData;
      let keywordText;

      if (type === 'image' && availableImages > 0) {
        const url = blockSources.imageUrls[usedImageIndex % blockSources.imageUrls.length];
        imageData = blockSources.loadedImages.get(url);
        usedImageIndex++;
      } else if (type === 'keyword' && availableKeywords > 0) {
        keywordText = blockSources.keywords[usedKeywordIndex % blockSources.keywords.length];
        usedKeywordIndex++;
      }

      pendingConfig = generateBlockConfig(type, difficulty, imageData, keywordText);
      pendingBlock = createPendingBlock(k, pendingConfig, difficulty.oscillationSpeed);
      canDrop = true;
    }

    // ブロックを落下
    function handleDrop(): void {
      if (state.isGameOver || !pendingBlock || !pendingConfig || !canDrop) return;
      if (fallingBlock) return; // 前のブロックが着地するまで待つ

      canDrop = false;
      audioManager.playDrop();

      // ブロックを落下
      const droppedBlock = dropPendingBlock(k, pendingBlock, pendingConfig);
      pendingBlock = null;
      pendingConfig = null;
      fallingBlock = droppedBlock;

      state.blocksDropped++;
      state.blocksRemaining--;

      // 着地検出
      let landed = false;
      const onLand = () => {
        if (landed) return;
        landed = true;
        audioManager.playLand();
        fallingBlock = null;

        // 全ブロック落下完了チェック
        if (state.blocksRemaining <= 0) {
          // 少し待ってから完了判定（ブロックが安定するのを待つ）
          k.wait(1.0, () => {
            if (!state.isGameOver) {
              endGame('complete');
            }
          });
        } else {
          // 次のブロックをスポーン
          k.wait(0.3, spawnNextBlock);
        }
      };

      droppedBlock.onCollide('ground', onLand);
      droppedBlock.onCollide('droppedBlock', onLand);
    }

    // 入力ハンドリング
    k.onClick(handleDrop);
    k.onKeyPress('space', handleDrop);
    k.onTouchStart(handleDrop);

    // ゲーム終了
    function endGame(reason: 'complete' | 'blockFell'): void {
      if (state.isGameOver) return;

      state.isGameOver = true;
      state.gameOverReason = reason;

      // 待機ブロックを削除
      if (pendingBlock) {
        k.get('pendingBlockLabel').forEach((label) => k.destroy(label));
        k.destroy(pendingBlock);
        pendingBlock = null;
      }

      // 効果音
      if (reason === 'blockFell') {
        audioManager.playCrash();
      } else {
        audioManager.playComplete();
      }

      // リザルト画面へ遷移
      k.wait(1.5, () => {
        k.go('result', {
          score: state.velocity,
          blocksDropped: state.blocksDropped,
          reason,
        });
      });
    }

    // メインループ
    k.onUpdate(() => {
      if (state.isGameOver) return;

      // 落下判定
      if (checkFallenBlocks(k)) {
        endGame('blockFell');
        return;
      }

      // 最高到達点更新（一度達成した高さは下がらない）
      const currentHeight = calculateMaxHeight(k);
      if (currentHeight > state.velocity) {
        state.velocity = currentHeight;
      }

      // HUD更新
      updateHUD(k, hud, state);

      // 待機ブロック更新
      if (pendingBlock) {
        updatePendingBlock(pendingBlock, k.dt());
      }
    });

    // 最初のブロックをスポーン
    k.wait(0.5, spawnNextBlock);

    // ゲームオーバー表示
    k.onUpdate(() => {
      if (state.isGameOver && state.gameOverReason === 'blockFell') {
        // 画面を少し揺らす
        k.shake(5);
      }
    });
  });
}
