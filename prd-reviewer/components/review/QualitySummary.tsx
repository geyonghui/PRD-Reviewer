"use client";
import { ReviewSummary } from "@/types";
export default function QualitySummary({ summary }: { summary: ReviewSummary }) {
  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg mb-6">
      <p className="font-medium mb-2">检查完成：共发现 {summary.totalIssues} 个问题</p>
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="text-red-600">🔴 高严重度：{summary.highCount}个</span>
        <span className="text-orange-500">🟠 中严重度：{summary.mediumCount}个</span>
        <span className="text-blue-500">🔵 低严重度：{summary.lowCount}个</span>
      </div>
    </div>
  );
}
