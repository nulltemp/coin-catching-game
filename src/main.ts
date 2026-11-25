import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, GRAVITY_Y } from "./constants";
import { applyPageLanguage } from "./i18n";
import { PlayScene } from "./scenes/PlayScene";
import { ResultScene } from "./scenes/ResultScene";
import { TitleScene } from "./scenes/TitleScene";

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
  // 先頭の PlayScene だけが起動し、スタート画面・結果画面はその上に重ねて起動する（後ろのシーンほど手前に描かれる）
  scene: [PlayScene, TitleScene, ResultScene],
};

applyPageLanguage();

new Phaser.Game(config);
