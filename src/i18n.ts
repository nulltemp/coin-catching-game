const LANGUAGE_KEY = "coin-catching-game-language";

const ja = {
  title: "コインキャッチゲーム",
  instructions: (seconds: number) =>
    `${seconds}秒でコインをたくさんキャッチしよう！\n\nPC：← → キー / マウスを押したまま\nスマホ：画面をタッチ`,
  start: "スタート",
  startHint: "Space / Enter でもスタート",
  playAgain: "もう一度プレイ",
  restartHint: "Space / Enter でもリスタート",
  score: (value: number) => `スコア: ${value}`,
  highScore: (value: number) => `ハイスコア: ${value}`,
  time: (value: number) => `タイム: ${value}`,
  level: (value: number) => `Lv: ${value}`,
  gameOver: "ゲームオーバー",
  newRecord: "新記録！",
  switchLanguage: "English", // 切り替え先の言語名
  privacyPolicy: "プライバシーポリシー",
};

const en: typeof ja = {
  title: "Coin Catching Game",
  instructions: (seconds: number) =>
    `Catch as many coins as you can in ${seconds} seconds!\n\nPC: ← → keys / hold the mouse button\nMobile: touch the screen`,
  start: "Start",
  startHint: "Or press Space / Enter to start",
  playAgain: "Play Again",
  restartHint: "Or press Space / Enter to restart",
  score: (value: number) => `Score: ${value}`,
  highScore: (value: number) => `High Score: ${value}`,
  time: (value: number) => `Time: ${value}`,
  level: (value: number) => `Lv: ${value}`,
  gameOver: "Game Over",
  newRecord: "New Record!",
  switchLanguage: "日本語",
  privacyPolicy: "Privacy Policy",
};

const messages = { ja, en };
type Language = keyof typeof messages;

function isLanguage(value: string | null): value is Language {
  return value === "ja" || value === "en";
}

function loadLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (isLanguage(saved)) return saved;
  } catch {
    // localStorageが使えない環境ではブラウザの言語設定に従う
  }
  return navigator.language.toLowerCase().startsWith("ja") ? "ja" : "en";
}

function saveLanguage(value: Language) {
  try {
    localStorage.setItem(LANGUAGE_KEY, value);
  } catch {
    // localStorageが使えない環境（プライベートモード等）では保存をスキップ
  }
}

let language = loadLanguage();

// 現在の言語の文言（言語の切り替えに追従するライブバインディング）
export let t = messages[language];

// フッターのリンクを現在の言語に合わせる。ページの説明文やメタ情報は SEO のため日本語のまま変えない
export function applyPageLanguage() {
  const link = document.querySelector<HTMLElement>(".site-footer a");
  if (link) {
    link.textContent = t.privacyPolicy;
    link.lang = language;
  }
}

export function toggleLanguage() {
  language = language === "ja" ? "en" : "ja";
  t = messages[language];
  saveLanguage(language);
  applyPageLanguage();
}
