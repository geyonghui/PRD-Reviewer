"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Issue, ReviewResult, IssueAction } from "@/types";
import MarkdownViewer from "@/components/review/MarkdownViewer";
import ProgressSteps from "@/components/review/ProgressSteps";
import QualitySummary from "@/components/review/QualitySummary";
import PositiveFeedback from "@/components/review/PositiveFeedback";
import SkeletonLoader from "@/components/review/SkeletonLoader";
import ExportButton from "@/components/review/ExportButton";
import { loadIssueActions, saveIssueActions, saveReviewResult, loadReviewResult } from "@/lib/storage";

export default function ReviewPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [summary, setSummary] = useState<ReviewResult["summary"] | null>(null);
  const [status, setStatus] = useState<"idle" | "analyzing" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [issueActions, setIssueActions] = useState<Record<string, IssueAction>>({});
  const [progressSteps, setProgressSteps] = useState<{ name: string; status: "pending" | "active" | "done"; issueCount?: number }[]>([
    { name: "逻辑完整性", status: "pending" },
    { name: "边界与异常", status: "pending" },
    { name: "术语一致性", status: "pending" },
    { name: "竞品与数据", status: "pending" },
  ]);

  useEffect(() => {
    const savedContent = sessionStorage.getItem("prd-content");
    const savedFileName = sessionStorage.getItem("prd-filename");
    if (!savedContent) {
      router.push("/upload");
      return;
    }
    setContent(savedContent);
    setFileName(savedFileName || "PRD文档");
    setIssueActions(loadIssueActions());
    const savedResult = loadReviewResult();
    if (savedResult) {
      setIssues(savedResult.issues);
      setSummary(savedResult.summary);
      setStatus("done");
    } else {
      startReview(savedContent);
    }
  }, []);

  useEffect(() => { saveIssueActions(issueActions); }, [issueActions]);

  const startReview = async (docContent: string) => {
    setStatus("analyzing");
    setError("");
    setIssues([]);
    setSummary(null);
    setProgressSteps([
      { name: "逻辑完整性", status: "active" },
      { name: "边界与异常", status: "pending" },
      { name: "术语一致性", status: "pending" },
      { name: "竞品与数据", status: "pending" },
    ]);

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: docContent }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "检查失败");
      }
      const data = await res.json();
      setIssues(data.issues);
      setSummary(data.summary);
      setStatus("done");
      saveReviewResult({ issues: data.issues, summary: data.summary });
      setProgressSteps((prev) => prev.map((s) => ({ ...s, status: "done" as "done" })));
    } catch (err: any) {
      setError(err.message);
      setStatus("error");
    }
  };

  const handleAction = useCallback((issueId: string, action: IssueAction) => {
    setIssueActions((prev) => ({
      ...prev,
      [issueId]: action === prev[issueId] ? "active" : action,
    }));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        startReview(content);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [content]);

  return (
    <main className="min-h-screen flex flex-col">
      <header className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">{fileName}</h1>
          <span className="text-sm text-slate-500">
            {status === "analyzing" && "正在检查..."}
            {status === "done" && `检查完成，共发现 ${issues.length} 个问题`}
            {status === "error" && "检查出错"}
          </span>
        </div>
        <div className="flex gap-2">
          {status === "done" && (
            <ExportButton issues={issues} summary={summary} fileName={fileName} />
          )}
          <button
            onClick={() => startReview(content)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 transition"
          >
            重新检查
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        <div className="w-full md:w-[60%] p-6 overflow-y-auto md:border-r border-slate-200 dark:border-slate-700">
          {status === "analyzing" && (
            <div className="space-y-6">
              <ProgressSteps steps={progressSteps} />
              <SkeletonLoader />
            </div>
          )}
          {status !== "analyzing" && content && (
            <MarkdownViewer content={content} />
          )}
        </div>

        <div className="w-full md:w-[40%] p-6 overflow-y-auto">
          {status === "error" && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-400">{error}</p>
              <button
                onClick={() => startReview(content)}
                className="mt-2 px-4 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                重试
              </button>
            </div>
          )}

          {status === "done" && summary && (
            <>
              <QualitySummary summary={summary} />
              <PositiveFeedback feedback={summary.positiveFeedback} />
            </>
          )}

          {issues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => {
                const el = document.getElementById(`heading-${issue.section}`);
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`p-4 mb-3 border rounded-lg cursor-pointer hover:border-primary/50 transition ${
                issueActions[issue.id] === "adopted"
                  ? "border-green-200 bg-green-50 dark:bg-green-900/10"
                  : issueActions[issue.id] === "ignored"
                  ? "border-slate-200 bg-slate-50 dark:bg-slate-800/50 opacity-60"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  issue.severity === "high" ? "bg-red-100 text-red-700" :
                  issue.severity === "medium" ? "bg-orange-100 text-orange-700" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {issue.severity === "high" ? "高" : issue.severity === "medium" ? "中" : "低"}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  issue.confidence >= 0.8 ? "bg-green-100 text-green-700" :
                  issue.confidence >= 0.5 ? "bg-orange-100 text-orange-700" :
                  "bg-slate-100 text-slate-600"
                }`}>
                  {issue.confidence >= 0.8 ? "高置信度" : issue.confidence >= 0.5 ? "中置信度" : "建议确认"}
                </span>
                <span className="text-xs text-slate-500">{issue.section}</span>
              </div>
              <p className="text-sm mb-2">{issue.description}</p>
              <p className="text-sm text-green-700 dark:text-green-400">{issue.suggestion}</p>
              {issue.positiveNote && (
                <p className="text-sm text-slate-500 mt-1 italic">💡 {issue.positiveNote}</p>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleAction(issue.id, "adopted"); }}
                  className={`px-3 py-1 rounded text-xs transition ${
                    issueActions[issue.id] === "adopted"
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-600 hover:bg-green-50"
                  }`}
                >
                  {issueActions[issue.id] === "adopted" ? "已采纳" : "采纳"}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleAction(issue.id, "ignored"); }}
                  className={`px-3 py-1 rounded text-xs transition ${
                    issueActions[issue.id] === "ignored"
                      ? "bg-slate-200 text-slate-500"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {issueActions[issue.id] === "ignored" ? "已忽略" : "忽略"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
