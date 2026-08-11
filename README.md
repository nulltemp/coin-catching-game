https://coin-catching-game.nulltemp.com/

# Coin Catching Game

Phaser 4 と TypeScript で作られた、シンプルなコインキャッチゲームです。画面下部のプレイヤーを左右に動かして、上から降ってくるコインをキャッチし、制限時間内にスコアを稼ぎます。

## 遊び方

- ← / → キーでプレイヤー（青いバー）を左右に移動
- 上から降ってくるコインに触れるとスコア+1
- 制限時間（20秒）が0になるとゲームオーバー
- ゲームオーバー画面の「もう一度プレイ」をクリックするとリスタート

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

テストおよびリンターは設定されていません。

## 技術スタック

- [Phaser 4](https://phaser.io/) — ゲームエンジン（Arcade Physics を使用）
- TypeScript
- [Vite](https://vitejs.dev/) — 開発サーバー / ビルドツール

## ディレクトリ構成

```
.
├── index.html          # Vite エントリーポイント（Google Analytics タグを含む）
├── src/
│   └── main.ts          # ゲームロジック一式（preload / create / update）
├── public/
│   ├── assets/           # player.png, coin.png などの静的アセット
│   └── sitemap.xml
└── tsconfig.json
```

## アーキテクチャ概要

ゲームロジックはすべて [src/main.ts](src/main.ts) にまとまっています。

- `player` — 画面下部のスプライト。矢印キーで左右移動、重力なし、`immovable`
- `coins` — Arcade Physics のグループ。1秒ごとにタイマーでランダムなX座標に生成され、重力で落下
- `score` / `scoreText` — コインと `player` が重なる（`collectCoin`）たびに加算
- `remainingTime` / `timerText` — 1秒ごとにカウントダウンし、0になると `endGame` を呼びゲームを停止
- `generateCoin` はタイマーと `collectCoin`（コイン取得時の即時補充）の両方から呼ばれる
- コインは y=600 を超えると `update` 内で破棄される

アセット（`assets/player.png`, `assets/coin.png`）は `preload` 内で `public/assets/` を参照しており、dev / build のどちらでも同じ相対パスで配信されます。
