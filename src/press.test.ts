import { describe, expect, it } from "vitest";
import { createPressTracker } from "./press";

describe("createPressTracker", () => {
  it("上で押し始めて上で離したときだけ押下とみなす", () => {
    const press = createPressTracker();
    press.down();
    expect(press.up()).toBe(true);
  });

  it("ほかの場所から押し続けた指をボタンの上で離しても押下とみなさない", () => {
    const press = createPressTracker();
    expect(press.up()).toBe(false);
  });

  it("押し始めた後にボタンの外へ出たら押下を取り消す", () => {
    const press = createPressTracker();
    press.down();
    press.cancel();
    expect(press.up()).toBe(false);
  });

  it("離すと押下状態は戻り、次の up は押下とみなさない", () => {
    const press = createPressTracker();
    press.down();
    expect(press.up()).toBe(true);
    expect(press.up()).toBe(false);
  });
});
