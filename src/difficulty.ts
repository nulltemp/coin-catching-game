import { BASE_SPAWN_DELAY, FALL_SPEED_STEP, LEVEL_DURATION, MIN_SPAWN_DELAY, SPAWN_DELAY_STEP } from "./constants";

// 難易度の計算（Phaser に依存しない純粋関数。src/difficulty.test.ts でテストする）

// 経過秒数からレベルを求める（1 から始まり、LEVEL_DURATION 秒ごとに 1 上がる）
export function levelAt(elapsedSeconds: number): number {
  return 1 + Math.floor(elapsedSeconds / LEVEL_DURATION);
}

// レベルごとのコインの出現間隔（ミリ秒）。MIN_SPAWN_DELAY より短くはならない
export function spawnDelay(level: number): number {
  return Math.max(MIN_SPAWN_DELAY, BASE_SPAWN_DELAY - (level - 1) * SPAWN_DELAY_STEP);
}

// レベルごとのコインの初速（下向き、px/秒）。これに重力（GRAVITY_Y）が加わる
export function coinInitialVelocity(level: number): number {
  return (level - 1) * FALL_SPEED_STEP;
}
