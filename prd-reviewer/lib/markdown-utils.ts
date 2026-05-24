import { Section } from "@/types";

export function extractSections(markdown: string): Section[] {
  const lines = markdown.split("\n");
  const sections: Section[] = [];
  let currentSection: Section | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const h1Match = line.match(/^# (.+)$/);
    const h2Match = line.match(/^## (.+)$/);
    const h3Match = line.match(/^### (.+)$/);

    if (h1Match || h2Match || h3Match) {
      if (currentSection) {
        currentSection.content = lines.slice(currentSection.startIndex, i).join("\n").trim();
      }
      currentSection = {
        title: (h1Match?.[1] || h2Match?.[1] || h3Match?.[1] || "").trim(),
        level: h1Match ? 1 : h2Match ? 2 : 3,
        content: "",
        startIndex: i,
      };
      sections.push(currentSection);
    }
  }

  if (currentSection) {
    currentSection.content = lines.slice(currentSection.startIndex).join("\n").trim();
  }

  // Capture content before the first heading
  if (sections.length > 0 && sections[0].startIndex > 0) {
    const preamble = lines.slice(0, sections[0].startIndex).join("\n").trim();
    if (preamble.length > 50) {
      sections.unshift({
        title: "文档概述",
        level: 2,
        content: preamble,
        startIndex: 0,
      });
    }
  } else if (sections.length === 0 && markdown.trim().length > 0) {
    sections.push({
      title: "全文",
      level: 2,
      content: markdown.trim(),
      startIndex: 0,
    });
  }

  return sections;
}

export interface DocumentChunk {
  content: string;
  sectionHint: string;
}

export function chunkDocument(markdown: string, maxChars: number = 8000): DocumentChunk[] {
  if (markdown.length <= maxChars) {
    return [{ content: markdown, sectionHint: "" }];
  }

  const sections = extractSections(markdown);
  if (sections.length === 0) {
    const chunks: DocumentChunk[] = [];
    for (let i = 0; i < markdown.length; i += maxChars) {
      chunks.push({
        content: markdown.slice(i, i + maxChars),
        sectionHint: `第${chunks.length + 1}部分`,
      });
    }
    return chunks;
  }

  const chunks: DocumentChunk[] = [];
  let currentChunk = "";

  for (const section of sections) {
    if (currentChunk.length + section.content.length > maxChars && currentChunk.length > 0) {
      chunks.push({ content: currentChunk, sectionHint: chunks.length === 0 ? "" : `第${chunks.length + 1}部分` });
      currentChunk = "";
    }
    currentChunk += section.content + "\n\n";
  }

  if (currentChunk.trim()) {
    chunks.push({ content: currentChunk.trim(), sectionHint: `第${chunks.length + 1}部分` });
  }

  return chunks;
}
