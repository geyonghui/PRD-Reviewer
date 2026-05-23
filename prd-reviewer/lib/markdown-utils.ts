import { Section } from "@/types";

export function extractSections(markdown: string): Section[] {
  const lines = markdown.split("\n");
  const sections: Section[] = [];
  let currentSection: Section | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const h2Match = line.match(/^## (.+)$/);
    const h3Match = line.match(/^### (.+)$/);

    if (h2Match || h3Match) {
      if (currentSection) {
        currentSection.content = lines.slice(currentSection.startIndex, i).join("\n").trim();
      }
      currentSection = {
        title: (h2Match?.[1] || h3Match?.[1] || "").trim(),
        level: h2Match ? 2 : 3,
        content: "",
        startIndex: i,
      };
      sections.push(currentSection);
    }
  }

  if (currentSection) {
    currentSection.content = lines.slice(currentSection.startIndex).join("\n").trim();
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
