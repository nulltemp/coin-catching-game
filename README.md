https://coin-catching-game.nulltemp.com/

# Coin Catching Game

Phaser 4 と TypeScript で作られた、シンプルなコインキャッチゲームです。画面下部のプレイヤーを左右に動かして、上から降ってくるコインをキャッチし、制限時間内にスコアを稼ぎます。

## 遊び方

- 表示言語は日本語と英語に対応。初回はブラウザの言語設定で決まり、スタート画面・結果画面のボタンまたは L キーで切り替えられる（選択は保存される）
- スタート画面の「スタート」をクリック、または Space / Enter キーでゲーム開始
- ← / → キーでプレイヤー（グレーのロボット）を左右に移動
- スマホ・タブレットでは画面をタッチ（PCではマウスを押したまま）すると、その位置へプレイヤーが移動
- 5秒ごとにレベルが上がり、コインの出現間隔が短く・落下速度が速くなる
- 上から降ってくるコインに触れるとスコア+1
- 制限時間（20秒）が0になるとゲームオーバー
- ゲームオーバー画面の「もう一度プレイ」をクリック、または Space / Enter キーでリスタート
- ゲームオーバー画面右下の「X でシェア」ボタン、または S キーで、スコアを X に投稿する画面を新しいタブで開く

## セットアップ

依存パッケージをインストールします。

```bash
npm install
```

## 開発サーバーの起動

HMR 付きの開発サーバーを起動します。

```bash
npm run dev
```

## その他のスクリプト

| コマンド            | 説明                                  |
| ------------------- | ------------------------------------- |
| `npm run build`     | `dist/` に本番用ビルドを出力          |
| `npm run preview`   | ビルド済みの `dist/` をローカルで配信 |
| `npm run typecheck` | `tsc --noEmit` で型チェックのみ実行   |
| `npm test`          | Vitest で単体テストを1回実行          |

単体テストは Vitest で、Phaser に依存しない純粋なロジック（`src/*.test.ts`）を対象にしています（詳しくは CLAUDE.md）。リンターは設定されていません。

PR と `master` への push では、GitHub Actions（`.github/workflows/ci.yml`）が型チェック（`npm run typecheck`）・テスト（`npm test`）・ビルド（`npm run build`）を実行します。依存パッケージと GitHub Actions の更新は Dependabot（`.github/dependabot.yml`）が月1回確認します。

## 技術スタック

- [Phaser 4](https://phaser.io/) — ゲームエンジン（Arcade Physics を使用）
- TypeScript
- [Vite](https://vitejs.dev/) — 開発サーバー / ビルドツール

## ディレクトリ構成

```
.
├── index.html               # Vite エントリーポイント（Google Analytics タグ、メタ情報を含む）
├── src/
│   ├── main.ts               # Phaser の設定とシーンの登録
│   ├── scenes/
│   │   ├── PlayScene.ts      # プレイ画面（プレイヤー・コイン・HUD・ゲームの進行）
│   │   ├── TitleScene.ts     # スタート画面（プレイ画面の上に重ねて表示）
│   │   └── ResultScene.ts    # 結果画面（プレイ画面の上に重ねて表示）
│   ├── constants.ts          # 画面配置・難易度などの定数
│   ├── ui.ts                 # ボタンなどの共通 UI
│   ├── highScore.ts          # ハイスコアの保存・読み込み
│   ├── difficulty.ts         # 難易度の計算（レベル・出現間隔・初速）
│   ├── share.ts              # X の投稿画面の URL の生成
│   ├── press.ts              # ボタンの上で押し始めて離したかの判定（シェアボタン用）
│   ├── *.test.ts             # 上の純粋なロジックの単体テスト（Vitest）
│   └── i18n.ts               # 日本語・英語の文言と言語の判定・切り替え
├── public/
│   ├── assets/                # player.png, coin.png などの静的アセット
│   ├── apple-touch-icon.png   # ホーム画面に追加したときのアイコン（180px）
│   ├── og-image-v2.png        # SNS シェア用の OGP 画像
│   ├── 404.html               # 存在しないパスに返すページ（Cloudflare Pages が 404 で返す）
│   ├── _headers               # Cloudflare Pages のレスポンスヘッダー（nosniff・キャッシュなど）
│   └── robots.txt
├── .github/
│   ├── workflows/ci.yml       # CI（型チェック・テスト・ビルド）
│   └── dependabot.yml         # Dependabot の設定
├── ROADMAP.md               # 収益化の検討と対応済みの TODO（未対応の課題は GitHub Issues）
├── CLAUDE.md                # Claude Code 向けの開発メモ
├── vite.config.ts           # Vite の設定（チャンクサイズ警告の閾値、ビルド時の sitemap.xml の生成）
└── tsconfig.json
```

## アーキテクチャ概要

ゲームロジックは [src/scenes/](src/scenes/) のシーンに分かれています。プレイ画面（`PlayScene`）が状態とゲームの進行を持ち、スタート画面（`TitleScene`）と結果画面（`ResultScene`）はその上に重ねて表示します。画面に表示する文言は [src/i18n.ts](src/i18n.ts) で管理します。ページのタイトルや説明文などのメタ情報は、SEO のため日本語のまま固定しています。

- `player` — 画面下部のスプライト。矢印キーで左右移動し、キーを押していないときはタッチ／マウスを押した位置へ追従する。重力なし、`immovable`
- `coins` — Arcade Physics のグループ。`scheduleSpawn` でランダムなX座標に生成され、重力で落下
- `level` / `levelText` — 経過時間から `updateLevel` で算出。レベルに応じてコインの出現間隔（1000ms→最短400ms）と初速が変化
- `score` / `scoreText` — コインと `player` が重なる（`collectCoin`）たびに加算
- `remainingTime` / `timerText` — 1秒ごとにカウントダウンし、0になると `endGame` を呼びゲームを停止
- `generateCoin` は`scheduleSpawn` と `collectCoin`（コイン取得時の即時補充）の両方から呼ばれる
- コインは画面の下端（`GAME_HEIGHT`、y=600）を超えると `update` 内で破棄される

アセット（`assets/player.png`, `assets/coin.png`）は `preload` 内で `public/assets/` を参照しており、dev / build のどちらでも同じ相対パスで配信されます。
