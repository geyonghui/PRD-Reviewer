import { Issue, IssueDimension, Severity } from "./types";

const VALID_DIMENSIONS: IssueDimension[] = ["logic", "boundary", "terminology", "competitor"];
const VALID_SEVERITIES: Severity[] = ["high", "medium", "low"];

function djb2(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash).toString(36).padStart(6, "0").slice(0, 6);
}

export function generateIssueId(
  dimension: IssueDimension,
  section: string,
  description: string
): string {
  const prefix = description.slice(0, 20);
  return `${dimension}-${section}-${djb2(prefix)}`;
}

export function parseIssue(raw: Record<string, unknown>): Issue | null {
  // 校验必填字段
  if (typeof raw.dimension !== "string" || !VALID_DIMENSIONS.includes(raw.dimension as IssueDimension)) {
    return null;
  }
  if (typeof raw.severity !== "string" || !VALID_SEVERITIES.includes(raw.severity as Severity)) {
    return null;
  }
  if (typeof raw.section !== "string" || typeof raw.description !== "string" || typeof raw.suggestion !== "string") {
    return null;
  }

  return {
    id: generateIssueId(
      raw.dimension as IssueDimension,
      raw.section,
      raw.description
    ),
    dimension: raw.dimension as IssueDimension,
    severity: raw.severity as Severity,
    section: raw.section,
    description: raw.description,
    suggestion: raw.suggestion,
    confidence: typeof raw.confidence === "number" ? raw.confidence : 0.5,
    positiveNote: typeof raw.positiveNote === "string" ? raw.positiveNote : undefined,
  };
}

export function deduplicateIssues(issues: Issue[]): Issue[] {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    if (seen.has(issue.id)) return false;
    seen.add(issue.id);
    return true;
  });
}
