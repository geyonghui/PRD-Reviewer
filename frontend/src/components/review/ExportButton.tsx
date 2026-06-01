import type { Issue, IssueAction, ReviewSummary } from "../../types";

const severityLabel = (s: string) => (s === "high" ? "高" : s === "medium" ? "中" : "低");
const dimensionLabel = (d: string) => {
  const map: Record<string, string> = {
    logic: "逻辑完整性",
    boundary: "边界与异常",
    terminology: "术语一致性",
    competitor: "竞品与数据",
  };
  return map[d] || d;
};

/** HTML 转义，防止 LLM 输出中的 XSS */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function generateReport(
  issues: Issue[],
  summary: ReviewSummary | null,
  fileName: string,
  issueActions?: Record<string, IssueAction>
): string {
  const now = new Date().toLocaleDateString("zh-CN");

  let report = `PRD Review Report - ${fileName}\n检查时间：${now}\n`;
  if (summary) {
    report += `共发现 ${summary.totalIssues} 个问题（高${summary.highCount}/中${summary.mediumCount}/低${summary.lowCount}）\n\n`;
  }
  if (summary?.positiveFeedback?.length) {
    report += `## 写得好的部分\n`;
    summary.positiveFeedback.forEach((f) => (report += `- ${f}\n`));
    report += "\n";
  }

  const grouped = {
    high: issues.filter((i) => i.severity === "high"),
    medium: issues.filter((i) => i.severity === "medium"),
    low: issues.filter((i) => i.severity === "low"),
  };

  for (const [severity, group] of Object.entries(grouped)) {
    if (group.length === 0) continue;
    report += `## ${severityLabel(severity)}严重度问题\n`;
    group.forEach((issue, idx) => {
      const action = issueActions?.[issue.id];
      const actionLabel =
        action === "adopted" ? " ✅已采纳" : action === "ignored" ? " ⏭已忽略" : "";
      report += `${idx + 1}. [${dimensionLabel(issue.dimension)}] ${issue.section} - ${issue.description}${actionLabel}\n   建议：${issue.suggestion}\n\n`;
    });
  }
  return report;
}

function generateHtmlReport(
  issues: Issue[],
  summary: ReviewSummary | null,
  fileName: string,
  issueActions?: Record<string, IssueAction>
): string {
  const now = new Date().toLocaleString("zh-CN");
  const severityColor = (s: string) => s === "high" ? "#ef4444" : s === "medium" ? "#f97316" : "#3b82f6";
  const severityBg = (s: string) => s === "high" ? "#fef2f2" : s === "medium" ? "#fff7ed" : "#eff6ff";

  const grouped = {
    high: issues.filter((i) => i.severity === "high"),
    medium: issues.filter((i) => i.severity === "medium"),
    low: issues.filter((i) => i.severity === "low"),
  };

  let issuesHtml = "";
  for (const [severity, group] of Object.entries(grouped)) {
    if (group.length === 0) continue;
    issuesHtml += `<h2 style="color:${severityColor(severity)};margin-top:24px">${severityLabel(severity)}严重度问题（${group.length}）</h2>`;
    group.forEach((issue) => {
      const action = issueActions?.[issue.id];
      const actionBadge = action === "adopted"
        ? '<span style="background:#dcfce7;color:#166534;padding:2px 8px;border-radius:4px;font-size:12px">已采纳</span>'
        : action === "ignored"
        ? '<span style="background:#f1f5f9;color:#64748b;padding:2px 8px;border-radius:4px;font-size:12px">已忽略</span>'
        : "";
      issuesHtml += `
        <div style="border:1px solid #e2e8f0;border-left:4px solid ${severityColor(severity)};border-radius:8px;padding:16px;margin:12px 0;background:${severityBg(severity)}">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span style="background:${severityColor(severity)};color:white;padding:2px 8px;border-radius:4px;font-size:12px">${severityLabel(severity)}</span>
            <span style="color:#64748b;font-size:12px">${escapeHtml(dimensionLabel(issue.dimension))}</span>
            <span style="color:#64748b;font-size:12px">${escapeHtml(issue.section)}</span>
            ${actionBadge}
          </div>
          <p style="margin:8px 0;color:#1e293b">${escapeHtml(issue.description)}</p>
          <p style="margin:8px 0;color:#16a34a;font-size:14px">💡 ${escapeHtml(issue.suggestion)}</p>
          ${issue.positiveNote ? `<p style="margin:4px 0;color:#94a3b8;font-size:13px;font-style:italic">✨ ${escapeHtml(issue.positiveNote)}</p>` : ""}
        </div>`;
    });
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PRD Review - ${escapeHtml(fileName)}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 24px; color: #1e293b; line-height: 1.6; }
  h1 { font-size: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
  .summary { display: flex; gap: 16px; flex-wrap: wrap; margin: 16px 0; }
  .stat { padding: 12px 20px; border-radius: 8px; text-align: center; }
  .positive { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0; }
  .positive li { margin: 4px 0; }
</style>
</head>
<body>
<h1>PRD Review Report</h1>
<p style="color:#64748b">文件：${escapeHtml(fileName)} | 检查时间：${now}</p>
${summary ? `
<div class="summary">
  <div class="stat" style="background:#f1f5f9"><div style="font-size:28px;font-weight:bold">${summary.totalIssues}</div><div style="font-size:13px;color:#64748b">总问题数</div></div>
  <div class="stat" style="background:#fef2f2"><div style="font-size:28px;font-weight:bold;color:#ef4444">${summary.highCount}</div><div style="font-size:13px;color:#64748b">高严重度</div></div>
  <div class="stat" style="background:#fff7ed"><div style="font-size:28px;font-weight:bold;color:#f97316">${summary.mediumCount}</div><div style="font-size:13px;color:#64748b">中严重度</div></div>
  <div class="stat" style="background:#eff6ff"><div style="font-size:28px;font-weight:bold;color:#3b82f6">${summary.lowCount}</div><div style="font-size:13px;color:#64748b">低严重度</div></div>
</div>` : ""}
${summary?.positiveFeedback?.length ? `
<div class="positive">
  <h3 style="margin-top:0;color:#16a34a">✅ 写得好的部分</h3>
  <ul>${summary.positiveFeedback.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}</ul>
</div>` : ""}
${issuesHtml}
</body>
</html>`;
}

export default function ExportButton({
  issues,
  summary,
  fileName,
  issueActions,
}: {
  issues: Issue[];
  summary: ReviewSummary | null;
  fileName: string;
  issueActions?: Record<string, IssueAction>;
}) {
  const downloadFile = (content: string, name: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMd = () => {
    const report = generateReport(issues, summary, fileName, issueActions);
    downloadFile(report, `prd-review-${fileName.replace(".md", "")}.md`, "text/markdown;charset=utf-8");
  };

  const handleExportHtml = () => {
    const html = generateHtmlReport(issues, summary, fileName, issueActions);
    downloadFile(html, `prd-review-${fileName.replace(".md", "")}.html`, "text/html;charset=utf-8");
  };

  const handleCopyAll = async () => {
    try {
      const report = generateReport(issues, summary, fileName, issueActions);
      await navigator.clipboard.writeText(report);
      alert("已复制到剪贴板");
    } catch {
      alert("复制失败，请手动复制");
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExportMd}
        className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-blue-600 transition"
      >
        导出 MD
      </button>
      <button
        onClick={handleExportHtml}
        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition"
      >
        导出 HTML
      </button>
      <button
        onClick={handleCopyAll}
        className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 transition"
      >
        复制
      </button>
    </div>
  );
}
