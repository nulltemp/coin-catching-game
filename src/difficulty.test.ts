import { describe, expect, it } from "vitest";
import { BASE_SPAWN_DELAY, FALL_SPEED_STEP, LEVEL_DURATION, MIN_SPAWN_DELAY, SPAWN_DELAY_STEP, TIME_LIMIT } from "./constants";
import { coinInitialVelocity, levelAt, spawnDelay } from "./difficulty";

describe("levelAt", () => {
  it("starts at level 1", () => {
    expect(levelAt(0)).toBe(1);
  });

  it("rises exactly at each LEVEL_DURATION boundary", () => {
    expect(levelAt(LEVEL_DURATION - 1)).toBe(1);
    expect(levelAt(LEVEL_DURATION)).toBe(2);
    expect(levelAt(2 * LEVEL_DURATION - 1)).toBe(2);
    expect(levelAt(2 * LEVEL_DURATION)).toBe(3);
  });

  it("reaches level 4 in the last second of a game", () => {
    // remainingTime が 0 になると updateLevel を呼ばずに終了するので、最後に計算されるのは TIME_LIMIT - 1 秒
    expect(levelAt(TIME_LIMIT - 1)).toBe(4);
  });
});

describe("spawnDelay", () => {
  it("is BASE_SPAWN_DELAY at level 1", () => {
    expect(spawnDelay(1)).toBe(BASE_SPAWN_DELAY);
  });

  it("shortens by SPAWN_DELAY_STEP per level", () => {
    expect(spawnDelay(2)).toBe(BASE_SPAWN_DELAY - SPAWN_DELAY_STEP);
    expect(spawnDelay(3)).toBe(BASE_SPAWN_DELAY - 2 * SPAWN_DELAY_STEP);
  });

  it("never goes below MIN_SPAWN_DELAY", () => {
    expect(spawnDelay(4)).toBe(MIN_SPAWN_DELAY);
    expect(spawnDelay(5)).toBe(MIN_SPAWN_DELAY);
    expect(spawnDelay(100)).toBe(MIN_SPAWN_DELAY);
  });

  it("matches the current tuning", () => {
    expect([1, 2, 3, 4, 5].map(spawnDelay)).toEqual([1000, 800, 600, 400, 400]);
  });
});

describe("coinInitialVelocity", () => {
  it("is 0 at level 1 (gravity only)", () => {
    expect(coinInitialVelocity(1)).toBe(0);
  });

  it("grows by FALL_SPEED_STEP per level without a cap", () => {
    expect(coinInitialVelocity(2)).toBe(FALL_SPEED_STEP);
    expect(coinInitialVelocity(4)).toBe(3 * FALL_SPEED_STEP);
    expect([1, 2, 3, 4].map(coinInitialVelocity)).toEqual([0, 120, 240, 360]);
  });
});
