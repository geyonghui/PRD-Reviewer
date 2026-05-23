import { describe, it, expect } from "vitest";
import { checkDimensions, getRulesByDimension, getRulesBySeverity } from "../check-rules";

describe("check-rules", () => {
  it("should have 4 dimensions", () => {
    expect(checkDimensions).toHaveLength(4);
  });

  it("each dimension should have an id, name, and rules array", () => {
    for (const dim of checkDimensions) {
      expect(dim.id).toBeTruthy();
      expect(dim.name).toBeTruthy();
      expect(Array.isArray(dim.rules)).toBe(true);
      expect(dim.rules.length).toBeGreaterThan(0);
    }
  });

  it("each rule should have required fields", () => {
    for (const dim of checkDimensions) {
      for (const rule of dim.rules) {
        expect(rule.id).toBeTruthy();
        expect(rule.name).toBeTruthy();
        expect(rule.description).toBeTruthy();
        expect(rule.goodExample).toBeTruthy();
        expect(rule.badExample).toBeTruthy();
        expect(["high", "medium", "low"]).toContain(rule.severity);
      }
    }
  });

  it("getRulesByDimension should return rules for a specific dimension", () => {
    const logicRules = getRulesByDimension("logic");
    expect(logicRules.length).toBeGreaterThan(0);
    expect(logicRules.every((r) => r.id.startsWith("logic-"))).toBe(true);
  });

  it("getRulesBySeverity should filter rules by severity", () => {
    const highRules = getRulesBySeverity("high");
    expect(highRules.every((r) => r.severity === "high")).toBe(true);
  });

  it("should have exactly 16 rules total across all dimensions", () => {
    const total = checkDimensions.reduce((sum, dim) => sum + dim.rules.length, 0);
    expect(total).toBe(16);
  });
});
