// ボタンの「上で押し始め、上で離した」ことだけを押下として数える（#59）。
// Phaser のゲームオブジェクトの pointerup は、どこで押し始めたかに関係なくボタンの上で離せば発火するため、
// プレイ中から押し続けた指を結果画面のボタンの上で離しただけで反応してしまう。それを防ぐのに使う。
// Phaser に依存しない純粋なロジックとして src/press.test.ts でテストする
export interface PressTracker {
  /** ボタンの上で押し始めた（pointerdown） */
  down(): void;
  /** 押下を取り消す（ボタンの外に出た pointerout など） */
  cancel(): void;
  /** ボタンの上で離した（pointerup）。ボタンの上で押し始めていれば true を返す。いずれにせよ押下状態は戻す */
  up(): boolean;
}

export function createPressTracker(): PressTracker {
  let pressed = false;
  return {
    down() {
      pressed = true;
    },
    cancel() {
      pressed = false;
    },
    up() {
      const wasPressed = pressed;
      pressed = false;
      return wasPressed;
    },
  };
}
