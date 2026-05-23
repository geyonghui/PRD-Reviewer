import { describe, it, expect } from "vitest";
import { extractSections, chunkDocument } from "../markdown-utils";

describe("markdown-utils", () => {
  const sampleMd = `# Title

## Chapter 1
Content of chapter 1.

## Chapter 2
Content of chapter 2.

## Chapter 3
Content of chapter 3.`;

  it("extractSections should extract h2 sections", () => {
    const sections = extractSections(sampleMd);
    expect(sections).toHaveLength(3);
    expect(sections[0].title).toBe("Chapter 1");
  });

  it("extractSections should include section content", () => {
    const sections = extractSections(sampleMd);
    expect(sections[0].content).toContain("Content of chapter 1");
  });

  it("chunkDocument should return single chunk for short docs", () => {
    const chunks = chunkDocument("Short document", 8000);
    expect(chunks).toHaveLength(1);
  });

  it("chunkDocument should split long docs by section", () => {
    const longMd = "## Section 1\n" + "x".repeat(5000) + "\n\n## Section 2\n" + "y".repeat(5000);
    const chunks = chunkDocument(longMd, 8000);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
  });
});
