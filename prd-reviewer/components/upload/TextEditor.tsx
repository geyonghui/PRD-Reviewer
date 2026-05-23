"use client";

import { useState, useCallback } from "react";

interface TextEditorProps {
  onSubmit: (content: string, fileName: string) => void;
}

export default function TextEditor({ onSubmit }: TextEditorProps) {
  const [text, setText] = useState("");

  const handleSubmit = useCallback(() => {
    if (text.trim().length < 100) {
      alert("文档内容过少（至少100字），建议补充后再检查");
      return;
    }
    onSubmit(text, "pasted-document.md");
  }, [text, onSubmit]);

  return (
    <div className="flex flex-col gap-4">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        粘贴PRD内容（Markdown格式）
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"# PRD文档标题\n\n## 需求背景\n...\n\n## 功能描述\n..."}
        className="w-full h-96 p-4 border border-slate-300 dark:border-slate-600 rounded-lg resize-none font-mono text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-500">
          {text.length} 字 {text.length < 100 && text.length > 0 && "（至少需要100字）"}
        </span>
        <button
          onClick={handleSubmit}
          disabled={text.trim().length < 100}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          开始检查
        </button>
      </div>
    </div>
  );
}
