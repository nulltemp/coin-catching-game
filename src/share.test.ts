import { describe, expect, it } from "vitest";
import { SITE_URL, shareUrl } from "./share";

describe("shareUrl", () => {
  it("X の投稿画面に文面とサイトの URL を渡す", () => {
    const url = new URL(shareUrl("スコア 12"));
    expect(url.origin + url.pathname).toBe("https://x.com/intent/post");
    expect(url.searchParams.get("text")).toBe("スコア 12");
    expect(url.searchParams.get("url")).toBe(SITE_URL);
  });

  it("記号や改行を含む文面もエンコードする", () => {
    const text = "Score: 5 & more!\n#coin";
    const url = new URL(shareUrl(text, "https://example.com/?a=1"));
    expect(url.searchParams.get("text")).toBe(text);
    expect(url.searchParams.get("url")).toBe("https://example.com/?a=1");
    expect(shareUrl(text)).not.toContain("#");
  });
});
