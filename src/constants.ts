// ゲーム画面の論理サイズ（Phaser.Scale.FIT で実際の画面に合わせて拡大縮小される）
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const CENTER_X = GAME_WIDTH / 2;
export const HUD_MARGIN = 16; // 画面端から HUD テキストまでの余白
export const HIGH_SCORE_Y = 56; // スコア（32px）の下に並べるハイスコアの Y 座標
export const PLAYER_Y = GAME_HEIGHT - 50;

// スタート画面・結果画面の各要素の中心の Y 座標
export const TITLE_Y = 190;
export const INSTRUCTIONS_Y = 300;
export const RESULT_Y = 250; // 結果（ゲームオーバー・スコアなど）
export const ACTION_BUTTON_Y = 430; // スタート・もう一度遊ぶボタン
export const ACTION_HINT_Y = 485; // ボタンの下のキー操作の案内
export const COIN_SPAWN_MARGIN = 50; // コインを出現させない左右の余白
export const COIN_SPAWN_Y = -20; // コインは画面の上端より外（32px の画像が隠れる位置）に出し、HUD と重ならないようにする
export const RESULT_OVERLAY_ALPHA = 0.6; // 結果画面で止まったコインなどを暗くする板の不透明度

// ゲーム内の全テキストの書体。Phaser の既定（Courier）のままだと日本語だけ別の書体で表示され、
// 数字と書体が揃わないため、日本語と英数字の両方を持つ OS 標準の書体を先に並べる（Web フォントは読み込まない）
export const FONT_FAMILY =
  '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic UI", "Meiryo", "Noto Sans CJK JP", "Noto Sans JP", sans-serif';

// コインの落下に使う重力（プレイヤーは allowGravity = false なので影響を受けない）
export const GRAVITY_Y = 400;

export const TIME_LIMIT = 20; // 秒
export const PLAYER_SPEED = 300;
export const RESTART_PROMPT_DELAY = 500; // ミリ秒。プレイ中の連打で結果を見ずにリスタートしないよう、少し待ってから表示する

// 難易度: LEVEL_DURATION 秒ごとにレベルが上がり、コインの出現間隔が短く・落下が速くなる
export const LEVEL_DURATION = 5; // 秒
export const BASE_SPAWN_DELAY = 1000; // ミリ秒
export const SPAWN_DELAY_STEP = 200; // レベルごとに短くなる出現間隔
export const MIN_SPAWN_DELAY = 400;
export const FALL_SPEED_STEP = 120; // レベルごとに加算されるコインの初速

// シーンのキー
export const SCENE_PLAY = "play";
export const SCENE_TITLE = "title";
export const SCENE_RESULT = "result";
