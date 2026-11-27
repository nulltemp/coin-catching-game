import { execSync } from "node:child_process";
import { defineConfig, type Plugin } from "vite";

const SITE_URL = "https://coin-catching-game.nulltemp.com/";

// 最後のコミットの日付（YYYY-MM-DD）。git の履歴が使えないときはビルド日にする
function lastModified(): string {
  try {
    const date = execSync("git log -1 --format=%cs", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
  } catch {
    // git のチェックアウトではない
  }
  return new Date().toISOString().slice(0, 10);
}

// ビルド時に dist/sitemap.xml を書き出し、<lastmod> が古いまま残らないようにする
function sitemap(): Plugin {
  return {
    name: "sitemap",
    apply: "build",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}</loc>
    <lastmod>${lastModified()}</lastmod>
  </url>
</urlset>
`,
      });
    },
  };
}

export default defineConfig({
  plugins: [sitemap()],
  build: {
    // ハッシュ付きの JS は dist/bundle/ に出す。dist/assets/ には public/assets/ のハッシュなしの画像
    // （player.png・coin.png）があり、public/_headers で長期キャッシュ（immutable）を付けるのはハッシュ付きのファイルだけにしたいため
    assetsDir: "bundle",
    // 出力 JS（約1.38MB、gzip 約360KB）の大半は Phaser 本体で、分割しても Phaser のチャンクだけで 500KB を超える。
    // ゲームの開始に Phaser 全体が要るので、分割せずに警告の閾値だけを上げる（単位は kB）
    chunkSizeWarningLimit: 1500,
  },
});
