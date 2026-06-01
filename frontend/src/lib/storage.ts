import type { IssueAction, ReviewResult } from "../types";

const STORAGE_PREFIX = "prd-reviewer:";
const HISTORY_KEY = STORAGE_PREFIX + "history";
const MAX_HISTORY = 20;
const MAX_CONTENT_SIZE = 10_000; // 历史记录中 content 最大保留 10K 字符

export interface HistoryEntry {
  id: string;
  fileName: string;
  timestamp: number;
  result: ReviewResult;
  content: string; // 可能被截断，用于预览和重新检查
}

export function saveIssueActions(actions: Record<string, IssueAction>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_PREFIX + "issue-actions", JSON.stringify(actions));
}

export function loadIssueActions(): Record<string, IssueAction> {
  if (typeof window === "undefined") return {};
  try {
    const data = localStorage.getItem(STORAGE_PREFIX + "issue-actions");
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveReviewResult(result: ReviewResult): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_PREFIX + "review-result", JSON.stringify(result));
}

export function loadReviewResult(): ReviewResult | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(STORAGE_PREFIX + "review-result");
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveReviewFileName(fileName: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_PREFIX + "review-filename", JSON.stringify(fileName));
}

export function loadReviewFileName(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(STORAGE_PREFIX + "review-filename");
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveToHistory(fileName: string, result: ReviewResult, content: string): void {
  if (typeof window === "undefined") return;
  try {
    const history = loadHistory();
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fileName,
      timestamp: Date.now(),
      result,
      content: content.length > MAX_CONTENT_SIZE ? content.slice(0, MAX_CONTENT_SIZE) : content,
    };
    history.unshift(entry);
    if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // storage full, ignore
  }
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function deleteHistoryEntry(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const history = loadHistory().filter((e) => e.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // ignore
  }
}

export function clearAll(): void {
  if (typeof window === "undefined") return;
  Object.keys(localStorage)
    .filter((key) => key.startsWith(STORAGE_PREFIX))
    .forEach((key) => localStorage.removeItem(key));
}
