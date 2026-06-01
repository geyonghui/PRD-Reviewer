import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadHistory, deleteHistoryEntry, type HistoryEntry } from "../lib/storage";

export default function History() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(loadHistory());
  }, []);

  const handleDelete = (id: string) => {
    deleteHistoryEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleView = (entry: HistoryEntry) => {
    sessionStorage.setItem("prd-content", entry.content);
    sessionStorage.setItem("prd-filename", entry.fileName);
    navigate("/review");
  };

  return (
    <main className="min-h-screen p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/upload")}
          className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          ← 返回
        </button>
        <h1 className="text-2xl font-bold">审查历史</h1>
      </div>

      {entries.length === 0 ? (
        <div className="text-center text-slate-500 py-20">
          <p className="text-lg mb-2">暂无审查记录</p>
          <p className="text-sm">完成一次审查后，记录会自动保存到这里</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary/50 transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 cursor-pointer" onClick={() => handleView(entry)}>
                  <h3 className="font-medium mb-1">{entry.fileName}</h3>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span>{new Date(entry.timestamp).toLocaleString("zh-CN")}</span>
                    <span>共 {entry.result.summary.totalIssues} 个问题</span>
                    <span className="text-red-600">高 {entry.result.summary.highCount}</span>
                    <span className="text-orange-600">中 {entry.result.summary.mediumCount}</span>
                    <span className="text-blue-600">低 {entry.result.summary.lowCount}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                  className="px-2 py-1 text-xs text-slate-400 hover:text-red-500 transition"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
