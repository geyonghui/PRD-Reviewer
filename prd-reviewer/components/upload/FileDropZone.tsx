"use client";

import { useState, useCallback, useRef } from "react";

interface FileDropZoneProps {
  onSubmit: (content: string, fileName: string) => void;
}

export default function FileDropZone({ onSubmit }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".md") && !file.name.endsWith(".markdown") && !file.name.endsWith(".txt")) {
      alert("请上传 .md、.markdown 或 .txt 文件");
      return;
    }
    setIsLoading(true);
    try {
      const text = await file.text();
      if (text.length < 100) {
        alert("文档内容过少（至少100字），建议补充后再检查");
        return;
      }
      onSubmit(text, file.name);
    } catch {
      alert("读取文件失败，请重试");
    } finally {
      setIsLoading(false);
    }
  }, [onSubmit]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-slate-300 dark:border-slate-600 hover:border-primary/50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".md,.markdown,.txt"
        onChange={handleChange}
        className="hidden"
      />
      <div className="text-4xl mb-3">📄</div>
      {isLoading ? (
        <p className="text-slate-600 dark:text-slate-400">读取文件中...</p>
      ) : (
        <>
          <p className="text-slate-700 dark:text-slate-300 font-medium mb-1">
            拖拽 .md 文件到此处，或点击选择文件
          </p>
          <p className="text-sm text-slate-500">
            支持 .md、.markdown、.txt 格式
          </p>
        </>
      )}
    </div>
  );
}
