import Phaser from "phaser";
import {
  BASE_SPAWN_DELAY,
  CENTER_X,
  COIN_SPAWN_MARGIN,
  COIN_SPAWN_Y,
  FALL_SPEED_STEP,
  FONT_FAMILY,
  GAME_HEIGHT,
  GAME_WIDTH,
  HIGH_SCORE_Y,
  HUD_MARGIN,
  LEVEL_DURATION,
  MIN_SPAWN_DELAY,
  PLAYER_SPEED,
  PLAYER_Y,
  SCENE_PLAY,
  SCENE_RESULT,
  SCENE_TITLE,
  SPAWN_DELAY_STEP,
  TIME_LIMIT,
} from "../constants";
import { loadHighScore, saveHighScore } from "../highScore";
import { t } from "../i18n";
import type { ResultData } from "./ResultScene";

export interface PlayData {
  // true ならスタート画面（TitleScene）を重ねて待ち、false ならすぐ始める（リスタート時）
  showTitle?: boolean;
}

// プレイ画面：プレイヤー・コイン・HUD とゲームの進行を持つ。
// スタート画面（TitleScene）と結果画面（ResultScene）はこのシーンの上に重ねて表示する
export class PlayScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private coins!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private scoreText!: Phaser.GameObjects.Text;
  private highScoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private spawnEvent?: Phaser.Time.TimerEvent;
  private countdownEvent?: Phaser.Time.TimerEvent;

  private score = 0;
  private highScore = loadHighScore();
  private level = 1;
  private remainingTime = TIME_LIMIT;
  private isPlaying = false;

  constructor() {
    super(SCENE_PLAY);
  }

  preload() {
    this.load.image("player", "assets/player.png");
    this.load.image("coin", "assets/coin.png");
  }

  create(data: PlayData) {
    // index.html の「読み込み中」の表示を消す（リスタート時は既に無い）
    document.getElementById("loading")?.remove();

    // 状態のリセット（scene.restart() での再実行に対応）
    this.score = 0;
    this.remainingTime = TIME_LIMIT;
    this.level = 1;
    this.setPlaying(false);

    // プレイヤーの作成
    this.player = this.physics.add.sprite(CENTER_X, PLAYER_Y, "player");
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCollideWorldBounds(true);
    this.playerBody.allowGravity = false;
    this.playerBody.setImmovable(true);

    // コインのグループ作成
    this.coins = this.physics.add.group();

    // スコア表示
    this.scoreText = this.add.text(HUD_MARGIN, HUD_MARGIN, "", {
      fontFamily: FONT_FAMILY,
      fontSize: "32px",
      color: "#fff",
    });

    // ハイスコア表示
    this.highScoreText = this.add.text(HUD_MARGIN, HIGH_SCORE_Y, "", {
      fontFamily: FONT_FAMILY,
      fontSize: "24px",
      color: "#ff0",
    });

    // 制限時間表示（右端から16pxの位置に右揃えで配置し、桁数が変わっても見切れないようにする）
    this.timerText = this.add
      .text(GAME_WIDTH - HUD_MARGIN, HUD_MARGIN, "", {
        fontFamily: FONT_FAMILY,
        fontSize: "32px",
        color: "#fff",
      })
      .setOrigin(1, 0);

    // レベル表示
    this.levelText = this.add
      .text(CENTER_X, HUD_MARGIN, "", {
        fontFamily: FONT_FAMILY,
        fontSize: "32px",
        color: "#0ff",
      })
      .setOrigin(0.5, 0);

    this.refreshHud();

    // カーソルキーの割り当て
    this.cursors = this.input.keyboard!.createCursorKeys();

    // プレイヤーとコインの衝突判定
    this.physics.add.overlap(this.player, this.coins, this.collectCoin, undefined, this);

    if (data.showTitle === false) {
      this.startGame();
    } else {
      this.scene.launch(SCENE_TITLE);
    }
  }

  // HUD の文言を現在の言語と値で書き直す（言語の切り替え時にも呼ぶ）
  refreshHud() {
    this.scoreText.setText(t.score(this.score));
    this.highScoreText.setText(t.highScore(this.highScore));
    this.timerText.setText(t.time(this.remainingTime));
    this.levelText.setText(t.level(this.level));
  }

  // プレイ中はフッターのリンク（プライバシーポリシー）を誤タップしないよう、body のクラスで隠す（index.html の CSS）
  private setPlaying(value: boolean) {
    this.isPlaying = value;
    document.body.classList.toggle("is-playing", value);
  }

  startGame() {
    this.setPlaying(true);

    // コインを生成するタイマー（レベルに応じて間隔が変わるので毎回スケジュールし直す）
    this.scheduleSpawn();

    // 制限時間をカウントダウンするタイマーイベント
    this.countdownEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.remainingTime -= 1;
        this.timerText.setText(t.time(this.remainingTime));
        if (this.remainingTime <= 0) {
          this.endGame();
        } else {
          this.updateLevel();
        }
      },
      loop: true,
    });
  }

  private scheduleSpawn() {
    const delay = Math.max(MIN_SPAWN_DELAY, BASE_SPAWN_DELAY - (this.level - 1) * SPAWN_DELAY_STEP);
    this.spawnEvent = this.time.delayedCall(delay, () => {
      this.generateCoin();
      this.scheduleSpawn();
    });
  }

  private updateLevel() {
    const elapsed = TIME_LIMIT - this.remainingTime;
    const newLevel = 1 + Math.floor(elapsed / LEVEL_DURATION);
    if (newLevel !== this.level) {
      this.level = newLevel;
      this.levelText.setText(t.level(this.level));
    }
  }

  private endGame() {
    if (!this.isPlaying) return;
    this.setPlaying(false);

    this.spawnEvent?.remove();
    this.countdownEvent?.remove();
    this.physics.pause();

    const isNewRecord = this.score > this.highScore;
    if (isNewRecord) {
      this.highScore = this.score;
      saveHighScore(this.highScore);
      this.highScoreText.setText(t.highScore(this.highScore));
    }

    const result: ResultData = { score: this.score, highScore: this.highScore, isNewRecord };
    this.scene.launch(SCENE_RESULT, result);
  }

  update() {
    if (!this.isPlaying) return;

    // プレイヤーの移動（キーボード優先、なければタッチ／マウスの位置へ追従）
    const pointer = this.input.activePointer;
    if (this.cursors.left.isDown) {
      this.playerBody.setVelocityX(-PLAYER_SPEED);
    } else if (this.cursors.right.isDown) {
      this.playerBody.setVelocityX(PLAYER_SPEED);
    } else if (pointer.isDown) {
      const dx = pointer.worldX - this.player.x;
      this.playerBody.setVelocityX(Phaser.Math.Clamp(dx * 10, -PLAYER_SPEED, PLAYER_SPEED));
    } else {
      this.playerBody.setVelocityX(0);
    }

    // 画面下部に到達したコインを削除
    const coinArray = this.coins.getChildren() as Phaser.Physics.Arcade.Sprite[];
    for (let i = coinArray.length - 1; i >= 0; i--) {
      const coin = coinArray[i];
      if (coin.y > GAME_HEIGHT) {
        coin.destroy(); // 画面外に出たら削除（タイマーが次を生成するのでここでは生成しない）
      }
    }
  }

  private generateCoin() {
    const x = Phaser.Math.Between(COIN_SPAWN_MARGIN, GAME_WIDTH - COIN_SPAWN_MARGIN); // ランダムなX座標
    const coin = this.coins.create(x, COIN_SPAWN_Y, "coin") as Phaser.Physics.Arcade.Sprite;
    const coinBody = coin.body as Phaser.Physics.Arcade.Body;
    coinBody.setCollideWorldBounds(false);
    coinBody.setVelocityY((this.level - 1) * FALL_SPEED_STEP);
  }

  private collectCoin(
    _player: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile,
    coinObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile
  ) {
    const coin = coinObj as Phaser.Physics.Arcade.Sprite;
    coin.destroy();
    this.score += 1;
    this.scoreText.setText(t.score(this.score));
    this.generateCoin(); // 新しいコインを生成
  }
}
