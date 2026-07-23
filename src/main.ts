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

let player: Phaser.Physics.Arcade.Sprite;
let playerBody: Phaser.Physics.Arcade.Body;
let coins: Phaser.Physics.Arcade.Group;
let score = 0;
let scoreText: Phaser.GameObjects.Text;
let cursors: Phaser.Types.Input.Keyboard.CursorKeys;

const game = new Phaser.Game(config);

function preload(this: Phaser.Scene) {
  this.load.image("player", "assets/player.png");
  this.load.image("coin", "assets/coin.png");
}

function create(this: Phaser.Scene) {
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

  // カーソルキーの割り当て
  cursors = this.input.keyboard!.createCursorKeys();

  // コインを生成するタイマーイベント
  this.time.addEvent({
    delay: 1000, // 1秒ごとにコインを生成
    callback: generateCoin,
    callbackScope: this,
    loop: true,
  });

  // プレイヤーとコインの衝突判定
  this.physics.add.overlap(player, coins, collectCoin, undefined, this);
}

function update() {
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
