import { defineConfig } from "vite";

export default defineConfig({
  build: {
    // 出力 JS（約1.38MB、gzip 約360KB）の大半は Phaser 本体で、分割しても Phaser のチャンクだけで 500KB を超える。
    // ゲームの開始に Phaser 全体が要るので、分割せずに警告の閾値だけを上げる（単位は kB）
    chunkSizeWarningLimit: 1500,
  },
});
