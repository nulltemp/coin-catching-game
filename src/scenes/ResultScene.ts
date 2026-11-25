import Phaser from "phaser";
import {
  CENTER_X,
  FONT_FAMILY,
  GAME_HEIGHT,
  GAME_WIDTH,
  RESTART_PROMPT_DELAY,
  RESULT_OVERLAY_ALPHA,
  RESULT_Y,
  SCENE_PLAY,
  SCENE_RESULT,
} from "../constants";
import { t } from "../i18n";
import { addActionPrompt, addLanguageButton } from "../ui";
import type { PlayData, PlayScene } from "./PlayScene";

export interface ResultData {
  score: number;
  highScore: number;
  isNewRecord: boolean;
}

// 結果画面：止まった PlayScene の上に重ねて表示する
export class ResultScene extends Phaser.Scene {
  constructor() {
    super(SCENE_RESULT);
  }

  create({ score, highScore, isNewRecord }: ResultData) {
    // 止まったコインやプレイヤーが結果の文字に重ならないよう、画面全体を暗くする板を敷く
    this.add.rectangle(CENTER_X, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, RESULT_OVERLAY_ALPHA);

    const resultMessage = () =>
      `${t.gameOver}\n${t.score(score)}\n${t.highScore(highScore)}${isNewRecord ? `\n${t.newRecord}` : ""}`;
    const resultText = this.add
      .text(CENTER_X, RESULT_Y, resultMessage(), {
        fontFamily: FONT_FAMILY,
        fontSize: "48px",
        color: "#fff",
        align: "center",
      })
      .setOrigin(0.5);

    this.time.delayedCall(RESTART_PROMPT_DELAY, () => {
      const [button, hintText] = addActionPrompt(this, t.playAgain, t.restartHint, () => {
        languageButton.destroy();
        const data: PlayData = { showTitle: false };
        this.scene.start(SCENE_PLAY, data); // このシーンは止まり、PlayScene がすぐプレイを始める
      });

      // 結果画面でも言語を切り替えられるようにする。結果を残したまま、表示中の文言だけを差し替える
      const languageButton = addLanguageButton(this, () => {
        resultText.setText(resultMessage());
        button.setText(t.playAgain);
        hintText.setText(t.restartHint);
        (this.scene.get(SCENE_PLAY) as PlayScene).refreshHud();
      });
    });
  }
}
