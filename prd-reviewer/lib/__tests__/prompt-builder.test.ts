import { describe, it, expect } from "vitest";
import { buildSystemPrompt, buildUserMessage } from "../prompt-builder";

describe("prompt-builder", () => {
  it("buildSystemPrompt should return a non-empty string", () => {
    const prompt = buildSystemPrompt();
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("buildSystemPrompt should include all 4 dimension names", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("逻辑完整性");
    expect(prompt).toContain("边界与异常");
    expect(prompt).toContain("术语一致性");
    expect(prompt).toContain("竞品与数据");
  });

  it("buildSystemPrompt should include role definition", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("资深产品经理");
  });

  it("buildSystemPrompt should include JSON output format instructions", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("JSON");
    expect(prompt).toContain("issues");
    expect(prompt).toContain("summary");
  });

  it("buildUserMessage should include the document content", () => {
    const msg = buildUserMessage("This is a PRD about login.", "用户登录");
    expect(msg).toContain("This is a PRD about login.");
    expect(msg).toContain("用户登录");
  });
});
