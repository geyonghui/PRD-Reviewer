import { IssueAction, ReviewResult, DocumentState } from "@/types";

const STORAGE_PREFIX = "prd-reviewer:";

export function saveIssueActions(actions: Record<string, IssueAction>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_PREFIX + "issue-actions", JSON.stringify(actions));
}

export function loadIssueActions(): Record<string, IssueAction> {
  if (typeof window === "undefined") return {};
  const data = localStorage.getItem(STORAGE_PREFIX + "issue-actions");
  return data ? JSON.parse(data) : {};
}

export function saveReviewResult(result: ReviewResult): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_PREFIX + "review-result", JSON.stringify(result));
}

export function loadReviewResult(): ReviewResult | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(STORAGE_PREFIX + "review-result");
  return data ? JSON.parse(data) : null;
}

export function saveDocument(doc: DocumentState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_PREFIX + "document", JSON.stringify(doc));
}

export function loadDocument(): DocumentState | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(STORAGE_PREFIX + "document");
  return data ? JSON.parse(data) : null;
}

export function clearAll(): void {
  if (typeof window === "undefined") return;
  Object.keys(localStorage)
    .filter((key) => key.startsWith(STORAGE_PREFIX))
    .forEach((key) => localStorage.removeItem(key));
}
