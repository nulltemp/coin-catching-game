import Phaser from "phaser";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: {
        x: 0,
        y: 200,
      },
      debug: false,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const HIGH_SCORE_KEY = "coin-catching-game-high-score";

function loadHighScore(): number {
  try {
    const saved = localStorage.getItem(HIGH_SCORE_KEY);
    return saved ? parseInt(saved, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

function saveHighScore(value: number) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(value));
  } catch {
    // localStorageが使えない環境（プライベートモード等）では保存をスキップ
  }
}

let player: Phaser.Physics.Arcade.Sprite;
let playerBody: Phaser.Physics.Arcade.Body;
let coins: Phaser.Physics.Arcade.Group;
let score = 0;
let scoreText: Phaser.GameObjects.Text;
let highScore = loadHighScore();
let highScoreText: Phaser.GameObjects.Text;
let cursors: Phaser.Types.Input.Keyboard.CursorKeys;

const TIME_LIMIT = 20; // 秒
let remainingTime = TIME_LIMIT;
let timerText: Phaser.GameObjects.Text;
let spawnEvent: Phaser.Time.TimerEvent;
let countdownEvent: Phaser.Time.TimerEvent;
let isGameOver = false;

const game = new Phaser.Game(config);

function preload(this: Phaser.Scene) {
  this.load.image("player", "assets/player.png");
  this.load.image("coin", "assets/coin.png");
}

function create(this: Phaser.Scene) {
  // 状態のリセット（scene.restart() での再実行に対応）
  score = 0;
  remainingTime = TIME_LIMIT;
  isGameOver = false;

  // プレイヤーの作成
  player = this.physics.add.sprite(400, 550, "player");
  this.physics.add.existing(player);
  playerBody = player.body as Phaser.Physics.Arcade.Body;
  playerBody.setCollideWorldBounds(true);
  playerBody.allowGravity = false;
  playerBody.setImmovable(true);

  // コインのグループ作成
  coins = this.physics.add.group();

  // スコア表示
  scoreText = this.add.text(16, 16, "Score: 0", {
    fontSize: "32px",
    color: "#fff",
  });

  // ハイスコア表示
  highScoreText = this.add.text(16, 56, `High Score: ${highScore}`, {
    fontSize: "24px",
    color: "#ff0",
  });

  // 制限時間表示
  timerText = this.add.text(650, 16, `Time: ${remainingTime}`, {
    fontSize: "32px",
    color: "#fff",
  });

  // カーソルキーの割り当て
  cursors = this.input.keyboard!.createCursorKeys();

  // コインを生成するタイマーイベント
  spawnEvent = this.time.addEvent({
    delay: 1000, // 1秒ごとにコインを生成
    callback: generateCoin,
    callbackScope: this,
    loop: true,
  });

  // 制限時間をカウントダウンするタイマーイベント
  countdownEvent = this.time.addEvent({
    delay: 1000,
    callback: () => {
      remainingTime -= 1;
      timerText.setText(`Time: ${remainingTime}`);
      if (remainingTime <= 0) {
        endGame.call(this);
      }
    },
    callbackScope: this,
    loop: true,
  });

  // プレイヤーとコインの衝突判定
  this.physics.add.overlap(player, coins, collectCoin, undefined, this);
}

function endGame(this: Phaser.Scene) {
  if (isGameOver) return;
  isGameOver = true;

  spawnEvent.remove();
  countdownEvent.remove();
  this.physics.pause();

  const isNewRecord = score > highScore;
  if (isNewRecord) {
    highScore = score;
    saveHighScore(highScore);
    highScoreText.setText(`High Score: ${highScore}`);
  }

  this.add
    .text(
      400,
      250,
      `Game Over\nScore: ${score}\nHigh Score: ${highScore}${isNewRecord ? "\nNew Record!" : ""}`,
      {
        fontSize: "48px",
        color: "#fff",
        align: "center",
      }
    )
    .setOrigin(0.5);

  this.add
    .text(400, 430, "もう一度プレイ", {
      fontSize: "32px",
      color: "#0f0",
      backgroundColor: "#333",
      padding: { x: 20, y: 10 },
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on("pointerdown", () => {
      this.scene.restart();
    });
}

function update(this: Phaser.Scene) {
  if (isGameOver) return;

  // プレイヤーの移動
  if (cursors.left.isDown) {
    playerBody.setVelocityX(-300);
  } else if (cursors.right.isDown) {
    playerBody.setVelocityX(300);
  } else {
    playerBody.setVelocityX(0);
  }

  // 画面下部に到達したコインを削除し、新しいコインを生成
  const coinArray = coins.getChildren() as Phaser.Physics.Arcade.Sprite[];
  for (let i = coinArray.length - 1; i >= 0; i--) {
    const coin = coinArray[i];
    if (coin.y > 600) {
      coin.destroy(); // 画面外に出たら削除（タイマーが次を生成するのでここでは生成しない）
    }
  }
}

function generateCoin() {
  const x = Phaser.Math.Between(50, 750); // ランダムなX座標
  const coin = coins.create(x, 0, "coin") as Phaser.Physics.Arcade.Sprite;
  const coinBody = coin.body as Phaser.Physics.Arcade.Body;
  coinBody.setCollideWorldBounds(false);
  coinBody.setGravityY(200);
}

function collectCoin(
  _player: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile,
  coinObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile
) {
  const coin = coinObj as Phaser.Physics.Arcade.Sprite;
  coin.destroy();
  score += 1;
  scoreText.setText("Score: " + score);
  generateCoin(); // 新しいコインを生成
}
