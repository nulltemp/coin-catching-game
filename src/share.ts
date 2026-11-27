// SNS シェア（Phaser に依存しない純粋関数。src/share.test.ts でテストする）

// シェアするページの URL（index.html の canonical と同じ）
export const SITE_URL = "https://coin-catching-game.nulltemp.com/";

// X（旧 Twitter）の投稿画面を開く Web Intent の URL。ログインや SDK は不要で、文面と URL を事前に入力した状態で開く
export function shareUrl(text: string, url: string = SITE_URL): string {
  const params = new URLSearchParams({ text, url });
  return `https://x.com/intent/post?${params.toString()}`;
}
