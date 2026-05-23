"use client";
interface Step { name: string; status: "pending" | "active" | "done"; issueCount?: number; }
export default function ProgressSteps({ steps }: { steps: Step[] }) {
  return (
    <div className="space-y-2">
      {steps.map((step) => (
        <div key={step.name} className="flex items-center gap-3 text-sm">
          <span className="w-5 text-center">
            {step.status === "done" && "✓"}
            {step.status === "active" && <span className="inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
            {step.status === "pending" && "○"}
          </span>
          <span className={step.status === "pending" ? "text-slate-400" : ""}>{step.name}</span>
          {step.status === "done" && step.issueCount !== undefined && <span className="text-slate-500">— 发现{step.issueCount}个问题</span>}
          {step.status === "active" && <span className="text-primary">— 分析中...</span>}
        </div>
      ))}
    </div>
  );
}
