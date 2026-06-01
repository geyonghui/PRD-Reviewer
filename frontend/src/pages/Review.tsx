import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { Issue, ReviewResult, IssueAction } from "../types";
import MarkdownViewer from "../components/review/MarkdownViewer";
import ProgressSteps from "../components/review/ProgressSteps";
import QualitySummary from "../components/review/QualitySummary";
import PositiveFeedback from "../components/review/PositiveFeedback";
import SkeletonLoader from "../components/review/SkeletonLoader";
import ExportButton from "../components/review/ExportButton";
import { loadIssueActions, saveIssueActions, saveReviewResult, loadReviewResult, saveReviewFileName, loadReviewFileName, clearAll, saveToHistory } from "../lib/storage";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Review() {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [summary, setSummary] = useState<ReviewResult["summary"] | null>(null);
  const [status, setStatus] = useState<"idle" | "analyzing" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [issueActions, setIssueActions] = useState<Record<string, IssueAction>>({});
  const [progressSteps, setProgressSteps] = useState<{ name: string; status: "pending" | "active" | "done"; issueCount?: number }[]>([]);
  const [highlightedSection, setHighlightedSection] = useState<string | undefined>();
  const isReviewingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const savedContent = sessionStorage.getItem("prd-content");
    const savedFileName = sessionStorage.getItem("prd-filename");
    if (!savedContent) {
      navigate("/upload");
      return;
    }
    setContent(savedContent);
    setFileName(savedFileName || "PRD文档");
    setIssueActions(loadIssueActions());
    const savedResult = loadReviewResult();
    const savedResultFileName = loadReviewFileName();
    if (savedResult && savedResultFileName === savedFileName) {
      setIssues(savedResult.issues);
      setSummary(savedResult.summary);
      setStatus("done");
    } else {
      clearAll();
      startReview(savedContent);
    }
  }, []);

  useEffect(() => { saveIssueActions(issueActions); }, [issueActions]);

  const startReview = async (docContent: string) => {
    if (isReviewingRef.current) return;
    isReviewingRef.current = true;
    setStatus("analyzing");
    setError("");
    setIssues([]);
    setSummary(null);
    setProgressSteps([]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API_URL}/api/review-stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: docContent }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text();
        let msg = `HTTP ${res.status}`;
        try { msg = JSON.parse(text).error || msg; } catch { msg = text || msg; }
        throw new Error(msg);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const allIssues: Issue[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let eventType = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7);
          } else if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));

            if (eventType === "start") {
              const steps = Array.from({ length: data.totalChunks }, (_, i) => ({
                name: data.totalChunks === 1 ? "文档审查" : `第 ${i + 1}/${data.totalChunks} 部分`,
                status: (i === 0 ? "active" : "pending") as "pending" | "active" | "done",
              }));
              setProgressSteps(steps);
            } else if (eventType === "chunk_start") {
              setProgressSteps((prev) =>
                prev.map((s, i) => i === data.index ? { ...s, status: "active" } : s)
              );
            } else if (eventType === "chunk_done") {
              allIssues.push(...data.issues);
              setIssues([...allIssues]);
              setProgressSteps((prev) =>
                prev.map((s, i) => i === data.index ? { ...s, status: "done", issueCount: data.chunkIssueCount } : s)
              );
            } else if (eventType === "done") {
              setIssues(data.issues);
              setSummary(data.summary);
              setStatus("done");
              saveReviewResult({ issues: data.issues, summary: data.summary });
              saveReviewFileName(fileName);
              saveToHistory(fileName, { issues: data.issues, summary: data.summary }, docContent);
            } else if (eventType === "error") {
              throw new Error(data.error);
            }
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") return;
      setError(err instanceof Error ? err.message : "检查失败");
      setStatus("error");
    } finally {
      isReviewingRef.current = false;
      abortRef.current = null;
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/upload")}
            className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            ← 返回
          </button>
          <div>
            <h1 className="text-xl font-bold">{fileName}</h1>
            <span className="text-sm text-slate-500">
              {status === "analyzing" && `正在检查... 已发现 ${issues.length} 个问题`}
              {status === "done" && `检查完成，共发现 ${issues.length} 个问题`}
              {status === "error" && "检查出错"}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {status === "done" && (
            <ExportButton issues={issues} summary={summary} fileName={fileName} issueActions={issueActions} />
          )}
          <button
            onClick={() => navigate("/history")}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            历史
          </button>
          <button
            onClick={() => {
              if (status === "analyzing" && abortRef.current) {
                abortRef.current.abort();
                setStatus("idle");
                isReviewingRef.current = false;
              } else {
                startReview(content);
              }
            }}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 transition"
          >
            {status === "analyzing" ? "停止" : "重新检查"}
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
          {content && (
            <MarkdownViewer content={content} highlightedSection={highlightedSection} />
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

          {status === "done" && issues.length === 0 && (
            <div className="p-6 text-center text-green-700 dark:text-green-400">
              <p className="text-lg font-medium mb-2">文档质量很好！</p>
              <p className="text-sm">AI未发现明显问题</p>
            </div>
          )}

          {issues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => {
                setHighlightedSection(issue.section);
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
