import { Issue, IssueDimension, Severity } from "@/types";

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

export function parseIssue(raw: Record<string, unknown>): Issue {
  return {
    id: generateIssueId(
      raw.dimension as IssueDimension,
      raw.section as string,
      raw.description as string
    ),
    dimension: raw.dimension as IssueDimension,
    severity: raw.severity as Severity,
    section: raw.section as string,
    description: raw.description as string,
    suggestion: raw.suggestion as string,
    confidence: typeof raw.confidence === "number" ? raw.confidence : 0.5,
    positiveNote: raw.positiveNote as string | undefined,
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
