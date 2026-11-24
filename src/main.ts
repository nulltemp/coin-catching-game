import Phaser from "phaser";
import { applyPageLanguage, t, toggleLanguage } from "./i18n";

// ゲーム画面の論理サイズ（Phaser.Scale.FIT で実際の画面に合わせて拡大縮小される）
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const CENTER_X = GAME_WIDTH / 2;
const HUD_MARGIN = 16; // 画面端から HUD テキストまでの余白
const HIGH_SCORE_Y = 56; // スコア（32px）の下に並べるハイスコアの Y 座標
const PLAYER_Y = GAME_HEIGHT - 50;

// スタート画面・結果画面の各要素の中心の Y 座標
const TITLE_Y = 190;
const INSTRUCTIONS_Y = 300;
const RESULT_Y = 250; // 結果（ゲームオーバー・スコアなど）
const ACTION_BUTTON_Y = 430; // スタート・もう一度遊ぶボタン
const ACTION_HINT_Y = 485; // ボタンの下のキー操作の案内
const COIN_SPAWN_MARGIN = 50; // コインを出現させない左右の余白
const COIN_SPAWN_Y = -20; // コインは画面の上端より外（32px の画像が隠れる位置）に出し、HUD と重ならないようにする
const RESULT_OVERLAY_ALPHA = 0.6; // 結果画面で止まったコインなどを暗くする板の不透明度

// コインの落下に使う重力（プレイヤーは allowGravity = false なので影響を受けない）
const GRAVITY_Y = 400;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  scale: {
    // 画面サイズに合わせて縦横比を保ったまま拡大縮小（スマホ対応）
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: {
        x: 0,
        y: GRAVITY_Y,
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
const PLAYER_SPEED = 300;
const RESTART_PROMPT_DELAY = 500; // ミリ秒。プレイ中の連打で結果を見ずにリスタートしないよう、少し待ってから表示する

// 難易度: LEVEL_DURATION 秒ごとにレベルが上がり、コインの出現間隔が短く・落下が速くなる
const LEVEL_DURATION = 5; // 秒
const BASE_SPAWN_DELAY = 1000; // ミリ秒
const SPAWN_DELAY_STEP = 200; // レベルごとに短くなる出現間隔
const MIN_SPAWN_DELAY = 400;
const FALL_SPEED_STEP = 120; // レベルごとに加算されるコインの初速

let level = 1;
let levelText: Phaser.GameObjects.Text;
let remainingTime = TIME_LIMIT;
let timerText: Phaser.GameObjects.Text;
let spawnEvent: Phaser.Time.TimerEvent;
let countdownEvent: Phaser.Time.TimerEvent;
let isPlaying = false;
let hasSeenStartScreen = false; // スタート画面は初回のみ表示し、リスタート時はすぐ始める

applyPageLanguage();

new Phaser.Game(config);

function preload(this: Phaser.Scene) {
  this.load.image("player", "assets/player.png");
  this.load.image("coin", "assets/coin.png");
}

function create(this: Phaser.Scene) {
  // 状態のリセット（scene.restart() での再実行に対応）
  score = 0;
  remainingTime = TIME_LIMIT;
  level = 1;
  setPlaying(false);

  // プレイヤーの作成
  player = this.physics.add.sprite(CENTER_X, PLAYER_Y, "player");
  playerBody = player.body as Phaser.Physics.Arcade.Body;
  playerBody.setCollideWorldBounds(true);
  playerBody.allowGravity = false;
  playerBody.setImmovable(true);

  // コインのグループ作成
  coins = this.physics.add.group();

  // スコア表示
  scoreText = this.add.text(HUD_MARGIN, HUD_MARGIN, t.score(0), {
    fontSize: "32px",
    color: "#fff",
  });

  // ハイスコア表示
  highScoreText = this.add.text(HUD_MARGIN, HIGH_SCORE_Y, t.highScore(highScore), {
    fontSize: "24px",
    color: "#ff0",
  });

  // 制限時間表示（右端から16pxの位置に右揃えで配置し、桁数が変わっても見切れないようにする）
  timerText = this.add
    .text(GAME_WIDTH - HUD_MARGIN, HUD_MARGIN, t.time(remainingTime), {
      fontSize: "32px",
      color: "#fff",
    })
    .setOrigin(1, 0);

  // レベル表示
  levelText = this.add
    .text(CENTER_X, HUD_MARGIN, t.level(level), {
      fontSize: "32px",
      color: "#0ff",
    })
    .setOrigin(0.5, 0);

  // カーソルキーの割り当て
  cursors = this.input.keyboard!.createCursorKeys();

  // プレイヤーとコインの衝突判定
  this.physics.add.overlap(player, coins, collectCoin, undefined, this);

  if (hasSeenStartScreen) {
    startGame.call(this);
  } else {
    showStartScreen.call(this);
  }
}

function showStartScreen(this: Phaser.Scene) {
  hasSeenStartScreen = true;

  const title = this.add
    .text(CENTER_X, TITLE_Y, t.title, {
      fontSize: "48px",
      color: "#ff0",
    })
    .setOrigin(0.5);

  const instructions = this.add
    .text(CENTER_X, INSTRUCTIONS_Y, t.instructions(TIME_LIMIT), {
      fontSize: "24px",
      color: "#fff",
      align: "center",
    })
    .setOrigin(0.5);

  // 言語の切り替え（シーンを作り直して全ての文言を更新し、スタート画面を再表示する）
  const languageButton = addLanguageButton.call(this, () => {
    languageButton.destroy(); // 再起動を待たずに L キーの割り当てを外し、二重に切り替えないようにする
    hasSeenStartScreen = false;
    this.scene.restart();
  });

  const prompt = addActionPrompt.call(this, t.start, t.startHint, () => {
    title.destroy();
    instructions.destroy();
    languageButton.destroy();
    prompt.forEach((obj) => obj.destroy());
    startGame.call(this);
  });
}

// 左下に言語の切り替えボタンを置く。ボタンと L キーのどちらでも言語を切り替えてから onSwitch を呼ぶ。
// ボタンを destroy すると L キーの割り当ても外れる
function addLanguageButton(this: Phaser.Scene, onSwitch: () => void) {
  const keyboard = this.input.keyboard!;
  const switchLanguage = () => {
    toggleLanguage();
    button.setText(t.switchLanguage);
    onSwitch();
  };

  const button = this.add
    .text(HUD_MARGIN, GAME_HEIGHT - HUD_MARGIN, t.switchLanguage, {
      fontSize: "20px",
      color: "#0ff",
      backgroundColor: "#333",
      padding: { x: 12, y: 8 },
    })
    .setOrigin(0, 1)
    .setInteractive({ useHandCursor: true })
    .on("pointerdown", switchLanguage)
    .once(Phaser.GameObjects.Events.DESTROY, () => keyboard.off("keydown-L", switchLanguage));

  // キーボードだけでも切り替えられるよう、L キーにも同じ処理を割り当てる
  keyboard.on("keydown-L", switchLanguage);

  return button;
}

// プレイ中はフッターのリンク（プライバシーポリシー）を誤タップしないよう、body のクラスで隠す（index.html の CSS）
function setPlaying(value: boolean) {
  isPlaying = value;
  document.body.classList.toggle("is-playing", value);
}

function startGame(this: Phaser.Scene) {
  setPlaying(true);

  // コインを生成するタイマー（レベルに応じて間隔が変わるので毎回スケジュールし直す）
  scheduleSpawn.call(this);

  // 制限時間をカウントダウンするタイマーイベント
  countdownEvent = this.time.addEvent({
    delay: 1000,
    callback: () => {
      remainingTime -= 1;
      timerText.setText(t.time(remainingTime));
      if (remainingTime <= 0) {
        endGame.call(this);
      } else {
        updateLevel();
      }
    },
    callbackScope: this,
    loop: true,
  });
}

// ボタンと Space / Enter キーのどれでも実行できる操作を追加し、作成した表示物を返す
function addActionPrompt(this: Phaser.Scene, label: string, hint: string, action: () => void) {
  const keyboard = this.input.keyboard!;

  // ボタンとキーの同時入力で action が二重に呼ばれないようにする
  let activated = false;
  const activate = () => {
    if (activated) return;
    activated = true;
    keyboard.off("keydown-SPACE", activate);
    keyboard.off("keydown-ENTER", activate);
    action();
  };

  const button = this.add
    .text(CENTER_X, ACTION_BUTTON_Y, label, {
      fontSize: "32px",
      color: "#0f0",
      backgroundColor: "#333",
      padding: { x: 20, y: 10 },
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on("pointerdown", activate);

  keyboard.on("keydown-SPACE", activate);
  keyboard.on("keydown-ENTER", activate);

  const hintText = this.add
    .text(CENTER_X, ACTION_HINT_Y, hint, {
      fontSize: "20px",
      color: "#aaa",
    })
    .setOrigin(0.5);

  return [button, hintText];
}

function scheduleSpawn(this: Phaser.Scene) {
  const delay = Math.max(MIN_SPAWN_DELAY, BASE_SPAWN_DELAY - (level - 1) * SPAWN_DELAY_STEP);
  spawnEvent = this.time.delayedCall(delay, () => {
    generateCoin();
    scheduleSpawn.call(this);
  });
}

function updateLevel() {
  const elapsed = TIME_LIMIT - remainingTime;
  const newLevel = 1 + Math.floor(elapsed / LEVEL_DURATION);
  if (newLevel !== level) {
    level = newLevel;
    levelText.setText(t.level(level));
  }
}

function endGame(this: Phaser.Scene) {
  if (!isPlaying) return;
  setPlaying(false);

  spawnEvent.remove();
  countdownEvent.remove();
  this.physics.pause();

  const isNewRecord = score > highScore;
  if (isNewRecord) {
    highScore = score;
    saveHighScore(highScore);
    highScoreText.setText(t.highScore(highScore));
  }

  // 止まったコインやプレイヤーが結果の文字に重ならないよう、画面全体を暗くする板を敷く
  this.add.rectangle(CENTER_X, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, RESULT_OVERLAY_ALPHA);

  const resultMessage = () =>
    `${t.gameOver}\n${t.score(score)}\n${t.highScore(highScore)}${isNewRecord ? `\n${t.newRecord}` : ""}`;
  const resultText = this.add
    .text(CENTER_X, RESULT_Y, resultMessage(), {
      fontSize: "48px",
      color: "#fff",
      align: "center",
    })
    .setOrigin(0.5);

  this.time.delayedCall(RESTART_PROMPT_DELAY, () => {
    const [button, hintText] = addActionPrompt.call(this, t.playAgain, t.restartHint, () => {
      languageButton.destroy();
      this.scene.restart();
    });

    // 結果画面でも言語を切り替えられるようにする。結果を残したまま、表示中の文言だけを差し替える
    const languageButton = addLanguageButton.call(this, () => {
      resultText.setText(resultMessage());
      button.setText(t.playAgain);
      hintText.setText(t.restartHint);
      scoreText.setText(t.score(score));
      highScoreText.setText(t.highScore(highScore));
      timerText.setText(t.time(remainingTime));
      levelText.setText(t.level(level));
    });
  });
}

function update(this: Phaser.Scene) {
  if (!isPlaying) return;

  // プレイヤーの移動（キーボード優先、なければタッチ／マウスの位置へ追従）
  const pointer = this.input.activePointer;
  if (cursors.left.isDown) {
    playerBody.setVelocityX(-PLAYER_SPEED);
  } else if (cursors.right.isDown) {
    playerBody.setVelocityX(PLAYER_SPEED);
  } else if (pointer.isDown) {
    const dx = pointer.worldX - player.x;
    playerBody.setVelocityX(Phaser.Math.Clamp(dx * 10, -PLAYER_SPEED, PLAYER_SPEED));
  } else {
    playerBody.setVelocityX(0);
  }

  // 画面下部に到達したコインを削除
  const coinArray = coins.getChildren() as Phaser.Physics.Arcade.Sprite[];
  for (let i = coinArray.length - 1; i >= 0; i--) {
    const coin = coinArray[i];
    if (coin.y > GAME_HEIGHT) {
      coin.destroy(); // 画面外に出たら削除（タイマーが次を生成するのでここでは生成しない）
    }
  }
}

function generateCoin() {
  const x = Phaser.Math.Between(COIN_SPAWN_MARGIN, GAME_WIDTH - COIN_SPAWN_MARGIN); // ランダムなX座標
  const coin = coins.create(x, COIN_SPAWN_Y, "coin") as Phaser.Physics.Arcade.Sprite;
  const coinBody = coin.body as Phaser.Physics.Arcade.Body;
  coinBody.setCollideWorldBounds(false);
  coinBody.setVelocityY((level - 1) * FALL_SPEED_STEP);
}

function collectCoin(
  _player: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile,
  coinObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile
) {
  const coin = coinObj as Phaser.Physics.Arcade.Sprite;
  coin.destroy();
  score += 1;
  scoreText.setText(t.score(score));
  generateCoin(); // 新しいコインを生成
}
