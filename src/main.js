import Phaser from "phaser";

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: {
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

let player;
let coins;
let score = 0;
let scoreText;
let cursors;

const game = new Phaser.Game(config);

function preload() {
  this.load.image("player", "assets/player.png");
  this.load.image("coin", "assets/coin.png");
}

function create() {
  // プレイヤーの作成
  player = this.physics.add.sprite(400, 550, "player");
  this.physics.add.existing(player);
  player.body.setCollideWorldBounds(true);
  player.body.allowGravity = false;
  player.body.setImmovable(true);

  // コインのグループ作成
  coins = this.physics.add.group();

  // スコア表示
  scoreText = this.add.text(16, 16, "Score: 0", {
    fontSize: "32px",
    fill: "#fff",
  });

  // カーソルキーの割り当て
  cursors = this.input.keyboard.createCursorKeys();

  // コインを生成するタイマーイベント
  this.time.addEvent({
    delay: 1000, // 1秒ごとにコインを生成
    callback: generateCoin,
    callbackScope: this,
    loop: true,
  });

  // プレイヤーとコインの衝突判定
  this.physics.add.overlap(player, coins, collectCoin, null, this);
}

function update() {
  // プレイヤーの移動
  if (cursors.left.isDown) {
    player.body.setVelocityX(-300);
  } else if (cursors.right.isDown) {
    player.body.setVelocityX(300);
  } else {
    player.body.setVelocityX(0);
  }

  // 画面下部に到達したコインを削除し、新しいコインを生成
  const coinArray = coins.getChildren();
  for (let i = coinArray.length - 1; i >= 0; i--) {
    const coin = coinArray[i];
    if (coin.y > 600) {
      coin.destroy(); // 画面外に出たら削除（タイマーが次を生成するのでここでは生成しない）
    }
  }
}

function generateCoin() {
  const x = Phaser.Math.Between(50, 750); // ランダムなX座標
  const coin = coins.create(x, 0, "coin");
  coin.body.setCollideWorldBounds(false);
  coin.body.setGravityY(200);
}

function collectCoin(player, coin) {
  coin.destroy();
  score += 1;
  scoreText.setText("Score: " + score);
  generateCoin.call(this); // 新しいコインを生成
}
