export type Severity = "high" | "medium" | "low";
export type IssueDimension = "logic" | "boundary" | "terminology" | "competitor";
export type IssueAction = "active" | "adopted" | "ignored";
export type ReviewStatus = "idle" | "analyzing" | "done" | "error" | "cancelled";

export interface CheckRule {
  id: string;
  name: string;
  description: string;
  goodExample: string;
  badExample: string;
  severity: Severity;
}

export interface CheckDimension {
  id: IssueDimension;
  name: string;
  rules: CheckRule[];
}

export interface Issue {
  id: string;
  dimension: IssueDimension;
  severity: Severity;
  section: string;
  description: string;
  suggestion: string;
  confidence: number;
  positiveNote?: string;
}

export interface ReviewSummary {
  totalIssues: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  positiveFeedback: string[];
}

export interface ReviewResult {
  issues: Issue[];
  summary: ReviewSummary;
}

export interface Section {
  title: string;
  level: number;
  content: string;
  startIndex: number;
}

export interface DocumentState {
  content: string;
  fileName: string;
  sections: Section[];
}

export interface ReviewState {
  status: ReviewStatus;
  currentStep: string;
  progress: { total: number; completed: number };
  issues: Issue[];
  summary: ReviewSummary | null;
  error?: string;
  startedAt: number;
}

export interface AppState {
  document: DocumentState;
  review: ReviewState;
  issueActions: Record<string, IssueAction>;
}
