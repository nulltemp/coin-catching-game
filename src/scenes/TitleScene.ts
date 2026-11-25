import Phaser from "phaser";
import { CENTER_X, FONT_FAMILY, INSTRUCTIONS_Y, SCENE_PLAY, SCENE_TITLE, TIME_LIMIT, TITLE_Y } from "../constants";
import { t } from "../i18n";
import { addActionPrompt, addLanguageButton } from "../ui";
import type { PlayData, PlayScene } from "./PlayScene";

// スタート画面：最初の 1 回だけ、待機中の PlayScene の上に重ねて表示する
export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SCENE_TITLE);
  }

  create() {
    this.add
      .text(CENTER_X, TITLE_Y, t.title, {
        fontFamily: FONT_FAMILY,
        fontSize: "48px",
        color: "#ff0",
      })
      .setOrigin(0.5);

    this.add
      .text(CENTER_X, INSTRUCTIONS_Y, t.instructions(TIME_LIMIT), {
        fontFamily: FONT_FAMILY,
        fontSize: "24px",
        color: "#fff",
        align: "center",
      })
      .setOrigin(0.5);

    // 言語の切り替え（PlayScene ごと作り直して全ての文言を更新し、スタート画面を再表示する）
    const languageButton = addLanguageButton(this, () => {
      languageButton.destroy(); // 再起動を待たずに L キーの割り当てを外し、二重に切り替えないようにする
      const data: PlayData = { showTitle: true };
      this.scene.start(SCENE_PLAY, data); // このシーンは止まり、PlayScene が再起動してスタート画面を開き直す
    });

    addActionPrompt(this, t.start, t.startHint, () => {
      const play = this.scene.get(SCENE_PLAY) as PlayScene;
      this.scene.stop();
      play.startGame();
    });
  }
}
