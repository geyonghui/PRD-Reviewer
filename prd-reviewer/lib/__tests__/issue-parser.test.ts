import { describe, it, expect } from "vitest";
import { parseIssue, generateIssueId, deduplicateIssues } from "../issue-parser";

describe("issue-parser", () => {
  it("generateIssueId should produce consistent IDs", () => {
    const id1 = generateIssueId("logic", "登录流程", "未说明验证码失败处理");
    const id2 = generateIssueId("logic", "登录流程", "未说明验证码失败处理");
    expect(id1).toBe(id2);
  });

  it("generateIssueId should produce different IDs for different inputs", () => {
    const id1 = generateIssueId("logic", "登录流程", "问题A");
    const id2 = generateIssueId("logic", "登录流程", "问题B");
    expect(id1).not.toBe(id2);
  });

  it("parseIssue should add ID to raw issue", () => {
    const raw = {
      dimension: "logic",
      severity: "high",
      section: "登录",
      description: "缺少异常处理",
      suggestion: "补充异常处理",
      confidence: 0.9,
    };
    const parsed = parseIssue(raw);
    expect(parsed.id).toBeTruthy();
    expect(parsed.dimension).toBe("logic");
    expect(parsed.severity).toBe("high");
  });

  it("deduplicateIssues should remove duplicate issues by ID", () => {
    const issues = [
      { id: "a", dimension: "logic" as const, severity: "high" as const, section: "登录", description: "问题1", suggestion: "建议1", confidence: 0.9 },
      { id: "a", dimension: "logic" as const, severity: "high" as const, section: "登录", description: "问题1", suggestion: "建议1", confidence: 0.9 },
      { id: "b", dimension: "boundary" as const, severity: "medium" as const, section: "注册", description: "问题2", suggestion: "建议2", confidence: 0.8 },
    ];
    const deduped = deduplicateIssues(issues);
    expect(deduped).toHaveLength(2);
  });
});
