import Phaser from "phaser";
import { ACTION_BUTTON_Y, ACTION_HINT_Y, CENTER_X, FONT_FAMILY, GAME_HEIGHT, HUD_MARGIN } from "./constants";
import { t, toggleLanguage } from "./i18n";

// 左下に言語の切り替えボタンを置く。ボタンと L キーのどちらでも言語を切り替えてから onSwitch を呼ぶ。
// ボタンを destroy すると L キーの割り当ても外れる
export function addLanguageButton(scene: Phaser.Scene, onSwitch: () => void) {
  const keyboard = scene.input.keyboard!;
  const switchLanguage = () => {
    toggleLanguage();
    button.setText(t.switchLanguage);
    onSwitch();
  };

  const button = scene.add
    .text(HUD_MARGIN, GAME_HEIGHT - HUD_MARGIN, t.switchLanguage, {
      fontFamily: FONT_FAMILY,
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

// ボタンと Space / Enter キーのどれでも実行できる操作を追加し、作成した表示物を返す
export function addActionPrompt(scene: Phaser.Scene, label: string, hint: string, action: () => void) {
  const keyboard = scene.input.keyboard!;

  // ボタンとキーの同時入力で action が二重に呼ばれないようにする
  let activated = false;
  const activate = () => {
    if (activated) return;
    activated = true;
    keyboard.off("keydown-SPACE", activate);
    keyboard.off("keydown-ENTER", activate);
    action();
  };

  const button = scene.add
    .text(CENTER_X, ACTION_BUTTON_Y, label, {
      fontFamily: FONT_FAMILY,
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

  const hintText = scene.add
    .text(CENTER_X, ACTION_HINT_Y, hint, {
      fontFamily: FONT_FAMILY,
      fontSize: "20px",
      color: "#aaa",
    })
    .setOrigin(0.5);

  return [button, hintText] as const;
}
