"use client";
import { Issue, ReviewSummary } from "@/types";

function generateReport(issues: Issue[], summary: ReviewSummary | null, fileName: string): string {
  const now = new Date().toLocaleDateString("zh-CN");
  const severityLabel = (s: string) => s === "high" ? "高" : s === "medium" ? "中" : "低";
  const dimensionLabel = (d: string) => {
    const map: Record<string, string> = { logic: "逻辑完整性", boundary: "边界与异常", terminology: "术语一致性", competitor: "竞品与数据" };
    return map[d] || d;
  };
  let report = `PRD Review Report - ${fileName}\n检查时间：${now}\n`;
  if (summary) {
    report += `共发现 ${summary.totalIssues} 个问题（高${summary.highCount}/中${summary.mediumCount}/低${summary.lowCount}）\n\n`;
  }
  if (summary?.positiveFeedback?.length) {
    report += `## 写得好的部分\n`;
    summary.positiveFeedback.forEach((f) => (report += `- ${f}\n`));
    report += "\n";
  }
  const grouped = { high: issues.filter((i) => i.severity === "high"), medium: issues.filter((i) => i.severity === "medium"), low: issues.filter((i) => i.severity === "low") };
  for (const [severity, group] of Object.entries(grouped)) {
    if (group.length === 0) continue;
    report += `## ${severityLabel(severity)}严重度问题\n`;
    group.forEach((issue, idx) => {
      report += `${idx + 1}. [${dimensionLabel(issue.dimension)}] ${issue.section} - ${issue.description}\n   建议：${issue.suggestion}\n\n`;
    });
  }
  return report;
}

export default function ExportButton({ issues, summary, fileName }: { issues: Issue[]; summary: ReviewSummary | null; fileName: string }) {
  const handleExport = () => {
    const report = generateReport(issues, summary, fileName);
    const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prd-review-${fileName.replace(".md", "")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleCopyAll = () => {
    const report = generateReport(issues, summary, fileName);
    navigator.clipboard.writeText(report);
    alert("已复制到剪贴板");
  };
  return (
    <div className="flex gap-2">
      <button onClick={handleExport} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-blue-600 transition">导出报告</button>
      <button onClick={handleCopyAll} className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 transition">复制全部</button>
    </div>
  );
}
